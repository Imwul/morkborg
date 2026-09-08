import { useMemo } from 'react';
import { useReferenceDesk } from './ReferenceContext';
import { referenceTextSegments } from '../domain/generatedReferenceLinks';

export function ReferenceLinkedText({
  text,
  excludeId,
}: {
  text: string;
  excludeId?: string;
}) {
  const desk = useReferenceDesk();
  const segments = useMemo(
    () => referenceTextSegments(desk?.entries ?? [], text),
    [desk?.entries, text],
  );
  return (
    <>
      {segments.map((part, i) =>
        part.id && part.id !== excludeId ? (
          <button
            className="reference-inline-link"
            key={i}
            onClick={() => desk?.activate(part.id!)}
            aria-label={`${part.text} reference`}
          >
            {part.text}
          </button>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </>
  );
}
