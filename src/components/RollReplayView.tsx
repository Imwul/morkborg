import { useState } from 'react';
import {
  copyReplay,
  replayParameterLines,
  replaySources,
  type RollReplay,
} from '../domain/rollReplay';
import type { ReferenceRegistry } from '../domain/references';
import type { OracleRegistry } from '../domain/oracle';
import { ReferenceReadingText } from './ReferenceReadingText';
import { Translation } from './Translation';
import { SourceDisclosure } from './SourceDisclosure';
import { appPolicy, sourceProcedure } from '../domain/generationAuthority';
import { cardIdentity } from '../domain/depthsProcedures';

/** A read-only snapshot viewer. No generator, deck setter or Campaign operation is imported. */
export function RollReplayView({
  entry,
  index,
  registry,
  onReroll,
}: {
  entry: RollReplay;
  index: ReferenceRegistry;
  registry: OracleRegistry;
  onReroll: () => void;
}) {
  const parameterLines = replayParameterLines(entry, index);
  const [copyState, setCopyState] = useState('');
  const [fallback, setFallback] = useState('');
  async function copy(withSource = false) {
    const text = copyReplay(entry, withSource);
    try {
      await navigator.clipboard.writeText(text);
      setCopyState('복사했습니다.');
    } catch {
      setFallback(text);
    }
  }
  return (
    <article className="roll-replay-view">
      <small className="eyebrow">REPLAY · 이전 결과 그대로</small>
      <h2>{entry.title}</h2>
      <div className="replay-actions">
        <button onClick={onReroll}>REROLL</button>
        <button onClick={() => copy()}>COPY</button>
        <details>
          <summary aria-label="Replay 추가 동작">⋯</summary>
          <button onClick={() => copy(true)}>출처와 함께 복사</button>
        </details>
      </div>
      {entry.results.map((result, n) => {
        const refs = replaySources(result, index, registry);
        const missing =
          !index.byId[result.referenceId] ||
          !refs.length ||
          refs.some((s) => s.status === 'UNAVAILABLE');
        return (
          <section className="replay-component" key={n}>
            {entry.results.length > 1 && (
              <h3>
                {result.reading.title}
                {result.held && <small> · HOLD</small>}
              </h3>
            )}
            <div className="replay-reading">
              {result.manualText !== undefined ? (
                <p className="recipe-manual-text">{result.manualText}</p>
              ) : (
                result.reading.blocks.map((b, i) => (
                  <section key={i}>
                    {b.title && b.title !== result.reading.title && (
                      <h4>
                        {b.title}
                        <Translation
                          text={b.title}
                          translation={b.translation?.titleKo}
                        />
                      </h4>
                    )}
                    <ReferenceReadingText
                      text={b.text}
                      translation={b.translation?.ko}
                      splitLines={!!result.cards}
                    />
                    {b.dice && (
                      <small className="reference-reading-dice">{b.dice}</small>
                    )}
                  </section>
                ))
              )}
            </div>
            {missing && (
              <p className="provenance-warning">
                SOURCE UNAVAILABLE · 저장된 결과는 유지됩니다.
              </p>
            )}
            <SourceDisclosure
              refs={refs}
              hideWarning={missing}
              authorities={[
                ...(index.byId[result.referenceId]?.authority ?? [
                  sourceProcedure(result.referenceId, refs),
                ]),
                ...(entry.kind === 'recipe'
                  ? [appPolicy('app.reference-recipe')]
                  : []),
                ...(result.mode !== 'APP_ROLL'
                  ? [appPolicy('app.physical-roll')]
                  : []),
              ]}
            >
              <p>
                {result.mode === 'APP_ROLL'
                  ? 'APP ROLL · 앱 굴림'
                  : result.mode === 'USER_ROLL'
                    ? 'MANUAL ROLL · 실물 입력'
                    : 'MIXED · 실물 입력과 앱 굴림'}
              </p>
              {result.manualText !== undefined && (
                <p>
                  Originally generated from: 위 출처. Edited manually · 현재
                  문구는 직접 수정했습니다.
                </p>
              )}
              {result.inputs && (
                <p>{Object.values(result.inputs).join(' · ')}</p>
              )}
              {result.rolls.map((r, i) => (
                <p key={i}>
                  {r.title} · {r.dice} = {r.roll}
                  {r.origin === 'USER_ROLL'
                    ? ' · 실물'
                    : r.origin === 'APP_ROLL'
                      ? ' · 앱'
                      : ''}
                  {r.diceValues.length > 1
                    ? ` [${r.diceValues.join(', ')}]`
                    : ''}
                </p>
              ))}
              <p>
                APP_POLICY · 이 탭의 결과 스냅샷입니다. 현재 원문이 변경되어도
                저장된 결과를 다시 계산하지 않습니다.
              </p>
            </SourceDisclosure>
            {result.cards && (
              <details className="replay-card-trace">
                <summary>카드 {result.cards.length} · 기록</summary>
                <ol className="rare-card-strip">
                  {result.cards.map((c, i) => (
                    <li key={i}>
                      <small>CARD {i + 1}</small>
                      <strong>{cardIdentity(c)}</strong>
                    </li>
                  ))}
                </ol>
                {result.cardComponents?.map((c, i) => (
                  <div key={i}>
                    <strong>{c.title}</strong>
                    <ReferenceReadingText text={c.text} splitLines />
                    <small>CARD {c.cards.join(' / ')}</small>
                    <SourceDisclosure
                      refs={replaySources(
                        {
                          ...result,
                          reading: {
                            ...result.reading,
                            sourceRefs: [c.source],
                          },
                        },
                        index,
                        registry,
                      )}
                    />
                  </div>
                ))}
              </details>
            )}
          </section>
        );
      })}
      {!!parameterLines.length && (
        <details className="replay-parameters">
          <summary>사용한 조건</summary>
          <dl>
            {parameterLines.map(([key, value], i) => (
              <div key={i}>
                <dt>{key}</dt>
                <dd>
                  {typeof value === 'boolean'
                    ? value
                      ? '예'
                      : '아니오'
                    : String(value)}
                </dd>
              </div>
            ))}
          </dl>
        </details>
      )}
      {copyState && <output>{copyState}</output>}
      {fallback && (
        <textarea aria-label="복사할 Replay 결과" readOnly value={fallback} />
      )}
    </article>
  );
}
