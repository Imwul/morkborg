import { ORACLE_CATEGORIES, type OracleRegistry } from '../domain/oracle';
import { diceDomain } from '../generators/oracleRoller';
import { isVerifiedPendingLibraryDependency } from '../domain/oracleDependencies';
export function validateOracleRegistry(
  registry: OracleRegistry,
  options: { libraryAbsent?: boolean } = {},
): string[] {
  const issues: string[] = [],
    ids = new Set<string>(),
    entryIds = new Set<string>();
  const books = new Set<string>();
  for (const b of registry.books) {
    if (!b.id || !b.title.trim() || books.has(b.id))
      issues.push(`출처 중복 또는 누락: ${b.id}`);
    books.add(b.id);
  }
  for (const t of registry.tables) {
    const error = (message: string) => issues.push(`${t.id}: ${message}`);
    if (!t.id || ids.has(t.id)) error('duplicate oracle id');
    ids.add(t.id);
    if (!t.title.trim() || !books.has(t.sourceBookId))
      error('missing source/title');
    if (
      t.sourceVerified &&
      (t.sourcePage == null ||
        ![t.sourcePage].flat().every((p) => Number.isInteger(p) && p > 0))
    )
      error('verified source without page');
    if (!ORACLE_CATEGORIES.includes(t.category)) error('unknown category');
    if (!t.entries.length) error('empty table');
    let domain: number[] = [];
    if (t.rollable !== false) {
      try {
        domain = diceDomain(t.dice);
      } catch {
        error('malformed dice notation');
      }
    }
    for (const e of t.entries) {
      if (!e.id || entryIds.has(e.id)) error('duplicate entry id');
      entryIds.add(e.id);
      if (!e.text.trim()) error('empty text');
      if (!Number.isInteger(e.min) || !Number.isInteger(e.max) || e.min > e.max)
        error('invalid range');
      if (domain.length && (!domain.includes(e.min) || !domain.includes(e.max)))
        error(`impossible dice value ${e.min}–${e.max}`);
    }
    for (const n of domain) {
      const count = t.entries.filter((e) => e.min <= n && e.max >= n).length;
      if (!count && !t.allowedGaps?.includes(n)) error(`missing range ${n}`);
      if (count > 1 && !(t.allowOverlap && t.sourceNote))
        error(`overlapping range ${n}`);
    }
    if ((t.allowedGaps?.length || t.allowOverlap) && !t.sourceNote)
      error('ambiguity needs sourceNote');
  }
  for (const p of registry.procedures) {
    if (ids.has(p.id)) issues.push(`${p.id}: duplicate procedure id`);
    ids.add(p.id);
    if (
      !p.title ||
      !p.oracleIds.length ||
      p.oracleIds.some((id) => !registry.tables.some((t) => t.id === id))
    )
      issues.push(`${p.id}: invalid procedure`);
    if (p.rollLabels && p.rollLabels.length !== p.oracleIds.length)
      issues.push(`${p.id}: roll labels do not match procedure steps`);
    if (
      p.steps &&
      p.steps.flatMap((step) => step.oracleIds).join('|') !==
        p.oracleIds.join('|')
    )
      issues.push(`${p.id}: grouped source steps diverge from roll sequence`);
    for (const step of p.generatorSteps ?? [])
      if (
        !step.id ||
        !Number.isInteger(step.count) ||
        step.count < 1 ||
        (step.tableId &&
          !registry.tables.some((table) => table.id === step.tableId))
      )
        issues.push(`${p.id}: unresolved or invalid generator step ${step.id}`);
  }
  for (const table of registry.tables)
    for (const entry of table.entries) {
      const followUps = entry.metadata?.followUpOracleIds;
      if (Array.isArray(followUps))
        for (const id of followUps)
          if (
            typeof id !== 'string' ||
            (!registry.tables.some((candidate) => candidate.id === id) &&
              !(
                options.libraryAbsent &&
                isVerifiedPendingLibraryDependency(table, id)
              ))
          )
            issues.push(
              `${entry.id}: missing canonical follow-up ${String(id)}`,
            );
      const lookups = entry.metadata?.fixedLookups;
      if (Array.isArray(lookups))
        for (const lookup of lookups) {
          const target = registry.tables.find(
            (candidate) => candidate.id === lookup?.oracleId,
          );
          if (
            !Number.isInteger(lookup?.roll) ||
            (target
              ? !target.entries.some(
                  (row) => row.min <= lookup.roll && row.max >= lookup.roll,
                )
              : !(
                  options.libraryAbsent &&
                  isVerifiedPendingLibraryDependency(table, lookup?.oracleId)
                ))
          )
            issues.push(`${entry.id}: invalid fixed source lookup`);
        }
    }
  return issues;
}
