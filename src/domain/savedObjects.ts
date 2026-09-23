import {
  copyReadingWithInlineChildren,
  type InlineChildResults,
} from './inlineReadingContinuity';
import {
  translateGeneratedText,
  polishKoreanTranslation,
} from '../generators/translation';
import {
  copyReferenceReading,
  type ReferenceReading,
} from './referenceReading';

export const OBJECT_KINDS = {
  character: '캐릭터',
  npc: 'NPC',
  dungeon: '던전',
  city: '도시',
} as const;
export type ObjectKind = keyof typeof OBJECT_KINDS;
export interface SavedObject {
  id: string;
  kind: ObjectKind;
  name: string;
  referenceId: string;
  text: string;
  originalText: string;
  sourceText: string;
  createdAt: string;
  updatedAt: string;
}
export interface ObjectShelf {
  version: 1;
  objects: SavedObject[];
}
export const emptyObjectShelf = (): ObjectShelf => ({
  version: 1,
  objects: [],
});
export function objectKindForReference(id: string): ObjectKind | null {
  if (id === 'procedure:character.core-classless') return 'character';
  if (id === 'procedure:workbench.npc') return 'npc';
  if (id === 'procedure:sd.dungeon-preparation') return 'dungeon';
  if (id === 'procedure:aitc.settlement') return 'city';
  return null;
}
/** Reuse the reader's existing language helpers; never translate or alter canonical data. */
function bilingualSnapshot(reading: ReferenceReading): ReferenceReading {
  const helper = (text: string, explicit?: string) => {
    const ko = polishKoreanTranslation(
      explicit?.trim() ? explicit : translateGeneratedText(text),
    );
    return ko && ko.normalize('NFC') !== text.normalize('NFC') ? ko : '';
  };
  const block = (value: { title: string; text: string }) => {
    const original = reading.blocks.find(
      (b) => b.title === value.title && b.text === value.text,
    );
    const titleKo = helper(value.title, original?.translation?.titleKo);
    const textKo = helper(value.text, original?.translation?.ko);
    return {
      ...value,
      title: [value.title, titleKo].filter(Boolean).join(' · '),
      text: [value.text, textKo].filter(Boolean).join('\n'),
    };
  };
  return {
    ...reading,
    blocks: reading.blocks.map(block),
    copyContent: reading.copyContent
      ? {
          ...reading.copyContent,
          blocks: reading.copyContent.blocks.map(block),
        }
      : undefined,
  };
}
export function objectFromReading(
  referenceId: string,
  reading: ReferenceReading,
  children?: InlineChildResults,
): SavedObject {
  const kind = objectKindForReference(referenceId);
  if (!kind) throw new Error('캐릭터·NPC·던전·도시만 보관합니다.');
  const snapshot = bilingualSnapshot(reading);
  const text = children
    ? copyReadingWithInlineChildren(snapshot, children)
    : copyReferenceReading(snapshot);
  if (!reading.blocks.some((b) => b.text.trim()))
    throw new Error('먼저 결과를 생성하세요.');
  const nameField = reading.blocks
    .find((block) =>
      ['name', 'names', 'dungeon name'].includes(block.title.toLowerCase()),
    )
    ?.text.trim();
  const cityName =
    kind === 'city'
      ? ['aitc.settlement-name-prefix', 'aitc.settlement-name-suffix']
          .map(
            (id) =>
              reading.oracle?.rolls.find((roll) => roll.oracleId === id)
                ?.text ?? '',
          )
          .join('')
      : '';
  return {
    id: crypto.randomUUID(),
    kind,
    referenceId,
    name: (
      reading.npcSnapshot?.name ||
      nameField ||
      cityName ||
      reading.title
    ).slice(0, 100),
    text,
    originalText: text,
    sourceText: children
      ? copyReadingWithInlineChildren(reading, children, true)
      : copyReferenceReading(reading, true),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
export function validateObjectShelf(value: unknown): ObjectShelf {
  const shelf = value as ObjectShelf;
  if (
    shelf?.version !== 1 ||
    !Array.isArray(shelf.objects) ||
    shelf.objects.length > 200
  )
    throw new Error('보관함 파일 형식을 확인하세요.');
  const ids = new Set<string>();
  for (const item of shelf.objects) {
    if (
      !item ||
      typeof item.kind !== 'string' ||
      !Object.hasOwn(OBJECT_KINDS, item.kind) ||
      objectKindForReference(item.referenceId) !== item.kind ||
      ![
        'id',
        'name',
        'text',
        'originalText',
        'sourceText',
        'createdAt',
        'updatedAt',
      ].every((k) => typeof item[k as keyof SavedObject] === 'string') ||
      !item.id ||
      !item.name.trim() ||
      item.name.length > 100 ||
      [item.text, item.originalText, item.sourceText].some(
        (t) => t.length > 150000,
      ) ||
      ids.has(item.id) ||
      !Number.isFinite(Date.parse(item.createdAt)) ||
      !Number.isFinite(Date.parse(item.updatedAt))
    )
      throw new Error(
        '보관 항목을 확인하세요. 원본 파일은 변경하지 않았습니다.',
      );
    ids.add(item.id);
  }
  return structuredClone(shelf);
}
export function appendSavedObject(
  shelf: ObjectShelf,
  item: SavedObject,
): ObjectShelf {
  return validateObjectShelf({ version: 1, objects: [item, ...shelf.objects] });
}
