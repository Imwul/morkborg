import type { OracleDefinition, OracleEntry, OracleRegistry } from './oracle';
import type { SourceReference } from './types';
import type { RulesPack } from '../storage/rulesStore';
import type { CharacterClassDefinition } from '../generators/characterClasses';

import type { ReferenceTextBlock } from './referenceReading';

export interface ReferenceDefinition {
  id: string;
  title: string;
  kind:
    | 'Power'
    | 'Weapon'
    | 'Armor'
    | 'Equipment'
    | 'Class'
    | 'Class ability'
    | 'Rule'
    | 'Move'
    | 'Procedure'
    | 'Travel';
  blocks: ReferenceTextBlock[];
  sourceRefs: SourceReference[];
  canonicalIds: string[];
  relatedIds: string[];
  /** Navigation identities, never generator inputs or replacements for source text. */
  matchTexts: string[];
  tableEntry?: { tableId: string; entryId: string };
  referenceGroup?: string;
  searchAliases?: string[];
  procedureId?: string;
  nextReferenceIds?: string[];
}
export const definitionId = (entryId: string) => `definition:${entryId}`;
const str = (value: unknown) => (typeof value === 'string' ? value : '');
/** Names index existing starting-equipment rows; mechanics remain in those rows. */
const STARTING_GEAR_REFERENCES: Record<
  string,
  { name: string; aliases?: string[]; relatedIds?: string[] }
> = {
  'core.gearA:10-10': { name: 'bomb' },
  'core.gearB:1-1': {
    name: 'life elixir',
    aliases: ['lifeelixir'],
    relatedIds: ['rule:core.rest'],
  },
  'core.gearB:3-3': {
    name: 'small but vicious dog',
    aliases: ['small vicious dog', 'vicious dog'],
  },
  'core.gearB:4-4': { name: 'monkeys' },
};
function ref(table: OracleDefinition, entry?: OracleEntry): SourceReference {
  return {
    bookId: table.sourceBookId,
    tableId: table.id,
    tableTitle: table.title,
    pdfPage: Array.isArray(entry?.metadata?.pages)
      ? (entry.metadata.pages as number[])
      : typeof entry?.metadata?.pdfPage === 'number'
        ? entry.metadata.pdfPage
        : table.sourcePage,
    printedPage:
      typeof entry?.metadata?.printedPage === 'number' ||
      typeof entry?.metadata?.printedPage === 'string'
        ? entry.metadata.printedPage
        : table.printedPage,
    status: table.sourceStatus ?? 'VERIFIED',
    ...(entry ? { entryId: entry.id } : {}),
    ...(typeof entry?.metadata?.sourceNote === 'string'
      ? { note: entry.metadata.sourceNote }
      : {}),
  };
}

