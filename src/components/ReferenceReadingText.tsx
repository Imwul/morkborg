import { Translation } from './Translation';

/** Translate a rolled entry and its separate instructions independently. */
export function ReferenceReadingText({
  text,
  source,
}: {
  text: string;
  source?: { text: string; metadata?: Record<string, unknown> };
}) {
  const hasSource =
    !!source?.text &&
    (text === source.text || text.startsWith(`${source.text}\n\n`));
  const paragraphs = hasSource
    ? [source.text, ...text.slice(source.text.length).split(/\n\s*\n/)]
    : text.split(/\n\s*\n/);
  return paragraphs
    .filter((paragraph) => paragraph.trim())
    .map((paragraph, index) => (
      <p key={index}>
        {paragraph}
        <Translation
          text={paragraph}
          translation={
            hasSource && index === 0 && typeof source.metadata?.ko === 'string'
              ? source.metadata.ko
              : undefined
          }
        />
      </p>
    ));
}
