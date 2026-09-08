import { DungeonActionMoves } from './DungeonActionMoves';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { Campaign, Dungeon, DungeonRoom } from '../domain/types';
import { roomFields } from '../domain/types';
import { editedProvenance } from '../domain/generationProvenance';
import { RoomPacket } from './RoomPacket';
import { Field } from './Field';
import { GenerationDisclosure } from './GenerationDisclosure';
import { ReferenceReadingText } from './ReferenceReadingText';
import type { Confirm } from './Library';
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
import { InlineReferenceTools } from './InlineReferenceTools';
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

const entranceTopic = DUNGEON_REFERENCE_TOPICS[0];

/** Saved legacy/additional fields remain readable and editable without regenerating them. */
function CrawlRoomPacket({
  dungeon,
  room,
  index,
  ready,
  confirm,
  update,
}: {
  dungeon: Dungeon;
  room: DungeonRoom;
  index: number;
  ready: boolean;
  confirm: Confirm;
  update: (action: (room: DungeonRoom) => void) => void;
}) {
  const fields = roomFields.filter(({ key }) => {
    if (key === 'name' || (key === 'description' && room.components?.length))
      return false;
    if (
      key === 'feature' &&
      room.components?.some((component) => component.key === 'exits')
    )
      return false;
    const value = room[key as keyof DungeonRoom];
    return typeof value === 'string' && value !== '';
  });
  return (
    <div className="crawl-room-packet">
      <RoomPacket
        dungeon={dungeon}
        room={room}
        index={index}
        ready={ready}
        confirm={confirm}
        update={update}
      />
      {fields.length > 0 && (
        <details className="crawl-saved-fields">
          <summary>
            {room.components?.length ? '추가 기록' : '보존된 방 기록 · 편집'}
          </summary>
          {fields.map((field) => (
            <Field
              key={field.key}
              spec={field}
              value={room[field.key as keyof DungeonRoom] as string}
              showTools={false}
              hideSource
              onChange={(value) =>
                update((target) => {
                  Object.assign(target, { [field.key]: String(value) });
                  target.fieldProvenance = {
                    ...target.fieldProvenance,
                    [field.key]: editedProvenance(
                      target.fieldProvenance?.[field.key],
                    ),
                  };
                })
              }
            />
          ))}
          <GenerationDisclosure
            values={Object.fromEntries(
              fields.flatMap(({ key }) =>
                room.fieldProvenance?.[key]
                  ? [[key, room.fieldProvenance[key]]]
                  : [],
              ),
            )}
          />
          <SourceDisclosure
            label="이전 출처 기록"
            source={fields
              .filter(({ key }) => !room.fieldProvenance?.[key])
              .map(({ key }) => room.sources?.[key])
              .filter(Boolean)
              .join(' + ')}
          />
        </details>
      )}
    </div>
  );
}

export function DungeonCrawlWorkspace({
  campaign: c,
  dungeon: d,
  notify,
  confirm,
}: {
  campaign: Campaign;
  dungeon: Dungeon;
  notify: (message: string) => void;
  confirm: Confirm;
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
  function updateRoom(roomId: string, action: (room: DungeonRoom) => void) {
    update((target) => {
      const savedRoom = target.rooms.find((item) => item.id === roomId);
      if (!savedRoom) throw new Error('저장된 방을 찾을 수 없습니다.');
      action(savedRoom);
    });
  }
  const showEntrance =
    !state || state.phase === 'entrance' || viewRoomId === 'entrance';
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
            ? state.specialRoomIds.map((key) =>
                d.rooms.find((item) => item.id === key)!,
              )
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
                <CrawlRoomPacket
                  dungeon={d}
                  room={item}
                  index={index}
                  ready={!!pack}
                  confirm={confirm}
                  update={(action) => updateRoom(item.id, action)}
                />
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
      {showEntrance && (
        <section className="crawl-entrance" aria-label="입구 묘사 준비">
          <span className="eyebrow">입구 묘사 준비</span>
          <InlineReferenceTools
            title="입구 · 건물 · 재질 · 소리"
            ids={entranceTopic.ids}
            region={d.region}
            description="규모·형태·재질·소리·냄새 중 필요한 부분만 굴려 해석하세요. 모든 표를 굴릴 필요는 없습니다."
            initiallyOpen
          />
          {(d.entrance || d.entranceCondition) && (
            <details className="crawl-saved-entrance">
              <summary>개요에 저장된 입구</summary>
              {[d.entrance, d.entranceCondition]
                .filter(Boolean)
                .map((text, index) => (
                  <ReferenceReadingText key={index} text={text} />
                ))}
              <GenerationDisclosure
                values={Object.fromEntries(
                  ['entrance', 'entranceCondition'].flatMap((key) =>
                    d.fieldProvenance?.[key]
                      ? [[key, d.fieldProvenance[key]]]
                      : [],
                  ),
                )}
              />
              <SourceDisclosure
                source={['entrance', 'entranceCondition']
                  .filter((key) => !d.fieldProvenance?.[key])
                  .map((key) => d.sources?.[key])
                  .filter(Boolean)
                  .join(' + ')}
              />
            </details>
          )}
        </section>
      )}
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
                <small>
                  특별한 방을 모두 발견하여 강한 성공 → 약한 성공 전환
                </small>
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
            <article className="crawl-current-room" key={room.id}>
              <CrawlRoomPacket
                dungeon={d}
                room={room}
                index={Math.max(0, state.visitedRoomIds.indexOf(room.id))}
                ready={!!pack}
                confirm={confirm}
                update={(action) => updateRoom(room.id, action)}
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
                배치 관리
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
        {DUNGEON_REFERENCE_TOPICS.filter(
          (topic) => !showEntrance || topic !== entranceTopic,
        ).map((topic) => (
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
