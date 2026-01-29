
import { createIcons, icons } from 'lucide';
import { store } from '../core/Store.js';

const NAV_CONFIG = [
  { id: 'dashboard', icon: 'layout-dashboard', label: 'Dashboard' },
  { id: 'agents', icon: 'users', label: 'Agentes' },
  { id: 'reports', icon: 'file-text', label: 'Informes' },
  { id: 'calendar', icon: 'calendar', label: 'Calendario' }, // Inspired by reference
  { id: 'activity', icon: 'activity', label: 'Actividad' }   // Inspired by reference
];

export class Sidebar {
  constructor() {
    this.activeId = 'dashboard';
    this.isCollapsed = false;
    this.searchResults = [];
    this.focusedIndex = -1;
    this.element = document.createElement('aside');

    this.handleSearchInput = this.handleSearchInput.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleClickOutside = this.handleClickOutside.bind(this);
    this.element.className = 'sidebar-container'; // Using custom class
    this.updateWidth();
    this.init();
  }

  getElement() {
    return this.element;
  }

  init() {
    this.render();
    this.setupEventListeners();
    this.updateActiveState();
    createIcons({ icons, nameAttr: 'data-lucide' });
  }

  updateWidth() {
    if (this.isCollapsed) {
      this.element.classList.add('collapsed');
    } else {
      this.element.classList.remove('collapsed');
    }
  }

  render() {
    this.element.innerHTML = `
      ${this.renderHeader()}
      ${this.renderSearch()}
      ${this.renderNav()}
      ${this.renderFooter()}
      <input type="file" id="excelInput" accept=".xlsx, .xls" class="hidden" />
      <input type="file" id="folderInput" webkitdirectory directory multiple class="hidden" />
    `;
    createIcons({ icons, nameAttr: 'data-lucide' });
  }

  renderHeader() {
    return `
      <div class="sidebar-header">
        <div class="brand">
            <div class="brand-icon">
              <i data-lucide="bar-chart-2" class="text-white w-5 h-5"></i>
            </div>
            <h1 class="brand-text">KPI Analyzer</h1>
        </div>

        <button id="sidebar-toggle" class="p-2 text-slate-400 hover:text-white transition-colors">
           <i data-lucide="${this.isCollapsed ? 'panel-left-open' : 'panel-left-close'}" class="w-5 h-5"></i>
        </button>
      </div>
    `;
  }

  renderSearch() {
    return `
      <div class="sidebar-search relative">
        <div class="search-wrapper relative z-20">
           ${!this.isCollapsed ? `
             <i data-lucide="search" class="search-icon"></i>
             <input type="text" id="sidebarSearchInput" placeholder="Buscar agente o ID..." class="search-input" autocomplete="off">
             <!-- Search Results Dropdown -->
             <div id="searchResults" class="absolute left-0 w-full bg-white rounded-xl shadow-2xl border border-slate-200 hidden transform transition-all duration-200 origin-top z-50 custom-scrollbar" style="top: calc(100% + 0.5rem); max-height: 320px; overflow-y: auto;">
             </div>
           ` : `
             <button class="nav-item justify-center w-full" style="padding:0; height: 2.5rem;" title="Expandir para buscar">
                <i data-lucide="search" class="w-4 h-4 text-slate-400"></i>
             </button>
           `}
        </div>
      </div>
    `;
  }

  // Restoring missing methods

  renderNav() {
    return `
      <nav class="sidebar-nav">
        ${!this.isCollapsed ? '<div class="nav-section-title">Menu</div>' : ''}
        ${NAV_CONFIG.map(item => this.createNavItemHTML(item)).join('')}

        <div class="h-px bg-white/10 my-4 w-full"></div>
        
        ${!this.isCollapsed ? '<div class="nav-section-title">Datos</div>' : ''}
        ${this.renderActionButtons()}
      </nav>
    `;
  }

  createNavItemHTML({ id, icon, label }) {
    return `
      <button class="nav-item" data-nav="${id}" title="${label}">
        <i data-lucide="${icon}" class="nav-icon"></i>
        <span class="nav-label">${label}</span>
      </button>
    `;
  }

