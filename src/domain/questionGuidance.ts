export const QUESTION_INTENTS = [
  {
    id: 'action',
    label: '행동의 성공',
    example: '문을 부순다',
    explanation:
      '무엇을 하려는지 정하고 해당 행동 규칙으로 성공과 대가를 판단합니다. 전투·탐색·야영처럼 전용 절차가 있으면 그 절차를 사용하세요.',
  },
  {
    id: 'fact',
    label: '아직 모르는 사실',
    example: '문이 잠겼는가?',
    explanation:
      '이미 정해진 사실이 아니라면 예·아니오 질문으로 세계의 사실을 정합니다. Yes가 문을 부수는 데 성공했다는 뜻은 아닙니다.',
  },
  {
    id: 'detail',
    label: '묘사 보충',
    example: '문 너머 무엇이 있는가?',
    explanation:
      '공간·인물·사물의 모습을 구체화합니다. 묘사 표를 굴렸다고 행동의 성공이나 대가가 다시 바뀌지는 않습니다.',
  },
] as const;
export const QUESTION_TARGETS = {
  core: 'rule:core.tests',
  sd: 'rule:sd.general-move',
  yesNo: 'oracle:sd.yesNo',
  mythic: 'rule:mythic2.fate-question',
  dungeon: 'procedure:sd.room-description',
  city: 'procedure:aitc.street',
  journey: 'procedure:mythic2.meaning.terrain-descriptors.pair',
} as const;
