# Consistent result typography

The Street Contents result lost its display face because the entire block was classified as a “short answer” only below 160 characters and without a newline. Appended procedure instructions therefore changed the font of the actual result. Other long oracle/generator results had the same condition. Workbench readings also lacked the result treatment.

The shared reading renderer now marks the original result text separately from appended instructions and Korean translation helpers. Source-result boundaries come from the existing reading data, without changing content, translations, IDs, formulas, storage, or registry construction. Short and long results use the existing Grenze Gotisch face; instructions, original reference tables, rules, and creature statistics retain the reading face. Workbench results use the same face at a smaller size. The unused short-answer selectors were removed.

This replaces the length-based font choice described in the previous result-fragments pass. Independent fragments, yellow dice highlights, table row selection, and the shared reroll/copy controls are retained.

## Verification

- Browser: Street (including a long result plus separate instructions), manual Street Contents value 3 (“Unexpected event”), all seven NPC fields, Reaction and its selected table row, Morale, Weather, Corpse, Seth/Goblin, Travel, and 10A. Discovery. Workbench displays the same Street results with the same result/instruction distinction.
- Responsive Street checks: 360 / 768 / 1440 / 3440px; no horizontal overflow. Result font sizes are respectively 22.4 / 22.4 / 25.92 / 29.6px. All use Grenze Gotisch; appended instructions use Pretendard. Workbench at 3440px uses 25.6px result text.
- Local browser error log: empty.
- Automated tests: **761 passed, 0 failed, 0 skipped**, including **5 new regression tests** for appended notes, long/multiline results, mismatched bilingual paragraphs, repeated wording, and ordinary reference prose. Existing bilingual, source-integrity, roll, and import/migration coverage passes.
- Lint and production build: passed, including client/server typechecks and privacy checks for 61 static files.
- Registry/content files were not modified. The browser still lists 1,000 references and 95 creatures across 9 books; the source-integrity test verifies 546 tables.

Local evidence is in ignored `outputs/result-typography/`: before/after screenshots, responsive and reference measurements, test output, and build output. This was a targeted typography regression check; it was not a new exhaustive inspection of all 1,000 references or a 20-minute play simulation. Browser clipboard contents were not retested.
