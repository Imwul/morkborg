import type {
  GeneratedValueProvenance,
  GeneratorProcedure,
  GenerationClassification,
  RollTrace,
} from '../domain/generationProvenance';
import type {
  OracleDefinition,
  OracleEntry,
  OracleRegistry,
} from '../domain/oracle';
import type { SourceReference } from '../domain/types';
import type { RulesPack } from '../storage/rulesStore';
import { creatureReferenceId } from '../domain/references';
import {
  APP_GENERATION_POLICIES,
  procedureAuthority,
} from '../domain/generationAuthority';

export interface GenerationIssue {
  severity: 'error' | 'warning';
  code: string;
  path: string;
  detail: string;
}
export interface GenerationValidationContext {
  registry: OracleRegistry;
  rules: RulesPack;
  tables: Map<string, OracleDefinition>;
  books: Set<string>;
  creatures: Map<string, Record<string, unknown>>;
  procedures: Map<string, GeneratorProcedure>;
}
export interface GeneratedField {
  path: string;
  value: unknown;
  provenance?: GeneratedValueProvenance;
}
export const GENERATION_CLASSIFICATIONS: GenerationClassification[] = [
  'SOURCE_VERBATIM',
  'SOURCE_COMPOSED',
  'APP_DERIVED',
  'USER_AUTHORED',
  'UNSOURCED',
];
const rec = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
const exists = (value: unknown) =>
  value !== undefined && value !== null && value !== '';

