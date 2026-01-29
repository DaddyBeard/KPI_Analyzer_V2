
export const AgentObjectives = {
    render(kpis) {
        const config = [
            { key: 'adherence', label: 'Adherencia', target: 95, suffix: '%' },
            { key: 'ncoBO', label: 'NCO Back Office', target: 85, suffix: '%' },
            { key: 'aht', label: 'AHT (Tiempo)', target: 340, suffix: 's', invert: true },
            { key: 'nps', label: 'NPS (Calidad)', target: 30, suffix: '' }
        ];

        return `
      <div class="animate-in fade-in slide-in-from-bottom-2 duration-300">
         <div class="bg-slate-900 rounded-xl p-8 mb-8 text-white shadow-2xl">
            <h4 class="font-bold text-xl mb-2 flex items-center gap-2">
                <i data-lucide="target" class="w-6 h-6 text-primary"></i> 
                Análisis de Cumplimiento
            </h4>
            <p class="text-sm text-slate-400 mb-8 font-medium">Desempeño actual vs Metas de Campaña</p>
            
            <div class="grid grid-cols-1 gap-6">
                ${config.map(c => {
            const val = kpis?.[c.key] || 0;
            const diff = c.invert ? c.target - val : val - c.target;
            const pct = Math.min(100, Math.max(0, c.invert ? (c.target / Math.max(1, val)) * 100 : (val / c.target) * 100));
            const isGood = diff >= 0;
            const colorClass = isGood ? 'bg-primary' : 'bg-red-500';

            return `
                    <div class="bg-slate-800/50 p-5 rounded-xl border border-white/5">
                        <div class="flex justify-between items-end mb-3">
                            <div>
                                <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">${c.label}</p>
                                <p class="text-2xl font-bold">${val}${c.suffix} 
                                    <span class="text-xs font-normal text-slate-500 ml-2">Meta: ${c.target}${c.suffix}</span>
                                </p>
                            </div>
                            <div class="text-right">
                                <p class="text-sm font-bold ${isGood ? 'text-green-400' : 'text-red-400'} flex items-center gap-1">
                                    <i data-lucide="${isGood ? 'trending-up' : 'trending-down'}" class="w-4 h-4"></i>
                                    ${isGood ? '+' : ''}${diff.toFixed(1)}${c.suffix}
                                </p>
                            </div>
                        </div>
                        <div class="w-full h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                            <div class="h-full ${colorClass} transition-all duration-1000 ease-out" style="width: ${pct}%"></div>
                        </div>
                    </div>
                  `;
        }).join('')}
            </div>
         </div>
      </div>`;
    }
};
