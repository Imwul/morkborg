# Design Thinking Session: MÖRK BORG Final Playability

Date2026-10-12 KST · FacilitatorCodex · Initial app HEAD9373481, same app as44766de.

## Design Challenge

A solo player using English-first references beside separate notes needs accurate rule interpretation and a continuous character→exploration→encounter→combat→recovery→resume flow. Preserve current design, free search, optional tables, data schemas and all working tools. No campaign log, forced progression, autonomous GM or unmeasured performance claim.

Workflow customization/config, full methods CSV and template were actually read. The user's autonomous execution instruction replaces repeated skill checkpoint confirmation questions; saves remain sequential. User research is limited to explicit product principles and agent browser observations; no human interviews or5–7user study are claimed.

## EMPATHIZE

Methods chosen: Journey Mapping for actual chained play; Empathy Mapping anchored only in explicit user statements (feelings unknown); Shadowing lens applied to agent's own real-browser actions, not falsely described as observing a human; Diary-style action chronicle. Current user intent takes precedence over old broad redesign records. Source: user prompt, existing20261011/12QA and UX calibration/readme documents.

User insights: English-first references, separate paper notes, optional oracles, editable combat state. Observed: HP1 generation still playable through caution; Reaction10 gives a friendly encounter rather than a forced fight; prepared dungeon lookup returns cleanly; explicit combat critical reference preserves pending roll. No human feelings are inferred.

Empathy map: says—trust rules and stay in the game; does—agent searches, pins, opens child tables, returns to current references; thinks/feels—unknown beyond explicit user priorities. Key observed pain: parent dungeon persists but conditional child disappears on reader return. Room Exits requires expanding its original headers to interpret five columns; this is readable without opening a PDF.

## DEFINE

POV: a solo player needs the already obtained conditional detail to accompany the unchanged parent result because opening the referenced Misery otherwise loses information and forces another lookup. How might we restore existing result continuity without saving campaign progression or adding controls? How might we keep source headers understandable while preserving independent table access? Risk priority: reproducible P1 child loss; P2 one extra disclosure for column headings; high-impact SYS20 storage faults have partial historical evidence, not a fresh defect.

## IDEATE

Methods: individual Brainstorming for alternatives, SCAMPER to reuse/modify existing continuity, Mind Mapping to cluster state/navigation/source semantics. Fifteen concrete candidates: (1) pass existing parent identity; (2) local component lift; (3) keep all reader components mounted; (4) persist child in saved dungeon; (5) global child history; (6) auto-roll child on return; (7) one shared tool map; (8) keep child only in external notes; (9) inline Misery link; (10) add Back control; (11) use existing PIN; (12) use existing Recent; (13) force preparation completion; (14) show original Room Exits headers; (15) automatically choose exit column from campaign progress.

Clusters: continuity1–8; navigation9–12; procedural/display13–15. Top concepts:1 existing parent identity (minimal evidenced fix) and14 existing source-header disclosure (reference-only baseline comparison, no new control/code). Reject2–7 as unnecessary architecture/persistence/forced randomness,8 as needless memory burden,9–10 without enough navigation benefit,13/15 as forbidden progression/state,11/12 already work. No new feature area is justified.


## PROTOTYPE

Approaches: minimal working digital prototype and scenario walkthrough. Reuse the existing tab-local WeakMap keyed by the current parent roll, already used by source tables. The observed urgent defect was patched while the wider play session continued; ideation above records the explicit comparison, not a claim that all alternatives were built. One production prop connects dungeon preparation; no new schema, panel or progression. One regression renders retained child, then a new same-selector parent to reject stale inheritance. Before patch it fails; after patch related38 tests pass. Source-header alternative remains the existing expandable source table; test its readability rather than introduce a new selector. Features to test: result/open/input survive navigation, Copy includes child, replacement does not inherit old child, saved objects remain independent.

## TEST

Validation used the actual running app and an action/snapshot diary, with natural Core+SD play separated from deliberately constructed combat and independent Mythic/RCL scenarios. Participant: agent only. No human interview, feelings measurement, 5–7participant study or human task timing is claimed.

Same-situation feedback: the unchanged parent dungeon and its explicitly entered Status4/altar2 details survive return through a referenced Misery/PIN; before, the details disappeared. SEND TO SCRATCH now includes both observed children, using the existing Copy projection. Four actual viewport sizes were verified with DOM geometry and full-page screenshot dimensions. Existing narrow spatial toolbar controls measured23.8125/35.71875px wide; after min-width44 all three are44×44 at360/768. The source-header alternative still needs one disclosure click but is understandable without a PDF, so it was preserved.

A later iteration observed Common preparation's declared candidate link removed from Related because a theme list was assumed to be visible. In collapsed mobile navigation, that assumption failed; retaining existing explicit Related links gives direct one-click access. Back/Forward was subsequently exercised in the browser. Inspecting the actual Stock table revealed six wrong creature bindings; SD PDF11 and Core Bare Bones PDF59–62 establish the corrected species identities. This is a rules-fidelity defect, not a design preference. All six destinations were actually opened after correction.

Validated assumptions: existing tab-local continuity and existing navigation are sufficient; no new history/schema/panel is needed. Invalidated assumption: a source destination merely being available does not prove that its species matches the selected row. Reversing exactly the six corrected metadata targets restores the complete historical registry hash, guarding against unrelated source changes. Observed save/reload preserved one character and two independently saved dungeon versions with identical rendered text; HP/Omen/notes and Scratch returned. Ordinary generated readings are document-local and require external notes or explicit saved content after refresh.

## NEXT STEPS

Refinements implemented: child continuity, complete Scratch projection, explicit reader links, six source bindings, narrow toolbar hit area. No automatic next action, campaign journal, forced gates, or redesign. Source-header disclosure, manual HP and external progression counts remain deliberate. Generic constituent formula labels and some Korean grammar remain documented follow-up concerns; no speculative architecture was added.

Success criteria: retained obtained results, correct species and rule system, direct existing followups, saved-content stability, actual viewport fit. These are demonstrated for the observed scenarios, not inferred from FULL coverage. Final regression is recorded in the A–H report. SYS20 fault-environment gaps and historical TraceFAIL remain. The next useful cycle is a human solo-play pilot and targeted device/storage evidence when available, not a mandatory new framework or score chase.

Workflow completion hook is resolved separately; this artifact is the completed agent-only workflow with its research limits explicit.

Completion: workflow.on_complete resolver was executed on2026-10-12 and returned an empty string; no further hook applies.
