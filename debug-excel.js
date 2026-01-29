
import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function inspectFile(filename) {
    try {
        const filePath = path.join(__dirname, 'Excels', filename);
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (data.length > 0) {
            console.log(`\n=== Headers in ${filename} ===`);
            data[0].forEach((col, i) => {
                console.log(`${i}: ${col}`);
            });
        }
    } catch (err) {
        console.error(`Error reading ${filename}:`, err.message);
    }
}

inspectFile('Control usuarios y formaciones W52.xlsx');
