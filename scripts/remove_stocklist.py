"""Remove stock list section from marketing page and API route."""
import re
from pathlib import Path

# ── 1. marketing/page.tsx ─────────────────────────────────────────────────────
page = Path(r"C:\Users\samee\.openclaw\workspace\builds\mission-control\app\marketing\page.tsx")
c = page.read_text(encoding="utf-8")

# Remove StockItem interface
c = re.sub(r'\ninterface StockItem \{[^}]+\}\n', '\n', c)

# Remove stockList and stockMtime from MarketingData interface
c = re.sub(r'\n\s+stockList:\s*StockItem\[\][^\n]*\n', '\n', c)
c = re.sub(r'\n\s+stockMtime:\s*string[^\n]*\n', '\n', c)

# Remove stockList/stockMtime from default state
c = re.sub(r'\n\s+stockList:\s*\[\][^\n]*\n', '\n', c)
c = re.sub(r'\n\s+stockMtime:\s*null[^\n]*\n', '\n', c)

# Remove the entire Stock List JSX section — find it by header comment or section title
# Look for the C. Stock List section block
c = re.sub(
    r'\{/\*[^*]*C\.[^*]*Stock[^*]*\*/\}.*?\{/\* D\.',
    '{/* D.',
    c, flags=re.DOTALL
)

# Also try removing by section heading text if comment removal didn't work
c = re.sub(
    r'<[^>]*>[^<]*Stock List[^<]*</[^>]*>.*?(?=<[^>]*>[^<]*Email Performance)',
    '',
    c, flags=re.DOTALL
)

page.write_text(c, encoding="utf-8")
print("marketing/page.tsx: stock list section removed")

# ── 2. api/marketing/route.ts ─────────────────────────────────────────────────
route = Path(r"C:\Users\samee\.openclaw\workspace\builds\mission-control\app\api\marketing\route.ts")
c2 = route.read_text(encoding="utf-8")

# Remove stock_list.json read block
c2 = re.sub(r'\n\s*//[^\n]*stock[^\n]*\n.*?stockList[^\n]*\n', '\n', c2, flags=re.DOTALL | re.IGNORECASE)
c2 = re.sub(r'stockList:[^\n,}]+[,]?\n', '', c2)
c2 = re.sub(r'stockMtime:[^\n,}]+[,]?\n', '', c2)
c2 = re.sub(r"const STOCK_LIST_PATH[^\n]+\n", '', c2)

# Remove stock_list read block (try/catch or readFileSync)
c2 = re.sub(r'// Stock[^\n]*\n.*?stockList\s*=[^;]+;\n', '\n', c2, flags=re.DOTALL | re.IGNORECASE)

route.write_text(c2, encoding="utf-8")
print("api/marketing/route.ts: stock list data removed")

print("\nDone. Check localhost:3000/marketing to confirm.")
