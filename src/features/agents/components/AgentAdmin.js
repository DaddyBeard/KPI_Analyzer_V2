
export const AgentAdmin = {
    render(adminData) {
        if (!adminData) return '<div class="p-8 text-center text-slate-400">Sin información administrativa disponible</div>';

        // Helper to format values
        const formatVal = (val) => {
            if (val === null || val === undefined || val === '') return null;
            return String(val).toUpperCase();
        };

        // Field Configuration Groups
        const groups = [
            {
                title: 'Sistemas y Accesos',
                icon: 'monitor',
                fields: [
                    // Specific Order Requested
                    { key: 'login', label: 'Login' },
                    { key: 'extension', label: 'Extensión' },
                    { key: 'emea', label: 'EMEA' }, // Moved here as requested
                    { key: 'email', label: 'Correo' },
                    { key: 'salesforce', label: 'Salesforce' },
                    { key: 'callcenter', label: 'CallCenter' },
                    { key: 'resiber', label: 'Resiber' },
                    { key: 'amadeus', label: 'Amadeus' },
                    { key: 'desktop', label: 'Desktop' },
                    // Others (Appended to ensure data visibility)
                    { key: 'userRed', label: 'Usuario Red' },
                    { key: 'userSitel', label: 'Usuario Sitel' },
                    { key: 'userSyr', label: 'Usuario SYR' }
                ]
            },
            {
                title: 'Detalles del Puesto',
                icon: 'briefcase',
                fields: [
                    { key: 'service', label: 'Servicio' },
                    { key: 'category', label: 'Categoría' },
                    { key: 'segment', label: 'Segmento' },
                    { key: 'language', label: 'Idioma' },
                    { key: 'antiguedad', label: 'Antigüedad' },
                    { key: 'tm', label: 'Team Manager' },
                    { key: 'schedule', label: 'Horario' },
                    { key: 'ilt', label: 'Estado ILT/Baja' }
                ]
            }
        ];

        // "Skills" or "Attributes" - The long dynamic list
        const skillFields = [
            'asignacion', 'boEquipaje', 'boPasaje', 'vip', 'redes', 'rpm', 'infinita', 'owAjb',
            'atencionPersonal', 'pmr', 'tasasChile', 'futurosVuelos', 'yq', 'reembolsosParcial',
            'reembolsoTotal', 'bonos', 'incidenciaPagos', 'servGastronomicos', 'gerencia', 'sysInformes',
            'anac', 'ebonos', 'macros', 'busqueda', 'livechat', 'incivia', 'instrucciones',
            'trainEstandar', 'abogados', 'demandas', 'aesa', 'omics', 'pagosEsp', 'asignacionIdioma',
            'tramitacionIdioma', 'sudamericaAsign', 'sudamericaTram', 'reembolsosJuridico',
            'aviacionCivil', 'adr', 'normativaDot', 'trainJuridico', 'tec', 'contar', 'peticion', 'vb'
        ];

        // Filter Groups
        const renderedGroups = groups.map(group => {
            const validFields = group.fields.map(f => ({ ...f, val: formatVal(adminData[f.key]) })).filter(f => f.val);
            if (validFields.length === 0) return '';

            return `
                <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div class="flex items-center gap-2 pb-2 border-b border-slate-50">
                        <div class="p-2 bg-slate-50 text-slate-400 rounded-lg">
                            <i data-lucide="${group.icon}" class="w-4 h-4"></i>
                        </div>
                        <h4 class="text-xs font-black text-slate-400 uppercase tracking-widest">${group.title}</h4>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                        ${validFields.map(field => `
                            <div>
                                <p class="text-[9px] font-bold text-slate-300 uppercase tracking-wider mb-0.5">${field.label}</p>
                                <p class="text-sm font-bold text-slate-700 break-words">${field.val}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');

        // Render Skills Section
        const validSkills = skillFields.map(key => ({ key, val: formatVal(adminData[key]) })).filter(f => f.val);
        let skillsSection = '';

        if (validSkills.length > 0) {
            skillsSection = `
                <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-3 duration-500 col-span-full max-w-full overflow-hidden">
                    <div class="flex items-center gap-2 pb-2 border-b border-slate-50">
                        <div class="p-2 bg-indigo-50 text-indigo-400 rounded-lg">
                            <i data-lucide="layers" class="w-4 h-4"></i>
                        </div>
                        <h4 class="text-xs font-black text-slate-400 uppercase tracking-widest">Habilidades y Asignaciones</h4>
                    </div>
                    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        ${validSkills.map(s => `
                            <div class="p-3 bg-slate-50 border border-slate-100 rounded-lg flex flex-col transition-colors hover:bg-slate-100 hover:border-slate-200">
                                <span class="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1 leading-none truncate" title="${s.key.replace(/([A-Z])/g, ' $1').trim()}">${s.key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                <span class="text-xs font-bold text-slate-700 truncate" title="${s.val}">${s.val}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // Training Group
        const trainingGroup = {
            title: 'Control y Formación',
            icon: 'book-open',
            fields: [
                { key: 'instrucciones', label: 'Instrucciones' },
                { key: 'trainEstandar', label: 'Train Estándar' },
                { key: 'trainJuridico', label: 'Train Jurídico' },
                { key: 'normativaDot', label: 'Normativa DOT' },
                { key: 'aviacionCivil', label: 'Aviación Civil' }
            ]
        };

        // Render Training Section
        const validTraining = trainingGroup.fields.map(f => ({ ...f, val: formatVal(adminData[f.key]) })).filter(f => f.val);
        let trainingSection = '';
        if (validTraining.length > 0) {
            trainingSection = `
                <div class="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 shadow-sm flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div class="flex items-center gap-2 pb-2 border-b border-indigo-100/50">
                        <div class="p-2 bg-indigo-100 text-indigo-500 rounded-lg">
                            <i data-lucide="${trainingGroup.icon}" class="w-4 h-4"></i>
                        </div>
                        <h4 class="text-xs font-black text-indigo-400 uppercase tracking-widest">${trainingGroup.title}</h4>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                        ${validTraining.map(field => `
                            <div>
                                <p class="text-[9px] font-bold text-indigo-300 uppercase tracking-wider mb-0.5">${field.label}</p>
                                <p class="text-sm font-bold text-slate-700 break-words">${field.val}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // Sensitive Data Section (Expander)
        const sensitiveFields = [
            { key: 'dni', label: 'DNI' },
            { key: 'tlf', label: 'Teléfono' },
            { key: 'idEmpl', label: 'ID Empleado' } // Included here as usually sensitive/internal
        ];

        const validSensitive = sensitiveFields.map(f => ({ ...f, val: formatVal(adminData[f.key]) })).filter(f => f.val);
        let sensitiveSection = '';

        if (validSensitive.length > 0) {
            sensitiveSection = `
                <div class="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <details class="group bg-red-50/50 p-2 rounded-2xl border border-red-100 open:p-6 transition-all duration-300">
                        <summary class="list-none flex items-center justify-between cursor-pointer w-full text-left">
                            <div class="flex items-center gap-2">
                                <div class="p-2 bg-red-100 text-red-500 rounded-lg group-open:bg-red-200 transition-colors">
                                    <i data-lucide="lock" class="w-4 h-4"></i>
                                </div>
                                <h4 class="text-xs font-black text-red-400 uppercase tracking-widest">Datos Sensibles</h4>
                            </div>
                            <div class="p-1 px-2 text-[10px] font-bold text-red-300 bg-red-100/50 rounded-full group-open:hidden">
                                EXPANDIR
                            </div>
                            <div class="p-1 px-2 text-[10px] font-bold text-red-300 bg-red-100/50 rounded-full hidden group-open:block">
                                CONTRAER
                            </div>
                        </summary>
                        <div class="grid grid-cols-1 gap-y-4 mt-6 border-t border-red-100/50 pt-4">
                            ${validSensitive.map(field => `
                                <div>
                                    <p class="text-[9px] font-bold text-red-300 uppercase tracking-wider mb-0.5">${field.label}</p>
                                    <p class="text-sm font-bold text-slate-700 font-mono tracking-tight">${field.val}</p>
                                </div>
                            `).join('')}
                        </div>
                    </details>
                </div>
            `;
        }


        // Daily Control (Dates)
        let controlSection = '';
        const dailyControl = adminData.dailyControl || {};
        const dailyKeys = Object.keys(dailyControl).sort();

        if (dailyKeys.length > 0) {
            controlSection = `
                <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-3 duration-500 col-span-full">
                    <div class="flex items-center gap-2 pb-2 border-b border-slate-50">
                        <div class="p-2 bg-slate-50 text-slate-400 rounded-lg">
                            <i data-lucide="calendar" class="w-4 h-4"></i>
                        </div>
                        <h4 class="text-xs font-black text-slate-400 uppercase tracking-widest">Control Diario y Asistencia</h4>
                    </div>
                    <div class="flex flex-wrap gap-2">
                        ${dailyKeys.map(dateKey => {
                // Format YYYYMMDD -> DD/MM
                const day = dateKey.slice(6, 8);
                const month = dateKey.slice(4, 6);
                const val = dailyControl[dateKey];

                // Color coding for values (Optional)
                let bgClass = 'bg-slate-50 border-slate-100';
                if (val === 'L' || val === 'LIBRE') bgClass = 'bg-green-50 border-green-100 text-green-700';
                if (val === 'B' || val === 'BAJA') bgClass = 'bg-red-50 border-red-100 text-red-700';

                return `
                            <div class="flex flex-col items-center p-2 rounded-lg border ${bgClass} min-w-[3.5rem]">
                                <span class="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">${day}/${month}</span>
                                <span class="text-xs font-bold text-slate-700">${val || '-'}</span>
                            </div>
                            `;
            }).join('')}
                    </div>
                </div>
             `;
        }

        return `
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
                ${renderedGroups}
                ${skillsSection}
                ${trainingSection}
                ${sensitiveSection}
                ${controlSection}
            </div>
        `;
    }
};
