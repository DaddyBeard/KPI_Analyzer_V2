import { createIcons, icons } from 'lucide';
import { KPIMetrics } from './AgentStats_V4.js';
import { AgentHistory } from './AgentHistory.js';

import { AgentAdmin } from './AgentAdmin.js';
import { AgentActionPlan } from './AgentActionPlan.js';
import { kpiContext } from '../../settings/logic/KPIContext.js';
import { identifyPriorityKPI, identifyTopKPIs, generateSummaryDraft } from '../logic/kpiAnalysis.js';

export class AgentModalV4 {
  constructor() {
    console.log('%c AgentModal V4 (Compact) Initialized', 'background: #000; color: white; padding: 4px; font-weight: bold;');
    this.element = null;
    this.agentData = null;
    this.activeTab = 'summary';
    this.chartInstance = null;
    this.topKPIs = [];
    this.selectedKPI = null;
    this.boundHandleClick = this.handleClick.bind(this);
    this.boundHandleInput = this.handleInput.bind(this);
    this.boundHandleKeyDown = this.handleKeyDown.bind(this);

    // Global handle for actions if needed
    window.agentModal = this;
  }

  // ... existing methods ...

  renderTabs() {
    return `
      <div class="flex items-center gap-1 p-1 bg-slate-100/50 rounded-xl border border-slate-200/60">
        ${this.renderTabBtn('summary', 'Resumen', 'layout-dashboard')}
        ${this.renderTabBtn('history', 'Histórico', 'trending-up')}
        ${this.renderTabBtn('action-plan', 'Plan de Acción', 'file-text')}
        ${this.renderTabBtn('admin', 'Ficha Admin', 'user')}
      </div>
    `;
  }

  renderTabBtn(id, label, icon) {
    const active = this.activeTab === id;
    // High Contrast "Black Pill" Style
    // Active: Black bg, White text, crisp shadow
    // Inactive: Transparent, Slate text, hover effect
    const activeClass = "bg-slate-900 text-white shadow-md transform scale-100 ring-1 ring-slate-900";
    const inactiveClass = "text-slate-500 hover:text-slate-900 hover:bg-white/60";

    return `
      <button data-tab="${id}" 
        class="flex-1 py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 text-[11px] font-black uppercase tracking-wider relative overflow-hidden ${active ? activeClass : inactiveClass}">
        <i data-lucide="${icon}" class="w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}"></i>
        ${label}
      </button>
    `;
  }
  open(agentData) {
    this.agentData = agentData;
    this.activeTab = 'summary';
    console.log('[AgentModal] Opening for:', agentData.agent, 'KPIs:', agentData.kpis);
    this.render();

    // Ensure transition triggers after DOM insertion
    setTimeout(() => {
      if (this.element) {
        this.element.classList.add('opacity-100');
        const card = this.element.querySelector('.agent-modal-card');
        if (card) {
          card.style.opacity = '1';
          card.style.transform = 'scale(1)';
        }
      }
    }, 10);

    document.addEventListener('keydown', this.boundHandleKeyDown);
  }

  close() {
    if (!this.element) return;
    this.element.style.opacity = '0';
    const content = this.element.querySelector('.agent-modal-card');
    content.style.opacity = '0';
    content.style.transform = 'scale(0.95)';

    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }

    document.removeEventListener('keydown', this.boundHandleKeyDown);

