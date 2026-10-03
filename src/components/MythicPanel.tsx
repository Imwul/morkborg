import { DockedToolContent } from './DockedToolContent';
import { MythicListTables, type ListSelection } from './MythicListTables';
import { mythicListsStore } from '../storage/notebookTools';
import {
  mythicFocusList,
  preparedMythicFocusList,
  rollMythicList,
  type MythicListKind,
} from '../domain/mythicLists';
import { SourceDisclosure } from './SourceDisclosure';
import { ReferenceNextSteps } from './ReferenceNextSteps';
import { Translation } from './Translation';
import { useEffect, useRef, useState, type RefObject } from 'react';
import { Dices, Minus, Plus } from 'lucide-react';
import { Dialog, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  FATE_ODDS,
  FATE_ANSWERS,
  rememberFate,
  type FateReading,
  type MythicState,
} from '../domain/mythic';
import {
  fateCell,
  checkModifier,
  resolveFate,
  resolveScene,
  rollFate,
  fateSource,
  fateRollLabel,
} from '../generators/mythic';
import { rollProcedure } from '../generators/oracleRoller';
import { loadFateChart, useFateChart } from '../storage/fateChartStore';
import { useOracleRegistry } from '../storage/oracleStore';
import { PrivateDataTools } from './PrivateDataTools';

