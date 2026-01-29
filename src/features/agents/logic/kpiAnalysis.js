/**
 * Logic module for analyzing agent KPIs and identifying focus areas.
 */

/**
 * Identifies the KPI with the most significant negative performance gap.
 * @param {Object} kpiData - Object containing actual KPI values (key: value).
 * @param {Array} kpiConfig - Configuration array defining targets and types.
 * @returns {Object|null} - The config object of the priority KPI with an added 'gap' property, or null if no data.
 */
export function identifyPriorityKPI(kpiData, kpiConfig) {
    let priorityKPI = null;
    let maxNegativeGap = 0; // We are looking for the most negative number (biggest failure)

    kpiConfig.forEach(kpi => {
        const actualValue = kpiData[kpi.key];

        // Skip if no data
        if (actualValue === undefined || actualValue === null || actualValue === '') return;

        // Parse value (handle strings like "85%" or "2,5")
        let numericActual = parseFloat(String(actualValue).replace('%', '').replace(',', '.'));
        if (isNaN(numericActual)) return;

        let gap = 0;

        // Calculate Gap based on type
        // type: 'min' -> Higher is better (Target is minimum). Gap = Actual - Target
        // type: 'max' -> Lower is better (Target is maximum). Gap = Target - Actual
        if (kpi.type === 'min') {
            gap = numericActual - kpi.target;
        } else if (kpi.type === 'max') {
            gap = kpi.target - numericActual;
        }

        // We only care about failures (negative gaps)
        // We want the "lowest" number (e.g. -20 is worse than -5)
        if (gap < 0) {
            // If this is the first failure found, or if this gap is worse (lower) than the current maxNegativeGap
            if (priorityKPI === null || gap < maxNegativeGap) {
                maxNegativeGap = gap;
                priorityKPI = { ...kpi, gap: gap, actual: numericActual };
            }
        }
    });

    return priorityKPI;
}

/**
 * Generates a draft summary based on the identified priority KPI.
 * @param {string} agentName - Name of the agent.
 * @param {string} month - Current period/month.
 * @param {Object} priorityKPI - The identified priority KPI object (result of identifyPriorityKPI).
 * @returns {string} - The draft text template.
 */
export function generateSummaryDraft(agentData, kpiConfig) {
    const kpis = agentData.kpis || {};
    const agentName = agentData.agent ? agentData.agent.split(' ')[0] : 'Agente'; // First name

    // Clean up Period/Month display
    let month = agentData._period || 'el periodo actual';
    if (month.includes('.xlsx') || month.includes('.xls')) {
        month = month.replace(/\.xlsx?$/i, '').replace(/[_-]/g, ' ');
    }

    // Helper to safely get values
    const getVal = (key) => {
        const val = kpis[key];
        return (val !== undefined && val !== null) ? val : '-';
    };

    // Config Extraction for targets using matching keys
    const findTarget = (key) => {
        const item = kpiConfig.find(k => k.key === key);
        return item ? item.target : '?';
    };

    // Specific metrics requested
    const gestH = getVal('gestH');
    const cerrH = getVal('cerrH');
    const ncoBO = getVal('ncoBO');

    // Volume metrics (New)
    const gestTotal = getVal('gestTotal');
    const cerrTotal = getVal('cerrTotal');
    // const calls = getVal('calls'); // Available if needed

    const gestHTarget = findTarget('gestH');
    const cerrHTarget = findTarget('cerrH');
    const ncoBOTarget = findTarget('ncoBO');

    // Narrative construction
    // "gestionar 147 expedientes lo que te da un 1.5 gest/h"
    const gestPart = (gestTotal !== '-')
        ? `gestionaste ${gestTotal} expedientes con una productividad de ${gestH} Exp Gest/h`
        : `alcanzaste una productividad de ${gestH} Exp Gest/h`;

    const cerrPart = (cerrTotal !== '-')
        ? `de los cuales cerraste ${cerrTotal} expedientes con una productividad de ${cerrH} Exp Cerr/h`
        : `y ${cerrH} Exp Cerr/h`;

    return `Hola ${agentName},

Terminamos el mes de ${month} con las siguientes métricas: ${gestPart}, ${cerrPart}, ofreciendo una calidad de back office de ${ncoBO}%.

Recordarte que los objetivos de la campaña SYR son: Exp gest/h ${gestHTarget} - Exp cerr/h ${cerrHTarget} - Nco bo% ${ncoBOTarget}%.`;
}
