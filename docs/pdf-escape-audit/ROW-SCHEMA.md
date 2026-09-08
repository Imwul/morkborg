# Audit row schema

Audit artifacts only; baseline HEAD a50d2425deb9a4e9c7e7abb0983dd4c34c68c116. Do not change application behavior. One row represents one distinct play-time lookup need in a source, not every UI route to the same need. Separate named mechanical items, Powers, classes and creatures where their completeness differs. A complete table may be one row if its entries are playable as-is. Cross-book duplicates share `needId` so global metrics can deduplicate them; book metrics retain the source-specific row.

Each JSON row:

```
{
  "id": "book-unique-slug",
  "needId": "shared-need-slug",
  "bookId": "core",
  "book": "MÖRK BORG Bare Bones",
  "pdfPage": [32],
  "printedPage": "32",
  "section": "Combat",
  "content": "Reaction",
  "type": "Rule|Table|Procedure|Creature|Item|Power|Class|Aid|Long-form|Source reference",
  "classification": "RESOLVED|PRESENT_BUT_INDIRECT|PARTIAL|MISSING|PDF_APPROPRIATE|SOURCE_UNAVAILABLE",
  "severity": null,
  "frequency": 4,
  "friction": 1,
  "priority": 4,
  "appPath": "exact user-visible route / reference ID when known",
  "searchQueries": ["reaction"],
  "searchable": "yes|indirect|no|n/a",
  "contextLinked": "yes|partial|no|n/a",
  "tableView": "yes|indirect|no|n/a",
  "problem": "Concrete finding; no assumed UI capabilities.",
  "minimalFix": "Specific smallest change, or none.",
  "solutionType": ["SEARCH_ALIAS|SEARCH_RANKING|QUICK_RULE|TABLE_INDEX|TABLE_VIEW|RESULT_LINK|CONTEXT_LINK|ITEM_REFERENCE|POWER_REFERENCE|CLASS_REFERENCE|MONSTER_REFERENCE|PROCEDURE|SOURCE_MISSING|PDF_APPROPRIATE"],
  "workflows": ["Combat|Character|Dungeon|Monster|NPC|Solo|City|Travel|Equipment|Powers"],
  "evidence": {"code": ["src/…:line"], "tableIds": [], "notes": "Exact source checked + actual available effect/procedure; browser confirmation if performed"}
}
```

Every row has exactly one primary classification. Severity P0–P3 for implementation gaps; SOURCE_UNAVAILABLE may have a play-impact severity but is never called an implementation failure. RESOLVED and PDF_APPROPRIATE use severity null. Frequency/friction 1–5 are required for non-resolved play needs; RESOLVED and PDF_APPROPRIATE may use null for all three scoring fields because there is no unresolved implementation priority. When numeric, compute priority as frequency × friction; rank implementation gaps only. Do not treat traceability, a name, generation, or table existence as proof of usable reference coverage.

Keep a per-book page ledger accounting for EVERY physical PDF page, including covers, lore, blanks, scenario prose, repeated references and worksheets. Report uncertain printed numbering explicitly; do not assume it equals PDF index. Group repeated appendix material via the same needId, without inflating unique totals. Prefer concise finding descriptions over copying private source contents into tracked reports.
