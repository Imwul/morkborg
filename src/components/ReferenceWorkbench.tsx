import { mythicFocusList } from '../domain/mythicLists';
import { playGuideFor } from '../domain/playGuidance';
import { ProceduralGuide } from './ProceduralGuide';
import { objectShelfStore } from '../storage/notebookTools';
import {
  objectKindForReference,
  objectFromReading,
  appendSavedObject,
  OBJECT_KINDS,
} from '../domain/savedObjects';
import { ReferenceTitleTranslation } from './ReferenceTitleTranslation';
import { ReferenceOracleIntroduction } from './ReferenceOracleIntroduction';
import { ReferenceSourceFamily } from './ReferenceSourceFamily';
import {
  sourceSubtableFamilies,
  sourceSubtableFamilyFor,
} from '../domain/sourceSubtableFamilies';
import { inlineSourceSubtable } from '../domain/inlineSourceSubtable';
import { DungeonPreparation } from './DungeonPreparation';
import { usePrivateDngngen } from './usePrivateDngngen';
import { usePrivateGenerator } from './usePrivateGenerator';
import {
  parsePrivateMonster,
  parsePrivateScvm,
} from '../storage/privateGeneratorClient';
import { scvmReferenceReading } from '../generators/scvmCharacter';
import { monsterSiteReferenceReading } from '../generators/monsterSite';
import { eligibleForReferenceReplay } from '../domain/referenceReading';
import { InlineSourceSubtable } from './InlineSourceSubtable';
import {
  createInlineChildResults,
  retainInlineChild,
  copyReadingWithInlineChildren,
} from '../domain/inlineReadingContinuity';
import {
  ReferenceDice,
  RoadSituationRoller,
  DungeonReferenceRoller,
} from './ReferenceDice';
import { DungeonActionMoves } from './DungeonActionMoves';
import { ReferenceReadingBlock } from './InlineReferenceTools';
import {
  browseReferences,
  groupReferenceResults,
  isDeskClutter,
  REFERENCE_TYPES,
  REFERENCE_CONTEXTS,
  referenceEntryFormula,
  referenceEntryDescription,
} from '../domain/referencePresentation';
import { type ReferenceShelf } from '../domain/freeformReference';
import { usePlayMemory } from './usePlayMemory';
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
import type { RegionId, Section } from '../domain/types';
import type { OracleResult } from '../domain/oracle';
import {
  buildReferenceRegistry,
  searchReferences,
  contextReferences,
  type ReferenceEntry,
  type ReferenceContext as ContextKind,
} from '../domain/references';
import {
  getReferenceRelationships,
  relatedReferenceRelationships,
} from '../domain/referenceRelationships';
import { RelationshipLabel } from './RelationshipLabel';
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
  oracleReadingText,
  oracleFollowUpLinks,
  type ReferenceReading,
} from '../domain/referenceReading';
import { regions } from '../data/regions';
import { SourceDisclosure } from './SourceDisclosure';
import { BookLabel, SourceText } from './SourceText';
import { compactSourceText } from '../domain/sourceDisplay';
import { CityRoller } from './CityRoller';
import { ReferenceLinkedText } from './ReferenceLinkedText';
import { ResultReferenceLinks } from './ResultReferenceLinks';
import { readingResultRelationships } from '../domain/resultRelationships';
import { ReferenceTable } from './ReferenceTable';
import {
  ReferenceReadingText,
  resultTextDensity,
} from './ReferenceReadingText';
import { ReferenceRollTrace } from './ReferenceRollTrace';
import { Translation } from './Translation';
import { selectReferenceReading } from '../domain/referenceTable';
import { PrivateDataTools } from './PrivateDataTools';
import { DeskLanding } from './DeskLanding';
import { SpatialOracle } from './spatial/SpatialOracle';
import { normalizeSpatialSceneId } from '../domain/spatialScenes';

const isOneClick = (entry: ReferenceEntry) => referenceAction(entry).immediate;

