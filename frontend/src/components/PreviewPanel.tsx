import React, { useState, useEffect, useRef } from 'react';
import { EntityType, ENTITY_METADATA, SanitizedEntitySpan } from '../types';
import { Copy, Check, FileText, CheckCircle2 } from 'lucide-react';
import { CsvTablePreview } from './CsvTablePreview';

interface PreviewPanelProps {
  title: string;
  subtitle: string;
  text: string;
  entities: SanitizedEntitySpan[];
  isSanitized?: boolean;
  highlightFilter?: EntityType | 'ALL';
  isCsv?: boolean;
  csvData?: {
    headers: string[];
    rows: string[][];
  };
  resetScrollTrigger?: number;
  totalMatchesCount?: number;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({
  title,
  subtitle,
  text,
  entities,
  isSanitized = false,
  highlightFilter = 'ALL',
  isCsv = false,
  csvData,
  resetScrollTrigger = 0,
  totalMatchesCount = 0,
}) => {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const resetCopy = useRef<number>();
  const [viewMode, setViewMode] = useState<'text' | 'table'>('text');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Reset scroll to top whenever resetScrollTrigger changes (e.g. sample load or import)
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [resetScrollTrigger]);

  useEffect(() => () => window.clearTimeout(resetCopy.current), []);

  const handleCopy = async () => {
    if (!text) return;
    window.clearTimeout(resetCopy.current);
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus('copied');
    } catch {
      setCopyStatus('error');
    }
    resetCopy.current = window.setTimeout(() => setCopyStatus('idle'), 2500);
  };

  /**
   * Renders highlighted text by slicing along entity boundaries
   */
  const renderHighlightedContent = () => {
    if (!text) {
      return (
        <div className="flex flex-col items-center justify-center h-52 text-muted text-xs">
          <div className="w-10 h-10 rounded-full bg-canvas border border-border flex items-center justify-center mb-2.5 text-muted">
            <FileText className="w-5 h-5 opacity-60" />
          </div>
          <span className="font-semibold text-ink text-sm">No ticket content loaded</span>
          <span className="text-[11px] text-muted mt-1 max-w-xs text-center">
            Load the demo ticket above, paste text, or import a .txt or .csv file to preview.
          </span>
        </div>
      );
    }

    // Filter entities if an entity type filter is active
    const activeEntities = entities.filter(
      (ent) => highlightFilter === 'ALL' || ent.type === highlightFilter
    );

    if (activeEntities.length === 0) {
      return <span className="whitespace-pre-wrap">{text}</span>;
    }

    const segments: React.ReactNode[] = [];
    let lastIndex = 0;

    activeEntities.forEach((ent, idx) => {
      // Un-highlighted text before this entity
      if (ent.start > lastIndex) {
        segments.push(
          <span key={`text-${idx}`}>
            {text.substring(lastIndex, ent.start)}
          </span>
        );
      }

      // Highlighted entity span
      const meta = ENTITY_METADATA[ent.type];
      const matchText = text.substring(ent.start, ent.end);

      segments.push(
        <mark
          key={`highlight-${ent.id || idx}`}
          title={`${meta.label} (${isSanitized ? 'Redacted' : 'Original'})`}
          className={`entity-highlight px-1.5 py-0.5 rounded border font-mono text-[11px] sm:text-xs transition-all inline-flex items-center gap-1 mx-0.5 shadow-xs ${
            meta.colorBg
          } ${meta.colorBorder} ${meta.colorText} ${
            isSanitized ? 'font-semibold tracking-wide' : 'underline decoration-dotted'
          }`}
        >
          <span>{matchText}</span>
          <span className="text-[9px] font-sans uppercase font-bold px-1 py-0.2 rounded bg-surface-raised">
            {meta.label}
          </span>
        </mark>
      );

      lastIndex = ent.end;
    });

    // Remainder of text
    if (lastIndex < text.length) {
      segments.push(
        <span key="text-end">{text.substring(lastIndex)}</span>
      );
    }

    return <div className="whitespace-pre-wrap leading-relaxed">{segments}</div>;
  };

  return (
    <div data-accent={isSanitized ? 'email' : 'ipv6'} className="accent-card flex min-w-0 flex-col h-full rounded-2xl shadow-card overflow-hidden">
      {/* Panel Header */}
      <div className="px-4 py-2.5 bg-canvas/80 border-b border-border flex flex-wrap gap-2 items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="accent-ink text-sm font-semibold">
              {title}
            </h3>
            {isSanitized && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-raised text-primary border border-border flex items-center gap-1 shadow-xs">
                <CheckCircle2 className="w-3 h-3" />
                <span>{totalMatchesCount} matches redacted</span>
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted">
            {subtitle}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          {isCsv && csvData && (
            <div className="flex items-center bg-canvas rounded-lg p-0.5 text-[11px] border border-border">
              <button
                type="button"
                onClick={() => setViewMode('text')}
                className={`px-2 py-0.5 rounded font-medium transition-all ${
                  viewMode === 'text'
                    ? 'bg-surface text-ink shadow-xs font-semibold'
                    : 'text-muted hover:text-ink'
                }`}
              >
                Raw CSV
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-2 py-0.5 rounded font-medium transition-all ${
                  viewMode === 'table'
                    ? 'bg-surface text-ink shadow-xs font-semibold'
                    : 'text-muted hover:text-ink'
                }`}
              >
                Table View
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleCopy}
            disabled={!text}
            title="Copy to clipboard"
            aria-label={isSanitized ? 'Copy sanitized output' : 'Copy original input'}
            className="motion-control inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-border bg-surface text-ink hover:bg-canvas hover:-translate-y-0.5 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none transition-all shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {copyStatus === 'copied' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-muted" />
                <span>{copyStatus === 'error' ? 'Try again' : 'Copy'}</span>
              </>
            )}
          </button>
          <span role="status" className="sr-only">{copyStatus === 'copied' ? 'Copied to clipboard' : copyStatus === 'error' ? 'Could not copy to clipboard' : ''}</span>
        </div>
      </div>

      {/* Panel Body */}
      <div
        ref={scrollContainerRef}
        tabIndex={0}
        role="region"
        aria-label={`${title} content area`}
        className="flex-1 p-3 sm:p-4 overflow-y-auto max-h-[460px] font-mono text-xs text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {isCsv && viewMode === 'table' && csvData ? (
          <CsvTablePreview
            headers={csvData.headers}
            rows={csvData.rows}
            title={title}
          />
        ) : (
          renderHighlightedContent()
        )}
      </div>
    </div>
  );
};
