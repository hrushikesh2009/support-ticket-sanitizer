import { describe, expect, it } from 'vitest';
import { createSpreadsheetCsv, parseCsv, sanitizeCsvDocument, serializeCsv } from '../engine/csv';

describe('CSV import and export', () => {
  const records = [
    ['Name', 'Notes', 'Email'],
    ['Doe, Maya', 'First\nsecond "quoted"', 'maya@example.com'],
    ['Stone, Tara', 'No change', 'maya@example.com'],
  ];
  const source = serializeCsv(records).replace(/\n/g, '\r\n');

  it('round-trips commas, quoted text, multiline fields, and empty trailing rows', () => {
    expect(parseCsv(serializeCsv([...records, ['']]))).toEqual([...records, ['']]);
    expect(parseCsv(source)[1][1]).toBe('First\r\nsecond "quoted"');
  });

  it('fully masks matches while preserving the shape and unaffected fields', () => {
    const result = sanitizeCsvDocument(source, 'FULL');
    expect(parseCsv(result.sanitizedText)).toEqual([
      records[0],
      ['Doe, Maya', 'First\r\nsecond "quoted"', '[REDACTED]'],
      ['Stone, Tara', 'No change', '[REDACTED]'],
    ]);
    expect(result.csvData?.columnCounts).toEqual([{}, {}, { EMAIL: 2 }]);
  });

  it('keeps aliases consistent across rows and columns', () => {
    const result = sanitizeCsvDocument('Email,Notes\nmaya@example.com,Contact maya@example.com\nmaya@example.com,Follow up', 'PSEUDONYMIZE');
    expect(parseCsv(result.sanitizedText).slice(1)).toEqual([
      ['EMAIL_01', 'Contact EMAIL_01'],
      ['EMAIL_01', 'Follow up'],
    ]);
  });

  it('keeps row and column offsets accurate after escaping quotation marks', () => {
    const input = 'Subject,Notes\nIssue,"He said ""contact maya@example.com""."';
    const result = sanitizeCsvDocument(input, 'PSEUDONYMIZE');
    expect(result.entities).toHaveLength(1);
    const match = result.entities[0];
    expect(input.slice(match.origStart, match.origEnd)).toBe('maya@example.com');
    expect(result.sanitizedText.slice(match.start, match.end)).toBe('EMAIL_01');
  });

  it('handles blank CSV and sanitizes fields in the header as well as the body', () => {
    expect(sanitizeCsvDocument('', 'FULL').csvData?.originalRows).toEqual([]);
    expect(sanitizeCsvDocument('maya@example.com,Title\nexample,Ticket', 'FULL').csvData?.sanitizedHeaders)
      .toEqual(['[REDACTED]', 'Title']);
  });
});

describe('spreadsheet-friendly export', () => {
  it('marks formula-like headers and cells even with whitespace or full-width operators', () => {
    const rows = [['=Header', 'Notes'], [' \t＠Tag', 'Keep, these "quotes"'], ['Normal', 'First\nsecond']];
    const exported = createSpreadsheetCsv(serializeCsv(rows));
    expect(parseCsv(exported)).toEqual([
      ['[TEXT] =Header', 'Notes'],
      ['[TEXT]  \t＠Tag', rows[1][1]],
      rows[2],
    ]);
    expect(exported.startsWith('"[TEXT] =Header","Notes"')).toBe(true);
  });
});
