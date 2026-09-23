import type { OracleRegistry } from '../domain/oracle';
import type { ReferenceEntry } from '../domain/references';
import { Translation } from './Translation';

/** Source descriptions belong above the dice, not repeated above table rows. */
export function oracleIntroductionLines(
  entry: ReferenceEntry,
  registry: OracleRegistry,
) {
  const tables = entry.canonicalIds
    .map((id) => registry.tables.find((table) => table.id === id))
    .filter((table) => !!table);
  const descriptions = tables
    .map((table) => table.description?.trim())
    .filter((description): description is string => !!description);
  const uniqueDescriptions = [...new Set(descriptions)];
  if (uniqueDescriptions.length) return uniqueDescriptions;

  // Paired tables and reference-only source material may carry a meaningful
  // use note. A synthetic "d12 · 12 results" count is not an Oracle description.
  if (
    entry.canonicalIds.length > 1 ||
    tables.some((table) => table.rollable === false)
  )
    return entry.summary.trim() ? [entry.summary.trim()] : [];
  return [];
}

const reviewedDescriptionTranslations: Record<string, string> = {
  'reclvse.unspokens':
    '매일 1이 나오면 새로운 진실을 굴리고, 이미 나온 진실이면 다시 굴립니다. 일곱 번째 진실은 언제나 7:7이며 세계의 종말을 뜻합니다. 이전 진실은 기록해 두세요.',
};

export function ReferenceOracleIntroduction({
  entry,
  registry,
}: {
  entry: ReferenceEntry;
  registry: OracleRegistry;
}) {
  const descriptions = oracleIntroductionLines(entry, registry);
  if (!descriptions.length) return null;
  return (
    <div className="reference-oracle-introduction" aria-label="오라클 설명">
      {descriptions.map((description, index) => (
        <div
          className="reference-oracle-introduction-item"
          key={`${entry.id}:${index}`}
        >
          <p
            className="reference-oracle-description"
            lang={/^[A-Za-z]/.test(description) ? 'en' : 'ko'}
          >
            {description}
          </p>
          <Translation
            text={description}
            translation={
              descriptions.length === 1
                ? (entry.summaryTranslationKo ??
                  reviewedDescriptionTranslations[entry.canonicalIds[0]])
                : undefined
            }
          />
        </div>
      ))}
    </div>
  );
}
