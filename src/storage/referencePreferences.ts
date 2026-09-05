import { readOraclePreferences } from './oraclePreferences';

export const REFERENCE_PREFERENCES_KEY = 'morkborg-reference-desk:v1';
export interface ReferencePreferences {
  schemaVersion: 1;
  pinnedIds: string[];
  recentIds: string[];
}
type Reader = Pick<Storage, 'getItem'>;
const ids = (value: unknown, limit: number): string[] =>
  Array.isArray(value)
    ? [
        ...new Set(
          value.filter(
            (id): id is string =>
              typeof id === 'string' && id.length > 0 && id.length < 250,
          ),
        ),
      ].slice(0, limit)
    : [];
export function readReferencePreferences(
  storage?: Reader,
): ReferencePreferences {
  const empty: ReferencePreferences = {
    schemaVersion: 1,
    pinnedIds: [],
    recentIds: [],
  };
  try {
    const source = storage ?? localStorage;
    const raw = source.getItem(REFERENCE_PREFERENCES_KEY);
    if (!raw)
      return {
        ...empty,
        pinnedIds: readOraclePreferences(source)
          .favoriteIds.map((id) => `oracle:${id}`)
          .slice(0, 30),
      };
    const value = JSON.parse(raw);
    return value.schemaVersion === 1
      ? {
          schemaVersion: 1,
          pinnedIds: ids(value.pinnedIds, 30),
          recentIds: ids(value.recentIds, 10),
        }
      : empty;
  } catch {
    return empty;
  }
}
export function recentlyUsed(
  prefs: ReferencePreferences,
  id: string,
): ReferencePreferences {
  return {
    ...prefs,
    recentIds: [id, ...prefs.recentIds.filter((item) => item !== id)].slice(
      0,
      10,
    ),
  };
}
export function toggleReferencePin(
  prefs: ReferencePreferences,
  id: string,
): ReferencePreferences {
  return {
    ...prefs,
    pinnedIds: prefs.pinnedIds.includes(id)
      ? prefs.pinnedIds.filter((item) => item !== id)
      : [...prefs.pinnedIds, id].slice(-30),
  };
}
export function writeReferencePreferences(
  value: ReferencePreferences,
  storage?: Pick<Storage, 'setItem'>,
) {
  (storage ?? localStorage).setItem(
    REFERENCE_PREFERENCES_KEY,
    JSON.stringify(value),
  );
}
