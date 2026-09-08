# Batch 3 link review

Baseline: `11e86737cce0dac67c269537e07fedb84d189e97`. Read-only inspection of current production code and an isolated saved QA Character at `http://127.0.0.1:5174`; no user Campaign data changed. This is a bounded link review, not another coverage audit.

## Existing paths that already work

The saved QA Character **Klort / Esoteric Hermit** was opened in its own browser context. Each following item required one click after opening the Character (the class ability first required opening its existing class-ability disclosure). Source stayed closed.

| Object | Actual destination | Enough mechanical text? | Change needed |
|---|---|---|---|
| Esoteric Hermit | Canonical Class definition | Yes; HP/Omens, ability modifiers and starting restrictions visible; class tables intentionally expandable | None |
| Knife | Core weapon definition | Damage d4; 10s | None |
| Light armor | Core armor definition | Tier 1, −d2 damage, 20s; related armor rule available | None |
| Specific sacred scroll: Unmet Fate | Canonical Power definition | Target and death-time limit/effect visible in English and Korean | None |
| Waterskin | Core equipment definition | Four days of water; 4s | None |
| Bear trap | Core equipment definition | Presence DR14 to spot; d8 damage; 20s | None |
| Bard of the Undying | Canonical Class ability row | Harp reaction modifier +d4 visible; secondary Korean present | None |
| Omens value | Core Omens quick rule | Five uses and depleted-only recovery visible | None |

The serialized QA Campaign remained byte-equivalent before and after reading these references. No HP, equipment, notes or other saved values were edited.

`Characters.tsx` uses `generatedSourceReference()` for generated equipment/class rows, `generatedReference()` for armor, and explicit Class/Omens canonical IDs. `RoomPacket.tsx`, `ContentLibrary.tsx` (NPC/Encounter), `Monsters.tsx`, `ReferenceReadingText.tsx` and `ReferenceTable.tsx` already render `ReferenceLinkedText` for mechanical names. A new graph or second set of links would duplicate functioning work.

## Concrete context gaps

`App.tsx` mounts `ObjectPlayTools`; saved Characters receive a collapsed **QUICK TOOLS** group. Current contents: Rest, Broken, Omens, Getting Better, Reaction, Corpse Plundering. Carrying and casting are absent. Draft Characters do not qualify for `ObjectPlayTools`, because its target lookup checks saved entity arrays.

| Need | Minimal implementation proposal | Ownership |
|---|---|---|
| Carrying from Character equipment | Quiet link on the existing equipment heading to `rule:core.carrying`; no extra permanent action row | `Characters.tsx` |
| Casting from daily Power uses | Make the existing read-mode Power-use value open `rule:core.casting`; editing remains available in EDIT | `Characters.tsx` |
| Better Character quick tools | Replace Reaction/Corpse with Carrying/Casting in existing six-entry context; preserve Rest/Broken/Omens/Getting Better | Root: `references.ts` |
| Core flee from Monster/Morale | Current Monster quick tools contain Reaction/Morale/Corpse/Treasure. Do not pretend the separate SD Flee Move is Core. Await verified Core routing decision. | Root source/rule work |

Current HP click/edit behavior should remain unchanged. The task asks to inspect hypothetical HP0 without changing saved state; a separate Broken reference already supports that.

## Four selected starting-result projections

The following existing canonical rows were checked against the targeted Core Bare Bones extraction, PDF/printed 22. They already contain the source mechanics but are not projected as named equipment definitions. Selection was confirmed after BATCH3-TRIAGE.md was written. The implementation projects these rows read-only; no new content pool or purchase price was introduced.

| Canonical row | Proposed exact-source lookup identity | Supplied mechanics | Source location |
|---|---|---|---|
| `core.gearA:10-10` | bomb | Sealed bottle; d10 damage | Core PDF 22 / printed 22 |
| `core.gearB:1-1` | life elixir | d4 doses; heals d6 HP and removes infection | Core PDF 22 / printed 22 |
| `core.gearB:3-3` | small but vicious dog | d6+2 HP; bite d4; only obeys you | Core PDF 22 / printed 22 |
| `core.gearB:4-4` | monkeys | d4 monkeys; d4+2 HP; punch/bite d4; ignore but love you | Core PDF 22 / printed 22 |

`referenceDefinitions.ts` can expose the entire existing source row as the compact effect, preserve `tableEntry` and source IDs/pages, and use the already separate `metadata.ko` helper. `generatedSourceReference()` can resolve a generated occurrence by its existing provenance. Numeric quantity substitutions may require a narrow name alias, never a change to generation or saved data.

## Read-only deployment readiness

`vercel.json` declares Vite, `npm run build`, `dist`, API inclusion of `public/private-updates/**`, and a client route rewrite which excludes API/assets/private data paths. Git remote is `https://github.com/Imwul/morkborg.git`.

No `.vercel/project.json` exists in this repository or its parent, and no `vercel` executable was found in PATH. These observations do not establish a deployment failure; the root task must discover the available authorized deployment route and verify the production result separately. No deployment, push, credentials or secret values were accessed during this link review.

## Selected implementation

- `referenceDefinitions.ts` exposes four named Equipment definitions from the existing canonical `core.gearA` / `core.gearB` rows. Visible effect text and Korean helper come directly from each row; the canonical table/entry/source stays inspectable.
- `Characters.tsx` adds the carrying reference to the existing equipment heading and makes the daily Power-use value open casting in reading mode. EDIT still exposes ordinary editing; HP editing is unchanged.
- No changes to `generatedReferenceLinks.ts` were needed: existing `generatedSourceReference` resolves the rolled quantity/HP results through entry provenance, and `ReferenceLinkedText` handles named fragments in Rooms and Encounters.
- The existing 46-entry Core purchase-catalog test is retained with its filter scoped to `core.equipmentCatalog`; the four starting-only references are tested separately. This prevents new starting gear from being mistaken for new purchase prices.

## Verification after implementation

Eight new link tests and the 21 existing Batch 1 tests passed (29/29). The new tests verify all four effects/source locations/Korean helpers, exact-name ranking, real generated dose/companion HP results, no mutation on lookup, separation from Blackpowder Bomb, manual edits, unavailable-source behavior, and Character links with HP editing preserved.

`batch3-links-browser.json` records nine actual browser checks and eight responsive checks. Four named starting items return the useful definition first and open in one click; Core PDF/printed 22 is inspectable in one further source click. Character carrying and daily Power-use links open in one click. Source remains closed; English and Korean are present. Saved Character QUICK TOOLS includes carrying and Powers. The Campaign is unchanged after reload.

Carrying and casting were inspected at 360, 768, 1440 and 3440 pixels with no page/inspector overflow. Screenshot review confirmed readable stacked Korean at 360 and a deliberately bounded reference panel at 3440. Screenshots remain in ignored `outputs/pdf-remediation-batch-3`.

One existing limitation was identified, not changed: `referenceTextSegments()` indexes canonical `definition` entries, but standalone creatures have `kind: creature` without a definition. Named equipment in Room/Encounter text can link; arbitrary creature names there do not automatically acquire a statblock link. This is distinct from the functioning generated Monster inspector and its source/participant links. The selected four starting-equipment needs do not require extending creature-name matching.
