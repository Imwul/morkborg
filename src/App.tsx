import { lazy, useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  Play,
  ScrollText,
  CalendarDays,
  Link2,
  Gem,
  MessageCircle,
  Plus,
  ArrowUpRight,
  Skull,
  Upload,
  ArrowRight,
  UsersRound,
  Castle,
  Swords,
  NotebookPen,
  ChevronDown,
  Download,
  Copy,
  Trash2,
  Pencil,
  Menu,
  X,
  Check,
  Info,
  Dices,
  HardDrive,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Campaign, Section } from './domain/types';
import { createCampaign, dungeonTitle } from './generators';
import {
  useSave,
  transact,
  editCampaign,
  changeWorkspace,
  downloadJson,
  downloadText,
  resetDamagedSave,
  retrySave,
} from './storage/saveStore';
import { parseImport } from './storage/schema';
import { MIGRATION_BACKUP_KEY } from './storage/migrations';
import {
  cloneCampaign,
  importCampaigns,
  openCampaignLibrary,
} from './domain/operations';
import { type Confirm } from './components/Library';
import { defaultMythicState } from './domain/mythic';
import { contextNotesTarget, type NotesTarget } from './domain/oracleNotes';
import { useRules, loadRules } from './storage/rulesStore';
import { PrivateDataTools } from './components/PrivateDataTools';
import { TranslationDataNotice } from './components/TranslationDataNotice';
import { startPublishedDataUpdates } from './storage/publishedData';
import { registerCodexTools } from './webmcp';
import type { RecordSection } from './components/Chronicle';
import type { CaptureKind } from './domain/captureContext';
import { DeferredView } from './components/DeferredView';
import {
  ReferenceProvider,
  ReferenceDesk,
  ReferenceSearchButton,
} from './components/ReferenceWorkbench';
const ContentLibrary = lazy(() =>
  import('./components/ContentLibrary').then((module) => ({
    default: module.ContentLibrary,
  })),
);
const Dungeons = lazy(() =>
  import('./components/Dungeons').then((module) => ({
    default: module.Dungeons,
  })),
);
const Monsters = lazy(() =>
  import('./components/Monsters').then((module) => ({
    default: module.Monsters,
  })),
);
const Characters = lazy(() =>
  import('./components/Characters').then((module) => ({
    default: module.Characters,
  })),
);
const Sources = lazy(() =>
  import('./components/Sources').then((module) => ({
    default: module.Sources,
  })),
);
const Oracles = lazy(() =>
  import('./components/Oracles').then((module) => ({
    default: module.Oracles,
  })),
);
const MythicPanel = lazy(() =>
  import('./components/MythicPanel').then((module) => ({
    default: module.MythicPanel,
  })),
);
const PlayMode = lazy(() =>
  import('./components/PlayMode').then((module) => ({
    default: module.PlayMode,
  })),
);
const ObjectPlayTools = lazy(() =>
  import('./components/ObjectPlayTools').then((module) => ({
    default: module.ObjectPlayTools,
  })),
);
const CampaignProcedures = lazy(() =>
  import('./components/CampaignProcedures').then((module) => ({
    default: module.CampaignProcedures,
  })),
);
const QuickCapture = lazy(() =>
  import('./components/QuickCapture').then((module) => ({
    default: module.QuickCapture,
  })),
);
const Sessions = lazy(() =>
  import('./components/Chronicle').then((module) => ({
    default: module.Sessions,
  })),
);
const Timeline = lazy(() =>
  import('./components/Chronicle').then((module) => ({
    default: module.Timeline,
  })),
);
const CampaignRecords = lazy(() =>
  import('./components/Chronicle').then((module) => ({
    default: module.CampaignRecords,
  })),
);
const CampaignHome = lazy(() =>
  import('./components/Chronicle').then((module) => ({
    default: module.CampaignHome,
  })),
);

