import { useMemo, useRef, useState } from 'react';
import { Download, FileSpreadsheet, Upload } from 'lucide-react';
import { CsvTablePreview } from '../components/CsvTablePreview';
import { ModeSelector } from '../components/ModeSelector';
import { PageLayout, Reveal } from '../components/PageLayout';
import { sanitizeCsvDocument } from '../engine/csv';
import { downloadSpreadsheetCsv, downloadText } from '../engine/download';
import { MAX_UPLOAD_BYTES, UPLOAD_LIMIT_MESSAGE } from '../engine/inputLimits';
import { SAMPLE_CSV_TICKET } from '../engine/sampleTicket';
import { usePreferences } from '../state/PreferencesContext';
import { useSession } from '../state/SessionContext';
import type { ProcessedDocument, SanitizationMode } from '../types';

export function CsvPage() {
  const { recordScan } = useSession();
  const { defaultMode } = usePreferences();
  const [source, setSource] = useState<{ text: string; name: string } | null>(null);
  const [mode, setMode] = useState<SanitizationMode>(defaultMode);
  const [result, setResult] = useState<ProcessedDocument | null>(null);
  const [view, setView] = useState<'before' | 'after'>('before');
  const [over, setOver] = useState(false);
  const [error, setError] = useState('');
  const upload = useRef<HTMLInputElement>(null);
  const loadId = useRef(0);
  const analysis = useMemo(() => source ? sanitizeCsvDocument(source.text, 'FULL') : null, [source]);
  const table = analysis?.csvData;
  const showResult = view === 'after' && result?.csvData;

  function loadSource(text: string, name: string) {
    setSource({ text, name });
    setError('');
    setResult(null);
    setView('before');
  }

  async function readFile(file?: File) {
    if (!file) return;
    const attempt = ++loadId.current;
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Choose a file with a .csv extension.');
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError(UPLOAD_LIMIT_MESSAGE);
      return;
    }
    try {
      const text = (await file.text()).replace(/^\uFEFF/, '');
      if (attempt !== loadId.current) return;
      if (!text.trim()) {
        setError('This file is empty. Choose a CSV with at least one row.');
        return;
      }
      loadSource(text, file.name);
    } catch {
      if (attempt === loadId.current) setError('This file could not be read. Try opening it again.');
    }
  }

  function sanitize() {
    if (!source || !analysis) return;
    const sanitized = mode === 'FULL' ? analysis : sanitizeCsvDocument(source.text, mode);
    setResult(sanitized);
    setView('after');
    recordScan('CSV', sanitized.counts);
  }

  return (
    <PageLayout title="CSV tools" accent="email" description="Review detections by column and export a sanitized copy with the same rows and columns.">
      <Reveal>
        <div className="accent-card detail-card">
          <div className="csv-dropzone" data-drag-over={over}
            onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; setOver(true); }}
            onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOver(false); }}
            onDrop={(event) => { event.preventDefault(); setOver(false); void readFile(event.dataTransfer.files[0]); }}
          >
            <FileSpreadsheet size={26} className="text-primary" aria-hidden="true" />
            <h2>{source ? source.name : 'Drop a CSV file here'}</h2>
            <p className="text-sm text-muted">Files are processed in your browser.</p>
            <div className="csv-actions">
              <input type="file" accept=".csv,text/csv" hidden ref={upload} onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                event.currentTarget.value = '';
                void readFile(file);
              }} />
              <button type="button" className="secondary-action motion-control" onClick={() => upload.current?.click()}>
                <Upload size={16} aria-hidden="true" /> Choose CSV
              </button>
              <button type="button" className="secondary-action motion-control" onClick={() => {
                ++loadId.current;
                loadSource(SAMPLE_CSV_TICKET, 'support-tickets.csv');
              }}>Load CSV Sample</button>
            </div>
            {error && <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{error}</p>}
          </div>
        </div>
      </Reveal>
      <p role="status" className="sr-only">
        {result ? 'Sanitized CSV ready to download.' : ''}
      </p>
      {table && (
        <Reveal delay={0.08}>
          <section className="accent-card detail-card csv-workspace" data-accent={mode.toLowerCase()} aria-label="CSV workspace">
            <div className="csv-controls">
              <div>
                <h2>CSV preview</h2>
                <p className="card-description">{analysis?.counts.TOTAL} detected matches</p>
              </div>
              <div className="csv-actions">
                <button type="button" className="route-action motion-control" disabled={!!result} onClick={sanitize}>Sanitize CSV</button>
                {result && source && <>
                  <button type="button" className="secondary-action motion-control"
                    onClick={() => downloadText(result.sanitizedText, source.name.replace(/\.csv$/i, '-sanitized.csv'), 'csv')}
                  ><Download size={16} aria-hidden="true" /> Download sanitized CSV</button>
                  <button type="button" className="secondary-action motion-control"
                    title="Prefixes formula-like cells with [TEXT]"
                    onClick={() => downloadSpreadsheetCsv(result.sanitizedText, source.name.replace(/\.csv$/i, '-sanitized.csv'))}
                  >Download spreadsheet CSV</button>
                </>}
              </div>
            </div>
            <ModeSelector mode={mode} onChange={(nextMode) => {
              if (nextMode === mode) return;
              setMode(nextMode); setResult(null); setView('before');
            }} />
            <div className="csv-actions" aria-label="Preview version">
              <button type="button" className="secondary-action motion-control" aria-pressed={!showResult}
                onClick={() => setView('before')}>Before</button>
              <button type="button" className="secondary-action motion-control" aria-pressed={!!showResult} disabled={!result}
                onClick={() => setView('after')}>After</button>
            </div>
            {result && <p className="card-description">The spreadsheet download prefixes formula-like cells with [TEXT].</p>}
            <CsvTablePreview title={showResult ? 'Sanitized CSV' : 'Original CSV'}
              headers={showResult ? showResult.sanitizedHeaders : table.headers}
              rows={showResult ? showResult.sanitizedRows : table.originalRows}
              columnCounts={table.columnCounts}
            />
          </section>
        </Reveal>
      )}
    </PageLayout>
  );
}
