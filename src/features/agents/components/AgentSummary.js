
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
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        ${activeKPIs.map(kpi => {
      const val = kpis[kpi.key];
      const numVal = parseFloat(String(val).replace('%', '').replace(',', '.'));

      const status = this.getStatus(kpi, numVal);
      const color = this.getStatusColor(status);
      const icon = kpi.icon || (status === 'CUMPLIDO' ? 'check-circle' : 'alert-triangle');

      const displayVal = kpi.isPercent ? numVal.toFixed(1) + '%' : numVal.toFixed(2);
      const objVal = kpi.isPercent ? kpi.target + '%' : kpi.target.toFixed(2);

      // Delta calculation
      const delta = numVal - kpi.target;
      const isPositiveDelta = delta >= 0;
      const deltaDir = kpi.type === 'min' ? isPositiveDelta : !isPositiveDelta;
      const deltaLabel = (isPositiveDelta ? '+' : '') + (kpi.isPercent ? delta.toFixed(1) : delta.toFixed(2));
      const deltaBg = deltaDir ? 'bg-emerald-500' : 'bg-rose-500';

      return `
            <div class="group relative bg-white rounded-2xl border border-slate-100 transition-all hover:shadow-md hover:-translate-y-0.5 overflow-hidden p-4 flex flex-col gap-3 shadow-sm min-h-[8rem]">
              
              <!-- Indicator Pill -->
              <div class="absolute top-3 left-0 w-1 h-8 rounded-r-full opacity-60" style="background-color: ${color.main}"></div>

              <div class="flex items-start justify-between pl-2">
                 <div class="space-y-0.5">
                    <p class="text-[8px] font-black uppercase tracking-widest leading-none" style="color: ${color.main}">${status}</p>
                    <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-tight">${kpi.label}</h4>
                    ${kpi.secondaryKey && kpis[kpi.secondaryKey] ? `
                      <div class="flex items-center gap-1 mt-0.5">
                        <span class="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">${kpi.secondaryLabel || 'Total'}:</span>
                        <span class="text-[9px] font-black text-slate-500">${kpis[kpi.secondaryKey]}</span>
                      </div>
                    ` : ''}
                 </div>
                 <div class="w-6 h-6 rounded-md flex items-center justify-center bg-slate-50 text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-colors duration-300">
                    <i data-lucide="${icon}" class="w-3.5 h-3.5"></i>
                 </div>
              </div>

              <div class="pl-2">
                 <div class="text-2xl font-black text-slate-900 tracking-tighter">${displayVal}</div>
              </div>

              <div class="mt-auto pl-2 pt-3 border-t border-slate-50 flex items-center justify-between">
                  <div class="flex items-baseline gap-1">
                     <span class="text-[8px] font-bold text-slate-300 uppercase tracking-tighter">OBJ</span>
                     <span class="text-xs font-black text-slate-600">${objVal}</span>
                  </div>
                  
                  <div class="${deltaBg} text-white px-1.5 py-0.5 rounded-sm text-[9px] font-bold shadow-sm flex items-center gap-0.5">
                     ${deltaLabel}
                  </div>
              </div>
            </div>
          `;
    }).join('')}
      </div>
    `;
  },

  getStatus(kpi, value) {
    if (value === null || value === undefined) return 'SIN DATOS';
    const isGood = kpi.type === 'min' ? value >= kpi.target : value <= kpi.target;
    if (isGood) return 'CUMPLIDO';
    const diff = Math.abs((value - kpi.target) / kpi.target);
    return diff < 0.15 ? 'SEGUIMIENTO' : 'MEJORAR';
  },

  getStatusColor(status) {
    switch (status) {
      case 'CUMPLIDO': return { main: '#10b981', border: '#10b981', bgOpacity: 'rgba(16, 185, 129, 0.03)' };
      case 'SEGUIMIENTO': return { main: '#f59e0b', border: '#f59e0b', bgOpacity: 'rgba(245, 158, 11, 0.03)' };
      case 'MEJORAR': return { main: '#ef4444', border: '#ef4444', bgOpacity: 'rgba(239, 68, 68, 0.03)' };
      default: return { main: '#94a3b8', border: '#e2e8f0', bgOpacity: 'transparent' };
    }
  }
};
