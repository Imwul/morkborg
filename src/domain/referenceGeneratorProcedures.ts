import type { GeneratorProcedure } from './generationProvenance';
import type { OracleRegistry, OracleResult } from './oracle';
import type { SourceReference } from './types';

const source = (
  bookId: string,
  pdfPage: number | number[],
  printedPage: number | string,
  tableTitle: string,
): SourceReference => ({ bookId, pdfPage, printedPage, tableTitle });

/** Source-defined order, alternatives and derived values. These are instructions, not fiction. */
export const REFERENCE_GENERATOR_PROCEDURES: GeneratorProcedure[] = [
  {
    id: 'aitc.street',
    title: 'Street Descriptors',
    sourceRefs: [
      source('aitc', [5, 17], '3, 15', 'Micro-Crawl / Street Descriptors'),
    ],
    steps: [
      {
        id: 'adjective',
        tableId: 'aitc.street-adjective',
        dice: 'd20',
        count: 1,
      },
      { id: 'type', tableId: 'aitc.street-type', dice: 'd12', count: 1 },
      {
        id: 'contents-count',
        tableId: 'aitc.street-contents',
        dice: 'd2',
        count: 1,
        condition: 'City or metropolis only; otherwise count is one.',
        derived: 'The d2 result is the number of independent contents rolls.',
      },
      {
        id: 'contents',
        tableId: 'aitc.street-contents',
        dice: 'd12',
        count: 1,
        dependsOn: ['contents-count'],
        condition:
          'Repeat once per selected contents-count. Do not reroll duplicate results.',
      },
      {
        id: 'exits',
        tableId: 'aitc.street-exits',
        dice: 'd4',
        count: 1,
        condition: 'Optional, only if exits were requested.',
      },
    ],
  },
  {
    id: 'aitc.notable-artefact-type',
    title: 'Notable Artefacts',
    sourceRefs: [source('aitc', 11, 9, 'Notable Artefacts')],
    steps: [
      {
        id: 'type',
        tableId: 'aitc.notable-artefact-type',
        dice: 'd4',
        count: 1,
      },
      {
        id: 'concerning',
        tableId: 'aitc.notable-artefact-concerning',
        dice: 'd12',
        count: 1,
        dependsOn: ['type'],
        condition: 'Type 1 or 2 only: book or manuscript.',
      },
      {
        id: 'composition',
        tableId: 'aitc.notable-artefact-composition',
        dice: 'd12',
        count: 1,
        dependsOn: ['type'],
        condition: 'Type 3 or 4 only: picture or sculpture.',
      },
      {
        id: 'adjective',
        tableId: 'aitc.notable-artefact-adjective',
        dice: 'd12',
        count: 1,
        dependsOn: ['type'],
        condition: 'Type 3 or 4 only.',
      },
      {
        id: 'subject',
        tableId: 'aitc.notable-artefact-subject',
        dice: 'd12',
        count: 1,
        dependsOn: ['type'],
        condition: 'Type 3 or 4 only.',
      },
      {
        id: 'size',
        tableId: 'aitc.sculpture-size',
        dice: 'd2',
        count: 1,
        dependsOn: ['type'],
        condition:
          'Type 4 only: sculpture. Do not apply sculpture ownership rules to pictures.',
      },
    ],
  },
  {
    id: 'feretory.road',
    title: 'Roads to Damnation · travel',
    sourceRefs: [
      source('sd', 17, 15, 'Daily travel flowchart'),
      source('feretory', 7, 5, 'Roads to Damnation'),
    ],
    steps: [
      {
        id: 'weather',
        tableId: 'core.weather',
        dice: 'd12',
        count: 1,
        condition:
          'At dawn, unless weather is already resolved by the journey worksheet.',
      },
      { id: 'road', tableId: 'feretory.roadType', dice: 'd8', count: 1 },
      { id: 'event', tableId: 'feretory.roadEvent', dice: 'd20', count: 1 },
      {
        id: 'fork',
        tableId: 'feretory.roadEvent',
        dice: 'd20',
        count: 1,
        dependsOn: ['event'],
        condition:
          'Event 7 or 8 instructs rolling again; repeat while that branch continues.',
      },
      {
        id: 'changed-weather',
        tableId: 'core.weather',
        dice: 'd12',
        count: 1,
        dependsOn: ['event', 'fork'],
        condition: 'Final event 5 or 6 changes the weather.',
      },
    ],
  },
  {
    id: 'feretory.forage',
    title: 'Spending a day foraging',
    sourceRefs: [source('feretory', 8, 6, 'Foraging / The village is')],
    steps: [
      { id: 'forage', tableId: 'feretory.forage', dice: 'd6', count: 1 },
      {
        id: 'village',
        tableId: 'feretory.village',
        dice: 'd6',
        count: 1,
        dependsOn: ['forage'],
        condition: 'Foraging result 5 or 6 only.',
      },
    ],
  },
  {
    id: 'feretory.campsite',
    title: 'Nightly campsite events',
    sourceRefs: [source('feretory', 9, 7, 'Nightly campsite events')],
    steps: [
      { id: 'event', tableId: 'feretory.campsite', dice: 'd12', count: 1 },
      {
        id: 'dream',
        tableId: 'feretory.campsite.campDream',
        dice: 'd6',
        count: 1,
        dependsOn: ['event'],
        condition:
          'Campsite event 10 only. Next-day Omens are applied by the player.',
      },
    ],
  },
  {
    id: 'sd.camping',
    title: 'Camping, Resting, Catching Breath',
    sourceRefs: [source('sd', 8, 6, 'Camping, Resting, Catching Breath')],
    steps: [
      {
        id: 'move',
        dice: 'd20',
        count: 2,
        condition: 'Initial camping attempt.',
        derived:
          'Compare each d20 + Presence separately to DR12; two successes Strong, one Weak, none Fail.',
      },
      {
        id: 'retry',
        dice: 'd2',
        count: 1,
        condition:
          'Only the next resting attempt after resolving a failed-rest encounter.',
        derived: '1 Strong / 2 Weak, the documented 50:50 retry.',
      },
      {
        id: 'strong-recovery',
        dice: 'd6',
        count: 1,
        dependsOn: ['move', 'retry'],
        condition: 'Strong sleeping result only; catching breath uses d4.',
      },
      {
        id: 'weak-recovery',
        dice: 'd4',
        count: 1,
        dependsOn: ['move', 'retry'],
        condition: 'Weak sleeping result only; catching breath uses d2.',
      },
    ],
  },
];

