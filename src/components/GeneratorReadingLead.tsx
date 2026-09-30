import type {
  ReferenceReading,
  ReferenceTextBlock,
} from '../domain/referenceReading';
import { ReferenceReadingText } from './ReferenceReadingText';
import { ReferenceRollTrace } from './ReferenceRollTrace';
import { ReferenceLinkedText } from './ReferenceLinkedText';
import { Translation } from './Translation';

export function GeneratorStatStrip({
  blocks,
}: {
  blocks: ReferenceReading['blocks'];
}) {
  if (!blocks.length) return null;
  return (
    <dl className="generator-stat-strip" aria-label="능력치">
      {blocks.map((block, index) => (
        <div key={`${block.title}:${index}`}>
          <dt>
            {block.title}
            <Translation
              text={block.title}
              translation={block.translation?.titleKo}
            />
          </dt>
          <dd>
            <div className="generator-stat-value">
              {block.text.split('\n').map((line, n) => {
                // Keep complete names, conditions and modifiers. Only bare values use the dice face.
                const value =
                  /^([+−-]?\d+|[−-]?\d*d\d+(?:\s*[+−-]\s*\d+)?)$/i.test(
                    line.trim(),
                  );
                const namedDie =
                  !value &&
                  /^(.*?)\s+([−-]?\d*d\d+(?:\s*[+−-]\s*\d+)?)$/i.exec(
                    line.trim(),
                  );
                return (
                  <span className="generator-stat-line" key={n}>
                    {value ? (
                      <strong className="generator-stat-number">{line}</strong>
                    ) : namedDie ? (
                      <>
                        <span>
                          <ReferenceLinkedText text={namedDie[1]} />
                        </span>
                        <strong className="generator-stat-number">
                          {namedDie[2]}
                        </strong>
                      </>
                    ) : (
                      <span>
                        <ReferenceLinkedText text={line} />
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
            <Translation
              text={block.text}
              translation={block.translation?.ko}
            />
            {block.dice && (
              <details className="generator-stat-trace">
                <summary>굴림 내역</summary>
                <ReferenceRollTrace text={block.dice} />
              </details>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function GeneratorIntroduction({
  block,
  excludeId,
}: {
  block: ReferenceTextBlock;
  excludeId?: string;
}) {
  return (
    <div className="generator-introduction">
      <ReferenceReadingText
        text={block.text}
        resultText={block.text}
        translation={block.translation?.ko}
        excludeId={excludeId}
      />
    </div>
  );
}
