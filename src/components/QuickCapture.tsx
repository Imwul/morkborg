import { useState } from 'react';
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
import type { ObjectLink, Visibility } from '../domain/chronicle';
import {
  createJournalNote,
  createRumor,
  createRelic,
  recordDeath,
  recordEvent,
  linkToSession,
} from '../domain/chronicleOperations';
import { createNPC } from '../generators/content';
import { editCampaign } from '../storage/saveStore';
import { LinkChips, LinkPicker } from './ChronicleLinks';

export type CaptureKind =
  | 'event'
  | 'npc'
  | 'rumor'
  | 'relic'
  | 'note'
  | 'death';
const labels: Record<CaptureKind, string> = {
  event: '사건',
  npc: 'NPC',
  rumor: '소문',
  relic: '유물',
  note: '노트',
  death: '죽음',
};
export function captureContext(c: Campaign): ObjectLink[] {
  const play = c.workspace.section === 'play';
  const dungeonId = play
    ? c.workspace.playDungeonId
    : c.workspace.section === 'dungeons'
      ? c.workspace.dungeonId
      : null;
  const roomId = play
    ? c.workspace.playRoomId
    : c.workspace.dungeonTab === 'rooms'
      ? c.workspace.roomId
      : null;
  const d = c.dungeons.find((d) => d.id === dungeonId);
  if (!d) return [];
  return [
    { kind: 'dungeon', id: d.id },
    ...(d.rooms.some((r) => r.id === roomId)
      ? [{ kind: 'room' as const, id: roomId!, dungeonId: d.id }]
      : []),
  ];
}
export function QuickCapture({
  campaign: c,
  initialKind = 'event',
  onClose,
  notify,
}: {
  campaign: Campaign;
  initialKind?: CaptureKind;
  onClose: () => void;
  notify: (text: string) => void;
}) {
  const [kind, setKind] = useState<CaptureKind>(initialKind),
    [title, setTitle] = useState(''),
    [text, setText] = useState(''),
    [links, setLinks] = useState<ObjectLink[]>(() => captureContext(c));
  const [sessionId, setSessionId] = useState(
    (c.workspace.section === 'sessions' ? c.workspace.sessionId : null) ??
      c.currentSessionId ??
      '',
  );
  const [date, setDate] = useState(
      () =>
        c.sessions.find((s) => s.id === sessionId)?.date ??
        new Date().toLocaleDateString('en-CA'),
    ),
    [inWorldDate, setInWorldDate] = useState(
      c.sessions.find((s) => s.id === sessionId)?.inWorldDate ||
        `DAY ${c.campaignDay}`,
    ),
    [visibility, setVisibility] = useState<Visibility>('gm'),
    [deathTarget, setDeathTarget] = useState(''),
    [error, setError] = useState('');
  function save() {
    if (kind === 'death' ? !deathTarget : !title.trim()) return;
    try {
      editCampaign(c.id, (next) => {
        const base = { title: title.trim(), notes: '', links, visibility };
        const eventContext = {
          sessionId: sessionId || null,
          date,
          inWorldDate,
          description: text,
        };
        const eventBefore = new Set(next.timeline.map((e) => e.id));
        let link: ObjectLink | undefined;
        if (kind === 'npc') {
          const npc = createNPC(
            next.id,
            next.dungeons.find((d) =>
              links.some((l) => l.kind === 'dungeon' && l.id === d.id),
            )?.region,
            true,
          );
          npc.name = title.trim();
          npc.notes = text;
          npc.visibility = visibility;
          next.npcs.push(npc);
          link = { kind: 'npc', id: npc.id };
        }
        if (kind === 'rumor') {
          const r = createRumor(
            next,
            { ...base, description: text, status: 'heard' },
            eventContext,
          );
          link = { kind: 'rumor', id: r.id };
        }
        if (kind === 'relic') {
          const r = createRelic(
            next,
            {
              ...base,
              description: text,
              origin:
                links.find((l) => l.kind === 'room') ??
                links.find((l) => l.kind === 'dungeon') ??
                null,
            },
            eventContext,
          );
          link = { kind: 'relic', id: r.id };
        }
        if (kind === 'note') {
          const n = createJournalNote(next, { ...base, text }, eventContext);
          link = { kind: 'note', id: n.id };
        }
        if (kind === 'death') {
          const [targetKind, id] = deathTarget.split(':');
          const before = new Set(next.timeline.map((e) => e.id));
          recordDeath(next, targetKind as 'character' | 'npc', id, {
            ...eventContext,
            links: [
              { kind: targetKind as 'character' | 'npc', id, relation: '사망' },
              ...links,
            ],
          });
          const event = next.timeline.find((e) => !before.has(e.id));
          if (event) {
            event.description = text;
            event.date = date;
            event.inWorldDate = inWorldDate;
            event.sessionId = sessionId || null;
          }
          if (sessionId)
            linkToSession(next, sessionId, {
              kind: targetKind as 'character' | 'npc',
              id,
              relation: '사망',
            });
        } else {
          const created = next.timeline.find((e) => !eventBefore.has(e.id));
          if (created)
            Object.assign(created, { ...eventContext, title: title.trim() });
          else
            recordEvent(next, {
              type:
                kind === 'relic'
                  ? 'relic-acquired'
                  : kind === 'rumor'
                    ? 'rumor'
                    : kind === 'note'
                      ? 'note'
                      : 'custom',
              title: kind === 'npc' ? `${title.trim()} — 만남` : title.trim(),
              description: text,
              date,
              inWorldDate,
              sessionId: sessionId || null,
              links: [...(link ? [link] : []), ...links],
            });
          if (sessionId)
            for (const item of [...links, ...(link ? [link] : [])])
              linkToSession(next, sessionId, item);
        }
      });
      notify(`${labels[kind]} 기록을 저장했습니다.`);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장하지 못했습니다.');
    }
  }
  const deaths = [
    ...c.characters.map((ch) => ({
      key: `character:${ch.id}`,
      label: `캐릭터 · ${ch.name}`,
    })),
    ...c.npcs.map((npc) => ({
      key: `npc:${npc.id}`,
      label: `NPC · ${npc.name}`,
    })),
  ];
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="chronicle-dialog quick-capture-dialog">
        <DialogTitle>RECORD · 빠른 기록</DialogTitle>
        <DialogDescription>
          {c.title} ·{' '}
          {sessionId
            ? c.sessions.find((s) => s.id === sessionId)?.title
            : '캠페인 연대기'}
        </DialogDescription>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <fieldset className="capture-kind" aria-label="기록 종류">
            {(Object.keys(labels) as CaptureKind[]).map((type) => (
              <button
                key={type}
                type="button"
                aria-pressed={kind === type}
                onClick={() => setKind(type)}
              >
                {labels[type]}
              </button>
            ))}
          </fieldset>
          {kind === 'death' ? (
            <label>
              사망한 인물
              <select
                value={deathTarget}
                onChange={(e) => setDeathTarget(e.target.value)}
              >
                <option value="">인물 선택</option>
                {deaths.map((d) => (
                  <option key={d.key} value={d.key}>
                    {d.label}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label>
              {kind === 'npc' ? '이름' : '제목'}
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={kind === 'npc' ? 'Vorga' : '무엇을 남길까요?'}
                maxLength={300}
              />
            </label>
          )}
          <label>
            기록
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="짧게 남기고, 나중에 이어 쓰세요."
              rows={3}
            />
          </label>
          <label>
            세션
            <select
              value={sessionId}
              onChange={(e) => {
                const target = c.sessions.find((s) => s.id === e.target.value);
                setSessionId(e.target.value);
                setDate(target?.date ?? new Date().toLocaleDateString('en-CA'));
                setInWorldDate(target?.inWorldDate || `DAY ${c.campaignDay}`);
              }}
            >
              <option value="">세션 밖의 사건</option>
              {c.sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </label>
          <details className="capture-context">
            <summary>날짜 · 공개 범위 · 연결 {links.length}</summary>
            <div className="record-grid">
              <label>
                실제 날짜
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => {
                    if (e.target.value) setDate(e.target.value);
                  }}
                />
              </label>
              <label>
                세계 내 날짜
                <Input
                  value={inWorldDate}
                  onChange={(e) => setInWorldDate(e.target.value)}
                />
              </label>
            </div>
            {kind !== 'event' && kind !== 'death' && (
              <label>
                공개 범위
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as Visibility)}
                >
                  <option value="gm">GM 전용</option>
                  <option value="players">플레이어에게 알려짐</option>
                </select>
              </label>
            )}
            <LinkChips
              campaign={c}
              links={links}
              onRemove={(i) => setLinks(links.filter((_, n) => n !== i))}
            />
            <LinkPicker campaign={c} value={links} onChange={setLinks} />
          </details>
          {error && <p role="alert">{error}</p>}
          <Button
            className={`btn primary ${kind === 'death' ? 'danger' : ''}`}
            type="submit"
            disabled={kind === 'death' ? !deathTarget : !title.trim()}
          >
            기록 저장
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
