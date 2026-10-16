import type {
  ReferenceReading,
  ReferenceTextBlock,
} from '../domain/referenceReading';
import { ReferenceReadingText } from './ReferenceReadingText';
import { ReferenceRollTrace } from './ReferenceRollTrace';
import { ReferenceLinkedText } from './ReferenceLinkedText';
import { Translation } from './Translation';
import type { ReactNode } from 'react';
import type { CharacterReadingGroup } from '../domain/generatorReadingLayout';
import type { CharacterSheetBlock } from '../domain/characterSheetPresentation';
import { useReferenceDesk } from './ReferenceContext';

/** Reading help only; generating a character does not spend or recover resources. */
export function CharacterResourceNote({ kind }: { kind: 'omens' | 'powers' }) {
  const desk = useReferenceDesk();
  const referenceId =
    kind === 'omens' ? 'rule:core.omens' : 'rule:core.casting';
  return (
    <p className="character-resource-note">
      {kind === 'omens' ? (
        <>
          <strong>오멘 · Core 선택 규칙</strong> 모두 소진한 뒤 6시간 이상 쉬면
          직업 지정 주사위로 회복합니다. 직업 없음은 d2입니다.
        </>
      ) : (
        <>
          <strong>권능 · Core</strong> 매일 아침 지각+d4로 그날의 사용 횟수를
          정합니다. 두루마리 판정에 성공하면 1회 소모합니다. 직업 능력의 별도
          횟수는 해당 설명을 따릅니다.
        </>
      )}
      {desk?.byId[referenceId] && (
        <>
          {' '}
          <button
            className="reference-inline-link"
            onClick={() => desk.activate(referenceId)}
            aria-label={
              kind === 'omens'
                ? '오멘 사용·회복 규칙 열기'
                : '권능 사용 규칙 열기'
            }
          >
            규칙 ›
          </button>
        </>
      )}
    </p>
  );
}

export function GeneratorReadingFields({
  blocks,
  groups,
  renderBlock,
}: {
  blocks: ReferenceReading['blocks'];
  groups?: CharacterReadingGroup[];
  renderBlock: (
    block: ReferenceReading['blocks'][number],
    index: number,
  ) => ReactNode;
}) {
  if (!groups)
    return (
      <div className="reference-reading-items">{blocks.map(renderBlock)}</div>
    );
  return (
    <div className="generator-character-sections">
      {groups.map((group) => (
        <section
          key={group.id}
          className="generator-character-section"
          data-character-section={group.id}
          aria-label={group.title}
        >
          <h3 className="generator-character-section-title">
            {group.title} <small>{group.titleKo}</small>
          </h3>
          <div className="reference-reading-items">
            {group.blocks.map(renderBlock)}
          </div>
        </section>
      ))}
    </div>
  );
}

export function GeneratorStatStrip({
  blocks,
  character = false,
}: {
  blocks: CharacterSheetBlock[];
  character?: boolean;
}) {
  if (!blocks.length) return null;
  return (
    <>
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
                        <strong className="generator-stat-number">
                          {line}
                        </strong>
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
              {character && block.sheetFormula && (
                <small className="generator-stat-formula">
                  생성: {block.sheetFormula}
                </small>
              )}
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
      {character && blocks.some((block) => block.title === 'Omens') && (
        <CharacterResourceNote kind="omens" />
      )}
      {character &&
        blocks.some((block) => block.title === 'Power uses/day') && (
          <CharacterResourceNote kind="powers" />
        )}
    </>
  );
}

export function CharacterFieldContext({
  block,
}: {
  block: CharacterSheetBlock;
}) {
  return block.sheetContext ? (
    <p className="character-field-context">{block.sheetContext}</p>
  ) : null;
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
