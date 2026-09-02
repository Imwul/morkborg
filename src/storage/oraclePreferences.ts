import type { OraclePreferences } from '../domain/oracle';
export const ORACLE_PREFERENCES_KEY = 'morkborg-oracle-preferences:v1';
const defaults = (): OraclePreferences => ({
  schemaVersion: 1,
  favoriteIds: [],
  source: '',
  category: '',
  dice: '',
});
export function readOraclePreferences(
  storage?: Pick<Storage, 'getItem'>,
): OraclePreferences {
  try {
    const raw = (storage ?? localStorage).getItem(ORACLE_PREFERENCES_KEY);
    if (!raw) return defaults();
    const value = JSON.parse(raw);
    if (value.schemaVersion !== 1) return defaults();
    return {
      schemaVersion: 1,
      favoriteIds: Array.isArray(value.favoriteIds)
        ? [
            ...new Set<string>(
              value.favoriteIds.filter((v: unknown) => typeof v === 'string'),
            ),
          ]
        : [],
      source: typeof value.source === 'string' ? value.source : '',
      category: typeof value.category === 'string' ? value.category : '',
      dice: typeof value.dice === 'string' ? value.dice : '',
    };
  } catch {
    return defaults();
  }
}
export function writeOraclePreferences(
  value: OraclePreferences,
  storage?: Pick<Storage, 'setItem'>,
) {
  (storage ?? localStorage).setItem(
    ORACLE_PREFERENCES_KEY,
    JSON.stringify(value),
  );
}
