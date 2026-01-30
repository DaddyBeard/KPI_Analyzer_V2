/**
 * Modal de Selección de Formato de Exportación Excel
 * 
 * Permite al usuario elegir entre los diferentes formatos disponibles
 * antes de exportar los datos a Excel.
 */

import { ExcelExportService } from './ExcelExportService.js';

export class ExportOptionsModal {

    static show(data, kpiConfig) {
        // Crear overlay
        const overlay = document.createElement('div');
        overlay.id = 'excel-export-modal-overlay';
        overlay.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center';

        // Crear modal
        overlay.innerHTML = `
      <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 animate-fade-in">
        <!-- Header -->
        <div class="bg-gradient-to-r from-indigo-600 to-blue-600 p-6 rounded-t-2xl">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <i data-lucide="file-spreadsheet" class="w-6 h-6 text-white"></i>
              </div>
              <div>
                <h2 class="text-2xl font-bold text-white">Exportar a Excel</h2>
                <p class="text-indigo-100 text-sm">Selecciona el formato de exportación</p>
              </div>
            </div>
            <button id="closeExportModal" class="w-10 h-10 hover:bg-white/20 rounded-lg transition-colors flex items-center justify-center">
              <i data-lucide="x" class="w-6 h-6 text-white"></i>
            </button>
          </div>
        </div>

        <!-- Body -->
        <div class="p-6 space-y-4">
          
          <!-- Formato 1: Básico -->
          <button data-format="basic" class="export-format-option w-full text-left p-5 rounded-xl border-2 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all group">
            <div class="flex items-start gap-4">
              <div class="w-12 h-12 bg-slate-100 group-hover:bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors">
                <i data-lucide="file-text" class="w-6 h-6 text-slate-600 group-hover:text-indigo-600"></i>
              </div>
              <div class="flex-1">
                <h3 class="font-bold text-lg text-slate-900 group-hover:text-indigo-700 mb-1">
                  📄 Datos Básicos
                </h3>
                <p class="text-slate-600 text-sm mb-2">
                  Tabla simple sin formato especial, optimizada para análisis externo
                </p>
                <div class="flex flex-wrap gap-2">
                  <span class="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-full">CSV-like</span>
                  <span class="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-full">Rápido</span>
                  <span class="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">✓ Power BI</span>
                </div>
              </div>
            </div>
          </button>

          <!-- Formato 2: Profesional -->
          <button data-format="professional" class="export-format-option w-full text-left p-5 rounded-xl border-2 border-indigo-300 bg-indigo-50 hover:border-indigo-500 hover:bg-indigo-100 transition-all group">
            <div class="flex items-start gap-4">
              <div class="w-12 h-12 bg-indigo-200 group-hover:bg-indigo-300 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors">
                <i data-lucide="palette" class="w-6 h-6 text-indigo-700"></i>
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <h3 class="font-bold text-lg text-slate-900 group-hover:text-indigo-700">
                    🎨 Formato Profesional
                  </h3>
                  <span class="text-xs px-2 py-1 bg-yellow-400 text-yellow-900 rounded-full font-semibold">⭐ Recomendado</span>
                </div>
                <p class="text-slate-600 text-sm mb-2">
                  Colores, bordes y estilos profesionales con formato condicional por KPI
                </p>
                <div class="flex flex-wrap gap-2">
                  <span class="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">Colores por estado</span>
                  <span class="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">Filtros automáticos</span>
                  <span class="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">Presentaciones</span>
                </div>
              </div>
            </div>
          </button>

          <!-- Formato 3: Dashboard -->
          <button data-format="dashboard" class="export-format-option w-full text-left p-5 rounded-xl border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all group">
            <div class="flex items-start gap-4">
              <div class="w-12 h-12 bg-slate-100 group-hover:bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors">
                <i data-lucide="bar-chart-3" class="w-6 h-6 text-slate-600 group-hover:text-blue-600"></i>
              </div>
              <div class="flex-1">
                <h3 class="font-bold text-lg text-slate-900 group-hover:text-blue-700 mb-1">
                  📊 Dashboard Completo
                </h3>
                <p class="text-slate-600 text-sm mb-2">
                  Múltiples hojas con análisis ejecutivo, fórmulas dinámicas y resumen de KPIs
                </p>
                <div class="flex flex-wrap gap-2">
                  <span class="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">4 hojas</span>
                  <span class="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">Fórmulas Excel</span>
                  <span class="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full">Top performers</span>
                  <span class="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">Alertas</span>
                </div>
              </div>
            </div>
          </button>

        </div>

        <!-- Footer -->
        <div class="bg-slate-50 p-6 rounded-b-2xl border-t border-slate-200 flex justify-between items-center">
          <p class="text-sm text-slate-500">
            <i data-lucide="info" class="inline w-4 h-4"></i>
            Total de agentes: <strong>${data.length}</strong>
          </p>
          <button id="cancelExportModal" class="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors font-medium">
            Cancelar
          </button>
        </div>
      </div>
    `;

        document.body.appendChild(overlay);

        // Inicializar iconos de Lucide
        if (window.lucide) {
            window.lucide.createIcons();
        }

        // Event listeners
        this.attachEventListeners(overlay, data, kpiConfig);
    }

