
import { createIcons, icons } from 'lucide';

export class WelcomeScreen {
    constructor(onAction) {
        this.onAction = onAction; // Callback para acciones como 'import' o 'demo'
    }

    render() {
        const container = document.createElement('div');
        container.className = 'flex-1 h-full flex flex-col items-center justify-center p-6 bg-slate-50 relative overflow-hidden';

        // Círculos de fondo decorativos (Aesthetitcs Pro)
        container.innerHTML = `
            <div class="absolute -top-24 -left-24 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-50"></div>
            <div class="absolute -bottom-24 -right-24 w-[30rem] h-[30rem] bg-slate-200 rounded-full blur-3xl opacity-30"></div>
            
            <div class="max-w-4xl w-full z-10 animate-fade-in">
                <!-- Header -->
                <div class="text-center mb-16">
                    <div class="inline-flex p-3 bg-white rounded-2xl shadow-sm border border-slate-100 mb-6 animate-bounce-subtle">
                        <i data-lucide="bar-chart-3" class="w-10 h-10 text-indigo-600"></i>
                    </div>
                    <h1 class="text-5xl font-black text-slate-900 tracking-tight mb-4">
                        Bienvenido a <span class="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">KPI Analyzer V2</span>
                    </h1>
                    <p class="text-xl text-slate-500 font-medium max-w-2xl mx-auto">
                        La plataforma definitiva para el análisis de rendimiento y gestión de KPIs tácticos de forma 100% offline.
                    </p>
                </div>

                <!-- Steps / Guide -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                    <div class="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-white shadow-sm hover:shadow-md transition-all group">
                        <div class="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <i data-lucide="folder-search" class="w-6 h-6"></i>
                        </div>
                        <h3 class="font-bold text-slate-800 mb-2">1. Carga de Datos</h3>
                        <p class="text-sm text-slate-500 leading-relaxed">Selecciona tu carpeta de reportes o arrastra los archivos Excel directamente.</p>
                    </div>

                    <div class="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-white shadow-sm hover:shadow-md transition-all group">
                        <div class="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <i data-lucide="cpu" class="w-6 h-6"></i>
                        </div>
                        <h3 class="font-bold text-slate-800 mb-2">2. Procesamiento</h3>
                        <p class="text-sm text-slate-500 leading-relaxed">Nuestra IA local normaliza, limpia y unifica todos los periodos automáticamente.</p>
                    </div>

                    <div class="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-white shadow-sm hover:shadow-md transition-all group">
                        <div class="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <i data-lucide="layout-dashboard" class="w-6 h-6"></i>
                        </div>
                        <h3 class="font-bold text-slate-800 mb-2">3. Visualización</h3>
                        <p class="text-sm text-slate-500 leading-relaxed">Explora dashboards interactivos, perfiles de agentes y genera reportes PDF.</p>
                    </div>
                </div>

                <!-- Call to Actions -->
                <div class="flex flex-col sm:flex-row items-center justify-center gap-6">
                    <button id="btnImportWelcome" class="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg shadow-xl shadow-slate-200 hover:bg-indigo-700 transition-all hover:-translate-y-1">
                        <i data-lucide="upload" class="w-6 h-6"></i>
                        Comenzar Importación
                    </button>
                    
                    <button id="btnDemoWelcome" class="flex items-center gap-3 px-8 py-4 bg-white text-slate-700 border-2 border-slate-100 rounded-2xl font-bold text-lg hover:border-indigo-200 hover:text-indigo-600 transition-all">
                        <i data-lucide="play-circle" class="w-6 h-6"></i>
                        Explorar con Demo
                    </button>
                </div>
                
                <p class="text-center mt-12 text-slate-400 text-sm flex items-center justify-center gap-2">
                    <i data-lucide="shield-check" class="w-4 h-4"></i> Tus datos nunca salen de esta PC. Procesamiento 100% privado.
                </p>
            </div>
        `;

        // Event Listeners
        container.querySelector('#btnImportWelcome').addEventListener('click', () => {
            // Priorizamos la carga de carpeta según el requerimiento del usuario
            document.querySelector('button[data-action="import-folder"]')?.click();
        });

        container.querySelector('#btnDemoWelcome').addEventListener('click', () => {
            window.dispatchEvent(new CustomEvent('load-demo'));
        });

        // Initialize icons
        setTimeout(() => createIcons({ icons, nameAttr: 'data-lucide' }), 0);

        return container;
    }
}
