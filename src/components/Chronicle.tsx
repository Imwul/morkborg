import { useState } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  Plus,
  Play,
  Check,
  Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { Campaign } from '../domain/types';
import type { Session, TimelineEvent } from '../domain/chronicle';
import {
  createSession,
  startSession,
  endSession,
  createThread,
  createRumor,
  createRelic,
  createJournalNote,
  assignRelic,
  recordEvent,
  linkToSession,
  objectLabel,
} from '../domain/chronicleOperations';
import { changeWorkspace, editCampaign } from '../storage/saveStore';
import { now } from '../generators/random';
import { LinkChips, LinkPicker, Backlinks, openObject } from './ChronicleLinks';
import { SourceDisclosure } from './SourceDisclosure';
import { VisibilityFields, stateLabels } from './ChronicleFields';

const eventLabels: Record<TimelineEvent['type'], string> = {
  session: 'SESSION',
  'character-death': 'DEATH',
  'npc-death': 'DEATH',
  'dungeon-discovery': 'DUNGEON',
  'room-discovery': 'ROOM',
  'placement-state': 'ENCOUNTER',
  'relic-acquired': 'RELIC',
  misery: 'MISERY',
  oracle: 'ORACLE',
  custom: 'EVENT',
  note: 'NOTE',
  thread: 'THREAD',
  rumor: 'RUMOR',
  travel: 'TRAVEL',
};

