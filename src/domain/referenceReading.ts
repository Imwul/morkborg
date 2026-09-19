import type { ReferenceEvidence } from './referenceSources';
import type { GenerationAuthority } from './generationProvenance';
import type { SourceReference } from './types';
import type { OracleEntry, OracleResult, OracleRoll } from './oracle';
import { FERETORY_TABLE_IDS } from '../generators/feretory';
import {
  isScenarioReference,
  isScenarioTable,
} from '../data/scenarioExclusions';
import { BOOK_ABBREVIATIONS, shortBookTitle } from './sourceDisplay';
export interface ReferenceTextBlock {
  title: string;
  text: string;
  /** App-authored language helper; canonical English remains the generator input. */
  translation?: { ko?: string; titleKo?: string };
}
export interface ReferenceReading {
  procedureInputs?: Record<string, string | number | boolean>;
  /** Transient workbench input metadata; never canonical source text or Campaign schema. */
  rollMethod?: {
    kind: 'APP_ROLL' | 'USER_ROLL' | 'MIXED';
    inputs?: Record<string, string>;
  };
  npcSnapshot?: import('./types').NPC;
  rareMonster?: import('./depthsProcedures').RareMonsterTrace;
  childReferenceIds?: string[];
  valuationReferenceId?: string;
  authority?: GenerationAuthority[];
  title: string;
  blocks: (ReferenceTextBlock & {
    dice?: string;
    kind?: 'creature';
    definitionReferenceId?: string;
  })[];
  copyContent?: { title: string; blocks: { title: string; text: string }[] };
  sourceRefs: SourceReference[];
  evidence?: ReferenceEvidence[];
  oracle?: OracleResult;
  relatedIds?: string[];
  fixedLookups?: { oracleId: string; roll: number }[];
}
/** Keep one creature together while retaining every original die in OracleResult. */
export function feretoryResultBlock(
  result: OracleResult,
): ReferenceReading['blocks'][number] | undefined {
  const hp = result.rolls.find((roll) => roll.oracleId === 'feretory.hp');
  const appearance = FERETORY_TABLE_IDS.map((id) =>
    result.rolls.find((roll) => roll.oracleId === id),
  );
  if (!hp || appearance.some((roll) => !roll)) return;
  return {
    title: 'The Monster Approaches',
    kind: 'creature',
    text: [hp.text, appearance.map((roll) => roll!.text).join('; ')].join(
      '\n\n',
    ),
    dice:
      appearance
        .map((roll, index) => `${['A', 'B', 'C'][index]} d12 = ${roll!.roll}`)
        .join(' · ') + ` · HP ${hp.dice} = ${hp.roll} × 2`,
  };
}
export function copyReferenceReading(
  reading: ReferenceReading,
  withSource = false,
) {
  const content = reading.copyContent ?? reading;
  const body = [
    content.title,
    ...content.blocks.map((block) =>
      [
        block.title === content.title ? '' : block.title,
        block.text.replace(
          /^SOURCE DATA UNAVAILABLE: [^\n]+ · 연결된 원문 자료를 먼저 가져오세요\.$/gm,
          'SOURCE DATA UNAVAILABLE · 연결된 원문 자료를 먼저 가져오세요.',
        ),
      ]
        .filter(Boolean)
        .join('\n'),
    ),
  ].join('\n\n');
  if (!withSource) return body;
  // Clipboard citations are for play. Audit notes, canonical IDs and roll traces stay in Source.
  const sources = reading.sourceRefs.map((ref) => {
    const book = BOOK_ABBREVIATIONS.some(
      (candidate) => candidate.id === ref.bookId,
    )
      ? shortBookTitle(ref.bookId, ref.bookTitle)
      : ref.bookTitle && ref.bookTitle !== ref.bookId
        ? shortBookTitle(undefined, ref.bookTitle)
        : 'Source';
    return [
      book,
      ref.pdfPage == null ? '' : `PDF ${[ref.pdfPage].flat().join(', ')}`,
      ref.printedPage == null ? '' : `인쇄 p. ${ref.printedPage}`,
    ]
      .filter(Boolean)
      .join(' · ');
  });
  return sources.length
    ? body + '\n\n' + [...new Set(sources)].join('\n')
    : body;
}

