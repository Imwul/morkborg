# Completion claim recheck

2026-09-09. Rechecked deployed commit `565a764456e1959db8e56557325f9d4ed731d6c6` after the user questioned completion.

The earlier deployment and 688-test result were real, but those checks did not establish that every discovery path worked. The browser scenarios predominantly used exact table names. A category search exposed a missed defect.

| User-facing path | Before, verified in production | Correction |
|---|---|---|
| PLAY → Physical Roll → `scroll` | No results; message says no compatible table. Two compatible canonical tables actually exist below the first eight global matches. | Apply physical-input eligibility before limiting the picker to eight rows. Sacred Scrolls and Unclean Scrolls now appear and resolve entered values. |
| PLAY → Recipes → create → `scroll` | Eight results, all disabled. Usable table references fall below those definition entries. | Eligible Recipe references precede read-only matches within this picker, then apply the eight-row cap. Unsupported definitions remain non-selectable. |

The cause was taking the first eight globally ranked references before checking the picker's narrower capabilities. Global search correctly prefers the casting rule and Power definitions for `scroll`; those same choices are insufficient for a table-only picker.

No global search ranking, source table, rule, generator, procedure, data store or visual structure changed. The correction is limited to the two convenience pickers. Blank input does not enumerate the registry.

`picker-regression.mjs` adds browser assertions at 360 and 1440 for: both Scroll tables appearing; manual input resolving with USER_ROLL; the first two Recipe choices being usable; saved Recipe execution; no HOLD on a single-result Recipe; no-match and whitespace handling; global search still ranking Using Powers first; no horizontal overflow; and byte-identical Campaign storage.

Local results: 688/688 existing tests pass, lint/build pass, public-build privacy checks pass. Browser assertions pass at both widths, with no JS errors. Before screenshots and local/production evidence are kept in ignored `outputs/convenience-recheck/`.

This is a correction to the earlier completeness claim, not another broad audit. The previous visual counts describe only their measured screens; they do not prove that every possible query works. Exact follow-up commit and verified production status are supplied in the delivery message.
