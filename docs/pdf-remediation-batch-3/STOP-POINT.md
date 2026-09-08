# Batch 3 natural stop point

This assessment uses the inherited matrix, the pre-change current-code/registry triage, and the selected scope in `BATCH3-TRIAGE.md`. It is **not** a fresh audit of all remaining sources. Whether the selected Core combat/exploration loop is resolved must be established by the final browser acceptance. The recommendations below do not authorize or claim any extra implementation.

## Stop broad remediation; retain a small, explicit Core backlog

If the 19 selected inherited IDs pass their browser recheck, **382 inherited non-resolved IDs remain**: PARTIAL 32, PRESENT_BUT_INDIRECT 165, MISSING 182, SOURCE_UNAVAILABLE 3. These are inherited classifications minus selected resolutions, not 382 freshly confirmed failures. The four card-selector overlaps remain in that count deliberately.

The remaining set would contain 31 IDs tagged Core-general/class/equipment: 14 Core-general, 15 Core-equipment, 2 Core-class. The other 351 comprise 12 solo-general, 8 supplement-general, 230 supplement-specific, 98 rare-edge cases, and 3 unavailable sources. Core scenario material and repeated catastrophes are included in the rare group, so “rare” does not mean “not in Core.” None of these categories automatically means long-form material or permission to omit a meaningful rule.

The dominant remainder does **not** justify another broad remediation batch. Ordinary combat, damage, recovery, carrying, Omens, Powers, and common equipment should first pass the selected acceptance scenario. Once they do, prioritize actual recurring play reports instead of chasing the inherited count. A user who regularly hires followers would benefit from a small follower-reference pass; a user who regularly sells monster remains would benefit from a small valuation disclosure. Neither needs a new subsystem.

## Ordinary Core situations that still merit an explicit caveat

| Situation | Inherited IDs / source | Current access and practical impact | Smallest future intervention |
| --- | --- | --- | --- |
| Recruit an Outcast and decide when/how loyalty is checked | `core-outcast-loyalty` — Bare Bones PDF/printed 63 | MISSING. Outcast identities are present, but the general recruitment/loyalty procedure has no usable standalone rule. This is a real ordinary-Core gap for follower-using parties. | One source-verified concise follower rule with links from existing Outcasts. |
| Run the Wild Wickhead follower | `core-outcast-wild-wickhead` — PDF/printed 65 | PARTIAL. Private Outcast data exists; current reference projection exposes only selected Outcasts. Exact-name probe returns no result. | Expose the existing fixed record, without merging it into another Wickhead. |
| Buy a trained/wild dog, horse, mule, or tame rat | `core-purchase-dog-trained`, `core-purchase-dog-wild`, `core-purchase-horse`, `core-purchase-mule`, `core-purchase-rat-tame` — PDF/printed 26 | MISSING. These five prices are outside the selected ammo/service/repair catalog. A companion generator is not a purchase-price reference. | The five verified stock/price rows in the existing price lookup; no mount/companion manager. |
| Identify the effect of a named Core treasure after finding it | `core-treasure-1`…`core-treasure-10` — PDF/printed 3 | PRESENT_BUT_INDIRECT. Complete effects already exist in `core.treasures` TABLE, including embedded mechanics. PDF is avoidable if the player knows the table, but exact named lookup and generated-result follow-through remain weaker. | Project the ten existing source entries as named references or open/highlight the exact row. |
| Determine the sale value of a captive, corpse, or body part | Twelve `core-valuation-*` IDs — PDF/printed 58–62 | PRESENT_BUT_INDIRECT. Values are in private creature records and imported preset Notes, but the reference stat block omits those notes. This is a **sale-value** gap, not missing behavioral rules or missing combat stats. | A compact optional valuation disclosure on the current creature reference. |

The treasure and valuation rows belong under **“exists but is too hard to reach,”** not “mechanics are missing.” They must not be described as requiring PDF in all circumstances. Follower rules and animal purchase prices are stronger cases of actual missing ordinary-Core lookup, although their triggers are less frequent than the Batch 3 combat/recovery targets.

## Preparation or uncommon Core cases

