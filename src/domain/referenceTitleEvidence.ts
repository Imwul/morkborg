import type { ReferenceEntry, ReferenceRegistry } from './references';
import type { OracleRegistry } from './oracle';
import type { RulesPack } from '../storage/rulesStore';
import {
  exactUiTranslation,
  polishKoreanTranslation,
} from '../generators/translation';

export interface OwnedReferenceTitle {
  text: string;
  origin:
    | 'explicit-title'
    | 'ui-name'
    | 'title-dictionary'
    | 'source-row'
    | 'creature-name';
  tier: 'A' | 'B';
}

// Derived from each loaded registry once. No aliases, registry fields or storage
// are mutated, and replacing a private pack cannot retain its old vocabulary.
const titles = new WeakMap<
  ReferenceRegistry['entries'],
  ReadonlyMap<string, OwnedReferenceTitle>
>();
const ownedTitles = new WeakMap<ReferenceEntry, OwnedReferenceTitle>();
const nameKey = (text: string) =>
  text.normalize('NFC').replace(/\s+/g, ' ').trim().toLocaleLowerCase();
const title = (
  value: unknown,
  origin: OwnedReferenceTitle['origin'],
  tier: 'A' | 'B' = 'A',
): OwnedReferenceTitle | undefined => {
  if (typeof value !== 'string' || !/[가-힣]/u.test(value)) return;
  return { text: polishKoreanTranslation(value.trim()), origin, tier };
};

export function indexReferenceTitleEvidence(
  registry: ReferenceRegistry,
  oracles: OracleRegistry,
  rules: RulesPack | null,
  creatures: ReadonlyMap<string, Record<string, unknown>>,
): void {
  const dictionary = new Map<string, Set<string>>();
  const supplied = rules?.notes.translations;
  if (supplied && typeof supplied === 'object' && !Array.isArray(supplied))
    for (const [en, ko] of Object.entries(supplied)) {
      if (typeof ko !== 'string' || !/[가-힣]/u.test(ko)) continue;
      const key = nameKey(en),
        values = dictionary.get(key) ?? new Set();
      values.add(polishKoreanTranslation(ko.trim()));
      dictionary.set(key, values);
    }
  const tables = new Map(oracles.tables.map((table) => [table.id, table]));
  const rows = new Map(
    oracles.tables.map((table) => [
      table.id,
      new Map(table.entries.map((row) => [row.id, row])),
    ]),
  );
  const index = new Map<string, OwnedReferenceTitle>();
  for (const entry of registry.entries) {
    let trusted = title(entry.titleTranslationKo, 'explicit-title');
    // Mirror full-title display precedence, without using the global translator's
    // unrelated row dictionary or assembling fragments into a new name.
    trusted ??= title(
      exactUiTranslation(entry.title),
      'ui-name',
      entry.id.startsWith('group:') ? 'B' : 'A',
    );
    const translated = dictionary.get(nameKey(entry.title));
    if (!trusted && translated?.size === 1)
      trusted = title([...translated][0], 'title-dictionary');
    // Conflicting whole-name translations require review, not a last-write winner.
    if (!trusted && !translated) {
      const source = entry.definition?.tableEntry;
      const table = source && tables.get(source.tableId);
      const row = source && rows.get(source.tableId)?.get(source.entryId);
      if (
        table?.sourceVerified &&
        row &&
        !row.sourceUnclear &&
        nameKey(row.text) === nameKey(entry.title)
      )
        trusted = title(row.metadata?.ko, 'source-row');
      const creature = creatures.get(entry.id);
      if (
        !trusted &&
        creature &&
        nameKey(String(creature.name)) === nameKey(entry.title)
      ) {
        const ko = creature.ko;
        if (ko && typeof ko === 'object' && !Array.isArray(ko))
          trusted = title(
            (ko as Record<string, unknown>).name,
            'creature-name',
          );
      }
    }
    if (trusted) {
      index.set(entry.id, trusted);
      ownedTitles.set(entry, trusted);
    } else ownedTitles.delete(entry);
  }
  // The existing browse surface wraps { entries, byId } in a new registry view.
  // Both surfaces share this immutable entries array, not the wrapper identity.
  titles.set(registry.entries, index);
}

export function registryReferenceTitleEvidence(
  registry: ReferenceRegistry,
  entry: ReferenceEntry,
): OwnedReferenceTitle | undefined {
  return (
    titles.get(registry.entries)?.get(entry.id) ??
    title(entry.titleTranslationKo, 'explicit-title')
  );
}

/** Whole-title ownership evidence, independent of search or display policy. */
export function ownedReferenceTitle(
  entry: ReferenceEntry,
): OwnedReferenceTitle | undefined {
  return (
    ownedTitles.get(entry) ?? title(entry.titleTranslationKo, 'explicit-title')
  );
}
