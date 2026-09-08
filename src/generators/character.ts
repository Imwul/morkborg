import type {
  Character,
  CharacterItem,
  CharacterWeapon,
} from '../domain/types';
import {
  getRules,
  sourceCitation,
  type RuleEntry,
} from '../storage/rulesStore';
import { id, now, pick, rollDie, weightedPick } from './random';
import {
  editedProvenance,
  type GeneratedValueProvenance,
} from '../domain/generationProvenance';
import {
  provenanceForRuleEntry,
  rollCreatureTable,
} from './creatureProvenance';
import {
  abilityModifier,
  coreRule,
  entries as canonicalEntries,
  sampleEntry,
  scalarText,
  type RuleRoll,
} from './tables';

import {
  addCharacterBackground,
  applyClassCreation,
  characterClass,
  characterClasses,
  classArmorForbidden,
  classCharacterNameResult,
  classCitation,
  classOmenBonus,
  classOmenDie,
  rollCharacterTable,
  syncCharacterAttachments,
} from './characterClasses';

export const abilityKeys = [
  'strength',
  'agility',
  'presence',
  'toughness',
] as const;
export const characterLimits: Record<string, [number, number]> = {
  hp: [-999, 9999],
  maxHp: [1, 9999],
  strength: [-99, 99],
  agility: [-99, 99],
  presence: [-99, 99],
  toughness: [-99, 99],
  omens: [0, 999],
  silver: [0, 9999999],
  powerUses: [0, 999],
};
export const isClassless = (c: Partial<Character>) =>
  !c.className || c.className === 'Classless';
export const hasScroll = (c: Partial<Character>) =>
  (c.equipment ?? []).some((e) => /scroll/i.test(e.text));
const tableEntries = canonicalEntries;

