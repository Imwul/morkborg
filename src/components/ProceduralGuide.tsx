import type { ReactNode } from 'react';
import { playGuideFor, scenePlayActions } from '../domain/playGuidance';
import { useReferenceDesk } from './ReferenceContext';

export function ProceduralGuide({
  referenceId,
  children,
  outcomesOnly = false,
}: {
  referenceId: string;
  children?: ReactNode;
  outcomesOnly?: boolean;
}) {
  const guide = playGuideFor(referenceId),
    desk = useReferenceDesk();
  if (!guide) return null;
  return (
    <section
      className="procedure-quick-guide"
      aria-label="짧은 규칙 안내"
      data-interactive={!!children}
      data-outcomes-only={outcomesOnly}
    >
      <header>
        {!outcomesOnly && (
          <span>{children ? 'CAMPING MOVE' : 'QUICK RULE · 절차 요약'}</span>
        )}
        <h3>{outcomesOnly ? '여행 중 확인할 것' : guide.when}</h3>
      </header>
      {!outcomesOnly && (
        <ol>
          {guide.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      )}
      {children}
      {!!children && <h4 className="procedure-outcome-heading">결과 읽기</h4>}
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
          <button
            className="play-open-action"
            onClick={() => desk?.activate(guide.sourceId, false)}
          >
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
