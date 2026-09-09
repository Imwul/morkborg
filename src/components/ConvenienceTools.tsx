import { useState } from 'react';
import { Lock, LockOpen, RotateCcw, Plus } from 'lucide-react';
import { id, now } from '../generators/random';
import type { OracleRegistry } from '../domain/oracle';
import type { ReferenceEntry } from '../domain/references';
import type { ReferenceReading } from '../domain/referenceReading';
import { copyReferenceReading } from '../domain/referenceReading';
import {
  holdComponents,
  independentTables,
  recipeRunnable,
} from '../domain/heldReferenceResults';
import {
  referenceAction,
  referenceShortName,
} from '../domain/referenceActions';
import {
  appPolicy,
  authoritiesForReading,
} from '../domain/generationAuthority';
import type {
  ReferenceConvenience,
  ConvenienceTab,
} from './useReferenceConvenience';
import { SourceDisclosure } from './SourceDisclosure';
import { ReferenceReadingText } from './ReferenceReadingText';
import { useReferenceDesk } from './ReferenceContext';
import { DialogTitle, DialogDescription } from '@/components/ui/dialog';

export function PhysicalRollInput({
  entry,
  registry,
  tools,
}: {
  entry: ReferenceEntry;
  registry: OracleRegistry;
  tools: ReferenceConvenience;
}) {
  const tables = independentTables(entry, registry),
    cards =
      entry.action?.kind === 'procedure' &&
      entry.action.procedureId === 'depths.rare-monster';
  if (!tables.length && !cards) return null;
  const expanded = tools.manualId === entry.id,
    values = tools.manualInputs[entry.id] ?? {};
  const update = (key: string, value: string) =>
    tools.setManualInputs((p) => ({
      ...p,
      [entry.id]: { ...p[entry.id], [key]: value },
    }));
  return (
    <details
      className="physical-roll-input"
      open={expanded}
      onToggle={(e) => {
        if (e.currentTarget.open !== expanded)
          tools.setManualId(e.currentTarget.open ? entry.id : null);
      }}
    >
      <summary>ENTER ROLL · 실물 굴림 입력</summary>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          tools.manual(entry);
        }}
      >
        {cards ? (
          <div className="physical-card-entry">
            <label>
              카드 순서 · ♣ ♦ ♥ ♠
              <input
                aria-label="실물 카드"
                value={values.cards ?? ''}
                placeholder="Q♠ 10♥ 2♣ A♦ 7♠"
                onChange={(e) => update('cards', e.target.value)}
              />
            </label>
            <div className="card-input-suits">
              {['♣', '♦', '♥', '♠'].map((suit) => (
                <button
                  type="button"
                  aria-label={`${suit} 입력`}
                  key={suit}
                  onClick={() =>
                    update('cards', (values.cards ?? '').trimEnd() + suit + ' ')
                  }
                >
                  {suit}
                </button>
              ))}
            </div>
            <small>
              다섯 장. 3·4번이 모두 ♠이면 여섯 번째도 입력합니다. 카드 중복은
              허용하지 않습니다.
            </small>
          </div>
        ) : (
          tables.map((table, n) => (
            <label key={n}>
              {table.title} <small>{table.dice}</small>
              <input
                aria-label={`${table.title} 실물 굴림`}
                inputMode={/^d\d+$/.test(table.dice) ? 'numeric' : 'text'}
                value={values[String(n)] ?? ''}
                placeholder={
                  table.dice === 'd66'
                    ? '35 또는 3,5'
                    : table.dice.startsWith('2d') || table.dice.startsWith('3d')
                      ? '각 주사위: 3,4'
                      : table.dice.includes('×')
                        ? '3,5'
                        : '굴린 값'
                }
                onChange={(e) => update(String(n), e.target.value)}
              />
            </label>
          ))
        )}
        <button type="submit">결과 확인</button>
      </form>
      {tools.error && <p role="alert">{tools.error}</p>}
    </details>
  );
}
export function PartialRollControls({
  entry,
  reading,
  registry,
  tools,
  onReroll,
}: {
  entry: ReferenceEntry;
  reading: ReferenceReading;
  registry: OracleRegistry;
  tools: ReferenceConvenience;
  onReroll: (key?: string) => void;
}) {
  const components = holdComponents(entry, reading, registry);
  if (components.length < 2) return null;
  const independent = components.every((c) => c.relation === 'INDEPENDENT');
  return (
    <details
      className="partial-roll-controls"
      open={tools.holdOpen[entry.id] ?? false}
      onToggle={(e) => {
        const opened = e.currentTarget.open;
        if (opened !== (tools.holdOpen[entry.id] ?? false))
          tools.setHoldOpen((p) => ({ ...p, [entry.id]: opened }));
      }}
    >
      <summary>
        {independent ? 'HOLD · 부분 재굴림' : '함께 바뀌는 결과'}
      </summary>
      {independent ? (
        <>
          {components.map((c) => (
            <div key={c.id} className="held-component">
              <span>
                <small>{c.label}</small>
                <b>{c.value}</b>
              </span>
              <button
                aria-label={`${c.label} 고정`}
                aria-pressed={tools.held[entry.id]?.includes(c.id) ?? false}
                onClick={() => tools.toggleHold(entry.id, c.id)}
              >
                {tools.held[entry.id]?.includes(c.id) ? (
                  <Lock size={15} />
                ) : (
                  <LockOpen size={15} />
                )}
              </button>
              <button
                aria-label={`${c.label} 다시 굴리기`}
                disabled={tools.held[entry.id]?.includes(c.id)}
                onClick={() => onReroll(c.id)}
              >
                <RotateCcw size={15} />
              </button>
            </div>
          ))}
          <button onClick={() => onReroll()}>
            고정하지 않은 결과만 재굴림
          </button>
        </>
      ) : (
        <p>
          원문에서 연결된 결과입니다. 부분 고정 없이 전체 절차를 다시
          실행합니다.
        </p>
      )}
    </details>
  );
}
export function PlayTrayStrip({ tools }: { tools: ReferenceConvenience }) {
  const desk = useReferenceDesk();
  if (!tools.temporary.tray.length) return null;
  return (
    <div className="reference-play-tray" aria-label="Play Tray">
      <small>PLAY</small>
      {tools.temporary.tray.map((id) => {
        const entry = desk?.byId[id];
        return entry ? (
          <button
            key={id}
            title={entry.title}
            onClick={() => desk.activate(id, referenceAction(entry).immediate)}
          >
            {referenceShortName(entry)}
          </button>
        ) : (
          <button key={id} onClick={() => tools.setPanel('play')}>
            참조 확인
          </button>
        );
      })}
      <button
        aria-label="Play Tray에 추가"
        onClick={() => tools.setPanel('play')}
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
const labels: Record<ConvenienceTab, string> = {
  play: 'Play',
  recipes: 'Recipes · 조합',
  packs: 'Packs · 모음',
  scratch: 'Scratch · 스크랩',
};
export function ConveniencePanel({ tools }: { tools: ReferenceConvenience }) {
  const desk = useReferenceDesk();
  const [query, setQuery] = useState(''),
    [name, setName] = useState(''),
    [chosen, setChosen] = useState<string[]>([]),
    [editing, setEditing] = useState<string | null>(null),
    [editor, setEditor] = useState(false),
    [copyFailure, setCopyFailure] = useState(''),
    [editingResult, setEditingResult] = useState<number | null>(null),
    [resultText, setResultText] = useState('');
  const tab = tools.panel ?? 'play';
  const found = desk?.search(query, 8) ?? [];
  const reset = () => {
    setEditor(false);
    setEditing(null);
    setName('');
    setChosen([]);
    setQuery('');
    setEditingResult(null);
  };
  const switchTab = (tab: ConvenienceTab) => {
    tools.setPanel(tab);
    tools.setError('');
    reset();
  };
  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyFailure('복사했습니다.');
    } catch {
      setCopyFailure('복사할 텍스트를 선택해 직접 복사하세요.');
    }
  }
  const list =
    tab === 'recipes' ? tools.preferences.recipes : tools.preferences.packs;
  const recipe = tools.preferences.recipes.find((r) => r.id === tools.recipeId),
    results = recipe ? (tools.recipeResults[recipe.id] ?? []) : [];
  function save() {
    if (!name.trim() || !chosen.length) {
      tools.setError('이름과 참조를 선택하세요.');
      return;
    }
    if (!editing && list.length >= 20) {
      tools.setError(
        '최대 20개까지 보관합니다. 기존 항목을 직접 정리한 뒤 추가하세요.',
      );
      return;
    }
    const key = editing ?? id();
    tools.updatePreferences((p) =>
      tab === 'recipes'
        ? {
            ...p,
            recipes: [
              ...p.recipes.filter((r) => r.id !== key),
              {
                id: key,
                name: name.trim().slice(0, 80),
                referenceIds: chosen,
                createdAt:
                  p.recipes.find((r) => r.id === key)?.createdAt ?? now(),
              },
            ],
          }
        : {
            ...p,
            packs: [
              ...p.packs.filter((r) => r.id !== key),
              {
                id: key,
                name: name.trim().slice(0, 80),
                referenceIds: [...new Set(chosen)],
                userCreated: true,
              },
            ],
          },
    );
    tools.setError('');
    reset();
  }
  return (
    <>
      <DialogTitle>PLAY TOOLS</DialogTitle>
      <DialogDescription className="sr-only">
        임시 도구와 개인 조합. 캠페인 기록과 분리됩니다.
      </DialogDescription>
      <nav className="convenience-tabs">
        {Object.entries(labels).map(([key, label]) => (
          <button
            key={key}
            aria-pressed={tab === key}
            onClick={() => switchTab(key as ConvenienceTab)}
          >
            {label}
          </button>
        ))}
      </nav>
      {tools.error && <p role="alert">{tools.error}</p>}
      {tab === 'play' && (
        <section className="convenience-play">
          <p className="convenience-hint">
            지금 쓰는 참조 · 이 탭에서만 유지됩니다.
          </p>
          {tools.temporary.tray.map((id) => {
            const entry = desk?.byId[id];
            return (
              <div className="convenience-index-row" key={id}>
                <button
                  onClick={() =>
                    entry &&
                    desk?.activate(id, referenceAction(entry).immediate)
                  }
                >
                  {entry ? referenceShortName(entry) : '사용할 수 없는 참조'}
                </button>
                <button
                  aria-label={`${entry?.title ?? '참조'} Tray에서 제거`}
                  onClick={() =>
                    tools.updateTemporary((p) => ({
                      ...p,
                      tray: p.tray.filter((x) => x !== id),
                    }))
                  }
                >
                  ×
                </button>
              </div>
            );
          })}
          <button
            className="ref-text-action"
            disabled={!tools.temporary.tray.length}
            onClick={() => tools.updateTemporary((p) => ({ ...p, tray: [] }))}
          >
            Tray 비우기
          </button>
          <label>
            참조 추가
            <input
              aria-label="Tray 참조 검색"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Reaction, Action…"
            />
          </label>
          {query &&
            found.map((entry) => (
              <button
                className="convenience-add-row"
                key={entry.id}
                disabled={tools.temporary.tray.includes(entry.id)}
                onClick={() => tools.addTray(entry.id)}
              >
                + {referenceShortName(entry)}
              </button>
            ))}
          {tools.temporary.lastRoll && (
            <div className="convenience-last">
              <button onClick={() => tools.rerollLast()}>↻ 마지막 굴림</button>
              <button
                onClick={() =>
                  tools.updateTemporary((p) => ({ ...p, lastRoll: null }))
                }
              >
                기억 지우기
              </button>
            </div>
          )}
        </section>
      )}
      {tab === 'scratch' && (
        <section className="convenience-scratch">
          <label>
            임시 스크랩
            <textarea
              aria-label="임시 스크랩"
              maxLength={12000}
              rows={5}
              value={tools.temporary.scratch}
              onChange={(e) =>
                tools.updateTemporary((p) => ({
                  ...p,
                  scratch: e.target.value,
                }))
              }
            />
          </label>
          <div>
            <button onClick={() => copy(tools.temporary.scratch)}>
              COPY ALL
            </button>
            <button
              onClick={() =>
                tools.updateTemporary((p) => ({ ...p, scratch: '' }))
              }
            >
              비우기
            </button>
          </div>
          <small>
            이 탭을 닫으면 사라집니다. 캠페인·내보내기에 포함되지 않습니다.
          </small>
          {copyFailure && <output>{copyFailure}</output>}
        </section>
      )}
      {(tab === 'recipes' || tab === 'packs') && (
        <>
          {tab === 'packs' && (
            <>
              <button
                aria-pressed={!tools.preferences.activePackId}
                onClick={() =>
                  tools.updatePreferences((p) => ({ ...p, activePackId: null }))
                }
              >
                전체 참조
              </button>
              <div className="convenience-pack-list">
                {tools.packs
                  .filter((p) => !p.userCreated)
                  .map((pack) => (
                    <button
                      key={pack.id}
                      aria-pressed={tools.preferences.activePackId === pack.id}
                      onClick={() =>
                        tools.updatePreferences((p) => ({
                          ...p,
                          activePackId: pack.id,
                        }))
                      }
                    >
                      {pack.name}
                    </button>
                  ))}
              </div>
              <p className="convenience-hint">
                Quick Tools만 모음에 맞춥니다. 검색은 항상 전체 자료를 찾습니다.
              </p>
            </>
          )}
          <details
            className="convenience-library"
            open={tab !== 'recipes' || !results.length || editor}
          >
            <summary hidden={tab !== 'recipes'}>
              조합 {list.length} · 선택 / 관리
            </summary>
            <div className="convenience-saved-list">
              {list.map((item) => (
                <div className="convenience-index-row" key={item.id}>
                  <button
                    onClick={() =>
                      tab === 'recipes'
                        ? tools.runRecipe(item.id)
                        : tools.updatePreferences((p) => ({
                            ...p,
                            activePackId: item.id,
                          }))
                    }
                  >
                    {item.name} {tab === 'recipes' ? 'RUN ALL' : '선택'}
                  </button>
                  <details>
                    <summary aria-label={`${item.name} 관리`}>⋯</summary>
                    <button
                      onClick={() => {
                        setEditing(item.id);
                        setName(item.name);
                        setChosen(item.referenceIds);
                        setEditor(true);
                      }}
                    >
                      편집
                    </button>
                    <button
                      onClick={() => {
                        tools.updatePreferences((p) =>
                          tab === 'recipes'
                            ? {
                                ...p,
                                recipes: p.recipes.filter(
                                  (r) => r.id !== item.id,
                                ),
                              }
                            : {
                                ...p,
                                packs: p.packs.filter((r) => r.id !== item.id),
                                activePackId:
                                  p.activePackId === item.id
                                    ? null
                                    : p.activePackId,
                              },
                        );
                        if (tools.recipeId === item.id) tools.setRecipeId(null);
                      }}
                    >
                      삭제
                    </button>
                  </details>
                </div>
              ))}
            </div>
            <button
              className="ref-text-action"
              onClick={() => {
                reset();
                setEditor(true);
              }}
            >
              + {tab === 'recipes' ? '새 Recipe' : '새 Pack'}
            </button>
          </details>
          {editor && (
            <form
              className="convenience-editor"
              onSubmit={(e) => {
                e.preventDefault();
                save();
              }}
            >
              <label>
                이름
                <input
                  aria-label="모음 이름"
                  maxLength={80}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <ol>
                {chosen.map((key, n) => (
                  <li key={n}>
                    <span>
                      {desk?.byId[key]
                        ? referenceShortName(desk.byId[key])
                        : '사용할 수 없는 참조'}
                    </span>
                    <button
                      type="button"
                      aria-label={`항목 ${n + 1} 위로`}
                      disabled={!n}
                      onClick={() =>
                        setChosen((p) => {
                          const copy = [...p];
                          [copy[n - 1], copy[n]] = [copy[n], copy[n - 1]];
                          return copy;
                        })
                      }
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      aria-label={`항목 ${n + 1} 제거`}
                      onClick={() =>
                        setChosen((p) => p.filter((_, i) => i !== n))
                      }
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ol>
              <label>
                참조 찾기
                <input
                  aria-label="조합 참조 검색"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
              {query &&
                found.map((entry) => (
                  <button
                    type="button"
                    className="convenience-add-row"
                    key={entry.id}
                    disabled={
                      chosen.length >= (tab === 'recipes' ? 12 : 60) ||
                      (tab === 'recipes' && !recipeRunnable(entry))
                    }
                    onClick={() => setChosen((p) => [...p, entry.id])}
                  >
                    + {referenceShortName(entry)}
                    {tab === 'recipes' && !recipeRunnable(entry)
                      ? ' · 직접 열기 전용'
                      : ''}
                  </button>
                ))}
              <button type="submit">저장</button>
              <button type="button" onClick={reset}>
                취소
              </button>
            </form>
          )}
          {tab === 'recipes' && recipe && !editor && (
            <section className="recipe-results">
              <h2>{recipe.name}</h2>
              <button onClick={() => tools.runRecipe(recipe.id)}>
                RUN ALL · 고정 제외
              </button>
              {results.map((result, n) => {
                const entry = desk?.byId[result.referenceId],
                  reading = result.reading;
                const update = (change: Partial<typeof result>) =>
                  tools.setRecipeResults((p) => ({
                    ...p,
                    [recipe.id]: (p[recipe.id] ?? []).map((x, i) =>
                      i === n ? { ...x, ...change } : x,
                    ),
                  }));
                return (
                  <article key={n} className="recipe-result">
                    <header>
                      <h3>{entry ? referenceShortName(entry) : '참조 확인'}</h3>
                      <button
                        aria-label={`Recipe 결과 ${n + 1} 고정`}
                        aria-pressed={
                          result.held || result.manualText !== undefined
                        }
                        onClick={() => update({ held: !result.held })}
                        disabled={result.manualText !== undefined}
                      >
                        {result.held || result.manualText !== undefined ? (
                          <Lock size={15} />
                        ) : (
                          <LockOpen size={15} />
                        )}
                      </button>
                      <button
                        aria-label={`Recipe 결과 ${n + 1} 재굴림`}
                        disabled={
                          result.held || result.manualText !== undefined
                        }
                        onClick={() => tools.runRecipe(recipe.id, n)}
                      >
                        <RotateCcw size={15} />
                      </button>
                    </header>
                    {result.error && <p role="alert">{result.error}</p>}
                    {reading &&
                      (result.manualText !== undefined ? (
                        <p className="recipe-manual-text">
                          {result.manualText}
                        </p>
                      ) : (
                        reading.blocks.map((b, i) => (
                          <section key={i}>
                            {b.title && b.title !== entry?.title && (
                              <h4>{b.title}</h4>
                            )}
                            <ReferenceReadingText
                              text={b.text}
                              translation={b.translation?.ko}
                              source={reading.oracle?.rolls[i]}
                            />
                          </section>
                        ))
                      ))}
                    {reading && (
                      <>
                        <div className="recipe-secondary">
                          <SourceDisclosure
                            refs={reading.sourceRefs}
                            authorities={[
                              ...authoritiesForReading(reading),
                              appPolicy('app.reference-recipe'),
                            ]}
                          >
                            {result.manualText !== undefined && (
                              <p>
                                Originally generated from the source above.
                                Edited manually. · 원래 생성 출처입니다. 현재
                                문구는 직접 수정했습니다.
                              </p>
                            )}
                          </SourceDisclosure>
                          <details className="recipe-more">
                            <summary
                              aria-label={`Recipe 결과 ${n + 1} 추가 동작`}
                            >
                              ⋯
                            </summary>
                            <button
                              onClick={() =>
                                tools.scratch(
                                  result.manualText ??
                                    copyReferenceReading(reading),
                                )
                              }
                            >
                              스크랩에 추가
                            </button>
                            <button
                              onClick={() =>
                                copy(
                                  result.manualText ??
                                    copyReferenceReading(reading),
                                )
                              }
                            >
                              COPY
                            </button>
                            <button
                              onClick={() => {
                                setEditingResult(n);
                                setResultText(
                                  result.manualText ??
                                    copyReferenceReading(reading),
                                );
                              }}
                            >
                              직접 수정
                            </button>
                            {result.manualText !== undefined && (
                              <button
                                onClick={() =>
                                  update({ manualText: undefined, held: false })
                                }
                              >
                                원래 결과로 되돌리기
                              </button>
                            )}
                            <button
                              onClick={() => entry && desk?.activate(entry.id)}
                            >
                              참조 열기
                            </button>
                          </details>
                        </div>
                        {editingResult === n && (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              update({ manualText: resultText, held: true });
                              setEditingResult(null);
                            }}
                          >
                            <textarea
                              aria-label="Recipe 결과 수정"
                              value={resultText}
                              onChange={(e) => setResultText(e.target.value)}
                            />
                            <button>적용 · 고정</button>
                            <button
                              type="button"
                              onClick={() => setEditingResult(null)}
                            >
                              취소
                            </button>
                          </form>
                        )}
                      </>
                    )}
                  </article>
                );
              })}
              {copyFailure && <output>{copyFailure}</output>}
            </section>
          )}
        </>
      )}
      <details className="convenience-help">
        <summary>보관 방식 · 단축키</summary>
        <p>
          Recipe·Pack은 개인 환경설정입니다. Tray·스크랩·마지막 굴림은 현재
          탭에서 새로고침까지 유지됩니다. 고정(Pin)과 별개이며 캠페인 JSON에
          들어가지 않습니다.
        </p>
        <p>
          ⌘ / Ctrl K 검색 · R 마지막 굴림. 입력 중에는 R이 작동하지 않습니다.
          실물 모드는 새 입력을 엽니다.
        </p>
        <p>
          모음과 사용자 조합은 APP_POLICY입니다. 원문 절차나 서사 기록을 만들지
          않습니다. 부분 고정·Recipe 결과는 현재 화면 세션에서만 유지합니다.
        </p>
      </details>
    </>
  );
}
