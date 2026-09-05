import { useState } from 'react';
import { Dices, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { Campaign } from '../domain/types';
import type { OracleResult } from '../domain/oracle';
import type { PlacementPlayState } from '../domain/chronicle';
import {
  createSession,
  startSession,
  endSession,
  startSessionEncounter,
  updateSessionEncounter,
  recordEvent,
  saveOracleEvent,
  linkToSession,
  createJournalNote,
} from '../domain/chronicleOperations';
import { changeWorkspace, editCampaign } from '../storage/saveStore';
import { rollDie } from '../generators/random';
import { useOracleRegistry } from '../storage/oracleStore';
import { oracleLibraryTables } from '../data/oracles/library';
import {
  pairedOracleProcedure,
  rollProcedure,
} from '../generators/oracleRoller';
import { SourceDisclosure } from './SourceDisclosure';
import { CampaignProcedures } from './CampaignProcedures';
import { DungeonState, RoomState, PlacementState } from './ObjectPlayTools';
import { EventLedger } from './Chronicle';
import { stateLabels } from './ChronicleFields';
import { openObject } from './ChronicleLinks';
import { captureContext, type CaptureKind } from '../domain/captureContext';

function QuickDice({ campaign: c }: { campaign: Campaign }) {
  const [sides, setSides] = useState(20),
    [count, setCount] = useState(1),
    [modifier, setModifier] = useState(0),
    [result, setResult] = useState<{
      values: number[];
      total: number;
      formula: string;
    } | null>(null),
    [saved, setSaved] = useState(false);
  return (
    <section className="quick-dice">
      <h2>주사위</h2>
      <div className="dice-inputs">
        <Input
          type="number"
          aria-label="주사위 개수"
          min={1}
          max={20}
          value={count}
          onChange={(e) =>
            setCount(
              Math.max(
                1,
                Math.min(20, Math.trunc(Number(e.target.value) || 1)),
              ),
            )
          }
        />
        <select
          aria-label="주사위 면"
          value={sides}
          onChange={(e) => setSides(Number(e.target.value))}
        >
          {[2, 4, 6, 8, 10, 12, 20, 100].map((d) => (
            <option key={d} value={d}>
              d{d}
            </option>
          ))}
        </select>
        <Input
          aria-label="주사위 보정"
          type="number"
          min={-99}
          max={99}
          value={modifier}
          onChange={(e) =>
            setModifier(
              Math.max(
                -99,
                Math.min(99, Math.trunc(Number(e.target.value) || 0)),
              ),
            )
          }
        />
        <Button
          className="btn primary"
          aria-label="빠른 주사위 굴리기"
          onClick={() => {
            const values = Array.from({ length: count }, () => rollDie(sides));
            setResult({
              values,
              total: values.reduce((a, b) => a + b, 0) + modifier,
              formula: `${count}d${sides}${modifier ? `${modifier > 0 ? '+' : ''}${modifier}` : ''}`,
            });
            setSaved(false);
          }}
        >
          <Dices size={16} />
        </Button>
      </div>
      {result && (
        <div className="dice-reading">
          <output aria-live="polite">
            <b>{result.total}</b>
            <small>
              {result.formula} · {result.values.join(', ')}
            </small>
          </output>
          <Button
            className="btn ghost small"
            disabled={saved}
            onClick={() => {
              editCampaign(c.id, (next) =>
                recordEvent(next, {
                  type: 'custom',
                  title: `${result.formula} = ${result.total}`,
                  description: `Dice: ${result.values.join(', ')}`,
                  links: captureContext(next),
                }),
              );
              setSaved(true);
            }}
          >
            {saved ? '기록됨' : '사건으로 기록'}
          </Button>
        </div>
      )}
    </section>
  );
}

function QuickOracle({
  campaign: c,
  onLibrary,
}: {
  campaign: Campaign;
  onLibrary: () => void;
}) {
  const { registry } = useOracleRegistry();
  const tables = oracleLibraryTables(registry).filter(
    (t) => t.rollable !== false && t.sourceVerified && t.id !== 'core.miseries',
  );
  const [query, setQuery] = useState(''),
    [selected, setSelected] = useState('core.reaction'),
    [result, setResult] = useState<OracleResult | null>(null),
    [error, setError] = useState(''),
    [saved, setSaved] = useState(false);
  const filtered = tables.filter((t) =>
    `${t.title} ${t.id}`.toLowerCase().includes(query.toLowerCase()),
  );
  const table = tables.find((t) => t.id === selected) ?? filtered[0];
  const options = [
    ...(table ? [table] : []),
    ...filtered.filter((t) => t.id !== table?.id),
  ].slice(0, 40);
  return (
    <section className="quick-oracle">
      <div className="section-title">
        <h2>Oracle</h2>
        <button onClick={onLibrary}>보관함 ↗</button>
      </div>
      <Input
        aria-label="빠른 Oracle 검색"
        placeholder="표 검색…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setSelected('');
        }}
      />
      <select
        aria-label="빠른 Oracle 표"
        value={table?.id ?? ''}
        onChange={(e) => {
          setSelected(e.target.value);
          setResult(null);
        }}
      >
        {options.map((t) => (
          <option key={t.id} value={t.id}>
            {t.title}
          </option>
        ))}
      </select>
      <Button
        className="btn"
        disabled={!table}
        onClick={() => {
          try {
            setResult(
              rollProcedure(pairedOracleProcedure(table!, registry), registry),
            );
            setError('');
            setSaved(false);
          } catch (e) {
            setError(e instanceof Error ? e.message : '표를 확인하세요.');
          }
        }}
      >
        <Dices size={16} />
        Oracle 굴리기
      </Button>
      {error && <p role="alert">{error}</p>}
      {result && (
        <div className="quick-oracle-reading">
          <div aria-live="polite">
            {result.rolls.map((r, i) => (
              <p key={i}>
                {r.text}
                <small>
                  {r.dice}: {r.roll}
                </small>
              </p>
            ))}
          </div>
          <Button
            className="btn primary small"
            disabled={saved}
            onClick={() => {
              editCampaign(c.id, (next) => {
                const event = saveOracleEvent(next, result);
                const links = captureContext(next);
                event.links.push(...links);
                if (event.sessionId)
                  for (const link of links)
                    linkToSession(next, event.sessionId, link);
              });
              setSaved(true);
            }}
          >
            {saved ? '세션에 기록됨' : '세션 사건으로 저장'}
          </Button>
          <SourceDisclosure
            source={result.rolls.map((r) => r.source).join(' · ')}
          />
        </div>
      )}
    </section>
  );
}

