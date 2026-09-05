import { PLAY_REFERENCE_RULES } from './playReferenceRules';
import { findVerifiedReferenceAlias } from './referenceAliases';
import type { SourceConfidence } from './referenceSources';
import type { OracleDefinition, OracleRegistry, OracleRoll } from './oracle';
import type { RegionId, SourceReference } from './types';
import type { RulesPack } from '../storage/rulesStore';
import { regions } from '../data/regions';
import {
  oracleLibraryId,
  oracleLibraryRollIds,
  oracleLibraryTitle,
} from '../data/oracles/library';
import { rollOracle } from '../generators/oracleRoller';
import { random, rollDie, type RandomSource } from '../generators/random';

export type ReferenceKind =
  | 'oracle'
  | 'procedure'
  | 'rule'
  | 'region'
  | 'book'
  | 'creature';
export type ReferenceContext =
  | 'room'
  | 'monster'
  | 'npc'
  | 'dungeon'
  | 'travel'
  | 'city'
  | 'character';
export type ReferenceAction =
  | { kind: 'oracle'; oracleIds: string[] }
  | { kind: 'procedure'; procedureId: string }
  | { kind: 'rule'; ruleId: string }
  | { kind: 'regional-monster'; region: RegionId }
  | { kind: 'creature'; creatureId: string }
  | { kind: 'city' }
  | { kind: 'region'; region: RegionId };
export interface ReferenceSourceStep {
  label: string;
  source: SourceReference;
  via?: string;
  role?: 'primary' | 'routing';
  confidence?: SourceConfidence;
}
export interface ReferenceEntry {
  id: string;
  kind: ReferenceKind;
  title: string;
  summary: string;
  keywords: string[];
  contexts: ReferenceContext[];
  regionIds: RegionId[];
  sourceRefs: SourceReference[];
  sourceChain: ReferenceSourceStep[];
  relatedIds: string[];
  canonicalIds: string[];
  available: boolean;
  action: ReferenceAction | null;
}
export interface ReferenceRegistry {
  entries: ReferenceEntry[];
  byId: Record<string, ReferenceEntry>;
}
export const REGION_TABLE_KEYS: Partial<Record<RegionId, string>> = {
  galgenbeck: 'tveland',
  sarkash: 'sarkash',
  'graven-tosk': 'graven_tosk',
  kergus: 'kergus',
  wastland: 'wastland',
  'valley-undead': 'valley_unfortunate_undead',
};
export const regionTableId = (region: RegionId, suffix: string) =>
  REGION_TABLE_KEYS[region]
    ? `depths.region.${REGION_TABLE_KEYS[region]}.${suffix}`
    : null;
const unique = <T>(values: T[]) => [...new Set(values)];
const stringValue = (value: unknown): string =>
  typeof value === 'string' ? value : '';
const fold = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .normalize('NFC')
    .toLocaleLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
const eligibleCreature = (record: Record<string, unknown>) =>
  typeof record.name === 'string' &&
  !!record.name.trim() &&
  typeof record.hp === 'number' &&
  Number.isFinite(record.hp) &&
  record.presetEligible !== false;
/** Stable source identity; it is independent of campaign UUIDs and load order. */
export function creatureReferenceId(record: Record<string, unknown>): string {
  const page =
    typeof record.pdfPage === 'number' && Number.isFinite(record.pdfPage)
      ? String(record.pdfPage)
      : 'unpaged';
  const sourceId =
    typeof record.id === 'string' && record.id
      ? record.id
      : `${page}:${fold(stringValue(record.name)).replace(/ /g, '-')}`;
  return `creature:${stringValue(record.book) || 'unknown'}:${sourceId}`;
}
export function findReferenceCreature(
  rules: RulesPack | null,
  creatureId: string,
): Record<string, unknown> | null {
  const matches = (rules?.creatures ?? []).filter(
    (record) =>
      eligibleCreature(record) && creatureReferenceId(record) === creatureId,
  );
  return matches.length === 1 ? matches[0] : null;
}
const regionIdsFor = (id: string): RegionId[] =>
  regions
    .filter(
      (r) =>
        REGION_TABLE_KEYS[r.id] &&
        id.startsWith(`depths.region.${REGION_TABLE_KEYS[r.id]}.`),
    )
    .map((r) => r.id);