function mechanicalProvenance(
  page: number,
  transformation: string,
  sourceText: string[] = [],
  dice?: string,
  values?: number[],
  c?: Partial<Character>,
): GeneratedValueProvenance {
  const def = c && characterClass(c);
  return {
    classification: 'APP_DERIVED',
    origin: 'source',
    status: 'VERIFIED',
    sourceRefs: [
      {
        bookId: 'core',
        pdfPage: page,
        printedPage: page,
        tableTitle: 'Character creation',
      },
      ...(def
        ? [
            {
              bookId: def.source.bookId,
              pdfPage: def.source.pdfPages,
              tableTitle: def.name,
            },
          ]
        : []),
    ],
    sourceText,
    transformation,
    procedureId: def ? `character.class:${def.id}` : 'character.core-classless',
    ...(dice && values
      ? {
          rolls: [
            {
              tableId: def
                ? `character.class:${def.id}`
                : 'character.core-classless',
              dice,
              value: values.reduce((a, b) => a + b, 0),
              diceValues: values,
            },
          ],
        }
      : {}),
  };
}
function resolveGear(
  entry: RuleEntry,
  presence: number,
  tableId: string,
): { text: string; provenance: GeneratedValueProvenance } {
  const provenance = provenanceForRuleEntry(tableId, entry);
  let text = entry.text.replace(/Presence\s*\+\s*(\d+)/g, (_, n: string) =>
    String(presence + Number(n)),
  );
  if (text !== entry.text) {
    provenance.classification = 'APP_DERIVED';
    provenance.transformation = `Presence ${presence} substituted into printed equipment quantities.`;
  }
  if (entry.meta.scrollTable) {
    const table = scalarText(entry.meta.scrollTable),
      scroll = rollCreatureTable('core.' + table);
    const effect = scalarText(scroll.result.metadata?.effect);
    return {
      text: `${table} scroll: ${scroll.value}${effect ? ` — ${effect}` : ''}`,
      provenance: {
        ...provenance,
        classification: 'SOURCE_COMPOSED',
        sourceRefs: [...provenance.sourceRefs, ...scroll.provenance.sourceRefs],
        sourceText: [entry.text, scroll.value, ...(effect ? [effect] : [])],
        rolls: [
          ...(provenance.rolls ?? []),
          ...(scroll.provenance.rolls ?? []),
        ],
        transformation:
          'Starting gear selects the printed sacred/unclean scroll table; name and effect kept together.',
      },
    };
  }
  if (entry.meta.quantity === 'd4') {
    const doses = rollDie(4);
    text = text.replace('d4 doses', `${doses} doses`);
    provenance.classification = 'APP_DERIVED';
    provenance.transformation = `Source d4 dose quantity replaced by ${doses}; other source words unchanged.`;
    provenance.rolls!.push({
      tableId,
      dice: 'd4',
      value: doses,
      diceValues: [doses],
    });
  }
  if (entry.meta.companion && typeof entry.meta.companion === 'object') {
    const companion = entry.meta.companion as {
      count: number | string;
      hp: string;
    };
    if (typeof companion.count !== 'number' && companion.count !== 'd4')
      throw new Error('SOURCE DATA UNAVAILABLE: companion quantity');
    const count =
      typeof companion.count === 'number' ? companion.count : rollDie(4);
    if (typeof companion.count !== 'number')
      provenance.rolls!.push({
        tableId,
        dice: 'd4',
        value: count,
        diceValues: [count],
      });
    const match = /^d(4|6)\+2$/.exec(companion.hp.replace(/\s/g, ''));
    if (!match)
      throw new Error('SOURCE DATA UNAVAILABLE: companion HP procedure');
    const hp = Array.from({ length: count }, () => {
      const value = rollDie(Number(match[1]));
      provenance.rolls!.push({
        tableId,
        dice: companion.hp,
        value: value + 2,
        diceValues: [value],
      });
      return value + 2;
    });
    provenance.classification = 'APP_DERIVED';
    provenance.transformation = `Printed companion quantity and HP: count ${count}; ${companion.hp} per creature. Attack remains the printed value.`;
    return {
      text: `${text} [${count} creature(s); HP: ${hp.join(', ')}]`,
      provenance,
    };
  }
  return { text, provenance };
}
// A gear-only reroll never changes another slot. New scrolls require compatible
// existing starting arms; unknown manually written arms are left untouched.
export function canAddStartingScroll(c: Partial<Character>): boolean {
  const def = characterClass(c);
  if (def?.forbidScrolls) return false;
  const maxArmor = classArmorForbidden(c)
    ? 0
    : Math.max(
        def?.armorDie != null ? def.armorDie - 1 : 1,
        def?.powerArmorMaxTier ?? 1,
      );
  const armorAllowed =
    !c.armor ||
    tableEntries('core.armor').some(
      (e) =>
        Number(e.meta.tier) <= maxArmor &&
        !def?.armorExcludedTiers?.includes(Number(e.meta.tier)) &&
        c.armor!.startsWith(e.text),
    );
  const allowedWeapons = tableEntries('core.weapons')
    .slice(0, def?.weaponDie ?? 6)
    .map((e) => e.text);
  return (
    armorAllowed &&
    (c.weapons ?? [])
      .filter((w) => !w.slot?.startsWith('feature:') && w.slot !== 'fangedBite')
      .every((w) =>
        allowedWeapons.some(
          (name) => w.text === name || w.text.startsWith(name + ';'),
        ),
      )
  );
}
export function rollEquipmentSlot(
  slot: string,
  c: Partial<Character>,
): CharacterItem {
  const base = { id: id(), slot };
  if (slot === 'waterskin')
    return {
      ...base,
      text: 'Waterskin',
      source: coreRule(21, '시작 장비'),
      provenance: {
        ...mechanicalProvenance(21, 'Capitalization only', ['waterskin']),
        classification: 'SOURCE_COMPOSED',
      },
    };
  if (slot === 'food') {
    const days = rollDie(4);
    return {
      ...base,
      text: `${days} days of food`,
      source: coreRule(21, 'd4 days of food'),
      provenance: mechanicalProvenance(
        21,
        `d4 days of food → ${days} days`,
        ['d4 days worth of food'],
        'd4',
        [days],
      ),
    };
  }
  const tableId =
    slot === 'container'
      ? 'core.containers'
      : slot === 'gearB'
        ? 'core.gearB'
        : 'core.gearA';
  const allowed = canAddStartingScroll(c);
  const entries = tableEntries(tableId).filter(
    (e) => allowed || !e.meta.scrollTable,
  );
  const entry = weightedPick(
    entries.map((value) => ({ value, weight: value.weight })),
  );
  return {
    ...base,
    tableId,
    ...resolveGear(entry, c.presence ?? 0, tableId),
    source:
      sourceCitation(tableId) +
      (entry.meta.scrollTable
        ? ` · ${sourceCitation('core.' + scalarText(entry.meta.scrollTable))}`
        : '') +
      (!allowed && tableId !== 'core.containers'
        ? ' · 현재 무기·방어구를 유지하기 위해 scroll 결과 제외'
        : ''),
  };
}
export function rollWeapon(c: Partial<Character>): CharacterWeapon {
  const sides = characterClass(c)?.weaponDie ?? (hasScroll(c) ? 6 : 10);
  const entry = tableEntries('core.weapons')[rollDie(sides) - 1];
  const ammo = scalarText(entry.meta.ammunition).replace(
    'Presence + 10',
    String((c.presence ?? 0) + 10),
  );
  return {
    id: id(),
    text: entry.text + (ammo ? `; ${ammo}` : ''),
    damage: scalarText(entry.meta.damage),
    tableId: 'core.weapons',
    slot: 'startingWeapon',
    provenance: provenanceForRuleEntry(
      'core.weapons',
      entry,
      ammo
        ? `Source weapon and ammunition; Presence ${c.presence ?? 0} + 10 arrows/bolts.`
        : 'none',
    ),
    source: coreRule(
      23,
      `시작 무기 d${sides}${hasScroll(c) ? ' · scroll 보유' : ''}`,
    ),
  };
}
export function rollArmor(c: Partial<Character>): RuleRoll {
  const def = characterClass(c);
  if (classArmorForbidden(c))
    return {
      value: 'No armor',
      source: def ? classCitation(def) + ' · 방어구 착용 불가' : 'No armor',
      provenance: mechanicalProvenance(
        23,
        'Class prohibits armor',
        ['No armor'],
        undefined,
        undefined,
        c,
      ),
    };
  const sides = def?.armorDie ?? (hasScroll(c) ? 2 : 4);
  const candidates = tableEntries('core.armor')
    .slice(0, sides)
    .filter((_, i) => !def?.armorExcludedTiers?.includes(i));
  const entry = pick(candidates);
  return {
    value: `${entry.text}${entry.meta.damageReduction ? ` −${scalarText(entry.meta.damageReduction)}` : ''}${Number(entry.meta.agilityDRPenalty) > 0 ? ` (Agility DR +${scalarText(entry.meta.agilityDRPenalty)}; defence DR +${scalarText(entry.meta.defenseDRPenalty)})` : ''}`,
    provenance: provenanceForRuleEntry(
      'core.armor',
      entry,
      'Printed armor identity, damage reduction and DR penalties displayed together.',
    ),
    source: coreRule(
      23,
      `시작 방어구 d${sides}${hasScroll(c) ? ' · scroll 보유' : ''}`,
    ),
  };
}
export function rollTrait(tableId = 'core.traits'): CharacterItem {
  const table = tableId === 'core.bodies' ? 'core.bodies' : 'core.traits';
  const entry = sampleEntry(table);
  return {
    id: id(),
    text: entry.text,
    tableId: table,
    source: sourceCitation(table),
    entryRoll: Number(entry.meta.roll),
    provenance: provenanceForRuleEntry(table, entry),
  };
}
export function characterFieldRoll(
  key: string,
  c: Partial<Character>,
): RuleRoll {
  const def = characterClass(c);
  if (key === 'name') {
    const name = def ? classCharacterNameResult(def) : null;
    return name ?? rollCreatureTable('core.names');
  }
  if (abilityKeys.includes(key as (typeof abilityKeys)[number])) {
    const dice = [rollDie(6), rollDie(6), rollDie(6)];
    const raw = dice.reduce((a, b) => a + b, 0),
      adjustment = def?.abilityRollAdjustments[key] ?? 0,
      modifier = def?.abilityModifierAdjustments[key] ?? 0;
    const value = abilityModifier(raw + adjustment) + modifier;
    return {
      value,
      source: def
        ? classCitation(def) +
          ` · 3d6${adjustment >= 0 ? '+' : ''}${adjustment} 변환${modifier ? ` 후 ${modifier}` : ''}`
        : coreRule(27, '3d6 능력치 변환'),
      provenance: mechanicalProvenance(
        27,
        `3d6 (${dice.join('+')}) + ${adjustment} → ability modifier + ${modifier} = ${value}`,
        [],
        '3d6',
        dice,
        c,
      ),
    };
  }
  if (key === 'hp' || key === 'maxHp') {
    const die = rollDie(def?.hpDie ?? 8),
      value = Math.max(1, (c.toughness ?? 0) + die);
    return {
      value,
      source: def
        ? classCitation(def) + ` · max(1, Toughness + d${def.hpDie})`
        : coreRule(29, 'max(1, Toughness + d8)'),
      provenance: mechanicalProvenance(
        29,
        `max(1, Toughness ${c.toughness ?? 0} + ${die}) = ${value}`,
        [],
        `d${def?.hpDie ?? 8}`,
        [die],
        c,
      ),
    };
  }
  if (key === 'omens') {
    const die = rollDie(classOmenDie(c)),
      bonus = classOmenBonus(c);
    return {
      value: die + bonus,
      source: def
        ? classCitation(def) + ` · d${classOmenDie(c)}+${bonus} Omens`
        : coreRule(37, 'Classless d2 Omens · 선택 규칙'),
      provenance: mechanicalProvenance(
        37,
        `d${classOmenDie(c)} (${die}) + ${bonus} Omens`,
        [],
        `d${classOmenDie(c)}`,
        [die],
        c,
      ),
    };
  }
  if (key === 'silver') {
    const count = def?.silver.count ?? 2,
      sides = def?.silver.sides ?? 6,
      multiplier = def?.silver.multiplier ?? 10;
    const dice = Array.from({ length: count }, () => rollDie(sides));
    return {
      value: dice.reduce((a, b) => a + b, 0) * multiplier,
      source: def
        ? classCitation(def) + ' · 시작 은화'
        : coreRule(21, '2d6 × 10 silver'),
      provenance: mechanicalProvenance(
        21,
        `${count}d${sides} (${dice.join('+')}) × ${multiplier} silver`,
        [],
        `${count}d${sides}`,
        dice,
        c,
      ),
    };
  }
  if (key === 'powerUses') {
    const die = rollDie(4),
      value = Math.max(0, (c.presence ?? 0) + die);
    return {
      value,
      source: coreRule(34, 'Presence+d4 Powers/day'),
      provenance: mechanicalProvenance(
        34,
        `max(0, Presence ${c.presence ?? 0} + d4 ${die}) = ${value}`,
        [],
        'd4',
        [die],
      ),
    };
  }
  if (key === 'armor') return rollArmor(c);
  if (key === 'archetype' || key === 'className')
    return {
      value: 'Classless',
      source: coreRule(21, '기본 캐릭터 · 선택 직업 없음'),
      provenance: mechanicalProvenance(
        21,
        'Neutral label for character without optional class.',
      ),
    };
  return { value: '', source: '직접 작성' };
}
export function updateCharacterHpFromToughness(c: Character): void {
  const die = c.generation?.rolls.hpDie;
  if (!die || !c.sources?.maxHp?.includes('Toughness')) return;
  const priorMax = c.maxHp;
  c.maxHp = Math.max(1, c.toughness + die);
  c.fieldProvenance = {
    ...c.fieldProvenance,
    maxHp: mechanicalProvenance(
      29,
      `max(1, Toughness ${c.toughness} + saved HP die ${die}) = ${c.maxHp}`,
      [],
      undefined,
      undefined,
      c,
    ),
  };
  if (c.hp === priorMax && c.sources.hp !== '직접 작성') c.hp = c.maxHp;
}
export function patchCharacterScalar(
  c: Character,
  key: string,
  input: string | number,
  source = '직접 작성',
): void {
  const limits = characterLimits[key];
  if (
    !limits &&
    !['name', 'className', 'armor', 'description', 'notes', 'status'].includes(
      key,
    )
  )
    return;
  let value: string | number = input;
  if (limits) {
    const number = Number(input);
    if (!Number.isFinite(number)) return;
    value = Math.max(limits[0], Math.min(limits[1], Math.trunc(number)));
  }
  if (key === 'status' && !['alive', 'dead'].includes(String(value))) return;
  Object.assign(c, { [key]: value });
  c.sources = { ...c.sources, [key]: source };
  if (source === '직접 작성')
    c.fieldProvenance = {
      ...c.fieldProvenance,
      [key]: editedProvenance(c.fieldProvenance?.[key]),
    };
  if (key === 'className') {
    c.classSource = source;
    if (characterClasses().find((d) => d.id === c.classId)?.name !== input)
      delete c.classId;
  }
  if (key === 'toughness' && (isClassless(c) || characterClass(c)))
    updateCharacterHpFromToughness(c);
}
export function rerollCharacterField(c: Character, key: string): void {
  const def = characterClass(c);
  if (!isClassless(c) && !def && key !== 'name') return;
  if (key === 'hp' || key === 'maxHp') {
    const die = rollDie(def?.hpDie ?? 8);
    c.generation = {
      ...c.generation,
      system: def ? `class:${def.id}` : 'core-classless',
      rolls: { ...c.generation?.rolls, hpDie: die },
    };
    c.maxHp = c.hp = Math.max(1, c.toughness + die);
    const provenance = mechanicalProvenance(
      29,
      `max(1, Toughness ${c.toughness} + d${def?.hpDie ?? 8} result ${die}) = ${c.maxHp}`,
      [],
      `d${def?.hpDie ?? 8}`,
      [die],
      c,
    );
    c.fieldProvenance = {
      ...c.fieldProvenance,
      maxHp: provenance,
      hp: structuredClone(provenance),
    };
    c.sources = {
      ...c.sources,
      hp: coreRule(29, '초기 HP = 최대 HP'),
      maxHp:
        (def ? classCitation(def) : coreRule(29, 'HP')) +
        ` · max(1, Toughness + d${def?.hpDie ?? 8}) · roll=${die}`,
    };
  } else {
    const result = characterFieldRoll(key, c);
    patchCharacterScalar(c, key, result.value, result.source);
    if (result.provenance)
      c.fieldProvenance = { ...c.fieldProvenance, [key]: result.provenance };
  }
}
export function generateCharacter(
  campaignId: string,
  blank = false,
  mode = 'classless',
): Character {
  const c: Character = {
    id: id(),
    campaignId,
    name: '',
    className: 'Classless',
    classSource: coreRule(21, '기본 캐릭터'),
    hp: 1,
    maxHp: 1,
    strength: 0,
    agility: 0,
    presence: 0,
    toughness: 0,
    omens: 0,
    silver: 0,
    armor: '',
    weapons: [],
    equipment: [],
    traits: [],
    background: [],
    classFeatures: [],
    description: '',
    status: 'alive',
    notes: '',
    createdAt: now(),
    updatedAt: now(),
    sources: {},
    generation: { system: 'core-classless', rolls: {} },
  };
  if (blank) return c;
  if (!getRules())
    throw new Error('SOURCE DATA UNAVAILABLE: character creation');
  c.fieldProvenance = {
    className: mechanicalProvenance(
      21,
      'Neutral label for character without optional class.',
    ),
  };
  const def =
    mode === 'random'
      ? pick(characterClasses())
      : characterClasses().find((d) => d.id === mode);
  if (mode !== 'classless' && !def)
    throw new Error('직업 자료를 먼저 가져오세요.');
  if (def) {
    c.classId = def.id;
    c.className = def.name;
    c.classSource = classCitation(def);
    c.fieldProvenance = {
      ...c.fieldProvenance,
      className: {
        ...mechanicalProvenance(
          21,
          'none',
          [def.name],
          undefined,
          undefined,
          c,
        ),
        classification: 'SOURCE_COMPOSED',
      },
    };
    c.generation!.system = `class:${def.id}`;
    applyClassCreation(c, def);
  }
  for (const key of ['name', ...abilityKeys, 'hp', 'omens', 'silver'])
    rerollCharacterField(c, key);
  c.equipment = [
    ...c.equipment,
    ...['waterskin', 'food', 'container', 'gearA', 'gearB'].map((slot) =>
      rollEquipmentSlot(slot, c),
    ),
  ];
  c.weapons = [rollWeapon(c), ...c.weapons];
  const armor = rollArmor(c);
  c.armor = String(armor.value);
  c.sources!.armor = armor.source;
  if (armor.provenance)
    c.fieldProvenance = { ...c.fieldProvenance, armor: armor.provenance };
  c.traits = [rollTrait(), rollTrait(), rollTrait('core.bodies')];
  addCharacterBackground(c);
  [...c.traits, ...(c.background ?? [])].forEach((item) =>
    syncCharacterAttachments(c, item),
  );
  const powers = characterFieldRoll('powerUses', c);
  c.powerUses = Number(powers.value);
  c.sources!.powerUses = powers.source;
  if (powers.provenance)
    c.fieldProvenance = { ...c.fieldProvenance, powerUses: powers.provenance };
  return c;
}
export function rerollCharacterItem(
  c: Character,
  kind: 'weapons' | 'equipment' | 'traits' | 'background',
  itemId: string,
): void {
  const item = c[kind]?.find((e) => e.id === itemId);
  if (!item || (kind !== 'traits' && !isClassless(c) && !characterClass(c)))
    return;
  if (kind === 'weapons' && item.slot && item.slot !== 'startingWeapon') return;
  if (
    kind === 'equipment' &&
    !['food', 'container', 'gearA', 'gearB'].includes(item.slot ?? '')
  )
    return;
  const replacement =
    kind === 'weapons'
      ? rollWeapon(c)
      : kind === 'equipment'
        ? rollEquipmentSlot(item.slot!, c)
        : kind === 'background'
          ? rollCharacterTable(item.tableId!, item.slot ?? 'background')
          : rollTrait(item.tableId);
  Object.assign(item, replacement, { id: itemId });
  if (kind === 'traits' || kind === 'background')
    syncCharacterAttachments(c, item);
}
