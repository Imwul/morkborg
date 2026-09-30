import type { ReferenceReading } from '../domain/referenceReading';
import { ReferenceReadingText } from './ReferenceReadingText';
import { creatureStatBlocks } from '../domain/generatorReadingLayout';
import {
  GeneratorIntroduction,
  GeneratorStatStrip,
} from './GeneratorReadingLead';

/** Labels describe existing source fields, never inferred lines or new stats. */
export function CreatureReadingFields({
  block,
  excludeId,
  generator = false,
}: {
  block: ReferenceReading['blocks'][number];
  excludeId?: string;
  generator?: boolean;
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
  const introduction =
    generator &&
    block.creatureFields.find((field) => field.id === 'appearance-stats');
  const stats =
    generator && block.creatureFields.find((field) => field.id === 'stats');
  const statBlocks = stats ? creatureStatBlocks(stats.text) : undefined;
  const labels: Record<string, string> = {
    stats: 'Stats',
    attacks: 'Attack',
    special: 'Ability',
    weakness: 'Weakness',
    loot: 'Loot',
    behavior: 'Behaviour',
    wants: 'Wants',
    description: 'Description',
    'appearance-stats': 'Appearance',
    unavailable: 'Source',
  };
  return (
    <>
      {introduction && (
        <GeneratorIntroduction block={introduction} excludeId={excludeId} />
      )}
      {statBlocks && <GeneratorStatStrip blocks={statBlocks} />}
      {block.creatureFields
        .filter(
          (field) => field !== introduction && !(statBlocks && field === stats),
        )
        .map((field) => (
          <section
            className="creature-reading-field"
            data-creature-field={field.id}
            key={field.id}
          >
            <h4>
              {generator && labels[field.id] ? (
                <>
                  {labels[field.id]}{' '}
                  <span className="generated-translation" lang="ko">
                    {field.title}
                  </span>
                </>
              ) : (
                field.title
              )}
            </h4>
            <ReferenceReadingText
              text={field.text}
              resultText={field.text}
              excludeId={excludeId}
              splitLines
            />
          </section>
        ))}
    </>
  );
}
