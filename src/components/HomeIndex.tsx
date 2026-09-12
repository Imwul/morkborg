import type { Section } from '../domain/types';

/** Navigation only: these groups are app presentation, not source procedures. */
export function HomeIndex({
  onLibrary,
  onSources,
  onFate,
  onCampaigns,
  onNavigate,
  onImport,
  onAbout,
}: {
  campaignName?: string;
  onDesk: () => void;
  onLibrary: () => void;
  onSources: () => void;
  onCity: () => void;
  onFate: () => void;
  onCampaigns: () => void;
  onNavigate: (section: Section) => void;
  onImport: () => void;
  onAbout: () => void;
}) {
  return (
    <details className="desk-records-menu">
      <summary>자료 · 기록</summary>
      <div>
        <button onClick={onSources}>출처 · 자료 관리</button>
        <button onClick={onImport}>캠페인 가져오기</button>
        <button onClick={onFate}>Mythic Fate</button>
        <button onClick={onCampaigns}>보관한 캠페인</button>
        <button onClick={() => onNavigate('notes')}>캠페인 노트</button>
        <button onClick={() => onNavigate('characters')}>캐릭터 보관함</button>
        <button onClick={() => onNavigate('dungeons')}>던전 보관함</button>
        <button onClick={onAbout}>소개 · 출처</button>
        <details>
          <summary>추가 관리</summary>
          <button onClick={onLibrary}>원본 Oracle 라이브러리</button>
        </details>
      </div>
    </details>
  );
}
