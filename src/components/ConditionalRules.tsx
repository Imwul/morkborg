import { usePlayToolState } from './usePlayToolState';
import { CONDITIONAL_RULES } from '../domain/conditionalRules';
import { useReferenceDesk } from './ReferenceContext';
import { GuidedRollControl } from './GuidedRollControl';
export function ConditionalRules({
  initialTopic = 'powers',
  onOpen,
}: {
  initialTopic?: string;
  onOpen?: (id: string) => void;
}) {
  const desk = useReferenceDesk();
  const [topicId, setTopic] = usePlayToolState(
    `conditions:${initialTopic}:topic`,
    initialTopic,
  );
  const topic = CONDITIONAL_RULES.find((t) => t.id === topicId)!;
  const [conditionId, setCondition] = usePlayToolState(
    `conditions:${initialTopic}:condition`,
    topic.conditions[0].id,
  );
  const condition =
    topic.conditions.find((c) => c.id === conditionId) ?? topic.conditions[0];
  return (
    <section
      className="conditional-rules play-guidance"
      aria-label="조건별 규칙 요약"
    >
      <header>
        <h3>지금 해당하는 조건</h3>
        <small>조건 → 판정 → 효과</small>
      </header>
      <div className="guidance-selectors">
        <label>
          규칙
          <select
            value={topicId}
            onChange={(e) => {
              setTopic(e.target.value);
              setCondition('');
            }}
          >
            {CONDITIONAL_RULES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          조건
          <select
            value={condition.id}
            onChange={(e) => setCondition(e.target.value)}
          >
            {topic.conditions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <dl className="guidance-steps">
        <div>
          <dt>조건</dt>
          <dd>{condition.condition}</dd>
        </div>
        <div>
          <dt>판정</dt>
          <dd>{condition.test}</dd>
        </div>
        <div>
          <dt>효과</dt>
          <dd>{condition.effect}</dd>
        </div>
      </dl>
      {condition.roll && (
        <GuidedRollControl
          key={`${topicId}:${condition.id}`}
          spec={condition.roll}
          stateKey={`condition:${topicId}:${condition.id}`}
          label={condition.label}
        />
      )}
      <div className="guidance-links">
        {condition.references.map((id) => (
          <button
            key={id}
            disabled={!desk?.byId[id]?.available}
            onClick={() => (onOpen ? onOpen(id) : desk?.activate(id, false))}
          >
            {desk?.byId[id]?.title ?? '원문 참조'} ↗
          </button>
        ))}
      </div>
      <small className="guidance-source">
        앱의 한국어 요약 · 전체 조건과 출처는 연결된 참조에서 확인
      </small>
    </section>
  );
}
