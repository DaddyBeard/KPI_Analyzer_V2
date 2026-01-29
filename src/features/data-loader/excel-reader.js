
import * as XLSX from 'xlsx';

/**
 * Reads an Excel file and returns all sheets as JSON.
 * Reverted to standard behavior (Legacy-style) to avoid header misdetection.
 * 
 * @param {File} file - The file object from input[type="file"]
 * @returns {Promise<{[sheetName: string]: any[]}>} - Object with sheet names as keys
 */
export async function readExcelFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target.result;
                const workbook = XLSX.read(data, { type: 'array' });

                const result = {};

                workbook.SheetNames.forEach(sheetName => {
                    const worksheet = workbook.Sheets[sheetName];
                    // Simple, robust legacy parsing. Assumes headers are in Row 0 (or 1 in Excel terms).
                    // This works for KPI_2025_12.xlsx as verified by debug_headers.js
                    result[sheetName] = XLSX.utils.sheet_to_json(worksheet, { defval: null });
                });

                resolve(result);
            } catch (error) {
                console.error('Error parsing Excel file:', error);
                reject(error);
            }
        };

        reader.onerror = (error) => {
            console.error('Error reading file:', error);
            reject(error);
        };

        reader.readAsArrayBuffer(file);
    });
}
