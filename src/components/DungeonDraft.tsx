import { ArrowLeft, ArrowRight, Dices, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { Campaign, RegionId } from '../domain/types';
import { regions, regionById } from '../data/regions';
import {
  createDungeon,
  createDungeonCandidate,
  dungeonTitle,
} from '../generators';
import {
  prepareSpecialRooms,
  rerollSpecialRoom,
} from '../generators/specialRooms';
import { editCampaign, changeWorkspace } from '../storage/saveStore';
import { useRules, sourceCitation } from '../storage/rulesStore';
import { now } from '../generators/random';
import { Field } from './Field';
import { DungeonSheet } from './DungeonSheet';
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
      const candidate = createDungeonCandidate(c.id, region);
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
        const blank = createDungeon(c.id, '', region, true);
        blank.rooms = prepareSpecialRooms(blank, true);
        next.dungeonDraft = blank;
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
      <strong className="special-room-count">
        SPECIAL ROOMS · 4개 고정 · 크롤에서 발견
      </strong>
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
          <DungeonSheet
            dungeon={draft}
            ready={!!rules.pack}
            patch={patch}
            patchRoom={(roomId, key, value, source) =>
              editCampaign(c.id, (next) => {
                const room = next.dungeonDraft?.rooms.find(
                  (r) => r.id === roomId,
                );
                if (room)
                  Object.assign(room, {
                    [key]: value,
                    sources: { ...room.sources, [key]: source ?? '직접 작성' },
                  });
              })
            }
            rollRoom={(roomId) =>
              editCampaign(c.id, (next) => {
                const room = next.dungeonDraft?.rooms.find(
                  (r) => r.id === roomId,
                );
                if (room && next.dungeonDraft)
                  rerollSpecialRoom(next.dungeonDraft, room);
              })
            }
          />
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
