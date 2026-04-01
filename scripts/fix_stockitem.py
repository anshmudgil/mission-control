from pathlib import Path
import re

path = Path(r"C:\Users\samee\.openclaw\workspace\builds\mission-control\app\marketing\page.tsx")
c = path.read_text(encoding="utf-8")

# Find and show context around StockItem
for i, line in enumerate(c.splitlines(), 1):
    if "StockItem" in line:
        print(f"Line {i}: {line.rstrip()}")

# Remove any remaining StockItem references (map callbacks, type annotations)
c = re.sub(r'\(item:\s*StockItem\)', '(item: any)', c)
c = re.sub(r':\s*StockItem\b', ': any', c)
c = re.sub(r'StockItem\[\]', 'any[]', c)

path.write_text(c, encoding="utf-8")
print("Fixed")
