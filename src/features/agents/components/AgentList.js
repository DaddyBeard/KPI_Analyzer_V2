import { createIcons, icons } from 'lucide';
import { KPI_CONFIG } from '../../../config/kpi.config.js';

export class AgentList {
  constructor(container) {
    this.container = container;
    this.data = [];
    this.filteredData = [];
    this.filters = {
      search: '',
      supervisor: 'all'
    };
    this.sortConfig = { key: 'ncoBO', direction: 'desc' };
    this.supervisors = [];

    // KPI Configuration (Centralized)
    this.kpiConfig = KPI_CONFIG;

    this.handleSearch = this.handleSearch.bind(this);
    this.handleFilter = this.handleFilter.bind(this);
    this.handleSort = this.handleSort.bind(this);
    this.isInitialized = false;
  }

  // --- Core Lifecycle ---

  setData(data) {
    this.data = data;
    const distinctSups = new Set(data.map(a => a.supervisor).filter(Boolean));
    this.supervisors = Array.from(distinctSups).sort();

    if (!this.isInitialized) {
      this.renderStructure();
      this.isInitialized = true;
    }

    this.updateSupervisorMetadata();
    this.applyFilters();
  }

  // --- Filtering Logic ---

  applyFilters() {
    const searchLower = this.filters.search.toLowerCase();
    const supervisorFn = (s) => this.filters.supervisor === 'all' || String(s).toLowerCase() === this.filters.supervisor.toLowerCase();

    let filtered = this.data.filter(agent => {
      const name = String(agent.agent || '').toLowerCase();
      const id = String(agent.id || '').toLowerCase();
      const sup = String(agent.supervisor || '').toLowerCase();

      const matchesSearch = name.includes(searchLower) || id.includes(searchLower) || sup.includes(searchLower);
      const matchesSup = supervisorFn(agent.supervisor);

      return matchesSearch && matchesSup;
    });

    // Apply Sorting
    const { key, direction } = this.sortConfig;
    if (key) {
      filtered.sort((a, b) => {
        let valA, valB;

        if (key === 'agentName') {
          valA = String(a.agent || '').toLowerCase();
          valB = String(b.agent || '').toLowerCase();
          return direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        } else {
          // KPI Sorting
          valA = a.kpis?.[key] ?? -Infinity;
          valB = b.kpis?.[key] ?? -Infinity;
          return direction === 'asc' ? valA - valB : valB - valA;
        }
      });
    }

    this.filteredData = filtered;
    this.updateTable();
  }

  handleSearch(e) {
    this.filters.search = e.target.value;
    this.applyFilters();
  }

  handleFilter(e) {
    this.filters.supervisor = e.target.value;
    this.applyFilters();
  }

  handleSort(key) {
    if (this.sortConfig.key === key) {
      this.sortConfig.direction = this.sortConfig.direction === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortConfig.key = key;
      this.sortConfig.direction = 'desc';
    }
    this.renderStructure();
    this.applyFilters();
  }

  getSortIcon(key) {
    if (this.sortConfig.key !== key) return `<i class="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" data-lucide="arrow-up-down"></i>`;
    return this.sortConfig.direction === 'asc'
      ? `<i class="w-3 h-3 text-indigo-600" data-lucide="arrow-up"></i>`
      : `<i class="w-3 h-3 text-indigo-600" data-lucide="arrow-down"></i>`;
  }

  // --- Rendering ---

  renderStructure() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="flex flex-col h-full w-full p-6 animate-fade-in" style="width: 100% !important;">
        <!-- Header Section -->
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4 animate-fade-in px-1 shrink-0">
          <div>
            <div class="flex items-center gap-3">
                 <h2 class="text-3xl font-black text-slate-800 tracking-tight leading-none">Agentes</h2>
                 <div class="bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                    <span class="text-xs font-bold text-indigo-600 tracking-wide uppercase">Operativo</span>
                </div>
            </div>
            <p class="text-slate-500 text-sm font-medium mt-1 ml-0.5">Gestión de rendimiento individual</p>
          </div>
          
           <!-- Control Bar (Integrated) -->
           <div class="flex flex-1 md:justify-end gap-3">
              <div class="relative group flex-1 max-w-sm">
                 <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i data-lucide="search" class="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors"></i>
                 </div>
                 <input type="text" id="searchInput" 
                   class="block w-full pl-9 pr-4 py-2 bg-white text-slate-700 placeholder-slate-400 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium shadow-sm" 
                   placeholder="Buscar agente...">
              </div>
              
