import { playGuideFor, scenePlayActions } from '../domain/playGuidance';
import { useReferenceDesk } from './ReferenceContext';

export function ProceduralGuide({ referenceId }: { referenceId: string }) {
  const guide = playGuideFor(referenceId),
    desk = useReferenceDesk();
  if (!guide) return null;
  return (
    <section className="procedure-quick-guide" aria-label="짧은 규칙 안내">
      <header>
        <span>QUICK RULE · 절차 요약</span>
        <h3>{guide.when}</h3>
      </header>
      <ol>
        {guide.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <dl>
        {guide.outcomes.map(([grade, text]) => (
          <div key={grade}>
            <dt>{grade}</dt>
            <dd>{text}</dd>
          </div>
        ))}
      </dl>
      <footer>
        <small>{guide.source}</small>
        {guide.sourceId !== referenceId && (
          <button onClick={() => desk?.activate(guide.sourceId, false)}>
            전체 행동 절차 열기 ↗
          </button>
        )}
      </footer>
    </section>
  );
}
export function ScenePlayActions({
  scene,
  role,
  onOpen,
}: {
  scene: string;
  role?: string;
  onOpen: (id: string) => void;
}) {
  const actions = scenePlayActions(scene, role),
    desk = useReferenceDesk();
  if (!actions.length) return null;
  return (
    <section
      className="scene-play-actions"
      aria-label="상황에서 할 수 있는 행동"
    >
      <header>
        <h3>무엇을 할까?</h3>
        <span>
          {role
            ? '선택한 장소에서 떠올릴 행동'
            : '행동을 고르면 규칙과 판정이 열립니다.'}
        </span>
      </header>
      <div>
        {actions.map((action) => (
          <button
            key={action.referenceId}
            disabled={!desk?.byId[action.referenceId]}
            aria-pressed={desk?.selectedId === action.referenceId}
            onClick={() => onOpen(action.referenceId)}
          >
            <strong>{action.label}</strong>
            <small>{action.hint}</small>
          </button>
        ))}
      </div>
    </section>
  );
}