/** Read-only projections of canonical source rows; no parallel result pools. */
export function buildReferenceDefinitions(
  registry: OracleRegistry,
  rules: RulesPack | null,
): ReferenceDefinition[] {
  const result: ReferenceDefinition[] = [];
  const classes =
    (
      rules?.notes.characterClasses as
        | { classes?: CharacterClassDefinition[] }
        | undefined
    )?.classes ?? [];
  const coreClasses = classes.filter((c) => c.source.bookId === 'core-full');
  const classTables = new Map<string, string>();
  for (const c of coreClasses)
    for (const step of c.features)
      for (const key of step.tableIds ?? (step.tableId ? [step.tableId] : []))
        classTables.set(key, `class:${c.id}`);
  for (const table of registry.tables) {
    if (
      !table.sourceVerified ||
      table.sourceStatus === 'UNAVAILABLE' ||
      (table.canonicalTableId && table.canonicalTableId !== table.id)
    )
      continue;
    if (table.id === 'core.gearA' || table.id === 'core.gearB') {
      for (const entry of table.entries) {
        const lookup = STARTING_GEAR_REFERENCES[entry.id];
        if (!lookup || entry.sourceUnclear) continue;
        result.push({
          id: definitionId(entry.id),
          title: lookup.name,
          kind: 'Equipment',
          blocks: [
            {
              title: '',
              text: entry.text,
              translation:
                typeof entry.metadata?.ko === 'string'
                  ? { ko: entry.metadata.ko }
                  : undefined,
            },
          ],
          sourceRefs: [ref(table, entry)],
          canonicalIds: [table.id],
          relatedIds: [`oracle:${table.id}`, ...(lookup.relatedIds ?? [])],
          matchTexts: [lookup.name, entry.text],
          searchAliases: lookup.aliases,
          tableEntry: { tableId: table.id, entryId: entry.id },
        });
      }
      continue;
    }
    // Verified read-only procedure catalogs live in the private canonical registry.
    // Group names and search aliases are navigation metadata, never source text.
    if (table.tags.includes('batch-2')) {
      for (const entry of table.entries) {
        const m = entry.metadata;
        if (!m || typeof m.referenceId !== 'string' || !Array.isArray(m.blocks))
          continue;
        const blocks = m.blocks.filter(
          (b): b is ReferenceTextBlock =>
            !!b && typeof b.title === 'string' && typeof b.text === 'string',
        );
        result.push({
          id: m.referenceId,
          title: entry.text,
          kind: m.referenceKind as ReferenceDefinition['kind'],
          blocks,
          sourceRefs: [
            ref(table, entry),
            ...(Array.isArray(m.additionalSourceRefs)
              ? (m.additionalSourceRefs as SourceReference[])
              : []),
          ],
          canonicalIds: [table.id],
          relatedIds: Array.isArray(m.relatedIds)
            ? ([...m.relatedIds] as string[])
            : [],
          matchTexts:
            m.referenceKind === 'Weapon' || m.referenceKind === 'Equipment'
              ? [entry.text]
              : [],
          tableEntry: { tableId: table.id, entryId: entry.id },
          referenceGroup:
            typeof m.referenceGroup === 'string' ? m.referenceGroup : undefined,
          searchAliases: Array.isArray(m.searchAliases)
            ? (m.searchAliases as string[])
            : [],
          procedureId:
            typeof m.procedureId === 'string' ? m.procedureId : undefined,
        });
      }
      continue;
    }
    if (table.id === 'aitc.businesses') {
      const entry = table.entries.find((e) => e.metadata?.title === 'Gunsmith');
      if (entry)
        result.push({
          id: definitionId(entry.id),
          title: 'Gunsmith',
          kind: 'Rule',
          blocks: [{ title: 'ALÖNE IN THE CROWD', text: entry.text }],
          sourceRefs: [ref(table, entry)],
          canonicalIds: [table.id],
          relatedIds: ['rule:heretic.blackpowder'],
          nextReferenceIds: Array.isArray(entry.metadata?.followUpReferenceIds)
            ? entry.metadata.followUpReferenceIds.filter(
                (id): id is string => typeof id === 'string',
              )
            : [],
          matchTexts: ['Gunsmith'],
          tableEntry: { tableId: table.id, entryId: entry.id },
        });
      continue;
    }
    const kind: ReferenceDefinition['kind'] | undefined = [
      'core.sacred',
      'core.unclean',
    ].includes(table.id)
      ? 'Power'
      : table.id === 'core.weaponCatalog'
        ? 'Weapon'
        : table.id === 'core.armor'
          ? 'Armor'
          : table.id === 'core.equipmentCatalog'
            ? 'Equipment'
            : classTables.has(table.id)
              ? 'Class ability'
              : undefined;
    if (!kind) continue;
    for (const entry of table.entries) {
      if (entry.sourceUnclear) continue;
      const meta = entry.metadata ?? {};
      const title = str(meta.referenceName) || str(meta.name) || entry.text;
      const parts: string[] = [];
      if (kind === 'Power') parts.push(str(meta.effect));
      else if (kind === 'Armor') {
        if (typeof meta.tier === 'number')
          parts.push(
            `Tier ${meta.tier}${typeof meta.damageReduction === 'string' ? ` · −${meta.damageReduction} damage` : ''}`,
          );
        const penalties = [
          ...(typeof meta.agilityDRPenalty === 'number' && meta.agilityDRPenalty
            ? [`Agility tests DR +${meta.agilityDRPenalty}`]
            : []),
          ...(typeof meta.defenseDRPenalty === 'number' && meta.defenseDRPenalty
            ? [`defence DR +${meta.defenseDRPenalty}`]
            : []),
        ];
        if (penalties.length) parts.push(`${penalties.join('; ')}.`);
        if (typeof meta.valueSilver === 'number')
          parts.push(`${meta.valueSilver}s`);
        if (typeof meta.scrollRestriction === 'string')
          parts.push(meta.scrollRestriction);
      } else if (kind === 'Weapon' || kind === 'Equipment') {
        if (typeof meta.damage === 'string')
          parts.push(`Damage ${meta.damage}`);
        if (meta.price) parts.push(str(meta.price));
        if (meta.effect) parts.push(str(meta.effect));
        if (meta.ammunition) parts.push(str(meta.ammunition));
        if (meta.startingAmmunition) parts.push(str(meta.startingAmmunition));
      } else parts.push(entry.text);
      if (!parts.some(Boolean)) continue; // Missing effects never acquire substitute prose.
      // The starting kit and purchase list differ in the supplied book. Keep both
      // source rows separate, rather than silently reconciling their contents.
      const startingTable =
        entry.id === 'core.equipmentCatalog:toolbox'
          ? registry.tables.find(
              (t) => t.id === 'core.gearB' && t.sourceVerified,
            )
          : undefined;
      const startingEntry = startingTable?.entries.find(
        (e) => e.id === 'core.gearB:6-6',
      );
      result.push({
        id: definitionId(entry.id),
        title,
        kind,
        blocks: [
          {
            title: startingEntry ? 'Purchase list' : '',
            text: parts.filter(Boolean).join('\n'),
          },
          ...(startingEntry
            ? [{ title: 'Starting equipment', text: startingEntry.text }]
            : []),
        ],
        sourceRefs: [
          ref(table, entry),
          ...(startingTable && startingEntry
            ? [ref(startingTable, startingEntry)]
            : []),
          ...(Array.isArray(meta.additionalSourceRefs)
            ? (meta.additionalSourceRefs as SourceReference[])
            : []),
        ],
        canonicalIds: [table.id],
        relatedIds: [
          `oracle:${table.id}`,
          ...(kind === 'Power' ? ['rule:core.casting'] : []),
          ...(kind === 'Armor' ? ['rule:core.armor-shield'] : []),
          ...(classTables.has(table.id) ? [classTables.get(table.id)!] : []),
        ],
        matchTexts: [title, entry.text],
        tableEntry: { tableId: table.id, entryId: entry.id },
      });
    }
  }
  for (const c of coreClasses) {
    if (
      !c.playerRules?.length ||
      !registry.books.some((b) => b.id === c.source.bookId)
    )
      continue;
    const source: SourceReference = {
      bookId: c.source.bookId,
      tableTitle: c.name,
      pdfPage: c.source.pdfPages,
      printedPage: c.source.printedPages?.join('–'),
      status: 'VERIFIED',
    };
    const ids = c.features.flatMap(
      (s) => s.tableIds ?? (s.tableId ? [s.tableId] : []),
    );
    result.push({
      id: `class:${c.id}`,
      title: c.name,
      kind: 'Class',
      blocks: [
        {
          title: '',
          text: `HP Toughness + d${c.hpDie}\nOmens d${c.omenDie}${c.omenBonus ? ` + ${c.omenBonus}` : ''}`,
        },
        ...c.playerRules.map((text) => ({ title: '', text })),
      ],
      sourceRefs: [source],
      canonicalIds: ids,
      relatedIds: [
        ...ids.map((id) => `oracle:${id}`),
        'rule:core.omens',
        'rule:core.casting',
      ],
      matchTexts: [c.name],
    });
  }
  const travel = registry.tables.find(
    (t) => t.id === 'feretory.travelDistances' && t.sourceVerified,
  );
  if (travel)
    result.push({
      id: 'rule:feretory.travel-distances',
      title: 'Traveling the Dying Lands · Road travel times',
      kind: 'Travel',
      blocks: [
        { title: '', text: travel.description ?? '' },
        ...travel.entries.map((e) => ({
          title: e.text,
          text: str(e.metadata?.duration),
        })),
      ],
      sourceRefs: [ref(travel)],
      canonicalIds: [travel.id],
      matchTexts: [],
      relatedIds: [
        'rule:sd.travel-day',
        'rule:feretory.roads',
        'rule:sd.daily-misery',
        'oracle:feretory.travelDistances',
      ],
    });
  return result;
}

