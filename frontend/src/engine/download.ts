import { createSpreadsheetCsv } from './csv';

export function downloadSpreadsheetCsv(sanitizedCsv: string, name: string) {
  const filename = name.replace(/\.csv$/i, '-spreadsheet.csv');
  downloadText(createSpreadsheetCsv(sanitizedCsv), filename, 'csv');
}

export function downloadText(text: string, name: string, type: 'txt' | 'csv') {
  const mimeType = type === 'csv' ? 'text/csv;charset=utf-8' : 'text/plain;charset=utf-8';
  const url = URL.createObjectURL(new Blob([text], { type: mimeType }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
