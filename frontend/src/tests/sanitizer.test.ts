import { describe, expect, it } from 'vitest';
import { detectAllCandidates, resolveOverlaps } from '../engine/detector';
import { isValidLuhn } from '../engine/luhn';
import { getPartialMask, sanitizeDocument } from '../engine/masker';
import { SAMPLE_SUPPORT_TICKET } from '../engine/sampleTicket';
import type { EntityType } from '../types';

const card = '4012 8888 8888 1881';
const reference = '9876-5432-1098-7654';

describe('Luhn validation', () => {
  it.each([card, '4111-1111-1111-1111'])('accepts a valid test card (%s)', (value) => {
    expect(isValidLuhn(value)).toBe(true);
  });
  it.each([reference, '', '1234'])('rejects a non-card or incomplete value (%s)', (value) => {
    expect(isValidLuhn(value)).toBe(false);
  });
});

describe('entity detection and overlap resolution', () => {
  it('finds all seven supported types in the fictional ticket', () => {
    const result = sanitizeDocument(SAMPLE_SUPPORT_TICKET, 'FULL');
    expect(result.counts).toEqual({ EMAIL: 2, PHONE: 2, IPV4: 1, IPV6: 1, PAN: 1, AADHAAR: 1, CARD: 1, TOTAL: 9 });
  });

  const examples: [EntityType, string][] = [
    ['EMAIL', 'maya@example.com'],
    ['PHONE', '+91 98765 43210'],
    ['IPV4', '192.0.2.42'],
    ['IPV6', '2001:db8::1'],
    ['IPV6', '2001:db8::'],
    ['IPV6', '::1'],
    ['PAN', 'ABCDE1234F'],
    ['AADHAAR', '5489 1234 5678'],
    ['CARD', card],
  ];
  it.each(examples)('detects %s and returns its original span', (type, value) => {
    const input = `Value: ${value}`;
    const match = resolveOverlaps(detectAllCandidates(input)).find((entity) => entity.type === type);
    expect(match?.raw).toBe(value);
    expect(input.slice(match?.start, match?.end)).toBe(value);
  });

  it('keeps the validated card and discards a weaker overlapping phone candidate', () => {
    const cardEntity = { type: 'CARD' as const, raw: card, start: 0, end: card.length };
    const phoneEntity = { type: 'PHONE' as const, raw: card.slice(0, 14), start: 0, end: 14 };
    expect(resolveOverlaps([phoneEntity, cardEntity])).toEqual([cardEntity]);
  });
});

describe('masking modes', () => {
  it.each(['FULL', 'PARTIAL', 'PSEUDONYMIZE'] as const)('%s removes the test card but preserves the non-card reference', (mode) => {
    const { sanitizedText } = sanitizeDocument(SAMPLE_SUPPORT_TICKET, mode);
    expect(sanitizedText).not.toContain(card);
    expect(sanitizedText).toContain(reference);
  });

  it('leaves non-sensitive text unchanged and returns no detections for empty input', () => {
    expect(sanitizeDocument('Review tomorrow', 'FULL').sanitizedText).toBe('Review tomorrow');
    expect(sanitizeDocument('', 'FULL').counts.TOTAL).toBe(0);
  });

  it('fully masks each detected span and keeps preview offsets accurate', () => {
    const result = sanitizeDocument(SAMPLE_SUPPORT_TICKET, 'FULL');
    for (const match of result.entities) {
      expect(result.originalText.slice(match.origStart, match.origEnd)).toBe(match.raw);
      expect(result.sanitizedText.slice(match.start, match.end)).toBe('[REDACTED]');
    }
  });

  it('keeps only the last four digits of a compact international phone number', () => {
    const phone = '+919876543210';
    expect(getPartialMask(phone, 'PHONE')).toBe('******3210');
    const result = sanitizeDocument(`Phone: ${phone}`, 'PARTIAL');
    expect(result.sanitizedText).toBe('Phone: ******3210');
  });

  it('keeps bounded fragments in Partial Mask mode', () => {
    const text = sanitizeDocument(SAMPLE_SUPPORT_TICKET, 'PARTIAL').sanitizedText;
    expect(text).toContain('**** **** **** 1881');
    expect(text).toContain('ABCDE****F');
    expect(getPartialMask('+91 98765 43210', 'PHONE')).toBe('+91 ******3210');
    expect(getPartialMask('+91.98765.43210', 'PHONE')).toBe('+91 ******3210');
    expect(getPartialMask('192.0.2.42', 'IPV4')).toBe('192.0.*.*');
  });

  it('reuses aliases for repeated emails and assigns another alias to distinct values', () => {
    const result = sanitizeDocument('maya@example.com MAYA@example.com tara@example.com', 'PSEUDONYMIZE');
    expect(result.sanitizedText).toBe('EMAIL_01 EMAIL_01 EMAIL_02');
  });
});
