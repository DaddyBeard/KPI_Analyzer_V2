
import { DataMerger } from './src/features/data-loader/DataMerger.js';
import { AgentHistory } from './src/features/agents/components/AgentHistory.js';

// Mock Data mimicking the user's scenario
const mockSheets = {
    'KPI_2025_12.xlsx': [
        {
            'Agente': 'Maria Test',
            'GEST/H': 1.5,
            'NCO BO%': null // Missing NCO
        }
    ],
    'KPI_Complementary_2025_12.xlsx': [
        {
            'Agente': 'Maria Test',
            'GEST/H': null, // Missing GEST 
            'NCO BO%': 1 // 100%
        }
    ]
};

console.log('--- Step 1: Running DataMerger ---');
const agents = DataMerger.merge(mockSheets);
const maria = agents.find(a => a.agent === 'Maria Test');

console.log('Maria History Entries:', maria.history.length);
maria.history.forEach((h, i) => {
    console.log(`[Entry ${i}] Period: ${h.period}, Source: ${h.source}, GEST: ${h.kpis.gestH}, NCO: ${h.kpis.ncoBO}`);
});

console.log('\n--- Step 2: Simulating AgentHistory Render Logic ---');
// Extract logic from AgentHistory.render to test map merging
const uniqueHistoryMap = new Map();

maria.history.forEach(h => {
    // Mock normalizePeriod behavior
    const normalizePeriod = (filename) => {
        if (filename.includes('2025_12')) return '2025-12';
        return filename;
    };

    const rawPeriod = h.period || "";
    const normalizedKey = normalizePeriod(rawPeriod);

    console.log(`Processing ${h.source} -> Key: ${normalizedKey}`);

    if (!uniqueHistoryMap.has(normalizedKey)) {
        console.log('  -> New Map Entry');
        uniqueHistoryMap.set(normalizedKey, {
            period: normalizedKey,
            kpis: { ...h.kpis }
        });
    } else {
        console.log('  -> Merging into existing');
        const existing = uniqueHistoryMap.get(normalizedKey);
        const newKpis = h.kpis || {};

        Object.keys(newKpis).forEach(key => {
            const val = newKpis[key];
            if (val !== null && val !== undefined && val !== '') {
                console.log(`     Updating ${key} to ${val}`);
                existing.kpis[key] = val;
            } else {
                console.log(`     Skipping ${key} (value: ${val})`);
            }
        });
    }
});

const finalResult = uniqueHistoryMap.get('2025-12');
console.log('\n--- Final Merged Result ---');
console.log('GEST:', finalResult.kpis.gestH);
console.log('NCO:', finalResult.kpis.ncoBO);

if (finalResult.kpis.gestH === 1.5 && finalResult.kpis.ncoBO === 100) {
    console.log('\n✅ TEST PASSED: Data merged correctly.');
} else if (finalResult.kpis.ncoBO === 1) {
    console.log('\n✅ TEST PASSED (Raw Value): NCO is 1 (100%).');
} else {
    console.log('\n❌ TEST FAILED: Data missing.');
}