function sourceFor(
  table: OracleDefinition,
  registry: OracleRegistry,
): SourceReference {
  return {
    bookId: table.sourceBookId,
    bookTitle: registry.books.find((b) => b.id === table.sourceBookId)?.title,
    tableId: table.canonicalTableId ?? table.id,
    tableTitle: table.title,
    pdfPage: table.sourcePage,
    printedPage: table.printedPage,
    note: table.sourceNote,
  };
}
function contextsFor(table: OracleDefinition): ReferenceContext[] {
  const id = table.id.toLowerCase();
  if (/^(aitc|aic|city)\.|alone.*crowd/.test(id)) return ['city'];
  if (/morale/.test(id)) return ['monster'];
  const byCategory: Partial<
    Record<OracleDefinition['category'], ReferenceContext[]>
  > = {
    ROOM: ['room', 'dungeon'],
    DUNGEON: ['dungeon'],
    MONSTER: ['monster'],
    NPC: ['npc'],
    REACTION: ['npc', 'monster'],
    ENCOUNTER: ['dungeon', 'travel'],
    WEATHER: ['travel'],
    TREASURE: ['room', 'dungeon'],
    LOCATION: ['travel'],
  };
  if (id.endsWith('.npc_professions')) return ['npc'];
  if (id.endsWith('.monsters')) return ['monster', 'travel'];
  if (/feretory\.(road|forage|campsite|leaveroad|village)/.test(id))
    return ['travel'];
  if (
    /core\.(broken|gettingbetter|badhabits|troublingtales|gear|armor|weapons|omens)/.test(
      id,
    )
  )
    return ['character'];
  return byCategory[table.category] ?? [];
}
const defaultEntry = (
  id: string,
  kind: ReferenceKind,
  title: string,
): ReferenceEntry => ({
  id,
  kind,
  title,
  summary: '',
  keywords: [],
  contexts: [],
  regionIds: [],
  sourceRefs: [],
  sourceChain: [],
  relatedIds: [],
  canonicalIds: [],
  available: true,
  action: null,
});
interface RuleSeed {
  id: string;
  title: string;
  summary: string;
  book: string;
  pages: number[];
  contexts: ReferenceContext[];
  oracles?: string[];
  printedPage?: number | string;
  seeFullRule?: boolean;
}
/** Concise navigation summaries; the source tables remain the only copy of their results. */
const RULES: RuleSeed[] = [
  {
    id: 'core.rest',
    title: 'Rest · 휴식',
    summary:
      '짧은 휴식 d4 HP, 밤잠 d6 HP. 음식이나 물이 없으면 회복하지 못합니다. 이틀 굶은 뒤에는 매일 d4 HP를 잃고, 감염 중에는 회복 대신 매일 d6 HP를 잃습니다.',
    book: 'core',
    pages: [31],
    contexts: ['character', 'travel'],
  },
  {
    id: 'core.reaction-morale',
    title: 'Reaction / Morale · 반응과 사기',
    summary:
      '반응이 불분명하면 2d6 Reaction. 지도자 사망·절반 제거·단독 적 HP 1/3에서 사기를 확인합니다. 2d6이 Morale보다 높으면 실패: d6 1–3 도주, 4–6 항복.',
    book: 'core',
    pages: [32],
    contexts: ['monster', 'npc'],
    oracles: ['core.reaction', 'core.failedMorale'],
  },
  {
    id: 'core.broken',
    title: 'Broken / Death · 무력화와 죽음',
    summary:
      'HP가 정확히 0이면 Broken 표를 굴립니다. HP가 음수이면 사망합니다.',
    book: 'core',
    pages: [29],
    contexts: ['character', 'monster'],
    oracles: ['core.broken', 'core.brokenInjury'],
  },
  {
    id: 'core.omens',
    title: 'Omens / Powers · 징조와 권능',
    summary:
      '선택 규칙 Omens: 모두 소진한 뒤 6시간 이상 쉬어 직업 주사위만큼 회복합니다(Classless d2). 권능 사용 횟수는 매아침 Presence + d4입니다.',
    book: 'core',
    pages: [34, 37],
    contexts: ['character'],
  },
  {
    id: 'core.improvement',
    title: 'Getting Better · 성장',
    summary:
      'GM이 성장 시점을 정합니다. 6d10이 최대 HP 이상이면 최대 HP +d6. 능력치마다 d6: 1이면 −1, 그 외 능력치 이상이면 +1, 미만이면 −1(범위 −3~+6). 발견물은 별도 표를 굴립니다.',
    book: 'core',
    pages: [33],
    contexts: ['character'],
    oracles: ['core.gettingBetterDebris'],
  },
  {
    id: 'core.miseries',
    title: 'Calendar of Nechrubel · 재앙',
    summary:
      '그룹이 d100·d20·d10·d6·d2 중 종말 주사위를 정합니다. 새벽에 1이 나오면 중복 없이 d66 Misery를 정합니다. 일곱 번째는 7:7, 세계와 캠페인의 끝입니다.',
    book: 'core',
    pages: [17, 18, 19, 20],
    contexts: ['travel'],
    oracles: ['core.miseries'],
  },
  {
    id: 'feretory.monster-approaches',
    title: 'The Monster Approaches',
    summary:
      'A/B/C 세 굴림으로 외형과 능력치를 함께 정합니다. 지역별 Eat Prey Kill 표와는 별개입니다.',
    book: 'feretory',
    pages: [2, 3],
    contexts: ['monster'],
    oracles: [
      'feretory.A',
      'feretory.B',
      'feretory.C',
      'feretory.desire',
      'feretory.trait',
    ],
  },
  {
    id: 'feretory.eat-prey-kill',
    title: 'Eat Prey Kill · 사냥과 지역 생물',
    summary:
      '지역별 사냥 표와 생물 원문. Sölitary Depths의 지역 몬스터 표에서 이 자료를 인용하는 결과만 연결합니다.',
    book: 'feretory',
    pages: [11, 12, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
    contexts: ['monster', 'travel'],
    oracles: ['feretory.huntingMishaps', 'feretory.bellyOfBeast'],
  },
  {
    id: 'feretory.roads',
    title: 'Roads to Damnation · 길과 여행',
    summary:
      '길 상태·일일 사건·보급·야영을 선택하여 굴립니다. 지역 이름만으로 이동 시간을 만들어내지 않습니다.',
    book: 'feretory',
    pages: [6, 7, 8, 9],
    contexts: ['travel'],
    oracles: [
      'feretory.roadType',
      'feretory.roadEvent',
      'feretory.forage',
      'feretory.campsite',
      'feretory.leaveRoad',
    ],
  },
  {
    id: 'sd.dungeonCrawling',
    title: 'Dungeon Crawling · 던전 탐색',
    summary:
      '각 방에서 두 d20 + 발견한 Special Room 수를 Dungeon DR과 각각 비교합니다. Strong은 다음 Special Room, 네 번째가 절정이며 이후 Strong은 Weak로 처리합니다. Weak는 일반 방. Fail의 위험을 해결한 뒤 방을 만듭니다.',
    book: 'sd',
    pages: [9, 19],
    contexts: ['dungeon', 'room'],
    oracles: [
      'sd.room.adjective',
      'sd.room.type',
      'sd.room.exits',
      'sd.room.contents',
    ],
  },
  {
    id: 'sd.stockCommon',
    title: 'Common Encounters · 일반 조우 준비',
    summary:
      'SD의 예시는 일반 조우 여섯 칸을 Stock Creatures d12로 준비합니다. Depths PDF 24 / p. 21은 해당 지역 Monsters d6를 대안으로 제시합니다.',
    book: 'sd',
    pages: [19],
    contexts: ['dungeon', 'monster'],
    oracles: ['sd.stockCreatures'],
  },
  {
    id: 'sd.stockRare',
    title: 'Rare Encounters · 희귀 조우 준비',
    summary:
      'Stock Creatures에 d8 + Dungeon DR. 표를 넘는 결과의 처리 규칙은 원문에 명시되어 있지 않습니다.',
    book: 'sd',
    pages: [19],
    contexts: ['dungeon', 'monster'],
    oracles: ['sd.stockCreatures', 'depths.rare.look', 'depths.rare.feature'],
  },
  {
    id: 'sd.npc',
    title: 'NPC Description · 인물의 단서',
    summary:
      'Disposition과 Profession을 조합합니다. 지역별 직업 표는 Profession의 대안이며 능력치를 자동으로 정하지 않습니다.',
    book: 'sd',
    pages: [14],
    contexts: ['npc'],
    oracles: ['sd.npc.disposition', 'sd.npc.profession'],
  },
  {
    id: 'sd.solo-variant',
    title: 'Sölitary Defilement · 선택적 솔로 변형',
    summary:
      '2d20 결과 해석과 솔로용 징조·Misery 변형은 이 책의 별도 규칙입니다. Core Calendar와 조용히 섞지 않습니다.',
    book: 'sd',
    pages: [4, 5],
    contexts: ['character', 'travel'],
  },
  {
    id: 'depths.rareMonster',
    title: 'Rare Monster · 카드 기반 생성',
    summary:
      '카드 순위·문양 조합을 사용하는 원문 참조입니다. 주사위 표로 바꾸어 굴리지 않습니다.',
    book: 'depths',
    pages: [16, 17, 18, 19, 20, 21],
    contexts: ['monster'],
    oracles: [
      'depths.rare.look',
      'depths.rare.feature',
      'depths.rare.intention',
      'depths.rare.special',
    ],
  },
];
export function buildReferenceRegistry(
  oracles: OracleRegistry,
  rules: RulesPack | null = null,
  additions: ReferenceEntry[] = [],
): ReferenceRegistry {
  const entries: ReferenceEntry[] = [],
    byId: Record<string, ReferenceEntry> = {};
  const add = (entry: ReferenceEntry) => {
    if (!byId[entry.id]) {
      entries.push(entry);
      byId[entry.id] = entry;
    }
  };
  const canonicalId = (id: string) =>
    oracles.tables.find((table) => table.id === id)?.canonicalTableId ?? id;
  // The original table owns its display and provenance even when an alias arrives first.
  const sourceTables = [...oracles.tables].sort(
    (a, b) =>
      Number(a.id !== (a.canonicalTableId ?? a.id)) -
      Number(b.id !== (b.canonicalTableId ?? b.id)),
  );
  for (const table of sourceTables) {
    const canonical = table.canonicalTableId ?? table.id,
      id = `oracle:${oracleLibraryId(canonical)}`;
    if (byId[id]) {
      byId[id].keywords = unique([
        ...byId[id].keywords,
        table.id,
        ...table.tags,
      ]);
      byId[`oracle:${table.id}`] = byId[id];
      byId[`oracle:${canonical}`] = byId[id];
      continue;
    }
    const rollIds = oracleLibraryRollIds(canonical);
    const paired = rollIds.length > 1;
    const actionTables = paired
      ? rollIds.map((key) => oracles.tables.find((t) => t.id === key))
      : [table];
    const refs = actionTables
      .filter((t): t is OracleDefinition => !!t)
      .map((t) => sourceFor(t, oracles));
    const available = actionTables.every((t) => !!t?.sourceVerified);
    const rollable = actionTables.every((t) => !!t && t.rollable !== false);
    const regionIds = regionIdsFor(canonical);
    add({
      ...defaultEntry(id, 'oracle', oracleLibraryTitle(canonical, table.title)),
      summary:
        (paired
          ? '두 의미 표를 순서대로 굴려 하나의 답을 만듭니다.'
          : table.description) ??
        (table.rollable === false
          ? '원문의 조건·선택을 확인하는 참조 표입니다.'
          : `${table.originalDice ?? table.dice} · ${table.entries.length}개 결과`),
      canonicalIds: rollIds,
      keywords: unique([
        table.id,
        canonical,
        table.category,
        ...table.tags,
        ...regionIds.flatMap((r) => [r, regions.find((x) => x.id === r)!.name]),
      ]),
      contexts: contextsFor(table),
      regionIds,
      sourceRefs: refs,
      sourceChain: refs.map((source) => ({
        label: source.tableTitle ?? source.bookTitle ?? table.sourceBookId,
        source,
      })),
      relatedIds: [
        `book:${table.sourceBookId}`,
        ...regionIds.map((r) => `region:${r}`),
      ],
      available,
      action:
        rollable && available
          ? {
              kind: 'oracle',
              oracleIds: paired
                ? rollIds
                : [
                    oracles.tables.some((t) => t.id === canonical)
                      ? canonical
                      : table.id,
                  ],
            }
          : null,
    });
    byId[`oracle:${table.id}`] = byId[id];
    byId[`oracle:${canonical}`] = byId[id];
  }
  for (const procedure of oracles.procedures) {
    const tables = procedure.oracleIds.map((id) =>
      oracles.tables.find((t) => t.id === id),
    );
    const available = tables.every(
      (t) => t?.sourceVerified && t.rollable !== false,
    );
    const refs = tables
      .filter((t): t is OracleDefinition => !!t)
      .map((t) => sourceFor(t, oracles));
    add({
      ...defaultEntry(
        `procedure:${procedure.id}`,
        'procedure',
        procedure.title,
      ),
      summary:
        procedure.description ?? '연결된 원문 표를 지정된 순서대로 굴립니다.',
      canonicalIds: procedure.oracleIds.map(canonicalId),
      keywords: [procedure.id, ...procedure.oracleIds],
      contexts: unique(
        tables.filter((t): t is OracleDefinition => !!t).flatMap(contextsFor),
      ),
      sourceRefs: refs,
      sourceChain: refs.map((source) => ({
        label: source.tableTitle ?? '',
        source,
      })),
      relatedIds: unique(
        procedure.oracleIds.map((id) => `oracle:${canonicalId(id)}`),
      ),
      available,
      action: available
        ? { kind: 'procedure', procedureId: procedure.id }
        : null,
    });
  }
  for (const seed of [...RULES, ...PLAY_REFERENCE_RULES]) {
    const book = oracles.books.find((b) => b.id === seed.book),
      ref: SourceReference = {
        bookId: seed.book,
        bookTitle: book?.title ?? seed.book,
        tableTitle: seed.title,
        pdfPage: seed.pages,
        printedPage: seed.printedPage,
        ...(seed.seeFullRule
          ? {
              note: '짧은 판정 참조입니다. 예외와 후속 조건은 이 절의 원문을 확인하세요.',
            }
          : {}),
      };
    const sourceRefs = [ref];
    if (seed.id === 'sd.stockCommon')
      sourceRefs.push({
        bookId: 'depths',
        bookTitle:
          oracles.books.find((b) => b.id === 'depths')?.title ??
          'Sölitary Depths',
        tableTitle: 'Regional Common Encounters alternative',
        pdfPage: 24,
        printedPage: 21,
      });
    add({
      ...defaultEntry(`rule:${seed.id}`, 'rule', seed.title),
      summary: seed.summary,
      keywords: [seed.id, ...seed.contexts],
      contexts: seed.contexts,
      canonicalIds: seed.oracles ?? [],
      sourceRefs,
      sourceChain: sourceRefs.map((source) => ({
        label: source.tableTitle ?? seed.title,
        source,
      })),
      relatedIds: [
        `book:${seed.book}`,
        ...(seed.oracles ?? []).map((id) => `oracle:${id}`),
      ],
      available: !!book,
      action: { kind: 'rule', ruleId: seed.id },
    });
  }
  for (const record of (rules?.creatures ?? []).filter(eligibleCreature)) {
    const id = creatureReferenceId(record),
      bookId = stringValue(record.book),
      book = oracles.books.find((source) => source.id === bookId),
      name = stringValue(record.name),
      concept = typeof record.concept === 'string' ? record.concept : '';
    const aliases = Array.isArray(record.referenceAliases)
      ? record.referenceAliases.filter(
          (alias) =>
            alias && typeof alias === 'object' && alias.sourceVerified === true,
        )
      : [];
    const regionIds = unique(
      aliases.flatMap((alias) =>
        typeof alias.tableId === 'string' ? regionIdsFor(alias.tableId) : [],
      ),
    );
    const epkRegions: Record<string, RegionId> = {
      tveland: 'galgenbeck',
      sarkash: 'sarkash',
      gravenTosk: 'graven-tosk',
      grift: 'grift',
      kergus: 'kergus',
      wastland: 'wastland',
      valley: 'valley-undead',
    };
    if (
      bookId === 'feretory' &&
      record.section === 'Eat Prey Kill' &&
      typeof record.regionKey === 'string' &&
      epkRegions[record.regionKey]
    )
      regionIds.push(epkRegions[record.regionKey]);
    const ref: SourceReference = {
      bookId,
      bookTitle: book?.title ?? bookId,
      tableTitle: [stringValue(record.section), name, concept]
        .filter(Boolean)
        .join(' · '),
      pdfPage: typeof record.pdfPage === 'number' ? record.pdfPage : undefined,
      printedPage:
        typeof record.printedPage === 'number' ||
        typeof record.printedPage === 'string'
          ? record.printedPage
          : undefined,
      entryId: typeof record.id === 'string' ? record.id : id,
    };
    const available =
      !!book &&
      record.sourceVerified !== false &&
      !!(ref.pdfPage || ref.printedPage) &&
      findReferenceCreature(rules, id) === record;
    add({
      ...defaultEntry(
        id,
        'creature',
        concept && fold(concept) !== fold(name) ? `${name} · ${concept}` : name,
      ),
      summary:
        '제공된 책의 고정 능력치입니다. 생물의 원문 이름과 특수 규칙을 그대로 확인합니다.',
      keywords: unique([
        name,
        concept,
        stringValue(record.id),
        stringValue(record.section),
        'monster',
        'creature',
        ...aliases.map((alias) => stringValue(alias.name)),
        ...regionIds.flatMap((region) => [
          region,
          regions.find((r) => r.id === region)!.name,
        ]),
      ]),
      contexts:
        record.section === 'Outcasts' ? ['monster', 'npc'] : ['monster'],
      regionIds: unique(regionIds),
      sourceRefs: [ref],
      sourceChain: [{ label: ref.tableTitle ?? name, source: ref }],
      relatedIds: [
        'oracle:core.reaction',
        'rule:core.reaction-morale',
        'oracle:core.corpsePlundering',
        'oracle:core.treasures',
        `book:${bookId}`,
        ...regionIds.map((region) => `region:${region}`),
      ],
      available,
      action: available ? { kind: 'creature', creatureId: id } : null,
    });
  }
  const workbench = [
    {
      id: 'workbench.stock-room',
      title: 'Stock a Room · 조우 표 선택',
      contexts: ['room', 'dungeon'] as ReferenceContext[],
      summary:
        'Common: 지역 Monsters d6 또는 SD Stock Creatures d12. Rare: SD d8+DR. Room: RECLVSE roomEncounter. 변형을 직접 선택합니다.',
      ids: ['sd.stockCreatures', 'reclvse.roomEncounter'],
      related: ['rule:sd.stockCommon', 'rule:sd.stockRare'],
      next: ['procedure:workbench.npc', 'oracle:core.reaction'],
    },
    {
      id: 'workbench.npc',
      title: 'NPC · 단서 조합',
      contexts: ['npc'] as ReferenceContext[],
      summary:
        '기존 NPC 도구의 이름·성격·직업·외형·욕망·반응 조합입니다. 여러 책의 제안을 함께 굴린 도구이며 각 필드의 출처를 유지합니다.',
      ids: [
        'core.names',
        'sd.npc.disposition',
        'sd.npc.profession',
        'reclvse.npcPersonality',
        'reclvse.npcAppearance',
        'reclvse.npcMotivation',
        'core.reaction',
      ],
      related: ['rule:sd.npc'],
    },
    {
      id: 'workbench.epk',
      title: 'Eat Prey Kill · 지역 생물 원문 선택',
      contexts: ['monster', 'travel'] as ReferenceContext[],
      summary:
        '기존 EPK 지역 생물 풀에서 사용 가능한 프리셋 하나를 선택합니다. 사냥 절차의 공식 d6 굴림이나 Depths 지역 d6 표로 표시하지 않습니다.',
      ids: [],
      related: ['rule:feretory.eat-prey-kill'],
    },
  ];
  for (const tool of workbench) {
    const refs = [
      ...tool.ids.flatMap((id) => byId[`oracle:${id}`]?.sourceRefs ?? []),
      ...tool.related.flatMap((id) => byId[id]?.sourceRefs ?? []),
    ];
    const available =
      tool.id === 'workbench.epk'
        ? (rules?.creatures ?? []).some(
            (c) =>
              c.book === 'feretory' &&
              c.section === 'Eat Prey Kill' &&
              typeof c.hp === 'number' &&
              c.presetEligible !== false,
          )
        : tool.ids.every((id) => !!byId[`oracle:${id}`]?.available);
    add({
      ...defaultEntry(`procedure:${tool.id}`, 'procedure', tool.title),
      summary: tool.summary,
      keywords: [tool.id, ...tool.contexts],
      contexts: tool.contexts,
      canonicalIds: tool.ids,
      sourceRefs: refs,
      sourceChain: refs.map((source) => ({
        label: source.tableTitle ?? '',
        source,
      })),
      relatedIds: [
        ...(tool.next ?? []),
        ...tool.related,
        ...tool.ids.map((id) => `oracle:${id}`),
        ...(tool.id === 'workbench.stock-room'
          ? ['oracle:sd.usefulItems', 'oracle:core.treasures']
          : []),
      ],
      available,
      action: available ? { kind: 'procedure', procedureId: tool.id } : null,
    });
  }
  const cityTables = oracles.tables.filter(
    (t) => t.sourceBookId === 'aitc' || t.id.startsWith('aitc.'),
  );
  const cityAvailable =
    cityTables.length > 0 && cityTables.every((t) => t.sourceVerified);
  const citySource: SourceReference = {
    bookId: 'aitc',
    bookTitle: 'Alöne in the Crowd',
    tableTitle: 'Micro-Crawl / Dérive / City Crawl',
    pdfPage: [5, 6, 7, 8],
    printedPage: '3–6',
  };
  const cityRelated = [
    ...oracles.procedures
      .filter((p) => p.id.startsWith('aitc.'))
      .map((p) => `procedure:${p.id}`),
    ...cityTables.map((t) => `oracle:${t.canonicalTableId ?? t.id}`),
  ];
  for (const [id, kind, title] of [
    ['rule:city', 'rule', 'City Workbench · 도시를 걷기'],
    ['procedure:workbench.city', 'procedure', 'Alöne in the Crowd · 도시 도구'],
  ] as const)
    add({
      ...defaultEntry(id, kind, title),
      summary:
        'Micro-Crawl·Dérive·City Crawl 중 방식을 선택합니다. 목적지와 사건은 노트에 적고 필요한 판정과 도시 표만 굴립니다.',
      keywords: ['aitc', 'alone in the crowd', 'city', '도시', 'street'],
      contexts: ['city'],
      sourceRefs: [citySource],
      sourceChain: [{ label: 'Alöne in the Crowd', source: citySource }],
      relatedIds: [...cityRelated, 'rule:sd.solo-variant', 'book:aitc'],
      available: cityAvailable,
      action: cityAvailable ? { kind: 'city' } : null,
    });
  for (const region of regions) {
    const regional = entries.filter((e) => e.regionIds.includes(region.id));
    const tableId = regionTableId(region.id, 'monsters'),
      table = oracles.tables.find((t) => t.id === tableId),
      ref = table ? sourceFor(table, oracles) : null;
    const routeId = `rule:regional-monsters:${region.id}`;
    add({
      ...defaultEntry(routeId, 'rule', `${region.name} · Regional Monsters`),
      summary: table
        ? '지역 Monsters d6를 먼저 굴린 뒤, 그 결과에 인쇄된 책·페이지를 따라갑니다.'
        : '이 자료의 Sölitary Depths에는 전용 Grift Monsters 표가 없습니다. Eat Prey Kill의 Grift 사냥 표와 혼동하지 않습니다.',
      keywords: [
        region.id,
        region.name,
        'monster',
        'monsters',
        '몬스터',
        '지역',
        'encounter',
      ],
      contexts: ['monster', 'travel'],
      regionIds: [region.id],
      canonicalIds: tableId ? [tableId] : [],
      sourceRefs: ref ? [ref] : [],
      sourceChain: ref
        ? [
            {
              role: 'routing',
              confidence: 'verified',
              label: 'Sölitary Depths · regional Monsters',
              source: ref,
              via: 'printedCrossReference',
            },
          ]
        : [],
      relatedIds: [
        `region:${region.id}`,
        ...(tableId ? [`oracle:${tableId}`] : []),
        'rule:feretory.eat-prey-kill',
        'rule:core.reaction-morale',
      ],
      available: !!table?.sourceVerified && table.rollable !== false,
      action:
        table?.sourceVerified && table.rollable !== false
          ? { kind: 'regional-monster', region: region.id }
          : null,
    });
    add({
      ...defaultEntry(`region:${region.id}`, 'region', region.name),
      summary: region.description,
      keywords: [region.id, region.name, ...region.tags, 'region', '지역'],
      regionIds: [region.id],
      contexts: ['travel', 'dungeon', 'monster', 'npc'],
      sourceRefs: regional.flatMap((e) => e.sourceRefs).slice(0, 5),
      relatedIds: [
        routeId,
        ...regional.map((e) => e.id),
        'rule:feretory.roads',
      ],
      action: { kind: 'region', region: region.id },
    });
  }
  for (const book of oracles.books)
    add({
      ...defaultEntry(`book:${book.id}`, 'book', book.title),
      summary: (['oracle', 'procedure', 'rule', 'creature'] as const)
        .map((kind) => {
          const count = entries.filter(
            (e) =>
              e.kind === kind && e.sourceRefs.some((s) => s.bookId === book.id),
          ).length;
          return count ? `${kind.toUpperCase()} ${count}` : '';
        })
        .filter(Boolean)
        .join(' · '),
      keywords: [book.id, book.title],
      sourceRefs: [{ bookId: book.id, bookTitle: book.title }],
      relatedIds: entries
        .filter((e) => e.sourceRefs.some((s) => s.bookId === book.id))
        .map((e) => e.id),
    });
  for (const entry of additions) add(entry);
  // Book and procedure links expose only records that actually exist in this loaded pack.
  for (const entry of entries)
    entry.relatedIds = unique(
      entry.relatedIds
        .map((id) => byId[id]?.id ?? id)
        .filter((id) => id !== entry.id && !!byId[id]),
    );
  return { entries, byId };
}
const aliases: Record<string, string> = {
  몬스터: 'monster',
  괴물: 'monster',
  monsters: 'monster',
  creatures: 'monster',
  creature: 'monster',
  방: 'room',
  rooms: 'room',
  던전: 'dungeon',
  dungeons: 'dungeon',
  인물: 'npc',
  npcs: 'npc',
  여행: 'travel',
  도시: 'city',
  cities: 'city',
  규칙: 'rule',
  오라클: 'oracle',
  지역: 'region',
  사르카쉬: 'sarkash',
};
const tokens = (text: string) =>
  fold(text)
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => aliases[t] ?? t);
/** Only bare play intents receive these shortcuts; qualified source queries do not. */
const COMMON_REFERENCE_QUERIES: Record<string, string> = {
  morale: 'rule:core.reaction-morale',
  reaction: 'oracle:core.reaction',
  broken: 'rule:core.broken',
  'useful item': 'oracle:sd.usefulItems',
  'useful items': 'oracle:sd.usefulItems',
  npc: 'procedure:workbench.npc',
  'stock room': 'procedure:workbench.stock-room',
  'stock a room': 'procedure:workbench.stock-room',
};
export function searchReferences(
  registry: ReferenceRegistry,
  query: string,
  options: {
    kind?: ReferenceKind;
    context?: ReferenceContext;
    region?: RegionId;
    limit?: number;
  } = {},
): ReferenceEntry[] {
  const terms = unique(tokens(query));
  const phrase = tokens(query).join(' '),
    regionalIntent = regions.find((region) =>
      [region.id, region.name].some(
        (name) => tokens(`${name} monster`).join(' ') === phrase,
      ),
    ),
    preferredId =
      COMMON_REFERENCE_QUERIES[phrase] ??
      (regionalIntent
        ? `rule:regional-monsters:${regionalIntent.id}`
        : undefined);
  return registry.entries
    .filter(
      (e) =>
        (!options.kind || e.kind === options.kind) &&
        (!options.context || e.contexts.includes(options.context)) &&
        (!options.region || e.regionIds.includes(options.region)),
    )
    .map((entry) => {
      const title = tokens(entry.title),
        meta = tokens(
          [
            entry.id,
            entry.summary,
            ...entry.keywords,
            ...entry.contexts,
            ...entry.sourceRefs.flatMap((s) => [
              s.bookTitle ?? '',
              s.tableTitle ?? '',
            ]),
          ].join(' '),
        );
      if (
        !terms.every((term) =>
          [...title, ...meta].some(
            (word) => word === term || word.startsWith(term),
          ),
        )
      )
        return { entry, score: -1 };
      const score =
        terms.reduce((n, term) => n + (title.includes(term) ? 12 : 4), 0) +
        (phrase &&
        (title.join(' ') === phrase ||
          (entry.kind === 'creature' &&
            tokens(entry.title.split('·')[0]).join(' ') === phrase))
          ? 40
          : 0) +
        (entry.id === preferredId && entry.available && entry.action ? 80 : 0) +
        (entry.available ? 5 : 0) +
        (entry.action ? 3 : 0) +
        (entry.action?.kind === 'regional-monster' ? 5 : 0) +
        (entry.kind === 'book' ? -5 : 0);
      return { entry, score };
    })
    .filter((r) => r.score >= 0)
    .sort(
      (a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title),
    )
    .slice(0, Math.max(1, options.limit ?? 40))
    .map((r) => r.entry);
}
const CONTEXT_IDS: Record<ReferenceContext, string[]> = {
  room: [
    'procedure:workbench.stock-room',
    'procedure:sd.room-description',
    'oracle:sd.room.contents',
    'oracle:sd.room.exits',
    'procedure:sd.material',
    'procedure:sd.sound',
    'oracle:depths.traps.regular',
    'oracle:core.treasures',
  ],
  monster: [
    'rule:feretory.monster-approaches',
    'oracle:core.reaction',
    'oracle:core.failedMorale',
    'oracle:feretory.trait',
    'oracle:feretory.desire',
    'oracle:depths.enemyCombatModifiers',
    'rule:depths.rareMonster',
  ],
  npc: [
    'procedure:workbench.npc',
    'oracle:sd.npc.disposition',
    'oracle:sd.npc.profession',
    'oracle:reclvse.npcAppearance',
    'oracle:reclvse.npcMotivation',
    'oracle:core.reaction',
    'procedure:reclvse.action-theme',
  ],
  dungeon: [
    'oracle:core.sparks',
    'rule:sd.dungeonCrawling',
    'procedure:sd.room-description',
    'rule:sd.stockCommon',
    'oracle:depths.danger',
    'oracle:reclvse.dungeonEntrance',
  ],
  travel: [
    'oracle:core.weather',
    'oracle:feretory.roadType',
    'oracle:feretory.roadEvent',
    'oracle:feretory.forage',
    'oracle:feretory.campsite',
    'rule:feretory.roads',
  ],
  city: [
    'rule:city',
    'procedure:aitc.street',
    'procedure:workbench.city',
    'oracle:sd.crowdSizes',
    'oracle:sd.building.material',
    'oracle:sd.building.size',
    'oracle:sd.building.form',
    'oracle:sd.npc.profession',
  ],
  character: [
    'rule:core.rest',
    'rule:core.broken',
    'rule:core.omens',
    'rule:core.improvement',
    'oracle:core.reaction',
    'oracle:core.corpsePlundering',
  ],
};
export function contextReferences(
  registry: ReferenceRegistry,
  context: ReferenceContext,
  region?: RegionId,
  limit = 6,
): ReferenceEntry[] {
  const regional = region
    ? context === 'monster'
      ? [`rule:regional-monsters:${region}`]
      : context === 'npc'
        ? [`oracle:${regionTableId(region, 'npc_professions')}`]
        : context === 'dungeon'
          ? [`oracle:${regionTableId(region, 'feature')}`]
          : []
    : [];
  const ids = unique([...regional, ...CONTEXT_IDS[context]]);
  return ids
    .map((id) => registry.byId[id])
    .filter((e): e is ReferenceEntry => !!e && e.available)
    .slice(0, Math.max(1, Math.min(8, limit)));
}

