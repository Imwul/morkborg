import { usePlayMemory } from './usePlayMemory';
import {
  contextLabel,
  validContext,
  type PlayContext,
} from '../domain/playContext';
import { replayResult, type RollReplay } from '../domain/rollReplay';
import type { ExecutionParameters } from '../storage/conveniencePreferences';
import {
  useNavigationBack,
  useNavigationChannel,
} from '../navigation/useNavigationHistory';
import {
  normalizeReferenceLocation,
  referenceLocationKey,
} from '../navigation/referenceLocation';
import { useReferenceConvenience } from './useReferenceConvenience';
import {
  ConveniencePanel,
  PlayTrayStrip,
  PhysicalRollInput,
  PartialRollControls,
} from './ConvenienceTools';
import { suppressRollShortcut } from '../domain/heldReferenceResults';
import { focusedReferences } from '../domain/conveniencePacks';
import { id } from '../generators/random';
import {
  refsForOracle,
  referenceProducesRoll,
} from '../domain/referenceExecution';
import {
  referenceAction,
  referenceShortName,
} from '../domain/referenceActions';
import {
  emptyReferenceSession,
  retainReferenceReading,
} from '../domain/referenceSession';
import {
  authoritiesForReading,
  sourceProcedure,
  appPolicy,
} from '../domain/generationAuthority';
import {
  encounterRegions,
  cardIdentity,
  nextRareLook,
  type PlayingCard,
} from '../domain/depthsProcedures';
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
import type { AppSave, Campaign, RegionId, Workspace } from '../domain/types';
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
  oracleFollowUpLinks,
  type ReferenceReading,
} from '../domain/referenceReading';
import { searchCampaign } from '../domain/campaignSearch';
import { regions } from '../data/regions';
import { SourceDisclosure } from './SourceDisclosure';
import { BookLabel, SourceText } from './SourceText';
import { compactSourceText } from '../domain/sourceDisplay';
import { CityRoller } from './CityRoller';
import { ReferenceLinkedText } from './ReferenceLinkedText';
import { ReferenceNextSteps } from './ReferenceNextSteps';
import { ReferenceTable } from './ReferenceTable';
import { ReferenceReadingText } from './ReferenceReadingText';
import { Translation } from './Translation';
import { selectReferenceReading } from '../domain/referenceTable';
import { PrivateDataTools } from './PrivateDataTools';

const isOneClick = (entry: ReferenceEntry) => referenceAction(entry).immediate;

