import type { GeneratedValueProvenance } from '../domain/generationProvenance';
import { ReferenceLinkedText } from './ReferenceLinkedText';
import { Translation } from './Translation';

/** Read-mode source values keep the same inline helper as their editable fields. */
export function TranslatedValue({
  text,
  translation,
  provenance,
  linked = true,
}: {
  text: string;
  translation?: string;
  provenance?: GeneratedValueProvenance;
  linked?: boolean;
}) {
  return (
    <>
      {linked ? <ReferenceLinkedText text={text} /> : text}
      {provenance?.origin !== 'manual' &&
        provenance?.origin !== 'source-edited' && (
          <Translation text={text} translation={translation} />
        )}
    </>
  );
}
