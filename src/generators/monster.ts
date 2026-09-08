import type {
  Monster,
  MonsterAttack,
  MonsterText,
  RegionId,
} from '../domain/types';
import { id, now, rollDie, random, type RandomSource } from './random';
import { feretoryRolls, feretoryStats, type FeretoryRolls } from './feretory';
export { feretoryRolls, feretoryStats, type FeretoryRolls } from './feretory';
import { entries, scalarText } from './tables';
import { appPolicy, sourceProcedure } from '../domain/generationAuthority';
import { getRules, sourceCitation } from '../storage/rulesStore';
import {
  editedProvenance,
  type GeneratedValueProvenance,
} from '../domain/generationProvenance';
import {
  creatureRegistry,
  rollCreatureTable,
  provenanceForRoll,
  provenanceForCreatureRecord,
  creatureRecordReference,
} from './creatureProvenance';
import { sourceLabel } from './oracleRoller';
import { oracleValueProvenance } from '../domain/oracleProvenance';

export const fereAppearance = (rolls: FeretoryRolls): string =>
  (['A', 'B', 'C'] as const)
    .map((key) => entries(`feretory.${key}`)[rolls[key] - 1].text)
    .join('; ');
const statSource = (rolls: FeretoryRolls) =>
  `FERETORY · PDF 2쪽 · A=${rolls.A}, B=${rolls.B}, C=${rolls.C}`;
const isFeretorySource = (source?: string) =>
  /^(?:MÖRK BORG CULT: )?FERETORY/.test(source ?? '');
const hpSource =
  'FERETORY · PDF 2쪽 · 피해 주사위 한 번 ×2 (본문; 괄호의 2dN 예시와 분포 불일치)';
