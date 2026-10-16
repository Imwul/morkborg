import type { ReferenceReading } from './referenceReading';
import type { SourceReference } from './types';
import type { RandomSource } from '../generators/random';
import { rollDie } from '../generators/random';
import { sourceProcedure } from './generationAuthority';

export const RECLVSE_BLESSING_IDS = [
  'rapid-investment',
  'progress-inheritance',
  'vital-commitments',
  'enhanced-fortitude',
  'legacy-sacrifice',
] as const;
export type ReclvseBlessingId = (typeof RECLVSE_BLESSING_IDS)[number];
export type ReclvseFortitudeMode = 'fixed12' | '10+d4';

/** App-authored summaries checked against First Edition PDF 13–14. */
export const RECLVSE_BLESSINGS: {
  id: ReclvseBlessingId;
  title: string;
  titleKo: string;
  hint: string;
  description: string;
}[] = [
  {
    id: 'rapid-investment',
    title: 'Rapid Investment',
    titleKo: '빠른 투자',
    hint: '퀘스트·관계를 앞당기는 대신 불리점',
    description:
      '퀘스트를 시작할 때 진척 2칸을 먼저 표시할 수 있습니다. 선택하면 그 퀘스트의 모든 진척·역경 저항 굴림에 불리점을 받습니다. 관계를 만들 때 Track 3에서 시작할 수도 있으며, 이 경우 첫 관계 판정에 불리점을 받습니다.',
  },
  {
    id: 'progress-inheritance',
    title: 'Progress Inheritance',
    titleKo: '진척 계승',
    hint: '캐릭터 사망 후 후계자에게 적용',
    description:
      '캐릭터가 죽으면 후계자는 진행 중인 퀘스트 하나의 진척 절반(내림)과 관계 하나의 Track −2(최소 1)를 이어받을 수 있습니다. 새 캐릭터에게 조건 없이 진척을 주는 규칙은 아닙니다.',
  },
  {
    id: 'vital-commitments',
    title: 'Vital Commitments',
    titleKo: '생명력의 헌신',
    hint: '진행 중인 퀘스트·유지하는 관계에 따라 최대 HP 변화',
    description:
      '퀘스트를 시작하면 진행 중인 동안 최대 HP +1. 완료 시 d20에서 1이면 영구 보너스가 됩니다. 실패하거나 포기하면 보너스를 잃고 d4 피해를 받습니다. Track 2 이상인 관계를 맺으면 유지하는 동안 최대 HP +1, 관계가 끊어지면 그 보너스를 잃습니다. 생성 시에는 아직 적용하지 않습니다.',
  },
  {
    id: 'enhanced-fortitude',
    title: 'Enhanced Fortitude',
    titleKo: '강화된 강인함',
    hint: '시작 HP를 12 또는 10+d4로 대체',
    description:
      '선택한 방식(12 고정 또는 10+d4)이 기존 시작 HP를 대체합니다. 체력 보정치나 직업의 HP 주사위를 더하지 않습니다. 세션당 한 번, 퀘스트를 진전시키거나 관계를 개선하면 d4 HP를 회복할 수 있습니다.',
  },
  {
    id: 'legacy-sacrifice',
    title: 'Legacy Sacrifice',
    titleKo: '유산의 희생',
    hint: '사망한 이전 캐릭터의 진척을 포기해야 적용',
    description:
      '이전 캐릭터가 죽은 뒤 퀘스트 하나 또는 관계 하나의 진척을 전부 포기하면, 후계자는 능력치 하나 +1(최대 +3), 오멘 +1, 고인의 대표 장비 하나(직접 선택 또는 굴림)를 얻습니다. 이 세 효과를 모두 받지만, 사망·진척 포기와 대상 선택이 필요하므로 여기서 자동 지급하지 않습니다.',
  },
];

export const reclvseBlessingLabel = (id: string) => {
  const blessing = RECLVSE_BLESSINGS.find((item) => item.id === id);
  return blessing ? `${blessing.title} · ${blessing.titleKo}` : id;
};
export interface ReclvseBlessingOptions {
  reclvseBlessings?: ReclvseBlessingId[];
  reclvseFortitude?: ReclvseFortitudeMode;
}
export function validateReclvseBlessings(options: ReclvseBlessingOptions) {
  const selected = options.reclvseBlessings ?? [];
  if (
    !Array.isArray(selected) ||
    selected.length > 5 ||
    new Set(selected).size !== selected.length ||
    selected.some((id) => !RECLVSE_BLESSING_IDS.includes(id)) ||
    (options.reclvseFortitude !== undefined &&
      !['fixed12', '10+d4'].includes(options.reclvseFortitude))
  )
    throw new Error('RECLVSE 시작 축복 선택을 확인하세요.');
}
const refs: SourceReference[] = [
  {
    bookId: 'reclvse',
    bookTitle: 'RECLVSE',
    tableTitle: 'Starting Blessings',
    pdfPage: [13, 14],
  },
];

