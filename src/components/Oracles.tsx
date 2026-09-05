import { SourceText } from './SourceText';
import { shortBookTitle } from '../domain/sourceDisplay';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, BookOpen, Dices, Search, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PrivateDataTools } from './PrivateDataTools';
import { SourceDisclosure } from './SourceDisclosure';
import { Translation } from './Translation';
import { Input } from '@/components/ui/input';
import type { Campaign } from '../domain/types';
import {
  type OraclePreferences,
  type OracleResult,
  type OracleRegistry,
} from '../domain/oracle';
import {
  appendOracleNotes,
  notesDestinations,
  notesTargetKey,
  type NotesTarget,
} from '../domain/oracleNotes';
import { filterOracles } from '../data/oracles';
import {
  oracleLibraryId,
  oracleLibraryRollIds,
  oracleLibraryTables,
} from '../data/oracles/library';
import {
  pairedOracleProcedure,
  rollProcedure,
  sourceLabel,
} from '../generators/oracleRoller';
import { editCampaign } from '../storage/saveStore';
import { saveOracleEvent, linkToSession } from '../domain/chronicleOperations';
import { captureContext } from '../domain/captureContext';
import { loadOraclePack, useOracleRegistry } from '../storage/oracleStore';
import { loadRules } from '../storage/rulesStore';
import { scalarText } from '../generators/tables';
import {
  readOraclePreferences,
  writeOraclePreferences,
} from '../storage/oraclePreferences';

