import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

export const REFERENCE_TRANSLATION_EDITION = 'batch-2-ko-2026-09-09';
const hash = (text) => createHash('sha256').update(text).digest('hex');
const dice = (text) =>
  (text.match(/(?<![A-Za-z])\d*d\d+(?:[+]\d+)?/gi) ?? []).sort();

/** Private, reviewed mappings only. Canonical English and all mechanics are left intact. */
export function enrichReferenceTranslations(input, mapping) {
  const bundle = structuredClone(input);
  const used = new Set();
  const counts = { definitions: 0, blocks: 0, headings: 0, notes: 0 };
  const dictionary = { ...bundle.library.notes.translations };
  const helper = (key, source) => {
    const translated = mapping[key];
    if (translated?.sourceHash !== hash(source))
      throw new Error(`Translation source changed: ${key}`);
    if (typeof translated.ko !== 'string' || !/[가-힣]/u.test(translated.ko))
      throw new Error(`Korean helper missing: ${key}`);
    if (JSON.stringify(dice(source)) !== JSON.stringify(dice(translated.ko)))
      throw new Error(`Translation changed dice: ${key}`);
    used.add(key);
    return translated.ko;
  };
  for (const table of bundle.oracles.tables) {
    if (!table.tags?.includes('batch-2')) continue;
    for (const entry of table.entries) {
      const meta = entry.metadata;
      if (!Array.isArray(meta?.blocks)) continue;
      counts.definitions++;
      meta.blocks.forEach((block, n) => {
        const ko = helper(`${entry.id}::block.${n}`, block.text);
        const titleKo = block.title
          ? helper(`${entry.id}::title.${n}`, block.title)
          : '';
        block.translation = {
          ...block.translation,
          ko: block.translation?.ko || ko,
          titleKo: block.translation?.titleKo || titleKo,
          sourceHash: hash(block.text),
          origin: 'app',
          edition: REFERENCE_TRANSLATION_EDITION,
        };
        // The same exact paragraph can appear in a table, copied result, or source inspector.
        dictionary[block.text] ??= ko;
        if (block.title) {
          counts.headings++;
        }
        counts.blocks++;
      });
      meta.translation = {
        ...meta.translation,
        edition: REFERENCE_TRANSLATION_EDITION,
        origin: 'app',
        updatePolicy: 'fill-missing',
      };
      if (meta.sourceNote) {
        const ko = helper(`${entry.id}::sourceNote`, meta.sourceNote);
        meta.translation.guidance = {
          sourceNote: ko,
          ...meta.translation.guidance,
        };
        dictionary[meta.sourceNote] ??= ko;
        counts.notes++;
      }
    }
  }
  for (const key of Object.keys(mapping))
    if (!used.has(key)) throw new Error(`Unknown translation target: ${key}`);
  bundle.library.notes = {
    ...bundle.library.notes,
    translations: dictionary,
    translationUpdatePolicy: 'fill-missing',
    translationEdition: REFERENCE_TRANSLATION_EDITION,
  };
  return { bundle, counts };
}

if (process.argv[1]?.endsWith('/enrich-reference-translations.mjs')) {
  const [path, mapping] = process.argv.slice(2);
  if (!path || !mapping)
    throw new Error('Expected private bundle and reviewed translation map.');
  const result = enrichReferenceTranslations(
    JSON.parse(readFileSync(path, 'utf8')),
    JSON.parse(readFileSync(mapping, 'utf8')),
  );
  writeFileSync(path, JSON.stringify(result.bundle), { mode: 0o600 });
  console.log(JSON.stringify(result.counts));
}