    static attachEventListeners(overlay, data, kpiConfig) {
        // Cerrar modal
        const closeButtons = overlay.querySelectorAll('#closeExportModal, #cancelExportModal');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.close();
            });
        });

        // Click fuera del modal
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.close();
            }
        });

        // Selección de formato y exportación
        const formatButtons = overlay.querySelectorAll('.export-format-option');
        formatButtons.forEach(btn => {
            btn.addEventListener('click', async () => {
                const format = btn.dataset.format;

                // Mostrar loading
                btn.disabled = true;
                btn.style.opacity = '0.6';
                btn.innerHTML = '<div class="flex items-center justify-center gap-2"><div class="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div><span>Generando Excel...</span></div>';

                try {
                    let result;

                    switch (format) {
                        case 'basic':
                            result = await ExcelExportService.exportBasic(data);
                            break;
                        case 'professional':
                            result = await ExcelExportService.exportProfessional(data, kpiConfig);
                            break;
                        case 'dashboard':
                            result = await ExcelExportService.exportDashboard(data, kpiConfig);
                            break;
                    }

                    if (result.success) {
                        // Mostrar confirmación
                        this.showSuccess(format);
                        setTimeout(() => this.close(), 1500);
                    } else {
                        alert(`Error al exportar: ${result.error}`);
                        btn.disabled = false;
                        btn.style.opacity = '1';
                    }
                } catch (error) {
                    console.error('Error en exportación:', error);
                    alert('Error al generar el archivo Excel');
                    btn.disabled = false;
                    btn.style.opacity = '1';
                }
            });
        });
    }

    static showSuccess(format) {
        const formatNames = {
            basic: 'Datos Básicos',
            professional: 'Formato Profesional',
            dashboard: 'Dashboard Completo'
        };

        const overlay = document.getElementById('excel-export-modal-overlay');
        if (overlay) {
            overlay.innerHTML = `
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 text-center animate-fade-in">
          <div class="w-16 h-16 bg-green-100 rounded-full mx-auto flex items-center justify-center mb-4">
            <i data-lucide="check-circle" class="w-10 h-10 text-green-600"></i>
          </div>
          <h3 class="text-xl font-bold text-slate-900 mb-2">
            ¡Exportación Exitosa!
          </h3>
          <p class="text-slate-600">
            Se ha descargado el archivo con formato:<br>
            <strong>${formatNames[format]}</strong>
          </p>
        </div>
      `;

            if (window.lucide) {
                window.lucide.createIcons();
            }
        }
    }

    static close() {
        const overlay = document.getElementById('excel-export-modal-overlay');
        if (overlay) {
            overlay.remove();
        }
    }
}
