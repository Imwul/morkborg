import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { OracleRegistry } from '../domain/oracle';
import type { RegionId } from '../domain/types';
import {
  DUNGEON_ACTIONS,
  dungeonActionDR,
  rollDungeonAction,
  type DungeonAction,
  type DungeonActionInput,
  type DungeonActionResult,
} from '../domain/dungeonActionMoves';
import {
  InlineReferenceTools,
  ReferenceReadingBlock,
} from './InlineReferenceTools';

export function DungeonActionMoves({
  threatRating,
  region = 'sarkash',
  registry,
}: {
  threatRating: 9 | 12 | 15;
  region?: RegionId;
  registry: OracleRegistry;
}) {
  const uid = useId();
  const [action, setAction] = useState<DungeonAction>('search');
  const [modifier, setModifier] = useState('0'),
    [enemies, setEnemies] = useState('1'),
    [customDR, setCustomDR] = useState('12');
  const [loud, setLoud] = useState(false),
    [lockpick, setLockpick] = useState(false),
    [enemyState, setEnemyState] = useState<
      'normal' | 'preoccupied' | 'alerted'
    >('normal');
  const [result, setResult] = useState<DungeonActionResult>(),
    [error, setError] = useState(''),
    [resolved, setResolved] = useState(false);
  const entry = DUNGEON_ACTIONS.find((a) => a.id === action)!;
  const input: DungeonActionInput = {
    action,
    modifier: Number(modifier),
    enemies: Number(enemies),
    customDR: Number(customDR),
    threatRating,
    loud,
    lockpick,
    enemyState,
  };
  const rest = action === 'breath' || action === 'camp';
  function roll(retry = false) {
    try {
      setError('');
      const next = rollDungeonAction({ ...input, retry }, registry);
      setResult(next);
      setResolved(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : '규칙 자료를 확인하세요.');
    }
  }
  return (
    <details className="inline-tools dungeon-action-moves">
      <summary>
        도망 · 탐색 · 휴식 · 위험 판정<small>SD / DEP</small>
      </summary>
      <div className="procedure-controls">
        <label htmlFor={`${uid}-action`}>
          행동
          <select
            id={`${uid}-action`}
            value={action}
            onChange={(e) => {
              setAction(e.target.value as DungeonAction);
              setResult(undefined);
              setResolved(false);
              setError('');
            }}
          >
            {DUNGEON_ACTIONS.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title}
              </option>
            ))}
          </select>
        </label>
        {action !== 'noise' && (
          <label htmlFor={`${uid}-modifier`}>
            {entry.ability}
            <Input
              id={`${uid}-modifier`}
              type="number"
              step={1}
              value={modifier}
              onChange={(e) => setModifier(e.target.value)}
            />
          </label>
        )}
        {action === 'flee' && (
          <label htmlFor={`${uid}-enemies`}>
            적 수
            <Input
              id={`${uid}-enemies`}
              type="number"
              min={1}
              step={1}
              value={enemies}
              onChange={(e) => setEnemies(e.target.value)}
            />
          </label>
        )}
        {action === 'resupply' && (
          <label htmlFor={`${uid}-dr`}>
            행동 DR
            <Input
              id={`${uid}-dr`}
              type="number"
              min={1}
              step={1}
              value={customDR}
              onChange={(e) => setCustomDR(e.target.value)}
            />
          </label>
        )}
        {action === 'enemy' && (
          <label htmlFor={`${uid}-awareness`}>
            적의 상태
            <select
              id={`${uid}-awareness`}
              value={enemyState}
              onChange={(e) =>
                setEnemyState(e.target.value as typeof enemyState)
              }
            >
              <option value="normal">보통 · TR</option>
              <option value="preoccupied">몰두 중, 비경계 · TR−3</option>
              <option value="alerted">경계 중 · TR+3</option>
            </select>
          </label>
        )}
        {action === 'door' && (
          <label>
            <input
              type="checkbox"
              checked={lockpick}
              onChange={(e) => setLockpick(e.target.checked)}
            />
            잠긴 문 + 자물쇠 따개 · DR−3
          </label>
        )}
        {action === 'noise' && (
          <label>
            <input
              type="checkbox"
              checked={loud}
              onChange={(e) => setLoud(e.target.checked)}
            />
            많은 시간 / 큰 소음 · 2-in-6
          </label>
        )}
        <Button
          disabled={rest && result?.outcome === 'fail'}
          onClick={() => roll()}
        >
          {action === 'noise'
            ? `위험 d6 · ${loud ? 2 : 1}-in-6`
            : `${entry.title} 2d20 · DR${dungeonActionDR(input)}`}
        </Button>
      </div>
      {action === 'search' && (
        <p className="inline-tools-note">
          남은 Omens를 더합니다. Omens는 소비하지 않습니다. Strong / Weak의 발견
          d4를 함께 굴린 뒤 해당 표를 선택합니다.
        </p>
      )}
      {action === 'resupply' && (
        <p className="inline-tools-note">
          던전에서는 상황과 능력에 맞는 General Adventuring Move를 사용합니다.
          여행 중 하루 채집은 Journey의 FER Forage를 사용하세요.
        </p>
      )}
      {action === 'trap-save' && (
        <p className="inline-tools-note">
          발동한 함정의 종류부터 정하고 해당 능력을 선택하세요. Strong만 모든
          결과를 피합니다.
        </p>
      )}
      {error && <p role="alert">{error}</p>}
      {result && (
        <>
          <ReferenceReadingBlock reading={result.reading} />
          {rest && result.outcome === 'fail' && (
            <>
              <label className="journey-acknowledge">
                <input
                  type="checkbox"
                  checked={resolved}
                  onChange={(e) => setResolved(e.target.checked)}
                />
                휴식을 방해한 사건을 해결했습니다.
              </label>
              <Button disabled={!resolved} onClick={() => roll(true)}>
                다시 쉬기 · Strong / Weak 50:50
              </Button>
            </>
          )}
          {result.relatedIds.length > 0 && (
            <InlineReferenceTools
              key={`${action}-${result.values.join('-')}`}
              title="이 결과의 다음 판정"
              ids={result.relatedIds}
              region={region}
              initiallyOpen
            />
          )}
        </>
      )}
      <InlineReferenceTools
        title="행동 규칙 · 출처"
        ids={[`rule:${entry.ruleId}`]}
        region={region}
      />
    </details>
  );
}
