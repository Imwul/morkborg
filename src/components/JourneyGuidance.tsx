import type { ReferenceReading } from '../domain/referenceReading';
import { journeyGuidance, type GuidanceLink } from '../domain/journeyGuidance';
import { useOracleRegistry } from '../storage/oracleStore';
import { useReferenceDesk } from './ReferenceContext';
export function JourneyGuidance({
  referenceId,
  reading,
}: {
  referenceId: string;
  reading?: ReferenceReading;
}) {
  const desk = useReferenceDesk();
  const { registry } = useOracleRegistry();
  const guide = journeyGuidance(referenceId, reading, registry);
  if (!guide) return null;
  const labels: Record<string, string> = {
    'rule:feretory.travel-distances': '여행일 정하기',
    'rule:sd.daily-misery': 'Calendar 열기',
    'oracle:core.weather': '날씨 열기 · d12',
    'oracle:feretory.roadType': '길의 상태 열기 · d8',
    'oracle:feretory.roadEvent': '길의 사건 열기 · d20',
    'rule:sd.camping-move': '야영 판정 열기',
    'oracle:feretory.campsite': '밤의 사건 열기 · d12',
  };
  const linkButton = (link: GuidanceLink) => (
    <button
      key={link.id}
      className="play-open-action"
      disabled={!desk?.byId[link.id]?.available}
      onClick={() => desk?.activate(link.id, false)}
    >
      <span>{labels[link.id] ?? link.label}</span>
      <span aria-hidden="true">→</span>
    </button>
  );
  return (
    <section
      className="journey-guidance play-guidance"
      aria-label="여정 행동 안내"
      data-staged={!!guide.stages}
    >
      <header>
        <h3>
          {reading
            ? '여정 이어가기'
            : guide.stages
              ? '하루 여행 순서'
              : '필요할 때'}
        </h3>
      </header>
      <p>{guide.note}</p>
      {guide.stages ? (
        <ol className="journey-stage-list">
          {guide.stages.map((stage) => (
            <li key={stage.title}>
              <h4>{stage.title}</h4>
              <p>{stage.note}</p>
              <div className="journey-stage-actions">
                {stage.referenceIds
                  .map((id) => guide.links.find((link) => link.id === id))
                  .filter((link): link is GuidanceLink => !!link)
                  .map(linkButton)}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div className="guidance-links">{guide.links.map(linkButton)}</div>
      )}
      <small className="guidance-source">SD · FERETORY</small>
    </section>
  );
}
