
/**
 * Servicio de persistencia basado en IndexedDB para manejar datasets grandes de forma offline.
 */
class StorageService {
    constructor() {
        this.dbName = 'KPIAnalyzerDB';
        this.version = 1;
        this.storeName = 'AppState';
        this.db = null;
    }

    /**
     * Inicializa la conexión con IndexedDB
     */
    async init() {
        if (this.db) return this.db;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName);
                }
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onerror = (event) => {
                console.error('Error abriendo IndexedDB:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    /**
     * Guarda los datos en IndexedDB
     * @param {Array} data - El dataset consolidado
     */
    async saveData(data) {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.put(data, 'kpi_data');

            request.onsuccess = () => resolve(true);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    /**
     * Carga los datos desde IndexedDB
     */
    async loadData() {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get('kpi_data');

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    /**
     * Limpia todos los datos de la base de datos
     */
    async clearData() {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.clear();

            request.onsuccess = () => resolve(true);
            request.onerror = (event) => reject(event.target.error);
        });
    }
}

export const storageService = new StorageService();
