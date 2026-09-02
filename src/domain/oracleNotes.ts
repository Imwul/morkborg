import type { Campaign } from './types';
import type { OracleResult } from './oracle';
import { now } from '../generators/random';
export type NotesTarget = { campaignId: string } & (
  | { kind: 'campaign' }
  | { kind: 'dungeon'; id: string }
  | { kind: 'room'; id: string; dungeonId: string }
  | { kind: 'character' | 'monster'; id: string }
);
export function notesTargetKey(target: NotesTarget): string {
  return `${target.kind}:${'id' in target ? target.id : target.campaignId}`;
}
export function notesDestinations(
  c: Campaign,
): { target: NotesTarget; label: string }[] {
  return [
    { target: { kind: 'campaign', campaignId: c.id }, label: '캠페인 노트' },
    ...c.dungeons.flatMap((d) => [
      {
        target: { kind: 'dungeon', campaignId: c.id, id: d.id } as NotesTarget,
        label: `던전 · ${d.title}`,
      },
      ...d.rooms.map((r, i) => ({
        target: {
          kind: 'room',
          campaignId: c.id,
          dungeonId: d.id,
          id: r.id,
        } as NotesTarget,
        label: `${d.title} / 방 ${i + 1} · ${r.name}`,
      })),
    ]),
    ...c.characters.map((ch) => ({
      target: { kind: 'character', campaignId: c.id, id: ch.id } as NotesTarget,
      label: `캐릭터 · ${ch.name}`,
    })),
    ...c.monsters.map((m) => ({
      target: { kind: 'monster', campaignId: c.id, id: m.id } as NotesTarget,
      label: `몬스터 · ${m.name}`,
    })),
  ];
}
export function contextNotesTarget(c: Campaign): NotesTarget {
  const w = c.workspace;
  if (w.section === 'dungeons' && !w.dungeonPreview) {
    const d = c.dungeons.find((d) => d.id === w.dungeonId);
    if (d) {
      const room =
        w.dungeonTab === 'rooms' && d.rooms.find((r) => r.id === w.roomId);
      return room
        ? { kind: 'room', campaignId: c.id, dungeonId: d.id, id: room.id }
        : { kind: 'dungeon', campaignId: c.id, id: d.id };
    }
  }
  if (
    w.section === 'characters' &&
    c.characters.some((ch) => ch.id === w.selected.characters)
  )
    return { kind: 'character', campaignId: c.id, id: w.selected.characters! };
  if (
    w.section === 'monsters' &&
    c.monsters.some((m) => m.id === w.selected.monsters)
  )
    return { kind: 'monster', campaignId: c.id, id: w.selected.monsters! };
  return { kind: 'campaign', campaignId: c.id };
}
export function formatOracleNotes(
  result: OracleResult,
  includeSource = true,
): string {
  return `[Oracle: ${result.title}]\n${result.rolls.map((r) => `${result.rolls.length > 1 ? r.title + ': ' : ''}${r.text} [${r.dice}: ${r.roll}]`).join('\n')}${includeSource ? '\nSource: ' + [...new Set(result.rolls.map((r) => r.source))].join('\nSource: ') : ''}`;
}
export function appendOracleNotes(
  c: Campaign,
  target: NotesTarget,
  result: OracleResult,
  includeSource = true,
): void {
  if (c.id !== target.campaignId)
    throw new Error('다른 캠페인의 노트에 추가할 수 없습니다.');
  const d =
    target.kind === 'dungeon' || target.kind === 'room'
      ? c.dungeons.find(
          (d) =>
            d.id === (target.kind === 'room' ? target.dungeonId : target.id),
        )
      : undefined;
  const record =
    target.kind === 'campaign'
      ? c
      : target.kind === 'dungeon'
        ? d
        : target.kind === 'room'
          ? d?.rooms.find((r) => r.id === target.id)
          : target.kind === 'character'
            ? c.characters.find((ch) => ch.id === target.id)
            : c.monsters.find((m) => m.id === target.id);
  if (!record)
    throw new Error('노트를 추가할 대상이 더 이상 존재하지 않습니다.');
  if (!result.rolls.length) throw new Error('먼저 결과를 굴리세요.');
  record.notes += `${record.notes ? '\n\n' : ''}${formatOracleNotes(result, includeSource)}`;
  if ('updatedAt' in record) record.updatedAt = now();
  if (d) d.updatedAt = now();
  c.updatedAt = now();
}
