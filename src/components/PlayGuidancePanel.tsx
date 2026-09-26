import { useState, type RefObject } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { QUESTION_INTENTS, QUESTION_TARGETS } from '../domain/questionGuidance';
import { ConditionalRules } from './ConditionalRules';
import { useReferenceDesk } from './ReferenceContext';
export function PlayGuidancePanel({
  open,
  onOpenChange,
  launcherRef,
  onFate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  launcherRef: RefObject<HTMLButtonElement | null>;
  onFate: () => void;
}) {
  const desk = useReferenceDesk();
  const [tab, setTab] = useState<'question' | 'rules'>('question');
  const [intentId, setIntent] = useState<string>('action');
  const [system, setSystem] = useState<'core' | 'sd'>('core');
  const intent = QUESTION_INTENTS.find((i) => i.id === intentId)!;
  const openRef = (id: string) => {
    desk?.activate(id, false);
    onOpenChange(false);
  };
  const link = (id: string, label: string) => (
    <button disabled={!desk?.byId[id]?.available} onClick={() => openRef(id)}>
      {label} ↗
    </button>
  );
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="play-guidance-panel play-guidance"
        finalFocus={launcherRef}
      >
        <DialogTitle>무엇을 굴리지?</DialogTitle>
        <DialogDescription>
          질문을 먼저 정하고, 필요한 판정 하나를 고릅니다.
        </DialogDescription>
        <nav className="guidance-tabs" aria-label="플레이 안내 종류">
          <button
            aria-pressed={tab === 'question'}
            onClick={() => setTab('question')}
          >
            질문에 맞는 도구
          </button>
          <button
            aria-pressed={tab === 'rules'}
            onClick={() => setTab('rules')}
          >
            조건별 규칙
          </button>
        </nav>
        {tab === 'rules' ? (
          <ConditionalRules onOpen={openRef} />
        ) : (
          <>
            <div className="question-choices" aria-label="질문의 종류">
              {QUESTION_INTENTS.map((i) => (
                <button
                  key={i.id}
                  aria-pressed={intent.id === i.id}
                  onClick={() => setIntent(i.id)}
                >
                  <strong>{i.label}</strong>
                  <span>{i.example}</span>
                </button>
              ))}
            </div>
            <section
              className="question-answer"
              aria-label="선택한 질문의 안내"
            >
              <h3>{intent.example}</h3>
              <p>{intent.explanation}</p>
              {intent.id === 'action' && (
                <>
                  <label>
                    일반 행동의 규칙
                    <select
                      value={system}
                      onChange={(e) =>
                        setSystem(e.target.value as typeof system)
                      }
                    >
                      <option value="core">Core · 성공 / 실패</option>
                      <option value="sd">
                        Sölitary Defilement · Strong / Weak / Miss
                      </option>
                    </select>
                  </label>
                  <p>
                    {system === 'core'
                      ? 'd20 + 능력 보정 ≥ DR. 문을 부순다면 Strength, DR은 상황에 맞춰 정합니다.'
                      : '2d20 각각에 능력 보정을 더해 DR과 비교. 둘 성공 Strong, 하나 Weak(성공과 대가), 둘 실패 Miss. 전투와 권능은 기존 d20 하나를 사용합니다.'}
                  </p>
                  <div className="guidance-links">
                    {link(
                      QUESTION_TARGETS[system],
                      '이 규칙으로 일반 행동 판정',
                    )}
                    {link('rule:sd.dungeonCrawling', '던전의 다음 방')}
                    {link('procedure:city.crawl', '도시에서 목표 찾기')}
                    {link('rule:sd.travel-day', '하루 여행')}
                  </div>
                </>
              )}
              {intent.id === 'fact' && (
                <>
                  <p>
                    SD Yes or No 또는 Mythic Fate 중 하나를 사용하세요. 예상
                    가능성을 반영하려면 Mythic에서 Odds와 Chaos Factor를
                    확인합니다. 이미 보거나 정한 사실에는 굴림이 필요 없습니다.
                  </p>
                  <div className="guidance-links">
                    {link(QUESTION_TARGETS.yesNo, 'SD · Yes or No d4')}
                    {link(QUESTION_TARGETS.mythic, 'Mythic · Odds를 정해 질문')}
                    <button
                      onClick={() => {
                        onOpenChange(false);
                        onFate();
                      }}
                    >
                      Mythic Fate 굴림창 열기 ↗
                    </button>
                  </div>
                </>
              )}
              {intent.id === 'detail' && (
                <>
                  <p>
                    해당 공간의 묘사 표 하나부터 열고, 빈 부분만 보충하세요.
                    지형 묘사어는 현재 상황에 맞춰 해석하는 영감입니다.
                  </p>
                  <div className="guidance-links">
                    {link(QUESTION_TARGETS.dungeon, '던전 · 방 묘사')}
                    {link(QUESTION_TARGETS.city, '도시 · 새 거리')}
                    {link(QUESTION_TARGETS.journey, '여정 · 지형 묘사어 둘')}
                  </div>
                </>
              )}
            </section>
            <p className="guidance-principle">
              한 번 정한 성공·사실은 유지합니다. 같은 문 부수기를 Core → SD →
              Fate로 연달아 재판정하지 마세요. 결과가 만든 새 질문에만 다음
              도구를 사용합니다.
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
