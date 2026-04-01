"""
gmail_poller.py — Fetch recent emails, classify with local Ollama, write to data/emails.json
Run every 5 minutes via Task Scheduler or a simple loop.

Rules:
- Local Ollama ONLY for classification. If Ollama is down → save email with raw sender/subject, no category.
- Never call Claude. No fallback to Haiku/Sonnet. Ever.
- If classification fails → graceful: email still saved, category = "uncategorised"
- Polls last 20 unread emails from inbox
"""

import html
import json
import os
import re
import sys
import time
import base64
import logging
from datetime import datetime, timezone
from pathlib import Path

# ── Paths ──────────────────────────────────────────────────────────────────
ROOT       = Path(__file__).parent.parent
DATA_DIR   = ROOT / "data"
TOKEN_PATH = Path(r"C:\Users\samee\.openclaw\workspace\.google_token.json")
OUT_FILE   = DATA_DIR / "emails.json"
LOG_FILE   = ROOT / "logs" / "gmail_poller.log"

ROOT.joinpath("logs").mkdir(exist_ok=True)
DATA_DIR.mkdir(exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ],
)
log = logging.getLogger(__name__)

# ── Gmail auth ─────────────────────────────────────────────────────────────
def get_gmail_service():
    from google.oauth2.credentials import Credentials
    from googleapiclient.discovery import build
    from google.auth.transport.requests import Request

    creds = Credentials.from_authorized_user_file(str(TOKEN_PATH))
    if creds.expired and creds.refresh_token:
        creds.refresh(Request())
        TOKEN_PATH.write_text(creds.to_json())
    return build("gmail", "v1", credentials=creds)

# ── Extract plain text from Gmail message ─────────────────────────────────
def extract_body(payload: dict) -> str:
    """Pull plain text from a Gmail message payload."""
    def decode(data: str) -> str:
        try:
            return base64.urlsafe_b64decode(data + "==").decode("utf-8", errors="replace")
        except Exception:
            return ""

    mime = payload.get("mimeType", "")
    body_data = payload.get("body", {}).get("data", "")

    if mime == "text/plain" and body_data:
        return decode(body_data)[:500]

    for part in payload.get("parts", []):
        result = extract_body(part)
        if result:
            return result

    return ""

# ── Local Ollama classify ─────────────────────────────────────────────────
CATEGORIES = ["BD", "Legal", "VPA", "Admin", "Uni", "FYI"]

# Senders/subjects to skip entirely — noise, marketing, notifications
SKIP_PATTERNS = [
    # Social / notifications
    "linkedin", "noreply@linkedin", "via linkedin",
    "notion team", "wistia", "calendly",
    "apollo:", "jordan at apollo", "want to see how",
    "rangeme", "sabri suby",
    # Generic marketing signals
    "get value fast", "get more exposure", "set up your new",
    "tons of ways to share",
    "you've got the product",
    # System noise
    "dmarc-support", "noreply-dmarc",
    "search console team",  # unless action required
    "security alert",  # google generic
]

def should_skip(sender: str, subject: str) -> bool:
    combined = (sender + " " + subject).lower()
    return any(p in combined for p in SKIP_PATTERNS)

# Known senders → fast-path category (skip Ollama entirely)
SENDER_MAP = {
    "akash":        "BD",
    "xwise":        "BD",
    "capitalxwise": "BD",
    "devin":        "BD",
    "vermilion":    "BD",
    "uts.edu.au":   "Uni",
    "canvas":       "Uni",
    "moto":         "VPA",
    "property":     "VPA",
    "anthropic":    "Admin",
    "github":       "Admin",
    "google":       "Admin",
    "monday":       "Admin",
}

# Project link map: keywords in sender/subject → project id
PROJECT_MAP = {
    "akash":        "proj-001",
    "xwise":        "proj-001",
    "capitalxwise": "proj-001",
    "sxw":          "proj-001",
    "salesxwise":   "proj-001",
    "shiiv":        "proj-004",
    "moto":         "proj-002",
    "vpa":          "proj-002",
    "devin":        "proj-003",
    "vermilion intelligence": "proj-003",
}

def fast_path_category(sender: str, subject: str) -> str | None:
    combined = (sender + " " + subject).lower()
    for keyword, cat in SENDER_MAP.items():
        if keyword in combined:
            return cat
    return None

def detect_project(sender: str, subject: str) -> str | None:
    combined = (sender + " " + subject).lower()
    for keyword, pid in PROJECT_MAP.items():
        if keyword in combined:
            return pid
    return None

def ollama_classify(sender: str, subject: str, snippet: str) -> str:
    """Classify via local Ollama. Returns 'uncategorised' on any failure — no Claude fallback."""
    try:
        import requests
        prompt = (
            f"Classify this email into ONE of: {', '.join(CATEGORIES)}\n"
            f"From: {sender}\nSubject: {subject}\nSnippet: {snippet[:200]}\n"
            f"Reply with ONLY the category name."
        )
        r = requests.post(
            "http://localhost:11434/api/chat",
            json={
                "model": "qwen3.5:9b",
                "messages": [{"role": "user", "content": prompt}],
                "think": False,
                "stream": False,
                "options": {"num_predict": 10, "temperature": 0.0},
            },
            timeout=8,
        )
        r.raise_for_status()
        result = r.json().get("message", {}).get("content", "").strip()
        for cat in CATEGORIES:
            if cat.lower() in result.lower():
                return cat
        return "uncategorised"
    except Exception as e:
        log.debug(f"Ollama classify failed (graceful): {e}")
        return "uncategorised"

