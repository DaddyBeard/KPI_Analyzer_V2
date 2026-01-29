
export const AgentActionPlan = {
    render(agentData, initialNotes = '', priorityKPI = null) {
        const agentId = agentData.id || agentData.agent;

        // Priority KPI Badge Logic
        let priorityBadge = '';
        if (priorityKPI) {
            priorityBadge = `
                <div class="mb-6 p-4 rounded-xl bg-orange-50 border border-orange-100 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2">
                    <div class="bg-orange-100 text-orange-600 p-2 rounded-lg mt-0.5">
                        <i data-lucide="alert-triangle" class="w-5 h-5"></i>
                    </div>
                    <div>
                        <h5 class="text-sm font-bold text-orange-800">Foco Prioritario Detectado: ${priorityKPI.label}</h5>
                        <p class="text-xs text-orange-700/80 mt-1">
                            Desviación de <span class="font-black">${Math.abs(priorityKPI.gap).toFixed(2)}${priorityKPI.isPercent ? '%' : ''}</span> 
                            respecto al objetivo. Se sugiere centrar la sesión en este indicador.
                        </p>
                    </div>
                </div>
            `;
        }

        return `
      <div class="animate-in fade-in slide-in-from-bottom-2 duration-300 h-full flex flex-col gap-6">
         <!-- Main Action Plan Card -->
         <div class="bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col">
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
            
            ${priorityBadge}
            
            <textarea id="actionPlanNotes" 
                class="flex-1 w-full p-6 border-2 border-slate-100 rounded-2xl bg-slate-50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none resize-none text-slate-700 leading-relaxed font-medium"
                placeholder="1. Escribe aquí los compromisos...\n2. Fortalezas observadas...\n3. Acuerdos para la próxima sesión...">${initialNotes}</textarea>
            
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
