import type { Section } from '../domain/types';
import { useReferenceDesk } from './ReferenceContext';
import { SPATIAL_SCENES } from '../domain/spatialScenes';

/** Shortcuts to existing pages and generators. Opening one never rolls or saves. */
export const DESK_REFERENCE_SHORTCUTS = [
  ['oracle:core.miseries', 'Miseries', '코어 재앙'],
  ['oracle:core.weather', 'Weather', '날씨'],
  ['oracle:core.names', 'Names', '이름'],
  ['oracle:core.reaction', 'Reaction', '반응'],
  ['procedure:reclvse.action-theme', 'Action + Theme', '행동과 주제'],
] as const;

export const DESK_ROOM_SHORTCUTS = [
  ['oracle:sd.room.contents', 'Room Contents'],
  ['oracle:sd.room.exits', 'Room Exit'],
] as const;

export const DESK_RECORD_GENERATORS = [
  [
    [
      'procedure:character.core-classless',
      'procedure:character.class:gutterborn-scum',
    ],
    '캐릭터',
    '능력치 · 직업 · 장비 · 배경',
  ],
  [
    [
      'oracle:feretory.A',
      'procedure:workbench.epk',
      'rule:feretory.monster-approaches',
      'procedure:feretory.monster-approaches',
    ],
    '몬스터',
    'The Monster Approaches · Eat Prey Kill',
  ],
  [
    [
      'procedure:sd.dungeon-preparation',
      'procedure:core.dungeon-title',
      'procedure:sd.room-description',
    ],
    '던전',
    '던전 후보 · 방 · 세부 항목',
  ],
] as const;

export const DESK_GENERATOR_SHORTCUTS = [
  ['procedure:workbench.npc', 'NPC', '이름 · 성격 · 직업 · 외형 · 반응'],
  ['procedure:sd.room-description', '방', '방의 특징 · 내용 · 출구'],
  ['procedure:aitc.street', '거리', '형용사 · 거리 유형 · 내용'],
  ['procedure:aitc.settlement', '정착지', '규모 · 이름 · 특징'],
  ['oracle:core.names', '이름', 'Core 이름표'],
  ['procedure:reclvse.action-theme', 'Action + Theme', '행동과 주제 조합'],
  [
    'procedure:heretic.seeds-of-cvlt',
    'Seeds of a Cvlt',
    '이름 · 구성원 · 의식 · 적대',
  ],
  [
    'procedure:reclvse.adventure-calls',
    'Adventure Calls',
    '도입 · 목적지 · 위험 · 반전',
  ],
  ['procedure:reclvse.weather-detail', 'Weather Detail', '날씨 세부 표 1–3개'],
  ['procedure:sd.buildings', 'Buildings & Structures', '재료 · 크기 · 형태'],
] as const;

const GENERATOR_GROUPS = [
  {
    id: 'people',
    title: 'People & creatures',
    subtitle: '인물과 생물',
    primary: [0, 1],
    secondary: [0],
  },
  {
    id: 'places',
    title: 'Places',
    subtitle: '장소',
    primary: [2],
    secondary: [1, 2, 3, 8, 9],
  },
  {
    id: 'sparks',
    title: 'Sparks',
    subtitle: '이름과 이야기의 단서',
    primary: [],
    secondary: [4, 5, 6, 7],
  },
] as const;