export function Oracles({
  campaign,
  context,
  onClose,
  notify,
}: {
  campaign?: Campaign;
  context: NotesTarget | null;
  onClose: () => void;
  notify: (message: string) => void;
}) {
  const { registry, issues, loading, error } = useOracleRegistry();
  const [prefs, setPrefs] = useState(readOraclePreferences);
  const [query, setQuery] = useState(''),
    [favoritesOnly, setFavoritesOnly] = useState(false);
  const [selectedId, setSelectedId] = useState(''),
    [page, setPage] = useState(0);
  const rollerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (selectedId && window.matchMedia('(max-width: 1100px)').matches)
      rollerRef.current?.scrollIntoView({ block: 'start' });
  }, [selectedId]);
  const [history, setHistory] = useState<OracleResult[]>([]),
    [result, setResult] = useState<OracleResult | null>(null);
  const [savedEventId, setSavedEventId] = useState('');
  const [failure, setFailure] = useState(''),
    [includeSource, setIncludeSource] = useState(true);
  const destinations = campaign ? notesDestinations(campaign) : [];
  const [destination, setDestination] = useState(
    context ? notesTargetKey(context) : '',
  );
  const contextLabel = destinations.find(
    (d) => context && notesTargetKey(d.target) === notesTargetKey(context),
  )?.label;
  const library = useMemo(
    () => ({ ...registry, tables: oracleLibraryTables(registry) }),
    [registry],
  );
  const selected = library.tables.find((t) => t.id === selectedId);
  const rollIds = selected ? oracleLibraryRollIds(selected.id) : [];
  const sourceTables = registry.tables.filter((table) =>
    rollIds.includes(table.id),
  );
  const isPair = rollIds.length === 2;
  const filtered = useMemo(
    () =>
      filterOracles(library, {
        source: prefs.source,
        favorites: favoritesOnly ? prefs.favoriteIds : undefined,
      }).filter((t) =>
        `${t.title} ${library.books.find((b) => b.id === t.sourceBookId)?.title} ${shortBookTitle(t.sourceBookId)}`
          .toLocaleLowerCase()
          .includes(query.trim().toLocaleLowerCase()),
      ),
    [library, query, prefs, favoritesOnly],
  );
  function preference(patch: Partial<OraclePreferences>) {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    setPage(0);
    try {
      writeOraclePreferences(next);
    } catch {
      setFailure(
        '즐겨찾기와 필터를 이 기기에 저장할 수 없습니다. 현재 화면에서는 계속 사용할 수 있습니다.',
      );
    }
  }
  function favorite(id: string) {
    preference({
      favoriteIds: prefs.favoriteIds.includes(id)
        ? prefs.favoriteIds.filter((v) => v !== id)
        : [...prefs.favoriteIds, id],
    });
  }
  function select(id: string) {
    setSelectedId(oracleLibraryId(id));
    setResult(null);
    setFailure('');
  }
  function roll() {
    try {
      const next = rollProcedure(
        pairedOracleProcedure(selected!, registry),
        registry,
      );
      setResult(next);
      setHistory((h) => [next, ...h].slice(0, 5));
      setFailure('');
    } catch (e) {
      setFailure(e instanceof Error ? e.message : '표를 확인하세요.');
    }
  }
  function addNotes() {
    if (!result || !campaign) return;
    const target = destinations.find(
      (d) => notesTargetKey(d.target) === destination,
    );
    if (!target) {
      setFailure('노트를 추가할 대상을 선택하세요.');
      return;
    }
    try {
      editCampaign(campaign.id, (c) =>
        appendOracleNotes(c, target.target, result, includeSource),
      );
      notify(`${target.label}에 결과를 덧붙였습니다.`);
      setFailure('');
    } catch (e) {
      setFailure(
        e instanceof Error ? e.message : '노트를 추가하지 못했습니다.',
      );
    }
  }
  const targetTitle = selected?.title;
  const canRoll =
    !!selected &&
    rollIds.every((id) => {
      const table = registry.tables.find((t) => t.id === id);
      return (
        table &&
        table.rollable !== false &&
        table.sourceVerified &&
        !issues.some((issue) => issue.startsWith(id + ':'))
      );
    });
  return (
    <section className="oracle-page" aria-label="Oracle Library">
      <Button className="btn ghost oracle-back" onClick={onClose}>
        <ArrowLeft size={16} />
        이전 화면으로 돌아가기
      </Button>
      <div className="eyebrow">REFERENCE / ORACLES</div>
      <div className="page-heading">
        <div>
          <h1>
            오라클 라이브러리<span className="acid">.</span>
          </h1>
          <p>원문을 굴리고, 당신의 세계에 의미를 붙이세요.</p>
        </div>
        <span className="oracle-total" aria-label="전체 Oracle 수">
          {library.tables.length}
          <small>개 표 · {registry.books.length}권</small>
        </span>
      </div>
      {contextLabel && (
        <p className="oracle-context">
          {campaign?.title} / {contextLabel} / ORACLES
        </p>
      )}
      {loading && <output>룰북 표를 불러오는 중…</output>}
      {error && (
        <div className="source-notice" role="alert">
          <p>{error}</p>
          <PrivateDataTools />
          <Button
            className="btn small"
            onClick={() =>
              void Promise.allSettled([loadOraclePack(), loadRules()])
            }
          >
            Oracle 자료 다시 불러오기
          </Button>
        </div>
      )}
      {!!issues.length && (
        <details className="source-notice">
          <summary>검증이 필요한 표 {issues.length}건</summary>
          {issues.map((i, n) => (
            <p key={n}>{i}</p>
          ))}
        </details>
      )}
      {failure && (
        <p role="alert" className="oracle-error">
          {failure}
        </p>
      )}
      <div className="oracle-layout">
        <section className="oracle-catalog" aria-label="Oracle 목록">
          <div className="oracle-filters">
            <label className="oracle-search" htmlFor="oracle-search">
              검색
              <div>
                <Search size={16} />
                <Input
                  id="oracle-search"
                  aria-label="Oracle 검색"
                  placeholder="표 이름 또는 PDF 이름 검색…"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(0);
                  }}
                />
              </div>
            </label>
            <label>
              출처 책
              <select
                aria-label="Oracle 출처 책"
                value={prefs.source}
                onChange={(e) => preference({ source: e.target.value })}
              >
                <option value="">모든 책</option>
                {registry.books.map((b) => (
                  <option key={b.id} value={b.id}>
                    {shortBookTitle(b.id, b.title)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="oracle-list-tools">
            <span aria-live="polite">{filtered.length}개 표</span>
            <Button
              className={`btn ghost small ${favoritesOnly ? 'chosen' : ''}`}
              aria-pressed={favoritesOnly}
              onClick={() => {
                setFavoritesOnly(!favoritesOnly);
                setPage(0);
              }}
            >
              <Star size={15} /> 즐겨찾기만
            </Button>
            <Button
              className="btn ghost small"
              onClick={() => {
                preference({ source: '', category: '', dice: '' });
                setQuery('');
                setFavoritesOnly(false);
              }}
            >
              필터 초기화
            </Button>
          </div>
          <div className="oracle-cards">
            {filtered.slice(page * 30, (page + 1) * 30).map((t) => (
              <article
                key={t.id}
                className={`oracle-card ${selectedId === t.id ? 'selected' : ''}`}
              >
                <div className="oracle-card-meta">
                  <span>
                    {t.rollable === false ? '참조' : t.dice}
                    {oracleLibraryRollIds(t.id).length === 2 ? ' × 2' : ''}
                  </span>
                  <Button
                    className="icon-btn"
                    aria-label={`${t.title} 즐겨찾기`}
                    aria-pressed={prefs.favoriteIds.includes(t.id)}
                    onClick={() => favorite(t.id)}
                  >
                    <Star
                      size={17}
                      fill={
                        prefs.favoriteIds.includes(t.id)
                          ? 'currentColor'
                          : 'none'
                      }
                    />
                  </Button>
                </div>
                <button
                  className="oracle-title"
                  aria-pressed={selectedId === t.id}
                  onClick={() => select(t.id)}
                >
                  {t.title}
                </button>
              </article>
            ))}
          </div>
          {!filtered.length && (
            <p className="notebook-empty">
              조건에 맞는 표가 없습니다. 필터를 바꾸거나 초기화하세요.
            </p>
          )}
          {filtered.length > 30 && (
            <div className="oracle-pagination">
              <Button
                className="btn small"
                disabled={!page}
                onClick={() => setPage((n) => n - 1)}
              >
                이전
              </Button>
              <span>
                {page + 1} / {Math.ceil(filtered.length / 30)}
              </span>
              <Button
                className="btn small"
                disabled={(page + 1) * 30 >= filtered.length}
                onClick={() => setPage((n) => n + 1)}
              >
                다음
              </Button>
            </div>
          )}
        </section>
        <aside
          ref={rollerRef}
          className="oracle-roller"
          aria-label="Oracle Roller"
        >
          {!targetTitle ? (
            <div className="oracle-idle">
              <BookOpen size={34} strokeWidth={1} />
              <h2>어떤 답을 찾고 있나요?</h2>
              <p>
                목록에서 표를 선택하세요. Action과 Descriptor는 각 원문 표에서
                한 번씩, 나머지는 한 번 굴립니다. 결과를 기록하기 전까지
                캠페인은 바뀌지 않습니다.
              </p>
            </div>
          ) : (
            <>
              <div className="oracle-detail-heading">
                <h2>{targetTitle}</h2>
                {selected && (
                  <Button
                    className="icon-btn"
                    aria-label="현재 Oracle 즐겨찾기"
                    aria-pressed={prefs.favoriteIds.includes(selected.id)}
                    onClick={() => favorite(selected.id)}
                  >
                    <Star
                      size={20}
                      fill={
                        prefs.favoriteIds.includes(selected.id)
                          ? 'currentColor'
                          : 'none'
                      }
                    />
                  </Button>
                )}
              </div>
              {selected && (
                <>
                  <p className="oracle-dice">
                    {selected.originalDice || selected.dice || '직접 참조'}
                    {isPair ? ' · 각 표에서 한 번씩' : ''}
                  </p>
                  <SourceDisclosure key={selected.id} label="출처 · 표 정보">
                    {sourceTables.map((table) => (
                      <p key={table.id}>
                        <SourceText text={sourceLabel(table, registry)} /> ·{' '}
                        {table.entries.length}
                        항목
                      </p>
                    ))}
                    {selected.description && <p>{selected.description}</p>}
                    {selected.sourceNote && <p>{selected.sourceNote}</p>}
                  </SourceDisclosure>
                  {selected.rollable === false && (
                    <p className="oracle-rule-note">
                      참조용 표입니다. 출처의 사용 조건을 확인하세요.
                    </p>
                  )}
                </>
              )}
              <Button
                className="btn primary oracle-roll-button"
                disabled={!canRoll}
                onClick={roll}
              >
                <Dices size={19} />
                {isPair
                  ? result
                    ? '두 결과 다시 굴리기'
                    : '두 결과 굴리기'
                  : result
                    ? '다시 굴리기'
                    : '굴리기'}
              </Button>
              {result && (
                <div
                  className={`oracle-result ${isPair ? '' : 'oracle-result-single'}`}
                  aria-live="polite"
                >
                  {result.rolls.map((r, i) => (
                    <div key={i}>
                      <span className="eyebrow">
                        {result.rolls.length > 1 ? `${r.title} / ` : ''}ROLL:{' '}
                        {r.roll}
                        {r.diceValues.length > 1
                          ? ` (${r.diceValues.join(', ')})`
                          : ''}
                      </span>
                      <p className="oracle-result-text" lang="en">
                        {r.text}
                      </p>
                      <Translation
                        text={r.text}
                        translation={
                          typeof r.metadata?.ko === 'string'
                            ? r.metadata.ko
                            : undefined
                        }
                      />
                      <SourceDisclosure source={r.source} />
                      {r.metadata &&
                        Object.keys(r.metadata).some(
                          (k) =>
                            ![
                              'min',
                              'max',
                              'range',
                              'roll',
                              'page',
                              'ko',
                            ].includes(k),
                        ) && (
                          <OracleConditions
                            metadata={r.metadata}
                            registry={registry}
                            select={select}
                          />
                        )}
                    </div>
                  ))}
                </div>
              )}
              {result && (
                <section className="oracle-send">
                  <h3>결과 기록</h3>
                  {campaign ? (
                    <>
                      <Button
                        className="btn primary"
                        disabled={savedEventId === result.id}
                        onClick={() => {
                          try {
                            editCampaign(campaign.id, (c) => {
                              const event = saveOracleEvent(c, result);
                              const contextLinks = captureContext(c);
                              event.links.push(...contextLinks);
                              if (event.sessionId)
                                for (const link of contextLinks)
                                  linkToSession(c, event.sessionId, link);
                            });
                            setSavedEventId(result.id);
                            notify(
                              campaign.currentSessionId
                                ? '현재 세션에 사건을 저장했습니다.'
                                : '캠페인 연대기에 사건을 저장했습니다.',
                            );
                          } catch (e) {
                            setFailure(
                              e instanceof Error
                                ? e.message
                                : '사건 저장에 실패했습니다.',
                            );
                          }
                        }}
                      >
                        {savedEventId === result.id
                          ? '사건 저장됨'
                          : campaign.currentSessionId
                            ? '세션 사건으로 저장'
                            : '연대기에 사건 저장'}
                      </Button>
                      <label>
                        기록할 곳
                        <select
                          aria-label="Oracle 노트 대상"
                          value={destination}
                          onChange={(e) => setDestination(e.target.value)}
                        >
                          <option value="">대상 선택</option>
                          {destinations.map((d) => (
                            <option
                              key={notesTargetKey(d.target)}
                              value={notesTargetKey(d.target)}
                            >
                              {d.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="oracle-checkbox">
                        <input
                          type="checkbox"
                          checked={includeSource}
                          onChange={(e) => setIncludeSource(e.target.checked)}
                        />
                        출처 함께 기록
                      </label>
                      <Button
                        className="btn"
                        disabled={!destination}
                        onClick={addNotes}
                      >
                        노트에 추가
                      </Button>
                      <small>기존 내용 뒤에 덧붙이고 자동 저장합니다.</small>
                    </>
                  ) : (
                    <p>캠페인을 열면 결과를 노트에 추가할 수 있습니다.</p>
                  )}
                </section>
              )}
              {sourceTables.map((table) => (
                <details className="oracle-reference" key={table.id}>
                  <summary>
                    원문 표 보기 · {table.title} · {table.entries.length}항목
                  </summary>
                  <div>
                    {table.entries.map((e) => (
                      <div className="oracle-reference-row" key={e.id}>
                        <span>
                          {scalarText(
                            e.metadata?.printedIndex ??
                              e.metadata?.printedRange ??
                              e.metadata?.rank ??
                              e.metadata?.symbols ??
                              (e.min === e.max ? e.min : `${e.min}–${e.max}`),
                          )}
                        </span>
                        <p>
                          {e.text}
                          <Translation
                            text={e.text}
                            translation={
                              typeof e.metadata?.ko === 'string'
                                ? e.metadata.ko
                                : undefined
                            }
                          />
                          {e.sourceUnclear && (
                            <strong className="oracle-error">
                              {' '}
                              원문 검증 보류
                            </strong>
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            </>
          )}
          {!!history.length && (
            <section className="oracle-history">
              <h3>
                최근 결과 <small>최대 5개 · 임시 기록</small>
              </h3>
              {history.map((h) => (
                <button
                  key={h.id}
                  onClick={() => {
                    setResult(h);
                    setSelectedId(oracleLibraryId(h.rolls[0].oracleId));
                  }}
                >
                  <span>{h.title}</span>
                  <strong>{h.rolls.map((r) => r.text).join(' / ')}</strong>
                </button>
              ))}
            </section>
          )}
        </aside>
      </div>
    </section>
  );
}
function OracleConditions({
  metadata,
  registry,
  select,
}: {
  metadata: Record<string, unknown>;
  registry: OracleRegistry;
  select: (id: string) => void;
}) {
  const hidden = new Set([
    'min',
    'max',
    'range',
    'roll',
    'page',
    'ko',
    'id',
    'source',
    'book',
    'pdfPage',
    'printedPage',
    'sourcePage',
    'sourceBookId',
    'tableId',
    'schemaVersion',
    'category',
    'tags',
  ]);
  const labels: Record<string, string> = {
    followup: '후속 선택지',
    followUp: '후속 조건',
    subtable: '다음 표',
    subtableId: '다음 표',
    alternatives: '선택 / 해석',
    alternativeSelection: '선택 방법',
    quantityDice: '수량',
    quantity: '수량',
    nestedRolls: '추가 굴림',
    sourceNote: '원문 주석',
    note: '주석',
    reason: '검증 보류 사유',
  };
  function render(value: unknown, key: string, depth: number): ReactNode {
    if (depth > 6 || hidden.has(key) || value == null) return null;
    if (typeof value === 'string') {
      const linked = registry.tables.find(
        (t) => t.id === value || t.id === `reclvse.${value}`,
      );
      return linked ? (
        <button
          className="oracle-followup-link"
          onClick={() => select(linked.id)}
        >
          {linked.title} ↗
        </button>
      ) : (
        <span>
          {value}
          <Translation text={value} />
        </span>
      );
    }
    if (typeof value === 'number') return String(value);
    if (typeof value === 'boolean') return value ? 'Yes · 예' : 'No · 아니요';
    if (Array.isArray(value))
      return (
        <ul>
          {value.map((v, i) => (
            <li key={i}>{render(v, '', depth + 1)}</li>
          ))}
        </ul>
      );
    if (typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      if (typeof obj.text === 'string')
        return (
          <span>
            {obj.text}
            <Translation text={obj.text} />
            {obj.followup ? render(obj.followup, 'followup', depth + 1) : null}
          </span>
        );
      return (
        <dl>
          {Object.entries(obj)
            .filter(([k]) => !hidden.has(k))
            .map(([k, v]) => (
              <div key={k}>
                <dt>{labels[k] ?? k.replace(/([a-z])([A-Z])/g, '$1 $2')}</dt>
                <dd>{render(v, k, depth + 1)}</dd>
              </div>
            ))}
        </dl>
      );
    }
    return null;
  }
  return (
    <details className="oracle-metadata">
      <summary>후속 표 / 원문 조건</summary>
      {render(metadata, '', 0)}
    </details>
  );
}
