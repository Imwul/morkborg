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
import type {
  Campaign,
  RegionId,
  Monster,
  SourceReference,
  Workspace,
} from '../domain/types';
import type { OracleRegistry, OracleResult } from '../domain/oracle';
import {
  buildReferenceRegistry,
  searchReferences,
  relatedReferences,
  contextReferences,
  rollRegionalReference,
  findReferenceCreature,
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
import {
  selectOracleEntry,
  sourceLabel,
  rollProcedure,
} from '../generators/oracleRoller';
import { id } from '../generators/random';
import {
  generateEatPreyKillMonster,
  loadMonsterPreset,
} from '../generators/monster';
import {
  encounterTable,
  createEncounter,
  createNPC,
} from '../generators/content';
import { rollCityReference } from '../domain/cityReference';
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
import { CityRoller } from './CityRoller';
import { PrivateDataTools } from './PrivateDataTools';

function refsForOracle(
  result: OracleResult,
  registry: OracleRegistry,
): SourceReference[] {
  return result.rolls.map((roll) => {
    const table = registry.tables.find(
      (t) =>
        t.id ===
        (typeof roll.metadata?.sourceTableId === 'string'
          ? roll.metadata.sourceTableId
          : roll.oracleId),
    );
    if (!table)
      return { tableTitle: roll.title, note: roll.source, roll: roll.roll };
    return {
      bookId: table.sourceBookId,
      bookTitle: registry.books.find((b) => b.id === table.sourceBookId)?.title,
      tableId: table.id,
      tableTitle: roll.entryId == null ? roll.title : table.title,
      ...(roll.entryId == null
        ? { note: roll.dice + ' · 절차의 수량 판정' }
        : {}),
      pdfPage: table.sourcePage,
      printedPage: table.printedPage,
      roll: roll.roll,
      entryId: roll.entryId,
    };
  });
}
function monsterBlocks(m: Monster): ReferenceReading['blocks'] {
  return [
    {
      title: m.name,
      text: [
        `HP ${m.hp} · Morale ${m.morale} · Armor ${m.armor || '—'}`,
        ...m.attacks.map(
          (a) =>
            `${a.name} ${a.damage}${a.description ? ' · ' + a.description : ''}`,
        ),
        ...m.special.map((s) => s.text),
        ...m.weakness.map((s) => `Weakness: ${s.text}`),
        ...m.loot.map((s) => `Loot: ${s.text}`),
        m.behavior,
        m.wants,
        m.description,
      ]
        .filter(Boolean)
        .join('\n'),
    },
  ];
}
const isOneClick = (entry: ReferenceEntry) =>
  entry.available &&
  (entry.action?.kind === 'oracle' ||
    entry.action?.kind === 'regional-monster' ||
    (entry.action?.kind === 'procedure' &&
      !['workbench.city', 'workbench.stock-room'].includes(
        entry.action.procedureId,
      )));

export function ReferenceProvider({
  children,
  campaign,
  onCampaignOpen,
  notify,
}: {
  children: ReactNode;
  campaign?: Campaign;
  onCampaignOpen: (patch: Partial<Workspace>) => void;
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
  const lastReferenceId = useRef<string | null>(null);
  const [readings, setReadings] = useState<Record<string, ReferenceReading>>(
    {},
  );
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
  useEffect(() => {
    inspectorRef.current?.scrollTo({ top: 0 });
  }, [selectedId]);
  const selected = selectedId ? index.byId[selectedId] : null;
  const reading = selectedId ? readings[selectedId] : undefined;
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
  function acceptReading(entryId: string, result: ReferenceReading) {
    setReadings((r) => ({ ...r, [entryId]: result }));
    touchEntry(entryId);
  }
  function perform(entry: ReferenceEntry) {
    try {
      setFailure('');
      const action = entry.action;
      if (!action || !entry.available) return;
      let output: ReferenceReading | undefined;
      if (action.kind === 'creature') {
        const preset = findReferenceCreature(rules.pack, action.creatureId);
        if (!preset) throw new Error('확인된 생물 원문 자료를 불러오세요.');
        const monster = loadMonsterPreset(id(), preset);
        output = {
          title: entry.title,
          blocks: monsterBlocks(monster),
          sourceRefs: entry.sourceRefs,
        };
      } else if (action.kind === 'regional-monster') {
        if (!rules.pack) throw new Error('몬스터 원문 자료를 불러오세요.');
        const r = rollRegionalReference(
          action.region,
          oracles.registry,
          rules.pack,
        );
        const blocks = [
          {
            title: r.reading.title,
            text: r.reading.text,
            dice: `${r.reading.dice} = ${r.reading.roll}${r.quantity == null ? '' : ' · 수량 ' + r.quantity}`,
          },
        ];
        if (r.preset)
          blocks.push(
            ...monsterBlocks(loadMonsterPreset(id(), r.preset)).map((b) => ({
              ...b,
              dice: b.dice ?? '',
            })),
          );
        if (r.unresolved)
          blocks.push({
            title: '원문 참조',
            text: r.reason ?? '이 항목은 원문 지시를 확인하세요.',
            dice: '',
          });
        output = {
          title: entry.title,
          blocks,
          sourceRefs: r.sourceChain.map((step) => step.source),
        };
      } else if (
        action.kind === 'procedure' &&
        action.procedureId === 'workbench.npc'
      ) {
        const npc = createNPC(id(), region, false, oracles.registry);
        output = {
          title: npc.name,
          blocks: [
            {
              title: npc.archetype,
              text: [
                npc.appearance,
                npc.behaviour,
                npc.personality,
                npc.wants,
                `Reaction: ${npc.reaction}`,
              ]
                .filter(Boolean)
                .join('\n'),
            },
          ],
          sourceRefs: npc.sourceRefs,
        };
      } else if (
        action.kind === 'procedure' &&
        action.procedureId === 'workbench.epk'
      ) {
        const monster = generateEatPreyKillMonster(id(), region);
        output = {
          title: monster.name,
          blocks: monsterBlocks(monster),
          sourceRefs: [
            {
              bookId: 'feretory',
              bookTitle: 'MÖRK BORG CULT: FERETORY',
              tableTitle: 'Eat Prey Kill',
              note: monster.sources?.hp,
            },
          ],
        };
      } else if (
        action.kind === 'procedure' &&
        action.procedureId === 'workbench.stock-room'
      ) {
        const encounter = createEncounter(
          id(),
          region,
          stockKind,
          stockDR,
          false,
          oracles.registry,
        );
        output = {
          title: entry.title,
          blocks: [
            {
              title: `${stockKind.toUpperCase()} · ${region}`,
              text:
                encounter.text ||
                '굴림이 원문 표 범위 밖입니다. 직접 참조하세요.',
              dice: `${stockKind === 'rare' ? 'd8 + DR ' + stockDR : encounterTable(stockKind, region, oracles.registry) === 'sd.stockCreatures' ? 'd12' : (oracles.registry.tables.find((t) => t.id === encounterTable(stockKind, region, oracles.registry))?.dice ?? '')} = ${encounter.generation?.rolls?.result ?? ''}`,
            },
          ],
          sourceRefs: encounter.sourceRefs,
        };
      } else if (action.kind === 'oracle' || action.kind === 'procedure') {
        const procedure =
          action.kind === 'oracle'
            ? { id: entry.id, title: entry.title, oracleIds: action.oracleIds }
            : oracles.registry.procedures.find(
                (p) => p.id === action.procedureId,
              );
        if (!procedure) return;
        const specialCityId =
          action.kind === 'procedure' && action.procedureId === 'aitc.street'
            ? 'aitc.street'
            : action.kind === 'oracle' &&
                action.oracleIds[0] === 'aitc.notable-artefact-type'
              ? 'aitc.notable-artefact-type'
              : null;
        const result = specialCityId
          ? rollCityReference(
              {
                procedureId: specialCityId,
                cityOrMetropolis: cityLarge,
                includeExits: cityExits,
              },
              oracles.registry,
            )
          : rollProcedure(procedure, oracles.registry);
        output = {
          title: result.title,
          blocks: result.rolls.map((r) => ({
            title: r.title,
            text: oracleReadingText(r),
            dice: `${r.dice} = ${r.roll}`,
          })),
          sourceRefs: refsForOracle(result, oracles.registry),
          oracle: result,
          relatedIds: [
            ...new Set(
              result.rolls.flatMap((roll) =>
                Array.isArray(roll.metadata?.followUpOracleIds)
                  ? roll.metadata.followUpOracleIds
                      .filter((key): key is string => typeof key === 'string')
                      .map((key) => `oracle:${key}`)
                  : [],
              ),
            ),
          ],
          fixedLookups: result.rolls.flatMap((roll) =>
            Array.isArray(roll.metadata?.fixedLookups)
              ? roll.metadata.fixedLookups.filter(
                  (value): value is { oracleId: string; roll: number } =>
                    !!value &&
                    typeof value.oracleId === 'string' &&
                    Number.isInteger(value.roll),
                )
              : [],
          ),
        };
      }
      if (output) acceptReading(entry.id, output);
    } catch (e) {
      setFailure(e instanceof Error ? e.message : '원문 자료를 확인하세요.');
    }
  }
  function activate(entryId: string, roll = false) {
    const entry = index.byId[entryId];
    if (!entry) return;
    entryId = entry.id;
    const previous = selectedId ?? lastReferenceId.current;
    if (previous && previous !== entryId)
      setTrail((t) => [...t, previous].slice(-20));
    lastReferenceId.current = entryId;
    setSelectedId(entryId);
    setSearchOpen(false);
    setFailure('');
    setCopyFallback(null);
    setCopied('');
    touchEntry(entryId);
    if (roll || entry.action?.kind === 'creature') perform(entry);
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
  return (
    <ReferenceContext.Provider
      value={{
        entries: index.entries,
        byId: index.byId,
        activate,
        openSearch,
        contextual: (context, r) => contextReferences(index, context, r, 6),
        pinnedIds: prefs.pinnedIds,
        recentIds: prefs.recentIds,
        togglePin: (entryId) => savePrefs(toggleReferencePin(prefs, entryId)),
      }}
    >
      {children}
      <div className="reference-dock" aria-label="빠른 참조">
        <button aria-label="참조 검색" onClick={() => openSearch()}>
          <Search size={16} />
          <span>검색</span>
        </button>
        <button onClick={() => openSearch('', 'pinned')}>
          <Pin size={15} />
          <span>고정 {prefs.pinnedIds.length}</span>
        </button>
        <button onClick={() => openSearch('', 'recent')}>
          <History size={16} />
          <span>최근</span>
        </button>
        <div className="dock-pinned">
          {prefs.pinnedIds
            .map((key) => index.byId[key])
            .filter(Boolean)
            .slice(0, 2)
            .map((entry) => (
              <button
                key={entry.id}
                title={entry.title}
                onClick={() => activate(entry.id, isOneClick(entry))}
              >
                {entry.title}
              </button>
            ))}
        </div>
      </div>
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="reference-search-dialog">
          <DialogTitle>
            {scope === 'all'
              ? '무엇이 필요합니까?'
              : scope === 'pinned'
                ? '고정한 참조'
                : '최근 사용한 참조'}
          </DialogTitle>
          <DialogDescription>
            Oracle · 규칙 · 지역 · 생물 · 책을 한곳에서 찾으세요.
          </DialogDescription>
          <Input
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
            {owned.length > 0 && <p className="eyebrow">보관한 캠페인 자료</p>}
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
            {!found.length && !owned.length && <p>일치하는 참조가 없습니다.</p>}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedId(null);
          }
        }}
      >
        <DialogContent ref={inspectorRef} className="reference-inspector">
          {selected && (
            <>
              <div className="reference-inspector-top">
                <Button
                  variant="ghost"
                  disabled={!trail.length}
                  onClick={() => {
                    const previous = trail.at(-1);
                    if (previous) {
                      setSelectedId(previous);
                      lastReferenceId.current = previous;
                      setTrail((t) => t.slice(0, -1));
                      setFailure('');
                      setCopied('');
                      setCopyFallback(null);
                      touchEntry(previous);
                    }
                  }}
                >
                  <ArrowLeft size={15} /> 이전 참조
                </Button>
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
              <DialogTitle>{selected.title}</DialogTitle>
              <DialogDescription>
                {selected.kind.toUpperCase()} ·{' '}
                {selected.canonicalIds.length
                  ? `${selected.canonicalIds.length}개 연결 표`
                  : '빠른 참조'}
              </DialogDescription>
              <p className="reference-summary">
                {procedureId === 'aitc.street'
                  ? '거리 묘사·종류·내용을 함께 굴립니다. City·Metropolis의 내용은 d2회이며, 출구는 선택할 수 있습니다.'
                  : selected.summary}
              </p>
              {selected.action?.kind === 'region' &&
                index.byId[
                  `rule:regional-monsters:${selected.action.region}`
                ] && (
                  <ReferenceRow
                    entry={
                      index.byId[
                        `rule:regional-monsters:${selected.action.region}`
                      ]
                    }
                  />
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
                        onClick={() => activate(entry.id, isOneClick(entry))}
                      >
                        {entry.title} ↗
                      </button>
                    ))}
                </div>
              )}
              {selected.kind === 'oracle' && !selected.action && (
                <div className="reference-static-table">
                  {selected.canonicalIds
                    .flatMap((key) =>
                      oracles.registry.tables.filter(
                        (table) => table.id === key,
                      ),
                    )
                    .map((table) => (
                      <section key={table.id}>
                        <p>{table.sourceNote}</p>
                        <table>
                          <caption>
                            {table.title} · {table.originalDice ?? table.dice}
                          </caption>
                          <tbody>
                            {table.entries.map((entry) => (
                              <tr key={entry.id}>
                                <th scope="row">{oraclePrintedRange(entry)}</th>
                                <td>{entry.text}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </section>
                    ))}
                </div>
              )}
              {!selected.available && (
                <output>
                  이 참조에 필요한 원문 자료가 준비되지 않았습니다.
                </output>
              )}
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
                      onChange={(e) => setCityLarge(e.target.value === 'large')}
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
              {city && (
                <CityRoller
                  registry={oracles.registry}
                  onReading={(value) => acceptReading(selected.id, value)}
                />
              )}
              {roller && (
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
              {reading && (
                <article className="reference-reading">
                  {reading.title !== selected.title &&
                    !reading.blocks.some(
                      (block) => block.title === reading.title,
                    ) && <h3 className="reading-identity">{reading.title}</h3>}
                  {reading.blocks.map((block, n) => (
                    <section key={n}>
                      <small>{block.dice}</small>
                      <h3>{block.title}</h3>
                      <p>{block.text}</p>
                    </section>
                  ))}
                  <div className="ref-copy-actions">
                    {[false, true].map((withSource) => (
                      <Button
                        key={String(withSource)}
                        variant="ghost"
                        onClick={async () => {
                          const text = copyReferenceReading(
                            reading,
                            withSource,
                          );
                          try {
                            await navigator.clipboard.writeText(text);
                            setCopied(
                              withSource
                                ? '출처와 함께 복사했습니다.'
                                : '결과를 복사했습니다.',
                            );
                          } catch {
                            setCopyFallback(text);
                          }
                        }}
                      >
                        <Copy size={14} />
                        {withSource ? 'COPY WITH SOURCE' : 'COPY'}
                      </Button>
                    ))}
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
                label="SOURCE · 출처 경로"
                refs={reading?.sourceRefs ?? selected.sourceRefs}
              >
                {selected.sourceChain.map((step, n) => (
                  <p key={n}>
                    {step.label}
                    {step.via ? ` → ${step.via}` : ''}
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
                <div className="ref-related">
                  <small>RELATED</small>
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
                        onClick={() => activate(entry.id, isOneClick(entry))}
                      >
                        {entry.title}
                        <ArrowUpRight size={12} />
                      </button>
                    ))}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </ReferenceContext.Provider>
  );
}

export function ReferenceRow({ entry }: { entry: ReferenceEntry }) {
  const desk = useReferenceDesk();
  const quick = isOneClick(entry);
  return (
    <div className="reference-row">
      <button onClick={() => desk?.activate(entry.id, quick)}>
        <span>
          <strong>{entry.title}</strong>
          <small>
            {entry.kind.toUpperCase()}
            {entry.sourceRefs[0]?.bookTitle
              ? ` · ${entry.sourceRefs[0].bookTitle}`
              : ''}
          </small>
        </span>
        <b>{quick ? 'ROLL' : 'OPEN'} ↗</b>
      </button>
      <button
        className="ref-pin"
        aria-label={`${entry.title} ${desk?.pinnedIds.includes(entry.id) ? '고정 해제' : '고정'}`}
        aria-pressed={desk?.pinnedIds.includes(entry.id) ?? false}
        onClick={() => desk?.togglePin(entry.id)}
      >
        <Pin size={15} />
      </button>
    </div>
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
}: {
  context: ContextKind;
  region?: RegionId;
}) {
  const desk = useReferenceDesk();
  const entries = desk?.contextual(context, region) ?? [];
  if (!entries.length) return null;
  return (
    <div className="context-references">
      <small>QUICK TOOLS</small>
      {entries.map((entry) => (
        <button
          key={entry.id}
          onClick={() => desk?.activate(entry.id, isOneClick(entry))}
        >
          {entry.title}
        </button>
      ))}
    </div>
  );
}
export function ReferenceDesk({ onLibrary }: { onLibrary?: () => void }) {
  const desk = useReferenceDesk(),
    source = useOracleRegistry();
  const [query, setQuery] = useState('');
  const quickIds = [
    'oracle:core.reaction',
    'procedure:reclvse.action-theme',
    'procedure:workbench.stock-room',
    'procedure:workbench.npc',
    'procedure:workbench.city',
    'rule:core.reaction-morale',
  ];
  const quick = quickIds
    .map((key) => desk?.byId[key])
    .filter((entry): entry is ReferenceEntry => !!entry);
  return (
    <section className="reference-desk">
      <header className="desk-heading">
        <span className="eyebrow">MÖRK BORG / PLAY REFERENCE</span>
        <h1>
          책은 덮고.
          <br />
          <em>주사위를 굴려.</em>
        </h1>
        <p>Oracle, 생물, 규칙, 다음 표까지. 기록은 당신의 종이에.</p>
        <span className="desk-sigil" aria-hidden="true">
          ✳
        </span>
      </header>
      <form
        className="desk-search"
        onSubmit={(event) => {
          event.preventDefault();
          desk?.openSearch(query);
        }}
      >
        <Search size={23} />
        <Input
          aria-label="작업대 검색"
          placeholder="reaction / Sarkash monster / corpse"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Button type="submit">찾기</Button>
      </form>
      {source.loading && <output>룰북 자료를 불러오는 중…</output>}
      {source.error && (
        <div role="alert">
          <p>{source.error}</p>
          <PrivateDataTools />
        </div>
      )}
      <div className="desk-columns">
        <section>
          <h2>지금 필요한 것.</h2>
          <div className="desk-quick-grid">
            {quick.map((entry) => (
              <ReferenceRow key={entry.id} entry={entry} />
            ))}
          </div>
          <div className="desk-regions">
            <span className="eyebrow">WHERE ARE YOU?</span>
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
        </section>
        <aside>
          <h2>곁에 두는 표.</h2>
          {desk?.pinnedIds.length ? (
            desk.pinnedIds
              .map((key) => desk.byId[key])
              .filter(Boolean)
              .slice(0, 6)
              .map((entry) => <ReferenceRow key={entry.id} entry={entry} />)
          ) : (
            <p>표 옆의 핀을 눌러 여기에 두세요.</p>
          )}
          <button
            className="ref-text-action"
            onClick={() => desk?.openSearch('', 'pinned')}
          >
            PINNED {desk?.pinnedIds.length} ›
          </button>
          <h3>RECENT</h3>
          {desk?.recentIds
            .map((key) => desk.byId[key])
            .filter(Boolean)
            .slice(0, 5)
            .map((entry) => (
              <button
                className="recent-reference"
                key={entry.id}
                onClick={() => desk.activate(entry.id, isOneClick(entry))}
              >
                {entry.title}
                {isOneClick(entry) ? (
                  <Dices size={14} />
                ) : (
                  <ArrowUpRight size={14} />
                )}
              </button>
            ))}
        </aside>
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
