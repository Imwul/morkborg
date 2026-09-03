import { ContentPlacementRows } from './ContentAssignments';
import { useState } from 'react';
import { Minus, Plus, Skull } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import type {
  Campaign,
  Dungeon,
  DungeonRoom,
  MonsterPlacement,
} from '../domain/types';
import { editCampaign } from '../storage/saveStore';
import {
  addMonsterPlacement,
  beginMonsterDraft,
} from '../domain/monsterOperations';
import { useRules } from '../storage/rulesStore';

export function QuantityControl({
  value,
  onChange,
  label = '수량',
}: {
  value: number;
  onChange: (n: number) => void;
  label?: string;
}) {
  return (
    <label className="quantity-field">
      {label}
      <span className="quantity-control">
        <Button
          type="button"
          className="icon-btn"
          aria-label={`${label} 감소`}
          disabled={value <= 1}
          onClick={() => onChange(value - 1)}
        >
          <Minus size={15} />
        </Button>
        <Input
          type="number"
          aria-label={label}
          min={1}
          max={999999}
          value={value}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (Number.isFinite(n))
              onChange(Math.max(1, Math.min(999999, Math.trunc(n))));
          }}
        />
        <Button
          type="button"
          className="icon-btn"
          aria-label={`${label} 증가`}
          disabled={value >= 999999}
          onClick={() => onChange(value + 1)}
        >
          <Plus size={15} />
        </Button>
      </span>
    </label>
  );
}
export function RoomSelector({
  dungeon: d,
  value,
  onChange,
  label = '배치 위치',
}: {
  dungeon: Dungeon;
  value: string | null;
  onChange: (id: string | null) => void;
  label?: string;
}) {
  return (
    <label className="placement-location">
      {label}
      <select
        aria-label={label}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
      >
        <option value="">Dungeon only · 방 미지정</option>
        {d.rooms.map((r, i) => (
          <option key={r.id} value={r.id}>
            Room {i + 1} — {r.name || '이름 없는 방'}
          </option>
        ))}
      </select>
    </label>
  );
}
export function PlacementList({
  campaign: c,
  placements,
}: {
  campaign: Campaign;
  placements: MonsterPlacement[];
}) {
  return (
    <ContentPlacementRows
      campaign={c}
      kind="monsters"
      placementIds={placements.map((p) => p.id)}
    />
  );
}

export function DungeonMonsters({
  campaign: c,
  dungeon: d,
  room,
  notify,
}: {
  campaign: Campaign;
  dungeon: Dungeon;
  room?: DungeonRoom;
  notify: (text: string) => void;
}) {
  const rules = useRules();
  const [adding, setAdding] = useState(false),
    [monsterId, setMonsterId] = useState('');
  const [roomId, setRoomId] = useState<string | null>(room?.id ?? null);
  const [quantity, setQuantity] = useState(1),
    [notes, setNotes] = useState('');
  const placements = c.monsterPlacements.filter(
    (p) => p.dungeonId === d.id && (!room || p.roomId === room.id),
  );
  function open() {
    setMonsterId('');
    setRoomId(room?.id ?? null);
    setQuantity(1);
    setNotes('');
    setAdding(true);
  }
  function create() {
    editCampaign(c.id, (next) =>
      beginMonsterDraft(next, { dungeonId: d.id, roomId }, !rules.pack),
    );
    setAdding(false);
  }
  return (
    <section className="dungeon-monsters">
      <div className="section-title">
        <h2>
          몬스터 <span className="muted">{placements.length}</span>
        </h2>
        <Button className="btn" onClick={open}>
          <Plus size={15} />
          몬스터 추가
        </Button>
      </div>
      <PlacementList campaign={c} placements={placements} />
      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent className="codex-dialog monster-placement-dialog">
          <DialogTitle>몬스터 배치</DialogTitle>
          <DialogDescription>
            {d.title}
            {room ? ` / Room ${d.rooms.indexOf(room) + 1}` : ''} · 보관함의
            몬스터를 참조합니다.
          </DialogDescription>
          <label className="placement-location">
            Campaign Monster
            <select
              aria-label="기존 몬스터 선택"
              value={monsterId}
              onChange={(e) => setMonsterId(e.target.value)}
            >
              <option value="">보관함에서 선택</option>
              {c.monsters.map((m) => (
                <option value={m.id} key={m.id}>
                  {m.name || 'Unnamed Monster'} · HP {m.hp}
                </option>
              ))}
            </select>
          </label>
          <RoomSelector dungeon={d} value={roomId} onChange={setRoomId} />
          <QuantityControl value={quantity} onChange={setQuantity} />
          <label
            className="placement-note"
            htmlFor={`new-placement-notes-${d.id}`}
          >
            배치 메모
            <Textarea
              id={`new-placement-notes-${d.id}`}
              aria-label="새 배치 메모"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
          <Button
            className="btn primary"
            disabled={!monsterId}
            onClick={() => {
              try {
                editCampaign(c.id, (next) =>
                  addMonsterPlacement(
                    next,
                    monsterId,
                    { dungeonId: d.id, roomId },
                    quantity,
                    notes,
                  ),
                );
                setAdding(false);
                notify('몬스터를 배치했습니다. 원본 정의를 함께 참조합니다.');
              } catch (e) {
                notify(
                  e instanceof Error ? e.message : '배치를 확인해 주세요.',
                );
              }
            }}
          >
            <Plus size={15} />
            선택한 몬스터 배치
          </Button>
          <div className="placement-new">
            <p>
              {c.drafts.monsters
                ? '저장 전 후보를 이어서 편집할 수 있습니다.'
                : '새 몬스터를 생성한 뒤 이 위치에 저장하고 배치하세요.'}
            </p>
            <Button className="btn" onClick={create}>
              <Skull size={15} />
              {c.drafts.monsters ? '몬스터 후보 이어서 편집' : '새 몬스터 생성'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