export function ReferenceProvider({
  inline = false,
  children,
  notify,
}: {
  inline?: boolean;
  children: ReactNode;
  onCity?: () => void;
  notify: (message: string) => void;
}) {
  const oracles = useOracleRegistry(),
    rules = useRules();
  const index = useMemo(
    () => buildReferenceRegistry(oracles.registry, rules.pack),
    [oracles.registry, rules.pack],
  );
  const relationships = useMemo(
    () => getReferenceRelationships(index, oracles.registry),
    [index, oracles.registry],
  );
  const subtableFamilies = useMemo(
    () => sourceSubtableFamilies(oracles.registry, index),
    [index, oracles.registry],
  );
  const memory = usePlayMemory();
  const [toolState] = useState(() => new Map<string, unknown>());
  const objectShelf = objectShelfStore.use();
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
  const privateDngngen = usePrivateDngngen(
    selectedId === 'procedure:sd.dungeon-preparation' ||
      !!session.readings['procedure:sd.dungeon-preparation']?.preparation,
    selectedId,
  );
  const dngngenPack =
    privateDngngen.status === 'ready' ? privateDngngen.pack : undefined;
  const [characterSource, setCharacterSource] = useState<'core' | 'scvm'>(
    'core',
  );
  const [scvmHomebrew, setScvmHomebrew] = useState(false);
  const privateScvm = usePrivateGenerator(
    '/__private/scvmbirther',
    parsePrivateScvm,
    selectedId === 'procedure:character.core-classless',
  );
  const scvmPack =
    privateScvm.status === 'ready' ? privateScvm.pack : undefined;
  const monsterReference =
    selectedId === 'procedure:workbench.epk' ||
    selectedId === 'rule:feretory.monster-approaches' ||
    selectedId === 'procedure:feretory.monster-approaches';
  const [monsterSource, setMonsterSource] = useState<'book' | 'site'>('book');
  const privateMonster = usePrivateGenerator(
    '/__private/monster',
    parsePrivateMonster,
    monsterReference,
  );
  const monsterPack =
    privateMonster.status === 'ready' ? privateMonster.pack : undefined;
  const [inlineChildren] = useState(createInlineChildResults);
  const [, refreshInlineChildren] = useState(0);
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
  const pendingPhysicalRow = useRef<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen, scope]);
  useEffect(() => {
    inspectorRef.current?.scrollTo({ top: restoreScroll.current ?? 0 });
    restoreScroll.current = null;
  }, [selectedId]);
  const selected = index.byId[selectedId ?? ''] ?? null;
  const subtableFamily = selected
    ? sourceSubtableFamilyFor(subtableFamilies, selected.id)
    : undefined;
  const procedureParts =
    selected && ['procedure', 'rule'].includes(selected.kind)
      ? [
          ...new Set([
            ...(oracles.registry.procedures.find(
              (p) =>
                p.id ===
                (selected.action?.kind === 'procedure'
                  ? selected.action.procedureId
                  : ''),
            )?.oracleIds ?? []),
            ...selected.canonicalIds,
          ]),
        ].flatMap((id) => {
          const table = oracles.registry.tables.find((t) => t.id === id);
          const entry = index.byId[`oracle:${id}`];
          return table && entry ? [{ table, entry }] : [];
        })
      : [];
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
  useEffect(() => {
    if (pendingPhysicalRow.current !== selectedId) return;
    pendingPhysicalRow.current = null;
    const frame = requestAnimationFrame(() => {
      inspectorRef.current
        ?.querySelector(
          '.reference-static-table .reference-table-section > table > tbody > tr.current-table-result',
        )
        ?.scrollIntoView({ block: 'center', behavior: 'instant' });
    });
    return () => cancelAnimationFrame(frame);
  }, [session.sequence, selectedId]);
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
    if (result.rollMethod?.kind === 'USER_ROLL')
      pendingPhysicalRow.current = entryId;
    setSession((state) =>
      retainReferenceReading(state, entryId, result, false),
    );
    touchEntry(entryId);
    if (rolled && result.blocks.length && eligibleForReferenceReplay(result))
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
      dngngenPack,
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
      if (
        results.some(
          (result) =>
            result.reading && !eligibleForReferenceReplay(result.reading),
        )
      )
        return;
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
        if (
          results.some(
            (result) =>
              result.reading && !eligibleForReferenceReplay(result.reading),
          )
        )
          return { ...p, replays: p.replays.filter((r) => r.id !== latest.id) };
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
      if (
        !only &&
        entry.id === 'procedure:character.core-classless' &&
        characterSource === 'scvm' &&
        scvmPack
      ) {
        acceptReading(entry.id, scvmReferenceReading(scvmPack, scvmHomebrew));
        return;
      }
      if (
        !only &&
        monsterSource === 'site' &&
        monsterPack &&
        (entry.id === 'procedure:workbench.epk' ||
          entry.id === 'rule:feretory.monster-approaches' ||
          entry.id === 'procedure:feretory.monster-approaches')
      ) {
        acceptReading(entry.id, monsterSiteReferenceReading(monsterPack));
        return;
      }
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
      if (selected && referenceProducesRoll(selected)) {
        event.preventDefault();
        perform(selected);
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
    if (inline && window.matchMedia('(max-width: 800px)').matches)
      window.scrollTo({ top: 0 });
    setTableView(
      !roll && (entry.kind === 'oracle' || entry.defaultView === 'table'),
    );
    setSearchOpen(false);
    setFailure('');
    setCopyFallback(null);
    setCopied('');
    touchEntry(entryId);
    if (!viewOnly && (roll || entry.action?.kind === 'creature'))
      perform(entry, contextRegion);
  }
  function openLookup(lookup: { oracleId: string; roll: number }) {
    const table = oracles.registry.tables.find(
      (item) => item.id === lookup.oracleId,
    );
    if (!table) return;
    try {
      const value = selectOracleEntry(table, lookup.roll);
      if (!value) return;
      const entryId = index.byId[`oracle:${table.id}`]?.id;
      if (!entryId) return;
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
          sourceRefs: refsForOracle(result, oracles.registry),
          oracle: result,
          ...oracleFollowUpLinks(value.metadata, table.id),
        },
        false,
      );
    } catch (e) {
      setFailure(e instanceof Error ? e.message : '참조 항목을 확인하세요.');
    }
  }
  function openSearch(value = '', nextScope: typeof scope = 'all') {
    convenience.setPanel(null);
    setQuery(value);
    setScope(nextScope);
    if (inline) {
      setSearchOpen(false);
      requestAnimationFrame(() =>
        document.getElementById('desk-primary-search')?.focus(),
      );
    } else setSearchOpen(true);
  }
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        convenience.setPanel(null);
        if (inline) openSearch(query);
        else setSearchOpen((open) => !open);
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
  const resultLinks = readingResultRelationships(
    index.byId,
    oracles.registry,
    reading,
    selected?.id,
  );
  const resultLinkIds = new Set(resultLinks.map((link) => link.entry.id));
  const related = selected
    ? relatedReferenceRelationships(
        index,
        relationships,
        selected.id,
        8,
      ).filter((link) => !resultLinkIds.has(link.entry.id))
    : [];
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
  const generatorResultKind =
    selected?.id === 'procedure:character.core-classless'
      ? 'character'
      : selected &&
          [
            'procedure:workbench.epk',
            'procedure:feretory.monster-approaches',
            'rule:feretory.monster-approaches',
          ].includes(selected.id)
        ? 'monster'
        : undefined;
  async function copyReading(withSource = false) {
    if (!reading) return;
    const text = copyReadingWithInlineChildren(
      reading,
      inlineChildren,
      withSource,
    );
    try {
      await navigator.clipboard.writeText(text);
      setCopied(
        withSource ? '출처와 함께 복사했습니다.' : '결과를 복사했습니다.',
      );
    } catch {
      setCopyFallback(text);
    }
  }
  const focusRoll = reading?.oracle?.rolls.find(
    (roll) => roll.oracleId === 'mythic2.random-event-focus-table',
  );
  const focusList = focusRoll ? mythicFocusList(focusRoll.roll) : null;
  const hasQuickGuide = selected ? !!playGuideFor(selected.id) : false;
  const PartsContainer = hasQuickGuide ? 'details' : 'section';
  const ReadingContainer = plainRule && hasQuickGuide ? 'details' : 'article';
  const saveKind = selected ? objectKindForReference(selected.id) : null;
  const referenceContent = selected ? (
    <section
      className="reference-page"
      aria-label="현재 참조"
      data-reference-id={selected.id}
      data-reference-kind={selected.kind}
      data-has-reading={reading ? 'true' : undefined}
      data-formula={
        referenceEntryFormula(selected, oracles.registry) || undefined
      }
      ref={inspectorRef}
    >
      <div className="reference-inspector-top">
        <details className="reference-convenience-actions">
          <summary aria-label="참조 편의 동작">⋯</summary>
          <button
            onClick={() => {
              if (reading) convenience.sendReading(reading);
              else convenience.scratch(selected.title);
            }}
          >
            SEND TO SCRATCH · 스크랩에 추가
          </button>
        </details>
        <h2 id="current-reference-title">
          {referenceShortName(selected)}
          <ReferenceTitleTranslation entry={selected} />
        </h2>
        <button
          className="ref-pin"
          aria-label={
            prefs.pinnedIds.includes(selected.id) ? '고정 해제' : '참조 고정'
          }
          aria-pressed={prefs.pinnedIds.includes(selected.id)}
          onClick={() => savePrefs(toggleReferencePin(prefs, selected.id))}
        >
          <Pin size={16} />
          {prefs.pinnedIds.includes(selected.id) ? 'PINNED' : 'PIN'}
        </button>
        <button
          className="ref-open-page"
          aria-pressed={convenience.temporary.tray.includes(selected.id)}
          onClick={() =>
            convenience.temporary.tray.includes(selected.id)
              ? convenience.updateTemporary((p) => ({
                  ...p,
                  tray: p.tray.filter((id) => id !== selected.id),
                }))
              : convenience.addTray(selected.id)
          }
        >
          {convenience.temporary.tray.includes(selected.id)
            ? '작업대에서 접기'
            : '작업대에 펼치기'}
        </button>
      </div>
      {saveKind && reading?.blocks.some((block) => block.text.trim()) && (
        <div className="reference-save-object">
          <button
            onClick={() => {
              try {
                const item = objectFromReading(
                  selected.id,
                  reading,
                  inlineChildren,
                );
                objectShelf.update((shelf) => appendSavedObject(shelf, item));
                notify(
                  `${OBJECT_KINDS[saveKind]} 결과를 보관했습니다. 오른쪽 아래 보관함에서 다시 여세요.`,
                );
              } catch (e) {
                setFailure(
                  e instanceof Error ? e.message : '보관하지 못했습니다.',
                );
              }
            }}
          >
            {OBJECT_KINDS[saveKind]} 보관
          </button>
          <small>현재 결과만 이 기기에 저장</small>
        </div>
      )}
      <p className="sr-only">
        {selected.kind.toUpperCase()} ·{' '}
        {regions.find((r) => r.id === region)?.name} ·{' '}
        {selected.canonicalIds.length
          ? `${selected.canonicalIds.length}개 연결 표`
          : '빠른 참조'}
      </p>
      <div className="reference-body">
        <ProceduralGuide referenceId={selected.id} />
        {selected.id === 'rule:sd.dungeonCrawling' && (
          <DungeonReferenceRoller />
        )}
        {[
          'rule:sd.camping-move',
          'rule:sd.search-move',
          'rule:sd.flee-combat',
        ].includes(selected.id) && (
          <DungeonActionMoves
            key={selected.id}
            threatRating={12}
            registry={oracles.registry}
            allowedActions={
              selected.id === 'rule:sd.camping-move'
                ? ['breath', 'camp']
                : selected.id === 'rule:sd.search-move'
                  ? ['search']
                  : ['flee']
            }
          />
        )}

        {selected.id === 'rule:mythic.lists' && (
          <button
            className="open-mythic-lists"
            onClick={() => {
              window.dispatchEvent(new Event('mythic-open-lists'));
            }}
          >
            Mythic 인물 · 스레드 목록 열기 ↗
          </button>
        )}
        {selected.kind === 'oracle' ? (
          <ReferenceOracleIntroduction
            entry={selected}
            registry={oracles.registry}
          />
        ) : (
          !plainRule &&
          !hasQuickGuide &&
          selected.kind !== 'creature' &&
          !/^\d*d\d+\s*·/.test(referenceEntryDescription(selected)) && (
            <p className="reference-summary">
              {referenceEntryDescription(selected)}
            </p>
          )
        )}
        {procedureId === 'character.core-classless' &&
          privateScvm.status !== 'public' && (
            <div className="dungeon-room-source">
              <label>
                캐릭터 원문{' '}
                <select
                  aria-label="캐릭터 생성 원문"
                  value={
                    characterSource === 'scvm' && scvmPack ? 'scvm' : 'core'
                  }
                  onChange={(event) =>
                    setCharacterSource(
                      event.target.value === 'scvm' ? 'scvm' : 'core',
                    )
                  }
                >
                  <option value="core">룰북</option>
                  <option value="scvm" disabled={!scvmPack}>
                    SCVMBIRTHER
                  </option>
                </select>
              </label>
              {characterSource === 'scvm' && scvmPack && (
                <label>
                  <input
                    type="checkbox"
                    checked={scvmHomebrew}
                    onChange={(event) => setScvmHomebrew(event.target.checked)}
                  />{' '}
                  추가 직업 · homebrew
                </label>
              )}
              <small>
                {scvmPack
                  ? `${scvmPack.source.attribution} 선택은 다음 ROLL부터 적용됩니다.`
                  : privateScvm.status === 'loading'
                    ? 'SCVMBIRTHER 스냅샷을 확인하고 있습니다.'
                    : 'SCVMBIRTHER 스냅샷이 이 서버에 없습니다. 룰북 굴림은 계속됩니다.'}
              </small>
            </div>
          )}
        {monsterReference && privateMonster.status !== 'public' && (
          <div className="dungeon-room-source">
            <label>
              몬스터 원문{' '}
              <select
                aria-label="몬스터 생성 원문"
                value={
                  monsterSource === 'site' && monsterPack ? 'site' : 'book'
                }
                onChange={(event) =>
                  setMonsterSource(
                    event.target.value === 'site' ? 'site' : 'book',
                  )
                }
              >
                <option value="book">룰북</option>
                <option value="site" disabled={!monsterPack}>
                  The Monster Approaches · 사이트
                </option>
              </select>
            </label>
            {monsterSource === 'site' && monsterPack && plainRule && (
              <Button
                className="reference-roll"
                onClick={() => perform(selected)}
              >
                <Dices size={16} /> ROLL
              </Button>
            )}
            <small>
              {monsterPack
                ? `${monsterPack.source.attribution} 선택은 다음 ROLL부터 적용됩니다.`
                : privateMonster.status === 'loading'
                  ? '몬스터 스냅샷을 확인하고 있습니다.'
                  : '몬스터 사이트 스냅샷이 이 서버에 없습니다. 룰북 굴림은 계속됩니다.'}
            </small>
          </div>
        )}
        {(!hasQuickGuide || selected.kind === 'oracle') &&
          referenceEntryFormula(selected, oracles.registry) &&
          !(
            procedureId === 'character.core-classless' &&
            characterSource === 'scvm' &&
            scvmPack
          ) && (
            <div className="reference-formula">
              <span className="sr-only">굴림 공식</span>
              <code>{referenceEntryFormula(selected, oracles.registry)}</code>
              {selected.kind === 'oracle' && roller && !reading && (
                <Button
                  className="reference-roll"
                  disabled={!selected.available}
                  onClick={() => perform(selected)}
                >
                  <Dices size={16} /> ROLL
                </Button>
              )}
              {selected.kind === 'oracle' && (
                <PhysicalRollInput
                  key={`manual:${selected.id}`}
                  entry={selected}
                  registry={oracles.registry}
                  tools={convenience}
                />
              )}
            </div>
          )}
        {subtableFamily && (
          <ReferenceSourceFamily
            family={subtableFamily}
            references={index}
            selectedId={selected.id}
            onOpen={(id) => activate(id, false)}
          />
        )}
        {selected.action?.kind === 'region' &&
          index.byId[`rule:regional-monsters:${selected.action.region}`] && (
            <ReferenceRow
              showMetadata={false}
              entry={
                index.byId[`rule:regional-monsters:${selected.action.region}`]
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
                  onClick={() => activate(entry.id, false, hubRegion)}
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
                    onClick={() => activate(entry.id)}
                  >
                    {referenceShortName(entry)} ↗
                  </button>
                ))}
            </div>
          )}
        {!selected.available && (
          <output>이 참조에 필요한 원문 자료가 준비되지 않았습니다.</output>
        )}
        {selected.referenceGroupIds && (
          <nav className="reference-rule-group" aria-label="참조 묶음">
            {selected.referenceGroupIds
              .map((key) => index.byId[key])
              .filter(Boolean)
              .map((entry) => (
                <button key={entry.id} onClick={() => activate(entry.id)}>
                  <span>
                    {entry.title}
                    <ReferenceTitleTranslation entry={entry} />
                  </span>{' '}
                  <span>›</span>
                </button>
              ))}
          </nav>
        )}
        {selected.id === 'rule:sd.leaving-road' && <RoadSituationRoller />}
        {procedureId === 'depths.encounter-level' && (
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
              Unmarked region: choose the closest, or randomly choose one of the
              two closest.
              <Translation text="Unmarked region: choose the closest, or randomly choose one of the two closest." />
            </p>
          </div>
        )}
        <details
          className="reference-options"
          open={!reading || undefined}
          hidden={
            ![
              'workbench.npc',
              'workbench.epk',
              'workbench.stock-room',
              'aitc.street',
            ].includes(procedureId)
          }
        >
          <summary>굴림 설정</summary>
          {['workbench.npc', 'workbench.epk', 'workbench.stock-room'].includes(
            procedureId,
          ) && (
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
                      <option value="common">Common · 지역 / SD d12</option>
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
                          Math.max(1, Math.trunc(Number(e.target.value)) || 1),
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
                  onChange={(e) => setCityLarge(e.target.value === 'large')}
                >
                  <option value="small">Town 이하 · 내용 1회</option>
                  <option value="large">City / Metropolis · 내용 d2회</option>
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
        {roller &&
          (!reading ||
            (procedureId === 'sd.dungeon-preparation' &&
              !reading.blocks.some((block) => block.text))) &&
          selected.kind !== 'oracle' && (
            <Button
              className="reference-roll"
              disabled={!selected.available}
              onClick={() => perform(selected)}
            >
              <Dices size={20} />
              {procedureId === 'depths.rare-monster' ? 'DRAW' : 'ROLL'}
            </Button>
          )}
        {procedureId === 'sd.dungeon-preparation' && (
          <DungeonPreparation
            reading={reading}
            privateDngngen={privateDngngen}
            registry={oracles.registry}
            onChange={(value, rolled) =>
              acceptReading(selected.id, value, rolled)
            }
            onOpen={(id) => activate(id)}
          />
        )}
        {failure && (
          <p role="alert" className="error">
            {failure}
          </p>
        )}
        {reading && !!reading.blocks.some((b) => b.text) && (
          <ReadingContainer
            key={`${selected.id}:${session.sequence}`}
            className={`reference-reading ${plainRule ? 'reference-rule-reading' : 'reference-generated-reading'} ${roller ? 'reference-roll-results' : ''} ${reading.rareMonster ? 'rare-monster-reading' : ''}`}
            aria-label="참조 결과"
            data-generator-result={generatorResultKind}
          >
            {plainRule && hasQuickGuide && (
              <summary>전체 규칙 펼치기 · 원문과 번역</summary>
            )}
            {reading.title !== selected.title &&
              !reading.npcSnapshot &&
              !reading.blocks.some(
                (block) => block.title === reading.title,
              ) && (
                <h3 className="reading-identity">
                  {reading.title}
                  <Translation text={reading.title} />
                </h3>
              )}
            <div className="reference-reading-items">
              {(procedureId === 'sd.dungeon-preparation'
                ? []
                : reading.blocks
              ).map((block, n) => {
                const source = reading.oracle?.rolls.find(
                  (row) =>
                    block.text === row.text ||
                    block.text.startsWith(`${row.text}\n\n`),
                );
                return (
                  <section
                    key={n}
                    data-reading-density={resultTextDensity(block.text)}
                    data-generator-field={
                      generatorResultKind
                        ? block.title
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, '-')
                            .replace(/^-|-$/g, '')
                        : undefined
                    }
                    data-compound-dice={
                      block.dice?.includes(' · ') || undefined
                    }
                    className={
                      block.kind === 'creature' ? 'creature-answer' : undefined
                    }
                  >
                    {block.dice && (
                      <p className="reference-result-dice">
                        <ReferenceRollTrace text={block.dice} />
                      </p>
                    )}
                    {block.title &&
                      !(
                        selected.kind === 'creature' &&
                        selected.title.startsWith(block.title)
                      ) &&
                      !(
                        reading.blocks.length === 1 &&
                        [selected.title, referenceShortName(selected)].includes(
                          block.title,
                        )
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
                                : procedureId === 'depths.encounter-level' &&
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
                        onClick={() => activate(block.definitionReferenceId!)}
                      >
                        {index.byId[block.definitionReferenceId].title} ›
                      </button>
                    ) : block.kind === 'creature' &&
                      block.text.split('\n').length > 2 ? (
                      <>
                        <ReferenceReadingText
                          text={block.text.split('\n').slice(0, 2).join('\n')}
                          translation={block.translation?.ko
                            ?.split('\n')
                            .slice(0, 2)
                            .join('\n')}
                          excludeId={selected.id}
                          splitLines
                        />
                        <div className="reading-more">
                          <ReferenceReadingText
                            text={block.text.split('\n').slice(2).join('\n')}
                            translation={block.translation?.ko
                              ?.split('\n')
                              .slice(2)
                              .join('\n')}
                            excludeId={selected.id}
                            splitLines
                          />
                        </div>
                      </>
                    ) : (
                      <ReferenceReadingText
                        text={block.text}
                        resultText={
                          !plainRule &&
                          !reading.rareMonster &&
                          block.kind !== 'creature'
                            ? (source?.text ?? block.text)
                            : undefined
                        }
                        translation={block.translation?.ko}
                        excludeId={selected.id}
                        splitLines={!!reading.rareMonster}
                      />
                    )}
                  </section>
                );
              })}
            </div>
            {reading.valuationReferenceId &&
              index.byId[reading.valuationReferenceId] && (
                <button
                  className="ref-text-action"
                  onClick={() => activate(reading.valuationReferenceId!, true)}
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
                        <ReferenceTitleTranslation entry={entry} />
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
            <ResultReferenceLinks links={resultLinks} />
            {procedureId !== 'sd.dungeon-preparation' &&
              reading.oracle?.rolls.map((roll, n) => {
                const table = oracles.registry.tables.find(
                  (table) => table.id === roll.oracleId,
                );
                const entry = table?.entries.find(
                  (entry) => entry.id === roll.entryId,
                );
                return (
                  <div key={n}>
                    {table &&
                      entry &&
                      (selected.kind === 'oracle' ? (
                        inlineSourceSubtable(table, entry) && (
                          <button
                            className="reference-inline-link"
                            onClick={() => {
                              const row = inspectorRef.current?.querySelector(
                                `.reference-static-table [data-table-id="${CSS.escape(table.id)}"] > table > tbody > [data-entry-id="${CSS.escape(entry.id)}"]`,
                              );
                              const details =
                                row?.querySelector<HTMLDetailsElement>(
                                  '.table-followup',
                                );
                              if (details) {
                                details.open = true;
                                details.scrollIntoView({
                                  block: 'center',
                                  behavior: 'instant',
                                });
                              }
                            }}
                          >
                            조건부 추가 표 보기 ·{' '}
                            {inlineSourceSubtable(table, entry)!.dice} ↗
                          </button>
                        )
                      ) : (
                        <InlineSourceSubtable
                          key={`${reading.oracle!.id}:${entry.id}`}
                          table={table}
                          entry={entry}
                          parentRoll={roll}
                          parentContext={roll}
                        />
                      ))}
                  </div>
                );
              })}
            {roller &&
              reading.procedureInputs?.generator !== 'scvmbirther' &&
              reading.procedureInputs?.generator !== 'monster-site' && (
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
                  {procedureId === 'depths.rare-monster' ? 'DRAW' : 'REROLL'}
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
                <button onClick={() => convenience.sendReading(reading)}>
                  SEND TO SCRATCH · 스크랩에 추가
                </button>
                <button onClick={() => convenience.sendReading(reading, true)}>
                  출처와 스크랩에 추가
                </button>
              </details>
            </div>
          </ReadingContainer>
        )}
        {procedureId === 'depths.rare-monster' && (
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
              <ol className="rare-card-strip" aria-label="Rare monster cards">
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
        {procedureId.startsWith('depths.') && selected.definition && (
          <details className="reference-procedure-rule" open>
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
      </div>
      {selected.kind === 'oracle' && (
        <div className="reference-static-table">
          {[...new Set(selected.canonicalIds)]
            .flatMap((key) =>
              oracles.registry.tables.filter((table) => table.id === key),
            )
            .map((table) => (
              <ReferenceTable
                key={table.id}
                table={table}
                hideCaption={selected.canonicalIds.length === 1}
                hideDescription
                parentResult={reading?.oracle}
                currentEntryIds={
                  reading?.oracle?.rolls.map((roll) => roll.entryId) ?? []
                }
                onChoose={(table, entry) => {
                  acceptReading(
                    selected.id,
                    selectReferenceReading(table, entry, oracles.registry),
                    false,
                  );
                  setTableView(false);
                }}
              />
            ))}
        </div>
      )}
      {procedureParts.length > 0 &&
        procedureId !== 'sd.dungeon-preparation' && (
          <PartsContainer
            className="reference-procedure-parts"
            aria-label="절차의 독립 구성 표"
          >
            {hasQuickGuide ? (
              <summary>절차에 쓰는 표 펼치기</summary>
            ) : (
              <h3>함께 쓰는 표</h3>
            )}
            {procedureParts.map(({ table, entry }) => (
              <div key={table.id}>
                <span>
                  {table.title} <code>{table.originalDice ?? table.dice}</code>
                </span>
                <button onClick={() => activate(entry.id)}>표 보기</button>
                <button onClick={() => activate(entry.id, true)}>굴리기</button>
              </div>
            ))}
          </PartsContainer>
        )}
      {selected.id === 'rule:core.reaction-morale' && (
        <ReferenceDice
          key={selected.id}
          initialCount={2}
          initialSides={6}
          compact
        />
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
      {focusList && (
        <div className="crawl-follow-through">
          <p>
            이 사건이 가리킬 {focusList === 'characters' ? '인물' : '스레드'}을
            목록에서 정하세요.
          </p>
          <button
            onClick={() => window.dispatchEvent(new Event('mythic-open-lists'))}
          >
            {focusList === 'characters'
              ? 'Characters · 인물'
              : 'Threads · 스레드'}{' '}
            목록 열기 ↗
          </button>
        </div>
      )}
      {selected.kind !== 'oracle' && (
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
        summaryLabel={
          selected.sourceRefs[0] && (
            <>
              <BookLabel
                bookId={selected.sourceRefs[0].bookId}
                title={selected.sourceRefs[0].bookTitle ?? ''}
              />{' '}
              · 출처
            </>
          )
        }
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
                  (selected.available ? 'verified' : 'unavailable-source'),
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
              const entries = grouped.filter((entry) => entry.kind === kind);
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
      {!inline && !!related.length && (
        <section
          className="ref-related ref-related-disclosure"
          aria-label="관련 참조"
        >
          <h3>관련 참조</h3>
          {related
            .filter(
              ({ entry }) =>
                !city ||
                ![
                  'procedure:aitc.street',
                  'procedure:aitc.settlement',
                  'oracle:aitc.npc-encounters',
                  'oracle:aitc.businesses',
                ].includes(entry.id),
            )
            .slice(0, city ? 4 : 8)
            .map(({ entry, kind }) => (
              <button
                key={entry.id}
                title={entry.title}
                aria-label={entry.title}
                onClick={() => activate(entry.id)}
              >
                <RelationshipLabel kind={kind} />
                {referenceShortName(entry)}
                <ReferenceTitleTranslation entry={entry} />
                <ArrowUpRight size={12} />
              </button>
            ))}
        </section>
      )}
    </section>
  ) : null;
  return (
    <ReferenceContext.Provider
      value={{
        toolState,
        selectedId: selected?.id,
        content: referenceContent,
        dismiss: () => {
          setSelectedId(null);
          setSearchOpen(false);
          convenience.setPanel(null);
        },
        query,
        setQuery,
        scope,
        setScope,
        trayIds: convenience.temporary.tray,
        readings,
        resultReferenceIds: [...resultLinkIds],
        inlineChildren,
        onInlineChild: (parent, child) => {
          if (retainInlineChild(inlineChildren, parent, child))
            refreshInlineChildren((revision) => revision + 1);
        },
        perform: (id) => {
          const entry = index.byId[id];
          if (entry) perform(entry);
        },
        removeTray: (id) =>
          convenience.updateTemporary((p) => ({
            ...p,
            tray: p.tray.filter((key) => key !== id),
          })),
        choose: (table, entry) =>
          acceptReading(
            `oracle:${table.id}`,
            selectReferenceReading(table, entry, oracles.registry),
            false,
          ),
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
        relationships,
        openLookup,
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
      {!inline && (
        <div className="reference-rail">
          {!convenience.preferences.playOpened && (
            <small className="play-discovery-hint">
              WORKBENCH · 임시 도구 모음
            </small>
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
              <span className="play-tool-label">작업대</span>
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
                    onClick={() => activate(entry.id)}
                  >
                    {referenceShortName(entry)}
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
      <Dialog
        open={(!inline && (searchOpen || !!selected)) || !!convenience.panel}
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
                  작업대
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
                      onClick={() => activate(entry.id)}
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
              index={index}
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
                {!found.length && <p>일치하는 참조가 없습니다.</p>}
              </div>
            </>
          )}
          {!convenience.panel && !searchOpen && !inline && (
            <>
              <DialogTitle className="sr-only">{selected?.title}</DialogTitle>
              {referenceContent}
            </>
          )}
        </DialogContent>
      </Dialog>
    </ReferenceContext.Provider>
  );
}

/** Preserve existing reading-local shortcuts without claiming a source edge type. */
export function ReadingRelatedReferences({
  reading,
  omitIds = [],
}: {
  reading: ReferenceReading;
  omitIds?: string[];
}) {
  const desk = useReferenceDesk();
  // Oracle relationships are rendered beside their exact source roll below.
  if (reading.oracle || !desk) return null;
  const omitted = new Set(
    [
      desk.selectedId,
      ...omitIds,
      ...(reading.fixedLookups ?? []).map(
        (lookup) => `oracle:${lookup.oracleId}`,
      ),
    ].map((id) => desk.byId[id ?? '']?.id ?? id),
  );
  const entries = [
    ...new Map(
      (reading.relatedIds ?? []).flatMap((id) => {
        const entry = desk.byId[id];
        return entry && !omitted.has(entry.id)
          ? [[entry.id, entry] as const]
          : [];
      }),
    ).values(),
  ];
  if (!entries.length) return null;
  return (
    <div
      className="ref-related reference-next-steps"
      aria-label="결과의 연결된 참조"
    >
      {entries.map((entry) => (
        <button
          key={entry.id}
          data-relationship-target={entry.id}
          onClick={() => desk.activate(entry.id)}
        >
          <span>
            {entry.title} ›
            <ReferenceTitleTranslation entry={entry} />
          </span>
        </button>
      ))}
    </div>
  );
}

export function ReferenceRow({
  entry,
  showMetadata = true,
  relationshipKind,
}: {
  entry: ReferenceEntry;
  showMetadata?: boolean;
  relationshipKind?: 'USES' | 'USED BY';
}) {
  const desk = useReferenceDesk(),
    { registry } = useOracleRegistry();
  const formula = referenceEntryFormula(entry, registry);
  const description = referenceEntryDescription(entry);
  const showDescription =
    entry.kind !== 'creature' &&
    entry.kind !== 'book' &&
    !/^\d*d\d+\s*·/.test(description);
  return (
    <div className="reference-row" data-reference-row={entry.id}>
      <button
        className="reference-select-action"
        aria-label={`${entry.title} 열기`}
        aria-current={desk?.selectedId === entry.id ? 'page' : undefined}
        onClick={() => desk?.activate(entry.id)}
      >
        <strong>
          <RelationshipLabel kind={relationshipKind} />
          {referenceShortName(entry)}
          <ReferenceTitleTranslation entry={entry} />
        </strong>
        {showMetadata && (
          <>
            <small>
              {formula && <code>{formula}</code>}
              <span>
                {entry.kind === 'book' ? (
                  'BOOK'
                ) : entry.sourceRefs[0] ? (
                  <BookLabel
                    bookId={entry.sourceRefs[0].bookId}
                    title={entry.sourceRefs[0].bookTitle ?? ''}
                  />
                ) : (
                  entry.kind
                )}
              </span>
            </small>
            {showDescription && (
              <span className="reference-row-description">{description}</span>
            )}
          </>
        )}
      </button>
      {referenceProducesRoll(entry) && (
        <button
          className="reference-row-roll"
          aria-label={`${entry.title} 굴리기`}
          onClick={() => desk?.activate(entry.id, true)}
        >
          굴리기
        </button>
      )}
    </div>
  );
}
export function QuickReferenceButton({ entry }: { entry: ReferenceEntry }) {
  const desk = useReferenceDesk();
  return (
    <button
      className="quick-reference-action"
      aria-label={`${entry.title} 열기`}
      onClick={() => desk?.activate(entry.id)}
    >
      {referenceShortName(entry)}
    </button>
  );
}
function SearchShortcut() {
  return (
    <span
      className="desk-search-shortcut"
      aria-hidden="true"
      title="검색 단축키: Command + K 또는 Ctrl + K"
    >
      <kbd>⌘ / Ctrl + K</kbd>
    </span>
  );
}
export function ReferenceSearchButton() {
  const desk = useReferenceDesk();
  return (
    <button
      className="universal-search-trigger"
      aria-keyshortcuts="Meta+K Control+K"
      onClick={() => desk?.openSearch()}
    >
      <Search size={16} />
      <span>규칙·표·지역 검색…</span>
      <SearchShortcut />
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
                : desk?.activate(entry.id, false, region)
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
export type ReferenceDeskPage = 'home' | 'reference' | 'generators' | 'spatial';

export function ReferenceDesk({
  homeIndex,
  initialShelf = 'quick',
  initialPage = 'reference',
  page: controlledPage,
  onPageChange,
  onGenerator,
}: {
  homeIndex?: ReactNode;
  initialShelf?: ReferenceShelf;
  initialPage?: ReferenceDeskPage;
  page?: ReferenceDeskPage;
  onPageChange?: (page: ReferenceDeskPage) => void;
  onGenerator?: (section: Section) => void;
}) {
  const desk = useReferenceDesk(),
    source = useOracleRegistry();
  const surfaceRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const revealPageRef = useRef(false);
  useEffect(() => {
    const surface = surfaceRef.current;
    const header = headerRef.current;
    if (!surface || !header) return;
    // The masthead can wrap differently as fonts load or the viewport changes.
    const measure = () =>
      surface.style.setProperty(
        '--desk-header-height',
        `${header.getBoundingClientRect().height}px`,
      );
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);
  const [localPage, setLocalPage] = useState<ReferenceDeskPage>(initialPage);
  const page = controlledPage ?? localPage;
  const [spatialSceneId, setSpatialSceneId] = useState('dungeon');
  useNavigationChannel('spatial-scene', spatialSceneId, setSpatialSceneId, {
    normalize: normalizeSpatialSceneId,
  });
  const setPage = (nextPage: ReferenceDeskPage) => {
    if (nextPage === 'home') {
      desk?.dismiss?.();
      desk?.setQuery?.('');
      desk?.setScope?.('all');
    }
    if (controlledPage === undefined) setLocalPage(nextPage);
    onPageChange?.(nextPage);
  };
  const openReference = (entryId: string, roll = false, region?: RegionId) => {
    revealPageRef.current = true;
    if (page !== 'spatial') setPage('reference');
    setBrowserOpen(false);
    desk?.activate(entryId, roll, region);
  };
  const query = desk?.query ?? '';
  const previousLocation = useRef({ page, id: desk?.selectedId });
  useEffect(() => {
    const previous = previousLocation.current;
    previousLocation.current = { page, id: desk?.selectedId };
    // Opening another page starts at its title. Typing in Search stays in place.
    if (
      revealPageRef.current ||
      previous.id !== desk?.selectedId ||
      (previous.page !== page && !query)
    ) {
      revealPageRef.current = false;
      if (page !== 'spatial')
        surfaceRef.current
          ?.querySelector('.desk-current-page')
          ?.scrollIntoView({ block: 'start' });
    }
  });
  useEffect(() => {
    if (window.matchMedia('(min-width: 801px)').matches)
      document.getElementById('desk-primary-search')?.focus();
  }, []);
  const [kind, setKind] = useState('all'),
    [book, setBook] = useState('');
  const [context, setContext] = useState(
    initialShelf === 'quick' || initialShelf === 'rules' ? '' : initialShelf,
  );
  const [themeLimits, setThemeLimits] = useState<Record<string, number>>({});
  const [diceOpen, setDiceOpen] = useState(false);
  const [browserState, setBrowserState] = useState({
    open: false,
    referenceId: desk?.selectedId,
  });
  // A return through Recent must not revive an old mobile search expansion.
  if (browserState.referenceId !== desk?.selectedId)
    setBrowserState({ open: false, referenceId: desk?.selectedId });
  const browserOpen =
    browserState.open && browserState.referenceId === desk?.selectedId;
  const setBrowserOpen = (open: boolean) =>
    setBrowserState({ open, referenceId: desk?.selectedId });
  const index = useMemo(
    () => ({ entries: desk?.entries ?? [], byId: desk?.byId ?? {} }),
    [desk?.entries, desk?.byId],
  );
  const ids =
    desk?.scope === 'pinned'
      ? desk.pinnedIds
      : desk?.scope === 'recent'
        ? desk.recentIds
        : undefined;
  const found = browseReferences(index, query, { kind, book, context, ids });
  const entries = (ids: string[]) =>
    ids.map((id) => index.byId[id]).filter(Boolean);
  const resetFilters = () => {
    setKind('all');
    setBook('');
    setContext('');
    setThemeLimits({});
  };
  function search(value: string) {
    if (value) setPage('reference');
    setBrowserOpen(!!value);
    desk?.setQuery?.(value);
    desk?.setScope?.('all');
    resetFilters();
  }
  const visibleEntries = index.entries.filter((e) => !isDeskClutter(e));
  const books = visibleEntries.filter((e) => e.kind === 'book');
  const selected = desk?.selectedId ? index.byId[desk.selectedId] : undefined;
  const showResultSpread = page === 'reference' && (browserOpen || !selected);
  const resultGroups =
    desk?.scope === 'pinned' || desk?.scope === 'recent'
      ? [{ id: 'saved', title: '', entries: found }]
      : groupReferenceResults(found, context);
  const relatedItems =
    selected && desk?.relationships
      ? relatedReferenceRelationships(
          index,
          desk.relationships,
          selected.id,
          8,
        ).filter((link) => !desk.resultReferenceIds?.includes(link.entry.id))
      : [];
  const relatedContent = !!relatedItems.length && (
    <section className="desk-related" aria-label="관련 참조">
      <h2>관련 참조</h2>
      {relatedItems.map(({ entry, kind }) => (
        <ReferenceRow key={entry.id} entry={entry} relationshipKind={kind} />
      ))}
    </section>
  );
  const resultIndex = (
    <section
      className="desk-index-results"
      aria-label={query ? '검색 결과' : '참조 목록'}
      data-curated={desk?.scope === 'pinned' || desk?.scope === 'recent'}
    >
      <h2>
        <span>
          {query
            ? '검색 결과'
            : desk?.scope === 'pinned'
              ? '고정한 참조'
              : desk?.scope === 'recent'
                ? '최근 참조'
                : '참조 목록'}
          <small>{found.length}</small>
        </span>
        {(kind !== 'all' || book || context || desk?.scope !== 'all') && (
          <button
            onClick={() => {
              resetFilters();
              setBrowserOpen(true);
              desk?.setScope?.('all');
            }}
          >
            전체 보기
          </button>
        )}
      </h2>
      {resultGroups.map((group) => (
        <section
          className="desk-result-theme"
          data-theme-group={group.id}
          key={group.id}
          aria-label={group.title || '참조'}
        >
          {group.title && (
            <header>
              <h3>{group.title}</h3>
              <span>{group.entries.length}</span>
            </header>
          )}
          <div className="desk-result-theme-entries">
            {group.entries.slice(0, themeLimits[group.id] ?? 6).map((entry) => (
              <ReferenceRow key={entry.id} entry={entry} />
            ))}
          </div>
          {group.entries.length > (themeLimits[group.id] ?? 6) && (
            <button
              className="desk-more"
              aria-label={`${group.title || '참조'} 더 보기`}
              onClick={() =>
                setThemeLimits((current) => ({
                  ...current,
                  [group.id]: (current[group.id] ?? 6) + 12,
                }))
              }
            >
              더 보기{' '}
              <small>
                {group.entries.length - (themeLimits[group.id] ?? 6)}개 남음
              </small>
            </button>
          )}
        </section>
      ))}
      {!found.length && (
        <p className="desk-no-results">
          일치하는 참조가 없습니다. 짧은 단어나 책 이름으로 찾아보세요.
        </p>
      )}
    </section>
  );
  return (
    <ReferenceContext.Provider
      value={desk ? { ...desk, activate: openReference } : null}
    >
      <section
        ref={surfaceRef}
        className="reference-desk rdesk"
        aria-label="Reference Desk"
        data-desk-space={
          page === 'generators' ||
          (page === 'reference' && selected?.kind === 'procedure')
            ? 'field'
            : 'archive'
        }
        data-searching={!!query}
      >
        <header ref={headerRef} className="rdesk-header">
          <h1 className="desk-wordmark">
            <button
              aria-label="Reference Desk 홈"
              onClick={() => {
                setPage('home');
                search('');
                setBrowserOpen(false);
              }}
            >
              <span className="desk-wordmark-name">MÖRK BORG</span>
              <span className="desk-wordmark-caption">REFERENCE DESK</span>
            </button>
          </h1>
          <form
            className="desk-search"
            onSubmit={(e) => {
              e.preventDefault();
              setBrowserOpen(false);
              if (found[0]) openReference(found[0].id);
            }}
          >
            <Search size={19} />
            <Input
              id="desk-primary-search"
              className="desk-search-field border-0 shadow-none rounded-none ring-0 outline-none"
              aria-label="참조 검색"
              aria-keyshortcuts="Meta+K Control+K"
              placeholder="참조 검색…"
              value={query}
              onChange={(e) => search(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  (
                    document.querySelector(
                      '.desk-index-results .reference-select-action',
                    ) as HTMLButtonElement | null
                  )?.focus();
                }
              }}
            />
            {query ? (
              <button
                type="button"
                aria-label="검색 지우기"
                onClick={() => search('')}
              >
                ×
              </button>
            ) : (
              <SearchShortcut />
            )}
          </form>
          <div className="rdesk-utilities">
            <button
              aria-expanded={diceOpen}
              onClick={() => setDiceOpen(!diceOpen)}
            >
              주사위
            </button>
            {homeIndex}
          </div>
          <div className="desk-navigation">
            <nav className="desk-primary-nav" aria-label="주요 페이지">
              {(
                [
                  ['home', '홈'],
                  ['reference', '참조'],
                  ['generators', '생성기'],
                  ['spatial', '공간 탐색'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  aria-current={page === value ? 'page' : undefined}
                  onClick={() => {
                    if (value === 'spatial' && page !== 'spatial')
                      desk?.dismiss?.();
                    setPage(value);
                    if (value !== 'reference') {
                      search('');
                      setBrowserOpen(false);
                    }
                  }}
                >
                  {label}
                </button>
              ))}
            </nav>
            <nav className="desk-browse-types" aria-label="참조 종류">
              <span className="desk-browse-label" aria-hidden="true">
                분류
              </span>
              {REFERENCE_TYPES.map(([id, label]) => (
                <button
                  key={id}
                  aria-pressed={kind === id && desk?.scope === 'all'}
                  onClick={() => {
                    setPage('reference');
                    setKind(id);
                    setBrowserOpen(true);
                    setThemeLimits({});
                    desk?.setScope?.('all');
                    requestAnimationFrame(() => {
                      if (window.matchMedia('(max-width: 800px)').matches)
                        surfaceRef.current
                          ?.querySelector('.desk-index-results')
                          ?.scrollIntoView({ block: 'start' });
                    });
                  }}
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>
        </header>
        {source.loading && <output>룰북 자료를 불러오는 중…</output>}
        {source.error && (
          <div role="alert">
            <p>{source.error}</p>
            <PrivateDataTools />
          </div>
        )}
        {diceOpen && <ReferenceDice />}
        <div
          className="desk-layout"
          data-page={page}
          data-index-spread={showResultSpread}
          data-has-pages={
            page === 'reference' && !showResultSpread && !!desk?.trayIds?.length
          }
        >
          {page === 'reference' && (
            <aside
              className="desk-browser"
              aria-label="참조 탐색"
              data-expanded={browserOpen}
            >
              <button
                className="desk-browse-toggle"
                aria-expanded={browserOpen}
                onClick={() => setBrowserOpen(!browserOpen)}
              >
                참조 찾기 <span>{browserOpen ? '접기 −' : '펼치기 +'}</span>
              </button>
              <div className="desk-browse-filters">
                <label>
                  출처
                  <select
                    aria-label="출처로 좁히기"
                    value={book}
                    onChange={(e) => {
                      setBook(e.target.value);
                      setBrowserOpen(true);
                      setThemeLimits({});
                    }}
                  >
                    <option value="">모든 책</option>
                    {books.map((e) => (
                      <option key={e.id} value={e.id.slice(5)}>
                        {referenceShortName(e)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  관련 상황
                  <select
                    aria-label="관련 상황 바로가기"
                    value={context}
                    onChange={(e) => {
                      setContext(e.target.value);
                      setBrowserOpen(true);
                      setThemeLimits({});
                    }}
                  >
                    <option value="">모든 상황</option>
                    {REFERENCE_CONTEXTS.map(([id, label]) => (
                      <option key={id} value={id}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <section className="desk-nav-history" aria-label="고정한 참조">
                <h2>
                  <button
                    onClick={() => {
                      setPage('reference');
                      setBrowserOpen(true);
                      desk?.setScope?.('pinned');
                      desk?.setQuery?.('');
                      resetFilters();
                    }}
                  >
                    고정 <small>{desk?.pinnedIds.length ?? 0}</small>
                  </button>
                </h2>
                <div>
                  {entries(desk?.pinnedIds ?? []).map((e) => (
                    <QuickReferenceButton key={e.id} entry={e} />
                  ))}
                </div>
              </section>
              <section className="desk-nav-history" aria-label="최근 참조">
                <h2>
                  <button
                    onClick={() => {
                      setPage('reference');
                      setBrowserOpen(true);
                      desk?.setScope?.('recent');
                      desk?.setQuery?.('');
                      resetFilters();
                    }}
                  >
                    최근
                  </button>
                </h2>
                <div>
                  {entries(desk?.recentIds ?? [])
                    .slice(0, 6)
                    .map((e) => (
                      <QuickReferenceButton key={e.id} entry={e} />
                    ))}
                </div>
              </section>
            </aside>
          )}
          <div className="desk-current-page">
            {page === 'spatial' ? (
              <SpatialOracle
                sceneId={spatialSceneId}
                onSceneChange={setSpatialSceneId}
                onBrowse={(scope) => {
                  setPage('reference');
                  desk?.setQuery?.('');
                  desk?.setScope?.(scope);
                  resetFilters();
                  setBrowserOpen(true);
                }}
                related={relatedContent}
                workbench={
                  !!desk?.trayIds?.length && (
                    <section
                      className="desk-open-pages"
                      aria-label="작업대 펼친 페이지"
                    >
                      <h2>
                        펼쳐둔 페이지 <small>{desk.trayIds.length}</small>
                      </h2>
                      {entries(desk.trayIds).map((entry) => (
                        <OpenReferencePage key={entry.id} entry={entry} />
                      ))}
                    </section>
                  )
                }
              />
            ) : page !== 'reference' ? (
              <DeskLanding
                generators={page === 'generators'}
                onGenerator={onGenerator}
                onGenerators={() => setPage('generators')}
                onOpenReference={(id) => openReference(id)}
              />
            ) : (
              <>
                {showResultSpread ? resultIndex : desk?.content}
                {!showResultSpread && relatedContent}
              </>
            )}
          </div>
          {page === 'reference' &&
            !showResultSpread &&
            !!desk?.trayIds?.length && (
              <aside className="desk-side-pages" aria-label="펼친 페이지">
                <section className="desk-open-pages" aria-label="작업대">
                  <h2>
                    펼쳐둔 페이지 <small>{desk.trayIds.length}</small>
                  </h2>
                  {entries(desk.trayIds).map((e) => (
                    <OpenReferencePage key={e.id} entry={e} />
                  ))}
                </section>
              </aside>
            )}
        </div>
      </section>
    </ReferenceContext.Provider>
  );
}

function OpenReferencePage({ entry }: { entry: ReferenceEntry }) {
  const desk = useReferenceDesk(),
    { registry } = useOracleRegistry();
  const reading = desk?.readings?.[entry.id];
  const tables =
    entry.kind === 'oracle'
      ? registry.tables.filter((t) => entry.canonicalIds.includes(t.id))
      : [];
  return (
    <section className="desk-open-page" data-open-reference-id={entry.id}>
      <header>
        <button onClick={() => desk?.activate(entry.id)}>
          {referenceShortName(entry)}
        </button>
        <button
          aria-label={`${entry.title} 페이지 접기`}
          onClick={() => desk?.removeTray?.(entry.id)}
        >
          ×
        </button>
      </header>
      <code>{referenceEntryFormula(entry, registry)}</code>
      {referenceProducesRoll(entry) && (
        <button
          className="open-page-roll"
          onClick={() => desk?.perform?.(entry.id)}
        >
          {reading ? '다시 굴리기' : '굴리기'}
        </button>
      )}
      {entry.id === 'rule:core.reaction-morale' && (
        <ReferenceDice initialCount={2} initialSides={6} compact />
      )}
      {reading && (
        <ReferenceReadingBlock reading={reading} referenceId={entry.id} />
      )}
      <div className="desk-open-page-body">
        {entry.action?.kind === 'rule' && !reading && (
          <ReferenceReadingText
            text={entry.summary}
            translation={entry.summaryTranslationKo}
          />
        )}
        {tables.map((table) => (
          <ReferenceTable
            key={table.id}
            table={table}
            hideCaption
            parentResult={reading?.oracle}
            currentEntryIds={reading?.oracle?.rolls.map((r) => r.entryId) ?? []}
            onChoose={(t, e) => desk?.choose?.(t, e)}
          />
        ))}
        {!tables.length && entry.action?.kind !== 'rule' && !reading && (
          <p>{referenceEntryDescription(entry)}</p>
        )}
        {!reading && <SourceDisclosure refs={entry.sourceRefs} />}
      </div>
    </section>
  );
}
