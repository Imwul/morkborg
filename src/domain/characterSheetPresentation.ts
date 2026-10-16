import type { ReferenceReading } from './referenceReading';
import type { OracleRoll } from './oracle';
import {
  characterClasses,
  type CharacterClassDefinition,
} from '../generators/characterClasses';
import { translateGeneratedText } from '../generators/translation';

/** A view projection, never part of the reading, copy, replay or saved object. */
export type CharacterSheetBlock = ReferenceReading['blocks'][number] & {
  sheetFormula?: string;
  sheetContext?: string;
};

const abilityTitles = ['Strength', 'Agility', 'Presence', 'Toughness'];
const signed = (value: number) =>
  value > 0 ? `+${value}` : value < 0 ? `−${Math.abs(value)}` : '';

function recordedRoll(reading: ReferenceReading, block: CharacterSheetBlock) {
  const matching = reading.oracle?.rolls.filter(
    (roll) => roll.title === block.title && roll.text === block.text,
  );
  // Never attach another item's provenance just because two results share text.
  return matching?.length === 1 ? matching[0] : undefined;
}

/** Read the actual recorded generation transformation, not the resulting value. */
function creationFormula(
  block: CharacterSheetBlock,
  roll?: OracleRoll,
  reading?: ReferenceReading,
) {
  if (
    block.title === 'HP' &&
    String(reading?.procedureInputs?.reclvseBlessings ?? '')
      .split(',')
      .includes('enhanced-fortitude')
  ) {
    if (reading?.procedureInputs?.reclvseFortitude === 'fixed12')
      return 'RECLVSE · 12 고정';
    if (reading?.procedureInputs?.reclvseFortitude === '10+d4')
      return 'RECLVSE · 10+d4';
  }
  const provenance = roll?.metadata?.provenance;
  if (!provenance || provenance.origin !== 'source') return;
  const note = provenance.transformation ?? '';
  if (abilityTitles.includes(block.title)) {
    const generated =
      /^(3d6|4d6 drop lowest) \([^)]*\) \+ (-?\d+) → ability modifier \+ (-?\d+) =/.exec(
        note,
      );
    if (generated) {
      const dice = generated[1] === '3d6' ? '3d6' : '4d6 · 최저 1개 제외';
      return `${dice}${signed(Number(generated[2]))} → 보정치${Number(generated[3]) ? ` ${signed(Number(generated[3]))}` : ''}`;
    }
    if (
      roll?.oracleId === 'character.core-classless' &&
      /^(?:Drop lowest; )?ability total -?\d+ → modifier/.test(note) &&
      (roll.dice === '3d6' || roll.dice === '4d6 drop lowest')
    )
      return `${roll.dice === '3d6' ? '3d6' : '4d6 · 최저 1개 제외'} → 보정치`;
  }
  if (
    block.title === 'HP' &&
    /(?:max\(1, Toughness|^Toughness -?\d+ \+ d8; minimum 1\.)/.test(note) &&
    /^d\d+$/.test(roll?.dice ?? '')
  )
    return `체력 + ${roll!.dice} · 최소 1`;
  if (block.title === 'Omens') {
    const generated = /^d(\d+) \(\d+\) \+ (-?\d+) Omens$/.exec(note);
    if (generated) return `d${generated[1]}${signed(Number(generated[2]))}`;
    if (note === 'Optional Core Omens rule.' && roll?.dice === 'd2')
      return 'd2';
  }
  if (block.title === 'Silver') {
    const generated = /^(\d+d\d+) \([^)]*\) × (\d+) silver$/.exec(note);
    if (generated) return `${generated[1]} × ${generated[2]}`;
    if (note === 'Starting silver.' && roll?.dice === '2d6 × 10')
      return '2d6 × 10';
  }
  if (
    block.title === 'Power uses/day' &&
    roll?.dice === 'd4' &&
    /^(?:max\(0, Presence -?\d+ \+ d4 \d+\) =|Presence -?\d+ \+ d4 daily Power uses\.)/.test(
      note,
    )
  )
    return '지각 + d4 · 0 미만은 0';
}

