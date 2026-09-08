"""Combine audit evidence, without importing or changing application behavior."""
from __future__ import annotations

import collections
import csv
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
FILES = ["core-rows.json", "supplement-rows.json", "solo-city-rows.json", "mythic-rows.json", "mythic-extra-rows.json"]
STATUSES = ["RESOLVED", "PRESENT_BUT_INDIRECT", "PARTIAL", "MISSING", "PDF_APPROPRIATE", "SOURCE_UNAVAILABLE"]
MAIN = ["core", "core-full", "feretory", "heretic", "sd", "depths", "reclvse", "mythic", "aitc"]
WORKFLOWS = ["Combat", "Character", "Dungeon", "Monster", "NPC", "Solo", "City", "Travel", "Equipment", "Powers"]
GAPS = {"PRESENT_BUT_INDIRECT", "PARTIAL", "MISSING"}


def read(name):
    return json.loads((DATA / name).read_text())


def counts(rows):
    c = collections.Counter(r["classification"] for r in rows)
    return {s: c[s] for s in STATUSES}


def unique(rows):
    result = {}
    for row in rows:
        key = row["needId"]
        if key in result:
            assert result[key]["classification"] == row["classification"], (key, "conflicting status")
        else:
            result[key] = row
    return list(result.values())


def cell(value):
    if value is None:
        return "—"
    if isinstance(value, list):
        value = "; ".join(map(str, value))
    return str(value).replace("|", "\\|").replace("\n", " ")


def markdown_table(headers, rows):
    return "\n".join(["| " + " | ".join(headers) + " |", "| " + " | ".join(["---"] * len(headers)) + " |"] + ["| " + " | ".join(cell(x) for x in row) + " |" for row in rows])


