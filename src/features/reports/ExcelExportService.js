/**
 * Servicio Principal de Exportación a Excel
 * 
 * Orquesta las exportaciones delegando a los diferentes formatos disponibles.
 * Usa ExcelJS para generar archivos Excel en el navegador.
 */

import ExcelJS from 'exceljs';
import { BasicFormat } from './excel-formats/BasicFormat.js';
import { ProfessionalFormat } from './excel-formats/ProfessionalFormat.js';
import { DashboardFormat } from './excel-formats/DashboardFormat.js';
import { TeamManagerFormat } from './excel-formats/TeamManagerFormat.js';
import { ComparativeFormat } from './excel-formats/ComparativeFormat.js';

export class ExcelExportService {

    /**
     * Formato 1: Exportación básica de datos
     * @param {Array} data - Datos de agentes
     * @param {string} filename - Nombre del archivo (sin extensión)
     */
    static async exportBasic(data, filename = 'KPI_Datos') {
        try {
            const workbook = new ExcelJS.Workbook();

            // Metadata del documento
            workbook.creator = 'KPI Analyzer V2';
            workbook.created = new Date();

            // Aplicar formato básico
            BasicFormat.apply(workbook, data);

            // Guardar archivo
            await this.saveWorkbook(workbook, `${filename}_${this.getDateString()}.xlsx`);

            return { success: true, format: 'basic' };
        } catch (error) {
            console.error('Error exportando Excel básico:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Formato 2: Exportación profesional con estilos
     * @param {Array} data - Datos de agentes
     * @param {Array} kpiConfig - Configuración de KPIs
     * @param {string} filename - Nombre del archivo (sin extensión)
     */
    static async exportProfessional(data, kpiConfig, filename = 'KPI_Ranking') {
        try {
            const workbook = new ExcelJS.Workbook();

            // Metadata
            workbook.creator = 'KPI Analyzer V2';
            workbook.created = new Date();
            workbook.company = 'KPI Analyzer';

            // Aplicar formato profesional
            ProfessionalFormat.apply(workbook, data, kpiConfig);

            // Guardar archivo
            await this.saveWorkbook(workbook, `${filename}_${this.getDateString()}.xlsx`);

            return { success: true, format: 'professional' };
        } catch (error) {
            console.error('Error exportando Excel profesional:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Formato 3: Dashboard con análisis completo
     * @param {Array} data - Datos de agentes
     * @param {Array} kpiConfig - Configuración de KPIs
     * @param {string} filename - Nombre del archivo (sin extensión)
     */
    static async exportDashboard(data, kpiConfig, filename = 'KPI_Dashboard') {
        try {
            const workbook = new ExcelJS.Workbook();

            // Metadata
            workbook.creator = 'KPI Analyzer V2';
            workbook.created = new Date();
            workbook.company = 'KPI Analyzer';
            workbook.description = 'Dashboard ejecutivo con análisis de KPIs';

            // Aplicar formato dashboard
            DashboardFormat.apply(workbook, data, kpiConfig);

            // Guardar archivo
            await this.saveWorkbook(workbook, `${filename}_${this.getDateString()}.xlsx`);

            return { success: true, format: 'dashboard' };
        } catch (error) {
            console.error('Error exportando Excel dashboard:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Formato 4: Exportación por Team Manager
     * @param {Array} data - Datos de agentes
     * @param {Array} kpiConfig - Configuración de KPIs
     * @param {string} filename - Nombre del archivo (sin extensión)
     */
    static async exportTeamManager(data, kpiConfig, filename = 'KPI_Por_TM') {
        try {
            const workbook = new ExcelJS.Workbook();

            // Metadata
            workbook.creator = 'KPI Analyzer V2';
            workbook.created = new Date();
            workbook.company = 'KPI Analyzer';
            workbook.description = 'Reporte de KPIs agrupado por Team Manager';

            // Aplicar formato por TM
            TeamManagerFormat.apply(workbook, data, kpiConfig);

            // Guardar archivo
            await this.saveWorkbook(workbook, `${filename}_${this.getDateString()}.xlsx`);

            return { success: true, format: 'team-manager' };
        } catch (error) {
            console.error('Error exportando Excel por TM:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Formato 5: Exportación Comparativa (Histórico)
     * @param {Array} data - Datos de agentes con historial
     * @param {Array} kpiConfig - Configuración de KPIs
     * @param {string} filename - Nombre del archivo (sin extensión)
     */
    static async exportComparative(data, kpiConfig, filename = 'KPI_Comparativo') {
        try {
            const workbook = new ExcelJS.Workbook();

            // Metadata
            workbook.creator = 'KPI Analyzer V2';
            workbook.created = new Date();
            workbook.company = 'KPI Analyzer';
            workbook.description = 'Análisis comparativo y evolución de KPIs';

            // Aplicar formato comparativo
            ComparativeFormat.apply(workbook, data, kpiConfig);

            // Guardar archivo
            await this.saveWorkbook(workbook, `${filename}_${this.getDateString()}.xlsx`);

            return { success: true, format: 'comparative' };
        } catch (error) {
            console.error('Error exportando Excel comparativo:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Exportación de ficha individual de agente
     * @param {Object} agentData - Datos del agente
     * @param {Array} kpiConfig - Configuración de KPIs
     */
    static async exportAgentSheet(agentData, kpiConfig) {
        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Ficha del Agente');

            // Estructura del Store: { id, agent, supervisor, kpis: {...}, admin: {...} }
            const agentName = agentData.agent || 'Agente';

            // Título
            const titleRow = worksheet.addRow([`FICHA DE AGENTE: ${agentName}`]);
            titleRow.getCell(1).font = { size: 16, bold: true, color: { argb: 'FF0F172A' } };
            worksheet.mergeCells('A1:D1');
            titleRow.height = 30;

            worksheet.addRow([]);

            // Información general
            worksheet.addRow(['ID Empleado:', agentData.id || '-']);
            worksheet.addRow(['Team Manager:', agentData.supervisor || '-']);
            worksheet.addRow([]);

            // KPIs
            const headerRow = worksheet.addRow(['KPI', 'Valor Actual', 'Target', 'Estado']);
            headerRow.eachCell(cell => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF475569' }
                };
                cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
            });

            kpiConfig.forEach(kpi => {
                const value = agentData.kpis ? agentData.kpis[kpi.key] : null;
                const meetsTarget = this.checkTarget(value, kpi.target, kpi.type);
                const status = meetsTarget ? 'CUMPLE' : 'NO CUMPLE';

                const row = worksheet.addRow([kpi.label, value !== null && value !== undefined ? value : '-', kpi.target, status]);

                row.getCell(4).fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: meetsTarget ? 'FFC6F6D5' : 'FFFECACA' }
                };
            });

            // Ajustar columnas
            worksheet.getColumn(1).width = 20;
            worksheet.getColumn(2).width = 15;
            worksheet.getColumn(3).width = 15;
            worksheet.getColumn(4).width = 15;

            await this.saveWorkbook(workbook, `Ficha_${agentName.replace(/\s+/g, '_')}.xlsx`);

            return { success: true, format: 'agent-sheet' };
        } catch (error) {
            console.error('Error exportando ficha de agente:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Guarda el workbook y descarga el archivo
     * @param {ExcelJS.Workbook} workbook - Workbook a guardar
     * @param {string} filename - Nombre del archivo
     */
    static async saveWorkbook(workbook, filename) {
        // Generar buffer
        const buffer = await workbook.xlsx.writeBuffer();

        // Crear blob
        const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        // Crear enlace de descarga
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;

        // Simular click para descargar
        document.body.appendChild(link);
        link.click();

        // Limpiar
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    }

    /**
     * Obtiene fecha actual en formato YYYY-MM-DD
     */
    static getDateString() {
        return new Date().toISOString().split('T')[0];
    }

    /**
     * Verifica si cumple target
     */
    static checkTarget(value, target, type) {
        if (value === null || value === undefined || value === '-' || isNaN(parseFloat(value))) return false;
        const numValue = parseFloat(value);
        if (type === 'min') return numValue >= target;
        if (type === 'max') return numValue <= target;
        return false;
    }
}