/** Build once per source-pack identity; callers reuse this context for sample batches. */
export function createGenerationValidationContext(
  registry: OracleRegistry,
  rules: RulesPack,
  procedures: GeneratorProcedure[],
): GenerationValidationContext {
  const allProcedures = new Map(
    procedures.map((procedure) => [procedure.id, procedure]),
  );
  for (const procedure of registry.procedures)
    if (!allProcedures.has(procedure.id))
      allProcedures.set(procedure.id, {
        id: procedure.id,
        title: procedure.title,
        ...(procedure.authority ? { authority: procedure.authority } : {}),
        sourceRefs:
          procedure.sourceRefs ??
          procedure.oracleIds.flatMap((id) => {
            const table = registry.tables.find((entry) => entry.id === id);
            return table
              ? [
                  {
                    tableId: id,
                    bookId: table.sourceBookId,
                    pdfPage: table.sourcePage,
                  },
                ]
              : [];
          }),
        steps:
          procedure.generatorSteps ??
          procedure.oracleIds.map((tableId, index) => ({
            id: String(index),
            tableId,
            count: 1,
          })),
      });
  return {
    registry,
    rules,
    tables: new Map(registry.tables.map((table) => [table.id, table])),
    books: new Set(registry.books.map((book) => book.id)),
    creatures: new Map(
      [...rules.creatures, ...rules.outcasts].map((record) => [
        creatureReferenceId(record),
        record,
      ]),
    ),
    procedures: allProcedures,
  };
}
function pageNumbers(page: SourceReference['pdfPage']): number[] {
  return typeof page === 'number' ? [page] : Array.isArray(page) ? page : [];
}
function knownProcedure(
  p: GeneratedValueProvenance,
  context: GenerationValidationContext,
) {
  return (
    p.procedureId === 'app.structural-identifier' ||
    p.procedureId === 'creature.source-record' ||
    (!!p.procedureId && context.procedures.has(p.procedureId))
  );
}
export function sourceEntry(
  context: GenerationValidationContext,
  tableId: string,
  entryId: string,
): { root: OracleEntry; text: string } | undefined {
  const [rootId, ...steps] = entryId.split('/followup:');
  const root = context.tables
    .get(tableId)
    ?.entries.find((entry) => entry.id === rootId);
  if (!root) return undefined;
  let text = root.text;
  let children = root.metadata?.followup;
  for (const step of steps) {
    if (!Array.isArray(children)) return undefined;
    const next: Record<string, unknown> | undefined = children
      .map(rec)
      .find((child, index) => {
        if (!child) return false;
        const meta = rec(child.meta) ?? {};
        const min =
          typeof meta.min === 'number'
            ? meta.min
            : typeof meta.roll === 'number'
              ? meta.roll
              : index + 1;
        const max =
          typeof meta.max === 'number'
            ? meta.max
            : min + (Number(child.weight) || 1) - 1;
        return `${min}-${max}` === step;
      });
    if (!next || typeof next.text !== 'string') return undefined;
    text = next.text;
    children = next.followup;
  }
  return { root, text };
}
function validateRef(
  ref: SourceReference,
  p: GeneratedValueProvenance,
  context: GenerationValidationContext,
  path: string,
): GenerationIssue[] {
  const issues: GenerationIssue[] = [];
  const problem = (code: string, detail: string) =>
    issues.push({
      severity: p.status === 'UNAVAILABLE' ? 'warning' : 'error',
      code,
      path,
      detail,
    });
  if (!ref.bookId || !context.books.has(ref.bookId))
    problem('unknown-book', String(ref.bookId ?? 'missing bookId'));
  if (
    !pageNumbers(ref.pdfPage).length ||
    pageNumbers(ref.pdfPage).some((page) => !Number.isInteger(page) || page < 1)
  )
    problem('missing-page', String(ref.tableId ?? ref.bookId));
  if (ref.tableId) {
    const table = context.tables.get(ref.tableId),
      creature = context.creatures.get(ref.tableId);
    if (!table && !creature) problem('unknown-source-id', ref.tableId);
    if (table && ref.bookId !== table.sourceBookId)
      problem('source-book-mismatch', ref.tableId);
    if (
      table &&
      pageNumbers(ref.pdfPage).some(
        (page) => ![table.sourcePage].flat().includes(page),
      )
    )
      problem('source-page-mismatch', ref.tableId);
    const referencedEntry =
      table && ref.entryId
        ? sourceEntry(context, ref.tableId, ref.entryId)
        : undefined;
    const canonicalStatus =
      referencedEntry?.root.metadata?.sourceStatus ?? table?.sourceStatus;
    if (
      canonicalStatus &&
      canonicalStatus !== 'VERIFIED' &&
      p.status === 'VERIFIED' &&
      ref.role !== 'routing'
    )
      problem(
        'overstated-source-status',
        `${ref.tableId}: ${typeof canonicalStatus === 'string' ? canonicalStatus : 'invalid status'}`,
      );
    if (creature && ref.bookId !== creature.book)
      problem('source-book-mismatch', ref.tableId);
    if (ref.entryId && table && !sourceEntry(context, ref.tableId, ref.entryId))
      problem('unknown-entry-id', ref.entryId);
    if (
      ref.entryId &&
      creature &&
      ![creature.id, ref.tableId].includes(ref.entryId)
    )
      problem('unknown-creature-entry', ref.entryId);
  } else {
    const procedure = p.procedureId
      ? context.procedures.get(p.procedureId)
      : undefined;
    const declared = procedure?.sourceRefs.some(
      (source) =>
        source.bookId === ref.bookId &&
        pageNumbers(ref.pdfPage).every((page) =>
          pageNumbers(source.pdfPage).includes(page),
        ),
    );
    if (!declared)
      problem(
        'undocumented-rule-reference',
        `${ref.bookId ?? 'missing'} / ${pageNumbers(ref.pdfPage).join(',')} / ${p.procedureId ?? 'no procedure'}`,
      );
  }
  return issues;
}
function diceRange(
  notation: string,
):
  | { min: number; max: number; count: number; sides: number; offset: number }
  | undefined {
  const m = /^(\d*)d(\d+)(?:\s*([+−-])\s*(\d+))?$/.exec(notation.trim());
  if (!m) return undefined;
  const count = Number(m[1] || 1),
    sides = Number(m[2]),
    offset = m[3] ? Number(m[4]) * (m[3] === '+' ? 1 : -1) : 0;
  return {
    min: count + offset,
    max: count * sides + offset,
    count,
    sides,
    offset,
  };
}
function validateRoll(
  roll: RollTrace,
  p: GeneratedValueProvenance,
  context: GenerationValidationContext,
  path: string,
): GenerationIssue[] {
  const issues: GenerationIssue[] = [];
  const fail = (code: string, detail: string) =>
    issues.push({ severity: 'error', code, path, detail });
  const table = context.tables.get(roll.tableId),
    creature = context.creatures.get(roll.tableId),
    procedure = context.procedures.get(roll.tableId);
  if (!table && !creature && !procedure)
    fail('unknown-roll-source', roll.tableId);
  if (!Number.isInteger(roll.value))
    fail('invalid-roll-value', String(roll.value));
  if (roll.entryId && table) {
    const match = sourceEntry(context, roll.tableId, roll.entryId);
    if (!match) fail('unknown-roll-entry', roll.entryId);
    else if (
      !roll.entryId.includes('/followup:') &&
      !(match.root.min <= roll.value && roll.value <= match.root.max)
    )
      fail(
        'roll-entry-mismatch',
        `${roll.tableId}: ${roll.value} vs ${roll.entryId}`,
      );
  }
  const tuple =
    roll.dice === 'd66'
      ? [6, 6]
      : /^d\d+ × d\d+$/.test(roll.dice)
        ? roll.dice.split(' × ').map((part) => Number(part.slice(1)))
        : undefined;
  const domain = diceRange(roll.dice);
  if (tuple) {
    if (
      !roll.diceValues ||
      roll.diceValues.length !== 2 ||
      roll.diceValues.some((value, i) => value < 1 || value > tuple[i]) ||
      roll.value !== roll.diceValues[0] * 10 + roll.diceValues[1]
    )
      fail('invalid-tuple-roll', roll.dice);
  } else if (domain) {
    if (roll.value < domain.min || roll.value > domain.max)
      fail('invalid-dice-range', `${roll.dice} = ${roll.value}`);
    if (
      roll.diceValues?.length &&
      (roll.diceValues.length !== domain.count ||
        roll.diceValues.some((value) => value < 1 || value > domain.sides) ||
        roll.value !==
          roll.diceValues.reduce((sum, value) => sum + value, 0) +
            domain.offset)
    )
      fail('invalid-dice-values', roll.dice);
  } else if (
    roll.dice === 'source-entry selection' ||
    roll.dice === 'source option selection'
  ) {
    if (!roll.entryId || !table)
      fail('undocumented-source-selection', roll.tableId);
  } else if (/^indexed d\d+$/.test(roll.dice)) {
    const sides = Number(roll.dice.slice(9));
    if (roll.value < 1 || roll.value > sides || !roll.entryId)
      fail('invalid-indexed-selection', roll.dice);
  } else if (
    /^d8\s*\+\s*(?:Dungeon )?DR$/.test(roll.dice) &&
    p.procedureId === 'sd.rare-stocking'
  ) {
    if (
      !roll.diceValues ||
      roll.diceValues.length !== 1 ||
      roll.diceValues[0] < 1 ||
      roll.diceValues[0] > 8 ||
      roll.value - roll.diceValues[0] < 6 ||
      roll.value - roll.diceValues[0] > 14
    )
      fail('invalid-rare-stocking-roll', String(roll.value));
  } else fail('undocumented-dice-expression', `${roll.tableId} / ${roll.dice}`);
  return issues;
}

