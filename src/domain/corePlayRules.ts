import type { GenerationAuthority } from './generationProvenance';
import { appPolicy } from './generationAuthority';
import type { PlayReferenceRuleSeed } from './playReferenceRules';
import type { SourceReference } from './types';

export interface CorePlayRuleSeed extends PlayReferenceRuleSeed {
  /** Korean is a reading helper, never a replacement for canonical English. */
  translationKo: string;
  titleKo: string;
  /** Actual source section, distinct from the app's navigation title. */
  sourceTitle: string;
  authority?: GenerationAuthority[];
  additionalSourceRefs?: SourceReference[];
}

function fullEditionSource(
  tableTitle: string,
  pdfPage: number | number[],
  printedPage?: number | string,
): SourceReference {
  return {
    bookId: 'core-full',
    bookTitle: 'MÖRK BORG Full Edition Second Printing',
    tableTitle,
    pdfPage,
    ...(printedPage == null ? {} : { printedPage }),
    status: 'VERIFIED',
  };
}

/** Targeted replacements for existing Core rules; IDs and canonical tables stay stable. */
export const CORE_PLAY_RULES: CorePlayRuleSeed[] = [
  {
    id: 'core.outcasts',
    title: 'Outcasts · Hiring / Loyalty',
    titleKo: '추종자 고용과 충성',
    sourceTitle: 'Outcasts (followers)',
    summary:
      'Outcasts cost no silver to hire, although money may change hands. They may run away, often at a critical moment.\n\nThe GM makes a morale check from time to time and adds the group’s highest Presence to the roll. Success means the outcast stays. Consider whether the group provides what the outcast values; the source gives no fixed schedule or numeric modifier for this.\n\nMorale uses 2d6: a result above Morale fails. Use each outcast’s own Morale score.',
    translationKo:
      'Outcast를 고용하는 데 은화는 들지 않습니다. 다만 돈이 오갈 수는 있습니다. 급박한 순간에 달아나기도 합니다.\n\nGM은 때때로 사기 판정을 하고 굴림에 일행의 가장 높은 지각(Presence)을 더합니다. 성공하면 추종자는 남습니다. 그가 소중히 여기는 것을 일행이 제공하는지도 고려합니다. 원문에는 정해진 판정 주기나 이에 따른 수치 보정이 없습니다.\n\n사기 판정은 2d6 결과가 사기 수치를 초과하면 실패합니다. 각 추종자의 사기 수치를 사용합니다.',
    book: 'core',
    pages: [63],
    printedPage: 63,
    status: 'VERIFIED',
    contexts: ['npc', 'character'],
    additionalSourceRefs: [
      {
        bookId: 'core',
        tableTitle: 'Morale',
        pdfPage: 32,
        printedPage: 32,
        status: 'VERIFIED',
      },
      fullEditionSource('Outcasts (followers)', 75, 71),
    ],
  },
  {
    id: 'core.tests',
    title: 'Core Tests / Difficulty Ratings',
    titleKo: '능력 판정과 난이도',
    sourceTitle: 'Tests / Difficulty Ratings (DR)',
    summary:
      'Roll d20 + ability; meet or exceed the DR to succeed. Creatures use a plain d20 for tests.\n\nDR6 — so simple people laugh at you for failing\nDR8 — routine but some chance of failure\nDR10 — pretty simple but not simple enough to not roll\nDR12 — normal\nDR14 — difficult\nDR16 — really hard\nDR18 — should not be possible',
    translationKo:
      'd20에 능력 보정을 더해 DR 이상이면 성공합니다. 생물의 일반 판정은 능력 보정 없이 d20을 굴립니다.\n\nDR6 — 실패하면 비웃음을 살 만큼 쉬움\nDR8 — 일상적이지만 실패할 수도 있음\nDR10 — 꽤 쉽지만 굴림은 필요함\nDR12 — 보통\nDR14 — 어려움\nDR16 — 매우 어려움\nDR18 — 불가능해야 할 정도',
    book: 'core',
    pages: [28],
    printedPage: 28,
    status: 'VERIFIED',
    contexts: ['character', 'monster', 'dungeon'],
    additionalSourceRefs: [
      fullEditionSource('Tests / Difficulty Ratings (DR)', 30, 26),
    ],
  },
  {
    id: 'core.round',
    title: 'Core Round / Movement',
    titleKo: '라운드와 이동',
    sourceTitle: 'How long is a round?',
    summary:
      'A round allows an attack or a Power, and movement across a normal-sized room. Usually 10 rounds make one minute. This rule describes movement by room size; it does not specify a distance in meters or feet.',
    translationKo:
      '한 라운드에 공격하거나 권능을 사용하고, 보통 크기의 방 하나를 가로질러 이동할 수 있습니다. 보통 10라운드가 1분입니다. 이 규칙은 이동을 방 크기로 설명하며, 미터나 피트 단위의 이동거리를 정하지 않습니다.',
    book: 'core',
    pages: [31],
    printedPage: 31,
    status: 'VERIFIED',
    contexts: ['character', 'monster', 'dungeon'],
    // Full PDF34 is visually unnumbered; do not infer a printed page number.
    additionalSourceRefs: [fullEditionSource('How long is a round?', 34)],
  },
  {
    id: 'core.rest',
    title: 'Core Rest / Food / Infection',
    titleKo: '휴식·식량·감염',
    sourceTitle: 'Rest',
    summary:
      'Catch your breath and have a drink: recover d4 HP. A full night’s sleep: recover d6 HP.\n\nWithout food or drink, resting restores no HP. After two days a starving PC loses d4 HP each day.\n\nInfection prevents rest recovery and causes d6 HP loss daily.',
    translationKo:
      '숨을 돌리며 마실 것을 섭취하면 HP d4를 회복합니다. 하룻밤 푹 자면 HP d6를 회복합니다.\n\n음식이나 물이 없으면 쉬어도 HP를 회복하지 못합니다. 이틀 굶은 뒤부터는 매일 HP d4를 잃습니다.\n\n감염 중에는 휴식으로 회복하지 못하고 매일 HP d6를 잃습니다.',
    book: 'core',
    pages: [31],
    printedPage: 31,
    status: 'VERIFIED',
    contexts: ['character', 'travel'],
    additionalSourceRefs: [fullEditionSource('Rest', 35, 31)],
  },
  {
    id: 'core.carrying',
    title: 'Carrying Capacity',
    titleKo: '운반과 과적',
    sourceTitle: 'Carrying Capacity',
    summary:
      'Carry Strength + 8 normal-sized items. Above that, Strength and Agility tests have DR +2. You cannot carry more than twice that normal capacity.\n\nNormal-sized examples include crowbars, lard, scrolls and torches. Anvils, chests, ladders and corpses are not normal-sized items; this rule gives no item-count conversion for them.',
    translationKo:
      '보통 크기의 물건을 근력+8개까지 들 수 있습니다. 이를 넘으면 근력·민첩 판정의 DR이 2 높아집니다. 기본 한도의 두 배를 초과해서는 들 수 없습니다.\n\n쇠지레, 돼지기름, 두루마리, 횃불은 보통 크기 물건의 예입니다. 모루, 상자, 사다리, 시체는 여기에 속하지 않으며, 이 규칙은 이들을 물건 몇 개로 셀지 정하지 않습니다.',
    book: 'core',
    pages: [28],
    printedPage: 28,
    status: 'VERIFIED',
    contexts: ['character', 'travel'],
    additionalSourceRefs: [fullEditionSource('Carrying Capacity', 31, 27)],
  },
  {
    id: 'core.violence',
    title: 'Core Combat / Initiative',
    titleKo: '전투와 선공',
    sourceTitle: 'Violence / Initiative / Melee / Ranged / Defence',
    summary:
      'Initiative d6: 1–3 enemies first; 4–6 PCs first. Use Agility + d6 for individual initiative or order within a group.\n\nPCs roll attacks and defences; enemies do not roll combat attacks. Melee: Strength DR12. Ranged: Presence DR12. Defence: Agility DR12; failure means the enemy hits. Modify these DRs as with other tests.\n\nEnemies attack once per round unless stated otherwise.',
    translationKo:
      '선공 d6: 1~3은 적이 먼저, 4~6은 PC가 먼저 행동합니다. 개인별 선공이나 같은 편 안의 순서는 민첩+d6로 정합니다.\n\nPC가 공격과 방어를 모두 굴리며, 적은 전투 공격 판정을 굴리지 않습니다. 근접 공격은 근력 DR12, 원거리 공격은 지각 DR12, 방어는 민첩 DR12입니다. 방어에 실패하면 적에게 맞습니다. 다른 판정처럼 상황에 따라 DR을 조정합니다.\n\n별도 지시가 없다면 적은 라운드마다 한 번 공격합니다.',
    book: 'core',
    pages: [30],
    printedPage: 30,
    status: 'VERIFIED',
    contexts: ['character', 'monster'],
    oracles: ['core.reaction', 'core.failedMorale'],
    additionalSourceRefs: [
      fullEditionSource(
        'Violence / Initiative / Melee / Ranged / Defence',
        33,
        29,
      ),
    ],
  },
  {
    id: 'core.crit-fumble',
    title: 'Core Crit / Fumble',
    titleKo: '전투의 치명타와 실수',
    sourceTitle: 'Crit / Fumble',
    summary:
      'Natural 20 — Attack: double damage and reduce the target’s armor/protection by one tier. Defence: the PC gains a free attack.\n\nNatural 1 — Attack: the weapon breaks or is lost. Defence: the PC takes double damage and armor loses one tier.\n\nDamaged armor keeps its Strength and Agility test penalties. Armor reduced below tier 1 is ruined and cannot be repaired.',
    translationKo:
      '자연 20 — 공격: 피해가 두 배가 되고 대상의 방어구·보호가 1단계 낮아집니다. 방어: PC가 추가 공격을 얻습니다.\n\n자연 1 — 공격: 무기가 부서지거나 무기를 잃습니다. 방어: PC가 두 배의 피해를 받고 방어구가 1단계 낮아집니다.\n\n방어구가 손상되어도 근력·민첩 판정의 불이익은 그대로입니다. 1단계 미만으로 떨어진 방어구는 망가져 수리할 수 없습니다.',
    book: 'core',
    pages: [31],
    printedPage: 31,
    status: 'VERIFIED',
    contexts: ['character', 'monster'],
    additionalSourceRefs: [fullEditionSource('Crit / Fumble', 33, 29)],
  },
  {
    id: 'core.armor-shield',
    title: 'Core Armor / Shield',
    titleKo: '방어구와 방패',
    sourceTitle: 'Armor / Heretical Priest: Abilities',
    summary:
      'Light armor (tier 1): reduce damage by d2. Medium (tier 2): d4 reduction; Agility tests, including defence, DR +2. Heavy (tier 3): d6 reduction; Agility tests DR +4, but defence DR +2.\n\nShield: reduce damage by 1, or break it to ignore all damage from one attack.\n\nScrolls do not work while wielding two-handed weapons or wearing medium/heavy armor. Heretical Priest may use Powers in medium armor.',
    translationKo:
      '경갑(1단계): 피해 d2 감소. 중갑(2단계): 피해 d4 감소, 방어를 포함한 민첩 판정 DR +2. 중장갑(3단계): 피해 d6 감소, 민첩 판정 DR +4지만 방어는 DR +2입니다.\n\n방패: 피해를 1 줄입니다. 또는 방패를 부수고 한 공격의 피해를 전부 무시할 수 있습니다.\n\n양손 무기를 들거나 중갑·중장갑을 착용하면 두루마리가 작동하지 않습니다. Heretical Priest는 예외적으로 중갑을 입고도 권능을 사용할 수 있습니다.',
    book: 'core',
    pages: [23, 54],
    printedPage: '23, 54',
    status: 'VERIFIED',
    contexts: ['character'],
    oracles: ['core.armor'],
    additionalSourceRefs: [
      fullEditionSource(
        'Armor / Heretical Priest: Abilities',
        [28, 59],
        '24, 55',
      ),
    ],
  },
  {
    id: 'core.casting',
    title: 'Using Powers',
    titleKo: '권능 사용',
    sourceTitle: 'Powers',
    summary:
      'Each morning, roll Presence + d4 to determine that day’s Power uses; choose from your available scrolls.\n\nRead a scroll: Presence DR12. Success activates the Power and spends one daily use. Failure: no effect, lose d2 HP, and become dizzy for one hour. During that hour, Powers always fail in the worst possible way.\n\nThe GM decides the effects of a casting Crit or Fumble. Arcane Catastrophes is an optional table.',
    translationKo:
      '매일 아침 지각+d4를 굴려 그날의 권능 사용 횟수를 정하고, 가진 두루마리 중에서 사용합니다.\n\n두루마리를 읽을 때 지각 DR12를 판정합니다. 성공하면 권능이 발동하고 그날의 사용 횟수가 1 줄어듭니다. 실패하면 발동하지 않고 HP d2를 잃으며 1시간 동안 어지럽습니다. 그동안 권능은 언제나 최악의 방식으로 실패합니다.\n\n권능 판정의 치명타·실수 효과는 GM이 정합니다. Arcane Catastrophes는 선택해서 사용하는 표입니다.',
    book: 'core',
    pages: [34],
    printedPage: 34,
    status: 'VERIFIED',
    contexts: ['character'],
    oracles: ['core.arcaneCatastrophes', 'core.sacred', 'core.unclean'],
    additionalSourceRefs: [fullEditionSource('Powers', 38, 34)],
  },
  {
    id: 'core.broken',
    title: 'Broken / Death',
    titleKo: '무력화와 죽음',
    sourceTitle: 'Hit Points / Broken',
    summary:
      'At exactly 0 HP, roll Broken d4. At negative HP, the character is dead.\n\nUse the Broken table for the consequence. Only Broken result 2 calls for the injury d6: 1–5 broken or severed limb; 6 lost eye.',
    translationKo:
      'HP가 정확히 0이면 Broken d4를 굴립니다. HP가 음수이면 사망합니다.\n\n결과에 따른 처리는 Broken 표에서 확인합니다. 2가 나왔을 때만 부상 d6를 추가로 굴립니다. 1~5는 팔다리 골절 또는 절단, 6은 한쪽 눈 상실입니다.',
    book: 'core',
    pages: [29],
    printedPage: 29,
    status: 'VERIFIED',
    contexts: ['character', 'monster'],
    oracles: ['core.broken', 'core.brokenInjury'],
    additionalSourceRefs: [
      fullEditionSource('Hit Points / Broken', [32, 33], '28, 29'),
    ],
  },
  {
    id: 'core.improvement',
    title: 'Getting Better',
    titleKo: '성장',
    sourceTitle: 'Getting Better or worse',
    summary:
      'The GM decides when a character improves.\n\nRoll 6d10. If the total meets or exceeds current maximum HP, increase maximum HP by d6. Roll the debris d6 table.\n\nFor each ability, roll d6. At or above the ability: +1; below it: −1. Abilities −3 through +1 increase unless the die is 1, which lowers them. Abilities stay within −3 to +6.',
    translationKo:
      'GM이 성장 시점을 정합니다.\n\n6d10 합계가 현재 최대 HP 이상이면 최대 HP가 d6 늘어납니다. 잔해 발견물 d6 표도 굴립니다.\n\n능력마다 d6를 굴려 능력치 이상이면 +1, 미만이면 −1입니다. 능력치 −3~+1은 주사위가 1일 때만 줄고, 그 외에는 늘어납니다. 능력치는 −3~+6 범위를 벗어나지 않습니다.',
    book: 'core',
    pages: [33],
    printedPage: 33,
    status: 'VERIFIED',
    contexts: ['character'],
    oracles: ['core.gettingBetterDebris'],
    additionalSourceRefs: [
      fullEditionSource('Getting Better or worse', 37, 33),
    ],
  },
  {
    id: 'core.reaction-morale',
    title: 'Core Reaction / Morale',
    titleKo: '반응과 사기',
    sourceTitle: 'Reaction / Morale',
    summary:
      'When a creature’s reaction is uncertain, use Reaction 2d6.\n\nCheck Morale when the leader dies, half the group is eliminated, or a lone enemy has only one-third of its HP left.\n\nRoll 2d6: greater than the enemy’s Morale means failure. Then d6: 1–3 flees; 4–6 surrenders.',
    translationKo:
      '생물의 반응이 불분명하면 Reaction 2d6를 사용합니다.\n\n지도자가 죽거나, 무리의 절반이 제거되거나, 단독 적의 HP가 3분의 1만 남았을 때 사기를 확인합니다.\n\n2d6가 적의 사기보다 높으면 실패입니다. 이어서 d6: 1~3은 도주, 4~6은 항복입니다.',
    book: 'core',
    pages: [32],
    printedPage: 32,
    status: 'VERIFIED',
    contexts: ['monster', 'npc'],
    oracles: ['core.reaction', 'core.failedMorale'],
    additionalSourceRefs: [fullEditionSource('Reaction / Morale', 35, 31)],
  },
  {
    id: 'core.flee',
    title: 'Core Fleeing',
    titleKo: '도주 판정의 범위',
    sourceTitle: 'Abilities / Tests / How long is a round?',
    summary:
      'Core lists fleeing under Agility. Use the ordinary test rule and a DR appropriate to the situation.\n\nThe Core rules here provide no separate fixed flee DR, chase distance or opportunity-attack sequence. Round movement is across a normal-sized room. Enemy failed Morale separately determines fleeing or surrender.',
    translationKo:
      'Core는 도주를 민첩의 사용 예로 듭니다. 일반 판정 규칙에 따라 상황에 맞는 DR로 판단합니다.\n\n이 Core 규칙에는 별도의 고정 도주 DR, 추격 거리, 기회공격 순서가 없습니다. 라운드 이동은 보통 크기의 방을 가로지르는 정도입니다. 적이 사기에 실패했을 때의 도주·항복 결과는 별도로 정합니다.',
    book: 'core',
    pages: [27, 28, 31, 32],
    printedPage: '27, 28, 31, 32',
    status: 'VERIFIED',
    contexts: ['character', 'monster', 'dungeon'],
    authority: [appPolicy('app.result-grouping')],
    additionalSourceRefs: [
      fullEditionSource('Abilities / Tests', 30, 26),
      fullEditionSource('How long is a round?', 34),
      fullEditionSource('Morale', 35, 31),
    ],
  },
  {
    id: 'core.services',
    title: 'Core Services / Ammunition',
    titleKo: '서비스와 탄약 가격',
    sourceTitle: 'Services / Weapons',
    summary:
      'Prices in silver (s).\n\nNight in hospice — 3s\nDrink — 1s\nSteady meal — 2s\nBribe, guard — 20–40s\nBribe, clerk — 30–60s\nBribe, rabble — 5–15s\nRepair armor, tier 1 to 2 — 25s\nRepair armor, tier 2 to 3 — 40s\n20 arrows — 10s\n10 bolts — 10s\n\nArmor cannot be repaired above its original tier. Armor reduced below tier 1 is ruined and cannot be repaired.',
    translationKo:
      '가격 단위는 은화(s)입니다.\n\n구호소에서 하룻밤 — 3s\n마실 것 — 1s\n든든한 식사 — 2s\n경비병에게 뇌물 — 20~40s\n서기에게 뇌물 — 30~60s\n무뢰한에게 뇌물 — 5~15s\n방어구 수리, 1단계→2단계 — 25s\n방어구 수리, 2단계→3단계 — 40s\n화살 20발 — 10s\n쇠뇌살 10발 — 10s\n\n방어구를 원래 단계보다 높게 수리할 수는 없습니다. 1단계 미만으로 떨어진 방어구는 망가져 수리할 수 없습니다.',
    book: 'core',
    pages: [25, 26, 31],
    printedPage: '25, 26, 31',
    status: 'VERIFIED',
    contexts: ['character', 'travel', 'city'],
    authority: [appPolicy('app.result-grouping')],
    additionalSourceRefs: [
      fullEditionSource('Equipment / Services / Weapons', 29, 25),
      fullEditionSource('Fumble / Armor damage', 33, 29),
    ],
  },
];
