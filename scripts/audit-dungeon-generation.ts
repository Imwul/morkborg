import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { setRules } from '../src/storage/rulesStore.ts';
import { setOraclePack } from '../src/storage/oracleStore.ts';
import { createDungeonCandidate } from '../src/generators/index.ts';

const fixturePath =
  process.env.MORKBORG_PRIVATE_AUDIT_FIXTURE ??
  'outputs/morkborg-private-data.json';
const fixture = JSON.parse(readFileSync(fixturePath, 'utf8'));
setRules(fixture.library);
setOraclePack(fixture.oracles);
const regions = [
  'sarkash',
  'graven-tosk',
  'kergus',
  'grift',
  'galgenbeck',
  'wastland',
  'valley-undead',
] as const;
const dungeons = Array.from({ length: 100 }, (_, index) =>
  createDungeonCandidate(
    'isolated-source-audit',
    regions[index % regions.length],
  ),
);
const rooms = dungeons.flatMap((dungeon) => dungeon.rooms);
const classifications: Record<string, number> = {};
const unresolved: string[] = [];
for (const dungeon of dungeons)
  for (const [key, value] of Object.entries(dungeon.fieldProvenance ?? {})) {
    classifications[value.classification] =
      (classifications[value.classification] ?? 0) + 1;
    if (value.classification === 'UNSOURCED') unresolved.push(`Dungeon.${key}`);
  }
for (const room of rooms)
  for (const component of room.components ?? []) {
    classifications[component.provenance.classification] =
      (classifications[component.provenance.classification] ?? 0) + 1;
    if (
      !component.provenance.sourceRefs.some((source) => source.tableId) ||
      component.provenance.classification === 'UNSOURCED'
    )
      unresolved.push(`Room.${component.key}`);
  }
const chosen = rooms.filter((_, index) => index % 16 === 0).slice(0, 25);
const summary = {
  generatedAt: new Date().toISOString(),
  dungeons: dungeons.length,
  rooms: rooms.length,
  representativeRoomsForHumanReview: chosen.length,
  classificationCountingUnit:
    'Each dungeon textual field (including intentionally blank manual fields), plus each authoritative room component; structural identifiers and compatibility mirrors are excluded.',
  classifications,
  unresolved,
  sampleSha256: createHash('sha256')
    .update(JSON.stringify(dungeons))
    .digest('hex'),
  sourceTableIds: [
    ...new Set(
      rooms.flatMap(
        (room) =>
          room.components?.flatMap((component) =>
            component.provenance.sourceRefs.flatMap((source) =>
              source.tableId ? [source.tableId] : [],
            ),
          ) ?? [],
      ),
    ),
  ],
  duplicateRoomResults:
    rooms.length - new Set(rooms.map((room) => room.description)).size,
};
mkdirSync('outputs/product-integrity', { recursive: true });
writeFileSync(
  'outputs/product-integrity/dungeon-samples.json',
  JSON.stringify(dungeons, null, 2),
);
writeFileSync(
  'docs/product-integrity/dungeon-generation-qa.json',
  JSON.stringify(summary, null, 2) + '\n',
);
console.log(JSON.stringify(summary, null, 2));
for (const [index, room] of chosen.entries())
  console.log(
    `${index + 1}. ${room.components!.map((item) => `${item.label}: ${item.sourceText} [${item.translationKo ?? 'no helper'}] (${item.provenance.rolls!.map((roll) => `${roll.dice}=${roll.value}`).join('; ')})`).join(' | ')}`,
  );
if (unresolved.length) process.exitCode = 1;
