
import { Sidebar } from './Sidebar.js';
import { createIcons, icons } from 'lucide';
import { readExcelFile } from '../features/data-loader/excel-reader.js';
import { DataMerger } from '../features/data-loader/DataMerger.js';
import { store } from '../core/Store.js';
import { AgentModalV4 } from '../features/agents/components/AgentModal_Refactored.js';
import { AgentList } from '../features/agents/components/AgentList.js';
// import { ChartComponent } from '../features/dashboard/components/ChartComponent.js';
import * as d3 from 'd3';
import { ReportService } from '../features/reports/ReportService.js';
import { ExcelExportService } from '../features/reports/ExcelExportService.js';
import { ExportOptionsModal } from '../features/reports/ExportOptionsModal.js';
import { demoData } from '../data/demo-data.js';
import { DataNormalizer } from '../features/data-loader/DataNormalizer.js';
import { FileSelectionModal } from '../features/data-loader/FileSelectionModal.js';
import { KPI_CONFIG } from '../config/kpi.config.js';
import { kpiContext } from '../features/settings/logic/KPIContext.js';
import { Settings } from '../features/settings/components/Settings.js';
import { escapeHTML } from '../shared/utils.js';
import { WelcomeScreen } from '../features/onboarding/WelcomeScreen.js';


export class AppShell {
  constructor() {
    console.log('%c APP SHELL RELOADED - USING AGENTMODAL V4', 'background: red; color: yellow; font-size: 20px;');
    this.appElement = document.getElementById('app');
    this.sidebar = new Sidebar();
    this.agentModal = new AgentModalV4();
    this.fileSelectionModal = new FileSelectionModal();
    this.mainContent = document.createElement('main');
    // Nexus Style: High density, clean white background
    this.mainContent.className = 'flex-1 h-screen overflow-hidden bg-[#F9FAFB] relative flex flex-col min-w-0 font-inter';
    this.mainContent.style.transition = 'opacity 200ms ease, transform 200ms ease';
    this.currentRoute = 'dashboard';

    // Chart Configuration State
    this.activeChartConfig = 'performance';
    this.chartConfigs = {
      performance: {
        id: 'performance',
        label: 'Rendimiento (AHT vs Calidad)',
        xKey: 'aht', xLabel: 'AHT (Segundos)', xTarget: 340, xInverted: true, // Lower AHT is better? Usually yes, but X axis is standard.
        yKey: 'ncoBO', yLabel: 'Calidad (NCO %)', yTarget: 85,
        zKey: 'gestH', zLabel: 'Volumen',
        quadrant: 'topLeft' // Good Zone
      },
      efficiency: {
        id: 'efficiency',
        label: 'Eficiencia (Volumen)',
        xKey: 'gestH', xLabel: 'Gestiones / Hora', xTarget: 2.5,
        yKey: 'cerrH', yLabel: 'Cierres / Hora', yTarget: 1.8,
        zKey: 'aht', zLabel: 'AHT (Tamaño)',
        quadrant: 'topRight'
      },
      quality: {
        id: 'quality',
        label: 'Satisfacción (NPS vs Calidad)',
        xKey: 'nps', xLabel: 'NPS', xTarget: 30,
        yKey: 'ncoBO', yLabel: 'Calidad Interna (NCO)', yTarget: 85,
        zKey: 'calls', zLabel: 'Llamadas',
        quadrant: 'topRight'
      }
    };

    this.init();
  }

  async init() {
    // Initial Loading State while Store is initializing from IndexedDB
    this.appElement.innerHTML = `
      <div class="h-screen w-full flex flex-col items-center justify-center bg-slate-50 gap-4">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p class="text-slate-400 font-medium animate-pulse">Restaurando sesión...</p>
      </div>`;

    await store.init();

    this.appElement.innerHTML = '';

    this.appElement.className = 'flex h-screen w-full overflow-hidden bg-slate-50 font-sans';
    this.appElement.appendChild(this.sidebar.getElement());
    this.appElement.appendChild(this.mainContent);

    // Data-driven navigation: if no data, go to welcome
    const data = store.getAllData();
    if (data.length === 0) {
      this.navigateTo('welcome');
    } else {
      this.navigateTo('dashboard');
    }

    store.addEventListener('data-updated', () => {
      // If we are in welcome and data arrives, auto-navigate to dashboard
      if (this.currentRoute === 'welcome' && store.getData().length > 0) {
        this.navigateTo('dashboard');
      } else {
        this.navigateTo(this.currentRoute);
      }
    });
    store.addEventListener('filter-updated', () => this.navigateTo(this.currentRoute));
    kpiContext.subscribe(() => this.navigateTo(this.currentRoute));

    this.mainContent.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action="view-agent"]');
      if (btn) this.handleViewAgent(btn.getAttribute('data-agent'));

