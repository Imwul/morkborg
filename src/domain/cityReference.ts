import type {
  OracleDefinition,
  OracleRegistry,
  OracleResult,
  OracleRoll,
} from './oracle';
import { id, random, rollDie, type RandomSource } from '../generators/random';
import { rollOracle, sourceLabel } from '../generators/oracleRoller';

export interface CityReferenceInput {
  procedureId: 'aitc.street' | 'aitc.notable-artefact-type';
  cityOrMetropolis?: boolean;
  includeExits?: boolean;
}

function requireTable(
  registry: OracleRegistry,
  tableId: string,
  dice: string,
): OracleDefinition {
  const table = registry.tables.find((t) => t.id === tableId);
  if (!table) throw new Error(`연결된 원문 표가 없습니다: ${tableId}`);
  if (
    table.sourceBookId !== 'aitc' ||
    !table.sourceVerified ||
    table.rollable === false ||
    table.dice !== dice
  )
    throw new Error(`도시 절차의 원문과 주사위를 확인하세요: ${tableId}`);
  return table;
}

function withProcedureNotes(
  roll: OracleRoll,
  table: OracleDefinition,
): OracleRoll {
  return {
    ...roll,
    metadata: {
      ...roll.metadata,
      ...(table.description ? { procedureNote: table.description } : {}),
    },
  };
}

/** Source-specific branching only; follow-up encounters and effects stay manual. */
export function rollCityReference(
  input: CityReferenceInput,
  registry: OracleRegistry,
  rng: RandomSource = random,
): OracleResult {
  const rollTable = (tableId: string, dice: string) => {
    const table = requireTable(registry, tableId, dice);
    return withProcedureNotes(rollOracle(table, registry, rng), table);
  };
  if (input.procedureId === 'aitc.street') {
    const adjective = requireTable(registry, 'aitc.street-adjective', 'd20');
    const type = requireTable(registry, 'aitc.street-type', 'd12');
    const contents = requireTable(registry, 'aitc.street-contents', 'd12');
    const exits = input.includeExits
      ? requireTable(registry, 'aitc.street-exits', 'd4')
      : null;
    const rolls: OracleRoll[] = [
      rollOracle(adjective, registry, rng),
      rollOracle(type, registry, rng),
    ];
    const count = input.cityOrMetropolis ? rollDie(2, rng) : 1;
    if (input.cityOrMetropolis)
      rolls.push({
        oracleId: 'aitc.street.contents-count',
        title: '거리 내용 · 개수',
        dice: 'd2',
        roll: count,
        diceValues: [count],
        entryId: null,
        text: `도시 / 대도시: 거리 내용 ${count}개.`,
        source: sourceLabel(contents, registry),
        metadata: {
          sourceTableId: contents.id,
          procedureId: input.procedureId,
          conditionalCount: true,
          procedureNote: contents.description,
        },
      });
    for (let index = 0; index < count; index++) {
      const rolled = withProcedureNotes(
        rollOracle(contents, registry, rng),
        contents,
      );
      rolls.push({
        ...rolled,
        title:
          count > 1 ? `${rolled.title} · ${index + 1}/${count}` : rolled.title,
        metadata: {
          ...rolled.metadata,
          contentsCount: count,
          contentsIndex: index + 1,
          cityOrMetropolis: !!input.cityOrMetropolis,
        },
      });
    }
    if (exits) rolls.push(rollOracle(exits, registry, rng));
    return {
      id: id(),
      title:
        registry.procedures.find((p) => p.id === input.procedureId)?.title ??
        '거리 참조',
      rolls,
    };
  }
  if (input.procedureId === 'aitc.notable-artefact-type') {
    const type = rollTable('aitc.notable-artefact-type', 'd4');
    const rolls = [type];
    if (type.roll <= 2) {
      rolls.push(rollTable('aitc.notable-artefact-concerning', 'd12'));
    } else {
      rolls.push(
        rollTable('aitc.notable-artefact-composition', 'd12'),
        rollTable('aitc.notable-artefact-adjective', 'd12'),
        rollTable('aitc.notable-artefact-subject', 'd12'),
      );
      if (type.roll === 4) rolls.push(rollTable('aitc.sculpture-size', 'd2'));
    }
    return { id: id(), title: type.title, rolls };
  }
  throw new Error('지원하지 않는 도시 참조 절차입니다.');
}
