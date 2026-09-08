import type {
  GeneratedValueProvenance,
  GenerationAuthority,
  GenerationAuthorityKind,
} from './generationProvenance';
import type { SourceReference } from './types';
import sourceProcedureIds from '../data/oracles/sourceProcedureIds.json';
import type { ReferenceReading } from './referenceReading';

/** Metadata only: application choices are never represented as quotations or source routing. */
export const APP_GENERATION_POLICIES: Record<string, string> = {
  'app.reference-groups':
    'Rules are grouped for navigation. Grouping does not combine independent source procedures.',
  'app.card-session':
    'The deck is retained in this open browser session. DRAW takes the next pile without replacement. A new dungeon starts with SHUFFLE. No campaign or monster is saved automatically.',
  'app.table-selection':
    '사용자가 원문 표에서 직접 고른 결과입니다. 주사위를 굴리거나 캠페인에 자동 저장하지 않았습니다.',
  'app.dungeon-dossier':
    '던전 준비 필드에 Core와 RECLVSE의 표를 배정한 앱의 구성입니다. 여러 책 전체가 하나의 필수 생성 절차라는 뜻은 아닙니다.',
  'app.core-sample-room-slots':
    'SD의 특별방 준비 슬롯을 Core Sample Rooms 결과로 채우는 앱의 선택입니다. SD는 이 표를 지정하지 않습니다.',
  'app.region-weighting':
    '지역 태그로 기존 원문 항목의 선택 확률만 조정합니다. 원문의 기본 주사위 확률이나 지역 전용 문구라는 뜻은 아닙니다.',
  'app.structural-identifier':
    'ROOM 번호나 중립 이름은 탐색을 위한 앱 식별자입니다. 룰북이 생성한 이름이 아닙니다.',
  'app.result-grouping':
    '읽기 쉽게 결과를 한 묶음으로 배치한 화면 구성입니다. 함께 보이는 모든 항목을 원문이 한 번에 굴리라고 지시했다는 뜻은 아닙니다.',
  'workbench.npc':
    '여러 책의 NPC 제안을 함께 여는 앱 도구입니다. 각 필드의 원문은 유지하지만 책 하나의 필수 생성 순서가 아닙니다.',
  'workbench.stock-room':
    'Common / Rare / Room의 개별 원문 절차를 고르는 앱 진입점입니다. 한 묶음의 필수 연속 굴림이 아닙니다.',
  'creature.source-record':
    '검증된 생물 기록을 조회해 필드를 표시하는 앱 동작입니다. 새로운 능력치를 생성하는 룰북 절차가 아닙니다.',
};
const sourceIds = new Set([
  'depths.rare-monster',
  'depths.encounter-level',
  ...sourceProcedureIds,
  'core.dungeon-title',
  'core.dungeon-status',
  'core.imminent-danger',
  'core.sample-room',
  'aitc.notable-artefact-type',
  'sd.generic-room',
  'sd.dungeon-preparation',
  'sd.common-stocking',
  'sd.rare-stocking',
  'feretory.monster-approaches',
  'feretory.eat-prey-kill',
  'feretory.road',
  'feretory.forage',
  'feretory.campsite',
  'sd.camping',
  'character.core-classless',
]);
export function procedureAuthority(
  id: string,
): GenerationAuthorityKind | undefined {
  if (id in APP_GENERATION_POLICIES) return 'APP_POLICY';
  return sourceIds.has(id) ? 'SOURCE_PROCEDURE' : undefined;
}
export function appPolicy(
  id: keyof typeof APP_GENERATION_POLICIES,
): GenerationAuthority {
  if (!APP_GENERATION_POLICIES[id])
    throw new Error(`Unknown application generation policy: ${id}`);
  return { kind: 'APP_POLICY', id, description: APP_GENERATION_POLICIES[id] };
}
export function sourceProcedure(
  id: string,
  refs?: SourceReference[],
  description?: string,
): GenerationAuthority {
  return {
    kind: 'SOURCE_PROCEDURE',
    id,
    ...(refs?.length ? { sourceRefs: refs } : {}),
    ...(description ? { description } : {}),
  };
}
export const SPECIAL_ROOM_AUTHORITIES: GenerationAuthority[] = [
  sourceProcedure(
    'core.sample-room',
    [
      {
        bookId: 'core',
        tableId: 'core.rooms',
        pdfPage: [73, 74],
        printedPage: '73–74',
      },
    ],
    'Core Sample Rooms: d4 × d6 한 결과와 그 결과가 지정한 조건부 표만 굴립니다.',
  ),
  sourceProcedure(
    'sd.dungeon-preparation',
    [{ bookId: 'sd', pdfPage: 19, printedPage: 17 }],
    'SD는 네 개의 Special Room 준비 슬롯을 명시합니다.',
  ),
  appPolicy('app.core-sample-room-slots'),
];
export function uniqueAuthorities(
  authorities: GenerationAuthority[],
): GenerationAuthority[] {
  return [
    ...new Map(
      authorities.map((item) => [`${item.kind}:${item.id}`, item]),
    ).values(),
  ];
}
/** Old saves remain untouched. Only known legacy procedure IDs gain a display-time explanation. */
export function generationAuthorities(
  value?: GeneratedValueProvenance,
): GenerationAuthority[] {
  if (!value) return [];
  const result = [...(value.authority ?? [])];
  if (
    value.procedureId === 'core.sample-room' &&
    value.sourceRefs.some(
      (ref) =>
        ref.bookId === 'sd' &&
        [ref.pdfPage].flat().includes(19) &&
        !ref.tableId,
    )
  )
    result.push(...SPECIAL_ROOM_AUTHORITIES);
  if (
    value.procedureId &&
    !result.some((item) => item.id === value.procedureId)
  ) {
    const kind = procedureAuthority(value.procedureId);
    if (kind === 'APP_POLICY') result.push(appPolicy(value.procedureId));
    if (kind === 'SOURCE_PROCEDURE')
      result.push(sourceProcedure(value.procedureId));
  }
  if (value.regionWeighting)
    result.push({
      ...appPolicy('app.region-weighting'),
      description: `${APP_GENERATION_POLICIES['app.region-weighting']} Region weighting applied: ${value.regionWeighting}`,
    });
  return uniqueAuthorities(result).map((item) =>
    item.kind === 'SOURCE_PROCEDURE' &&
    !item.sourceRefs?.length &&
    value.sourceRefs.length
      ? {
          ...item,
          sourceRefs: value.sourceRefs.filter((ref) => ref.role !== 'routing'),
        }
      : item,
  );
}

