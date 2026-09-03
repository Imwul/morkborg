"""Add local Korean translations without changing source English or table weights.

Usage: python3 scripts/enrich-private-data.py /path/to/translation-maps
Expected files: meaning.json, reclvse.json, other.json, effects.json.
All input and generated rulebook assets remain ignored, browser-local data.
"""
import json
import sys
from pathlib import Path

root = Path(__file__).resolve().parents[1]
maps_dir = Path(sys.argv[1])
maps = {name: json.loads((maps_dir / f"{name}.json").read_text())
        for name in ("meaning", "reclvse", "other", "effects")}
library_path = root / "public/rules/library.json"
oracles_path = root / "public/rules/oracles.json"
library = json.loads(library_path.read_text())
oracles = json.loads(oracles_path.read_text())
combined = {}
for translations in maps.values():
    for key, value in translations.items():
        # A name preserved in one table must not erase a translated common word.
        if key not in combined or value != key:
            combined[key] = value
for table in library["tables"].values():
    for entry in table["entries"]:
        if isinstance(entry.get("meta", {}).get("ko"), str):
            combined.setdefault(entry["text"], entry["meta"]["ko"])
missing = []
count = 0

def translation(text, book):
    name = "reclvse" if book == "reclvse" else "meaning" if book in ("mythic2", "sd", "depths") else "other"
    value = maps[name].get(text, combined.get(text))
    if value is None:
        missing.append((book, text))
    return value

def enrich(entries, book, metadata):
    global count
    for entry in entries:
        ko = translation(entry["text"], book)
        if ko is not None:
            entry.setdefault(metadata, {})["ko"] = ko
            count += 1
        if entry.get("followup"):
            enrich(entry["followup"], book, metadata)

# Source-specific meanings override the shared dictionary only in their own table.
override_path = maps_dir / "table-overrides.json"
overrides = json.loads(override_path.read_text()) if override_path.exists() else {}
for table in library["tables"].values():
    enrich(table["entries"], table["book"], "meta")
for table in oracles["tables"]:
    enrich(table["entries"], table["sourceBookId"], "metadata")
for table_id, values in overrides.items():
    table = library["tables"].get(table_id)
    if table:
        for entry in table["entries"]:
            if entry["text"] in values:
                entry.setdefault("meta", {})["ko"] = values[entry["text"]]
    for oracle in oracles["tables"]:
        if oracle["id"] == table_id:
            for entry in oracle["entries"]:
                if entry["text"] in values:
                    entry.setdefault("metadata", {})["ko"] = values[entry["text"]]
if missing:
    raise SystemExit(f"Missing {len(missing)} translations: {missing[:20]}")
library["notes"]["translations"] = combined
library["notes"]["translationEdition"] = "ko-2026-09-03-r4"
for path, data in ((library_path, library), (oracles_path, oracles)):
    path.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")))
bundle = {
    "kind": "morkborg-private-data", "schemaVersion": 1,
    "library": library, "oracles": oracles,
    "fateChart": json.loads((root / "public/rules/mythic-fate.json").read_text()),
}
output = root / "outputs/morkborg-private-data.json"
output.parent.mkdir(exist_ok=True)
output.write_text(json.dumps(bundle, ensure_ascii=False, separators=(",", ":")))
print(f"Translated {count} entries, {len(combined)} unique phrases. Bundle: {output}")
