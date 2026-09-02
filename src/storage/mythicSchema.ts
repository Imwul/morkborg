import { z } from 'zod';
import { FATE_ODDS, MYTHIC_HISTORY_LIMIT } from '../domain/mythic';
const odds = z.enum(FATE_ODDS.map((o) => o.id));
const event = z.object({
  id: z.uuid(),
  title: z.string(),
  rolls: z
    .array(
      z.object({
        oracleId: z.string(),
        title: z.string(),
        dice: z.string(),
        roll: z.number().int(),
        diceValues: z.array(z.number().int()),
        entryId: z.string().nullable(),
        text: z.string(),
        source: z.string(),
        metadata: z.record(z.string(), z.unknown()).optional(),
      }),
    )
    .min(1)
    .max(3),
});
const reading = z
  .object({
    id: z.uuid(),
    createdAt: z.iso.datetime(),
    kind: z.enum(['fate', 'scene']),
    method: z.enum(['chart', 'check', 'scene']),
    question: z.string(),
    odds,
    chaosFactor: z.number().int().min(1).max(9),
    dice: z.array(z.number().int().min(1).max(100)).min(1).max(2),
    total: z.number().int().min(-8).max(100),
    modifier: z.number().int().min(-10).max(10),
    answer: z.enum([
      'yes',
      'no',
      'exceptional-yes',
      'exceptional-no',
      'expected',
      'altered',
      'interrupt',
    ]),
    randomEvent: z.boolean(),
    input: z.enum(['random', 'manual']),
    event: event.optional(),
  })
  .refine((r) => {
    const scene = ['expected', 'altered', 'interrupt'].includes(r.answer);
    if ((r.kind === 'scene') !== scene || (r.method === 'scene') !== scene)
      return false;
    if (r.method === 'check')
      return (
        r.dice.length === 2 &&
        r.dice.every((d) => d <= 10) &&
        r.total === r.dice[0] + r.dice[1] + r.modifier
      );
    return (
      r.dice.length === 1 &&
      r.total === r.dice[0] &&
      r.modifier === 0 &&
      (r.method !== 'scene' || r.dice[0] <= 10)
    );
  }, '판정 방식과 주사위 기록이 일치하지 않습니다.');
export const mythicStateSchema = z
  .object({
    chaosFactor: z.number().int().min(1).max(9),
    question: z.string(),
    scene: z.string(),
    odds,
    method: z.enum(['chart', 'check']),
    tab: z.enum(['fate', 'scene']),
    history: z.array(reading).max(MYTHIC_HISTORY_LIMIT),
  })
  .refine(
    (s) => new Set(s.history.map((r) => r.id)).size === s.history.length,
    '판정 기록 ID가 중복됩니다.',
  );
