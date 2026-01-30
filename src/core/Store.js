
import { storageService } from './StorageService.js';

class Store extends EventTarget {
    constructor() {
        super();
        this.state = {
            kpiData: [],
            filters: {
                tm: 'all',
                segment: 'all'
            },
            lastUpdated: null
        };
        this.isLoaded = false;
    }

    /**
     * Inicializa el Store cargando datos desde la persistencia
     */
    async init() {
        try {
            const savedData = await storageService.loadData();
            if (savedData && savedData.length > 0) {
                this.state.kpiData = savedData;
                this.state.lastUpdated = new Date();
            }
        } catch (error) {
            console.error('Error cargando persistencia:', error);
        } finally {
            this.isLoaded = true;
            this.emit('store-ready');
        }
    }

    /**
     * Updates the global data set
     * @param {Array} data - Parsed Excel data
     */
    async setData(data) {
        this.state.kpiData = data;
        this.state.lastUpdated = new Date();
        this.emit('data-updated');

        // Persistencia asíncrona en segundo plano
        try {
            await storageService.saveData(data);
        } catch (error) {
            console.error('Error guardando en IndexedDB:', error);
        }
    }

    /**
     * Limpia el estado y la persistencia
     */
    async clear() {
        this.state.kpiData = [];
        this.state.lastUpdated = new Date();
        this.emit('data-updated');
        await storageService.clearData();
    }


    /**
     * Returns current data, filtered by active filters
     */
    getData() {
        let data = this.state.kpiData;
        const { tm, segment } = this.state.filters;

        if (tm !== 'all') {
            data = data.filter(d => d.supervisor === tm);
        }

        if (segment !== 'all') {
            data = data.filter(d => {
                // Check normalized field first
                const seg = (d.admin && d.admin.segment) || d.segmento || d.segment || (d.raw && (d.raw.SEGMENTO || d.raw.segmento));
                return String(seg).trim() === segment;
            });
        }

        return data;
    }

    /**
     * Returns the full unfiltered dataset (useful for selectors)
     */
    getAllData() {
        return this.state.kpiData;
    }

    /**
     * Updates a filter value
     */
    setFilter(key, value) {
        this.state.filters[key] = value;
        this.emit('filter-updated');
    }

    /**
     * Helper to emit custom events
     */
    emit(eventName, detail = {}) {
        this.dispatchEvent(new CustomEvent(eventName, { detail }));
    }
}

export const store = new Store();