/** Conditions belong beside the rolled effect, including when copied to a notebook. */
export function oracleReadingText(roll: Pick<OracleRoll, 'text' | 'metadata'>) {
  const notes = [
    'effect',
    'effectRule',
    'conditional',
    'condition',
    'procedureNote',
  ]
    .map((key) => roll.metadata?.[key])
    .filter(
      (value): value is string => typeof value === 'string' && !!value.trim(),
    );
  return [
    roll.text,
    ...new Set(notes.filter((note) => !roll.text.includes(note))),
  ].join('\n\n');
}
export function oraclePrintedRange(entry: OracleEntry) {
  if (typeof entry.metadata?.originalRange === 'string')
    return entry.metadata.originalRange;
  if (entry.metadata?.openEnded === true && entry.metadata?.comparison === '>=')
    return `${entry.min}+`;
  return entry.min === entry.max
    ? String(entry.min)
    : `${entry.min}–${entry.max}`;
}
/** Existing source metadata only; presentation links never become execution dependencies. */
export function oracleFollowUpLinks(
  metadata?: Record<string, unknown>,
  tableId?: string,
): Pick<ReferenceReading, 'relatedIds' | 'fixedLookups'> {
  const tableIds: string[] = [];
  const addTable = (value: unknown, legacy = false) => {
    // Legacy fields also contain prose; existing explicit IDs retain their schema.
    if (
      typeof value === 'string' &&
      (!legacy || /^[a-z][a-z0-9-]*(?:\.[a-zA-Z0-9-]+)+$/.test(value)) &&
      !isScenarioTable(value)
    )
      tableIds.push(value);
  };
  if (Array.isArray(metadata?.followUpOracleIds))
    metadata.followUpOracleIds.forEach((value) => addTable(value));
  const follow = metadata?.followUp;
  if (follow && typeof follow === 'object' && !Array.isArray(follow)) {
    const value = follow as Record<string, unknown>;
    addTable(value.table, true);
    if (Array.isArray(value.tables))
      value.tables.forEach((id) => addTable(id, true));
  }
  // These local IDs belong to source-verified canonical RECLVSE columns.
  if (
    tableId === 'reclvse.quickContents' ||
    tableId === 'reclvse.contentsCategory'
  ) {
    const id = metadata?.subtableId;
    if (
      typeof id === 'string' &&
      ['roomDiscovery', 'roomHazard', 'roomEncounter', 'roomLoot'].includes(id)
    )
      addTable(`reclvse.${id}`);
  }
  const nested = metadata?.subtable;
  if (
    tableId &&
    nested &&
    typeof nested === 'object' &&
    !Array.isArray(nested)
  ) {
    const id = (nested as Record<string, unknown>).id;
    if (typeof id === 'string' && /^[a-zA-Z0-9-]+$/.test(id))
      addTable(`${tableId}.${id}`);
  }
  if (
    (tableId === 'core.gearA' || tableId === 'core.gearB') &&
    (metadata?.scrollTable === 'unclean' || metadata?.scrollTable === 'sacred')
  )
    addTable(`core.${metadata.scrollTable}`);
  return {
    relatedIds: [
      ...new Set([
        ...(Array.isArray(metadata?.followUpReferenceIds)
          ? metadata.followUpReferenceIds.filter(
              (v): v is string =>
                typeof v === 'string' && !isScenarioReference(v),
            )
          : []),
        ...tableIds.map((key) => `oracle:${key}`),
      ]),
    ],
    fixedLookups: Array.isArray(metadata?.fixedLookups)
      ? metadata.fixedLookups.filter(
          (value): value is { oracleId: string; roll: number } =>
            !!value &&
            typeof value.oracleId === 'string' &&
            !isScenarioTable(value.oracleId) &&
            Number.isInteger(value.roll),
        )
      : [],
  };
}
