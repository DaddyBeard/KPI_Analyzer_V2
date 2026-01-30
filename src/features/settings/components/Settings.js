import { createIcons, icons } from 'lucide';
import { kpiContext } from '../logic/KPIContext.js';

export class Settings {
    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'w-full h-full overflow-hidden flex flex-col bg-[#F9FAFB]';
        this.state = kpiContext.getKPIs();
        // Bind methods
        this.handleSave = this.handleSave.bind(this);
        this.handleReset = this.handleReset.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    render() {
        this.container.innerHTML = `
            <header class="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between sticky top-0 z-10">
                <div>
                    <h2 class="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <i data-lucide="settings" class="w-6 h-6 text-indigo-600"></i>
                         Configuración de Objetivos
                    </h2>
                    <p class="text-slate-500 text-sm mt-1 font-medium">Define los objetivos y la importancia de cada KPI para el análisis automático.</p>
                </div>
                <div class="flex items-center gap-3">
                    <button id="btnReset" class="px-4 py-2 text-slate-500 hover:text-slate-700 font-bold text-sm transition-colors border border-transparent hover:border-slate-300 rounded-lg">
                        Restablecer
                    </button>
                    <button id="btnSave" class="px-6 py-2 bg-indigo-600 text-white hover:bg-indigo-700 font-bold text-sm rounded-lg shadow-sm transition-all transform active:scale-95 flex items-center gap-2">
                        <i data-lucide="save" class="w-4 h-4"></i> Guardar Cambios
                    </button>
                </div>
            </header>

            <div class="flex-1 overflow-y-auto p-8">
                <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    ${this.state.map(kpi => this.renderKPICard(kpi)).join('')}
                </div>
            </div>
        `;

        this.attachEvents();
        setTimeout(() => createIcons({ icons, nameAttr: 'data-lucide' }), 0);
        return this.container;
    }

    renderKPICard(kpi) {
        return `
            <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4 hover:shadow-md transition-shadow group">
                <div class="flex items-start justify-between">
                    <div class="flex items-center gap-3">
                        <div class="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <i data-lucide="${kpi.icon || 'activity'}" class="w-5 h-5"></i>
                        </div>
                        <div>
                            <h3 class="font-bold text-slate-800 text-base">${kpi.label}</h3>
                            <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
                                ${kpi.type === 'min' ? 'Mínimo' : 'Máximo'}
                            </span>
                        </div>
                    </div>
                </div>

                <p class="text-slate-500 text-xs leading-relaxed border-b border-slate-50 pb-3 min-h-[40px]">
                    ${kpi.description || 'Sin descripción'}
                </p>

                <div class="grid grid-cols-2 gap-4">
                    <!-- Target Input -->
                    <div class="flex flex-col gap-1.5">
                        <label class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Objetivo ${kpi.isPercent ? '(%)' : ''}</label>
                        <input type="number" 
                            step="${kpi.isPercent ? '1' : '0.1'}" 
                            value="${kpi.target}"
                            data-key="${kpi.key}"
                            data-field="target"
                            class="kpi-input w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-right"
                        />
                    </div>

                    <!-- Warning Threshold Input -->
                    <div class="flex flex-col gap-1.5">
                        <label class="text-[11px] font-bold text-slate-400 uppercase tracking-wider relative group cursor-help">
                            Tolerancia (%)
                            <span class="absolute bottom-full left-0 mb-2 w-48 bg-slate-800 text-white text-[10px] p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 font-normal normal-case">
                                Margen de error permitido antes de considerar el KPI crítico (Rojo). Ejemplo: 15%
                            </span>
                        </label>
                        <input type="number" 
                            step="1" 
                            min="0"
                            max="100"
                            value="${Math.round((kpi.warningThreshold || 0.15) * 100)}"
                            data-key="${kpi.key}"
                            data-field="warningThreshold"
                            class="kpi-input w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-amber-600 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all text-right"
                        />
                    </div>

                    <!-- Importance Selector -->
                    <div class="flex flex-col gap-1.5">
                        <label class="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">Importancia (1-5)</label>
                        <div class="flex items-center justify-end gap-1 h-[38px]">
                            ${[1, 2, 3, 4, 5].map(level => `
                                <button type="button" 
                                    class="importance-btn w-6 h-8 rounded flex items-center justify-center text-xs font-bold transition-all ${kpi.importance >= level ? 'bg-indigo-500 text-white shadow-sm' : 'bg-slate-100 text-slate-300 hover:bg-slate-200'}"
                                    data-key="${kpi.key}"
                                    data-level="${level}"
                                    title="Nivel ${level}"
                                ></button>
                            `).join('')}
                        </div>
                        <input type="hidden" data-key="${kpi.key}" data-field="importance" value="${kpi.importance}">
                    </div>
                </div>
            </div>
        `;
    }

