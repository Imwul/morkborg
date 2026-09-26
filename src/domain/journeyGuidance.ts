import type { ReferenceReading } from './referenceReading';
import type { OracleRegistry } from './oracle';
import { verifiedReadingRows } from './resultFollowThrough';
export interface GuidanceLink {
  id: string;
  label: string;
}
export interface JourneyGuide {
  note: string;
  links: GuidanceLink[];
}
const camp: GuidanceLink = {
  id: 'rule:sd.camping-move',
  label: '사건 해결 후 야영하기',
};
const event: GuidanceLink = {
  id: 'oracle:feretory.roadEvent',
  label: '오늘 길에서 생긴 사건 d20',
};
/** UI route suggestions over existing references, not registry relationships or progression gates. */
export function journeyGuidance(
  referenceId: string,
  reading?: ReferenceReading,
  registry?: OracleRegistry,
): JourneyGuide | undefined {
  if (referenceId === 'rule:sd.travel-day')
    return {
      note: 'SD 하루 여행 순서입니다. 오늘 이미 처리한 것은 건너뛰세요. 경로와 남은 날은 노트에서 관리합니다.',
      links: [
        {
          id: 'rule:feretory.travel-distances',
          label: '출발 전 · 여행일 정하기',
        },
        { id: 'rule:sd.daily-misery', label: '새벽 · Calendar 확인' },
        { id: 'oracle:core.weather', label: '새벽 · 날씨 d12' },
        { id: 'oracle:feretory.roadType', label: '이동 · 길의 상태 d8' },
        event,
        camp,
      ],
    };
  if (referenceId === 'rule:sd.resupply')
    return {
      note: '여행 중이면 하루 채집 표를 사용합니다. 던전 등 다른 상황의 재보급은 일반 모험 판정을 사용합니다.',
      links: [
        { id: 'oracle:feretory.forage', label: '하루 채집 d6 열기' },
        {
          id: 'rule:sd.general-move',
          label: '여행 외의 재보급 · 일반 모험 판정',
        },
      ],
    };
  if (referenceId === 'rule:sd.leaving-road')
    return {
      note: '일부러 길을 벗어났거나 이미 길을 잃었다면 다음 표로 바로 갑니다.',
      links: [
        { id: 'oracle:feretory.leaveRoad', label: '길 밖에서 만나는 것 d12' },
      ],
    };
  if (referenceId === 'rule:sd.camping-move')
    return {
      note: 'SD에서는 Camping Move로 회복을 판정합니다. FERETORY의 야영 사건은 별도 내용 표이며 회복 판정을 대신하지 않습니다. 필요할 때만 펼치세요.',
      links: [
        { id: 'rule:core.rest', label: '식량·물 부족 / 감염의 휴식 제한' },
        {
          id: 'oracle:feretory.campsite',
          label: '밤의 사건이 필요할 때 · FERETORY d12',
        },
        { id: 'rule:sd.travel-day', label: '다음 날 여행 안내' },
      ],
    };
  if (!reading || !registry) return;
  const rows = verifiedReadingRows(reading, registry);
  if (!rows.length) return;
  const has = (id: string) => rows.filter((r) => r.table.id === id);
  const road = has('feretory.roadType')[0];
  if (road && !has('feretory.roadEvent').length)
    return {
      note:
        road.entry.min === 3 || road.entry.min === 4
          ? 'SD로 여행 중이면 이 길에서만 이탈 여부를 판정합니다. 남은 Omens를 보정으로 사용해도 소비하지 않습니다.'
          : '이 길에는 별도 길 유지 판정이 없습니다. 오늘의 길 사건을 확인하세요.',
      links: [
        ...(road.entry.min === 3 || road.entry.min === 4
          ? [{ id: 'rule:sd.leaving-road', label: '동물 길 · 망가진 길 판정' }]
          : []),
        event,
      ],
    };
  if (has('feretory.roadEvent').length)
    return {
      note: has('feretory.roadEvent').some((r) => r.entry.min === 4)
        ? '악천후로 전진하지 못합니다. 오늘 남은 이동일은 줄이지 않습니다.'
        : '사건의 추가 굴림과 조우를 해결한 뒤 야영합니다. 길 상태가 동물 길·망가진 길이었다면 이탈 여부도 확인하세요.',
      links: [camp, { id: 'rule:sd.travel-day', label: '하루 여행 순서로' }],
    };
  if (has('feretory.forage').length || has('feretory.village').length)
    return {
      note: '분량과 조건별 처리는 위 결과를 따릅니다. 마을에서 식량을 발견했다고 곧바로 구입한 것은 아닙니다. 채집한 날은 이동일을 줄이지 않습니다.',
      links: [camp],
    };
  if (has('feretory.leaveRoad').length)
    return {
      note: '만난 상황을 해결하고 도로로 돌아옵니다. SD의 길 이탈이라면 오늘도 이동일로 셉니다. 이미 오늘 사건을 정했다면 다시 굴리지 않습니다.',
      links: [event, camp],
    };
}