function creationContext(
  block: CharacterSheetBlock,
  roll: OracleRoll | undefined,
  def: CharacterClassDefinition | undefined,
) {
  const provenance = roll?.metadata?.provenance;
  if (!roll || !provenance || provenance.origin !== 'source') return;
  const note = provenance.transformation ?? '';
  const className = def ? translateGeneratedText(def.name) || def.name : '';
  const classFeature =
    !!def &&
    def.features.some(
      (selection) =>
        selection.tableId === roll.oracleId ||
        selection.tableIds?.includes(roll.oracleId),
    );
  const item =
    /^(Weapons?|Armor|Equipment|Food|Container|Starting Equipment|Scroll)(\b|\s)/i.test(
      block.title,
    );
  if (item) {
    if (
      note ===
      'Printed feature attachment extracted into equipment; no extra stats.'
    )
      return classFeature
        ? `직업 능력에서 얻은 장비 · ${className}`
        : '특징·배경에서 얻은 장비';
    if (
      className &&
      (note === 'Source class equipment and rules displayed together.' ||
        note ===
          'Source Power name and effect; class determines scroll or innate use.' ||
        note === 'Printed daily dose count; all recipes share this one pool.' ||
        note ===
          'Uniform selection among printed options; not a printed die procedure.')
    )
      return `직업 시작 ${block.title.startsWith('Weapon') ? '무기' : '장비'} · ${className}${note === 'Uniform selection among printed options; not a printed die procedure.' ? ' · 원문 선택지에서 앱이 무작위 선택' : ''}`;
    const coreSupply = provenance.sourceRefs.some(
      (source) =>
        source.bookId === 'core' &&
        [21, 23].some((page) => [source.pdfPage].flat().includes(page)),
    );
    if (
      coreSupply ||
      /^core\.(?:weapons|armor|containers|gearA|gearB)$/.test(roll.oracleId) ||
      (!def &&
        block.title.startsWith('Starting Equipment') &&
        /^core\.(?:sacred|unclean)$/.test(roll.oracleId))
    )
      return `공통 시작 ${block.title.startsWith('Weapon') ? '무기' : block.title === 'Armor' ? '방어구' : '장비'}`;
  }
  if (/^Class feature(?:\s|$)/.test(block.title) && className) {
    const selection = def?.features.find(
      (spec) =>
        spec.tableId === roll.oracleId ||
        spec.tableIds?.includes(roll.oracleId),
    );
    if (
      selection ||
      note ===
        'Source Power name and effect; class determines scroll or innate use.'
    )
      return `직업에서 시작 시 얻는 능력 · ${className}${selection?.selection !== undefined && selection.selection !== 'source-die' ? ' · 원문 선택지에서 앱이 무작위 선택' : ''}`;
  }
}

