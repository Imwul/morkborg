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
  // SD PDF11 identifies the species; Bare Bones PDF59–62 identifies the
  // named statblocks. Repair only the six legacy cross-reference mistakes.
  if (table.id === 'sd.stockCreatures' && table.sourceBookId === 'sd') {
    const bindings: Record<number, [string, string, string]> = {
      5: [
        'Blood Drenched Skeleton',
        'creature:core:59:zukuma',
        'creature:core:60:belze',
      ],
      6: ['Zombie', 'creature:core:60:arbint', 'creature:core:61:nodh'],
      12: [
        'Wickhead Knife-Wielder',
        'creature:core:61:nodh',
        'creature:core:62:aland',
      ],
      17: ['Berserker', 'creature:core:60:belze', 'creature:core:59:zukuma'],
      18: ['Wyvern', 'creature:core:62:aland', 'creature:core:62:eulotha'],
      20: ['Troll', 'creature:core:62:eulotha', 'creature:core:60:arbint'],
    };
    return {
      ...table,
      entries: table.entries.map((entry) => {
        const binding = bindings[entry.min];
        const links = entry.metadata?.followUpReferenceIds;
        if (
          !binding ||
          entry.min !== entry.max ||
          entry.text !== binding[0] ||
          !Array.isArray(links) ||
          !links.includes(binding[1])
        )
          return entry;
        return {
          ...entry,
          metadata: {
            ...entry.metadata,
            followUpReferenceIds: links.map((id) =>
              id === binding[1] ? binding[2] : id,
            ),
          },
        };
      }),
    };
  }
  // PDF24 explicitly prints D6 on Brute's Archetype Skills chart. Correct
  // the old extraction note while retaining this reader's selection-only UI.
  if (
    table.id === 'reclvse.class.brute.powers' &&
    table.sourceBookId === 'reclvse' &&
    table.sourceNote?.includes(
      'No explicit D6 token is printed on this particular chart.',
    )
  )
    return {
      ...table,
      sourceNote: table.sourceNote.replace(
        'The source says “Choose one or roll” and gives six entries; d6 follows the 1–6 index. No explicit D6 token is printed on this particular chart.',
        'PDF24 explicitly says “Choose one or roll D6 on this table”. This reader retains direct selection rather than automatic rolling. PDF24쪽은 직접 선택하거나 d6를 굴리도록 명시합니다. 이 화면은 직접 선택 방식을 제공합니다.',
      ),
    };
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
