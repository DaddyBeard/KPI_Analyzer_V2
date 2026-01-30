/**
 * Formato 1: Exportación Básica de Datos
 * 
 * Exporta datos crudos sin formato especial.
 * Ideal para análisis externo, importación a otras herramientas.
 */

export class BasicFormat {

    /**
     * Aplica formato básico al workbook
     * @param {ExcelJS.Workbook} workbook - Workbook de ExcelJS
     * @param {Array} data - Datos de agentes a exportar
     */
    static apply(workbook, data) {
        const worksheet = workbook.addWorksheet('Datos KPI');

        // Preparar datos simplificados
        // Estructura del Store: { id, agent, supervisor, kpis: { gestH, cerrH, ncoBO, ... }, admin: {...} }
        const simpleData = data.map(agent => {
            const kpis = agent.kpis || {};
            return {
                'ID Empleado': agent.id || '-',
                'Nombre': agent.agent || '-',
                'Team Manager': agent.supervisor || '-',
                'Adherencia %': this.formatValue(kpis.adherence),
                'NCO BO %': this.formatValue(kpis.ncoBO),
                'NCO Llamadas %': this.formatValue(kpis.ncoCall),
                'AHT (seg)': this.formatValue(kpis.aht),
                'Gest/Hora': this.formatValue(kpis.gestH),
                'Cerr/Hora': this.formatValue(kpis.cerrH),
                'Tipificación %': this.formatValue(kpis.tipif),
                'Transfer %': this.formatValue(kpis.transfer),
                'NPS': this.formatValue(kpis.nps),
                'NCP': this.formatValue(kpis.ncp),
                'Gestiones Total': this.formatValue(kpis.gestTotal),
                'Cierres Total': this.formatValue(kpis.cerrTotal),
                'Llamadas': this.formatValue(kpis.calls)
            };
        });

        // Agregar encabezados y datos
        if (simpleData.length > 0) {
            const headers = Object.keys(simpleData[0]);
            worksheet.addRow(headers);

            simpleData.forEach(row => {
                worksheet.addRow(Object.values(row));
            });
        }

        // Ajustar ancho de columnas automáticamente
        worksheet.columns.forEach(column => {
            let maxLength = 0;
            column.eachCell({ includeEmpty: false }, cell => {
                const length = cell.value ? cell.value.toString().length : 10;
                maxLength = Math.max(maxLength, length);
            });
            column.width = Math.min(maxLength + 2, 30);
        });

        // Filtros automáticos en encabezados
        worksheet.autoFilter = {
            from: 'A1',
            to: worksheet.lastColumn.letter + '1'
        };

        return workbook;
    }

    /**
     * Formatea valores, convierte null/undefined a '-'
     */
    static formatValue(value) {
        if (value === null || value === undefined || value === '') return '-';
        return value;
    }
}
