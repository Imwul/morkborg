import type { AttackPreview, CombatFrame } from './combatTool';
import type { ReferenceEntry } from './references';
import type { ReferenceRelationshipIndex } from './referenceRelationships';

/** Tool-local rule shortcuts. These are not additions to the canonical graph. */
export const COMBAT_RULE_SHORTCUTS = {
  broken: 'rule:core.broken',
  critical: 'rule:core.crit-fumble',
  morale: 'rule:core.reaction-morale',
} as const;
export interface CombatContextReference {
  id: string;
  label: string;
  reason: string;
  evidence: 'tool-rule' | 'relatedIds' | 'procedure';
  sourceId?: string;
}
export function combatRelevantReferences(
  frame: CombatFrame,
  pending: AttackPreview | null,
  byId: Record<string, ReferenceEntry>,
  relationships?: ReferenceRelationshipIndex,
): CombatContextReference[] {
  const result: CombatContextReference[] = [];
  const add = (r: CombatContextReference) => {
    if (byId[r.id]?.available && !result.some((v) => v.id === r.id))
      result.push(r);
  };
  if (frame.fighters.some((f) => f.side === 'pc' && f.hp !== null && f.hp <= 0))
    add({
      id: COMBAT_RULE_SHORTCUTS.broken,
      label: 'Broken · HP 0 이하',
      reason: '0 HP와 음수 HP의 처리 차이',
      evidence: 'tool-rule',
    });
  const preview = pending?.basis === JSON.stringify(frame) ? pending : null;
  const event = preview
    ? {
        kind: 'attack' as const,
        natural: preview.dice.find((d) => d.key === 'test')?.values[0],
        defence:
          frame.fighters.find((f) => f.id === preview.request.attackerId)
            ?.side === 'enemy',
        neutralized: preview.request.omen === 'neutralize',
      }
    : frame.event;
  if (
    event?.kind === 'attack' &&
    !event.neutralized &&
    (event.natural === 20 || event.natural === 1)
  )
    add({
      id: COMBAT_RULE_SHORTCUTS.critical,
      label: `${event.defence ? '방어' : '공격'} ${event.natural === 20 ? '치명타' : '실수'}`,
      reason: `자연 ${event.natural} · 효과는 직접 처리`,
      evidence: 'tool-rule',
    });
  const enemies = frame.fighters.filter((f) => f.side === 'enemy');
  const live = enemies.filter((f) => f.active && (f.hp === null || f.hp > 0));
  const down = enemies.filter((f) => f.hp !== null && f.hp <= 0);
  const lone =
    enemies.length === 1 &&
    live[0]?.hp !== null &&
    live[0]?.maxHp != null &&
    live[0].hp! <= live[0].maxHp / 3;
  const half =
    enemies.length >= 2 &&
    live.length > 0 &&
    down.length >= Math.ceil(enemies.length / 2);
  if ((lone || half) && live.some((f) => f.morale !== null))
    add({
      id: COMBAT_RULE_SHORTCUTS.morale,
      label: 'Morale · 사기',
      reason: lone
        ? '단독 적의 HP가 ⅓ 이하'
        : '등록한 적 무리의 절반 이상이 HP 0 이하 · 실제 무리인지 확인',
      evidence: 'tool-rule',
    });
  if (
    frame.event?.kind === 'morale' &&
    frame.event.outcome !== 'held' &&
    frame.fighters.some(
      (f) =>
        f.id === (frame.event as { fighterId: string }).fighterId && !f.active,
    )
  )
    add({
      id: COMBAT_RULE_SHORTCUTS.morale,
      label: 'Morale · 도주·항복',
      reason: '직접 실행한 사기 판정의 원문',
      evidence: 'tool-rule',
    });
  // Only exact, already-declared edges from an imported creature. Inactive is not a corpse.
  for (const fighter of down) {
    const source = fighter.sourceReferenceId
      ? byId[fighter.sourceReferenceId]
      : undefined;
    if (!source?.available || source.kind !== 'creature') continue;
    for (const [id, label] of [
      ['oracle:core.corpsePlundering', '시체 수색'],
      ['oracle:core.treasures', '보물'],
    ] as const) {
      const explicit = source.relatedIds.includes(id);
      const procedure = relationships?.bySource[source.id]?.some(
        (e) => e.targetId === id && e.kind === 'USES',
      );
      if (explicit || procedure)
        add({
          id,
          label,
          reason: `${fighter.name}의 기존 관련 참조 · 수색 여부는 직접 결정`,
          evidence: explicit ? 'relatedIds' : 'procedure',
          sourceId: source.id,
        });
    }
  }
  return result.slice(0, 3);
}
