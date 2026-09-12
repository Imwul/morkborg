import type { OracleRegistry } from './oracle';
import type { ReferenceReading } from './referenceReading';
import { oracleFollowUpLinks, oracleReadingText } from './referenceReading';
import { oracleValueProvenance } from './oracleProvenance';
import type { CityMoveResult } from './cityProcedures';
import { selectOracleEntry } from '../generators/oracleRoller';
import { oracleEntryDependencyWarning } from './oracleDependencies';

export const CITY_REFERENCE_GROUPS = [
  {
    title: '거리와 사건',
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
    title: 'NPC / NPC 조우',
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
    title: '건물과 장소',
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
    title: '여관',
    description:
      '여관 유형과 Grey Galth Inn의 주인·손님·메뉴. 정찬 4s / 저렴한 식사 2s 중 선택한 메뉴의 d6을 굴립니다.',
    ids: [
      'oracle:aitc.taverns',
      'oracle:feretory.innkeeperTwitch',
      'oracle:feretory.patronTraits',
      'oracle:feretory.moreLostSouls',
      'oracle:feretory.selectMenu',
      'oracle:feretory.cheapMenu',
      'rule:feretory.three-dead-skulls',
    ],
  },
  {
    title: '정착지',
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
  const dependencyWarning = oracleEntryDependencyWarning(entry, registry);
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
                ? [oracleReadingText(entry), dependencyWarning]
                    .filter(Boolean)
                    .join('\n\n')
                : `SOURCE DATA UNAVAILABLE: ${follow.tableId} · 원문 표를 불러와 결과를 확인하세요.`,
              dice: `${follow.dice} = ${follow.roll}`,
            },
          ]
        : []),
    ],
    sourceRefs: [
      ...result.sourceRefs,
      ...(table && entry && follow
        ? oracleValueProvenance(table, registry, entry, {
            value: follow.roll,
            values: follow.diceValues,
          }).sourceRefs
        : []),
    ],
    ...links,
  };
}
