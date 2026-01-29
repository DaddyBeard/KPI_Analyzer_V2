
import { DataNormalizer } from './DataNormalizer.js';

export class DataMerger {
    /**
     * Merges data from multiple sheets into a single list of agents.
     * Uses a multi-pass strategy to ensure agents are merged even if IDs are inconsistent across files.
     * @param {Object} sheets - { Sheet1: [], Sheet2: [] }
     * @returns {Array} - Consolidated Agent List
     */
    static merge(sheets) {
        const agents = [];

        // 1. Flatten all rows from all sheets first
        let allRows = [];
        Object.entries(sheets).forEach(([sheetSource, rawRows]) => {
            const normalized = DataNormalizer.normalize(rawRows);
            // Tag source for debugging and history tracking
            normalized.forEach(r => {
                r._source = sheetSource;
                r._period = this.extractPeriod(sheetSource);
            });
            allRows = allRows.concat(normalized);
        });

        if (allRows.length === 0) return [];

        // 2. Primary Merge Map (Key: Normalized ID or fallback to Name)
        // We use a "Cluster" approach.
        // A cluster represents one real person.
        const clusters = [];

        // Helper: Find existing cluster for a row
        const findCluster = (row) => {
            const rowId = row.id ? String(row.id).trim().toUpperCase() : null;
            const rowName = row.agent && row.agent !== 'Desconocido' ? String(row.agent).trim().toUpperCase() : null;

            // Search by ID first (Strongest match)
            if (rowId) {
                const byId = clusters.find(c => c.ids.has(rowId));
                if (byId) return byId;
            }

            // Search by Name (Secondary match)
            if (rowName) {
                const byName = clusters.find(c => c.names.has(rowName));
                if (byName) return byName;
            }

            return null;
        };

        allRows.forEach(row => {
            // Ignore incomplete rows
            if (!row.id && (row.agent === 'Desconocido' || !row.agent)) return;

            let cluster = findCluster(row);

            if (!cluster) {
                // Create new cluster
                cluster = {
                    ids: new Set(),
                    names: new Set(),
                    data: { ...row, history: [] }
                };

                // Initialize history with the first row if it has KPIs
                if (row.kpis) {
                    cluster.data.history.push({
                        period: row._period,
                        source: row._source,
                        kpis: { ...row.kpis }
                    });
                }

                clusters.push(cluster);
            } else {
                // Merge into existing cluster
                cluster.data = this.deepMerge(cluster.data, row);

                // Update History Logic:
                // Check if we already have an entry for this period (regardless of source/sheet)
                // This ensures that multi-sheet data (Data + Quality) merges into a single history record.
                if (row.kpis) {
                    const existingHistory = cluster.data.history.find(h => h.period === row._period);

                    if (existingHistory) {
                        console.log(`[DataMerger] Merging data into existing history for ${cluster.data.agent} (${row._period})`);
                        // FIX: Merge new KPIs into the existing history entry
                        // This ensures that if File A has GEST and File A (Row 2) has NCO, both are kept.

                        // ALSO FIX SOURCE LABEL: If this new row comes from a KPI file, it takes precedence over Control files
                        const newSource = row._source || '';
                        if (newSource.toUpperCase().includes('KPI') || newSource.toUpperCase().includes('RESULT')) {
                            existingHistory.source = newSource;
                        }

                        Object.keys(row.kpis).forEach(key => {
                            const val = row.kpis[key];
                            if (val !== null && val !== undefined && val !== '') {
                                existingHistory.kpis[key] = val;
                            }
                        });
                    } else {
                        console.log(`[DataMerger] Creating NEW history entry for ${cluster.data.agent} (${row._period})`);
                        // New entry
                        cluster.data.history.push({
                            period: row._period,
                            source: row._source,
                            kpis: { ...row.kpis }
                        });

                        // Sort history by date if possible
                        cluster.data.history.sort((a, b) => {
                            if (!a.period || !b.period) return 0;
                            return a.period.localeCompare(b.period);
                        });
                    }
                }
            }

            // Register identifiers
            if (row.id) cluster.ids.add(String(row.id).trim().toUpperCase());
            if (row.agent && row.agent !== 'Desconocido') cluster.names.add(String(row.agent).trim().toUpperCase());
        });

        // 3. Convert clusters back to flat Agent objects
        return clusters.map(c => c.data);
    }