export function PlayMode({
  campaign: c,
  onCapture,
  onOracles,
  notify,
}: {
  campaign: Campaign;
  onCapture: (kind?: CaptureKind) => void;
  onOracles: () => void;
  notify: (text: string) => void;
}) {
  const session = c.sessions.find((s) => s.id === c.currentSessionId);
  const [note, setNote] = useState(''),
    [error, setError] = useState('');
  const dungeon = c.dungeons.find((d) => d.id === c.workspace.playDungeonId);
  const room = dungeon?.rooms.find((r) => r.id === c.workspace.playRoomId);
  function run(action: () => void) {
    try {
      action();
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : '작업을 완료하지 못했습니다.');
    }
  }
  if (!session)
    return (
      <section className="chronicle-page play-empty">
        <span className="eyebrow">AT THE TABLE</span>
        <h1>
          이번 밤의 기록<span className="acid">.</span>
        </h1>
        <p>
          세션을 시작하면 일행, 장소, 만남을 한 화면에서 기록할 수 있습니다.
        </p>
        <div className="actions">
          <Button
            className="btn primary"
            onClick={() =>
              run(() =>
                editCampaign(c.id, (next) => {
                  const s = createSession(next);
                  startSession(next, s.id);
                  next.workspace.sessionId = s.id;
                }),
              )
            }
          >
            새 세션 시작
          </Button>
          <Button
            className="btn"
            onClick={() =>
              changeWorkspace(c.id, { section: 'sessions', sessionId: null })
            }
          >
            기존 세션 선택
          </Button>
        </div>
        {error && <p role="alert">{error}</p>}
      </section>
    );
  const placed = c.monsterPlacements.filter(
    (p) =>
      p.dungeonId === dungeon?.id &&
      (!room || p.roomId === room.id || !p.roomId),
  );
  return (
    <section className="chronicle-page play-page">
      <header className="play-toolbar">
        <div>
          <span className="eyebrow">
            PLAY / SESSION {String(session.number ?? '—').padStart(2, '0')} /
            DAY {c.campaignDay}
          </span>
          <h1>{session.title}</h1>
        </div>
        <div className="actions">
          <Button
            className="btn ghost small"
            onClick={() =>
              changeWorkspace(c.id, {
                section: 'sessions',
                sessionId: session.id,
              })
            }
          >
            세션 편집
          </Button>
          <Button
            className="btn"
            onClick={() =>
              editCampaign(c.id, (next) => {
                endSession(next, session.id);
                next.workspace.section = 'sessions';
                next.workspace.sessionId = session.id;
              })
            }
          >
            세션 종료 · 요약
          </Button>
        </div>
      </header>
      {error && <p role="alert">{error}</p>}
      <div className="play-layout">
        <div className="play-main">
          <section className="play-party">
            <div className="section-title">
              <h2>일행</h2>
              <button
                onClick={() =>
                  changeWorkspace(c.id, {
                    section: 'sessions',
                    sessionId: session.id,
                  })
                }
              >
                참가자 선택 →
              </button>
            </div>
            {session.characterIds
              .map((id) => c.characters.find((ch) => ch.id === id))
              .filter((ch) => !!ch)
              .map((ch) => (
                <div className="play-character" key={ch.id}>
                  <button
                    onClick={() =>
                      openObject(c, { kind: 'character', id: ch.id })
                    }
                  >
                    <strong>{ch.name}</strong>
                    <small>
                      {ch.status === 'dead' ? '† 사망' : ch.className}
                    </small>
                  </button>
                  <label>
                    HP
                    <Input
                      type="number"
                      aria-label={`${ch.name} 현재 HP`}
                      min={-999}
                      max={9999}
                      value={ch.hp}
                      onChange={(e) =>
                        editCampaign(c.id, (next) => {
                          next.characters.find((v) => v.id === ch.id)!.hp =
                            Math.max(
                              -999,
                              Math.min(
                                9999,
                                Math.trunc(Number(e.target.value) || 0),
                              ),
                            );
                        })
                      }
                    />
                    <span>/ {ch.maxHp}</span>
                  </label>
                  <label>
                    Omens
                    <Input
                      type="number"
                      aria-label={`${ch.name} Omens`}
                      min={0}
                      max={999}
                      value={ch.omens}
                      onChange={(e) =>
                        editCampaign(c.id, (next) => {
                          next.characters.find((v) => v.id === ch.id)!.omens =
                            Math.max(
                              0,
                              Math.min(
                                999,
                                Math.trunc(Number(e.target.value) || 0),
                              ),
                            );
                        })
                      }
                    />
                  </label>
                </div>
              ))}
            {!session.characterIds.length && (
              <p className="empty-copy">세션에서 참가 캐릭터를 선택하세요.</p>
            )}
          </section>
          <section className="play-location">
            <div className="section-title">
              <h2>현재 장소</h2>
              {dungeon && (
                <button
                  onClick={() =>
                    openObject(
                      c,
                      room
                        ? { kind: 'room', id: room.id, dungeonId: dungeon.id }
                        : { kind: 'dungeon', id: dungeon.id },
                    )
                  }
                >
                  전체 기록 ↗
                </button>
              )}
            </div>
            <div className="record-grid">
              <label>
                던전
                <select
                  value={dungeon?.id ?? ''}
                  onChange={(e) =>
                    changeWorkspace(c.id, {
                      playDungeonId: e.target.value || null,
                      playRoomId: null,
                    })
                  }
                >
                  <option value="">장소 선택</option>
                  {c.dungeons.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                방
                <select
                  value={room?.id ?? ''}
                  disabled={!dungeon}
                  onChange={(e) =>
                    changeWorkspace(c.id, {
                      playRoomId: e.target.value || null,
                    })
                  }
                >
                  <option value="">던전 전체</option>
                  {dungeon?.rooms.map((r, i) => (
                    <option key={r.id} value={r.id}>
                      {String(i + 1).padStart(2, '0')} · {r.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {dungeon && (
              <>
                <div className="play-location-heading">
                  <span className="session-number">
                    {room
                      ? String(dungeon.rooms.indexOf(room) + 1).padStart(2, '0')
                      : '↓'}
                  </span>
                  <div>
                    <h2>{room?.name ?? dungeon.title}</h2>
                    {room ? (
                      <RoomState
                        campaign={c}
                        dungeonId={dungeon.id}
                        room={room}
                      />
                    ) : (
                      <DungeonState campaign={c} dungeon={dungeon} />
                    )}
                  </div>
                </div>
                <p className="chronicle-prose">
                  {room?.description ?? dungeon.premise}
                </p>
                {room && (
                  <details className="play-secrets">
                    <summary>GM 단서 · 위험 · 보물</summary>
                    {room.feature && (
                      <p>
                        <b>특징</b> {room.feature}
                      </p>
                    )}
                    {room.danger && (
                      <p>
                        <b>위험</b> {room.danger}
                      </p>
                    )}
                    {room.treasure && (
                      <p>
                        <b>보물</b> {room.treasure}
                      </p>
                    )}
                    {room.encounter && (
                      <p>
                        <b>조우</b> {room.encounter}
                      </p>
                    )}
                    {room.gmNotes && <p>{room.gmNotes}</p>}
                    {room.notes && <p>{room.notes}</p>}
                  </details>
                )}
              </>
            )}
          </section>
          <section className="play-encounters">
            <div className="section-title">
              <h2>만남</h2>
              <span>{placed.length} 몬스터 배치</span>
            </div>
            {placed.map((p) => {
              const monster = c.monsters.find((m) => m.id === p.monsterId)!;
              return (
                <div className="play-placement" key={p.id}>
                  <button
                    onClick={() =>
                      openObject(c, { kind: 'monster', id: monster.id })
                    }
                  >
                    <strong>
                      {monster.name} ×{p.quantity}
                    </strong>
                    <small>
                      HP {monster.hp} · 사기 {monster.morale || '—'}
                    </small>
                  </button>
                  <PlacementState
                    campaign={c}
                    kind="monster"
                    placementId={p.id}
                    value={p.playState}
                  />
                  <Button
                    className="btn small"
                    disabled={session.encounters.some(
                      (e) =>
                        e.placementId === p.id && e.state === 'encountered',
                    )}
                    onClick={() =>
                      run(() =>
                        editCampaign(c.id, (next) =>
                          startSessionEncounter(next, session.id, p.id),
                        ),
                      )
                    }
                  >
                    조우 시작
                  </Button>
                </div>
              );
            })}
            {(['npc', 'encounter'] as const).map((kind) =>
              (kind === 'npc' ? c.npcPlacements : c.encounterPlacements)
                .filter(
                  (p) =>
                    p.dungeonId === dungeon?.id &&
                    (!room || p.roomId === room.id || !p.roomId),
                )
                .map((p) => {
                  const entity = (kind === 'npc' ? c.npcs : c.encounters).find(
                    (e) => e.id === p.entityId,
                  )!;
                  return (
                    <div className="play-placement" key={p.id}>
                      <button
                        onClick={() => openObject(c, { kind, id: entity.id })}
                      >
                        <small>{kind === 'npc' ? 'NPC' : 'ENCOUNTER'}</small>
                        <strong>
                          {entity.name ||
                            ('text' in entity
                              ? entity.text
                              : '이름 없는 NPC')}{' '}
                          ×{p.quantity}
                        </strong>
                      </button>
                      <PlacementState
                        campaign={c}
                        kind={kind}
                        placementId={p.id}
                        value={p.playState}
                      />
                    </div>
                  );
                }),
            )}
            {!dungeon && (
              <p className="empty-copy">
                장소를 선택하면 그곳에 배치한 개체가 나타납니다.
              </p>
            )}
            {session.encounters.length > 0 && (
              <>
                <h3 className="encounter-subtitle">이번 세션의 조우</h3>
                {session.encounters.map((e) => (
                  <div className="session-encounter" key={e.id}>
                    <div className="section-title">
                      <strong>
                        {c.monsters.find((m) => m.id === e.monsterId)?.name} ×
                        {e.quantity}
                      </strong>
                      <select
                        aria-label="세션 조우 결과"
                        value={e.state}
                        onChange={(v) =>
                          run(() =>
                            editCampaign(c.id, (next) =>
                              updateSessionEncounter(next, session.id, e.id, {
                                state: v.target.value as PlacementPlayState,
                              }),
                            ),
                          )
                        }
                      >
                        {[
                          'encountered',
                          'defeated',
                          'fled',
                          'dead',
                          'removed',
                        ].map((s) => (
                          <option key={s} value={s}>
                            {stateLabels[s]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="encounter-counter">
                      <label>
                        남은 수
                        <Input
                          type="number"
                          min={0}
                          max={e.quantity}
                          value={e.remaining}
                          onChange={(v) =>
                            run(() =>
                              editCampaign(c.id, (next) =>
                                updateSessionEncounter(next, session.id, e.id, {
                                  remaining: Math.max(
                                    0,
                                    Math.min(
                                      e.quantity,
                                      Math.trunc(Number(v.target.value) || 0),
                                    ),
                                  ),
                                }),
                              ),
                            )
                          }
                        />
                      </label>
                      <span>/ {e.quantity}</span>
                      <label>
                        사기
                        <Input
                          aria-label="세션 조우 사기"
                          value={e.morale}
                          onChange={(v) =>
                            editCampaign(c.id, (next) =>
                              updateSessionEncounter(next, session.id, e.id, {
                                morale: v.target.value,
                              }),
                            )
                          }
                        />
                      </label>
                    </div>
                    <details>
                      <summary>
                        조우 노트{e.notes ? ' · 기록 있음' : ''}
                      </summary>
                      <Textarea
                        aria-label="조우 노트"
                        value={e.notes}
                        onChange={(v) =>
                          editCampaign(c.id, (next) =>
                            updateSessionEncounter(next, session.id, e.id, {
                              notes: v.target.value,
                            }),
                          )
                        }
                      />
                    </details>
                  </div>
                ))}
              </>
            )}
          </section>
          <section className="play-recent">
            <div className="section-title">
              <h2>이번 밤의 흔적</h2>
              <Button
                className="btn ghost small"
                onClick={() => onCapture('event')}
              >
                <Plus size={14} />
                사건
              </Button>
            </div>
            <EventLedger
              campaign={c}
              events={c.timeline
                .filter((e) => e.sessionId === session.id)
                .slice(-5)}
              compact
            />
          </section>
        </div>
        <aside className="play-aside">
          <QuickDice campaign={c} />
          <QuickOracle campaign={c} onLibrary={onOracles} />
          <section className="quick-note">
            <h2>여백의 기록</h2>
            <Textarea
              aria-label="플레이 빠른 노트"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="잊기 전에 한 줄…"
              rows={3}
            />
            <Button
              className="btn"
              disabled={!note.trim()}
              onClick={() => {
                editCampaign(c.id, (next) =>
                  createJournalNote(next, {
                    title: note.trim().split('\n')[0].slice(0, 80),
                    text: note.trim(),
                    links: captureContext(next),
                  }),
                );
                setNote('');
                notify('현재 세션에 노트를 남겼습니다.');
              }}
            >
              노트 저장
            </Button>
          </section>
          <details className="play-procedures">
            <summary>재앙 · 여행 · 테이블 절차</summary>
            <CampaignProcedures campaign={c} notify={notify} />
          </details>
        </aside>
      </div>
    </section>
  );
}
