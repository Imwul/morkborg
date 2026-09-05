import type { OracleRegistry } from './oracle';
import type { ReferenceReading } from './referenceReading';
import { oracleFollowUpLinks, oracleReadingText } from './referenceReading';
import { refsForOracle } from './referenceExecution';
import { rollCityReference } from './cityReference';
import {
  rollCityMove,
  rollMicroCrawl,
  rollSettlementStreets,
  type CityMode,
  type CityMoveResult,
} from './cityProcedures';
import { rollOracle, selectOracleEntry } from '../generators/oracleRoller';
import { random, type RandomSource } from '../generators/random';

export interface CityCrawlConfig {
  mode: CityMode;
  dr: number;
  modifier: number;
  allObjectivesMet: boolean;
  cityOrMetropolis: boolean;
  includeExits: boolean;
}
export interface CityCrawlState {
  config: CityCrawlConfig;
  phase: 'blocked' | 'scene' | 'ready' | 'complete';
  streetNumber: number;
  totalStreets?: number;
  setup?: ReferenceReading;
  move?: CityMoveResult;
  reading: ReferenceReading;
}

export const CITY_REFERENCE_GROUPS = [
  {
    title: '거리와 사건 · AitC 15 / 7–8 / 11쪽',
    description: '한 거리의 묘사·내용·되돌아가기와 그 안에서 일어나는 일.',
    ids: [
      'procedure:aitc.street',
      'oracle:aitc.backtracking',
      'oracle:aitc.hazards',
      'oracle:aitc.unexpected-events',
      'oracle:aitc.gatherings',
      'procedure:aitc.festival',
    ],
  },
  {
    title: 'NPC / NPC 조우 · SD 12 / AitC 13–14쪽',
    description:
      'NPC는 인물을 만듭니다. NPC 조우는 도시에서 마주친 상황을 만듭니다.',
    ids: [
      'procedure:workbench.npc',
      'oracle:aitc.npc-encounters',
      'oracle:core.reaction',
      'oracle:sd.npc.disposition',
      'oracle:sd.npc.profession',
    ],
  },
  {
    title: '건물과 장소 · AitC 6–12쪽',
    description: '거리 결과가 가리키는 장소를 여기서 바로 펼칩니다.',
    ids: [
      'oracle:aitc.civic-buildings',
      'oracle:aitc.businesses',
      'oracle:aitc.holy-places-small',
      'oracle:aitc.holy-places-large',
      'oracle:aitc.special-structures-small',
      'oracle:aitc.special-structures-large',
      'oracle:aitc.notable-artefact-type',
      'oracle:aitc.animals',
    ],
  },
  {
    title: '여관 · AitC 11 / FER 54–55쪽',
    description:
      '여관 유형과 Grey Galth Inn의 주인·손님·메뉴. 메뉴는 가격을 보고 하나를 선택합니다.',
    ids: [
      'oracle:aitc.taverns',
      'oracle:feretory.innkeeperTwitch',
      'oracle:feretory.patronTraits',
      'oracle:feretory.moreLostSouls',
      'oracle:feretory.selectMenu',
      'oracle:feretory.cheapMenu',
      'oracle:feretory.threeDeadSkulls',
    ],
  },
  {
    title: '정착지 · AitC 9–10쪽',
    description:
      '규모·이름·성격을 한 묶음으로 생성하거나 필요한 표만 굴립니다.',
    ids: [
      'procedure:aitc.settlement',
      'procedure:aitc.settlement-name',
      'oracle:aitc.settlement-size',
      'oracle:aitc.settlement-descriptor',
    ],
  },
] as const;

export function cityCrawlMoveReading(
  result: CityMoveResult,
  registry: OracleRegistry,
): ReferenceReading {
  const follow = result.metadata.followUp;
  const table =
    follow &&
    registry.tables.find((candidate) => candidate.id === follow.tableId);
  const entry =
    table && follow ? selectOracleEntry(table, follow.roll) : undefined;
  const links = oracleFollowUpLinks(entry?.metadata);
  return {
    title: result.mode === 'derive' ? 'Dérive' : '도시 크롤',
    blocks: [
      {
        title:
          result.outcome === 'fail'
            ? '실패'
            : result.outcome === 'strong'
              ? '강한 성공'
              : '약한 성공',
        text: result.description,
        dice: `2d20 [${result.diceValues.join(', ')}] + ${result.modifier} → [${result.modifiedValues.join(', ')}] vs DR${result.dr}`,
      },
      ...(follow
        ? [
            {
              title: table?.title ?? '이동을 막은 상황 · d4 영감',
              text: entry
                ? oracleReadingText(entry)
                : '원문 표를 불러와 결과를 확인하세요.',
              dice: `${follow.dice} = ${follow.roll}`,
            },
          ]
        : []),
    ],
    sourceRefs: result.sourceRefs,
    ...links,
  };
}

