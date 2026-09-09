import type { ReferenceReading } from './referenceReading';

/** Existing follower fields remain components; no reroll or creature-stat substitution. */
export function wildWickheadBlocks(
  record: Record<string, unknown>,
): ReferenceReading['blocks'] | undefined {
  if (
    record.book !== 'core' ||
    record.pdfPage !== 65 ||
    record.name !== 'Wild Wickhead'
  )
    return;
  const helper = record.referenceTranslationKo as
    | Record<string, string | string[]>
    | undefined;
  const english = [
    `HP ${String(record.hp)} · Morale ${String(record.morale)} · ${String(record.armor)}`,
    `${String(record.attack)} ${String(record.damage)}`,
  ];
  const korean = [
    `HP ${String(record.hp)} · 사기 ${String(record.morale)} · 방어구 없음`,
    `단검 ${String(record.damage)}`,
  ];
  for (const [field, title, titleKo] of [
    ['traits', 'Trait', '성격'],
    ['specialty', 'Specialty', '특기'],
    ['values', 'Values', '소중히 여기는 것'],
  ]) {
    const table = record[field] as {
      dice: string;
      entries: { roll?: number; min?: number; max?: number; text: string }[];
    };
    english.push('', `${title} (${table.dice})`);
    korean.push('', `${titleKo} (${table.dice})`);
    table.entries.forEach((entry, index) => {
      const selector =
        entry.roll ??
        `${entry.min}${entry.max !== entry.min ? `–${entry.max}` : ''}`;
      english.push(`${selector}: ${entry.text}`);
      korean.push(
        `${selector}: ${Array.isArray(helper?.[field]) ? helper[field][index] : ''}`,
      );
    });
  }
  for (const field of ['sourceNotes', 'description']) {
    if (typeof record[field] === 'string') {
      english.push('', record[field]);
      korean.push('', typeof helper?.[field] === 'string' ? helper[field] : '');
    }
  }
  return [
    {
      title: String(record.name),
      kind: 'creature',
      text: english.join('\n'),
      ...(helper ? { translation: { ko: korean.join('\n') } } : {}),
    },
  ];
}
