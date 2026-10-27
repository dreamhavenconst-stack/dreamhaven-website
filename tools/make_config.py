"""Expands tools/config.src.yml into admin/config.yml (no YAML anchors, no helper keys),
then checks every content file against it. Run: python3 tools/make_config.py"""
import json, os, sys, yaml

TOOLS = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(TOOLS)
HERE = os.path.join(ROOT, "admin")

class NoAlias(yaml.SafeDumper):
    def ignore_aliases(self, data): return True

src = yaml.safe_load(open(os.path.join(TOOLS, "config.src.yml")))
cfg = {k: v for k, v in src.items() if not k.startswith("x-")}
header = "# Dream Haven Construction admin panel (Decap CMS). Generated from config.src.yml.\n# Every Publish commits a content file; Netlify then rebuilds all pages (about a minute).\n"
with open(os.path.join(HERE, "config.yml"), "w") as f:
    f.write(header + yaml.dump(cfg, Dumper=NoAlias, sort_keys=False, allow_unicode=True, width=200))

# ---- check content files match the admin fields ----
problems = []
def check(fields, data, where):
    if not isinstance(data, dict):
        problems.append(f"{where}: expected an object"); return
    names = {f["name"] for f in fields}
    for k in data:
        if k not in names: problems.append(f"{where}.{k}: in content but not editable in admin")
    for f in fields:
        n, w = f["name"], f["widget"]
        if n not in data:
            if f.get("required", True) is not False: problems.append(f"{where}.{n}: missing from content")
            continue
        v = data[n]
        if w == "object": check(f["fields"], v, f"{where}.{n}")
        elif w == "list":
            if not isinstance(v, list): problems.append(f"{where}.{n}: expected a list"); continue
            for i, item in enumerate(v):
                if "fields" in f: check(f["fields"], item, f"{where}.{n}[{i}]")
                elif not isinstance(item, (str, int, float)): problems.append(f"{where}.{n}[{i}]: expected text")
        elif w == "boolean" and not isinstance(v, bool): problems.append(f"{where}.{n}: expected true/false")
        elif w == "number" and not isinstance(v, (int, float)): problems.append(f"{where}.{n}: expected a number")
        elif w in ("string", "text", "select") and not isinstance(v, str): problems.append(f"{where}.{n}: expected text")
        elif w == "image":
            if not isinstance(v, str) or not os.path.exists(os.path.join(ROOT, v.lstrip("/"))):
                problems.append(f"{where}.{n}: image not found ({v})")

for coll in cfg["collections"]:
    for fl in coll["files"]:
        data = json.load(open(os.path.join(ROOT, fl["file"])))
        check(fl["fields"], data, fl["name"])

print("config.yml written;", "content matches admin fields" if not problems else f"{len(problems)} problem(s):")
for p in problems: print("  -", p)
sys.exit(1 if problems else 0)
