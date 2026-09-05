import { useState } from 'react';
import { Dices, Copy, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Campaign, Dungeon, DungeonEncounterKind } from '../domain/types';
import {
  DUNGEON_ENCOUNTER_KINDS,
  dungeonEncounterSlots,
  prepareDungeonEncounters,
  rollDungeonEncounter,
  setDungeonEncounterDR,
  setDungeonEncounterSlot,
} from '../domain/dungeonEncounters';
import { encounterTable } from '../generators/content';
import { useOracleRegistry } from '../storage/oracleStore';
import { changeWorkspace, editCampaign } from '../storage/saveStore';
import { addContentPlacement } from '../domain/contentOperations';
import { SourceDisclosure } from './SourceDisclosure';
import { contentTitle, openPlacedContent } from './ContentAssignments';
import type { Confirm } from './Library';
import './dungeonEncounters.css';

const label = (kind: DungeonEncounterKind) =>
  kind === 'common' ? 'Common' : 'Rare';
const prepared = (c: Campaign, d: Dungeon, kind: DungeonEncounterKind) =>
  dungeonEncounterSlots(d, kind).filter(
    (ref) => ref && c.encounters.some((e) => e.id === ref),
  ).length;
export const dungeonEncounterCount = (d: Dungeon) =>
  DUNGEON_ENCOUNTER_KINDS.reduce(
    (n, kind) => n + dungeonEncounterSlots(d, kind).filter(Boolean).length,
    0,
  );

export function DungeonEncounterRoller({
  campaign: c,
  dungeon: d,
  roomId,
}: {
  campaign: Campaign;
  dungeon: Dungeon;
  roomId?: string;
}) {
  const [result, setResult] = useState<{
    kind: DungeonEncounterKind;
    roll: number;
    encounterId: string;
  } | null>(null);
  const [message, setMessage] = useState('');
  const encounter = c.encounters.find((e) => e.id === result?.encounterId);
  function safely(action: () => void) {
    try {
      setMessage('');
      action();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : '조우표를 확인하세요.');
    }
  }
  return (
    <section
      className="dungeon-encounter-roller"
      aria-label="던전 고정 조우 굴림"
    >
      <div className="dungeon-encounter-actions">
        <span className="eyebrow">고정 조우표</span>
        {DUNGEON_ENCOUNTER_KINDS.map((kind) => (
          <Button
            key={kind}
            className="btn small"
            disabled={prepared(c, d, kind) !== 6}
            onClick={() =>
              safely(() => {
                const rolled = rollDungeonEncounter(c, d.id, kind);
                setResult({
                  kind,
                  roll: rolled.roll,
                  encounterId: rolled.encounter.id,
                });
              })
            }
          >
            <Dices size={16} /> {label(kind)} · d6
            {prepared(c, d, kind) < 6 && (
              <small>{prepared(c, d, kind)}/6</small>
            )}
          </Button>
        ))}
        {c.workspace.dungeonTab !== 'encounters' && (
          <Button
            className="btn small ghost"
            onClick={() =>
              changeWorkspace(c.id, {
                section: 'dungeons',
                dungeonId: d.id,
                dungeonTab: 'encounters',
              })
            }
          >
            조우표 준비·편집 <ArrowUpRight size={14} />
          </Button>
        )}
      </div>
      {encounter && result && (
        <article
          className="dungeon-encounter-result"
          aria-label="고정 조우 결과"
        >
          <small>
            {label(result.kind)} {result.roll} / d6 · {d.title}
          </small>
          <h3>{contentTitle(encounter) || '직접 작성할 조우'}</h3>
          {encounter.name && <p>{encounter.text || encounter.description}</p>}
          {encounter.unresolved && (
            <p>원문 표 범위 밖의 준비 결과입니다. 해당 칸을 직접 확인하세요.</p>
          )}
          <div className="dungeon-encounter-actions">
            <Button
              className="btn small"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(
                    [encounter.name, encounter.text || encounter.description]
                      .filter(Boolean)
                      .join('\n'),
                  );
                  setMessage('복사했습니다.');
                } catch {
                  setMessage(
                    '복사하지 못했습니다. 결과 텍스트를 선택해 복사하세요.',
                  );
                }
              }}
            >
              <Copy size={14} /> COPY
            </Button>
            <Button
              className="btn small ghost"
              onClick={() =>
                openPlacedContent(c, 'encounters', encounter.id, {
                  dungeonId: d.id,
                  roomId: roomId ?? null,
                })
              }
            >
              상세
            </Button>
            {roomId && (
              <Button
                className="btn small"
                onClick={() =>
                  safely(() => {
                    editCampaign(c.id, (next) =>
                      addContentPlacement(next, 'encounters', encounter.id, {
                        dungeonId: d.id,
                        roomId,
                      }),
                    );
                    setMessage('이 방에 배치했습니다.');
                  })
                }
              >
                이 방에 배치
              </Button>
            )}
          </div>
          <SourceDisclosure
            refs={encounter.sourceRefs}
            label="SOURCE · 준비에 사용한 표"
          />
        </article>
      )}
      <output className="help-line">{message}</output>
    </section>
  );
}

