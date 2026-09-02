import { useEffect, useRef, useState, type RefObject } from 'react';
import { Dices, Minus, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { Campaign } from '../domain/types';
import {
  FATE_ODDS,
  FATE_ANSWERS,
  rememberFate,
  type FateReading,
  type MythicState,
} from '../domain/mythic';
import { editMythic } from '../domain/mythicOperations';
import {
  appendOracleNotes,
  notesDestinations,
  notesTargetKey,
  contextNotesTarget,
  type NotesTarget,
} from '../domain/oracleNotes';
import {
  fateCell,
  checkModifier,
  resolveFate,
  resolveScene,
  rollFate,
  fateSource,
  fateRollLabel,
  fateNotesResult,
} from '../generators/mythic';
import { rollProcedure } from '../generators/oracleRoller';
import { loadFateChart, useFateChart } from '../storage/fateChartStore';
import { useOracleRegistry } from '../storage/oracleStore';
import { transact } from '../storage/saveStore';
import { PrivateDataTools } from './PrivateDataTools';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign?: Campaign;
  state: MythicState;
  context?: NotesTarget | null;
  saveError: string | null;
  notify: (message: string) => void;
  launcherRef: RefObject<HTMLButtonElement | null>;
}
export function MythicPanel({
  open,
  onOpenChange,
  campaign,
  state,
  context,
  saveError,
  notify,
  launcherRef,
}: Props) {
  const [wide, setWide] = useState(
    () => window.matchMedia('(min-width: 1600px)').matches,
  );
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
  const [targetChoice, setTargetChoice] = useState({ context: '', value: '' });
  const questionRef = useRef<HTMLTextAreaElement>(null);
  const chartState = useFateChart();
  const { registry } = useOracleRegistry();
  const currentContext = campaign
    ? (context ?? contextNotesTarget(campaign))
    : null;
  const contextKey = currentContext ? notesTargetKey(currentContext) : '';
  const targetKey =
    targetChoice.context === contextKey ? targetChoice.value : '';
  const destinations = campaign ? notesDestinations(campaign) : [];
  const destination =
    destinations.find(
      (d) => notesTargetKey(d.target) === (targetKey || contextKey),
    ) ?? destinations[0];
  const history = state.history.filter((r) => r.kind === state.tab);
  const reading = history.find((r) => r.id === selectedId) ?? history[0];
  const isCheck = state.tab === 'fate' && state.method === 'check';
  const cell =
    state.method === 'chart' && chartState.chart
      ? fateCell(chartState.chart, state.odds, state.chaosFactor)
      : null;
  useEffect(() => {
    const media = window.matchMedia('(min-width: 1600px)');
    const change = () => setWide(media.matches);
    media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, []);
  useEffect(() => {
    if (open) void loadFateChart();
  }, [open]);
  function change(action: (next: MythicState) => void) {
    try {
      transact((save) => editMythic(save, campaign?.id ?? null, action));
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장할 수 없습니다.');
    }
  }
  function performRoll() {
    try {
      const result = manual
        ? state.tab === 'scene'
          ? resolveScene(state, Number(diceA))
          : resolveFate(
              state,
              chartState.chart,
              isCheck ? [Number(diceA), Number(diceB)] : [Number(diceA)],
            )
        : rollFate(state, chartState.chart);
      transact((save) =>
        editMythic(save, campaign?.id ?? null, (next) =>
          rememberFate(next, result),
        ),
      );
      setSelectedId(result.id);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : '판정할 수 없습니다.');
    }
  }
  function eventClues(result: FateReading) {
    try {
      const event = rollProcedure(
        {
          id: 'mythic2.random-event-clues',
          title: 'Random Event · Focus + Actions',
          oracleIds: [
            'mythic2.random-event-focus-table',
            'mythic2.meaning.action-1',
            'mythic2.meaning.action-2',
          ],
        },
        registry,
      );
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
      modal={!wide}
      disablePointerDismissal={wide}
    >
      <DialogContent
        id="mythic-panel"
        className="fate-panel translate-x-0 translate-y-0"
        showOverlay={!wide}
        initialFocus={questionRef}
        finalFocus={launcherRef}
      >
        <div className="fate-panel-heading">
          <span className="eyebrow">MYTHIC GME · SECOND EDITION</span>
          <DialogTitle>Ask Fate.</DialogTitle>
          <DialogDescription>
            {campaign ? campaign.title : '캠페인 밖 · 별도 저장'} ·{' '}
            {saveError ? '저장 확인 필요' : '자동 저장'}
          </DialogDescription>
        </div>
        {saveError && (
          <p role="alert" className="fate-error">
            {saveError}
          </p>
        )}
        <section className="fate-chaos" aria-label="Chaos Factor">
          <div>
            <label htmlFor="fate-chaos">CHAOS FACTOR</label>
            <small>장면이 끝날 때 통제 여부에 따라 조정하세요.</small>
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
          <p>
            {inputValid
              ? '통제함 −1 / 통제하지 못함 +1 · 범위 1–9'
              : '1–9 사이의 정수를 입력하세요.'}
          </p>
        </section>
        <fieldset className="fate-tabs" aria-label="Mythic 판정 종류">
          <Button
            className={'btn ' + (state.tab === 'fate' ? 'primary' : '')}
            aria-pressed={state.tab === 'fate'}
            onClick={() => {
              change((s) => {
                s.tab = 'fate';
              });
              setSelectedId(null);
            }}
          >
            Yes / No
          </Button>
          <Button
            className={'btn ' + (state.tab === 'scene' ? 'primary' : '')}
            aria-pressed={state.tab === 'scene'}
            onClick={() => {
              change((s) => {
                s.tab = 'scene';
              });
              setSelectedId(null);
            }}
          >
            장면 판정
          </Button>
        </fieldset>
        <form
          className="fate-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (inputValid) performRoll();
          }}
        >
          <label htmlFor="fate-question">
            {state.tab === 'fate' ? '질문' : '예상하는 다음 장면'}{' '}
            <span>선택 입력</span>
          </label>
          <Textarea
            id="fate-question"
            ref={questionRef}
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
          {state.tab === 'fate' && (
            <>
              <div className="fate-options">
                <label>
                  YES일 가능성 · ODDS
                  <select
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
              </div>
              {state.method === 'chart' && cell && (
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
                  {checkModifier(state.odds, state.chaosFactor) >= 0 ? '+' : ''}
                  {checkModifier(state.odds, state.chaosFactor)} · 합계 11 이상
                  Yes
                  <br />
                  예외는 보정 후 2–4 / 18–20 안에서만 적용합니다.
                </p>
              )}
            </>
          )}
          {state.tab === 'scene' && (
            <p className="fate-hint">
              d10이 Chaos보다 높으면 Expected. 이하이면 홀수는 Altered, 짝수는
              Interrupt입니다.
            </p>
          )}
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
                ? ' · ' + FATE_ODDS.find((o) => o.id === reading.odds)!.label
                : ''}{' '}
              · {reading.input === 'manual' ? '직접 입력' : '자동 굴림'}
            </p>
            {reading.randomEvent && (
              <div className="fate-event">
                <strong>Random Event</strong>
                <p>
                  {reading.kind === 'scene'
                    ? 'Interrupt Scene의 사건을 정하세요.'
                    : 'Yes/No 결과와 함께 무작위 사건이 발생합니다.'}
                </p>
                <Button
                  className="btn small"
                  onClick={() => eventClues(reading)}
                >
                  {reading.event ? '사건 단서 다시 굴리기' : '사건 단서 굴리기'}
                </Button>
                {reading.event?.rolls.map((r, i) => (
                  <div key={i}>
                    <small>
                      {r.title} · {r.roll}
                    </small>
                    <p>{r.text}</p>
                    <span className="source-citation">{r.source}</span>
                  </div>
                ))}
              </div>
            )}
            <details className="fate-source">
              <summary>원문 출처 / 판정 규칙</summary>
              <p>{fateSource(reading)}</p>
              <p>
                Chaos: PDF 22,115쪽. Random Event: PDF 187쪽. Fate Chart의 100은
                doubles 사건이 아닙니다. 판정 자체로 Chaos를 자동 변경하지
                않습니다.
              </p>
            </details>
            {campaign && destination ? (
              <div className="fate-notes">
                <label>
                  기록할 곳
                  <select
                    aria-label="Fate 노트 대상"
                    value={notesTargetKey(destination.target)}
                    onChange={(e) =>
                      setTargetChoice({
                        context: contextKey,
                        value: e.target.value,
                      })
                    }
                  >
                    {destinations.map((d) => (
                      <option
                        key={notesTargetKey(d.target)}
                        value={notesTargetKey(d.target)}
                      >
                        {d.label}
                      </option>
                    ))}
                  </select>
                </label>
                <Button
                  className="btn"
                  onClick={() => {
                    try {
                      transact((save) => {
                        const c = save.campaigns.find(
                          (c) => c.id === campaign.id,
                        );
                        if (!c)
                          throw new Error(
                            '캠페인이 더 이상 존재하지 않습니다.',
                          );
                        appendOracleNotes(
                          c,
                          destination.target,
                          fateNotesResult(reading),
                        );
                      });
                      notify('판정 결과를 노트에 추가했습니다.');
                    } catch (e) {
                      setError(
                        e instanceof Error
                          ? e.message
                          : '노트에 추가하지 못했습니다.',
                      );
                    }
                  }}
                >
                  노트에 추가
                </Button>
              </div>
            ) : (
              <p className="fate-hint">
                캠페인을 열면 해당 기록의 노트에 추가할 수 있습니다.
              </p>
            )}
          </section>
        )}
        <section className="fate-history" aria-label="최근 Mythic 판정">
          <h3>
            최근 판정 <small>최대 20개 · 자동 저장</small>
          </h3>
          {!history.length && <p>질문을 적거나 바로 주사위를 굴리세요.</p>}
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
        </section>
      </DialogContent>
    </Dialog>
  );
}
