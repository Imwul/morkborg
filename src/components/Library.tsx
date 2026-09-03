import {
  Plus,
  Dices,
  Skull,
  Save,
  ArrowDownToLine,
  Copy,
  Trash2,
  ArrowRight,
  UserRound,
  Swords,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type {
  Campaign,
  Character,
  EntityMap,
  LibraryKind,
  Monster,
} from '../domain/types';
import { entityFields } from '../domain/types';
import { Field } from './Field';
import {
  generateEntity,
  generateEntityRoll,
  canReroll,
  loadPreset,
} from '../generators';
import { editCampaign, changeWorkspace } from '../storage/saveStore';
import { assignEntity, deleteEntity, referenceKey } from '../domain/operations';
import { useRules } from '../storage/rulesStore';
import { id, now } from '../generators/random';
export type Confirm = (
  title: string,
  description: string,
  action: () => void,
) => void;
export const singular: Record<LibraryKind, string> = {
  characters: '캐릭터',
  monsters: '몬스터',
  npcs: 'NPC',
  encounters: '조우',
};
export function Library({
  campaign: c,
  kind,
  confirm,
  notify,
}: {
  campaign: Campaign;
  kind: LibraryKind;
  confirm: Confirm;
  notify: (text: string) => void;
}) {
  const rules = useRules();
  const w = c.workspace;
  const d = c.dungeons.find((d) => d.id === w.dungeonId);
  const room = d?.rooms.find((r) => r.id === w.roomId);
  const region = d?.region ?? 'graven-tosk';
  const selectedId = w.selected[kind];
  const draft = c.drafts[kind];
  const selected =
    c[kind].find((e) => e.id === selectedId) ??
    (draft?.id === selectedId ? draft : null);
  const presets =
    (kind === 'monsters'
      ? rules.pack?.creatures
      : kind === 'npcs'
        ? rules.pack?.outcasts
        : []
    )?.filter((e) => typeof e.hp === 'number') ?? [];
  const saved = !!selected && c[kind].some((e) => e.id === selected.id);
  const category =
    kind === 'encounters' && selected && 'category' in selected
      ? selected.category === 'rare'
        ? 'rare'
        : 'common'
      : 'common';
  function select(entityId: string) {
    changeWorkspace(c.id, { selected: { ...w.selected, [kind]: entityId } });
  }
  function generate(blank = false, cat: 'common' | 'rare' = category) {
    const run = () =>
      editCampaign(c.id, (next) => {
        const value = generateEntity(kind, region, cat, blank);
        Object.assign(next.drafts, { [kind]: value });
        next.workspace.selected[kind] = value.id;
      });
    if (draft)
      confirm(
        '이 생성 결과를 바꿀까요?',
        '직접 수정한 내용을 포함해 현재 미저장 결과가 교체됩니다. 보관함의 항목은 유지됩니다.',
        run,
      );
    else run();
  }
  function patch(key: string, value: string | number, source?: string) {
    if (!selected) return;
    editCampaign(c.id, (next) => {
      const obj =
        next[kind].find((e) => e.id === selected.id) ?? next.drafts[kind];
      if (obj) {
        Object.assign(obj, {
          [key]: value,
          updatedAt: now(),
          sources: { ...obj.sources, [key]: source ?? '직접 작성' },
        });
        if (
          obj.generation &&
          obj.generation.system !== 'preset' &&
          ['appearance', 'hp', 'morale', 'armor', 'damage'].includes(key)
        )
          obj.generation.system = 'feretory-edited';
      }
    });
  }
  function save() {
    if (!selected) return;
    editCampaign(c.id, (next) => {
      if (!next[kind].some((e) => e.id === selected.id)) {
        (next[kind] as Array<EntityMap[LibraryKind]>).push(
          structuredClone(selected),
        );
        next.drafts[kind] = null;
      }
    });
    notify(`${singular[kind]} 저장을 완료했습니다.`);
  }
  function assign() {
    if (!selected || !d || kind === 'characters') return;
    editCampaign(c.id, (next) =>
      assignEntity(next, kind, selected.id, d.id, room?.id ?? null),
    );
    notify(
      `${room ? `방 ${d.rooms.indexOf(room) + 1}` : d.title}에 추가했습니다.`,
    );
  }
  function randomize() {
    if (!selected) return;
    confirm(
      `이 ${singular[kind]}을 다시 굴릴까요?`,
      '생성된 모든 항목을 바꿉니다. 메모와 배치 위치는 유지됩니다.',
      () => {
        const replacement = generateEntity(kind, region, category);
        editCampaign(c.id, (next) => {
          const target =
            next[kind].find((e) => e.id === selected.id) ?? next.drafts[kind];
          if (target)
            Object.assign(target, replacement, {
              id: target.id,
              notes: target.notes,
              createdAt: target.createdAt,
            });
        });
      },
    );
  }
  function duplicate() {
    if (!selected) return;
    editCampaign(c.id, (next) => {
      const copy = {
        ...structuredClone(selected),
        id: id(),
        name: (selected.name || 'Untitled') + ' — copy',
        createdAt: now(),
        updatedAt: now(),
      };
      (next[kind] as Array<EntityMap[LibraryKind]>).push(copy);
      next.workspace.selected[kind] = copy.id;
    });
    notify('복제본을 캠페인에 추가했습니다.');
  }
  const title =
    kind === 'characters'
      ? '운명을 걸어라'
      : kind === 'monsters'
        ? '어둠 속의 존재들'
        : kind === 'npcs'
          ? '낯선 자와 거짓말쟁이'
          : '불행은 찾아온다';
  const Icon =
    kind === 'monsters'
      ? Skull
      : kind === 'characters' || kind === 'npcs'
        ? UserRound
        : Swords;
  const sections = kind === 'encounters' || kind === 'npcs';
  return (
    <>
      <div className="eyebrow">
        {kind === 'characters'
          ? '일행'
          : sections
            ? '던전 채우기'
            : '괴물 도감'}{' '}
        / {c[kind].length}개 저장
      </div>
      <div className="page-heading">
        <div>
          <h1>
            {title}
            <span className="acid">.</span>
          </h1>
          <p>
            {kind === 'characters'
              ? '얼마 없는 은화, 몇 번의 징조. 그리고 짧은 여생.'
              : sections
                ? '우연한 만남, 불길한 징조, 열지 말아야 할 문.'
                : '어둠에 이름을 붙이고, 머물 곳을 정하세요.'}
          </p>
        </div>
        <div className="actions">
          <Button className="btn" onClick={() => generate(true)}>
            <Plus size={15} /> {singular[kind]} 직접 작성
          </Button>
          <Button
            className="btn primary"
            disabled={!rules.pack}
            onClick={() => generate()}
          >
            <Dices size={16} /> {singular[kind]} 생성
          </Button>
        </div>
      </div>
      {sections && (
        <div className="stock-tabs">
          <Button
            className={`tab ${kind === 'encounters' ? 'active' : ''}`}
            onClick={() =>
              changeWorkspace(c.id, { stockingKind: 'encounters' })
            }
          >
            조우 <span>{c.encounters.length}</span>
          </Button>
          <Button
            className={`tab ${kind === 'npcs' ? 'active' : ''}`}
            onClick={() => changeWorkspace(c.id, { stockingKind: 'npcs' })}
          >
            NPC <span>{c.npcs.length}</span>
          </Button>
          {kind === 'encounters' && (
            <div className="category-controls">
              <Button
                className="btn small"
                disabled={!rules.pack}
                onClick={() => generate(false, 'common')}
              >
                일반 조우
              </Button>
              <Button
                className="btn small"
                disabled={!rules.pack}
                onClick={() => generate(false, 'rare')}
              >
                희귀 조우
              </Button>
            </div>
          )}
        </div>
      )}
      {presets.length > 0 && (
        <label className="preset-select">
          책에 실린 개체 불러오기
          <select
            aria-label="룰북 개체 선택"
            value=""
            onChange={(e) => {
              if (!e.target.value) return;
              const record = presets[Number(e.target.value) - 1];
              if (!record || (kind !== 'monsters' && kind !== 'npcs')) return;
              const run = () =>
                editCampaign(c.id, (next) => {
                  const value = loadPreset(kind, record);
                  Object.assign(next.drafts, { [kind]: value });
                  next.workspace.selected[kind] = value.id;
                });
              if (draft)
                confirm(
                  '미저장 결과를 교체할까요?',
                  '선택한 책의 고정 개체를 불러옵니다.',
                  run,
                );
              else run();
            }}
          >
            <option value="">원문 능력치 그대로 불러오기</option>
            {presets.map((e, i) => (
              <option key={i} value={i + 1}>
                {String(e.name)} —{' '}
                {e.book === 'heretic' ? 'HERETIC' : 'MÖRK BORG'}
              </option>
            ))}
          </select>
        </label>
      )}
      {!rules.pack && (
        <p className="source-notice">
          자료 및 규칙에서 개인 룰북 자료를 불러오면 생성 기능을 사용할 수
          있습니다. 직접 작성과 캠페인 편집은 계속 가능합니다.
        </p>
      )}
      <div className="source-notice">
        {kind === 'monsters'
          ? 'FERETORY · The Monster Approaches. A/B/C의 주사위로 외형과 수치를 함께 정합니다. 부분 재굴림은 선택한 항목만 바꾸며, 방어구 동률은 심판이 선택합니다.'
          : kind === 'characters'
            ? 'MÖRK BORG 기본 룰북 · 실제 시작 장비와 능력치 표를 사용합니다.'
            : 'Sölitary Defilement / Depths / RECLVSE · 원문 표의 결과를 조합합니다. 사선(/)으로 나뉜 표현은 원문의 선택지입니다.'}
      </div>
      <div className="library-layout">
        <aside className="library-list">
          <div className="list-heading">
            캠페인 보관함{' '}
            <span>{c[kind].length.toString().padStart(2, '0')}</span>
          </div>
          {draft && (
            <button
              className={`entity-row draft-row ${selectedId === draft.id ? 'selected' : ''}`}
              onClick={() => select(draft.id)}
            >
              <span className="eyebrow">저장하지 않은 결과</span>
              <strong>{draft.name || `이름 없는 ${singular[kind]}`}</strong>
              <span>새로 생성할 때까지 유지됩니다.</span>
            </button>
          )}
          {c[kind].map((e, i) => (
            <button
              key={e.id}
              className={`entity-row ${selectedId === e.id ? 'selected' : ''}`}
              onClick={() => select(e.id)}
            >
              <span className="entity-number">
                {String(i + 1).padStart(2, '0')}
              </span>
              <strong>{e.name || `이름 없는 ${singular[kind]}`}</strong>
              <span>
                {'hp' in e
                  ? `${e.hp} HP`
                  : 'category' in e
                    ? e.category === 'rare'
                      ? '희귀 조우'
                      : '일반 조우'
                    : ''}
                {'status' in e
                  ? ` · ${e.status === 'alive' ? '생존' : '사망'}`
                  : ''}
              </span>
            </button>
          ))}
          {c[kind].length === 0 && (
            <p className="list-empty">
              보관함이 비어 있습니다.
              <br />
              저장한 {singular[kind]} 항목이 여기에 표시됩니다.
            </p>
          )}
        </aside>
        {selected ? (
          <article className="entity-detail" key={selected.id}>
            <div className="artifact-head">
              <span className={`stamp ${saved ? 'saved' : ''}`}>
                {saved
                  ? '캠페인에 저장됨'
                  : '생성 결과 · 보관함에 저장되지 않음'}
              </span>
              <div className="actions">
                <Button
                  className="icon-btn"
                  aria-label={`${singular[kind]} 복제`}
                  title="보관함에 복제"
                  onClick={duplicate}
                >
                  <Copy size={16} />
                </Button>
                <Button
                  className="icon-btn danger"
                  aria-label={`${singular[kind]} 삭제`}
                  title="삭제"
                  onClick={() =>
                    confirm(
                      `${selected.name || '이 항목'}을 삭제할까요?`,
                      saved
                        ? '던전과 방의 배치 정보에서도 제거됩니다.'
                        : '현재 미저장 결과를 버립니다.',
                      () =>
                        editCampaign(c.id, (next) =>
                          deleteEntity(next, kind, selected.id),
                        ),
                    )
                  }
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
            <div className="entity-title">
              <Icon size={31} strokeWidth={1.2} />
              <h2>{selected.name || `이름 없는 ${singular[kind]}`}</h2>
            </div>
            <div className="save-actions">
              {!saved && (
                <Button className="btn primary" onClick={save}>
                  <Save size={15} /> 캠페인에 저장
                </Button>
              )}
              {kind !== 'characters' && d && (
                <Button className="btn" onClick={assign}>
                  <ArrowDownToLine size={16} />
                  {room
                    ? `방 ${d.rooms.indexOf(room) + 1}에 추가`
                    : '던전에 추가'}
                </Button>
              )}
              <Button
                className="btn ghost"
                disabled={!rules.pack}
                onClick={randomize}
              >
                <Dices size={15} /> {singular[kind]} 전체 재굴림
              </Button>
            </div>
            {kind === 'characters' && (
              <>
                <p className="help-line">
                  기본 룰북의 Classless 규칙을 적용합니다. 직업과 수치는 직접
                  변경할 수 있으며, 선택 직업의 보정은 자동 적용하지 않습니다.
                </p>
                <label className="status-select">
                  상태{' '}
                  <select
                    aria-label="캐릭터 상태"
                    value={(selected as Character).status}
                    onChange={(e) => patch('status', e.target.value)}
                  >
                    <option value="alive">생존</option>
                    <option value="dead">사망</option>
                  </select>
                </label>
              </>
            )}
            {kind === 'encounters' && (
              <label className="status-select">
                분류{' '}
                <select
                  aria-label="조우 분류"
                  value={category}
                  onChange={(e) => patch('category', e.target.value)}
                >
                  <option value="common">일반 조우</option>
                  <option value="rare">희귀 조우</option>
                </select>
              </label>
            )}
            <div className="fields-grid">
              {entityFields[kind].map((spec) => (
                <Field
                  key={spec.key}
                  spec={spec}
                  value={
                    (selected as unknown as Record<string, string | number>)[
                      spec.key
                    ] ?? ''
                  }
                  source={selected.sources?.[spec.key]}
                  onChange={(value, source) => patch(spec.key, value, source)}
                  reroll={
                    canReroll(kind, spec.key) &&
                    selected.generation?.system !== 'preset' &&
                    (kind !== 'monsters' ||
                      spec.key !== 'hp' ||
                      /^d(4|6|8|10|12)$/.test(
                        (selected as Monster).attacks[0]?.damage ?? '',
                      ))
                      ? () =>
                          generateEntityRoll(
                            kind,
                            spec.key,
                            region,
                            category,
                            selected,
                          )
                      : undefined
                  }
                />
              ))}
            </div>
            <div className="notes-block">
              <label htmlFor="entity-notes" className="eyebrow">
                심판의 메모
              </label>
              <Textarea
                id="entity-notes"
                aria-label={`${singular[kind]} 메모`}
                value={selected.notes}
                onChange={(e) => patch('notes', e.target.value)}
                placeholder="빚, 소문, 끝나지 않은 사건…"
              />
            </div>
            {saved && kind !== 'characters' && (
              <div className="assignment-summary">
                <span className="eyebrow">배치된 장소</span>
                {c.dungeons
                  .filter((x) => x[referenceKey(kind)].includes(selected.id))
                  .map((x) => (
                    <p key={x.id}>
                      {x.title}{' '}
                      <span>
                        {x.rooms
                          .filter((r) =>
                            r[referenceKey(kind)].includes(selected.id),
                          )
                          .map((r) => `방 ${x.rooms.indexOf(r) + 1}`)
                          .join(', ') || '방에 배치되지 않음'}
                      </span>
                    </p>
                  ))}
                {!c.dungeons.some((x) =>
                  x[referenceKey(kind)].includes(selected.id),
                ) && (
                  <p>
                    보관함에만 저장되어 있습니다. 위에서 배치할 위치를
                    선택하세요.
                  </p>
                )}
              </div>
            )}
          </article>
        ) : (
          <div className="empty-artifact">
            <Icon size={48} strokeWidth={1} />
            <span className="eyebrow">빈 페이지가 당신을 기다립니다</span>
            <h2>
              {kind === 'characters'
                ? '누가 부름에 응할까요?'
                : kind === 'npcs'
                  ? '누군가 기다리고 있습니다.'
                  : '어둠 속에는 무엇이 있을까요?'}
            </h2>
            <p>
              생성 결과를 확인하거나 직접 작성하세요.
              <br />
              저장하기 전에는 보관함에 추가되지 않습니다.
            </p>
            <Button
              className="btn primary"
              disabled={!rules.pack}
              onClick={() => generate()}
            >
              <Dices size={16} /> {singular[kind]} 생성
              <ArrowRight size={16} />
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
