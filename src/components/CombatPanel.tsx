import { useRef, useState, type RefObject } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { id, rollDie } from '../generators/random';
import {
  actingSide,
  applyAttack,
  changeCombat,
  changeAttackOmen,
  combatFrame,
  integer,
  initiativeSide,
  newCombatant,
  newCombatSession,
  prepareAttack,
  rerollAttackDie,
  resolveCombatMorale,
  secondCombatSide,
  seekCombat,
  sideName,
  startCombatRound,
  type AttackPreview,
  type AttackRequest,
  type CombatDieKey,
  type CombatOmen,
  type CombatSession,
  type CombatSide,
} from '../domain/combatTool';
import { CombatantEditor } from './CombatantEditor';
import { useCombatSession } from './useCombatSession';
import { useReferenceDesk } from './ReferenceContext';

const omenNames: Record<CombatOmen, string> = {
  none: '사용하지 않음',
  maximum: '공격 최대 피해',
  reduce: '받는 피해 d6 감소',
  neutralize: '치명타·실수 무효화',
  difficulty: '이번 판정 DR −4',
};
const ruleLinks = [
  ['rule:core.violence', '전투·선공'],
  ['rule:core.armor-shield', '방어구·방패'],
  ['rule:core.crit-fumble', '치명타·실수'],
  ['rule:core.reaction-morale', '사기'],
  ['rule:core.broken', 'Broken'],
  ['rule:core.omens', 'Omen'],
  ['rule:core.casting', '권능'],
] as const;

