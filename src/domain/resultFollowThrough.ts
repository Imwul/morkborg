import type { OracleRegistry, OracleRoll } from './oracle';
import type { ReferenceReading } from './referenceReading';
import type { GuidedRoll } from './guidedRoll';

export interface ResultTask {
  id: string;
  title: string;
  condition: string;
  effect: string;
  roll?: GuidedRoll;
  lookup?: { oracleId: string; roll: number };
}
export interface RowTasks {
  table: string;
  min: number;
  tasks: readonly ResultTask[];
}
const quantity = (
  id: string,
  title: string,
  dice: string,
  condition: string,
  effect: string,
  offset = 0,
): ResultTask => ({
  id,
  title,
  condition,
  effect,
  roll: { kind: 'quantity', dice, offset },
});
const test = (
  id: string,
  title: string,
  ability: string,
  dr: number,
  condition: string,
  effect: string,
  dice: 'd20' | '2d20' = 'd20',
): ResultTask => ({
  id,
  title,
  condition,
  effect,
  roll: { kind: 'test', dice, ability, dr },
});

/** Exact source rows audited in docs/play-guidance/README.md. No keyword-derived mechanics. */
export const RESULT_TASKS: readonly RowTasks[] = [
  {
    table: 'feretory.roadEvent',
    min: 4,
    tasks: [
      {
        id: 'delay',
        title: '이동 지연',
        condition: '날씨가 더 극심해진 날',
        effect: '이 날은 전진하지 못합니다. 남은 이동일을 줄이지 마세요.',
      },
    ],
  },
  {
    table: 'feretory.roadEvent',
    min: 7,
    tasks: [
      {
        id: 'reroll',
        title: '갈림길 뒤 사건',
        condition: '7–8이 나온 경우',
        effect:
          '같은 사건 표를 다시 굴립니다. 원문의 재굴림 지시이며 능력 판정을 추가하지 않습니다.',
      },
    ],
  },
  {
    table: 'feretory.roadEvent',
    min: 9,
    tasks: [
      quantity(
        'spoil',
        '상한 식량·물',
        'd6',
        '상한 분량을 정할 때',
        '결과만큼 식량 또는 물을 노트에서 줄입니다.',
      ),
    ],
  },
  {
    table: 'feretory.roadEvent',
    min: 14,
    tasks: [
      quantity(
        'slavers',
        '노예상 수',
        'd6',
        '등장 인원을 정할 때',
        '노예상 d6+1명.',
        1,
      ),
      quantity(
        'captives',
        '붙잡힌 사람 수',
        '2d6',
        '등장 인원을 정할 때',
        '노예 2d6명.',
      ),
    ],
  },
  {
    table: 'feretory.roadEvent',
    min: 15,
    tasks: [
      quantity(
        'guards',
        '경비병 수',
        'd8',
        '경비병 수를 정할 때',
        '용병 수와 별개인 경비병 d8명.',
      ),
    ],
  },
  {
    table: 'feretory.roadEvent',
    min: 18,
    tasks: [
      quantity(
        'zombies',
        '지하묘실의 좀비 수',
        'd8',
        '숨겨진 조우를 준비할 때',
        '좀비 d8구. 등장만으로 전투를 시작하지 않습니다.',
      ),
    ],
  },
  {
    table: 'feretory.forage',
    min: 2,
    tasks: [
      quantity(
        'rations',
        '발견한 식량·물',
        'd6',
        '발견 분량을 정할 때',
        'd6+1회분 중 하나가 상했습니다.',
        1,
      ),
      test(
        'spoil-test',
        '상한 식량 알아채기',
        'Presence',
        12,
        '부패를 알아채는지 확인할 때',
        '성공하면 알아챕니다. 상한 것을 먹었다면 6시간 뒤 병듭니다. 원문에는 별도 피해량이 없습니다.',
      ),
    ],
  },
  {
    table: 'feretory.forage',
    min: 3,
    tasks: [
      quantity(
        'rations',
        '좋은 식량·물',
        'd6',
        '발견 분량을 정할 때',
        '좋은 식량 또는 신선한 물을 얻습니다.',
        3,
      ),
    ],
  },
  {
    table: 'feretory.forage',
    min: 4,
    tasks: [
      quantity(
        'meat',
        '사냥 후 식량',
        'd8',
        '짐승을 죽인 뒤에만',
        '식량 d8+2회분. Eat Prey Kill은 다른 선택지입니다. 양쪽 보상을 합치지 않습니다.',
        2,
      ),
    ],
  },
  {
    table: 'feretory.village',
    min: 1,
    tasks: [
      quantity(
        'scavenge',
        '뒤져 찾은 식량·물',
        'd6',
        '버려진 마을을 수색할 때',
        '식량과 물 d6회분.',
      ),
    ],
  },
  {
    table: 'feretory.village',
    min: 2,
    tasks: [
      {
        id: 'tainted',
        title: '식량 오염 여부',
        condition: '각 식량의 오염을 정할 때',
        effect:
          '1–2면 오염되었습니다. 원문에 없는 감염 피해를 자동 적용하지 않습니다.',
        roll: { kind: 'chance', dice: 'd6', threshold: 2 },
      },
    ],
  },
  {
    table: 'feretory.campsite',
    min: 6,
    tasks: [
      test(
        'notice',
        '식량 도둑 알아채기',
        '일행 중 가장 높은 Presence',
        12,
        '짐승을 알아채는지 확인할 때',
        '성공하면 알아챕니다. 그 뒤 대응은 직접 정합니다.',
      ),
      quantity(
        'stolen',
        '도난 식량 분량',
        'd4',
        '실제로 도둑맞았다면',
        '식량 d4회분을 노트에서 줄입니다.',
      ),
    ],
  },
  {
    table: 'feretory.campsite',
    min: 7,
    tasks: [
      {
        id: 'dream',
        title: '내일 조우의 예지몽',
        condition: '내일의 첫 무작위 조우를 지금 정할 때',
        effect:
          '플레이 중 사용하는 조우 표로 정해 노트에 적습니다. 내일 같은 조우를 다시 굴리지 마세요. 원문은 특정 조우 표를 지정하지 않습니다.',
      },
    ],
  },
  {
    table: 'feretory.campsite',
    min: 8,
    tasks: [
      test(
        'notice',
        '배낭 도둑 알아채기',
        'Presence',
        14,
        '도둑을 알아채는지 확인할 때',
        '성공하면 알아챕니다. 그 뒤 대응은 직접 정합니다.',
      ),
      quantity(
        'victims',
        '물건을 빼앗긴 PC 수',
        'd3',
        '도둑맞은 대상 수를 정할 때',
        '대상마다 배낭의 물건 하나. 실제 일행에 맞춰 적용합니다.',
      ),
    ],
  },
  {
    table: 'feretory.campsite',
    min: 9,
    tasks: [
      {
        id: 'omens',
        title: '다음 날의 Omens',
        condition: '다음 날이 되면',
        effect: '모든 캐릭터의 Omens가 1 줄어듭니다. 노트에 적용하세요.',
      },
    ],
  },
  {
    table: 'feretory.campsite',
    min: 10,
    tasks: [
      quantity(
        'omens',
        '각 PC의 다음 날 Omens',
        'd6',
        '꿈의 내용과 별도로 각 PC마다',
        'd6−3. 음수 결과는 기존 Omens를 줄입니다. 꿈의 d6 결과를 재사용하지 않습니다.',
        -3,
      ),
    ],
  },
  {
    table: 'feretory.campsite',
    min: 12,
    tasks: [
      quantity(
        'peddlers',
        '행상인 수',
        'd4',
        '등장 인원을 정할 때',
        '행상인 d4+2명.',
        2,
      ),
    ],
  },
  {
    table: 'aitc.taverns',
    min: 1,
    tasks: [
      test(
        'sleep',
        '허름한 숙박소에서 하룻밤',
        'Toughness',
        10,
        '1s를 내고 숙박할 때',
        'Strong: HP d6, Omens·Powers 회복. Weak: HP d4, Omens·Powers는 각각 1 적게 회복. Miss: HP d2, 감염. SD 야영을 중복 판정하지 않습니다.',
        '2d20',
      ),
      quantity(
        'strong-hp',
        'Strong 회복',
        'd6',
        '숙박 판정이 Strong일 때만',
        'HP 회복.',
      ),
      quantity(
        'weak-hp',
        'Weak 회복',
        'd4',
        '숙박 판정이 Weak일 때만',
        'HP 회복.',
      ),
      quantity(
        'miss-hp',
        'Miss 회복',
        'd2',
        '숙박 판정이 Miss일 때만',
        'HP 회복 후 감염. 이후 휴식 제한과 일일 손실을 확인하세요.',
      ),
    ],
  },
  {
    table: 'aitc.taverns',
    min: 2,
    tasks: [
      test(
        'ale',
        '맥주를 마신 결과',
        'Toughness',
        10,
        '1s를 내고 맥주를 마실 때',
        'Strong: HP d4, Omen +1. Weak: HP d4, Presence −1(4시간). Miss: Agility −2(4시간), 무작위 동료·NPC 공격 또는 사고 회피.',
        '2d20',
      ),
      quantity(
        'recovery',
        '맥주의 회복',
        'd4',
        'Strong 또는 Weak일 때만',
        'HP 회복.',
      ),
      test(
        'accident',
        '환각 중 사고 회피',
        'Agility',
        12,
        'Miss 후 동료 공격 대신 사고를 피한다면',
        '사고를 피하지 못하면 HP d4 손실. 현재 상황의 보정을 입력하세요.',
      ),
      quantity(
        'injury',
        '사고 피해',
        'd4',
        '사고 회피에 실패했을 때만',
        'HP 손실.',
      ),
    ],
  },
  {
    table: 'aitc.taverns',
    min: 3,
    tasks: [
      quantity(
        'npcs',
        '술집의 NPC 수',
        'd4',
        '손님 수를 정할 때',
        '다가가는 NPC에게만 Reaction +2. 서로 다른 묘사 표를 또다른 성공 판정으로 사용하지 않습니다.',
      ),
      {
        id: 'gambling',
        title: '도박',
        condition: '판돈을 걸고 도박한다면',
        effect:
          '3d6. 연속 숫자 또는 한 쌍은 2배 반환, 셋이 같으면 4배 반환. 상위 조합 하나만 적용합니다.',
        roll: { kind: 'quantity', dice: '3d6' },
      },
      {
        id: 'fight',
        title: '취한 도박꾼',
        condition: '도박에서 이길 때마다',
        effect: '1–2면 술 취한 도박꾼과 싸워야 합니다.',
        roll: { kind: 'chance', dice: 'd6', threshold: 2 },
      },
    ],
  },
  {
    table: 'aitc.taverns',
    min: 4,
    tasks: [
      quantity('price', '여관의 숙박비', 'd8', '방을 빌릴 때', 'd8+3s.', 3),
      test(
        'rest',
        '여관의 휴식',
        'Presence',
        8,
        '방에서 하룻밤 쉬면',
        'SD 수면 결과를 적용합니다. Strong: HP d6, Omens 재굴림·Powers 회복. Weak: HP d4, Omen·Power 각각 1, 휴식 방해. 수면 시 식량 1. Miss: 사건을 해결한 뒤 다음 휴식 Strong/Weak 50:50.',
        '2d20',
      ),
      quantity(
        'strong-hp',
        'Strong 회복',
        'd6',
        '휴식이 Strong일 때만',
        'HP 회복.',
      ),
      quantity('weak-hp', 'Weak 회복', 'd4', '휴식이 Weak일 때만', 'HP 회복.'),
      quantity(
        'retry',
        '실패 후 다음 휴식',
        'd2',
        'Miss의 사건을 해결하고 다시 쉴 때만',
        '1은 Strong, 2는 Weak. 같은 숙박의 다음 휴식을 50:50으로 정합니다.',
      ),
      {
        id: 'as-tavern',
        title: '여관의 손님·식량·도박',
        condition: '원문의 “술집과 같음” 부분이 필요할 때',
        effect:
          'Taverns의 3번 항목을 그대로 펼칩니다. 새 숙소 종류를 굴리지 않습니다.',
        lookup: { oracleId: 'aitc.taverns', roll: 3 },
      },
    ],
  },
];