export function DungeonEncounterTables({
  campaign: c,
  dungeon: d,
  confirm,
  notify,
}: {
  campaign: Campaign;
  dungeon: Dungeon;
  confirm: Confirm;
  notify: (message: string) => void;
}) {
  const { registry } = useOracleRegistry();
  const safely = (action: () => void) => {
    try {
      action();
    } catch (e) {
      notify(e instanceof Error ? e.message : '조우표를 확인하세요.');
    }
  };
  const edit = (action: (next: Campaign) => void) =>
    safely(() => editCampaign(c.id, action));
  const ready = (kind: DungeonEncounterKind) =>
    registry.tables.some(
      (t) =>
        t.id === encounterTable(kind, d.region, registry) &&
        t.sourceVerified &&
        t.rollable !== false,
    );
  function generate(kind: DungeonEncounterKind, slot?: number, blank = false) {
    const run = () =>
      edit((next) => {
        const created = prepareDungeonEncounters(
          next,
          d.id,
          kind,
          registry,
          undefined,
          slot,
          blank,
        );
        if (blank && created[0]) {
          next.workspace.section = 'encounters';
          next.workspace.selected.encounters = created[0].id;
          next.workspace.contentTarget = { dungeonId: d.id, roomId: null };
        }
      });
    if (slot !== undefined && dungeonEncounterSlots(d, kind)[slot])
      confirm(
        `${label(kind)} ${slot + 1}번 칸을 교체할까요?`,
        '이 칸에 새 조우를 준비합니다. 기존 조우와 방 배치는 보관함에 유지됩니다.',
        run,
      );
    else run();
  }
  return (
    <section className="dungeon-encounter-tables" aria-label="던전 고정 조우표">
      <div className="dungeon-encounter-heading">
        <div>
          <h2>Common 6 / Rare 6</h2>
          <p className="help-line">
            던전마다 한 번 준비하고, 플레이 중에는 각 표에서 d6로 고릅니다. 빈칸
            준비는 이미 채운 칸을 유지합니다.
          </p>
        </div>
        <label className="dungeon-encounter-dr">
          Dungeon DR
          <select
            aria-label="조우표 Dungeon DR"
            value={d.encounterTables?.dungeonDR ?? 10}
            onChange={(e) =>
              edit((next) =>
                setDungeonEncounterDR(next, d.id, Number(e.target.value)),
              )
            }
          >
            {Array.from({ length: 9 }, (_, i) => i + 6).map((dr) => (
              <option key={dr}>{dr}</option>
            ))}
          </select>
          <small>앞으로 준비할 Rare에 적용</small>
        </label>
      </div>
      <DungeonEncounterRoller key={d.id} campaign={c} dungeon={d} />
      <div className="dungeon-encounter-columns">
        {DUNGEON_ENCOUNTER_KINDS.map((kind) => (
          <section
            key={kind}
            className="dungeon-encounter-table"
            aria-label={`${label(kind)} 고정 6칸`}
          >
            <header>
              <h3>
                {label(kind)} <span>{prepared(c, d, kind)}/6</span>
              </h3>
              <Button
                className="btn small"
                disabled={!ready(kind) || prepared(c, d, kind) === 6}
                onClick={() => generate(kind)}
              >
                빈칸 준비
              </Button>
            </header>
            <ol>
              {dungeonEncounterSlots(d, kind).map((ref, slot) => {
                const e = c.encounters.find((e) => e.id === ref);
                return (
                  <li key={slot} data-encounter-slot={`${kind}-${slot + 1}`}>
                    <span className="dungeon-encounter-face">{slot + 1}</span>
                    <div className="dungeon-encounter-slot">
                      {e ? (
                        <button
                          className="dungeon-encounter-title"
                          onClick={() =>
                            openPlacedContent(c, 'encounters', e.id, {
                              dungeonId: d.id,
                              roomId: null,
                            })
                          }
                        >
                          {contentTitle(e) || '직접 작성할 조우'}
                        </button>
                      ) : (
                        <span className="help-line">준비할 조우</span>
                      )}
                      {e?.unresolved && (
                        <small>원문 범위 밖 · 직접 확인 필요</small>
                      )}
                      {e && <SourceDisclosure refs={e.sourceRefs} />}
                      <details className="dungeon-encounter-edit">
                        <summary>{e ? '칸 수정' : '칸 준비'}</summary>
                        <div className="dungeon-encounter-actions">
                          <Button
                            className="btn small"
                            disabled={!ready(kind)}
                            onClick={() => generate(kind, slot)}
                          >
                            {e ? '새 결과로 교체' : '이 칸 생성'}
                          </Button>
                          {!e && (
                            <Button
                              className="btn small ghost"
                              onClick={() => generate(kind, slot, true)}
                            >
                              직접 작성
                            </Button>
                          )}
                        </div>
                        <label>
                          기존 조우로 지정
                          <select
                            aria-label={`${label(kind)} ${slot + 1}번 조우 선택`}
                            value={ref ?? ''}
                            onChange={(event) =>
                              edit((next) =>
                                setDungeonEncounterSlot(
                                  next,
                                  d.id,
                                  kind,
                                  slot,
                                  event.target.value || null,
                                ),
                              )
                            }
                          >
                            <option value="">빈칸</option>
                            {c.encounters.map((entry) => (
                              <option key={entry.id} value={entry.id}>
                                {contentTitle(entry) || '직접 작성할 조우'}
                              </option>
                            ))}
                          </select>
                        </label>
                      </details>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>
    </section>
  );
}
