import type { PublishedPacks } from './publishedDataClient';
import {
  mergePrivateLibraryUpdate,
  mergeOracleTranslations,
} from './privateUpdates';

/** Add missing source tables and translations, keeping existing rules and custom selectors. */
export function mergePublishedPacks(
  current: PublishedPacks,
  incoming: PublishedPacks,
): PublishedPacks {
  const baseLibrary =
    current.library && incoming.library
      ? mergePrivateLibraryUpdate(current.library, incoming.library)
      : (current.library ?? incoming.library);
  const library = baseLibrary
    ? {
        ...baseLibrary,
        books: [
          ...baseLibrary.books,
          ...(incoming.library?.books ?? []).filter(
            (b) => !baseLibrary.books.some((old) => old.id === b.id),
          ),
        ],
        tables: { ...incoming.library?.tables, ...baseLibrary.tables },
      }
    : undefined;
  const baseOracles =
    current.oracles && incoming.oracles
      ? mergeOracleTranslations(current.oracles, incoming.oracles)
      : (current.oracles ?? incoming.oracles);
  const oracles = baseOracles
    ? {
        ...baseOracles,
        books: [
          ...baseOracles.books,
          ...(incoming.oracles?.books ?? []).filter(
            (b) => !baseOracles.books.some((old) => old.id === b.id),
          ),
        ],
        tables: [
          ...baseOracles.tables,
          ...(incoming.oracles?.tables ?? []).filter(
            (t) => !baseOracles.tables.some((old) => old.id === t.id),
          ),
        ],
        procedures: [
          ...baseOracles.procedures,
          ...(incoming.oracles?.procedures ?? []).filter(
            (p) => !baseOracles.procedures.some((old) => old.id === p.id),
          ),
        ],
        overrides: { ...incoming.oracles?.overrides, ...baseOracles.overrides },
        entrySelectors: {
          ...incoming.oracles?.entrySelectors,
          ...baseOracles.entrySelectors,
        },
      }
    : undefined;
  return {
    library,
    oracles,
    fateChart: current.fateChart ?? incoming.fateChart,
  };
}
