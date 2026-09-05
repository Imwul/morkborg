import { ContextReferences } from './ReferenceWorkbench';
import { Button } from '@/components/ui/button';
import type { Campaign, DungeonRoom, Dungeon } from '../domain/types';
import type {
  ObjectLink,
  RoomPlayState,
  DungeonPlayState,
  PlacementPlayState,
} from '../domain/chronicle';
import {
  setRoomState,
  setDungeonState,
  setPlacementState,
  linkToSession,
} from '../domain/chronicleOperations';
import { editCampaign } from '../storage/saveStore';
import { Backlinks } from './ChronicleLinks';
import { VisibilityFields, stateLabels } from './Chronicle';

export function RoomState({
  campaign: c,
  dungeonId,
  room,
}: {
  campaign: Campaign;
  dungeonId: string;
  room: DungeonRoom;
}) {
  return (
    <select
      className="play-state-control"
      aria-label={`${room.name || '방'} 탐사 상태`}
      value={room.playState ?? 'hidden'}
      onChange={(e) =>
        editCampaign(c.id, (next) =>
          setRoomState(
            next,
            dungeonId,
            room.id,
            e.target.value as RoomPlayState,
          ),
        )
      }
    >
      {(['hidden', 'discovered', 'visited', 'cleared'] as const).map(
        (state) => (
          <option key={state} value={state}>
            {stateLabels[state]}
          </option>
        ),
      )}
    </select>
  );
}
export function DungeonState({
  campaign: c,
  dungeon,
}: {
  campaign: Campaign;
  dungeon: Dungeon;
}) {
  return (
    <label className="dungeon-play-state">
      탐사{' '}
      <select
        className="play-state-control"
        aria-label="던전 탐사 상태"
        value={dungeon.playState ?? 'unknown'}
        onChange={(e) =>
          editCampaign(c.id, (next) =>
            setDungeonState(
              next,
              dungeon.id,
              e.target.value as DungeonPlayState,
            ),
          )
        }
      >
        {(
          ['unknown', 'discovered', 'active', 'cleared', 'abandoned'] as const
        ).map((state) => (
          <option key={state} value={state}>
            {stateLabels[state]}
          </option>
        ))}
      </select>
    </label>
  );
}
export function PlacementState({
  campaign: c,
  kind,
  placementId,
  value,
}: {
  campaign: Campaign;
  kind: 'monster' | 'npc' | 'encounter';
  placementId: string;
  value?: PlacementPlayState;
}) {
  return (
    <select
      className="play-state-control"
      aria-label="배치 상태"
      value={value ?? 'unknown'}
      onChange={(e) =>
        editCampaign(c.id, (next) =>
          setPlacementState(
            next,
            kind,
            placementId,
            e.target.value as PlacementPlayState,
          ),
        )
      }
    >
      {(
        [
          'unknown',
          'encountered',
          'defeated',
          'fled',
          'dead',
          'removed',
        ] as const
      ).map((state) => (
        <option key={state} value={state}>
          {stateLabels[state]}
        </option>
      ))}
    </select>
  );
}
export function ObjectPlayTools({ campaign: c }: { campaign: Campaign }) {
  const w = c.workspace;
  let target: ObjectLink | undefined;
  if (w.section === 'dungeons' && !w.dungeonPreview) {
    const d = c.dungeons.find((d) => d.id === w.dungeonId);
    const room =
      w.dungeonTab === 'rooms'
        ? d?.rooms.find((r) => r.id === w.roomId)
        : undefined;
    if (d)
      target = room
        ? { kind: 'room', id: room.id, dungeonId: d.id }
        : { kind: 'dungeon', id: d.id };
  }
  if (
    w.section === 'characters' &&
    c.characters.some((e) => e.id === w.selected.characters)
  )
    target = { kind: 'character', id: w.selected.characters! };
  if (
    w.section === 'monsters' &&
    c.monsters.some((e) => e.id === w.selected.monsters)
  )
    target = { kind: 'monster', id: w.selected.monsters! };
  if (w.section === 'npcs' && c.npcs.some((e) => e.id === w.selected.npcs))
    target = { kind: 'npc', id: w.selected.npcs! };
  if (
    w.section === 'encounters' &&
    c.encounters.some((e) => e.id === w.selected.encounters)
  )
    target = { kind: 'encounter', id: w.selected.encounters! };
  if (!target) return null;
  const link = target;
  const d = c.dungeons.find(
    (d) =>
      d.id ===
      (link.kind === 'room'
        ? link.dungeonId
        : link.kind === 'dungeon'
          ? link.id
          : null),
  );
  const record =
    link.kind === 'room'
      ? d?.rooms.find((r) => r.id === link.id)
      : link.kind === 'dungeon'
        ? d
        : link.kind === 'npc'
          ? c.npcs.find((e) => e.id === link.id)
          : link.kind === 'encounter'
            ? c.encounters.find((e) => e.id === link.id)
            : null;
  return (
    <>
      <ContextReferences
        context={
          link.kind === 'encounter'
            ? 'room'
            : (link.kind as
                | 'room'
                | 'monster'
                | 'npc'
                | 'dungeon'
                | 'character')
        }
        region={d?.region ?? c.workspace.monsterRegion ?? 'sarkash'}
      />
      <div className="object-play-strip">
        {link.kind === 'dungeon' && d && (
          <DungeonState campaign={c} dungeon={d} />
        )}{' '}
        {link.kind === 'room' && d && record && (
          <RoomState
            campaign={c}
            dungeonId={d.id}
            room={record as DungeonRoom}
          />
        )}
        <Backlinks campaign={c} target={link} />
        {c.currentSessionId && (
          <Button
            className="btn ghost small"
            onClick={() =>
              editCampaign(c.id, (next) =>
                linkToSession(next, next.currentSessionId!, link),
              )
            }
          >
            현재 세션에 연결
          </Button>
        )}
        {record && (
          <VisibilityFields
            value={record}
            onChange={(patch) =>
              editCampaign(c.id, (next) => {
                const nd = next.dungeons.find(
                  (d) =>
                    d.id === (link.kind === 'room' ? link.dungeonId : link.id),
                );
                const entity =
                  link.kind === 'room'
                    ? nd?.rooms.find((r) => r.id === link.id)
                    : link.kind === 'dungeon'
                      ? nd
                      : link.kind === 'npc'
                        ? next.npcs.find((e) => e.id === link.id)
                        : next.encounters.find((e) => e.id === link.id);
                if (entity) Object.assign(entity, patch);
              })
            }
          />
        )}
      </div>
    </>
  );
}
