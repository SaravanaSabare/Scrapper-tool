import fs from 'fs';
import path from 'path';
import xlsx from 'xlsx';

export function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

export function readSheet(filePath, sheetName = 'data') {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[sheetName] || workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) {
    return [];
  }

  return xlsx.utils.sheet_to_json(sheet, { defval: '' });
}

export function writeSheet(filePath, rows, sheetName = 'data') {
  ensureDir(path.dirname(filePath));
  const workbook = xlsx.utils.book_new();
  const sheet = xlsx.utils.json_to_sheet(rows);
  xlsx.utils.book_append_sheet(workbook, sheet, sheetName);
  xlsx.writeFile(workbook, filePath);
}

export default { ensureDir, readSheet, writeSheet };
