/**
 * Formato 3: Dashboard con Análisis Completo
 * 
 * Exporta un dashboard con múltiples hojas:
 * - Hoja 1: Datos completos
 * - Hoja 2: Resumen ejecutivo con fórmulas
 * - Hoja 3: Top Performers
 * - Hoja 4: Alertas (KPIs críticos)
 * 
 * Basado en kpi-dashboard-design skill
 */

export class DashboardFormat {

    /**
     * Aplica formato de dashboard al workbook
     * @param {ExcelJS.Workbook} workbook - Workbook de ExcelJS
     * @param {Array} data - Datos de agentes a exportar
     * @param {Array} kpiConfig - Configuración de KPIs con targets
     */
    static apply(workbook, data, kpiConfig) {
        // Hoja 1: Datos completos
        this.createDataSheet(workbook, data, kpiConfig);

        // Hoja 2: Resumen ejecutivo
        this.createSummarySheet(workbook, kpiConfig, data.length);

        // Hoja 3: Top performers
        this.createTopPerformersSheet(workbook, data, kpiConfig);

        // Hoja 4: Alertas
        this.createAlertsSheet(workbook, data, kpiConfig);

        return workbook;
    }

    /**
     * Hoja 1: Datos completos
     */
    static createDataSheet(workbook, data, kpiConfig) {
        const worksheet = workbook.addWorksheet('Datos');

        // Encabezados
        const headers = ['ID Empleado', 'Nombre', 'Team Manager'];
        kpiConfig.forEach(kpi => headers.push(kpi.label));

        const headerRow = worksheet.addRow(headers);

        // Estilo encabezados
        headerRow.eachCell(cell => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF1E40AF' } // Blue-700
            };
            cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });

        // Datos
        // Estructura del Store: { id, agent, supervisor, kpis: {...}, admin: {...} }
        data.forEach(agent => {
            const rowData = [
                agent.id || '-',
                agent.agent || '-',
                agent.supervisor || '-'
            ];

            kpiConfig.forEach(kpi => {
                const value = agent.kpis ? agent.kpis[kpi.key] : null;
                rowData.push(value !== null && value !== undefined ? value : '-');
            });

            worksheet.addRow(rowData);
        });

        // Ajuste de columnas
        worksheet.columns.forEach((col, idx) => {
            col.width = idx === 1 ? 25 : 12;
        });

        // Filtros
        worksheet.autoFilter = {
            from: 'A1',
            to: worksheet.lastColumn.letter + '1'
        };
    }

    /**
     * Hoja 2: Resumen ejecutivo con fórmulas dinámicas
     * Skill: Usar fórmulas Excel en lugar de valores hardcodeados
     */
    static createSummarySheet(workbook, kpiConfig, totalAgents) {
        const worksheet = workbook.addWorksheet('Resumen');

        // Título
        const titleRow = worksheet.addRow(['RESUMEN EJECUTIVO - KPI ANALYZER']);
        titleRow.getCell(1).font = { size: 16, bold: true, color: { argb: 'FF1E40AF' } };
        worksheet.mergeCells('A1:E1');
        titleRow.height = 30;

        // Metadata
        worksheet.addRow([`Total de Agentes: ${totalAgents}`]);
        worksheet.addRow([]);

        // Encabezado de tabla de resumen
        const summaryHeaders = worksheet.addRow([
            'KPI',
            'Promedio',
            'Máximo',
            'Mínimo',
            'Agentes Cumpliendo'
        ]);

        summaryHeaders.eachCell(cell => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF475569' } // Slate-600
            };
            cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
            cell.alignment = { horizontal: 'center' };
        });

        // Fórmulas por cada KPI
        kpiConfig.forEach((kpi, index) => {
            const colLetter = this.getColumnLetter(4 + index); // Columna del KPI en hoja Datos (D, E, F...)
            const dataRange = `Datos!${colLetter}2:${colLetter}${totalAgents + 1}`;

            const row = worksheet.addRow([
                kpi.label,
                // Promedio (fórmula dinámica)
                { formula: `AVERAGE(${dataRange})` },
                // Máximo (fórmula dinámica)
                { formula: `MAX(${dataRange})` },
                // Mínimo (fórmula dinámica)
                { formula: `MIN(${dataRange})` },
                // Conteo de agentes cumpliendo
                this.getComplianceFormula(dataRange, kpi.target, kpi.type)
            ]);

            // Formato de números
            if (kpi.isPercent) {
                row.getCell(2).numFmt = '0.0"%"';
                row.getCell(3).numFmt = '0.0"%"';
                row.getCell(4).numFmt = '0.0"%"';
            } else if (kpi.decimals === 0) {
                row.getCell(2).numFmt = '#,##0';
                row.getCell(3).numFmt = '#,##0';
                row.getCell(4).numFmt = '#,##0';
            } else {
                row.getCell(2).numFmt = '#,##0.00';
                row.getCell(3).numFmt = '#,##0.00';
                row.getCell(4).numFmt = '#,##0.00';
            }

            // Color de fondo alternado
            if (index % 2 === 0) {
                row.eachCell(cell => {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFF1F5F9' }
                    };
                });
            }
        });

        // Ajuste de columnas
        worksheet.getColumn(1).width = 20; // KPI
        worksheet.getColumn(2).width = 12; // Promedio
        worksheet.getColumn(3).width = 12; // Máximo
        worksheet.getColumn(4).width = 12; // Mínimo
        worksheet.getColumn(5).width = 20; // Cumpliendo
    }

    /**
     * Hoja 3: Top Performers
     */
    static createTopPerformersSheet(workbook, data, kpiConfig) {
        const worksheet = workbook.addWorksheet('Top Performers');

        // Título
        const titleRow = worksheet.addRow(['TOP 10 AGENTES']);
        titleRow.getCell(1).font = { size: 14, bold: true, color: { argb: 'FF15803D' } };
        worksheet.mergeCells('A1:D1');
        worksheet.addRow([]);

        // Calcular puntuación global por agente
        // Estructura del Store: { id, agent, supervisor, kpis: {...} }
        const agentsWithScore = data.map(agent => {
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

            return {
                ...agent,
                globalScore: validKpis > 0 ? (score / validKpis) : 0
            };
        });

        // Ordenar por puntuación
        const topPerformers = agentsWithScore
            .sort((a, b) => b.globalScore - a.globalScore)
            .slice(0, 10);

        // Encabezados
        const headers = worksheet.addRow(['Posición', 'Nombre', 'Team Manager', 'Puntuación Global %']);
        headers.eachCell(cell => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF15803D' } // Green-700
            };
            cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
            cell.alignment = { horizontal: 'center' };
        });

        // Top performers
        topPerformers.forEach((agent, index) => {
            const row = worksheet.addRow([
                index + 1,
                agent.agent || '-',
                agent.supervisor || '-',
                Math.round(agent.globalScore)
            ]);

            // Destacar top 3 con colores
            if (index < 3) {
                row.getCell(1).font = { size: 12, bold: true };
                row.eachCell(cell => {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: index === 0 ? 'FFFEF3C7' : index === 1 ? 'FFE0E7FF' : 'FFFECACA' }
                    };
                });
            }

            row.getCell(4).numFmt = '0"%"';
        });

        // Ajuste de columnas
        worksheet.getColumn(1).width = 10;
        worksheet.getColumn(2).width = 25;
        worksheet.getColumn(3).width = 15;
        worksheet.getColumn(4).width = 18;
    }

    /**
     * Hoja 4: Alertas de KPIs críticos
     */
    static createAlertsSheet(workbook, data, kpiConfig) {
        const worksheet = workbook.addWorksheet('Alertas');

        // Título
        const titleRow = worksheet.addRow(['ALERTAS - KPIS CRITICOS']);
        titleRow.getCell(1).font = { size: 14, bold: true, color: { argb: 'FFDC2626' } };
        worksheet.mergeCells('A1:E1');
        worksheet.addRow([]);

        // Encabezados
        const headers = worksheet.addRow(['Agente', 'Team Manager', 'KPI', 'Valor Actual', 'Target']);
        headers.eachCell(cell => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFDC2626' } // Red-600
            };
            cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
            cell.alignment = { horizontal: 'center' };
        });

        // Buscar alertas
        // Estructura del Store: { id, agent, supervisor, kpis: {...} }
        const alerts = [];
        data.forEach(agent => {
            kpiConfig.forEach(kpi => {
                const value = agent.kpis ? agent.kpis[kpi.key] : null;
                if (value !== null && value !== undefined && value !== '-' && !isNaN(parseFloat(value))) {
                    const meetsTarget = this.checkTargetCompliance(parseFloat(value), kpi.target, kpi.type);
                    if (!meetsTarget) {
                        alerts.push({
                            nombre: agent.agent || '-',
                            tm: agent.supervisor || '-',
                            kpi: kpi.label,
                            valor: value,
                            target: kpi.target
                        });
                    }
                }
            });
        });

        // Agregar alertas
        alerts.forEach(alert => {
            const row = worksheet.addRow([
                alert.nombre,
                alert.tm,
                alert.kpi,
                alert.valor,
                alert.target
            ]);

            row.eachCell(cell => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFFEE2E2' } // Red-100
                };
            });
        });

        if (alerts.length === 0) {
            worksheet.addRow(['No hay alertas críticas']);
        }

        // Ajuste de columnas
        worksheet.getColumn(1).width = 25;
        worksheet.getColumn(2).width = 15;
        worksheet.getColumn(3).width = 15;
        worksheet.getColumn(4).width = 12;
        worksheet.getColumn(5).width = 12;
    }

    // ===== HELPERS =====

    static checkTargetCompliance(value, target, type) {
        if (type === 'min') return value >= target;
        if (type === 'max') return value <= target;
        return false;
    }

    static calculateCompliance(value, target, type) {
        if (type === 'min') {
            return Math.min((value / target) * 100, 100);
        } else {
            return Math.min((target / value) * 100, 100);
        }
    }

    static getColumnLetter(colNumber) {
        let letter = '';
        while (colNumber > 0) {
            const remainder = (colNumber - 1) % 26;
            letter = String.fromCharCode(65 + remainder) + letter;
            colNumber = Math.floor((colNumber - 1) / 26);
        }
        return letter;
    }

    static getComplianceFormula(dataRange, target, type) {
        if (type === 'min') {
            return { formula: `COUNTIF(${dataRange},">=${target}")` };
        } else {
            return { formula: `COUNTIF(${dataRange},"<=${target}")` };
        }
    }
}