              <div class="relative min-w-[200px] group">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i data-lucide="filter" class="w-3.5 h-3.5 text-slate-400"></i>
                 </div>
                  <select id="supervisorFilter" class="block w-full pl-9 pr-8 py-2 bg-white text-slate-600 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium shadow-sm appearance-none cursor-pointer">
                     <option value="all">Todos los Equipos</option>
                  </select>
                   <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <i data-lucide="chevron-down" class="w-3.5 h-3.5 text-slate-400"></i>
                 </div>
              </div>
              
               <div class="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm ml-2">
                 <span class="text-lg font-black text-indigo-600 leading-none" id="agentCount">0</span>
                 <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Act</span>
              </div>
           </div>
        </div>

        <!-- Data Grid Container (Flex Column) -->
        <div class="bg-white rounded-xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-100 flex-1 overflow-hidden flex flex-col relative w-full min-h-0">
          
          <!-- Scrollable Table Area (Flex-1) -->
          <div class="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar relative">
            <table class="w-full text-left border-collapse" style="width: 100% !important;">
              <thead class="sticky top-0 z-50">
                <tr class="bg-slate-50 border-b-2 border-slate-200 shadow-sm">
                  <th class="px-4 py-4 text-left sticky left-0 z-50 bg-slate-50 border-r border-slate-200/60 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)] w-[280px] cursor-pointer group hover:bg-slate-100 transition-colors" data-sort-key="agentName">
                      <div class="flex items-center gap-2">
                        <span class="text-[11px] font-black text-slate-600 uppercase tracking-widest pl-1">Agente / Supervisor</span>
                        ${this.getSortIcon('agentName')}
                      </div>
                  </th>
                  ${this.kpiConfig.map(kpi => `
                    <th class="px-2 py-3 text-center min-w-[95px] group cursor-pointer hover:bg-slate-100 transition-colors border-r border-slate-100/50 last:border-none" data-sort-key="${kpi.key}">
                      <div class="flex flex-col items-center gap-1 relative">
                          <div class="flex items-center gap-1">
                             <span class="text-[10px] font-extrabold text-slate-700 uppercase tracking-wide group-hover:text-indigo-600 transition-colors">${kpi.label}</span>
                             ${this.getSortIcon(kpi.key)}
                          </div>
                          <span class="text-[9px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">Obj: ${kpi.target}</span>
                      </div>
                    </th>
                  `).join('')}
                  <th class="px-3 py-2 text-right sticky right-0 z-50 bg-slate-50 shadow-[-4px_0_12px_-4px_rgba(0,0,0,0.05)] w-[60px] border-l border-slate-200/60"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200" id="agentsTableBody">
                <!-- Rows injected here -->
              </tbody>
            </table>
          </div>
          
