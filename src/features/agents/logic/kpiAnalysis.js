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
    const topKPIs = identifyTopKPIs(kpiData, kpiConfig, 1);
    return topKPIs.length > 0 ? topKPIs[0] : null;
}

/**
 * Identifies the top N KPIs with the most significant negative performance gaps.
 * @param {Object} kpiData - Object containing actual KPI values (key: value).
 * @param {Array} kpiConfig - Configuration array defining targets and types.
 * @param {number} topN - Number of top KPIs to return (default: 3).
 * @returns {Array} - Array of KPI objects sorted by weighted score (worst first), or empty array if no failures.
 */
export function identifyTopKPIs(kpiData, kpiConfig, topN = 3) {
    const failedKPIs = [];

    kpiConfig.forEach(kpi => {
        const actualValue = kpiData[kpi.key];

        // Skip if no data
        if (actualValue === undefined || actualValue === null || actualValue === '') return;

        // Parse value (handle strings like "85%" or "2,5")
        let numericActual = parseFloat(String(actualValue).replace('%', '').replace(',', '.'));
        if (isNaN(numericActual)) return;

        let gap = 0;

        // Calculate Raw Gap
        if (kpi.type === 'min') {
            gap = numericActual - kpi.target;
        } else if (kpi.type === 'max') {
            gap = kpi.target - numericActual;
        }

        // Only consider failures
        if (gap < 0) {
            // Normalize Gap (Percentage of Target) to compare apples to oranges (e.g. Seconds vs Percentages)
            // Prevent division by zero
            const target = kpi.target !== 0 ? kpi.target : 1;
            const normalizedGap = gap / target;

            // Apply Importance Weight (Default to 3 if missing)
            const importance = kpi.importance || 3;

            // weightedScore will be negative. The more negative, the higher priority.
            const weightedScore = normalizedGap * importance;

            failedKPIs.push({
                ...kpi,
                gap: gap,
                actual: numericActual,
                weightedScore
            });
        }
    });

    // Sort by weightedScore (most negative first = worst performance)
    failedKPIs.sort((a, b) => a.weightedScore - b.weightedScore);

    // Return top N
    return failedKPIs.slice(0, topN);
}

/**
 * Generates a draft summary based on the identified priority KPI.
 * @param {string} agentName - Name of the agent.
 * @param {string} month - Current period/month.
 * @param {Object} priorityKPI - The identified priority KPI object (result of identifyPriorityKPI).
 * @returns {string} - The draft text template.
 */
/**
 * Generates a draft summary based on the identified priority KPI.
 * Refactored to provide a "Professional yet Approachable" coaching style.
 * @param {string} agentName - Name of the agent.
 * @param {string} month - Current period/month.
 * @param {Object} priorityKPI - The identified priority KPI object (result of identifyPriorityKPI).
 * @returns {string} - The draft text template.
 */
