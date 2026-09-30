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
        </header>
        <div className="desk-home-generator-grid desk-generators-primary">
          {DESK_RECORD_GENERATORS.map(([ids, title, description]) => {
            const id = ids.find((candidate) => desk?.byId[candidate]) ?? ids[0];
            return (
              <button
                key={title}
                data-shortcut={id}
                onClick={() => onOpenReference(id)}
              >
                <strong>{title}</strong>
                <span>{description}</span>
              </button>
            );
          })}
        </div>
        <div className="desk-home-generator-grid desk-generators-secondary">
          {DESK_GENERATOR_SHORTCUTS.filter(([id]) => desk?.byId[id]).map(
            ([id, title, description]) => (
              <button
                key={id}
                data-shortcut={id}
                onClick={() => onOpenReference(id)}
              >
                <strong>{title}</strong>
                <span>{description}</span>
              </button>
            ),
          )}
        </div>
      </section>
    </section>
  );
}
