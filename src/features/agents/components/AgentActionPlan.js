export const AgentActionPlan = {
    render(agentData, initialNotes = '', topKPIs = []) {
        const agentId = agentData.id || agentData.agent;

        // Top 3 KPIs Podium
        let podiumSection = '';

        if (topKPIs.length === 0) {
            // All KPIs in green - Celebration message
            podiumSection = `
                <div class="mb-6 p-6 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2">
                    <div class="bg-green-100 text-green-600 p-3 rounded-xl">
                        <i data-lucide="trophy" class="w-6 h-6"></i>
                    </div>
                    <div>
                        <h5 class="text-base font-black text-green-800">¡Excelente Desempeño!</h5>
                        <p class="text-sm text-green-700/80 mt-1">
                            Todos los indicadores están en objetivo. Mantén este nivel de calidad.
                        </p>
                    </div>
                </div>
            `;
        } else {
            // Show podium cards
            const medals = ['🥇', '🥈', '🥉'];
            const colors = [
                { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: 'bg-red-100 text-red-600', bar: 'bg-red-500' },
                { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', icon: 'bg-orange-100 text-orange-600', bar: 'bg-orange-500' },
                { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', icon: 'bg-yellow-100 text-yellow-600', bar: 'bg-yellow-500' }
            ];

            const cards = topKPIs.map((kpi, index) => {
                const color = colors[index] || colors[2];
                const medal = medals[index] || '📊';
                const gapPercent = Math.abs((kpi.gap / kpi.target) * 100).toFixed(1);
                const progressWidth = Math.min(100, parseFloat(gapPercent));

                return `
                    <div class="kpi-podium-card group cursor-pointer transition-all duration-200 hover:shadow-lg" 
                         data-kpi-key="${kpi.key}"
                         data-kpi-index="${index}">
                        <div class="p-2 rounded-lg ${color.bg} border-2 ${color.border} transition-all">
                            <!-- Compact Header: Icon + Medal + Name in one line -->
                            <div class="flex items-center justify-between gap-2 mb-1.5">
                                <div class="flex items-center gap-1.5 flex-1 min-w-0">
                                    <span class="text-base flex-shrink-0">${medal}</span>
                                    <h5 class="text-xs font-black ${color.text} leading-tight truncate">${kpi.label}</h5>
                                </div>
                                <div class="${color.icon} p-1 rounded">
                                    <i data-lucide="${kpi.icon || 'alert-circle'}" class="w-3 h-3"></i>
                                </div>
                            </div>
                            
                            <!-- Compact Metrics: Deviation + Details in one line -->
                            <div class="flex items-baseline justify-between gap-2 mb-1.5">
                                <div class="text-base font-black ${color.text}">
                                    ${kpi.gap > 0 ? '+' : ''}${kpi.gap.toFixed(1)}${kpi.isPercent ? '%' : ''}
                                </div>
                                <div class="text-[9px] text-slate-500 font-medium text-right">
                                    ${kpi.actual}${kpi.isPercent ? '%' : ''} / ${kpi.target}${kpi.isPercent ? '%' : ''}
                                </div>
                            </div>
                            
                            <!-- Compact Progress Bar -->
                            <div class="w-full bg-white/60 rounded-full h-1 overflow-hidden mb-1">
                                <div class="${color.bar} h-full rounded-full transition-all duration-500" 
                                     style="width: ${progressWidth}%"></div>
                            </div>
                            <div class="text-[9px] font-bold ${color.text} text-right">
                                ${gapPercent}% desv.
                            </div>
                            
                            <!-- Selection Indicator (hidden by default) -->
                            <div class="kpi-selected-badge hidden mt-1.5 pt-1.5 border-t border-current/20">
                                <div class="flex items-center gap-1 text-[9px] font-black ${color.text}">
                                    <i data-lucide="check-circle" class="w-2.5 h-2.5"></i>
                                    SELECCIONADO
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            podiumSection = `
                <div class="mb-6 animate-in fade-in slide-in-from-bottom-2">
                    <div class="flex items-center gap-3 mb-4">
                        <div class="h-8 w-1.5 bg-indigo-600 rounded-full"></div>
                        <h4 class="text-lg font-black text-slate-900">Áreas de Enfoque Prioritarias</h4>
                    </div>
                    <p class="text-sm text-slate-600 mb-4 font-medium">
                        Selecciona el KPI que abordarás en esta sesión de feedback:
                    </p>
                    <div class="grid grid-cols-1 md:grid-cols-${Math.min(topKPIs.length, 3)} gap-4" id="kpiPodiumGrid">
                        ${cards}
                    </div>
                </div>
            `;
        }

        return `
      <div class="animate-in fade-in slide-in-from-bottom-2 duration-300 h-full flex flex-col gap-6">
         <!-- Main Action Plan Card -->
         <div class="bg-white p-6 pt-4 rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col">
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h4 class="text-xl font-bold text-slate-800">Plan de Acción</h4>
                    <p class="text-sm text-slate-500 mt-1">Acuerdos y compromisos de mejora continua</p>
                </div>
                <div class="flex gap-2">
                    <button id="btnGenerateSummary" class="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors border border-indigo-100">
                        <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
                        Generar Resumen
                    </button>
                    <div class="bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider">
                        Feedback Directo
                    </div>
                </div>
            </div>
            
            ${podiumSection}
            
            <textarea id="actionPlanNotes" 
                class="w-full p-4 border-2 border-slate-100 rounded-2xl bg-slate-50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none text-slate-700 leading-relaxed font-medium"
                style="resize: vertical !important; min-height: 150px; max-height: 600px; height: auto;"
                placeholder="1. Escribe aquí los compromisos...
2. Fortalezas observadas...
3. Acuerdos para la próxima sesión...">${initialNotes}</textarea>
            
            <div class="mt-6 flex justify-between items-center text-xs text-slate-400 font-medium italic">
                <p><i data-lucide="info" class="w-3.5 h-3.5 inline mr-1"></i> Se guarda automáticamente de forma local.</p>
                <div id="saveStatus" class="hidden text-green-600 font-bold flex items-center gap-1">
                    <i data-lucide="check-circle" class="w-3.5 h-3.5"></i> Guardado
                </div>
            </div>
         </div>
      </div>`;
    }
};
