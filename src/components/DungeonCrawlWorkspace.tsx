import { DungeonActionMoves } from './DungeonActionMoves';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { Campaign, Dungeon } from '../domain/types';
import {
  prepareDungeonCrawl,
  dungeonRoomFollowUps,
  advanceDungeonCrawl,
  resolveDungeonTransitionDanger,
  completeDungeonRoom,
} from '../domain/dungeonCrawl';
import { DUNGEON_REFERENCE_TOPICS } from '../domain/referenceTopics';
import {
  prepareDungeonEncounters,
  setDungeonEncounterDR,
} from '../domain/dungeonEncounters';
import { useOracleRegistry } from '../storage/oracleStore';
import { useRules } from '../storage/rulesStore';
import { editCampaign, changeWorkspace } from '../storage/saveStore';
import { now } from '../generators/random';
import {
  InlineReferenceTools,
  ReferenceReadingBlock,
} from './InlineReferenceTools';
import { SourceDisclosure } from './SourceDisclosure';
import {
  DungeonEncounterRoller,
  dungeonEncounterCount,
} from './DungeonEncounterTables';
import './dungeon-crawl.css';
const crawlSources = [
  {
    bookId: 'sd',
    bookTitle: 'Sölitary Defilement',
    printedPage: 7,
    pdfPage: 9,
    tableTitle: 'Dungeon-Crawling',
  },
];
const specialOutcome = {
  strong: '강한 성공',
  weak: '약한 성공',
  miss: '실패',
} as const;

