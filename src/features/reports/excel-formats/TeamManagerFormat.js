/**
 * Formato 4: Exportación por Team Manager
 * 
 * Genera un Excel con una hoja por cada Team Manager,
 * mostrando solo los agentes de su equipo.
 * Ideal para reportes individuales por supervisor.
 */

export class TeamManagerFormat {

    /**
     * Aplica formato por Team Manager al workbook
     * @param {ExcelJS.Workbook} workbook - Workbook de ExcelJS
     * @param {Array} data - Datos de agentes a exportar
     * @param {Array} kpiConfig - Configuración de KPIs
     */
    static apply(workbook, data, kpiConfig) {
        // Agrupar agentes por Team Manager
        const tmGroups = this.groupByTeamManager(data);

        // Crear hoja resumen primero
        this.createSummarySheet(workbook, tmGroups, kpiConfig);

        // Crear una hoja por cada Team Manager
        Object.keys(tmGroups).sort().forEach(tm => {
            this.createTeamSheet(workbook, tm, tmGroups[tm], kpiConfig);
        });

        return workbook;
    }

    /**
     * Agrupa agentes por Team Manager
     */
    static groupByTeamManager(data) {
        const groups = {};

        data.forEach(agent => {
            const tm = agent.supervisor || 'Sin Asignar';
            if (!groups[tm]) {
                groups[tm] = [];
            }
            groups[tm].push(agent);
        });

        return groups;
    }

