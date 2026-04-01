"""
Fix team.json:
1. Update Vermilion Wealth parent to manage all VW workers
2. Ensure all VW worker agents are present with correct structure
3. Add missing workers: vw-outreach, vw-nurture, vw-ollama, vw-email
"""
import json
from pathlib import Path

path = Path(r"C:\Users\samee\.openclaw\workspace\builds\mission-control\data\team.json")
data = json.loads(path.read_text(encoding="utf-8"))

agents = data["agents"]

# Print current VW-related agents
print("Current VW agents:")
for a in agents:
    if "vermilion" in a.get("id","").lower() or "vw" in a.get("id","").lower() or "reddit" in a.get("id","").lower() or "facebook" in a.get("id","").lower():
        print(f"  {a['id']} — manages: {a.get('manages', [])}")

# ── 1. Update Vermilion Wealth parent to manage all workers ──────────────────
vw_parent = next((a for a in agents if a.get("id") == "vermilion-wealth"), None)
if vw_parent:
    vw_parent["manages"] = [
        "vw-outreach",
        "vw-nurture",
        "vw-ollama",
        "reddit-worker",
        "facebook-worker",
    ]
    vw_parent["role"] = "Vermilion Wealth Marketing Division"
    vw_parent["description"] = "Full marketing automation division for Vermilion Wealth property advisory. Manages cold outreach to 464 medical professionals, waitlist nurture sequences, social listening (Reddit/Facebook), and local AI inference. Drives leads to invest.vermiliong.com.au."
    print(f"\nUpdated vermilion-wealth manages: {vw_parent['manages']}")
else:
    print("WARN: vermilion-wealth parent not found")

# ── 2. Get existing agent IDs ─────────────────────────────────────────────────
existing_ids = {a["id"] for a in agents}

# ── 3. New agents to add ──────────────────────────────────────────────────────
new_agents = [
    {
        "id": "vw-outreach",
        "name": "Outreach Worker",
        "emoji": "\U0001f4e7",
        "avatar": "https://api.dicebear.com/9.x/bottts/svg?seed=vw-outreach&backgroundColor=1a1a1a&primaryColor=C9A84C",
        "tier": 2,
        "role": "Cold Email Outreach Sender",
        "type": "cron-agent",
        "environment": "Windows Task Scheduler — fires 9:00 AM daily",
        "model": "No AI — pure template (zero cost per send)",
        "reportsTo": "vermilion-wealth",
        "manages": [],
        "bestAt": [
            "30 personalised cold emails/day to medical professionals",
            "16 specialty copy variants (radiologist, cardiologist, GP, dentist...)",
            "Dedup state tracking — never double-sends",
            "CC raj@vermiliong.com.au on every send"
        ],
        "description": "Sends 30 emails/day to 464 medical/healthcare professionals from Apollo list. Personalised by specialty, company, and income. Godfather offer: SOA rebate or $10k settlement rebate. Calendly CTA.",
        "status": "cron",
        "location": "builds/vermilion-wealth/core/outreach_worker.py"
    },
    {
        "id": "vw-nurture",
        "name": "Nurture Worker",
        "emoji": "\U0001f331",
        "avatar": "https://api.dicebear.com/9.x/bottts/svg?seed=vw-nurture&backgroundColor=1a1a1a&primaryColor=22c55e",
        "tier": 2,
        "role": "Waitlist Nurture Sequence Manager",
        "type": "background-service",
        "environment": "Polls Monday board every 15 min",
        "model": "No AI — template emails. Ollama queued for personalisation.",
        "reportsTo": "vermilion-wealth",
        "manages": [],
        "bestAt": [
            "Auto-enrolls new waitlist leads from Monday board",
            "3-email urgency sequence: Day 0, Day 3, Day 7",
            "52-week fortnightly nurture sequence (27 emails total)",
            "Melton corridor focus — Cobble Springs, Thornhill Gardens"
        ],
        "description": "Monitors Monday Waitlist board (ID 5027525374) every 15 min. Enrolls new leads, sends portal access + urgency email immediately. Sequences Day 3 follow-up and Day 7 breakup. $10k rebate and Calendly CTA throughout.",
        "status": "running",
        "location": "builds/vermilion-wealth/core/waitlist_nurture.py"
    },
    {
        "id": "vw-ollama",
        "name": "Ollama AI",
        "emoji": "\U0001f916",
        "avatar": "https://api.dicebear.com/9.x/bottts/svg?seed=vw-ollama&backgroundColor=1a1a1a&primaryColor=A855F7",
        "tier": 2,
        "role": "Local AI Inference Layer",
        "type": "background-service",
        "environment": "Windows — RTX 4070 SUPER, fully GPU",
        "model": "qwen3.5:9b (6.6GB)",
        "reportsTo": "vermilion-wealth",
        "manages": [],
        "bestAt": [
            "Zero-cost local inference for all VW agents",
            "Prospect scoring and classification",
            "Draft generation for Reddit/social replies",
            "Future email personalisation for nurture sequence"
        ],
        "description": "Ollama running qwen3.5:9b on RTX 4070 SUPER. Powers all scoring, classification, and draft generation across VW division at zero API cost. Shared via ollama_client.py 3-tier routing (local -> Haiku -> Sonnet).",
        "status": "always-on",
        "location": "localhost:11434"
    },
    {
        "id": "vw-email",
        "name": "Email Agent",
        "emoji": "\U0001f4ec",
        "avatar": "https://api.dicebear.com/9.x/bottts/svg?seed=vw-email&backgroundColor=1a1a1a&primaryColor=4A90D9",
        "tier": 2,
        "role": "Lead Welcome & Drip Email Sender",
        "type": "background-service",
        "environment": "Triggered by Monday CRM webhook (port 8745)",
        "model": "Haiku (opener personalisation) — ~$0.0001/email",
        "reportsTo": "vermilion-wealth",
        "manages": [],
        "bestAt": [
            "Welcome email on CRM lead entry (24h delay drip)",
            "Personalised opener via local model",
            "Dashboard access email with portal credentials",
            "Discord notification on every new lead"
        ],
        "description": "Sends welcome + dashboard access emails to leads entering Monday CRM. 24h drip delay for natural timing. Sends portal URL (invest.vermiliong.com.au/cp) and credentials. CC raj@vermiliong.com.au.",
        "status": "running",
        "location": "builds/vermilion-wealth/core/email_agent.py"
    },
]

added = []
for agent in new_agents:
    if agent["id"] not in existing_ids:
        agents.append(agent)
        added.append(agent["id"])
        print(f"Added: {agent['id']}")
    else:
        # Update existing
        for i, a in enumerate(agents):
            if a["id"] == agent["id"]:
                agents[i] = agent
                print(f"Updated: {agent['id']}")

# ── 4. Fix reddit-worker and facebook-worker reportsTo ───────────────────────
for a in agents:
    if a.get("id") in ("reddit-worker", "facebook-worker"):
        a["reportsTo"] = "vermilion-wealth"
        print(f"Fixed reportsTo: {a['id']} -> vermilion-wealth")

data["agents"] = agents
path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
print(f"\nteam.json updated. Total agents: {len(agents)}")

# Verify VW tree
vw = next((a for a in agents if a.get("id") == "vermilion-wealth"), None)
if vw:
    print(f"VW manages: {vw.get('manages')}")
    for child_id in vw.get("manages", []):
        child = next((a for a in agents if a.get("id") == child_id), None)
        print(f"  - {child_id}: {'FOUND' if child else 'MISSING'}")
