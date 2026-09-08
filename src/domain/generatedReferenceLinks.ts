import type { ReferenceEntry } from './references';
import type { GeneratedValueProvenance } from './generationProvenance';

const fold = (text: string) =>
  text.normalize('NFC').toLocaleLowerCase().replace(/\s+/g, ' ').trim();
/** Links are navigation only. They neither modify saved text nor claim its origin. */
export function generatedReference(
  entries: ReferenceEntry[],
  text: string,
): ReferenceEntry | undefined {
  const value = fold(text);
  if (!value) return;
  const definitions = entries.filter((e) => e.definition && e.available);
  const exact = definitions.filter((e) =>
    e.definition!.matchTexts.some(
      (t) =>
        fold(t) === value &&
        !(
          e.definition!.kind === 'Power' &&
          e.title === 'Death' &&
          text.trim() !== 'Death'
        ),
    ),
  );
  if (exact.length === 1) return exact[0];
  const matches = definitions.filter((e) =>
    e.definition!.matchTexts.some((t) => {
      const name = fold(t);
      return (
        name &&
        (value.startsWith(name + ' —') ||
          value.startsWith(name + ' −') ||
          value.startsWith(name + ' (') ||
          value.startsWith(name + ':') ||
          value.includes('scroll: ' + name) ||
          value.includes('power: ' + name))
      );
    }),
  );
  return matches.length === 1 ? matches[0] : undefined;
}
export function generatedSourceReference(
  entries: ReferenceEntry[],
  text: string,
  provenance?: GeneratedValueProvenance,
): ReferenceEntry | undefined {
  const named = generatedReference(entries, text);
  if (named) return named;
  if (provenance?.origin !== 'source') return;
  const sourceIds = provenance.sourceRefs.map((s) => s.entryId).filter(Boolean);
  const matches = entries.filter(
    (e) =>
      e.available &&
      e.definition?.tableEntry &&
      sourceIds.includes(e.definition.tableEntry.entryId),
  );
  if (matches.length === 1) return matches[0];
  if (provenance.procedureId?.startsWith('character.class:'))
    return entries.find(
      (e) =>
        e.id === provenance.procedureId!.replace('character.class:', 'class:'),
    );
}

export function referenceTextSegments(
  entries: ReferenceEntry[],
  text: string,
): { text: string; id?: string }[] {
  const whole = generatedReference(entries, text);
  if (whole) return [{ text, id: whole.id }];
  // Longest exact source names win (e.g. Shortbow must never be split into Bow).
  const names = entries
    .filter((e) => e.definition && e.available)
    // "death" in ordinary prose is not the named Power. A canonical whole
    // result or an explicit scroll/Power prefix can still resolve it above.
    .filter((e) => !(e.definition!.kind === 'Power' && e.title === 'Death'))
    .map((e) => ({ name: e.title, id: e.id }))
    .filter((e) => e.name.length >= 3)
    .sort((a, b) => b.name.length - a.name.length);
  const byName = new Map<string, string | null>();
  for (const e of names)
    byName.set(fold(e.name), byName.has(fold(e.name)) ? null : e.id);
  const unique = names.filter((e) => byName.get(fold(e.name)));
  if (!unique.length) return [{ text }];
  const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(
    `(?<![\\p{L}\\p{N}])(${unique.map((e) => escape(e.name)).join('|')})(?![\\p{L}\\p{N}])`,
    'giu',
  );
  const segments: { text: string; id?: string }[] = [];
  let at = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index > at) segments.push({ text: text.slice(at, match.index) });
    segments.push({
      text: match[0],
      id: byName.get(fold(match[0])) ?? undefined,
    });
    at = match.index + match[0].length;
  }
  if (at < text.length) segments.push({ text: text.slice(at) });
  return segments;
}
