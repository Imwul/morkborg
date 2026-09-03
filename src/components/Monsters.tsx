import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Copy,
  Dices,
  Plus,
  Save,
  Skull,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { Campaign, FieldSpec, Monster, RegionId } from '../domain/types';
import { editCampaign, changeWorkspace } from '../storage/saveStore';
import { useRules } from '../storage/rulesStore';
import {
  addMonsterPlacement,
  beginMonsterDraft,
  cloneMonster,
  deleteMonster,
  saveMonsterDraft,
  validMonsterTarget,
} from '../domain/monsterOperations';
import {
  canRerollMonsterHp,
  usesFeretory,
  generateMonster,
  generateEatPreyKillMonster,
  eatPreyKillCreatures,
  loadMonsterPreset,
  patchMonsterScalar,
  rerollMonsterField,
  rerollMonsterLinked,
  rerollMonsterSpecial,
} from '../generators/monster';
import { regions, regionById } from '../data/regions';
import { id } from '../generators/random';
import { Field } from './Field';
import { CompactCard } from './CompactCard';
import { SourceDisclosure } from './SourceDisclosure';
import { Translation } from './Translation';
import {
  PlacementList,
  QuantityControl,
  RoomSelector,
} from './MonsterAssignments';
import { placementCaption } from './ContentAssignments';
import type { Confirm } from './Library';