export function authoritiesForReading(
  reading: ReferenceReading,
  procedureId?: string,
): GenerationAuthority[] {
  const authorities = [
    ...(reading.oracle?.rolls ?? []).flatMap((roll) => {
      const provenance = roll.metadata?.provenance;
      const refs = provenance?.sourceRefs ?? [];
      return [
        ...generationAuthorities(provenance),
        ...(roll.entryId && refs.length
          ? [
              sourceProcedure(
                `oracle:${roll.oracleId}`,
                refs,
                `${roll.dice} · 원문 표의 주사위와 구간을 조회합니다.`,
              ),
            ]
          : []),
      ];
    }),
    ...(reading.authority ?? []),
  ];
  if (procedureId === 'workbench.epk')
    authorities.push(
      sourceProcedure(
        'feretory.eat-prey-kill',
        reading.sourceRefs.filter((ref) =>
          ref.tableId?.startsWith('feretory.hunting.'),
        ),
        'Eat Prey Kill의 해당 지역 원문 d6 표를 조회합니다. 지역 생물의 능력치는 별도의 PRIMARY SOURCE를 따릅니다.',
      ),
    );
  const kind = procedureId ? procedureAuthority(procedureId) : undefined;
  if (procedureId && kind === 'APP_POLICY')
    authorities.push(appPolicy(procedureId));
  if (
    procedureId &&
    kind === 'SOURCE_PROCEDURE' &&
    !authorities.some((item) => item.id === procedureId)
  )
    authorities.push(sourceProcedure(procedureId));
  return uniqueAuthorities(authorities);
}
