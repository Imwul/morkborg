import {
  ArrowLeft,
  ArrowRight,
  Copy,
  Dices,
  Minus,
  Plus,
  Save,
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
import { id } from '../generators/random';
import { Field } from './Field';
import type { Confirm } from './Library';

const abilities: FieldSpec[] = [
  {
    key: 'strength',
    label: '근력 · Strength',
    type: 'number',
    min: -99,
    max: 99,
  },
  {
    key: 'agility',
    label: '민첩 · Agility',
    type: 'number',
    min: -99,
    max: 99,
  },
  {
    key: 'presence',
    label: '지각 · Presence',
    type: 'number',
    min: -99,
    max: 99,
  },
  {
    key: 'toughness',
    label: '체력 · Toughness',
    type: 'number',
    min: -99,
    max: 99,
  },
];
const itemLabels = {
  weapons: '무기',
  equipment: '장비',
  traits: '특성',
} as const;

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
  const selectedId = c.workspace.selected.characters;
  const draft = c.drafts.characters;
  const selected =
    c.characters.find((ch) => ch.id === selectedId) ??
    (draft?.id === selectedId ? draft : undefined);
  const saved = !!selected && c.characters.some((ch) => ch.id === selected.id);
  const select = (characterId: string | null) =>
    changeWorkspace(c.id, {
      section: 'characters',
      selected: { ...c.workspace.selected, characters: characterId },
    });
  const edit = (action: (ch: Character) => void) => {
    if (!selected) return;
    editCampaign(c.id, (next) => {
      const ch =
        next.characters.find((ch) => ch.id === selected.id) ??
        (next.drafts.characters?.id === selected.id
          ? next.drafts.characters
          : null);
      if (ch) action(ch);
    });
  };
  function create() {
    if (draft) {
      select(draft.id);
      return;
    }
    editCampaign(c.id, (next) => {
      next.drafts.characters = generateCharacter(c.id, !rules.pack);
      next.workspace.selected.characters = next.drafts.characters.id;
    });
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
  function randomize() {
    if (!selected) return;
    confirm(
      '캐릭터 전체를 다시 굴릴까요?',
      '이름·직업·능력치·HP·장비·특성을 Classless 규칙으로 새로 생성합니다. 직접 수정한 생성값이 바뀝니다. 메모와 생존 상태는 유지합니다.',
      () =>
        edit((ch) =>
          Object.assign(ch, generateCharacter(c.id), {
            id: ch.id,
            createdAt: ch.createdAt,
            notes: ch.notes,
            status: ch.status,
          }),
        ),
    );
  }
  const roll = (key: string) => edit((ch) => rerollCharacterField(ch, key));
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
        onChange={(value, source) =>
          edit((ch) => patchCharacterScalar(ch, spec.key, value, source))
        }
        onReroll={
          rules.pack &&
          canRoll &&
          (spec.key === 'name' || isClassless(selected))
            ? () => roll(spec.key)
            : undefined
        }
      />
    );
  function items(kind: 'weapons' | 'equipment' | 'traits') {
    if (!selected) return null;
    return (
      <section className="character-section character-items-section">
        <div className="section-title">
          <h2>{itemLabels[kind]}</h2>
          <Button
            className="btn small"
            onClick={() =>
              edit((ch) => {
                const item: CharacterItem = {
                  id: id(),
                  text: '',
                  source: '직접 작성',
                  ...(kind === 'traits'
                    ? { tableId: 'core.traits' }
                    : { slot: 'manual' }),
                };
                if (kind === 'weapons')
                  ch.weapons.push({ ...item, damage: '' });
                else ch[kind].push(item);
              })
            }
          >
            <Plus size={14} />
            {itemLabels[kind]} 추가
          </Button>
        </div>
        <div className="character-item-grid">
          {selected[kind].map((item, index) => (
            <div className="character-item" key={item.id}>
              <Field
                spec={{
                  key: item.id,
                  label: `${itemLabels[kind]} ${index + 1}`,
                }}
                value={item.text}
                source={item.source}
                onChange={(value) =>
                  edit((ch) => {
                    const target = ch[kind].find((x) => x.id === item.id);
                    if (target) {
                      target.text = String(value);
                      target.source = '직접 작성';
                    }
                  })
                }
                onReroll={
                  rules.pack &&
                  (kind === 'traits' || isClassless(selected)) &&
                  (kind !== 'equipment' ||
                    ['food', 'container', 'gearA', 'gearB'].includes(
                      item.slot ?? '',
                    ))
                    ? () => edit((ch) => rerollCharacterItem(ch, kind, item.id))
                    : undefined
                }
              />
              {kind === 'weapons' && (
                <Field
                  spec={{
                    key: 'damage',
                    label: `무기 ${index + 1} 피해`,
                    type: 'line',
                  }}
                  value={(item as CharacterWeapon).damage}
                  source={item.source}
                  onChange={(value) =>
                    edit((ch) => {
                      const target = ch.weapons.find((x) => x.id === item.id);
                      if (target) {
                        target.damage = String(value);
                        target.source = '직접 작성';
                      }
                    })
                  }
                />
              )}
              <Button
                className="btn ghost small"
                aria-label={`${itemLabels[kind]} ${index + 1} 삭제`}
                onClick={() =>
                  edit((ch) => {
                    if (kind === 'weapons')
                      ch.weapons = ch.weapons.filter((x) => x.id !== item.id);
                    else ch[kind] = ch[kind].filter((x) => x.id !== item.id);
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
          <p className="empty-copy">기록된 {itemLabels[kind]}가 없습니다.</p>
        )}
      </section>
    );
  }
  if (!selected)
    return (
      <>
        <div className="eyebrow">CHARACTERS / {c.characters.length}명 저장</div>
        <div className="page-heading">
          <div>
            <h1>
              남겨진 자들<span className="acid">.</span>
            </h1>
            <p>살아 있는 일행과, 돌아오지 못한 이들의 기록.</p>
          </div>
          <Button className="btn primary" onClick={create}>
            <Plus size={16} />새 캐릭터
          </Button>
        </div>
        {draft && (
          <button className="resume-candidate" onClick={() => select(draft.id)}>
            <Dices size={21} />
            <span>
              저장 전 캐릭터 후보
              <strong>{draft.name || '이름 없는 후보'}</strong>
            </span>
            <span>이어서 편집</span>
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
                <span className={`life-status ${ch.status}`}>
                  {ch.status === 'alive' ? '생존' : '사망'}
                </span>
              </div>
              <button className="card-title" onClick={() => select(ch.id)}>
                {ch.name || 'Unnamed Character'}
              </button>
              <p>{ch.className || 'Classless'}</p>
              <strong className="character-card-hp">
                HP {ch.hp} / {ch.maxHp}
              </strong>
              <div className="card-actions">
                <Button className="btn ghost" onClick={() => select(ch.id)}>
                  캐릭터 열기
                  <ArrowRight size={15} />
                </Button>
                <Button
                  className="icon-btn"
                  aria-label={`${ch.name} 복제`}
                  title="복제"
                  onClick={() => duplicate(ch)}
                >
                  <Copy size={16} />
                </Button>
                <Button
                  className="icon-btn danger"
                  aria-label={`${ch.name} 삭제`}
                  title="삭제"
                  onClick={() => remove(ch)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </article>
          ))}
        </div>
        {!c.characters.length && (
          <div className="character-empty">
            <p>아직 캐릭터가 없습니다.</p>
            <Button className="btn" onClick={create}>
              <Plus size={16} />새 캐릭터
            </Button>
          </div>
        )}
      </>
    );
  return (
    <div className="character-workbench">
      <button className="back-button" onClick={() => select(null)}>
        <ArrowLeft size={15} />
        모든 캐릭터
      </button>
      <div className="page-heading">
        <div>
          <span className={`stamp ${saved ? 'saved' : ''}`}>
            {saved
              ? '저장된 캐릭터 · 자동 저장'
              : '생성 후보 · 보관함에 저장되지 않음'}
          </span>
          <h1>{selected.name || '이름 없는 후보'}</h1>
          <p>
            {selected.className} · HP {selected.hp} / {selected.maxHp}
          </p>
        </div>
        <div className="actions">
          <Button className="btn" disabled={!rules.pack} onClick={randomize}>
            <Dices size={16} />
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
      </div>
      <p className="source-notice">
        MÖRK BORG 기본 룰북의 Classless 생성 규칙을 사용합니다. 직업은 직접
        입력할 수 있습니다. 다른 직업의 능력 보정과 특수 규칙은 직접 적용하세요.
      </p>
      {!rules.pack && (
        <p className="source-notice">
          자료 및 규칙에서 원문 자료를 불러오면 재굴림을 사용할 수 있습니다.
          직접 작성은 가능합니다.
        </p>
      )}
      {!isClassless(selected) && (
        <p className="help-line">
          직접 지정한 직업입니다. 이름·특성 외의 재굴림은 Classless에서
          제공됩니다.
        </p>
      )}
      <div className="character-identity-grid">
        {scalar({ key: 'name', label: '캐릭터 이름' })}
        {scalar({ key: 'className', label: '직업 · Class' }, false)}
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
      </div>
      <div className="character-stat-layout">
        <section className="character-section">
          <div className="section-title">
            <h2>HP</h2>
            <Button
              className="btn small"
              disabled={!rules.pack || !isClassless(selected)}
              onClick={() =>
                confirm(
                  'HP를 다시 굴릴까요?',
                  '현재 체력에 d8을 더해 최대 HP와 현재 HP를 함께 다시 정합니다.',
                  () => roll('hp'),
                )
              }
            >
              <Dices size={14} />
              HP 재굴림
            </Button>
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
          <div className="actions">
            <Button
              className="btn small"
              aria-label="현재 HP 1 감소"
              onClick={() =>
                edit((ch) => patchCharacterScalar(ch, 'hp', ch.hp - 1))
              }
            >
              <Minus size={14} />1
            </Button>
            <Button
              className="btn small"
              aria-label="현재 HP 1 증가"
              onClick={() =>
                edit((ch) => patchCharacterScalar(ch, 'hp', ch.hp + 1))
              }
            >
              <Plus size={14} />1
            </Button>
          </div>
          <p className="help-line">
            0 HP가 되어도 생존 상태는 바뀌지 않습니다. 직접 설정한 HP는 다른
            항목을 굴려도 유지됩니다.
          </p>
        </section>
        <section className="character-section">
          <div className="section-title">
            <h2>능력치</h2>
            <Button
              className="btn small"
              disabled={!rules.pack || !isClassless(selected)}
              onClick={() =>
                edit((ch) =>
                  abilityKeys.forEach((key) => rerollCharacterField(ch, key)),
                )
              }
            >
              <Dices size={14} />
              능력치 전체
            </Button>
          </div>
          <div className="character-ability-grid">
            {abilities.map((spec) => scalar(spec))}
          </div>
          <p className="help-line">
            3d6을 능력 보정치로 변환합니다. 자동 최대 HP는 체력과 연동되며, 직접
            설정한 최대 HP는 유지됩니다.
          </p>
        </section>
        <section className="character-section">
          <div className="section-title">
            <h2>자원과 방어구</h2>
          </div>
          <div className="character-hp-grid">
            {scalar({
              key: 'omens',
              label: '징조 · Omens',
              type: 'number',
              min: 0,
              max: 999,
            })}
            {scalar({
              key: 'silver',
              label: '은화 · Silver',
              type: 'number',
              min: 0,
              max: 9999999,
            })}
          </div>
          {scalar({ key: 'armor', label: '방어구' })}
        </section>
      </div>
      {items('weapons')}
      {items('equipment')}
      {items('traits')}
      <section className="character-section">
        {scalar({ key: 'description', label: '캐릭터 묘사' }, false)}
      </section>
      <section className="notes-block character-section">
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
          placeholder="이 캐릭터의 기록. 캠페인과 던전 노트와 별도로 자동 저장됩니다."
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
