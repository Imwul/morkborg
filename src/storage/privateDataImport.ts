import {
  getRules,
  loadRules,
  parseRulesPack,
  setRules,
  type RulesPack,
} from './rulesStore';
import {
  getOraclePack,
  loadOraclePack,
  parseOraclePack,
  setOraclePack,
} from './oracleStore';
import {
  getFateChart,
  loadFateChart,
  parseFateChart,
  setFateChart,
} from './fateChartStore';
import { writePrivateData, type PrivateData } from './privateData';
import type { OraclePack } from '../domain/oracle';
import type { FateChart } from '../domain/mythic';
import { buildOracleRegistry } from '../data/oracles';
import { validateOracleRegistry } from '../validation/oracleValidation';

export type ParsedPrivateData = Partial<{
  library: RulesPack;
  oracles: OraclePack;
  fateChart: FateChart;
}>;
export function parsePrivateData(input: unknown): ParsedPrivateData {
  if (
    !input ||
    typeof input !== 'object' ||
    !('schemaVersion' in input) ||
    input.schemaVersion !== 1
  )
    throw new Error(
      '지원하지 않는 개인 자료 JSON입니다. PDF나 캠페인 백업과 구분해 주세요.',
    );
  if ('kind' in input && input.kind === 'morkborg-private-data') {
    const data: ParsedPrivateData = {};
    if ('library' in input) data.library = parseRulesPack(input.library);
    if ('oracles' in input) data.oracles = parseOraclePack(input.oracles);
    if ('fateChart' in input) data.fateChart = parseFateChart(input.fateChart);
    if (!Object.keys(data).length)
      throw new Error('개인 자료 묶음이 비어 있습니다.');
    return data;
  }
  if ('rows' in input) return { fateChart: parseFateChart(input) };
  if ('procedures' in input) return { oracles: parseOraclePack(input) };
  if ('tables' in input && !Array.isArray(input.tables))
    return { library: parseRulesPack(input) };
  throw new Error('룰북·Oracle·Fate Chart 자료 JSON을 선택하세요.');
}

export async function importPrivateData(
  inputs: unknown[],
  persist: (data: PrivateData) => Promise<void> = writePrivateData,
): Promise<ParsedPrivateData> {
  const merged: ParsedPrivateData = {};
  for (const input of inputs) {
    const parsed = parsePrivateData(input);
    if (Object.keys(parsed).some((key) => key in merged))
      throw new Error(
        '같은 종류의 자료를 두 번 선택했습니다. 종류별 파일 하나씩 선택하세요.',
      );
    Object.assign(merged, parsed);
  }
  if (!Object.keys(merged).length) throw new Error('자료 파일을 선택하세요.');
  const registry = buildOracleRegistry(
    merged.library ?? getRules(),
    merged.oracles ?? getOraclePack(),
  );
  const issues = validateOracleRegistry(registry);
  if (issues.length)
    throw new Error(
      'Oracle 자료를 확인하세요: ' + issues.slice(0, 3).join('; '),
    );
  await persist(merged);
  if (merged.library) setRules(merged.library);
  if (merged.oracles) setOraclePack(merged.oracles);
  if (merged.fateChart) setFateChart(merged.fateChart);
  return merged;
}

export async function exportPrivateData() {
  await Promise.allSettled([loadRules(), loadOraclePack(), loadFateChart()]);
  const library = getRules(),
    oracles = getOraclePack(),
    fateChart = getFateChart();
  if (!library && !oracles && !fateChart)
    throw new Error('먼저 개인 자료를 가져오세요.');
  return {
    kind: 'morkborg-private-data',
    schemaVersion: 1,
    ...(library ? { library } : {}),
    ...(oracles ? { oracles } : {}),
    ...(fateChart ? { fateChart } : {}),
  };
}
