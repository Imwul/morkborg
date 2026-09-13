import type { Section } from '../domain/types';
import { useReferenceDesk } from './ReferenceContext';

/** Shortcuts to existing pages and generators. Opening one never rolls or saves. */
export const DESK_REFERENCE_SHORTCUTS = [
  ['oracle:core.reaction', 'Reaction', '반응'],
  ['rule:core.reaction-morale', 'Morale', '사기'],
  ['oracle:core.weather', 'Weather', '날씨'],
  ['oracle:core.corpsePlundering', 'Corpse', '시체 수색'],
  ['rule:sd.travel-day', 'Travel', '여행'],
  ['oracle:core.miseries', 'Miseries', '코어 재앙'],
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
}: {
  generators: boolean;
  onGenerator?: (section: Section) => void;
  onGenerators: () => void;
}) {
  const desk = useReferenceDesk();
  const openGenerator = (section: Section) => {
    desk?.dismiss?.();
    onGenerator?.(section);
  };
  return (
    <section
      className="desk-landing"
      aria-label={generators ? '생성기 모음' : '홈'}
    >
      <header>
        <p className="desk-landing-folio">
          {generators ? 'MB · GEN' : 'MB · DESK'}
        </p>
        <h2>{generators ? '생성기' : 'Reference Desk'}</h2>
        <p>
          {generators ? '캐릭터부터 방 하나까지.' : '찾고, 펼치고, 굴리세요.'}
        </p>
      </header>
      {!generators && (
        <section aria-label="빠른 참조">
          <h3>빠른 참조</h3>
          <div className="desk-shortcut-list">
            {DESK_REFERENCE_SHORTCUTS.filter(([id]) => desk?.byId[id]).map(
              ([id, title, description]) => (
                <button key={id} onClick={() => desk?.activate(id)}>
                  <strong>{title}</strong>
                  <span>{description}</span>
                  <span aria-hidden="true">↗</span>
                </button>
              ),
            )}
          </div>
        </section>
      )}
      <section aria-label="생성 도구">
        {!generators && (
          <h3>
            생성기 <button onClick={onGenerators}>전체 보기 ↗</button>
          </h3>
        )}
        {onGenerator && (
          <div className="desk-generator-records">
            <button onClick={() => openGenerator('characters')}>
              <strong>캐릭터</strong>
              <span>능력치 · 직업 · 장비 · 배경</span>
              <span aria-hidden="true">↗</span>
            </button>
            <button onClick={() => openGenerator('monsters')}>
              <strong>몬스터</strong>
              <span>The Monster Approaches · Eat Prey Kill</span>
              <span aria-hidden="true">↗</span>
            </button>
            <button onClick={() => openGenerator('dungeons')}>
              <strong>던전</strong>
              <span>던전 후보 · 방 · 세부 항목</span>
              <span aria-hidden="true">↗</span>
            </button>
          </div>
        )}
        <div className="desk-shortcut-list">
          {DESK_GENERATOR_SHORTCUTS.filter(([id]) => desk?.byId[id])
            .slice(0, generators ? undefined : 3)
            .map(([id, title, description]) => (
              <button key={id} onClick={() => desk?.activate(id)}>
                <strong>{title}</strong>
                <span>{description}</span>
                <span aria-hidden="true">↗</span>
              </button>
            ))}
        </div>
      </section>
    </section>
  );
}
