import type { Section } from '../domain/types';

/** Navigation only: these groups are app presentation, not source procedures. */
export function HomeIndex({
  campaignName,
  onDesk,
  onLibrary,
  onSources,
  onCity,
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
    <nav className="home-index" aria-label="전체 항목">
      <div className="home-index-groups">
        <section className="home-reference-section">
          <h2>
            <span>01</span> REFERENCE
          </h2>
          <div className="home-index-links">
            <button onClick={onDesk}>
              레퍼런스 작업대 <span>›</span>
            </button>
            <button onClick={onLibrary}>
              Oracle 라이브러리 <span>›</span>
            </button>
            <button onClick={onSources}>
              자료 및 규칙 <span>›</span>
            </button>
          </div>
        </section>
        <section className="home-play-section">
          <h2>
            <span>02</span> PLAY
          </h2>
          <div className="home-index-links">
            <button onClick={onCity}>
              City Crawl · 도시 <span>›</span>
            </button>
            <button onClick={onFate}>
              Mythic Fate <span>›</span>
            </button>
            <button onClick={() => onNavigate('procedures')}>
              재앙 · 여행 <span>›</span>
            </button>
            <button onClick={() => onNavigate('play')}>
              플레이 화면 <span>›</span>
            </button>
          </div>
        </section>
        <section className="home-codex-section">
          <h2>
            <span>03</span> CODEX
          </h2>
          <div className="home-index-links home-library-links">
            {(
              [
                ['dungeons', '던전 보관함'],
                ['characters', '캐릭터'],
                ['monsters', '몬스터'],
                ['npcs', 'NPC'],
                ['encounters', '조우'],
                ['overview', '보관한 자료'],
              ] as const
            ).map(([section, title]) => (
              <button key={section} onClick={() => onNavigate(section)}>
                {title} <span>›</span>
              </button>
            ))}
          </div>
        </section>
      </div>
      <div className="home-campaign-context">
        <button onClick={onCampaigns}>
          <span>캠페인</span>
          <strong>{campaignName ?? '선택 · 새로 만들기'}</strong>
          <span aria-hidden="true">›</span>
        </button>
      </div>
      <details className="home-records">
        <summary>보조 기록 ›</summary>
        <div className="home-record-links">
          {(
            [
              ['sessions', '세션'],
              ['timeline', '연대기'],
              ['threads', '실마리'],
              ['rumors', '소문'],
              ['relics', '유물'],
              ['journal', '짧은 기록'],
              ['notes', '캠페인 노트'],
            ] as const
          ).map(([section, title]) => (
            <button key={section} onClick={() => onNavigate(section)}>
              {title} <span>›</span>
            </button>
          ))}
        </div>
      </details>
      <div className="home-utilities">
        <button onClick={onImport}>가져오기</button>
        <button onClick={onAbout}>소개 · 출처</button>
      </div>
    </nav>
  );
}