def ollama_summarise(sender: str, subject: str, body: str) -> str:
    """One-sentence summary via local Ollama. Returns '' on failure — UI falls back to snippet."""
    if not body.strip():
        return ""
    try:
        import requests
        prompt = (
            f"Summarise this email in ONE short sentence (max 20 words). "
            f"Be specific — mention names, amounts, or actions if present. "
            f"No filler like 'The email says' or 'This email is about'.\n\n"
            f"From: {sender}\nSubject: {subject}\nBody: {body[:400]}"
        )
        r = requests.post(
            "http://localhost:11434/api/chat",
            json={
                "model": "qwen3.5:9b",
                "messages": [{"role": "user", "content": prompt}],
                "think": False,
                "stream": False,
                "options": {"num_predict": 60, "temperature": 0.2},
            },
            timeout=12,
        )
        r.raise_for_status()
        result = r.json().get("message", {}).get("content", "").strip()
        # Strip quotes if model wraps output
        return result.strip('"').strip("'")
    except Exception as e:
        log.debug(f"Ollama summarise failed (graceful): {e}")
        return ""

# ── Priority from category + subject ─────────────────────────────────────
PRIORITY_MAP = {
    "BD":    "high",
    "Legal": "high",
    "Uni":   "high",
    "VPA":   "medium",
    "Admin": "low",
    "FYI":   "low",
    "uncategorised": "low",
}

URGENT_KEYWORDS = ["urgent", "asap", "deadline", "overdue", "action required", "final notice", "today", "tomorrow"]

def derive_priority(category: str, subject: str) -> str:
    base = PRIORITY_MAP.get(category, "low")
    if any(kw in subject.lower() for kw in URGENT_KEYWORDS):
        return "high"
    return base

# ── Main fetch + classify ─────────────────────────────────────────────────
def fetch_emails(max_results: int = 30) -> list[dict]:
    try:
        svc = get_gmail_service()
    except Exception as e:
        log.error(f"Gmail auth failed: {e}")
        return []

    try:
        result = svc.users().messages().list(
            userId="me",
            q="in:inbox",
            maxResults=max_results,
        ).execute()
    except Exception as e:
        log.error(f"Gmail list failed: {e}")
        return []

    messages = result.get("messages", [])
    emails = []

    for msg in messages:
        try:
            full = svc.users().messages().get(
                userId="me", id=msg["id"], format="full"
            ).execute()

            headers = {h["name"]: h["value"] for h in full.get("payload", {}).get("headers", [])}
            sender  = headers.get("From", "Unknown")
            subject = html.unescape(headers.get("Subject", "(no subject)"))
            date_str = headers.get("Date", "")
            snippet = html.unescape(full.get("snippet", ""))
            labels  = full.get("labelIds", [])
            is_unread = "UNREAD" in labels

            # Parse sender name
            sender_name = re.sub(r"<.*?>", "", sender).strip().strip('"')

            # Skip noise before doing any further work
            if should_skip(sender_name, subject):
                log.debug(f"[Skip] {sender_name}: {subject[:50]}")
                continue

            # Classify
            category = fast_path_category(sender, subject)
            used_ollama = False
            if not category:
                category = ollama_classify(sender_name, subject, snippet)
                used_ollama = True

            # Project link
            project_id = detect_project(sender, subject)

            # Summarise body (local Ollama, graceful failure → empty)
            body_text = extract_body(full.get("payload", {}))
            summary = ollama_summarise(sender_name, subject, body_text or snippet)

            priority = derive_priority(category, subject)

            # Parse timestamp
            try:
                ts_ms = int(full.get("internalDate", 0))
                ts = datetime.fromtimestamp(ts_ms / 1000, tz=timezone.utc).isoformat()
            except Exception:
                ts = datetime.now(timezone.utc).isoformat()

            emails.append({
                "id":          msg["id"],
                "sender":      sender_name,
                "senderEmail": re.search(r"<(.+?)>", sender).group(1) if "<" in sender else sender,
                "subject":     subject,
                "snippet":     snippet[:200],
                "summary":     summary,
                "category":    category,
                "priority":    priority,
                "unread":      is_unread,
                "ts":          ts,
                "projectId":   project_id,
                "usedOllama":  used_ollama,
            })

            log.info(f"{'UNREAD' if is_unread else 'read  '} [{category}/{priority}] {sender_name}: {subject[:50]}")

        except Exception as e:
            log.warning(f"Failed to parse message {msg['id']}: {e}")
            continue

    # Keep only actionable emails — drop pure noise categories
    KEEP_CATS = {"BD", "Legal", "Uni", "VPA"}
    emails = [
        e for e in emails
        if e["category"] in KEEP_CATS
        or (e["unread"] and e["priority"] in ("high", "medium"))
    ]

    # Sort: unread + high priority first, then time desc
    emails.sort(key=lambda x: (
        0 if (x["unread"] and x["priority"] == "high") else
        1 if (x["unread"] and x["priority"] == "medium") else
        2 if x["unread"] else 3,
        x["ts"]
    ))

    return emails

def run():
    log.info("Gmail poller starting...")
    emails = fetch_emails(max_results=30)
    OUT_FILE.write_text(json.dumps(emails, indent=2))
    log.info(f"Wrote {len(emails)} emails to {OUT_FILE}")

if __name__ == "__main__":
    run()
