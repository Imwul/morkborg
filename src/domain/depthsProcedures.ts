import type { OracleRegistry, OracleDefinition, OracleEntry } from './oracle';
import type { ReferenceReading } from './referenceReading';
import type { SourceReference } from './types';
import { random, rollDie, type RandomSource } from '../generators/random';
import { appPolicy, sourceProcedure } from './generationAuthority';
import { rollOracle } from '../generators/oracleRoller';
import type { GeneratorProcedure } from './generationProvenance';

export const DEPTHS_GENERATOR_PROCEDURES: GeneratorProcedure[] = [
  {
    id: 'depths.rare-monster',
    title: 'Rare Monster · Five Cards',
    authority: 'SOURCE_PROCEDURE',
    sourceRefs: [
      {
        bookId: 'depths',
        pdfPage: [16, 17, 18, 19],
        printedPage: '13–16',
        status: 'VERIFIED',
      },
    ],
    steps: [
      {
        id: 'cards',
        count: 5,
        derived:
          'Draw five distinct playing cards from the shuffled deck, without replacement.',
      },
      {
        id: 'look',
        tableId: 'depths.rare.look',
        count: 1,
        dependsOn: ['cards'],
        derived: 'Card 1 rank; source permits next look if it does not fit.',
      },
      {
        id: 'feature',
        tableId: 'depths.rare.feature',
        count: 1,
        dependsOn: ['cards'],
        derived: 'Card 2 rank',
      },
      {
        id: 'intention',
        tableId: 'depths.rare.intention',
        count: 1,
        dependsOn: ['cards'],
        derived: 'Ordered suits of cards 1 and 2',
      },
      {
        id: 'hp-armor',
        count: 1,
        dependsOn: ['cards'],
        derived: 'Card 3: HP clamp 2–10; face −d4, even −d2, odd no armor.',
      },
      {
        id: 'morale',
        count: 1,
        dependsOn: ['cards'],
        derived: 'Card 4 value +5; 12+ never flees/surrenders.',
      },
      {
        id: 'attack',
        count: 1,
        dependsOn: ['cards'],
        derived: 'Card 5 value rounded up to d2/d4/d6/d8/d10.',
      },
      {
        id: 'special',
        tableId: 'depths.rare.special',
        count: 1,
        dependsOn: ['cards'],
        derived: 'Ordered suits of cards 3 and 4',
      },
      {
        id: 'sixth-card',
        count: 1,
        dependsOn: ['special'],
        condition: 'Cards 3 and 4 are both spades',
        derived: 'Draw a sixth card without replacement.',
      },
      {
        id: 'second-special',
        tableId: 'depths.rare.special',
        count: 1,
        dependsOn: ['sixth-card'],
        condition: 'Sixth card drawn',
        derived:
          'Use ordered suits of cards 5 and 6. Repeated double spades doubles HP and raises attack die one size.',
      },
    ],
  },
  {
    id: 'depths.encounter-level',
    title: 'Encounter Level',
    authority: 'SOURCE_PROCEDURE',
    sourceRefs: [
      {
        bookId: 'depths',
        pdfPage: [25, 26, 27, 28, 29, 30, 31, 32, 33],
        printedPage: '22–30',
        status: 'VERIFIED',
      },
    ],
    steps: [
      {
        id: 'region',
        tableId: 'depths.encounterLevels',
        count: 1,
        derived:
          'Choose marked region; otherwise closest or randomly one of two closest.',
      },
      {
        id: 'check',
        dice: 'd20',
        count: 1,
        dependsOn: ['region'],
        derived: 'Encounter if d20 ≤ regional Encounter Level',
      },
      {
        id: 'category',
        tableId: 'depths.travel.encounter',
        dice: 'd20',
        count: 1,
        dependsOn: ['check'],
        condition: 'Encounter occurs',
      },
    ],
  },
];