export function ReferenceProvider({
  save,
  playContext,
  onContextReturn,
  children,
  campaign,
  onCampaignOpen,
  onCity,
  notify,
}: {
  save: AppSave;
  playContext: PlayContext | null;
  onContextReturn: (context: PlayContext) => void;
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
  const memory = usePlayMemory(save, playContext, notify);
  const returnTarget = memory.contexts.find((c) => c.kind !== 'desk');
  function returnTo(context: PlayContext) {
    if (!validContext(context, save)) return;
    setSelectedId(null);
    setSearchOpen(false);
    convenience.setPanel(null);
    memory.setReturnedRoomId(
      context.kind === 'room' ? context.objectId! : null,
    );
    memory.rememberContext(context);
    onContextReturn(context);
  }
  const [prefs, setPrefs] = useState(readReferencePreferences);
  const [selectedId, setSelectedId] = useState<string | null>(null),
    [trail, setTrail] = useState<string[]>([]);
  const [tableView, setTableView] = useState(false);
  const lastReferenceId = useRef<string | null>(null);
  const previousViews = useRef<
    Record<string, { table: boolean; scrollTop: number }>
  >({});
  const restoreScroll = useRef<number | null>(null);
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
  const [encounterRegion, setEncounterRegion] = useState('sarkash');
  const [rareDeck, setRareDeck] = useState<PlayingCard[] | undefined>();
  const [region, setRegion] = useState<RegionId>('sarkash'),
    [stockKind, setStockKind] = useState<'common' | 'rare' | 'room'>('common'),
    [stockDR, setStockDR] = useState(10);
  const inspectorRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen, scope]);
  useEffect(() => {
    inspectorRef.current?.scrollTo({ top: restoreScroll.current ?? 0 });
    restoreScroll.current = null;
  }, [selectedId]);
  const selected = selectedId ? index.byId[selectedId] : null;
  const hubRegion =
    selected?.action?.kind === 'region' ? selected.action.region : undefined;
  const reading: ReferenceReading | undefined =
    selected?.action?.kind === 'rule'
      ? {
          title: selected.title,
          blocks: selected.definition?.blocks ?? [
            {
              title: '',
              text: selected.summary,
              translation: selected.summaryTranslationKo
                ? { ko: selected.summaryTranslationKo }
                : undefined,
            },
          ],
          sourceRefs: selected.sourceRefs,
          authority: [
            ...(selected.authority ?? []),
            ...(selected.definition && !selected.authority
              ? [sourceProcedure(selected.id, selected.sourceRefs)]
              : []),
            ...(selected.referenceGroupIds
              ? [appPolicy('app.reference-groups')]
              : []),
          ],
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
    parameters?: ExecutionParameters,
  ) {
    setSession((state) =>
      retainReferenceReading(state, entryId, result, false),
    );
    touchEntry(entryId);
    if (rolled && result.blocks.length)
      memory.record({
        kind: 'reference',
        referenceId: entryId,
        title: result.title,
        parameters: parameters ?? convenience.parameters(),
        procedureInputs: result.procedureInputs,
        results: [replayResult(entryId, result)],
      });
    if (rolled && index.byId[entryId]?.action?.kind === 'city')
      convenience.remember({
        kind: 'reference',
        id: entryId,
        mode: 'OPEN',
        parameters: convenience.parameters(),
      });
  }
  const convenience = useReferenceConvenience({
    index,
    registry: oracles.registry,
    readings,
    options: {
      registry: oracles.registry,
      rules: rules.pack,
      region,
      stockKind,
      stockDR,
      cityLarge,
      cityExits,
      encounterRegion,
      rareDeck,
    },
    accept: acceptReading,
    open: (id) => activate(id, false, undefined, true),
    onRecipeResolved: (id, title, results, parameters) => {
      const snapshots = results.flatMap((r) =>
        r.reading ? [replayResult(r.referenceId, r.reading, r)] : [],
      );
      if (snapshots.length)
        memory.record({
          kind: 'recipe',
          referenceId: id,
          title,
          parameters,
          results: snapshots,
        });
    },
    onRecipeEdited: (id, results) =>
      memory.update((p) => {
        const latest = p.replays.find(
          (r) => r.kind === 'recipe' && r.referenceId === id,
        );
        if (!latest) return p;
        return {
          ...p,
          replays: p.replays.map((r) =>
            r.id === latest.id
              ? {
                  ...r,
                  results: results.flatMap((result) =>
                    result.reading
                      ? [
                          replayResult(
                            result.referenceId,
                            result.reading,
                            result,
                          ),
                        ]
                      : [],
                  ),
                }
              : r,
          ),
        };
      }),
    notify,
    onDeck: setRareDeck,
    restoreParameters: (params) => {
      setRegion(params.region);
      setStockKind(params.stockKind);
      setStockDR(params.stockDR);
      setCityLarge(params.cityLarge);
      setCityExits(params.cityExits);
      setEncounterRegion(params.encounterRegion);
      setRareDeck(params.rareDeck);
    },
  });
  function rerollReplay(entry: RollReplay) {
    const recipe = convenience.preferences.recipes.find(
      (r) => r.id === entry.referenceId,
    );
    if (
      entry.kind === 'recipe' &&
      (!recipe ||
        JSON.stringify(recipe.referenceIds) !==
          JSON.stringify(entry.results.map((r) => r.referenceId)))
    ) {
      notify(
        '레시피가 변경되거나 삭제됐습니다. 이전 결과는 그대로 볼 수 있습니다.',
      );
      return;
    }
    convenience.rerollLast({
      kind: entry.kind,
      id: entry.referenceId,
      mode: entry.results.some((r) => r.mode !== 'APP_ROLL')
        ? 'USER_ROLL'
        : entry.procedureInputs
          ? 'OPEN'
          : 'APP_ROLL',
      parameters: { ...entry.parameters, rareDeck },
      inputs: entry.results[0]?.inputs,
    });
  }
  const navigation = useNavigationBack();
  useNavigationChannel(
    'reference',
    {
      selectedId,
      trail,
      tableView,
      searchOpen,
      query,
      scope,
      panel: convenience.panel,
      replayId: memory.replayId,
      region,
    },
    (location) => {
      if (selectedId)
        previousViews.current[selectedId] = {
          table: tableView,
          scrollTop: inspectorRef.current?.scrollTop ?? 0,
        };
      restoreScroll.current = location.selectedId
        ? (previousViews.current[location.selectedId]?.scrollTop ?? 0)
        : 0;
      setSelectedId(location.selectedId);
      setTrail(location.trail);
      setTableView(location.tableView);
      setSearchOpen(location.searchOpen);
      setQuery(location.query);
      setScope(location.scope);
      convenience.setPanel(location.panel);
      memory.setReplayId(location.replayId ?? null);
      setRegion(location.region);
      lastReferenceId.current = location.selectedId;
      setFailure('');
      setCopied('');
      setCopyFallback(null);
    },
    {
      normalize: normalizeReferenceLocation,
      identity: referenceLocationKey,
      open: (location) =>
        !!location.selectedId || location.searchOpen || !!location.panel,
    },
  );
  function perform(
    entry: ReferenceEntry,
    contextRegion = region,
    only?: string,
  ) {
    try {
      setFailure('');
      convenience.run(entry, contextRegion, undefined, only);
    } catch (e) {
      setFailure(e instanceof Error ? e.message : '원문 자료를 확인하세요.');
    }
  }
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() !== 'r' ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.shiftKey ||
        event.repeat ||
        suppressRollShortcut(event.target)
      )
        return;
      if (convenience.temporary.lastRoll) {
        event.preventDefault();
        convenience.rerollLast();
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  });
  function activate(
    entryId: string,
    roll = false,
    contextRegion?: RegionId,
    viewOnly = false,
  ) {
    const entry = index.byId[entryId];
    if (!entry) return;
    convenience.setPanel(null);
    entryId = entry.id;
    if (entry.action?.kind === 'city' && !entry.action.move && onCity) {
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
    if (selectedId)
      previousViews.current[selectedId] = {
        table: tableView,
        scrollTop: inspectorRef.current?.scrollTop ?? 0,
      };
    if (previous && previous !== entryId)
      setTrail((t) => [...t, previous].slice(-20));
    lastReferenceId.current = entryId;
    setSelectedId(entryId);
    setTableView(entry.defaultView === 'table');
    setSearchOpen(false);
    setFailure('');
    setCopyFallback(null);
    setCopied('');
    touchEntry(entryId);
    if (!viewOnly && (roll || entry.action?.kind === 'creature'))
      perform(entry, contextRegion);
  }
  function openSearch(value = '', nextScope: typeof scope = 'all') {
    convenience.setPanel(null);
    setQuery(value);
    setScope(nextScope);
    setSearchOpen(true);
  }
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        convenience.setPanel(null);
        setSearchOpen((open) => !open);
        setScope('all');
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  });
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
    ['oracle', 'procedure', 'regional-monster', 'regional-table'].includes(
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
        returnedRoomId: memory.returnedRoomId,
        recordRoll: (id, result, params) => {
          const parameters = { ...convenience.parameters(), ...params };
          acceptReading(id, result, true, parameters);
          if (index.byId[id] && referenceProducesRoll(index.byId[id]))
            convenience.remember({
              kind: 'reference',
              id,
              parameters,
              mode:
                result.rollMethod?.kind === 'USER_ROLL'
                  ? 'USER_ROLL'
                  : 'APP_ROLL',
              inputs: result.rollMethod?.inputs,
            });
        },
        rememberRoom: (dungeonId, roomId) => {
          const owner = save.campaigns.find((c) =>
            c.dungeons.some((d) => d.id === dungeonId),
          );
          if (owner)
            memory.rememberContext({
              kind: 'room',
              campaignId: owner.id,
              dungeonId,
              objectId: roomId,
              dungeonTab: owner.workspace.dungeonTab,
            });
        },
        activePack: convenience.activePack,
        focusedIds: focusedReferences(index, convenience.activePack).map(
          (e) => e.id,
        ),
        openTools: (tab = 'play') => {
          setSearchOpen(false);
          convenience.setPanel(tab);
        },
        clearPack: () =>
          convenience.updatePreferences((p) => ({ ...p, activePackId: null })),
        addTray: convenience.addTray,
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
      <div className="reference-rail">
        {returnTarget &&
          playContext?.kind === 'desk' &&
          !searchOpen &&
          !selected &&
          !convenience.panel && (
            <button
              className="play-context-return"
              onClick={() => returnTo(returnTarget)}
            >
              ← {contextLabel(returnTarget, save)}
            </button>
          )}
        {!convenience.preferences.playOpened && (
          <small className="play-discovery-hint">PLAY — 임시 도구 모음</small>
        )}
        <PlayTrayStrip tools={convenience} />
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
          <button
            aria-label="최근 참조"
            onClick={() => openSearch('', 'recent')}
          >
            <History size={16} />
            <span>최근</span>
          </button>
          <button
            aria-label="Play 도구 열기"
            onClick={() => {
              setSearchOpen(false);
              convenience.setPanel('play');
            }}
          >
            <span className="play-tool-label">PLAY</span>
          </button>
          {convenience.hasLastRoll && (
            <button
              aria-label="마지막 굴림 다시 실행"
              title="R · 마지막 굴림"
              onClick={() => convenience.rerollLast()}
            >
              ↻<span>LAST</span>
            </button>
          )}
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
      </div>
      <Dialog
        open={searchOpen || !!selected || !!convenience.panel}
        onOpenChange={(open) => {
          if (!open) {
            convenience.setPanel(null);
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
            convenience.panel
              ? 'reference-tools-dialog'
              : searchOpen
                ? 'reference-search-dialog'
                : 'reference-inspector'
          }
        >
          {returnTarget && (
            <button
              className="play-context-return"
              onClick={() => returnTo(returnTarget)}
            >
              ← {contextLabel(returnTarget, save)}
            </button>
          )}
          <nav className="reference-inner-tray" aria-label="참조 도구 모음">
            {!convenience.panel && !searchOpen && navigation.canBack && (
              <button aria-label="이전 참조" onClick={navigation.back}>
                <ArrowLeft size={15} />
              </button>
            )}
            <button aria-label="창 안에서 검색" onClick={() => openSearch()}>
              <Search size={15} /> 검색
            </button>
            {!convenience.panel && (
              <>
                <button onClick={() => openSearch('', 'recent')}>
                  <History size={15} /> 최근
                </button>
                <button onClick={() => openSearch('', 'pinned')}>
                  <Pin size={15} /> 고정
                </button>
                <button
                  aria-label="창 안에서 Play 도구"
                  onClick={() => {
                    setSearchOpen(false);
                    convenience.setPanel('play');
                  }}
                >
                  PLAY
                </button>
                {convenience.hasLastRoll && (
                  <button
                    aria-label="마지막 굴림 다시 실행"
                    onClick={() => convenience.rerollLast()}
                  >
                    ↻ LAST
                  </button>
                )}
              </>
            )}
            {convenience.panel && selected && (
              <button onClick={() => convenience.setPanel(null)}>
                결과로 돌아가기
              </button>
            )}
            {!convenience.panel && (
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
            )}
          </nav>
          {!convenience.panel && !!convenience.temporary.tray.length && (
            <div className="reference-inner-play">
              <PlayTrayStrip tools={convenience} />
            </div>
          )}
          {convenience.panel && (
            <ConveniencePanel
              memory={memory}
              save={save}
              index={index}
              onReturn={returnTo}
              onReplayReroll={rerollReplay}
              tools={convenience}
              current={selected ?? undefined}
              registry={oracles.registry}
              onPhysical={(entry) => {
                activate(entry.id);
                setTableView(false);
                convenience.setManualId(entry.id);
                convenience.setError('');
              }}
            />
          )}
          {!convenience.panel && searchOpen && (
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
          {!convenience.panel && !searchOpen && selected && (
            <>
              <div className="reference-inspector-top">
                <details className="reference-convenience-actions">
                  <summary aria-label="참조 편의 동작">⋯</summary>
                  <button
                    disabled={convenience.temporary.tray.includes(selected.id)}
                    onClick={() => convenience.addTray(selected.id)}
                  >
                    ADD TO PLAY · PLAY에 추가
                  </button>
                  <button
                    onClick={() => {
                      if (reading) convenience.sendReading(reading);
                      else convenience.scratch(selected.title);
                    }}
                  >
                    SEND TO SCRATCH · 스크랩에 추가
                  </button>
                </details>
                <DialogTitle>
                  {referenceShortName(selected)}
                  <Translation
                    text={selected.title}
                    translation={selected.titleTranslationKo}
                  />
                </DialogTitle>
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
                !procedureId.startsWith('depths.') &&
                !city &&
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
              {city &&
                !(selected.action?.kind === 'city' && selected.action.move) && (
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
                  <summary>표 보기</summary>
                  {[...new Set(selected.canonicalIds)]
                    .flatMap((key) =>
                      oracles.registry.tables.filter(
                        (table) => table.id === key,
                      ),
                    )
                    .map((table) => (
                      <ReferenceTable
                        key={table.id}
                        table={table}
                        currentEntryIds={
                          reading?.oracle?.rolls.map((roll) => roll.entryId) ??
                          []
                        }
                        onChoose={(table, entry) => {
                          acceptReading(
                            selected.id,
                            selectReferenceReading(
                              table,
                              entry,
                              oracles.registry,
                            ),
                            false,
                          );
                          setTableView(false);
                        }}
                      />
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
              {!tableView && selected.referenceGroupIds && (
                <nav className="reference-rule-group" aria-label="참조 묶음">
                  {selected.referenceGroupIds
                    .map((key) => index.byId[key])
                    .filter(Boolean)
                    .map((entry) => (
                      <button
                        key={entry.id}
                        onClick={() => activate(entry.id, isOneClick(entry))}
                      >
                        <span>
                          {entry.title}
                          <Translation
                            text={entry.title}
                            translation={entry.titleTranslationKo}
                          />
                        </span>{' '}
                        <span>›</span>
                      </button>
                    ))}
                </nav>
              )}
              {!tableView && procedureId === 'depths.encounter-level' && (
                <div className="ref-controls depths-controls">
                  <label>
                    Depths region · 지역
                    <select
                      value={encounterRegion}
                      onChange={(e) => setEncounterRegion(e.target.value)}
                    >
                      {encounterRegions(oracles.registry).map((r) => (
                        <option key={r.key} value={r.key}>
                          {r.name} · EL {r.level}
                        </option>
                      ))}
                    </select>
                  </label>
                  <p>
                    Unmarked region: choose the closest, or randomly choose one
                    of the two closest.
                    <Translation text="Unmarked region: choose the closest, or randomly choose one of the two closest." />
                  </p>
                </div>
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
                  key={selected.id}
                  registry={oracles.registry}
                  initialMove={
                    selected.action?.kind === 'city'
                      ? selected.action.move
                      : undefined
                  }
                  allowedMoves={
                    selected.action?.kind === 'city' && selected.action.move
                      ? [selected.action.move]
                      : undefined
                  }
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
                  {procedureId === 'depths.rare-monster' ? 'DRAW' : 'ROLL'}
                </Button>
              )}
              {failure && (
                <p role="alert" className="error">
                  {failure}
                </p>
              )}
              {reading &&
                !tableView &&
                !!reading.blocks.some((b) => b.text) && (
                  <article
                    key={`${selected.id}:${session.sequence}`}
                    className={`reference-reading ${plainRule ? 'reference-rule-reading' : ''} ${reading.rareMonster ? 'rare-monster-reading' : ''}`}
                    aria-label="참조 결과"
                  >
                    {reading.title !== selected.title &&
                      !reading.blocks.some(
                        (block) => block.title === reading.title,
                      ) && (
                        <h3 className="reading-identity">
                          {reading.title}
                          <Translation text={reading.title} />
                        </h3>
                      )}
                    {reading.blocks.map((block, n) => (
                      <section
                        key={n}
                        className={
                          block.kind === 'creature'
                            ? 'creature-answer'
                            : !plainRule &&
                                !reading.rareMonster &&
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
                          ) && (
                            <h3>
                              <ReferenceLinkedText
                                text={block.title}
                                excludeId={selected.id}
                              />
                              <Translation
                                text={block.title}
                                translation={
                                  block.translation?.titleKo ??
                                  (reading.rareMonster
                                    ? (
                                        {
                                          INTENTION: '의도',
                                          SPECIAL: '특수 능력',
                                        } as Record<string, string>
                                      )[block.title]
                                    : procedureId ===
                                          'depths.encounter-level' &&
                                        block.title === 'NEXT'
                                      ? '다음 절차'
                                      : undefined)
                                }
                              />
                            </h3>
                          )}
                        {block.definitionReferenceId &&
                        index.byId[block.definitionReferenceId] ? (
                          <button
                            className="reference-inline-link"
                            onClick={() =>
                              activate(block.definitionReferenceId!, true)
                            }
                          >
                            {index.byId[block.definitionReferenceId].title} ›
                          </button>
                        ) : block.kind === 'creature' &&
                          block.text.split('\n').length > 2 ? (
                          <>
                            <ReferenceReadingText
                              text={block.text
                                .split('\n')
                                .slice(0, 2)
                                .join('\n')}
                              translation={block.translation?.ko
                                ?.split('\n')
                                .slice(0, 2)
                                .join('\n')}
                              excludeId={selected.id}
                              splitLines
                            />
                            <details className="reading-more">
                              <summary>자세히</summary>
                              <ReferenceReadingText
                                text={block.text
                                  .split('\n')
                                  .slice(2)
                                  .join('\n')}
                                translation={block.translation?.ko
                                  ?.split('\n')
                                  .slice(2)
                                  .join('\n')}
                                excludeId={selected.id}
                                splitLines
                              />
                            </details>
                          </>
                        ) : (
                          <ReferenceReadingText
                            text={block.text}
                            translation={block.translation?.ko}
                            excludeId={selected.id}
                            splitLines={!!reading.rareMonster}
                          />
                        )}
                      </section>
                    ))}
                    {reading.valuationReferenceId &&
                      index.byId[reading.valuationReferenceId] && (
                        <button
                          className="ref-text-action"
                          onClick={() =>
                            activate(reading.valuationReferenceId!, true)
                          }
                        >
                          매각가 ›
                        </button>
                      )}
                    {!!reading.childReferenceIds?.length && (
                      <details className="reading-participants">
                        <summary>변종 · 참가자</summary>
                        <div className="reference-rule-group">
                          {reading.childReferenceIds
                            .map((key) => index.byId[key])
                            .filter(Boolean)
                            .map((entry) => (
                              <button
                                key={entry.id}
                                onClick={() => activate(entry.id, true)}
                              >
                                {entry.title} ›
                                <Translation
                                  text={entry.title}
                                  translation={entry.titleTranslationKo}
                                />
                              </button>
                            ))}
                        </div>
                      </details>
                    )}
                    {reading.rareMonster && (
                      <details className="rare-look-choice">
                        <summary>Look이 던전과 맞지 않을 때</summary>
                        <button
                          onClick={() => {
                            try {
                              acceptReading(
                                selected.id,
                                nextRareLook(reading, oracles.registry),
                                false,
                              );
                            } catch (e) {
                              setFailure((e as Error).message);
                            }
                          }}
                        >
                          원문의 다음 Look 선택
                        </button>
                      </details>
                    )}
                    {procedureId === 'depths.encounter-level' && (
                      <ReferenceNextSteps ids={reading.relatedIds} />
                    )}
                    <ReferenceNextSteps
                      ids={selected.definition?.nextReferenceIds}
                    />
                    {reading.oracle?.rolls
                      .filter((roll) =>
                        Array.isArray(roll.metadata?.followUpReferenceIds),
                      )
                      .map((roll, n) => (
                        <ReferenceNextSteps key={n} metadata={roll.metadata} />
                      ))}
                    {roller && (
                      <PartialRollControls
                        entry={selected}
                        reading={reading}
                        registry={oracles.registry}
                        tools={convenience}
                        onReroll={(key) => perform(selected, region, key)}
                      />
                    )}
                    <div className="ref-copy-actions">
                      {roller && (
                        <Button
                          variant="ghost"
                          onClick={() => perform(selected)}
                          className="result-reroll"
                        >
                          <Dices size={16} />{' '}
                          {procedureId === 'depths.rare-monster'
                            ? 'DRAW'
                            : 'REROLL'}
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
                        <button
                          onClick={() => convenience.sendReading(reading)}
                        >
                          SEND TO SCRATCH · 스크랩에 추가
                        </button>
                        <button
                          onClick={() => convenience.sendReading(reading, true)}
                        >
                          출처와 스크랩에 추가
                        </button>
                      </details>
                    </div>
                  </article>
                )}
              {!tableView && procedureId === 'depths.rare-monster' && (
                <details className="rare-card-details">
                  <summary>
                    카드 {reading?.rareMonster?.cards.length ?? 0} · 기록
                  </summary>
                  <div className="rare-card-controls">
                    <span>
                      {rareDeck
                        ? `${rareDeck.length} cards left · 남은 카드 ${rareDeck.length}장`
                        : 'New 52-card deck · 새 덱 52장'}
                    </span>
                    <button
                      onClick={() => {
                        setRareDeck(undefined);
                        convenience.updateTemporary((p) => ({
                          ...p,
                          lastRoll:
                            p.lastRoll?.id === selected.id
                              ? {
                                  ...p.lastRoll,
                                  parameters: {
                                    ...p.lastRoll.parameters,
                                    rareDeck: undefined,
                                  },
                                }
                              : p.lastRoll,
                        }));
                        setFailure('');
                      }}
                    >
                      SHUFFLE · 새 던전
                    </button>
                  </div>
                  {reading?.rareMonster && (
                    <ol
                      className="rare-card-strip"
                      aria-label="Rare monster cards"
                    >
                      {reading.rareMonster.cards.map((card, n) => (
                        <li key={n}>
                          <small>CARD {n + 1}</small>
                          <strong>{cardIdentity(card)}</strong>
                          <span>
                            {
                              [
                                'Look · 외형',
                                'Feature · 특징',
                                'HP / Armor · 방어구',
                                'Morale · 사기',
                                'Attack · 공격',
                                'Special · 특수',
                              ][n]
                            }
                          </span>
                        </li>
                      ))}
                    </ol>
                  )}
                </details>
              )}
              {!tableView &&
                procedureId.startsWith('depths.') &&
                selected.definition && (
                  <details className="reference-procedure-rule">
                    <summary>절차</summary>
                    {selected.definition.blocks.map((block, n) => (
                      <section key={n}>
                        <h4>
                          {block.title}
                          <Translation
                            text={block.title}
                            translation={block.translation?.titleKo}
                          />
                        </h4>
                        <ReferenceReadingText
                          text={block.text}
                          translation={block.translation?.ko}
                          excludeId={selected.id}
                        />
                      </section>
                    ))}
                  </details>
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
              {!tableView && (
                <PhysicalRollInput
                  key={`manual:${selected.id}`}
                  entry={selected}
                  registry={oracles.registry}
                  tools={convenience}
                />
              )}
              <SourceDisclosure
                key={`source:${selected.id}`}
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
                {reading?.rollMethod && (
                  <p className="reference-roll-method">
                    {reading.rollMethod.kind === 'USER_ROLL'
                      ? 'MANUAL ROLL · USER_ROLL · 실물 입력'
                      : reading.rollMethod.kind === 'MIXED'
                        ? 'MIXED · 실물 입력과 앱 재굴림'
                        : 'APP ROLL · 앱 굴림'}
                  </p>
                )}
                {reading?.oracle?.rolls.some(
                  (r) => r.metadata?.rollOrigin === 'USER_ROLL',
                ) && (
                  <ul>
                    {reading.oracle.rolls.map((r, n) => (
                      <li key={n}>
                        {r.title} · {r.dice} = {r.roll} ·{' '}
                        {r.metadata?.rollOrigin === 'USER_ROLL'
                          ? 'USER_ROLL'
                          : 'APP_ROLL'}
                      </li>
                    ))}
                  </ul>
                )}
                {selected.kind === 'oracle' && !tableView && (
                  <button
                    className="ref-text-action"
                    onClick={() => setTableView(true)}
                  >
                    표 보기
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
                          acceptReading(
                            entryId,
                            {
                              title: table.title,
                              blocks: [
                                {
                                  title: `#${lookup.roll}`,
                                  text: oracleReadingText(value),
                                },
                              ],
                              sourceRefs: refsForOracle(
                                result,
                                oracles.registry,
                              ),
                              oracle: result,
                              ...oracleFollowUpLinks(value.metadata),
                            },
                            false,
                          );
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
                  <summary>관련</summary>
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
                        <Translation
                          text={entry.title}
                          translation={entry.titleTranslationKo}
                        />
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
              {entry.definition?.kind ?? entry.kind.toUpperCase()}
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
export function ReferenceDesk({
  onLibrary,
  homeIndex,
}: {
  onLibrary?: () => void;
  homeIndex?: ReactNode;
}) {
  const desk = useReferenceDesk(),
    source = useOracleRegistry();
  const [query, setQuery] = useState('');
  useNavigationChannel('desk-query', query, setQuery, {
    normalize: (value) =>
      typeof value === 'string' ? value.slice(0, 2000) : '',
    identity: () => 'query',
  });
  const found = query.trim() ? (desk?.search(query, 8) ?? []) : [];
  const entries = (ids: string[]) =>
    ids
      .map((id) => desk?.byId[id])
      .filter((entry): entry is ReferenceEntry => !!entry);
  const quick = desk?.activePack
    ? entries(desk.focusedIds ?? []).slice(0, 6)
    : entries([
        'oracle:core.reaction',
        'procedure:reclvse.action-theme',
        'procedure:workbench.stock-room',
        'procedure:workbench.npc',
      ]);
  const activePack = desk?.activePack && (
    <span className="desk-active-pack">
      <button
        className="desk-pack-choice"
        onClick={() => desk.openTools?.('packs')}
      >
        {desk.activePack.name}
      </button>
      <button aria-label="Pack 해제" onClick={() => desk.clearPack?.()}>
        ×
      </button>
    </span>
  );
  return (
    <section className={`reference-desk${homeIndex ? ' reference-home' : ''}`}>
      <header className="desk-heading">
        {homeIndex ? (
          <>
            <div className="home-cover-meta">
              <span>REFERENCE DESK</span>
              <span>HOME · 전체 목차</span>
            </div>
            <h1>
              <span>MÖRK</span> <span>BORG</span>
            </h1>
            <p className="home-cover-caption">규칙 · 오라클 · 생성 도구</p>
          </>
        ) : (
          <>
            <h1>REFERENCE DESK</h1>
            <span className="eyebrow">MÖRK BORG</span>
          </>
        )}
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
          placeholder="규칙 · 표 · 이름 검색"
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
        <section
          aria-label="고정한 표"
          hidden={!!homeIndex && !desk?.pinnedIds.length}
        >
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
        <section
          aria-label="최근 사용한 표"
          hidden={!!homeIndex && !desk?.recentIds.length}
        >
          <h2>
            RECENT{' '}
            <button onClick={() => desk?.openSearch('', 'recent')}>
              전체 ›
            </button>
          </h2>
          <div className="desk-recent-actions">
            {entries(desk?.recentIds ?? [])
              .slice(0, homeIndex ? 3 : 5)
              .map((entry) => (
                <QuickReferenceButton key={entry.id} entry={entry} />
              ))}
          </div>
          {!desk?.recentIds.length && (
            <p className="desk-empty-hint">다시 쓸 표가 여기에 남습니다.</p>
          )}
        </section>
      </div>
      {homeIndex && activePack && (
        <div className="home-active-pack">{activePack}</div>
      )}
      {homeIndex ?? (
        <>
          <section className="desk-play-tools" aria-label="자주 쓰는 도구">
            <h2>QUICK TOOLS {activePack}</h2>
            <div className="desk-quick-grid">
              {quick.map((entry) => (
                <ReferenceRow
                  key={entry.id}
                  entry={entry}
                  showMetadata={false}
                />
              ))}
            </div>
          </section>
          <div className="desk-regions">
            <span className="eyebrow">REGION</span>
            {regions.map((r) => (
              <button
                key={r.id}
                onClick={() => desk?.activate(`region:${r.id}`)}
              >
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
            <button onClick={() => desk?.openSearch()}>
              모든 표·규칙 검색 →
            </button>
            {onLibrary && (
              <button onClick={onLibrary}>기존 Oracle 라이브러리 →</button>
            )}
          </details>
        </>
      )}
    </section>
  );
}
