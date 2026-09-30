import type { OracleDefinition, OracleRoll } from './oracle';
import { oracleReadingText, type ReferenceReading } from './referenceReading';

/** Only the explicit scroll dependency printed in the starting equipment tables. */
export function equipmentScrollTable(parent: OracleRoll): string | undefined {
  if (!['core.gearA', 'core.gearB'].includes(parent.oracleId)) return;
  const kind = parent.metadata?.scrollTable;
  if (kind === 'unclean' || kind === 'sacred') return `core.${kind}`;
}

export function containerAlternatives(
  table: OracleDefinition,
  parent: OracleRoll,
) {
  if (
    table.id !== 'core.containers' ||
    parent.oracleId !== table.id ||
    parent.roll !== 6
  )
    return [];
  const selected = table.entries.find((row) => row.id === parent.entryId);
  return selected ? table.entries.filter((row) => row.max < selected.min) : [];
}

export function isEquipmentScrollChild(parent: OracleRoll, child: OracleRoll) {
  return (
    !!parent.entryId &&
    child.oracleId === equipmentScrollTable(parent) &&
    child.metadata?.parentEntryId === parent.entryId &&
    child.metadata?.parentOracleId === parent.oracleId
  );
}

/** Resolve the displayed equipment value for Copy/save, without altering source rolls. */
export function readingWithEquipmentScrolls(
  reading: ReferenceReading,
  children: WeakMap<OracleRoll, OracleRoll>,
): ReferenceReading {
  const resolved = (reading.oracle?.rolls ?? []).flatMap((parent) => {
    const child = children.get(parent);
    return child && isEquipmentScrollChild(parent, child)
      ? [{ parent, child }]
      : [];
  });
  if (!resolved.length) return reading;
  const resolve = <T extends { text: string; translation?: unknown }>(
    block: T,
  ): T => {
    const match = resolved.find(
      ({ parent }) =>
        block.text === parent.text ||
        block.text.startsWith(`${parent.text}\n\n`),
    );
    return match
      ? {
          ...block,
          text: oracleReadingText(match.child),
          translation: undefined,
        }
      : block;
  };
  return {
    ...reading,
    blocks: reading.blocks.map(resolve),
    copyContent: reading.copyContent
      ? {
          ...reading.copyContent,
          blocks: reading.copyContent.blocks.map(resolve),
        }
      : undefined,
    sourceRefs: [
      ...reading.sourceRefs,
      ...resolved.flatMap(
        ({ child }) => child.metadata?.provenance?.sourceRefs ?? [],
      ),
    ],
  };
}
