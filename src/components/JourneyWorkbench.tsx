import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Campaign, RegionId } from '../domain/types';
import type { OracleRegistry, OracleResult } from '../domain/oracle';
import { regions } from '../data/regions';
import { editCampaign } from '../storage/saveStore';
import { SourceDisclosure } from './SourceDisclosure';
import {
  InlineReferenceTools,
  ReferenceReadingBlock,
} from './InlineReferenceTools';
import {
  APOCALYPSE_DICE,
  CALENDAR_SOURCE,
  campaignHasEnded,
  dawnForDay,
  recordCurrentDawn,
  recordNextJourneyDawn,
  travelNeedsReplacement,
} from '../domain/campaignProcedures';
import {
  JOURNEY_SOURCE,
  CAMPING_SOURCE,
  emptyJourneyDay,
  readJourneyDay,
  journeyStorageKey,
  journeyRoadNeedsCheck,
  journeyReadyForEncounters,
  journeyRepeatedRoadEvent,
  consumeJourneyRoadEvents,
  journeyReadyToFinish,
  rollJourneyTable,
  rollJourneyActivity,
  rollRoadNavigation,
  rollJourneyCamp,
  journeyOracleReading,
  journeyCampReading,
  type JourneyDay,
} from '../domain/journeyProcedure';
import { encounterSettlementChance } from '../domain/cityProcedures';
import '../journey.css';