export function CombatPanel({
  open,
  onOpenChange,
  launcherRef,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  launcherRef: RefObject<HTMLButtonElement | null>;
}) {
  const store = useCombatSession();
  const frame = combatFrame(store.session);
  const desk = useReferenceDesk();
  const contentRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const resultRef = useRef<HTMLElement>(null);
  const [error, setError] = useState('');
  const [wide, setWide] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [mode, setMode] = useState<'app' | 'manual'>('app');
  const [initiative, setInitiative] = useState('');
  const [first, setFirst] = useState<CombatSide>('pc');
  const [attackerId, setAttackerId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [style, setStyle] = useState<'melee' | 'ranged'>('melee');
  const [dr, setDr] = useState('12');
  const [bonus, setBonus] = useState('0');
  const [manualDice, setManualDice] = useState<
    Partial<Record<CombatDieKey, string>>
  >({});
  const [omen, setOmen] = useState<CombatOmen>('none');
  const [afterOmen, setAfterOmen] = useState<CombatOmen>('neutralize');
  const [afterReduction, setAfterReduction] = useState('');
  const [payerId, setPayerId] = useState('');
  const [breakShield, setBreakShield] = useState(false);
  const [ignoreArmor, setIgnoreArmor] = useState(false);
  const [pending, setPending] = useState<AttackPreview | null>(null);
  const [draftCosts, setDraftCosts] = useState<Record<string, number>>({});
  const [rerollValues, setRerollValues] = useState('');
  const [moraleId, setMoraleId] = useState('');
  const [moraleDice, setMoraleDice] = useState('');
  const [moraleOutcome, setMoraleOutcome] = useState('');
  const [restoreIndex, setRestoreIndex] = useState('');
  const active = frame.fighters.filter((f) => f.active);
  const attacker =
    active.find((f) => f.id === attackerId) ??
    active.find((f) => f.side === actingSide(frame)) ??
    active[0];
  const targets = active.filter((f) => f.side !== attacker?.side);
  const target = targets.find((f) => f.id === targetId) ?? targets[0];
  const pcs = frame.fighters.filter((f) => f.side === 'pc');
  const payer =
    pcs.find((f) => f.id === payerId) ??
    (attacker?.side === 'pc'
      ? attacker
      : target?.side === 'pc'
        ? target
        : pcs[0]);
  const moraleTarget =
    frame.fighters.find((f) => f.id === moraleId && f.morale !== null) ??
    frame.fighters.find((f) => f.side === 'enemy' && f.morale !== null);
  const stale = !!pending && pending.basis !== JSON.stringify(frame);
  function cancelPending() {
    setPending(null);
    setDraftCosts({});
    setError('');
  }
  function run(action: () => void) {
    const invalid = contentRef.current?.querySelector<HTMLInputElement>(
      'input:invalid, select:invalid, textarea:invalid',
    );
    if (invalid) {
      invalid.reportValidity();
      return;
    }
    try {
      action();
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : '판정을 확인하세요.');
      requestAnimationFrame(() =>
        contentRef.current
          ?.querySelector('[data-combat-error]')
          ?.scrollIntoView({ block: 'nearest' }),
      );
    }
  }
  function mutate(action: (session: CombatSession) => CombatSession) {
    store.set(action(store.current.current));
    cancelPending();
  }
  function openRule(referenceId: string) {
    if (!desk?.byId[referenceId]?.available) {
      setError(
        '이 참조의 원문 자료를 먼저 불러오세요. 전투 값은 그대로 유지됩니다.',
      );
      return;
    }
    desk.activate(referenceId);
    onOpenChange(false);
  }
  function add(side: CombatSide) {
    run(() =>
      mutate((s) =>
        changeCombat(s, `${sideName(side)} 추가`, (f) => {
          if (f.fighters.length >= 40)
            throw new Error('한 전투에 40명까지 참가할 수 있습니다.');
          f.fighters.push(
            newCombatant(
              side,
              f.fighters.filter((p) => p.side === side).length + 1,
            ),
          );
        }),
      ),
    );
  }
  function attack() {
    run(() => {
      const request: AttackRequest = {
        attackerId: attacker?.id ?? '',
        targetId: target?.id ?? '',
        style,
        dr: Number(dr),
        bonus: Number(bonus),
        mode,
        dice: mode === 'manual' ? manualDice : {},
        omen,
        omenOwnerId: payer?.id ?? '',
        breakShield,
        ignoreArmor,
        damageOverride: null,
      };
      setPending(
        prepareAttack(
          combatFrame(store.current.current),
          request,
          undefined,
          draftCosts,
        ),
      );
      requestAnimationFrame(() => {
        resultRef.current?.scrollIntoView({ block: 'nearest' });
        resultRef.current?.focus({ preventScroll: true });
      });
    });
  }
  function editRoll() {
    if (!pending) return;
    setMode('manual');
    setManualDice(
      Object.fromEntries(
        pending.dice
          .filter((d) => d.values.length)
          .map((d) => [d.key, d.values.join(',')]),
      ),
    );
    setDraftCosts(pending.extraCosts);
    setPending(null);
  }
  const checkpoints = store.session.moments
    .map((m, index) => ({ ...m, index }))
    .filter((m) => m.checkpoint);
  const firstAvailable = frame.phase === 'setup' || frame.phase === 'second';
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`combat-panel${wide ? ' combat-panel-wide' : ''}`}
        initialFocus={titleRef}
        finalFocus={launcherRef}
      >
        <div ref={contentRef} className="combat-tool">
          <header className="combat-heading">
            <p className="combat-kicker">MÖRK BORG / VIOLENCE</p>
            <DialogTitle ref={titleRef} tabIndex={-1}>
              전투 도구<span>Roll. Bleed. Repeat.</span>
            </DialogTitle>
            <DialogDescription>
              직접 입력하고 판정하세요. 모든 값과 메모는 수정할 수 있습니다.
            </DialogDescription>
            <div className="combat-heading-actions">
              <button type="button" onClick={() => setWide(!wide)}>
                {wide ? '작게 보기' : '넓게 보기'}
              </button>
              <span>이 탭에서 유지 · 새로고침 복원</span>
            </div>
          </header>
          {store.storageError && (
            <p role="alert" className="combat-error">
              {store.storageError}
            </p>
          )}
          <section className="combat-turnbar" aria-label="라운드와 되돌리기">
            <div className="combat-round">
              <strong>
                {frame.phase === 'setup' ? 'READY' : `${frame.round} R`}
              </strong>
              <span>
                {frame.phase === 'setup'
                  ? '전투 준비'
                  : `${frame.phase === 'first' ? '선공' : '후공'} · ${sideName(actingSide(frame))}`}
              </span>
            </div>
            <div className="combat-button-row">
              <button
                type="button"
                disabled={store.session.cursor === 0}
                onClick={() => {
                  store.set(
                    seekCombat(
                      store.current.current,
                      store.current.current.cursor - 1,
                    ),
                  );
                  cancelPending();
                }}
              >
                ↶ 한 작업 되돌리기
              </button>
              <button
                type="button"
                disabled={
                  store.session.cursor >= store.session.moments.length - 1
                }
                onClick={() => {
                  store.set(
                    seekCombat(
                      store.current.current,
                      store.current.current.cursor + 1,
                    ),
                  );
                  cancelPending();
                }}
              >
                다시 적용 ↷
              </button>
            </div>
            <div className="combat-restore">
              <label className="combat-field">
                <span>라운드·차례 시작점</span>
                <select
                  aria-label="복원할 차례"
                  value={restoreIndex}
                  onChange={(e) => setRestoreIndex(e.target.value)}
                >
                  <option value="">복원할 시작점 선택</option>
                  {checkpoints.map((m) => (
                    <option key={m.id} value={m.index}>
                      {m.checkpoint}
                      {m.index > store.session.cursor ? ' · 되돌린 기록' : ''}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                disabled={!restoreIndex}
                onClick={() =>
                  run(() => {
                    store.set(
                      seekCombat(store.current.current, Number(restoreIndex)),
                    );
                    cancelPending();
                  })
                }
              >
                시작점 복원
              </button>
            </div>
          </section>
          <div className="combat-initiative">
            <div className="combat-mode" aria-label="주사위 입력 방식">
              <button
                type="button"
                aria-pressed={mode === 'app'}
                onClick={() => {
                  setMode('app');
                  cancelPending();
                }}
              >
                앱 주사위
              </button>
              <button
                type="button"
                aria-pressed={mode === 'manual'}
                onClick={() => {
                  setMode('manual');
                  cancelPending();
                }}
              >
                실물 값 입력
              </button>
            </div>
            {firstAvailable ? (
              <>
                {mode === 'manual' && (
                  <label className="combat-field">
                    <span>선공 d6</span>
                    <input
                      aria-label="선공 d6"
                      type="number"
                      min={1}
                      max={6}
                      value={initiative}
                      onChange={(e) => setInitiative(e.target.value)}
                    />
                  </label>
                )}
                <button
                  type="button"
                  className="combat-primary"
                  onClick={() =>
                    run(() => {
                      const die =
                        mode === 'app'
                          ? rollDie(6)
                          : integer(Number(initiative), 1, 6);
                      mutate((s) =>
                        startCombatRound(s, initiativeSide(die), die),
                      );
                    })
                  }
                >
                  {frame.round ? '선공 판정 · 다음 라운드' : '선공 판정 · 시작'}
                </button>
                <label className="combat-field">
                  <span>직접 정하기</span>
                  <select
                    aria-label="선공 진영"
                    value={first}
                    onChange={(e) => setFirst(e.target.value as CombatSide)}
                  >
                    <option value="pc">아군 선공</option>
                    <option value="enemy">적 선공</option>
                  </select>
                </label>
                <button
                  type="button"
                  onClick={() =>
                    run(() => mutate((s) => startCombatRound(s, first)))
                  }
                >
                  이 순서로 시작
                </button>
                {frame.round > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      run(() =>
                        mutate((s) =>
                          startCombatRound(s, combatFrame(s).first),
                        ),
                      )
                    }
                  >
                    선공 유지 · 다음 라운드
                  </button>
                )}
              </>
            ) : (
              <button
                type="button"
                className="combat-primary"
                onClick={() => run(() => mutate(secondCombatSide))}
              >
                후공으로 →
              </button>
            )}
          </div>
          <div className="combat-rosters">
            {(['pc', 'enemy'] as const).map((side) => (
              <section
                className="combat-roster"
                key={side}
                aria-label={side === 'pc' ? '내 캐릭터들' : '상대 몬스터들'}
              >
                <header>
                  <h3>
                    <small>{side === 'pc' ? '01' : '02'}</small>
                    {side === 'pc' ? '내 캐릭터들' : '상대 몬스터들'}
                  </h3>
                  <button type="button" onClick={() => add(side)}>
                    + {side === 'pc' ? '아군' : '적'} 추가
                  </button>
                </header>
                {!frame.fighters.some((f) => f.side === side) && (
                  <p className="combat-empty">
                    {side === 'pc'
                      ? '캐릭터를 불러올 필요 없이, 전투에 쓸 값만 적으세요.'
                      : '몬스터마다 피해·방어구·사기를 자유롭게 입력하세요.'}
                  </p>
                )}
                {frame.fighters
                  .filter((f) => f.side === side)
                  .map((f) => (
                    <CombatantEditor
                      key={f.id}
                      fighter={f}
                      onChange={(patch) => {
                        const next = changeCombat(
                          store.current.current,
                          `${f.name} · 값 수정`,
                          (state) => {
                            const who = state.fighters.find(
                              (p) => p.id === f.id,
                            );
                            if (!who) throw new Error('참가자가 없습니다.');
                            Object.assign(who, patch);
                          },
                        );
                        store.set(next);
                      }}
                      onRemove={() =>
                        run(() =>
                          mutate((s) =>
                            changeCombat(s, `${f.name} 제거`, (state) => {
                              state.fighters = state.fighters.filter(
                                (p) => p.id !== f.id,
                              );
                            }),
                          ),
                        )
                      }
                      onDuplicate={() =>
                        run(() =>
                          mutate((s) =>
                            changeCombat(s, `${f.name} 복제`, (state) => {
                              if (state.fighters.length >= 40)
                                throw new Error(
                                  '한 전투에 40명까지 참가할 수 있습니다.',
                                );
                              state.fighters.push({
                                ...structuredClone(f),
                                id: id(),
                                name: `${f.name.slice(0, 90)} 복제`,
                              });
                            }),
                          ),
                        )
                      }
                      onBroken={() => openRule('oracle:core.broken')}
                    />
                  ))}
              </section>
            ))}
          </div>
          <div className="combat-action-layout">
            <section className="combat-action" aria-label="공격과 방어">
              <h3>
                <small>03</small>공격 / 방어
              </h3>
              <p className="combat-hint">
                적을 공격자로 고르면 대상 PC가 방어를 판정합니다. 차례 표시는
                행동을 제한하지 않습니다.
              </p>
              <div className="combat-pair">
                <label className="combat-field">
                  <span>공격자</span>
                  <select
                    aria-label="공격자"
                    value={attacker?.id ?? ''}
                    onChange={(e) => {
                      setAttackerId(e.target.value);
                      cancelPending();
                    }}
                  >
                    <option value="" disabled>
                      선택
                    </option>
                    {active.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} · {sideName(f.side)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="combat-field">
                  <span>대상</span>
                  <select
                    aria-label="대상"
                    value={target?.id ?? ''}
                    onChange={(e) => {
                      setTargetId(e.target.value);
                      cancelPending();
                    }}
                  >
                    <option value="" disabled>
                      선택
                    </option>
                    {targets.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="combat-test-settings">
                <label className="combat-field">
                  <span>판정</span>
                  <select
                    aria-label="공격 방식"
                    value={attacker?.side === 'enemy' ? 'melee' : style}
                    disabled={attacker?.side === 'enemy'}
                    onChange={(e) => {
                      setStyle(e.target.value as 'melee' | 'ranged');
                      cancelPending();
                    }}
                  >
                    <option value="melee">
                      {attacker?.side === 'enemy' ? '방어 · AGI' : '근접 · STR'}
                    </option>
                    <option value="ranged">원거리 · PRE</option>
                  </select>
                </label>
                <label className="combat-field">
                  <span>기본 DR</span>
                  <input
                    aria-label="기본 DR"
                    type="number"
                    min={1}
                    max={99}
                    value={dr}
                    required
                    onChange={(e) => {
                      setDr(e.target.value);
                      cancelPending();
                    }}
                  />
                </label>
                <label className="combat-field">
                  <span>추가 판정 보정</span>
                  <input
                    aria-label="추가 판정 보정"
                    type="number"
                    min={-99}
                    max={99}
                    value={bonus}
                    required
                    onChange={(e) => {
                      setBonus(e.target.value);
                      cancelPending();
                    }}
                  />
                </label>
              </div>
              <p className="combat-hint">
                {attacker?.side === 'enemy'
                  ? `대상의 Agility와 방어 DR 보정(${target?.defencePenalty ?? 0})을 사용합니다.`
                  : '능력 보정 + 추가 보정으로 판정합니다. 특수 공격 DR도 직접 바꿀 수 있습니다.'}
              </p>
              <details
                className="combat-omen"
                open={omen !== 'none' || undefined}
              >
                <summary>Omen · 방패 · 예외 처리</summary>
                <div className="combat-pair">
                  <label className="combat-field">
                    <span>Omen 사용자</span>
                    <select
                      aria-label="Omen 사용자"
                      value={payer?.id ?? ''}
                      onChange={(e) => {
                        setPayerId(e.target.value);
                        cancelPending();
                      }}
                    >
                      <option value="" disabled>
                        아군 선택
                      </option>
                      {pcs.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} · {p.omens}개
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="combat-field">
                    <span>Omen 효과 · 1개</span>
                    <select
                      aria-label="Omen 효과"
                      value={omen}
                      onChange={(e) => {
                        setOmen(e.target.value as CombatOmen);
                        cancelPending();
                      }}
                    >
                      {Object.entries(omenNames).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="combat-check">
                  <input
                    type="checkbox"
                    checked={breakShield}
                    onChange={(e) => {
                      setBreakShield(e.target.checked);
                      cancelPending();
                    }}
                  />
                  대상의 방패를 부수어 이번 공격 피해 무시
                </label>
                <label className="combat-check">
                  <input
                    type="checkbox"
                    checked={ignoreArmor}
                    onChange={(e) => {
                      setIgnoreArmor(e.target.checked);
                      cancelPending();
                    }}
                  />
                  이번 공격은 방어구 감소 무시
                </label>
                <small>
                  Omen과 방패는 결과를 적용할 때만 소비합니다. 굴린 뒤에도
                  아래에서 주사위별 Omen 재굴림을 선택할 수 있습니다.
                </small>
              </details>
              {mode === 'manual' && (
                <fieldset className="combat-manual">
                  <legend>실물 주사위 · 각 눈을 입력</legend>
                  {(
                    [
                      ['test', '판정 d20', '14'],
                      [
                        'damage',
                        `무기 피해 ${attacker?.weapon ?? ''}`,
                        '3 또는 2,3',
                      ],
                      ['armor', `방어구 ${target?.armor ?? ''}`, '1'],
                      ['reduction', 'Omen 감소 d6', '4'],
                    ] as const
                  ).map(([key, label, hint]) => (
                    <label className="combat-field" key={key}>
                      <span>{label}</span>
                      <input
                        aria-label={
                          key === 'test'
                            ? '판정 d20'
                            : key === 'damage'
                              ? '무기 피해 실물 값'
                              : key === 'armor'
                                ? '방어구 실물 값'
                                : 'Omen 감소 실물 값'
                        }
                        inputMode="numeric"
                        placeholder={hint}
                        value={manualDice[key] ?? ''}
                        onChange={(e) => {
                          setManualDice({
                            ...manualDice,
                            [key]: e.target.value,
                          });
                          setPending(null);
                        }}
                      />
                    </label>
                  ))}
                  <small>
                    명중한 공격에만 피해·방어구 값이 필요합니다. 고정값과
                    사용하지 않는 주사위는 비워두세요.
                  </small>
                </fieldset>
              )}
              <button
                type="button"
                className="combat-primary combat-roll"
                disabled={!attacker || !target}
                onClick={attack}
              >
                {mode === 'app' ? '굴려서 판정' : '입력값으로 판정'} →
              </button>
            </section>
            <section
              className="combat-result"
              aria-label="이번 판정"
              ref={resultRef}
              tabIndex={-1}
            >
              <h3>
                <small>04</small>이번 판정
              </h3>
              {pending ? (
                <>
                  <span className="combat-pending-label">
                    미적용 · 값 확인 후 적용하세요
                  </span>
                  {(pending.critical || pending.fumble) && (
                    <div
                      className={`combat-critical${pending.fumble ? ' is-fumble' : ''}`}
                      role="alert"
                      aria-live="assertive"
                    >
                      <strong>
                        {pending.critical ? 'CRITICAL' : 'FUMBLE'}
                        <span>
                          {pending.critical
                            ? '치명타 · 자연 20'
                            : '실수 · 자연 1'}
                        </span>
                      </strong>
                      <p>
                        {pending.freeAttack
                          ? '방어 치명타: PC가 추가 공격을 얻습니다.'
                          : pending.weaponLost
                            ? '공격 실수: 무기가 부서지거나 손에서 벗어납니다.'
                            : '피해 두 배 · 대상 방어구 1단계 손상.'}
                      </p>
                      <b>
                        알림만 표시합니다. 피해·장비·추가 행동은 자동 변경하지
                        않습니다.
                      </b>
                    </div>
                  )}
                  {pending.request.omen === 'neutralize' && (
                    <p className="combat-notice">
                      Omen · 치명타/실수 효과 무효화. 일반 판정으로
                      계산했습니다.
                    </p>
                  )}
                  <p className="combat-verdict">
                    <strong>
                      {pending.hit
                        ? '명중'
                        : pending.request.attackerId &&
                            frame.fighters.find(
                              (f) => f.id === pending.request.attackerId,
                            )?.side === 'enemy'
                          ? '방어 성공'
                          : '빗나감'}
                    </strong>
                    <span>
                      판정 {pending.total} / DR {pending.dr}
                    </span>
                  </p>
                  <div className="combat-dice-results">
                    {pending.dice.map((d) => (
                      <div key={d.key}>
                        <span>
                          {d.label} <code>{d.formula}</code>
                        </span>
                        <strong>{d.total}</strong>
                        <small>
                          {d.values.length ? `[${d.values.join(', ')}] · ` : ''}
                          {d.origin === 'app'
                            ? '앱'
                            : d.origin === 'manual'
                              ? '실물'
                              : d.origin === 'maximum'
                                ? '최대 피해'
                                : '고정값'}
                        </small>
                      </div>
                    ))}
                  </div>
                  <p className="combat-damage">
                    적용할 피해 <strong>{pending.damage}</strong>
                  </p>
                  <details>
                    <summary>피해 직접 수정 · 판정 값 수정</summary>
                    <label className="combat-field">
                      <span>최종 피해 직접 지정</span>
                      <input
                        aria-label="최종 피해 직접 지정"
                        type="number"
                        min={0}
                        max={9999}
                        required
                        defaultValue={pending.damage}
                        key={`${pending.basis}-${pending.damage}`}
                        onBlur={(e) =>
                          run(() => {
                            if (!e.target.value.trim())
                              throw new Error('최종 피해를 입력하세요.');
                            const damage = integer(Number(e.target.value), 0);
                            if (damage !== pending.damage)
                              setPending({
                                ...pending,
                                damage,
                                request: {
                                  ...pending.request,
                                  damageOverride: damage,
                                },
                                messages: [
                                  ...pending.messages.filter(
                                    (t) =>
                                      !t.startsWith('최종 피해 직접 지정:'),
                                  ),
                                  `최종 피해 직접 지정: ${damage}`,
                                ],
                              });
                          })
                        }
                      />
                    </label>
                    <button type="button" onClick={editRoll}>
                      굴린 값 전체를 실물 입력으로 수정
                    </button>
                    <small>
                      치명타 피해, 저항, 마법 등으로 달라진 최종 피해를 직접
                      지정할 수 있습니다.
                    </small>
                  </details>
                  <details className="combat-after-omen">
                    <summary>결과를 본 뒤 Omen 효과 선택</summary>
                    <label className="combat-field">
                      <span>Omen 사용자</span>
                      <select
                        aria-label="결과 후 Omen 사용자"
                        value={payer?.id ?? ''}
                        onChange={(e) => setPayerId(e.target.value)}
                      >
                        {pcs.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} · {p.omens}개
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="combat-field">
                      <span>현재 눈에 적용할 효과</span>
                      <select
                        aria-label="결과 후 Omen 효과"
                        value={afterOmen}
                        onChange={(e) =>
                          setAfterOmen(e.target.value as CombatOmen)
                        }
                      >
                        {Object.entries(omenNames).map(([key, label]) => (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                    {pending.request.mode === 'manual' &&
                      afterOmen === 'reduce' && (
                        <label className="combat-field">
                          <span>피해 감소 d6 · 실물 값</span>
                          <input
                            aria-label="결과 후 Omen 감소 d6"
                            inputMode="numeric"
                            value={afterReduction}
                            onChange={(e) => setAfterReduction(e.target.value)}
                          />
                        </label>
                      )}
                    <button
                      type="button"
                      disabled={stale || !payer}
                      onClick={() =>
                        run(() => {
                          const next = changeAttackOmen(
                            combatFrame(store.current.current),
                            pending,
                            afterOmen,
                            payer?.id ?? '',
                            afterReduction,
                          );
                          setPending(next);
                          setOmen(afterOmen);
                        })
                      }
                    >
                      현재 눈 그대로 효과 계산
                    </button>
                    <small>
                      기존 눈은 유지합니다. 선택한 효과 1개와 재굴림 비용을 결과
                      적용 시 소비합니다. 효과 변경 시 직접 지정한 최종 피해는
                      다시 계산됩니다. 명중 여부가 달라져 실물 피해 값이 더
                      필요하면 ‘굴린 값 전체를 실물 입력으로 수정’에서
                      입력하세요.
                    </small>
                  </details>
                  <details className="combat-reroll">
                    <summary>Omen으로 주사위 재굴림</summary>
                    <label className="combat-field">
                      <span>소비할 아군</span>
                      <select
                        aria-label="재굴림 Omen 사용자"
                        value={payer?.id ?? ''}
                        onChange={(e) => setPayerId(e.target.value)}
                      >
                        {pcs.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} · 남은{' '}
                            {p.omens - (pending.omenCosts[p.id] || 0)}
                          </option>
                        ))}
                      </select>
                    </label>
                    {pending.request.mode === 'manual' && (
                      <label className="combat-field">
                        <span>다시 굴린 실물 값</span>
                        <input
                          aria-label="다시 굴린 실물 값"
                          value={rerollValues}
                          onChange={(e) => setRerollValues(e.target.value)}
                          placeholder="d20: 14 / 2d6: 3,4"
                        />
                      </label>
                    )}
                    <div className="combat-button-row">
                      {pending.dice
                        .filter((d) => d.values.length)
                        .map((d) => (
                          <button
                            type="button"
                            key={d.key}
                            disabled={stale || !payer}
                            onClick={() =>
                              run(() => {
                                setPending(
                                  rerollAttackDie(
                                    combatFrame(store.current.current),
                                    pending,
                                    d.key,
                                    payer?.id ?? '',
                                    pending.request.mode === 'manual'
                                      ? rerollValues
                                      : undefined,
                                  ),
                                );
                                setRerollValues('');
                              })
                            }
                          >
                            {d.label} 재굴림 · Omen 1
                          </button>
                        ))}
                    </div>
                  </details>
                  {!!Object.keys(pending.omenCosts).length && (
                    <p className="combat-notice">
                      적용 시{' '}
                      {Object.entries(pending.omenCosts)
                        .map(
                          ([key, cost]) =>
                            `${frame.fighters.find((f) => f.id === key)?.name}: Omen ${cost}개`,
                        )
                        .join(' / ')}{' '}
                      소비
                    </p>
                  )}
                  {stale && (
                    <p role="alert" className="combat-error">
                      참가자 값이 바뀌었습니다. 현재 값으로 다시 판정하세요.
                    </p>
                  )}
                  <div className="combat-button-row">
                    <button
                      type="button"
                      className="combat-primary"
                      disabled={stale}
                      onClick={() =>
                        run(() => {
                          mutate((s) => applyAttack(s, pending));
                          setOmen('none');
                          setBreakShield(false);
                          setIgnoreArmor(false);
                          setManualDice({});
                        })
                      }
                    >
                      결과 적용 · HP 반영
                    </button>
                    <button type="button" onClick={cancelPending}>
                      취소
                    </button>
                  </div>
                  <details>
                    <summary>계산 내역</summary>
                    <ul>
                      {pending.messages.map((m, i) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  </details>
                </>
              ) : (
                <p className="combat-empty">
                  공격자와 대상을 정해 판정하세요. 결과를 적용하기 전까지 HP는
                  바뀌지 않습니다.
                </p>
              )}
            </section>
          </div>
          {error && (
            <p className="combat-error" role="alert" data-combat-error>
              {error}
            </p>
          )}
          <section className="combat-morale" aria-label="사기 판정">
            <h3>Morale / 사기</h3>
            <p>
              지도자 사망 · 무리 절반 제거 · 단독 적의 HP가 ⅓ 이하일 때
              확인합니다. 메모와 전투 상황을 보고 직접 실행하세요.
            </p>
            <div className="combat-button-row">
              <label className="combat-field">
                <span>사기 대상</span>
                <select
                  aria-label="사기 대상"
                  value={moraleTarget?.id ?? ''}
                  onChange={(e) => setMoraleId(e.target.value)}
                >
                  <option value="" disabled>
                    선택
                  </option>
                  {frame.fighters
                    .filter((f) => f.morale !== null)
                    .map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} · Morale {f.morale}
                      </option>
                    ))}
                </select>
              </label>
              {mode === 'manual' && (
                <>
                  <label className="combat-field">
                    <span>사기 2d6</span>
                    <input
                      aria-label="사기 2d6"
                      value={moraleDice}
                      placeholder="3,4"
                      onChange={(e) => setMoraleDice(e.target.value)}
                    />
                  </label>
                  <label className="combat-field">
                    <span>실패 시 d6</span>
                    <input
                      aria-label="실패한 사기 d6"
                      type="number"
                      min={1}
                      max={6}
                      value={moraleOutcome}
                      onChange={(e) => setMoraleOutcome(e.target.value)}
                    />
                  </label>
                </>
              )}
              <button
                type="button"
                disabled={!moraleTarget}
                onClick={() =>
                  run(() =>
                    mutate((s) =>
                      resolveCombatMorale(
                        s,
                        moraleTarget?.id ?? '',
                        mode === 'manual' ? moraleDice : undefined,
                        mode === 'manual' ? moraleOutcome : undefined,
                      ),
                    ),
                  )
                }
              >
                사기 판정·적용
              </button>
            </div>
            <small>
              실패하면 도주/항복을 메모에 적고 참여를 해제합니다. 한 작업
              되돌리기로 모두 복원할 수 있습니다.
            </small>
          </section>
          {frame.last && (
            <section className="combat-last" aria-label="마지막 처리">
              <h3>마지막 처리</h3>
              <output aria-live="polite">{frame.last}</output>
            </section>
          )}
          <footer className="combat-footer">
            <details>
              <summary>되돌리기 기록 · {store.session.cursor}개 작업</summary>
              <p>
                시작점 복원은 HP·장비·Omen·참가자·메모를 함께 복원합니다. 되돌린
                뒤 새 작업을 하면 이후 갈래는 교체됩니다.
              </p>
              <ol>
                {store.session.moments.map((m, index) => (
                  <li key={m.id} data-current={index === store.session.cursor}>
                    <button
                      type="button"
                      onClick={() =>
                        run(() => {
                          store.set(seekCombat(store.current.current, index));
                          cancelPending();
                        })
                      }
                    >
                      {index === store.session.cursor ? '현재 · ' : ''}
                      {m.label}
                      {index > store.session.cursor ? ' · 되돌린 기록' : ''}
                    </button>
                  </li>
                ))}
              </ol>
            </details>
            <details>
              <summary>짧은 규칙 · 원문 참조</summary>
              <ul>
                <li>
                  근접 Strength / 원거리 Presence / 방어 Agility. 기본 DR12이며
                  직접 변경할 수 있습니다.
                </li>
                <li>
                  PC가 공격과 방어를 굴립니다. 적의 능력 보정은 PC 방어 판정에
                  더하지 않습니다.
                </li>
                <li>
                  피해에서 방어구와 방패 감소를 빼고 0 미만은 0입니다. HP는
                  음수까지 내려갑니다.
                </li>
                <li>
                  치명타·실수는 알림만 표시합니다. 피해 배수와 장비 손상은 직접
                  수정하세요.
                </li>
                <li>
                  상태 메모는 자동 판정에 영향을 주지 않습니다. 해당 효과를
                  DR·보정·장비·피해에 직접 반영하세요.
                </li>
                <li>
                  다른 판정에 Omen을 쓰려면 되돌린 뒤 Omen 수를 수정하고 다시
                  판정할 수 있습니다.
                </li>
              </ul>
              <nav aria-label="전투 규칙 참조">
                {ruleLinks.map(([ref, label]) => (
                  <button type="button" key={ref} onClick={() => openRule(ref)}>
                    {label} ↗
                  </button>
                ))}
              </nav>
              <small>
                Core / Bare Bones pp. 23, 29–32, 37. 전투 값과 되돌리기는 현재
                탭에만 보관됩니다.
              </small>
            </details>
            {resetConfirm ? (
              <div className="combat-reset">
                <p>현재 전투와 되돌리기 기록을 비우고 새로 시작할까요?</p>
                <button
                  type="button"
                  onClick={() => {
                    store.set(newCombatSession(), true);
                    cancelPending();
                    setResetConfirm(false);
                    setRestoreIndex('');
                  }}
                >
                  비우고 새 전투
                </button>
                <button type="button" onClick={() => setResetConfirm(false)}>
                  유지
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="combat-new"
                onClick={() => setResetConfirm(true)}
              >
                새 전투
              </button>
            )}
          </footer>
        </div>
      </DialogContent>
    </Dialog>
  );
}
