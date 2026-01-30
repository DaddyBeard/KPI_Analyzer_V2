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
        const simpleData = data.map(agent => ({
            'ID Empleado': agent.ID_empl || agent.id_empl || agent.id,
            'Nombre': agent.Nombre || agent.nombre || agent.agent,
            'Team Manager': agent.TM || agent.supervisor,
            'Adherencia %': this.formatPercent(agent['Adherencia al puesto %'] || agent.adherence),
            'NCO BO %': agent['NCO BO'] || agent.ncoBO,
            'NCO Llamadas %': agent['NCO Llam'] || agent.ncoCall,
            'AHT (seg)': agent.AHT || agent.aht,
            'Gest/Hora': agent['Gest/H'] || agent.gestH,
            'Cerr/Hora': agent['Cerr/H'] || agent.cerrH,
            'Tipificación %': this.formatPercent(agent['Tipificación'] || agent.tipif),
            'Transfer %': this.formatPercent(agent.Transfer || agent.transfer),
            'NPS': agent.NPS || agent.nps,
            'NCP': agent.NCP || agent.ncp
        }));

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
     * Formatea valores de porcentaje
     */
    static formatPercent(value) {
        if (value === null || value === undefined || value === '-') return '-';
        if (typeof value === 'number') {
            if (value <= 1) return Math.round(value * 100);
            return Math.round(value);
        }
        return value;
    }
}
