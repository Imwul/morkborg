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
  if (translation) {
    const english = text.split(/\n\s*\n/);
    const korean = translation.split(/\n\s*\n/);
    // Pair only explicit translations with the same paragraph structure.
    // A mismatched helper remains intact; never guess sentence correspondence.
    const pairs =
      english.length === korean.length
        ? english.map((paragraph, index) => [paragraph, korean[index]])
        : [[text, translation]];
    return pairs.map(([original, helper], index) => (
      <p key={index}>
        <ReferenceLinkedText text={original} excludeId={excludeId} />
        <Translation text={original} translation={helper} />
      </p>
    ));
  }
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