export function monsterText(tableId: string): MonsterText {
  const r = rollCreatureTable(tableId);
  return {
    id: id(),
    text: String(r.value),
    source: r.source,
    tableId,
    provenance: r.provenance,
  };
}
function linkedProvenance(
  rolls: FeretoryRolls,
  stats: ReturnType<typeof feretoryStats>,
) {
  const registry = creatureRegistry();
  const parts = (['A', 'B', 'C'] as const).map((part) => {
    const table = registry.tables.find((t) => t.id === `feretory.${part}`);
    const entry = table?.entries.find(
      (e) => e.min <= rolls[part] && e.max >= rolls[part],
    );
    if (!table?.sourceVerified || !entry)
      throw new Error(`SOURCE DATA UNAVAILABLE: feretory.${part}`);
    return provenanceForRoll(
      registry,
      {
        oracleId: table.id,
        title: table.title,
        dice: 'd12',
        roll: rolls[part],
        diceValues: [rolls[part]],
        entryId: entry.id,
        text: entry.text,
        source: sourceLabel(table, registry),
        metadata: {
          provenance: oracleValueProvenance(table, registry, entry, {
            value: rolls[part],
            values: [rolls[part]],
          }),
        },
      },
      'feretory.monster-approaches',
    );
  });
  const base: GeneratedValueProvenance = {
    classification: 'APP_DERIVED',
    origin: 'source',
    status:
      parts.find((part) => part.status !== 'VERIFIED')?.status ?? 'VERIFIED',
    sourceRefs: parts.flatMap((p) => p.sourceRefs),
    sourceText: parts.flatMap((p) => p.sourceText ?? []),
    rolls: parts.flatMap((p) => p.rolls ?? []),
    procedureId: 'feretory.monster-approaches',
    authority: [sourceProcedure('feretory.monster-approaches')],
  };
  return {
    appearance: {
      ...base,
      classification: 'SOURCE_COMPOSED' as const,
      transformation:
        'A; B; C. Source fragments retained without connective prose.',
    },
    morale: { ...base, transformation: 'max(A, B, C)' },
    armor: {
      ...base,
      status:
        new Set(Object.values(rolls)).size < 3 &&
        Object.values(rolls).filter((r) => r === stats.morale).length > 1
          ? ('PARTIAL' as const)
          : base.status,
      transformation:
        'Highest die table: A none; B -d2; C odd -d4, even -d6. Source gives no tie-break; referee chooses.',
    },
    damage: {
      ...base,
      transformation: 'Minimum A/B/C mapped to printed damage-die bands.',
    },
    hp: {
      ...base,
      status: 'CONFLICT' as const,
      rolls: [
        ...(base.rolls ?? []),
        {
          tableId: 'feretory.A',
          dice: stats.damage,
          value: stats.hpRoll,
          diceValues: [stats.hpRoll],
        },
      ],
      transformation: `HP = ${stats.damage} result ${stats.hpRoll} × 2 = ${stats.hp}. PDF 2 prose says double one result; parenthetical 2dN has a different distribution.`,
    },
  };
}
export function generateMonster(campaignId: string, blank = false): Monster {
  const m: Monster = {
    id: id(),
    campaignId,
    name: '',
    concept: '',
    appearance: '',
    behavior: '',
    wants: '',
    hp: 0,
    morale: '',
    armor: '',
    attacks: [],
    special: [],
    weakness: [],
    loot: [],
    weirdTrait: '',
    description: '',
    notes: '',
    createdAt: now(),
    updatedAt: now(),
    sources: {},
  };
  if (blank) return m;
  if (!getRules()) throw new Error('원문 생성 자료를 먼저 불러오세요.');
  const rolls = feretoryRolls(),
    stats = feretoryStats(rolls);
  const linked = linkedProvenance(rolls, stats),
    wants = rollCreatureTable('feretory.desire');
  Object.assign(m, {
    name: 'Monster',
    appearance: fereAppearance(rolls),
    hp: stats.hp,
    morale: stats.morale,
    armor: stats.armor,
    wants: wants.value,
    attacks: [
      {
        id: id(),
        name: '',
        damage: stats.damage,
        description: '',
        tableId: 'feretory.stats',
        fieldProvenance: { damage: linked.damage },
        sources: {
          name: '전용 공격명 생성표 없음 · 직접 작성',
          damage: statSource(rolls),
        },
      },
    ],
    special: [monsterText('feretory.trait')],
    generation: {
      system: 'feretory',
      rolls: { ...rolls, hpDie: stats.hpRoll },
    },
    fieldProvenance: {
      appearance: linked.appearance,
      morale: linked.morale,
      armor: linked.armor,
      hp: linked.hp,
      wants: wants.provenance,
      name: {
        classification: 'APP_DERIVED',
        origin: 'source',
        status: 'VERIFIED',
        sourceRefs: [],
        procedureId: 'app.structural-identifier',
        authority: [appPolicy('app.structural-identifier')],
        transformation:
          'Neutral structural label; not a generated source creature name.',
      },
    },
  });
  m.sources = {
    name: 'Neutral structural label · 직접 이름을 입력할 수 있습니다.',
    appearance: statSource(rolls),
    hp: hpSource,
    morale: statSource(rolls),
    armor: statSource(rolls),
    wants: sourceCitation('feretory.desire'),
  };
  return m;
}
export function patchMonsterScalar(
  m: Monster,
  key: string,
  value: string | number,
  source = '직접 작성',
): void {
  if (
    ![
      'name',
      'concept',
      'appearance',
      'behavior',
      'wants',
      'hp',
      'morale',
      'armor',
      'weirdTrait',
      'description',
      'notes',
    ].includes(key)
  )
    return;
  let accepted: string | number = String(value);
  if (key === 'hp') {
    const n = Number(value);
    if (!Number.isFinite(n)) return;
    accepted = Math.max(0, Math.min(9999, Math.trunc(n)));
  }
  if (key === 'morale' && /^\d+$/.test(String(value)))
    accepted = Math.max(0, Math.min(12, Number(value)));
  Object.assign(m, { [key]: accepted });
  m.sources = { ...m.sources, [key]: source };
  if (source === '직접 작성')
    m.fieldProvenance = {
      ...m.fieldProvenance,
      [key]: editedProvenance(m.fieldProvenance?.[key]),
    };
}
export const usesFeretory = (m: Monster): boolean =>
  /^feretory(?:-edited)?$/.test(m.generation?.system ?? '');