const SEMANTIC_RELATED: Record<string, string[]> = {
  'oracle:core.reaction': [
    'rule:core.reaction-morale',
    'procedure:workbench.npc',
    'oracle:core.failedMorale',
  ],
  'rule:core.reaction-morale': [
    'oracle:core.reaction',
    'oracle:core.failedMorale',
    'rule:core.violence',
  ],
  'oracle:core.failedMorale': [
    'rule:core.reaction-morale',
    'oracle:core.reaction',
    'rule:core.violence',
    'rule:feretory.monster-approaches',
  ],
  'procedure:workbench.npc': [
    'oracle:core.reaction',
    'oracle:reclvse.npcMotivation',
    'rule:core.reaction-morale',
  ],
  'oracle:core.corpsePlundering': [
    'oracle:sd.usefulItems',
    'oracle:core.treasures',
  ],
  'rule:core.broken': [
    'rule:core.rest',
    'rule:core.violence',
    'rule:core.omens',
  ],
  'rule:core.rest': ['rule:core.broken', 'rule:core.powers'],
};
function semanticRelated(entry: ReferenceEntry): string[] {
  if (SEMANTIC_RELATED[entry.id]) return SEMANTIC_RELATED[entry.id];
  if (
    entry.action?.kind === 'regional-monster' ||
    entry.id === 'procedure:workbench.epk'
  )
    return [
      'rule:core.reaction-morale',
      'oracle:core.failedMorale',
      'oracle:core.reaction',
      'oracle:core.corpsePlundering',
      'oracle:core.treasures',
    ];
  return [];
}

