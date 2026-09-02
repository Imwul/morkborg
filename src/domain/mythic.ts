import type { OracleResult } from './oracle';

export const FATE_ODDS = [
  { id: 'impossible', label: 'Impossible', modifier: -5 },
  { id: 'nearly-impossible', label: 'Nearly Impossible', modifier: -4 },
  { id: 'very-unlikely', label: 'Very Unlikely', modifier: -2 },
  { id: 'unlikely', label: 'Unlikely', modifier: -1 },
  { id: 'fifty-fifty', label: '50/50', modifier: 0 },
  { id: 'likely', label: 'Likely', modifier: 1 },
  { id: 'very-likely', label: 'Very Likely', modifier: 2 },
  { id: 'nearly-certain', label: 'Nearly Certain', modifier: 4 },
  { id: 'certain', label: 'Certain', modifier: 5 },
] as const;
export type FateOdds = (typeof FATE_ODDS)[number]['id'];
export type FateMethod = 'chart' | 'check';
export const FATE_ANSWERS = {
  'exceptional-yes': 'Exceptional Yes',
  yes: 'Yes',
  no: 'No',
  'exceptional-no': 'Exceptional No',
  expected: 'Expected Scene',
  altered: 'Altered Scene',
  interrupt: 'Interrupt Scene',
} as const;
export interface FateCell {
  exceptionalYes: number | null;
  yes: number;
  exceptionalNo: number | null;
}
export interface FateChart {
  schemaVersion: 1;
  sourcePage: 20;
  printedPage: 19;
  sourceVerified: true;
  rows: { odds: FateOdds; cells: FateCell[] }[];
}
export interface FateReading {
  id: string;
  createdAt: string;
  kind: 'fate' | 'scene';
  method: FateMethod | 'scene';
  question: string;
  odds: FateOdds;
  chaosFactor: number;
  dice: number[];
  total: number;
  modifier: number;
  answer: keyof typeof FATE_ANSWERS;
  randomEvent: boolean;
  input: 'random' | 'manual';
  event?: OracleResult;
}
export interface MythicState {
  chaosFactor: number;
  question: string;
  scene: string;
  odds: FateOdds;
  method: FateMethod;
  tab: 'fate' | 'scene';
  history: FateReading[];
}
export const defaultMythicState = (): MythicState => ({
  chaosFactor: 5,
  question: '',
  scene: '',
  odds: 'fifty-fifty',
  method: 'chart',
  tab: 'fate',
  history: [],
});
export const MYTHIC_HISTORY_LIMIT = 20;
export function rememberFate(state: MythicState, reading: FateReading): void {
  state.history = [reading, ...state.history].slice(0, MYTHIC_HISTORY_LIMIT);
}
