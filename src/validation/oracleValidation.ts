import { ORACLE_CATEGORIES, type OracleRegistry } from '../domain/oracle';
import { diceDomain } from '../generators/oracleRoller';
export function validateOracleRegistry(registry: OracleRegistry): string[] {
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
  }
  return issues;
}