    static extractPeriod(sourceName) {
        // Try to find something like "Enero", "Feb", "2024-01", etc.
        const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        const lower = sourceName.toLowerCase();

        let foundMonth = months.find(m => lower.includes(m));
        let yearMatch = lower.match(/20\d{2}/);

        if (foundMonth) {
            const monthIdx = months.indexOf(foundMonth) + 1;
            const year = yearMatch ? yearMatch[0] : new Date().getFullYear();
            return `${year}-${String(monthIdx).padStart(2, '0')}`;
        }

        // Manual mapping for known edge cases (W52, DIC, DEC)
        // Manual mapping for known edge cases (W52, DIC, DEC)
        const upper = sourceName.toUpperCase();
        if (upper.includes('W52') || upper.includes('DIC') || upper.includes('DEC') || upper.includes('DICIEMBRE')) {
            // Attempt to find year, default to 2025 if not found (or current context)
            // Ideally we grab year from filename, but W52 is usually end of year.
            const year = yearMatch ? yearMatch[0] : '2025';
            return `${year}-12`;
        }

        // Return filename if no date found, to at least keep them separate
        return sourceName.split('::')[0] || sourceName;
    }

    static deepMerge(target, source) {
        // Merge KPIs: Source overrides Target IF it's more recent or Target field is empty
        const targetPeriod = target._period || '';
        const sourcePeriod = source._period || '';

        const mergedKPIs = { ...target.kpis };
        Object.keys(source.kpis || {}).forEach(k => {
            const val = source.kpis[k];
            if (val !== null && val !== undefined) {
                // Determine if we should override based on period
                const targetVal = mergedKPIs[k];
                const isTargetEmpty = targetVal === null || targetVal === undefined;

                if (isTargetEmpty || sourcePeriod >= targetPeriod) {
                    mergedKPIs[k] = val;
                }
            }
        });

        // Merge Admin Data: Favor non-empty values
        const mergedAdmin = { ...target.admin };
        Object.keys(source.admin || {}).forEach(k => {
            const val = source.admin[k];
            if (val !== null && val !== undefined && val !== '') {
                const isTargetEmpty = !mergedAdmin[k] || mergedAdmin[k] === '-';
                if (isTargetEmpty || sourcePeriod >= targetPeriod) {
                    mergedAdmin[k] = val;
                }
            }
        });

        // Determine "Best" Name (longest usually has surnames)
        const name1 = target.agent || '';
        const name2 = source.agent || '';
        const bestName = (name2.length >= name1.length && name2 !== 'Desconocido') ? name2 : name1;

        const bestId = source.id || target.id;
        const bestSupervisor = (source.supervisor && source.supervisor !== 'Sin Asignar') ? source.supervisor : target.supervisor;

        const isNewer = sourcePeriod > targetPeriod; // Strict newer

        // Determine best source label: Prefer one that looks like a KPI file
        let bestSource = target._source;
        if (isNewer) {
            bestSource = source._source;
        } else if (sourcePeriod === targetPeriod) {
            // If same period, prefer the one with "KPI" or "RESULT" in name
            const sName = (source._source || '').toUpperCase();
            const tName = (target._source || '').toUpperCase();

            if (sName.includes('KPI') && !tName.includes('KPI')) bestSource = source._source;
            else if (sName.includes('RESULT') && !tName.includes('RESULT')) bestSource = source._source;
            // Otherwise keep existing (target) or default update if target was generic
        }

        return {
            ...target,
            _period: sourcePeriod >= targetPeriod ? sourcePeriod : targetPeriod,
            _source: bestSource || target._source, // Track source of truth
            agent: bestName,
            id: bestId,
            supervisor: bestSupervisor || 'Sin Asignar',
            kpis: mergedKPIs,
            metrics: mergedKPIs,
            admin: mergedAdmin,
            history: target.history || []
        };
    }

}
