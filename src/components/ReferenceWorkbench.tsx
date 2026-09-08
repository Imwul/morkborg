import { id } from '../generators/random';
import { executeReference, refsForOracle } from '../domain/referenceExecution';
import {
  referenceAction,
  referenceShortName,
  referenceRegion,
} from '../domain/referenceActions';
import {
  emptyReferenceSession,
  availableRecentRolls,
  retainReferenceReading,
  restoreReferenceRoll,
} from '../domain/referenceSession';
import { authoritiesForReading } from '../domain/generationAuthority';
import { sourceEvidence } from '../domain/referenceSources';
import { useEffect, useMemo, useState, useRef, type ReactNode } from 'react';
import {
  ArrowLeft,
  Copy,
  Dices,
  Pin,
  Search,
  History,
  ArrowUpRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { Campaign, RegionId, Workspace } from '../domain/types';
import type { OracleResult } from '../domain/oracle';
import {
  buildReferenceRegistry,
  searchReferences,
  relatedReferences,
  contextReferences,
  type ReferenceEntry,
  type ReferenceContext as ContextKind,
} from '../domain/references';
import { ReferenceContext, useReferenceDesk } from './ReferenceContext';
import { useOracleRegistry } from '../storage/oracleStore';
import { useRules } from '../storage/rulesStore';
import type { RuleEntry } from '../storage/rulesStore';
import {
  readReferencePreferences,
  writeReferencePreferences,
  recentlyUsed,
  toggleReferencePin,
} from '../storage/referencePreferences';
import { selectOracleEntry, sourceLabel } from '../generators/oracleRoller';
import {
  copyReferenceReading,
  oracleReadingText,
  oraclePrintedRange,
  oracleFollowUpLinks,
  type ReferenceReading,
} from '../domain/referenceReading';
import { searchCampaign } from '../domain/campaignSearch';
import { regions } from '../data/regions';
import { SourceDisclosure } from './SourceDisclosure';
import { BookLabel, SourceText } from './SourceText';
import { compactSourceText } from '../domain/sourceDisplay';
import { CityRoller } from './CityRoller';
import { PrivateDataTools } from './PrivateDataTools';

const isOneClick = (entry: ReferenceEntry) => referenceAction(entry).immediate;

export function ReferenceProvider({
  children,
  campaign,
  onCampaignOpen,
  onCity,
  notify,
}: {
  children: ReactNode;
  campaign?: Campaign;
  onCampaignOpen: (patch: Partial<Workspace>) => void;
  onCity?: () => void;
  notify: (message: string) => void;
}) {
  const oracles = useOracleRegistry(),
    rules = useRules();
  const index = useMemo(
    () => buildReferenceRegistry(oracles.registry, rules.pack),
    [oracles.registry, rules.pack],
  );
  const [prefs, setPrefs] = useState(readReferencePreferences);
  const [selectedId, setSelectedId] = useState<string | null>(null),
    [trail, setTrail] = useState<string[]>([]);
  const [tableView, setTableView] = useState(false);
  const lastReferenceId = useRef<string | null>(null);
  const [session, setSession] = useState(emptyReferenceSession);
  const readings = session.readings;
  const [searchOpen, setSearchOpen] = useState(false),
    [query, setQuery] = useState(''),
    [scope, setScope] = useState<'all' | 'pinned' | 'recent'>('all');
  const [copied, setCopied] = useState('');
  const [failure, setFailure] = useState(''),
    [copyFallback, setCopyFallback] = useState<string | null>(null);
  const [cityLarge, setCityLarge] = useState(false),
    [cityExits, setCityExits] = useState(true);
  const [region, setRegion] = useState<RegionId>('sarkash'),
    [stockKind, setStockKind] = useState<'common' | 'rare' | 'room'>('common'),
    [stockDR, setStockDR] = useState(10);
  const inspectorRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen, scope]);
  useEffect(() => {
    inspectorRef.current?.scrollTo({ top: 0 });
  }, [selectedId]);
  const selected = selectedId ? index.byId[selectedId] : null;
  const hubRegion =
    selected?.action?.kind === 'region' ? selected.action.region : undefined;
  const reading: ReferenceReading | undefined =
    selected?.action?.kind === 'rule'
      ? {
          title: selected.title,
          blocks: [{ title: '', text: selected.summary }],
          sourceRefs: selected.sourceRefs,
        }
      : selectedId
        ? readings[selectedId]
        : undefined;
  function savePrefs(next: typeof prefs) {
    setPrefs(next);
    try {
      writeReferencePreferences(next);
    } catch {
      notify('고정·최근 항목을 이 기기에 저장하지 못했습니다.');
    }
  }
  function touchEntry(entryId: string) {
    savePrefs(recentlyUsed(prefs, entryId));
  }
  function acceptReading(
    entryId: string,
    result: ReferenceReading,
    rolled = true,
  ) {
    setSession((state) =>
      retainReferenceReading(state, entryId, result, rolled),
    );
    touchEntry(entryId);
  }
  function perform(entry: ReferenceEntry, contextRegion = region) {
    try {
      setFailure('');
      const output = executeReference(entry, {
        registry: oracles.registry,
        rules: rules.pack,
        region: contextRegion,
        stockKind,
        stockDR,
        cityLarge,
        cityExits,
      });
      if (output)
        acceptReading(entry.id, output, entry.action?.kind !== 'creature');
    } catch (e) {
      setFailure(e instanceof Error ? e.message : '원문 자료를 확인하세요.');
    }
  }
  function activate(entryId: string, roll = false, contextRegion?: RegionId) {
    const entry = index.byId[entryId];
    if (!entry) return;
    entryId = entry.id;
    if (entry.action?.kind === 'city' && onCity) {
      touchEntry(entryId);
      setSearchOpen(false);
      setSelectedId(null);
      onCity();
      return;
    }
    if (contextRegion) setRegion(contextRegion);
    if (
      entry.action?.kind === 'region' ||
      entry.action?.kind === 'regional-monster'
    )
      setRegion(entry.action.region);
    const previous = selectedId ?? lastReferenceId.current;
    if (previous && previous !== entryId)
      setTrail((t) => [...t, previous].slice(-20));
    lastReferenceId.current = entryId;
    setSelectedId(entryId);
    setTableView(false);
    setSearchOpen(false);
    setFailure('');
    setCopyFallback(null);
    setCopied('');
    touchEntry(entryId);
    if (roll || entry.action?.kind === 'creature')
      perform(entry, contextRegion);
  }
  function openSearch(value = '', nextScope: typeof scope = 'all') {
    setQuery(value);
    setScope(nextScope);
    setSearchOpen(true);
  }
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen((open) => !open);
        setScope('all');
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);
  const scopedIds = scope === 'pinned' ? prefs.pinnedIds : prefs.recentIds;
  const found =
    scope === 'all'
      ? searchReferences(index, query, { limit: 32 })
      : scopedIds
          .map((key) => index.byId[key])
          .filter(
            (entry) =>
              entry &&
              (!query ||
                entry.title.toLowerCase().includes(query.toLowerCase())),
          );
  const owned =
    campaign && query ? searchCampaign(campaign, query).slice(0, 8) : [];
  const related = selected ? relatedReferences(index, selected.id, 8) : [];
  const dynamicRelated =
    reading?.relatedIds?.map((key) => index.byId[key]).filter(Boolean) ?? [];
  const grouped =
    selected?.kind === 'region'
      ? searchReferences(index, '', {
          region:
            selected.action?.kind === 'region'
              ? selected.action.region
              : region,
          limit: 80,
        }).filter(
          (entry) => entry.id !== selected.id && entry.kind !== 'region',
        )
      : selected?.kind === 'book'
        ? index.entries.filter(
            (entry) =>
              entry.sourceRefs.some(
                (source) => `book:${source.bookId}` === selected.id,
              ) && entry.kind !== 'book',
          )
        : [];
  const procedureId =
    selected?.action?.kind === 'procedure' ? selected.action.procedureId : '';
  const city =
    selected?.action?.kind === 'city' || procedureId === 'workbench.city';
  const plainRule = selected?.action?.kind === 'rule';
  const roller =
    selected &&
    !city &&
    !plainRule &&
    ['oracle', 'procedure', 'regional-monster'].includes(
      selected.action?.kind ?? '',
    );
  async function copyReading(withSource = false) {
    if (!reading) return;
    const text = copyReferenceReading(reading, withSource);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(
        withSource ? '출처와 함께 복사했습니다.' : '결과를 복사했습니다.',
      );
    } catch {
      setCopyFallback(text);
    }
  }
  return (
    <ReferenceContext.Provider
      value={{
        entries: index.entries,
        byId: index.byId,
        activate,
        openSearch,
        search: (value, limit = 8) => searchReferences(index, value, { limit }),
        openTable: (entryId) => {
          activate(entryId);
          setTableView(true);
        },
        contextual: (context, r) => contextReferences(index, context, r, 6),
        pinnedIds: prefs.pinnedIds,
        recentIds: prefs.recentIds,
        touch: touchEntry,
        togglePin: (entryId) => savePrefs(toggleReferencePin(prefs, entryId)),
      }}
    >
      {children}
      <div className="reference-dock" aria-label="빠른 참조">
        <button aria-label="참조 검색" onClick={() => openSearch()}>
          <Search size={16} />
          <span>검색</span>
        </button>
        <button
          aria-label={`고정한 참조 ${prefs.pinnedIds.length}`}
          onClick={() => openSearch('', 'pinned')}
        >
          <Pin size={15} />
          <span>고정 {prefs.pinnedIds.length}</span>
        </button>
        <button aria-label="최근 참조" onClick={() => openSearch('', 'recent')}>
          <History size={16} />
          <span>최근</span>
        </button>
        <div className="dock-pinned">
          {prefs.pinnedIds
            .map((key) => index.byId[key])
            .filter(Boolean)
            .map((entry) => (
              <button
                key={entry.id}
                title={entry.title}
                onClick={() => activate(entry.id, isOneClick(entry))}
              >
                {referenceShortName(entry)}
              </button>
            ))}
        </div>
      </div>
      <Dialog
        open={searchOpen || !!selected}
        onOpenChange={(open) => {
          if (!open) {
            setSearchOpen(false);
            setSelectedId(null);
          }
        }}
      >
        <DialogContent
          ref={inspectorRef}
          initialFocus={() =>
            searchOpen ? searchInputRef.current : inspectorRef.current
          }
          className={
            searchOpen ? 'reference-search-dialog' : 'reference-inspector'
          }
        >
          <nav className="reference-inner-tray" aria-label="참조 도구 모음">
            {!searchOpen && !!trail.length && (
              <button
                aria-label="이전 참조"
                onClick={() => {
                  const previous = trail.at(-1);
                  if (previous) {
                    setSelectedId(previous);
                    setTableView(false);
                    setRegion(referenceRegion(index.byId[previous], region));
                    lastReferenceId.current = previous;
                    setTrail((t) => t.slice(0, -1));
                    setFailure('');
                    setCopied('');
                    setCopyFallback(null);
                    touchEntry(previous);
                  }
                }}
              >
                <ArrowLeft size={15} />
              </button>
            )}
            <button aria-label="창 안에서 검색" onClick={() => openSearch()}>
              <Search size={15} /> SEARCH
            </button>
            <button onClick={() => openSearch('', 'recent')}>
              <History size={15} /> RECENT
            </button>
            <button onClick={() => openSearch('', 'pinned')}>
              <Pin size={15} /> PINNED
            </button>
            <div className="reference-inner-pins">
              {prefs.pinnedIds
                .map((key) => index.byId[key])
                .filter(Boolean)
                .map((entry) => (
                  <button
                    key={entry.id}
                    title={entry.title}
                    onClick={() => activate(entry.id, isOneClick(entry))}
                  >
                    {referenceShortName(entry)}
                  </button>
                ))}
            </div>
          </nav>
          {searchOpen && (
            <>
              {selected && (
                <button
                  className="ref-text-action"
                  onClick={() => setSearchOpen(false)}
                >
                  <ArrowLeft size={14} /> 결과로 돌아가기
                </button>
              )}
              <DialogTitle>
                {scope === 'all'
                  ? '무엇이 필요합니까?'
                  : scope === 'pinned'
                    ? '고정한 참조'
                    : '최근 사용한 참조'}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Oracle · 규칙 · 지역 · 생물 · 책을 한곳에서 찾으세요.
              </DialogDescription>
              <Input
                ref={searchInputRef}
                aria-label="통합 참조 검색"
                placeholder="reaction, Sarkash monster, corpse…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && found[0]) {
                    e.preventDefault();
                    activate(found[0].id, isOneClick(found[0]));
                  }
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    (
                      e.currentTarget
                        .closest('[role="dialog"]')
                        ?.querySelector(
                          '.reference-row button',
                        ) as HTMLButtonElement | null
                    )?.focus();
                  }
                }}
              />
              {scope === 'recent' && session.rolls.length > 0 && (
                <details className="reference-recent-rolls">
                  <summary>최근 결과 · 이 탭에서만</summary>
                  {availableRecentRolls(session, index.byId).map((item) => (
                    <button
                      key={item.sequence}
                      onClick={() => {
                        activate(item.referenceId);
                        setSession((state) =>
                          restoreReferenceRoll(state, item.sequence),
                        );
                      }}
                    >
                      <strong>
                        {referenceShortName(index.byId[item.referenceId])}
                      </strong>
                      <span>{item.reading.blocks[0]?.text.slice(0, 110)}</span>
                    </button>
                  ))}
                </details>
              )}
              <div className="reference-results">
                {found.map((entry) => (
                  <ReferenceRow key={entry.id} entry={entry} />
                ))}
                {owned.length > 0 && (
                  <p className="eyebrow">보관한 캠페인 자료</p>
                )}
                {owned.map((entry, n) => (
                  <button
                    className="reference-owned"
                    key={n}
                    onClick={() => {
                      setSearchOpen(false);
                      setSelectedId(null);
                      onCampaignOpen(entry.patch);
                    }}
                  >
                    <strong>{entry.title}</strong>
                    <small>{entry.detail}</small>
                  </button>
                ))}
                {!found.length && !owned.length && (
                  <p>일치하는 참조가 없습니다.</p>
                )}
              </div>
            </>
          )}
          {!searchOpen && selected && (
            <>
              <div className="reference-inspector-top">
                <DialogTitle>{referenceShortName(selected)}</DialogTitle>
                <button
                  className="ref-pin"
                  aria-label={
                    prefs.pinnedIds.includes(selected.id)
                      ? '고정 해제'
                      : '참조 고정'
                  }
                  aria-pressed={prefs.pinnedIds.includes(selected.id)}
                  onClick={() =>
                    savePrefs(toggleReferencePin(prefs, selected.id))
                  }
                >
                  <Pin size={16} />
                  {prefs.pinnedIds.includes(selected.id) ? 'PINNED' : 'PIN'}
                </button>
              </div>
              <DialogDescription className="sr-only">
                {selected.kind.toUpperCase()} ·{' '}
                {regions.find((r) => r.id === region)?.name} ·{' '}
                {selected.canonicalIds.length
                  ? `${selected.canonicalIds.length}개 연결 표`
                  : '빠른 참조'}
              </DialogDescription>
              {!reading &&
                !plainRule &&
                !tableView &&
                selected.kind !== 'region' && (
                  <p className="reference-summary">
                    {procedureId === 'aitc.street'
                      ? '거리 묘사·종류·내용을 함께 굴립니다. City·Metropolis의 내용은 d2회이며, 출구는 선택할 수 있습니다.'
                      : selected.summary}
                  </p>
                )}
              {selected.action?.kind === 'region' &&
                index.byId[
                  `rule:regional-monsters:${selected.action.region}`
                ] && (
                  <ReferenceRow
                    showMetadata={false}
                    entry={
                      index.byId[
                        `rule:regional-monsters:${selected.action.region}`
                      ]
                    }
                  />
                )}
              {selected.action?.kind === 'region' && (
                <div className="region-quick-tools">
                  <small>QUICK TOOLS · {selected.title}</small>
                  {[
                    'procedure:workbench.stock-room',
                    'rule:sd.stockCommon',
                    'rule:feretory.roads',
                    'procedure:workbench.npc',
                  ]
                    .map((key) => index.byId[key])
                    .filter(Boolean)
                    .map((entry) => (
                      <button
                        key={entry.id}
                        onClick={() =>
                          activate(entry.id, isOneClick(entry), hubRegion)
                        }
                      >
                        {referenceShortName(entry)} ↗
                      </button>
                    ))}
                </div>
              )}
              {city && (
                <div className="ref-related city-start-tools">
                  {[
                    'procedure:aitc.street',
                    'procedure:aitc.settlement',
                    'oracle:aitc.npc-encounters',
                    'oracle:aitc.businesses',
                  ]
                    .map((key) => index.byId[key])
                    .filter(Boolean)
                    .map((entry) => (
                      <button
                        key={entry.id}
                        title={entry.title}
                        onClick={() => activate(entry.id, isOneClick(entry))}
                      >
                        {referenceShortName(entry)} ↗
                      </button>
                    ))}
                </div>
              )}
              {tableView && selected.kind === 'oracle' && (
                <details className="reference-static-table" open>
                  <summary>TABLE · 원문 표 보기</summary>
                  {selected.canonicalIds
                    .flatMap((key) =>
                      oracles.registry.tables.filter(
                        (table) => table.id === key,
                      ),
                    )
                    .map((table) => (
                      <section key={table.id}>
                        <table>
                          <caption>
                            {table.title} · {table.originalDice ?? table.dice}
                          </caption>
                          <tbody>
                            {table.entries.map((entry) => (
                              <tr
                                key={entry.id}
                                className={
                                  reading?.oracle?.rolls.some(
                                    (roll) => roll.entryId === entry.id,
                                  )
                                    ? 'current-table-result'
                                    : undefined
                                }
                              >
                                <th scope="row">{oraclePrintedRange(entry)}</th>
                                <td>
                                  {entry.text}
                                  {Array.isArray(entry.metadata?.followup) && (
                                    <details className="table-followup">
                                      <summary>조건부 추가 표</summary>
                                      <ol>
                                        {(
                                          entry.metadata.followup as RuleEntry[]
                                        ).map((child, index) => (
                                          <li key={index}>{child.text}</li>
                                        ))}
                                      </ol>
                                    </details>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </section>
                    ))}
                </details>
              )}
              {tableView && reading && (
                <button
                  className="ref-text-action"
                  onClick={() => setTableView(false)}
                >
                  <ArrowLeft size={14} /> 결과로 돌아가기
                </button>
              )}
              {tableView && roller && (
                <button
                  className="ref-text-action"
                  onClick={() => {
                    setTableView(false);
                    perform(selected);
                  }}
                >
                  ROLL
                </button>
              )}
              {!selected.available && (
                <output>
                  이 참조에 필요한 원문 자료가 준비되지 않았습니다.
                </output>
              )}
              <details
                className="reference-options"
                open={!reading || undefined}
                hidden={
                  tableView ||
                  ![
                    'workbench.npc',
                    'workbench.epk',
                    'workbench.stock-room',
                    'aitc.street',
                  ].includes(procedureId)
                }
              >
                <summary>굴림 설정</summary>
                {[
                  'workbench.npc',
                  'workbench.epk',
                  'workbench.stock-room',
                ].includes(procedureId) && (
                  <div className="ref-controls">
                    <label>
                      지역
                      <select
                        value={region}
                        onChange={(e) => setRegion(e.target.value as RegionId)}
                      >
                        {regions.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    {procedureId === 'workbench.stock-room' && (
                      <>
                        <label>
                          절차
                          <select
                            value={stockKind}
                            onChange={(e) =>
                              setStockKind(e.target.value as typeof stockKind)
                            }
                          >
                            <option value="common">
                              Common · 지역 / SD d12
                            </option>
                            <option value="rare">Rare · SD d8 + DR</option>
                            <option value="room">Room · RECLVSE</option>
                          </select>
                        </label>
                        <label>
                          Dungeon DR
                          <Input
                            type="number"
                            min={1}
                            max={30}
                            value={stockDR}
                            onChange={(e) =>
                              setStockDR(
                                Math.max(
                                  1,
                                  Math.trunc(Number(e.target.value)) || 1,
                                ),
                              )
                            }
                          />
                        </label>
                      </>
                    )}
                  </div>
                )}
                {procedureId === 'aitc.street' && (
                  <div className="ref-controls">
                    <label>
                      정착지 규모
                      <select
                        value={cityLarge ? 'large' : 'small'}
                        onChange={(e) =>
                          setCityLarge(e.target.value === 'large')
                        }
                      >
                        <option value="small">Town 이하 · 내용 1회</option>
                        <option value="large">
                          City / Metropolis · 내용 d2회
                        </option>
                      </select>
                    </label>
                    <label className="ref-check">
                      <input
                        type="checkbox"
                        checked={cityExits}
                        onChange={(e) => setCityExits(e.target.checked)}
                      />{' '}
                      출구도 굴리기
                    </label>
                  </div>
                )}
              </details>
              {city && (
                <CityRoller
                  registry={oracles.registry}
                  onReading={(value) => acceptReading(selected.id, value)}
                />
              )}
              {roller && !reading && !tableView && (
                <Button
                  className="reference-roll"
                  disabled={!selected.available}
                  onClick={() => perform(selected)}
                >
                  <Dices size={20} />
                  {reading ? 'REROLL' : 'ROLL'}
                </Button>
              )}
              {failure && (
                <p role="alert" className="error">
                  {failure}
                </p>
              )}
              {reading && !tableView && (
                <article
                  key={`${selected.id}:${session.sequence}`}
                  className={`reference-reading ${plainRule ? 'reference-rule-reading' : ''}`}
                  aria-label="참조 결과"
                >
                  {reading.title !== selected.title &&
                    !reading.blocks.some(
                      (block) => block.title === reading.title,
                    ) && <h3 className="reading-identity">{reading.title}</h3>}
                  {reading.blocks.map((block, n) => (
                    <section
                      key={n}
                      className={
                        block.kind === 'creature'
                          ? 'creature-answer'
                          : !plainRule &&
                              block.text.length < 160 &&
                              !block.text.includes('\n')
                            ? 'short-answer'
                            : ''
                      }
                    >
                      {block.title &&
                        !(
                          reading.blocks.length === 1 &&
                          [
                            selected.title,
                            referenceShortName(selected),
                          ].includes(block.title)
                        ) && <h3>{block.title}</h3>}
                      {block.kind === 'creature' &&
                      block.text.split('\n').length > 2 ? (
                        <>
                          <p>{block.text.split('\n').slice(0, 2).join('\n')}</p>
                          <details className="reading-more">
                            <summary>MORE ›</summary>
                            <p>{block.text.split('\n').slice(2).join('\n')}</p>
                          </details>
                        </>
                      ) : (
                        <p>{block.text}</p>
                      )}
                    </section>
                  ))}
                  <div className="ref-copy-actions">
                    {roller && (
                      <Button
                        variant="ghost"
                        onClick={() => perform(selected)}
                        className="result-reroll"
                      >
                        <Dices size={16} /> REROLL
                      </Button>
                    )}
                    <Button variant="ghost" onClick={() => copyReading()}>
                      <Copy size={14} /> COPY
                    </Button>
                    <details className="result-more-actions">
                      <summary aria-label="결과 추가 동작">⋯</summary>
                      <button onClick={() => copyReading(true)}>
                        COPY WITH SOURCE
                      </button>
                    </details>
                  </div>
                </article>
              )}
              {copied && <output className="copy-feedback">{copied}</output>}
              {copyFallback != null && (
                <label>
                  복사할 결과
                  <Textarea
                    readOnly
                    value={copyFallback}
                    onFocus={(e) => e.target.select()}
                  />
                </label>
              )}
              <SourceDisclosure
                key={selected.id}
                label="SOURCE"
                authorities={
                  reading
                    ? authoritiesForReading(
                        reading,
                        selected.action?.kind === 'procedure'
                          ? selected.action.procedureId
                          : undefined,
                      )
                    : undefined
                }
                refs={reading?.sourceRefs ?? selected.sourceRefs}
                evidence={
                  reading?.evidence ??
                  (!reading && selected.sourceChain.some((step) => step.role)
                    ? selected.sourceChain.map((step) => ({
                        source: step.source,
                        role: step.role ?? 'primary',
                        confidence:
                          step.confidence ??
                          (selected.available
                            ? 'verified'
                            : 'unavailable-source'),
                      }))
                    : sourceEvidence(
                        reading?.sourceRefs ?? selected.sourceRefs,
                        selected.available,
                      ))
                }
              >
                {selected.kind === 'oracle' && !tableView && (
                  <button
                    className="ref-text-action"
                    onClick={() => setTableView(true)}
                  >
                    TABLE · 원문 표 열기
                  </button>
                )}
                {reading?.blocks.some((block) => block.dice) && (
                  <section className="reference-roll-trace">
                    <h4>ROLL</h4>
                    {reading.blocks
                      .filter((block) => block.dice)
                      .map((block, n) => (
                        <p key={n}>
                          {block.title ? `${block.title} · ` : ''}
                          {block.dice}
                        </p>
                      ))}
                  </section>
                )}
                {!reading &&
                  selected.sourceChain
                    .filter((step) => step.via)
                    .map((step, n) => (
                      <p key={n}>
                        <SourceText text={step.label} />
                        {step.via && (
                          <>
                            {' '}
                            → <SourceText text={step.via} />
                          </>
                        )}
                      </p>
                    ))}
                {selected.canonicalIds
                  .map((key) => index.byId[`oracle:${key}`])
                  .filter(
                    (entry, i, all) =>
                      entry &&
                      entry.id !== selected.id &&
                      all.findIndex((item) => item?.id === entry.id) === i,
                  )
                  .map((entry) => (
                    <ReferenceRow key={entry.id} entry={entry} />
                  ))}
              </SourceDisclosure>
              {!!grouped.length && (
                <div className="reference-hub-list">
                  {(['procedure', 'creature', 'oracle', 'rule'] as const).map(
                    (kind) => {
                      const entries = grouped.filter(
                        (entry) => entry.kind === kind,
                      );
                      return entries.length ? (
                        <details key={kind}>
                          <summary>
                            {kind.toUpperCase()} <b>{entries.length}</b> ›
                          </summary>
                          {entries.map((entry) => (
                            <ReferenceRow key={entry.id} entry={entry} />
                          ))}
                        </details>
                      ) : null;
                    },
                  )}
                </div>
              )}
              {!!reading?.fixedLookups?.length && (
                <div className="ref-related">
                  <small>지정된 항목</small>
                  {reading.fixedLookups.map((lookup, n) => (
                    <button
                      key={n}
                      onClick={() => {
                        const table = oracles.registry.tables.find(
                          (item) => item.id === lookup.oracleId,
                        );
                        if (!table) return;
                        try {
                          const value = selectOracleEntry(table, lookup.roll);
                          if (!value) return;
                          const entryId = `oracle:${table.id}`;
                          activate(entryId);
                          const result: OracleResult = {
                            id: id(),
                            title: table.title,
                            rolls: [
                              {
                                oracleId: table.id,
                                title: table.title,
                                dice: '지정 항목',
                                roll: lookup.roll,
                                diceValues: [],
                                entryId: value.id,
                                text: value.text,
                                source: sourceLabel(table, oracles.registry),
                                metadata: value.metadata,
                              },
                            ],
                          };
                          acceptReading(entryId, {
                            title: table.title,
                            blocks: [
                              {
                                title: `#${lookup.roll}`,
                                text: oracleReadingText(value),
                              },
                            ],
                            sourceRefs: refsForOracle(result, oracles.registry),
                            oracle: result,
                            ...oracleFollowUpLinks(value.metadata),
                          });
                        } catch (e) {
                          setFailure(
                            e instanceof Error
                              ? e.message
                              : '참조 항목을 확인하세요.',
                          );
                        }
                      }}
                    >
                      {index.byId[`oracle:${lookup.oracleId}`]?.title ??
                        lookup.oracleId}{' '}
                      #{lookup.roll} 열기
                    </button>
                  ))}
                </div>
              )}
              {!!(related.length + dynamicRelated.length) && (
                <details className="ref-related ref-related-disclosure">
                  <summary>RELATED ›</summary>
                  {[
                    ...new Map(
                      [...dynamicRelated, ...related].map((entry) => [
                        entry.id,
                        entry,
                      ]),
                    ).values(),
                  ]
                    .filter(
                      (entry) =>
                        !city ||
                        ![
                          'procedure:aitc.street',
                          'procedure:aitc.settlement',
                          'oracle:aitc.npc-encounters',
                          'oracle:aitc.businesses',
                        ].includes(entry.id),
                    )
                    .slice(0, city ? 4 : 8)
                    .map((entry) => (
                      <button
                        key={entry.id}
                        title={entry.title}
                        aria-label={entry.title}
                        onClick={() => activate(entry.id, isOneClick(entry))}
                      >
                        {referenceShortName(entry)}
                        <ArrowUpRight size={12} />
                      </button>
                    ))}
                </details>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </ReferenceContext.Provider>
  );
}

export function ReferenceRow({
  entry,
  showMetadata = true,
}: {
  entry: ReferenceEntry;
  showMetadata?: boolean;
}) {
  const desk = useReferenceDesk();
  const action = referenceAction(entry);
  return (
    <div className="reference-row">
      <button
        className="reference-select-action"
        aria-label={`${entry.title} ${action.label}`}
        onClick={() => desk?.activate(entry.id, action.immediate)}
      >
        <span>
          <strong>{referenceShortName(entry)}</strong>
          {showMetadata && (
            <small>
              {entry.kind.toUpperCase()}
              {entry.kind !== 'book' && entry.sourceRefs[0]?.bookTitle && (
                <>
                  {' '}
                  ·{' '}
                  <BookLabel
                    bookId={entry.sourceRefs[0].bookId}
                    title={entry.sourceRefs[0].bookTitle}
                  />
                </>
              )}
            </small>
          )}
        </span>
        <b className="reference-action-label">{action.label}</b>
      </button>
      {action.immediate && (
        <button
          className="reference-inspect-action"
          aria-label={`${entry.title} DETAILS`}
          title="굴리지 않고 참조 열기"
          onClick={() => desk?.activate(entry.id)}
        >
          ⓘ
        </button>
      )}
    </div>
  );
}

export function QuickReferenceButton({ entry }: { entry: ReferenceEntry }) {
  const desk = useReferenceDesk();
  const action = referenceAction(entry);
  return (
    <button
      className="quick-reference-action"
      aria-label={`${entry.title} ${action.label}`}
      onClick={() => desk?.activate(entry.id, action.immediate)}
    >
      <span>{referenceShortName(entry)}</span>
      <small>{action.label}</small>
    </button>
  );
}
export function ReferenceSearchButton() {
  const desk = useReferenceDesk();
  return (
    <button
      className="universal-search-trigger"
      onClick={() => desk?.openSearch()}
    >
      <Search size={16} />
      <span>규칙·표·지역 검색…</span>
      <kbd>⌘ K</kbd>
    </button>
  );
}
export function ContextReferences({
  context,
  region,
  onDungeonEncounters,
}: {
  context: ContextKind;
  region?: RegionId;
  onDungeonEncounters?: () => void;
}) {
  const desk = useReferenceDesk();
  const entries = desk?.contextual(context, region) ?? [];
  if (!entries.length) return null;
  return (
    <details className="context-reference-disclosure">
      <summary>QUICK TOOLS · {entries.length} ›</summary>
      <div className="context-references">
        {entries.map((entry) => (
          <button
            key={entry.id}
            onClick={() =>
              entry.id === 'procedure:workbench.stock-room' &&
              onDungeonEncounters
                ? onDungeonEncounters()
                : desk?.activate(entry.id, isOneClick(entry), region)
            }
          >
            {entry.id === 'procedure:workbench.stock-room' &&
            onDungeonEncounters
              ? '던전 조우표 · Common 6 / Rare 6'
              : compactSourceText(entry.title)}
          </button>
        ))}
      </div>
    </details>
  );
}
export function ReferenceDesk({ onLibrary }: { onLibrary?: () => void }) {
  const desk = useReferenceDesk(),
    source = useOracleRegistry();
  const [query, setQuery] = useState('');
  const found = query.trim() ? (desk?.search(query, 8) ?? []) : [];
  const entries = (ids: string[]) =>
    ids
      .map((id) => desk?.byId[id])
      .filter((entry): entry is ReferenceEntry => !!entry);
  const quick = entries([
    'oracle:core.reaction',
    'procedure:reclvse.action-theme',
    'procedure:workbench.stock-room',
    'procedure:workbench.npc',
  ]);
  return (
    <section className="reference-desk">
      <header className="desk-heading">
        <h1>REFERENCE DESK</h1>
        <span className="eyebrow">MÖRK BORG</span>
      </header>
      <form
        className="desk-search"
        onSubmit={(event) => {
          event.preventDefault();
          if (found[0]) desk?.activate(found[0].id, isOneClick(found[0]));
        }}
      >
        <Search size={21} />
        <Input
          aria-label="작업대 검색"
          placeholder="reaction / Sarkash monster / corpse"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              (
                event.currentTarget
                  .closest('.reference-desk')
                  ?.querySelector(
                    '.desk-search-results button',
                  ) as HTMLButtonElement | null
              )?.focus();
            }
          }}
        />
        {query ? (
          <button
            type="button"
            aria-label="검색 지우기"
            onClick={() => setQuery('')}
          >
            ×
          </button>
        ) : (
          <kbd>⌘ K</kbd>
        )}
      </form>
      {query.trim() && (
        <section className="desk-search-results" aria-label="검색 결과">
          {found.map((entry) => (
            <ReferenceRow key={entry.id} entry={entry} />
          ))}
          {!found.length && <p>일치하는 참조가 없습니다.</p>}
        </section>
      )}
      {source.loading && <output>룰북 자료를 불러오는 중…</output>}
      {source.error && (
        <div role="alert">
          <p>{source.error}</p>
          <PrivateDataTools />
        </div>
      )}
      <div className="desk-personal-tools">
        <section aria-label="고정한 표">
          <h2>
            PINNED <span>{desk?.pinnedIds.length ?? 0}</span>
          </h2>
          <div className="desk-pinned-actions">
            {entries(desk?.pinnedIds ?? []).map((entry) => (
              <QuickReferenceButton key={entry.id} entry={entry} />
            ))}
          </div>
          {!desk?.pinnedIds.length && (
            <p className="desk-empty-hint">자주 쓰는 표는 결과에서 PIN.</p>
          )}
        </section>
        <section aria-label="최근 사용한 표">
          <h2>
            RECENT{' '}
            <button onClick={() => desk?.openSearch('', 'recent')}>
              전체 ›
            </button>
          </h2>
          <div className="desk-recent-actions">
            {entries(desk?.recentIds ?? [])
              .slice(0, 5)
              .map((entry) => (
                <QuickReferenceButton key={entry.id} entry={entry} />
              ))}
          </div>
          {!desk?.recentIds.length && (
            <p className="desk-empty-hint">다시 쓸 표가 여기에 남습니다.</p>
          )}
        </section>
      </div>
      <section className="desk-play-tools" aria-label="자주 쓰는 도구">
        <h2>QUICK TOOLS</h2>
        <div className="desk-quick-grid">
          {quick.map((entry) => (
            <ReferenceRow key={entry.id} entry={entry} showMetadata={false} />
          ))}
        </div>
      </section>
      <div className="desk-regions">
        <span className="eyebrow">REGION</span>
        {regions.map((r) => (
          <button key={r.id} onClick={() => desk?.activate(`region:${r.id}`)}>
            {r.name}
            <ArrowUpRight size={14} />
          </button>
        ))}
      </div>
      <details className="desk-index">
        <summary>
          전체 참조 색인 <b>{desk?.entries.length ?? 0}</b> ›
        </summary>
        <div className="desk-book-list">
          {desk?.entries
            .filter((entry) => entry.kind === 'book')
            .map((entry) => (
              <ReferenceRow key={entry.id} entry={entry} />
            ))}
        </div>
        <button onClick={() => desk?.openSearch()}>모든 표·규칙 검색 →</button>
        {onLibrary && (
          <button onClick={onLibrary}>기존 Oracle 라이브러리 →</button>
        )}
      </details>
    </section>
  );
}
