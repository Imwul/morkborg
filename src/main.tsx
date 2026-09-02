import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './style.css';
import { loadRules } from './storage/rulesStore';
void loadRules();
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
