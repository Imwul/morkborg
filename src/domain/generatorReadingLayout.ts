import type { ReferenceReading, ReferenceTextBlock } from './referenceReading';

type Block = ReferenceReading['blocks'][number];
export interface CharacterReadingGroup {
  id: 'equipment' | 'features' | 'background';
  title: string;
  titleKo: string;
  blocks: Block[];
}

/** Group the view only; each original block, condition and roll remains intact. */
function characterReadingGroups(fields: Block[]): CharacterReadingGroup[] {
  const groups: CharacterReadingGroup[] = [
    { id: 'equipment', title: 'Equipment', titleKo: '장비', blocks: [] },
    {
      id: 'features',
      title: 'Class & powers',
      titleKo: '직업과 권능',
      blocks: [],
    },
    {
      id: 'background',
      title: 'Traits & background',
      titleKo: '특징과 배경',
      blocks: [],
    },
  ];
  for (const block of fields) {
    const group =
      /^(Armor|Weapons?|Equipment|Starting Equipment|Food|Container|Inventory|Scroll)(\b|\s)/i.test(
        block.title,
      )
        ? groups[0]
        : /^(Class|Power|Ability|Abilities|Feature)(\b|\s)/i.test(block.title)
          ? groups[1]
          : groups[2];
    group.blocks.push(block);
  }
  return groups.filter((group) => group.blocks.length);
}
const STAT_LABELS: Record<string, string> = {
  HP: '생명력',
  Morale: '사기',
  Armor: '방어구',
  Attack: '공격',
  Damage: '피해',
  Omens: '오멘',
  Silver: '은화',
  Abilities: '능력치',
  Strength: '근력',
  Agility: '민첩',
  Presence: '지각',
  Toughness: '강인함',
};

/** A view of an existing result. Never changes its rolls, saved data or copy text. */
export function generatorReadingLayout(
  reading: ReferenceReading,
  referenceId?: string,
) {
  const character =
    referenceId?.startsWith('procedure:character.') ||
    reading.procedureInputs?.generator === 'scvmbirther';
  const identity = character
    ? reading.blocks.find(
        (block) => /^(Name|Names)$/.test(block.title) && block.text.trim(),
      )
    : undefined;
  const characterClass = identity
    ? reading.blocks.find((block) => block.title === 'Class')
    : undefined;
  const site = reading.procedureInputs?.generator === 'monster-site';
  const introduction = site
    ? reading.blocks.find(
        (block) => block.title === 'Appearance' && block.text.trim(),
      )
    : undefined;
  const stats: Block[] = [];
  const fields: Block[] = [];
  const hasStatSheet = reading.blocks.some((block) =>
    ['HP', 'Morale', 'Abilities'].includes(block.title),
  );
  for (const block of reading.blocks) {
    if (
      block === introduction ||
      block === identity ||
      block === characterClass
    )
      continue;
    // Only suppress a desire actually included in the complete introduction.
    if (
      introduction &&
      block.title === 'Wants' &&
      block.text.trim() &&
      introduction.text.includes(block.text) &&
      (!block.translation?.ko ||
        introduction.translation?.ko?.includes(block.translation.ko))
    )
      continue;
    if (
      hasStatSheet &&
      !(identity && block.title === 'Armor') &&
      STAT_LABELS[block.title] &&
      block.text.trim() &&
      !block.definitionReferenceId
    ) {
      stats.push({
        ...block,
        translation: {
          ...block.translation,
          titleKo: block.translation?.titleKo ?? STAT_LABELS[block.title],
        },
      });
    } else fields.push(block);
  }
  // Character identity precedes the compact vital values; do not invent absent stats.
  if (identity)
    stats.sort((a, b) => {
      const order = [
        'HP',
        'Omens',
        'Abilities',
        'Strength',
        'Agility',
        'Presence',
        'Toughness',
        'Armor',
        'Silver',
      ];
      return order.indexOf(a.title) - order.indexOf(b.title);
    });
  return {
    identity,
    characterClass,
    introduction,
    stats,
    fields,
    groups: identity ? characterReadingGroups(fields) : undefined,
  };
}

/** Split only the stat-line format produced by our creature renderer. */
export function creatureStatBlocks(
  text: string,
): ReferenceTextBlock[] | undefined {
  const parts = text
    .split(' · ')
    .map((part) => /^(HP|Morale|Armor|Damage) (.+)$/s.exec(part));
  if (!parts.length || parts.some((part) => !part)) return;
  return parts.map((part) => ({
    title: part![1],
    text: part![2],
    translation: { titleKo: STAT_LABELS[part![1]] },
  }));
}
