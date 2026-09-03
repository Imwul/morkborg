import type { RuleEntry, RulesPack } from './rulesStore';

export function hasRuleTranslations(pack: RulesPack): boolean {
  const translations = pack.notes.translations as
    | Record<string, unknown>
    | undefined;
  const translated = (entries: RuleEntry[]): boolean =>
    entries.every(
      (entry) =>
        (!entry.text ||
          typeof entry.meta.ko === 'string' ||
          typeof translations?.[entry.text] === 'string') &&
        (!entry.followup || translated(entry.followup)),
    );
  return Object.values(pack.tables).every((table) => translated(table.entries));
}

/** Update translation metadata only; never replace a saved generator's rules or weights. */
export function mergeRuleTranslations(
  current: RulesPack,
  incoming: RulesPack,
): RulesPack {
  const key = (text: string) =>
    text.normalize('NFC').replace(/\s+/g, ' ').trim();
  const update = (entries: RuleEntry[], source: RuleEntry[]): RuleEntry[] => {
    const byText = new Map(source.map((entry) => [key(entry.text), entry]));
    return entries.map((entry) => {
      const match = byText.get(key(entry.text));
      return {
        ...entry,
        meta: {
          ...entry.meta,
          ...(typeof match?.meta.ko === 'string' ? { ko: match.meta.ko } : {}),
        },
        ...(entry.followup
          ? { followup: update(entry.followup, match?.followup ?? []) }
          : {}),
      };
    });
  };
  return {
    ...current,
    notes: {
      ...current.notes,
      translations: {
        ...Object(current.notes.translations),
        ...Object(incoming.notes.translations),
      },
      ...(incoming.notes.translationEdition
        ? { translationEdition: incoming.notes.translationEdition }
        : {}),
    },
    tables: Object.fromEntries(
      Object.entries(current.tables).map(([id, table]) => [
        id,
        {
          ...table,
          entries: update(table.entries, incoming.tables[id]?.entries ?? []),
        },
      ]),
    ),
  };
}
