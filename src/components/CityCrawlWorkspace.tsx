import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { OracleRegistry } from '../domain/oracle';
import type { RegionId } from '../domain/types';
import type { ReferenceReading } from '../domain/referenceReading';
import {
  CITY_REFERENCE_GROUPS,
  startCityCrawl,
  advanceCityCrawl,
  resolveCityObstacle,
  finishCityScene,
  cityCrawlMoveReading,
  type CityCrawlConfig,
  type CityCrawlState,
} from '../domain/cityCrawlWorkspace';
import { CityRoller } from './CityRoller';
import {
  readCityCrawlWorkspace,
  writeCityCrawlWorkspace,
} from '../storage/cityCrawlStore';
import {
  InlineReferenceTools,
  ReferenceReadingBlock,
} from './InlineReferenceTools';
import './city-crawl.css';

export function CityCrawlWorkspace({
  registry,
  region = 'galgenbeck',
}: {
  registry: OracleRegistry;
  region?: RegionId;
}) {
  const [saved] = useState(readCityCrawlWorkspace);
  const [config, updateConfig] = useState(saved.config);
  const [state, setState] = useState<CityCrawlState | null>(saved.state);
  const [support, setSupport] = useState<ReferenceReading | null>(null);
  const [error, setError] = useState('');
  function persist(
    nextConfig: CityCrawlConfig,
    nextState: CityCrawlState | null,
  ) {
    try {
      writeCityCrawlWorkspace({ config: nextConfig, state: nextState });
    } catch {
      setError('현재 도시 장면을 이 기기에 저장하지 못했습니다.');
    }
  }
  function setConfig(next: CityCrawlConfig) {
    updateConfig(next);
    persist(next, state);
  }
  const currentConfig = state?.config ?? config;
  function perform(action: () => CityCrawlState, nextConfig = config) {
    try {
      const nextState = action();
      setState(nextState);
      updateConfig(nextConfig);
      setError('');
      persist(nextConfig, nextState);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : '도시 원문 자료를 확인하세요.');
      return false;
    }
  }
  function nextStreet() {
    if (!state) return;
    perform(
      () =>
        advanceCityCrawl(state, registry, {
          modifier: config.modifier,
          allObjectivesMet: config.allObjectivesMet,
        }),
      { ...config, modifier: 0 },
    );
  }
  const modeName =
    currentConfig.mode === 'micro'
      ? 'MICRO-CRAWL'
      : currentConfig.mode === 'derive'
        ? 'DÉRIVE'
        : 'CITY CRAWL';
  const objective = state?.move?.metadata.streetAction === 'next-objective';
  const followUps = state?.reading.relatedIds ?? [];
  return (
    <section className="city-crawl-workspace">
      <header className="city-workspace-heading">
        <div>
          <small>ALÖNE IN THE CROWD · AitC</small>
          <h2>City Crawl</h2>
          <p>도시 진입 → 현재 거리·목표 → 상황 해결 → 다음 거리</p>
        </div>
      </header>
      {!state ? (
        <section className="city-crawl-sheet city-crawl-setup">
          <header>
            <small>01 · ENTER</small>
            <h3>도시 탐험 시작</h3>
          </header>
          <div className="city-crawl-controls">
            <label>
              탐험 방식
              <select
                value={config.mode}
                onChange={(event) =>
                  setConfig({
                    ...config,
                    mode: event.target.value as CityCrawlConfig['mode'],
                  })
                }
              >
                <option value="city">City Crawl · 목표 찾기</option>
                <option value="micro">Micro-crawl · d4개 거리</option>
                <option value="derive">Dérive · 정착지 배회</option>
              </select>
            </label>
            {config.mode === 'city' && (
              <label>
                도시 DR
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={config.dr}
                  onChange={(event) =>
                    setConfig({
                      ...config,
                      dr: Math.max(
                        1,
                        Math.trunc(Number(event.target.value)) || 1,
                      ),
                    })
                  }
                />
              </label>
            )}
          </div>
          <p className="city-crawl-instruction">
            {config.mode === 'micro'
              ? 'd4로 거리 수를 정하고 첫 거리를 함께 만듭니다.'
              : config.mode === 'derive'
                ? '정착지 규모와 거리 수를 정합니다. DR10, Strong·Weak Hit 모두 새 거리입니다.'
                : 'Strong Hit는 다음 목표, Weak Hit는 새 거리. Miss는 먼저 이동을 막은 상황을 해결합니다.'}
          </p>
          <details className="city-crawl-options">
            <summary>거리 생성 옵션</summary>
            {config.mode !== 'derive' && (
              <label className="ref-check">
                <input
                  type="checkbox"
                  checked={config.cityOrMetropolis}
                  onChange={(event) =>
                    setConfig({
                      ...config,
                      cityOrMetropolis: event.target.checked,
                    })
                  }
                />{' '}
                City / Metropolis · 거리 내용 d2회
              </label>
            )}
            <label className="ref-check">
              <input
                type="checkbox"
                checked={config.includeExits}
                onChange={(event) =>
                  setConfig({ ...config, includeExits: event.target.checked })
                }
              />{' '}
              거리 출구 d4도 굴리기
            </label>
          </details>
          <Button
            onClick={() => perform(() => startCityCrawl(config, registry))}
          >
            {config.mode === 'micro'
              ? 'ROLL d4 + 첫 거리'
              : config.mode === 'derive'
                ? '규모 + DÉRIVE 시작'
                : 'ROLL CITY CRAWL'}
          </Button>
        </section>
      ) : (
        <section
          className="city-crawl-sheet city-crawl-current"
          data-phase={state.phase}
        >
          <header>
            <div>
              <small>
                {modeName} ·{' '}
                {state.totalStreets != null
                  ? `${state.streetNumber} / ${state.totalStreets} STREETS`
                  : `STREET ${String(state.streetNumber).padStart(2, '0')}`}
              </small>
              <h3>
                {state.phase === 'blocked'
                  ? '먼저 이 상황을 해결하세요'
                  : state.phase === 'complete'
                    ? '탐험 구간 완료'
                    : objective
                      ? '다음 목표에 도착'
                      : `거리 ${String(state.streetNumber).padStart(2, '0')}`}
              </h3>
            </div>
          </header>
          {state.setup && (
            <details className="city-crawl-options">
              <summary>
                규모와 남은 거리 · {state.totalStreets! - state.streetNumber}개
              </summary>
              <ReferenceReadingBlock reading={state.setup} />
            </details>
          )}
          {state.move && state.reading.oracle && (
            <div className="city-crawl-move">
              <span>
                {state.move.outcome === 'fail'
                  ? 'MISS · 장애 해결 후 새 거리'
                  : `${state.move.outcome.toUpperCase()} HIT · 새 거리`}
              </span>
              <small>
                2d20 [{state.move.diceValues.join(', ')}] +{' '}
                {state.move.modifier} vs DR{state.move.dr}
              </small>
              <details>
                <summary>크롤 판정과 출처</summary>
                <ReferenceReadingBlock
                  reading={cityCrawlMoveReading(state.move, registry)}
                />
              </details>
            </div>
          )}
          <ReferenceReadingBlock reading={state.reading} />
          {followUps.length > 0 && (
            <InlineReferenceTools
              key={
                state.reading.title +
                ':' +
                state.streetNumber +
                ':' +
                state.phase
              }
              title={
                state.phase === 'blocked'
                  ? '이동을 막은 상황 해결'
                  : '이 거리에서 필요한 표'
              }
              ids={followUps}
              region={region}
              cityLarge={currentConfig.cityOrMetropolis}
              cityExits={currentConfig.includeExits}
              initiallyOpen
            />
          )}
          <div className="city-crawl-next" aria-live="polite">
            {state.phase === 'blocked' && (
              <>
                <p>
                  장애·조우를 해결하면 City Crawl을 다시 굴리지 않고 새 거리를
                  만듭니다.
                </p>
                <Button
                  onClick={() =>
                    perform(() => resolveCityObstacle(state, registry))
                  }
                >
                  장애 해결 완료 → 새 거리
                </Button>
              </>
            )}
            {state.phase === 'scene' && (
              <>
                <p>
                  {objective
                    ? '이 목표에서 필요한 일과 조우를 해결하세요.'
                    : '거리 내용과 필요한 후속 판정을 모두 해결하세요.'}
                </p>
                <Button onClick={() => perform(() => finishCityScene(state))}>
                  현재 상황 해결 완료
                </Button>
              </>
            )}
            {state.phase === 'ready' && (
              <>
                <p>다음 거리로 진행하시겠습니까?</p>
                {currentConfig.mode !== 'micro' && (
                  <div className="city-crawl-controls">
                    <label>
                      이번 이동의 길 안내 보정
                      <Input
                        type="number"
                        value={config.modifier}
                        onChange={(event) =>
                          setConfig({
                            ...config,
                            modifier:
                              Math.trunc(Number(event.target.value)) || 0,
                          })
                        }
                      />
                    </label>
                    {currentConfig.mode === 'city' && (
                      <label className="ref-check">
                        <input
                          type="checkbox"
                          checked={config.allObjectivesMet}
                          onChange={(event) =>
                            setConfig({
                              ...config,
                              allObjectivesMet: event.target.checked,
                            })
                          }
                        />{' '}
                        모든 목표에 도달함
                      </label>
                    )}
                  </div>
                )}
                <Button onClick={nextStreet}>
                  {currentConfig.mode === 'micro'
                    ? '다음 거리 만들기'
                    : '다음 거리 · ROLL CITY CRAWL'}
                </Button>
              </>
            )}
            {state.phase === 'complete' && (
              <p>
                {currentConfig.mode === 'derive'
                  ? '정착지 가장자리에 도달했습니다.'
                  : 'Micro-crawl의 모든 거리를 통과했습니다.'}
              </p>
            )}
          </div>
          <details className="city-crawl-options">
            <summary>새 도시 탐험</summary>
            <p>현재 화면의 거리 결과를 정리하고 새 탐험을 준비합니다.</p>
            <Button
              variant="outline"
              onClick={() => {
                setState(null);
                setSupport(null);
                setError('');
                persist(config, null);
              }}
            >
              새 탐험 준비
            </Button>
          </details>
        </section>
      )}
      {error && (
        <p role="alert" className="city-crawl-error">
          {error}
        </p>
      )}
      <div className="city-workspace-tools">
        <details className="city-crawl-sheet city-support-moves">
          <summary>
            <strong>길 묻기 · 기도 · 숨긴 물건 회수</strong>
            <small>AitC 5–6 / 상인 반응 8쪽</small>
          </summary>
          <CityRoller
            registry={registry}
            onReading={setSupport}
            allowedMoves={['directions', 'pray', 'stash', 'merchant']}
            initialMove="directions"
          />
          {support && (
            <ReferenceReadingBlock
              reading={support}
              onDismiss={() => setSupport(null)}
            />
          )}
        </details>
        {CITY_REFERENCE_GROUPS.map((group) => (
          <InlineReferenceTools
            key={group.title}
            title={group.title}
            ids={group.ids}
            description={group.description}
            region={region}
            cityLarge={currentConfig.cityOrMetropolis}
            cityExits={currentConfig.includeExits}
            initiallyOpen={false}
          />
        ))}
      </div>
    </section>
  );
}
