import type { Character, CharacterItem } from '../domain/types';
import { getRules } from '../storage/rulesStore';
import { getOraclePack } from '../storage/oracleStore';
import { rollOracle, sourceLabel } from './oracleRoller';
import { id, pick, rollDice } from './random';
import { scalarText } from './tables';
import type {
  GeneratedValueProvenance,
  GeneratorProcedure,
} from '../domain/generationProvenance';
import {
  creatureRegistry,
  provenanceForRoll,
  rollCreatureTable,
} from './creatureProvenance';

type Selection = {
  tableId?: string;
  tableIds?: string[];
  count?: number;
  slot: string;
  selection: string;
};
type Operation = {
  op: string;
  slot?: string;
  text?: string;
  damage?: string;
  attackDR?: number;
  rules?: string;
  dice?: string;
  tableId?: string;
  entry?: number;
  count?: number;
  sides?: number;
  bonus?: number;
  countDice?: string;
  kind?: string;
  then?: Operation[];
};
export interface CharacterClassDefinition {
  id: string;
  name: string;
  source: { bookId: string; pdfPages: number[]; bareBonesPages?: number[] };
  hpDie: number;
  omenDie: number;
  omenBonus: number;
  silver: { count: number; sides: number; multiplier: number };
  abilityRollAdjustments: Record<string, number>;
  abilityModifierAdjustments: Record<string, number>;
  weaponDie: number | null;
  armorDie: number | null;
  forbidArmor: boolean;
  forbidScrolls: boolean;
  armorExcludedTiers?: number[];
  powerArmorMaxTier?: number;
  backgrounds: Selection[];
  features: Selection[];
  extraCreation: Operation[];
  rules: string[];
  playerRules?: string[];
  nameTables?: string[];
}
type Attachment = {
  kind: string;
  name: string;
  damage?: string;
  hp?: number;
  attackDR?: number;
  defenceDR?: number;
  countsAsShield?: boolean;
  conditionalUse?: string;
  conditionalDamage?: string;
};
function classPack() {
  return getRules()?.notes.characterClasses as
    | {
        classes: CharacterClassDefinition[];
        featureAttachments: Record<string, Record<string, Attachment[]>>;
      }
    | undefined;
}
export function characterClasses(): CharacterClassDefinition[] {
  return classPack()?.classes ?? [];
}
export function characterClass(
  c: Partial<Character>,
): CharacterClassDefinition | undefined {
  return characterClasses().find(
    (def) => def.id === c.classId && def.name === c.className,
  );
}
export function classCitation(def: CharacterClassDefinition) {
  const books: Record<string, string> = {
    'core-full': 'MÖRK BORG',
    feretory: 'MÖRK BORG CULT: FERETORY',
    heretic: 'MÖRK BORG CULT: HERETIC',
  };
  return `${books[def.source.bookId] ?? def.source.bookId} · PDF ${def.source.pdfPages.join(', ')}쪽 · ${def.name}`;
}
export function classArmorForbidden(c: Partial<Character>) {
  return (
    characterClass(c)?.forbidArmor || c.generation?.rolls.forbidArmor === 1
  );
}
export function classOmenDie(c: Partial<Character>) {
  return c.generation?.rolls.omenSides ?? characterClass(c)?.omenDie ?? 2;
}
export function classOmenBonus(c: Partial<Character>) {
  return c.generation?.rolls.omenBonus ?? characterClass(c)?.omenBonus ?? 0;
}
export function rollCharacterTable(
  tableId: string,
  slot: string,
  selection = 'source-die',
): CharacterItem {
  const registry = creatureRegistry();
  const table = registry.tables.find((t) => t.id === tableId);
  if (!table?.sourceVerified)
    throw new Error(`SOURCE DATA UNAVAILABLE: ${tableId}`);
  if (selection !== 'source-die' || table.rollable === false) {
    const entry = pick(table.entries);
    return {
      id: id(),
      slot,
      tableId,
      text: entry.text,
      source: sourceLabel(table, registry) + ' · 원문 선택지 중 앱 무작위 선택',
      entryRoll: entry.min,
      provenance: {
        ...provenanceForRoll(registry, {
          oracleId: tableId,
          title: table.title,
          dice: 'source option selection',
          roll: entry.min,
          diceValues: [],
          entryId: entry.id,
          text: entry.text,
          source: sourceLabel(table, registry),
        }),
        transformation:
          'Uniform selection among printed options; not a printed die procedure.',
      },
    };
  }
  const result = rollOracle(table, registry);
  return {
    id: id(),
    slot,
    tableId,
    text: result.text,
    source: result.source,
    entryRoll: result.roll,
    provenance: provenanceForRoll(registry, result),
  };
}
function extraItem(
  c: Character,
  kind: string,
  text: string,
  source: string,
  slot: string,
  damage = '',
  provenance?: GeneratedValueProvenance,
) {
  const item = {
    id: id(),
    text,
    source,
    slot,
    ...(provenance ? { provenance } : {}),
  };
  if (kind === 'weapon') c.weapons.push({ ...item, damage });
  else c.equipment.push(item);
}
export function removeCharacterAttachments(c: Character, featureId: string) {
  const slot = `feature:${featureId}`;
  c.weapons = c.weapons.filter((item) => item.slot !== slot);
  c.equipment = c.equipment.filter((item) => item.slot !== slot);
}
export function syncCharacterAttachments(c: Character, feature: CharacterItem) {
  removeCharacterAttachments(c, feature.id);
  const rows =
    classPack()?.featureAttachments[feature.tableId ?? '']?.[
      String(feature.entryRoll)
    ] ?? [];
  for (const a of rows) {
    const text = [
      a.name,
      a.hp ? `HP ${a.hp}` : '',
      a.attackDR ? `Attack DR${a.attackDR}` : '',
      a.defenceDR ? `Defence DR${a.defenceDR}` : '',
      a.kind === 'companion' && a.damage ? `Damage ${a.damage}` : '',
      a.countsAsShield ? 'Shield' : '',
      a.conditionalUse ?? '',
      a.conditionalDamage ?? '',
    ]
      .filter(Boolean)
      .join(' · ');
    extraItem(
      c,
      a.kind,
      text,
      feature.source ?? '',
      `feature:${feature.id}`,
      a.damage ?? '',
      feature.provenance
        ? {
            ...feature.provenance,
            classification: 'SOURCE_COMPOSED',
            transformation:
              'Printed feature attachment extracted into equipment; no extra stats.',
          }
        : undefined,
    );
  }
}
function formula(notation: string) {
  const m = /^(\d*)d(\d+)(?:\+(\d+))?$/.exec(notation);
  if (!m) throw new Error('지원하지 않는 생성 주사위: ' + notation);
  return rollDice(Number(m[1] || 1), Number(m[2])) + Number(m[3] || 0);
}
export function rollClassScroll(
  c: Character,
  kind = 'either',
  slot = 'classScroll',
  innate = false,
) {
  const table = kind === 'either' ? pick(['sacred', 'unclean']) : kind;
  const result = rollCreatureTable('core.' + table);
  const effect = scalarText(result.result.metadata?.effect);
  const text = `${innate ? 'Innate Power' : table + ' scroll'}: ${result.value}${effect ? ` — ${effect}` : ''}`;
  const item = {
    id: id(),
    slot,
    text,
    tableId: 'core.' + table,
    source: result.source,
    provenance: {
      ...result.provenance,
      classification: 'SOURCE_COMPOSED' as const,
      sourceText: [result.value, ...(effect ? [effect] : [])],
      transformation:
        'Source Power name and effect; class determines scroll or innate use.',
    },
  };
  if (innate) c.classFeatures!.push(item);
  else c.equipment.push(item);
}
export function applyClassCreation(
  c: Character,
  def: CharacterClassDefinition,
) {
  const source = classCitation(def);
  c.classFeatures = [];
  c.background = [];
  const selection = (spec: Selection, target: CharacterItem[]) => {
    if (spec.tableIds) {
      const parts = spec.tableIds.map((tableId) =>
        rollCharacterTable(tableId, spec.slot),
      );
      target.push({
        id: id(),
        slot: spec.slot,
        text: parts.map((p) => p.text).join(' '),
        source: parts.map((p) => p.source).join(' + '),
        provenance: {
          classification: 'SOURCE_COMPOSED',
          origin: 'source',
          status: 'VERIFIED',
          sourceRefs: parts.flatMap((p) => p.provenance?.sourceRefs ?? []),
          sourceText: parts.map((p) => p.text),
          rolls: parts.flatMap((p) => p.provenance?.rolls ?? []),
          transformation:
            'Printed class procedure combines these source name fragments in order.',
          procedureId: `character.class:${def.id}`,
          authority: [
            { kind: 'SOURCE_PROCEDURE', id: `character.class:${def.id}` },
          ],
        },
      });
    } else if (spec.tableId)
      for (let i = 0; i < (spec.count ?? 1); i++)
        target.push(
          rollCharacterTable(spec.tableId, spec.slot, spec.selection),
        );
  };
  def.backgrounds.forEach((s) => selection(s, c.background!));
  def.features.forEach((s) => selection(s, c.classFeatures!));
  function operations(ops: Operation[]) {
    for (const op of ops) {
      if (op.op === 'whenEntry') {
        if (
          c.classFeatures!.some(
            (f) => f.tableId === op.tableId && f.entryRoll === op.entry,
          )
        )
          operations(op.then ?? []);
      } else if (op.op === 'forbidArmor') c.generation!.rolls.forbidArmor = 1;
      else if (op.op === 'overrideOmenFormula') {
        if (!op.sides || op.bonus === undefined)
          throw new Error('SOURCE DATA UNAVAILABLE: class Omen formula');
        c.generation!.rolls.omenSides = op.sides;
        c.generation!.rolls.omenBonus = op.bonus;
      } else if (op.op === 'addWeapon' || op.op === 'addEquipment')
        extraItem(
          c,
          op.op === 'addWeapon' ? 'weapon' : 'equipment',
          [op.text, op.attackDR ? `Attack DR${op.attackDR}` : '', op.rules]
            .filter(Boolean)
            .join(' — '),
          source,
          op.slot ?? 'class',
          op.damage,
          classProvenance(
            def,
            [op.text ?? '', op.rules ?? ''].filter(Boolean),
            'Source class equipment and rules displayed together.',
          ),
        );
      else if (op.op === 'randomScroll' || op.op === 'randomPower') {
        const count = op.countDice ? formula(op.countDice) : (op.count ?? 1);
        for (let i = 0; i < count; i++)
          rollClassScroll(c, op.kind, op.slot, op.op === 'randomPower');
      } else if (op.op === 'tableEntry' && op.tableId) {
        const item = rollCharacterTable(
          op.tableId,
          op.slot ?? 'class',
          'choice',
        );
        if (op.slot === 'tattooTablet') c.classFeatures!.push(item);
        else c.equipment.push(item);
      } else if (op.op === 'rollQuantity' && op.dice) {
        const value = formula(op.dice);
        c.generation!.rolls[op.slot ?? 'quantity'] = value;
        extraItem(
          c,
          'equipment',
          `Decoctions: ${value} doses total · 24h`,
          source,
          op.slot ?? 'quantity',
          '',
          {
            ...classProvenance(
              def,
              [],
              'Printed daily dose count; all recipes share this one pool.',
            ),
            classification: 'APP_DERIVED',
            rolls: [
              { tableId: `character.class:${def.id}`, dice: op.dice, value },
            ],
          },
        );
      } else throw new Error(`Unsupported source class operation: ${op.op}`);
    }
  }
  operations(def.extraCreation);
  c.classFeatures.forEach((f) => syncCharacterAttachments(c, f));
  c.classFeatures.push({
    id: id(),
    slot: 'classRules',
    text: (def.playerRules ?? def.rules).join('\n'),
    source,
    provenance: classProvenance(
      def,
      def.playerRules ?? def.rules,
      'Printed class rules; formatting and concise mechanical summaries.',
    ),
  });
}
function classProvenance(
  def: CharacterClassDefinition,
  sourceText: string[],
  transformation: string,
): GeneratedValueProvenance {
  return {
    classification: 'SOURCE_COMPOSED',
    origin: 'source',
    status: 'VERIFIED',
    sourceRefs: [
      {
        bookId: def.source.bookId,
        pdfPage: def.source.pdfPages,
        tableTitle: def.name,
      },
    ],
    sourceText,
    transformation,
    procedureId: `character.class:${def.id}`,
    authority: [{ kind: 'SOURCE_PROCEDURE', id: `character.class:${def.id}` }],
  };
}
export function classCharacterNameResult(def: CharacterClassDefinition) {
  if (!def.nameTables) return null;
  const parts = def.nameTables.map((tableId) =>
    rollCharacterTable(tableId, 'name'),
  );
  return {
    value: parts.map((r) => r.text).join(''),
    source: parts.map((r) => r.source).join(' + '),
    provenance: {
      ...classProvenance(
        def,
        parts.map((r) => r.text),
        'Printed class name syllables concatenated in A/B/C order.',
      ),
      sourceRefs: parts.flatMap((r) => r.provenance?.sourceRefs ?? []),
      rolls: parts.flatMap((r) => r.provenance?.rolls ?? []),
    },
  };
}
export function classCharacterName(def: CharacterClassDefinition) {
  return classCharacterNameResult(def)?.value ?? null;
}
function classOperationSteps(
  operations: Operation[],
  prefix = 'extra',
): GeneratorProcedure['steps'] {
  return operations.flatMap((op, index) => {
    const id = `${prefix}:${index}:${op.op}`;
    const step: GeneratorProcedure['steps'][number] = {
      id,
      count: op.count ?? 1,
      ...(op.tableId ? { tableId: op.tableId } : {}),
      ...(op.dice || op.countDice ? { dice: op.dice ?? op.countDice } : {}),
      derived:
        op.op === 'whenEntry'
          ? 'Inspect selected entry; no second roll.'
          : op.op,
      ...(op.op === 'whenEntry'
        ? { condition: `Selected ${op.tableId} entry ${op.entry}` }
        : {}),
    };
    return [
      step,
      ...classOperationSteps(op.then ?? [], id).map((child) => ({
        ...child,
        condition: `${step.condition ?? op.op}; ${child.condition ?? 'then'}`,
      })),
    ];
  });
}
export function buildCharacterProcedures(): GeneratorProcedure[] {
  return [
    {
      id: 'character.core-classless',
      authority: 'SOURCE_PROCEDURE',
      title: 'Core character creation',
      sourceRefs: [
        {
          bookId: 'core',
          pdfPage: [21, 22, 23, 27, 29, 34, 37, 38, 39, 40, 41, 42],
          tableTitle: 'Character creation',
        },
      ],
      steps: [
        ...[
          'core.containers',
          'core.gearA',
          'core.gearB',
          'core.weapons',
          'core.armor',
        ].map((tableId) => ({ id: tableId, tableId, count: 1 })),
        {
          id: 'abilities',
          dice: '3d6',
          count: 4,
          derived: 'Convert each sum using Core ability modifier table.',
        },
        { id: 'hp', dice: 'd8', count: 1, derived: 'max(1, Toughness + die)' },
        { id: 'omens', dice: 'd2', count: 1, condition: 'Optional Omens' },
        {
          id: 'name',
          tableId: 'core.names',
          count: 1,
          condition: 'Optional name',
        },
        {
          id: 'traits',
          tableId: 'core.traits',
          count: 2,
          condition: 'Optional traits',
        },
        ...['core.bodies', 'core.badHabits', 'core.troublingTales'].map(
          (tableId) => ({
            id: tableId,
            tableId,
            count: 1,
            condition: 'Optional tables',
          }),
        ),
      ],
    },
    ...characterClasses().map((def) => ({
      id: `character.class:${def.id}`,
      authority: 'SOURCE_PROCEDURE' as const,
      title: def.name,
      sourceRefs: [
        {
          bookId: 'core',
          pdfPage: [21, 22, 23, 27, 29, 34, 35, 37, 38, 39, 40, 41, 42],
          tableTitle: 'Character creation',
        },
        {
          bookId: def.source.bookId,
          pdfPage: def.source.pdfPages,
          tableTitle: def.name,
        },
      ],
      steps: [
        {
          id: 'starting-stats',
          count: 1,
          derived: `Core creation with class dice HP d${def.hpDie}; Omens d${def.omenDie}+${def.omenBonus}; silver ${def.silver.count}d${def.silver.sides}×${def.silver.multiplier}; ability roll/modifier adjustments from source class manifest.`,
        },
        ...[...def.backgrounds, ...def.features].flatMap((spec) =>
          (spec.tableIds ?? (spec.tableId ? [spec.tableId] : [])).map(
            (tableId) => ({
              id: spec.slot + ':' + tableId,
              tableId,
              count: spec.count ?? 1,
              condition: spec.selection,
            }),
          ),
        ),
        ...classOperationSteps(def.extraCreation),
      ],
    })),
  ];
}
export function addCharacterBackground(c: Character) {
  const extra = getOraclePack();
  // Keep legacy core-only packs usable; complete UI generation waits for both packs.
  if (!extra) return;
  c.background ??= [];
  for (const tableId of ['core.badHabits', 'core.troublingTales'])
    c.background.push(rollCharacterTable(tableId, tableId));
}
export function classCreationReady() {
  return !!getRules() && !!getOraclePack();
}