    /**
     * Crea hoja de resumen con todos los TMs
     */
    static createSummarySheet(workbook, tmGroups, kpiConfig) {
        const worksheet = workbook.addWorksheet('Resumen TMs');

        // Título
        const titleRow = worksheet.addRow(['RESUMEN POR TEAM MANAGER']);
        titleRow.getCell(1).font = { size: 16, bold: true, color: { argb: 'FF1E40AF' } };
        worksheet.mergeCells('A1:E1');
        titleRow.height = 30;

        worksheet.addRow([]);

        // Encabezados
        const headers = ['Team Manager', 'Agentes', 'Promedio Global %'];

        // Agregar TODOS los KPIs
        kpiConfig.forEach(kpi => {
            headers.push(`Prom. ${kpi.label}`);
        });

        const headerRow = worksheet.addRow(headers);
        headerRow.eachCell(cell => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF1E40AF' }
            };
            cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });

        // Datos por TM
        Object.keys(tmGroups).sort().forEach((tm, index) => {
            const agents = tmGroups[tm];
            const globalAvg = this.calculateGlobalAverage(agents, kpiConfig);

            const rowData = [
                tm,
                agents.length,
                globalAvg
            ];

            // Promedios de TODOS los KPIs
            kpiConfig.forEach(kpi => {
                const avg = this.calculateKpiAverage(agents, kpi.key);
                rowData.push(avg !== null ? avg : '-');
            });

            const row = worksheet.addRow(rowData);

            // Color alternado
            if (index % 2 === 0) {
                row.eachCell(cell => {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFF1F5F9' }
                    };
                });
            }

            // Formato de números
            row.getCell(3).numFmt = '0"%"';
            for (let i = 4; i <= 3 + kpiConfig.length; i++) {
                row.getCell(i).numFmt = '0.0';
            }

            // Color según rendimiento global
            const globalCell = row.getCell(3);
            if (globalAvg >= 85) {
                globalCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6F6D5' } };
            } else if (globalAvg >= 70) {
                globalCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
            } else {
                globalCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFECACA' } };
            }
        });

        // Ajuste de columnas
        worksheet.getColumn(1).width = 20;
        worksheet.getColumn(2).width = 12;
        worksheet.getColumn(3).width = 18;
        for (let i = 4; i <= 3 + kpiConfig.length; i++) {
            worksheet.getColumn(i).width = 14;
        }
    }

    /**
     * Crea hoja para un Team Manager específico
     */
    static createTeamSheet(workbook, tmName, agents, kpiConfig) {
        // Limpiar nombre para usar como nombre de hoja (max 31 chars)
        const sheetName = tmName.substring(0, 28).replace(/[\\/*?:\[\]]/g, '');
        const worksheet = workbook.addWorksheet(sheetName);

        // Título
        const titleRow = worksheet.addRow([`EQUIPO: ${tmName}`]);
        titleRow.getCell(1).font = { size: 14, bold: true, color: { argb: 'FF0F172A' } };
        worksheet.mergeCells('A1:E1');

        worksheet.addRow([`Total agentes: ${agents.length}`]);
        worksheet.addRow([]);

        // Encabezados
        const headers = ['Nombre', 'ID'];
        kpiConfig.forEach(kpi => headers.push(kpi.label));
        headers.push('Puntuación %');

        const headerRow = worksheet.addRow(headers);
        headerRow.eachCell(cell => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF475569' }
            };
            cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 10 };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });

        // Ordenar agentes por puntuación
        const sortedAgents = [...agents].sort((a, b) => {
            return this.calculateAgentScore(b, kpiConfig) - this.calculateAgentScore(a, kpiConfig);
        });

        // Datos de agentes
        sortedAgents.forEach((agent, index) => {
            const rowData = [
                agent.agent || '-',
                agent.id || '-'
            ];

            kpiConfig.forEach(kpi => {
                const value = agent.kpis ? agent.kpis[kpi.key] : null;
                rowData.push(value !== null && value !== undefined ? value : '-');
            });

            rowData.push(this.calculateAgentScore(agent, kpiConfig));

            const row = worksheet.addRow(rowData);

            // Formato condicional por KPI
            kpiConfig.forEach((kpi, kpiIndex) => {
                const cell = row.getCell(3 + kpiIndex);
                const value = agent.kpis ? agent.kpis[kpi.key] : null;

                if (value !== null && value !== undefined && value !== '-') {
                    const meetsTarget = this.checkTarget(value, kpi.target, kpi.type);
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: meetsTarget ? 'FFC6F6D5' : 'FFFECACA' }
                    };
                }

                if (kpi.isPercent) {
                    cell.numFmt = '0"%"';
                }
            });

            // Puntuación final
            const scoreCell = row.getCell(3 + kpiConfig.length);
            scoreCell.numFmt = '0"%"';

            // Color alternado para filas
            if (index % 2 === 0) {
                row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
                row.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
            }
        });

        // Ajuste de columnas
        worksheet.getColumn(1).width = 25;
        worksheet.getColumn(2).width = 12;
        for (let i = 3; i <= 2 + kpiConfig.length; i++) {
            worksheet.getColumn(i).width = 10;
        }
        worksheet.getColumn(3 + kpiConfig.length).width = 14;

        // Filtros
        worksheet.autoFilter = {
            from: { row: 4, column: 1 },
            to: { row: 4, column: 2 + kpiConfig.length + 1 }
        };
    }

    // ===== HELPERS =====

    static calculateGlobalAverage(agents, kpiConfig) {
        if (agents.length === 0) return 0;

        let totalScore = 0;
        agents.forEach(agent => {
            totalScore += this.calculateAgentScore(agent, kpiConfig);
        });

        return Math.round(totalScore / agents.length);
    }

    static calculateAgentScore(agent, kpiConfig) {
        let score = 0;
        let validKpis = 0;

        kpiConfig.forEach(kpi => {
            const value = agent.kpis ? agent.kpis[kpi.key] : null;
            if (value !== null && value !== undefined && value !== '-' && !isNaN(parseFloat(value))) {
                const compliance = this.calculateCompliance(parseFloat(value), kpi.target, kpi.type);
                score += compliance;
                validKpis++;
            }
        });

        return validKpis > 0 ? Math.round(score / validKpis) : 0;
    }

    static calculateKpiAverage(agents, kpiKey) {
        let sum = 0;
        let count = 0;

        agents.forEach(agent => {
            const value = agent.kpis ? agent.kpis[kpiKey] : null;
            if (value !== null && value !== undefined && !isNaN(parseFloat(value))) {
                sum += parseFloat(value);
                count++;
            }
        });

        return count > 0 ? Math.round(sum / count * 10) / 10 : null;
    }

    static calculateCompliance(value, target, type) {
        if (type === 'min') {
            return Math.min((value / target) * 100, 100);
        } else {
            return Math.min((target / value) * 100, 100);
        }
    }

    static checkTarget(value, target, type) {
        if (type === 'min') return parseFloat(value) >= target;
        if (type === 'max') return parseFloat(value) <= target;
        return false;
    }
}