export function DeskLanding({
  generators,
  onGenerator,
  onGenerators,
  onOpenReference,
  onSpatial,
}: {
  generators: boolean;
  onGenerator?: (section: Section) => void;
  onGenerators: () => void;
  onOpenReference: (id: string) => void;
  onSpatial: (id: string) => void;
}) {
  const desk = useReferenceDesk();
  void onGenerator;
  if (!generators)
    return (
      <section className="desk-home" aria-label="홈">
        <section
          className="desk-home-references"
          aria-labelledby="home-references-title"
        >
          <h2 id="home-references-title">
            <span>빠른 참조</span>
          </h2>
          <div className="desk-home-grid">
            {DESK_REFERENCE_SHORTCUTS.filter(([id]) => desk?.byId[id]).map(
              ([id, title, description]) => (
                <button
                  key={id}
                  className={
                    /^[A-Za-z]/.test(title)
                      ? 'desk-home-english-link'
                      : undefined
                  }
                  data-shortcut={id}
                  onClick={() => onOpenReference(id)}
                >
                  <strong>{title}</strong>
                  <span>{description}</span>
                </button>
              ),
            )}
            <section
              className="desk-home-room"
              aria-labelledby="home-room-title"
            >
              <h3 id="home-room-title">Dungeon Room Descriptors</h3>
              <div>
                {DESK_ROOM_SHORTCUTS.filter(([id]) => desk?.byId[id]).map(
                  ([id, title]) => (
                    <button
                      key={id}
                      data-shortcut={id}
                      onClick={() => onOpenReference(id)}
                    >
                      {title}
                    </button>
                  ),
                )}
              </div>
            </section>
          </div>
        </section>
        <section
          className="desk-home-generators"
          aria-labelledby="home-generators-title"
        >
          <header>
            <h2 id="home-generators-title">생성기</h2>
            <button className="desk-home-all" onClick={onGenerators}>
              전체 보기
            </button>
          </header>
          <div className="desk-home-generator-grid">
            {DESK_RECORD_GENERATORS.map(([ids, title, description]) => {
              const id =
                ids.find((candidate) => desk?.byId[candidate]) ?? ids[0];
              return (
                id && (
                  <button
                    key={id}
                    className="desk-home-primary-link"
                    data-shortcut={id}
                    onClick={() => onOpenReference(id)}
                  >
                    <strong>{title}</strong>
                    <span>{description}</span>
                  </button>
                )
              );
            })}
            {DESK_GENERATOR_SHORTCUTS.filter(([id]) => desk?.byId[id])
              .slice(0, 3)
              .map(([id, title, description]) => (
                <button
                  key={id}
                  className={
                    /^[A-Za-z]/.test(title)
                      ? 'desk-home-english-link'
                      : undefined
                  }
                  data-shortcut={id}
                  onClick={() => onOpenReference(id)}
                >
                  <strong>{title}</strong>
                  <span>{description}</span>
                </button>
              ))}
          </div>
        </section>
        <section
          className="desk-home-spatial"
          aria-labelledby="home-spatial-title"
        >
          <h2 id="home-spatial-title">공간 탐색</h2>
          <nav aria-label="홈에서 공간 탐색">
            {SPATIAL_SCENES.map((scene) => (
              <button key={scene.id} onClick={() => onSpatial(scene.id)}>
                <strong>{scene.title}</strong>
                <span>{scene.subtitle}</span>
              </button>
            ))}
          </nav>
        </section>
      </section>
    );
  return (
    <section className="desk-home desk-generators" aria-label="생성기 모음">
      <section
        className="desk-home-generators"
        aria-labelledby="generators-title"
      >
        <header>
          <h2 id="generators-title">
            <span>생성기</span>
          </h2>
          <p>인물과 장소를 준비하고, 이야기의 빈 곳을 채우세요.</p>
        </header>
        <div className="desk-generator-groups">
          {GENERATOR_GROUPS.map((group) => (
            <section
              className="desk-generator-group"
              key={group.id}
              aria-labelledby={`generator-group-${group.id}`}
            >
              <header>
                <h3 id={`generator-group-${group.id}`}>{group.title}</h3>
                <p>{group.subtitle}</p>
              </header>
              {group.primary.map((position) => {
                const [ids, title, description] =
                  DESK_RECORD_GENERATORS[position];
                const id =
                  ids.find((candidate) => desk?.byId[candidate]) ?? ids[0];
                return (
                  <button
                    className="desk-generator-link desk-generator-major"
                    key={id}
                    data-shortcut={id}
                    onClick={() => onOpenReference(id)}
                  >
                    <strong>{title}</strong>
                    <span>{description}</span>
                  </button>
                );
              })}
              {group.secondary.map((position) => {
                const [id, title, description] =
                  DESK_GENERATOR_SHORTCUTS[position];
                return desk?.byId[id] ? (
                  <button
                    className={
                      'desk-generator-link' +
                      (/^[A-Za-z]/.test(title) ? ' desk-home-english-link' : '')
                    }
                    key={id}
                    data-shortcut={id}
                    onClick={() => onOpenReference(id)}
                  >
                    <strong>{title}</strong>
                    <span>{description}</span>
                  </button>
                ) : null;
              })}
            </section>
          ))}
        </div>
      </section>
    </section>
  );
}
