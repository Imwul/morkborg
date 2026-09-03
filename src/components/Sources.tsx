import { Translation } from './Translation';
import { useState } from 'react';
import { BookOpen, Dices, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRules, sourceCitation } from '../storage/rulesStore';
import { PrivateDataTools } from './PrivateDataTools';
import { editCampaign } from '../storage/saveStore';
import { rollDie } from '../generators/random';
import type { Campaign } from '../domain/types';
export function Sources({
  campaign,
  notify,
}: {
  campaign?: Campaign;
  notify: (message: string) => void;
}) {
  const { pack, error, loading } = useRules();
  const [book, setBook] = useState('core');
  const [table, setTable] = useState('');
  const [modifier, setModifier] = useState(0);
  const [dr, setDr] = useState(12);
  const [odds, setOdds] = useState(50);
  const [result, setResult] = useState('');
  const tables = Object.entries(pack?.tables ?? {}).filter(
    ([, t]) => t.book === book,
  );
  const selected = pack?.tables[table];
  return (
    <div className="source-page">
      <div className="eyebrow">룰북 / 자료 및 규칙</div>
      <div className="page-heading">
        <div>
          <h1>
            원문을 펼치다<span className="acid">.</span>
          </h1>
          <p>
            실제 책의 표와 규칙을 사용합니다. 각 생성 결과에 출처가 함께
            저장됩니다.
          </p>
        </div>
        <BookOpen size={39} strokeWidth={1} />
      </div>
      <details className="sheet-source">
        <summary>개인 자료 안내</summary>
        <p>
          제공한 룰북의 표는 개인용 자료로 이 기기에서 불러옵니다. 공개 코드
          저장소에는 원본 PDF와 책에서 추출한 생성표를 포함하지 않습니다. 생성된
          캠페인 기록은 JSON으로 별도 보관할 수 있습니다.
        </p>
      </details>
      {loading && <p>자료를 불러오는 중…</p>}
      {error && <p role="alert">{error}</p>}
      <details className="sheet-source">
        <summary>사용 중인 룰북 · {pack?.books.length ?? 0}권</summary>
        <div className="rule-book-list">
          {pack?.books.map((b) => (
            <div className="rule-book" key={b.id}>
              <strong>{b.title}</strong>
              <p>
                {
                  Object.values(pack.tables).filter((t) => t.book === b.id)
                    .length
                }
                개 표 · {b.fileName}
              </p>
            </div>
          ))}
        </div>
      </details>
      <PrivateDataTools backup />
      {pack && (
        <>
          <div className="section-title">
            <h2>원문 표 찾아보기</h2>
          </div>
          <div className="source-selects">
            <label>
              책
              <select
                aria-label="출처 책"
                value={book}
                onChange={(e) => {
                  setBook(e.target.value);
                  setTable('');
                }}
              >
                {pack.books.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              표
              <select
                aria-label="출처 표"
                value={table}
                onChange={(e) => setTable(e.target.value)}
              >
                <option value="">표를 선택하세요</option>
                {tables.map(([id, t]) => (
                  <option key={id} value={id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {selected && (
            <div className="table-source">
              <p className="source-citation">
                {sourceCitation(table)} · {String(selected.dice)}
              </p>
              <ol>
                {selected.entries.map((e, i) => (
                  <li key={i}>
                    {e.text}
                    <Translation
                      text={e.text}
                      translation={
                        typeof e.meta.ko === 'string' ? e.meta.ko : undefined
                      }
                    />
                  </li>
                ))}
              </ol>
              <p className="help-line">
                원문 확인용 목록입니다. 중첩 표, 카드, 조건부 결과는 책의 절차를
                함께 확인하세요.
              </p>
            </div>
          )}
          <div className="section-title">
            <h2>솔로 판정 — RECLVSE</h2>
          </div>
          <p className="help-line">
            PDF 11–12쪽의 2d20 판정과 85쪽의 d100 질문 판정. 결과를 캠페인
            노트에 기록할 수 있습니다.
          </p>
          <div className="solo-grid">
            <div>
              <label htmlFor="solo-modifier">
                능력치 보정
                <Input
                  id="solo-modifier"
                  aria-label="솔로 능력치 보정"
                  type="number"
                  min={-99}
                  max={99}
                  value={modifier}
                  onChange={(e) => setModifier(Number(e.target.value) || 0)}
                />
              </label>
              <label>
                난이도
                <select
                  aria-label="솔로 난이도"
                  value={dr}
                  onChange={(e) => setDr(Number(e.target.value))}
                >
                  <option value={12}>DR 12 — 기본</option>
                  <option value={10}>DR 10 — 선택 규칙</option>
                </select>
              </label>
              <Button
                className="btn primary"
                onClick={() => {
                  const a = rollDie(20),
                    b = rollDie(20);
                  const hits =
                    Number(a + modifier >= dr) + Number(b + modifier >= dr);
                  const label =
                    hits === 2
                      ? '강한 성공'
                      : hits === 1
                        ? '약한 성공'
                        : '실패';
                  const critical =
                    a === 20 && hits === 2
                      ? ' · 치명적 성공'
                      : a === 1 && hits === 0
                        ? ' · 치명적 실패'
                        : '';
                  setResult(
                    `RECLVSE 2d20: [${a}, ${b}] + ${modifier}, DR ${dr} → ${label}${critical}. (PDF 11–12쪽; 첫 주사위가 치명 판정 주사위)`,
                  );
                }}
              >
                <Dices size={15} /> 2d20 판정
              </Button>
            </div>
            <div>
              <label>
                질문의 가능성
                <select
                  aria-label="질문 가능성"
                  value={odds}
                  onChange={(e) => setOdds(Number(e.target.value))}
                >
                  {[
                    [90, '거의 확실함'],
                    [75, '높음'],
                    [50, '불확실함'],
                    [25, '낮음'],
                    [10, '거의 불가능함'],
                  ].map(([n, label]) => (
                    <option key={n} value={n}>
                      {label} — {n}%
                    </option>
                  ))}
                </select>
              </label>
              <Button
                className="btn"
                onClick={() => {
                  const die = rollDie(100);
                  setResult(
                    `RECLVSE Ask Oracle: d100 = ${die}, 기준 ${odds} 이하 → ${die <= odds ? '예' : '아니오'}. (PDF 85쪽)`,
                  );
                }}
              >
                <Dices size={15} /> d100 질문 판정
              </Button>
              <p className="help-line">
                원문 표의 ‘이하(≤)’를 적용합니다. 같은 페이지 설명의 ‘미만’과
                표기가 다릅니다.
              </p>
            </div>
          </div>
          {result && (
            <div className="solo-result">
              <p>{result}</p>
              <Button
                className="btn"
                disabled={!campaign}
                onClick={() => {
                  if (campaign) {
                    editCampaign(campaign.id, (c) => {
                      c.notes += (c.notes ? '\n\n' : '') + result;
                    });
                    notify('캠페인 노트에 기록했습니다.');
                  }
                }}
              >
                <Save size={15} /> 노트에 기록
              </Button>
            </div>
          )}
          <div className="section-title">
            <h2>적용 범위와 판정 기준</h2>
          </div>
          <p>
            캐릭터는 Classless 또는 기본 룰북·FERETORY·HERETIC의 12개 직업으로
            생성합니다. 직업별 능력치·장비·배경·능력과 제한을 함께 적용합니다.
            몬스터는 FERETORY의 「The Monster Approaches」 또는 책에 실린 개체를
            사용합니다. 일반 조우에는 Sölitary Depths의 해당 지역 표를 적용하고,
            Grift처럼 지역 표가 없는 곳에는 Sölitary Defilement의 기본 절차를
            사용합니다. Galgenbeck은 원문에 명시된 상위 지역 Tveland 표를
            참조합니다.
          </p>
          <p>
            희귀 조우는 Depths에서 허용하는 「The Monster Approaches」 대안과
            지역 특성·발견 표를 사용합니다. 방과 NPC의 구성에는 Defilement 및
            RECLVSE 표를 참조합니다. 여러 책의 결과를 함께 보여 주는 작업
            방식이며, 하나의 책에 실린 단일 절차라고 표시하지 않습니다.
          </p>
          <p>
            FERETORY의 HP는 본문의 ‘피해 주사위 한 번 ×2’를 따릅니다. 괄호의 2dN
            예시와 확률이 다릅니다. 최고 주사위가 동률이면 방어구는 심판이
            선택합니다. 고정 개체의 능력치를 임의로 재굴림하지 않으며, 직접
            수정한 필드는 ‘직접 작성’으로 표시됩니다.
          </p>
        </>
      )}
    </div>
  );
}
