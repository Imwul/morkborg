import { useEffect, useRef, useState } from 'react';
import { mythicListsStore } from '../storage/notebookTools';
import {
  mythicListSections,
  resolveMythicList,
  tidyMythicList,
  type MythicListDraw,
  type MythicListKind,
} from '../domain/mythicLists';
import { ReferenceNextSteps } from './ReferenceNextSteps';

export interface ListSelection {
  kind: MythicListKind;
  draw: MythicListDraw;
}
const labels = { characters: '인물', threads: '스레드' };
export function MythicListTables({
  result,
  onRoll,
  onResult,
}: {
  result: ListSelection | null;
  onRoll: (kind: MythicListKind) => void;
  onResult: (value: ListSelection | null) => void;
}) {
  const store = mythicListsStore.use();
  const resultRef = useRef<HTMLOutputElement>(null);
  useEffect(() => {
    if (result)
      resultRef.current?.scrollIntoView({
        block: 'nearest',
        behavior: 'instant',
      });
  }, [result]);
  const [error, setError] = useState('');
  const [manualKind, setManualKind] = useState<MythicListKind>('characters');
  const [sectionDie, setSectionDie] = useState('1');
  const [lineDie, setLineDie] = useState('1');
  function edit(kind: MythicListKind, index: number, text: string) {
    try {
      store.update((lists) => {
        lists[kind][index] = text;
        return lists;
      });
      onResult(null);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장하지 못했습니다.');
    }
  }
  return (
    <section className="mythic-lists" aria-label="Mythic 인물과 스레드 목록">
      <p className="tool-note">
        인물에는 NPC·세력·장소, 스레드에는 추구하는 목표를 적으세요. 같은 항목은
        최대 세 칸까지 적어 등장 비중을 높일 수 있습니다.
      </p>
      {result && (
        <output ref={resultRef} className="list-draw-result" aria-live="polite">
          <small>
            {labels[result.kind]} ·{' '}
            {result.draw.sectionDice
              ? 'd' +
                result.draw.sectionDice +
                ' = ' +
                result.draw.sectionRoll +
                ' / '
              : ''}
            {result.draw.lineRoll ? 'd10 = ' + result.draw.lineRoll : ''}
            {result.draw.slot != null
              ? ' · ' + (result.draw.slot + 1) + '번'
              : ''}
          </small>
          <strong>{result.draw.text}</strong>
          {result.draw.kind === 'choose' && (
            <span>
              아래 목록의 ‘선택’을 누르거나 같은 목록을 다시 굴리세요.
            </span>
          )}
        </output>
      )}
      <div className="mythic-list-columns">
        {(['characters', 'threads'] as const).map((kind) => {
          const sections = mythicListSections(store.value[kind]);
          return (
            <section key={kind} aria-label={labels[kind] + ' 목록'}>
              <header>
                <h3>
                  {kind === 'characters' ? 'Characters' : 'Threads'}
                  <small>{labels[kind]}</small>
                </h3>
                <button onClick={() => onRoll(kind)}>
                  {labels[kind]} 뽑기
                </button>
              </header>
              <p className="list-dice">
                {sections > 1
                  ? '구역 d' + sections * 2 + ' → 행 d10'
                  : sections
                    ? '행 d10'
                    : '비어 있음 · Current Context'}
              </p>
              <ol className="mythic-list-lines">
                {store.value[kind].map((text, i) => (
                  <li
                    key={i}
                    data-list-slot={i + 1}
                    data-selected={
                      result?.kind === kind && result.draw.slot === i
                    }
                    data-section-start={i % 5 === 0}
                  >
                    <label htmlFor={'mythic-' + kind + '-' + i}>
                      <b>{i + 1}</b>
                      <small>
                        {(i % 5) * 2 + 1}–{(i % 5) * 2 + 2}
                      </small>
                    </label>
                    <input
                      id={'mythic-' + kind + '-' + i}
                      aria-label={labels[kind] + ' ' + (i + 1)}
                      value={text}
                      maxLength={160}
                      onChange={(e) => edit(kind, i, e.target.value)}
                    />
                    {result?.kind === kind &&
                      result.draw.kind === 'choose' &&
                      text.trim() && (
                        <button
                          aria-label={text + ' 선택'}
                          onClick={() =>
                            onResult({
                              kind,
                              draw: { kind: 'element', slot: i, text },
                            })
                          }
                        >
                          선택
                        </button>
                      )}
                  </li>
                ))}
              </ol>
              <button
                className="text-action"
                onClick={() => {
                  try {
                    store.update((lists) => {
                      lists[kind] = tidyMythicList(lists[kind]);
                      return lists;
                    });
                    onResult(null);
                    setError('');
                  } catch (e) {
                    setError(String(e));
                  }
                }}
              >
                중복 비중 정리 · 3칸→2칸, 나머지→1칸
              </button>
            </section>
          );
        })}
      </div>
      <details className="list-manual">
        <summary>실물 주사위로 목록 선택</summary>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            try {
              onResult({
                kind: manualKind,
                draw: resolveMythicList(
                  store.value[manualKind],
                  Number(sectionDie),
                  Number(lineDie),
                ),
              });
              setError('');
            } catch (e) {
              setError(e instanceof Error ? e.message : '주사위를 확인하세요.');
            }
          }}
        >
          <label>
            목록
            <select
              value={manualKind}
              onChange={(e) => setManualKind(e.target.value as MythicListKind)}
            >
              <option value="characters">인물</option>
              <option value="threads">스레드</option>
            </select>
          </label>
          {mythicListSections(store.value[manualKind]) > 1 && (
            <label>
              구역 주사위
              <input
                aria-label="목록 구역 주사위"
                type="number"
                value={sectionDie}
                onChange={(e) => setSectionDie(e.target.value)}
                min={1}
                max={mythicListSections(store.value[manualKind]) * 2}
              />
            </label>
          )}
          <label>
            행 d10
            <input
              aria-label="목록 행 주사위"
              type="number"
              value={lineDie}
              onChange={(e) => setLineDie(e.target.value)}
              min={1}
              max={10}
            />
          </label>
          <button>입력값으로 선택</button>
        </form>
      </details>
      <p className="tool-note">
        빈 칸은 CHOOSE입니다. 직접 고르거나 재굴림하세요. 목록 전체가 비었으면
        Current Context를 사용합니다. 삭제한 칸은 자동으로 당겨 채우지 않습니다.
      </p>
      <p className="tool-note">
        목록만 이 기기에 보관됩니다. 장면 기록은 노트에 남기세요. GME2 인쇄
        44–46, 111–113쪽.
      </p>
      <ReferenceNextSteps ids={['rule:mythic.lists']} />
      {(error || store.error) && <p role="alert">{error || store.error}</p>}
    </section>
  );
}
