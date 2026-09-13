import { Translation } from './Translation';
import { ReferenceLinkedText } from './ReferenceLinkedText';

/** Translate a rolled entry and its separate instructions independently. */
export function ReferenceReadingText({
  text,
  source,
  translation,
  resultText,
  excludeId,
  splitLines = false,
}: {
  text: string;
  source?: { text: string; metadata?: Record<string, unknown> };
  translation?: string;
  /** The source result, excluding appended rules or follow-up instructions. */
  resultText?: string;
  excludeId?: string;
  splitLines?: boolean;
}) {
  const resultEnd =
    resultText && (text === resultText || text.startsWith(`${resultText}\n\n`))
      ? resultText.length
      : 0;
  let cursor = 0;
  function originalText(original: string) {
    const start = text.indexOf(original, cursor);
    cursor = start + original.length;
    const length = Math.max(0, Math.min(original.length, resultEnd - start));
    return (
      <>
        {length > 0 && (
          <span className="reference-result-text">
            <ReferenceLinkedText
              text={original.slice(0, length)}
              excludeId={excludeId}
            />
          </span>
        )}
        {length < original.length && (
          <ReferenceLinkedText
            text={original.slice(length)}
            excludeId={excludeId}
          />
        )}
      </>
    );
  }
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
        {originalText(original)}
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
        {originalText(paragraph)}
        {!(hasSource && index === 0 && preserveName && !explicitHelper) && (
          <Translation
            text={paragraph}
            translation={hasSource && index === 0 ? explicitHelper : undefined}
          />
        )}
      </p>
    ));
}