/** Remove only proven duplicate ability-creation clauses; retain flavor and play restrictions. */
function presentClassRules(
  block: CharacterSheetBlock,
  reading: ReferenceReading,
  def: CharacterClassDefinition | undefined,
  formulas: Map<string, string>,
): CharacterSheetBlock {
  if (!def || block.title !== 'Class rules') return block;
  const roll = recordedRoll(reading, block);
  if (
    roll?.metadata?.provenance?.origin !== 'source' ||
    block.text !== (def.playerRules ?? def.rules).join('\n') ||
    !abilityTitles.every((title) => formulas.has(title))
  )
    return block;
  let changed = false;
  const text = block.text
    .split('\n')
    .map((line) => {
      // All supported numeric clauses must be isolated from combat DRs and item rules.
      if (
        /3d6/.test(line) &&
        !/\b(?:DR\d+|damage|weapon|armor|scroll)\b/i.test(line)
      ) {
        const trimmed = line.replace(
          /,?\s*(?:roll\s+)?3d6[+−-]\d+\s+(?:for\s+)?(?:Strength|Agility|Presence|Toughness)(?:\s+and\s+(?:Strength|Agility|Presence|Toughness))?/gi,
          '',
        );
        if (trimmed !== line && !/3d6/.test(trimmed)) {
          changed = true;
          return trimmed
            .replace(/!\s*Roll\s*/g, '! ')
            .replace(/,\s*\./g, '.')
            .replace(/!\./g, '!')
            .trim();
        }
      }
      if (
        def.id === 'pale-one' &&
        line ===
          'Your mind and movements are alien (+1 Agility and Presence) but your bones are hollow and fragile (−2 Toughness).'
      ) {
        changed = true;
        return 'Your mind and movements are alien but your bones are hollow and fragile.';
      }
      return line;
    })
    .join('\n');
  if (!changed) return block;
  const flavorKo: Record<string, string> = {
    'Built like a bull. Not a bright spark.':
      '황소처럼 건장합니다. 머리가 썩 좋은 편은 아닙니다.',
    'Small.': '몸집이 작습니다.',
    'Wise. Weak.': '지혜롭지만 몸은 약합니다.',
    'Insightful. Frail.': '통찰력이 있지만 몸은 연약합니다.',
    'Tough as wood. Low in protein.': '나무처럼 질깁니다. 단백질은 부족합니다.',
    'Weakened mind. Bestial instincts.':
      '정신은 약해졌지만 야수의 본능이 남아 있습니다.',
    'Your mind and movements are alien but your bones are hollow and fragile.':
      '정신과 움직임은 이질적이지만 뼈는 속이 비고 연약합니다.',
    'Obsessed. Weak from neglect.':
      '집착에 사로잡혔습니다. 자신을 돌보지 않아 몸이 약해졌습니다.',
    'Mental Focus. Too Much Reading!':
      '정신을 집중합니다. 책을 너무 많이 읽었습니다!',
    'Your amplified personality makes up for a soul bartered. A hard life lived has you set for an early grave.':
      '강렬한 개성으로 팔아넘긴 영혼의 빈자리를 메웁니다. 고된 삶 탓에 일찍 무덤에 들 운명입니다.',
    'Covered in wounds and on the edge of death. Monstrously unnerving.':
      '상처투성이로 죽음의 문턱에 서 있습니다. 괴물처럼 불길한 분위기를 풍깁니다.',
  };
  const helpers = text
    .split('\n')
    .map((line) => flavorKo[line] ?? translateGeneratedText(line));
  return {
    ...block,
    text,
    translation: {
      ...block.translation,
      // Never display a translation of the numeric clauses removed from this view.
      ko: helpers.every((helper) => helper.trim())
        ? helpers.join('\n')
        : undefined,
    },
  };
}

export function characterSheetPresentation(
  reading: ReferenceReading,
): CharacterSheetBlock[] {
  if (reading.procedureInputs?.generator === 'scvmbirther')
    return reading.blocks;
  const def = characterClasses().find(
    (candidate) => candidate.id === reading.procedureInputs?.characterClassId,
  );
  const formulas = new Map<string, string>();
  const blocks: CharacterSheetBlock[] = reading.blocks.map((block) => {
    const roll = recordedRoll(reading, block);
    const sheetFormula = creationFormula(block, roll, reading);
    const sheetContext =
      block.title.startsWith('Starting Blessing — ') &&
      reading.procedureInputs?.reclvseBlessings
        ? 'RECLVSE 선택 규칙'
        : creationContext(block, roll, def);
    if (sheetFormula) formulas.set(block.title, sheetFormula);
    return sheetFormula || sheetContext
      ? { ...block, sheetFormula, sheetContext }
      : block;
  });
  return blocks.map((block) =>
    presentClassRules(block, reading, def, formulas),
  );
}
