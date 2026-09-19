import type { OracleRoll } from './oracle';
import {
  copyReferenceReading,
  oracleReadingText,
  type ReferenceReading,
} from './referenceReading';

/** One explicit inline result per existing parent roll. Tab-local, never serialized. */
export type InlineChildResults = WeakMap<OracleRoll, OracleRoll>;
export const createInlineChildResults = (): InlineChildResults => new WeakMap();

export function retainInlineChild(
  results: InlineChildResults,
  parent: OracleRoll,
  child: OracleRoll,
): boolean {
  if (
    !parent.entryId ||
    child.oracleId !== parent.oracleId ||
    child.metadata?.parentEntryId !== parent.entryId
  )
    return false;
  results.set(parent, child);
  return true;
}

/** Serialize only children attached to this current reading, without changing it. */
export function copyReadingWithInlineChildren(
  reading: ReferenceReading,
  results: InlineChildResults,
  withSource = false,
): string {
  const parents = reading.oracle?.rolls ?? [];
  const children = parents.flatMap((parent) => {
    const child = results.get(parent);
    return child
      ? [
          {
            title: '',
            text: [
              parents.length > 1 ? `${parent.title} · ${parent.text}` : '',
              `↳ ${oracleReadingText(child)}`,
            ]
              .filter(Boolean)
              .join('\n'),
          },
        ]
      : [];
  });
  if (!children.length) return copyReferenceReading(reading, withSource);
  const content = reading.copyContent ?? reading;
  return copyReferenceReading(
    {
      ...reading,
      copyContent: {
        title: content.title,
        blocks: [...content.blocks, ...children],
      },
    },
    withSource,
  );
}
