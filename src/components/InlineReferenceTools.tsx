import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useOracleRegistry } from '../storage/oracleStore';
import { useRules } from '../storage/rulesStore';
import { buildReferenceRegistry } from '../domain/references';
import { executeReference } from '../domain/referenceExecution';
import { referenceShortName } from '../domain/referenceActions';
import {
  copyReferenceReading,
  type ReferenceReading,
} from '../domain/referenceReading';
import type { RegionId } from '../domain/types';
import { SourceDisclosure } from './SourceDisclosure';
import { useReferenceDesk } from './ReferenceContext';
import { fixedReferenceReading } from '../domain/referenceFixedLookup';
import { ReferenceReadingText } from './ReferenceReadingText';
import { Translation } from './Translation';
import './inline-reference-tools.css';

export function ReferenceReadingBlock({
  reading,
  onReroll,
  onDismiss,
}: {
  reading: ReferenceReading;
  onReroll?: () => void;
  onDismiss?: () => void;
}) {
  const [copyState, setCopyState] = useState('');
  const [fallback, setFallback] = useState('');
  const { registry } = useOracleRegistry();
  const desk = useReferenceDesk();
  const sourceRows = [
    ...(reading.oracle?.rolls ?? []),
    ...reading.sourceRefs.flatMap((ref) => {
      const table = registry.tables.find((table) => table.id === ref.tableId);
      const entry = table?.entries.find((entry) => entry.id === ref.entryId);
      return entry ? [entry] : [];
    }),
  ];
  const [fixedResult, setFixedResult] = useState<{
    parent: ReferenceReading;
    reading: ReferenceReading;
  }>();
  const [fixedError, setFixedError] = useState('');
  function openFixed(lookup: { oracleId: string; roll: number }) {
    try {
      setFixedResult({
        parent: reading,
        reading: fixedReferenceReading(registry, lookup),
      });
      setFixedError('');
      desk?.touch(`oracle:${lookup.oracleId}`);
    } catch (error) {
      setFixedError(
        error instanceof Error ? error.message : '원문 참조를 확인하세요.',
      );
    }
  }
  async function copy(withSource = false) {
    const text = copyReferenceReading(reading, withSource);
    try {
      await navigator.clipboard.writeText(text);
      setCopyState('복사됨');
    } catch {
      setFallback(text);
      setCopyState('아래 텍스트를 복사하세요.');
    }
  }
  return (
    <article className="inline-reading" aria-label={reading.title}>
      <header>
        <h4>
          {reading.title}
          <Translation text={reading.title} />
        </h4>
        <div className="inline-actions">
          {onReroll && (
            <Button size="sm" variant="outline" onClick={onReroll}>
              재굴림
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => void copy()}>
            COPY
          </Button>
          <Button size="sm" variant="ghost" onClick={() => void copy(true)}>
            출처 포함
          </Button>
          {onDismiss && (
            <Button size="sm" variant="ghost" onClick={onDismiss}>
              접기
            </Button>
          )}
        </div>
      </header>
      {reading.blocks.map((block, index) => (
        <section
          key={index}
          className={
            block.kind === 'creature'
              ? 'inline-reading-part creature-answer'
              : 'inline-reading-part'
          }
        >
          {block.title && block.title !== reading.title && (
            <strong>
              {block.title}
              <Translation text={block.title} />
            </strong>
          )}
          {block.dice && <small>{block.dice}</small>}
          <ReferenceReadingText
            text={block.text}
            source={sourceRows.find(
              (row) =>
                block.text === row.text ||
                block.text.startsWith(`${row.text}\n\n`),
            )}
          />
        </section>
      ))}
      {copyState && <output>{copyState}</output>}
      {fallback && (
        <textarea
          aria-label="복사할 결과"
          readOnly
          value={fallback}
          onFocus={(event) => event.target.select()}
        />
      )}
      <SourceDisclosure refs={reading.sourceRefs} evidence={reading.evidence} />
      {!!reading.fixedLookups?.length && (
        <div className="inline-tool-buttons">
          <small>원문이 지정한 결과</small>
          {reading.fixedLookups.map((lookup) => (
            <Button
              key={`${lookup.oracleId}:${lookup.roll}`}
              size="sm"
              variant="outline"
              onClick={() => openFixed(lookup)}
            >
              {registry.tables.find((table) => table.id === lookup.oracleId)
                ?.title ?? lookup.oracleId}{' '}
              · #{lookup.roll}
            </Button>
          ))}
        </div>
      )}
      {fixedError && <p role="alert">{fixedError}</p>}
      {fixedResult?.parent === reading && (
        <ReferenceReadingBlock
          reading={fixedResult.reading}
          onDismiss={() => setFixedResult(undefined)}
        />
      )}
    </article>
  );
}

/** Topic groups stay in their current workspace; each button resolves one canonical reference. */
export function InlineReferenceTools({
  title,
  ids,
  region = 'sarkash',
  description,
  initiallyOpen = false,
  cityLarge = false,
  cityExits = true,
}: {
  title: string;
  ids: readonly string[];
  region?: RegionId;
  description?: string;
  initiallyOpen?: boolean;
  cityLarge?: boolean;
  cityExits?: boolean;
}) {
  const { registry } = useOracleRegistry(),
    { pack } = useRules();
  const index = useMemo(
    () => buildReferenceRegistry(registry, pack),
    [registry, pack],
  );
  const desk = useReferenceDesk();
  const [active, setActive] = useState<string>();
  const [reading, setReading] = useState<ReferenceReading>();
  const [error, setError] = useState('');
  const [trail, setTrail] = useState<
    { id: string; reading: ReferenceReading }[]
  >([]);
  function open(id: string) {
    const entry = index.byId[id];
    if (!entry) return;
    id = entry.id;
    try {
      setError('');
      const result = executeReference(entry, {
        registry,
        rules: pack,
        region,
        stockKind: 'common',
        stockDR: 10,
        cityLarge,
        cityExits,
      }) ?? {
        title: entry.title,
        blocks: [{ title: '', text: entry.summary }],
        sourceRefs: entry.sourceRefs,
      };
      if (reading && active && active !== id)
        setTrail((past) => [...past.slice(-7), { id: active, reading }]);
      setActive(id);
      setReading(result);
      desk?.touch(id);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : '원문 자료를 확인하세요.',
      );
    }
  }
  const visible = [
    ...new Map(
      ids.flatMap((id) =>
        index.byId[id] ? [[index.byId[id].id, index.byId[id]] as const] : [],
      ),
    ).values(),
  ];
  const related =
    reading && active
      ? [
          ...new Set(
            [
              ...(reading.relatedIds ?? []),
              ...(index.byId[active]?.relatedIds ?? []),
            ]
              .map((id) => index.byId[id]?.id)
              .filter((id): id is string => !!id),
          ),
        ]
          .filter((id) => index.byId[id] && !id.startsWith('book:'))
          .slice(0, 6)
      : [];
  return (
    <details className="inline-tools" open={initiallyOpen || undefined}>
      <summary>
        {title}
        <small>{visible.length} TOOLS</small>
      </summary>
      {description && <p className="inline-tools-note">{description}</p>}
      <div className="inline-tool-buttons">
        {visible.map((entry) => {
          const id = entry.id;
          return (
            <Button
              key={id}
              size="sm"
              variant="outline"
              onClick={() => open(id)}
            >
              {referenceShortName(entry)}
            </Button>
          );
        })}
      </div>
      {error && <p role="alert">{error}</p>}
      {reading && (
        <>
          <div className="inline-actions">
            {trail.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  const previous = trail.at(-1)!;
                  setActive(previous.id);
                  setReading(previous.reading);
                  setTrail(trail.slice(0, -1));
                }}
              >
                ← 이전 표
              </Button>
            )}
            {active && desk && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => desk.togglePin(active)}
              >
                {desk.pinnedIds.includes(active) ? '고정 해제' : 'PIN'}
              </Button>
            )}
          </div>
          <ReferenceReadingBlock
            reading={reading}
            onReroll={
              active &&
              index.byId[active]?.available &&
              index.byId[active]?.action?.kind !== 'rule'
                ? () => open(active)
                : undefined
            }
            onDismiss={() => setReading(undefined)}
          />
          {related.length > 0 && (
            <div className="inline-tool-buttons">
              <small>RELATED</small>
              {related.map((id) => (
                <Button
                  key={id}
                  size="sm"
                  variant="ghost"
                  onClick={() => open(id)}
                >
                  {referenceShortName(index.byId[id])}
                </Button>
              ))}
            </div>
          )}
        </>
      )}
    </details>
  );
}
