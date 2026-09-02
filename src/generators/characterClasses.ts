import type { Character, CharacterItem } from '../domain/types';
import { getRules } from '../storage/rulesStore';
import { getOraclePack } from '../storage/oracleStore';
import { buildOracleRegistry } from '../data/oracles';
import { rollOracle, sourceLabel } from './oracleRoller';
import { id, pick, rollDice } from './random';
import { sampleEntry, scalarText } from './tables';

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
  const registry = buildOracleRegistry(getRules(), getOraclePack());
  const table = registry.tables.find((t) => t.id === tableId);
  if (!table) throw new Error(`직업 생성표를 먼저 가져오세요: ${tableId}`);
  if (selection !== 'source-die' || table.rollable === false) {
    const entry = pick(table.entries);
    return {
      id: id(),
      slot,
      tableId,
      text: entry.text,
      source: sourceLabel(table, registry) + ' · 원문 선택지 중 앱 무작위 선택',
      entryRoll: entry.min,
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
  };
}
function extraItem(
  c: Character,
  kind: string,
  text: string,
  source: string,
  slot: string,
  damage = '',
) {
  const item = { id: id(), text, source, slot };
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
  const entry = sampleEntry('core.' + table);
  const text = `${innate ? 'Innate Power' : table + ' scroll'}: ${entry.text} — ${scalarText(entry.meta.effect)}`;
  const item = {
    id: id(),
    slot,
    text,
    tableId: 'core.' + table,
    source: `MÖRK BORG · ${table} Powers`,
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
        c.generation!.rolls.omenSides = 4;
        c.generation!.rolls.omenBonus = 2;
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
        );
      }
    }
  }
  operations(def.extraCreation);
  c.classFeatures.forEach((f) => syncCharacterAttachments(c, f));
  c.classFeatures.push({
    id: id(),
    slot: 'classRules',
    text: (def.playerRules ?? def.rules).join('\n'),
    source,
  });
}
export function classCharacterName(def: CharacterClassDefinition) {
  if (!def.nameTables) return null;
  return def.nameTables
    .map((tableId) => rollCharacterTable(tableId, 'name'))
    .map((r) => r.text)
    .join('');
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