export function referenceGeneratorProcedure(id: string) {
  return REFERENCE_GENERATOR_PROCEDURES.find(
    (procedure) => procedure.id === id,
  );
}

export function validateReferenceGeneratorProcedures(
  registry: OracleRegistry,
): string[] {
  return REFERENCE_GENERATOR_PROCEDURES.flatMap((procedure) => {
    const ids = new Set(procedure.steps.map((step) => step.id));
    return procedure.steps.flatMap((step) => [
      ...(step.tableId &&
      !registry.tables.some((table) => table.id === step.tableId)
        ? [`${procedure.id}.${step.id}: missing table ${step.tableId}`]
        : []),
      ...(step.dependsOn?.some((id) => !ids.has(id))
        ? [`${procedure.id}.${step.id}: missing dependency`]
        : []),
    ]);
  });
}

export function traceReferenceProcedure(
  result: OracleResult,
  procedureId: string,
  registry?: OracleRegistry,
): OracleResult {
  if (
    !referenceGeneratorProcedure(procedureId) &&
    !registry?.procedures.some((procedure) => procedure.id === procedureId)
  )
    return result;
  return {
    ...result,
    rolls: result.rolls.map((roll) => ({
      ...roll,
      metadata: {
        ...roll.metadata,
        ...(roll.metadata?.provenance
          ? { provenance: { ...roll.metadata.provenance, procedureId } }
          : {}),
      },
    })),
  };
}