const nav = [
  { key: 'overview', label: '보관한 자료', icon: BookOpen, group: 'CAMPAIGN' },
  { key: 'play', label: 'PLAY · 플레이', icon: Play, group: '' },
  { key: 'sessions', label: '세션', icon: ScrollText, group: '' },
  { key: 'timeline', label: '연대기', icon: NotebookPen, group: '' },
  { key: 'procedures', label: '재앙 · 여행', icon: CalendarDays, group: '' },
  { key: 'threads', label: '실마리', icon: Link2, group: 'UNFINISHED' },
  { key: 'rumors', label: '소문', icon: MessageCircle, group: '' },
  { key: 'relics', label: '유물', icon: Gem, group: '' },
  { key: 'journal', label: '짧은 기록', icon: NotebookPen, group: '' },
  { key: 'characters', label: '캐릭터', icon: UsersRound, group: 'CODEX' },
  { key: 'dungeons', label: '던전 보관함', icon: Castle, group: '' },
  { key: 'monsters', label: '몬스터', icon: Skull, group: '' },
  { key: 'npcs', label: 'NPC', icon: UsersRound, group: '' },
  { key: 'encounters', label: '조우', icon: Swords, group: '' },
  { key: 'notes', label: '캠페인 노트', icon: NotebookPen, group: '' },
  { key: 'about', label: '자료 및 규칙', icon: BookOpen, group: '' },
] as const;
interface Confirmation {
  title: string;
  description: string;
  action: () => void;
}
export default function App() {
  useEffect(startPublishedDataUpdates, []);
  const rules = useRules();
  const { save, error, blocked, recovery } = useSave();
  const c =
    save.view === 'campaign'
      ? save.campaigns.find((c) => c.id === save.activeCampaignId)
      : undefined;
  const d = c?.dungeons.find((d) => d.id === c.workspace.dungeonId);
  const [importText, setImportText] = useState<string | null>(null);
  const [exportData, setExportData] = useState<{
    filename: string;
    text: string;
  } | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [toast, setToast] = useState('');

  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [form, setForm] = useState<'campaign' | 'rename' | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [importError, setImportError] = useState('');
  const [about, setAbout] = useState(false);
  const [oracleOpen, setOracleOpen] = useState(true);
  const [legacyOracleOpen, setLegacyOracleOpen] = useState(false);
  const [captureKind, setCaptureKind] = useState<CaptureKind | null>(null);
  const [fateOpen, setFateOpen] = useState(false);
  const [fateRequested, setFateRequested] = useState(false);
  const fateLauncherRef = useRef<HTMLButtonElement>(null);
  const mythicState = (c ? c.mythic : save.mythic) ?? defaultMythicState();
  function openFate() {
    setFateRequested(true);
    setFateOpen(true);
    setDrawer(false);
  }
  const [oracleContext, setOracleContext] = useState<NotesTarget | null>(null);
  function openOracles() {
    if (!oracleOpen) setOracleContext(c ? contextNotesTarget(c) : null);
    setOracleOpen(true);
    setLegacyOracleOpen(false);
    setDrawer(false);
  }
  const fileRef = useRef<HTMLInputElement>(null);
  const confirm: Confirm = (title, description, action) =>
    setConfirmation({ title, description, action });
  const notify = (text: string) => setToast(text);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 3500);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        (e.metaKey || e.ctrlKey) &&
        e.shiftKey &&
        e.key.toLowerCase() === 'f' &&
        !e.repeat
      ) {
        e.preventDefault();
        setFateRequested(true);
        setFateOpen((open) => !open);
        setDrawer(false);
      }
      if (e.key === 'Escape') {
        setDrawer(false);
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);
  useEffect(() => registerCodexTools(), []);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [
    c?.id,
    c?.workspace.section,
    c?.workspace.dungeonId,
    c?.workspace.roomId,
    c?.workspace.sessionId,
    c?.workspace.chronicleId,
    c?.workspace.selected.characters,
    c?.workspace.selected.monsters,
    c?.workspace.selected.npcs,
    c?.workspace.selected.encounters,
    oracleOpen,
  ]);
  const campaignTitle = c?.title;
  const pageDungeon =
    c?.workspace.section === 'dungeons' && !c.workspace.dungeonPreview
      ? d
      : undefined;
  const dungeonPageTitle = pageDungeon?.title;
  const characterPageTitle =
    c?.workspace.section === 'characters'
      ? [
          ...c.characters,
          ...(c.drafts.characters ? [c.drafts.characters] : []),
        ].find((ch) => ch.id === c.workspace.selected.characters)?.name
      : undefined;
  const monsterPageTitle =
    c?.workspace.section === 'monsters'
      ? [...c.monsters, ...(c.drafts.monsters ? [c.drafts.monsters] : [])].find(
          (m) => m.id === c.workspace.selected.monsters,
        )?.name
      : undefined;
  const contentKind =
    c?.workspace.section === 'npcs' || c?.workspace.section === 'encounters'
      ? c.workspace.section
      : null;
  const contentPageTitle =
    c && contentKind
      ? [
          ...c[contentKind],
          ...(c.drafts[contentKind] ? [c.drafts[contentKind]!] : []),
        ].find((e) => e.id === c.workspace.selected[contentKind])?.name
      : undefined;
  const recordPageTitle = oracleOpen
    ? 'ORACLES'
    : dungeonPageTitle ||
      characterPageTitle ||
      monsterPageTitle ||
      contentPageTitle;
  useEffect(() => {
    document.title = campaignTitle
      ? `${recordPageTitle ? recordPageTitle + ' — ' : ''}${campaignTitle} — Reference Desk`
      : 'MÖRK BORG — Reference Desk';
  }, [campaignTitle, recordPageTitle]);
  function openForm(kind: 'campaign' | 'dungeon' | 'rename' | null) {
    if (kind === 'dungeon') {
      if (!c) return;
      const campaignId = c.id;
      changeWorkspace(campaignId, {
        section: 'dungeons',
        dungeonPreview: true,
      });
      if (!c.dungeonDraft) void loadRules();
      setDrawer(false);
      return;
    }
    setForm(kind);
    if (kind === 'rename') setRenameId(c?.id ?? null);
    setTitle(
      kind === 'rename' ? (c?.title ?? '') : rules.pack ? dungeonTitle() : '',
    );
    setSubtitle(kind === 'rename' ? (c?.description ?? c?.subtitle ?? '') : '');
  }
  function renameCampaign(campaign: Campaign) {
    setRenameId(campaign.id);
    setTitle(campaign.title);
    setSubtitle(campaign.description ?? campaign.subtitle);
    setForm('rename');
  }
  function navigate(section: Section) {
    setOracleOpen(false);
    if (c)
      changeWorkspace(
        c.id,
        section === 'dungeons'
          ? { section, dungeonId: null, roomId: null, dungeonPreview: false }
          : section === 'characters'
            ? {
                section,
                selected: { ...c.workspace.selected, characters: null },
              }
            : section === 'monsters'
              ? {
                  section,
                  selected: { ...c.workspace.selected, monsters: null },
                }
              : section === 'npcs' || section === 'encounters'
                ? {
                    section,
                    selected: { ...c.workspace.selected, [section]: null },
                    contentTarget: null,
                  }
                : section === 'sessions'
                  ? { section, sessionId: null }
                  : ['threads', 'rumors', 'relics', 'journal'].includes(section)
                    ? { section, chronicleId: null }
                    : { section },
      );
    setDrawer(false);
  }
  function home() {
    setOracleOpen(false);
    transact((next) => {
      next.view = 'campaigns';
    });
    setDrawer(false);
  }
  function openCampaign(campaign: Campaign) {
    setOracleOpen(false);
    transact((next) => {
      openCampaignLibrary(next, campaign.id);
      next.campaigns.find(
        (entry) => entry.id === campaign.id,
      )!.workspace.section = 'overview';
    });
  }
  function exportCampaign(campaign: Campaign) {
    setExportData({
      text: JSON.stringify({ schemaVersion: 6, campaign }, null, 2),
      filename: `${campaign.title.replace(/[^\p{L}\p{N} -]/gu, '').slice(0, 80) || 'campaign'}.json`,
    });
  }
  function remove(campaign: Campaign) {
    confirm(
      `${campaign.title} 캠페인을 삭제할까요?`,
      '이 기기의 캠페인 전체를 삭제합니다. 나중에 필요하다면 먼저 JSON으로 내보내세요.',
      () =>
        transact((next) => {
          next.campaigns = next.campaigns.filter((c) => c.id !== campaign.id);
          if (next.activeCampaignId === campaign.id) {
            next.activeCampaignId = null;
            next.view = 'campaigns';
          }
        }),
    );
  }
  function duplicate(campaign: Campaign) {
    transact((next) => {
      next.campaigns.push(cloneCampaign(campaign));
    });
    notify('캐릭터·몬스터·던전·방과 모든 배치를 포함해 캠페인을 복제했습니다.');
  }
  function importJson(text: string) {
    try {
      if (new Blob([text]).size > 20 * 1024 * 1024)
        throw new Error('가져올 파일은 20MB 이하여야 합니다.');
      const campaigns = parseImport(text);
      if (!campaigns.length) throw new Error('파일에 캠페인이 없습니다.');
      transact((next) => {
        importCampaigns(next, campaigns);
      });
      setOracleOpen(false);
      setImportError('');
      setImportText(null);
      notify(`${campaigns.length}개 캠페인을 복원했습니다.`);
    } catch (error) {
      setImportError(
        error instanceof Error ? error.message : '파일을 가져오지 못했습니다.',
      );
    }
  }
  async function importFile(file: File) {
    if (file.size > 20 * 1024 * 1024) {
      setImportError('가져올 파일은 20MB 이하여야 합니다.');
      return;
    }
    try {
      importJson(await file.text());
    } catch {
      setImportError('파일을 읽지 못했습니다.');
    }
  }

  const fateLink = (
    <button
      className="nav-item fate-nav"
      onClick={openFate}
      aria-label="Mythic 패널 열기"
    >
      <Dices size={17} /> MYTHIC FATE{' '}
      <span className="nav-count">CF {mythicState.chaosFactor}</span>
    </button>
  );
  return (
    <ReferenceProvider
      campaign={c}
      notify={notify}
      onCampaignOpen={(patch) => {
        if (c) {
          setOracleOpen(false);
          changeWorkspace(c.id, patch);
        }
      }}
    >
      <div
        className={
          'app' +
          (fateOpen ? ' fate-open' : '') +
          (c?.workspace.section === 'play' && !oracleOpen ? ' play-active' : '')
        }
      >
        {drawer && (
          <button
            className="drawer-backdrop"
            aria-label="메뉴 닫기"
            onClick={() => setDrawer(false)}
          />
        )}
        <aside className={`sidebar ${drawer ? 'open' : ''}`}>
          <button className="brand" onClick={openOracles}>
            MÖRK
            <br />
            BORG<span>REFERENCE DESK</span>
          </button>
          <div className="side-divider" />
          {c ? (
            <>
              <button className="campaign-switch" onClick={home}>
                <span className="eyebrow">진행 중인 캠페인</span>
                <strong>{c.title}</strong>
                <ChevronDown size={14} />
              </button>
              <nav aria-label="캠페인 메뉴">
                <button
                  className={`nav-item ${oracleOpen ? 'active' : ''}`}
                  onClick={openOracles}
                >
                  <Dices size={17} /> REFERENCE DESK
                </button>
                {nav
                  .filter(
                    (item) =>
                      ![
                        'sessions',
                        'timeline',
                        'threads',
                        'rumors',
                        'relics',
                        'journal',
                      ].includes(item.key),
                  )
                  .map((item) => (
                    <div className="nav-entry" key={item.key}>
                      {item.group && (
                        <span className="nav-group-label">{item.group}</span>
                      )}
                      <button
                        key={item.key}
                        className={`nav-item ${!oracleOpen && c.workspace.section === item.key ? 'active' : ''}`}
                        onClick={() => {
                          setOracleOpen(false);
                          navigate(item.key);
                        }}
                      >
                        <item.icon size={17} />
                        {item.label}
                        {item.key === 'dungeons' && c.dungeons.length > 0 && (
                          <span className="nav-count">{c.dungeons.length}</span>
                        )}
                      </button>
                    </div>
                  ))}
                <details className="optional-record-nav">
                  <summary>보조 기록 ›</summary>
                  {nav
                    .filter((item) =>
                      [
                        'sessions',
                        'timeline',
                        'threads',
                        'rumors',
                        'relics',
                        'journal',
                      ].includes(item.key),
                    )
                    .map((item) => (
                      <div className="nav-entry" key={item.key}>
                        {item.group && (
                          <span className="nav-group-label">{item.group}</span>
                        )}
                        <button
                          key={item.key}
                          className={`nav-item ${!oracleOpen && c.workspace.section === item.key ? 'active' : ''}`}
                          onClick={() => {
                            setOracleOpen(false);
                            navigate(item.key);
                          }}
                        >
                          <item.icon size={17} />
                          {item.label}
                          {item.key === 'dungeons' && c.dungeons.length > 0 && (
                            <span className="nav-count">
                              {c.dungeons.length}
                            </span>
                          )}
                        </button>
                      </div>
                    ))}
                </details>
                {fateLink}
              </nav>
              <div className="side-divider small-divider" />
              <button
                className="nav-item utility"
                onClick={() => exportCampaign(c)}
              >
                <Download size={15} /> 캠페인 내보내기
              </button>
              <button
                className="nav-item utility"
                onClick={() => setImportText('')}
              >
                <Upload size={15} /> 캠페인 가져오기
              </button>
            </>
          ) : (
            <>
              <div className="eyebrow">심판의 작업실</div>
              <button
                className={`nav-item ${!oracleOpen ? 'active' : ''}`}
                onClick={home}
              >
                <BookOpen size={18} /> 나의 캠페인
                <ArrowUpRight size={15} />
              </button>
              {fateLink}
              <button
                className={`nav-item ${oracleOpen ? 'active' : ''}`}
                onClick={openOracles}
              >
                <Dices size={17} /> REFERENCE DESK
              </button>
            </>
          )}
          <div className="sidebar-bottom">
            <Skull size={30} />
            <p>
              세계는 끝나가고 있습니다.
              <br />
              필요한 표를 펼치세요.
            </p>
            <button className="credits-link" onClick={() => setAbout(true)}>
              소개 및 출처 <ArrowUpRight size={12} />
            </button>
            <span className="local-mark">● 이 기기에 저장됨</span>
          </div>
        </aside>
        <div className="shell">
          <header className="topbar">
            <div className="topbar-title">
              <Button
                className="icon-btn mobile-menu"
                aria-label="메뉴 열기"
                onClick={() => setDrawer(true)}
              >
                <Menu size={20} />
              </Button>
              <span>
                {oracleOpen
                  ? 'PLAY REFERENCE & ORACLES'
                  : (c?.title ?? '보관한 자료')}
              </span>
            </div>
            <ReferenceSearchButton />
            <span
              className={`save-state ${error ? 'save-error' : ''}`}
              title={error ?? '모든 변경 사항이 이 기기에 저장되었습니다'}
            >
              {error ? <Info size={13} /> : <Check size={13} />}
              <span>{error ? '저장 확인 필요' : '기기에 저장됨'}</span>
            </span>
          </header>
          {error && (
            <div className="error-banner" role="alert">
              <p>{error}</p>
              <div className="actions">
                {blocked ? (
                  <>
                    {recovery && (
                      <Button
                        className="btn small"
                        onClick={() =>
                          downloadText(recovery, 'codex-recovery.json')
                        }
                      >
                        복구 파일 내려받기
                      </Button>
                    )}
                    <Button
                      className="btn small"
                      onClick={() =>
                        confirm(
                          '새 저장 데이터로 시작할까요?',
                          '먼저 복구 파일을 내려받으세요. 읽을 수 없는 기존 저장 데이터를 교체합니다.',
                          resetDamagedSave,
                        )
                      }
                    >
                      손상된 저장 데이터 초기화
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      className="btn small"
                      onClick={() => downloadJson(save, 'codex-backup.json')}
                    >
                      전체 데이터 내보내기
                    </Button>
                    <Button className="btn small" onClick={retrySave}>
                      저장 재시도
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
          {(c || oracleOpen) && <TranslationDataNotice />}
          {c && !rules.pack && c.workspace.section !== 'about' && (
            <div
              className="rules-banner"
              role={rules.loading ? 'status' : 'alert'}
            >
              <div>
                <strong>
                  {rules.loading
                    ? '생성표를 불러오는 중입니다.'
                    : '랜덤 생성 자료를 불러오지 못했습니다.'}
                </strong>
                <p>
                  {rules.loading
                    ? '준비가 끝나면 지역을 선택해 던전과 방을 생성할 수 있습니다.'
                    : rules.error}
                </p>
              </div>
              {!rules.loading && (
                <div className="actions">
                  <Button className="btn" onClick={() => void loadRules()}>
                    다시 불러오기
                  </Button>
                  <Button className="btn" onClick={() => navigate('about')}>
                    자료 및 규칙 열기
                  </Button>
                </div>
              )}
            </div>
          )}
          <main className="content" inert={blocked}>
            {c && (
              <nav className="codex-breadcrumb" aria-label="현재 위치">
                <button onClick={home}>캠페인 목록</button>
                <span>/</span>
                <button onClick={() => navigate('dungeons')}>{c.title}</button>
                <span>/</span>
                <span aria-current="page">
                  {oracleOpen
                    ? 'ORACLES'
                    : c.workspace.section === 'notes'
                      ? '캠페인 노트'
                      : c.workspace.section === 'characters'
                        ? characterPageTitle || '캐릭터 보관함'
                        : c.workspace.section === 'monsters'
                          ? monsterPageTitle || '몬스터 보관함'
                          : contentKind
                            ? contentPageTitle ||
                              (contentKind === 'npcs'
                                ? 'NPC 보관함'
                                : '조우 보관함')
                            : c.workspace.section === 'about'
                              ? '자료 및 규칙'
                              : c.workspace.section === 'dungeons'
                                ? c.workspace.dungeonPreview
                                  ? '새 던전 후보'
                                  : pageDungeon?.title || '던전 보관함'
                                : nav.find((n) => n.key === c.workspace.section)
                                    ?.label || '던전 보관함'}
                </span>
              </nav>
            )}
            <DeferredView
              resetKey={`${c?.id ?? 'standalone'}:${oracleOpen ? (legacyOracleOpen ? 'oracles' : 'desk') : (c?.workspace.section ?? 'campaigns')}`}
            >
              {c && !oracleOpen && <ObjectPlayTools campaign={c} />}
              {oracleOpen ? (
                legacyOracleOpen ? (
                  <Oracles
                    campaign={c}
                    context={oracleContext}
                    onClose={() => setLegacyOracleOpen(false)}
                    notify={notify}
                  />
                ) : (
                  <ReferenceDesk onLibrary={() => setLegacyOracleOpen(true)} />
                )
              ) : !c ? (
                <>
                  <div className="eyebrow">끔찍한 것들의 연대기 / 제1권</div>
                  <div className="page-heading">
                    <div>
                      <h1>
                        나의 캠페인<span className="acid">.</span>
                      </h1>
                      <p>모든 파멸의 이야기는 빈 페이지에서 시작됩니다.</p>
                    </div>
                    <Button
                      className="btn primary"
                      onClick={() => openForm('campaign')}
                    >
                      <Plus /> 새 캠페인
                    </Button>
                  </div>
                  <div className="campaign-grid">
                    {save.campaigns.map((campaign, i) => (
                      <article className="campaign-card" key={campaign.id}>
                        <div className="card-meta">
                          <span>연대기 {String(i + 1).padStart(2, '0')}</span>
                          <BookOpen size={21} />
                        </div>
                        <button
                          className="card-title"
                          onClick={() => openCampaign(campaign)}
                        >
                          {campaign.title}
                        </button>
                        {(campaign.description || campaign.subtitle) && (
                          <details className="card-details">
                            <summary>설명</summary>
                            <p>{campaign.description || campaign.subtitle}</p>
                          </details>
                        )}
                        <div className="card-counts">
                          <span>{campaign.dungeons.length} 던전</span>
                          <span>
                            {campaign.dungeons.reduce(
                              (n, d) => n + d.rooms.length,
                              0,
                            )}
                            개 방
                          </span>
                        </div>
                        <div className="card-actions">
                          <Button
                            className="btn ghost"
                            onClick={() => openCampaign(campaign)}
                          >
                            캠페인 열기 <ArrowRight size={16} />
                          </Button>
                          <Button
                            className="icon-btn"
                            aria-label={`${campaign.title} 이름 변경`}
                            title="이름 변경"
                            onClick={() => renameCampaign(campaign)}
                          >
                            <Pencil size={16} />
                          </Button>
                          <Button
                            className="icon-btn"
                            aria-label={`${campaign.title} 내보내기`}
                            onClick={() => exportCampaign(campaign)}
                          >
                            <Download size={16} />
                          </Button>
                          <Button
                            className="icon-btn"
                            aria-label={`${campaign.title} 복제`}
                            onClick={() => duplicate(campaign)}
                          >
                            <Copy size={16} />
                          </Button>
                          <Button
                            className="icon-btn danger"
                            aria-label={`${campaign.title} 삭제`}
                            onClick={() => remove(campaign)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </article>
                    ))}
                    <article className="new-campaign">
                      <Button
                        className="btn primary"
                        onClick={() => openForm('campaign')}
                      >
                        <Plus /> 새 캠페인
                        <ArrowRight size={17} />
                      </Button>
                    </article>
                    {!save.campaigns.length && (
                      <article className="field-guide">
                        <span className="eyebrow">심판의 메모</span>
                        <h2>
                          주사위를 굴리고,
                          <br />
                          중요한 것을 남기세요.
                        </h2>
                        <div>
                          <b>01</b>
                          <p>
                            <strong>기록할 세계를 만드세요.</strong>
                            <br />
                            캠페인을 열고 이름을 붙이세요.
                          </p>
                        </div>
                        <div>
                          <b>02</b>
                          <p>
                            <strong>위험한 것들을 채우세요.</strong>
                            <br />
                            지역을 선택하고 던전과 방을 굴리세요.
                          </p>
                        </div>
                        <div>
                          <b>03</b>
                          <p>
                            <strong>모든 것에는 자리가 있습니다.</strong>
                            <br />
                            마음에 드는 후보를 선택하고 기록을 이어가세요.
                          </p>
                        </div>
                        <Button
                          className="btn ghost"
                          onClick={() => setImportText('')}
                        >
                          <Upload size={16} /> 캠페인 가져오기
                        </Button>
                      </article>
                    )}
                  </div>
                  {save.campaigns.length > 0 && (
                    <Button
                      className="btn ghost import-link"
                      onClick={() => setImportText('')}
                    >
                      <Upload size={16} /> 캠페인 가져오기
                    </Button>
                  )}
                </>
              ) : c.workspace.section === 'overview' ? (
                <>
                  <CampaignHome
                    campaign={c}
                    onCapture={() => setCaptureKind('event')}
                  />
                  <div className="campaign-home-actions">
                    <Button
                      className="btn ghost small"
                      onClick={() => openForm('rename')}
                    >
                      <Pencil size={14} />
                      캠페인 수정
                    </Button>
                    <Button
                      className="btn ghost small"
                      onClick={() => duplicate(c)}
                    >
                      <Copy size={14} />
                      복제
                    </Button>
                    <Button
                      className="btn ghost small danger"
                      onClick={() => remove(c)}
                    >
                      캠페인 삭제
                    </Button>
                  </div>
                </>
              ) : c.workspace.section === 'sessions' ? (
                <Sessions
                  campaign={c}
                  onCapture={() => setCaptureKind('event')}
                />
              ) : c.workspace.section === 'timeline' ? (
                <Timeline
                  campaign={c}
                  onCapture={() => setCaptureKind('event')}
                />
              ) : c.workspace.section === 'play' ? (
                <PlayMode
                  campaign={c}
                  onCapture={(kind = 'event') => setCaptureKind(kind)}
                  onOracles={openOracles}
                  notify={notify}
                />
              ) : c.workspace.section === 'procedures' ? (
                <section className="chronicle-page">
                  <div className="chronicle-heading">
                    <div>
                      <span className="eyebrow">THE DYING WORLD</span>
                      <h1>
                        재앙과 여정<span className="acid">.</span>
                      </h1>
                    </div>
                  </div>
                  <CampaignProcedures campaign={c} notify={notify} />
                </section>
              ) : ['threads', 'rumors', 'relics', 'journal'].includes(
                  c.workspace.section,
                ) ? (
                <CampaignRecords
                  key={`${c.id}:${c.workspace.section}`}
                  campaign={c}
                  section={c.workspace.section as RecordSection}
                />
              ) : c.workspace.section === 'about' ? (
                <Sources campaign={c} notify={notify} />
              ) : c.workspace.section === 'dungeons' ? (
                <Dungeons
                  campaign={c}
                  create={() => openForm('dungeon')}
                  confirm={confirm}
                  notify={notify}
                />
              ) : c.workspace.section === 'notes' ? (
                <>
                  <div className="eyebrow">캠페인 / 여백의 기록</div>
                  <div className="page-heading">
                    <div>
                      <h1>
                        종말에 맞서는 기록<span className="acid">.</span>
                      </h1>
                      <p>
                        미해결 사건, 주워들은 거짓말, 그리고 일행을 기다리는
                        계획.
                      </p>
                    </div>
                  </div>
                  <div className="notebook">
                    <Textarea
                      className="notebook-input"
                      aria-label="캠페인 노트"
                      value={c.notes}
                      onChange={(e) =>
                        editCampaign(c.id, (next) => {
                          next.notes = e.target.value;
                        })
                      }
                      placeholder="사건이 시작되는 곳부터 기록하세요…"
                    />
                  </div>
                </>
              ) : c.workspace.section === 'characters' ? (
                <Characters campaign={c} confirm={confirm} notify={notify} />
              ) : c.workspace.section === 'monsters' ? (
                <Monsters
                  key={`${c.id}:${c.workspace.selected.monsters ?? 'library'}`}
                  campaign={c}
                  confirm={confirm}
                  notify={notify}
                />
              ) : (
                <ContentLibrary
                  key={
                    c.id +
                    ':' +
                    c.workspace.section +
                    ':' +
                    (c.workspace.selected[
                      c.workspace.section === 'npcs' ? 'npcs' : 'encounters'
                    ] ?? 'library')
                  }
                  campaign={c}
                  kind={c.workspace.section === 'npcs' ? 'npcs' : 'encounters'}
                  confirm={confirm}
                  notify={notify}
                />
              )}
            </DeferredView>
            <footer className="page-footer">
              <button onClick={() => setAbout(true)}>
                MÖRK BORG 비공식 보조 도구 ↗
              </button>
              <span>당신의 세계는 이 기기에 저장됩니다.</span>
            </footer>
          </main>
        </div>
        <input
          type="file"
          accept=".json,application/json"
          ref={fileRef}
          className="sr-only"
          aria-label="캠페인 가져오기 JSON"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void importFile(file);
            e.target.value = '';
          }}
        />
        <Dialog
          open={!!form}
          onOpenChange={(open) => {
            if (!open) setForm(null);
          }}
        >
          <DialogContent className="codex-dialog">
            <DialogTitle>
              {form === 'rename'
                ? '표지를 다시 쓰세요.'
                : '파멸의 연대기를 시작하세요.'}
            </DialogTitle>
            <DialogDescription>
              {form === 'rename'
                ? '캠페인을 당신의 말로 기록하세요.'
                : '이름도 바로 굴릴 수 있습니다. 나중에 언제든 바꿀 수 있습니다.'}
            </DialogDescription>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (form === 'rename' && !title.trim()) return;
                if (form === 'campaign') {
                  const value = createCampaign(
                    title.trim() ||
                      (rules.pack
                        ? dungeonTitle()
                        : `Campaign ${save.campaigns.length + 1}`),
                    subtitle,
                  );
                  transact((next) => {
                    next.campaigns.push(value);
                    openCampaignLibrary(next, value.id);
                  });
                } else if (form === 'rename' && renameId) {
                  editCampaign(renameId, (next) => {
                    next.title = title.trim();
                    next.subtitle = subtitle;
                    next.description = subtitle;
                  });
                }
                setForm(null);
              }}
            >
              <label htmlFor="create-title">캠페인 제목</label>
              <div className="form-title-row">
                <Input
                  id="create-title"
                  value={title}
                  maxLength={200}
                  required={form === 'rename'}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="The Ashen Psalm"
                />
                {form === 'campaign' && (
                  <Button
                    type="button"
                    className="icon-btn"
                    disabled={!rules.pack}
                    aria-label="캠페인 제목 재굴림"
                    onClick={() => setTitle(dungeonTitle())}
                  >
                    <Dices size={20} />
                  </Button>
                )}
              </div>

              <>
                <label htmlFor="create-subtitle">
                  부제 / 간단한 설명 <span>선택 사항</span>
                </label>
                <Textarea
                  id="create-subtitle"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="모든 것이 무너지기 전에 남길 몇 마디."
                />
              </>

              <div className="dialog-actions">
                <Button
                  type="button"
                  className="btn"
                  onClick={() => setForm(null)}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  className="btn primary"
                  disabled={form === 'rename' && !title.trim()}
                >
                  {form === 'rename' ? '변경 저장' : '캠페인 만들기'}
                  <ArrowRight size={16} />
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        <Dialog
          open={!!confirmation}
          onOpenChange={(open) => {
            if (!open) setConfirmation(null);
          }}
        >
          <DialogContent className="codex-dialog">
            <DialogTitle>{confirmation?.title}</DialogTitle>
            <DialogDescription>{confirmation?.description}</DialogDescription>
            <div className="dialog-actions">
              <Button className="btn" onClick={() => setConfirmation(null)}>
                취소
              </Button>
              <Button
                className="btn primary"
                onClick={() => {
                  const action = confirmation?.action;
                  setConfirmation(null);
                  action?.();
                }}
              >
                확인
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <Dialog
          open={importText !== null}
          onOpenChange={(open) => {
            if (!open) setImportText(null);
          }}
        >
          <DialogContent className="codex-dialog">
            <DialogTitle>캠페인 가져오기</DialogTitle>
            <DialogDescription>
              내보낸 JSON 파일을 선택하거나 내용을 붙여넣으세요. 같은 ID의
              캠페인이 있으면 새 복제본으로 가져옵니다.
            </DialogDescription>
            <Button className="btn" onClick={() => fileRef.current?.click()}>
              <Upload size={15} /> JSON 파일 선택
            </Button>
            <Textarea
              className="export-json"
              aria-label="가져올 캠페인 JSON"
              value={importText ?? ''}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="또는 JSON 내용을 여기에 붙여넣으세요."
            />
            <div className="dialog-actions">
              <Button className="btn" onClick={() => setImportText(null)}>
                취소
              </Button>
              <Button
                className="btn primary"
                disabled={!importText?.trim()}
                onClick={() => importJson(importText ?? '')}
              >
                붙여넣은 JSON 가져오기
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <Dialog
          open={!!exportData}
          onOpenChange={(open) => {
            if (!open) setExportData(null);
          }}
        >
          <DialogContent className="codex-dialog">
            <DialogTitle>캠페인 내보내기</DialogTitle>
            <DialogDescription>
              파일로 저장하거나 JSON 내용을 복사해 백업하세요.
              NPC·조우·참가자·배치, 캐릭터와 장비, 던전·방·메모, 미저장 초안 및
              Mythic Chaos·판정 기록이 포함됩니다.
            </DialogDescription>
            <Textarea
              className="export-json"
              aria-label="캠페인 JSON"
              readOnly
              value={exportData?.text ?? ''}
            />
            <div className="dialog-actions">
              <Button
                className="btn"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(exportData?.text ?? '');
                    notify('캠페인 JSON을 복사했습니다.');
                  } catch {
                    notify(
                      '복사를 사용할 수 없습니다. 위 내용을 직접 선택해 복사하세요.',
                    );
                  }
                }}
              >
                JSON 복사
              </Button>
              <Button
                className="btn primary"
                onClick={() => {
                  if (exportData)
                    downloadText(exportData.text, exportData.filename);
                }}
              >
                JSON 파일 저장
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <Dialog
          open={!!importError}
          onOpenChange={(open) => {
            if (!open) setImportError('');
          }}
        >
          <DialogContent className="codex-dialog">
            <DialogTitle>이 파일을 읽을 수 없습니다.</DialogTitle>
            <DialogDescription>{importError}</DialogDescription>
            <p>기존 캠페인은 변경되지 않았습니다.</p>
            <Button className="btn" onClick={() => setImportError('')}>
              닫기
            </Button>
          </DialogContent>
        </Dialog>
        <Dialog open={about} onOpenChange={setAbout}>
          <DialogContent className="codex-dialog about-dialog">
            <DialogTitle>Campaign Codex</DialogTitle>
            <details className="sheet-source">
              <summary>개인 자료 · 갱신 관리</summary>
              <PrivateDataTools backup />
            </details>
            <DialogDescription>
              종이 기록장 곁의 규칙·Oracle 작업대.
            </DialogDescription>
            <div className="about-body">
              <Button
                className="btn"
                onClick={() => {
                  const original =
                    localStorage.getItem(MIGRATION_BACKUP_KEY) ??
                    localStorage.getItem('morkborg-codex:pre-v3-backup') ??
                    localStorage.getItem('morkborg-codex:pre-v2-backup');
                  if (original)
                    downloadText(
                      original,
                      'campaign-codex-original-backup.json',
                    );
                  else notify('이 기기에 변환 전 저장 원본이 없습니다.');
                }}
              >
                <Download size={16} /> 변환 전 저장 원본 내보내기
              </Button>
              <p>
                Campaign Codex is an independent production by Imwul and is not
                affiliated with Ockult Örtmästare Games or Stockholm Kartell. It
                is published under the MÖRK BORG Third Party License.
              </p>
              <p>
                MÖRK BORG is copyright Ockult Örtmästare Games and Stockholm
                Kartell.
              </p>
              <p>
                작업 흐름 참고:{' '}
                <a
                  href="https://dngngen.makedatanotlore.dev"
                  target="_blank"
                  rel="noreferrer"
                >
                  DNGNGEN
                </a>
                ,{' '}
                <a
                  href="https://monster.makedatanotlore.dev"
                  target="_blank"
                  rel="noreferrer"
                >
                  The Monster Approaches
                </a>
                , and{' '}
                <a
                  href="https://1d105.itch.io/dngnstock"
                  target="_blank"
                  rel="noreferrer"
                >
                  DNGNSTOCK by 1d10+5
                </a>
                . 공개된 생성 구조를 참고했으며, 생성 문구는 제공된 룰북의 실제
                표를 사용합니다.
              </p>
              <p>
                생성표는 사용자가 제공한 MÖRK BORG, FERETORY, HERETIC, Sölitary
                Defilement, Sölitary Depths, RECLVSE, Mythic GME Second Edition,
                Alöne in the Crowd에서 확인한 자료를 사용합니다. 임의로 창작한
                생성표는 포함하지 않습니다. 선택 직업의 고유 규칙은 직접
                적용합니다.
              </p>
              <p>
                지역과 고유명사는 원문 표기를 유지합니다. 표의 결과는 원문
                영어를 보존하며, 화면 안내는 한국어로 제공합니다. 미리보기
                이미지는 AI로 제작했습니다.
              </p>
              <p>
                서체:{' '}
                <a
                  href="https://github.com/Omnibus-Type/Grenze-Gotisch"
                  target="_blank"
                  rel="noreferrer"
                >
                  Grenze Gotisch
                </a>
                {' · '}
                <a
                  href="https://github.com/google/fonts/tree/main/ofl/alegreya"
                  target="_blank"
                  rel="noreferrer"
                >
                  Alegreya
                </a>
                {' · '}
                <a
                  href="https://github.com/orioncactus/pretendard"
                  target="_blank"
                  rel="noreferrer"
                >
                  Pretendard
                </a>
                . SIL Open Font License로 제공되며 이 앱에 함께 저장됩니다.
              </p>
              <p>
                <a
                  href="https://morkborg.com/license/"
                  target="_blank"
                  rel="noreferrer"
                >
                  MÖRK BORG Third Party License ↗
                </a>{' '}
                ·{' '}
                <a
                  href="https://github.com/Imwul/morkborg"
                  target="_blank"
                  rel="noreferrer"
                >
                  Source on GitHub ↗
                </a>
              </p>
              <hr />
              <p>
                <HardDrive size={15} /> 캠페인은 이 브라우저에 저장됩니다.
                사이트 데이터를 지우면 저장 내용도 사라집니다. JSON 내보내기로
                백업하거나 다른 브라우저로 옮기세요.
              </p>
            </div>
          </DialogContent>
        </Dialog>
        <button
          ref={fateLauncherRef}
          className="fate-launcher"
          onClick={openFate}
          aria-label={
            'Mythic 운명 판정 열기 · Chaos ' + mythicState.chaosFactor
          }
          aria-expanded={fateOpen}
          aria-controls="mythic-panel"
          title="Mythic Fate · Ctrl/⌘ + Shift + F"
        >
          <Dices size={20} />
          <span>FATE</span>
          <strong>CF {mythicState.chaosFactor}</strong>
        </button>
        {c &&
          !oracleOpen &&
          ['sessions', 'timeline', 'play', 'journal'].includes(
            c.workspace.section,
          ) && (
            <button
              className="quick-capture-launcher"
              onClick={() => setCaptureKind('event')}
            >
              <NotebookPen size={17} />
              <span>RECORD</span>
            </button>
          )}
        {c && captureKind && (
          <DeferredView
            overlay
            label="빠른 기록"
            resetKey={`${c.id}:${captureKind}`}
          >
            <QuickCapture
              key={`${c.id}:${captureKind}`}
              campaign={c}
              initialKind={captureKind}
              onClose={() => setCaptureKind(null)}
              notify={notify}
            />
          </DeferredView>
        )}
        {fateRequested && (
          <DeferredView
            overlay
            active={fateOpen}
            label="Mythic Fate"
            resetKey={c?.id ?? 'standalone'}
          >
            <MythicPanel
              key={c?.id ?? 'standalone'}
              open={fateOpen}
              onOpenChange={setFateOpen}
              campaign={c}
              state={mythicState}
              context={oracleOpen ? oracleContext : null}
              saveError={error}
              notify={notify}
              launcherRef={fateLauncherRef}
            />
          </DeferredView>
        )}
        {toast && (
          <output className="toast">
            <Check size={17} />
            {toast}
            <button aria-label="알림 닫기" onClick={() => setToast('')}>
              <X size={15} />
            </button>
          </output>
        )}
      </div>
    </ReferenceProvider>
  );
}
