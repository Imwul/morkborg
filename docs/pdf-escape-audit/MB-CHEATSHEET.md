# MB_Cheatsheet.pdf — source identification audit

Baseline: `a50d2425deb9a4e9c7e7abb0983dd4c34c68c116`. Audit only; no app changes.

**OUT_OF_SCOPE: this is a Mythic Bastionland cheatsheet, not a MÖRK BORG cheatsheet.** Both physical pages were rendered and read. The repeated half-page layouts are two copies of each aid for printing; they are not four distinct pages or four unique aids.

| PDF page | Observed material | Audit treatment |
| --- | --- | --- |
| 1 | Mythic Bastionland logo; The Oath; Virtues; Trials; road phases, sleep and remedies | Inspected. Different game's rules; excluded from MÖRK BORG coverage denominator. |
| 2 | Mythic Bastionland logo; The Clatter of Blades; attacks, gambits, damage, scars, mortal wounds; arms and armor | Inspected. Footer names Mythic Bastionland, Chris McDowall and Hilander RPGs. Excluded from MÖRK BORG coverage denominator. |

The page-1 text layer is empty. Visual inspection was necessary to identify it correctly. Page 2's textual footer independently corroborates the game identity. Its Vigour/Clarity/Spirit, Guard, and gambit rules are incompatible with treating this as Core MÖRK BORG combat. Their absence from this application is **not** an implementation gap and they receive no play-need rows or priority score.

Source: `/Users/imwul/Downloads/MB_Cheatsheet.pdf`, 2 physical pages, SHA-256 `9e15d9672643ae27b889e77170d41f8975d6c486b8f4db3adceafe659033323e`.

Private rendered evidence: `outputs/pdf-escape-audit/core-review/mb-cheatsheet-1.png` and `mb-cheatsheet-2.png`. These outputs are excluded from tracked source material.

Minimal action: label the supplied file by its actual game in the source inventory. If the intended MÖRK BORG aid was a different file, obtain that file before assessing its coverage. Core Bare Bones PDF76 and Full Edition PDF94 already contain the actual MÖRK BORG quick-reference aid and are accounted for in their respective page ledgers.
