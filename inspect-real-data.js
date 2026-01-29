
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const excelDir = 'c:/Users/jason/Desktop/KPI ANALYZER MODULAR ++ - copia/KPI_Analyzer_V2/Excels';

async function inspect(filename) {
    const filePath = path.join(excelDir, filename);
    console.log(`\n--- Inspecting: ${filename} ---`);

    try {
        const buf = fs.readFileSync(filePath);
        const wb = XLSX.read(buf, { type: 'buffer' });

        console.log('Sheets found:', wb.SheetNames);

        wb.SheetNames.forEach(sheetName => {
            console.log(`\n  [Sheet: ${sheetName}]`);
            const ws = wb.Sheets[sheetName];

            // Get raw range to see where data starts
            if (!ws['!ref']) {
                console.log('    <Empty Sheet>');
                return;
            }

            // Read first 5 rows raw
            const rows = XLSX.utils.sheet_to_json(ws, { header: 1, range: 0, defval: null }).slice(0, 5);
            rows.forEach((r, i) => {
                console.log(`    Row ${i}:`, JSON.stringify(r));
            });
        });

    } catch (e) {
        console.error('Error reading file:', e.message);
    }
}

// Inspect KPI and Control files
// inspect('KPI_2025_12.xlsx');
inspect('Control usuarios y formaciones W52.xlsx');