export function relatedReferences(
  registry: ReferenceRegistry,
  id: string,
  limit = 6,
): ReferenceEntry[] {
  const entry = registry.byId[id];
  if (!entry) return [];
  const choices = unique([...semanticRelated(entry), ...entry.relatedIds]);
  return choices
    .filter((candidate) => candidate !== entry.id)
    .map((id) => registry.byId[id])
    .filter((e): e is ReferenceEntry => !!e)
    .sort(
      (a, b) =>
        Number(a.kind === 'book' || a.kind === 'region') -
          Number(b.kind === 'book' || b.kind === 'region') ||
        Number(b.available) - Number(a.available),
    )
    .slice(0, Math.max(1, Math.min(8, limit)));
}
export interface RegionalReferenceResult {
  region: RegionId;
  reading: OracleRoll;
  quantity: number | null;
  quantityRoll?: { dice: string; roll: number };
  preset: Record<string, unknown> | null;
  sourceChain: ReferenceSourceStep[];
  unresolved: boolean;
  reason?: string;
}
const creatureName = (name: string) =>
  name.normalize('NFC').trim().toLocaleLowerCase();
/** Follow this rolled entry's printed reference. Never substitute a random EPK regional pool. */
export function rollRegionalReference(
  region: RegionId,
  registry: OracleRegistry,
  rules: RulesPack | null,
  rng: RandomSource = random,
): RegionalReferenceResult {
  const tableId = regionTableId(region, 'monsters'),
    table = registry.tables.find((t) => t.id === tableId);
  if (
    !table ||
    !table.sourceVerified ||
    table.rollable === false ||
    table.dice !== 'd6'
  )
    throw new Error(
      '이 지역의 확인된 Sölitary Depths Monsters d6 표가 없습니다.',
    );
  const reading = rollOracle(table, registry, rng),
    metadata = reading.metadata ?? {};
  const printed =
    typeof metadata.printedCrossReference === 'string'
      ? metadata.printedCrossReference
      : '';
  const source = sourceFor(table, registry),
    sourceChain: ReferenceSourceStep[] = [
      {
        label: table.title,
        source: { ...source, roll: reading.roll, entryId: reading.entryId },
        via: printed || undefined,
      },
    ];
  const name = typeof metadata.name === 'string' ? metadata.name : '';
  let quantity: number | null =
      typeof metadata.fixedQuantity === 'number'
        ? metadata.fixedQuantity
        : null,
    quantityRoll: RegionalReferenceResult['quantityRoll'];
  const die =
    typeof metadata.quantityDice === 'string'
      ? /^d(\d+)$/.exec(metadata.quantityDice)
      : null;
  if (die) {
    quantity = rollDie(Number(die[1]), rng);
    quantityRoll = { dice: metadata.quantityDice as string, roll: quantity };
  }
  const bookId =
    /\bEPK\b/i.test(printed) && /feretory/i.test(printed)
      ? 'feretory'
      : /^Heretic\b/i.test(printed)
        ? 'heretic'
        : /^MB\b/i.test(printed)
          ? 'core'
          : null;
  const printedPage =
    Number(/(?:Feretory|Heretic|MB)\s*(?:p\.?\s*)?(\d+)/i.exec(printed)?.[1]) ||
    null;
  const referenceAlias = (candidate: Record<string, unknown>) => {
    const alias = findVerifiedReferenceAlias(candidate, {
      tableId: table.id,
      name,
      printedCrossReference: printed,
      bookId,
      printedPage,
    });
    // Evidence must still describe this exact target, including the target edition's page.
    if (
      alias?.evidence &&
      !alias.evidence.some(
        (evidence) =>
          evidence.bookId === candidate.book &&
          evidence.pdfPage === candidate.pdfPage &&
          (evidence.printedPage === undefined ||
            evidence.printedPage === candidate.printedPage),
      )
    )
      return undefined;
    return alias;
  };
  const candidates = (rules?.creatures ?? []).filter(eligibleCreature);
  const matches = candidates.filter(
    (candidate) =>
      referenceAlias(candidate) ||
      (candidate.book === bookId &&
        creatureName(candidate.name as string) === creatureName(name) &&
        (bookId === 'feretory'
          ? candidate.section === 'Eat Prey Kill' &&
            candidate.printedPage === printedPage
          : candidate.printedPage === printedPage ||
            (bookId === 'heretic' &&
              typeof candidate.pdfPage === 'number' &&
              candidate.pdfPage === Number(printedPage) + 2))),
  );
  const preset = matches.length === 1 ? matches[0] : null;
  const alias = preset ? referenceAlias(preset) : undefined;
  sourceChain[0].role = 'routing';
  sourceChain[0].confidence =
    alias?.category === 'citation-typo' ? 'conflicting-citation' : 'verified';
  if (alias?.category === 'citation-typo')
    sourceChain[0].source.note = alias.note;
  if (preset)
    sourceChain.push({
      role: 'primary',
      confidence: 'verified',
      label: String(preset.section ?? preset.context ?? preset.name),
      source: {
        bookId: String(preset.book),
        bookTitle: registry.books.find((b) => b.id === preset.book)?.title,
        pdfPage:
          typeof preset.pdfPage === 'number' ? preset.pdfPage : undefined,
        printedPage:
          typeof preset.printedPage === 'number' ||
          typeof preset.printedPage === 'string'
            ? preset.printedPage
            : printedPage,
        entryId: typeof preset.id === 'string' ? preset.id : null,
        tableTitle:
          stringValue(preset.section) ||
          stringValue(preset.context) ||
          stringValue(preset.name),
        note: typeof alias?.note === 'string' ? alias.note : printed,
      },
    });
  else if (printed)
    sourceChain.push({
      label: printed,
      role: 'primary',
      confidence: 'unavailable-source',
      source: {
        bookId: bookId ?? undefined,
        printedPage,
        note:
          typeof metadata.referenceNote === 'string'
            ? metadata.referenceNote
            : printed,
      },
    });
  return {
    region,
    reading,
    quantity,
    ...(quantityRoll ? { quantityRoll } : {}),
    preset,
    sourceChain,
    unresolved: !preset,
    ...(!preset
      ? {
          reason:
            typeof metadata.referenceNote === 'string'
              ? metadata.referenceNote
              : '인쇄된 참조에 정확히 대응하는 생물 원문을 찾지 못했습니다. 굴린 결과를 그대로 사용하고 참조를 확인하세요.',
        }
      : {}),
  };
}
