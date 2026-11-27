// @vitest-environment jsdom
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { ModeSelector } from '../components/ModeSelector';
import { Workspace } from '../components/Workspace';
import { parseCsv } from '../engine/csv';
import { MAX_UPLOAD_BYTES } from '../engine/inputLimits';
import { CsvPage } from '../pages/CsvPage';
import { PreferencesProvider } from '../state/PreferencesContext';
import { SessionProvider } from '../state/SessionContext';
import type { SanitizationMode } from '../types';

beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
  vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({
    media: query, matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn(),
  })));
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function renderScanner() {
  return render(
    <PreferencesProvider>
      <SessionProvider><Workspace demoTrigger={0} /></SessionProvider>
    </PreferencesProvider>,
  );
}

describe('Scanner workflow', () => {
  it('loads a sample and updates the accessible preview when changing the mode', () => {
    renderScanner();
    fireEvent.click(screen.getByRole('button', { name: 'Load Ticket Sample' }));
    expect(screen.getByText('9 matches detected.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Download sanitized TXT file' }).hasAttribute('disabled')).toBe(false);

    fireEvent.click(screen.getByRole('radio', { name: 'Pseudonymize' }));
    const result = within(screen.getByRole('region', { name: /sanitized result/i }));
    expect(result.getAllByText('EMAIL_01', { exact: true })).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Copy original input' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Copy sanitized output' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.getByRole('button', { name: 'Download sanitized TXT file' }).hasAttribute('disabled')).toBe(true);
  });

  it('rejects an oversized upload before reading it and preserves the current draft', () => {
    renderScanner();
    const input = screen.getByRole('textbox', { name: /raw input/i }) as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: 'maya@example.com' } });
    const fileReader = vi.spyOn(FileReader.prototype, 'readAsText');
    const oversize = new File([new ArrayBuffer(MAX_UPLOAD_BYTES + 1)], 'oversized.csv');
    fireEvent.change(screen.getByLabelText('Import .txt / .csv'), { target: { files: [oversize] } });
    expect(screen.getByRole('alert').textContent).toContain('exceeds 512 KB');
    expect(fileReader).not.toHaveBeenCalled();
    expect(input.value).toBe('maya@example.com');
    expect(input.getAttribute('spellcheck')).toBe('false');
  });
});

it('previews the CSV, sanitizes it, and offers a spreadsheet download', () => {
  render(<PreferencesProvider><SessionProvider><CsvPage /></SessionProvider></PreferencesProvider>);
  fireEvent.click(screen.getByRole('button', { name: 'Load CSV Sample' }));
  expect(screen.getByText(/Original CSV · 3 rows · 8 columns/)).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Download spreadsheet CSV' })).toBeNull();

  fireEvent.click(screen.getByRole('button', { name: 'Sanitize CSV' }));
  expect(screen.getByText('Sanitized CSV ready to download.')).toBeTruthy();
  expect(screen.getByText(/Sanitized CSV · 3 rows · 8 columns/)).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Download spreadsheet CSV' })).toBeTruthy();

  fireEvent.click(screen.getByRole('button', { name: 'Before' }));
  expect(screen.getByText(/Original CSV · 3 rows · 8 columns/)).toBeTruthy();
});

it('downloads sanitized CSV data and names the spreadsheet file distinctly', async () => {
  const files = vi.fn((blob: Blob) => `blob:test-${blob.size}`);
  const revoke = vi.fn();
  vi.stubGlobal('URL', class extends URL {
    static createObjectURL = files;
    static revokeObjectURL = revoke;
  });
  const names: string[] = [];
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    names.push(this.download);
  });

  render(<PreferencesProvider><SessionProvider><CsvPage /></SessionProvider></PreferencesProvider>);
  fireEvent.click(screen.getByRole('button', { name: 'Load CSV Sample' }));
  fireEvent.click(screen.getByRole('button', { name: 'Sanitize CSV' }));
  fireEvent.click(screen.getByRole('button', { name: 'Download sanitized CSV' }));
  fireEvent.click(screen.getByRole('button', { name: 'Download spreadsheet CSV' }));

  expect(names).toEqual(['support-tickets-sanitized.csv', 'support-tickets-sanitized-spreadsheet.csv']);
  for (const [blob] of files.mock.calls) {
    const text = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(blob);
    });
    expect(parseCsv(text)).toHaveLength(4);
    expect(text).toContain('[REDACTED]');
    expect(text).not.toContain('alex.morgan@cybersecure-vault.io');
  }
  await waitFor(() => expect(revoke).toHaveBeenCalledTimes(2));
});

it('supports arrow-key mode selection with one tab stop', () => {
  function TestModes() {
    const [mode, setMode] = useState<SanitizationMode>('FULL');
    return <ModeSelector mode={mode} onChange={setMode} />;
  }

  render(<TestModes />);
  const full = screen.getByRole('radio', { name: 'Full Mask' });
  const partial = screen.getByRole('radio', { name: 'Partial Mask' });
  const alias = screen.getByRole('radio', { name: 'Pseudonymize' });
  expect(full.tabIndex).toBe(0);
  expect(partial.tabIndex).toBe(-1);
  full.focus();
  fireEvent.keyDown(full, { key: 'ArrowRight' });
  expect(partial.getAttribute('aria-checked')).toBe('true');
  expect(document.activeElement).toBe(partial);
  fireEvent.keyDown(partial, { key: 'End' });
  expect(alias.getAttribute('aria-checked')).toBe('true');
  expect(document.activeElement).toBe(alias);
  fireEvent.keyDown(alias, { key: 'ArrowRight' });
  expect(document.activeElement).toBe(full);
});