- `core-ability-creation` — Bare Bones PDF/printed 27, PARTIAL: ability conversion and the optional classless two-ability 4d6-drop-lowest choice. Mainly needed when creating/replacing a Character manually. The current generator and the option's absence are separate questions; do not silently choose the two abilities.
- `core-character-creation` — PDF/printed 21–23, 27, 29, PRESENT_BUT_INDIRECT: source creation order without Campaign context. Existing generation is useful, but a manual setup reference is not yet equivalent to it.
- `core-catastrophe-repeat` — PDF/printed 43, PARTIAL: the repeated optional catastrophe's complete black-fire rule is still absent from the reminder. Rare does not mean harmless; consult the PDF if it actually triggers. One exact global rule would suffice in a later targeted patch.
- Seventeen `core-rotblack-*` IDs — Full Edition PDF 78–91: keyed Rotblack Sludge actors, effects, items, and procedures. These matter when choosing that adventure, not ordinary general-Core resolution. Scenario prose/maps should intentionally remain in the book; concise keyed stat/effect gaps are still real references if that scenario becomes a regular use case.

## Supplement-specific or rare enough to defer broad development

- **RECLVSE:** six incomplete archetypes, 36-Power named access, optional blessings/relics, additional social/city/wilds moves, quest/connection/shelter procedures, prepared-adventure conversion, alternate detailed generators. Basic resolution/travel/camp/dungeon work from Batch 2 does not imply full RECLVSE-book completeness. For a campaign using RECLVSE exclusively, select its actual recurrent gaps in a dedicated small pass.
- **FERETORY:** named relic lookup, supplemental classes/ochre scrolls, the optional wider hunting die, source-only regional follow-through, and keyed Death Ziggurat/Goblin Grinder actors/hazards. Many effects are already in canonical tables; keep missing effects separate from retrieval problems.
- **HERETIC:** feats, merchant items, optional classes/special content, and Graves/Bloat/Swamp/Nurse keyed mechanics. Blackpowder and the selected known targets were addressed earlier; that does not cover every scenario actor.
- **Sölitary Depths:** optional Orakle odds/DR mode, alternate regional dungeon preparation, Lake Onda/Bergen Chrypt follow-through, and residual card/table access overlaps. Do not rerun the implemented rare monster or Encounter Level pipeline merely to close inherited IDs.
- **Sölitary Defilement:** milestone→Getting Better linking and residual table use/selection context; included adventure creatures remain scenario-specific.
- **Alöne:** Dérive/merchant direct routing, named city item/participant follow-through, and included adventure material. The existing City workspace can already answer several of these when reached through its known path.
- **Mythic:** optional first-scene/focus choices and notebook-list housekeeping; alternate Chaos charts, Thread Progress/Discovery, keyed/prepared scenes, Peril Points, and Crafter integration. These should remain optional references, not automatic narrative or management features.

These are useful only if the user actually adopts that source, table family, or adventure. They do not justify completing every supplemental chapter before calling the Core Reference Desk practically useful.

## Source unavailable: explicitly unsolved

| ID | Supplied location | Limitation |
| --- | --- | --- |
| `heretic:table-curseCure` | HERETIC PDF 37 / printed 35 | Result 12 is physically clipped mid-sentence in the supplied PDF. Preserve the warning; do not invent its ending. |
| `heretic:staff-awful-light` | HERETIC PDF 66 / unnumbered final fold | The objective is named but no effect/stat rule is supplied. There is no verified mechanical definition to add. |
| `mythic-crafter-source` | Mythic PDF 172, 173, 175 / printed 171, 172, 174 | External Adventure Crafter tables/deck were not supplied. Integration instructions and missing external generator content are distinct. |

## Direct answer

After the selected Core checks pass, tomorrow's ordinary combat, damage, survival, rest, inventory, and casting should rarely require the PDF. **Followers/loyalty, buying animals, an obscure named treasure, and selling monster remains remain the most plausible ordinary-Core lookup detours.** The last two often have an in-app table/Notes route already. Manual classless creation and a repeated optional catastrophe are less frequent explicit exceptions.

Stop **broad** remediation at this point. Keep the two follower findings, five animal prices, named treasure access, and valuation disclosure as a small prioritized backlog triggered by actual use. Remaining optional systems, supplements, keyed adventures, source limitations, artwork, and long-form reading should not force further broad product expansion.
