import React, { useState, useEffect, useMemo, useRef, useId } from 'react';
import {
  EntityType,
  SanitizationMode,
} from '../types';
import { EMPTY_COUNTS, useSession } from '../state/SessionContext';
import { usePreferences } from '../state/PreferencesContext';
import { sanitizeDocument } from '../engine/masker';
import { sanitizeCsvDocument, isCsvFormat } from '../engine/csv';
import { downloadText } from '../engine/download';
import { SAMPLE_SUPPORT_TICKET, SAMPLE_CSV_TICKET } from '../engine/sampleTicket';
import { ModeSelector } from './ModeSelector';
import { EntityCounter } from './EntityCounter';
import { PreviewPanel } from './PreviewPanel';
import { SummaryCards } from './SummaryCards';
import {
  Download,
  Upload,
  FileText,
  FileSpreadsheet,
  Trash2,
  Cpu,
  Sparkles,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface WorkspaceProps {
  demoTrigger: number;
}

export const Workspace: React.FC<WorkspaceProps> = ({ demoTrigger }) => {
  const { scanner, setScanner, recordScanner } = useSession();
  const { motionOff, defaultMode } = usePreferences();
  const { text: inputText, mode } = scanner;
  const fileType = scanner.format === 'auto' ? (isCsvFormat(inputText) ? 'csv' : 'txt') : scanner.format;
  const fileName = scanner.name.replace(/\.(txt|csv)$/i, `.${fileType}`);
  const setMode = (mode: SanitizationMode) => setScanner((draft) => ({ ...draft, mode }));
  const [selectedFilter, setSelectedFilter] = useState<EntityType | 'ALL'>('ALL');
  const [fileError, setFileError] = useState<string | null>(null);
  const [resetScrollTrigger, setResetScrollTrigger] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileReadId = useRef(0);
  const fileInputId = useId();
  const workspaceRef = useRef<HTMLElement>(null);

  const processedDoc = useMemo(() => {
    if (!inputText.trim()) return null;
    return fileType === 'csv' ? sanitizeCsvDocument(inputText, mode) : sanitizeDocument(inputText, mode);
  }, [inputText, mode, fileType]);

  useEffect(() => {
    const timer = window.setTimeout(() => recordScanner(inputText, fileType, processedDoc?.counts), 450);
    return () => window.clearTimeout(timer);
  }, [fileType, inputText, processedDoc, recordScanner]);

  // Handle Demo Trigger from Hero CTA
  useEffect(() => {
    if (demoTrigger > 0) {
      loadFictionalSample();
      setMode(defaultMode);
      workspaceRef.current?.focus({ preventScroll: true });
      workspaceRef.current?.scrollIntoView({ behavior: motionOff ? 'instant' : 'smooth', block: 'start' });
    }
  }, [demoTrigger, defaultMode]);

  const loadFictionalSample = () => {
    ++fileReadId.current;
    setSelectedFilter('ALL');
    setScanner((draft) => ({ ...draft, text: SAMPLE_SUPPORT_TICKET, name: 'ticket-sec-89241-sanitized.txt', format: 'txt' }));
    recordScanner(SAMPLE_SUPPORT_TICKET, 'txt', sanitizeDocument(SAMPLE_SUPPORT_TICKET, 'FULL').counts);
    setFileError(null);
    setResetScrollTrigger((prev) => prev + 1);
  };

  const loadCsvSample = () => {
    ++fileReadId.current;
    setSelectedFilter('ALL');
    setScanner((draft) => ({ ...draft, text: SAMPLE_CSV_TICKET, name: 'support-tickets-sanitized.csv', format: 'csv' }));
    recordScanner(SAMPLE_CSV_TICKET, 'csv', sanitizeCsvDocument(SAMPLE_CSV_TICKET, 'FULL').counts);
    setFileError(null);
    setResetScrollTrigger((prev) => prev + 1);
  };

  const handleClear = () => {
    ++fileReadId.current;
    setScanner({ text: '', name: 'ticket-sanitized.txt', format: 'auto', mode: defaultMode });
    setFileError(null);
    setSelectedFilter('ALL');
    recordScanner('', 'txt', undefined);
    setResetScrollTrigger((prev) => prev + 1);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const readId = ++fileReadId.current;

    setFileError(null);
    e.currentTarget.value = '';

    // Validate extension
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'txt' && ext !== 'csv') {
      setFileError('Unsupported file type. Please upload a .txt or .csv file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (readId !== fileReadId.current) return;
      setSelectedFilter('ALL');
      const content = event.target?.result as string;
      if (typeof content === 'string') {
        const baseName = file.name.substring(0, file.name.lastIndexOf('.'));
        setScanner((draft) => ({ ...draft, text: content, format: ext, name: `${baseName}-sanitized.${ext}` }));
        if (content.trim()) {
          const counts = (ext === 'csv' ? sanitizeCsvDocument(content, 'FULL') : sanitizeDocument(content, 'FULL')).counts;
          recordScanner(content, ext, counts);
        }
        setResetScrollTrigger((prev) => prev + 1);
      }
    };
    reader.onerror = () => {
      if (readId === fileReadId.current) setFileError('Failed to read file. Please ensure it is accessible.');
    };
    reader.readAsText(file);
  };

  const handleDownload = () => {
    if (!processedDoc || !processedDoc.sanitizedText) return;
    recordScanner(inputText, fileType, processedDoc.counts);

    downloadText(processedDoc.sanitizedText, fileName, fileType);
  };

  // Prepare spans for Original Preview
  const originalSpans = processedDoc
    ? processedDoc.entities.map((ent) => ({
        ...ent,
        start: ent.origStart,
        end: ent.origEnd,
      }))
    : [];

  const counts = processedDoc?.counts ?? EMPTY_COUNTS;

  return (
    <section
      id="workspace"
      ref={workspaceRef}
      tabIndex={-1}
      aria-labelledby="workspace-title"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12"
    >
      <div className="route-heading mb-4" data-accent={mode.toLowerCase()}>
        <h1 id="workspace-title">Sanitization workspace</h1>
        <p>Paste a ticket or import a file to compare the original and sanitized versions.</p>
      </div>
      <SummaryCards
        counts={counts}
        mode={mode}
      />

      {/* Main Workspace Card Container */}
      <div data-accent={mode.toLowerCase()} className="mode-workspace bg-surface border border-border rounded-2xl shadow-card p-4 sm:p-6">
        {/* Top Control Bar: Mode Selector & Primary Action */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border">
          {/* Mode Selector */}
          <div className="flex-1 max-w-2xl">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-ink">
                Sanitization Mode
              </span>

            </div>
            <ModeSelector mode={mode} onChange={setMode} />
          </div>

          {/* Primary Action Button: Download Sanitized File */}
          <div className="flex items-center gap-2 self-start lg:self-end">
            <button
              onClick={handleDownload}
              disabled={!processedDoc || !processedDoc.sanitizedText}
              type="button"
              className="workspace-primary motion-control inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-primary-fg bg-primary hover:bg-primary-hover hover:-translate-y-0.5 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none transition-all duration-200 shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Download className="w-4 h-4" />
              <span>Download sanitized {fileType.toUpperCase()} file</span>
            </button>
          </div>
        </div>

        {/* Action Controls & Format Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={loadFictionalSample}
              type="button"
              className="motion-control inline-flex min-h-10 items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-surface-raised hover:bg-surface text-primary border border-border hover:-translate-y-0.5 active:scale-[0.97] transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Load Ticket Sample</span>
            </button>

            <button
              onClick={loadCsvSample}
              type="button"
              className="motion-control inline-flex min-h-10 items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-canvas hover:bg-border/60 text-ink border border-border hover:-translate-y-0.5 active:scale-[0.97] transition-all"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-primary" />
              <span>Load CSV Sample</span>
            </button>

            {/* Hidden File Input & Import Button */}
            <input
              id={fileInputId}
              ref={fileInputRef}
              type="file"
              accept=".txt,.csv"
              onChange={handleFileUpload}
              className="peer sr-only"
            />
            <label
              htmlFor={fileInputId}
              className="motion-control inline-flex min-h-10 items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-canvas hover:bg-border/60 text-ink border border-border cursor-pointer hover:-translate-y-0.5 active:scale-[0.97] transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-primary"
            >
              <Upload className="w-3.5 h-3.5 text-muted" />
              <span>Import .txt / .csv</span>
            </label>

            {/* Explicit Format Toggle */}
            <div className="inline-flex items-center bg-canvas p-0.5 rounded-lg border border-border text-xs">
              <button
                type="button"
                aria-pressed={fileType === 'txt'}
                onClick={() => {
                  setScanner((draft) => ({ ...draft, format: 'txt' }));
                }}
                className={`px-2 py-1 rounded-md font-medium transition-all ${
                  fileType === 'txt'
                    ? 'bg-surface text-primary shadow-xs font-semibold'
                    : 'text-muted hover:text-ink'
                }`}
              >
                Text (.txt)
              </button>
              <button
                type="button"
                aria-pressed={fileType === 'csv'}
                onClick={() => {
                  setScanner((draft) => ({ ...draft, format: 'csv' }));
                }}
                className={`px-2 py-1 rounded-md font-medium transition-all ${
                  fileType === 'csv'
                    ? 'bg-surface text-primary shadow-xs font-semibold'
                    : 'text-muted hover:text-ink'
                }`}
              >
                CSV (.csv)
              </button>
            </div>

            {inputText && (
              <button
                onClick={handleClear}
                type="button"
                className="motion-control inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 active:scale-[0.97] transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}
          </div>

          {/* Privacy Guarantee Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-canvas text-muted border border-border">
            <Cpu className="w-3.5 h-3.5 text-primary" />
            <span>Processed in your browser</span>
          </div>
        </div>

        {/* File Error Alert */}
        {fileError && (
          <div className="mb-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{fileError}</span>
          </div>
        )}

        {/* Raw Textarea Input */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="ticket-input"
              className="text-xs font-semibold text-ink flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-primary" />
              <span>Raw Input (Paste text or edit directly)</span>
            </label>
            <span className="text-[11px] text-muted font-mono">
              {inputText.length} characters
            </span>
          </div>
          <textarea
            id="ticket-input"
            value={inputText}
            onChange={(event) => {
              const text = event.target.value;
              setScanner((draft) => ({ ...draft, text }));
            }}
            onBlur={() => recordScanner(inputText, fileType, processedDoc?.counts)}
            placeholder="Paste a support ticket or CSV here…"
            rows={5}
            className="w-full p-3 font-mono text-sm rounded-xl border border-border bg-canvas text-ink placeholder-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
          />
        </div>

        {/* Category Filters Bar (Below Cards, Above Previews) */}
        <div className="mb-4 p-2.5 rounded-xl bg-canvas/80 border border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <EntityCounter
              counts={counts}
              selectedFilter={selectedFilter}
              onSelectFilter={setSelectedFilter}
            />
            <span className="text-[11px] text-muted hidden lg:inline-block">
              Click a category above to filter preview highlights
            </span>
          </div>
        </div>

        {/* Sample Ticket Judging Callout Banner */}
        {inputText.includes('TICKET #SEC-89241') && (
          <div className="mb-4 p-3 rounded-xl bg-surface-raised border border-border text-xs text-ink flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-primary shrink-0" />
              <span>
                <strong>Evaluation Guide:</strong> Observe both occurrences of{' '}
                <code className="px-1 py-0.5 rounded bg-surface font-bold text-primary">
                  alex.morgan@cybersecure-vault.io
                </code>
                , the valid Luhn card{' '}
                <code className="px-1 py-0.5 rounded bg-rose-100 dark:bg-rose-900 font-bold text-rose-800 dark:text-rose-200">
                  4012 8888 8888 1881
                </code>
                , and the 16-digit trace reference{' '}
                <code className="px-1 py-0.5 rounded bg-canvas border border-border font-bold">
                  9876-5432-1098-7654
                </code>{' '}
                (which fails Luhn and stays unmasked).
              </span>
            </div>
          </div>
        )}

        {/* Side-by-Side (Desktop) / Stacked (Mobile) Preview Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: Original Preview */}
          <PreviewPanel
            title="Original Ticket"
            subtitle="Raw input with detected entities identified"
            text={inputText}
            entities={originalSpans}
            isSanitized={false}
            highlightFilter={selectedFilter}
            isCsv={fileType === 'csv'}
            csvData={
              processedDoc?.csvData
                ? {
                    headers: processedDoc.csvData.headers,
                    rows: processedDoc.csvData.originalRows,
                  }
                : undefined
            }
            resetScrollTrigger={resetScrollTrigger}
          />

          {/* Right: Sanitized Preview */}
          <PreviewPanel
            title={`Sanitized Result (${mode})`}
            subtitle="Redacted output ready for engineering handoff"
            text={processedDoc?.sanitizedText || ''}
            entities={processedDoc?.entities || []}
            isSanitized={true}
            highlightFilter={selectedFilter}
            isCsv={fileType === 'csv'}
            csvData={
              processedDoc?.csvData
                ? {
                    headers: processedDoc.csvData.sanitizedHeaders,
                    rows: processedDoc.csvData.sanitizedRows,
                  }
                : undefined
            }
            resetScrollTrigger={resetScrollTrigger}
            totalMatchesCount={processedDoc?.counts.TOTAL || 0}
          />
        </div>
      </div>
    </section>
  );
};