def main():
    source = {r["id"]: r for r in read("source-inventory.json")}
    tables = {r["id"] for r in read("app-inventory.json")["tables"]}
    all_rows = [r for name in FILES for r in read(name)]
    ids = set()
    for r in all_rows:
        assert r["id"] not in ids, ("duplicate row", r["id"])
        ids.add(r["id"])
        assert r["classification"] in STATUSES
        assert r["bookId"] in source
        assert r["pdfPage"] and all(1 <= p <= source[r["bookId"]]["pages"] for p in r["pdfPage"]), r["id"]
        assert r["printedPage"] is not None
        assert all(w in WORKFLOWS for w in r["workflows"]), r["id"]
        assert all(t in tables for t in r["evidence"]["tableIds"]), (r["id"], "unresolved table")
        assert all(r[k] in {"yes", "indirect", "partial", "no", "n/a"} for k in ["searchable", "contextLinked", "tableView"])
        if r["classification"] in GAPS | {"SOURCE_UNAVAILABLE"}:
            assert r["severity"] in {"P0", "P1", "P2", "P3"}, r["id"]
            assert all(isinstance(r[k], int) and 1 <= r[k] <= 5 for k in ["frequency", "friction"]), r["id"]
        else:
            assert r["severity"] is None, r["id"]
        if r["frequency"] is None:
            assert r["friction"] is None and r["priority"] is None
        else:
            assert r["priority"] == r["frequency"] * r["friction"], r["id"]
        assert r["problem"] and r["minimalFix"] and r["evidence"], r["id"]

    rows = [r for r in all_rows if r["bookId"] in MAIN]
    uniques = unique(rows)
    play = [r for r in uniques if r["classification"] != "PDF_APPROPRIATE"]
    by_book = []
    for book in MAIN:
        own = [r for r in rows if r["bookId"] == book]
        by_book.append({"bookId": book, "book": own[0]["book"], "pdfPages": source[book]["pages"], "sourceRows": len(own), "playRelevant": sum(r["classification"] != "PDF_APPROPRIATE" for r in own), **counts(own)})
    by_workflow = []
    for workflow in WORKFLOWS:
        own = unique([r for r in rows if workflow in r["workflows"]])
        by_workflow.append({"workflow": workflow, "audited": len(own), "playRelevant": sum(r["classification"] != "PDF_APPROPRIATE" for r in own), **counts(own)})
    metrics = {
        "head": read("app-inventory.json")["head"],
        "inputSha256": {name: hashlib.sha256((DATA / name).read_bytes()).hexdigest() for name in FILES},
        "allSourceRowsIncludingAuxiliary": len(all_rows), "mainBookSourceRows": len(rows),
        "mainBookUniqueNeedsIncludingPdfAppropriate": len(uniques), "mainBookUniquePlayRelevant": len(play),
        "duplicateSourceRowsRemoved": len(rows) - len(uniques), "classifications": counts(uniques),
        "classificationPercentOfAllUnique": {s: round(n / len(uniques) * 100, 2) for s, n in counts(uniques).items()},
        "implementationGapSeverity": dict(sorted(collections.Counter(r["severity"] for r in uniques if r["classification"] in GAPS).items())),
        "byBook": by_book, "byWorkflow": by_workflow,
        "solutionCategories": dict(sorted(collections.Counter(s for r in uniques if r["classification"] in GAPS for s in set(r["solutionType"])).items())),
        "sourceUnavailable": [r["id"] for r in uniques if r["classification"] == "SOURCE_UNAVAILABLE"],
        "p0": [r["id"] for r in uniques if r["classification"] in GAPS and r["severity"] == "P0"],
        "p1": [r["id"] for r in uniques if r["classification"] in GAPS and r["severity"] == "P1"],
    }
    (DATA / "master-rows.json").write_text(json.dumps(all_rows, ensure_ascii=False, indent=2) + "\n")
    (DATA / "coverage.json").write_text(json.dumps(metrics, ensure_ascii=False, indent=2) + "\n")
    cols = [("ID", "id"), ("Book", "book"), ("PDF page", "pdfPage"), ("Printed page", "printedPage"), ("Section", "section"), ("Content", "content"), ("Type", "type"), ("Classification", "classification"), ("Severity", "severity"), ("Frequency", "frequency"), ("Friction", "friction"), ("Priority", "priority"), ("Current App Path", "appPath"), ("Searchable? / tested query", "searchable"), ("Context-linked?", "contextLinked"), ("Table view?", "tableView"), ("Problem", "problem"), ("Recommended minimal fix", "minimalFix")]
    body = ["# Master PDF escape matrix", "", "Audit-only baseline: `" + metrics["head"] + "`. All source-specific rows are retained here; cross-edition/shared needs use `needId` in [master-rows.json](data/master-rows.json) and are counted once globally. Code/table evidence and solution categories are in that JSON. Search means the observed/tested route, not proof that the result contains complete mechanics.", "", "Frequency × friction is an estimated prioritization aid, not telemetry. Rank unresolved implementation gaps only. Numeric scores on RESOLVED rows describe use frequency/access cost and are not a backlog priority. Long-form/art exclusions and unavailable external sources are explicitly separate. PDF indexes are physical pages; printed folios are independently recorded.", "", f"{len(all_rows):,} source rows including four auxiliary exclusions; {len(rows):,} rows in the nine main books; {len(uniques):,} unique needs including PDF-appropriate reading; {len(play):,} unique play-relevant needs. See [COVERAGE.md](COVERAGE.md) for denominators and overlap."]
    for book in MAIN + [b for b in source if b not in MAIN]:
        own = [r for r in all_rows if r["bookId"] == book]
        if not own:
            continue
        values = []
        for r in own:
            row = [r[k] for _, k in cols]
            row[13] = r["searchable"] + (": " + "; ".join(r["searchQueries"]) if r["searchQueries"] else "")
            values.append(row)
        body.extend(["", "## " + own[0]["book"], "", markdown_table([h for h, _ in cols], values)])
    (ROOT / "MASTER-MATRIX.md").write_text("\n".join(body) + "\n")
    with (DATA / "master-matrix.csv").open("w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow([h for h, _ in cols] + ["Need ID", "Solution categories", "Workflows"])
        for r in all_rows:
            vals = [cell(r[k]) for _, k in cols]
            vals[13] = cell(r["searchable"] + ": " + "; ".join(r["searchQueries"]))
            writer.writerow(vals + [r["needId"], "; ".join(r["solutionType"]), "; ".join(r["workflows"])])
    coverage = ["# Coverage and severity", "", "These are unique **lookup needs**, not pages imported, number of UI routes or percentage of a book reproduced. Named mechanical items/Powers/classes are separate when their usability differs; a standalone table is one need when entries can be used as-is. A procedure may be another need when knowing how/when to use the table is a different question. This granularity makes a single blended coverage percentage unsuitable as a product score.", "", f"Nine books: **{len(rows):,} source-specific rows → {len(uniques):,} unique needs** after removing {len(rows)-len(uniques):,} duplicate source occurrences. **{len(play):,} are play-relevant**; the remainder are intentional PDF reading. Four related auxiliary documents contribute four PDF-appropriate exclusions outside the main-book metrics. Mythic Bastionland's two-page cheatsheet is out of scope, not a missing MÖRK BORG feature.", "", "## Unique classifications", "", markdown_table(["Classification", "Unique needs", "% of all unique needs", "% of play-relevant needs"], [[s, counts(uniques)[s], f"{counts(uniques)[s]/len(uniques)*100:.2f}%", "excluded" if s == "PDF_APPROPRIATE" else f"{counts(uniques)[s]/len(play)*100:.2f}%"] for s in STATUSES]), "", "## By book", "", "Each book retains its own source occurrence. Do **not** add these columns to get global unique coverage: Core editions and three supplement creatures share needs.", "", markdown_table(["Book", "PDF pages", "Play-relevant", "Resolved", "Indirect", "Partial", "Missing", "PDF appropriate", "Source unavailable"], [[b["book"], b["pdfPages"], b["playRelevant"], *[b[s] for s in STATUSES]] for b in by_book]), "", "## By workflow", "", "Each workflow deduplicates its own needs. A Power may also be Character/Combat material, so workflows overlap and must not be summed.", "", markdown_table(["Workflow", "Play-relevant", "Resolved", "Indirect", "Partial", "Missing", "PDF appropriate", "Source unavailable"], [[w["workflow"], w["playRelevant"], *[w[s] for s in STATUSES]] for w in by_workflow]), "", "## Severity", "", "No P0 was identified: the ordinary Core combat loop can proceed through existing rules. That does not make the product complete. Missing Power effects, Omens uses and weapon mechanics remain regular P1 interruptions. Optional-system P1 is conditional on actually using that system, especially RECLVSE; it is not a claim that every MÖRK BORG session uses it.", "", markdown_table(["Severity", "Unique implementation gaps"], [[s, metrics["implementationGapSeverity"].get(s, 0)] for s in ["P0", "P1", "P2", "P3"]]), "", "### Complete P1 list", "", "Source-unavailable cases are excluded from this implementation backlog. Repeated Core edition rows are listed once; alternative source locations remain in the master matrix.", "", markdown_table(["Need ID", "Content", "Source PDF", "Classification", "Frequency × friction"], [[r["needId"], r["content"], f"{r['book']} {','.join(map(str,r['pdfPage']))}", r["classification"], f"{r['frequency']} × {r['friction']} = {r['priority']}"] for r in uniques if r["classification"] in GAPS and r["severity"] == "P1"]), "", "## Smallest-fix categories", "", "Categories overlap; a link and an alias can solve the same need. These counts are not additional missing references.", "", markdown_table(["Category", "Unique gaps using this intervention"], metrics["solutionCategories"].items()), "", "Machine-readable counts, input hashes and exact P1/unavailable IDs: [coverage.json](data/coverage.json)."]
    (ROOT / "COVERAGE.md").write_text("\n".join(coverage) + "\n")
    print(json.dumps({k: metrics[k] for k in ["mainBookSourceRows", "mainBookUniqueNeedsIncludingPdfAppropriate", "mainBookUniquePlayRelevant", "classifications", "implementationGapSeverity"]}, indent=2))


if __name__ == "__main__":
    main()
