
import * as XLSX from 'xlsx';
import * as fs from 'fs';

const file = 'c:/Users/jason/Desktop/KPI ANALYZER MODULAR ++ - copia/KPI_Analyzer_V2/Excels/Control usuarios y formaciones W52.xlsx';

try {
    const buf = fs.readFileSync(file);
    const wb = XLSX.read(buf, { type: 'buffer' });

    wb.SheetNames.forEach(name => {
        console.log(`\nSHEET: ${name}`);
        const ws = wb.Sheets[name];
        const json = XLSX.utils.sheet_to_json(ws, { header: 1 });
        if (json.length > 0) {
            console.log('--- HEADERS ---');
            json[0].forEach((h, i) => console.log(`[${i}] ${h}`));
        }
    });

} catch (e) { console.error(e); }
