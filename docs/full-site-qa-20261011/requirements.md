# Full-site QA requirements — 2026-10-11

This is an audit of the existing app, not a feature plan or a redesign. The user's current request is the authoritative scope. Existing design, data formats, private material and correctly working behavior must be preserved.

## Acceptance criteria

- QA-01: Compare every implemented rule family, roll expression, outcome range, condition and follow-up against provided original rulebooks and snapshots. Record book and PDF page evidence; do not infer missing or contradictory rules.
- QA-02: Visit and operate every major active page, tab, menu, modal, control family, search, filter, table, roll and record/backup/restore workflow in an actual browser connected to a running development server.
- QA-03: Cover normal completion, repeated use, cancel/back/reload, empty or invalid input, boundary values, linked references and runtime/console errors. Automated domain tests supplement rather than replace the browser walkthrough.
- QA-04: Inspect the existing layout on mobile, tablet and desktop. Fix clipping, overlap, unusable controls, incorrect states/labels and explicit inconsistencies while preserving visual identity.
- QA-05: Prioritize incorrect rule calculations, data loss/runtime faults, broken state/navigation, layout defects, then misleading interface behavior. Change only evidenced defects and avoid new generators, rules or unnecessary abstractions.
- QA-06: Reproduce each fix through the same browser flow and run meaningful related regression tests, followed by the required existing build, lint and privacy checks. Do not change expected rule outcomes just to pass tests.
- QA-07: Report actual visited functions, source evidence, defects, changes, before/after validation, test results, unavailable evidence and remaining gaps. Never claim unvisited or unmeasured features passed.

## Existing surfaces to cover

Home quick references; reference search and book/context/type filters; rule/table/procedure/creature/region/book readers; source disclosure and linked follow-ups; roll/manual-dice/partial-hold/copy/pin/open-pages/scratch actions; character, monster, dungeon, NPC, room, street, settlement and supplementary generators; dungeon/city/journey spatial views and their linked readers; general dice, play guidance, combat, Mythic Fate/events/lists; saved objects; sources/rule data service, backup/restore; About and keyboard/back/reload behavior.

Existing implementation and architecture decisions are documented in `README.md`, `docs/freeform-reference-audit.md`, `docs/rule-sources.md`, `docs/personal-hosted-site.md` and related feature docs. These are context rather than independent rulebook proof. Unreachable legacy screens are reported separately from active surfaces.

## Environment and evidence

Baseline source: main `81bbb9419900ab0bf7476f756e9dc013b3add9fa`. Reliable QA clone: `/Users/imwul/.codex/workspaces/morkborg-personal-site-20261010`; original project under the user's Desktop remains the source of private PDFs and prior extraction evidence. Development server: `http://127.0.0.1:5530/`; storage QA uses `http://localhost:5530/` to isolate its records. Private generator loading is enabled using the existing server key, never exposed in the browser or reports.

Actual browser: Codex in-app browser through CUA. Existing automated runner: `node:test` with `tsx`. No Pact boundary/broker, Playwright test dependency or new test framework is assumed. Browser evidence and full private audit details live in ignored `outputs/full-site-qa-20261011/`; public reports must summarize rather than reproduce source tables or secrets.

No new performance threshold has been supplied; subjective speed or a passed unit suite is not treated as a measured performance gate. Missing source PDFs, browser capabilities or fault injection must be marked unverified.
