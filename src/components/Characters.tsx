import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Copy,
  Dices,
  Minus,
  Plus,
  Save,
  Skull,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type {
  Campaign,
  Character,
  CharacterItem,
  CharacterWeapon,
  FieldSpec,
} from '../domain/types';
import { editCampaign, changeWorkspace } from '../storage/saveStore';
import { useRules } from '../storage/rulesStore';
import { useOracleRegistry } from '../storage/oracleStore';
import {
  cloneCharacter,
  deleteEntity,
  saveCharacterDraft,
} from '../domain/operations';
import {
  abilityKeys,
  generateCharacter,
  isClassless,
  patchCharacterScalar,
  rerollCharacterField,
  rerollCharacterItem,
} from '../generators/character';
import {
  characterClass,
  characterClasses,
  classCreationReady,
  removeCharacterAttachments,
} from '../generators/characterClasses';
import { id } from '../generators/random';
import { Field } from './Field';
import { Translation } from './Translation';
import type { Confirm } from './Library';

type ItemKind =
  | 'weapons'
  | 'equipment'
  | 'traits'
  | 'background'
  | 'classFeatures';
const labels: Record<ItemKind, string> = {
  weapons: '무기',
  equipment: '장비',
  traits: '성향과 외모',
  background: '과거와 버릇',
  classFeatures: '직업 능력',
};
const traitLabels: Record<string, string> = {
  'core.traits': 'Terrible Traits · 성향',
  'core.bodies': 'Broken Bodies · 외모',
  'core.badHabits': 'Bad Habits · 나쁜 버릇',
  'core.troublingTales': 'Troubling Tales · 불길한 과거',
};
const abilityLabels = [
  '근력 · Strength',
  '민첩 · Agility',
  '지각 · Presence',
  '체력 · Toughness',
];
export function Characters({
  campaign: c,
  confirm,
  notify,
}: {
  campaign: Campaign;
  confirm: Confirm;
  notify: (message: string) => void;
}) {
  const rules = useRules();
  useOracleRegistry();
  const selectedId = c.workspace.selected.characters,
    draft = c.drafts.characters;
  const selected =
    c.characters.find((ch) => ch.id === selectedId) ??
    (draft?.id === selectedId ? draft : undefined);
  const saved = !!selected && c.characters.some((ch) => ch.id === selected.id);
  const [mode, setMode] = useState(() => selected?.classId ?? 'classless');
  const classes = characterClasses(),
    ready = classCreationReady();
  const supported =
    !!selected && (isClassless(selected) || !!characterClass(selected));
  const select = (characterId: string | null) =>
    changeWorkspace(c.id, {
      section: 'characters',
      selected: { ...c.workspace.selected, characters: characterId },
    });
  const edit = (action: (ch: Character) => void) => {
    if (selected)
      editCampaign(c.id, (next) => {
        const ch =
          next.characters.find((ch) => ch.id === selected.id) ??
          (next.drafts.characters?.id === selected.id
            ? next.drafts.characters
            : null);
        if (ch) action(ch);
      });
  };
  function create(blank = false) {
    try {
      const next = generateCharacter(c.id, blank, mode);
      editCampaign(c.id, (campaign) => {
        campaign.drafts.characters = next;
        campaign.workspace.selected.characters = next.id;
      });
    } catch (e) {
      notify(e instanceof Error ? e.message : '생성 자료를 확인하세요.');
    }
  }
  function remove(ch: Character) {
    confirm(
      `${ch.name || '이 캐릭터'}를 삭제할까요?`,
      '캐릭터와 해당 메모를 삭제합니다. 던전과 캠페인 기록은 유지됩니다.',
      () =>
        editCampaign(c.id, (next) => deleteEntity(next, 'characters', ch.id)),
    );
  }
  function duplicate(ch: Character) {
    editCampaign(c.id, (next) => {
      const copy = cloneCharacter(ch, c.id);
      copy.name += ' — copy';
      next.characters.push(copy);
      next.workspace.selected.characters = copy.id;
    });
    notify('독립된 캐릭터 복제본을 저장했습니다.');
  }
  function randomize(useMode = mode) {
    const run = () => {
      try {
        const fresh = generateCharacter(c.id, false, useMode);
        edit((ch) => {
          if (!fresh.classId) delete ch.classId;
          Object.assign(ch, fresh, {
            id: ch.id,
            createdAt: ch.createdAt,
            notes: ch.notes,
            status: ch.status,
          });
        });
      } catch (e) {
        notify(e instanceof Error ? e.message : '생성 자료를 확인하세요.');
      }
    };
    if (saved)
      confirm(
        '캐릭터 전체를 다시 굴릴까요?',
        '선택한 직업 방식으로 능력치·장비·배경·직업 능력을 새로 정합니다. 메모와 생존 상태는 유지합니다.',
        run,
      );
    else run();
  }
  const scalar = (spec: FieldSpec, canRoll = true) =>
    selected && (
      <Field
        key={spec.key}
        spec={spec}
        value={
          (selected as unknown as Record<string, string | number>)[spec.key] ??
          ''
        }
        source={
          spec.key === 'className'
            ? selected.classSource
            : selected.sources?.[spec.key]
        }
        onChange={(v, s) =>
          edit((ch) => patchCharacterScalar(ch, spec.key, v, s))
        }
        onReroll={
          rules.pack && canRoll && (supported || spec.key === 'name')
            ? () => edit((ch) => rerollCharacterField(ch, spec.key))
            : undefined
        }
      />
    );
  function items(kind: ItemKind) {
    if (!selected) return null;
    return (
      <section className={`character-sheet-section items-${kind}`}>
        <div className="section-title">
          <h2>{labels[kind]}</h2>
          <Button
            className="icon-btn"
            aria-label={`${labels[kind]} 추가`}
            onClick={() =>
              edit((ch) => {
                const item: CharacterItem = {
                  id: id(),
                  text: '',
                  source: '직접 작성',
                  slot: 'manual',
                };
                if (kind === 'weapons')
                  ch.weapons.push({ ...item, damage: '' });
                else {
                  ch[kind] ??= [];
                  ch[kind]!.push(item);
                }
              })
            }
          >
            <Plus size={15} />
          </Button>
        </div>
        <div className="sheet-items">
          {(selected[kind] ?? []).map((item, i) => (
            <div
              className={`sheet-item ${item.slot === 'classRules' ? 'class-rules' : ''}`}
              key={item.id}
            >
              <Field
                spec={{
                  key: item.id,
                  label:
                    traitLabels[item.tableId ?? ''] ??
                    `${labels[kind]} ${i + 1}`,
                }}
                value={item.text}
                source={item.source}
                onChange={(value) =>
                  edit((ch) => {
                    const target = ch[kind]?.find((x) => x.id === item.id);
                    if (target) {
                      target.text = String(value);
                      target.source = '직접 작성';
                    }
                  })
                }
                onReroll={
                  rules.pack &&
                  supported &&
                  (kind === 'traits' ||
                    (kind === 'equipment' &&
                      ['food', 'container', 'gearA', 'gearB'].includes(
                        item.slot ?? '',
                      )) ||
                    (kind === 'weapons' &&
                      (!item.slot || item.slot === 'startingWeapon')))
                    ? () =>
                        edit((ch) =>
                          rerollCharacterItem(
                            ch,
                            kind as 'weapons' | 'equipment' | 'traits',
                            item.id,
                          ),
                        )
                    : kind === 'background' && item.tableId && ready
                      ? () =>
                          edit((ch) => {
                            rerollCharacterItem(ch, 'background', item.id);
                          })
                      : undefined
                }
              />
              {kind === 'weapons' && (
                <Field
                  spec={{
                    key: 'damage',
                    label: `무기 ${i + 1} 피해`,
                    type: 'line',
                  }}
                  value={(item as CharacterWeapon).damage}
                  source={item.source}
                  onChange={(value) =>
                    edit((ch) => {
                      const weapon = ch.weapons.find((x) => x.id === item.id);
                      if (weapon) weapon.damage = String(value);
                    })
                  }
                />
              )}
              <Button
                className="icon-btn sheet-item-remove"
                aria-label={`${labels[kind]} ${i + 1} 삭제`}
                onClick={() =>
                  edit((ch) => {
                    if (
                      kind === 'traits' ||
                      kind === 'background' ||
                      kind === 'classFeatures'
                    )
                      removeCharacterAttachments(ch, item.id);
                    if (kind === 'weapons')
                      ch.weapons = ch.weapons.filter((x) => x.id !== item.id);
                    else
                      ch[kind] = (ch[kind] ?? []).filter(
                        (x) => x.id !== item.id,
                      );
                  })
                }
              >
                <Trash2 size={12} />
              </Button>
            </div>
          ))}
        </div>
        {!(selected[kind] ?? []).length && (
          <p className="empty-copy">기록 없음 · +로 직접 추가</p>
        )}
      </section>
    );
  }
  const generationOptions = (
    <div className="character-generation-options">
      <span>생성 방식</span>
      <fieldset className="class-mode" aria-label="직업 사용 여부">
        <Button
          className={`btn ${mode === 'classless' ? 'primary' : ''}`}
          aria-pressed={mode === 'classless'}
          onClick={() => setMode('classless')}
        >
          직업 없음 · Classless
        </Button>
        <Button
          className={`btn ${mode !== 'classless' ? 'primary' : ''}`}
          aria-pressed={mode !== 'classless'}
          onClick={() => setMode('random')}
        >
          직업 사용 · Class
        </Button>
      </fieldset>
      {mode !== 'classless' && (
        <label>
          직업
          <select
            aria-label="생성 직업"
            value={mode}
            onChange={(e) => setMode(e.target.value)}
          >
            <option value="random">무작위 직업 · {classes.length}종</option>
            {classes.map((def) => (
              <option key={def.id} value={def.id}>
                {def.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {mode !== 'classless' && !classes.length && (
        <span>
          자료 및 규칙에서 직업 생성표가 포함된 최신 개인 자료 JSON을
          가져오세요.
        </span>
      )}
    </div>
  );
  if (!selected)
    return (
      <>
        <div className="eyebrow">CHARACTERS / {c.characters.length}명 저장</div>
        <div className="page-heading">
          <div>
            <h1>
              남겨진 자들<span className="acid">.</span>
            </h1>
            <p>성향, 장비, 과거까지. 주사위로 한 사람을 불러내세요.</p>
          </div>
        </div>
        <div className="character-generation-bar">
          {generationOptions}
          <Button
            className="btn primary"
            disabled={!ready || (mode !== 'classless' && !classes.length)}
            onClick={() => create()}
          >
            <Dices size={17} />새 캐릭터 생성
          </Button>
          <Button className="btn ghost" onClick={() => create(true)}>
            직접 작성
          </Button>
        </div>
        {!ready && (
          <p className="source-notice">
            개인 자료 JSON을 가져오면 장비·배경·직업까지 자동 생성할 수
            있습니다.
          </p>
        )}
        {draft && (
          <button
            className="resume-candidate"
            onClick={() => {
              setMode(draft.classId ?? 'classless');
              select(draft.id);
            }}
          >
            <Dices size={20} />
            <span>
              저장 전 후보<strong>{draft.name || '이름 없는 후보'}</strong>
            </span>
            <ArrowRight size={17} />
          </button>
        )}
        <div className="character-library">
          {c.characters.map((ch) => (
            <article
              className={`campaign-card character-card ${ch.status === 'dead' ? 'is-dead' : ''}`}
              key={ch.id}
            >
              <div className="card-meta">
                <span>CHARACTER</span>
                <span>{ch.status === 'alive' ? '생존' : '사망'}</span>
              </div>
              <button
                className="card-title"
                onClick={() => {
                  setMode(ch.classId ?? 'classless');
                  select(ch.id);
                }}
              >
                {ch.name || 'Unnamed Character'}
              </button>
              <Translation text={ch.name} />
              <p>{ch.className}</p>
              <Translation text={ch.className} />
              <strong>
                HP {ch.hp} / {ch.maxHp}
              </strong>
              <div className="card-actions">
                <Button
                  className="btn ghost"
                  onClick={() => {
                    setMode(ch.classId ?? 'classless');
                    select(ch.id);
                  }}
                >
                  캐릭터 열기 <ArrowRight size={15} />
                </Button>
                <Button
                  className="icon-btn"
                  aria-label={`${ch.name} 복제`}
                  onClick={() => duplicate(ch)}
                >
                  <Copy size={16} />
                </Button>
                <Button
                  className="icon-btn danger"
                  aria-label={`${ch.name} 삭제`}
                  onClick={() => remove(ch)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </article>
          ))}
        </div>
      </>
    );
  return (
    <div className="character-workbench">
      <button className="back-button" onClick={() => select(null)}>
        <ArrowLeft size={15} /> 모든 캐릭터
      </button>
      <div className="character-generation-bar">
        {generationOptions}
        <Button
          className="btn"
          disabled={!ready || (mode !== 'classless' && !classes.length)}
          onClick={() => randomize()}
        >
          <Dices size={17} />
          캐릭터 전체 재굴림
        </Button>
        {!saved && (
          <Button
            className="btn primary"
            onClick={() => {
              editCampaign(c.id, saveCharacterDraft);
              notify('캐릭터를 보관함에 저장했습니다.');
            }}
          >
            <Save size={16} />
            캐릭터 저장
          </Button>
        )}
      </div>
      <article
        className="character-sheet codex-sheet"
        aria-label="캐릭터 전체 시트"
      >
        <header className="character-sheet-header">
          <span>MÖRK BORG</span>
          <h1>
            Character Sheet<small>캐릭터 시트</small>
          </h1>
          <span>
            {saved ? '기록됨 · 자동 저장' : '주사위가 부른 자 · 생성 후보'}
          </span>
        </header>
        <div className="character-sheet-persona">
          {scalar({ key: 'name', label: 'Name · 이름' })}
          {scalar({ key: 'className', label: 'Class · 직업' }, false)}
          {scalar({ key: 'description', label: 'Description · 묘사' }, false)}
          {items('traits')}
          {items('background')}
          {(selected.classFeatures?.length ?? 0) > 0 && items('classFeatures')}
        </div>
        <aside className="character-sheet-spine">
          <div className="sheet-skull">
            <Skull size={68} strokeWidth={1.2} />
            <span>HIT POINTS</span>
          </div>
          <div className="character-hp-grid">
            {scalar(
              {
                key: 'hp',
                label: '현재 HP',
                type: 'number',
                min: -999,
                max: 9999,
              },
              false,
            )}
            {scalar(
              {
                key: 'maxHp',
                label: '최대 HP',
                type: 'number',
                min: 1,
                max: 9999,
              },
              false,
            )}
          </div>
          <div className="sheet-hp-tools">
            <Button
              className="icon-btn"
              aria-label="현재 HP 1 감소"
              onClick={() =>
                edit((ch) => patchCharacterScalar(ch, 'hp', ch.hp - 1))
              }
            >
              <Minus size={14} />
            </Button>
            <Button
              className="icon-btn"
              aria-label="현재 HP 1 증가"
              onClick={() =>
                edit((ch) => patchCharacterScalar(ch, 'hp', ch.hp + 1))
              }
            >
              <Plus size={14} />
            </Button>
            <Button
              className="icon-btn"
              aria-label="HP 재굴림"
              disabled={!ready || !supported}
              onClick={() => edit((ch) => rerollCharacterField(ch, 'hp'))}
            >
              <Dices size={14} />
            </Button>
          </div>
          {abilityKeys.map((key, i) =>
            scalar({
              key,
              label: abilityLabels[i],
              type: 'number',
              min: -99,
              max: 99,
            }),
          )}
          {scalar({
            key: 'omens',
            label: 'Omens · 징조',
            type: 'number',
            min: 0,
            max: 999,
          })}
          <label className="character-status">
            생존 상태
            <select
              aria-label="캐릭터 상태"
              value={selected.status}
              onChange={(e) =>
                edit((ch) => patchCharacterScalar(ch, 'status', e.target.value))
              }
            >
              <option value="alive">생존</option>
              <option value="dead">사망</option>
            </select>
          </label>
        </aside>
        <div className="character-sheet-kit">
          {items('weapons')}
          {scalar({ key: 'armor', label: 'Armor · 방어구' })}
          {items('equipment')}
          <div className="sheet-resource-row">
            {scalar({
              key: 'silver',
              label: 'Silver · 은화',
              type: 'number',
              min: 0,
              max: 9999999,
            })}
            {scalar({
              key: 'powerUses',
              label: 'Powers · 하루 사용 횟수',
              type: 'number',
              min: 0,
              max: 999,
            })}
          </div>
        </div>
      </article>
      <details className="sheet-source">
        <summary>캐릭터 생성 규칙과 출처</summary>
        <p>
          {selected.classSource} · 직업의 무기·방어구 지시가 기본 굴림보다
          우선합니다. 원문에서 고르도록 한 항목은 앱이 무작위로 선택합니다. Pale
          One의 표기는 최종 능력 보정치에 적용합니다. 전투·능력 사용 때 굴리는
          주사위는 그대로 남깁니다.
        </p>
      </details>
      <section className="notes-block">
        <label htmlFor="character-notes" className="eyebrow">
          캐릭터 노트
        </label>
        <Textarea
          id="character-notes"
          aria-label="캐릭터 노트"
          value={selected.notes}
          onChange={(e) =>
            edit((ch) => patchCharacterScalar(ch, 'notes', e.target.value))
          }
        />
      </section>
      <div className="danger-zone">
        <Button className="btn" onClick={() => duplicate(selected)}>
          <Copy size={15} />
          캐릭터 복제
        </Button>
        <Button className="btn ghost danger" onClick={() => remove(selected)}>
          <Trash2 size={15} />
          캐릭터 삭제
        </Button>
      </div>
    </div>
  );
}
