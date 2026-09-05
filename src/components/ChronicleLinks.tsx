import { useState } from 'react';
import { ArrowUpRight, Link2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { Campaign, Workspace } from '../domain/types';
import type { ObjectLink, ObjectKind } from '../domain/chronicle';
import {
  backlinks,
  objectLabel,
  objectLinks,
} from '../domain/chronicleOperations';
import { changeWorkspace } from '../storage/saveStore';

export const kindLabels: Record<ObjectKind, string> = {
  event: '사건',
  character: '캐릭터',
  dungeon: '던전',
  room: '방',
  monster: '몬스터',
  npc: 'NPC',
  encounter: '조우',
  session: '세션',
  thread: '실마리',
  rumor: '소문',
  relic: '유물',
  note: '기록',
};
export const linkKey = (link: ObjectLink) =>
  `${link.kind}:${link.dungeonId ?? ''}:${link.id}`;
export function objectWorkspace(
  c: Campaign,
  link: ObjectLink,
): Partial<Workspace> {
  if (link.kind === 'room' || link.kind === 'dungeon')
    return {
      section: 'dungeons',
      dungeonPreview: false,
      dungeonId: link.kind === 'room' ? link.dungeonId! : link.id,
      roomId: link.kind === 'room' ? link.id : null,
      dungeonTab: link.kind === 'room' ? 'rooms' : 'overview',
    };
  if (link.kind === 'event')
    return { section: 'timeline', chronicleId: link.id };
  if (link.kind === 'session')
    return { section: 'sessions', sessionId: link.id };
  if (['thread', 'rumor', 'relic', 'note'].includes(link.kind))
    return {
      section: (
        {
          thread: 'threads',
          rumor: 'rumors',
          relic: 'relics',
          note: 'journal',
        } as const
      )[link.kind as 'thread' | 'rumor' | 'relic' | 'note'],
      chronicleId: link.id,
    };
  const kind = (
    {
      character: 'characters',
      monster: 'monsters',
      npc: 'npcs',
      encounter: 'encounters',
    } as const
  )[link.kind as 'character' | 'monster' | 'npc' | 'encounter'];
  return {
    section: kind,
    selected: { ...c.workspace.selected, [kind]: link.id },
  };
}
export function openObject(c: Campaign, link: ObjectLink) {
  changeWorkspace(c.id, objectWorkspace(c, link));
}

export function LinkChips({
  campaign: c,
  links,
  onRemove,
}: {
  campaign: Campaign;
  links: ObjectLink[];
  onRemove?: (index: number) => void;
}) {
  return (
    <div className="link-chips">
      {links.map((link, i) => (
        <span className="link-chip" key={`${linkKey(link)}:${i}`}>
          <button
            type="button"
            onClick={() => openObject(c, link)}
            title={`${kindLabels[link.kind]} 열기`}
          >
            {link.relation && <small>{link.relation} · </small>}
            {objectLabel(c, link)}
            {link.quantity && link.quantity > 1 ? ` ×${link.quantity}` : ''}
            <ArrowUpRight size={12} />
          </button>
          {onRemove && (
            <button
              type="button"
              aria-label={`${objectLabel(c, link)} 연결 해제`}
              onClick={() => onRemove(i)}
            >
              <X size={12} />
            </button>
          )}
        </span>
      ))}
    </div>
  );
}

export function LinkPicker({
  campaign: c,
  value,
  onChange,
  label = '대상 연결',
  kinds,
}: {
  campaign: Campaign;
  value: ObjectLink[];
  onChange: (links: ObjectLink[]) => void;
  label?: string;
  kinds?: ObjectKind[];
}) {
  const [open, setOpen] = useState(false),
    [query, setQuery] = useState(''),
    [relation, setRelation] = useState(''),
    [quantity, setQuantity] = useState(1);
  const candidates = objectLinks(c).filter(
    ({ link, label }) =>
      (!kinds || kinds.includes(link.kind)) &&
      !value.some((v) => linkKey(v) === linkKey(link)) &&
      `${kindLabels[link.kind]} ${label}`
        .toLocaleLowerCase()
        .includes(query.toLocaleLowerCase()),
  );
  return (
    <>
      <Button className="btn ghost small" onClick={() => setOpen(true)}>
        <Link2 size={14} />
        {label}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="chronicle-dialog">
          <DialogTitle>{label}</DialogTitle>
          <DialogDescription>이 캠페인의 기록을 연결합니다.</DialogDescription>
          <Input
            aria-label="연결할 기록 검색"
            placeholder="이름, 방 번호, 종류…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="record-grid">
            <label>
              관계{' '}
              <Input
                placeholder="방문, 만남, 회수… (선택)"
                value={relation}
                onChange={(e) => setRelation(e.target.value)}
              />
            </label>
            <label>
              수량{' '}
              <Input
                type="number"
                min={1}
                max={999999}
                value={quantity}
                onChange={(e) =>
                  setQuantity(
                    Math.max(
                      1,
                      Math.min(999999, Math.trunc(Number(e.target.value)) || 1),
                    ),
                  )
                }
              />
            </label>
          </div>
          <div className="link-picker-results">
            {candidates.slice(0, 60).map(({ link, label }) => (
              <button
                type="button"
                key={linkKey(link)}
                onClick={() => {
                  onChange([
                    ...value,
                    {
                      ...link,
                      ...(relation.trim() ? { relation: relation.trim() } : {}),
                      ...(quantity > 1 ? { quantity } : {}),
                    },
                  ]);
                  setOpen(false);
                  setQuery('');
                }}
              >
                <small>{kindLabels[link.kind]}</small>
                <strong>{label}</strong>
                <span>＋</span>
              </button>
            ))}
            {!candidates.length && <p>연결할 기록이 없습니다.</p>}
            {candidates.length > 60 && <p>검색어를 입력해 범위를 좁히세요.</p>}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function Backlinks({
  campaign,
  target,
}: {
  campaign: Campaign;
  target: ObjectLink;
}) {
  const [open, setOpen] = useState(false);
  const links = backlinks(campaign, target);
  return (
    <>
      <Button
        className="btn ghost small backlink-trigger"
        onClick={() => setOpen(true)}
      >
        <Link2 size={14} />
        등장하는 곳 {links.length} ›
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="chronicle-dialog">
          <DialogTitle>
            {objectLabel(campaign, target)} — 연결된 기록
          </DialogTitle>
          <DialogDescription>
            {links.length}곳에서 이 기록을 참조합니다.
          </DialogDescription>
          <div className="ledger-list">
            {links.map((b, i) => (
              <button
                type="button"
                className="ledger-row"
                key={i}
                onClick={() => {
                  openObject(campaign, b.link);
                  setOpen(false);
                }}
              >
                <span>
                  <strong>{b.label}</strong>
                  <small>{b.detail}</small>
                </span>
                <ArrowUpRight size={16} />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
