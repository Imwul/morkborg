import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { Campaign } from '../domain/types';
import { editCampaign } from '../storage/saveStore';
import { useOracleRegistry } from '../storage/oracleStore';
import { SourceDisclosure } from './SourceDisclosure';
import { JourneyWorkbench } from './JourneyWorkbench';
import {
  APOCALYPSE_DICE,
  CALENDAR_SOURCE,
  MAX_CAMPAIGN_DAY,
  campaignHasEnded,
  miseryCode,
  recordDawn,
  recordMisery,
  setCampaignDay,
  rollMisery,
} from '../domain/campaignProcedures';

export function CampaignProcedures({
  campaign,
  notify,
  onCity,
}: {
  campaign: Campaign;
  notify: (message: string) => void;
  onCity?: () => void;
}) {
  const { registry, loading } = useOracleRegistry();
  const uid = useId();
  const [tab, setTab] = useState<'calendar' | 'travel' | 'reference'>('travel');
  const [error, setError] = useState('');
  const [manual, setManual] = useState(false);
  const [code, setCode] = useState('');
  const [text, setText] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [sessionId, setSessionId] = useState(campaign.currentSessionId ?? '');
  const ended = campaignHasEnded(campaign);
  const latest = campaign.miseries.at(-1);
  function run(fn: () => void) {
    try {
      setError('');
      fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : '기록하지 못했습니다.');
    }
  }
  return (
    <section className="campaign-procedures" aria-label="Campaign procedures">
      <fieldset className="chronicle-tabs" aria-label="절차 선택">
        {(
          [
            ['travel', 'JOURNEY'],
            ['calendar', 'CALENDAR · 관리'],
            ['reference', 'AT THE TABLE'],
          ] as const
        ).map(([value, label]) => (
          <Button
            key={value}
            variant={tab === value ? 'default' : 'ghost'}
            aria-pressed={tab === value}
            onClick={() => setTab(value)}
          >
            {label}
          </Button>
        ))}
      </fieldset>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {tab === 'calendar' && (
        <div className="calendar-ledger">
          <header
            className={`calendar-heading ${ended ? 'terminal-misery' : ''}`}
          >
            <p className="eyebrow">THE CALENDAR OF NECHRUBEL</p>
            <h2>
              Day {campaign.campaignDay}{' '}
              <span className="misery-count">
                {campaign.miseries.length} / 7
              </span>
            </h2>
            {ended && (
              <output>
                7:7 · 종말이 기록되었습니다. 이 캠페인의 기록은 남아 있습니다.
              </output>
            )}
          </header>
          <div className="procedure-controls">
            <label htmlFor={`${uid}-die`}>종말 주사위</label>
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
                그룹이 선택
              </option>
              {APOCALYPSE_DICE.map((die) => (
                <option key={die} value={die}>
                  d{die}
                </option>
              ))}
            </select>
            <Button
              disabled={ended || !campaign.apocalypseDie}
              onClick={() =>
                run(() => {
                  editCampaign(campaign.id, (c) => {
                    const result = recordDawn(c, registry);
                    notify(
                      result.misery
                        ? `Day ${c.campaignDay} · Misery ${miseryCode(result.misery.roll)}`
                        : `Day ${c.campaignDay} · d${c.apocalypseDie}=${result.roll}`,
                    );
                  });
                })
              }
            >
              NEXT DAWN
            </Button>
            <Button
              variant="secondary"
              disabled={ended || (loading && campaign.miseries.length < 6)}
              onClick={() =>
                run(() => {
                  editCampaign(campaign.id, (c) => {
                    const m = recordMisery(c, rollMisery(c, registry));
                    notify(`Misery ${miseryCode(m.roll)} 기록됨`);
                  });
                })
              }
            >
              ROLL MISERY
            </Button>
            <Button
              variant="ghost"
              disabled={ended}
              aria-expanded={manual}
              onClick={() => setManual(!manual)}
            >
              직접 기록
            </Button>
          </div>
          <p className="muted">
            NEXT DAWN은 다음 날로 이동하고 주사위를 기록합니다. 1이면 Misery가
            발생합니다.
          </p>
          <details className="calendar-day-setting">
            <summary>캠페인 날짜 조정</summary>
            <form
              className="procedure-form"
              onSubmit={(e) => {
                e.preventDefault();
                const day = Number(
                  new FormData(e.currentTarget).get('campaignDay'),
                );
                run(() => {
                  editCampaign(campaign.id, (c) => setCampaignDay(c, day));
                  notify(`캠페인 날짜: Day ${day}`);
                });
              }}
            >
              <label htmlFor={`${uid}-day`}>
                현재 캠페인 날짜
                <Input
                  key={campaign.campaignDay}
                  id={`${uid}-day`}
                  name="campaignDay"
                  type="number"
                  min={1}
                  max={MAX_CAMPAIGN_DAY}
                  step={1}
                  required
                  defaultValue={campaign.campaignDay}
                />
              </label>
              <Button type="submit" variant="secondary">
                날짜 적용
              </Button>
            </form>
            <p className="muted">
              이어서 플레이할 캠페인의 날짜를 맞춥니다. 이전 기록과 세션 날짜는
              유지됩니다.
            </p>
          </details>
          {manual && !ended && (
            <form
              className="procedure-form"
              onSubmit={(e) => {
                e.preventDefault();
                run(() => {
                  const normalized = code.trim().replace(':', '');
                  if (normalized && !/^\d{2}$/.test(normalized))
                    throw new Error('예: 1:1. 미상일 때는 비워 두세요.');
                  editCampaign(campaign.id, (c) =>
                    recordMisery(c, {
                      roll: normalized ? Number(normalized) : null,
                      result: text,
                      date,
                      sessionId: sessionId || null,
                      notes,
                    }),
                  );
                  setManual(false);
                  setCode('');
                  setText('');
                  setNotes('');
                  notify('Misery와 연대기를 기록했습니다.');
                });
              }}
            >
              <label>
                시편 / 절
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="1:1 · 미상은 공란"
                />
              </label>
              <label>
                내용
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  required={campaign.miseries.length < 6}
                />
              </label>
              <label>
                날짜
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </label>
              <label>
                Session
                <select
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                >
                  <option value="">연결 없음</option>
                  {campaign.sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                메모
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </label>
              {campaign.miseries.length === 6 && (
                <p>일곱 번째는 자동으로 Psalm VII 7:7이 됩니다.</p>
              )}
              <Button type="submit">기록</Button>
            </form>
          )}
          {latest && (
            <article
              className={`latest-misery ${latest.terminal ? 'terminal-misery' : ''}`}
            >
              <span className="misery-stamp">{miseryCode(latest.roll)}</span>
              <p>{latest.result}</p>
              <SourceDisclosure refs={latest.sourceRefs} />
            </article>
          )}
          {campaign.miseries.length > 0 && (
            <details className="misery-history">
              <summary>이전 Misery · {campaign.miseries.length}개</summary>
              <ol>
                {campaign.miseries.map((m) => (
                  <li key={m.id}>
                    <strong>{miseryCode(m.roll)}</strong>{' '}
                    <span>
                      {m.inWorldDate} · {m.date}
                    </span>
                    <p>{m.result}</p>
                    {m.notes && <p>{m.notes}</p>}
                    <SourceDisclosure refs={m.sourceRefs} />
                  </li>
                ))}
              </ol>
            </details>
          )}
          <SourceDisclosure refs={[CALENDAR_SOURCE]}>
            <p>
              그룹이 d100/d20/d10/d6/d2를 선택합니다. 새벽마다 1이면 d66, 같은
              Misery는 반복되지 않습니다. 일곱 번째는 항상 7:7입니다. ROLL
              MISERY는 발생이 결정됐을 때 직접 기록하는 버튼입니다.
            </p>
          </SourceDisclosure>
        </div>
      )}
      {tab === 'travel' && (
        <JourneyWorkbench
          campaign={campaign}
          registry={registry}
          loading={loading}
          notify={notify}
          onCity={onCity}
        />
      )}
      {tab === 'reference' && (
        <div className="table-reference">
          <h2>At the table</h2>
          <p className="muted">필요한 절차만 펼쳐 확인하세요.</p>
          <details>
            <summary>Rest · 휴식과 자원</summary>
            <p>
              짧은 휴식은 d4 HP, 밤잠은 d6 HP 회복. 음식이나 물이 없으면
              회복하지 않습니다. 이틀 굶은 뒤에는 매일 d4 HP를 잃습니다. 감염
              중에는 회복 대신 매일 d6 HP를 잃습니다.
            </p>
            <SourceDisclosure source="MÖRK BORG BARE BONES EDITION · PDF 31 / p. 31" />
          </details>
          <details>
            <summary>Reaction / Morale · 반응과 사기</summary>
            <p>
              반응이 불분명한 조우에는 2d6 Reaction을 사용합니다. 지도자 사망,
              무리 절반 제거, 단독 적의 HP가 1/3 남았을 때 사기를 확인합니다.
              2d6이 사기보다 크면 실패하며, d6의 1–3은 도주, 4–6은 항복입니다.
            </p>
            <SourceDisclosure source="MÖRK BORG BARE BONES EDITION · PDF 32 / p. 32" />
          </details>
          <details>
            <summary>Broken / Death · 쓰러짐과 죽음</summary>
            <p>
              0 HP는 Broken d4, 음수 HP는 사망입니다. 부상과 출혈의 후속 조건은
              Broken 결과를 확인하세요. 사망해도 Character 기록과 연결은
              유지하세요.
            </p>
            <SourceDisclosure source="MÖRK BORG BARE BONES EDITION · PDF 29 / p. 29" />
          </details>
          <details>
            <summary>Omens / Powers · 하루 자원</summary>
            <p>
              Omens는 선택 규칙입니다. 모두 소진한 상태에서 6시간 이상 쉬면
              직업의 주사위로 다시 정합니다(Classless d2). Powers의 하루 사용
              횟수는 아침마다 Presence+d4입니다.
            </p>
            <SourceDisclosure source="MÖRK BORG BARE BONES EDITION · PDF 34, 37 / p. 34, 37" />
          </details>
          <details>
            <summary>Getting Better · 성장</summary>
            <p>
              GM이 성장을 결정합니다. 6d10이 최대 HP 이상이면 최대 HP에 d6을
              더하고, 모든 능력에 d6을 비교해 증감을 적용합니다. 낮은 능력의
              예외와 −3/+6 한계를 원문에서 확인하세요. 은화/두루마리는 Debris
              표를 사용합니다.
            </p>
            <SourceDisclosure source="MÖRK BORG BARE BONES EDITION · PDF 33 / p. 33" />
          </details>
          <details>
            <summary>Carrying · 장비</summary>
            <p>
              보통 크기 물건은 Strength+8개까지. 이를 넘으면 Strength/Agility
              판정 DR에 +2, 두 배를 초과하여 운반할 수 없습니다. 물건의 크기와
              특수 조건은 직접 판단합니다.
            </p>
            <SourceDisclosure source="MÖRK BORG BARE BONES EDITION · PDF 28 / p. 28" />
          </details>
        </div>
      )}
    </section>
  );
}
