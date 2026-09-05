import type { Campaign } from './types';
import type { ObjectLink } from './chronicle';

export type CaptureKind =
  | 'event'
  | 'npc'
  | 'rumor'
  | 'relic'
  | 'note'
  | 'death';
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
