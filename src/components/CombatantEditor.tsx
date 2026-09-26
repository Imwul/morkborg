import { useState } from 'react';
import { combatFormula, integer, type Combatant } from '../domain/combatTool';

/** Drafts remain editable (including a temporarily empty numeric input); commit on blur. */
function Field({
  label,
  value,
  onCommit,
  number,
  nullable,
  min,
  max,
  formula,
  maxLength = 100,
}: {
  label: string;
  value: string | number | null;
  onCommit: (value: string | number | null) => void;
  number?: boolean;
  nullable?: boolean;
  min?: number;
  max?: number;
  formula?: boolean;
  maxLength?: number;
}) {
  const basis = value === null ? '' : String(value);
  const [draft, setDraft] = useState({ basis, text: basis });
  const text = draft.basis === basis ? draft.text : basis;
  function commit(input: HTMLInputElement) {
    try {
      let next: string | number | null = text;
      if (number) {
        if (!text.trim() && !nullable) throw new Error('값을 입력하세요.');
        next =
          !text.trim() && nullable
            ? null
            : integer(Number(text), min ?? -9999, max ?? 9999);
      }
      if (formula) next = text.trim() ? combatFormula(text).notation : '';
      if (!number && !formula && !text.trim())
        throw new Error('값을 입력하세요.');
      if (next !== value) onCommit(next);
      const committed = next === null ? '' : String(next);
      setDraft({ basis: committed, text: committed });
      input.setCustomValidity('');
    } catch (e) {
      input.setCustomValidity(
        e instanceof Error ? e.message : '입력값을 확인하세요.',
      );
      input.reportValidity();
    }
  }
  return (
    <label className="combat-field">
      <span>{label}</span>
      <input
        aria-label={label}
        value={text}
        type={number ? 'number' : 'text'}
        inputMode={number ? 'numeric' : undefined}
        min={number ? (min ?? -9999) : undefined}
        max={number ? (max ?? 9999) : undefined}
        step={number ? 1 : undefined}
        required={!nullable}
        maxLength={maxLength}
        placeholder={nullable ? '—' : formula ? 'd6 / 2d4+1 / 3' : ''}
        onChange={(e) => {
          e.target.setCustomValidity('');
          setDraft({ basis, text: e.target.value });
        }}
        onBlur={(e) => commit(e.currentTarget)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
        }}
      />
    </label>
  );
}
export function CombatantEditor({
  fighter: f,
  onChange,
  onRemove,
  onDuplicate,
  onBroken,
  onSource,
}: {
  fighter: Combatant;
  onChange: (patch: Partial<Combatant>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onBroken: () => void;
  onSource?: () => void;
}) {
  const [noteDraft, setNoteDraft] = useState({ basis: f.notes, text: f.notes });
  const note = noteDraft.basis === f.notes ? noteDraft.text : f.notes;
  const num = (
    label: string,
    key:
      | 'hp'
      | 'maxHp'
      | 'strength'
      | 'agility'
      | 'presence'
      | 'morale'
      | 'omens'
      | 'defencePenalty',
    min?: number,
  ) => (
    <Field
      label={label}
      value={f[key]}
      number
      nullable
      min={min}
      onCommit={(v) => onChange({ [key]: v })}
    />
  );
  return (
    <article
      className="combatant"
      data-combatant-id={f.id}
      data-side={f.side}
      data-inactive={!f.active}
      aria-label={f.name}
    >
      <div className="combatant-heading">
        <Field
          label="이름"
          value={f.name}
          onCommit={(v) => onChange({ name: String(v) })}
        />
        <label className="combat-field">
          <span>진영</span>
          <select
            aria-label="진영"
            value={f.side}
            onChange={(e) =>
              onChange({ side: e.target.value as Combatant['side'] })
            }
          >
            <option value="pc">아군</option>
            <option value="enemy">적</option>
          </select>
        </label>
        <label className="combat-check">
          <input
            type="checkbox"
            checked={f.active}
            onChange={(e) => onChange({ active: e.target.checked })}
          />
          참여
        </label>
      </div>
      <div className="combatant-vitals">
        {num('HP', 'hp')}
        {num('최대 HP', 'maxHp', 1)}
        {num('Morale', 'morale', 0)}
        {num('Omen', 'omens', 0)}
      </div>
      {f.side === 'pc' && (
        <div className="combatant-abilities">
          {num('Strength', 'strength')}
          {num('Agility', 'agility')}
          {num('Presence', 'presence')}
        </div>
      )}
      <div className="combatant-gear">
        <Field
          label="무기 피해"
          value={f.weapon}
          formula
          nullable
          onCommit={(v) => onChange({ weapon: String(v) })}
        />
        <Field
          label="방어구 감소"
          value={f.armor}
          formula
          nullable
          onCommit={(v) => onChange({ armor: String(v), armorTier: null })}
        />
        {num('방어 DR 보정', 'defencePenalty')}
      </div>
      {f.sourceReferenceId && (
        <div className="combat-source">
          <button
            type="button"
            data-combat-return={`source-${f.id}`}
            onClick={onSource}
          >
            생물 원문 ↗
          </button>
          <small>원문에서 복사한 독립 참가자 · 빈 칸은 직접 확인하세요.</small>
          {f.sourceStats && (
            <details>
              <summary>
                원문 능력치{f.weapons?.length ? ' · 공격 선택' : ''}
              </summary>
              <p>
                HP {f.sourceStats.hp || '—'} · 방어구{' '}
                {f.sourceStats.armor || '—'} · 피해{' '}
                {f.sourceStats.damage || '—'}
              </p>
              {!!f.weapons?.length && (
                <label className="combat-field">
                  <span>원문 공격 선택</span>
                  <select
                    aria-label="원문 공격 선택"
                    value={f.weapons.findIndex(
                      (w) => w.name === f.weaponName && w.damage === f.weapon,
                    )}
                    onChange={(e) => {
                      const w = f.weapons![Number(e.target.value)];
                      if (w) onChange({ weaponName: w.name, weapon: w.damage });
                    }}
                  >
                    <option value={-1}>공격 선택 / 직접 수정한 값</option>
                    {f.weapons.map((w, i) => (
                      <option key={i} value={i}>
                        {w.name || `공격 ${i + 1}`} ·{' '}
                        {w.sourceDamage || '피해 미기재'}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <small>
                복합 피해·조건부 방어구·특수 능력은 원문을 확인하고 직접
                반영하세요.
              </small>
            </details>
          )}
        </div>
      )}
      <details className="combatant-options">
        <summary>장비·추가 설정</summary>
        <label className="combat-field">
          <span>방어구 빠른 설정</span>
          <select
            aria-label="방어구 빠른 설정"
            value={f.armorTier ?? 'custom'}
            onChange={(e) => {
              if (e.target.value === 'custom') onChange({ armorTier: null });
              else {
                const tier = Number(e.target.value);
                onChange({
                  armorTier: tier,
                  armor: ['0', 'd2', 'd4', 'd6'][tier],
                  defencePenalty: tier >= 2 ? 2 : 0,
                });
              }
            }}
          >
            <option value="0">없음 · 0</option>
            <option value="1">경갑 · d2</option>
            <option value="2">중갑 · d4 / 방어 DR +2</option>
            <option value="3">중장갑 · d6 / 방어 DR +2</option>
            <option value="custom">직접 설정</option>
          </select>
        </label>
        <small>
          장착 시 빠른 설정입니다. 손상 시 감소 주사위만 직접 고치면 방어 DR
          보정은 유지됩니다.
        </small>
        <label className="combat-field">
          <span>무기 이름</span>
          <input
            aria-label="무기 이름"
            maxLength={100}
            defaultValue={f.weaponName}
            key={f.weaponName}
            onBlur={(e) => {
              if (e.target.value !== f.weaponName)
                onChange({ weaponName: e.target.value });
            }}
          />
        </label>
        <label className="combat-check">
          <input
            type="checkbox"
            checked={f.shield}
            onChange={(e) => onChange({ shield: e.target.checked })}
          />
          방패 · 피해 −1
        </label>
        {f.side === 'enemy' && (
          <div className="combatant-abilities">
            {num('Strength', 'strength')}
            {num('Agility', 'agility')}
            {num('Presence', 'presence')}
          </div>
        )}
        <div className="combat-button-row">
          <button type="button" onClick={onDuplicate}>
            복제
          </button>
          <button type="button" onClick={onRemove}>
            제거
          </button>
        </div>
      </details>
      <label className="combat-field combat-notes">
        <span>상태 메모</span>
        <textarea
          aria-label="상태 메모"
          rows={2}
          maxLength={4000}
          placeholder="마법, 독, 넘어짐, 무기 파손… 자유롭게 기록"
          value={note}
          onChange={(e) =>
            setNoteDraft({ basis: f.notes, text: e.target.value })
          }
          onBlur={() => {
            if (note !== f.notes) onChange({ notes: note });
            setNoteDraft({ basis: note, text: note });
          }}
        />
      </label>
      {f.hp !== null && f.hp <= 0 && (
        <output className="combat-condition">
          {f.side === 'pc' ? (
            f.hp < 0 ? (
              'HP 음수 · Core 기준 사망. 예외는 직접 처리하세요.'
            ) : (
              <>
                <strong>HP 0 · Broken</strong>
                <button type="button" onClick={onBroken}>
                  Broken 표 열기 ↗
                </button>
              </>
            )
          ) : (
            'HP 0 이하 · 전투 참여 여부를 확인하세요.'
          )}
        </output>
      )}
    </article>
  );
}