export function canRerollMonsterHp(m: Monster): boolean {
  return usesFeretory(m) && /^d(4|6|8|10|12)$/.test(m.attacks[0]?.damage ?? '');
}
export function rerollMonsterField(
  m: Monster,
  key: 'name' | 'wants' | 'hp',
): void {
  if (key === 'hp') {
    if (!canRerollMonsterHp(m)) return;
    const die = Number(m.attacks[0].damage.slice(1)),
      value = rollDie(die);
    patchMonsterScalar(m, 'hp', 2 * value, hpSource);
    m.fieldProvenance = {
      ...m.fieldProvenance,
      hp: {
        classification: 'APP_DERIVED',
        origin: 'source',
        status: 'CONFLICT',
        sourceRefs: [
          {
            bookId: 'feretory',
            tableId: 'feretory.A',
            pdfPage: 2,
            tableTitle: 'The Monster Approaches',
          },
        ],
        rolls: [
          {
            tableId: 'feretory.A',
            dice: `d${die}`,
            value,
            diceValues: [value],
          },
        ],
        procedureId: 'feretory.monster-approaches',
        authority: [sourceProcedure('feretory.monster-approaches')],
        transformation: `HP = d${die} result ${value} ×2. Prose conflicts with printed 2dN example.`,
      },
    };
    m.generation!.rolls.hpDie = value;
    return;
  }
  if (key === 'name') return;
  const r = rollCreatureTable('feretory.desire');
  patchMonsterScalar(m, key, r.value, r.source);
  m.fieldProvenance = { ...m.fieldProvenance, [key]: r.provenance };
}
/** FERETORY uses one linked 3d12 roll. Never silently replace another manually edited field. */
export function rerollMonsterLinked(
  m: Monster,
  target: 'all' | 'appearance' | 'morale' | 'armor' | 'attack',
  attackId?: string,
): void {
  if (!usesFeretory(m)) return;
  const attack = m.attacks.find((a) => a.id === attackId) ?? m.attacks[0];
  if (target === 'attack' && (!attack || attack.tableId !== 'feretory.stats'))
    return;
  const rolls = feretoryRolls(),
    stats = feretoryStats(rolls),
    source = statSource(rolls);
  const provenance = linkedProvenance(rolls, stats);
  const derived = {
    appearance: fereAppearance(rolls),
    morale: stats.morale,
    armor: stats.armor,
  };
  for (const key of ['appearance', 'morale', 'armor'] as const)
    if (key === target || isFeretorySource(m.sources?.[key])) {
      patchMonsterScalar(m, key, derived[key], source);
      m.fieldProvenance = { ...m.fieldProvenance, [key]: provenance[key] };
    }
  for (const a of m.attacks)
    if (
      a.tableId === 'feretory.stats' &&
      ((target === 'attack' && a.id === attack?.id) ||
        isFeretorySource(a.sources?.damage))
    ) {
      a.damage = stats.damage;
      a.sources = { ...a.sources, damage: source };
      a.fieldProvenance = { ...a.fieldProvenance, damage: provenance.damage };
    }
  // A manually edited primary damage die is authoritative for any automatic HP.
  const primaryDamage = m.attacks[0]?.damage ?? '';
  if (
    isFeretorySource(m.sources?.hp) &&
    /^d(4|6|8|10|12)$/.test(primaryDamage)
  ) {
    if (primaryDamage === stats.damage) {
      patchMonsterScalar(m, 'hp', stats.hp, hpSource);
      m.fieldProvenance = { ...m.fieldProvenance, hp: provenance.hp };
    } else rerollMonsterField(m, 'hp');
  }
  m.generation = {
    system: 'feretory',
    rolls: {
      ...rolls,
      hpDie: Number(
        m.fieldProvenance?.hp?.rolls?.at(-1)?.value ?? stats.hpRoll,
      ),
    },
  };
}
export function rerollMonsterSpecial(m: Monster, itemId: string): void {
  const item = m.special.find((s) => s.id === itemId);
  if (!item || item.tableId !== 'feretory.trait') return;
  const next = monsterText('feretory.trait');
  Object.assign(item, next, { id: item.id });
}

