import type {
  Character,
  CharacterItem,
  SourceReference,
} from '../domain/types';
import type { GeneratedValueProvenance } from '../domain/generationProvenance';
import type { OracleRoll } from '../domain/oracle';
import type { ReferenceReading } from '../domain/referenceReading';
import { sourceProcedure, appPolicy } from '../domain/generationAuthority';
import { characterClass } from './characterClasses';
import { hasScroll } from './character';
import { id } from './random';
import { translateGeneratedText } from './translation';

/** Project the existing class engine into the desk; do not reroll any field here. */
export function classCharacterReading(
  character: Character,
  mode: 'random' | 'chosen',
): ReferenceReading {
  const def = characterClass(character);
  if (!def) throw new Error('SOURCE DATA UNAVAILABLE: character class');
  const rolls: OracleRoll[] = [];
  const blocks: ReferenceReading['blocks'] = [];
  const add = (
    title: string,
    text: string,
    titleKo: string,
    provenance?: GeneratedValueProvenance,
    source = '',
  ) => {
    if (!text.trim()) return;
    const traces = provenance?.rolls ?? [];
    const dice = traces
      .filter((trace) => /^\d*d\d/.test(trace.dice))
      .map((trace) => `${trace.dice} = ${trace.value}`)
      .join(' · ');
    const translated = translateGeneratedText(text);
    blocks.push({
      title,
      text,
      ...(dice ? { dice } : {}),
      translation: {
        titleKo,
        ...(translated && /[가-힣]/u.test(translated)
          ? { ko: translated }
          : {}),
      },
    });
    rolls.push({
      oracleId: traces[0]?.tableId ?? `character.class:${def.id}`,
      title,
      text,
      dice: traces.map((trace) => trace.dice).join(' · '),
      roll: traces[0]?.value ?? 0,
      diceValues: traces.flatMap((trace) => trace.diceValues ?? []),
      entryId: traces[0]?.entryId ?? null,
      source,
      ...(provenance ? { metadata: { provenance } } : {}),
    });
  };
  const scalar = (
    key:
      | 'name'
      | 'className'
      | 'strength'
      | 'agility'
      | 'presence'
      | 'toughness'
      | 'hp'
      | 'omens'
      | 'silver'
      | 'armor'
      | 'powerUses'
      | 'description',
    title: string,
    titleKo: string,
  ) => {
    const value = character[key];
    const text = ['strength', 'agility', 'presence', 'toughness'].includes(key)
      ? `${Number(value) >= 0 ? '+' : ''}${value}`
      : String(value);
    add(
      title,
      text,
      titleKo,
      character.fieldProvenance?.[key],
      character.sources?.[key],
    );
  };
  scalar('name', 'Name', '이름');
  scalar('className', 'Class', '직업');
  for (const [key, title, titleKo] of [
    ['strength', 'Strength', '근력'],
    ['agility', 'Agility', '민첩'],
    ['presence', 'Presence', '지각'],
    ['toughness', 'Toughness', '강인함'],
    ['hp', 'HP', '생명력'],
    ['omens', 'Omens', '오멘'],
    ['silver', 'Silver', '은화'],
    ['armor', 'Armor', '방어구'],
  ] as const)
    scalar(key, title, titleKo);
  if (
    character.powerUses != null &&
    (hasScroll(character) ||
      def.id === 'forlorn-philosopher' ||
      character.equipment.some((item) => item.text.startsWith('Innate Power:')))
  )
    scalar('powerUses', 'Power uses/day', '하루 권능 사용 횟수');
  const items = (
    values: CharacterItem[],
    title: string,
    titleKo: string,
    text = (item: CharacterItem) => item.text,
  ) =>
    values.forEach((item, index) =>
      add(
        values.length > 1 ? `${title} ${index + 1}` : title,
        text(item),
        values.length > 1 ? `${titleKo} ${index + 1}` : titleKo,
        item.provenance,
        item.source,
      ),
    );
  items(character.weapons, 'Weapon', '무기', (item) => {
    const damage = character.weapons.find(
      (weapon) => weapon.id === item.id,
    )?.damage;
    return damage ? `${item.text} · ${damage}` : item.text;
  });
  items(character.equipment, 'Equipment', '장비');
  items(character.traits, 'Trait', '특징');
  items(character.background ?? [], 'Background', '배경');
  items(
    (character.classFeatures ?? []).filter(
      (item) => item.slot !== 'classRules',
    ),
    'Class feature',
    '직업 능력',
  );
  for (const rules of (character.classFeatures ?? []).filter(
    (item) => item.slot === 'classRules',
  ))
    add('Class rules', rules.text, '직업 규칙', rules.provenance, rules.source);
  if (character.description) scalar('description', 'Description', '묘사');
  const classSource: SourceReference = {
    bookId: def.source.bookId,
    pdfPage: def.source.pdfPages,
    tableTitle: def.name,
  };
  const sourceRefs = [
    classSource,
    ...rolls.flatMap((roll) => roll.metadata?.provenance?.sourceRefs ?? []),
  ];
  const title = `${character.name} — ${def.name}`;
  return {
    title,
    blocks,
    sourceRefs: [
      ...new Map(sourceRefs.map((ref) => [JSON.stringify(ref), ref])).values(),
    ],
    procedureInputs: {
      characterMode: mode,
      characterClassId: def.id,
      characterClass: def.name,
    },
    authority: [
      sourceProcedure(`character.class:${def.id}`, [classSource]),
      ...(mode === 'random' ? [appPolicy('app.random-character-class')] : []),
    ],
    oracle: {
      id: id(),
      title,
      rolls,
    },
  };
}