function splitRoomLines(text: string) {
  return text
    .split('\n\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^단서\s*\d+\s*:\s*/, ''));
}

function formatSourceLines(value: string) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export function DungeonCrawlWorkspace({
  campaign: c,
  dungeon: d,
  notify,
}: {
  campaign: Campaign;
  dungeon: Dungeon;
  notify: (message: string) => void;
}) {
  const { registry } = useOracleRegistry(),
    { pack } = useRules();
  const [viewRoomId, setViewRoomId] = useState<string | null>(null);
  const state = d.crawl;
  const room = d.rooms.find(
    (item) => item.id === (viewRoomId ?? state?.currentRoomId),
  );
  function update(action: (dungeon: Dungeon, campaign: Campaign) => void) {
    try {
      editCampaign(c.id, (next) => {
        const target = next.dungeons.find((item) => item.id === d.id)!;
        action(target, next);
        target.updatedAt = now();
      });
    } catch (error) {
      notify(
        error instanceof Error ? error.message : '크롤 절차를 확인하세요.',
      );
    }
  }
  function next() {
    setViewRoomId(null);
    update((target) => advanceDungeonCrawl(target, registry));
  }
  const roll = state?.lastRoll;
  const followUps = room ? dungeonRoomFollowUps(room, registry) : { ids: [] };
  function prepareEncounters() {
    update((_target, campaign) => {
      prepareDungeonEncounters(campaign, d.id, 'common', registry);
      prepareDungeonEncounters(campaign, d.id, 'rare', registry);
    });
  }

  return (
    <section className="dungeon-crawl" aria-label="던전 크롤 작업 공간">
      <header className="crawl-overview">
        <div>
          <span className="eyebrow">입구 → 방 → 절정</span>
          <h2>한 방씩, 아래로.</h2>
        </div>
        <strong>SPECIAL {state?.discoveredSpecialIds.length ?? 0} / 4</strong>
      </header>
      <details className="crawl-preparation">
        <summary>
          특별한 방 4개 · 준비 목록 <small>발견과 별개</small>
        </summary>
        <p>
          강한 성공마다 다음 특별한 방을 발견합니다. 네 번째 방이 절정입니다.
        </p>
        <ol>
          {(state
            ? state.specialRoomIds.map((key) => d.rooms.find((item) => item.id === key)!)
            : d.rooms.filter((item) => item.kind === 'special')
          )
            .filter(Boolean)
            .map((item, index) => (
              <li key={item.id}>
                <span>
                  {String(index + 1).padStart(2, '0')} ·{' '}
                  {state?.discoveredSpecialIds.includes(item.id)
                    ? '발견'
                    : '준비'}
                </span>
                <details>
                  <summary>{item.name}</summary>
                  <div className="crawl-special-grid">
                    <div className="crawl-special-block">
                      <h4>묘사 단서 묶음</h4>
                      {splitRoomLines(item.description).map((line, idx) => (
                        <p key={`${item.id}-line-${idx}`}>
                          <strong>단서 {idx + 1}.</strong> {line}
                        </p>
                      ))}
                    </div>
                    {item.feature && (
                      <div className="crawl-special-block">
                        <h4>
                          {item.kind === 'special'
                            ? '앱 해석 · 던전 연결'
                            : '특성'}
                        </h4>
                        {formatSourceLines(item.feature).map(
                          (line, idx) =>
                            line && <p key={`${item.id}-feature-${idx}`}>{line}</p>,
                        )}
                      </div>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      changeWorkspace(c.id, {
                        dungeonTab: 'rooms',
                        roomId: item.id,
                      })
                    }
                  >
                    방 편집
                  </Button>
                </details>
              </li>
            ))}
        </ol>
      </details>
      <div className="crawl-settings">
        <label>
          던전 DR · 길이
          <select
            aria-label="크롤 던전 DR"
            value={d.encounterTables?.dungeonDR ?? 12}
            onChange={(event) =>
              update((_target, campaign) =>
                setDungeonEncounterDR(
                  campaign,
                  d.id,
                  Number(event.target.value),
                ),
              )
            }
          >
            {Array.from({ length: 9 }, (_, index) => index + 6).map((dr) => (
              <option key={dr} value={dr}>
                {dr}
                {dr === 6
                  ? ' · 짧게'
                  : dr === 12
                    ? ' · 중간'
                    : dr === 14
                      ? ' · 길게'
                      : ''}
              </option>
            ))}
          </select>
        </label>
        <label>
          Threat Rating · 위험도
          <select
            aria-label="던전 Threat Rating"
            value={state?.threatRating ?? 12}
            disabled={!state}
            onChange={(event) =>
              update((target) => {
                target.crawl!.threatRating = Number(event.target.value) as
                  | 9
                  | 12
                  | 15;
              })
            }
          >
            {[9, 12, 15].map((tr) => (
              <option key={tr} value={tr}>
                {tr}
              </option>
            ))}
          </select>
        </label>
      </div>
      {!state ? (
        <div className="crawl-step">
          <h3>입구에서 시작</h3>
          <p>특별한 방 네 개를 준비한 뒤, 발견 수 0에서 크롤을 시작합니다.</p>
          {d.rooms.some((item) => item.kind !== 'special') && (
            <p>기존 방은 보관하고, 별도의 특별한 방 네 개를 준비합니다.</p>
          )}
          <Button
            disabled={!pack}
            onClick={() =>
              update((target, campaign) => {
                if (!target.encounterTables)
                  setDungeonEncounterDR(campaign, d.id, 12);
                prepareDungeonCrawl(target);
              })
            }
          >
            크롤 준비
          </Button>
        </div>
      ) : (
        <>
          <nav className="crawl-path" aria-label="방 진행 경로">
            <button
              onClick={() => setViewRoomId('entrance')}
              aria-current={viewRoomId === 'entrance' ? 'step' : undefined}
            >
              입구
            </button>
            {state.visitedRoomIds.map((key, index) => {
              const visited = d.rooms.find((item) => item.id === key);
              return (
                <button
                  key={key}
                  onClick={() => setViewRoomId(key)}
                  aria-current={
                    (viewRoomId ?? state.currentRoomId) === key
                      ? 'step'
                      : undefined
                  }
                >
                  방 {index + 1}
                  {visited?.kind === 'special' ? ' · 특수' : ''}
                </button>
              );
            })}
          </nav>
          {(state.phase === 'entrance' || viewRoomId === 'entrance') && (
            <article className="crawl-room">
              <span className="eyebrow">입구</span>
              <h3>{d.entrance || '던전 입구'}</h3>
              <p>{d.entranceCondition}</p>
              <SourceDisclosure
                source={[d.sources?.entrance, d.sources?.entranceCondition]
                  .filter(Boolean)
                  .join(' + ')}
              />
            </article>
          )}
          {roll && (
            <output className={`crawl-outcome ${roll.outcome}`}>
              <strong>
                {roll.outcome === 'strong'
                  ? specialOutcome.strong
                  : roll.outcome === 'weak'
                    ? specialOutcome.weak
                    : specialOutcome.miss}
              </strong>
              <span>
                2d20 [{roll.dice.join(', ')}] + {roll.bonus} / DR {roll.dr}
              </span>
              {roll.exhausted && (
                <small>특별한 방을 모두 발견하여 강한 성공 → 약한 성공 전환</small>
              )}
              <SourceDisclosure refs={crawlSources} />
            </output>
          )}
          {state.phase === 'danger' && (
            <article className="crawl-step crawl-danger">
              <h3>아직 다음 방에 도착하지 못했습니다.</h3>
              <p>
                현재 장소를 떠나다 적·함정·재앙에 부딪혔습니다. 위험을 해결한
                다음 일반 방으로 들어갑니다.
              </p>
              <InlineReferenceTools
                title="이동 위험 해결 도구"
                ids={[
                  'oracle:depths.danger',
                  'rule:depths.traps',
                  'oracle:core.reaction',
                ]}
                region={d.region}
                initiallyOpen
              />
              <Button
                onClick={() => {
                  setViewRoomId(null);
                  update((target) =>
                    resolveDungeonTransitionDanger(target, registry),
                  );
                }}
              >
                위험 해결 완료 → 일반 방
              </Button>
              <small>던전 크롤을 다시 굴리지 않습니다.</small>
            </article>
          )}
          {room && viewRoomId !== 'entrance' && (
            <article className="crawl-room" key={room.id}>
              <span className="eyebrow">
                {room.kind === 'special' ? '특수방' : '방'} ·{' '}
                {state.visitedRoomIds.indexOf(room.id) + 1}
              </span>
              <ReferenceReadingBlock
                reading={{
                  title: room.name,
                  blocks: [
                    { title: '묘사', text: room.description },
                    ...['feature', 'danger', 'treasure', 'encounter'].flatMap(
                      (key) => {
                        const value = room[key as keyof typeof room];
                        return typeof value === 'string' && value
                          ? [
                              {
                                title: (
                                  {
                                    feature:
                                      room.kind === 'special'
                                        ? '던전과의 연결 · 앱 해석'
                                        : '출구 / 특징',
                                    danger: '위험',
                                    treasure: '보물',
                                    encounter: '조우',
                                  } as Record<string, string>
                                )[key],
                                text: value,
                              },
                            ]
                          : [];
                      },
                    ),
                  ],
                  sourceRefs: Object.entries(room.sources ?? {}).map(
                    ([key, source]) => ({ tableTitle: key, note: source }),
                  ),
                }}
              />
              {followUps.encounterKind && (
                <div className="crawl-room-followup">
                  <strong>
                    이 방의{' '}
                    {followUps.encounterKind === 'common' ? 'Common' : 'Rare'}
                    조우
                  </strong>
                  {dungeonEncounterCount(d) < 12 && (
                    <Button
                      size="sm"
                      disabled={!pack}
                      onClick={prepareEncounters}
                    >
                      고정 조우표 빈 칸 준비
                    </Button>
                  )}
                  <DungeonEncounterRoller
                    campaign={c}
                    dungeon={d}
                    roomId={room.id}
                  />
                </div>
              )}
              {followUps.ids.length > 0 && (
                <InlineReferenceTools
                  title="이 방의 후속 표"
                  ids={followUps.ids}
                  region={d.region}
                  initiallyOpen
                />
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  changeWorkspace(c.id, {
                    dungeonTab: 'rooms',
                    roomId: room.id,
                  })
                }
              >
                배치 · 방 편집
              </Button>
            </article>
          )}
          <div className="crawl-next">
            {state.phase === 'room' && (
              <>
                <p>현재 방의 결과와 필요한 조치를 모두 해결하세요.</p>
                <Button
                  onClick={() =>
                    update((target) => completeDungeonRoom(target))
                  }
                >
                  현재 방 해결 완료
                </Button>
              </>
            )}
            {state.phase === 'ready' && (
              <>
                <h3>다음 방으로 진행하시겠습니까?</h3>
                <Button onClick={next}>다음 방 · 던전 크롤 2d20</Button>
              </>
            )}
            {state.phase === 'entrance' && (
              <Button onClick={next}>첫 방으로 · 던전 크롤 2d20</Button>
            )}
          </div>
        </>
      )}
      <div className="crawl-tools">
        <h3>이 던전에서 필요한 것</h3>
        <details className="inline-tools">
          <summary>고정 조우 · Common 6 / Rare 6</summary>
          {dungeonEncounterCount(d) < 12 && (
            <Button
              size="sm"
              variant="outline"
              disabled={!pack}
              onClick={() =>
                update((_target, campaign) => {
                  prepareDungeonEncounters(campaign, d.id, 'common', registry);
                  prepareDungeonEncounters(campaign, d.id, 'rare', registry);
                })
              }
            >
              빈 칸 준비 · 던전당 한 번
            </Button>
          )}
          <DungeonEncounterRoller
            key={state?.currentRoomId ?? d.id}
            campaign={c}
            dungeon={d}
            roomId={state?.currentRoomId ?? undefined}
          />
        </details>
        <DungeonActionMoves
          registry={registry}
          region={d.region}
          threatRating={state?.threatRating ?? 12}
        />
        {DUNGEON_REFERENCE_TOPICS.map((topic) => (
          <InlineReferenceTools
            key={topic.title}
            {...topic}
            region={d.region}
          />
        ))}
      </div>
    </section>
  );
}