  renderActionButtons() {
    return `
      <button class="nav-item" data-action="import" title="Importar Excel">
          <i data-lucide="file-spreadsheet" class="nav-icon"></i>
          <span class="nav-label">Importar Excel</span>
      </button>
      
      <button class="nav-item" data-action="import-folder" title="Importar Carpeta">
          <i data-lucide="folder-open" class="nav-icon"></i>
          <span class="nav-label">Importar Carpeta</span>
      </button>

      <button class="nav-item" data-action="load-demo" title="Demo Data">
          <i data-lucide="database" class="nav-icon"></i>
           <span class="nav-label">Demo Data</span>
      </button>
    `;
  }

  renderFooter() {
    return `
      <div class="sidebar-footer">
        <button class="user-profile">
          <div class="avatar">JS</div>
          <div class="user-info">
            <p class="user-name">Jason S.</p>
            <p class="user-role">Admin Workspace</p>
          </div>
          <i data-lucide="more-vertical" class="w-4 h-4 text-slate-500 more-icon ml-auto"></i>
        </button>
      </div>
    `;
  }

  setupEventListeners() {
    // Toggle
    const toggleBtn = this.element.querySelector('#sidebar-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        this.isCollapsed = !this.isCollapsed;
        this.updateWidth();
        this.render();
        this.setupEventListeners();
        this.updateActiveState();
      });
    }

    // Nav Items
    this.element.querySelectorAll('button[data-nav]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetBtn = e.target.closest('button[data-nav]');
        if (targetBtn) {
          const route = targetBtn.dataset.nav;
          this.setActive(route);
          window.dispatchEvent(new CustomEvent('navigate', { detail: { route } }));
        }
      });
    });

    // File Actions
    const fileInput = this.element.querySelector('#excelInput');
    const folderInput = this.element.querySelector('#folderInput');

    this.bindAction('import', () => fileInput.click());
    this.bindAction('import-folder', () => folderInput.click());
    this.bindAction('load-demo', () => window.dispatchEvent(new CustomEvent('load-demo')));

    // Inputs Change
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length) this.emitFile(e.target.files[0]);
      e.target.value = '';
    });

    folderInput.addEventListener('change', (e) => {
      if (e.target.files.length) {
        window.dispatchEvent(new CustomEvent('folder-selected', { detail: { files: Array.from(e.target.files) } }));
      }
      e.target.value = '';
    });

    // Search Interaction
    const searchInput = this.element.querySelector('#sidebarSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', this.handleSearchInput);
      searchInput.addEventListener('keydown', this.handleKeyDown);
      document.addEventListener('click', this.handleClickOutside);
    }
  }

  handleSearchInput(e) {
    const query = e.target.value.toLowerCase().trim();
    const dropdown = this.element.querySelector('#searchResults');

    if (query.length < 2) {
      this.searchResults = [];
      this.focusedIndex = -1;
      if (dropdown) dropdown.classList.add('hidden');
      return;
    }

    const data = store.getAllData();
    this.searchResults = data.filter(agent => {
      const name = String(agent.agent || '').toLowerCase();
      const id = String(agent.id || agent.ID_empl || '').toLowerCase();

      // Check for "Login" compatibility (Admin Object matches AgentAdmin.js)
      const adminLogin = (agent.admin && agent.admin.login) ? String(agent.admin.login).toLowerCase() : '';
      // Fallback to raw if available
      const rawLogin = agent.raw ? String(agent.raw.Login || '').toLowerCase() : '';

      return name.includes(query) || id.includes(query) || adminLogin.includes(query) || rawLogin.includes(query);
    }).slice(0, 10); // Limit results

    this.focusedIndex = -1;
    this.renderSearchResults();
  }

  handleKeyDown(e) {
    const dropdown = this.element.querySelector('#searchResults');
    if (!dropdown || dropdown.classList.contains('hidden')) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.focusedIndex = (this.focusedIndex + 1) % this.searchResults.length;
      this.updateFocusedItem();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.focusedIndex = (this.focusedIndex - 1 + this.searchResults.length) % this.searchResults.length;
      this.updateFocusedItem();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (this.focusedIndex >= 0 && this.searchResults[this.focusedIndex]) {
        this.selectResult(this.searchResults[this.focusedIndex]);
      }
    } else if (e.key === 'Escape') {
      this.closeSearch();
    }
  }

  handleClickOutside(e) {
    const searchWrapper = this.element.querySelector('.search-wrapper');
    if (searchWrapper && !searchWrapper.contains(e.target)) {
      this.closeSearch();
    }
  }

  renderSearchResults() {
    const dropdown = this.element.querySelector('#searchResults');
    if (!dropdown) return;

    if (this.searchResults.length === 0) {
      dropdown.innerHTML = `
            <div class="px-4 py-3 text-xs text-slate-500 text-center font-medium bg-white">
                No se encontraron agentes
            </div>
        `;
    } else {
      dropdown.innerHTML = this.searchResults.map((agent, index) => {
        const name = agent.agent || 'Desconocido';
        const id = agent.id || agent.ID_empl || 'N/A';

        // Using inline styles for border and transition to ensure visibility
        return `
                <div class="search-result-item px-4 py-3 cursor-pointer bg-white border-b border-slate-100 last:border-none duration-200 group relative" 
                     data-index="${index}"
                     style="border-left: 4px solid transparent; transition: all 0.2s ease;">
                    <div class="flex items-center gap-3">
                         <div class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-black group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-sm icon-box">
                              ${name.substring(0, 2).toUpperCase()}
                         </div>
                         <div class="min-w-0 flex-1">
                             <div class="flex justify-between items-center">
                                <p class="text-xs font-bold text-slate-800 leading-tight group-hover:text-indigo-700 transition-colors truncate pr-2">${name}</p>
                                <i data-lucide="chevron-right" class="w-3 h-3 text-indigo-300 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300 chevron-icon"></i>
                             </div>
                             <div class="flex items-center gap-2 mt-1">
                                 <span class="text-[9px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors border border-slate-200 tag-box">${id}</span>
                                 <span class="text-[9px] text-slate-400 font-medium tracking-wide uppercase truncate max-w-[120px]">${agent.supervisor || ''}</span>
                             </div>
                         </div>
                    </div>
                </div>
            `;
      }).join('');

      dropdown.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
          const index = parseInt(item.dataset.index);
          this.selectResult(this.searchResults[index]);
        });

        item.addEventListener('mouseenter', () => {
          this.focusedIndex = parseInt(item.dataset.index);
          this.updateFocusedItem();
        });
      });
    }

    dropdown.classList.remove('hidden');
    createIcons({ icons, nameAttr: 'data-lucide' });
  }

  updateFocusedItem() {
    const items = this.element.querySelectorAll('.search-result-item');
    items.forEach((item, index) => {
      const icon = item.querySelector('.chevron-icon');
      const iconBox = item.querySelector('.icon-box'); // Helper class added above

      if (index === this.focusedIndex) {
        // Apply inline active styles
        item.style.backgroundColor = '#eef2ff'; // indigo-50
        item.style.borderLeftColor = '#6366f1'; // indigo-500

        if (icon) {
          icon.style.opacity = '1';
          icon.style.transform = 'translateX(0)';
        }
        item.scrollIntoView({ block: 'nearest' });
      } else {
        // Reset inline styles
        item.style.backgroundColor = 'white';
        item.style.borderLeftColor = 'transparent';

        if (icon) {
          icon.style.opacity = '0';
          icon.style.transform = 'translateX(0.5rem)';
        }
      }
    });
  }

  selectResult(agent) {
    if (!agent) return;

    // Dispatch event to open modal
    window.dispatchEvent(new CustomEvent('view-agent-profile', { detail: { agent } }));

    this.closeSearch();
  }

  closeSearch() {
    const dropdown = this.element.querySelector('#searchResults');
    const input = this.element.querySelector('#sidebarSearchInput');
    if (dropdown) dropdown.classList.add('hidden');
    if (input) input.value = '';
    this.searchResults = [];
    this.focusedIndex = -1;
    if (input) input.blur();
  }

  bindAction(actionName, handler) {
    const btn = this.element.querySelector(`button[data-action="${actionName}"]`);
    if (btn) btn.addEventListener('click', handler);
  }

  setActive(id) {
    this.activeId = id;
    this.updateActiveState();
  }

  updateActiveState() {
    const buttons = this.element.querySelectorAll('button[data-nav]');

    buttons.forEach(btn => {
      const isActive = btn.dataset.nav === this.activeId;
      if (isActive) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    createIcons({ icons, nameAttr: 'data-lucide' });
  }

  emitFile(file) {
    window.dispatchEvent(new CustomEvent('file-selected', { detail: { file } }));
  }
}