/** A creation-time opt-in. Never applied to a restored or already generated character. */
export function applyReclvseStartingBlessings(
  reading: ReferenceReading,
  options: ReclvseBlessingOptions,
  rng?: RandomSource,
): ReferenceReading {
  validateReclvseBlessings(options);
  const selected = RECLVSE_BLESSING_IDS.filter((id) =>
    options.reclvseBlessings?.includes(id),
  );
  if (!selected.length) return reading;
  if (reading.procedureInputs?.reclvseBlessings)
    throw new Error(
      '이미 생성된 캐릭터에 시작 축복을 다시 적용할 수 없습니다.',
    );
  const fortitude = options.reclvseFortitude ?? 'fixed12';
  const enhanced = selected.includes('enhanced-fortitude');
  const hpBlock = reading.blocks.find((block) => block.title === 'HP');
  if (
    enhanced &&
    (!hpBlock || !reading.oracle?.rolls.some((roll) => roll.title === 'HP'))
  )
    throw new Error('시작 HP 결과를 찾을 수 없습니다.');
  const face = enhanced && fortitude === '10+d4' ? rollDie(4, rng) : undefined;
  const hp = face === undefined ? 12 : 10 + face;
  const formula =
    fortitude === 'fixed12' ? '12 고정' : `10 + d4 = 10 + ${face} = ${hp}`;
  const blocks = reading.blocks.map((block) =>
    enhanced && block.title === 'HP'
      ? {
          ...block,
          text: String(hp),
          dice: `RECLVSE · ${formula}`,
          translation: { titleKo: '생명력' },
        }
      : block,
  );
  for (const blessing of RECLVSE_BLESSINGS.filter((item) =>
    selected.includes(item.id),
  )) {
    blocks.push({
      title: `Starting Blessing — ${blessing.title}`,
      text:
        blessing.description +
        (blessing.id === 'enhanced-fortitude'
          ? ` 이번 생성: ${fortitude === 'fixed12' ? '12 고정' : '10+d4'} → 시작 HP ${hp}.`
          : ''),
      translation: { titleKo: `시작 축복 · ${blessing.titleKo}` },
    });
  }
  return {
    ...reading,
    blocks,
    // Character readings currently use blocks as their canonical copy payload.
    ...(reading.copyContent
      ? {
          copyContent: {
            title: reading.copyContent.title,
            blocks: blocks.map(({ title, text }) => ({ title, text })),
          },
        }
      : {}),
    procedureInputs: {
      ...reading.procedureInputs,
      reclvseBlessings: selected.join(','),
      ...(enhanced ? { reclvseFortitude: fortitude } : {}),
    },
    sourceRefs: [...reading.sourceRefs, ...refs],
    authority: [
      ...(reading.authority ?? []),
      sourceProcedure(
        'reclvse.starting-blessings',
        refs,
        '플레이어가 명시적으로 추가한 RECLVSE 선택 규칙. PDF 13은 하나 이상, PDF 18 요약은 하나로 표기되어 선택 수가 서로 다릅니다. 이 화면은 상세 규칙(PDF 13)을 따라 복수 선택을 허용합니다.',
      ),
    ],
    ...(reading.oracle
      ? {
          oracle: {
            ...reading.oracle,
            rolls: reading.oracle.rolls.map((roll) =>
              !enhanced || roll.title !== 'HP'
                ? roll
                : {
                    ...roll,
                    oracleId: 'reclvse.starting-blessings',
                    dice: fortitude === 'fixed12' ? 'fixed 12' : '10+d4',
                    roll: hp,
                    diceValues: face === undefined ? [] : [face],
                    entryId: null,
                    text: String(hp),
                    source: 'RECLVSE · PDF 13–14',
                    metadata: {
                      // The normal generation roll was made but is explicitly replaced, not added.
                      replacedStartingHP: roll,
                      provenance: {
                        classification: 'SOURCE_COMPOSED',
                        origin: 'source',
                        status: 'VERIFIED',
                        sourceRefs: refs,
                        procedureId: 'reclvse.starting-blessings',
                        transformation: `Enhanced Fortitude replaces starting HP: ${formula}; no Toughness or class HP die.`,
                        rolls:
                          face === undefined
                            ? []
                            : [
                                {
                                  tableId: 'reclvse.starting-blessings',
                                  dice: 'd4',
                                  value: face,
                                  diceValues: [face],
                                },
                              ],
                      },
                    },
                  },
            ),
          },
        }
      : {}),
  };
}