export function EventLedger({
  campaign: c,
  events,
  compact = false,
}: {
  campaign: Campaign;
  events: TimelineEvent[];
  compact?: boolean;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null),
    [editingId, setEditingId] = useState<string | null>(null);
  const selected = c.timeline.find(
    (e) =>
      e.id ===
      (c.workspace.section === 'timeline'
        ? c.workspace.chronicleId
        : selectedId),
  );
  const editing = !!selected && editingId === selected.id;
  const sorted = [...events].sort(
    (a, b) =>
      b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
  );
  const update = (patch: Partial<TimelineEvent>) =>
    editCampaign(c.id, (next) => {
      const event = next.timeline.find((e) => e.id === selected?.id);
      if (event) {
        Object.assign(event, patch, { updatedAt: now() });
        if (event.sessionId)
          for (const link of event.links)
            linkToSession(next, event.sessionId, link);
      }
    });
  return (
    <>
      <ol className={`ledger-list event-ledger ${compact ? 'compact' : ''}`}>
        {sorted.map((e) => (
          <li key={e.id}>
            <button
              className={`ledger-row ${e.type === 'misery' || e.type.endsWith('death') ? 'event-mark' : ''}`}
              onClick={() => {
                if (c.workspace.section === 'timeline')
                  changeWorkspace(c.id, { chronicleId: e.id });
                else setSelectedId(e.id);
                setEditingId(null);
              }}
            >
              <span className="ledger-date">
                <b>{e.inWorldDate || e.date}</b>
                <small>{eventLabels[e.type]}</small>
              </span>
              <span className="ledger-copy">
                <strong>{e.title}</strong>
                {!compact && (
                  <small>
                    {e.sessionId
                      ? c.sessions.find((s) => s.id === e.sessionId)?.title
                      : e.date}
                    {e.links.length ? ` · 연결 ${e.links.length}` : ''}
                  </small>
                )}
              </span>
              <ArrowUpRight size={15} />
            </button>
          </li>
        ))}
      </ol>
      {!events.length && (
        <p className="chronicle-empty">
          아직 남겨진 사건이 없습니다. 플레이의 변화가 여기에 쌓입니다.
        </p>
      )}
      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedId(null);
            if (c.workspace.section === 'timeline')
              changeWorkspace(c.id, { chronicleId: null });
          }
        }}
      >
        <DialogContent className="chronicle-dialog">
          {selected && (
            <>
              <DialogTitle>{selected.title}</DialogTitle>
              <DialogDescription>
                {selected.inWorldDate || selected.date} ·{' '}
                {eventLabels[selected.type]}
              </DialogDescription>
              {editing ? (
                <>
                  <label>
                    사건 제목
                    <Input
                      value={selected.title}
                      onChange={(e) => update({ title: e.target.value })}
                    />
                  </label>
                  <div className="record-grid">
                    <label>
                      실제 날짜
                      <Input
                        type="date"
                        value={selected.date}
                        onChange={(e) => {
                          if (e.target.value) update({ date: e.target.value });
                        }}
                      />
                    </label>
                    <label>
                      세계 내 날짜
                      <Input
                        value={selected.inWorldDate}
                        onChange={(e) =>
                          update({ inWorldDate: e.target.value })
                        }
                      />
                    </label>
                  </div>
                  <label>
                    기록
                    <Textarea
                      value={selected.description}
                      onChange={(e) => update({ description: e.target.value })}
                    />
                  </label>
                  <label>
                    세션
                    <select
                      value={selected.sessionId ?? ''}
                      onChange={(e) =>
                        update({ sessionId: e.target.value || null })
                      }
                    >
                      <option value="">세션 밖의 사건</option>
                      {c.sessions.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.title}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              ) : (
                <p className="chronicle-prose">
                  {selected.description || '추가 기록 없음'}
                </p>
              )}
              <LinkChips
                campaign={c}
                links={selected.links}
                onRemove={
                  editing
                    ? (i) =>
                        update({
                          links: selected.links.filter((_, n) => n !== i),
                        })
                    : undefined
                }
              />
              {editing && (
                <LinkPicker
                  campaign={c}
                  value={selected.links}
                  onChange={(links) => update({ links })}
                />
              )}
              <SourceDisclosure refs={selected.sourceRefs}>
                {selected.oracle && (
                  <div>
                    {selected.oracle.rolls.map((r, i) => (
                      <p key={i}>
                        {r.title} · {r.dice}: {r.roll}
                        <br />
                        {r.source}
                      </p>
                    ))}
                  </div>
                )}
              </SourceDisclosure>
              <Button
                className="btn ghost small"
                onClick={() => setEditingId(editing ? null : selected.id)}
              >
                {editing ? <Check size={14} /> : <Pencil size={14} />}{' '}
                {editing ? '편집 완료' : '기록 편집'}
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function Sessions({
  campaign: c,
  onCapture,
}: {
  campaign: Campaign;
  onCapture: () => void;
}) {
  const session = c.sessions.find((s) => s.id === c.workspace.sessionId);
  const update = (patch: Partial<Session>) =>
    editCampaign(c.id, (next) => {
      const s = next.sessions.find((s) => s.id === session?.id);
      if (s) {
        Object.assign(s, patch, { updatedAt: now() });
        if (patch.links)
          for (const link of patch.links) linkToSession(next, s.id, link);
      }
    });
  function add() {
    editCampaign(c.id, (next) => {
      const s = createSession(next);
      next.workspace.sessionId = s.id;
    });
  }
  if (!session)
    return (
      <section className="chronicle-page">
        <div className="chronicle-heading">
          <div>
            <span className="eyebrow">CAMPAIGN / SESSIONS</span>
            <h1>
              세션 기록<span className="acid">.</span>
            </h1>
            <p>우리가 다녀온 곳, 마주친 것, 남겨 둔 것.</p>
          </div>
          <Button className="btn primary" onClick={add}>
            <Plus size={17} />새 세션
          </Button>
        </div>
        <div className="ledger-list">
          {[...c.sessions]
            .sort(
              (a, b) =>
                b.date.localeCompare(a.date) ||
                b.createdAt.localeCompare(a.createdAt),
            )
            .map((s) => (
              <button
                className="ledger-row session-row"
                key={s.id}
                onClick={() => changeWorkspace(c.id, { sessionId: s.id })}
              >
                <span className="session-number">
                  {s.number ? String(s.number).padStart(2, '0') : '—'}
                </span>
                <span className="ledger-copy">
                  <strong>{s.title}</strong>
                  <small>
                    {s.date} · {s.characterIds.length}명 ·{' '}
                    {c.timeline.filter((e) => e.sessionId === s.id).length}개
                    사건
                  </small>
                </span>
                <span className={`state-dot ${s.status}`}>
                  {stateLabels[s.status]}
                </span>
                <ArrowUpRight size={16} />
              </button>
            ))}
        </div>
        {!c.sessions.length && (
          <div className="chronicle-empty">
            <h2>첫 번째 밤을 기록하세요.</h2>
            <p>
              세션을 만들고 일행을 선택하세요. 발견과 만남은 연결된 사건으로
              남습니다.
            </p>
            <Button className="btn" onClick={add}>
              첫 세션 만들기
            </Button>
          </div>
        )}
      </section>
    );
  const events = c.timeline.filter((e) => e.sessionId === session.id);
  return (
    <section className="chronicle-page record-detail">
      <Button
        className="btn ghost small"
        onClick={() => changeWorkspace(c.id, { sessionId: null })}
      >
        <ArrowLeft size={15} />
        모든 세션
      </Button>
      <div className="chronicle-heading">
        <div>
          <span className="eyebrow">
            SESSION{' '}
            {session.number ? String(session.number).padStart(2, '0') : '—'} /{' '}
            {stateLabels[session.status]}
          </span>
          <h1>{session.title}</h1>
        </div>
        <div className="actions">
          {session.status !== 'active' ? (
            <Button
              className="btn primary"
              disabled={
                !!c.currentSessionId && c.currentSessionId !== session.id
              }
              title={
                c.currentSessionId && c.currentSessionId !== session.id
                  ? '진행 중인 세션을 먼저 종료하세요.'
                  : undefined
              }
              onClick={() =>
                editCampaign(c.id, (next) => startSession(next, session.id))
              }
            >
              <Play size={16} />
              {session.status === 'ended' ? '세션 다시 열기' : '세션 시작'}
            </Button>
          ) : (
            <>
              <Button
                className="btn primary"
                onClick={() => changeWorkspace(c.id, { section: 'play' })}
              >
                <Play size={16} />
                PLAY
              </Button>
              <Button
                className="btn"
                onClick={() =>
                  editCampaign(c.id, (next) => endSession(next, session.id))
                }
              >
                세션 종료
              </Button>
            </>
          )}
        </div>
      </div>
      <div className="record-grid session-metadata">
        <label>
          제목
          <Input
            value={session.title}
            onChange={(e) => update({ title: e.target.value })}
          />
        </label>
        <label>
          세션 번호 (선택)
          <Input
            type="number"
            min={1}
            value={session.number ?? ''}
            onChange={(e) =>
              update({
                number: e.target.value
                  ? Math.max(1, Math.trunc(Number(e.target.value)))
                  : undefined,
              })
            }
          />
        </label>
        <label>
          실제 날짜
          <Input
            type="date"
            value={session.date}
            onChange={(e) => {
              if (e.target.value) update({ date: e.target.value });
            }}
          />
        </label>
        <label>
          세계 내 날짜
          <Input
            value={session.inWorldDate}
            onChange={(e) => update({ inWorldDate: e.target.value })}
            placeholder={`DAY ${c.campaignDay}`}
          />
        </label>
      </div>
      <section className="session-party">
        <div className="section-title">
          <h2>일행</h2>
          <span>{session.characterIds.length}명</span>
        </div>
        <div className="party-options">
          {c.characters.map((ch) => (
            <label key={ch.id}>
              <input
                type="checkbox"
                checked={session.characterIds.includes(ch.id)}
                onChange={(e) =>
                  update({
                    characterIds: e.target.checked
                      ? [...session.characterIds, ch.id]
                      : session.characterIds.filter((id) => id !== ch.id),
                  })
                }
              />
              <span>
                {ch.name || 'Nameless'}{' '}
                <small>
                  {ch.status === 'dead' ? '† 사망' : `HP ${ch.hp}/${ch.maxHp}`}
                </small>
              </span>
            </label>
          ))}
        </div>
        {!c.characters.length && (
          <Button
            className="btn ghost small"
            onClick={() => changeWorkspace(c.id, { section: 'characters' })}
          >
            캐릭터 만들기 →
          </Button>
        )}
      </section>
      <div className="record-grid session-dossier">
        <section>
          <label>
            세션 요약
            <Textarea
              className="session-summary"
              value={session.summary}
              onChange={(e) => update({ summary: e.target.value })}
              placeholder="무엇이 달라졌는가? 다음에 돌아올 이유는?"
            />
          </label>
          <details className="session-notes">
            <summary>세션 노트{session.notes ? ' · 기록 있음' : ''}</summary>
            <Textarea
              aria-label="세션 노트"
              value={session.notes}
              onChange={(e) => update({ notes: e.target.value })}
            />
          </details>
        </section>
        <section>
          <div className="section-title">
            <h2>연결된 기록</h2>
            <LinkPicker
              campaign={c}
              value={session.links}
              onChange={(links) => update({ links })}
            />
          </div>
          <LinkChips
            campaign={c}
            links={session.links}
            onRemove={(i) =>
              update({ links: session.links.filter((_, n) => n !== i) })
            }
          />
          <Backlinks
            campaign={c}
            target={{ kind: 'session', id: session.id }}
          />
        </section>
      </div>
      <div className="section-title">
        <h2>사건 {events.length}</h2>
        <Button className="btn ghost small" onClick={onCapture}>
          <Plus size={14} />
          기록 추가
        </Button>
      </div>
      <EventLedger campaign={c} events={events} />
    </section>
  );
}

export function Timeline({
  campaign: c,
  onCapture,
}: {
  campaign: Campaign;
  onCapture: () => void;
}) {
  const [filter, setFilter] = useState('');
  return (
    <section className="chronicle-page">
      <div className="chronicle-heading">
        <div>
          <span className="eyebrow">THE CHRONICLE / DAY {c.campaignDay}</span>
          <h1>
            파멸의 연대기<span className="acid">.</span>
          </h1>
          <p>
            {c.timeline.length}개의 흔적 · {c.sessions.length}번의 밤
          </p>
        </div>
        <Button className="btn primary" onClick={onCapture}>
          <Plus size={16} />
          사건 기록
        </Button>
      </div>
      <label className="timeline-filter">
        세션{' '}
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">모든 사건</option>
          <option value="none">세션 밖의 사건</option>
          {c.sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
      </label>
      <EventLedger
        campaign={c}
        events={c.timeline.filter(
          (e) =>
            !filter ||
            (filter === 'none' ? !e.sessionId : e.sessionId === filter),
        )}
      />
    </section>
  );
}

export type RecordSection = 'threads' | 'rumors' | 'relics' | 'journal';
const recordNames = {
  threads: ['실마리', 'THREADS', 'thread'],
  rumors: ['소문', 'RUMORS', 'rumor'],
  relics: ['유물', 'RELICS', 'relic'],
  journal: ['짧은 기록', 'NOTES', 'note'],
} as const;
export function CampaignRecords({
  campaign: c,
  section,
}: {
  campaign: Campaign;
  section: RecordSection;
}) {
  const [newOpen, setNewOpen] = useState(false),
    [title, setTitle] = useState('');
  const [name, heading, kind] = recordNames[section];
  const records = section === 'journal' ? c.journalNotes : c[section];
  const record = records.find((r) => r.id === c.workspace.chronicleId);
  function update(patch: Record<string, unknown>) {
    editCampaign(c.id, (next) => {
      const list = section === 'journal' ? next.journalNotes : next[section];
      const r = list.find((r) => r.id === record?.id);
      if (r) Object.assign(r, patch, { updatedAt: now() });
    });
  }
  function create() {
    if (!title.trim()) return;
    editCampaign(c.id, (next) => {
      const r =
        section === 'threads'
          ? createThread(next, { title: title.trim() })
          : section === 'rumors'
            ? createRumor(next, { title: title.trim() })
            : section === 'relics'
              ? createRelic(next, { title: title.trim() })
              : createJournalNote(next, { title: title.trim(), text: '' });
      next.workspace.chronicleId = r.id;
    });
    setNewOpen(false);
    setTitle('');
  }
  return (
    <section className="chronicle-page">
      {record ? (
        <>
          <Button
            className="btn ghost small"
            onClick={() => changeWorkspace(c.id, { chronicleId: null })}
          >
            <ArrowLeft size={15} />
            모든 {name}
          </Button>
          <div className="chronicle-heading">
            <div>
              <span className="eyebrow">{heading} / CAMPAIGN RECORD</span>
              <h1>{record.title}</h1>
            </div>
            <Backlinks campaign={c} target={{ kind, id: record.id }} />
          </div>
          <div className="record-grid">
            <label>
              제목
              <Input
                value={record.title}
                onChange={(e) => update({ title: e.target.value })}
              />
            </label>
            {'status' in record && (
              <label>
                상태
                <select
                  value={record.status}
                  onChange={(e) => {
                    update({ status: e.target.value });
                    editCampaign(c.id, (next) =>
                      recordEvent(next, {
                        type: kind === 'thread' ? 'thread' : 'rumor',
                        title: `${record.title} · ${stateLabels[e.target.value]}`,
                        links: [{ kind, id: record.id }],
                      }),
                    );
                  }}
                >
                  {(section === 'threads'
                    ? ['open', 'resolved', 'failed', 'abandoned']
                    : ['unknown', 'heard', 'confirmed', 'false', 'resolved']
                  ).map((s) => (
                    <option key={s} value={s}>
                      {stateLabels[s]}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
          <label>
            {section === 'journal' ? '기록' : '설명'}
            <Textarea
              className="record-description"
              value={'text' in record ? record.text : record.description}
              onChange={(e) =>
                update(
                  section === 'journal'
                    ? { text: e.target.value }
                    : { description: e.target.value },
                )
              }
            />
          </label>
          {'holder' in record && (
            <div className="record-grid relic-custody">
              <section>
                <h2>현재 소유 / 위치</h2>
                {record.holder ? (
                  <LinkChips
                    campaign={c}
                    links={[record.holder]}
                    onRemove={() =>
                      editCampaign(c.id, (next) =>
                        assignRelic(next, record.id, null),
                      )
                    }
                  />
                ) : (
                  <p>아직 지정하지 않음</p>
                )}
                <LinkPicker
                  label="소유 / 위치 지정"
                  campaign={c}
                  kinds={['character', 'npc', 'dungeon', 'room', 'session']}
                  value={[]}
                  onChange={(links) =>
                    editCampaign(c.id, (next) =>
                      assignRelic(next, record.id, links[0] ?? null),
                    )
                  }
                />
              </section>
              <section>
                <h2>처음 발견한 곳</h2>
                {record.origin && (
                  <LinkChips
                    campaign={c}
                    links={[record.origin]}
                    onRemove={() => update({ origin: null })}
                  />
                )}
                <LinkPicker
                  label="발견 장소 연결"
                  campaign={c}
                  kinds={['dungeon', 'room', 'npc', 'session']}
                  value={[]}
                  onChange={(links) => update({ origin: links[0] ?? null })}
                />
              </section>
            </div>
          )}
          <div className="section-title">
            <h2>연결된 기록</h2>
            <LinkPicker
              campaign={c}
              value={record.links}
              onChange={(links) => update({ links })}
            />
          </div>
          <LinkChips
            campaign={c}
            links={record.links}
            onRemove={(i) =>
              update({ links: record.links.filter((_, n) => n !== i) })
            }
          />
          <details className="record-notes">
            <summary>노트{record.notes ? ' · 기록 있음' : ''}</summary>
            <Textarea
              aria-label={`${name} 노트`}
              value={record.notes}
              onChange={(e) => update({ notes: e.target.value })}
            />
          </details>
          <VisibilityFields value={record} onChange={update} />
        </>
      ) : (
        <>
          <div className="chronicle-heading">
            <div>
              <span className="eyebrow">CAMPAIGN / {heading}</span>
              <h1>
                {name}
                <span className="acid">.</span>
              </h1>
            </div>
            <Button className="btn primary" onClick={() => setNewOpen(true)}>
              <Plus size={16} />새 {name}
            </Button>
          </div>
          <div className="ledger-list">
            {[...records]
              .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
              .map((r) => (
                <button
                  key={r.id}
                  className="ledger-row"
                  onClick={() => changeWorkspace(c.id, { chronicleId: r.id })}
                >
                  <span className="ledger-copy">
                    <strong>{r.title}</strong>
                    <small>
                      {'holder' in r && r.holder
                        ? objectLabel(c, r.holder)
                        : `${r.links.length}개 연결`}
                    </small>
                  </span>
                  {'status' in r && (
                    <span className="state-dot">{stateLabels[r.status]}</span>
                  )}
                  <ArrowUpRight size={16} />
                </button>
              ))}
          </div>
          {!records.length && (
            <div className="chronicle-empty">
              <p>
                {section === 'threads'
                  ? '돌아와야 할 이유를 남기세요.'
                  : section === 'rumors'
                    ? '진실인지 모르는 말도 기록할 가치가 있습니다.'
                    : section === 'relics'
                      ? '이야기를 바꾸는 물건만 보관하세요.'
                      : '플레이 중 떠오른 기록을 빠르게 남기세요.'}
              </p>
            </div>
          )}
        </>
      )}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="chronicle-dialog">
          <DialogTitle>새 {name}</DialogTitle>
          <DialogDescription>
            제목만으로 시작하고 나중에 내용을 채울 수 있습니다.
          </DialogDescription>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              create();
            }}
          >
            <label>
              제목
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
              />
            </label>
            <Button
              className="btn primary"
              disabled={!title.trim()}
              type="submit"
            >
              저장
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}

export function CampaignHome({
  campaign: c,
  onCapture,
}: {
  campaign: Campaign;
  onCapture: () => void;
}) {
  const current = c.sessions.find((s) => s.id === c.currentSessionId);
  const recent = [...c.timeline]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);
  return (
    <section className="campaign-memory">
      <div className="chronicle-heading">
        <div>
          <span className="eyebrow">CAMPAIGN / DAY {c.campaignDay}</span>
          <h1>{c.title}</h1>
          <p>{c.description || c.subtitle}</p>
        </div>
        <Button
          className="btn primary"
          onClick={() => {
            if (current) changeWorkspace(c.id, { section: 'play' });
            else
              editCampaign(c.id, (next) => {
                const s = createSession(next);
                next.workspace.section = 'sessions';
                next.workspace.sessionId = s.id;
              });
          }}
        >
          <Play size={17} />
          {current ? '플레이 계속' : '새 세션'}
        </Button>
      </div>
      <div className="record-grid memory-dossier">
        <section>
          <div className="section-title">
            <h2>{current ? '진행 중인 세션' : '다음 밤의 기록'}</h2>
            <button
              onClick={() =>
                changeWorkspace(c.id, { section: 'sessions', sessionId: null })
              }
            >
              모든 세션 →
            </button>
          </div>
          {current ? (
            <button
              className="ledger-row"
              onClick={() => openObject(c, { kind: 'session', id: current.id })}
            >
              <span className="session-number">
                {String(current.number ?? '—').padStart(2, '0')}
              </span>
              <span>
                <strong>{current.title}</strong>
                <small>
                  {current.characterIds
                    .map((id) => c.characters.find((ch) => ch.id === id)?.name)
                    .filter(Boolean)
                    .join(' · ') || '참가자 선택 필요'}
                </small>
              </span>
            </button>
          ) : (
            <p>세션을 시작하면 발견·만남·변화가 같은 기록에 모입니다.</p>
          )}
          <div className="section-title">
            <h2>미해결 실마리</h2>
            <button
              onClick={() =>
                changeWorkspace(c.id, { section: 'threads', chronicleId: null })
              }
            >
              모두 보기 →
            </button>
          </div>
          {c.threads
            .filter((t) => t.status === 'open')
            .slice(0, 4)
            .map((t) => (
              <button
                className="ledger-row"
                key={t.id}
                onClick={() => openObject(c, { kind: 'thread', id: t.id })}
              >
                <strong>{t.title}</strong>
                <ArrowUpRight size={14} />
              </button>
            ))}
          {!c.threads.some((t) => t.status === 'open') && (
            <p className="empty-copy">
              아직 매듭짓지 못한 이야기를 실마리로 남기세요.
            </p>
          )}
        </section>
        <section>
          <div className="section-title">
            <h2>최근 흔적</h2>
            <Button className="btn ghost small" onClick={onCapture}>
              기록
            </Button>
          </div>
          <EventLedger campaign={c} events={recent} compact />
          <Button
            className="btn ghost small"
            onClick={() => changeWorkspace(c.id, { section: 'timeline' })}
          >
            연대기 열기 →
          </Button>
        </section>
      </div>
    </section>
  );
}