export function generateSummaryDraft(agentData, kpiConfig) {
    const kpis = agentData.kpis || {};
    const agentName = agentData.agent ? agentData.agent.split(' ')[0] : 'Colaborador'; // First name

    // 1. Clean up Period/Month display
    let month = agentData._period || 'el periodo actual';
    if (month.includes('.xlsx') || month.includes('.xls')) {
        month = month.replace(/\.xlsx?$/i, '').replace(/[_-]/g, ' ');
    }
    // Capitalize first letter of month
    month = month.charAt(0).toUpperCase() + month.slice(1);

    // 2. Metrics Extraction (Restoring Detailed Reporting)
    const getVal = (key) => {
        const val = kpis[key];
        return (val !== undefined && val !== null) ? val : '-';
    };

    // Back Office Metrics
    const gestH = getVal('gestH');
    const cerrH = getVal('cerrH');
    const ncoBO = getVal('ncoBO');
    const gestTotal = getVal('gestTotal');
    const cerrTotal = getVal('cerrTotal');

    // Call Center Metrics
    const calls = getVal('calls');
    const aht = getVal('aht');
    const transfer = getVal('transfer');
    const hold = getVal('hold');
    const tipificacion = getVal('tipif');
    const ncp = getVal('ncp');
    const nps = getVal('nps');
    const ncoCall = getVal('ncoCall');
    const quality = getVal('quality') !== '-' ? getVal('quality') : getVal('nco'); // Check 'quality' or fallback to 'nco' for calls

    // 3. Calculate Success Rate & Determine Category
    let totalKPIs = 0;
    let metKPIs = 0;

    kpiConfig.forEach(kpi => {
        const val = kpis[kpi.key];
        if (val !== undefined && val !== null && val !== '') {
            totalKPIs++;
            let numericActual = parseFloat(String(val).replace('%', '').replace(',', '.'));

            if (!isNaN(numericActual)) {
                let isMet = false;
                if (kpi.type === 'min') isMet = numericActual >= kpi.target;
                else if (kpi.type === 'max') isMet = numericActual <= kpi.target;
                if (isMet) metKPIs++;
            }
        }
    });

    const successRate = totalKPIs > 0 ? (metKPIs / totalKPIs) : 0;

    // Determine Category
    let category = 'stable'; // Default
    if (successRate >= 0.8) category = 'high_performance';
    else if (successRate < 0.5) category = 'low_performance';

    // 4. Identify Priority KPI (Main Challenge)
    const priorityKPI = identifyPriorityKPI(kpis, kpiConfig);
    const mainChallenge = priorityKPI
        ? `${priorityKPI.label} (${priorityKPI.actual}${priorityKPI.unit || ''})`
        : 'Mantener la consistencia';

    // 5. Narrative Building Blocks
    const performanceParts = [];

    // -- Back Office Block --
    if (gestTotal !== '-') {
        const gestPart = `gestionaste un total de ${gestTotal} expedientes (Ritmo: ${gestH} Gest/h)`;
        const cerrPart = cerrTotal !== '-' ? `, cerrando ${cerrTotal} de ellos (Ritmo: ${cerrH} Cerr/h)` : '';
        const boQuality = ncoBO !== '-' ? `. Tu calidad de BO fue de ${ncoBO}%` : '';

        performanceParts.push(`${gestPart}${cerrPart}${boQuality}`);
    }

    // -- Call Center Block --
    if (calls !== '-') {
        const parts = [`atendiste ${calls} llamadas`];

        if (aht !== '-') parts.push(`generando un AHT de ${aht} segundos`);
        if (transfer !== '-') parts.push(`tasa de transfer del ${transfer}%`);
        if (tipificacion !== '-') parts.push(`tasa de tipificación del ${tipificacion}%`);
        if (ncp !== '-') parts.push(`NCP del ${ncp}%`);
        if (nps !== '-') parts.push(`NPS de ${nps}`);
        if (ncoCall !== '-') parts.push(`calidad de llamada (NCO) del ${ncoCall}%`);

        performanceParts.push(parts.join(', '));
    }

    // Fallback if no specific volume data found but KPIs exist
    if (performanceParts.length === 0) {
        performanceParts.push('se analizaron tus indicadores clave de rendimiento');
    }

    // Join parts nicely using proper punctuation
    const performanceSummary = `En cuanto a tus métricas de ${month}: ` + performanceParts.join('. Además, ');

    // Professional Coaching Analysis
    const coachingMessages = {
        high_performance: [
            `Estos resultados reflejan un cumplimiento del ${(successRate * 100).toFixed(0)}% de tus objetivos. Es un desempeño sólido que demuestra dominio del proceso y eficiencia operativa.`,
            `Con un ${(successRate * 100).toFixed(0)}% de objetivos alcanzados, has demostrado una excelente capacidad de gestión y calidad en tu trabajo.`,
            `Tus indicadores están alineados con lo que buscamos, alcanzando un ${(successRate * 100).toFixed(0)}% de efectividad global.`
        ],
        stable: [
            `Tu balance general es positivo, con un cumplimiento del ${(successRate * 100).toFixed(0)}%. Tienes una base operativa buena, aunque identificamos oportunidades para afinar ciertos indicadores como ${mainChallenge}.`,
            `Alcanzamos un ${(successRate * 100).toFixed(0)}% de cumplimiento. La gestión es correcta, pero para dar el siguiente paso necesitamos poner foco en ${mainChallenge}.`,
            `Operativamente eres consistente (${(successRate * 100).toFixed(0)}% cumplimiento), pero debemos evitar fluctuaciones en áreas clave como ${mainChallenge}.`
        ],
        low_performance: [
            `Actualmente estamos en un ${(successRate * 100).toFixed(0)}% de cumplimiento. Es necesario revisar tu metodología ya que indicadores críticos como ${mainChallenge} están afectando tu evaluación global.`,
            `El cierre de mes muestra desviaciones importantes, situándonos en un ${(successRate * 100).toFixed(0)}% de objetivos. La prioridad inmediata es corregir la tendencia en ${mainChallenge}.`,
            `Necesitamos reforzar tu operativa. Con un ${(successRate * 100).toFixed(0)}% de cumplimiento, es urgente establecer un plan de mejora enfocado principalmente en ${mainChallenge}.`
        ]
    };

    const closings = [
        "Confío en que seguiremos avanzando con este nivel de compromiso.",
        "Sigamos trabajando juntos para mantener y superar estos estándares.",
        "Quedo a tu disposición para revisar cualquier detalle de estos números."
    ];

    // Helper: Select random template
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const analysis = pick(coachingMessages[category]);
    const closing = pick(closings);

    // 6. Construct Final Message
    // Structure: Greeting -> Factual Data -> Coaching/Analysis -> Closing -> Technical Footer

    return `Hola ${agentName},

${performanceSummary}

${analysis}

${closing}

---
Ref. Objetivos: ${kpiConfig.map(k => `${k.label}: ${k.target}`).join(' | ')}`;
}
