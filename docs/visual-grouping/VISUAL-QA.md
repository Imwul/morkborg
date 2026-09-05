# Information grouping visual QA

2026-09-05 · Local development preview · Baseline `6d9494f`

Related information now shares a visible paper surface, continuous border and consistent internal spacing. Heavy rules identify the whole object; lighter rules divide its contents.

- **Monster:** one frame contains the black identity header, HP/Morale/armor band, description, attacks and abilities. Desktop uses two columns below the stat band; tablet and phone use one readable column.
- **Room overview:** each room has its own framed card and black numbered badge. Two columns on desktop become one on tablet and phone. Long names wrap and mobile controls stay above the description.
- **Room detail:** name and description lead; contents and notes follow inside the same frame. Placement editors expand inside their own nested card.
- **References:** generated results and copy actions share a frame. Explicit creature metadata identifies monster blocks without guessing from text length. Sources remain collapsed.
- **Library:** compact cards use the same border and paper treatment to distinguish adjacent records.

## Visual verification

Inspected the running app at 1440, 768 and 360 CSS pixels using the existing **The Bell Beneath Sarkash · QA** campaign. Checked monster sheets, room cards, room detail, expanded placements and the Meatroach reference result. Corrected tablet text columns, mobile room-name truncation and overlapping room controls during inspection.

The checked frames have matching client/scroll widths, with no horizontal document overflow. Measurements are in [layout-checks.json](layout-checks.json). The compact pinned tray intentionally scrolls horizontally.

Screenshots are native browser JPEG captures, not resized thumbnails:

- [Monster desktop](screenshots/monster-1440.jpg), [tablet](screenshots/monster-768.jpg), [phone](screenshots/monster-360.jpg)
- [Room cards desktop](screenshots/rooms-1440.jpg), [tablet](screenshots/rooms-768.jpg), [phone](screenshots/rooms-360.jpg)
- [Room detail phone](screenshots/room-detail-360.jpg), [expanded placement](screenshots/room-placement-360.jpg)
- [Reference desktop](screenshots/reference-1440.jpg), [phone](screenshots/reference-360.jpg)

Room title/arrow navigation, keyboard Enter, placement disclosure, reference lookup and clipboard copy were checked. Edit controls were opened and closed without changing values. Campaign content was not intentionally modified; no persistence schema, source tables, dice mechanics or city exploration procedures changed.

## Validation

- `npm test`: 380 passed, 0 failed.
- `npm run lint`: passed.
- `npm run build`: passed, including public-build privacy checks (57 static files).
- `git diff --check`: passed.
- Browser warning/error log: empty during the final check.

The checks above were completed locally before publication.
