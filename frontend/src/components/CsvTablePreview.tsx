import type { EntityType } from '../types';
import { EntityChip } from './EntityChip';

interface CsvTablePreviewProps {
  headers: string[];
  rows: string[][];
  title: string;
  columnCounts?: Partial<Record<EntityType, number>>[];
}

const PREVIEW_LIMIT = 100;

export function CsvTablePreview({ headers, rows, title, columnCounts }: CsvTablePreviewProps) {
  const columnCount = rows.reduce((max, row) => Math.max(max, row.length), headers.length);
  const columns = Array.from({ length: columnCount }, (_, index) => index);

  if (columnCount === 0) return <p className="p-4 text-center text-sm text-muted">No CSV rows to display.</p>;

  return (
    <div className="csv-table-wrap">
      <table className="csv-table">
        <caption>{title} · {rows.length} {rows.length === 1 ? 'row' : 'rows'} · {columnCount} {columnCount === 1 ? 'column' : 'columns'}</caption>
        <thead>
          <tr>
            <th scope="col">Row</th>
            {columns.map((column) => (
              <th scope="col" key={column}>
                <span>{headers[column] || `Column ${column + 1}`}</span>
                {columnCounts?.[column] && (
                  <div className="csv-column-chips">
                    {(Object.entries(columnCounts[column]) as [EntityType, number][]).map(([type, count]) => (
                      <EntityChip key={type} type={type} count={count} />
                    ))}
                  </div>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, PREVIEW_LIMIT).map((row, index) => (
            <tr key={index}>
              <th scope="row">{index + 1}</th>
              {columns.map((column) => <td key={column}>{row[column] ?? ''}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > PREVIEW_LIMIT && <p className="p-3 text-sm text-muted">Showing the first {PREVIEW_LIMIT} rows. The download includes every row.</p>}
    </div>
  );
}
