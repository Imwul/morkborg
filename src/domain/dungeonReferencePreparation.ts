import type { OracleRegistry, OracleRoll } from './oracle';
import type { ReferenceReading } from './referenceReading';
import type { SourceReference } from './types';
import { oracleFollowUpLinks, oracleReadingText } from './referenceReading';
import { oracleRollProvenance } from './oracleProvenance';
import { appPolicy, sourceProcedure } from './generationAuthority';
import { rollOracle } from '../generators/oracleRoller';
import { id, random, type RandomSource } from '../generators/random';

export const DNGNGEN_URL = 'https://dngngen.makedatanotlore.dev/';

export const DUNGEON_PREPARATION_SOURCE_REFS: SourceReference[] = [
  {
    bookId: 'sd',
    bookTitle: 'Sölitary Defilement',
    pdfPage: [9, 19],
    printedPage: '7, 17',
    tableTitle: 'Dungeon Crawling / Preparing a Dungeon Crawl',
    role: 'routing',
  },
];

export type DungeonPreparationKey =
  | 'name'
  | 'status'
  | 'danger'
  | 'inhabitants'
  | 'reason'
  | 'entrance'
  | 'guard'
  | 'feature'
  | `special${1 | 2 | 3 | 4}`;

export interface DungeonPreparationField {
  key: DungeonPreparationKey;
  title: string;
  titleKo: string;
  kind: 'name' | 'table' | 'manual' | 'room';
  tableIds: readonly string[];
  referenceIds: readonly string[];
  note?: string;
}

/** SD's preparation stat block, not a sequence of tasks or an exploration state. */
export const DUNGEON_PREPARATION_FIELDS: readonly DungeonPreparationField[] = [
  {
    key: 'name',
    title: 'Dungeon name',
    titleKo: '던전 이름',
    kind: 'name',
    tableIds: ['core.titleA', 'core.titleB'],
    referenceIds: ['oracle:core.titleA', 'oracle:core.titleB'],
  },
  {
    key: 'status',
    title: 'Status',
    titleKo: '현재 상태',
    kind: 'table',
    tableIds: ['core.status'],
    referenceIds: ['oracle:core.status'],
  },
  {
    key: 'danger',
    title: 'Imminent danger',
    titleKo: '임박한 위험',
    kind: 'table',
    tableIds: ['core.danger'],
    referenceIds: ['oracle:core.danger'],
  },
  {
    key: 'inhabitants',
    title: 'Who or what dwells here now?',
    titleKo: '현재 거주자',
    kind: 'table',
    tableIds: ['core.inhabitants'],
    referenceIds: ['oracle:core.inhabitants'],
  },
  {
    key: 'reason',
    title: 'What brings you here?',
    titleKo: '이곳에 온 이유',
    kind: 'manual',
    tableIds: [],
    referenceIds: [],
    note: 'SD의 준비 항목입니다. 방문 이유는 직접 적거나 DNGNGEN의 결과를 사용하세요.',
  },
  {
    key: 'entrance',
    title: 'Entrance',
    titleKo: '입구',
    kind: 'table',
    tableIds: ['reclvse.dungeonEntrance'],
    referenceIds: ['oracle:reclvse.dungeonEntrance'],
    note: 'RECLVSE의 입구 표를 사용하는 앱의 선택입니다. DNGNGEN의 입구 표와는 다릅니다.',
  },
  {
    key: 'guard',
    title: 'Guarded by',
    titleKo: '입구의 경비',
    kind: 'manual',
    tableIds: [],
    referenceIds: [],
    note: 'SD의 준비 항목입니다. 경비는 직접 적거나 DNGNGEN의 결과를 사용하세요.',
  },
  {
    key: 'feature',
    title: 'Distinctive feature',
    titleKo: '독특한 특징',
    kind: 'table',
    tableIds: ['core.feature'],
    referenceIds: ['oracle:core.feature'],
  },
  ...([1, 2, 3, 4] as const).map((slot) => ({
    key: `special${slot}` as const,
    title: `Special Room ${slot}`,
    titleKo: `특별한 방 ${slot}`,
    kind: 'room' as const,
    tableIds: ['core.rooms'],
    referenceIds: ['oracle:core.rooms'],
    note: 'SD가 허용하는 Core Sample Rooms 대안입니다. d4 × d6 한 결과를 사용하며 조건부 표는 따로 참고합니다.',
  })),
] as const;

const title = 'Dungeon Preparation · 던전 준비';
const companions = [
  'rule:sd.dungeonCrawling',
  'rule:sd.stockCommon',
  'rule:sd.stockRare',
  'procedure:sd.room-description',
];

function fieldFor(key: DungeonPreparationKey) {
  const field = DUNGEON_PREPARATION_FIELDS.find((field) => field.key === key);
  if (!field) throw new Error(`알 수 없는 던전 준비 항목입니다: ${key}`);
  return field;
}

