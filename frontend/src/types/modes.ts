import type { SanitizationMode } from './index';

export const MODES = [
  { id: 'FULL', label: 'Full Mask', example: '[REDACTED]', description: 'Replace each detected value with one fixed placeholder.', use: 'Use when the recipient only needs the surrounding text.' },
  { id: 'PARTIAL', label: 'Partial Mask', example: '**** 1881', description: 'Keep a few characters to help identify a value without showing it in full.', use: 'Use when the recipient needs a fragment, such as the last four card digits.' },
  { id: 'PSEUDONYMIZE', label: 'Pseudonymize', example: 'EMAIL_01', description: 'Assign an alias and reuse it every time the same value appears in the document.', use: 'Use when the recipient needs to follow repeated references, including across CSV rows.' },
] as const satisfies ReadonlyArray<{ id: SanitizationMode; label: string; example: string; description: string; use: string }>;
