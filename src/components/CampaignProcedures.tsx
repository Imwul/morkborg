import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { Campaign } from '../domain/types';
import type { OracleResult } from '../domain/oracle';
import { regions } from '../data/regions';
import { editCampaign } from '../storage/saveStore';
import { useOracleRegistry } from '../storage/oracleStore';
import { SourceDisclosure } from './SourceDisclosure';
import {
  APOCALYPSE_DICE,
  CALENDAR_SOURCE,
  MAX_CAMPAIGN_DAY,
  TRAVEL_ACTIONS,
  campaignHasEnded,
  knownRouteDice,
  miseryCode,
  recordDawn,
  recordMisery,
  recordTravel,
  setCampaignDay,
  rollMisery,
  rollRouteDuration,
  rollTravel,
  travelNeedsReplacement,
  type TravelAction,
} from '../domain/campaignProcedures';

export function CampaignProcedures({
  campaign,
  notify,
}: {
  campaign: Campaign;
  notify: (message: string) => void;
}) {
  const { registry, loading } = useOracleRegistry();
  const uid = useId();
  const [tab, setTab] = useState<'calendar' | 'travel' | 'reference'>(
    'calendar',
  );
  const [error, setError] = useState('');
  const [manual, setManual] = useState(false);
  const [code, setCode] = useState('');
  const [text, setText] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [sessionId, setSessionId] = useState(campaign.currentSessionId ?? '');
  const [from, setFrom] = useState('sarkash');
  const [to, setTo] = useState('graven-tosk');
  const [days, setDays] = useState('');
  const [action, setAction] = useState<TravelAction>('road');
  const [travelNotes, setTravelNotes] = useState('');
  const [reading, setReading] = useState<OracleResult | null>(null);
  const [savedReading, setSavedReading] = useState('');
  const ended = campaignHasEnded(campaign);
  const route = knownRouteDice(from, to);
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
            ['calendar', 'CALENDAR'],
            ['travel', 'TRAVEL'],
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
                const day = Number(new FormData(e.currentTarget).get('campaignDay'));
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
              <Button type="submit" variant="secondary">날짜 적용</Button>
            </form>
            <p className="muted">이어서 플레이할 캠페인의 날짜를 맞춥니다. 이전 기록과 세션 날짜는 유지됩니다.</p>
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
        <div className="travel-dossier">
          <header>
            <p className="eyebrow">ROADS TO DAMNATION</p>
            <h2>On the road</h2>
          </header>
          <div className="procedure-form travel-route">
            <label>
              FROM
              <select
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value);
                  setDays('');
                  setReading(null);
                }}
              >
                {regions.map((r) => (
                  <option value={r.id} key={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              TO
              <select
                value={to}
                onChange={(e) => {
                  setTo(e.target.value);
                  setDays('');
                  setReading(null);
                }}
              >
                {regions.map((r) => (
                  <option value={r.id} key={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              계획한 여행일
              <Input
                type="number"
                min={1}
                value={days}
                onChange={(e) => setDays(e.target.value)}
                placeholder="GM이 정한 일수"
              />
            </label>
            {route && (
              <Button
                variant="secondary"
                onClick={() =>
                  run(() => setDays(String(rollRouteDuration(from, to).days)))
                }
              >
                거리 d{route.sides}+{route.modifier}
              </Button>
            )}
          </div>
          <div className="procedure-controls">
            <label htmlFor={`${uid}-action`}>절차</label>
            <select
              id={`${uid}-action`}
              value={action}
              onChange={(e) => {
                setAction(e.target.value as TravelAction);
                setReading(null);
              }}
            >
              {TRAVEL_ACTIONS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
            <Button
              disabled={loading}
              onClick={() =>
                run(() => {
                  setReading(rollTravel(action, registry));
                  setTravelNotes('');
                  setSavedReading('');
                })
              }
            >
              ROLL TRAVEL
            </Button>
          </div>
          <p className="muted">
            새벽은 Calendar에서 기록합니다. 아래 결과를 해결한 뒤 여행 경과와
            자원 변화를 메모하세요.
          </p>
          {reading && (
            <div className="travel-reading">
              {reading.rolls.map((r, i) => (
                <article key={`${r.oracleId}-${i}`}>
                  <h3>
                    {r.title}{' '}
                    <span>
                      {r.dice}={r.roll}
                    </span>
                  </h3>
                  <p>{r.text}</p>
                  <SourceDisclosure source={r.source} />
                </article>
              ))}
              {savedReading !== reading.id &&
                travelNeedsReplacement(campaign, reading) && (
                  <output>
                    이미 사용한 일회성 도로 사건입니다. 아래에 대신 일어날
                    사건을 기록하세요.
                  </output>
                )}
              <label>
                여행 메모 / 해결한 결과
                <Textarea
                  value={travelNotes}
                  onChange={(e) => setTravelNotes(e.target.value)}
                />
              </label>
              <Button
                disabled={savedReading === reading.id}
                onClick={() =>
                  run(() => {
                    editCampaign(campaign.id, (c) =>
                      recordTravel(
                        c,
                        {
                          from: regions.find((r) => r.id === from)!.name,
                          to: regions.find((r) => r.id === to)!.name,
                          days: days ? Number(days) : undefined,
                          action,
                          reading,
                          notes: travelNotes,
                        },
                        registry,
                      ),
                    );
                    setSavedReading(reading.id);
                    notify('현재 Session과 연대기에 여행을 기록했습니다.');
                  })
                }
              >
                {savedReading === reading.id ? '기록됨' : '연대기에 기록'}
              </Button>
            </div>
          )}
          <SourceDisclosure source="MÖRK BORG CULT: FERETORY · Roads to Damnation · PDF 6–9 / p. 4–7; Sölitary Defilement · PDF 17 / p. 15">
            <p>
              출발 전 소요일을 정합니다. 도로 사건은 매일, 야영 사건은 밤에
              사용합니다. 도로 사건 7–8은 다시 굴리고, 5–6은 날씨를 다시
              굴립니다. 4이면 전진하지 않습니다. 보급 5–6은 마을 표도 굴립니다.
            </p>
            <p>
              처음 지나간 도로 사건 10–12, 16, 18–19는 다음부터 직접 만든
              사건으로 대체합니다. 식량·물, 자원 피해, 선택과 조건부 후속 결과는
              확인 후 직접 반영하세요.
            </p>
            <p>
              지도에서 양 끝이 확인된 Galgenbeck–Graven-Tosk,
              Galgenbeck–Valley만 기본 거리 주사위를 제공합니다. 그 밖의 지역,
              크기가 다른 세계, 악천후는 소요일을 직접 정합니다.
            </p>
          </SourceDisclosure>
        </div>
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
