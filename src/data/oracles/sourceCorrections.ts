import type { OracleDefinition } from '../../domain/oracle';
import type { RulesPack } from '../../storage/rulesStore';

/** Verified against the supplied Bare Bones PDF, including continued tables. */
export const VERIFIED_PAGE_CORRECTIONS: Record<string, number[]> = {
  'core.rooms': [73, 74],
  'core.sparks': [69, 70],
  'core.contacts': [68, 69],
  'core.unclean': [34, 35],
};

/** Changes source coordinates only. English, IDs, weights, translations and saved results are untouched. */
export function correctRuleSourcePages(pack: RulesPack): RulesPack {
  return {
    ...pack,
    tables: Object.fromEntries(
      Object.entries(pack.tables).map(([id, table]) => [
        id,
        table.book === 'core' && VERIFIED_PAGE_CORRECTIONS[id]
          ? { ...table, pages: [...VERIFIED_PAGE_CORRECTIONS[id]] }
          : table,
      ]),
    ),
  };
}

export function correctOracleSourcePages(
  table: OracleDefinition,
): OracleDefinition {
  const pages =
    table.sourceBookId === 'core' && VERIFIED_PAGE_CORRECTIONS[table.id];
  if (!pages) return table;
  return {
    ...table,
    sourcePage: [...pages],
    printedPage: pages.join('–'),
    entries: table.entries.map((entry) => {
      const second =
        table.id === 'core.rooms'
          ? entry.min >= 25
          : table.id === 'core.sparks'
            ? entry.min >= 43
            : table.id === 'core.contacts'
              ? entry.min >= 13
              : entry.min >= 8;
      return {
        ...entry,
        get text() {
          return entry.text;
        },
        metadata: {
          ...entry.metadata,
          pdfPage: pages[second ? 1 : 0],
          printedPage: pages[second ? 1 : 0],
        },
      };
    }),
  };
}

/** AITC PDF11 says the picture's monetary worth halves, not the permanent modifier. */
export function correctOracleGuidance(
  table: OracleDefinition,
): OracleDefinition {
  if (
    table.id !== 'aitc.notable-artefact-type' ||
    table.sourceBookId !== 'aitc'
  )
    return table;
  return {
    ...table,
    entries: table.entries.map((entry) =>
      entry.min === 3 &&
      entry.metadata?.effectRule ===
        'Consume part of the canvas to obtain the permanent effect, halving its value.'
        ? {
            ...entry,
            get text() {
              return entry.text;
            },
            metadata: {
              ...entry.metadata,
              effectRule:
                'Consume part of the canvas for a permanent effect. The picture’s monetary worth is halved.',
            },
          }
        : entry,
    ),
  };
}
