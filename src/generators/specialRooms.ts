import type { Dungeon, DungeonRoom } from '../domain/types';
import { getCanonicalRuleTable } from '../data/oracles';
import { sourceCitation, type RuleEntry } from '../storage/rulesStore';
import { regionById } from '../data/regions';
import { sourceRegion } from './index';
import { regionWeightFactor } from './regionWeights';
import { id, weightedPick, random, type RandomSource } from './random';

const roles = ['변질된 경계', '금기의 흔적', '대가의 문턱', '심장부'];
function textOf(entry: RuleEntry, rng: RandomSource): string {
  const label =
    typeof entry.meta?.ko === 'string' && entry.meta.ko.trim().length
      ? entry.meta.ko
      : entry.text;
  const continuation = entry.followup?.length
    ? weightedPick(
        entry.followup.map((value) => ({ value, weight: value.weight })),
        rng,
      )
    : undefined;
  return label + (continuation ? ': ' + textOf(continuation, rng) : '');
}
function emptyRoom(): DungeonRoom {
  return {
    id: id(),
    kind: 'special',
    name: '',
    description: '',
    feature: '',
    danger: '',
    treasure: '',
    encounter: '',
    notes: '',
    monsterIds: [],
    npcIds: [],
    encounterIds: [],
    sources: {},
  };
}
function specialRoom(
  d: Dungeon,
  index: number,
  used: Set<string>,
  rng: RandomSource,
): DungeonRoom {
  const table = getCanonicalRuleTable('core.rooms');
  if (!table || table.entries.length < 8)
    throw new Error('Core Sample Rooms 원문 자료가 필요합니다.');
  const context = [
    d.title,
    d.formerPurpose,
    d.inhabitants,
    d.environmentalDanger,
  ]
    .join(' ')
    .toLowerCase();
  const details = [0, 1].map(() => {
    const candidates = table.entries
      .map((entry, i) => ({ entry, key: `core.rooms:${i}` }))
      .filter(
        (item) =>
          !used.has(item.key) &&
          (used.size % 2 === 0 || Number(item.entry.meta?.d4) >= 3),
      );
    const chosen = weightedPick(
      candidates.map((value) => {
        const words = (
          value.entry.text.toLowerCase().match(/[a-z]{4,}/g) ?? []
        ).filter(
          (word) =>
            ![
              'with',
              'full',
              'from',
              'that',
              'there',
              'their',
              'this',
              'have',
              'into',
              'everywhere',
            ].includes(word),
        );
        const theme = words.some((word) => context.includes(word)) ? 3 : 1;
        return {
          value,
          weight:
            value.entry.weight *
            theme *
            regionWeightFactor('core.rooms', value.entry.text, d.region),
        };
      }),
      rng,
    );
    used.add(chosen.key);
    return { ...chosen, text: textOf(chosen.entry, rng) };
  });
  const regionKey = sourceRegion[d.region];
  const localTable = regionKey ? `depths.region.${regionKey}.trait` : '';
  const regionalTable = localTable
    ? getCanonicalRuleTable(localTable)
    : undefined;
  const regionalEntry = regionalTable?.entries.length
    ? weightedPick(
        regionalTable.entries.map((value) => ({ value, weight: value.weight })),
        rng,
      )
    : undefined;
  const regional = regionalEntry
    ? {
        value: textOf(regionalEntry, rng),
        source: sourceCitation(localTable),
      }
    : null;
  const regionalTexture = regional
    ? String(regional.value)
    : regionById(d.region).description;
  const room = emptyRoom();
  const primary = details[1].entry.meta?.ko;
  const primaryName =
    typeof primary === 'string' && primary.trim().length
      ? primary
      : details[1].entry.text;
  room.name = `${roles[index]} · ${primaryName}`;
  room.description = details
    .map((item, lineIndex) => `단서 ${lineIndex + 1}: ${item.text}`)
    .join('\n\n');
  // Connecting prose is an editable application interpretation, never attributed as a printed result.
  const anchors = [
    d.distinctiveFeature || d.formerPurpose,
    d.inhabitants,
    d.environmentalDanger,
    d.premise || d.motive,
  ];
  const bindings = [
    `던전의 성격인 “${anchors[0]}”에 맞는 두 단서입니다.`,
    `“${anchors[1]}”의 기운이 여기에서 두드러집니다.`,
    `위험 신호는 “${anchors[2]}” 쪽으로 드러납니다.`,
    `이 방의 중심부는 “${anchors[3]}”의 결말로 이동합니다.`,
  ];
  room.feature = `${d.title} · ${regionById(d.region).name}\n지역의 흔적: ${regionalTexture}\n${bindings[index % bindings.length]}`;
  room.specialDetailIds = details.map((item) => item.key);
  room.sources = {
    name: '앱 해석 · 원문 방의 단서에서 이름 구성',
    description:
      sourceCitation('core.rooms') +
      ' · 서로 다른 단서 2개 · 준비된 네 방 전체에서 중복 제외',
    feature:
      (regional ? regional.source + ' · 지역의 흔적\n' : '') +
      '앱 해석 · 던전 제목·지역·성격을 묶은 특수 방 제안. 원문 규칙이 아니라 탐색용 요약입니다.',
  };
  return room;
}
export function prepareSpecialRooms(
  d: Dungeon,
  blank = false,
  rng: RandomSource = random,
): DungeonRoom[] {
  const used = new Set<string>();
  return Array.from({ length: 4 }, (_, index) => {
    if (!blank) return specialRoom(d, index, used, rng);
    return {
      ...emptyRoom(),
      name: `Special Room ${index + 1} · ${roles[index]}`,
    };
  });
}
export function rerollSpecialRoom(
  d: Dungeon,
  room: DungeonRoom,
  rng: RandomSource = random,
) {
  const specials = d.rooms.filter((item) => item.kind === 'special');
  const index =
    Math.max(
      0,
      specials.findIndex((item) => item.id === room.id),
    ) % 4;
  const used = new Set(
    d.rooms
      .filter((item) => item.id !== room.id)
      .flatMap((item) => item.specialDetailIds ?? []),
  );
  const replacement = specialRoom(d, index, used, rng);
  Object.assign(room, {
    name: replacement.name,
    description: replacement.description,
    feature: replacement.feature,
    sources: { ...room.sources, ...replacement.sources },
    kind: 'special',
    specialDetailIds: replacement.specialDetailIds,
  });
}