export function Monsters({
  campaign: c,
  confirm,
  notify,
}: {
  campaign: Campaign;
  confirm: Confirm;
  notify: (message: string) => void;
}) {
  const rules = useRules(),
    selectedId = c.workspace.selected.monsters,
    draft = c.drafts.monsters;
  const selected =
    c.monsters.find((m) => m.id === selectedId) ??
    (draft?.id === selectedId ? draft : undefined);
  const saved = !!selected && c.monsters.some((m) => m.id === selected.id);
  const target = validMonsterTarget(c, c.workspace.monsterTarget);
  const dungeon = c.dungeons.find((d) => d.id === target?.dungeonId);
  const room = dungeon?.rooms.find((r) => r.id === target?.roomId);
  const generationMode =
    c.workspace.monsterGenerationMode ??
    (selected?.generation?.system === 'feretory' ? 'tma' : 'epk');
  const generationRegion =
    c.workspace.monsterRegion ??
    selected?.region ??
    dungeon?.region ??
    'sarkash';
  const epkAvailable = eatPreyKillCreatures(generationRegion).length > 0;
  const generatorReady =
    !!rules.pack && (generationMode === 'tma' || epkAvailable);
  const [showEmpty, setShowEmpty] = useState(false);
  const [quantity, setQuantity] = useState(1),
    [placementNotes, setPlacementNotes] = useState('');
  const presets =
    rules.pack?.creatures.filter(
      (r) => typeof r.hp === 'number' && r.presetEligible !== false,
    ) ?? [];
  const select = (monsterId: string | null) =>
    changeWorkspace(c.id, {
      section: 'monsters',
      selected: { ...c.workspace.selected, monsters: monsterId },
    });
  const create = () =>
    editCampaign(c.id, (next) =>
      beginMonsterDraft(next, undefined, !rules.pack),
    );
  const edit = (action: (m: Monster) => void) => {
    if (!selected) return;
    editCampaign(c.id, (next) => {
      const m =
        next.monsters.find((m) => m.id === selected.id) ??
        (next.drafts.monsters?.id === selected.id
          ? next.drafts.monsters
          : null);
      if (m) action(m);
    });
  };
  function remove(m: Monster) {
    const count = c.monsterPlacements.filter(
      (p) => p.monsterId === m.id,
    ).length;
    confirm(
      `${m.name || '이 몬스터'}를 삭제할까요?`,
      `이 몬스터는 ${count}곳에 배치되어 있습니다. 삭제하면 모든 배치와 몬스터 메모도 제거됩니다.`,
      () => editCampaign(c.id, (next) => deleteMonster(next, m.id)),
    );
  }
  function duplicate(m: Monster) {
    editCampaign(c.id, (next) => {
      const copy = cloneMonster(m, c.id);
      copy.name += ' — copy';
      next.monsters.push(copy);
      next.workspace.selected.monsters = copy.id;
    });
    notify('배치가 없는 독립된 몬스터 복제본을 저장했습니다.');
  }
  function randomize() {
    confirm(
      '몬스터 전체를 다시 굴릴까요?',
      '이름·외형·능력치·공격 피해·욕망·특수능력을 새로 생성합니다. 직접 수정한 생성값은 바뀝니다. 몬스터 노트와 기존 배치는 유지됩니다.',
      () =>
        edit((m) =>
          Object.assign(
            m,
            generationMode === 'epk'
              ? generateEatPreyKillMonster(c.id, generationRegion)
              : generateMonster(c.id),
            {
              id: m.id,
              createdAt: m.createdAt,
              notes: m.notes,
            },
          ),
        ),
    );
  }
  function linked(
    key: 'appearance' | 'morale' | 'armor' | 'attack',
    attackId?: string,
  ) {
    confirm(
      'FERETORY의 연동 결과를 다시 굴릴까요?',
      '같은 A/B/C 주사위로 외형·사기·방어구·피해와 HP를 정합니다. 선택한 항목과 연결된 자동값을 갱신하며, 이름과 다른 직접 수정값은 유지합니다. 공격명은 직접 작성합니다.',
      () => edit((m) => rerollMonsterLinked(m, key, attackId)),
    );
  }
  function scalar(spec: FieldSpec, roll?: () => void) {
    if (!selected) return null;
    return (
      <Field
        key={spec.key}
        spec={spec}
        value={
          (selected as unknown as Record<string, string | number>)[spec.key] ??
          ''
        }
        source={selected.sources?.[spec.key]}
        onChange={(value, source) =>
          edit((m) => patchMonsterScalar(m, spec.key, value, source))
        }
        onReroll={rules.pack ? roll : undefined}
      />
    );
  }
  function texts(kind: 'special' | 'weakness' | 'loot') {
    if (!selected) return null;
    const label = { special: '특수능력', weakness: '약점', loot: '전리품' }[
      kind
    ];
    return (
      <section
        className={`character-section monster-text-section monster-${kind}`}
      >
        <div className="section-title">
          <h2>{label}</h2>
          <Button
            className="btn small"
            onClick={() =>
              edit((m) =>
                m[kind].push({
                  id: id(),
                  text: '',
                  source: '직접 작성',
                  ...(kind === 'special' ? { tableId: 'feretory.trait' } : {}),
                }),
              )
            }
          >
            <Plus size={14} />
            {label} 추가
          </Button>
        </div>
        <div className="monster-item-grid">
          {selected[kind].map((item, i) => (
            <div className="character-item" key={item.id}>
              <Field
                spec={{ key: item.id, label: `${label} ${i + 1}` }}
                value={item.text}
                source={item.source}
                onChange={(value, source) =>
                  edit((m) => {
                    const t = m[kind].find((t) => t.id === item.id);
                    if (t)
                      Object.assign(t, {
                        text: String(value),
                        source: source ?? '직접 작성',
                      });
                  })
                }
                onReroll={
                  rules.pack &&
                  kind === 'special' &&
                  item.tableId === 'feretory.trait'
                    ? () => edit((m) => rerollMonsterSpecial(m, item.id))
                    : undefined
                }
              />
              <Button
                className="btn ghost small danger"
                aria-label={`${label} ${i + 1} 삭제`}
                onClick={() =>
                  edit((m) => {
                    m[kind] = m[kind].filter((t) => t.id !== item.id);
                  })
                }
              >
                <Trash2 size={13} />
                항목 삭제
              </Button>
            </div>
          ))}
        </div>
        {!selected[kind].length && (
          <p className="empty-copy">
            {kind === 'special'
              ? '기록된 특수능력이 없습니다.'
              : '확인된 전용 생성표가 없어 직접 기록합니다.'}
          </p>
        )}
      </section>
    );
  }
  const generationControls = (
    <div className="monster-generation-controls">
      <label>
        생성 방식
        <select
          aria-label="몬스터 생성 방식"
          value={generationMode}
          onChange={(e) =>
            changeWorkspace(c.id, {
              monsterGenerationMode: e.target.value as 'epk' | 'tma',
            })
          }
        >
          <option value="epk">Eat Prey Kill · 지역 생물</option>
          <option value="tma">The Monster Approaches · 괴물 생성</option>
        </select>
      </label>
      {generationMode === 'epk' && (
        <label>
          지역
          <select
            aria-label="몬스터 생성 지역"
            value={generationRegion}
            onChange={(e) =>
              changeWorkspace(c.id, {
                monsterRegion: e.target.value as RegionId,
              })
            }
          >
            {regions.map((region) => (
              <option key={region.id} value={region.id}>
                {region.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {generationMode === 'epk' && !epkAvailable && (
        <p>Eat Prey Kill 자료를 갱신하면 지역 생물을 생성할 수 있습니다.</p>
      )}
    </div>
  );
  if (!selected)
    return (
      <>
        <div className="eyebrow">MONSTERS / {c.monsters.length}개 정의</div>
        <div className="page-heading">
          <div>
            <h1>
              어둠 속의 존재들<span className="acid">.</span>
            </h1>
            <p>이름과 능력치를 기록하고, 던전과 방에 머물 자리를 정하세요.</p>
          </div>
          <Button
            className="btn primary"
            onClick={create}
            disabled={!generatorReady}
          >
            <Plus size={16} />새 몬스터
          </Button>
        </div>
        {generationControls}
        {draft && (
          <button className="resume-candidate" onClick={() => select(draft.id)}>
            <Dices size={21} />
            <span>
              저장 전 몬스터 후보
              <strong>{draft.name || '이름 없는 후보'}</strong>
            </span>
            <span>이어서 편집</span>
            <ArrowRight size={17} />
          </button>
        )}
        <div className="character-library monster-library">
          {c.monsters.map((m) => (
            <CompactCard
              key={m.id}
              title={m.name || 'Unnamed Monster'}
              secondary={
                'HP ' + m.hp + ' · Morale ' + (m.morale === '' ? '—' : m.morale)
              }
              metadata={placementCaption(c, 'monsters', m.id)}
              onOpen={() => select(m.id)}
              actions={[
                { label: '복제', onSelect: () => duplicate(m) },
                { label: '삭제', onSelect: () => remove(m), danger: true },
              ]}
            />
          ))}
        </div>
        {!c.monsters.length && (
          <div className="character-empty">
            <Skull size={32} />
            <p>아직 기록된 몬스터가 없습니다.</p>
            <Button className="btn" onClick={create}>
              <Plus size={16} />새 몬스터
            </Button>
          </div>
        )}
      </>
    );
  const isFeretory = usesFeretory(selected);
  return (
    <div className="monster-workbench">
      <button className="back-button" onClick={() => select(null)}>
        <ArrowLeft size={15} />
        모든 몬스터
      </button>
      <div className="page-heading">
        <div>
          <span className={`stamp ${saved ? 'saved' : ''}`}>
            {saved
              ? '저장된 몬스터 · 자동 저장'
              : '생성 후보 · 보관함에 저장되지 않음'}
          </span>
          <h1>{selected.name || '이름 없는 후보'}</h1>
          <Translation text={selected.name} />
          <p>
            HP {selected.hp} · 사기{' '}
            {selected.morale === '' ? '—' : selected.morale} ·{' '}
            {selected.armor || '방어구 미기록'}
          </p>
        </div>
        <div className="actions">
          <Button
            className="btn"
            disabled={!generatorReady}
            onClick={randomize}
          >
            <Dices size={16} />
            몬스터 전체 재굴림
          </Button>
          {!saved && (
            <Button
              className="btn primary"
              onClick={() => {
                editCampaign(c.id, saveMonsterDraft);
                notify('몬스터를 캠페인 보관함에 저장했습니다.');
              }}
            >
              <Save size={16} />
              몬스터 저장
            </Button>
          )}
        </div>
      </div>
      {generationControls}
      <SourceDisclosure label="생성 규칙과 출처">
        {selected.generation?.system === 'epk' ? (
          <>
            <p>
              FERETORY · Eat Prey Kill ·{' '}
              {selected.region && regionById(selected.region).name}. 해당
              지역에서 전투 수치가 명시된 생물을 무작위로 고르고, 책의 능력치와
              특성을 함께 불러옵니다. 수치가 없는 참조 항목은 자동 전투 개체에서
              제외합니다.
            </p>
            <p>{selected.sources?.name}</p>
            <p>
              Sölitary Depths의 일치하는 지역 항목에는 원문 PDF·쪽수 참조를 함께
              보관합니다. Galgenbeck은 Tveland를 참조하며, Grift는 Eat Prey
              Kill의 자체 지역 표를 사용합니다.
            </p>
          </>
        ) : isFeretory ? (
          <p>
            FERETORY · The Monster Approaches. 외형과 능력치는 같은 A/B/C 결과를
            사용합니다. 이름은 기본 룰북 이름표를 사용하며, 공격명·독립
            행동·약점·전리품은 직접 작성합니다.
          </p>
        ) : (
          <p>{selected.sources?.name || '직접 작성한 몬스터입니다.'}</p>
        )}
        {isFeretory && (
          <p>
            공격명과 피해를 분리해 기록합니다. FERETORY The Monster Approaches의
            피해 재굴림은 외형·능력치의 자동값과 연동됩니다.
          </p>
        )}
      </SourceDisclosure>
      {!rules.pack && (
        <p className="source-notice">
          원문 자료를 불러오면 재굴림을 사용할 수 있습니다. 직접 작성과 배치는
          가능합니다.
        </p>
      )}
      {!saved && presets.length > 0 && (
        <details className="sheet-source">
          <summary>책의 개체 직접 선택</summary>
          <label className="preset-select">
            책에 실린 몬스터 불러오기
            <select
              aria-label="룰북 몬스터 선택"
              value=""
              onChange={(e) => {
                const record = presets[Number(e.target.value) - 1];
                if (!record) return;
                confirm(
                  '현재 후보를 원문 몬스터로 바꿀까요?',
                  '선택한 몬스터의 능력치와 특수 규칙 전체를 불러옵니다. 현재 후보의 직접 수정값은 바뀝니다.',
                  () =>
                    edit((m) => {
                      const preset = loadMonsterPreset(c.id, record);
                      Object.assign(m, preset, {
                        id: m.id,
                        createdAt: m.createdAt,
                        notes: [m.notes, preset.notes]
                          .filter(Boolean)
                          .join('\n\n'),
                      });
                    }),
                );
              }}
            >
              <option value="">원문 개체 선택</option>
              {presets.map((p, i) => (
                <option key={i} value={i + 1}>
                  {String(p.name)} —{' '}
                  {p.book === 'feretory'
                    ? 'Eat Prey Kill'
                    : p.book === 'heretic'
                      ? 'HERETIC'
                      : 'MÖRK BORG'}
                </option>
              ))}
            </select>
          </label>
        </details>
      )}
      <div
        className={`monster-sheet codex-sheet ${showEmpty ? 'show-empty' : ''} ${!selected.weakness.length && !selected.loot.length ? 'short-monster' : ''}`}
        aria-label="몬스터 전체 시트"
      >
        <div className="monster-identity-grid">
          {scalar(
            { key: 'name', label: '몬스터 이름' },
            isFeretory
              ? () => edit((m) => rerollMonsterField(m, 'name'))
              : undefined,
          )}
          {scalar({ key: 'concept', label: '종류 / 개념' })}
        </div>
        <div className="monster-stats-grid">
          {scalar(
            {
              key: 'hp',
              label: '몬스터 HP',
              type: 'number',
              min: 0,
              max: 9999,
            },
            canRerollMonsterHp(selected)
              ? () => edit((m) => rerollMonsterField(m, 'hp'))
              : undefined,
          )}
          {scalar(
            { key: 'morale', label: '사기 · Morale', type: 'line' },
            isFeretory ? () => linked('morale') : undefined,
          )}
          {scalar(
            { key: 'armor', label: '방어구' },
            isFeretory ? () => linked('armor') : undefined,
          )}
        </div>
        <section className="character-section">
          <div className="section-title">
            <h2>공격</h2>
            <Button
              className="btn small"
              onClick={() =>
                edit((m) =>
                  m.attacks.push({
                    id: id(),
                    name: '',
                    damage: '',
                    description: '',
                    sources: { name: '직접 작성', damage: '직접 작성' },
                  }),
                )
              }
            >
              <Plus size={14} />
              공격 추가
            </Button>
          </div>
          <div className="monster-item-grid">
            {selected.attacks.map((a, i) => (
              <div className="character-item monster-attack" key={a.id}>
                <div className="section-title">
                  <h3>공격 {i + 1}</h3>
                  {rules.pack &&
                    isFeretory &&
                    a.tableId === 'feretory.stats' && (
                      <Button
                        className="btn small"
                        aria-label={`공격 ${i + 1} 재굴림`}
                        onClick={() => linked('attack', a.id)}
                      >
                        <Dices size={14} />
                        피해 재굴림
                      </Button>
                    )}
                </div>
                {(['name', 'damage', 'description'] as const).map((key) => (
                  <Field
                    key={key}
                    spec={{
                      key,
                      label: `공격 ${i + 1} ${{ name: '이름', damage: '피해', description: '설명' }[key]}`,
                    }}
                    value={a[key]}
                    source={a.sources?.[key]}
                    onChange={(value, source) =>
                      edit((m) => {
                        const t = m.attacks.find((x) => x.id === a.id);
                        if (t) {
                          t[key] = String(value);
                          t.sources = {
                            ...t.sources,
                            [key]: source ?? '직접 작성',
                          };
                        }
                      })
                    }
                  />
                ))}
                <Button
                  className="btn ghost small danger"
                  aria-label={`공격 ${i + 1} 삭제`}
                  onClick={() =>
                    edit((m) => {
                      m.attacks = m.attacks.filter((t) => t.id !== a.id);
                    })
                  }
                >
                  <Trash2 size={13} />
                  공격 삭제
                </Button>
              </div>
            ))}
          </div>
          {!selected.attacks.length && (
            <p className="empty-copy">기록된 공격이 없습니다.</p>
          )}
        </section>
        <div className="monster-identity-grid monster-story">
          {scalar(
            { key: 'appearance', label: '외형' },
            isFeretory ? () => linked('appearance') : undefined,
          )}
          {scalar(
            { key: 'wants', label: '욕망 / 목표' },
            isFeretory
              ? () => edit((m) => rerollMonsterField(m, 'wants'))
              : undefined,
          )}
          {scalar({ key: 'behavior', label: '행동' })}
          {scalar({ key: 'weirdTrait', label: '기이한 특성' })}
          {scalar({ key: 'description', label: '몬스터 설명' })}
        </div>
        {texts('special')}
        {texts('weakness')}
        {texts('loot')}
      </div>
      <Button
        className="btn small"
        aria-pressed={showEmpty}
        onClick={() => setShowEmpty(!showEmpty)}
      >
        {showEmpty ? '빈 항목 접기' : '추가 항목 직접 입력'}
      </Button>
      <section className="monster-target character-section secondary-controls">
        <div className="section-title">
          <h2>현재 배치 대상</h2>
          {dungeon && (
            <button
              className="back-button"
              onClick={() =>
                changeWorkspace(c.id, {
                  section: 'dungeons',
                  dungeonId: dungeon.id,
                  roomId: target?.roomId ?? null,
                  dungeonTab: target?.roomId ? 'rooms' : 'monsters',
                })
              }
            >
              대상으로 돌아가기
              <ArrowRight size={15} />
            </button>
          )}
        </div>
        <div className="placement-controls">
          <label className="placement-location">
            던전
            <select
              aria-label="몬스터 배치 던전"
              value={target?.dungeonId ?? ''}
              onChange={(e) =>
                changeWorkspace(c.id, {
                  monsterTarget: e.target.value
                    ? { dungeonId: e.target.value, roomId: null }
                    : null,
                })
              }
            >
              <option value="">캠페인 보관함에만 저장</option>
              {c.dungeons.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </select>
          </label>
          {dungeon && (
            <RoomSelector
              dungeon={dungeon}
              value={target?.roomId ?? null}
              onChange={(roomId) =>
                changeWorkspace(c.id, {
                  monsterTarget: { dungeonId: dungeon.id, roomId },
                })
              }
            />
          )}
        </div>
        {dungeon && target ? (
          <>
            <p className="target-caption">
              {dungeon.title} /{' '}
              {room
                ? `Room ${dungeon.rooms.indexOf(room) + 1} — ${room.name}`
                : 'Dungeon only'}
            </p>
            <div className="placement-controls">
              <QuantityControl value={quantity} onChange={setQuantity} />
              <label className="placement-note" htmlFor="monster-target-notes">
                배치 메모
                <Textarea
                  id="monster-target-notes"
                  aria-label="새 배치 메모"
                  rows={2}
                  value={placementNotes}
                  onChange={(e) => setPlacementNotes(e.target.value)}
                />
              </label>
            </div>
            <Button
              className="btn primary"
              onClick={() => {
                try {
                  editCampaign(c.id, (next) => {
                    addMonsterPlacement(
                      next,
                      selected.id,
                      target,
                      quantity,
                      placementNotes,
                    );
                    Object.assign(next.workspace, {
                      section: 'dungeons',
                      dungeonId: dungeon.id,
                      roomId: target.roomId,
                      dungeonPreview: false,
                      dungeonTab: target.roomId ? 'rooms' : 'monsters',
                    });
                  });
                  setQuantity(1);
                  setPlacementNotes('');
                  notify('몬스터를 저장하고 선택한 위치에 배치했습니다.');
                } catch (e) {
                  notify(
                    e instanceof Error ? e.message : '배치를 확인해 주세요.',
                  );
                }
              }}
            >
              <Plus size={15} />
              {saved ? '' : '저장 + '}
              {room
                ? `방 ${dungeon.rooms.indexOf(room) + 1}에 배치`
                : '현재 던전에 배치'}
            </Button>
          </>
        ) : (
          <p className="help-line">
            던전을 선택하면 이 몬스터를 배치할 수 있습니다.
          </p>
        )}
      </section>
      <section className="notes-block character-section">
        <label htmlFor="monster-notes" className="eyebrow">
          몬스터 노트
        </label>
        <Textarea
          id="monster-notes"
          aria-label="몬스터 노트"
          value={selected.notes}
          onChange={(e) =>
            edit((m) => patchMonsterScalar(m, 'notes', e.target.value))
          }
          placeholder="정의 자체의 기록. 각 장소의 배치 메모와 별도로 저장됩니다."
        />
      </section>
      {saved && (
        <section className="character-section">
          <div className="section-title">
            <h2>배치된 장소</h2>
          </div>
          <PlacementList
            campaign={c}
            placements={c.monsterPlacements.filter(
              (p) => p.monsterId === selected.id,
            )}
          />
        </section>
      )}
      <div className="danger-zone">
        <Button className="btn" onClick={() => duplicate(selected)}>
          <Copy size={15} />
          몬스터 복제
        </Button>
        <Button className="btn ghost danger" onClick={() => remove(selected)}>
          <Trash2 size={15} />
          몬스터 삭제
        </Button>
      </div>
    </div>
  );
}
