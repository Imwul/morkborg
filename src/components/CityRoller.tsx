import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { OracleRegistry } from '../domain/oracle';
import {
  oracleReadingText,
  oracleFollowUpLinks,
  type ReferenceReading,
} from '../domain/referenceReading';
import {
  CITY_MOVE_DEFAULTS,
  rollCityMove,
  resolveDirectionsChoice,
  rollMerchantDisposition,
  rollMicroCrawl,
  rollSettlementStreets,
  encounterSettlementChance,
  prayerPlaceBonus,
  type CityMove,
  type CityMode,
  type CityMoveResult,
} from '../domain/cityProcedures';
import { rollOracle, selectOracleEntry } from '../generators/oracleRoller';

export type CityRollerMove =
  | CityMove
  | 'merchant'
  | 'micro'
  | 'settlement'
  | 'discovery';
const moveLabels: Record<CityRollerMove, string> = {
  crawl: '도시 크롤 · 거리 탐색',
  directions: '방향 찾기',
  pray: '기도',
  stash: '숨긴 물건 회수',
  merchant: '상인 반응',
  micro: '마이크로 크롤 · d4 거리',
  settlement: '정착지 규모 · Dérive 거리 수',
  discovery: '여행 중 정착지 발견 · 1-in-8',
};

export function CityRoller({
  registry,
  onReading,
  allowedMoves = Object.keys(moveLabels) as CityRollerMove[],
  initialMove = allowedMoves[0] ?? 'crawl',
}: {
  registry: OracleRegistry;
  onReading: (reading: ReferenceReading) => void;
  allowedMoves?: readonly CityRollerMove[];
  initialMove?: CityRollerMove;
}) {
  const [mode, setMode] = useState<CityMode>('city');
  const [move, setMove] = useState<CityRollerMove>(initialMove);
  const [dr, setDr] = useState(
      initialMove in CITY_MOVE_DEFAULTS
        ? CITY_MOVE_DEFAULTS[initialMove as CityMove].dr
        : 10,
    ),
    [modifier, setModifier] = useState(0),
    [allMet, setAllMet] = useState(false);
  const [place, setPlace] =
    useState<Parameters<typeof prayerPlaceBonus>[0]>('statue');
  const [last, setLast] = useState<CityMoveResult | null>(null),
    [error, setError] = useState('');
  function showMove(result: CityMoveResult) {
    setLast(result);
    const follow = result.metadata.followUp;
    const table =
      follow && registry.tables.find((entry) => entry.id === follow.tableId);
    const entry =
      table && follow ? selectOracleEntry(table, follow.roll) : undefined;
    const benefit = result.metadata.selectedDirections;
    const followLinks = oracleFollowUpLinks(entry?.metadata);
    onReading({
      title: {
        crawl: '도시 크롤',
        directions: '방향 찾기',
        pray: '기도',
        stash: '숨긴 물건 회수',
      }[result.move],
      blocks: [
        {
          title: `${result.outcome.toUpperCase()} HIT`.replace(
            'FAIL HIT',
            'FAIL',
          ),
          text: result.description,
          dice: `2d20 [${result.diceValues.join(', ')}] + ${result.modifier} → [${result.modifiedValues.join(', ')}] vs DR${result.dr}`,
        },
        ...(follow
          ? [
              {
                title: table?.title ?? '후속 판정',
                text: entry
                  ? oracleReadingText(entry)
                  : '연결된 원문 표를 불러오세요.',
                dice: `${follow.dice} = ${follow.roll}`,
              },
            ]
          : []),
        ...(benefit
          ? [
              {
                title: '선택한 도움',
                text:
                  benefit.nextCrawlBonus != null
                    ? `다음 목표 탐색에 +${benefit.nextCrawlBonus}`
                    : `${benefit.destinationStreets}개 거리 안에 목적지`,
                dice: benefit.diceValues.join(', '),
              },
            ]
          : []),
      ],
      sourceRefs: result.sourceRefs,
      relatedIds: [
        ...(followLinks.relatedIds ?? []),
        ...(follow ? [`oracle:${follow.tableId}`] : []),
      ],
      fixedLookups: followLinks.fixedLookups,
    });
  }
  function run() {
    try {
      setError('');
      setLast(null);
      if (move === 'merchant') {
        const r = rollMerchantDisposition(modifier);
        onReading({
          title: '상인 반응',
          blocks: [
            {
              title: r.description,
              text: r.unresolved
                ? '음수 결과에 대응하는 원문 행이 없습니다.'
                : '설득·위협에서 Strong Hit면 한 단계 유리하게, 실패하면 한 단계 불리하게 이동합니다. Weak Hit는 그대로입니다.',
              dice: `2d6 [${r.diceValues.join(', ')}] + Presence ${modifier} = ${r.modifiedRoll}`,
            },
          ],
          sourceRefs: r.sourceRefs,
        });
      } else if (move === 'micro') {
        const r = rollMicroCrawl();
        onReading({
          title: '마이크로 크롤',
          blocks: [
            {
              title: `${r.streets}개 거리`,
              text: '거리 묘사 표로 각 거리를 굴리세요. 거리 출구는 선택 사항입니다.',
              dice: `d4 = ${r.roll}`,
            },
          ],
          sourceRefs: r.sourceRefs,
        });
      } else if (move === 'discovery') {
        const r = encounterSettlementChance();
        onReading({
          title: '여행일 정착지 발견',
          blocks: [
            {
              title: r.description,
              text: r.discovered
                ? '규모·이름·묘사를 굴려 정착지를 정하세요.'
                : '이번 발견 판정은 여기까지입니다.',
              dice: `d8 = ${r.roll}`,
            },
          ],
          sourceRefs: r.sourceRefs,
        });
      } else if (move === 'settlement') {
        const table = registry.tables.find(
          (t) => t.id === 'aitc.settlement-size',
        );
        if (!table) throw new Error('정착지 규모 원문 표를 불러오세요.');
        const size = rollOracle(table, registry),
          r = rollSettlementStreets(size.roll);
        onReading({
          title: '정착지 규모 / Dérive',
          blocks: [
            {
              title: size.text,
              text: `${r.streets}개 거리를 방문하면 정착지의 가장자리에 도달합니다.`,
              dice: `d20 = ${size.roll}; ${r.dice} = ${r.streets}`,
            },
          ],
          sourceRefs: r.sourceRefs,
        });
      } else
        showMove(
          rollCityMove({
            move,
            mode,
            dr,
            modifier:
              modifier + (move === 'pray' ? prayerPlaceBonus(place) : 0),
            allObjectivesMet: allMet,
          }),
        );
    } catch (e) {
      setError(e instanceof Error ? e.message : '도시 절차를 확인하세요.');
    }
  }
  return (
    <div className="city-roller">
      <div className="ref-controls">
        <label>
          도시 절차
          <select
            value={move}
            onChange={(e) => {
              const next = e.target.value as typeof move;
              setMove(next);
              setModifier(0);
              setLast(null);
              if (next in CITY_MOVE_DEFAULTS)
                setDr(CITY_MOVE_DEFAULTS[next as CityMove].dr);
            }}
          >
            {allowedMoves.map((choice) => (
              <option key={choice} value={choice}>
                {moveLabels[choice]}
              </option>
            ))}
          </select>
        </label>
        {move === 'crawl' && (
          <label>
            탐험 방식
            <select
              value={mode}
              onChange={(e) => {
                setMode(e.target.value as CityMode);
                if (e.target.value === 'derive') setDr(10);
              }}
            >
              <option value="city">도시 크롤 · 목표 탐색</option>
              <option value="derive">Dérive · 배회</option>
            </select>
          </label>
        )}
        {move in CITY_MOVE_DEFAULTS && (
          <label>
            DR
            <Input
              type="number"
              min={1}
              max={30}
              value={dr}
              onChange={(e) =>
                setDr(Math.max(1, Math.trunc(Number(e.target.value)) || 1))
              }
            />
          </label>
        )}
        {(move in CITY_MOVE_DEFAULTS || move === 'merchant') && (
          <label>
            {move === 'crawl'
              ? '거리 탐색 보정'
              : move === 'stash'
                ? '현재 오멘'
                : move === 'directions'
                  ? '현재 존재치 보정'
                  : move === 'pray'
                    ? '기본 보정(+성소 효과)'
                    : move === 'merchant'
                      ? '상인 반응 보정'
                      : '현재 존재치 보정'}
            <Input
              type="number"
              value={modifier}
              onChange={(e) =>
                setModifier(Math.trunc(Number(e.target.value)) || 0)
              }
            />
          </label>
        )}
        {move === 'pray' && (
          <label>
            성소
            <select
              value={place}
              onChange={(e) => setPlace(e.target.value as typeof place)}
            >
              {(
                [
                  'statue',
                  'shrine',
                  'tomb',
                  'chapel',
                  'church',
                  'cathedral',
                ] as const
              ).map((p) => (
                <option key={p} value={p}>
                  {p} +{prayerPlaceBonus(p)}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      {move === 'crawl' && mode === 'city' && (
        <label className="ref-check">
          <input
            type="checkbox"
            checked={allMet}
            onChange={(e) => setAllMet(e.target.checked)}
          />{' '}
          모든 목표에 이미 도달함
        </label>
      )}
      <Button onClick={run}>주사위 굴리기 · {moveLabels[move]}</Button>
      {last?.metadata.directionsOptions &&
        !last.metadata.selectedDirections && (
          <div className="ref-related">
            <small>도움 하나 선택</small>
            {last.metadata.directionsOptions.map((option) => (
              <Button
                key={option.choice}
                variant="ghost"
                onClick={() =>
                  showMove(resolveDirectionsChoice(last, option.choice))
                }
              >
                {option.choice === 'next-crawl-bonus'
                  ? '다음 목표 탐색 보정'
                  : '목적지까지 거리'}
              </Button>
            ))}
          </div>
        )}
      {error && <p role="alert">{error}</p>}
      <details className="sheet-source">
        <summary>사용 조건</summary>
        {allowedMoves.includes('crawl') ? (
          <>
            <p>
              거리 사이 이동은 약 5분. 도시 크롤은 목표 달성 수에 따른 보정을
              쓰지 않습니다. Dérive에서는 강한 성공·약한 성공 모두 새 거리입니다.
              실패한 상황은 해결한 뒤 새 거리를 굴리세요. 마이크로 크롤은 d4개
              거리를 직접 생성합니다.
            </p>
            <p>능력치·보급·시간의 실제 변화는 직접 적용합니다.</p>
          </>
        ) : (
          <p>
            방향 찾기 DR12 존재치 · 기도 DR14 존재치 + 성소 보정 · 숨긴 물건
            회수 DR10 현재 오멘. 각 d20을 DR와 따로 비교합니다. 도움은 선택한
            하나만 적용하고, 보급·능력치의 실제 변경은 직접 적용합니다.
          </p>
        )}
      </details>
    </div>
  );
}
