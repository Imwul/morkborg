# Compact source labels

Source metadata uses these display abbreviations. Canonical titles, saved source strings, page/section references and source-inclusive clipboard/export data retain their full form.

| ID | Label | Book |
|---|---|---|
| core | MB-BB | MÖRK BORG BARE BONES EDITION |
| core-full | MB-F | MÖRK BORG — Full Edition |
| feretory | FER | MÖRK BORG CULT: FERETORY |
| heretic | HER | MÖRK BORG CULT: HERETIC |
| reclvse | RCL | RECLVSE — A Solo Engine for Mörk Borg |
| sd | SD | Sölitary Defilement |
| depths | DEP | Sölitary Depths |
| mythic2 | MGE2 | Mythic Game Master Emulator Second Edition |
| aitc | AitC | Alöne in the Crowd |

Full titles remain in book details and the installed-book catalog. Abbreviated labels expose their full title on hover; the shared source disclosure also has a collapsed **원제·전체 출처 표기** control for touch access. **자료 및 규칙 → 출처 약칭 · 원제** lists the complete key.

The formatter is shared by reference rows/related links, Oracle/source filters, source chains, generated citations and legacy source strings. Search recognizes the labels as well as full titles. Unknown books retain their supplied titles; no edition is guessed from a generic MÖRK BORG mention.

Validation: 393 existing tests, lint and production build passed. Manual formatter checks preserved PDF/printed pages and dice in a decomposed-Unicode citation, left an unknown book unchanged, and confirmed source-inclusive copy retains the full book title. Browser checks confirmed MGE2 search, compact source labels, full-title expansion and no horizontal overflow at 360px.

[Mobile source disclosure](source-mobile.jpg)