/** Fixed book creatures are imported as a whole, never mixed into random creature tables. */
export function loadMonsterPreset(
  campaignId: string,
  record: Record<string, unknown>,
): Monster {
  const hasHP = typeof record.hp === 'number' && Number.isFinite(record.hp);
  const sourceRef = creatureRecordReference(record);
  const m = generateMonster(campaignId, true);
  const additional = record.additionalSource as
    | { pdfPage?: number }
    | undefined;
  const depthsReference = scalarText(record.depthsReference);
  const source = `${record.book === 'feretory' ? 'MÖRK BORG CULT: FERETORY · Eat Prey Kill' : record.book === 'heretic' ? 'MÖRK BORG CULT: HERETIC' : record.book === 'core-full' ? 'MÖRK BORG — Full Edition' : 'MÖRK BORG BARE BONES EDITION'} · PDF ${scalarText(record.pdfPage)}쪽${additional?.pdfPage ? ` · 추가 PDF ${additional.pdfPage}쪽` : ''}${depthsReference ? ` · ${depthsReference}` : ''}`;
  for (const key of [
    'name',
    'concept',
    'appearance',
    'wants',
    'armor',
    'weirdTrait',
    'description',
  ] as const)
    m[key] = scalarText(record[key]);
  m.hp = hasHP ? (record.hp as number) : '';
  m.morale = scalarText(record.moraleDisplay ?? record.morale);
  m.behavior = scalarText(record.behavior ?? record.behaviour);
  const item = (value: unknown): MonsterText[] =>
    scalarText(value)
      ? [
          {
            id: id(),
            text: scalarText(value),
            source,
            provenance: provenanceForCreatureRecord(
              record,
              'text',
              value,
              true,
            ),
          },
        ]
      : [];
  m.special = item(record.specialAbility);
  m.weakness = item(record.weakness);
  m.loot = item(record.loot);
  const attack = (raw: Record<string, unknown>): MonsterAttack => ({
    id: id(),
    name: scalarText(raw.attack ?? raw.name),
    damage: scalarText(raw.damage),
    description: scalarText(raw.description ?? raw.effect),
    sources: { name: source, damage: source, description: source },
    fieldProvenance: Object.fromEntries(
      ['name', 'damage', 'description'].map((field) => [
        field,
        provenanceForCreatureRecord(
          record,
          field,
          field === 'name'
            ? (raw.attack ?? raw.name ?? '')
            : field === 'description'
              ? (raw.description ?? raw.effect ?? '')
              : (raw.damage ?? ''),
          field === 'description',
        ),
      ]),
    ),
  });
  if (Array.isArray(record.attackOptions) && record.attackOptions.length)
    m.attacks = record.attackOptions.map(attack);
  else if (record.attack || record.damage)
    m.attacks = [
      attack({
        ...record,
        description:
          record.attackDescription ??
          record.attackEffect ??
          record.effect ??
          '',
      }),
    ];
  const table = record.attackTable as
    | { entries?: Record<string, unknown>[] }
    | undefined;
  if (table?.entries?.length) {
    const index = rollDie(table.entries.length) - 1;
    m.attacks = [attack(table.entries[index])];
    for (const provenance of Object.values(m.attacks[0].fieldProvenance ?? {}))
      provenance.rolls = [
        {
          tableId: sourceRef.tableId!,
          dice: `d${table.entries.length}`,
          value: index + 1,
        },
      ];
    m.attacks[0].sources!.name += ' · 원문 무기 표 선택';
    m.attacks[0].sources!.damage += ' · 원문 무기 표 선택';
  }
  const actions = record.actionTable as
    | { entries?: Record<string, unknown>[]; dice?: string }
    | undefined;
  if (actions?.entries?.length) {
    const text = actions.entries
      .map(
        (e) =>
          `${scalarText(e.roll ?? e.min)}${e.max && e.max !== e.min ? `–${scalarText(e.max)}` : ''}: ${scalarText(e.text ?? e.name ?? e.attack)}${e.damage ? ` ${scalarText(e.damage)}` : ''}${e.effect ? ` — ${scalarText(e.effect)}` : ''}`,
      )
      .join('\n');
    m.special.push({
      id: id(),
      text: `${actions.dice ? `${actions.dice} · ` : ''}${text}`,
      source,
      provenance: provenanceForCreatureRecord(
        record,
        'actionTable',
        text,
        true,
      ),
    });
  }
  for (const field of ['traits', 'specialty', 'values']) {
    const table = record[field] as
      | {
          dice?: string;
          frequency?: string;
          test?: string;
          entries?: Record<string, unknown>[];
        }
      | undefined;
    if (!table?.entries?.length) continue;
    const text = table.entries
      .map(
        (entry) =>
          `${scalarText(entry.roll ?? entry.min)}${entry.max && entry.max !== entry.min ? `–${scalarText(entry.max)}` : ''}: ${scalarText(entry.text ?? entry.name)}`,
      )
      .join('\n');
    m.special.push({
      id: id(),
      text: `${[field, table.dice, table.frequency, table.test].filter(Boolean).join(' · ')}\n${text}`,
      source,
      provenance: provenanceForCreatureRecord(record, field, text, true),
    });
  }
  const alternative = record.attackAlternative as
    | Record<string, unknown>
    | undefined;
  if (alternative) {
    const text = [
      scalarText(alternative.attack),
      scalarText(alternative.damage),
      scalarText(alternative.frequency),
    ]
      .filter(Boolean)
      .join(' · ');
    m.special.push({
      id: id(),
      text,
      source,
      provenance: provenanceForCreatureRecord(
        record,
        'attackAlternative',
        text,
        true,
      ),
    });
  }
  m.notes = [
    scalarText(record.context),
    scalarText(record.sourceNotes),
    record.valuation
      ? `Valuation (매각가 · 자동 전리품 아님): ${typeof record.valuation === 'string' ? record.valuation : JSON.stringify(record.valuation)}`
      : '',
  ]
    .filter(Boolean)
    .join('\n\n');
  m.sources = Object.fromEntries(
    [
      'name',
      'concept',
      'appearance',
      'behavior',
      'wants',
      'hp',
      'morale',
      'armor',
      'description',
    ].map((key) => [key, source]),
  );
  m.fieldProvenance = Object.fromEntries(
    Object.keys(m.sources)
      .filter(
        (field) =>
          scalarText((m as unknown as Record<string, unknown>)[field]) !== '',
      )
      .map((field) => [
        field,
        provenanceForCreatureRecord(
          record,
          field,
          (m as unknown as Record<string, unknown>)[field],
          [
            'appearance',
            'behavior',
            'wants',
            'description',
            'concept',
          ].includes(field),
        ),
      ]),
  );
  if (m.notes) {
    m.fieldProvenance.notes = {
      ...provenanceForCreatureRecord(record, 'notes', m.notes, true),
      classification: 'APP_DERIVED',
      sourceText: [
        scalarText(record.context),
        scalarText(record.sourceNotes),
        scalarText(record.valuation),
      ].filter(Boolean),
      transformation:
        'Source context, editorial source notes and valuation metadata formatted as separate reference notes; not creature fiction or automatic loot.',
    };
  }
  if (!hasHP)
    m.fieldProvenance.hp = {
      classification: 'APP_DERIVED',
      origin: 'source',
      status: 'UNAVAILABLE',
      sourceRefs: [sourceRef],
      transformation:
        'No HP supplied for this creature; stat is intentionally empty.',
    };
  m.generation = { system: 'preset', rolls: {} };
  return m;
}

