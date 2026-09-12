import { DieIcon } from './DieIcon';
import { resolveCrawlDice } from '../domain/dungeonCrawl';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SourceDisclosure } from './SourceDisclosure';
import { rollDie } from '../generators/random';
import { rollRoadNavigation, JOURNEY_SOURCE } from '../domain/journeyProcedure';

/** A die result is a reading, never damage, elapsed time or a campaign event. */
export function ReferenceDice({
  initialCount = 1,
  initialSides = 20,
  compact = false,
}: { initialCount?: number; initialSides?: number; compact?: boolean } = {}) {
  const [count, setCount] = useState(initialCount),
    [sides, setSides] = useState(initialSides),
    [modifier, setModifier] = useState(0),
    [result, setResult] = useState('');
  const formula = `${count}d${sides}${modifier ? `${modifier > 0 ? '+' : ''}${modifier}` : ''}`;
  if (compact)
    return (
      <div className="reference-inline-dice">
        <Button
          onClick={() => {
            const dice = Array.from({ length: count }, () => rollDie(sides));
            setResult(
              `${formula} → ${dice.reduce((a, b) => a + b, 0)} · [${dice.join(', ')}]`,
            );
          }}
        >
          {formula} {result ? '다시 굴리기' : '굴리기'}
        </Button>
        {result && <output aria-live="polite">{result}</output>}
      </div>
    );
  return (
    <section className="reference-dice" aria-label="독립 주사위">
      <div className="dice-settings">
        <div className="dice-heading">
          <strong>주사위</strong>
          <code>{formula}</code>
        </div>
        <label>
          개수
          <Input
            aria-label="주사위 개수"
            type="number"
            min={1}
            max={20}
            value={count}
            onChange={(e) =>
              setCount(
                Math.max(
                  1,
                  Math.min(20, Math.trunc(Number(e.target.value) || 1)),
                ),
              )
            }
          />
        </label>
        <label>
          보정
          <Input
            aria-label="주사위 보정"
            type="number"
            min={-99}
            max={99}
            value={modifier}
            onChange={(e) =>
              setModifier(
                Math.max(
                  -99,
                  Math.min(99, Math.trunc(Number(e.target.value) || 0)),
                ),
              )
            }
          />
        </label>
        <Button
          onClick={() => {
            const dice = Array.from({ length: count }, () => rollDie(sides));
            setResult(
              `${formula} = ${dice.reduce((a, b) => a + b, modifier)} · [${dice.join(', ')}]`,
            );
          }}
        >
          굴리기
        </Button>
      </div>
      <fieldset className="dice-picker" aria-label="주사위 모양 선택">
        {[2, 4, 6, 8, 10, 12, 20, 100].map((n) => (
          <button
            key={n}
            type="button"
            className="die-choice"
            aria-label={`d${n} 선택`}
            aria-pressed={sides === n}
            onClick={() => setSides(n)}
          >
            <DieIcon sides={n} />
            <span>d{n}</span>
          </button>
        ))}
      </fieldset>
      <output aria-live="polite">{result}</output>
    </section>
  );
}

/** The fictional situation is chosen by the reader; no road/weather result is required. */
export function RoadSituationRoller() {
  const [modifier, setModifier] = useState(0),
    [result, setResult] = useState<ReturnType<typeof rollRoadNavigation>>();
  return (
    <section
      className="road-situation-test"
      aria-label="동물 흔적 · 망가진 길 판정"
    >
      <p>동물 흔적을 따라가거나 망가진 길을 지날 때 참고합니다.</p>
      <code>1d20 + Presence / Omens ≥ DR10</code>
      <div className="reference-card-actions">
        <label>
          Presence / Omens
          <Input
            aria-label="길 판정 보정"
            type="number"
            value={modifier}
            onChange={(e) =>
              setModifier(Math.trunc(Number(e.target.value) || 0))
            }
          />
        </label>
        <Button onClick={() => setResult(rollRoadNavigation(modifier))}>
          흔적 · 망가진 길 판정
        </Button>
      </div>
      {result && (
        <output aria-live="polite">
          d20 = {result.roll} · 보정 {result.modifier} ·{' '}
          {result.success
            ? '성공 · 길을 유지합니다.'
            : '실패 · Leaving the Road 표를 참고하세요.'}
        </output>
      )}
      <SourceDisclosure refs={[JOURNEY_SOURCE]} />
    </section>
  );
}

/** The reader supplies the source-rule inputs; a roll never discovers or creates a room. */
export function DungeonReferenceRoller() {
  const [bonus, setBonus] = useState(0),
    [dr, setDr] = useState(12);
  const [result, setResult] = useState<ReturnType<typeof resolveCrawlDice>>();
  return (
    <section className="reference-recipe" aria-label="던전 탐색 판정">
      <h3>던전 탐색 · 2d20</h3>
      <p>각 d20 + 발견한 특별한 방 수를 DR과 따로 비교합니다.</p>
      <div className="reference-card-actions">
        <label>
          특별한 방 수
          <Input
            type="number"
            aria-label="참고할 특별한 방 수"
            min={0}
            max={4}
            value={bonus}
            onChange={(e) =>
              setBonus(
                Math.max(
                  0,
                  Math.min(4, Math.trunc(Number(e.target.value) || 0)),
                ),
              )
            }
          />
        </label>
        <label>
          DR
          <select
            aria-label="던전 판정 DR"
            value={dr}
            onChange={(e) => setDr(Number(e.target.value))}
          >
            {[6, 8, 10, 12, 14].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <Button
          onClick={() =>
            setResult(resolveCrawlDice([rollDie(20), rollDie(20)], bonus, dr))
          }
        >
          던전 탐색 굴리기
        </Button>
      </div>
      {result && (
        <output aria-live="polite">
          2d20 [{result.dice.join(', ')}] + {result.bonus} · DR{result.dr} ·{' '}
          {result.outcome === 'strong'
            ? 'Strong · 특별한 방'
            : result.outcome === 'weak'
              ? 'Weak · 일반 방'
              : 'Miss · 위험'}
          {result.exhausted ? ' (특별한 방 4개 이후 Strong은 Weak)' : ''}
        </output>
      )}
      <SourceDisclosure
        refs={[
          {
            bookId: 'sd',
            bookTitle: 'Sölitary Defilement',
            pdfPage: [9, 19],
            tableTitle: 'Dungeon Crawling',
          },
        ]}
      />
    </section>
  );
}
