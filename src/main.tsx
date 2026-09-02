import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { getSnapshot, transact } from './storage/saveStore';
import './style.css';
import './workspace.css';
const navigation = performance.getEntriesByType('navigation')[0] as
  | PerformanceNavigationTiming
  | undefined;
const initial = getSnapshot();
if (
  navigation?.type !== 'reload' &&
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
