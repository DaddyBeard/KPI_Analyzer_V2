
import { readExcelFile } from './src/features/data-loader/excel-reader.js';
import { DataNormalizer } from './src/features/data-loader/DataNormalizer.js';
import { DataMerger } from './src/features/data-loader/DataMerger.js';
import * as fs from 'fs';

// Mock File/FileReader
class MockFile {
    constructor(path, name) {
        this.path = path;
        this.name = name;
    }
    arrayBuffer() {
        return Promise.resolve(fs.readFileSync(this.path).buffer);
    }
}
global.FileReader = class {
    readAsArrayBuffer(file) {
        setTimeout(() => {
            try {
                const buf = fs.readFileSync(file.path);
                this.onload({ target: { result: buf } });
            } catch (e) { this.onerror(e); }
        }, 10);
    }
};

async function run() {
    console.log('--- DIAGNOSTIC V2: Merge Logic ---');

    // 1. Setup Files
    const files = [
        { path: 'c:/Users/jason/Desktop/KPI ANALYZER MODULAR ++ - copia/KPI_Analyzer_V2/Excels/KPI_2025_12.xlsx', name: 'KPI_File.xlsx' },
        { path: 'c:/Users/jason/Desktop/KPI ANALYZER MODULAR ++ - copia/KPI_Analyzer_V2/Excels/Control usuarios y formaciones W52.xlsx', name: 'Control_File.xlsx' }
    ];

    const allSheets = {};

    // 2. Read & Aggregate
    for (const f of files) {
        try {
            console.log(`Reading ${f.name}...`);
            const sheets = await readExcelFile(new MockFile(f.path, f.name));
            Object.keys(sheets).forEach(sName => {
                console.log(`  + Sheet: ${sName} (Rows: ${sheets[sName].length})`);
                // Sample headers
                if (sheets[sName].length > 0) console.log(`    Headers:`, Object.keys(sheets[sName][0]).slice(0, 3));

                // Prefix logic from AppShell
                allSheets[`${f.name}::${sName}`] = sheets[sName];
            });
        } catch (e) { console.error('Error reading', f.name, e); }
    }

    // 3. Merge
    console.log('Merging Data...');
    const result = DataMerger.merge(allSheets);
    console.log(`Total Merged Agents: ${result.length}`);

    // 4. Analyze Overlap (Check specifically for distinct IDs)
    const withKPIs = result.filter(a => a.kpis && (a.kpis.gestH !== null || a.kpis.adherence !== null));
    const withAdmin = result.filter(a => a.admin && (a.admin.email || a.admin.dni));
    const withBOTH = result.filter(a =>
        (a.kpis && a.kpis.adherence !== null) &&
        (a.admin && a.admin.dni)
    );

    console.log(`Agents with KPIs:   ${withKPIs.length}`);
    console.log(`Agents with Admin:  ${withAdmin.length}`);
    console.log(`Agents with BOTH:   ${withBOTH.length}`);

    if (withBOTH.length === 0) {
        console.log('CRITICAL: No overlap found! Agents are not merging.');

        // Inspect an ID from KPI and an ID from Control to see mismatch
        if (withKPIs.length > 0) console.log('Sample KPI Agent ID:', withKPIs[0].id, 'Name:', withKPIs[0].agent);
        if (withAdmin.length > 0) console.log('Sample Admin Agent ID:', withAdmin[0].id, 'Name:', withAdmin[0].agent);
    } else {
        console.log('SUCCESS: Some agents merged properly.');
        console.log('Sample Merged Agent:', JSON.stringify(withBOTH[0], null, 2));
    }
}

run();
