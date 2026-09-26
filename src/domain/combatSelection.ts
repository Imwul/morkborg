import type { CombatFrame } from './combatTool';
export interface CombatAttackSettings {
  targetId: string;
  style: 'melee' | 'ranged';
  dr: string;
  bonus: string;
}
export const emptyAttackSettings = (): CombatAttackSettings => ({
  targetId: '',
  style: 'melee',
  dr: '12',
  bonus: '0',
});
/** Invalid selections become empty; never pick the next combatant for the player. */
export function combatSelection(
  frame: CombatFrame,
  attackerId: string,
  targetId: string,
) {
  const attacker = frame.fighters.find((f) => f.id === attackerId && f.active);
  const targets = frame.fighters.filter(
    (f) => f.active && f.side !== attacker?.side,
  );
  const target = attacker ? targets.find((f) => f.id === targetId) : undefined;
  return { attacker, target, targets: attacker ? targets : [] };
}

export function attackSettingsFor(
  profiles: Record<string, CombatAttackSettings>,
  attackerId: string,
): CombatAttackSettings {
  return { ...(profiles[attackerId] ?? emptyAttackSettings()) };
}
