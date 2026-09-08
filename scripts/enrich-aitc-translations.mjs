import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

// Content maps are private local inputs. This script contains no source table payload.
export const AITC_TRANSLATION_EDITION = 'aitc-ko-2026-09-08';
export const AITC_NAME_TABLES = new Set([
  'aitc.settlement-name-prefix',
  'aitc.settlement-name-suffix',
]);
const hasKo = (value) => typeof value === 'string' && /[가-힣]/u.test(value);
const object = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const mechanical = (text) => (text.match(/\d*d\d+(?:[+]\d+)?/gi) ?? []).sort();

export function enrichAitcTranslations(bundle, mappings, expectedSources) {
  const result = structuredClone(bundle);
  const source = bundle.oracles.tables.filter((table) =>
    table.id.startsWith('aitc.'),
  );
  const map = Object.assign({}, ...mappings);
  const expected = new Set();
  const dictionary = { ...object(result.library.notes.translations) };
  const counts = {
    tables: source.length,
    rows: 0,
    added: 0,
    preserved: 0,
    namesPreserved: 0,
    guidance: 0,
    descriptions: 0,
  };
  const checkSource = (key, text) => {
    if (
      expectedSources?.[key] !== createHash('sha256').update(text).digest('hex')
    )
      throw new Error(
        `Private source changed; translation was not applied: ${key}`,
      );
  };
  const sourceDigest = (tables) =>
    createHash('sha256')
      .update(
        JSON.stringify(
          tables.map((table) => [
            table.id,
            table.dice,
            table.entries.map((entry) => [
              entry.id,
              entry.min,
              entry.max,
              entry.text,
            ]),
          ]),
        ),
      )
      .digest('hex');
  for (const table of result.oracles.tables.filter((t) =>
    t.id.startsWith('aitc.'),
  )) {
    if (table.description) {
      const key = `${table.id}::description`;
      expected.add(key);
      checkSource(key, table.description);
      if (!hasKo(map[key]))
        throw new Error(`Missing procedure translation: ${key}`);
      if (!dictionary[table.description])
        dictionary[table.description] = map[key];
      counts.descriptions++;
    }
    for (const entry of table.entries) {
      counts.rows++;
      const meta = object(entry.metadata);
      const translation = {
        ...object(meta.translation),
        edition: AITC_TRANSLATION_EDITION,
        origin: 'app',
        updatePolicy: 'fill-missing',
      };
      if (AITC_NAME_TABLES.has(table.id)) {
        // These are proper-name components, not untranslated descriptive prompts.
        translation.properNamePreserved = true;
        counts.namesPreserved++;
      } else {
        expected.add(entry.id);
        checkSource(entry.id, entry.text);
        if (!hasKo(map[entry.id]))
          throw new Error(`Missing row translation: ${entry.id}`);
        if (
          JSON.stringify(mechanical(entry.text)) !==
          JSON.stringify(mechanical(map[entry.id]))
        )
          throw new Error(
            `Dice expression differs in translation: ${entry.id}`,
          );
        if (typeof meta.ko === 'string' && meta.ko.trim()) counts.preserved++;
        else {
          meta.ko = map[entry.id];
          counts.added++;
        }
      }
      const guidance = { ...object(translation.guidance) };
      for (const field of [
        'effectRule',
        'conditional',
        'condition',
        'procedureNote',
      ]) {
        if (typeof meta[field] !== 'string' || !meta[field]) continue;
        const key = `${entry.id}::metadata.${field}`;
        expected.add(key);
        checkSource(key, meta[field]);
        if (!hasKo(map[key]))
          throw new Error(`Missing conditional translation: ${key}`);
        if (!guidance[field]) guidance[field] = map[key];
        if (!dictionary[meta[field]]) dictionary[meta[field]] = map[key];
        counts.guidance++;
      }
      if (Object.keys(guidance).length) translation.guidance = guidance;
      entry.metadata = { ...meta, translation };
    }
  }
  for (const key of Object.keys(map))
    if (!expected.has(key))
      throw new Error(`Unknown private translation key: ${key}`);
  result.library.notes = {
    ...result.library.notes,
    translations: dictionary,
    translationUpdatePolicy: 'fill-missing',
    aitcTranslationEdition: AITC_TRANSLATION_EDITION,
  };
  const revised = result.oracles.tables.filter((table) =>
    table.id.startsWith('aitc.'),
  );
  if (sourceDigest(source) !== sourceDigest(revised))
    throw new Error('Canonical AITC source text or selectors changed.');
  return { bundle: result, counts, sourceDigest: sourceDigest(source) };
}

if (process.argv[1]?.endsWith('/enrich-aitc-translations.mjs')) {
  const [path, evidence, ...maps] = process.argv.slice(2);
  if (!path || !evidence || !maps.length)
    throw new Error(
      'Usage: node scripts/enrich-aitc-translations.mjs PRIVATE_BUNDLE SOURCE_HASHES PRIVATE_MAP...',
    );
  const original = JSON.parse(readFileSync(path, 'utf8'));
  const { bundle, counts, sourceDigest } = enrichAitcTranslations(
    original,
    maps.map((map) => JSON.parse(readFileSync(map, 'utf8'))),
    JSON.parse(readFileSync(evidence, 'utf8')),
  );
  const backup = `${path}.before-aitc-ko`;
  if (!existsSync(backup))
    writeFileSync(backup, JSON.stringify(original), { mode: 0o600 });
  writeFileSync(path, JSON.stringify(bundle), { mode: 0o600 });
  console.log(JSON.stringify({ ...counts, sourceDigest }));
}
