import type { ReferenceReading } from '../domain/referenceReading';
import { journeyGuidance } from '../domain/journeyGuidance';
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
  return (
    <section
      className="journey-guidance play-guidance"
      aria-label="여정 행동 안내"
    >
      <header>
        <h3>{reading ? '여정 이어가기' : '여기서 할 수 있는 일'}</h3>
        <small>SD · FERETORY / 행동 안내</small>
      </header>
      <p>{guide.note}</p>
      <div className="guidance-links">
        {guide.links.map((link) => (
          <button
            key={link.id}
            disabled={!desk?.byId[link.id]?.available}
            onClick={() => desk?.activate(link.id, false)}
          >
            {link.label} ↗
          </button>
        ))}
      </div>
    </section>
  );
}
