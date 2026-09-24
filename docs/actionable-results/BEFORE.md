# Actionable results: before audit

Baseline: `c089b2c7b1f7db5bec0677288a76b055b06d02a5`.
Baseline full suite: 1,077 passed, no failures/skips.

## Existing structure

- Registry: 993 references, 546 canonical tables, 12,310 root rows, 60 procedures.
- `readRowRelationships` reads explicit IDs in row metadata, including nested subtables, procedure IDs, fixed selectors and EPK creature identities. 278 raw edges in 201 rows resolve/deduplicate to 247 visible row edges. Unknown/self/scenario references are excluded.
- `buildReferenceRelationships` reads verified SOURCE_PROCEDURE dependencies: 149 declarations resolve to 88 USES and 88 reverse USED BY edges. These describe composition, not required actions.
- `relatedIds` and `SEMANTIC_RELATED` also contain app navigation shortcuts. They are not source-certified requirements.
- `OracleProcedure` generation and canonical roll execution are separate from navigation. An inspection must not call the roll engine.
- `ReferenceTable` already renders row metadata via `ReferenceNextSteps`; the main reader renders the same links below all result blocks. Internal labels do not distinguish optional examples from necessary rolls. Generic reading-related links can be suppressed if they appear in the much lower Related section.
- Workbench's `ReferenceReadingBlock` renders results and fixed selectors, but does not render normal row follow-ups. This is a real surface mismatch.
- `ReferenceSession` retains up to 20 readings in this document; the existing navigation channel preserves selection/table mode/scroll; Recent stores reference identities; Workbench uses the same retained readings. No new history/store is needed.

## Observed gaps and counterexamples

- FERETORY road events 5–6 explicitly require Weather and 20 explicitly requires Corpse Plundering (PDF 7 / printed 5), but neither row has metadata links.
- FERETORY Foraging 5–6 explicitly requests the Village table (PDF 8 / printed 6), also unlinked.
- Depths Danger 6 says Reaction −2; its metadata only links NPC generation. The modifier must remain visible without silently setting another roller's state.
- Reaction 2–3 / 4–6 have no result-specific combat access. Anger is not an automatic combat instruction; combat access must remain conditional.
- Core Broken 2 explicitly requests the injury d6. A direct lookup should be available only for that outcome.
- SD room contents already has common/rare/NPC/object follow-ups. Its bizarre-creature choice includes an external-table description which the exact-ID resolver intentionally does not guess. The verified FERETORY alternative can be bound explicitly.
- SD Searching Strong 2 calls Useful Items an example; promoting every FOLLOW-UP to REQUIRED would be incorrect.
- AITC fixed selectors already open the requested row without randomization. Preserve distinct selectors and paired aliases.
- Ordinary Corpse Plundering outcomes need no invented treasure roll. Weather and empty-room results need no automatically generated suggestion panel.

## Intended implementation boundary

Use a read-time presentation over existing relationships. Keep canonical source text, probabilities, registry counts, roll execution, persistence and relationship taxonomy intact. Classify only audited required branches; unspecified source conditions remain optional/reading references. Keep USES/USED BY in Related. Add only bounded, verified, exact-row links supported by the original PDF. No campaign state, progress controls or automatic rolls.