/** Rebuild only derived evidence/navigation; the source registry and saved campaigns are untouched. */
function withEvidence(
  reading: ReferenceReading,
  rolls: OracleRoll[],
): ReferenceReading {
  const links = rolls.map((roll) =>
    oracleFollowUpLinks(roll.metadata, roll.oracleId),
  );
  return {
    ...reading,
    oracle: rolls.length ? { id: id(), title, rolls } : undefined,
    sourceRefs: [
      ...DUNGEON_PREPARATION_SOURCE_REFS.map((ref) => ({ ...ref })),
      ...rolls.flatMap((roll) => oracleRollProvenance(roll)?.sourceRefs ?? []),
    ],
    relatedIds: [
      ...new Set([
        ...companions,
        ...links.flatMap((link) => link.relatedIds ?? []),
      ]),
    ],
    fixedLookups: links.flatMap((link) => link.fixedLookups ?? []),
  };
}

export function emptyDungeonPreparationReading(): ReferenceReading {
  return withEvidence(
    {
      title,
      blocks: DUNGEON_PREPARATION_FIELDS.map((field) => ({
        title: field.title,
        text: '',
        translation: { titleKo: field.titleKo },
      })),
      sourceRefs: [],
      authority: [
        sourceProcedure(
          'sd.dungeon-preparation',
          DUNGEON_PREPARATION_SOURCE_REFS,
          'SD의 준비용 stat block과 네 특별한 방 슬롯입니다. 탐색 진행 상태를 기록하지 않습니다.',
        ),
        appPolicy('app.dungeon-dossier'),
      ],
    },
    [],
  );
}

/** One explicit field roll: the printed name pair is atomic; every child table stays optional. */
export function rollDungeonPreparationField(
  key: DungeonPreparationKey,
  registry: OracleRegistry,
  rng: RandomSource = random,
): ReferenceReading {
  const field = fieldFor(key);
  if (field.kind === 'manual') throw new Error('이 항목은 직접 작성합니다.');
  const tables = field.tableIds.map((tableId) => {
    const table = registry.tables.find((table) => table.id === tableId);
    if (!table) throw new Error(`연결된 원문 표가 없습니다: ${tableId}`);
    return table;
  });
  // rollOracle reads the original dice/ranges without region weights or following child links.
  const rolls: OracleRoll[] = tables.map((table) => {
    const roll = rollOracle(table, registry, rng);
    return { ...roll, metadata: { ...roll.metadata, preparationField: key } };
  });
  const ko =
    rolls.length === 1 && typeof rolls[0].metadata?.ko === 'string'
      ? rolls[0].metadata.ko
      : undefined;
  const reading: ReferenceReading = {
    title: field.title,
    blocks: [
      {
        title: field.title,
        text:
          field.kind === 'name'
            ? `The ${rolls.map((roll) => roll.text).join(' ')}`
            : oracleReadingText(rolls[0]),
        dice: rolls.map((roll) => `${roll.dice} = ${roll.roll}`).join(' · '),
        translation: { titleKo: field.titleKo, ...(ko ? { ko } : {}) },
      },
    ],
    sourceRefs: [],
  };
  return withEvidence(reading, rolls);
}

export function rerollDungeonPreparationField(
  current: ReferenceReading,
  key: DungeonPreparationKey,
  registry: OracleRegistry,
  rng: RandomSource = random,
): ReferenceReading {
  const field = fieldFor(key);
  const replacement = rollDungeonPreparationField(key, registry, rng);
  const rolls = DUNGEON_PREPARATION_FIELDS.flatMap((candidate) =>
    candidate.key === key
      ? (replacement.oracle?.rolls ?? [])
      : (current.oracle?.rolls ?? []).filter(
          (roll) => roll.metadata?.preparationField === candidate.key,
        ),
  );
  return withEvidence(
    {
      ...current,
      blocks: current.blocks.map((block) =>
        block.title === field.title ? replacement.blocks[0] : block,
      ),
    },
    rolls,
  );
}

/** The user's explicit full-sheet action, never triggered by opening or navigating a reference. */
export function rollDungeonPreparationReading(
  registry: OracleRegistry,
  rng: RandomSource = random,
  current: ReferenceReading = emptyDungeonPreparationReading(),
): ReferenceReading {
  return DUNGEON_PREPARATION_FIELDS.reduce(
    (reading, field) =>
      field.kind === 'manual'
        ? reading
        : rerollDungeonPreparationField(reading, field.key, registry, rng),
    current,
  );
}

/** Only the two source-defined fields without an installed source table are handwritten. */
export function editDungeonPreparationField(
  current: ReferenceReading,
  key: DungeonPreparationKey,
  text: string,
): ReferenceReading {
  const field = fieldFor(key);
  if (field.kind !== 'manual') throw new Error('직접 작성 항목이 아닙니다.');
  return {
    ...current,
    blocks: current.blocks.map((block) =>
      block.title === field.title ? { ...block, text } : block,
    ),
  };
}