export const CARD_RANKS = [
  'A',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  'J',
  'Q',
  'K',
] as const;
export const CARD_SUITS = ['♣', '♦', '♥', '♠'] as const;
export interface PlayingCard {
  rank: (typeof CARD_RANKS)[number];
  suit: (typeof CARD_SUITS)[number];
}
export interface CardComponent {
  title: string;
  text: string;
  cards: number[];
  source: SourceReference;
  classification: 'SOURCE_VERBATIM' | 'APP_DERIVED';
}
export interface RareMonsterTrace {
  cards: PlayingCard[];
  remaining: PlayingCard[];
  components: CardComponent[];
  hp: number;
  armor: string;
  morale: number;
  damageDie: number;
  lookOffset: number;
}
export const cardValue = (card: PlayingCard) =>
  card.rank === 'A'
    ? 1
    : ['J', 'Q', 'K'].includes(card.rank)
      ? 10
      : Number(card.rank);
export const cardIdentity = (card: PlayingCard) => card.rank + card.suit;
export function shuffledDeck(rng: RandomSource = random): PlayingCard[] {
  const deck = CARD_SUITS.flatMap((suit) =>
    CARD_RANKS.map((rank) => ({ rank, suit })),
  );
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}
function table(registry: OracleRegistry, id: string) {
  const found = registry.tables.find(
    (t) => t.id === id && t.sourceVerified && t.sourceStatus === 'VERIFIED',
  );
  if (!found) throw new Error('SOURCE DATA UNAVAILABLE · ' + id);
  return found;
}
export function depthsSource(
  t: OracleDefinition,
  e?: OracleEntry,
): SourceReference {
  return {
    bookId: t.sourceBookId,
    bookTitle: 'Sölitary Depths',
    tableId: t.id,
    tableTitle: t.title,
    pdfPage:
      typeof e?.metadata?.pdfPage === 'number'
        ? e.metadata.pdfPage
        : t.sourcePage,
    printedPage:
      typeof e?.metadata?.printedPage === 'number'
        ? e.metadata.printedPage
        : t.printedPage,
    entryId: e?.id,
    status: 'VERIFIED',
  };
}
export function drawRareMonster(
  registry: OracleRegistry,
  remaining?: PlayingCard[],
  rng: RandomSource = random,
): ReferenceReading {
  const deck = remaining ? remaining.map((c) => ({ ...c })) : shuffledDeck(rng);
  if (deck.length < 5)
    throw new Error('덱에 카드가 부족합니다. 새 던전용 덱을 섞으세요.');
  if (
    new Set(deck.map(cardIdentity)).size !== deck.length ||
    deck.some(
      (c) => !CARD_RANKS.includes(c.rank) || !CARD_SUITS.includes(c.suit),
    )
  )
    throw new Error('Invalid playing-card deck');
  const cards = deck.splice(0, 5),
    components: CardComponent[] = [];
  const lookup = (
    id: string,
    selected: number[],
    field: 'rank' | 'symbols',
  ) => {
    const t = table(registry, id),
      selector =
        field === 'rank'
          ? cards[selected[0] - 1].rank
          : selected.map((n) => cards[n - 1].suit).join('');
    const e = t.entries.find((e) => e.metadata?.[field] === selector);
    if (!e) throw new Error('Missing card selector: ' + id + ' ' + selector);
    return { t, e };
  };
  for (const [title, id, selected, field] of [
    ['LOOK', 'depths.rare.look', [1], 'rank'],
    ['FEATURE', 'depths.rare.feature', [2], 'rank'],
    ['INTENTION', 'depths.rare.intention', [1, 2], 'symbols'],
  ] as const) {
    const { t, e } = lookup(id, [...selected], field);
    components.push({
      title,
      text: e.text,
      cards: [...selected],
      source: depthsSource(t, e),
      classification: 'SOURCE_VERBATIM',
    });
  }
  let hp = Math.max(2, cardValue(cards[2]));
  const armor = ['J', 'Q', 'K'].includes(cards[2].rank)
    ? '−d4'
    : cardValue(cards[2]) % 2 === 0
      ? '−d2'
      : 'No armor';
  const morale = cardValue(cards[3]) + 5;
  let damageDie = [2, 4, 6, 8, 10].find((n) => n >= cardValue(cards[4]))!;
  let special = lookup('depths.rare.special', [3, 4], 'symbols'),
    specialCards = [3, 4];
  const branchingRefs: SourceReference[] = [];
  if (special.e.metadata?.symbols === '♠♠') {
    if (!deck.length)
      throw new Error('♠♠ 후속 카드가 부족합니다. 새 던전용 덱을 섞으세요.');
    branchingRefs.push({
      ...depthsSource(special.t, special.e),
      note: 'Cards 3 + 4: ♠♠ → draw card 6; read cards 5 + 6.',
    });
    cards.push(deck.shift()!);
    specialCards = [5, 6];
    special = lookup('depths.rare.special', specialCards, 'symbols');
    if (special.e.metadata?.symbols === '♠♠') {
      hp *= 2;
      damageDie = damageDie === 10 ? 12 : damageDie + 2;
    }
  }
  const rules = table(registry, 'depths.playReferences'),
    procedure = rules.entries.find(
      (e) => e.metadata?.procedureId === 'depths.rare-monster',
    )!;
  const derivedSource = {
    ...depthsSource(rules, procedure),
    pdfPage: 18,
    printedPage: 15,
  };
  components.push(
    {
      title: 'HP / ARMOR',
      text: `HP ${hp} · ${armor}`,
      cards: [3],
      source: derivedSource,
      classification: 'APP_DERIVED',
    },
    {
      title: 'MORALE',
      text: morale >= 12 ? '— · never flees/surrenders' : String(morale),
      cards: [4],
      source: derivedSource,
      classification: 'APP_DERIVED',
    },
    {
      title: 'ATTACK',
      text: `d${damageDie}`,
      cards: [5],
      source: derivedSource,
      classification: 'APP_DERIVED',
    },
    {
      title: 'SPECIAL',
      text: special.e.text,
      cards: specialCards,
      source: depthsSource(special.t, special.e),
      classification: 'SOURCE_VERBATIM',
    },
  );
  if (branchingRefs.length && special.e.metadata?.symbols === '♠♠') {
    for (const c of components.filter((c) =>
      ['HP / ARMOR', 'ATTACK'].includes(c.title),
    )) {
      c.cards = [3, 4, 5, 6];
      c.source = {
        ...c.source,
        note: 'Repeated ♠♠: double HP and increase attack die one size (PDF19 / printed16).',
      };
    }
  }
  const trace: RareMonsterTrace = {
    cards,
    remaining: deck,
    components,
    hp,
    armor,
    morale,
    damageDie,
    lookOffset: 0,
  };
  return rareMonsterReading(
    trace,
    branchingRefs,
    depthsSource(rules, procedure),
  );
}
function rareMonsterReading(
  trace: RareMonsterTrace,
  extra: SourceReference[],
  procedure: SourceReference,
): ReferenceReading {
  const refs = [
    procedure,
    ...trace.components.map((c) => ({
      ...c.source,
      note: [
        c.source.note,
        `Card ${c.cards.join(' + ')}: ${c.cards.map((n) => cardIdentity(trace.cards[n - 1])).join(' / ')}`,
        c.classification,
      ]
        .filter(Boolean)
        .join(' · '),
    })),
    ...extra,
  ];
  return {
    title: 'Rare Monster · Five Cards',
    rareMonster: trace,
    blocks: [
      {
        title: trace.components[0].text + ' · ' + trace.components[1].text,
        text: `HP ${trace.hp} · Morale ${trace.morale >= 12 ? '—' : trace.morale} · ${trace.armor}\nAttack d${trace.damageDie}`,
      },
      ...trace.components
        .filter((c) => ['INTENTION', 'SPECIAL'].includes(c.title))
        .map((c) => ({ title: c.title, text: c.text })),
    ],
    sourceRefs: refs,
    authority: [
      sourceProcedure('depths.rare-monster', refs),
      appPolicy('app.card-session'),
    ],
    relatedIds: ['rule:core.reaction-morale', 'oracle:core.reaction'],
  };
}
/** Source explicitly permits the next look when the current form does not fit. Other cards stay intact. */
export function nextRareLook(
  reading: ReferenceReading,
  registry: OracleRegistry,
): ReferenceReading {
  if (!reading.rareMonster) return reading;
  const trace = structuredClone(reading.rareMonster),
    t = table(registry, 'depths.rare.look');
  const current = t.entries.findIndex(
    (e) => e.id === trace.components[0].source.entryId,
  );
  if (current >= t.entries.length - 1)
    throw new Error('원문에 마지막 Look 다음의 순환 규칙은 없습니다.');
  const e = t.entries[current + 1];
  trace.lookOffset++;
  trace.components[0] = {
    ...trace.components[0],
    text: e.text,
    source: {
      ...depthsSource(t, e),
      note: 'Source-permitted next look selected manually; original Card 1 retained.',
    },
  };
  return rareMonsterReading(
    trace,
    reading.sourceRefs.filter((s) => s.note?.startsWith('Cards 3 + 4')),
    reading.sourceRefs[0],
  );
}
export function encounterRegions(registry: OracleRegistry) {
  const t = registry.tables.find(
    (t) =>
      t.id === 'depths.encounterLevels' &&
      t.sourceVerified &&
      t.sourceStatus === 'VERIFIED',
  );
  return (
    t?.entries.map((e) => ({
      key: String(e.metadata?.regionKey),
      name: e.text,
      level: Number(e.metadata?.encounterLevel),
      source: depthsSource(t, e),
    })) ?? []
  );
}
const regionalIds: Record<string, string> = {
  tveland: 'galgenbeck',
  sarkash: 'sarkash',
  graven_tosk: 'graven-tosk',
  valley_unfortunate_undead: 'valley-undead',
  wastland: 'wastland',
  kergus: 'kergus',
};
export function checkEncounterLevel(
  registry: OracleRegistry,
  regionKey: string,
  rng: RandomSource = random,
): ReferenceReading {
  const region = encounterRegions(registry).find((r) => r.key === regionKey);
  if (!region) throw new Error('SOURCE DATA UNAVAILABLE · Encounter Level');
  const roll = rollDie(20, rng),
    encounter = roll <= region.level;
  const source: SourceReference = {
    bookId: 'depths',
    bookTitle: 'Sölitary Depths',
    pdfPage: 25,
    printedPage: 22,
    status: 'VERIFIED',
    tableTitle: 'Entering hex',
    roll,
  };
  const category = encounter
    ? rollOracle(table(registry, 'depths.travel.encounter'), registry, rng)
    : undefined;
  const next = category?.roll;
  const relatedIds = !category
    ? []
    : [
        ...([1, 2, 5, 8].includes(next!)
          ? [`rule:regional-monsters:${regionalIds[regionKey] ?? regionKey}`]
          : []),
        ...([3, 4, 5, 6, 7].includes(next!)
          ? [
              `oracle:depths.region.${regionKey}.npc_professions`,
              'oracle:sd.npc.disposition',
            ]
          : []),
        ...(next === 9 ? ['procedure:depths.rare-monster'] : []),
        ...['trait', 'feature', 'discovery'].map(
          (s) => `oracle:depths.region.${regionKey}.${s}`,
        ),
      ];
  return {
    title: `${region.name} · Encounter Level ${region.level}`,
    blocks: [
      {
        title: `d20 ${roll} ≤ ${region.level}`,
        text: encounter ? 'Encounter' : 'No encounter',
      },
      ...(category
        ? [
            { title: `Encounter · d20 ${category.roll}`, text: category.text },
            {
              title: 'NEXT',
              text:
                next === 8
                  ? 'Roll two regional monsters; monster reactions −3.'
                  : next === 6 || next === 7
                    ? 'Roll the printed NPC quantity; group shares one NPC type and one reaction roll.'
                    : next === 1 || next === 2 || next === 5
                      ? 'Monster reaction rolls −3.'
                      : '',
            },
          ].filter((b) => b.text)
        : []),
    ],
    sourceRefs: [
      source,
      region.source,
      ...(category
        ? [
            {
              ...depthsSource(table(registry, category.oracleId)),
              entryId: category.entryId,
              roll: category.roll,
            },
          ]
        : []),
    ],
    relatedIds,
    authority: [
      sourceProcedure('depths.encounter-level', [source, region.source]),
      appPolicy('app.result-grouping'),
    ],
  };
}
