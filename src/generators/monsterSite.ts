import type { Monster } from '../domain/types';
import type { GeneratedValueProvenance } from '../domain/generationProvenance';
import {
  MONSTER_SITE_URL,
  rollMonsterSite,
  type MonsterSitePack,
  type MonsterSitePrevious,
} from '../domain/monsterSitePack';
import { id, now, random, type RandomSource } from './random';

const provenance = (text: string): GeneratedValueProvenance => ({
  classification: 'APP_DERIVED',
  origin: 'source',
  status: 'PARTIAL',
  sourceRefs: [
    {
      bookTitle: 'The Monster Approaches',
      tableTitle: 'The Monster Approaches',
      note: MONSTER_SITE_URL,
    },
  ],
  sourceText: text ? [text] : [],
  transformation:
    'Private Monster Approaches snapshot rendered in the campaign sheet. Not a rulebook page.',
  procedureId: 'monster-site',
  authority: [
    {
      kind: 'APP_POLICY',
      id: 'private-monster-site',
      description: 'Explicit private-host snapshot of monster.makedatanotlore.dev.',
    },
  ],
});

export function monsterSitePrevious(monster: Monster): MonsterSitePrevious {
  const source = monster.sources ?? {};
  const read = (key: keyof MonsterSitePrevious) => source[`site.${key}`] || undefined;
  return {
    tableA: read('tableA'),
    tableB: read('tableB'),
    tableC: read('tableC'),
    want: read('want'),
    lair: read('lair'),
    ability: read('ability'),
    loot: read('loot'),
    armor: read('armor'),
  };
}

export function generateMonsterSite(
  campaignId: string,
  pack: MonsterSitePack,
  previous?: MonsterSitePrevious,
  rng: RandomSource = random,
): Monster {
  const rolled = rollMonsterSite(pack, rng, previous);
  const time = now();
  const stamp = provenance(rolled.introduction);
  return {
    id: id(),
    campaignId,
    name: rolled.name,
    notes: '',
    createdAt: time,
    updatedAt: time,
    concept: 'The Monster Approaches',
    appearance: rolled.introduction,
    behavior: '',
    wants: rolled.want,
    hp: rolled.hp,
    morale: rolled.morale,
    armor: rolled.armor,
    attacks: [
      {
        id: id(),
        name: rolled.attack,
        damage: rolled.damage,
        description: '',
        fieldProvenance: { name: provenance(rolled.attack) },
      },
    ],
    special: rolled.ability
      ? [{ id: id(), text: rolled.ability, source: pack.source.attribution, provenance: provenance(rolled.ability) }]
      : [],
    weakness: [],
    weirdTrait: '',
    loot: rolled.loot
      ? [{ id: id(), text: rolled.loot, source: pack.source.attribution, provenance: provenance(rolled.loot) }]
      : [],
    description: rolled.lair,
    sources: {
      name: pack.source.attribution,
      appearance: pack.source.attribution,
      ...Object.fromEntries(
        Object.entries(rolled.previous).map(([key, value]) => [`site.${key}`, value]),
      ),
    },
    fieldProvenance: {
      name: provenance(rolled.name),
      appearance: stamp,
      wants: provenance(rolled.want),
      armor: provenance(rolled.armor),
      description: provenance(rolled.lair),
    },
    generation: { system: 'monster-site', rolls: rolled.rolls },
  };
}
