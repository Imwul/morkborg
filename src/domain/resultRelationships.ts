import type { OracleRegistry, OracleRoll } from './oracle';
import type { ReferenceEntry } from './references';
import type { ReferenceReading } from './referenceReading';
import {
  resolveRowRelationships,
  type ResolvedRowRelationship,
} from './rowRelationships';

/** A transient presentation of existing edges, never a second relationship store. */
export type ResultPurpose = 'REQUIRED' | 'AVAILABLE' | 'CONTEXT';
export interface ResultRelationship extends ResolvedRowRelationship {
  purpose: ResultPurpose;
  note?: string;
  rowLabel?: string;
}
interface RowPolicy {
  table: string;
  min: number;
  target: string;
  purpose: ResultPurpose;
  note?: string;
  /** Only exact, source-verified missing links. See docs/actionable-results/EVIDENCE.md. */
  add?: boolean;
}
export const RESULT_ROW_POLICIES: readonly RowPolicy[] = [
  {
    table: 'feretory.forage',
    min: 4,
    target: 'rule:feretory.hunting-procedure',
    purpose: 'AVAILABLE',
    note: '원문이 제시한 Eat Prey Kill 대안. 기본 d8+2 식량과 중복 적용하지 않습니다.',
    add: true,
  },
  {
    table: 'feretory.leaveRoad',
    min: 8,
    target: 'oracle:core.treasures',
    purpose: 'AVAILABLE',
    note: '수도원 지하묘실의 숨은 유물을 정할 때만',
    add: true,
  },
  {
    table: 'sd.search.strong',
    min: 1,
    target: 'oracle:core.corpsePlundering',
    purpose: 'AVAILABLE',
    note: 'Corpse Plunder 또는 Trinkets 중 하나 선택',
    add: true,
  },
  {
    table: 'sd.search.strong',
    min: 1,
    target: 'oracle:feretory.itemsTrinkets',
    purpose: 'AVAILABLE',
    note: 'Corpse Plunder 또는 Trinkets 중 하나 선택',
    add: true,
  },
  {
    table: 'sd.search.strong',
    min: 4,
    target: 'oracle:core.treasures',
    purpose: 'AVAILABLE',
    note: '원문의 보물 선택지 중 하나',
    add: true,
  },
  {
    table: 'sd.search.strong',
    min: 4,
    target: 'oracle:feretory.tenebrousReliquary',
    purpose: 'AVAILABLE',
    note: '원문의 보물 선택지 중 하나',
    add: true,
  },
  {
    table: 'sd.search.weak',
    min: 2,
    target: 'oracle:core.corpsePlundering',
    purpose: 'REQUIRED',
    add: true,
  },
  {
    table: 'sd.search.weak',
    min: 3,
    target: 'oracle:feretory.itemsTrinkets',
    purpose: 'REQUIRED',
    add: true,
  },
  {
    table: 'aitc.taverns',
    min: 1,
    target: 'rule:core.rest',
    purpose: 'AVAILABLE',
    note: '숙박 판정이 Fail이라 감염되었을 때 · 이후 휴식 제한과 일일 손실',
    add: true,
  },
  {
    table: 'aitc.taverns',
    min: 3,
    target: 'oracle:core.reaction',
    purpose: 'AVAILABLE',
    note: 'NPC에게 다가갈 때만 Reaction +2. 보정을 직접 적용합니다.',
  },
  {
    table: 'feretory.roadEvent',
    min: 5,
    target: 'oracle:core.weather',
    purpose: 'REQUIRED',
    add: true,
  },
  {
    table: 'feretory.roadEvent',
    min: 20,
    target: 'oracle:core.corpsePlundering',
    purpose: 'REQUIRED',
    add: true,
  },
  {
    table: 'feretory.forage',
    min: 5,
    target: 'oracle:feretory.village',
    purpose: 'REQUIRED',
    add: true,
  },
  {
    table: 'core.broken',
    min: 2,
    target: 'oracle:core.brokenInjury',
    purpose: 'REQUIRED',
    add: true,
  },
  {
    table: 'core.reaction',
    min: 2,
    target: 'rule:core.violence',
    purpose: 'AVAILABLE',
    note: '전투로 이어지면 공격·방어 규칙 확인',
    add: true,
  },
  {
    table: 'core.reaction',
    min: 4,
    target: 'rule:core.violence',
    purpose: 'AVAILABLE',
    note: '분노가 곧 전투를 뜻하지는 않습니다. 싸우게 될 때 참고.',
    add: true,
  },
  {
    table: 'depths.danger',
    min: 6,
    target: 'oracle:core.reaction',
    purpose: 'REQUIRED',
    note: '이 결과는 Reaction −2. 보정은 직접 적용합니다.',
    add: true,
  },
  {
    table: 'depths.danger',
    min: 6,
    target: 'rule:sd.npc',
    purpose: 'AVAILABLE',
    note: 'NPC를 더 정해야 할 때',
  },
  {
    table: 'sd.room.contents',
    min: 1,
    target: 'oracle:feretory.A',
    purpose: 'AVAILABLE',
    note: '원문이 제시한 생물 생성 예시 중 하나',
    add: true,
  },
  {
    table: 'sd.room.contents',
    min: 1,
    target: 'rule:depths.rareMonster',
    purpose: 'AVAILABLE',
    note: 'Depths의 대안. 다른 생성기와 모두 굴릴 필요는 없습니다.',
  },
  {
    table: 'sd.room.contents',
    min: 6,
    target: 'rule:sd.stockCommon',
    purpose: 'REQUIRED',
  },
  {
    table: 'sd.room.contents',
    min: 8,
    target: 'rule:sd.stockRare',
    purpose: 'REQUIRED',
  },
  {
    table: 'sd.room.contents',
    min: 9,
    target: 'rule:sd.npc',
    purpose: 'REQUIRED',
  },
  {
    table: 'sd.room.contents',
    min: 11,
    target: 'oracle:sd.search.strong',
    purpose: 'REQUIRED',
  },
  {
    table: 'sd.room.contents',
    min: 11,
    target: 'oracle:sd.yesNo',
    purpose: 'REQUIRED',
    note: '함정·경비 등의 여부를 확인',
  },
  {
    table: 'sd.search.strong',
    min: 2,
    target: 'oracle:sd.usefulItems',
    purpose: 'AVAILABLE',
    note: '물건을 정하는 예시 표',
  },
  {
    table: 'depths.danger',
    min: 4,
    target: 'rule:sd.stockCommon',
    purpose: 'REQUIRED',
  },
  {
    table: 'aitc.city-crawl-failure',
    min: 1,
    target: 'oracle:aitc.npc-encounters',
    purpose: 'REQUIRED',
  },
  {
    table: 'aitc.city-crawl-failure',
    min: 3,
    target: 'oracle:aitc.hazards',
    purpose: 'REQUIRED',
  },
  {
    table: 'aitc.city-crawl-failure',
    min: 4,
    target: 'oracle:aitc.unexpected-events',
    purpose: 'REQUIRED',
  },
  {
    table: 'aitc.pray-failure',
    min: 1,
    target: 'oracle:core.arcaneCatastrophes',
    purpose: 'REQUIRED',
  },
];

