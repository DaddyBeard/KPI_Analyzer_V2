
import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function inspectSheets(filename) {
    try {
        const filePath = path.join(__dirname, 'Excels', filename);
        const workbook = XLSX.readFile(filePath);

        console.log(`\n=== File: ${filename} ===`);
        console.log(`Sheets found: ${workbook.SheetNames.join(', ')}`);

        workbook.SheetNames.forEach(sheetName => {
            console.log(`\n--- Sheet: ${sheetName} ---`);
            const sheet = workbook.Sheets[sheetName];
            // Read first 5 rows to be safe against metadata
            const data = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 0, defval: null });

            // Find header row (row with at least 3 strings usually)
            let headerRowIndex = data.findIndex(row =>
                row && row.filter(c => typeof c === 'string').length > 3
            );

            if (headerRowIndex === -1) headerRowIndex = 0;

            console.log(`Header Row Index: ${headerRowIndex}`);
            console.log('Headers:', data[headerRowIndex]);
            console.log('Sample Row:', data[headerRowIndex + 1]);
        });

    } catch (error) {
        console.error('Error reading file:', error.message);
    }
}

inspectSheets('KPI_2025_12.xlsx');
