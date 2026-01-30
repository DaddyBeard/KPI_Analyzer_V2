import { KPI_CONFIG } from '../../../config/kpi.config.js';

/**
 * KPIContext - Singleton for managing KPI Configuration state.
 * Handles persistence to localStorage and merging with defaults.
 */
class KPIContext {
    constructor() {
        this.STORAGE_KEY = 'kpi_config_v2';
        this.listeners = [];
        this.state = this.loadState();
    }

    /**
     * Loads state from localStorage or initializes with defaults.
     * Ensures all KPIs have an 'importance' field (default: 3).
     */
    loadState() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                // Merge saved logic with current code config to ensure we have all keys
                // This handles cases where we add new KPIs in code but user has old config saved
                return this.mergeWithDefaults(parsed);
            }
        } catch (e) {
            console.error('Failed to load KPI config', e);
        }
        return this.normalizeDefaults(KPI_CONFIG);
    }

    /**
     * Adds default fields (like importance) to the static config
     */
    normalizeDefaults(config) {
        return config.map(kpi => ({
            ...kpi,
            importance: kpi.importance || 3,
            warningThreshold: kpi.warningThreshold !== undefined ? kpi.warningThreshold : 0.15
        }));
    }

    /**
     * Merges saved config with current default config structure.
     * Preserves user values for known keys, adds new keys from default.
     */
    mergeWithDefaults(savedConfig) {
        const defaults = this.normalizeDefaults(KPI_CONFIG);

        return defaults.map(def => {
            const saved = savedConfig.find(s => s.key === def.key);
            if (saved) {
                return {
                    ...def,
                    target: saved.target,
                    importance: saved.importance !== undefined ? saved.importance : 3,
                    warningThreshold: saved.warningThreshold !== undefined ? saved.warningThreshold : 0.15
                    // We typically don't let users change 'type' or 'key' to avoid breaking logic
                };
            }
            return def;
        });
    }

    getKPIs() {
        return this.state;
    }

    /**
     * Updates the configuration and persists it.
     * @param {Array} newConfig - The full new configuration array
     */
    saveKPIs(newConfig) {
        this.state = newConfig;
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
            this.notifyListeners();
            console.log('KPI Config Saved:', this.state);
        } catch (e) {
            console.error('Failed to save KPI config', e);
        }
    }

    resetDefaults() {
        this.state = this.normalizeDefaults(KPI_CONFIG);
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            this.notifyListeners();
        } catch (e) {
            console.error('Failed to reset KPI config', e);
        }
    }

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    notifyListeners() {
        this.listeners.forEach(l => l(this.state));
    }
}

export const kpiContext = new KPIContext();
