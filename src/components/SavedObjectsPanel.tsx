import { useEffect, useRef, useState, type RefObject } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  OBJECT_KINDS,
  validateObjectShelf,
  type ObjectKind,
  type SavedObject,
} from '../domain/savedObjects';
import { objectShelfStore } from '../storage/notebookTools';
import { useReferenceDesk } from './ReferenceContext';

const starters: Record<ObjectKind, string> = {
  character: 'procedure:character.core-classless',
  npc: 'procedure:workbench.npc',
  dungeon: 'procedure:sd.dungeon-preparation',
  city: 'procedure:aitc.settlement',
};
export function SavedObjectsPanel({
  open,
  onOpenChange,
  launcherRef,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  launcherRef: RefObject<HTMLButtonElement | null>;
}) {
  const store = objectShelfStore.use(),
    desk = useReferenceDesk();
  const [kind, setKind] = useState<ObjectKind>('character');
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState<SavedObject | null>(null);
  const [deleted, setDeleted] = useState<SavedObject | null>(null);
  const [error, setError] = useState('');
  const file = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const request = (event: Event) => {
      const next = (event as CustomEvent).detail;
      if (typeof next === 'string' && Object.hasOwn(OBJECT_KINDS, next)) {
        setKind(next as ObjectKind);
        setSelected(null);
        setDraft(null);
      }
    };
    window.addEventListener('open-object-shelf', request);
    return () => window.removeEventListener('open-object-shelf', request);
  }, []);

  const item = store.value.objects.find(
    (o) => o.id === selected && o.kind === kind,
  );
  const run = (action: () => void) => {
    try {
      action();
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장하지 못했습니다.');
    }
  };
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setDraft(null);
      }}
    >
      <DialogContent className="object-shelf-panel" finalFocus={launcherRef}>
        <DialogTitle>보관함</DialogTitle>
        <DialogDescription>
          캐릭터 · NPC · 던전 · 도시. 진행 기록은 노트에 남기세요.
        </DialogDescription>
        <nav aria-label="보관 종류">
          {(Object.keys(OBJECT_KINDS) as ObjectKind[]).map((k) => (
            <button
              key={k}
              aria-pressed={kind === k}
              onClick={() => {
                setKind(k);
                setDraft(null);
                setSelected(null);
              }}
            >
              {OBJECT_KINDS[k]}{' '}
              <small>
                {store.value.objects.filter((o) => o.kind === k).length}
              </small>
            </button>
          ))}
        </nav>
        <div className="object-shelf-layout">
          <aside aria-label="저장한 자료">
            <button
              className="shelf-create"
              onClick={() => {
                desk?.activate(starters[kind], false);
                onOpenChange(false);
              }}
            >
              새 {OBJECT_KINDS[kind]} 생성기 열기 ↗
            </button>
            {!store.value.objects.some((o) => o.kind === kind) && (
              <p>생성한 결과에서 ‘보관’을 누르면 여기에 남습니다.</p>
            )}
            {store.value.objects
              .filter((o) => o.kind === kind)
              .map((o) => (
                <button
                  key={o.id}
                  className="saved-object-row"
                  aria-pressed={item?.id === o.id}
                  onClick={() => {
                    setSelected(o.id);
                    setDraft(null);
                  }}
                >
                  {o.name}
                  <small>
                    {new Date(o.updatedAt).toLocaleDateString('ko-KR')}
                  </small>
                </button>
              ))}
          </aside>
          <section aria-label="보관한 자료 읽기">
            {item ? (
              draft ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    run(() => {
                      store.update((s) => ({
                        ...s,
                        objects: s.objects.map((o) =>
                          o.id === draft.id
                            ? { ...draft, updatedAt: new Date().toISOString() }
                            : o,
                        ),
                      }));
                      setDraft(null);
                    });
                  }}
                >
                  <label>
                    이름
                    <input
                      aria-label="보관 이름"
                      maxLength={100}
                      required
                      value={draft.name}
                      onChange={(e) =>
                        setDraft({ ...draft, name: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    내용
                    <textarea
                      aria-label="보관 내용"
                      rows={18}
                      value={draft.text}
                      onChange={(e) =>
                        setDraft({ ...draft, text: e.target.value })
                      }
                    />
                  </label>
                  <button type="submit">수정 저장</button>
                  <button type="button" onClick={() => setDraft(null)}>
                    취소
                  </button>
                </form>
              ) : (
                <>
                  <h3>{item.name}</h3>
                  <div className="shelf-actions">
                    <button onClick={() => setDraft(structuredClone(item))}>
                      이름·내용 수정
                    </button>
                    <button
                      onClick={() =>
                        run(() => {
                          const copy = {
                            ...structuredClone(item),
                            id: crypto.randomUUID(),
                            name: (item.name + ' · 복사').slice(0, 100),
                          };
                          store.update((s) => ({
                            ...s,
                            objects: [copy, ...s.objects],
                          }));
                          setSelected(copy.id);
                        })
                      }
                    >
                      복제
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard
                          .writeText(item.text)
                          .catch(() =>
                            setError(
                              '복사하지 못했습니다. 내용을 직접 선택해 복사하세요.',
                            ),
                          );
                      }}
                    >
                      복사
                    </button>
                    <button
                      onClick={() =>
                        run(() => {
                          store.update((s) => ({
                            ...s,
                            objects: s.objects.filter((o) => o.id !== item.id),
                          }));
                          setDeleted(item);
                          setSelected(null);
                        })
                      }
                    >
                      삭제
                    </button>
                  </div>
                  {item.text !== item.originalText && (
                    <p className="tool-note">
                      사용자가 수정한 내용 · 원본은 출처 안에 보존됩니다.
                    </p>
                  )}
                  <div className="saved-object-text">{item.text}</div>
                  <details>
                    <summary>생성 원본 · 출처</summary>
                    <div className="saved-object-text">{item.sourceText}</div>
                  </details>
                </>
              )
            ) : (
              <p className="tool-note">보관한 자료를 선택하세요.</p>
            )}
          </section>
        </div>
        {deleted && (
          <output className="shelf-delete-feedback">
            삭제했습니다.{' '}
            <button
              onClick={() =>
                run(() => {
                  store.update((s) => ({
                    ...s,
                    objects: [deleted, ...s.objects],
                  }));
                  setSelected(deleted.id);
                  setKind(deleted.kind);
                  setDeleted(null);
                })
              }
            >
              삭제 취소
            </button>
          </output>
        )}
        <footer className="shelf-actions">
          <button
            onClick={() =>
              run(() => {
                const url = URL.createObjectURL(
                  new Blob([JSON.stringify(store.value, null, 2)], {
                    type: 'application/json',
                  }),
                );
                const a = document.createElement('a');
                a.href = url;
                a.download = 'morkborg-objects.json';
                a.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
              })
            }
          >
            보관함 내보내기
          </button>
          <button onClick={() => file.current?.click()}>가져오기</button>
          <input
            hidden
            ref={file}
            aria-label="보관함 파일"
            type="file"
            accept=".json"
            onChange={async (e) => {
              const upload = e.target.files?.[0];
              if (!upload) return;
              try {
                if (upload.size > 10000000)
                  throw new Error('파일은 10MB 이하로 가져오세요.');
                const imported = validateObjectShelf(
                  JSON.parse(await upload.text()),
                );
                store.update((s) => ({
                  ...s,
                  objects: [
                    ...imported.objects.map((o) => ({
                      ...o,
                      id: crypto.randomUUID(),
                    })),
                    ...s.objects,
                  ],
                }));
                setError('');
              } catch (e) {
                setError(
                  e instanceof Error ? e.message : '가져오지 못했습니다.',
                );
              }
              if (file.current) file.current.value = '';
            }}
          />
        </footer>
        {(error || store.error) && <p role="alert">{error || store.error}</p>}
      </DialogContent>
    </Dialog>
  );
}
