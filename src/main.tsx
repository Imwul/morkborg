import './components/inline-reference-tools.css';
import './components/play-memory.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { getSnapshot, transact } from './storage/saveStore';
import './style.css';
import './workspace.css';
import './art-direction.css';
import './reference.css';
import './components/source-authority.css';
import './components/convenience.css';
import './components/home.css';
import './components/freeform-workbench.css';
import './components/reference-surface.css';
const navigation = performance.getEntriesByType('navigation')[0] as
  | PerformanceNavigationTiming
  | undefined;
const initial = getSnapshot();
if (
  navigation?.type !== 'reload' &&
  !window.history.state?.morkborgNavigationV1 &&
  !initial.blocked &&
  initial.save.view !== 'campaigns'
)
  transact((save) => {
    save.view = 'campaigns';
  });
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