/** Development/load-time validation, not a render-time scan. */
export function unresolvedReferenceDefinitions(
  definitions: ReferenceDefinition[],
  registry: OracleRegistry,
): string[] {
  return definitions.flatMap((d) => {
    const problems: string[] = [];
    if (!d.blocks.some((b) => b.text.trim())) problems.push('empty effect');
    if (!d.sourceRefs.length) problems.push('missing source');
    for (const source of d.sourceRefs) {
      if (
        !registry.books.some((b) => b.id === source.bookId) ||
        source.pdfPage == null ||
        source.status !== 'VERIFIED'
      )
        problems.push('unresolved source');
      if (source.tableId) {
        const table = registry.tables.find((t) => t.id === source.tableId);
        if (!table) problems.push(`missing table ${source.tableId}`);
        else {
          if (table.sourceBookId !== source.bookId)
            problems.push('wrong source book');
          if (
            source.entryId &&
            !table.entries.some((e) => e.id === source.entryId)
          )
            problems.push(`missing entry ${source.entryId}`);
        }
      } else if (source.entryId) problems.push('entry without table');
    }
    for (const id of d.canonicalIds)
      if (!registry.tables.some((t) => t.id === id))
        problems.push(`missing table ${id}`);
    return problems.map((p) => `${d.id}: ${p}`);
  });
}
