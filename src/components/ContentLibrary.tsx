import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type {
  Campaign,
  ContentKind,
  NPC,
  Encounter,
  EncounterCategory,
  FieldSpec,
  RegionId,
} from '../domain/types';
import { regions } from '../data/regions';
import { useOracleRegistry } from '../storage/oracleStore';
import { changeWorkspace, editCampaign } from '../storage/saveStore';
import {
  addContentPlacement,
  addEncounterParticipant,
  beginContentDraft,
  cloneContent,
  deleteContent,
  saveContentDraft,
  setContentTarget,
  patchContentField,
} from '../domain/contentOperations';
import { validMonsterTarget } from '../domain/monsterOperations';
import {
  createNPC,
  createEncounter,
  encounterCategories,
  encounterTable,
  npcFieldTables,
  npcTablesFor,
  rerollNPC,
  rerollEncounter,
} from '../generators/content';
import { CompactCard } from './CompactCard';
import { SourceDisclosure } from './SourceDisclosure';
import { Field } from './Field';
import { QuantityControl, RoomSelector } from './MonsterAssignments';
import {
  ContentPlacementRows,
  contentLabels,
  contentTitle,
  openPlacedContent,
  placementCaption,
} from './ContentAssignments';
import type { Confirm } from './Library';
const npcFields: FieldSpec[] = [
  { key: 'name', label: '이름', type: 'line' },
  { key: 'archetype', label: '직업 / 유형', type: 'line' },
  { key: 'appearance', label: '외모' },
  { key: 'behaviour', label: '태도' },
  { key: 'personality', label: '성격' },
  { key: 'wants', label: '동기' },
  { key: 'reaction', label: '반응' },
];
const optionalNPCFields: FieldSpec[] = [
  { key: 'affiliation', label: '소속' },
  { key: 'fears', label: '두려움' },
  { key: 'secret', label: '비밀' },
  { key: 'hp', label: 'HP', type: 'line' },
  { key: 'morale', label: '사기', type: 'line' },
  { key: 'armor', label: '방어구' },
  { key: 'attack', label: '공격' },
  { key: 'damage', label: '피해' },
  { key: 'specialAbility', label: '특수 능력' },
  { key: 'possession', label: '소지품' },
  { key: 'description', label: '추가 설명' },
];
const encounterFields: FieldSpec[] = [
  { key: 'name', label: '제목', type: 'line' },
  { key: 'text', label: '조우 내용' },
];
export function ContentLibrary({
  campaign: c,
  kind,
  confirm,
  notify,
}: {
  campaign: Campaign;
  kind: ContentKind;
  confirm: Confirm;
  notify: (text: string) => void;
}) {
  const { registry, loading } = useOracleRegistry();
  const [extra, setExtra] = useState(false),
    [participantKind, setParticipantKind] = useState<'monster' | 'npc'>(
      'monster',
    );
  const [participantId, setParticipantId] = useState(''),
    [participantQuantity, setParticipantQuantity] = useState(1);
  const [addingParticipant, setAddingParticipant] = useState(false);
  const draft = c.drafts[kind],
    selected =
      c[kind].find((e) => e.id === c.workspace.selected[kind]) ??
      (draft?.id === c.workspace.selected[kind] ? draft : null);
  const saved = !!selected && c[kind].some((e) => e.id === selected.id);
  const target = validMonsterTarget(c, c.workspace.contentTarget),
    d = c.dungeons.find((d) => d.id === target?.dungeonId);
  const room = d?.rooms.find((r) => r.id === target?.roomId);
  const label = contentLabels[kind],
    region =
      d?.region ?? selected?.region ?? c.workspace.contentRegion ?? 'sarkash';
  const category =
    c.workspace.encounterCategory ??
    (selected && 'category' in selected ? selected.category : 'common');
  const dungeonDR =
    c.workspace.encounterDR ??
    (selected && 'dungeonDR' in selected ? selected.dungeonDR : 10);
  const required =
    kind === 'npcs'
      ? Object.keys(npcFieldTables).flatMap((k) =>
          npcTablesFor(k, region, registry),
        )
      : [
          encounterTable(
            category === 'random' ? 'common' : category,
            region,
            registry,
          ),
        ];
  const ready =
    !loading &&
    required.every((id) =>
      registry.tables.some(
        (t) => t.id === id && t.sourceVerified && t.rollable !== false,
      ),
    );
  const select = (entityId: string | null) =>
    changeWorkspace(c.id, {
      section: kind,
      selected: { ...c.workspace.selected, [kind]: entityId },
    });
  const edit = (
    action: (entity: NPC | Encounter, campaign: Campaign) => void,
  ) =>
    editCampaign(c.id, (next) => {
      const entity =
        next[kind].find((e) => e.id === selected?.id) ?? next.drafts[kind];
      if (entity) action(entity, next);
    });
  const safely = (action: () => void) => {
    try {
      action();
    } catch (e) {
      notify(e instanceof Error ? e.message : '변경을 확인하세요.');
    }
  };
  const patch = (key: string, value: string | number, source?: string) =>
    edit((entity) => patchContentField(entity, key, value, source));
  const chooseTarget = (
    target: import('../domain/types').MonsterTarget | null,
  ) => editCampaign(c.id, (next) => setContentTarget(next, kind, target));
  const remove = (entity: NPC | Encounter) =>
    confirm(
      label + ' 삭제',
      '이 정의의 배치를 제거합니다. 연결된 조우의 참가자 목록도 정리합니다.',
      () => editCampaign(c.id, (next) => deleteContent(next, kind, entity.id)),
    );
  const duplicate = (entity: NPC | Encounter) =>
    editCampaign(c.id, (next) => {
      const copy = cloneContent(entity, next.id);
      (next[kind] as (NPC | Encounter)[]).push(copy);
      next.workspace.selected[kind] = copy.id;
    });
  const generate = () => {
    const run = () =>
      safely(() =>
        edit((entity) => {
          const generated =
            kind === 'npcs'
              ? createNPC(c.id, region, false, registry)
              : createEncounter(
                  c.id,
                  region,
                  category,
                  dungeonDR,
                  false,
                  registry,
                );
          Object.assign(entity, generated, {
            id: entity.id,
            createdAt: entity.createdAt,
            notes: entity.notes,
            ...('participants' in entity
              ? {
                  participants: entity.participants,
                  name: entity.name,
                  sign: entity.sign,
                  complication: entity.complication,
                  treasure: entity.treasure,
                }
              : {}),
          });
        }),
      );
    if (
      selected &&
      (selected.name ||
        ('text' in selected && selected.text) ||
        ('appearance' in selected && selected.appearance))
    )
      confirm(
        label + ' 전체를 다시 생성할까요?',
        '생성 항목을 바꿉니다. 노트와 배치, 조우 참가자 연결은 유지합니다.',
        run,
      );
    else run();
  };
  const configuration = (
    <div className="content-generation-controls">
      {!d && (
        <label>
          지역
          <select
            aria-label={label + ' 생성 지역'}
            value={region}
            onChange={(e) => {
              changeWorkspace(c.id, {
                contentRegion: e.target.value as RegionId,
              });
              if (selected)
                edit((entity) => {
                  entity.region = e.target.value as RegionId;
                });
            }}
          >
            {regions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {kind === 'encounters' && (
        <>
          <label>
            종류
            <select
              aria-label="조우 생성 종류"
              value={category}
              onChange={(e) =>
                changeWorkspace(c.id, {
                  encounterCategory: e.target.value as
                    | EncounterCategory
                    | 'random',
                })
              }
            >
              <option value="random">종류 무작위 · 동일 확률</option>
              {encounterCategories.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.label}
                </option>
              ))}
            </select>
          </label>
          {(category === 'rare' || category === 'random') && (
            <label>
              Dungeon DR
              <select
                aria-label="Dungeon DR"
                value={dungeonDR}
                onChange={(e) =>
                  changeWorkspace(c.id, { encounterDR: Number(e.target.value) })
                }
              >
                {[6, 8, 10, 12, 14].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
          )}
        </>
      )}
    </div>
  );
  if (!selected)
    return (
      <div className="content-library">
        <div className="page-heading">
          <h1>{kind === 'npcs' ? 'NPC 보관함' : '조우 보관함'}</h1>
          <Button
            className="btn primary"
            onClick={() =>
              safely(() =>
                editCampaign(c.id, (next) =>
                  beginContentDraft(next, kind, null, true),
                ),
              )
            }
          >
            새 {label}
          </Button>
        </div>
        {configuration}
        {draft && (
          <button
            className="resume-candidate"
            onClick={() =>
              editCampaign(c.id, (next) => beginContentDraft(next, kind))
            }
          >
            작성 중인 {label} 이어 보기 · {contentTitle(draft)}
          </button>
        )}
        <div className="compact-library-grid">
          {c[kind].map((entity) => (
            <CompactCard
              key={entity.id}
              title={contentTitle(entity)}
              secondary={
                'archetype' in entity
                  ? [entity.behaviour, entity.archetype]
                      .filter(Boolean)
                      .join(' · ')
                  : encounterCategories.find((x) => x.id === entity.category)
                      ?.label
              }
              metadata={placementCaption(c, kind, entity.id)}
              onOpen={() => select(entity.id)}
              actions={[
                { label: '복제', onSelect: () => duplicate(entity) },
                { label: '삭제', onSelect: () => remove(entity), danger: true },
              ]}
            />
          ))}
        </div>
        {!c[kind].length && (
          <p className="empty-copy">아직 저장한 {label}가 없습니다.</p>
        )}
      </div>
    );
  const fields = kind === 'npcs' ? npcFields : encounterFields;
  const translationFor = (key: string) => {
    const ref = selected.sourceRefs.find((ref) => ref.field === key);
    const entry = registry.tables
      .find((t) => t.id === ref?.tableId)
      ?.entries.find((e) => e.id === ref?.entryId);
    return entry &&
      entry.text === (selected as unknown as Record<string, unknown>)[key] &&
      typeof entry.metadata?.ko === 'string'
      ? entry.metadata.ko
      : undefined;
  };
  const field = (spec: FieldSpec) => (
    <Field
      key={spec.key}
      spec={spec}
      value={
        (selected as unknown as Record<string, string | number>)[spec.key] ?? ''
      }
      translation={translationFor(spec.key)}
      source={selected.sources?.[spec.key]}
      onChange={(value, source) => patch(spec.key, value, source)}
      onReroll={
        ready &&
        (kind === 'npcs' ? !!npcFieldTables[spec.key] : spec.key === 'text')
          ? () =>
              safely(() =>
                edit((entity) => {
                  if (kind === 'npcs')
                    rerollNPC(entity as NPC, spec.key, registry);
                  else rerollEncounter(entity as Encounter, registry);
                }),
              )
          : undefined
      }
    />
  );
  return (
    <div className="content-detail" key={selected.id}>
      <div className="content-detail-toolbar">
        <button className="back-button" onClick={() => select(null)}>
          ← 모든 {label}
        </button>
        {target && d && (
          <button
            className="back-button"
            onClick={() =>
              changeWorkspace(c.id, {
                section: 'dungeons',
                dungeonId: d.id,
                roomId: target.roomId,
                dungeonTab: target.roomId ? 'rooms' : 'overview',
              })
            }
          >
            {d.title}
            {room ? ' / Room ' + (d.rooms.indexOf(room) + 1) : ''}로 돌아가기
          </button>
        )}
      </div>
      <div className="page-heading">
        <h1>
          {selected.name ||
            (kind === 'npcs'
              ? 'NPC'
              : encounterCategories.find(
                  (x) => x.id === (selected as Encounter).category,
                )?.label)}
        </h1>
        <div className="actions">
          <Button className="btn" disabled={!ready} onClick={generate}>
            {label} 생성
          </Button>
          {!saved && (
            <Button
              className="btn primary"
              onClick={() =>
                safely(() =>
                  editCampaign(c.id, (next) => saveContentDraft(next, kind)),
                )
              }
            >
              저장
            </Button>
          )}
          {target && (
            <Button
              className="btn primary"
              onClick={() =>
                safely(() => {
                  editCampaign(c.id, (next) =>
                    addContentPlacement(next, kind, selected.id, target),
                  );
                  changeWorkspace(c.id, {
                    section: 'dungeons',
                    dungeonId: target.dungeonId,
                    roomId: target.roomId,
                    dungeonTab: target.roomId ? 'rooms' : 'overview',
                  });
                })
              }
            >
              {saved ? '배치' : '저장 +'}{' '}
              {room ? 'Room ' + (d!.rooms.indexOf(room) + 1) : 'Dungeon'}에 추가
            </Button>
          )}
        </div>
      </div>
      {configuration}
      {!ready && (
        <p className="source-notice">
          원문 표가 준비되면 생성할 수 있습니다. 직접 작성과 저장은 가능합니다.
        </p>
      )}
      {kind === 'encounters' && (
        <p className="content-category">
          {
            encounterCategories.find(
              (x) => x.id === (selected as Encounter).category,
            )?.label
          }
        </p>
      )}
      {'unresolved' in selected && selected.unresolved && (
        <p className="source-notice">
          굴림이 원문 표의 1–20 범위를 벗어났습니다. 책에는 이 경우의 처리
          규칙이 없어 직접 판단해야 합니다. 결과를 임의로 바꾸지 않았습니다.
        </p>
      )}
      <div className="content-field-sheet">{fields.map(field)}</div>
      <SourceDisclosure refs={selected.sourceRefs} label={label + ' 출처'} />
      <details
        className="content-extra"
        open={extra}
        onToggle={(e) => setExtra(e.currentTarget.open)}
      >
        <summary>추가 항목 · 직접 작성</summary>
        <div className="content-field-sheet">
          {(kind === 'npcs'
            ? optionalNPCFields
            : [
                { key: 'sign', label: '징후' },
                { key: 'complication', label: '결과 / 변수' },
                { key: 'treasure', label: '보상 / 발견' },
              ]
          ).map(field)}
        </div>
      </details>
      {'participants' in selected && (
        <section className="encounter-participants">
          <div className="section-title">
            <h2>참가자 {selected.participants.length}</h2>
            <Button
              className="btn small"
              onClick={() => setAddingParticipant(!addingParticipant)}
            >
              기존 참가자 연결
            </Button>
          </div>
          <p className="help-line">
            본문에 나온 존재와 보관함의 연결은 별개입니다.
          </p>
          {selected.participants.map((p) => {
            const k = p.kind === 'monster' ? 'monsters' : 'npcs',
              entity = c[k].find((e) => e.id === p.entityId);
            return (
              entity && (
                <div className="participant-row" key={p.id}>
                  <button
                    className="content-entry"
                    onClick={() =>
                      openPlacedContent(c, k, p.entityId, target ?? undefined)
                    }
                  >
                    <strong>
                      {p.quantity} × {entity.name}
                    </strong>
                  </button>
                  <Button
                    className="icon-btn"
                    aria-label={entity.name + ' 참가자 연결 해제'}
                    onClick={() =>
                      edit((e) => {
                        if ('participants' in e)
                          e.participants = e.participants.filter(
                            (x) => x.id !== p.id,
                          );
                      })
                    }
                  >
                    ×
                  </Button>
                </div>
              )
            );
          })}
          {addingParticipant && (
            <div className="participant-picker">
              <label>
                종류
                <select
                  aria-label="참가자 종류"
                  value={participantKind}
                  onChange={(e) => {
                    setParticipantKind(e.target.value as 'monster' | 'npc');
                    setParticipantId('');
                  }}
                >
                  <option value="monster">기존 Monster</option>
                  <option value="npc">기존 NPC</option>
                </select>
              </label>
              <label>
                보관함
                <select
                  aria-label="기존 참가자 선택"
                  value={participantId}
                  onChange={(e) => setParticipantId(e.target.value)}
                >
                  <option value="">선택</option>
                  {(participantKind === 'monster' ? c.monsters : c.npcs).map(
                    (e) => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ),
                  )}
                </select>
              </label>
              <QuantityControl
                value={participantQuantity}
                onChange={setParticipantQuantity}
              />
              <Button
                className="btn"
                disabled={!participantId}
                onClick={() =>
                  safely(() => {
                    edit((e, next) =>
                      addEncounterParticipant(
                        next,
                        e as Encounter,
                        participantKind,
                        participantId,
                        participantQuantity,
                      ),
                    );
                    setAddingParticipant(false);
                    setParticipantId('');
                  })
                }
              >
                참가자 연결
              </Button>
            </div>
          )}
        </section>
      )}
      <section className="content-target">
        <details>
          <summary>배치 위치 선택</summary>
          <div className="content-generation-controls">
            <label>
              던전
              <select
                aria-label={label + ' 배치 던전'}
                value={target?.dungeonId ?? ''}
                onChange={(e) =>
                  chooseTarget(
                    e.target.value
                      ? { dungeonId: e.target.value, roomId: null }
                      : null,
                  )
                }
              >
                <option value="">보관함에만 저장</option>
                {c.dungeons.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
              </select>
            </label>
            {d && (
              <RoomSelector
                dungeon={d}
                value={target?.roomId ?? null}
                onChange={(roomId) => chooseTarget({ dungeonId: d.id, roomId })}
              />
            )}
          </div>
        </details>
        {saved && (
          <ContentPlacementRows
            campaign={c}
            kind={kind}
            entityId={selected.id}
          />
        )}
      </section>
      <details className="content-notes">
        <summary>{label} Notes</summary>
        <Textarea
          rows={4}
          aria-label={label + ' 노트'}
          value={selected.notes}
          onChange={(e) => patch('notes', e.target.value)}
        />
      </details>
      <div className="entity-footer-actions">
        <Button className="btn small" onClick={() => duplicate(selected)}>
          복제
        </Button>
        <Button className="btn small danger" onClick={() => remove(selected)}>
          삭제
        </Button>
      </div>
    </div>
  );
}