          <!-- Footer (Fixed at Bottom) -->
          <div id="resultsFooter" class="shrink-0 px-8 py-4 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400 font-medium z-20 relative">
              <span>Mostrando registros</span>
              <span class="bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md border border-indigo-100" id="totalResultsBadge">0 resultados</span>
          </div>
        </div>
      </div>
    `;

    createIcons({ icons, nameAttr: 'data-lucide' });

    const searchInput = this.container.querySelector('#searchInput');
    const supSelect = this.container.querySelector('#supervisorFilter');

    // Sort Listeners
    this.container.querySelectorAll('th[data-sort-key]').forEach(th => {
      th.addEventListener('click', () => {
        this.handleSort(th.dataset.sortKey);
      });
    });

    if (searchInput) {
      searchInput.addEventListener('input', this.handleSearch);
      searchInput.value = this.filters.search;
    }
    if (supSelect) supSelect.addEventListener('change', this.handleFilter);
  }

  updateSupervisorMetadata() {
    const select = this.container.querySelector('#supervisorFilter');
    if (!select) return;

    const current = select.value;
    let html = '<option value="all">Todos los Equipos</option>';
    html += this.supervisors.map(s => `<option value="${s}">${s}</option>`).join('');
    select.innerHTML = html;

    if (this.supervisors.includes(current) || current === 'all') {
      select.value = current;
    } else {
      select.value = 'all';
      this.filters.supervisor = 'all';
    }
  }

  updateTable() {
    const tbody = this.container.querySelector('#agentsTableBody');
    const countEl = this.container.querySelector('#agentCount');
    const badgeEl = this.container.querySelector('#totalResultsBadge');

    if (!tbody) return;

    if (countEl) countEl.animate([{ opacity: 0.5, transform: 'scale(0.9)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 200 });
    if (countEl) countEl.textContent = this.filteredData.length;
    if (badgeEl) badgeEl.textContent = `${this.filteredData.length} resultados`;

    if (this.filteredData.length === 0) {
      tbody.innerHTML = `
        <tr>
            <td colspan="${this.kpiConfig.length + 2}" class="p-12 text-center">
                <div class="flex flex-col items-center gap-4 text-slate-400">
                    <div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                        <i data-lucide="search-x" class="w-8 h-8 opacity-50"></i>
                    </div>
                    <p class="font-medium">No se encontraron agentes</p>
                    <button class="text-indigo-500 hover:underline text-sm" onclick="document.getElementById('searchInput').value=''; document.getElementById('searchInput').dispatchEvent(new Event('input'))">
                        Limpiar filtros
                    </button>
                </div>
            </td>
        </tr>`;
      createIcons({ icons, nameAttr: 'data-lucide' });
      return;
    }

    const rows = this.filteredData.slice(0, 50).map(agent => this.renderRow(agent)).join('');
    tbody.innerHTML = rows;

    createIcons({ icons, nameAttr: 'data-lucide' });
  }

  renderRow(agent) {
    const name = String(agent.agent || 'Unknown');
    const supervisor = agent.supervisor || 'N/A';
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    // Generate random soft gradient based on name char code for avatar background
    const colors = ['bg-indigo-50 text-indigo-600', 'bg-rose-50 text-rose-600', 'bg-emerald-50 text-emerald-600', 'bg-amber-50 text-amber-600', 'bg-cyan-50 text-cyan-600'];
    const colorClass = colors[name.charCodeAt(0) % colors.length];

    return `
        <tr class="group transition-all duration-200 hover:bg-slate-50/80 hover:shadow-sm relative">
          <td class="px-4 py-2 sticky left-0 bg-white group-hover:bg-[#fcfdfec0] z-10 shadow-[2px_0_10px_-4px_rgba(0,0,0,0.05)] whitespace-nowrap border-r border-transparent group-hover:border-slate-100 border-b border-slate-300">
            <div class="flex items-center gap-3">
               <div class="w-8 h-8 rounded-lg ${colorClass} flex items-center justify-center text-[10px] font-black shadow-sm">
                  ${initials}
               </div>
               <div class="flex flex-col">
                   <span class="font-bold text-slate-700 text-xs truncate max-w-[140px]" title="${name}">${name}</span>
                   <span class="text-[9px] font-semibold text-slate-400 uppercase tracking-wider truncate max-w-[140px]">${supervisor}</span>
               </div>
            </div>
          </td>
          ${this.kpiConfig.map(kpi => {
      const val = agent.kpis ? agent.kpis[kpi.key] : null;
      let content = '<span class="text-slate-200 text-[10px]">-</span>';

      if (val !== null && val !== undefined) {
        const displayVal = kpi.isPercent ? (val * 1).toFixed(0) + '%' : (val * 1).toFixed(2);
        const style = this.getBadgeStyle(kpi, val);

        content = `
            <div class="flex justify-center">
                 <span class="${style.badge} px-2 py-0.5 rounded text-[11px] font-bold border min-w-[42px] text-center">
                   ${displayVal}
                 </span>
            </div>
        `;
      }
      return `<td class="px-2 py-2 align-middle border-b border-slate-300">${content}</td>`;
    }).join('')}
          <td class="px-3 py-2 text-right sticky right-0 bg-white group-hover:bg-[#fcfdfec0] z-10 transition-all border-l border-transparent group-hover:border-slate-100 border-b border-slate-300">
             <button class="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" data-action="view-agent" data-agent="${encodeURIComponent(name)}" title="Ver Ficha">
                <i data-lucide="arrow-right" class="w-4 h-4"></i>
             </button>
          </td>
        </tr>
      `;
  }

  getBadgeStyle(kpi, value) {
    let isGood = false;
    if (kpi.type === 'min') isGood = value >= kpi.target;
    if (kpi.type === 'max') isGood = value <= kpi.target;

    if (isGood) return { badge: 'bg-emerald-50 text-emerald-600 border-emerald-100' };

    const diff = Math.abs((value - kpi.target) / kpi.target);
    if (diff < 0.15) return { badge: 'bg-amber-50 text-amber-600 border-amber-100' };

    return { badge: 'bg-rose-50 text-rose-600 border-rose-100' };
  }
}