interface Props {
  open: boolean;
  listRequest?: number;
  fateRequest?: number;
  onOpenChange: (open: boolean) => void;
  state: MythicState;
  onStateChange?: (state: MythicState) => void;
  launcherRef: RefObject<HTMLButtonElement | null>;
}
export function MythicPanel({
  open,
  listRequest = 0,
  fateRequest = 0,
  onOpenChange,
  state: initialState,
  onStateChange,
  launcherRef,
}: Props) {
  const [state, setState] = useState<MythicState>(() => ({
    ...initialState,
    history: [],
  }));
  const lists = mythicListsStore.use();
  const [listView, setListView] = useState({
    request: listRequest,
    open: listRequest > 0,
  });
  const listsOpen = listView.request !== listRequest || listView.open;
  const setListsOpen = (open: boolean) =>
    setListView({ request: listRequest, open });
  const [listResult, setListResult] = useState<ListSelection | null>(null);
  function drawList(kind: MythicListKind) {
    setListResult({
      kind,
      draw: rollMythicList(lists.value[kind] ?? Array(25).fill('')),
    });
    setListsOpen(true);
  }
  const [chaosDraft, setChaosDraft] = useState<{
    basis: number;
    text: string;
  } | null>(null);
  const chaosText =
    chaosDraft?.basis === state.chaosFactor
      ? chaosDraft.text
      : String(state.chaosFactor);
  const [manual, setManual] = useState(false);
  const [diceA, setDiceA] = useState('');
  const [diceB, setDiceB] = useState('');
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lastFateRequest, setLastFateRequest] = useState(0);
  // A named Fate action must open Yes/No even after the user last viewed lists.
  // Keep history, odds, CF and the current reference intact.
  if (lastFateRequest !== fateRequest) {
    setLastFateRequest(fateRequest);
    setState((current) => ({ ...current, tab: 'fate' }));
    setListView({ request: listRequest, open: false });
    setSelectedId(null);
  }
  const oddsRef = useRef<HTMLSelectElement>(null);
  const tabRef = useRef<HTMLButtonElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const chartState = useFateChart();
  const { registry } = useOracleRegistry();
  const history = state.history.filter((r) => r.kind === state.tab);
  const reading = history.find((r) => r.id === selectedId) ?? history[0];
  const isCheck = state.tab === 'fate' && state.method === 'check';
  const cell =
    state.method === 'chart' && chartState.chart
      ? fateCell(chartState.chart, state.odds, state.chaosFactor)
      : null;
  useEffect(() => {
    if (open) void loadFateChart();
  }, [open]);
  function change(action: (next: MythicState) => void) {
    try {
      const next = structuredClone(state);
      action(next);
      setState(next);
      onStateChange?.(next);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장할 수 없습니다.');
    }
  }
  function performRoll() {
    try {
      // A quick roll has no typed prompt. Preserve optional drafts and old history.
      const rollState = settingsOpen
        ? state
        : {
            ...state,
            question: '',
            scene: state.sceneMode === 'prepared' ? state.scene : '',
          };
      const result = manual
        ? state.tab === 'scene'
          ? resolveScene(rollState, Number(diceA))
          : resolveFate(
              rollState,
              chartState.chart,
              isCheck ? [Number(diceA), Number(diceB)] : [Number(diceA)],
            )
        : rollFate(rollState, chartState.chart);
      change((next) => rememberFate(next, result));
      setSelectedId(result.id);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : '판정할 수 없습니다.');
    }
  }
  function eventClues(result: FateReading, meaningOnly = false) {
    try {
      const prepared = result.sceneMode === 'prepared';
      const focusId = prepared
        ? 'mythic2.prepared-adventure-event-focus-table'
        : 'mythic2.random-event-focus-table';
      const focus = meaningOnly
        ? result.event
        : rollProcedure(
            {
              id: 'mythic2.random-event-clues',
              title: prepared ? 'Prepared Adventure Event' : 'Random Event',
              oracleIds: [focusId],
            },
            registry,
          );
      if (!focus) throw new Error('먼저 Event Focus를 굴려 주세요.');
      const needMeaning = meaningOnly || !prepared || focus.rolls[0].roll > 20;
      const event = {
        ...focus,
        rolls: needMeaning
          ? [
              ...focus.rolls.slice(0, 1),
              ...rollProcedure(
                {
                  id: 'mythic2.event-meaning',
                  title: 'Actions',
                  oracleIds: [
                    'mythic2.meaning.action-1',
                    'mythic2.meaning.action-2',
                  ],
                },
                registry,
              ).rolls,
            ]
          : focus.rolls,
      };
      change((next) => {
        const item = next.history.find((r) => r.id === result.id);
        if (!item) throw new Error('이 판정은 최근 기록에 없습니다.');
        item.event = event;
      });
    } catch (e) {
      setError(
        e instanceof Error ? e.message : '사건 표를 불러오지 못했습니다.',
      );
    }
  }
  const rollBlocked =
    state.tab === 'fate' && state.method === 'chart' && !chartState.chart;
  const inputValid = /^[1-9]$/.test(chaosText);
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      modal={false}
      disablePointerDismissal
    >
      <DockedToolContent
        label="Mythic"
        id="mythic-panel"
        onClick={(event) => {
          if (
            (event.target as HTMLElement).closest('[data-relationship-target]')
          )
            onOpenChange(false);
        }}
        className="fate-panel"
        initialFocus={listsOpen || state.tab === 'scene' ? tabRef : oddsRef}
        finalFocus={launcherRef}
      >
        <div className="fate-panel-heading">
          <span className="eyebrow">MYTHIC GME · SECOND EDITION</span>
          <DialogTitle>Ask Fate.</DialogTitle>
          <DialogDescription>가능성을 정하고 바로 굴리세요.</DialogDescription>
        </div>
        <section className="fate-chaos" aria-label="Chaos Factor">
          <div>
            <label htmlFor="fate-chaos">CHAOS FACTOR</label>
          </div>
          <div className="fate-chaos-stepper">
            <Button
              className="btn"
              aria-label="Chaos 줄이기"
              disabled={state.chaosFactor <= 1}
              onClick={() =>
                change((s) => {
                  s.chaosFactor = Math.max(1, s.chaosFactor - 1);
                })
              }
            >
              <Minus size={18} />
            </Button>
            <Input
              id="fate-chaos"
              aria-label="Chaos Factor"
              inputMode="numeric"
              value={chaosText}
              aria-invalid={!inputValid}
              onFocus={(e) => e.target.select()}
              onBlur={() => {
                setChaosDraft(null);
              }}
              onChange={(e) => {
                const value = e.target.value;
                setChaosDraft({ basis: state.chaosFactor, text: value });
                if (/^[1-9]$/.test(value))
                  change((s) => {
                    s.chaosFactor = Number(value);
                  });
              }}
            />
            <Button
              className="btn"
              aria-label="Chaos 늘리기"
              disabled={state.chaosFactor >= 9}
              onClick={() =>
                change((s) => {
                  s.chaosFactor = Math.min(9, s.chaosFactor + 1);
                })
              }
            >
              <Plus size={18} />
            </Button>
          </div>
          {!inputValid && <p role="alert">1–9 사이의 정수를 입력하세요.</p>}
        </section>
        <fieldset className="fate-tabs" aria-label="Mythic 판정 종류">
          <Button
            ref={tabRef}
            className={
              'btn ' + (!listsOpen && state.tab === 'fate' ? 'primary' : '')
            }
            aria-pressed={!listsOpen && state.tab === 'fate'}
            onClick={() => {
              change((s) => {
                s.tab = 'fate';
              });
              setListsOpen(false);
              setSelectedId(null);
            }}
          >
            Yes / No
          </Button>
          <Button
            className={
              'btn ' + (!listsOpen && state.tab === 'scene' ? 'primary' : '')
            }
            aria-pressed={!listsOpen && state.tab === 'scene'}
            onClick={() => {
              change((s) => {
                s.tab = 'scene';
              });
              setListsOpen(false);
              setSelectedId(null);
            }}
          >
            장면 판정
          </Button>
          <Button
            className={'btn ' + (listsOpen ? 'primary' : '')}
            aria-pressed={listsOpen}
            onClick={() => setListsOpen(true)}
          >
            인물 · 스레드
          </Button>
        </fieldset>
        {state.tab === 'scene' && (
          <label className="fate-scene-mode">
            Scene mode · 장면 방식
            <select
              value={state.sceneMode ?? 'standard'}
              onChange={(e) =>
                change((s) => {
                  s.sceneMode = e.target.value as 'standard' | 'prepared';
                })
              }
            >
              <option value="standard">Standard · 표준</option>
              <option value="prepared">Prepared Adventure · 준비된 모험</option>
            </select>
            {state.sceneMode === 'prepared' && (
              <small>
                Expected Scene을 유지합니다. Chaos Factor 이내면 사건만
                추가합니다.
              </small>
            )}
          </label>
        )}
        {listsOpen ? (
          <MythicListTables
            prepared={state.sceneMode === 'prepared'}
            result={listResult}
            onRoll={drawList}
            onResult={setListResult}
          />
        ) : (
          <>
            <form
              className="fate-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (inputValid) performRoll();
              }}
            >
              <label className="fate-manual">
                <input
                  type="checkbox"
                  checked={manual}
                  onChange={(e) => setManual(e.target.checked)}
                />{' '}
                직접 굴린 주사위 입력
              </label>
              {manual && (
                <div className="fate-manual-dice">
                  <label htmlFor="fate-die-1">
                    {isCheck
                      ? '첫 번째 d10'
                      : state.tab === 'scene'
                        ? 'd10'
                        : 'd100'}
                    <Input
                      id="fate-die-1"
                      aria-label="첫 번째 주사위"
                      type="number"
                      min={1}
                      max={state.tab === 'fate' && !isCheck ? 100 : 10}
                      step={1}
                      required
                      value={diceA}
                      onChange={(e) => setDiceA(e.target.value)}
                    />
                  </label>
                  {isCheck && (
                    <label htmlFor="fate-die-2">
                      두 번째 d10
                      <Input
                        id="fate-die-2"
                        aria-label="두 번째 주사위"
                        type="number"
                        min={1}
                        max={10}
                        step={1}
                        required
                        value={diceB}
                        onChange={(e) => setDiceB(e.target.value)}
                      />
                    </label>
                  )}
                  <small>
                    {state.tab === 'fate' && !isCheck
                      ? '00은 100으로 입력하세요.'
                      : 'd10의 0 표시는 10으로 입력하세요.'}
                  </small>
                </div>
              )}
              <div className="fate-quick-roll">
                {state.tab === 'fate' && (
                  <label>
                    YES일 가능성 · ODDS
                    <select
                      ref={oddsRef}
                      aria-label="Fate Odds"
                      value={state.odds}
                      onChange={(e) =>
                        change((s) => {
                          s.odds = e.target.value as MythicState['odds'];
                        })
                      }
                    >
                      {FATE_ODDS.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <Button
                  type="submit"
                  className="btn primary fate-roll"
                  disabled={rollBlocked || !inputValid}
                >
                  <Dices size={18} />
                  {manual
                    ? '입력한 값으로 판정'
                    : state.tab === 'fate'
                      ? 'ROLL FATE'
                      : 'ROLL SCENE'}
                </Button>
              </div>
              {rollBlocked && (
                <div className="fate-error" aria-live="polite">
                  <p>
                    {chartState.loading
                      ? '원문 Fate Chart를 불러오는 중…'
                      : chartState.error}
                  </p>
                  {!chartState.loading && <PrivateDataTools />}
                  <Button
                    type="button"
                    className="btn small"
                    onClick={() => void loadFateChart()}
                  >
                    자료 다시 불러오기
                  </Button>
                </div>
              )}
              <details
                className="fate-settings"
                open={settingsOpen}
                onToggle={(event) => setSettingsOpen(event.currentTarget.open)}
              >
                <summary>
                  {state.tab === 'fate'
                    ? isCheck
                      ? 'Fate Check · 2d10'
                      : 'Fate Chart · d100'
                    : 'Scene Check · d10'}{' '}
                  · 설정 / 메모
                </summary>
                <p className="fate-hint">
                  장면이 끝날 때 통제함 −1 / 통제하지 못함 +1 · CF 1–9
                </p>
                {state.tab === 'fate' && (
                  <label>
                    판정 방식
                    <select
                      aria-label="Fate 판정 방식"
                      value={state.method}
                      onChange={(e) =>
                        change((s) => {
                          s.method = e.target.value as MythicState['method'];
                        })
                      }
                    >
                      <option value="chart">Fate Chart · d100</option>
                      <option value="check">Fate Check · 2d10</option>
                    </select>
                  </label>
                )}
                {state.tab === 'fate' && state.method === 'chart' && cell && (
                  <div className="fate-thresholds" aria-label="Fate Chart 범위">
                    <span>
                      <strong>{cell.yes}%</strong> YES 확률 · CF{' '}
                      {state.chaosFactor}
                    </span>
                    <span>
                      Exceptional Yes{' '}
                      {cell.exceptionalYes === null
                        ? '없음'
                        : '1–' + cell.exceptionalYes}
                      <br />
                      Exceptional No{' '}
                      {cell.exceptionalNo === null
                        ? '없음'
                        : cell.exceptionalNo + '–100'}
                    </span>
                  </div>
                )}
                {isCheck && (
                  <p className="fate-hint">
                    2d10 보정{' '}
                    {checkModifier(state.odds, state.chaosFactor) >= 0
                      ? '+'
                      : ''}
                    {checkModifier(state.odds, state.chaosFactor)} · 합계 11
                    이상 Yes
                    <br />
                    예외는 보정 후 2–4 / 18–20 안에서만 적용합니다.
                  </p>
                )}
                {state.tab === 'scene' && (
                  <p className="fate-hint">
                    d10이 Chaos보다 높으면 Expected. 이하이면 홀수는 Altered,
                    짝수는 Interrupt입니다.
                  </p>
                )}
                <label htmlFor="fate-question">
                  {state.tab === 'fate' ? '질문' : '예상하는 다음 장면'}{' '}
                  <span>선택 입력</span>
                </label>
                <Textarea
                  id="fate-question"
                  value={state.tab === 'fate' ? state.question : state.scene}
                  placeholder={
                    state.tab === 'fate'
                      ? '문 너머에 누군가 있는가?'
                      : '다음 장면은 어떻게 시작할까요?'
                  }
                  onChange={(e) =>
                    change((s) => {
                      if (s.tab === 'fate') s.question = e.target.value;
                      else s.scene = e.target.value;
                    })
                  }
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                      e.preventDefault();
                      if (!rollBlocked && inputValid) performRoll();
                    }
                  }}
                />
              </details>
            </form>
            {error && (
              <p className="fate-error" role="alert">
                {error}
              </p>
            )}
            {reading && (
              <section
                className="fate-result"
                aria-label="Mythic 판정 결과"
                aria-live="polite"
              >
                <p className="fate-result-question">
                  {reading.question ||
                    (reading.kind === 'fate' ? 'Fate Question' : 'Scene Check')}
                </p>
                <h3 className={'answer-' + reading.answer}>
                  {FATE_ANSWERS[reading.answer]}
                </h3>
                <p className="fate-roll-detail">
                  {fateRollLabel(reading)} · CF {reading.chaosFactor}
                  {reading.kind === 'fate'
                    ? ' · ' +
                      FATE_ODDS.find((o) => o.id === reading.odds)!.label
                    : ''}{' '}
                  · {reading.input === 'manual' ? '직접 입력' : '자동 굴림'}
                </p>
                {reading.randomEvent && (
                  <div className="fate-event">
                    <strong>Random Event</strong>
                    <p>
                      {reading.kind === 'scene'
                        ? reading.sceneMode === 'prepared'
                          ? 'Expected Scene을 유지하고 사건을 추가하세요.'
                          : 'Interrupt Scene의 사건을 정하세요.'
                        : 'Yes/No 결과와 함께 무작위 사건이 발생합니다.'}
                    </p>
                    <Button
                      className="btn small play-roll-action"
                      onClick={() => eventClues(reading)}
                    >
                      {reading.event
                        ? '사건 단서 다시 굴리기'
                        : '사건 단서 굴리기'}
                    </Button>
                    {reading.sceneMode === 'prepared' &&
                      reading.event?.rolls.length === 1 && (
                        <Button
                          className="btn small"
                          onClick={() => eventClues(reading, true)}
                        >
                          Meaning 단서 추가 · 필요할 때만
                        </Button>
                      )}
                    {reading.event?.rolls.map((r, i) => (
                      <div key={i}>
                        <small>
                          {r.title} · {r.roll}
                        </small>
                        <p>{r.text}</p>
                        <Translation
                          text={r.text}
                          translation={
                            typeof r.metadata?.ko === 'string'
                              ? r.metadata.ko
                              : undefined
                          }
                        />
                        {(r.oracleId === 'mythic2.random-event-focus-table' ||
                          r.oracleId ===
                            'mythic2.prepared-adventure-event-focus-table') &&
                          (reading.sceneMode === 'prepared'
                            ? preparedMythicFocusList(r.roll)
                            : mythicFocusList(r.roll)) && (
                            <Button
                              className="btn small play-roll-action"
                              onClick={() =>
                                drawList(
                                  (reading.sceneMode === 'prepared'
                                    ? preparedMythicFocusList(r.roll)
                                    : mythicFocusList(r.roll))!,
                                )
                              }
                            >
                              {r.oracleId ===
                                'mythic2.prepared-adventure-event-focus-table' &&
                              r.roll <= 20
                                ? '모험 요소'
                                : (r.oracleId ===
                                    'mythic2.prepared-adventure-event-focus-table'
                                      ? preparedMythicFocusList(r.roll)
                                      : mythicFocusList(r.roll)) ===
                                    'characters'
                                  ? '인물'
                                  : '스레드'}{' '}
                              목록에서 대상 뽑기
                            </Button>
                          )}
                        <ReferenceNextSteps
                          metadata={r.metadata}
                          tableId={r.oracleId}
                        />
                        <SourceDisclosure source={r.source} />
                      </div>
                    ))}
                  </div>
                )}
                <ReferenceNextSteps
                  ids={
                    reading.answer === 'altered'
                      ? ['rule:mythic.altered-scene']
                      : []
                  }
                />
                <SourceDisclosure label="원문 출처 / 판정 규칙">
                  <p>{fateSource(reading)}</p>
                  <p>
                    Chaos: PDF 22,115쪽. Random Event: PDF 187쪽. Fate Chart의
                    100은 doubles 사건이 아닙니다. 판정 자체로 Chaos를 자동
                    변경하지 않습니다.
                  </p>
                </SourceDisclosure>
              </section>
            )}
            <details className="fate-history" aria-label="최근 Mythic 판정">
              <summary>
                최근 판정 {history.length}개 <small>최대 20개 · 현재 탭</small>
              </summary>
              {!history.length && <p>주사위를 굴리면 여기에 기록됩니다.</p>}
              {history.map((r) => (
                <button
                  key={r.id}
                  className={reading?.id === r.id ? 'selected' : ''}
                  onClick={() => setSelectedId(r.id)}
                >
                  <span>
                    {r.question ||
                      (r.kind === 'fate' ? 'Fate Question' : 'Scene Check')}
                  </span>
                  <strong>
                    {FATE_ANSWERS[r.answer]}
                    {r.randomEvent ? ' · Event' : ''}
                  </strong>
                  <small>
                    CF {r.chaosFactor} · {fateRollLabel(r)}
                  </small>
                </button>
              ))}
            </details>
          </>
        )}
      </DockedToolContent>
    </Dialog>
  );
}
