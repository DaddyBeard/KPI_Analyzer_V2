
import { createIcons, icons } from 'lucide';

export class FileSelectionModal {
    constructor() {
        this.element = null;
        this.files = [];
        this.selectedFiles = new Set();
    }

    open(fileList) {
        this.files = fileList.filter(f => f.name.match(/\.(xlsx|xls)$/i));
        // Auto-select all by default
        this.selectedFiles = new Set(this.files);

        this.render();
        requestAnimationFrame(() => {
            this.element.style.opacity = '1';
            this.element.querySelector('.modal-content').style.transform = 'scale(1)';
        });
    }

    close() {
        if (!this.element) return;
        this.element.style.opacity = '0';
        setTimeout(() => {
            if (this.element) this.element.remove();
            this.element = null;
        }, 300);
    }

    render() {
        if (document.getElementById('fileSelectionModal')) document.getElementById('fileSelectionModal').remove();

        this.element = document.createElement('div');
        this.element.id = 'fileSelectionModal';
        this.element.className = 'fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center opacity-0 transition-opacity duration-300';

        // Group Files
        const kpiFiles = this.files.filter(f => f.name.toUpperCase().includes('KPI'));
        const adminFiles = this.files.filter(f => f.name.toUpperCase().includes('CONTROL') || f.name.toUpperCase().includes('BBDD') || f.name.toUpperCase().includes('FORMACION'));
        const otherFiles = this.files.filter(f => !kpiFiles.includes(f) && !adminFiles.includes(f));

        this.element.innerHTML = `
      <div class="modal-content bg-white w-full max-w-2xl rounded-xl shadow-2xl p-6 transform scale-95 transition-transform duration-300 flex flex-col max-h-[85vh]">
        <header class="flex justify-between items-center mb-6">
            <div>
                <h2 class="text-xl font-bold text-slate-800">Archivos Encontrados</h2>
                <p class="text-slate-500 text-sm">Selecciona los archivos a procesar</p>
            </div>
            <button id="closeFileModal" class="p-2 hover:bg-slate-100 rounded-full text-slate-400"><i data-lucide="x" class="w-5 h-5"></i></button>
        </header>
        
        <div class="flex-1 overflow-y-auto space-y-6 pr-2">
            ${this.renderSection('KPIs Operativos', kpiFiles, 'bar-chart-2', 'bg-blue-50 text-blue-600')}
            ${this.renderSection('Datos Administrativos (RRHH)', adminFiles, 'users', 'bg-purple-50 text-purple-600')}
            ${this.renderSection('Otros Archivos', otherFiles, 'file', 'bg-slate-100 text-slate-500')}
        </div>

        <footer class="mt-6 pt-6 border-t border-slate-100 flex justify-end gap-3">
            <button id="cancelFileBtn" class="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg font-medium transition-colors">Cancelar</button>
            <button id="processFilesBtn" class="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium shadow-lg transition-all flex items-center gap-2">
                <i data-lucide="play" class="w-4 h-4"></i> Procesar Selección
            </button>
        </footer>
      </div>
    `;

        document.body.appendChild(this.element);
        createIcons({ icons, nameAttr: 'data-lucide' });
        this.attachEvents();
    }

    renderSection(title, files, icon, colorClass) {
        if (files.length === 0) return '';
        return `
        <div>
            <h3 class="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2 uppercase tracking-wide">
                <span class="p-1.5 rounded ${colorClass}"><i data-lucide="${icon}" class="w-3 h-3"></i></span>
                ${title}
            </h3>
            <div class="space-y-2">
                ${files.map(f => `
                    <label class="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group">
                        <input type="checkbox" class="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary file-checkbox" checked data-name="${f.name}">
                        <div class="flex-1">
                            <p class="text-sm font-medium text-slate-700 group-hover:text-slate-900">${f.name}</p>
                            <p class="text-xs text-slate-400">${(f.size / 1024).toFixed(0)} KB</p>
                        </div>
                    </label>
                `).join('')}
            </div>
        </div>
    `;
    }

    attachEvents() {
        this.element.querySelector('#closeFileModal').addEventListener('click', () => this.close());
        this.element.querySelector('#cancelFileBtn').addEventListener('click', () => this.close());

        this.element.querySelectorAll('.file-checkbox').forEach(cb => {
            cb.addEventListener('change', (e) => {
                const fileName = e.target.getAttribute('data-name');
                const file = this.files.find(f => f.name === fileName);
                if (e.target.checked) this.selectedFiles.add(file);
                else this.selectedFiles.delete(file);
            });
        });

        this.element.querySelector('#processFilesBtn').addEventListener('click', () => {
            const finalFiles = Array.from(this.selectedFiles);
            if (finalFiles.length === 0) return alert('Selecciona al menos un archivo.');

            window.dispatchEvent(new CustomEvent('process-files', { detail: { files: finalFiles } }));
            this.close();
        });
    }
}
