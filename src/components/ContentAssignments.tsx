import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type {
  Campaign,
  ContentKind,
  Dungeon,
  DungeonRoom,
  MonsterTarget,
} from '../domain/types';
import { editCampaign, changeWorkspace } from '../storage/saveStore';
import {
  addContentPlacement,
  beginContentDraft,
  contentPlacementKey,
  editContentPlacement,
  removeContentPlacement,
} from '../domain/contentOperations';
import {
  addMonsterPlacement,
  beginMonsterDraft,
  editMonsterPlacement,
  removeMonsterPlacement,
} from '../domain/monsterOperations';
import { QuantityControl, RoomSelector } from './MonsterAssignments';
type Kind = ContentKind | 'monsters';
export const contentLabels: Record<Kind, string> = {
  monsters: '몬스터',
  npcs: 'NPC',
  encounters: '조우',
};
export function contentTitle(entity: { name: string; text?: string }) {
  return entity.name || entity.text || 'Untitled';
}
export function openPlacedContent(
  c: Campaign,
  kind: Kind,
  entityId: string,
  target?: MonsterTarget,
) {
  changeWorkspace(c.id, {
    section: kind,
    selected: { ...c.workspace.selected, [kind]: entityId },
    ...(kind === 'monsters'
      ? { monsterTarget: target ?? null }
      : { contentTarget: target ?? null }),
  });
}
export function placementCaption(c: Campaign, kind: Kind, entityId: string) {
  const ps =
    kind === 'monsters'
      ? c.monsterPlacements.filter((p) => p.monsterId === entityId)
      : c[contentPlacementKey(kind)].filter((p) => p.entityId === entityId);
  if (!ps.length) return '배치 없음';
  const p = ps[0],
    d = c.dungeons.find((d) => d.id === p.dungeonId);
  const roomIndex = d?.rooms.findIndex((r) => r.id === p.roomId) ?? -1;
  return (
    [d?.title, roomIndex >= 0 ? 'Room ' + (roomIndex + 1) : 'Dungeon only']
      .filter(Boolean)
      .join(' / ') + (ps.length > 1 ? ' · +' + (ps.length - 1) : '')
  );
}
export function ContentPlacementRows({
  campaign: c,
  kind,
  dungeonId,
  roomId,
  entityId,
  placementIds,
}: {
  campaign: Campaign;
  kind: Kind;
  dungeonId?: string;
  roomId?: string | null;
  entityId?: string;
  placementIds?: string[];
}) {
  const ps = (
    kind === 'monsters'
      ? c.monsterPlacements.map((p) => ({ ...p, entityId: p.monsterId }))
      : c[contentPlacementKey(kind)]
  ).filter(
    (p) =>
      (!dungeonId || p.dungeonId === dungeonId) &&
      (roomId === undefined || p.roomId === roomId) &&
      (!entityId || p.entityId === entityId) &&
      (!placementIds || placementIds.includes(p.id)),
  );
  return (
    <div className="content-placement-rows">
      {ps.map((p) => {
        const entity = c[kind].find((e) => e.id === p.entityId),
          d = c.dungeons.find((d) => d.id === p.dungeonId);
        if (!entity || !d) return null;
        const roomIndex = d.rooms.findIndex((r) => r.id === p.roomId);
        const title = contentTitle(entity);
        const edit = (patch: {
          roomId?: string | null;
          quantity?: number;
          notes?: string;
        }) =>
          editCampaign(c.id, (next) => {
            if (kind === 'monsters') editMonsterPlacement(next, p.id, patch);
            else editContentPlacement(next, kind, p.id, patch);
          });
        return (
          <article
            className="content-placement-row"
            key={p.id}
            data-placement-id={p.id}
          >
            <button
              className="content-entry"
              onClick={() =>
                openPlacedContent(c, kind, entity.id, {
                  dungeonId: d.id,
                  roomId: p.roomId,
                })
              }
            >
              <strong>
                {p.quantity > 1 ? p.quantity + ' × ' : ''}
                {title}
              </strong>
              <small>
                {roomIndex >= 0 ? 'Room ' + (roomIndex + 1) : 'Dungeon only'}
                {!dungeonId ? ' · ' + d.title : ''}
              </small>
            </button>
            <details className="placement-disclosure">
              <summary aria-label={title + ' 배치 관리'}>배치 관리</summary>
              <div className="placement-edit">
                <RoomSelector
                  dungeon={d}
                  value={p.roomId}
                  onChange={(roomId) => edit({ roomId })}
                />
                <QuantityControl
                  value={p.quantity}
                  onChange={(quantity) => edit({ quantity })}
                />
                <label htmlFor={p.id + '-notes'}>
                  배치 메모
                  <Textarea
                    id={p.id + '-notes'}
                    aria-label={title + ' 배치 메모'}
                    rows={2}
                    value={p.notes}
                    onChange={(e) => edit({ notes: e.target.value })}
                  />
                </label>
                <Button
                  className="btn small danger"
                  onClick={() =>
                    editCampaign(c.id, (next) =>
                      kind === 'monsters'
                        ? removeMonsterPlacement(next, p.id)
                        : removeContentPlacement(next, kind, p.id),
                    )
                  }
                >
                  이 배치 제거
                </Button>
              </div>
            </details>
          </article>
        );
      })}
    </div>
  );
}
export function RoomContents({
  campaign: c,
  dungeon: d,
  room,
  notify,
  only,
}: {
  campaign: Campaign;
  dungeon: Dungeon;
  room?: DungeonRoom;
  notify: (text: string) => void;
  only?: Kind;
}) {
  const [adding, setAdding] = useState(false),
    [kind, setKind] = useState<Kind>(only ?? 'monsters');
  const [entityId, setEntityId] = useState(''),
    [quantity, setQuantity] = useState(1);
  const [roomId, setRoomId] = useState<string | null>(room?.id ?? null);
  const target = { dungeonId: d.id, roomId };
  const kinds: Kind[] = only ? [only] : ['monsters', 'npcs', 'encounters'];
  const count = (kind: Kind) =>
    (kind === 'monsters'
      ? c.monsterPlacements
      : c[contentPlacementKey(kind)]
    ).filter((p) => p.dungeonId === d.id && (!room || p.roomId === room.id))
      .length;
  return (
    <section
      className="room-contents"
      aria-label={
        room
          ? 'Room ' + (d.rooms.indexOf(room) + 1) + ' Contents'
          : 'Dungeon Contents'
      }
    >
      <div className="section-title">
        <h2>{only ? contentLabels[only] : 'Contents'}</h2>
        <Button
          className="btn small"
          onClick={() => {
            setAdding(true);
            setEntityId('');
            setQuantity(1);
            setKind(only ?? 'monsters');
            setRoomId(room?.id ?? null);
          }}
        >
          Add Content
        </Button>
      </div>
      <div className="contents-counts">
        {kinds.map((k) => (
          <span key={k}>
            {contentLabels[k]} {count(k)}
          </span>
        ))}
      </div>
      {kinds.map(
        (k) =>
          count(k) > 0 && (
            <div className="contents-group" key={k}>
              {!only && <h3>{contentLabels[k]}</h3>}
              <ContentPlacementRows
                campaign={c}
                kind={k}
                dungeonId={d.id}
                roomId={room?.id}
              />
            </div>
          ),
      )}
      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent className="codex-dialog add-content-dialog">
          <DialogTitle>Add Content</DialogTitle>
          <DialogDescription>
            {d.title}
            {room ? ' / Room ' + (d.rooms.indexOf(room) + 1) : ' / Dungeon'}
          </DialogDescription>
          <label>
            종류
            <select
              aria-label="콘텐츠 종류"
              value={kind}
              onChange={(e) => {
                setKind(e.target.value as Kind);
                setEntityId('');
              }}
            >
              {(only
                ? [only]
                : (['monsters', 'npcs', 'encounters'] as const)
              ).map((k) => (
                <option value={k} key={k}>
                  {contentLabels[k]}
                </option>
              ))}
            </select>
          </label>
          {!room && (
            <RoomSelector dungeon={d} value={roomId} onChange={setRoomId} />
          )}
          <Button
            className="btn primary"
            onClick={() => {
              editCampaign(c.id, (next) =>
                kind === 'monsters'
                  ? beginMonsterDraft(next, target)
                  : beginContentDraft(next, kind, target, true),
              );
              setAdding(false);
            }}
          >
            새 {contentLabels[kind]}
            {kind === 'monsters' ? ' 생성' : ''}
          </Button>
          <div className="add-existing-content">
            <label>
              기존 항목
              <select
                aria-label={'기존 ' + contentLabels[kind] + ' 선택'}
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
              >
                <option value="">보관함에서 선택</option>
                {c[kind].map((e) => (
                  <option key={e.id} value={e.id}>
                    {contentTitle(e)}
                  </option>
                ))}
              </select>
            </label>
            {entityId && (
              <QuantityControl value={quantity} onChange={setQuantity} />
            )}
            <Button
              className="btn"
              disabled={!entityId}
              onClick={() => {
                try {
                  editCampaign(c.id, (next) =>
                    kind === 'monsters'
                      ? addMonsterPlacement(next, entityId, target, quantity)
                      : addContentPlacement(
                          next,
                          kind,
                          entityId,
                          target,
                          quantity,
                        ),
                  );
                  setAdding(false);
                  notify('선택한 항목을 배치했습니다.');
                } catch (e) {
                  notify(e instanceof Error ? e.message : '배치를 확인하세요.');
                }
              }}
            >
              선택한 항목 배치
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
