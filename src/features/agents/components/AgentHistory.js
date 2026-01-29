import { KPI_CONFIG } from '../../../config/kpi.config.js';

export const AgentHistory = {
  render(history) {
    if (!history || history.length === 0) {
      return `
             <div class="flex flex-col items-center justify-center h-64 text-slate-400 italic bg-slate-50 rounded-2xl border border-slate-100">
                  <i data-lucide="calendar-x" class="w-10 h-10 mb-2 opacity-30"></i>
                  <p>No hay historial disponible.</p>
             </div>
            `;
    }

    // 1. Deduplicate & Merge History (Group by Normalized Period)
    const uniqueHistoryMap = new Map();

    history.forEach(h => {
      // Normalize period name (Extract YYYY-MM or fallback)
      const rawPeriod = h.period || "";
      const normalizedKey = this.normalizePeriod(rawPeriod);

      if (!uniqueHistoryMap.has(normalizedKey)) {
        uniqueHistoryMap.set(normalizedKey, {
          period: normalizedKey, // Use clean display name
          originalPeriod: rawPeriod,
          source: h.source, // Capture source file
          kpis: { ...h.kpis }
        });
      } else {
        // Merge KPIs safely (only overwrite if new value is valid)
        const existing = uniqueHistoryMap.get(normalizedKey);
        const newKpis = h.kpis || {};

        Object.keys(newKpis).forEach(key => {
          const val = newKpis[key];
          // Only update if value is not null/undefined/empty string
          if (val !== null && val !== undefined && val !== '') {
            existing.kpis[key] = val;
          }
        });

        // FIX: Ensure Source Label respects KPI file priority if merging
        const currentSource = existing.source || '';
        const newSource = h.source || '';
        if (newSource.toUpperCase().includes('KPI') && !currentSource.toUpperCase().includes('KPI')) {
          existing.source = newSource;
        }
      }
    });

    // 2. Sort Periods (Newest first: roughly by YYYY-MM)
    const periods = Array.from(uniqueHistoryMap.values())
      .sort((a, b) => b.period.localeCompare(a.period));

    return `
      <div class="animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
           <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider">Histórico Unificado</h3>
              <span class="text-xs text-slate-400 bg-white border border-slate-200 px-2 py-1 rounded shadow-sm">
                ${periods.length} Meses
              </span>
           </div>
           
           <div class="overflow-x-auto">
             <table class="w-full text-left border-collapse">
               <thead>
                 <tr class="text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-100 bg-slate-50/30">
                   <!-- Top Left Corner -->
                   <th class="px-4 py-3 font-bold sticky left-0 bg-white z-20 border-r border-slate-100 shadow-sm min-w-[150px]">
                      INDICADOR
                   </th>
                   <!-- Period Columns -->
                   ${periods.map(p => `
                     <th class="px-4 py-3 font-bold text-center whitespace-nowrap min-w-[100px]">
                       <div class="flex flex-col items-center">
                         <span>${p.period}</span>
                         <span class="text-[9px] text-slate-300 font-normal truncate max-w-[100px] mt-1" title="${p.source}">
                           ${p.source || 'Desconocido'}
                         </span>
                       </div>
                     </th>
                   `).join('')}
                 </tr>
               </thead>
               <tbody class="divide-y divide-slate-50 text-xs">
                 ${KPI_CONFIG.map(kpi => {
      return `
                      <tr class="hover:bg-slate-50/80 transition-colors group">
                        <!-- KPI Row Header -->
                        <td class="px-4 py-3 sticky left-0 bg-white group-hover:bg-[#fcfdfec0] z-10 border-r border-slate-100 shadow-sm">
                            <div class="flex flex-col">
                                <span class="font-bold text-slate-700">${kpi.label}</span>
                                <span class="text-[9px] text-slate-400 font-normal">Obj: ${kpi.target}${kpi.isPercent ? '%' : ''}</span>
                            </div>
                        </td>
                        
                        <!-- KPI Values per Period -->
                        ${periods.map(record => {
        const val = record.kpis ? record.kpis[kpi.key] : null;

        if (val === null || val === undefined) {
          return '<td class="px-4 py-3 text-center text-slate-300">-</td>';
        }

        const numVal = parseFloat(String(val).replace('%', '').replace(',', '.'));
        const displayVal = kpi.isPercent ? numVal.toFixed(1) + '%' : numVal.toFixed(2);

        let isMet = false;
        if (!isNaN(numVal)) {
          isMet = kpi.type === 'min' ? numVal >= kpi.target : numVal <= kpi.target;
        }

        const styleClass = isMet
          ? 'text-emerald-600 font-bold bg-emerald-50/50 rounded ring-1 ring-emerald-100'
          : 'text-rose-500 font-medium bg-rose-50/30 rounded';

        return `
                              <td class="px-4 py-3 text-center border-l border-dashed border-slate-50">
                                <span class="${styleClass} px-2 py-1 inline-block min-w-[60px]">
                                    ${displayVal}
                                </span>
                              </td>
                            `;
      }).join('')}
                      </tr>
                    `;
    }).join('')}
               </tbody>
             </table>
           </div>
        </div>
      </div>`;
  },

  normalizePeriod(filename) {
    // Try to extract Year and Month (e.g., KPI_2025_12, 2025-10, etc.)
    const regex = /20\d{2}[_|-](\d{2})/;
    const match = filename.match(regex);

    if (match) {
      // match[0] is like "2025_12", match[1] is "12"
      const year = match[0].substring(0, 4);
      const month = match[1];
      return `${year}-${month}`;
    }

    // Fallback logic for "Week" files or unknowns
    if (filename.includes('W52') || filename.includes('DIC')) return `2025-12`; // Manual mapping for known edge case

    return filename.replace('.xlsx', '').replace('.XLSX', '');
  },

  initChart() {
    // No-op
  }
};
