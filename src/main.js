import './styles/theme.css';
import './styles/utilities.css';
import './styles/sidebar.css';
import { AppShell } from './layout/AppShell.js';

console.log('%c KPI Analyzer V2 (Refactored) Initialized ', 'background: #3b82f6; color: white; font-weight: bold; padding: 4px; border-radius: 4px;');

document.addEventListener('DOMContentLoaded', () => {
  new AppShell();
});