const purposeFor = (edge: ResolvedRowRelationship): ResultPurpose =>
  edge.lookupRoll != null ||
  edge.entry.kind === 'rule' ||
  edge.entry.kind === 'book'
    ? 'CONTEXT'
    : 'AVAILABLE';
export const resultRelationshipKey = (edge: ResolvedRowRelationship) =>
  `${edge.lookupRoll == null ? edge.entry.id : edge.targetId}:${edge.lookupRoll ?? 'open'}`;

/** Exact row identity + attested source, never text/keyword similarity. */
export function rowResultRelationships(
  byId: Record<string, ReferenceEntry>,
  registry: OracleRegistry,
  row: Pick<OracleRoll, 'oracleId' | 'entryId' | 'metadata'> & {
    text?: string;
  },
  completedTableIds: readonly string[] = [],
): ResultRelationship[] {
  const table = registry.tables.find((t) => t.id === row.oracleId);
  const source = table?.entries.find((e) => e.id === row.entryId);
  const verified =
    !!table?.sourceVerified &&
    source?.metadata?.sourceStatus === 'VERIFIED' &&
    (row.text === undefined || row.text === source.text);
  const policies = verified
    ? RESULT_ROW_POLICIES.filter(
        (p) => p.table === table?.id && p.min === source?.min,
      )
    : [];
  const metadata = row.metadata ?? source?.metadata;
  const additions = policies.filter((p) => p.add).map((p) => p.target);
  const links = resolveRowRelationships(
    byId,
    {
      ...metadata,
      followUpReferenceIds: [
        ...(Array.isArray(metadata?.followUpReferenceIds)
          ? metadata.followUpReferenceIds
          : []),
        ...additions,
      ],
    },
    row.oracleId,
  );
  return links
    .filter((edge) => edge.entry.available)
    .map((edge) => {
      const policy = policies.find((p) => byId[p.target]?.id === edge.entry.id);
      const completed =
        edge.lookupRoll == null &&
        completedTableIds.includes(edge.targetId.replace(/^oracle:/, ''));
      return {
        ...edge,
        purpose: completed
          ? 'CONTEXT'
          : (policy?.purpose ??
            (verified && edge.kind === 'SUBTABLE'
              ? 'REQUIRED'
              : purposeFor(edge))),
        note: completed
          ? '이미 결과에 포함됨 · 표 참고'
          : (policy?.note ??
            (edge.lookupRoll != null
              ? '원문이 지정한 항목 · 추가 굴림 없음'
              : undefined)),
      };
    });
}

