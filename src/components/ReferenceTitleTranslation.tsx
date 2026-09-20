import type { ReferenceEntry } from '../domain/references';
import { referenceDisplayTitle } from '../domain/referenceDisplayTitles';

/** Keep secondary-title admission separate from general body/result helpers. */
export function ReferenceTitleTranslation({
  entry,
}: {
  entry: ReferenceEntry;
}) {
  const { text } = referenceDisplayTitle(entry);
  return text ? (
    <span className="generated-translation" lang="ko">
      {text}
    </span>
  ) : null;
}