    attachEvents() {
        // Target Inputs
        this.container.querySelectorAll('.kpi-input').forEach(input => {
            input.addEventListener('change', (e) => {
                this.handleChange(e.target.dataset.key, 'target', parseFloat(e.target.value));
            });
        });

        // Importance Buttons
        this.container.querySelectorAll('.importance-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const key = e.target.dataset.key;
                const level = parseInt(e.target.dataset.level);
                this.updateImportanceUI(key, level);
                this.handleChange(key, 'importance', level);
            });
        });

        // Main Actions
        this.container.querySelector('#btnSave').addEventListener('click', this.handleSave);
        this.container.querySelector('#btnReset').addEventListener('click', this.handleReset);
    }

    updateImportanceUI(key, level) {
        // Visual update only
        const buttons = this.container.querySelectorAll(`.importance-btn[data-key="${key}"]`);
        buttons.forEach(btn => {
            const btnLevel = parseInt(btn.dataset.level);
            if (btnLevel <= level) {
                btn.className = 'importance-btn w-6 h-8 rounded flex items-center justify-center text-xs font-bold transition-all bg-indigo-500 text-white shadow-sm';
            } else {
                btn.className = 'importance-btn w-6 h-8 rounded flex items-center justify-center text-xs font-bold transition-all bg-slate-100 text-slate-300 hover:bg-slate-200';
            }
        });
        // Update hidden input
        const input = this.container.querySelector(`input[data-field="importance"][data-key="${key}"]`);
        if (input) input.value = level;
    }

    handleChange(key, field, value) {
        const index = this.state.findIndex(k => k.key === key);
        if (index !== -1) {
            // Special handling for tolerance: UI shows 15, State stores 0.15
            let finalValue = value;
            if (field === 'warningThreshold') {
                finalValue = value / 100;
            }
            this.state[index] = { ...this.state[index], [field]: finalValue };
        }
    }

    handleSave() {
        kpiContext.saveKPIs(this.state);

        // Show success animation on button
        const btn = this.container.querySelector('#btnSave');
        const originalContent = btn.innerHTML;
        btn.innerHTML = `<i data-lucide="check" class="w-4 h-4"></i> Guardado`;
        btn.classList.add('bg-emerald-600', 'hover:bg-emerald-700');
        btn.classList.remove('bg-indigo-600', 'hover:bg-indigo-700');

        createIcons({ icons, nameAttr: 'data-lucide' });

        setTimeout(() => {
            btn.innerHTML = originalContent;
            btn.classList.add('bg-indigo-600', 'hover:bg-indigo-700');
            btn.classList.remove('bg-emerald-600', 'hover:bg-emerald-700');
            createIcons({ icons, nameAttr: 'data-lucide' });
        }, 2000);
    }

    handleReset() {
        if (confirm('¿Estás seguro de que quieres restablecer la configuración por defecto?')) {
            kpiContext.resetDefaults();
            this.state = kpiContext.getKPIs();
            this.render(); // Re-render full view
        }
    }
}
