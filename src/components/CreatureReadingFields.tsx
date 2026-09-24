import type { ReferenceReading } from '../domain/referenceReading';
import { ReferenceReadingText } from './ReferenceReadingText';

/** Labels describe existing source fields, never inferred lines or new stats. */
export function CreatureReadingFields({
  block,
  excludeId,
}: {
  block: ReferenceReading['blocks'][number];
  excludeId?: string;
}) {
  if (!block.creatureFields?.length || block.translation?.ko) {
    // Preserve older/specialized readings and their explicit paragraph pairing.
    return (
      <section className="creature-reading-field creature-reading-unstructured">
        <h4>내용</h4>
        <ReferenceReadingText
          text={block.text}
          resultText={block.text}
          translation={block.translation?.ko}
          excludeId={excludeId}
          splitLines
        />
      </section>
    );
  }
  return block.creatureFields.map((field) => (
    <section
      className="creature-reading-field"
      data-creature-field={field.id}
      key={field.id}
    >
      <h4>{field.title}</h4>
      <ReferenceReadingText
        text={field.text}
        resultText={field.text}
        excludeId={excludeId}
        splitLines
      />
    </section>
  ));
}
