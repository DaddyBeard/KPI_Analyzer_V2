
import { Sidebar } from './Sidebar.js';
import { createIcons, icons } from 'lucide';
import { readExcelFile } from '../features/data-loader/excel-reader.js';
import { DataMerger } from '../features/data-loader/DataMerger.js';
import { store } from '../core/Store.js';
import { AgentModal } from '../features/agents/components/AgentModal.js';
import { AgentList } from '../features/agents/components/AgentList.js';
import { ChartComponent } from '../features/dashboard/components/ChartComponent.js';
import { ReportService } from '../features/reports/ReportService.js';
import { demoData } from '../data/demo-data.js';
import { DataNormalizer } from '../features/data-loader/DataNormalizer.js';
import { FileSelectionModal } from '../features/data-loader/FileSelectionModal.js';

export class AppShell {
  constructor() {
    this.appElement = document.getElementById('app');
    this.sidebar = new Sidebar();
    this.agentModal = new AgentModal();
    this.fileSelectionModal = new FileSelectionModal();
    this.mainContent = document.createElement('main');
    // Adjusted margins and padding for new sidebar and premium spacing
    this.mainContent.className = 'flex-1 h-screen overflow-hidden bg-slate-50 relative flex flex-col min-w-0';
    this.mainContent.style.transition = 'opacity 200ms ease, transform 200ms ease';
    this.currentRoute = 'dashboard';
    this.chartComponent = new ChartComponent();
    this.init();
  }

