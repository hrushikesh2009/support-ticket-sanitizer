import {
  EntityType,
  ProcessedDocument,
  SanitizationMode,
  SanitizedEntitySpan,
} from '../types';
import { createEntityCounts } from './entityCounts';
import { sanitizeDocument } from './masker';

/**
 * Robust RFC 4180 CSV Parser
 * Handles:
 * - Commas inside quotes
 * - Escaped double quotes ("")
 * - Multiline fields with newlines inside quotes
 * - Variable / empty columns
 */
interface CsvCell {
  value: string;
  positions: number[];
}

function parseCsvCells(csvText: string, capturePositions = false): CsvCell[][] {
  const rows: CsvCell[][] = [];
  let currentRow: CsvCell[] = [];
  let currentField = '';
  let positions: number[] = [];
  let insideQuotes = false;
  let fieldStarted = false;

  function append(character: string, index: number) {
    currentField += character;
    if (capturePositions) positions.push(index);
    fieldStarted = true;
  }

  function pushField() {
    currentRow.push({ value: currentField, positions });
    currentField = '';
    positions = [];
    fieldStarted = false;
  }

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = i + 1 < csvText.length ? csvText[i + 1] : null;

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped quote: "" becomes "
        append('"', i);
        i++; // skip next quote
      } else {
        // Toggle quote mode
        insideQuotes = !insideQuotes;
        fieldStarted = true;
      }
    } else if (char === ',' && !insideQuotes) {
      // End of field
      pushField();
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      // End of line
      if (char === '\r' && nextChar === '\n') {
        i++; // consume CRLF
      }
      pushField();
      rows.push(currentRow);
      currentRow = [];
    } else {
      append(char, i);
    }
  }

  // Push last field and row if any content remains
  if (fieldStarted || currentRow.length > 0) {
    pushField();
    rows.push(currentRow);
  }

  return rows;
}

export function parseCsv(csvText: string): string[][] {
  return parseCsvCells(csvText).map((row) => row.map((cell) => cell.value));
}

/**
 * RFC 4180 CSV Serializer
 * Quotes fields that contain commas, quotes, or newlines, escaping quotes properly.
 */
export function serializeCsv(rows: string[][], quoteAll = false): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          if (cell === null || cell === undefined) return '';
          const str = String(cell);
          const needsQuoting =
            quoteAll ||
            (str === '' && row.length === 1) ||
            str.includes(',') ||
            str.includes('"') ||
            str.includes('\n') ||
            str.includes('\r');
          if (needsQuoting) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(',')
    )
    .join('\n');
}

/** Prefix formula-like values with a visible text marker and quote every field. */
export function createSpreadsheetCsv(sanitizedCsv: string): string {
  const rows = parseCsv(sanitizedCsv).map((row) => row.map((value) => {
    const normalized = value.normalize('NFKC');
    const looksLikeFormula = /^[=+\-@]/.test(normalized.trimStart()) || /^[\r\n\t]/.test(normalized);
    return looksLikeFormula ? `[TEXT] ${value}` : value;
  }));
  return serializeCsv(rows, true);
}

/**
 * Checks if a given text appears to be a CSV file
 */
export function isCsvFormat(text: string): boolean {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return false;
  // If first few lines have equal number of commas (> 0)
  const commaCountFirst = (lines[0].match(/,/g) || []).length;
  if (commaCountFirst < 1) return false;

  const commaCountSecond = (lines[1].match(/,/g) || []).length;
  return commaCountFirst > 0 && Math.abs(commaCountFirst - commaCountSecond) <= 2;
}

/**
 * Processes a CSV document cell-by-cell while maintaining a shared alias map
 * across all rows and columns for complete pseudonym consistency.
 */
export function sanitizeCsvDocument(
  csvText: string,
  mode: SanitizationMode
): ProcessedDocument {
  const sourceCells = parseCsvCells(csvText, true);
  const rawRows = sourceCells.map((row) => row.map((cell) => cell.value));
  if (rawRows.length === 0) {
    return {
      originalText: csvText,
      sanitizedText: '',
      entities: [],
      counts: createEntityCounts(),
      aliasMap: {},
      isCsv: true,
      csvData: {
        headers: [],
        sanitizedHeaders: [],
        columnCounts: [],
        originalRows: [],
        sanitizedRows: [],
      },
    };
  }

  const sharedAliasMap = new Map<string, string>();
  const typeCounters = new Map<string, number>();

  const overallCounts = createEntityCounts();

  const cellsWithEntities: { row: number; column: number; entities: SanitizedEntitySpan[] }[] = [];
  const columnCounts: Partial<Record<EntityType, number>>[] = [];
  const sanitizedRows: string[][] = [];

  for (let r = 0; r < rawRows.length; r++) {
    const rawRow = rawRows[r];
    const sanitizedRow: string[] = [];

    for (let c = 0; c < rawRow.length; c++) {
      const cellVal = rawRow[c];
      const cellResult = sanitizeDocument(cellVal, mode, sharedAliasMap, typeCounters);

      overallCounts.TOTAL += cellResult.counts.TOTAL;

      const column = columnCounts[c] ??= {};
      for (const { type } of cellResult.entities) {
        overallCounts[type] += 1;
        column[type] = (column[type] ?? 0) + 1;
      }
      if (cellResult.entities.length) cellsWithEntities.push({ row: r, column: c, entities: cellResult.entities });

      sanitizedRow.push(cellResult.sanitizedText);
    }

    sanitizedRows.push(sanitizedRow);
  }

  const sanitizedCsvText = serializeCsv(sanitizedRows);
  const sanitizedCells = parseCsvCells(sanitizedCsvText, true);
  const allEntities = cellsWithEntities.flatMap(({ row, column, entities }) => {
    const originalPositions = sourceCells[row][column].positions;
    const sanitizedPositions = sanitizedCells[row][column].positions;
    return entities.map((entity) => ({
      ...entity,
      id: `csv-${row}-${column}-${entity.id}`,
      origStart: originalPositions[entity.origStart],
      origEnd: originalPositions[entity.origEnd - 1] + 1,
      start: sanitizedPositions[entity.start],
      end: sanitizedPositions[entity.end - 1] + 1,
    }));
  });

  const plainAliasMap: Record<string, string> = {};
  sharedAliasMap.forEach((val, key) => {
    plainAliasMap[key] = val;
  });

  const headers = rawRows.length > 0 ? rawRows[0] : [];
  const bodyRowsOrig = rawRows.length > 1 ? rawRows.slice(1) : [];
  const bodyRowsSanitized = sanitizedRows.length > 1 ? sanitizedRows.slice(1) : [];

  return {
    originalText: csvText,
    sanitizedText: sanitizedCsvText,
    entities: allEntities,
    counts: overallCounts,
    aliasMap: plainAliasMap,
    isCsv: true,
    csvData: {
      headers,
      sanitizedHeaders: sanitizedRows[0] ?? [],
      columnCounts,
      originalRows: bodyRowsOrig,
      sanitizedRows: bodyRowsSanitized,
    },
  };
}
