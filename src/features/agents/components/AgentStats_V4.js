
export const KPIMetrics = {
    render(kpis, config) {
        if (!kpis) return '';

        // Filter to show only KPIs with data
        const activeKPIs = config.filter(kpi => {
            const val = kpis[kpi.key];
            const numVal = (val !== null && val !== undefined) ? parseFloat(String(val).replace('%', '').replace(',', '.')) : null;
            return numVal !== null && !isNaN(numVal);
        });

        return `
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-3">
        ${activeKPIs.map(kpi => this.renderCard(kpi, kpis)).join('')}
      </div>
    `;
    },

    renderCard(kpi, allKpis) {
        // ... (existing code)
        // ...

        const val = allKpis[kpi.key];
        const numVal = parseFloat(String(val).replace('%', '').replace(',', '.'));

        // Status Determination
        let status = 'neutral';
        if (kpi.target !== undefined) {
            const isMin = kpi.type === 'min';
            const target = kpi.target;
            const diff = Math.abs((numVal - target) / target);
            const isGood = isMin ? numVal >= target : numVal <= target;

            if (isGood) {
                status = 'success';
            } else if (diff < (kpi.warningThreshold || 0.15)) {
                status = 'warning';
            } else {
                status = 'critical';
            }
        }

        // Styles Configuration
        let iconColor = 'text-slate-400';
        let iconBg = 'bg-slate-50';
        let progressColor = 'bg-slate-200';
        let icon = kpi.icon || 'activity';

        if (status === 'success') {
            iconColor = 'text-emerald-600';
            iconBg = 'bg-emerald-50';
            progressColor = 'bg-emerald-500';
            icon = 'check-circle';
        } else if (status === 'warning') {
            iconColor = 'text-amber-600';
            iconBg = 'bg-amber-50';
            progressColor = 'bg-amber-500';
            icon = 'alert-triangle';
        } else if (status === 'critical') {
            iconColor = 'text-rose-600';
            iconBg = 'bg-rose-50';
            progressColor = 'bg-rose-500';
            icon = 'x-circle';
        }

        const decimals = kpi.decimals !== undefined ? kpi.decimals : (kpi.isPercent ? 1 : 2);
        const displayVal = kpi.isPercent ? numVal.toFixed(decimals) + '%' : numVal.toFixed(decimals);
        const cleanTarget = kpi.target + (kpi.isPercent ? '%' : '');

        let percent = 0;
        if (kpi.target) {
            if (kpi.type === 'min') {
                percent = Math.min((numVal / kpi.target) * 100, 100);
            } else {
                percent = Math.min((numVal / (kpi.target * 1.5)) * 100, 100);
            }
        }

        // COMPACT DESIGN V4 - CLEAN TAILWIND
        return `
      <div class="bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
         <div class="flex justify-between items-start mb-1">
             <div class="w-8 h-8 rounded-md ${iconBg} flex items-center justify-center border border-white shadow-sm">
                <i data-lucide="${icon}" class="w-4 h-4 ${iconColor}"></i>
             </div>
             ${status !== 'neutral' ? `
                <span class="flex h-2 w-2 mt-1">
                  <span class="group-hover:animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${progressColor}"></span>
                  <span class="relative inline-flex rounded-full h-2 w-2 ${progressColor}"></span>
                </span>
             ` : ''}
         </div>
         
         <div class="mb-2">
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-px">${kpi.label}</p>
            <div class="flex items-baseline gap-2">
                <h4 class="text-2xl font-black text-slate-800 tracking-tight leading-none">${displayVal}</h4>
            </div>
         </div>

         <!-- Progress Bar Context -->
         <div>
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
};
