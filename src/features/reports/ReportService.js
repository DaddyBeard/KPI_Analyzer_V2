
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export class ReportService {

    static exportGeneralRanking(data) {
        const doc = new jsPDF();
        const date = new Date().toLocaleDateString();

        // Header
        doc.setFontSize(18);
        doc.setTextColor(40, 44, 52);
        doc.text('Reporte General - KPI Analyzer', 14, 20);

        doc.setFontSize(12);
        doc.setTextColor(100, 116, 139);
        doc.text(`Fecha Generación: ${date}`, 14, 28);
        doc.text(`Total Agentes: ${data.length}`, 14, 34);

        // Table Content
        const tableData = data.map(row => {
            const kpis = row.kpis || {};
            return [
                row.agent,
                row.supervisor,
                kpis.adherence + '%',
                kpis.ncoBO + '%',
                kpis.ncoCall + '%',
                kpis.gestH,
                kpis.cerrH,
                // (kpis.aht || 0).toFixed(0) + 's', // Omitted to fit width if needed, but let's try
                kpis.nps
            ];
        });

        doc.autoTable({
            startY: 40,
            head: [['Agente', 'Supervisor', 'Adherencia', 'NCO BO', 'NCO Llam', 'Gest/H', 'Cerr/H', 'NPS']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
            styles: { fontSize: 8, cellPadding: 3 },
            alternateRowStyles: { fillColor: [248, 250, 252] },
        });

        doc.save(`KPI_Ranking_${date.replace(/\//g, '-')}.pdf`);
    }

    static exportAgentCard(agentData) {
        const doc = new jsPDF();
        const kpis = agentData.kpis || {};
        const name = agentData.agent || 'Agente';

        // Header Band
        doc.setFillColor(15, 23, 42); // Slate 900
        doc.rect(0, 0, 210, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text(name, 14, 20);

        doc.setFontSize(12);
        doc.setTextColor(148, 163, 184); // Slate 400
        doc.text(`${agentData.supervisor || 'N/A'} | Reporte Individual`, 14, 30);

        // Main Stats
        let yPos = 60;
        doc.setTextColor(51, 65, 85);
        doc.setFontSize(14);
        doc.text('Resumen de Desempeño', 14, 50);

        const stats = [
            ['Adherencia', `${kpis.adherence}%`, kpis.adherence >= 95],
            ['NCO BackOffice', `${kpis.ncoBO}%`, kpis.ncoBO >= 85],
            ['NCO Llamadas', `${kpis.ncoCall}%`, kpis.ncoCall >= 85],
            ['AHT Promedio', `${kpis.aht}s`, kpis.aht <= 340],
            ['NPS', `${kpis.nps}`, kpis.nps >= 30]
        ];

        stats.forEach((stat, index) => {
            const x = 14 + (index % 3) * 60;
            const y = yPos + Math.floor(index / 3) * 30;

            doc.setFontSize(10);
            doc.setTextColor(100, 116, 139);
            doc.text(stat[0], x, y);

            doc.setFontSize(16);
            doc.setTextColor(stat[2] ? 22 : 220, stat[2] ? 163 : 38, stat[2] ? 74 : 38); // Green or Red
            doc.text(stat[1], x, y + 8);
        });

        // Detailed Table
        yPos += 70;
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.text('Detalle de Métricas', 14, yPos - 5);

        const tableData = [
            ['Gestión por Hora', kpis.gestH, '2.5'],
            ['Cierre por Hora', kpis.cerrH, '1.8'],
            ['Tipificación', kpis.tipif + '%', '90%'],
            ['NCP', kpis.ncp, '9.0'],
            ['Transferencia', kpis.transfer + '%', '15%']
        ];

        doc.autoTable({
            startY: yPos,
            head: [['Métrica', 'Valor Actual', 'Objetivo']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [59, 130, 246] } // Blue primary
        });

        doc.save(`Ficha_${name.replace(/\s+/g, '_')}.pdf`);
    }
}
