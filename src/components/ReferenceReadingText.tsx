import { Translation } from './Translation';
import { ReferenceLinkedText } from './ReferenceLinkedText';

/** Translate a rolled entry and its separate instructions independently. */
export function ReferenceReadingText({
  text,
  source,
  translation,
  excludeId,
  splitLines = false,
}: {
  text: string;
  source?: { text: string; metadata?: Record<string, unknown> };
  translation?: string;
  excludeId?: string;
  splitLines?: boolean;
}) {
  if (translation)
    return (
      <p>
        <ReferenceLinkedText text={text} excludeId={excludeId} />
        <Translation text={text} translation={translation} />
      </p>
    );
  const hasSource =
    !!source?.text &&
    (text === source.text || text.startsWith(`${source.text}\n\n`));
  const paragraphs = hasSource
    ? [source.text, ...text.slice(source.text.length).split(/\n\s*\n/)]
    : text.split(splitLines ? /\n+/ : /\n\s*\n/);
  const helper = source?.metadata?.translation;
  const preserveName =
    helper &&
    typeof helper === 'object' &&
    !Array.isArray(helper) &&
    (helper as Record<string, unknown>).properNamePreserved === true;
  const explicitHelper =
    typeof source?.metadata?.ko === 'string' && source.metadata.ko.trim()
      ? source.metadata.ko
      : undefined;
  return paragraphs
    .filter((paragraph) => paragraph.trim())
    .map((paragraph, index) => (
      <p key={index}>
        <ReferenceLinkedText text={paragraph} excludeId={excludeId} />
        {!(hasSource && index === 0 && preserveName && !explicitHelper) && (
          <Translation
            text={paragraph}
            translation={hasSource && index === 0 ? explicitHelper : undefined}
          />
        )}
      </p>
    ));
}