    setTimeout(() => {
      if (this.element) this.element.remove();
      this.element = null;
    }, 300);
  }

  handleKeyDown(e) {
    if (e.key === 'Escape') {
      this.close();
    }
  }

  render() {
    // If it's an update, only refresh active state and body
    if (this.element && document.getElementById('agentModalOverlay')) {
      this.updateUI();
      return;
    }

    this.element = document.createElement('div');
    this.element.id = 'agentModalOverlay';
    this.element.className = 'fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[10000] flex items-center justify-center p-4 transition-all duration-500 opacity-0';

    const agentName = this.agentData?.agent || 'Agente Desconocido';
    const supervisor = this.agentData?.supervisor || 'Sin Asignar';
    const initials = agentName.split(' ').map(n => n.charAt(0)).join('').substring(0, 2).toUpperCase();

    this.element.innerHTML = `
      <div class="agent-modal-card bg-white w-full max-w-6xl h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden transition-all duration-500 transform scale-95 opacity-0 border border-slate-200">

        
        <!-- Premium Header Area -->
        <div class="flex-shrink-0 relative px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-white shadow-sm z-20 overflow-hidden">
          
          <!-- Decorative Background Mesh -->
          <div class="absolute top-0 right-0 w-[500px] h-full bg-gradient-to-l from-indigo-50/50 via-white to-white pointer-events-none"></div>
          <div class="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>

          <div class="flex gap-8 items-center relative z-10">
            <div class="group relative">
                <div class="absolute -inset-1 bg-gradient-to-r from-primary/20 to-indigo-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition duration-500"></div>
                <div class="relative w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-2xl shadow-xl transition-all hover:scale-105 active:scale-95">
                  ${initials}
                </div>
            </div>
            <div class="space-y-1">
              <div class="flex items-center gap-3">
                <h2 class="text-3xl font-black text-slate-900 tracking-tight leading-tight">${agentName}</h2>
                <span class="px-3 py-1 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-sm">PRO MEMBER</span>
              </div>
              <div class="flex items-center gap-6 text-slate-500 font-bold text-sm">
                <span class="flex items-center gap-2 hover:text-primary transition-colors cursor-default">
                  <i data-lucide="users" class="w-4 h-4 text-primary"></i> 
                  ${supervisor}
                </span>
                ${this.agentData?.id ? `
                  <span class="text-slate-300 text-xs px-2 border-l border-slate-200 uppercase tracking-widest font-mono">
                    ID: ${this.agentData.id}
                  </span>
                ` : ''}
              </div>
              
              <!-- Source Badge -->
              <div class="mt-3 flex items-center gap-2">
                 <div class="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-blue-100 flex items-center gap-2 shadow-sm">
                    <i data-lucide="file-spreadsheet" class="w-3 h-3"></i>
                    <span>${this.agentData._period || 'N/A'}</span>
                    <span class="w-px h-3 bg-blue-200 mx-1"></span>
                    <span class="opacity-75 font-medium truncate max-w-[150px]" title="${this.agentData._source}">${this.agentData._source || 'Archivo desconocido'}</span>
                 </div>
              </div>

            </div>
          </div>
          
          <div class="flex gap-3 relative z-10">
             <button id="exportAgentBtn" class="w-12 h-12 bg-white hover:bg-slate-50 rounded-xl transition-all text-slate-400 hover:text-primary border border-slate-100 shadow-sm flex items-center justify-center active:scale-90" title="Informe PDF">
                <i data-lucide="download" class="w-5 h-5"></i>
             </button>
             <button id="closeModalBtn" class="w-12 h-12 bg-white hover:bg-red-50 rounded-xl transition-all text-slate-400 hover:text-red-500 border border-slate-100 shadow-sm flex items-center justify-center active:scale-90" title="Cerrar">
                <i data-lucide="x" class="w-5 h-5"></i>
             </button>
          </div>
        </div>

        <!-- Professional Navigation Tabs -->
        <div class="flex-shrink-0 px-10 py-4 bg-slate-50/80 backdrop-blur-sm border-b border-slate-200/60 flex gap-2 overflow-x-auto no-scrollbar z-10" id="tabContainer">
           ${this.renderTabs()}
        </div>

        <!-- Scrollable Body -->
        <div class="flex-1 overflow-y-auto p-10 bg-slate-50" id="modalBody">
           <div class="animate-in fade-in slide-in-from-bottom-4 duration-500">
             ${this.renderContent()}
           </div>
        </div>

        <!-- Footer / Status Bar -->
        <div class="flex-shrink-0 px-10 py-4 bg-white border-t border-slate-100 flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)] z-20">
            <div class="flex items-center gap-3">
                <div class="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                Sincronizado con Store V2.0
            </div>
            <div id="saveStatus" class="hidden text-primary flex items-center gap-2 bg-primary/5 px-3 py-1 rounded-full border border-primary/10">
                <i data-lucide="check-circle" class="w-3 h-3"></i> Cambios guardados
            </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.element);
    createIcons({ icons, nameAttr: 'data-lucide' });
    this.attachEvents();
  }

  attachEvents() {
    // Remove old listeners if re-rendering shell (unlikely here but safe)
    this.element.removeEventListener('click', this.boundHandleClick);
    this.element.addEventListener('click', this.boundHandleClick);
  }

  handleClick(e) {
    // Close button or backdrop
    if (e.target.closest('#closeModalBtn') || e.target === this.element) {
      this.close();
      return;
    }

    // Tabs
    const tabBtn = e.target.closest('[data-tab]');
    if (tabBtn) {
      this.activeTab = tabBtn.dataset.tab;
      this.updateUI();
      return;
    }

    // Export
    if (e.target.closest('#exportAgentBtn')) {
      window.dispatchEvent(new CustomEvent('export-agent', { detail: { agentData: this.agentData } }));
    }

    // KPI Podium Card Selection
    const podiumCard = e.target.closest('.kpi-podium-card');
    if (podiumCard) {
      const kpiKey = podiumCard.dataset.kpiKey;
      this.selectedKPI = this.topKPIs.find(k => k.key === kpiKey) || null;

      // Update visual selection
      const allCards = this.element.querySelectorAll('.kpi-podium-card');
      allCards.forEach(card => {
        const cardInner = card.querySelector('div');
        const badge = card.querySelector('.kpi-selected-badge');
        if (card.dataset.kpiKey === kpiKey) {
          cardInner.classList.add('ring-4', 'ring-indigo-600', 'shadow-2xl', 'scale-105');
          if (badge) badge.classList.remove('hidden');
        } else {
          cardInner.classList.remove('ring-4', 'ring-indigo-600', 'shadow-2xl', 'scale-105');
          if (badge) badge.classList.add('hidden');
        }
      });

      createIcons({ icons, nameAttr: 'data-lucide' });
      return;
    }

    // Generate Summary (Action Plan)
    if (e.target.closest('#btnGenerateSummary')) {
      const kpis = this.agentData?.kpis || {};
      // Get dynamic config
      const currentConfig = kpiContext.getKPIs();

      // Calculate Stats
      this.priorityKPI = this.selectedKPI || identifyPriorityKPI(this.agentData.kpis || {}, currentConfig);
      this.summaryDraft = generateSummaryDraft(this.agentData, currentConfig); // Pass full agentData and config

      const textarea = this.element.querySelector('#actionPlanNotes');
      if (textarea) {
        // Preserve resize functionality by storing current style
        const currentStyle = textarea.getAttribute('style');
        textarea.value = this.summaryDraft;
        // Restore resize style if it was removed
        if (currentStyle && !textarea.getAttribute('style')) {
          textarea.setAttribute('style', currentStyle);
        }

        // Trigger input event for auto-save
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  }

  handleInput(e) {
    if (e.target.id === 'actionPlanNotes') {
      localStorage.setItem(`notes_${this.agentData.id || this.agentData.agent}`, e.target.value);
      const status = this.element.querySelector('#saveStatus');
      if (status) {
        status.classList.remove('hidden');
        setTimeout(() => { if (status) status.classList.add('hidden'); }, 2000);
      }
    }
  }

  updateUI() {
    const tabContainer = document.getElementById('tabContainer');
    const modalBody = document.getElementById('modalBody');

    if (tabContainer) tabContainer.innerHTML = this.renderTabs();
    if (modalBody) {
      modalBody.innerHTML = `
        <div class="animate-in fade-in slide-in-from-bottom-4 duration-500">
          ${this.renderContent()}
        </div>
      `;
      modalBody.scrollTop = 0;
    }

    createIcons({ icons, nameAttr: 'data-lucide' });

    // History Chart logic
    if (this.activeTab === 'history' && AgentHistory) {
      setTimeout(() => {
        if (this.chartInstance) this.chartInstance.destroy();
        this.chartInstance = AgentHistory.initChart(this.agentData.history);
      }, 50);
    }

    // Notes Listener logic
    if (this.activeTab === 'action-plan') {
      const textarea = this.element.querySelector('#actionPlanNotes');
      if (textarea) {
        textarea.removeEventListener('input', this.boundHandleInput);
        textarea.addEventListener('input', this.boundHandleInput);
      }
    }
  }

  renderTabs() {
    return `
      <div class="flex p-1 bg-slate-100/80 rounded-xl border border-slate-200/50 relative">
        ${this.renderTabBtn('summary', 'Resumen', 'layout-dashboard')}
        ${this.renderTabBtn('history', 'Histórico', 'trending-up')}
        ${this.renderTabBtn('action-plan', 'Plan de Acción', 'file-text')}
        ${this.renderTabBtn('admin', 'Ficha Admin', 'user')}
      </div>
    `;
  }

  renderTabBtn(id, label, icon) {
    const active = this.activeTab === id;
    // Segmented Control Style
    const activeClass = "bg-white text-slate-800 shadow-sm ring-1 ring-black/5";
    const inactiveClass = "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50";

    return `
      <button data-tab="${id}" class="flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 text-[11px] font-bold uppercase tracking-wider relative overflow-hidden ${active ? activeClass : inactiveClass}">
        <i data-lucide="${icon}" class="w-3.5 h-3.5 ${active ? 'text-indigo-600' : 'text-slate-400'}"></i>
        ${label}
      </button>
    `;
  }

  renderContent() {
    const kpis = this.agentData?.kpis || {};

    switch (this.activeTab) {
      case 'summary':
        return `
           <div class="space-y-12">
              <section>
                 <div class="flex items-center gap-4 mb-8">
                    <div class="h-8 w-1.5 bg-primary rounded-full"></div>
                    <h3 class="text-xl font-black text-slate-900 tracking-tight">Análisis de Indicadores</h3>
                 </div>
                 ${KPIMetrics.render(kpis, this.getKPIConfig())}
              </section>
              <section>
                 ${this.renderMiniDiagnostic()}
              </section>
           </div>
        `;
      case 'history':
        return AgentHistory.render(this.agentData.history);
      case 'admin': return AgentAdmin.render(this.agentData.admin);
      case 'action-plan':
        const notes = localStorage.getItem(`notes_${this.agentData.id || this.agentData.agent}`) || '';
        this.topKPIs = identifyTopKPIs(kpis, this.getKPIConfig(), 3);
        return AgentActionPlan.render(this.agentData, notes, this.topKPIs);
      default: return '';
    }
  }

  renderMiniDiagnostic() {
    const kpis = this.agentData?.kpis || {};
    const config = this.getKPIConfig();

    let totalKPIs = 0;
    let metKPIs = 0;
    let failedList = [];

    config.forEach(kpi => {
      const val = kpis[kpi.key];
      if (val !== undefined && val !== null) {
        totalKPIs++;
        // Parse value if string to ensure correct comparison
        const numVal = parseFloat(String(val).replace('%', '').replace(',', '.'));

        let isMet = false;
        // Handle valid numeric values
        if (!isNaN(numVal)) {
          if (kpi.type === 'min') {
            isMet = numVal >= kpi.target;
          } else {
            isMet = numVal <= kpi.target; // max
          }
        }

        if (isMet) {
          metKPIs++;
        } else {
          failedList.push(kpi.label);
        }
      }
    });

    const successRate = totalKPIs > 0 ? (metKPIs / totalKPIs) : 0;

    let state = 'stable';
    if (successRate >= 0.8 && totalKPIs > 0) state = 'good';
    if (successRate < 0.5 && totalKPIs > 0) state = 'crisis';

    // Text generation
    const failedText = failedList.length > 0
      ? `Áreas de mejora: ${failedList.slice(0, 3).join(', ')}${failedList.length > 3 ? '...' : ''}`
      : 'Todos los indicadores en objetivo.';

    const statusConfig = {
      good: {
        bg: 'bg-green-50/50 border-green-100',
        iconBg: 'bg-green-100 text-green-600',
        text: 'text-green-900',
        desc: 'text-green-800/80',
        icon: 'check-circle',
        title: 'Desempeño Excelente',
        msg: `El agente cumple ${metKPIs}/${totalKPIs} objetivos. Mantenimiento impecable de estándares.`
      },
      stable: {
        bg: 'bg-white border-slate-200',
        iconBg: 'bg-slate-100 text-slate-600',
        text: 'text-slate-900',
        desc: 'text-slate-600',
        icon: 'info',
        title: 'Desempeño Estable',
        msg: `El agente cumple ${metKPIs}/${totalKPIs} objetivos. ${failedText}`
      },
      crisis: {
        bg: 'bg-red-50/50 border-red-100',
        iconBg: 'bg-red-100 text-red-600',
        text: 'text-red-900',
        desc: 'text-red-800/80',
        icon: 'alert-circle',
        title: 'Atención Requerida',
        msg: `Crítico: Solo cumple ${metKPIs}/${totalKPIs} objetivos. ${failedText}`
      }
    };

    const s = statusConfig[state];

    return `
      <div class="p-6 rounded-lg border ${s.bg} shadow-sm transition-all hover:shadow-md">
        <div class="flex items-center gap-4 mb-3">
            <div class="w-10 h-10 rounded-full flex items-center justify-center ${s.iconBg}">
                <i data-lucide="${s.icon}" class="w-5 h-5"></i>
            </div>
            <h4 class="text-lg font-black ${s.text}">${s.title}</h4>
        </div>
        <p class="text-sm leading-relaxed font-medium ${s.desc}">
            ${s.msg}
        </p>
      </div>
    `;
  }

  getKPIConfig() {
    return kpiContext.getKPIs();
  }
}