      // Close chart menu if clicking outside
      if (!e.target.closest('#chartConfigBtn') && !e.target.closest('#chartConfigMenu')) {
        const menu = document.getElementById('chartConfigMenu');
        if (menu) menu.remove();
      }
    });

    // Global Event for Exporting Individual Agent
    window.addEventListener('export-agent', (e) => {
      ReportService.exportAgentCard(e.detail.agentData);
    });

    // Global Event for Viewing Agent Profile (Search)
    window.addEventListener('view-agent-profile', (e) => {
      this.handleViewAgent(e.detail.agent || e.detail.agentId);
    });

    window.addEventListener('navigate', (e) => this.navigateTo(e.detail.route));

    // File Events
    window.addEventListener('file-selected', (e) => this.handleFileSelect(e.detail.file));
    window.addEventListener('folder-selected', (e) => this.fileSelectionModal.open(e.detail.files));
    window.addEventListener('process-files', (e) => this.handleBatchProcess(e.detail.files));

    window.addEventListener('load-demo', () => this.handleLoadDemo());
    this.refreshIcons();
  }


  async handleBatchProcess(files) {
    this.mainContent.innerHTML = `
      <div class="h-[80vh] flex flex-col items-center justify-center text-slate-500 gap-4">
         <div class="relative">
             <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
             <div class="absolute inset-0 flex items-center justify-center">
                <div class="w-8 h-8 bg-indigo-50 rounded-full"></div>
             </div>
         </div>
         <p class="text-lg font-medium animate-pulse">Procesando ${files.length} archivos...</p>
      </div>`;

    try {
      const allSheets = {};

      // Read all files sequentially
      for (const file of files) {
        try {
          const sheets = await readExcelFile(file);
          // Fix Collision: Prefix sheet names with filename
          Object.keys(sheets).forEach(sheetName => {
            allSheets[`${escapeHTML(file.name)}::${escapeHTML(sheetName)}`] = sheets[sheetName];
          });
        } catch (err) {
          console.warn(`Error reading ${file.name}`, err);
        }
      }

      const mergedData = DataMerger.merge(allSheets);

      // Determine the Latest Period (Lexicographical Sort of 'YYYY-MM' or 'Filename')
      let latestPeriod = '';
      mergedData.forEach(agent => {
        if (agent._period && agent._period > latestPeriod) {
          latestPeriod = agent._period;
        }
      });

      console.log('Latest Period Detected:', latestPeriod);

      // Filter: Show ONLY agents present in the Latest Period
      // (Historical data is preserved inside agent.history)
      const currentSnapshot = mergedData.filter(agent => agent._period === latestPeriod);

      store.setData(currentSnapshot);

      // Navigate to dashboard to show results
      this.navigateTo('dashboard');

    } catch (error) {
      console.error('Error batch processing:', error.message); // Log message mainly, avoid dumping raw data object if possible
      alert('Error procesando archivos: ' + error.message);
      this.refreshIcons();
    }
  }

  handleLoadDemo() {
    this.mainContent.innerHTML = `
      <div class="h-[80vh] flex flex-col items-center justify-center text-slate-500 gap-4">
         <div class="relative">
             <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
         </div>
         <p class="text-lg font-medium">Cargando Demo...</p>
      </div>`;
    setTimeout(() => {
      const mockSheets = { 'DemoSheet': demoData };
      const mergedData = DataMerger.merge(mockSheets);
      store.setData(mergedData);
    }, 500);
  }

  handleViewAgent(identifier) {
    // If identifier is already an object (agent data), open directly
    if (typeof identifier === 'object' && identifier !== null) {
      this.agentModal.open(identifier);
      return;
    }

    // identifier can be ID (usually string/number) or Name (string)
    const data = store.getData();
    let agent = data.find(a => a.id === identifier);

    if (!agent && typeof identifier === 'string') {
      const decodedName = decodeURIComponent(identifier);
      agent = data.find(a => a.agent === decodedName);
    }

    if (agent) {
      this.agentModal.open(agent);
    } else {
      console.warn('Agent not found for identifier:', identifier);
    }
  }

  async handleFileSelect(file) {
    if (!file) return;
    this.mainContent.innerHTML = `
      <div class="h-[80vh] flex flex-col items-center justify-center text-slate-500 gap-4">
         <div class="relative">
             <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
         </div>
         <p class="text-lg font-medium">Procesando...</p>
      </div>`;
    try {
      const sheetsData = await readExcelFile(file);
      const mergedData = DataMerger.merge(sheetsData);
      store.setData(mergedData);
    } catch (error) {
      console.error('Error processing single file:', error.message);
      this.refreshIcons();
    }
  }

  navigateTo(route) {
    this.currentRoute = route;
    this._checkSidebarVisibility(route); // Ensure sidebar state is correct
    if (route !== 'agents') this.agentListComponent = null;

    // D3 destroys itself by clearing innerHTML on render, no explicit destroy needed for the previous class
    // if (route !== 'dashboard' && this.chartComponent) this.chartComponent.destroy();

    // Fade out effect
    this.mainContent.style.opacity = '0';
    this.mainContent.style.transform = 'translateY(10px) scale(0.99)';

    setTimeout(() => {
      this.mainContent.innerHTML = '';
      switch (route) {
        case 'dashboard': this.renderDashboard(); break;
        case 'agents': this.renderAgents(); break;
        case 'reports': this.renderReports(); break;
        case 'settings': this.renderSettings(); break;
        case 'welcome': this.renderWelcome(); break;
        default: this.renderPlaceholder('Próximamente');
      }

      this.refreshIcons();

      // Fade in effect
      this.mainContent.style.opacity = '1';
      this.mainContent.style.transform = 'translateY(0) scale(1)';
    }, 200);
  }

  renderReports() {
    this.mainContent.innerHTML = `
      <div class="w-full h-full pt-4 px-6 overflow-y-auto">
         <header class="mb-10 animate-fade-in-up">
            <h2 class="text-4xl font-black text-slate-800 tracking-tight">Centro de Informes</h2>
            <p class="text-slate-500 text-lg mt-2">Generación de documentación oficial y exportación de datos.</p>
         </header>

         <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- General Report (Premium Card) -->
            <!-- General Report (Corporate Card) -->
            <div class="group bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-200 relative overflow-hidden">
               <div class="relative z-10 flex flex-col h-full items-start gap-4">
                   <div class="flex items-center gap-4 w-full">
                       <div class="p-3 bg-indigo-50 text-indigo-700 rounded-lg shrink-0">
                          <i data-lucide="file-bar-chart" class="w-6 h-6"></i>
                       </div>
                       <div>
                          <h3 class="text-xl font-bold text-slate-900 tracking-tight">Ranking General</h3>
                          <p class="text-slate-500 text-sm mt-1">Exportación oficial de KPIs</p>
                       </div>
                   </div>
                   
                   <p class="text-slate-600 text-sm leading-relaxed border-t border-slate-100 pt-3 w-full">
                     Genera un informe PDF completo con la tabla detallada de todos los agentes y sus indicadores calculados.
                   </p>

                   <button id="btnExportRanking" class="mt-4 px-4 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 w-full justify-center text-sm font-semibold shadow-sm">
                      <i data-lucide="download" class="w-4 h-4"></i> Descargar PDF
                   </button>
               </div>
            </div>

             <!-- Excel Export (Active Card) -->
            <div class="group bg-white p-6 rounded-xl border-2 border-green-200 bg-green-50 shadow-sm hover:shadow-md hover:border-green-400 transition-all duration-200 relative overflow-hidden">
               <div class="relative z-10 flex flex-col h-full items-start gap-4">
                   <div class="flex items-center gap-4 w-full">
                       <div class="p-3 bg-green-100 text-green-700 rounded-lg shrink-0">
                          <i data-lucide="file-spreadsheet" class="w-6 h-6"></i>
                    </div>
                       <div>
                          <div class="flex items-center gap-2">
                            <h3 class="text-xl font-bold text-slate-900 tracking-tight">Exportar a Excel</h3>
                            <span class="text-xs px-2 py-1 bg-green-600 text-white rounded-full font-semibold">NUEVO</span>
                          </div>
                          <p class="text-slate-600 text-sm mt-1">3 formatos disponibles</p>
                       </div>
                   </div>
                   
                   <p class="text-slate-600 text-sm leading-relaxed border-t border-slate-100 pt-3 w-full">
                     Exporta datos con formato básico, profesional o dashboard completo con análisis ejecutivo.
                   </p>

                   <button id="btnExportExcel" class="mt-4 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 w-full justify-center text-sm font-semibold shadow-sm">
                      <i data-lucide="file-spreadsheet" class="w-4 h-4"></i> Exportar Excel
                   </button>
               </div>
            </div>
         </div>
      </div>
    `;

    // Event listener para exportar ranking PDF
    this.mainContent.querySelector('#btnExportRanking').addEventListener('click', () => {
      const data = store.getData();
      if (data.length === 0) return alert('No hay datos cargados para exportar.');
      ReportService.exportGeneralRanking(data);
    });

    // Event listener para exportar a Excel
    this.mainContent.querySelector('#btnExportExcel').addEventListener('click', () => {
      const data = store.getData();
      if (data.length === 0) return alert('No hay datos cargados para exportar.');

      // Mostrar modal de selección de formato
      ExportOptionsModal.show(data, kpiContext.getConfig());
    });
  }

  renderSettings() {
    this.mainContent.innerHTML = '';
    const settings = new Settings();
    this.mainContent.appendChild(settings.render());
  }

  renderWelcome() {
    this.mainContent.innerHTML = '';
    const welcome = new WelcomeScreen();
    this.mainContent.appendChild(welcome.render());

    // Hide sidebar for absolute focus
    this.sidebar.getElement().style.display = 'none';
  }

  // Override navigateTo to handle sidebar visibility
  _checkSidebarVisibility(route) {
    if (this.sidebar) {
      this.sidebar.getElement().style.display = route === 'welcome' ? 'none' : 'flex';
    }
  }


  renderDashboard() {
    const data = store.getData(); // Filtered data for stats
    const allData = store.getAllData(); // All data for selectors
    const total = data.length;

    // --- Prepare Selectors Data ---
    const tms = [...new Set(allData.map(d => d.supervisor))].filter(Boolean).sort();
    const uniqueSegments = [...new Set(allData.map(d => {
      return (d.admin && d.admin.segment) || d.segmento || d.segment || 'DESCONOCIDO';
    }))].filter(Boolean).filter(s => s !== 'DESCONOCIDO').sort();

    const currentFilters = store.state.filters;

    // --- Calculate Stats (based on filtered data) ---

    // --- Calculate Stats (Dynamic based on Config) ---
    // --- Calculate Stats (Dynamic based on Config) ---
    const stats = kpiContext.getKPIs().map(config => {
      let sum = 0;
      let count = 0;

      if (total > 0) {
        data.forEach(d => {
          const val = d.kpis?.[config.key];
          if (val !== undefined && val !== null) {
            sum += parseFloat(val);
            count++;
          }
        });
      }

      let avg = count > 0 ? (sum / count) : 0;
      // Apply maxValue cap if defined (e.g., transfer at 100%)
      if (config.maxValue !== undefined && avg > config.maxValue) {
        avg = config.maxValue;
      }
      const decimals = config.decimals !== undefined ? config.decimals : (config.isPercent ? 1 : 2);
      const formattedValue = config.isPercent ? avg.toFixed(decimals) + '%' : avg.toFixed(decimals);

      // Determine Status (Traffic Light)
      let status = 'neutral';
      let statusColor = 'text-slate-900';

      if (count > 0) {
        const isMin = config.type === 'min'; // Higher is better
        // Logic: On Target (Green), Close (Orange), Bad (Red)
        // Close defined as within Tolerance distance (default 15%)
        const target = config.target;
        const diff = Math.abs((avg - target) / target);
        const isGood = isMin ? avg >= target : avg <= target;

        if (isGood) {
          status = 'success';
          statusColor = 'text-[#15803d]'; // Green-700
        } else if (diff < (config.warningThreshold || 0.15)) {
          status = 'warning';
          statusColor = 'text-[#c2410c]'; // Orange-700
        } else {
          status = 'critical';
          statusColor = 'text-[#b91c1c]'; // Red-700
        }
      }

      return {
        ...config,
        value: formattedValue,
        statusColor,
        status
      };
    });

    // Special case for Distribution Chart (using NCO BO or Global NCO if available)
    const ncoConfig = stats.find(s => s.key === 'ncoBO') || stats[0];
    // Logic for Chart Distribution (kept similar but using Config target)
    let dist = { good: 0, mid: 0, bad: 0 };
    if (total > 0) {
      data.forEach(curr => {
        const val = curr.kpis?.[ncoConfig.key] || 0;
        const target = ncoConfig.target;

        // Simplified logic matching previous chart but dynamic target
        // Assuming standard distribution logic: >Target=Good, >Target*0.8=Mid, else Bad
        if (val >= target) dist.good++;
        else if (val >= target * 0.8) dist.mid++;
        else dist.bad++;
      });
    }

    this.mainContent.innerHTML = `
      <style>
        .dashboard-grid-force {
      display: block;
      width: 100%;
    }
      </style>
      <div class="w-full h-full overflow-y-auto p-6 animate-fade-in" style="width: 100% !important;">
        <!-- Nexus Dashboard v2.1 -->
        <header class="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 class="text-3xl font-black text-slate-800 tracking-tight">Dashboard Operativo</h2>
            <div class="flex items-center gap-2 mt-1">
              <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
              <p class="text-slate-500 text-sm font-medium">Visión global del rendimiento</p>
            </div>
          </div>

            <div class="flex flex-wrap items-center gap-4">
               <!-- TM Selector (Enhanced) -->
               <div class="relative group min-w-[220px]">
                  <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Equipo / TM</label>
                  <div class="relative">
                      <select id="tmSelector" class="appearance-none w-full bg-white pl-4 pr-10 py-3 rounded-lg border border-slate-200 text-slate-700 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-sm transition-all cursor-pointer hover:border-indigo-300">
                          <option value="all">Todos los Equipos</option>
                          ${tms.map(tm => `<option value="${escapeHTML(tm)}" ${currentFilters.tm === tm ? 'selected' : ''}>${escapeHTML(tm)}</option>`).join('')}
                      </select>
                      <div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-indigo-500 transition-colors">
                         <i data-lucide="chevron-down" class="w-5 h-5"></i>
                      </div>
                  </div>
               </div>

               <!-- Segment Selector (Enhanced) -->
               <div class="relative group min-w-[220px]">
                  <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Segmento</label>
                  <div class="relative">
                      <select id="segmentSelector" class="appearance-none w-full bg-white pl-4 pr-10 py-3 rounded-lg border border-slate-200 text-slate-700 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-sm transition-all cursor-pointer hover:border-indigo-300">
                          <option value="all">Todos los Segmentos</option>
                          ${uniqueSegments.map(s => `<option value="${escapeHTML(s)}" ${currentFilters.segment === s ? 'selected' : ''}>${escapeHTML(s)}</option>`).join('')}
                      </select>
                      <div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-indigo-500 transition-colors">
                         <i data-lucide="chevron-down" class="w-5 h-5"></i>
                      </div>
                  </div>
               </div>

            ${total > 0 ? `<div class="bg-white px-3 py-2.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
                   <i data-lucide="users" class="w-4 h-4 text-slate-400"></i>
                   <span class="text-sm font-bold text-slate-600">${total} <span class="text-xs font-normal text-slate-400">agentes</span></span>
               </div>` : ''}
          </div>
        </header>

        <!-- Nexus Stats Grid (Cards) -->
        <div class="px-6 mb-8">
           <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
             ${stats.map(stat => this.createStatCardV2(stat)).join('')}
           </div>
        </div>

        <div class="px-6 pb-8 block w-full gap-6">

          ${total === 0 ? this.renderEmpty() : `
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <!-- Distribution Chart (Flat Frame) -->
              <div class="lg:col-span-2 bg-white rounded-lg border border-slate-200 p-5 flex flex-col">
                 <div class="flex justify-between items-center mb-6">
                    <h3 class="text-sm font-semibold text-slate-900 uppercase tracking-wide">Distribución de Rendimiento</h3>
                    <button id="chartConfigBtn" class="text-slate-400 hover:text-indigo-600"><i data-lucide="more-horizontal" class="w-4 h-4"></i></button>
                 </div>
                 <div class="relative w-full h-64" id="chartContainer"></div>
              </div>

               <!-- Summary Card -->
               <div class="card bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col">
                <h3 class="text-base font-bold text-slate-800 mb-4 flex items-center gap-2 pb-3 border-b border-slate-100">
                    <i data-lucide="layers" class="w-4 h-4 text-slate-500"></i>
                    Resumen de Carga
                </h3>
                 <div class="space-y-3 flex-1">
                   <div class="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                     <span class="font-semibold text-slate-600 text-sm">Agentes Mostrados</span>
                     <span class="font-bold text-lg text-slate-900">${total}</span>
                   </div>
                   <div class="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                     <span class="font-semibold text-slate-600 text-sm">Equipos Filtrados</span>
                     <span class="font-bold text-lg text-slate-900">${new Set(data.map(d => d.supervisor)).size}</span>
                   </div>
                    <div class="p-2.5 bg-indigo-50/30 rounded-lg border border-indigo-100 mt-2">
                        <p class="text-[10px] text-indigo-700 font-medium leading-relaxed">
                            <span class="font-bold">Filtros Activos:</span> ${currentFilters.tm !== 'all' ? 'TM Personalizado' : 'Todos'} | ${currentFilters.segment !== 'all' ? 'Segmento Personalizado' : 'Todos'}
                        </p>
                   </div>
                 </div>
                 <button id="dashExportBtn" class="w-full mt-4 py-2 text-indigo-700 hover:text-white hover:bg-indigo-700 border border-indigo-200 hover:border-indigo-700 font-bold rounded-lg transition-all text-sm flex items-center justify-center gap-2">
                    <i data-lucide="file-bar-chart" class="w-4 h-4"></i> Ir a Reportes
                 </button>
              </div>
            </div>
          `}
        </div>
      </div>
    `;

    // --- Event Listeners for Selectors ---
    const tmSelector = this.mainContent.querySelector('#tmSelector');
    if (tmSelector) {
      tmSelector.addEventListener('change', (e) => {
        store.setFilter('tm', e.target.value);
      });
    }

    const segmentSelector = this.mainContent.querySelector('#segmentSelector');
    if (segmentSelector) {
      segmentSelector.addEventListener('change', (e) => {
        store.setFilter('segment', e.target.value);
      });
    }

    if (total > 0) {
      setTimeout(() => this.renderChart(data), 0);
      this.mainContent.querySelector('#dashExportBtn').addEventListener('click', () => {
        this.navigateTo('reports');
      });
      this.mainContent.querySelector('#chartConfigBtn')?.addEventListener('click', () => this.toggleChartConfig());
    }
    this.refreshIcons();
  }

  renderChart(data) {
    const container = document.getElementById('chartContainer');
    if (!container || !data || data.length === 0) return;

    // Clear previous chart
    container.innerHTML = '';

    // Setup D3 Dimensions with Safe Fallbacks
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const containerRect = container.getBoundingClientRect();
    const safeW = containerRect.width || container.clientWidth || 600;
    const safeH = containerRect.height || container.clientHeight || 300;

    const width = Math.max(200, safeW - margin.left - margin.right);
    const height = Math.max(150, safeH - margin.top - margin.bottom);

    const svg = d3.select(container)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // --- Dynamic Config Loading ---
    let config;
    if (this.activeChartConfig === 'custom' && this.customConfig) {
      config = this.customConfig;
    } else {
      config = this.chartConfigs[this.activeChartConfig || 'performance'];
    }

    // Filter and Map Data based on Config
    const plotData = data.filter(d =>
      d.kpis &&
      !isNaN(parseFloat(d.kpis[config.xKey])) &&
      !isNaN(parseFloat(d.kpis[config.yKey])) &&
      parseFloat(d.kpis[config.xKey]) !== 0
    ).map(d => ({
      id: d.id,
      name: d.agent,
      xVal: parseFloat(d.kpis[config.xKey]),
      yVal: parseFloat(d.kpis[config.yKey]),
      zVal: parseFloat(d.kpis[config.zKey] || 1)
    }));

    // Scales
    const xMax = d3.max(plotData, d => d.xVal) || 100;
    const x = d3.scaleLinear()
      .domain([0, xMax * 1.1])
      .range([0, width]);

    const yMax = d3.max(plotData, d => d.yVal) || 100;
    const y = d3.scaleLinear()
      .domain([0, yMax * 1.1])
      .range([height, 0]);

    const z = d3.scaleSqrt()
      .domain([0, d3.max(plotData, d => d.zVal) || 10])
      .range([3, 15]);

    // --- Zones (Quadrants) ---
    let zoneX = 0, zoneY = 0, zoneW = 0, zoneH = 0;

    // Check Config Type for Zone Logic
    // Default Performance: xTarget is Max (340 AHT), yTarget is Min (85 NCO) -> Success is Top Left
    // Efficiency: xTarget (2.5 Gest) Min, yTarget (1.8 Cerr) Min -> Success is Top Right

    if (config.quadrant === 'topLeft') {
      zoneX = 0;
      zoneY = 0;
      zoneW = x(config.xTarget);
      zoneH = y(config.yTarget); // From Y-Target UP to 0 in SVG coords
      if (config.xInverted) {
        // If X is inverted (like AHT where lower is better), but usually charts go 0->Max.
        // If target is 340, and we want < 340, then rect is 0 to x(340).
      }
    } else {
      // Top Right (High x, High y)
      // Rect from x(target) to width?
      zoneX = x(config.xTarget);
      zoneY = 0;
      zoneW = width - x(config.xTarget);
      zoneH = y(config.yTarget);
    }

    // Safety check for weird target values not blowing up SVG
    if (zoneW < 0) zoneW = 0;
    if (zoneH < 0) zoneH = 0;

    // Draw Success Zone
    svg.append("rect")
      .attr("x", zoneX)
      .attr("y", zoneY)
      .attr("width", zoneW)
      .attr("height", zoneH)
      .attr("fill", "#10b981")
      .attr("opacity", 0.05);

    // Reference Lines (Targets)
    svg.append("line")
      .attr("x1", x(config.xTarget))
      .attr("x2", x(config.xTarget))
      .attr("y1", 0)
      .attr("y2", height)
      .attr("stroke", "#94a3b8")
      .attr("stroke-dasharray", "4")
      .attr("opacity", 0.5);

    svg.append("line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", y(config.yTarget))
      .attr("y2", y(config.yTarget))
      .attr("stroke", "#94a3b8")
      .attr("stroke-dasharray", "4")
      .attr("opacity", 0.5);

    // Axes
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5))
      .attr("font-family", "Inter, sans-serif")
      .attr("color", "#64748b");

    svg.append("g")
      .call(d3.axisLeft(y).ticks(5))
      .attr("font-family", "Inter, sans-serif")
      .attr("color", "#64748b");

    // Axis Labels
    svg.append("text")
      .attr("text-anchor", "end")
      .attr("x", width)
      .attr("y", height + 35)
      .text(config.xLabel)
      .attr("font-size", "10px")
      .attr("fill", "#64748b")
      .attr("font-weight", "bold");

    svg.append("text")
      .attr("text-anchor", "end")
      .attr("transform", "rotate(-90)")
      .attr("y", -35)
      .attr("x", 0)
      .text(config.yLabel)
      .attr("font-size", "10px")
      .attr("fill", "#64748b")
      .attr("font-weight", "bold");

    // Tooltip
    d3.select(container).selectAll('.chart-tooltip').remove();

    const tooltip = d3.select(container)
      .append("div")
      .style("opacity", 0)
      .style("position", "absolute")
      .style("background-color", "#1e293b")
      .style("color", "#f8fafc")
      .style("padding", "12px")
      .style("border-radius", "8px")
      .style("pointer-events", "none")
      .style("z-index", "100")
      .style("box-shadow", "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)")
      .style("border", "1px solid #334155")
      .style("min-width", "160px")
      .attr("class", "chart-tooltip");

    // Bubbles
    svg.append('g')
      .selectAll("circle")
      .data(plotData)
      .join("circle")
      .attr("cx", d => x(d.xVal))
      .attr("cy", d => y(d.yVal))
      .attr("r", d => z(d.zVal))
      .style("fill", d => {
        // Dynamic Color Logic based on Quadrant
        let goodX = d.xVal <= config.xTarget;
        if (!config.xInverted) goodX = d.xVal >= config.xTarget;

        let goodY = d.yVal >= config.yTarget;

        // Strict Logic for colors
        if (goodX && goodY) return "#10b981"; // Success
        if (!goodX && !goodY) return "#f43f5e"; // Critical
        return "#f59e0b"; // Warning
      })
      .style("opacity", 0.7)
      .attr("stroke", "white")
      .style("stroke-width", "1.5px")
      .on("mouseover", function (event, d) {
        d3.select(this)
          .transition().duration(200)
          .style("opacity", 1)
          .attr("r", z(d.zVal) + 4)
          .style("stroke", "#6366f1")
          .style("stroke-width", "2px");

        tooltip.transition().duration(200).style("opacity", 1);
        tooltip.html(`
            <div style="font-weight: 700; margin-bottom: 4px; border-bottom: 1px solid #475569; padding-bottom: 4px;">${d.name}</div>
            <div style="display: grid; grid-template-columns: auto auto; gap: 4px 12px; font-size: 11px;">
               <span style="color: #94a3b8;">${config.xLabel}:</span> <span style="text-align: right; font-family: monospace;">${d.xVal.toFixed(1)}</span>
               <span style="color: #94a3b8;">${config.yLabel}:</span> <span style="text-align: right; font-family: monospace;">${d.yVal.toFixed(1)}</span>
               <span style="color: #94a3b8;">${config.zLabel}:</span> <span style="text-align: right; font-family: monospace;">${d.zVal.toFixed(1)}</span>
            </div>
         `)

        const [mx, my] = d3.pointer(event, container);

        // Smart Tooltip Positioning
        const tooltipHeight = 85;
        // Flip Top/Bottom
        if (my > height * 0.6) {
          tooltip.style("top", (my - tooltipHeight - 15) + "px");
        } else {
          tooltip.style("top", (my + 20) + "px");
        }

        // Flip Right/Left
        if (mx > width * 0.7) {
          tooltip.style("left", (mx - 170) + "px");
        } else {
          tooltip.style("left", (mx + 20) + "px");
        }

      })
      .on("mousemove", function (event) {
        const [mx, my] = d3.pointer(event, container);
        const tooltipHeight = 85;

        if (my > height * 0.6) {
          tooltip.style("top", (my - tooltipHeight - 15) + "px");
        } else {
          tooltip.style("top", (my + 20) + "px");
        }

        if (mx > width * 0.7) {
          tooltip.style("left", (mx - 170) + "px");
        } else {
          tooltip.style("left", (mx + 20) + "px");
        }
      })
      .on("mouseout", function () {
        d3.select(this)
          .transition().duration(200)
          .style("opacity", 0.7)
          .attr("r", z(d3.select(this).datum().zVal))
          .style("stroke", "white")
          .style("stroke-width", "1.5px");
        tooltip.transition().duration(200).style("opacity", 0);
      })
      .on("click", (event, d) => {
        // Fix: Correct usage of handleViewAgent
        this.handleViewAgent(d.id);
      });

    // Add Clipping Path to Parent SVG (select the <g>'s parent)
    d3.select(container).select("svg").insert("defs", ":first-child")
      .append("clipPath")
      .attr("id", "chart-clip")
      .append("rect")
      .attr("width", width)
      .attr("height", height);

    // Apply to the main group
    svg.attr("clip-path", "url(#chart-clip)");
  }

  // Configuration Modal Logic
  toggleChartConfig() {
    const existing = document.getElementById('chartConfigMenu');
    if (existing) {
      existing.remove();
      return;
    }

    const btn = document.getElementById('chartConfigBtn');
    if (!btn) return;

    const options = [
      { key: 'gestH', label: 'GEST/H' },
      { key: 'cerrH', label: 'CERR/H' },
      { key: 'ncoBO', label: 'NCO BO%' },
      { key: 'aht', label: 'AHT' },
      { key: 'tipif', label: 'TIPIF %' },
      { key: 'transfer', label: 'TRANS %' },
      { key: 'nps', label: 'NPS' },
      { key: 'ncp', label: 'NCP' },
      { key: 'ncoCall', label: 'NCO LLAM%' }
    ];

    const menu = document.createElement('div');
    menu.id = 'chartConfigMenu';
    menu.className = 'absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-50 animate-fade-in-up';

    document.body.appendChild(menu);
    const rect = btn.getBoundingClientRect();
    menu.style.position = 'absolute';
    menu.style.top = (rect.bottom + window.scrollY + 5) + 'px';
    menu.style.left = (rect.right + window.scrollX - 288) + 'px';

    menu.innerHTML = `
        <div class="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
            <h4 class="text-xs font-bold text-slate-500 uppercase tracking-widest">Personalizar Gráfico</h4>
            <button id="closeChartConfig" class="text-slate-400 hover:text-slate-600"><i data-lucide="x" class="w-4 h-4"></i></button>
        </div>
        
        <div class="space-y-4">
            <!-- Quick Presets -->
            <div>
                <label class="block text-[10px] font-bold text-slate-400 uppercase mb-2">Vistas Rápidas</label>
                <div class="grid grid-cols-3 gap-2">
                    <button class="preset-btn px-2 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-[10px] font-bold rounded border border-slate-200 transition-colors" data-preset="performance">Rendimiento</button>
                    <button class="preset-btn px-2 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-[10px] font-bold rounded border border-slate-200 transition-colors" data-preset="efficiency">Eficiencia</button>
                    <button class="preset-btn px-2 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-[10px] font-bold rounded border border-slate-200 transition-colors" data-preset="quality">Calidad</button>
                </div>
            </div>
            
            <div class="border-t border-slate-100 pt-3">
                <label class="block text-[10px] font-bold text-slate-400 uppercase mb-2">Configuración Manual</label>
                <div class="space-y-2">
                    <div>
                        <span class="text-[10px] text-slate-500 block mb-1">Eje X</span>
                        <select id="xAxisSelect" class="w-full text-xs border-slate-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-slate-700 bg-slate-50 py-1.5 px-2">
                            ${options.map(o => `<option value="${o.key}" ${this.activeChartConfig?.xKey === o.key || (this.chartConfigs[this.activeChartConfig]?.xKey === o.key) ? 'selected' : ''}>${o.label}</option>`).join('')}
                        </select>
                    </div>
                    
                    <div>
                        <span class="text-[10px] text-slate-500 block mb-1">Eje Y</span>
                        <select id="yAxisSelect" class="w-full text-xs border-slate-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-slate-700 bg-slate-50 py-1.5 px-2">
                             ${options.map(o => `<option value="${o.key}" ${this.activeChartConfig?.yKey === o.key || (this.chartConfigs[this.activeChartConfig]?.yKey === o.key) ? 'selected' : ''}>${o.label}</option>`).join('')}
                        </select>
                    </div>
                     
                     <div>
                        <span class="text-[10px] text-slate-500 block mb-1">Tamaño Burbuja</span>
                        <select id="zAxisSelect" class="w-full text-xs border-slate-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-slate-700 bg-slate-50 py-1.5 px-2">
                             <option value="gestH">GEST/H</option>
                             <option value="calls">Llamadas</option>
                             <option value="aht">AHT</option>
                        </select>
                    </div>
                </div>

                <button id="applyChartConfig" class="w-full mt-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg text-xs transition-colors shadow-sm">
                    Aplicar Manualmente
                </button>
            </div>
        </div>
      `;

    menu.querySelector('#closeChartConfig').onclick = () => menu.remove();

    // Handle Presets
    menu.querySelectorAll('.preset-btn').forEach(btn => {
      btn.onclick = (e) => {
        const preset = e.target.getAttribute('data-preset');
        this.setChartConfig(preset);
        menu.remove();
      }
    });

    menu.querySelector('#applyChartConfig').onclick = () => {
      const xKey = menu.querySelector('#xAxisSelect').value;
      const yKey = menu.querySelector('#yAxisSelect').value;
      const zKey = menu.querySelector('#zAxisSelect').value;

      this.applyCustomConfig(xKey, yKey, zKey);
      menu.remove();
    };

    if (window.lucide) window.lucide.createIcons();
  }

  applyCustomConfig(xKey, yKey, zKey) {
    const options = [
      { key: 'gestH', label: 'GEST/H', target: 2.5 },
      { key: 'cerrH', label: 'CERR/H', target: 1.8 },
      { key: 'ncoBO', label: 'NCO BO%', target: 85 },
      { key: 'aht', label: 'AHT', target: 340, inverted: true },
      { key: 'tipif', label: 'TIPIF %', target: 90 },
      { key: 'transfer', label: 'TRANS %', target: 15, inverted: true },
      { key: 'nps', label: 'NPS', target: 30 },
      { key: 'ncp', label: 'NCP', target: 9, inverted: true },
      { key: 'ncoCall', label: 'NCO LLAM%', target: 85 }
    ];

    const xOpt = options.find(o => o.key === xKey);
    const yOpt = options.find(o => o.key === yKey);
    const zOpt = options.find(o => o.key === zKey);

    this.customConfig = {
      id: 'custom',
      label: 'Personalizado',
      xKey: xKey, xLabel: xOpt?.label || xKey, xTarget: xOpt?.target || 0, xInverted: xOpt?.inverted,
      yKey: yKey, yLabel: yOpt?.label || yKey, yTarget: yOpt?.target || 0,
      zKey: zKey, zLabel: zOpt?.label || zKey,
      quadrant: 'custom'
    };

    this.activeChartConfig = 'custom';
    this.renderChart(store.getData());
  }

  setChartConfig(configId) {
    this.activeChartConfig = configId;
    document.getElementById('chartConfigMenu')?.remove();
    const data = store.getData();
    this.renderChart(data);
  }

  renderAgents() {
    if (!this.agentListComponent) {
      this.mainContent.innerHTML = '<div class="w-full h-full"></div>';
      this.agentListComponent = new AgentList(this.mainContent.firstChild);
    }

    // Check if container is still valid and attached
    if (!this.agentListComponent.container || !this.mainContent.contains(this.agentListComponent.container)) {
      this.mainContent.innerHTML = '<div class="w-full h-full"></div>';
      this.agentListComponent.container = this.mainContent.firstChild;
      this.agentListComponent.isInitialized = false; // Force re-render of structure
    }

    this.agentListComponent.setData(store.getData());
  }

  renderEmpty() {
    return `
      <div class="col-span-full py-20 flex flex-col items-center justify-center text-center">
        <div class="relative mb-6 group cursor-pointer" onclick="document.querySelector('button[data-action=import]').click()">
            <div class="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-50"></div>
            <div class="w-24 h-24 bg-white rounded-full shadow-xl shadow-indigo-100 flex items-center justify-center relative z-10 group-hover:scale-110 transition-transform duration-300 border-4 border-indigo-50">
               <i data-lucide="upload-cloud" class="w-10 h-10 text-indigo-500"></i>
            </div>
        </div>
        <h3 class="text-2xl font-black text-slate-800 mb-2">Comienza a Analizar</h3>
        <p class="text-slate-400 max-w-md mx-auto mb-8">Importa tu archivo Excel o carpeta de reportes para generar el dashboard operativo completo.</p>
        <div class="flex gap-4">
             <button class="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-all" onclick="document.querySelector('button[data-action=import]').click()">
                Importar Ahora
             </button>
             <button class="px-6 py-2.5 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all" onclick="window.dispatchEvent(new CustomEvent('load-demo'))">
                Ver Demo
             </button>
        </div>
      </div>`;
  }

  renderPlaceholder(t) { this.mainContent.innerHTML = `<div class="h-full flex items-center justify-center text-slate-300 text-3xl font-black uppercase tracking-widest">${t}</div>`; }

  createStatCardV2(stat) {
    const { label, value, statusColor, target, isPercent, type, icon } = stat;

    // Gradient Background based on status (subtle)
    let cardBg = 'bg-white';
    let iconColor = 'text-slate-400';
    let iconBg = 'bg-slate-50';
    let progressColor = 'bg-slate-200';

    if (stat.status === 'success') {
      iconColor = 'text-emerald-600';
      iconBg = 'bg-emerald-50';
      progressColor = 'bg-emerald-500';
    } else if (stat.status === 'warning') {
      iconColor = 'text-amber-600';
      iconBg = 'bg-amber-50';
      progressColor = 'bg-amber-500';
    } else if (stat.status === 'critical') {
      iconColor = 'text-rose-600';
      iconBg = 'bg-rose-50';
      progressColor = 'bg-rose-500';
    }

    const cleanTarget = target + (isPercent ? '%' : '');
    // Calculate progress bar width (clamped 0-100)
    let percent = 0;
    const numVal = parseFloat(value);

    if (type === 'min') {
      percent = Math.min((numVal / target) * 100, 100);
    } else {
      // For max (e.g. AHT), logic is inverted visually? 
      // Let's just normalize: if target is 300, and val is 150, that's 50% "used".
      percent = Math.min((numVal / (target * 1.5)) * 100, 100);
    }

    return `
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] hover:shadow-md transition-all group relative overflow-hidden">
         <div class="flex justify-between items-start mb-2">
             <div class="w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center border border-white shadow-sm">
                <i data-lucide="${icon || 'activity'}" class="w-5 h-5 ${iconColor}"></i>
             </div>
             ${stat.status !== 'neutral' ? `
                <span class="flex h-2.5 w-2.5">
                  <span class="group-hover:animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${progressColor}"></span>
                  <span class="relative inline-flex rounded-full h-2.5 w-2.5 ${progressColor}"></span>
                </span>
             ` : ''}
         </div>
         
         <div>
            <p class="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">${label}</p>
            <div class="flex items-baseline gap-2">
                <h4 class="text-2xl font-black text-slate-800 tracking-tight leading-none">${value}</h4>
            </div>
         </div>

         <!-- Progress Bar Context -->
         <div class="mt-3">
            <div class="flex justify-between text-[10px] font-medium text-slate-400 mb-1">
                <span>Progreso</span>
                <span>Meta: <span class="text-slate-600 font-bold">${cleanTarget}</span></span>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div class="${progressColor} h-1.5 rounded-full transition-all duration-500" style="width: ${percent}%"></div>
            </div>
         </div>
      </div>
    `;
  }

  refreshIcons() { createIcons({ icons, nameAttr: 'data-lucide' }); }
}