const epkRegionKeys: Record<RegionId, string> = {
  galgenbeck: 'tveland',
  sarkash: 'sarkash',
  'graven-tosk': 'gravenTosk',
  grift: 'grift',
  kergus: 'kergus',
  wastland: 'wastland',
  'valley-undead': 'valley',
};
export function eatPreyKillCreatures(region: RegionId, rules = getRules()) {
  return (rules?.creatures ?? []).filter(
    (record) =>
      record.book === 'feretory' &&
      record.section === 'Eat Prey Kill' &&
      record.regionKey === epkRegionKeys[region] &&
      typeof record.hp === 'number' &&
      record.presetEligible !== false,
  );
}
export function rollEatPreyKillPreset(
  region: RegionId,
  rules = getRules(),
  rng: RandomSource = random,
) {
  const records = (rules?.creatures ?? []).filter(
    (record) =>
      record.book === 'feretory' &&
      record.section === 'Eat Prey Kill' &&
      record.regionKey === epkRegionKeys[region],
  );
  const face = rollDie(6, rng);
  const matches = records.filter((record) => record.roll === face);
  if (matches.length !== 1)
    throw new Error(
      `SOURCE DATA UNAVAILABLE: Eat Prey Kill ${region} d6=${face}`,
    );
  // Unavailable statblocks remain valid table faces. Never reroll/renormalize them away.
  return matches[0];
}
export function generateEatPreyKillMonster(
  campaignId: string,
  region: RegionId,
): Monster {
  const record = rollEatPreyKillPreset(region);
  const monster = loadMonsterPreset(campaignId, record);
  monster.region = region;
  const tableId = String(record.tableId),
    face = Number(record.roll);
  for (const provenance of Object.values(monster.fieldProvenance ?? {})) {
    provenance.rolls = [{ tableId, dice: 'd6', value: face }];
    provenance.sourceRefs.push({
      bookId: 'feretory',
      tableId,
      pdfPage: Number(record.pdfPage),
      printedPage: Number(record.printedPage),
      roll: face,
      role: 'routing',
      tableTitle: 'Eat Prey Kill · regional hunting table',
    });
  }
  monster.generation = {
    system: 'epk',
    rolls: { entry: face },
  };
  return monster;
}