/** Resolving provenance is distinct from independently verifying a book's wording. Warnings remain explicit. */
export function validateGeneratedValue(
  value: unknown,
  p: GeneratedValueProvenance | undefined,
  context: GenerationValidationContext,
  path = 'Generated',
): GenerationIssue[] {
  const issues: GenerationIssue[] = [];
  const fail = (code: string, detail: string) =>
    issues.push({ severity: 'error', code, path, detail });
  if (!p) {
    fail(
      'missing-provenance',
      'Generated value has no declared origin or source.',
    );
    return issues;
  }
  if (!GENERATION_CLASSIFICATIONS.includes(p.classification))
    fail('invalid-classification', String(p.classification));
  if (p.classification === 'UNSOURCED')
    fail(
      'unsourced-production-value',
      'New production generation must not invent source text.',
    );
  if (p.origin === 'manual' || p.origin === 'source-edited') {
    if (p.classification !== 'USER_AUTHORED')
      fail('false-verbatim-after-edit', `${p.origin} / ${p.classification}`);
    return issues; // Historical source IDs may be missing; manual saved values always remain readable.
  }
  for (const authority of p.authority ?? []) {
    if (authority.kind === 'APP_POLICY') {
      if (!(authority.id in APP_GENERATION_POLICIES))
        fail('unknown-app-policy', authority.id);
    } else {
      const known = authority.id.startsWith('oracle:')
        ? context.tables.has(authority.id.slice('oracle:'.length))
        : procedureAuthority(authority.id) === 'SOURCE_PROCEDURE' ||
          context.procedures.get(authority.id)?.authority ===
            'SOURCE_PROCEDURE';
      if (!known) fail('unknown-source-procedure-authority', authority.id);
      if (procedureAuthority(authority.id) === 'APP_POLICY')
        fail('app-policy-claimed-as-source', authority.id);
    }
    for (const ref of authority.sourceRefs ?? []) {
      if (ref.bookId && !context.books.has(ref.bookId))
        fail('unknown-authority-book', ref.bookId);
      if (ref.tableId && !context.tables.has(ref.tableId))
        fail('unknown-authority-table', ref.tableId);
    }
  }
  if (p.classification === 'USER_AUTHORED')
    fail('manual-origin-required', p.origin);
  if (p.status !== 'VERIFIED')
    issues.push({
      severity: 'warning',
      code: `source-${p.status.toLowerCase()}`,
      path,
      detail: p.transformation ?? 'Explicit source exception.',
    });
  if (p.procedureId && !knownProcedure(p, context))
    fail('unknown-procedure', p.procedureId);
  const structural =
    p.classification === 'APP_DERIVED' &&
    p.procedureId === 'app.structural-identifier';
  if (!p.sourceRefs.length && !structural)
    fail(
      'missing-source-reference',
      'Source-backed output must identify a table, record or documented mechanical procedure.',
    );
  if (
    structural &&
    (!p.transformation ||
      p.sourceRefs.length ||
      (exists(value) &&
        (typeof value !== 'string' ||
          !/^(?:ROOM \d{2,}|Monster)$/.test(value))))
  )
    fail(
      'invalid-structural-identifier',
      'Only the existing neutral ROOM NN and Monster identifiers are allowed; new labels need an explicit reviewed identifier policy.',
    );
  for (const ref of p.sourceRefs)
    issues.push(...validateRef(ref, p, context, path));
  for (const roll of p.rolls ?? [])
    issues.push(...validateRoll(roll, p, context, path));
  if (p.classification === 'SOURCE_VERBATIM') {
    if (!p.sourceText?.length)
      fail(
        'missing-source-text',
        'Verbatim result has no English source snapshot.',
      );
    if (
      exists(value) &&
      (typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean') &&
      p.sourceText?.length === 1 &&
      String(value) !== p.sourceText[0]
    )
      fail(
        'verbatim-display-mismatch',
        'Visible value differs from its canonical English snapshot; a translation or edit must not overwrite source text.',
      );
    for (const ref of p.sourceRefs.filter(
      (ref) =>
        ref.role !== 'routing' &&
        ref.entryId &&
        ref.tableId &&
        context.tables.has(ref.tableId),
    )) {
      const referenced = sourceEntry(context, ref.tableId!, ref.entryId!);
      const tracedTexts = (p.rolls ?? [])
        .filter((roll) => roll.tableId === ref.tableId && roll.entryId)
        .flatMap(
          (roll) =>
            sourceEntry(context, roll.tableId, roll.entryId!)?.text ?? [],
        );
      if (
        referenced &&
        p.sourceText?.some(
          (text) => text !== referenced.text && !tracedTexts.includes(text),
        )
      )
        fail(
          'canonical-source-text-mismatch',
          `${ref.tableId} / ${ref.entryId}`,
        );
    }
  }
  if (
    p.classification === 'SOURCE_COMPOSED' &&
    p.sourceRefs.length &&
    p.sourceRefs.every(
      (ref) =>
        ref.role === 'routing' ||
        (ref.tableId && context.tables.has(ref.tableId)),
    )
  ) {
    const allowed = new Set<string>();
    const collect = (value: unknown, key = '') => {
      if (/ko|translation/i.test(key)) return;
      if (typeof value === 'string') allowed.add(value);
      else if (Array.isArray(value))
        value.forEach((item) => collect(item, key));
      else if (rec(value))
        Object.entries(value as Record<string, unknown>).forEach(
          ([key, item]) => collect(item, key),
        );
    };
    for (const ref of p.sourceRefs.filter(
      (ref) => ref.role !== 'routing' && ref.tableId && ref.entryId,
    )) {
      const entry = sourceEntry(context, ref.tableId!, ref.entryId!);
      if (entry) {
        allowed.add(entry.text);
        collect(entry.root.metadata);
      }
    }
    for (const roll of p.rolls ?? [])
      if (roll.entryId) {
        const entry = sourceEntry(context, roll.tableId, roll.entryId);
        if (entry) {
          allowed.add(entry.text);
          collect(entry.root.metadata);
        }
      }
    if (p.procedureId === 'core.dungeon-title') allowed.add('The'); // Literal prefix printed above the two source columns.
    for (const text of p.sourceText ?? [])
      if (!allowed.has(text))
        fail(
          'unresolved-composed-fragment',
          'A source-composed English fragment is not among its referenced canonical source entries/effects.',
        );
  }
  if (
    (p.classification === 'SOURCE_COMPOSED' ||
      p.classification === 'APP_DERIVED') &&
    !p.transformation
  )
    fail('undocumented-transformation', p.classification);
  return issues;
}
export function assertGeneratedValueHasSource(
  value: unknown,
  provenance: GeneratedValueProvenance | undefined,
  context: GenerationValidationContext,
  path?: string,
): void {
  const errors = validateGeneratedValue(
    value,
    provenance,
    context,
    path,
  ).filter((issue) => issue.severity === 'error');
  if (errors.length)
    throw new Error(
      errors
        .map((issue) => `${issue.path}: ${issue.code}: ${issue.detail}`)
        .join('\n'),
    );
}

const nonGeneratedKeys = new Set([
  'id',
  'campaignId',
  'createdAt',
  'updatedAt',
  'region',
  'kind',
  'category',
  'classId',
  'classSource',
  'source',
  'tableId',
  'slot',
  'entryRoll',
  'exits',
  'status',
  'dungeonDR',
  'powerUses',
  'legacyDescription',
  'label',
]);
const metadataKeys = new Set([
  'sources',
  'sourceRefs',
  'generation',
  'fieldProvenance',
  'provenance',
  'translationKo',
  'meta',
  'metadata',
  'crawl',
  'playState',
  'hiddenInformation',
]);
/** Inspect newly generated objects, not existing legacy campaign content. No source migration is inferred. */
export function enumerateGeneratedFields(
  input: unknown,
  root = 'Generated',
): GeneratedField[] {
  const fields: GeneratedField[] = [];
  function visit(value: unknown, path: string) {
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, `${path}[${index}]`));
      return;
    }
    const item = rec(value);
    if (!item) return;
    const tracked = rec(item.fieldProvenance) ?? {};
    for (const [field, provenance] of Object.entries(tracked))
      fields.push({
        path: `${path}.${field}`,
        value: item[field],
        provenance: provenance as GeneratedValueProvenance,
      });
    const group = item.provenance as GeneratedValueProvenance | undefined;
    if (group)
      fields.push({
        path: `${path}.${'sourceText' in item ? 'sourceText' : 'text'}`,
        value: item.sourceText ?? item.text,
        provenance: group,
      });
    const metadata = rec(item.metadata);
    if (metadata?.provenance)
      fields.push({
        path: `${path}.text`,
        value: item.text,
        provenance: metadata.provenance as GeneratedValueProvenance,
      });
    for (const [key, child] of Object.entries(item)) {
      if (
        metadataKeys.has(key) ||
        nonGeneratedKeys.has(key) ||
        (item.oracleId &&
          ['oracleId', 'title', 'dice', 'roll', 'entryId'].includes(key))
      )
        continue;
      if (typeof child === 'string' || typeof child === 'number') {
        if (
          exists(child) &&
          !(key in tracked) &&
          !group &&
          !(metadata?.provenance && key === 'text')
        )
          fields.push({ path: `${path}.${key}`, value: child });
      } else if (Array.isArray(child) || rec(child))
        visit(child, `${path}.${key}`);
    }
  }
  visit(input, root);
  return fields;
}
export function generationIntegrityReport(
  input: unknown,
  context: GenerationValidationContext,
  root = 'Generated',
) {
  const fields = enumerateGeneratedFields(input, root);
  const counts = Object.fromEntries(
    GENERATION_CLASSIFICATIONS.map((key) => [key, 0]),
  ) as Record<GenerationClassification, number>;
  const statuses: Record<string, number> = {};
  const issues: GenerationIssue[] = [];
  for (const field of fields) {
    counts[field.provenance?.classification ?? 'UNSOURCED']++;
    if (field.provenance?.origin === 'source')
      statuses[field.provenance.status] =
        (statuses[field.provenance.status] ?? 0) + 1;
    issues.push(
      ...validateGeneratedValue(
        field.value,
        field.provenance,
        context,
        field.path,
      ),
    );
  }
  return {
    fieldsAudited: fields.length,
    countingUnit:
      'Runtime generated field/provenance groups, including compatibility mirrors; not a unique generator-field inventory or independent PDF-text verification count.',
    counts,
    statuses,
    issues,
    unresolved: issues.filter((issue) => issue.severity === 'error'),
  };
}
export function validateGeneratorProcedures(
  context: GenerationValidationContext,
): GenerationIssue[] {
  const issues: GenerationIssue[] = [];
  for (const procedure of context.procedures.values()) {
    for (const source of procedure.sourceRefs) {
      if (!source.bookId || !context.books.has(source.bookId))
        issues.push({
          severity: 'error',
          code: 'unknown-procedure-book',
          path: procedure.id,
          detail: String(source.bookId),
        });
      if (
        !pageNumbers(source.pdfPage).length ||
        pageNumbers(source.pdfPage).some(
          (page) => !Number.isInteger(page) || page < 1,
        )
      )
        issues.push({
          severity: 'error',
          code: 'missing-procedure-page',
          path: procedure.id,
          detail: String(source.bookId),
        });
    }
    const ids = new Set<string>();
    for (const step of procedure.steps) {
      const path = `${procedure.id}.${step.id}`;
      if (ids.has(step.id))
        issues.push({
          severity: 'error',
          code: 'duplicate-procedure-step',
          path,
          detail: step.id,
        });
      if (step.tableId && !context.tables.has(step.tableId))
        issues.push({
          severity: 'error',
          code: 'unknown-procedure-table',
          path,
          detail: step.tableId,
        });
      if (!Number.isInteger(step.count) || step.count < 1)
        issues.push({
          severity: 'error',
          code: 'invalid-step-count',
          path,
          detail: String(step.count),
        });
      if (!step.tableId && !step.dice && !step.derived)
        issues.push({
          severity: 'error',
          code: 'undocumented-procedure-step',
          path,
          detail: step.id,
        });
      for (const dependency of step.dependsOn ?? [])
        if (!ids.has(dependency))
          issues.push({
            severity: 'error',
            code: 'invalid-procedure-dependency',
            path,
            detail: dependency,
          });
      ids.add(step.id);
    }
  }
  return issues;
}
