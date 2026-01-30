/**
 * Formato 2: Exportación Profesional con Estilos
 * 
 * Exporta datos con formato profesional:
 * - Colores condicionales según cumplimiento de KPIs
 * - Encabezados con estilo destacado
 * - Bordes y alineación
 * - Formato de números y porcentajes
 * 
 * Basado en estándares de xlsx-official skill
 */

export class ProfessionalFormat {

    /**
     * Aplica formato profesional al workbook
     * @param {ExcelJS.Workbook} workbook - Workbook de ExcelJS
     * @param {Array} data - Datos de agentes a exportar
     * @param {Array} kpiConfig - Configuración de KPIs con targets
     */
    static apply(workbook, data, kpiConfig) {
        const worksheet = workbook.addWorksheet('Ranking KPI');

        // Metadatos
        this.addMetadata(worksheet, data);

        // Encabezados con estilo
        this.addHeaders(worksheet, kpiConfig);

        // Datos con formato condicional
        this.addDataRows(worksheet, data, kpiConfig);

        // Ajustes finales
        this.applyFinalFormatting(worksheet);

        return workbook;
    }

    /**
     * Agrega metadatos al inicio del documento
     */
    static addMetadata(worksheet, data) {
        const now = new Date();
        const dateStr = now.toLocaleDateString('es-ES');

        // Título
        const titleRow = worksheet.addRow(['KPI ANALYZER - RANKING DE AGENTES']);
        titleRow.getCell(1).font = { size: 16, bold: true, color: { argb: 'FF0F172A' } };
        titleRow.height = 25;

        // Metadata
        worksheet.addRow([`Fecha de Generación: ${dateStr}`]);
        worksheet.addRow([`Total de Agentes: ${data.length}`]);
        worksheet.addRow([]); // Fila vacía

        // Merge células del título
        worksheet.mergeCells('A1:F1');
    }

    /**
     * Agrega encabezados con estilo profesional
     */
    static addHeaders(worksheet, kpiConfig) {
        const headers = [
            'ID Empleado',
            'Nombre',
            'Team Manager'
        ];

        // Agregar KPIs dinámicamente
        kpiConfig.forEach(kpi => {
            headers.push(kpi.label);
        });

        const headerRow = worksheet.addRow(headers);

        // Estilo de encabezados (Skill: Fondo oscuro, texto blanco)
        headerRow.eachCell((cell) => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF0F172A' } // Slate-900
            };
            cell.font = {
                color: { argb: 'FFFFFFFF' },
                bold: true,
                size: 11
            };
            cell.alignment = {
                vertical: 'middle',
                horizontal: 'center'
            };
            cell.border = {
                bottom: { style: 'medium', color: { argb: 'FF1E293B' } }
            };
        });

        headerRow.height = 25;
    }

    /**
     * Agrega filas de datos con formato condicional
     */
    static addDataRows(worksheet, data, kpiConfig) {
        data.forEach((agent, index) => {
            // Obtener datos del agente
            // Estructura del Store: { id, agent, supervisor, kpis: {...}, admin: {...} }
            const rowData = [
                agent.id || '-',
                agent.agent || '-',
                agent.supervisor || '-'
            ];

            // Agregar valores de KPIs desde agent.kpis
            const kpiValues = [];
            kpiConfig.forEach(kpi => {
                const value = agent.kpis ? agent.kpis[kpi.key] : null;
                kpiValues.push(value !== null && value !== undefined ? value : '-');
            });

            const row = worksheet.addRow([...rowData, ...kpiValues]);

            // Aplicar formato condicional por KPI
            this.applyConditionalFormatting(row, agent, kpiConfig, rowData.length);

            // Alternar color de filas para mejor legibilidad
            if (index % 2 === 0) {
                row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                    if (colNumber <= 3) { // Solo columnas ID, Nombre, TM
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFF8FAFC' } // Slate-50
                        };
                    }
                });
            }

            // Bordes sutiles
            row.eachCell((cell) => {
                cell.border = {
                    bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } }
                };
            });

            row.height = 20;
        });
    }

    /**
     * Aplica formato condicional según cumplimiento de KPIs
     * Skill: Verde para cumplimiento, Rojo para incumplimiento
     */
    static applyConditionalFormatting(row, agent, kpiConfig, startColumn) {
        kpiConfig.forEach((kpi, index) => {
            const cell = row.getCell(startColumn + index + 1);
            const value = agent.kpis ? agent.kpis[kpi.key] : null;

            if (value === null || value === undefined || value === '-') {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFF1F5F9' } // Gris claro
                };
                cell.alignment = { horizontal: 'center' };
                return;
            }

            // Determinar si cumple el target
            const meetsTarget = this.checkTargetCompliance(value, kpi.target, kpi.type);

            // Aplicar colores según skill (verde/rojo)
            if (meetsTarget) {
                // Verde suave - Cumple target
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFC6F6D5' } // Green-200
                };
                cell.font = { color: { argb: 'FF166534' }, bold: false }; // Green-800
            } else {
                // Rojo suave - No cumple target
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFFECACA' } // Red-200
                };
                cell.font = { color: { argb: 'FF991B1B' }, bold: false }; // Red-800
            }

            // Formato de número según tipo de KPI
            if (kpi.isPercent) {
                cell.numFmt = '0"%"';
            } else if (kpi.decimals === 0) {
                cell.numFmt = '#,##0';
            } else {
                cell.numFmt = '#,##0.00';
            }

            cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });
    }

    /**
     * Verifica si un valor cumple con el target
     */
    static checkTargetCompliance(value, target, type) {
        if (typeof value !== 'number') {
            const numValue = parseFloat(value);
            if (isNaN(numValue)) return false;
            value = numValue;
        }

        if (type === 'min') {
            return value >= target;
        } else if (type === 'max') {
            return value <= target;
        }

        return false;
    }

    /**
     * Aplica formato final al worksheet
     */
    static applyFinalFormatting(worksheet) {
        // Ajustar ancho de columnas
        worksheet.columns.forEach((column, index) => {
            if (index === 0) {
                column.width = 12; // ID
            } else if (index === 1) {
                column.width = 25; // Nombre
            } else if (index === 2) {
                column.width = 15; // TM
            } else {
                column.width = 12; // KPIs
            }
        });

        // Filtros automáticos (desde fila de encabezados)
        worksheet.autoFilter = {
            from: { row: 5, column: 1 },
            to: { row: 5, column: worksheet.columnCount }
        };

        // Congelar paneles (encabezado fijo)
        worksheet.views = [
            { state: 'frozen', xSplit: 0, ySplit: 5 }
        ];
    }
}
