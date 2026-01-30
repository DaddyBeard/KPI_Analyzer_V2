/**
 * Formato 5: Exportación Comparativa (Histórico)
 * 
 * Genera un Excel con comparación mes a mes,
 * mostrando la evolución de cada agente usando el historial.
 * Ideal para tracking de progreso y tendencias.
 */

export class ComparativeFormat {

    /**
     * Aplica formato comparativo al workbook
     * @param {ExcelJS.Workbook} workbook - Workbook de ExcelJS
     * @param {Array} data - Datos de agentes con historial
     * @param {Array} kpiConfig - Configuración de KPIs
     */
    static apply(workbook, data, kpiConfig) {
        // Crear hoja de resumen de evolución
        this.createEvolutionSummary(workbook, data, kpiConfig);

        // Crear hoja por cada KPI (todos los KPIs configurados)
        kpiConfig.forEach(kpi => {
            this.createKpiTrendSheet(workbook, data, kpi);
        });

        // Crear hoja de mejores y peores evoluciones
        this.createProgressSheet(workbook, data, kpiConfig);

        return workbook;
    }

    /**
     * Crea hoja resumen de evolución general
     */
    static createEvolutionSummary(workbook, data, kpiConfig) {
        const worksheet = workbook.addWorksheet('Evolución General');

        // Título
        const titleRow = worksheet.addRow(['ANÁLISIS COMPARATIVO - EVOLUCIÓN DE KPIS']);
        titleRow.getCell(1).font = { size: 16, bold: true, color: { argb: 'FF7C3AED' } };
        worksheet.mergeCells('A1:F1');
        titleRow.height = 30;

        // Obtener periodos disponibles
        const periods = this.getAllPeriods(data);

        worksheet.addRow([`Periodos analizados: ${periods.length}`]);
        worksheet.addRow([`Rango: ${periods[0] || 'N/A'} a ${periods[periods.length - 1] || 'N/A'}`]);
        worksheet.addRow([]);

        // Si no hay historial, mostrar mensaje
        if (periods.length <= 1) {
            worksheet.addRow(['⚠️ No hay suficiente historial para comparación.']);
            worksheet.addRow(['Carga múltiples archivos de diferentes periodos para ver la evolución.']);
            return;
        }

        // Encabezados
        const headers = ['KPI', 'Inicio', 'Actual', 'Variación', 'Tendencia'];
        const headerRow = worksheet.addRow(headers);
        headerRow.eachCell(cell => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF7C3AED' }
            };
            cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
            cell.alignment = { horizontal: 'center' };
        });

        // Calcular evolución por KPI
        kpiConfig.forEach((kpi, index) => {
            const evolution = this.calculateKpiEvolution(data, kpi.key, periods);

            const row = worksheet.addRow([
                kpi.label,
                this.formatNumber(evolution.start),
                this.formatNumber(evolution.end),
                this.formatDiff(evolution.diff),
                evolution.trend
            ]);

            // Color alternado
            if (index % 2 === 0) {
                row.eachCell(cell => {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F3FF' } };
                });
            }

            // Color de variación
            const diffCell = row.getCell(4);
            if (evolution.diff !== null && !isNaN(evolution.diff)) {
                const isPositive = kpi.type === 'min' ? evolution.diff > 0 : evolution.diff < 0;
                diffCell.font = {
                    color: { argb: isPositive ? 'FF15803D' : 'FFDC2626' },
                    bold: true
                };
            }

            // Emoji de tendencia
            const trendCell = row.getCell(5);
            trendCell.font = { size: 14 };
            trendCell.alignment = { horizontal: 'center' };
        });

        // Ajuste de columnas
        worksheet.getColumn(1).width = 20;
        worksheet.getColumn(2).width = 12;
        worksheet.getColumn(3).width = 12;
        worksheet.getColumn(4).width = 12;
        worksheet.getColumn(5).width = 12;
    }

    /**
     * Crea hoja de tendencia para un KPI específico
     */
    static createKpiTrendSheet(workbook, data, kpi) {
        const sheetName = kpi.label.substring(0, 28).replace(/[\\/*?:\[\]]/g, '');
        const worksheet = workbook.addWorksheet(sheetName);

        // Título
        const titleRow = worksheet.addRow([`EVOLUCIÓN: ${kpi.label}`]);
        titleRow.getCell(1).font = { size: 14, bold: true, color: { argb: 'FF0F172A' } };
        worksheet.mergeCells('A1:E1');

        worksheet.addRow([`Target: ${kpi.target} (${kpi.type === 'min' ? 'mínimo' : 'máximo'})`]);
        worksheet.addRow([]);

        // Obtener periodos
        const periods = this.getAllPeriods(data);

        // Encabezados: Agente + cada periodo
        const headers = ['Agente', 'TM', ...periods, 'Δ Total', 'Tendencia'];
        const headerRow = worksheet.addRow(headers);
        headerRow.eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF475569' } };
            cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 10 };
            cell.alignment = { horizontal: 'center' };
        });

        // Datos por agente
        data.forEach((agent, index) => {
            const rowData = [
                agent.agent || '-',
                agent.supervisor || '-'
            ];

            // Valores por periodo
            const values = [];
            periods.forEach(period => {
                const value = this.getKpiValueForPeriod(agent, kpi.key, period);
                // Solo agregar valores válidos (no null, no NaN)
                if (value !== null && !isNaN(value)) {
                    rowData.push(value);
                    values.push(value);
                } else {
                    rowData.push('-');
                }
            });

            // Calcular delta total
            let delta = null;
            let trend = '-';
            if (values.length >= 2) {
                const first = values[0];
                const last = values[values.length - 1];
                delta = last - first;
                if (!isNaN(delta)) {
                    trend = delta > 0 ? '📈' : delta < 0 ? '📉' : '➡️';
                } else {
                    delta = null;
                }
            }

            rowData.push(this.formatDiff(delta));
            rowData.push(trend);

            const row = worksheet.addRow(rowData);

            // Formato condicional para cada periodo
            periods.forEach((period, pIdx) => {
                const cell = row.getCell(3 + pIdx);
                const value = this.getKpiValueForPeriod(agent, kpi.key, period);

                if (value !== null && !isNaN(value)) {
                    const meetsTarget = kpi.type === 'min' ? value >= kpi.target : value <= kpi.target;
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: meetsTarget ? 'FFC6F6D5' : 'FFFECACA' }
                    };
                }
            });

            // Color de delta
            if (delta !== null && !isNaN(delta)) {
                const deltaCell = row.getCell(3 + periods.length);
                const isPositive = kpi.type === 'min' ? delta > 0 : delta < 0;
                deltaCell.font = { color: { argb: isPositive ? 'FF15803D' : 'FFDC2626' }, bold: true };
            }

            // Color alternado
            if (index % 2 === 0) {
                row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
                row.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
            }
        });

        // Ajuste de columnas
        worksheet.getColumn(1).width = 25;
        worksheet.getColumn(2).width = 15;
        periods.forEach((_, idx) => {
            worksheet.getColumn(3 + idx).width = 12;
        });
        worksheet.getColumn(3 + periods.length).width = 10;
        worksheet.getColumn(4 + periods.length).width = 10;
    }

    /**
     * Crea hoja de mejores y peores evoluciones
     */
    static createProgressSheet(workbook, data, kpiConfig) {
        const worksheet = workbook.addWorksheet('Top Evolución');

        // Título
        const titleRow = worksheet.addRow(['AGENTES CON MAYOR EVOLUCIÓN']);
        titleRow.getCell(1).font = { size: 16, bold: true, color: { argb: 'FF15803D' } };
        worksheet.mergeCells('A1:D1');
        titleRow.height = 30;

        worksheet.addRow([]);

        // Calcular evolución global por agente
        const agentsWithEvolution = data.map(agent => {
            const evolution = this.calculateAgentEvolution(agent, kpiConfig);
            return {
                ...agent,
                evolution: evolution.score,
                trend: evolution.trend
            };
        }).filter(a => a.evolution !== null && !isNaN(a.evolution));

        // Top 10 mejoras
        worksheet.addRow(['🚀 TOP 10 - MAYOR MEJORA']);
        const headerRow1 = worksheet.addRow(['Posición', 'Agente', 'TM', 'Mejora %', 'Tendencia']);
        headerRow1.eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF15803D' } };
            cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
        });

        const topImprovers = [...agentsWithEvolution]
            .sort((a, b) => b.evolution - a.evolution)
            .slice(0, 10);

        topImprovers.forEach((agent, idx) => {
            const row = worksheet.addRow([
                idx + 1,
                agent.agent || '-',
                agent.supervisor || '-',
                this.formatDiff(agent.evolution),
                agent.trend
            ]);

            if (idx < 3) {
                row.getCell(1).font = { bold: true, size: 12 };
                row.eachCell(cell => {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFECFDF5' } };
                });
            }
        });

        worksheet.addRow([]);
        worksheet.addRow([]);

        // Top 10 empeoramientos
        worksheet.addRow(['⚠️ TOP 10 - MAYOR RETROCESO']);
        const headerRow2 = worksheet.addRow(['Posición', 'Agente', 'TM', 'Retroceso %', 'Tendencia']);
        headerRow2.eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDC2626' } };
            cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
        });

        const topDecliners = [...agentsWithEvolution]
            .filter(a => a.evolution < 0)
            .sort((a, b) => a.evolution - b.evolution)
            .slice(0, 10);

        topDecliners.forEach((agent, idx) => {
            const row = worksheet.addRow([
                idx + 1,
                agent.agent || '-',
                agent.supervisor || '-',
                this.formatNumber(agent.evolution),
                agent.trend
            ]);

            if (idx < 3) {
                row.getCell(1).font = { bold: true, size: 12 };
                row.eachCell(cell => {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF2F2' } };
                });
            }
        });

        // Ajuste de columnas
        worksheet.getColumn(1).width = 10;
        worksheet.getColumn(2).width = 25;
        worksheet.getColumn(3).width = 15;
        worksheet.getColumn(4).width = 12;
        worksheet.getColumn(5).width = 12;
    }

    // ===== HELPERS =====

    /**
     * Formatea un número, devuelve '-' si es null, undefined o NaN
     */
    static formatNumber(value) {
        if (value === null || value === undefined || isNaN(value)) {
            return '-';
        }
        return parseFloat(value).toFixed(1);
    }

    /**
     * Formatea una diferencia con signo, devuelve '-' si es null, undefined o NaN
     */
    static formatDiff(value) {
        if (value === null || value === undefined || isNaN(value)) {
            return '-';
        }
        const num = parseFloat(value);
        if (isNaN(num)) return '-';
        return num > 0 ? `+${num.toFixed(1)}` : num.toFixed(1);
    }

    static getAllPeriods(data) {
        const periodsSet = new Set();

        data.forEach(agent => {
            if (agent.history && Array.isArray(agent.history)) {
                agent.history.forEach(h => {
                    if (h.period) periodsSet.add(h.period);
                });
            }
            if (agent._period) {
                periodsSet.add(agent._period);
            }
        });

        return Array.from(periodsSet).sort();
    }

    static getKpiValueForPeriod(agent, kpiKey, period) {
        // Buscar en historial
        if (agent.history && Array.isArray(agent.history)) {
            const historyEntry = agent.history.find(h => h.period === period);
            if (historyEntry && historyEntry.kpis && historyEntry.kpis[kpiKey] !== undefined) {
                const val = parseFloat(historyEntry.kpis[kpiKey]);
                return isNaN(val) ? null : val;
            }
        }

        // Si es el periodo actual, buscar en kpis
        if (agent._period === period && agent.kpis && agent.kpis[kpiKey] !== undefined) {
            const val = parseFloat(agent.kpis[kpiKey]);
            return isNaN(val) ? null : val;
        }

        return null;
    }

    static calculateKpiEvolution(data, kpiKey, periods) {
        if (periods.length < 2) {
            return { start: null, end: null, diff: null, trend: '-' };
        }

        const firstPeriod = periods[0];
        const lastPeriod = periods[periods.length - 1];

        let startSum = 0, startCount = 0;
        let endSum = 0, endCount = 0;

        data.forEach(agent => {
            const startVal = this.getKpiValueForPeriod(agent, kpiKey, firstPeriod);
            const endVal = this.getKpiValueForPeriod(agent, kpiKey, lastPeriod);

            if (startVal !== null && !isNaN(startVal)) { startSum += startVal; startCount++; }
            if (endVal !== null && !isNaN(endVal)) { endSum += endVal; endCount++; }
        });

        const start = startCount > 0 ? startSum / startCount : null;
        const end = endCount > 0 ? endSum / endCount : null;
        const diff = (start !== null && end !== null) ? end - start : null;

        let trend = '-';
        if (diff !== null && !isNaN(diff)) {
            if (diff > 2) trend = '📈 Mejora';
            else if (diff < -2) trend = '📉 Retroceso';
            else trend = '➡️ Estable';
        }

        return { start, end, diff, trend };
    }

    static calculateAgentEvolution(agent, kpiConfig) {
        const history = agent.history || [];
        if (history.length < 2) {
            return { score: null, trend: '-' };
        }

        const sortedHistory = [...history].sort((a, b) => (a.period || '').localeCompare(b.period || ''));
        const first = sortedHistory[0];
        const last = sortedHistory[sortedHistory.length - 1];

        let totalDiff = 0;
        let validKpis = 0;

        kpiConfig.forEach(kpi => {
            const startVal = first.kpis ? first.kpis[kpi.key] : null;
            const endVal = last.kpis ? last.kpis[kpi.key] : null;

            // Validar ambos valores
            const startNum = parseFloat(startVal);
            const endNum = parseFloat(endVal);

            if (!isNaN(startNum) && !isNaN(endNum)) {
                let diff = endNum - startNum;
                // Normalizar: para KPIs tipo max, invertir el signo
                if (kpi.type === 'max') diff = -diff;
                totalDiff += diff;
                validKpis++;
            }
        });

        if (validKpis === 0) return { score: null, trend: '-' };

        const avgDiff = totalDiff / validKpis;
        if (isNaN(avgDiff)) return { score: null, trend: '-' };

        let trend = '➡️';
        if (avgDiff > 2) trend = '📈';
        else if (avgDiff < -2) trend = '📉';

        return { score: avgDiff, trend };
    }
}
