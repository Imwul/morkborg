import { PlayToolReferenceContext } from './components/ReferenceContext';
import { SavedObjectsPanel } from './components/SavedObjectsPanel';
import { useEffect, useRef, useState } from 'react';
import { Check, House, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { HomeIndex } from './components/HomeIndex';
import { MythicPanel } from './components/MythicPanel';
import { PrivateDataTools } from './components/PrivateDataTools';
import {
  ReferenceDesk,
  ReferenceProvider,
  type ReferenceDeskPage,
} from './components/ReferenceWorkbench';
import { Sources } from './components/Sources';
import { TranslationDataNotice } from './components/TranslationDataNotice';
import { defaultMythicState } from './domain/mythic';
import { useNavigationChannel } from './navigation/useNavigationHistory';
import { startPublishedDataUpdates } from './storage/publishedData';

type Surface = 'desk' | 'sources';

/** The standalone reference desk leaves older local records untouched. */
export default function App() {
  const [surface, setSurface] = useState<Surface>('desk');
  const [page, setPage] = useState<ReferenceDeskPage>('home');
  const [shelfOpen, setShelfOpen] = useState(false);
  const shelfLauncherRef = useRef<HTMLButtonElement>(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [fateOpen, setFateOpen] = useState(false);
  const [fateRequested, setFateRequested] = useState(false);
  const [listRequest, setListRequest] = useState(0);
  const [mythicState, setMythicState] = useState(defaultMythicState);
  const [toast, setToast] = useState('');
  const fateLauncherRef = useRef<HTMLButtonElement>(null);

  useEffect(startPublishedDataUpdates, []);
  useNavigationChannel('reference-shell', surface, setSurface, {
    normalize: (value) => (value === 'sources' ? 'sources' : 'desk'),
  });
  useNavigationChannel('reference-page', page, setPage, {
    normalize: (value) =>
      value === 'reference' || value === 'generators' || value === 'spatial'
        ? value
        : 'home',
  });
  useNavigationChannel('object-shelf', shelfOpen, setShelfOpen, {
    normalize: (value) => value === true,
    open: (value) => value,
  });
  useNavigationChannel('reference-about', aboutOpen, setAboutOpen, {
    normalize: (value) => value === true,
    open: (value) => value,
  });
  useNavigationChannel(
    'fate',
    fateOpen,
    (open) => {
      if (open) setFateRequested(true);
      setFateOpen(open);
    },
    {
      normalize: (value) => value === true,
      open: (value) => value,
    },
  );
  useEffect(() => {
    document.title =
      surface === 'sources'
        ? '자료 및 출처 — MÖRK BORG Reference Desk'
        : page === 'spatial'
          ? '공간 탐색 — MÖRK BORG Reference Desk'
          : page === 'generators'
            ? '생성기 — MÖRK BORG Reference Desk'
            : 'MÖRK BORG — Reference Desk';
  }, [surface, page]);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [surface]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.shiftKey &&
        event.key.toLowerCase() === 'f' &&
        !event.repeat
      ) {
        event.preventDefault();
        setFateRequested(true);
        setFateOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const openLists = () => {
      setFateRequested(true);
      setFateOpen(true);
      setListRequest((n) => n + 1);
    };
    window.addEventListener('mythic-open-lists', openLists);
    const openShelf = () => setShelfOpen(true);
    window.addEventListener('open-object-shelf', openShelf);
    return () => {
      window.removeEventListener('mythic-open-lists', openLists);
      window.removeEventListener('open-object-shelf', openShelf);
    };
  }, []);

  function openHome() {
    setSurface('desk');
    setPage('home');
  }
  function openFate() {
    setFateRequested(true);
    setFateOpen(true);
  }

  return (
    <ReferenceProvider inline notify={setToast}>
      <div className="app reference-app">
        <main className="content" aria-label="MÖRK BORG Reference Desk">
          <TranslationDataNotice />
          {surface === 'sources' ? (
            <div className="reference-info-page">
              <header className="reference-info-header">
                <button onClick={openHome} aria-label="홈으로">
                  <House size={18} /> 홈
                </button>
                <span>MÖRK BORG / REFERENCE DESK</span>
              </header>
              <Sources />
            </div>
          ) : (
            <ReferenceDesk
              initialPage="home"
              page={page}
              onPageChange={setPage}
              homeIndex={
                <HomeIndex
                  onSources={() => setSurface('sources')}
                  onFate={openFate}
                  onAbout={() => setAboutOpen(true)}
                />
              }
            />
          )}
        </main>

        <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
          <DialogContent className="codex-dialog reference-about-dialog">
            <DialogTitle>MÖRK BORG Reference Desk</DialogTitle>
            <DialogDescription>
              노트 곁에 펼쳐두는 규칙·오라클·생성기입니다.
            </DialogDescription>
            <div className="about-body">
              <p>
                Reference Desk is an independent production by Imwul and is not
                affiliated with Ockult Örtmästare Games or Stockholm Kartell. It
                is published under the MÖRK BORG Third Party License.
              </p>
              <p>
                MÖRK BORG is copyright Ockult Örtmästare Games and Stockholm
                Kartell.
              </p>
              <p>
                프라이빗 서버에서는 DNGNGEN, SCVMBIRTHER, The Monster
                Approaches의 별도 스냅샷을 해당 생성기의 원문으로 선택할 수
                있습니다.
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
              <PrivateDataTools backup />
            </div>
          </DialogContent>
        </Dialog>

        <div className="play-tools-dock" aria-label="플레이 도구">
          <button
            ref={shelfLauncherRef}
            onClick={() => setShelfOpen(true)}
            aria-expanded={shelfOpen}
          >
            보관함
          </button>
          <button
            ref={fateLauncherRef}
            onClick={openFate}
            aria-expanded={fateOpen}
            aria-label="Mythic Fate와 목록 열기"
          >
            Mythic <span>CF {mythicState.chaosFactor}</span>
          </button>
        </div>
        <PlayToolReferenceContext
          onNavigate={() => {
            setSurface('desk');
            if (page !== 'spatial') setPage('reference');
          }}
        >
          <SavedObjectsPanel
            open={shelfOpen}
            onOpenChange={setShelfOpen}
            launcherRef={shelfLauncherRef}
          />
          {fateRequested && (
            <MythicPanel
              open={fateOpen}
              onOpenChange={setFateOpen}
              listRequest={listRequest}
              state={mythicState}
              onStateChange={setMythicState}
              launcherRef={fateLauncherRef}
            />
          )}
        </PlayToolReferenceContext>
        {toast && (
          <output className="toast">
            <Check size={17} /> {toast}
            <button aria-label="알림 닫기" onClick={() => setToast('')}>
              <X size={15} />
            </button>
          </output>
        )}
      </div>
    </ReferenceProvider>
  );
}