export function verifiedReadingRows(
  reading: ReferenceReading,
  registry: OracleRegistry,
) {
  const rows: Pick<OracleRoll, 'oracleId' | 'entryId' | 'text'>[] =
    reading.oracle?.rolls ??
    reading.sourceRefs.flatMap((ref) => {
      const entry = registry.tables
        .find((t) => t.id === ref.tableId)
        ?.entries.find((e) => e.id === ref.entryId);
      // Fixed lookups keep their row text in a reading block. A stale edited block is not evidence.
      return entry &&
        reading.blocks.some(
          (b) =>
            b.text === entry.text || b.text.startsWith(entry.text + '\n\n'),
        )
        ? [{ oracleId: ref.tableId!, entryId: entry.id, text: entry.text }]
        : [];
    });
  return rows.flatMap((row) => {
    const table = registry.tables.find((t) => t.id === row.oracleId);
    const entry = table?.entries.find((e) => e.id === row.entryId);
    return table?.sourceVerified &&
      entry?.metadata?.sourceStatus === 'VERIFIED' &&
      entry.text === row.text
      ? [{ table, entry }]
      : [];
  });
}
export function resultTasks(
  reading: ReferenceReading,
  registry: OracleRegistry,
) {
  return verifiedReadingRows(reading, registry).flatMap(({ table, entry }) => {
    const policy = RESULT_TASKS.find(
      (p) => p.table === table.id && p.min === entry.min,
    );
    return policy ? [{ ...policy, title: table.title, entryId: entry.id }] : [];
  });
}