/** Known rule conditions are reminders; this UI never decides whether they occurred. */
const RULE_CONDITIONS: Record<string, readonly [string, string][]> = {
  'rule:core.violence': [
    [
      'rule:core.reaction-morale',
      '우두머리 사망 / 무리 절반 제거 / 단독 적 HP ⅓일 때 Morale 확인',
    ],
    ['rule:core.broken', 'PC가 정확히 0 HP일 때 Broken. 음수 HP는 사망.'],
    ['rule:core.crit-fumble', '공격·방어의 자연 20 또는 자연 1일 때'],
  ],
  'rule:core.reaction-morale': [
    ['oracle:core.reaction', '상대의 반응이 불분명할 때만'],
    ['oracle:core.failedMorale', '2d6이 상대의 Morale보다 클 때만'],
  ],
  'rule:core.broken': [['oracle:core.broken', 'PC가 정확히 0 HP일 때만 d4']],
};

/** Row edges win; generic Related and USES/USED BY remain in their existing section. */
export function readingResultRelationships(
  byId: Record<string, ReferenceEntry>,
  registry: OracleRegistry,
  reading?: ReferenceReading,
  referenceId?: string,
): ResultRelationship[] {
  if (!reading || !reading.blocks.some((b) => b.text)) return [];
  const current = byId[referenceId ?? ''];
  const rolls = reading.oracle?.rolls ?? [];
  const completed = rolls.map((r) => r.oracleId);
  const results: ResultRelationship[] = rolls.flatMap((row) =>
    rowResultRelationships(byId, registry, row, completed).map((edge) => ({
      ...edge,
      rowLabel: rolls.length > 1 ? `${row.title} · #${row.roll}` : undefined,
    })),
  );
  // Definitions and fixed readings can retain row identity without OracleResult.
  if (!rolls.length) {
    for (const ref of reading.sourceRefs) {
      if (!ref.tableId || !ref.entryId) continue;
      results.push(
        ...rowResultRelationships(byId, registry, {
          oracleId: ref.tableId,
          entryId: ref.entryId,
        }),
      );
    }
  }
  const append = (id: string, note?: string, purpose?: ResultPurpose) => {
    const entry = byId[id];
    if (!entry?.available || entry.id === current?.id || entry.kind === 'book')
      return;
    results.push({
      entry,
      targetId: id,
      origin: 'reading',
      origins: ['reading'],
      purpose: purpose ?? (entry.kind === 'rule' ? 'CONTEXT' : 'AVAILABLE'),
      note,
    });
  };
  for (const [id, condition] of RULE_CONDITIONS[referenceId ?? ''] ?? [])
    append(id, condition, 'AVAILABLE');
  if (
    current?.kind === 'creature' ||
    reading.blocks.some((b) => b.kind === 'creature')
  ) {
    append('oracle:core.reaction', '상대의 반응이 불분명할 때만', 'AVAILABLE');
    append(
      'rule:core.reaction-morale',
      '우두머리 사망 / 무리 절반 제거 / 단독 적 HP ⅓일 때 Morale 확인',
      'AVAILABLE',
    );
  }
  for (const edge of resolveRowRelationships(
    byId,
    { fixedLookups: reading.fixedLookups },
    undefined,
    referenceId,
  ))
    results.push({
      ...edge,
      purpose: 'CONTEXT',
      note: '원문이 지정한 항목 · 추가 굴림 없음',
    });
  // Oracle snapshots' relatedIds duplicate their source rows and lose selector semantics.
  if (!reading.oracle) for (const id of reading.relatedIds ?? []) append(id);
  for (const id of current?.definition?.nextReferenceIds ?? []) append(id);
  const unique = new Map<string, ResultRelationship>();
  for (const edge of results)
    if (!unique.has(resultRelationshipKey(edge)))
      unique.set(resultRelationshipKey(edge), edge);
  const fixed = new Set(
    [...unique.values()]
      .filter((e) => e.lookupRoll != null)
      .map((e) => e.entry.id),
  );
  return [...unique.values()].filter(
    (e) => e.lookupRoll != null || !fixed.has(e.entry.id),
  );
}
