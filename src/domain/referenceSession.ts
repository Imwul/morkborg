import type { ReferenceReading } from './referenceReading';
export interface RecentReferenceRoll {
  sequence: number;
  referenceId: string;
  reading: ReferenceReading;
}
export interface ReferenceSession {
  sequence: number;
  readings: Record<string, ReferenceReading>;
  rolls: RecentReferenceRoll[];
}
export const emptyReferenceSession = (): ReferenceSession => ({
  sequence: 0,
  readings: {},
  rolls: [],
});
/** Only this tab's last six results and twenty inspected readings; never Campaign JSON. */
export function retainReferenceReading(
  state: ReferenceSession,
  referenceId: string,
  reading: ReferenceReading,
  rolled = true,
): ReferenceSession {
  const readings = Object.fromEntries(
    [
      ...Object.entries(state.readings).filter(([id]) => id !== referenceId),
      [referenceId, reading],
    ].slice(-20),
  );
  const sequence = state.sequence + 1;
  return {
    sequence,
    readings,
    rolls: rolled
      ? [{ sequence, referenceId, reading }, ...state.rolls].slice(0, 6)
      : state.rolls,
  };
}
export function restoreReferenceRoll(
  state: ReferenceSession,
  sequence: number,
): ReferenceSession {
  const roll = state.rolls.find((item) => item.sequence === sequence);
  return roll
    ? retainReferenceReading(state, roll.referenceId, roll.reading, false)
    : state;
}

/** A private pack replacement can remove a table while this tab retains old roll snapshots. */
export function availableRecentRolls(
  state: ReferenceSession,
  entries: Record<string, unknown>,
) {
  return state.rolls.filter((item) => !!entries[item.referenceId]);
}
