import json
from pathlib import Path

path = Path(r"C:\Users\samee\.openclaw\workspace\builds\mission-control\data\team.json")
data = json.loads(path.read_text(encoding="utf-8"))
agents = data["agents"]

# Fix VW parent manages to use real IDs
vw = next(a for a in agents if a["id"] == "vermilion-wealth")
vw["manages"] = ["vw-outreach", "vw-nurture", "vw-ollama", "vw-email", "vermilion-reddit-worker", "vermilion-fb-worker"]

# Fix reportsTo on existing reddit/fb workers
for a in agents:
    if a["id"] in ("vermilion-reddit-worker", "vermilion-fb-worker"):
        a["reportsTo"] = "vermilion-wealth"
        print(f"Fixed: {a['id']} -> reportsTo vermilion-wealth")

# Fix reportsTo on new VW workers
for a in agents:
    if a["id"] in ("vw-outreach", "vw-nurture", "vw-ollama", "vw-email"):
        a["reportsTo"] = "vermilion-wealth"

data["agents"] = agents
path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")

# Verify full tree
print(f"\nVW manages: {vw['manages']}")
for cid in vw["manages"]:
    found = any(a["id"] == cid for a in agents)
    print(f"  {cid}: {'OK' if found else 'MISSING'}")
