import { useState } from 'react';
import { ArrowLeft, ArrowRight, Dices, Pencil, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { Campaign, RegionId } from '../domain/types';
import { dungeonFields, roomFields } from '../domain/types';
import { regions, regionById } from '../data/regions';
import {
  createDungeon,
  createDungeonCandidate,
  createRoom,
  dungeonTitle,
  generateDungeonRoll,
  generateRoomRoll,
  rerollRoomContents,
} from '../generators';
import { editCampaign, changeWorkspace } from '../storage/saveStore';
import { useRules, sourceCitation } from '../storage/rulesStore';
import { now } from '../generators/random';
import { Field } from './Field';
import { selectDungeonCandidate } from '../domain/operations';
import type { Confirm } from './Library';

export function DungeonDraft({
  campaign: c,
  confirm,
  notify,
}: {
  campaign: Campaign;
  confirm: Confirm;
  notify: (message: string) => void;
}) {
  const rules = useRules();
  const draft = c.dungeonDraft;
  const [initialRooms, setInitialRooms] = useState(4);
  const region = draft?.region ?? c.workspace.pendingRegion;
  const patch = (key: string, value: string | number, source = '직접 작성') =>
    editCampaign(c.id, (next) => {
      if (!next.dungeonDraft) return;
      Object.assign(next.dungeonDraft, {
        [key]: value,
        updatedAt: now(),
        sources: { ...next.dungeonDraft.sources, [key]: source },
      });
    });
  function generate() {
    if (!region) return;
    try {
      const candidate = createDungeonCandidate(
        c.id,
        region,
        draft?.rooms.length ?? initialRooms,
      );
      if (draft) {
        candidate.id = draft.id;
        candidate.createdAt = draft.createdAt;
        candidate.notes = draft.notes;
      }
      editCampaign(c.id, (next) => {
        next.dungeonDraft = candidate;
      });
    } catch (error) {
      notify(error instanceof Error ? error.message : '생성표를 확인하세요.');
    }
  }
  function manual() {
    if (!region) return;
    const run = () =>
      editCampaign(c.id, (next) => {
        next.dungeonDraft = createDungeon(c.id, '', region, true);
      });
    if (draft)
      confirm(
        '빈 후보로 바꿀까요?',
        '지금 후보를 비우고 제목부터 직접 작성합니다. 선택하여 저장한 던전은 유지됩니다.',
        run,
      );
    else run();
  }
  function choose() {
    if (!draft) return;
    const title =
      draft.title.trim() || (rules.pack ? dungeonTitle() : 'Untitled Dungeon');
    editCampaign(c.id, (next) => {
      if (!next.dungeonDraft) return;
      if (!draft.title.trim() && rules.pack)
        next.dungeonDraft.sources = {
          ...next.dungeonDraft.sources,
          title:
            sourceCitation('core.titleA') +
            ' + ' +
            sourceCitation('core.titleB'),
        };
      selectDungeonCandidate(next, title);
    });
    notify('선택한 던전과 방을 캠페인에 저장했습니다.');
  }
  function changeRooms(count: number) {
    if (!draft) {
      setInitialRooms(count);
      return;
    }
    if (!region) return;
    editCampaign(c.id, (next) => {
      if (!next.dungeonDraft) return;
      const rooms = next.dungeonDraft.rooms;
      if (count < rooms.length) rooms.splice(count);
      while (rooms.length < count) rooms.push(createRoom(region, !rules.pack));
    });
  }
  const settings = (
    <div className="candidate-settings">
      <label htmlFor="candidate-region">
        지역
        <select
          id="candidate-region"
          value={region ?? ''}
          onChange={(e) =>
            draft
              ? patch('region', e.target.value as RegionId)
              : changeWorkspace(c.id, {
                  pendingRegion: e.target.value as RegionId,
                })
          }
        >
          <option value="" disabled>
            지역을 선택하세요
          </option>
          {regions.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </label>
      <p>
        {region
          ? regionById(region).description
          : '지역을 선택한 뒤 생성하세요. 제목과 내용, 방이 한 번에 준비됩니다.'}
        <br />
        {draft
          ? '지역을 바꿔도 현재 문구는 유지되며, 이후 재굴림부터 새 지역을 적용합니다.'
          : '지역 태그는 확률만 조정하며 모든 원문 결과가 나올 수 있습니다.'}
      </p>
      <label htmlFor="candidate-room-count">
        함께 생성할 방
        <select
          id="candidate-room-count"
          value={draft?.rooms.length ?? initialRooms}
          onChange={(e) => changeRooms(Number(e.target.value))}
        >
          {Array.from({ length: 13 }, (_, i) => (
            <option key={i} value={i}>
              {i}개
            </option>
          ))}
        </select>
      </label>
      <span className="stamp">
        {draft
          ? '미저장 후보 · 선택하면 보관함에 추가'
          : '01 지역 선택 → 02 던전 생성 → 03 후보 선택'}
      </span>
    </div>
  );
  return (
    <div className="dungeon-generator">
      <Button
        className="btn ghost back-button"
        onClick={() =>
          changeWorkspace(c.id, {
            dungeonPreview: false,
            dungeonId: null,
            roomId: null,
          })
        }
      >
        <ArrowLeft size={16} /> 저장된 던전
      </Button>
      <div className="page-heading generator-heading">
        <div>
          <div className="eyebrow">던전 생성기 / 선택 전 후보</div>
          <h1>
            굴리고, 골라라<span className="acid">.</span>
          </h1>
          <p>
            {draft
              ? '원하는 항목만 다시 굴리거나 직접 고친 뒤 이 던전을 선택하세요.'
              : '먼저 지역을 고르세요. 제목을 입력하지 않아도 던전과 방이 함께 만들어집니다.'}
          </p>
        </div>
        <div className="actions">
          <Button className="btn" disabled={!region} onClick={manual}>
            <Pencil size={16} /> 직접 작성
          </Button>
          <Button
            className={`btn ${draft ? '' : 'primary'}`}
            disabled={!rules.pack || !region}
            onClick={generate}
          >
            <Dices size={18} /> {draft ? '모두 다시 굴리기' : '던전 생성'}
          </Button>
          {draft && (
            <Button className="btn primary" onClick={choose}>
              이 던전 선택 <ArrowRight size={17} />
            </Button>
          )}
        </div>
      </div>
      {!draft ? (
        <section className="generation-setup" aria-label="던전 생성 설정">
          {settings}
          <p className="help-line">
            선택하기 전까지 보관함에 추가되지 않습니다. 마음에 드는 결과가 나올
            때까지 굴릴 수 있습니다.
          </p>
        </section>
      ) : (
        <>
          <div className="candidate-meta">
            {settings}
            <div className="candidate-title">
              <Field
                spec={{ key: 'title', label: '던전 제목' }}
                value={draft.title}
                source={draft.sources?.title}
                onChange={(value, source) => patch('title', value, source)}
                reroll={
                  rules.pack
                    ? () => ({
                        value: dungeonTitle(),
                        source:
                          sourceCitation('core.titleA') +
                          ' + ' +
                          sourceCitation('core.titleB'),
                      })
                    : undefined
                }
              />
            </div>
          </div>
          <div className="fields-grid candidate-fields">
            {dungeonFields.map((spec) => (
              <Field
                key={`${draft.id}:${spec.key}`}
                spec={spec}
                value={String(
                  (draft as unknown as Record<string, unknown>)[spec.key],
                )}
                source={draft.sources?.[spec.key]}
                onChange={(value, source) => patch(spec.key, value, source)}
                reroll={
                  rules.pack
                    ? () => generateDungeonRoll(spec.key, draft.region)
                    : undefined
                }
              />
            ))}
          </div>
          <div className="section-title candidate-rooms-heading">
            <h2>
              함께 생성된 방 <span>{draft.rooms.length}</span>
            </h2>
            <Button
              className="btn"
              onClick={() => changeRooms(Math.min(12, draft.rooms.length + 1))}
              disabled={draft.rooms.length >= 12}
            >
              <Plus size={16} /> 방 추가
            </Button>
          </div>
          <div className="candidate-rooms">
            {draft.rooms.map((room, index) => (
              <details className="candidate-room" key={room.id}>
                <summary>
                  <span className="entity-number">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <strong>{room.name || '이름 없는 방'}</strong>
                  <span>항목 편집</span>
                </summary>
                <Button
                  className="btn small"
                  aria-label={`방 ${index + 1} 전체 재굴림`}
                  disabled={!rules.pack}
                  onClick={() =>
                    editCampaign(c.id, (next) => {
                      const target = next.dungeonDraft?.rooms.find(
                        (r) => r.id === room.id,
                      );
                      if (target) rerollRoomContents(target, draft.region);
                    })
                  }
                >
                  <Dices size={16} /> 이 방 다시 굴리기
                </Button>
                <div className="fields-grid">
                  {roomFields.map((spec) => (
                    <Field
                      key={spec.key}
                      spec={spec}
                      value={String(
                        (room as unknown as Record<string, unknown>)[spec.key],
                      )}
                      source={room.sources?.[spec.key]}
                      onChange={(value, source) =>
                        editCampaign(c.id, (next) => {
                          const target = next.dungeonDraft?.rooms.find(
                            (r) => r.id === room.id,
                          );
                          if (target)
                            Object.assign(target, {
                              [spec.key]: value,
                              sources: {
                                ...target.sources,
                                [spec.key]: source ?? '직접 작성',
                              },
                            });
                        })
                      }
                      reroll={
                        rules.pack
                          ? () => generateRoomRoll(spec.key, draft.region)
                          : undefined
                      }
                    />
                  ))}
                </div>
              </details>
            ))}
          </div>
          <div className="notes-block">
            <label className="eyebrow" htmlFor="candidate-notes">
              후보 메모
            </label>
            <Textarea
              id="candidate-notes"
              value={draft.notes}
              onChange={(e) => patch('notes', e.target.value)}
              placeholder="남겨 둘 생각이나 설정을 적으세요."
            />
          </div>
          <div className="candidate-bottom actions">
            <Button className="btn" disabled={!rules.pack} onClick={generate}>
              <Dices size={18} /> 모두 다시 굴리기
            </Button>
            <Button className="btn primary" onClick={choose}>
              이 던전 선택 <ArrowRight size={17} />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