function createStreet(
  state: CityCrawlState,
  registry: OracleRegistry,
  rng: RandomSource,
): CityCrawlState {
  const result = rollCityReference(
    {
      procedureId: 'aitc.street',
      cityOrMetropolis: state.config.cityOrMetropolis,
      includeExits: state.config.includeExits,
    },
    registry,
    rng,
  );
  return {
    ...state,
    phase: 'scene',
    streetNumber: state.streetNumber + 1,
    reading: {
      title: `거리 ${String(state.streetNumber + 1).padStart(2, '0')}`,
      blocks: result.rolls.map((roll) => ({
        title: roll.title,
        text: oracleReadingText(roll),
        dice: `${roll.dice} = ${roll.roll}`,
      })),
      oracle: result,
      sourceRefs: refsForOracle(result, registry),
      relatedIds: [
        ...new Set(
          result.rolls.flatMap(
            (roll) => oracleFollowUpLinks(roll.metadata).relatedIds ?? [],
          ),
        ),
      ],
      fixedLookups: result.rolls.flatMap(
        (roll) => oracleFollowUpLinks(roll.metadata).fixedLookups ?? [],
      ),
    },
  };
}

function crawlStep(
  state: CityCrawlState,
  registry: OracleRegistry,
  rng: RandomSource,
): CityCrawlState {
  if (state.config.mode === 'micro')
    return createStreet({ ...state, move: undefined }, registry, rng);
  const move = rollCityMove(
    {
      move: 'crawl',
      mode: state.config.mode,
      dr: state.config.mode === 'derive' ? 10 : state.config.dr,
      modifier: state.config.modifier,
      allObjectivesMet: state.config.allObjectivesMet,
    },
    rng,
  );
  const next: CityCrawlState = {
    ...state,
    move,
    phase: move.outcome === 'fail' ? 'blocked' : 'scene',
    reading: cityCrawlMoveReading(move, registry),
  };
  if (move.metadata.streetAction === 'new-street')
    return createStreet(next, registry, rng);
  // A Strong Hit reaches the player's existing Objective; it does not create a random street.
  return next;
}

/** Start only the selected source-defined procedure, keeping the current scene in one block. */
export function startCityCrawl(
  config: CityCrawlConfig,
  registry: OracleRegistry,
  rng: RandomSource = random,
): CityCrawlState {
  const state: CityCrawlState = {
    config: { ...config },
    phase: 'ready',
    streetNumber: 0,
    reading: { title: '도시 크롤', blocks: [], sourceRefs: [] },
  };
  if (config.mode === 'micro') {
    const count = rollMicroCrawl(rng);
    state.totalStreets = count.streets;
    state.setup = {
      title: '마이크로 크롤',
      blocks: [
        {
          title: `${count.streets}개 거리`,
          text: '거리의 상황을 해결한 뒤 다음 거리로 이동합니다. 도시 크롤 판정은 굴리지 않습니다.',
          dice: `d4 = ${count.roll}`,
        },
      ],
      sourceRefs: count.sourceRefs,
    };
  } else if (config.mode === 'derive') {
    const table = registry.tables.find(
      (entry) => entry.id === 'aitc.settlement-size',
    );
    if (
      !table ||
      !table.sourceVerified ||
      table.sourceBookId !== 'aitc' ||
      table.dice !== 'd20' ||
      table.rollable === false
    )
      throw new Error('AitC 정착지 규모 d20 원문 표를 불러오세요.');
    const size = rollOracle(table, registry, rng);
    const count = rollSettlementStreets(size.roll, rng);
    state.totalStreets = count.streets;
    state.config.cityOrMetropolis = size.roll >= 18;
    state.setup = {
      title: 'Dérive · 정착지 가장자리까지',
      blocks: [
        {
          title: size.text,
          text: `${count.streets}개 거리를 방문하면 정착지 가장자리에 도달합니다. Strong·Weak Hit 모두 새 거리입니다.`,
          dice: `d20 = ${size.roll} · ${count.dice} = ${count.streets}`,
        },
      ],
      sourceRefs: count.sourceRefs,
    };
  }
  return crawlStep(state, registry, rng);
}

/** A failed move blocks departure. Resolution generates the street without rolling the move again. */
export function resolveCityObstacle(
  state: CityCrawlState,
  registry: OracleRegistry,
  rng: RandomSource = random,
): CityCrawlState {
  if (state.phase !== 'blocked')
    throw new Error('해결 대기 중인 도시 상황이 없습니다.');
  return createStreet(state, registry, rng);
}

/** Explicit acknowledgement gates the next roll; visiting a street is not an automatic story log. */
export function finishCityScene(state: CityCrawlState): CityCrawlState {
  if (state.phase !== 'scene')
    throw new Error('현재 거리 또는 목표 상황을 먼저 해결하세요.');
  return {
    ...state,
    phase:
      state.totalStreets != null && state.streetNumber >= state.totalStreets
        ? 'complete'
        : 'ready',
  };
}

export function advanceCityCrawl(
  state: CityCrawlState,
  registry: OracleRegistry,
  updates: Pick<CityCrawlConfig, 'modifier' | 'allObjectivesMet'>,
  rng: RandomSource = random,
): CityCrawlState {
  if (state.phase !== 'ready')
    throw new Error('현재 상황을 해결한 후 다음 거리로 이동하세요.');
  return crawlStep(
    { ...state, config: { ...state.config, ...updates } },
    registry,
    rng,
  );
}
