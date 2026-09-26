import type { ReferenceReading } from '../domain/referenceReading';
import { resultTasks } from '../domain/resultFollowThrough';
import { useOracleRegistry } from '../storage/oracleStore';
import { GuidedRollControl } from './GuidedRollControl';
import { fixedReferenceReading } from '../domain/referenceFixedLookup';
import { ReferenceReadingText } from './ReferenceReadingText';
import { ReadingResultReferences } from './ResultReferenceLinks';
import { SourceDisclosure } from './SourceDisclosure';

/** Both the reader and Workbench use these same source-specific follow-through controls. */
export function ResultFollowThrough({
  reading,
}: {
  reading: ReferenceReading;
}) {
  const { registry } = useOracleRegistry();
  const rows = resultTasks(reading, registry);
  if (!rows.length) return null;
  return (
    <section
      className="result-follow-through play-guidance"
      aria-label="결과 후속 처리"
    >
      <header>
        <h3>이 결과 다음에는</h3>
        <small>해당 조건만 펼치세요. 수치·상태는 직접 적용합니다.</small>
      </header>
      {rows.map((row, index) => (
        <div key={`${row.entryId}:${index}`} data-follow-row={row.entryId}>
          {rows.length > 1 && (
            <p className="guidance-source">
              {row.title} · #{row.min}
            </p>
          )}
          {row.tasks.map((task) => (
            <details key={task.id} data-follow-task={task.id}>
              <summary>
                <strong>{task.title}</strong>
                <span>{task.condition}</span>
              </summary>
              <p>{task.effect}</p>
              {task.lookup && <FixedTaskExcerpt lookup={task.lookup} />}
              {task.roll && (
                <GuidedRollControl
                  spec={task.roll}
                  label={task.title}
                  stateKey={`${reading.oracle?.id ?? JSON.stringify(reading.blocks)}:${row.entryId}:${index}:${task.id}`}
                />
              )}
            </details>
          ))}
        </div>
      ))}
    </section>
  );
}

/** An inherited row is an inline reading, so it cannot overwrite the parent's held result. */
function FixedTaskExcerpt({
  lookup,
}: {
  lookup: { oracleId: string; roll: number };
}) {
  const { registry } = useOracleRegistry();
  if (!registry.tables.some((t) => t.id === lookup.oracleId))
    return <p>지정된 원문 표를 불러오지 못했습니다.</p>;
  const fixed = fixedReferenceReading(registry, lookup);
  return (
    <details className="fixed-task-excerpt">
      <summary>
        지정된 항목 #{lookup.roll} 아래에 펼치기 · 추가 굴림 없음
      </summary>
      <article
        className="inline-reading"
        aria-label={`${fixed.title} 지정 항목 ${lookup.roll}`}
      >
        <h4>{fixed.title}</h4>
        {fixed.blocks.map((block, i) => (
          <ReferenceReadingText
            key={i}
            text={block.text}
            translation={block.translation?.ko}
          />
        ))}
        <ReadingResultReferences reading={fixed} />
        <ResultFollowThrough reading={fixed} />
        <SourceDisclosure refs={fixed.sourceRefs} />
      </article>
    </details>
  );
}
