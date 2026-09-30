# Play result hierarchy — 2026-09-30

The reader now separates the generated answer, actions, conditional follow-up, and
source material. This implements the approved solo-play layout for use alongside
books and paper notes.

- Oracle answers retain the yellow result field. Follow-up rolls and reference
  navigation sit on paper below it, including the wide facing-page layout.
- Roll/check actions use filled buttons; reference destinations use outlined
  buttons; optional controls use consistent disclosure triangles.
- Generated sheets use quieter field labels and prominent short answers.
  Existing rolled-number font families, weights and spacing are preserved.
- Camping inputs and results appear together before the outcome reference.
  The repeated related-tools block is removed; its destinations remain in the
  result's shared reference links.
- Travel uses four freely accessible phases with aligned tool buttons. It does
  not track progress or force a sequence.
- Mythic keeps the original and translation together before follow-up actions.
  Combat places HP application and Omen costs beside the final damage, before
  optional correction controls. Calculations and stale-result guards are unchanged.
- The sidebar exposes four stable themes, small entries and progressive expansion.
  Current-context companions are promoted within the themes; pins remain separate.

## Verification

- Existing full suite: 1,195 passing tests.
- Exhaustive presentation audit: 11,991 rows from 518 rollable tables rendered
  through the shared result component, with source identity and held result
  preserved. Five new presentation/navigation tests passed.
- TypeScript, lint, production build, static privacy and private-pack boundary
  checks passed.
- Browser review covered short and long oracle results, compound room and NPC
  results, character tables, camping, travel, Mythic with a random event, and a
  manual combat critical result. Oracle layout was also checked at 390px and
  2,880px widths. The live private URL served the updated build.
- On the live site, a conditional d8 roll left its parent d20 result unchanged.

The exhaustive check is a rendering and preservation audit, not a new review of
every source rule or an assertion that every row was manually inspected on screen.
The normal test selects first, last and longest rows from every table; rerun all
rows with:

```sh
MORK_ALL_RESULT_ROWS=1 npx tsx --test tests/play-result-presentation.test.ts
```

No source tables, translations, dice rules, storage schemas, global navigation,
or spatial artwork were changed.
