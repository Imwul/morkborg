import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Plus,
  Dices,
  Copy,
  Trash2,
  DoorOpen,
  ArrowRight,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type {
  Campaign,
  Dungeon,
  DungeonRoom,
  DungeonTab,
  LibraryKind,
  RegionId,
} from '../domain/types';
import { dungeonFields, roomFields } from '../domain/types';
import { regions, regionById } from '../data/regions';
import {
  createRoom,
  generateDungeonRoll,
  generateRoomRoll,
  dungeonTitle,
  canReroll,
  rerollRoomContents,
} from '../generators';
import { editCampaign, changeWorkspace } from '../storage/saveStore';
import {
  referenceKey,
  removeAssignment,
  assignEntity,
} from '../domain/operations';
import {
  deleteDungeon,
  deleteRoom,
  duplicateDungeon,
} from '../domain/monsterOperations';
import { DungeonMonsters } from './MonsterAssignments';
import { useRules } from '../storage/rulesStore';
import { now } from '../generators/random';
import { Field } from './Field';
import { Translation } from './Translation';
import type { Confirm } from './Library';
import { singular } from './Library';
import { DungeonDraft } from './DungeonDraft';
import { DungeonSheet } from './DungeonSheet';
export function Dungeons({
  campaign: c,
  create,
  confirm,
  notify,
}: {
  campaign: Campaign;
  create: () => void;
  confirm: Confirm;
  notify: (text: string) => void;
}) {
  const rules = useRules();
  const d = c.dungeons.find((x) => x.id === c.workspace.dungeonId);
  const tab = c.workspace.dungeonTab;
  const patch = (key: string, value: unknown, source?: string) => {
    if (d)
      editCampaign(c.id, (next) => {
        const target = next.dungeons.find((x) => x.id === d.id)!;
        Object.assign(target, {
          [key]: value,
          updatedAt: now(),
          sources: { ...target.sources, [key]: source ?? '직접 작성' },
        });
      });
  };
  const open = (dungeon: Dungeon) =>
    changeWorkspace(c.id, {
      dungeonPreview: false,
      dungeonId: dungeon.id,
      roomId: null,
      dungeonTab: 'overview',
      section: 'dungeons',
    });
  const remove = (dungeon: Dungeon) =>
    confirm(
      `${dungeon.title} 던전을 삭제할까요?`,
      '던전과 방, 이 던전의 몬스터 배치를 삭제합니다. 몬스터 정의는 캠페인 보관함에 남습니다.',
      () => editCampaign(c.id, (next) => deleteDungeon(next, dungeon.id)),
    );
  const duplicate = (dungeon: Dungeon) => {
    editCampaign(c.id, (next) => {
      duplicateDungeon(next, dungeon.id);
    });
    notify('던전을 복제했습니다. 보관함의 원본 항목은 공유됩니다.');
  };
  if (c.workspace.dungeonPreview)
    return <DungeonDraft campaign={c} confirm={confirm} notify={notify} />;
  if (!d)
    return (
      <>
        <div className="eyebrow">
          잊혔어야 할 장소들 / {c.dungeons.length}개 던전
        </div>
        <div className="page-heading">
          <div>
            <h1>
              던전 보관함<span className="acid">.</span>
            </h1>
            <p>
              {c.description ||
                c.subtitle ||
                '지역을 고르고 던전을 생성한 뒤, 원하는 후보를 이 캠페인에 보관하세요.'}
            </p>
          </div>
          <Button className="btn primary" onClick={create}>
            <Plus /> 새 던전
          </Button>
        </div>
        {c.dungeonDraft && (
          <button className="resume-candidate" onClick={create}>
            <Dices size={20} />
            <span>
              마지막 후보 이어 보기
              <strong>{c.dungeonDraft.title || '직접 작성 중'}</strong>
            </span>
            <ArrowRight size={18} />
          </button>
        )}
        <div className="dungeon-grid">
          {c.dungeons.map((dungeon, i) => (
            <article className="dungeon-card" key={dungeon.id}>
              <div className="card-meta">
                <span>{String(i + 1).padStart(2, '0')} / DUNGEON</span>
                <span>{regionById(dungeon.region).name}</span>
              </div>
              <button className="card-title" onClick={() => open(dungeon)}>
                {dungeon.title}
              </button>
              <p>{dungeon.status}</p>
              <div className="card-counts">
                <span>{dungeon.rooms.length}개 방</span>
              </div>
              <p className="modified-time">
                마지막 수정{' '}
                <time dateTime={dungeon.updatedAt}>
                  {new Date(dungeon.updatedAt).toLocaleString('ko-KR', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </time>
              </p>
              <div className="card-actions">
                <Button className="btn ghost" onClick={() => open(dungeon)}>
                  던전 열기 <ArrowRight size={16} />
                </Button>
                <Button
                  className="icon-btn"
                  aria-label={`${dungeon.title} 복제`}
                  onClick={() => duplicate(dungeon)}
                >
                  <Copy size={16} />
                </Button>
                <Button
                  className="icon-btn danger"
                  aria-label={`${dungeon.title} 삭제`}
                  onClick={() => remove(dungeon)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </article>
          ))}
          <button className="create-card" onClick={create}>
            <Plus size={29} strokeWidth={1} />
            <span>새 던전</span>
            <p>무언가 아래에서 기다립니다.</p>
          </button>
        </div>
      </>
    );
  const tabs: DungeonTab[] = (
    [
      'overview',
      'rooms',
      'monsters',
      'npcs',
      'encounters',
      'notes',
    ] as DungeonTab[]
  ).filter(
    (t) =>
      ['overview', 'rooms', 'monsters', 'notes'].includes(t) ||
      d[referenceKey(t as 'monsters' | 'npcs' | 'encounters')]?.length > 0,
  );
  return (
    <div className="dungeon-workbench">
      <Button
        className="btn ghost back-button"
        onClick={() => changeWorkspace(c.id, { dungeonId: null, roomId: null })}
      >
        <ArrowLeft size={15} /> 모든 던전
      </Button>
      <div className="dungeon-heading">
        <span className="eyebrow">DUNGEON / {regionById(d.region).name}</span>
        <div className="title-edit">
          <Textarea
            rows={1}
            aria-label="던전 제목"
            value={d.title}
            onChange={(e) => patch('title', e.target.value)}
            className="title-input"
          />
          <Button
            className="icon-btn"
            disabled={!rules.pack}
            aria-label="던전 제목 재굴림"
            onClick={() =>
              patch(
                'title',
                dungeonTitle(),
                'MÖRK BORG BARE BONES EDITION · PDF 71쪽 · d12 두 번',
              )
            }
          >
            <Dices size={20} />
          </Button>
        </div>
        <Translation text={d.title} />
        <div className="region-line">
          <label htmlFor="dungeon-region" className="sr-only">
            지역
          </label>
          <select
            id="dungeon-region"
            value={d.region}
            onChange={(e) => patch('region', e.target.value as RegionId)}
          >
            {regions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <p>{regionById(d.region).description}</p>
        </div>
      </div>
      <div className="dungeon-tabs">
        {tabs.map((t) => (
          <Button
            key={t}
            className={`tab ${tab === t ? 'active' : ''}`}
            onClick={() => changeWorkspace(c.id, { dungeonTab: t })}
          >
            {
              {
                overview: '개요',
                rooms: '방',
                monsters: '몬스터',
                npcs: 'NPC',
                encounters: '조우',
                notes: '노트',
              }[t]
            }
            <span>
              {t === 'rooms'
                ? d.rooms.length
                : t === 'monsters'
                  ? d.monsterIds.length
                  : t === 'npcs'
                    ? d.npcIds.length
                    : t === 'encounters'
                      ? d.encounterIds.length
                      : ''}
            </span>
          </Button>
        ))}
      </div>
      {tab === 'overview' && (
        <>
          <div className="section-toolbar">
            <div>
              <span className="eyebrow">던전 개요</span>
              <p className="help-line">
                모든 항목을 편집할 수 있습니다. 지역 태그는 원문 결과의 확률만
                조정하며 다른 결과도 나올 수 있습니다.
              </p>
            </div>
            <Button
              className="btn"
              disabled={!rules.pack}
              onClick={() =>
                confirm(
                  '던전 전체를 다시 굴릴까요?',
                  '생성된 개요 항목을 모두 바꿉니다. 제목, 지역, 방, 배치한 내용과 메모는 유지됩니다.',
                  () =>
                    editCampaign(c.id, (next) => {
                      const target = next.dungeons.find((x) => x.id === d.id)!;
                      for (const f of dungeonFields) {
                        const rolled = generateDungeonRoll(
                          f.key,
                          target.region,
                        );
                        Object.assign(target, {
                          [f.key]: rolled.value,
                          sources: {
                            ...target.sources,
                            [f.key]: rolled.source,
                          },
                        });
                      }
                      target.updatedAt = now();
                    }),
                )
              }
            >
              <Dices size={16} /> 전체 재굴림
            </Button>
          </div>
          {rules.pack &&
            dungeonFields.some(
              (f) => !(d as unknown as Record<string, unknown>)[f.key],
            ) && (
              <div className="fill-missing">
                <p>
                  비어 있는 항목을 원문 표로 채울 수 있습니다. 이미 적힌 내용은
                  유지됩니다.
                </p>
                <Button
                  className="btn"
                  onClick={() =>
                    editCampaign(c.id, (next) => {
                      const target = next.dungeons.find((x) => x.id === d.id)!;
                      for (const field of dungeonFields)
                        if (
                          !(target as unknown as Record<string, unknown>)[
                            field.key
                          ]
                        ) {
                          const result = generateDungeonRoll(
                            field.key,
                            target.region,
                          );
                          Object.assign(target, {
                            [field.key]: result.value,
                            sources: {
                              ...target.sources,
                              [field.key]: result.source,
                            },
                          });
                        }
                    })
                  }
                >
                  <Dices size={16} /> 빈 항목만 생성
                </Button>
              </div>
            )}
          <DungeonSheet
            dungeon={d}
            ready={!!rules.pack}
            patch={patch}
            patchRoom={(roomId, key, value, source) =>
              editCampaign(c.id, (next) => {
                const target = next.dungeons.find((x) => x.id === d.id)!;
                const room = target.rooms.find((r) => r.id === roomId);
                if (room) {
                  Object.assign(room, {
                    [key]: value,
                    sources: { ...room.sources, [key]: source ?? '직접 작성' },
                  });
                  target.updatedAt = now();
                }
              })
            }
            rollRoom={(roomId) =>
              editCampaign(c.id, (next) => {
                const target = next.dungeons.find((x) => x.id === d.id)!;
                const room = target.rooms.find((r) => r.id === roomId);
                if (room) {
                  rerollRoomContents(room, target.region);
                  target.updatedAt = now();
                }
              })
            }
            openRoom={(roomId) =>
              changeWorkspace(c.id, { roomId, dungeonTab: 'rooms' })
            }
          />
        </>
      )}
      {tab === 'rooms' && (
        <Rooms campaign={c} dungeon={d} confirm={confirm} notify={notify} />
      )}
      {tab === 'monsters' && (
        <DungeonMonsters campaign={c} dungeon={d} notify={notify} />
      )}
      {(['npcs', 'encounters'] as const).includes(tab as 'npcs') && (
        <Assigned
          campaign={c}
          dungeon={d}
          kind={tab as Exclude<LibraryKind, 'characters'>}
          notify={notify}
        />
      )}
      {tab === 'notes' && (
        <div className="notebook">
          <span className="eyebrow">MARGINALIA / {d.title}</span>
          <h2>지도에는 없는 이야기.</h2>
          <Textarea
            className="notebook-input"
            aria-label="던전 노트"
            value={d.notes}
            onChange={(e) => patch('notes', e.target.value)}
            placeholder="비밀, 미해결 사건, 그리고 일행이 아직 망가뜨리지 않은 것들."
          />
        </div>
      )}
      {tab !== 'notes' && (
        <div className="notes-block dungeon-inline-notes">
          <label className="eyebrow" htmlFor="dungeon-notes-inline">
            던전 노트
          </label>
          <Textarea
            id="dungeon-notes-inline"
            value={d.notes}
            onChange={(e) => patch('notes', e.target.value)}
            placeholder="이 던전에 대한 기록을 남기세요. 자동으로 저장됩니다."
          />
        </div>
      )}
      <div className="danger-zone">
        <Button className="btn ghost" onClick={() => duplicate(d)}>
          <Copy size={14} /> 던전 복제
        </Button>
        <Button className="btn ghost danger" onClick={() => remove(d)}>
          <Trash2 size={14} /> 던전 삭제
        </Button>
      </div>
    </div>
  );
}
function Rooms({
  campaign: c,
  dungeon: d,
  confirm,
  notify,
}: {
  campaign: Campaign;
  dungeon: Dungeon;
  confirm: Confirm;
  notify: (text: string) => void;
}) {
  const rules = useRules();
  const selected = d.rooms.find((r) => r.id === c.workspace.roomId);
  function add(blank: boolean) {
    editCampaign(c.id, (next) => {
      const dungeon = next.dungeons.find((x) => x.id === d.id)!;
      const room = createRoom(dungeon.region, blank);
      dungeon.rooms.push(room);
      next.workspace.roomId = room.id;
    });
  }
  function patch(key: string, value: string | number, source?: string) {
    if (selected)
      editCampaign(c.id, (next) => {
        const room = next.dungeons
          .find((x) => x.id === d.id)!
          .rooms.find((r) => r.id === selected.id)!;
        Object.assign(room, {
          [key]: value,
          sources: { ...room.sources, [key]: source ?? '직접 작성' },
        });
      });
  }
  function move(roomId: string, delta: number) {
    editCampaign(c.id, (next) => {
      const rooms = next.dungeons.find((x) => x.id === d.id)!.rooms;
      const i = rooms.findIndex((r) => r.id === roomId);
      const to = i + delta;
      if (to < 0 || to >= rooms.length) return;
      [rooms[i], rooms[to]] = [rooms[to], rooms[i]];
    });
  }
  function remove(r: DungeonRoom) {
    confirm(
      `${r.name || '이 방'}을 삭제할까요?`,
      `이 방의 몬스터 배치 ${c.monsterPlacements.filter((p) => p.roomId === r.id).length}개를 Dungeon-only로 옮깁니다. 수량과 배치 메모는 유지됩니다.`,
      () => editCampaign(c.id, (next) => deleteRoom(next, d.id, r.id)),
    );
  }
  return (
    <>
      <div className="section-toolbar">
        <span className="eyebrow">{d.rooms.length}개 방 / 탐험 경로</span>
        <div className="actions">
          <Button className="btn" onClick={() => add(true)}>
            <Plus size={15} /> 빈 방 추가
          </Button>
          <Button
            className="btn primary"
            disabled={!rules.pack}
            onClick={() => add(false)}
          >
            <Dices size={16} /> 방 생성
          </Button>
        </div>
      </div>
      <div className="rooms-layout">
        <aside className="room-list">
          {d.rooms.map((r, i) => (
            <div
              className={`room-row ${r.id === selected?.id ? 'selected' : ''}`}
              key={r.id}
            >
              <button
                className="room-select"
                onClick={() => changeWorkspace(c.id, { roomId: r.id })}
              >
                <span>{String(i + 1).padStart(2, '0')}</span>
                <strong>{r.name || '이름 없는 방'}</strong>
              </button>
              <div className="room-order">
                <Button
                  className="icon-btn"
                  aria-label={`방 ${i + 1} 위로 이동`}
                  disabled={i === 0}
                  onClick={() => move(r.id, -1)}
                >
                  <ArrowUp size={14} />
                </Button>
                <Button
                  className="icon-btn"
                  aria-label={`방 ${i + 1} 아래로 이동`}
                  disabled={i === d.rooms.length - 1}
                  onClick={() => move(r.id, 1)}
                >
                  <ArrowDown size={14} />
                </Button>
              </div>
            </div>
          ))}
          {!d.rooms.length && (
            <p className="list-empty">첫 번째 방부터 시작하세요.</p>
          )}
        </aside>
        {selected ? (
          <article className="room-detail" key={selected.id}>
            <div className="artifact-head">
              <span className="eyebrow">
                방 {String(d.rooms.indexOf(selected) + 1).padStart(2, '0')}
              </span>
              <Button
                className="btn small"
                disabled={!rules.pack}
                aria-label={`방 ${d.rooms.indexOf(selected) + 1} 전체 재굴림`}
                onClick={() =>
                  confirm(
                    '이 방의 내용을 다시 굴릴까요?',
                    '선택한 방의 생성 항목만 바꿉니다. 방 ID와 메모는 유지됩니다.',
                    () =>
                      editCampaign(c.id, (next) => {
                        const target = next.dungeons
                          .find((x) => x.id === d.id)!
                          .rooms.find((r) => r.id === selected.id)!;
                        rerollRoomContents(target, d.region);
                      }),
                  )
                }
              >
                <Dices size={16} /> 이 방 다시 굴리기
              </Button>
              <Button
                className="icon-btn danger"
                aria-label="방 삭제"
                onClick={() => remove(selected)}
              >
                <Trash2 size={16} />
              </Button>
            </div>
            <div className="fields-grid">
              {roomFields.map((spec) => (
                <Field
                  key={spec.key}
                  spec={spec}
                  value={String(
                    (selected as unknown as Record<string, unknown>)[spec.key],
                  )}
                  source={selected.sources?.[spec.key]}
                  onChange={(value, source) => patch(spec.key, value, source)}
                  reroll={
                    canReroll('room', spec.key)
                      ? () => generateRoomRoll(spec.key, d.region)
                      : undefined
                  }
                />
              ))}
            </div>
            <DungeonMonsters
              key={selected.id}
              campaign={c}
              dungeon={d}
              room={selected}
              notify={notify}
            />
            {(['npcs', 'encounters'] as const)
              .filter((kind) => selected[referenceKey(kind)].length > 0)
              .map((kind) => (
                <Assigned
                  key={kind}
                  campaign={c}
                  dungeon={d}
                  room={selected}
                  kind={kind}
                  notify={notify}
                />
              ))}
            <div className="notes-block">
              <label className="eyebrow" htmlFor="room-notes">
                방 메모
              </label>
              <Textarea
                id="room-notes"
                value={selected.notes}
                onChange={(e) => patch('notes', e.target.value)}
                placeholder="일행이 알아서는 안 되는 것…"
              />
            </div>
          </article>
        ) : (
          <div className="empty-artifact">
            <DoorOpen size={44} strokeWidth={1} />
            <h2>문 하나씩, 천천히.</h2>
            <p>방을 선택하거나 다음 방을 생성하세요.</p>
            <Button
              className="btn primary"
              disabled={!rules.pack}
              onClick={() => add(false)}
            >
              <Dices size={16} /> 방 생성
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
export function Assigned({
  campaign: c,
  dungeon: d,
  room,
  kind,
  notify,
}: {
  campaign: Campaign;
  dungeon: Dungeon;
  room?: DungeonRoom;
  kind: Exclude<LibraryKind, 'characters'>;
  notify: (text: string) => void;
}) {
  const key = referenceKey(kind);
  const assigned = (room ?? d)[key];
  return (
    <div className={`assigned ${room ? 'compact' : ''}`}>
      <div className="assigned-heading">
        <h3>
          {{ monsters: '몬스터', npcs: 'NPC', encounters: '조우' }[kind]}{' '}
          <span>{assigned.length}</span>
        </h3>
        <select
          aria-label={`${room ? '방' : '던전'}에 기존 ${singular[kind]} 배치`}
          value=""
          onChange={(e) => {
            if (e.target.value) {
              editCampaign(c.id, (next) =>
                assignEntity(
                  next,
                  kind,
                  e.target.value,
                  d.id,
                  room?.id ?? null,
                ),
              );
              notify('캠페인 보관함에서 추가했습니다.');
            }
          }}
        >
          <option value="">+ 보관함에서 추가</option>
          {c[kind]
            .filter((e) => !assigned.includes(e.id))
            .map((e) => (
              <option key={e.id} value={e.id}>
                {e.name || '이름 없음'}
              </option>
            ))}
        </select>
      </div>
      {assigned.map((entityId) => {
        const entity = c[kind].find((e) => e.id === entityId);
        if (!entity) return null;
        return (
          <div className="assigned-row" key={entityId}>
            <button
              onClick={() =>
                changeWorkspace(c.id, {
                  section: kind === 'monsters' ? 'monsters' : 'encounters',
                  stockingKind: kind === 'npcs' ? 'npcs' : 'encounters',
                  selected: { ...c.workspace.selected, [kind]: entityId },
                })
              }
            >
              <strong>{entity.name || '이름 없음'}</strong>
              <span>
                {'hp' in entity
                  ? `${entity.hp} HP · ${entity.armor}`
                  : entity.category === 'rare'
                    ? '희귀 조우'
                    : '일반 조우'}
                {!room &&
                  ` · ${
                    d.rooms
                      .filter((r) => r[key].includes(entityId))
                      .map((r) => `방 ${d.rooms.indexOf(r) + 1}`)
                      .join(', ') || '방에 배치되지 않음'
                  }`}
              </span>
            </button>
            <Button
              className="icon-btn"
              aria-label={`${entity.name} ${room ? '방' : '던전'} 배치 해제`}
              onClick={() =>
                editCampaign(c.id, (next) =>
                  removeAssignment(
                    next,
                    kind,
                    entityId,
                    d.id,
                    room?.id ?? null,
                  ),
                )
              }
            >
              <X size={15} />
            </Button>
          </div>
        );
      })}
      {!assigned.length && (
        <p className="help-line">
          배치된 {{ monsters: '몬스터', npcs: 'NPC', encounters: '조우' }[kind]}{' '}
          항목이 없습니다.
        </p>
      )}
      {!room && (
        <Button
          className="btn primary"
          onClick={() =>
            changeWorkspace(c.id, {
              section: kind === 'monsters' ? 'monsters' : 'encounters',
              stockingKind: kind === 'npcs' ? 'npcs' : 'encounters',
            })
          }
        >
          <Plus size={15} /> {singular[kind]} 생성기 열기
        </Button>
      )}
    </div>
  );
}