function JourneyBlock({
  number,
  title,
  active,
  done,
  preview,
  children,
}: {
  number: string;
  title: string;
  active: boolean;
  done: boolean;
  preview?: string;
  children: ReactNode;
}) {
  return (
    <details
      className={`journey-block ${active ? 'is-current' : ''} ${done ? 'is-complete' : ''}`}
      open={active}
    >
      <summary>
        <span className="journey-number">{number}</span>
        <span className="journey-summary-label">
          <strong>{title}</strong>
          {preview && (
            <span
              className="journey-summary-preview"
              title={preview}
              aria-live="polite"
            >
              {preview}
            </span>
          )}
        </span>
        <span className="journey-status">
          {done ? '완료' : active ? '진행 중' : '대기'}
        </span>
      </summary>
      <div className="journey-block-body">{children}</div>
    </details>
  );
}
function readingPreview(reading: OracleResult | null) {
  if (!reading) return undefined;
  // A changed weather/event result supersedes its earlier die in this compact preview.
  const latest = new Map(reading.rolls.map((roll) => [roll.oracleId, roll]));
  return [...latest.values()]
    .map(
      (roll) =>
        `${roll.dice}=${roll.roll} · ${typeof roll.metadata?.ko === 'string' ? roll.metadata.ko : roll.text}`,
    )
    .join(' / ');
}
export function JourneyWorkbench({
  campaign,
  registry,
  loading,
  notify,
  onCity,
}: {
  campaign: Campaign;
  registry: OracleRegistry;
  loading: boolean;
  notify: (message: string) => void;
  onCity?: () => void;
}) {
  return (
    <JourneyDayWorkbench
      key={`${campaign.id}-${campaign.campaignDay}`}
      campaign={campaign}
      registry={registry}
      loading={loading}
      notify={notify}
      onCity={onCity}
    />
  );
}
function JourneyDayWorkbench({
  campaign,
  registry,
  loading,
  notify,
  onCity,
}: {
  campaign: Campaign;
  registry: OracleRegistry;
  loading: boolean;
  notify: (message: string) => void;
  onCity?: () => void;
}) {
  const uid = useId();
  const [state, setState] = useState<JourneyDay>(() => {
    try {
      return readJourneyDay(
        localStorage.getItem(journeyStorageKey(campaign.id)),
        campaign.campaignDay,
      );
    } catch {
      return emptyJourneyDay(campaign.campaignDay);
    }
  });
  const [error, setError] = useState('');
  const storageWarned = useRef(false);
  const region = state.region;
  const [presence, setPresence] = useState(String(state.camp?.modifier ?? 0));
  const navigationStat = state.navigationAbility;
  const [navigationValue, setNavigationValue] = useState(
    String(state.navigation?.modifier ?? 0),
  );
  const dawn = dawnForDay(campaign),
    ended = campaignHasEnded(campaign);
  const readyForEncounters = !!dawn && journeyReadyForEncounters(state);
  const needsNavigation = journeyRoadNeedsCheck(state.activity);
  const needsWilderness = state.navigation?.success === false;
  const latestMisery = campaign.miseries.findLast(
    (m) => m.inWorldDate === `Day ${campaign.campaignDay}`,
  );
  useEffect(() => {
    try {
      localStorage.setItem(
        journeyStorageKey(campaign.id),
        JSON.stringify(state),
      );
    } catch {
      if (!storageWarned.current) {
        storageWarned.current = true;
        notify(
          '이 기기에 오늘의 절차 진행을 저장하지 못했습니다. 달력 기록은 캠페인에 보존됩니다.',
        );
      }
    }
  }, [state, campaign.id, notify]);
  function run(action: () => void) {
    try {
      setError('');
      action();
    } catch (e) {
      setError(e instanceof Error ? e.message : '원문 자료를 확인하세요.');
    }
  }
  function reading(result: OracleResult | null, onReroll?: () => void) {
    return result ? (
      <ReferenceReadingBlock
        reading={journeyOracleReading(result, registry)}
        onReroll={onReroll}
      />
    ) : null;
  }
  function weather() {
    const result = rollJourneyTable('core.weather', registry);
    setState((s) => ({ ...s, weather: result }));
  }
  function navigation() {
    const result = rollRoadNavigation(Number(navigationValue));
    setState((s) => ({ ...s, navigation: result }));
  }
  function wilderness() {
    const result = rollJourneyTable('feretory.leaveRoad', registry);
    setState((s) => ({ ...s, wilderness: result }));
  }
  function doActivity() {
    const activity = rollJourneyActivity(state.mode, registry);
    const discovery =
      state.mode === 'road'
        ? (state.discovery ?? encounterSettlementChance().roll)
        : state.discovery;
    setState((s) => ({
      ...s,
      activity,
      discovery,
      navigation: null,
      wilderness: null,
      encountersResolved: false,
      campsite: null,
      camp: null,
      interruptionResolved: false,
      completed: false,
    }));
  }
  function camp(retry = false) {
    const campsite =
      state.campsite ?? rollJourneyTable('feretory.campsite', registry);
    const result = rollJourneyCamp(Number(presence), retry);
    setState((s) => ({
      ...s,
      campsite,
      camp: result,
      interruptionResolved: false,
      completed: false,
    }));
  }
  return (
    <div className="journey-workbench">
      <header className="journey-heading">
        <div>
          <p className="eyebrow">DAILY JOURNEY · SD</p>
          <h2>Day {campaign.campaignDay}</h2>
        </div>
        <label htmlFor={`${uid}-region`}>
          현재 지역
          <select
            id={`${uid}-region`}
            value={region}
            onChange={(e) =>
              setState((s) => ({ ...s, region: e.target.value as RegionId }))
            }
          >
            {regions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
      </header>
      <p className="journey-route">
        새벽 → 날씨 → 여행 / 채집 → 조우 해결 → 야영
      </p>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {ended && (
        <output className="terminal-misery">
          일곱 번째 Misery. 캠페인의 마지막 날입니다.
        </output>
      )}
      <JourneyBlock
        number="01"
        title="새벽 · 오늘의 저주 (Core)"
        active={!dawn}
        done={!!dawn}
        preview={
          dawn
            ? `${dawn.title.replace('Dawn · ', '')} · ${dawn.description}${latestMisery ? ` ${latestMisery.result}` : ''}`
            : undefined
        }
      >
        <p>새벽마다 종말 주사위. 1이면 아직 일어나지 않은 Misery를 정합니다.</p>
        {!dawn ? (
          <div className="procedure-controls">
            <label htmlFor={`${uid}-die`}>
              종말 주사위
              <select
                id={`${uid}-die`}
                value={campaign.apocalypseDie ?? ''}
                disabled={ended}
                onChange={(e) =>
                  run(() => {
                    const die = Number(
                      e.target.value,
                    ) as (typeof APOCALYPSE_DICE)[number];
                    editCampaign(campaign.id, (c) => {
                      c.apocalypseDie = die;
                    });
                  })
                }
              >
                <option value="" disabled>
                  선택
                </option>
                {APOCALYPSE_DICE.map((die) => (
                  <option key={die} value={die}>
                    d{die}
                  </option>
                ))}
              </select>
            </label>
            <Button
              disabled={ended || loading || !campaign.apocalypseDie}
              onClick={() =>
                run(() => {
                  editCampaign(campaign.id, (c) => {
                    recordCurrentDawn(c, registry);
                  });
                  notify(`Day ${campaign.campaignDay} · 새벽 판정 완료`);
                })
              }
            >
              오늘의 달력 굴리기
            </Button>
          </div>
        ) : (
          <output className="journey-dawn-result">
            {dawn.title.replace('Dawn · ', '')} · {dawn.description}
          </output>
        )}
        {latestMisery && (
          <article className="latest-misery">
            <strong>MISERY {latestMisery.roll}</strong>
            <p>{latestMisery.result}</p>
            <SourceDisclosure refs={latestMisery.sourceRefs} />
          </article>
        )}
        <p className="muted">
          오늘의 판정은 한 번만 저장됩니다. 다음 새벽은 하루 절차를 마친 뒤
          시작합니다.
        </p>
        <SourceDisclosure refs={[CALENDAR_SOURCE]} />
        <InlineReferenceTools
          title="달력 방식 · Core / SD"
          ids={['rule:sd.solo-variant']}
          description="이 달력은 Core 방식입니다. SD의 Misery 후 종말 주사위 단계 축소는 별도 선택 규칙입니다."
        />
      </JourneyBlock>
      <JourneyBlock
        number="02"
        title="날씨"
        active={!!dawn && !state.weather && !ended}
        done={!!state.weather}
        preview={readingPreview(state.weather)}
      >
        {!dawn ? (
          <p className="muted">새벽 판정을 먼저 마치세요.</p>
        ) : (
          <>
            {!state.weather && (
              <Button disabled={loading || ended} onClick={() => run(weather)}>
                날씨 d12 굴리기
              </Button>
            )}
            {reading(
              state.weather,
              !state.completed ? () => run(weather) : undefined,
            )}
          </>
        )}
      </JourneyBlock>
      <JourneyBlock
        number="03"
        title="여행 또는 채집"
        active={
          !!dawn && !!state.weather && !state.encountersResolved && !ended
        }
        done={state.encountersResolved}
        preview={readingPreview(state.activity)}
      >
        {!dawn || !state.weather ? (
          <p className="muted">날씨를 정한 뒤 오늘의 행동을 선택하세요.</p>
        ) : (
          <>
            {!state.activity && (
              <>
                <div className="procedure-controls">
                  <Button
                    variant={state.mode === 'road' ? 'default' : 'secondary'}
                    aria-pressed={state.mode === 'road'}
                    onClick={() => setState((s) => ({ ...s, mode: 'road' }))}
                  >
                    도로 여행
                  </Button>
                  <Button
                    variant={state.mode === 'forage' ? 'default' : 'secondary'}
                    aria-pressed={state.mode === 'forage'}
                    onClick={() => setState((s) => ({ ...s, mode: 'forage' }))}
                  >
                    하루 채집
                  </Button>
                </div>
                <Button
                  disabled={loading || ended}
                  onClick={() => run(doActivity)}
                >
                  {state.mode === 'road'
                    ? '도로 d8 + 도로 사건 d20'
                    : '채집 d6'}{' '}
                  굴리기
                </Button>
              </>
            )}
            {reading(
              state.activity,
              !state.encountersResolved ? () => run(doActivity) : undefined,
            )}
            {state.activity &&
              !state.encountersResolved &&
              (travelNeedsReplacement(campaign, state.activity) ||
                journeyRepeatedRoadEvent(state)) && (
                <p className="journey-warning">
                  이전에 사용한 일회성 도로 사건입니다. 종이 기록에서 새
                  사건으로 대체하세요.
                </p>
              )}
            {needsNavigation && (
              <div className="journey-condition">
                <h3>동물 흔적 / 망가진 도로</h3>
                <p>
                  1d20 + Presence 또는 남은 Omens, DR10. 실패하면 야생으로
                  벗어납니다. Omens는 소비하지 않습니다.
                </p>
                <div className="procedure-controls">
                  <label htmlFor={`${uid}-navigation-stat`}>
                    판정 능력
                    <select
                      id={`${uid}-navigation-stat`}
                      value={navigationStat}
                      onChange={(e) =>
                        setState((s) => ({
                          ...s,
                          navigationAbility: e.target.value as
                            | 'presence'
                            | 'omens',
                        }))
                      }
                      disabled={!!state.navigation}
                    >
                      <option value="presence">Presence</option>
                      <option value="omens">남은 Omens</option>
                    </select>
                  </label>
                  <label htmlFor={`${uid}-navigation-value`}>
                    {navigationStat === 'presence' ? 'Presence' : 'Omens'}
                    <Input
                      id={`${uid}-navigation-value`}
                      type="number"
                      step={1}
                      value={navigationValue}
                      disabled={!!state.navigation}
                      onChange={(e) => setNavigationValue(e.target.value)}
                    />
                  </label>
                  {!state.navigation && (
                    <Button onClick={() => run(navigation)}>
                      길 유지 판정
                    </Button>
                  )}
                </div>
                {state.navigation && (
                  <output>
                    1d20 {state.navigation.roll}{' '}
                    {state.navigation.modifier >= 0 ? '+' : ''}
                    {state.navigation.modifier} ={' '}
                    {state.navigation.roll + state.navigation.modifier} ·{' '}
                    {state.navigation.success
                      ? '성공 · 도로를 유지합니다.'
                      : '실패 · 야생으로 벗어났습니다.'}
                  </output>
                )}
                <SourceDisclosure refs={[JOURNEY_SOURCE]} />
              </div>
            )}
            {(needsWilderness || state.wilderness) && (
              <div className="journey-condition">
                <h3>길을 벗어나 야생으로</h3>
                {!state.wilderness && (
                  <Button disabled={loading} onClick={() => run(wilderness)}>
                    Leaving the Road d12
                  </Button>
                )}
                {reading(state.wilderness)}
                <p className="muted">
                  야생에서 생긴 조우를 해결한 뒤 도로로 돌아옵니다. 오늘은
                  여행일로 셉니다.
                </p>
                <InlineReferenceTools
                  title="야생 · 지역의 단서"
                  ids={[
                    'oracle:depths.travel.encounter',
                    `rule:regional-monsters:${region}`,
                    'procedure:workbench.npc',
                    'oracle:core.reaction',
                  ]}
                  region={region}
                />
              </div>
            )}
            {state.mode === 'road' && state.discovery != null && (
              <div className="journey-condition">
                <strong>
                  AitC · 오늘의 정착지 발견 d8 = {state.discovery}
                </strong>
                <p>
                  {state.discovery === 1
                    ? '정착지를 발견했습니다. 도시 크롤에서 규모와 거리를 정하세요.'
                    : '오늘은 정착지를 발견하지 못했습니다.'}
                </p>
                {state.discovery === 1 && onCity && (
                  <Button variant="secondary" onClick={onCity}>
                    City Crawl 열기
                  </Button>
                )}
                <SourceDisclosure source="Alöne in the Crowd · PDF 5 / p. 3 · 하루 여행마다 1-in-8 정착지 발견" />
              </div>
            )}
            {state.mode === 'forage' &&
              state.activity?.rolls.some(
                (r) => r.oracleId === 'feretory.village',
              ) &&
              onCity && (
                <Button variant="secondary" onClick={onCity}>
                  발견한 마을 · City Crawl
                </Button>
              )}
            <details className="journey-alternatives">
              <summary>길을 직접 벗어나기 / 추가 참고</summary>
              <InlineReferenceTools
                title="도로 밖 · 필요한 경우"
                ids={[
                  'oracle:feretory.leaveRoad',
                  'rule:feretory.eat-prey-kill',
                  'oracle:feretory.huntingMishaps',
                  'oracle:feretory.bellyOfBeast',
                ]}
                region={region}
                initiallyOpen
              />
              <p className="muted">
                채집 5–6은 마을을 함께 굴립니다. 도로 사건 7–8은 다시 굴리고,
                5–6은 날씨를 바꿉니다. 일회성 사건은 다음 사용부터 직접 만든
                사건으로 대체합니다.
              </p>
            </details>
          </>
        )}
      </JourneyBlock>
      <JourneyBlock
        number="04"
        title="조우 해결"
        active={readyForEncounters && !state.encountersResolved && !ended}
        done={state.encountersResolved}
        preview={
          state.encountersResolved
            ? '오늘의 조우 해결 완료 · 야영으로 이어집니다.'
            : undefined
        }
      >
        {!readyForEncounters ? (
          <p className="muted">오늘의 행동과 조건부 판정을 먼저 마치세요.</p>
        ) : (
          <>
            <p>
              도로·채집·야생 결과에서 만난 대상이나 위험을 해결하세요. 조우가
              없다면 바로 야영으로 갑니다.
            </p>
            <InlineReferenceTools
              title="조우에 필요한 것"
              ids={[
                `rule:regional-monsters:${region}`,
                'procedure:workbench.npc',
                'oracle:core.reaction',
                'rule:core.reaction-morale',
                'oracle:depths.travel.encounter',
              ]}
              region={region}
              description="DEP 지역 조우 표는 지역 여행 규칙을 선택했을 때 사용합니다."
              initiallyOpen
            />
            {!state.encountersResolved && (
              <Button onClick={() => setState(consumeJourneyRoadEvents)}>
                조우 해결 / 조우 없음 → 야영
              </Button>
            )}
            <SourceDisclosure refs={[JOURNEY_SOURCE]}>
              <p>
                SD의 일일 흐름은 앞선 결과의 조우를 해결하라고 합니다. FER p.7의
                Leaving the Road는 야생에 들어간 경우의 표입니다.
              </p>
            </SourceDisclosure>
          </>
        )}
      </JourneyBlock>
      <JourneyBlock
        number="05"
        title="야영 · 밤의 사건과 휴식"
        active={state.encountersResolved && !state.completed && !ended}
        done={state.completed}
        preview={
          state.camp
            ? `${state.camp.outcome === 'strong' ? 'STRONG HIT' : state.camp.outcome === 'weak' ? 'WEAK HIT' : 'MISS'} · ${state.camp.outcome === 'fail' ? '회복 없음 · 방해 사건 해결 필요' : `회복 ${state.camp.recovery} HP`}${state.campsite ? ` · 야영 d12=${state.campsite.rolls[0].roll}` : ''}`
            : undefined
        }
      >
        {!state.encountersResolved ? (
          <p className="muted">조우를 해결한 뒤 야영합니다.</p>
        ) : (
          <>
            <label className="journey-presence" htmlFor={`${uid}-presence`}>
              Presence
              <Input
                id={`${uid}-presence`}
                type="number"
                step={1}
                value={presence}
                onChange={(e) => setPresence(e.target.value)}
                disabled={!!state.camp && state.camp.outcome !== 'fail'}
              />
            </label>
            {!state.camp && (
              <Button
                disabled={loading || ended}
                onClick={() => run(() => camp())}
              >
                야영 사건 d12 + Camping 2d20
              </Button>
            )}
            {reading(state.campsite)}
            {state.camp && (
              <ReferenceReadingBlock reading={journeyCampReading(state.camp)} />
            )}
            {state.camp?.outcome === 'fail' && (
              <div className="journey-condition">
                <InlineReferenceTools
                  title="휴식을 방해한 사건"
                  ids={[
                    'oracle:depths.danger',
                    'procedure:reclvse.action-theme',
                    'oracle:core.reaction',
                  ]}
                  region={region}
                />
                <label className="journey-acknowledge">
                  <input
                    type="checkbox"
                    checked={state.interruptionResolved}
                    onChange={(e) =>
                      setState((s) => ({
                        ...s,
                        interruptionResolved: e.target.checked,
                      }))
                    }
                  />
                  잠을 방해한 사건을 해결했습니다.
                </label>
                <Button
                  disabled={!state.interruptionResolved}
                  onClick={() => run(() => camp(true))}
                >
                  다시 쉬기 · Strong / Weak 50:50
                </Button>
              </div>
            )}
            {state.camp?.outcome === 'weak' && (
              <p className="journey-warning">
                밤이 불편했던 이유와 방해를 해결한 뒤 하루를 마치세요.
              </p>
            )}
            <p className="muted">
              회복·식량·Omens·Powers는 결과를 보고 캐릭터에 반영하세요. 자원은
              자동으로 바뀌지 않습니다.
            </p>
            <InlineReferenceTools
              title="휴식 관련 규칙"
              ids={['rule:core.rest', 'oracle:depths.danger']}
              description="DEP의 시간 소모/소음 위험과 SD의 Camping Move는 각 적용 조건을 따릅니다."
            />
            <SourceDisclosure refs={[CAMPING_SOURCE]}>
              <p>
                SD Camping은 각각의 d20에 Presence를 더해 DR12와 비교합니다. 둘
                다 성공은 Strong, 하나는 Weak, 둘 다 실패는 Miss입니다. Miss의
                사건 해결 후 다음 휴식은 Strong/Weak 50:50입니다.
              </p>
            </SourceDisclosure>
            {!state.completed && (
              <Button
                disabled={!journeyReadyToFinish(state)}
                onClick={() => setState((s) => ({ ...s, completed: true }))}
              >
                야영 결과 해결 · 오늘 마치기
              </Button>
            )}
          </>
        )}
      </JourneyBlock>
      {state.completed && (
        <div className="journey-finish">
          <strong>Day {campaign.campaignDay} 완료</strong>
          <p>
            {state.mode === 'forage'
              ? '채집한 날은 여행일을 지우지 않습니다.'
              : state.activity?.rolls.some(
                    (r) => r.oracleId === 'feretory.roadEvent' && r.roll === 4,
                  )
                ? '도로 사건 4: 오늘은 전진하지 못했습니다.'
                : '종이 기록에서 여행일 1일을 지우세요. 소요일을 모두 지웠다면 다음 날 중 목적지에 도착합니다.'}
          </p>
          <Button
            disabled={ended || loading}
            onClick={() =>
              run(() => {
                editCampaign(campaign.id, (c) => {
                  recordNextJourneyDawn(c, campaign.campaignDay, registry);
                });
                notify('다음 날의 달력 판정을 마쳤습니다.');
              })
            }
          >
            다음 새벽 · 달력 굴리기
          </Button>
        </div>
      )}
      <SourceDisclosure refs={[JOURNEY_SOURCE]} />
    </div>
  );
}