  init() {
    this.appElement.innerHTML = '';
    this.appElement.className = 'flex h-screen w-full overflow-hidden bg-slate-50 font-sans';
    this.appElement.appendChild(this.sidebar.getElement());
    this.appElement.appendChild(this.mainContent);
    this.navigateTo('dashboard');
    store.addEventListener('data-updated', () => this.navigateTo(this.currentRoute));
    store.addEventListener('filter-updated', () => this.navigateTo(this.currentRoute));
    this.mainContent.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action="view-agent"]');
      if (btn) this.handleViewAgent(btn.getAttribute('data-agent'));
    });

    // Global Event for Exporting Individual Agent
    window.addEventListener('export-agent', (e) => {
      ReportService.exportAgentCard(e.detail.agentData);
    });

    // Global Event for Viewing Agent Profile (Search)
    window.addEventListener('view-agent-profile', (e) => {
      if (e.detail.agent) {
        this.agentModal.open(e.detail.agent);
      }
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
            allSheets[`${file.name}::${sheetName}`] = sheets[sheetName];
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
      console.error(error);
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

  handleViewAgent(agentName) {
    const decodedName = decodeURIComponent(agentName);
    const data = store.getData();
    const agent = data.find(a => a.agent === decodedName);
    if (agent) this.agentModal.open(agent);
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
      console.error(error);
      this.refreshIcons();
    }
  }

  navigateTo(route) {
    this.currentRoute = route;
    if (route !== 'agents') this.agentListComponent = null;
    if (route !== 'dashboard') this.chartComponent.destroy();

    // Fade out effect
    this.mainContent.style.opacity = '0';
    this.mainContent.style.transform = 'translateY(10px) scale(0.99)';

    setTimeout(() => {
      this.mainContent.innerHTML = '';
      switch (route) {
        case 'dashboard': this.renderDashboard(); break;
        case 'agents': this.renderAgents(); break;
        case 'reports': this.renderReports(); break;
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
            <div class="group bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
               <div class="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[4rem] -mr-8 -mt-8 z-0 transition-transform group-hover:scale-110"></div>
               
               <div class="relative z-10 flex flex-col h-full items-start gap-6">
                   <div class="p-4 bg-indigo-50 text-indigo-600 rounded-2xl shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                      <i data-lucide="file-bar-chart" class="w-8 h-8"></i>
                   </div>
                   <div>
                      <h3 class="text-2xl font-bold text-slate-800 tracking-tight">Ranking General</h3>
                      <p class="text-slate-500 mt-2 leading-relaxed">Exporta la tabla completa de agentes con todos los KPIs calculados en formato PDF profesional.</p>
                   </div>
                   <button id="btnExportRanking" class="mt-auto px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-500/30 transition-all flex items-center gap-3 w-full justify-center font-bold tracking-wide">
                      <i data-lucide="download" class="w-5 h-5"></i> Descargar PDF
                   </button>
               </div>
            </div>

             <!-- Excel Raw (Disabled State Premium) -->
            <div class="group bg-slate-50 p-8 rounded-[2rem] border border-slate-200 shadow-none relative overflow-hidden opacity-80 cursor-not-allowed">
               <div class="relative z-10 flex flex-col h-full items-start gap-6">
                   <div class="p-4 bg-slate-200 text-slate-400 rounded-2xl">
                      <i data-lucide="table" class="w-8 h-8"></i>
                   </div>
                   <div>
                      <h3 class="text-2xl font-bold text-slate-400 tracking-tight">Datos Crudos (Excel)</h3>
                      <p class="text-slate-400 mt-2 leading-relaxed">Descarga el dataset procesado en formato Excel nativo.</p>
                   </div>
                   <button disabled class="mt-auto px-6 py-3 bg-slate-200 text-slate-400 rounded-xl flex items-center gap-3 w-full justify-center font-bold tracking-wide cursor-not-allowed">
                      <i data-lucide="lock" class="w-4 h-4"></i> Próximamente
                   </button>
               </div>
            </div>
         </div>
      </div>
    `;

    this.mainContent.querySelector('#btnExportRanking').addEventListener('click', () => {
      const data = store.getData();
      if (data.length === 0) return alert('No hay datos cargados para exportar.');
      ReportService.exportGeneralRanking(data);
    });
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
    // Calculate Averages
    let sumGestH = 0;
    let sumCerrH = 0;
    let sumAHT = 0;
    let sumNCO = 0;
    let dist = { good: 0, mid: 0, bad: 0 };

    if (total > 0) {
      data.forEach(curr => {
        const m = curr.kpis || {};
        sumGestH += (m.gestH || 0);
        sumCerrH += (m.cerrH || 0);
        sumAHT += (m.aht || 0);
        sumNCO += (m.ncoBO || 0);

        let val = m.ncoBO || 0;
        if (val >= 90) dist.good++;
        else if (val >= 70) dist.mid++;
        else dist.bad++;
      });
    }

    const avgGestH = total > 0 ? (sumGestH / total).toFixed(2) : 0;
    const avgCerrH = total > 0 ? (sumCerrH / total).toFixed(2) : 0;
    const avgAHT = total > 0 ? (sumAHT / total).toFixed(0) : 0;
    const avgNCO = total > 0 ? (sumNCO / total).toFixed(1) : 0;

    this.mainContent.innerHTML = `
      <style>
        .dashboard-grid-force {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 1rem;
          width: 100%;
        }
        @media (min-width: 768px) { .dashboard-grid-force { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 1024px) { .dashboard-grid-force { grid-template-columns: repeat(4, 1fr) !important; } }
      </style>
      <div class="w-full h-full overflow-y-auto p-6 animate-fade-in" style="width: 100% !important;">
          <header class="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
                <h2 class="text-3xl font-black text-slate-800 tracking-tight">Dashboard Operativo</h2>
                <div class="flex items-center gap-2 mt-1">
                   <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                   <p class="text-slate-500 text-sm font-medium">Visión global del rendimiento</p>
                </div>
            </div>
            
            <div class="flex flex-wrap items-center gap-3">
               <!-- TM Selector -->
               <div class="relative group">
                  <select id="tmSelector" class="appearance-none bg-white pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm transition-all cursor-pointer hover:border-indigo-300">
                      <option value="all">Todos los Equipos</option>
                      ${tms.map(tm => `<option value="${tm}" ${currentFilters.tm === tm ? 'selected' : ''}>${tm}</option>`).join('')}
                  </select>
                  <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                     <i data-lucide="chevron-down" class="w-4 h-4"></i>
                  </div>
               </div>

               <!-- Segment Selector -->
               <div class="relative group">
                  <select id="segmentSelector" class="appearance-none bg-white pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm transition-all cursor-pointer hover:border-indigo-300">
                      <option value="all">Todos los Segmentos</option>
                       ${uniqueSegments.map(s => `<option value="${s}" ${currentFilters.segment === s ? 'selected' : ''}>${s}</option>`).join('')}
                  </select>
                  <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                     <i data-lucide="chevron-down" class="w-4 h-4"></i>
                  </div>
               </div>

               ${total > 0 ? `<div class="bg-white px-3 py-2.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
                   <i data-lucide="users" class="w-4 h-4 text-slate-400"></i>
                   <span class="text-sm font-bold text-slate-600">${total} <span class="text-xs font-normal text-slate-400">agentes</span></span>
               </div>` : ''}
            </div>
          </header>
          
          <div class="dashboard-grid-force gap-4 mb-8">
            ${this.createStatCard('Promedio Gest/H', avgGestH, 'activity', 'indigo')}
            ${this.createStatCard('Promedio Cerr/H', avgCerrH, 'check-circle', 'emerald')}
            ${this.createStatCard('AHT Promedio', avgAHT + 's', 'clock', 'amber')}
            ${this.createStatCard('NCO BO% Global', avgNCO + '%', 'bar-chart-2', 'rose')}
          </div>

          ${total === 0 ? this.renderEmpty() : `
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <!-- Distribution Chart -->
              <div class="lg:col-span-2 card bg-white p-6 rounded-[1.5rem] shadow-sm border border-slate-200 flex flex-col">
                 <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="text-lg font-bold text-slate-800">Distribución de Rendimiento</h3>
                    </div>
                 </div>
                 <div class="relative w-full h-64" id="chartContainer"></div>
              </div>

               <!-- Summary Card -->
               <div class="card bg-white p-6 rounded-[1.5rem] shadow-sm border border-slate-200 flex flex-col">
                <h3 class="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <i data-lucide="layers" class="w-5 h-5 text-indigo-500"></i>
                    Resumen de Carga
                </h3>
                 <div class="space-y-3 flex-1">
                   <div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                     <span class="font-bold text-slate-600 text-sm">Agentes Mostrados</span>
                     <span class="font-black text-xl text-slate-800">${total}</span>
                   </div>
                   <div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                     <span class="font-bold text-slate-600 text-sm">Equipos Filtrados</span>
                     <span class="font-black text-xl text-slate-800">${new Set(data.map(d => d.supervisor)).size}</span>
                   </div>
                    <div class="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 mt-2">
                        <p class="text-[10px] text-indigo-600 font-medium leading-relaxed">
                            <span class="font-bold">Filtros Activos:</span> ${currentFilters.tm !== 'all' ? 'TM Personalizado' : 'Todos'} | ${currentFilters.segment !== 'all' ? 'Segmento Personalizado' : 'Todos'}
                        </p>
                   </div>
                 </div>
                 <button id="dashExportBtn" class="w-full mt-4 py-2.5 text-indigo-600 hover:text-white hover:bg-indigo-600 border border-indigo-200 hover:border-indigo-600 font-bold rounded-lg transition-all text-sm flex items-center justify-center gap-2">
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
      setTimeout(() => this.renderChart(dist), 0);
      this.mainContent.querySelector('#dashExportBtn').addEventListener('click', () => {
        this.navigateTo('reports');
      });
    }
    this.refreshIcons();
  }

  renderChart(dist) {
    this.chartComponent.render(document.getElementById('chartContainer'), {
      type: 'doughnut',
      data: {
        labels: ['Objetivo (>90%)', 'Seguimiento (70-90%)', 'Crítico (<70%)'],
        datasets: [{
          data: [dist.good, dist.mid, dist.bad],
          backgroundColor: ['#10b981', '#f59e0b', '#f43f5e'],
          borderWidth: 0,
          hoverOffset: 20
        }]
      },
      options: {
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              padding: 20,
              font: { family: "'Outfit', sans-serif", size: 12 }
            }
          }
        },
        cutout: '75%',
        layout: { padding: 20 }
      }
    });
  }

  renderAgents() {
    if (!this.agentListComponent) {
      this.mainContent.innerHTML = '<div class="w-full h-full"></div>'; // Wrapper to keep ref
      this.agentListComponent = new AgentList(this.mainContent.firstChild);
    }
    // Always create new container if empty or reused poorly, but here we assume it works.
    // Actually renderAgents usually called when route changes.
    // If not data, show empty handled by AgentList or here?
    // Let's delegate to AgentList logic which we improved.
    if (!this.agentListComponent.container) {
      this.mainContent.innerHTML = '<div class="w-full h-full"></div>';
      this.agentListComponent.container = this.mainContent.firstChild;
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

  createStatCard(title, value, icon, colorName) {
    const colors = {
      indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-l-indigo-500' },
      emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-l-emerald-500' },
      amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-l-amber-500' },
      rose: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-l-rose-500' }
    };
    const c = colors[colorName] || colors.indigo;

    return `
      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm border-l-[4px] ${c.border} flex items-center justify-between hover:shadow-md transition-shadow">
        <div>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">${title}</p>
            <h4 class="text-2xl font-black text-slate-800 tracking-tight">${value}</h4>
        </div>
        <div class="w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center">
             <i data-lucide="${icon}" class="w-5 h-5 ${c.text}"></i>
        </div>
      </div>`;
  }

  refreshIcons() { createIcons({ icons, nameAttr: 'data-lucide' }); }
}
