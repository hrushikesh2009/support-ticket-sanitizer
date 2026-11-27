/**
 * Verification test suite for Support Ticket Sanitizer engine
 */
import { isValidLuhn } from '../engine/luhn';
import { detectAllCandidates, resolveOverlaps } from '../engine/detector';
import { sanitizeDocument } from '../engine/masker';
import { createSpreadsheetCsv, parseCsv, serializeCsv, sanitizeCsvDocument } from '../engine/csv';
import { SAMPLE_SUPPORT_TICKET } from '../engine/sampleTicket';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${msg}`);
  }
  console.log(`PASS: ${msg}`);
}

console.log('--- Running Engine Verification Tests ---');

// 1. Luhn Card Validation vs 16-digit Reference
const validCard = '4012 8888 8888 1881';
const invalidRef = '9876-5432-1098-7654';
assert(isValidLuhn(validCard), 'Luhn accepts valid 16-digit card 4012 8888 8888 1881');
assert(!isValidLuhn(invalidRef), 'Luhn rejects non-card 16-digit reference 9876-5432-1098-7654');

// 2. Detection in Sample Ticket
const candidates = detectAllCandidates(SAMPLE_SUPPORT_TICKET);
const resolved = resolveOverlaps(candidates);

const foundCard = resolved.some((c) => c.type === 'CARD' && c.raw.includes('4012 8888 8888 1881'));
const foundRefAsPII = resolved.some((c) => c.raw.includes('9876-5432-1098-7654'));
assert(foundCard, 'Card 4012 8888 8888 1881 detected as CARD');
assert(!foundRefAsPII, '16-digit reference 9876-5432-1098-7654 NOT detected as PII');

const emails = resolved.filter((c) => c.type === 'EMAIL');
assert(emails.length === 2, `Detected exactly 2 email occurrences (found: ${emails.length})`);

const pan = resolved.filter((c) => c.type === 'PAN');
assert(pan.length === 1 && pan[0].raw === 'ABCDE1234F', 'Detected PAN ABCDE1234F');

const aadhaar = resolved.filter((c) => c.type === 'AADHAAR');
assert(aadhaar.length === 1 && aadhaar[0].raw === '5489 1234 5678', 'Detected Aadhaar 5489 1234 5678');

const ipv4 = resolved.filter((c) => c.type === 'IPV4');
assert(ipv4.length === 1 && ipv4[0].raw === '192.168.1.105', 'Detected IPv4 192.168.1.105');

const ipv6 = resolved.filter((c) => c.type === 'IPV6');
assert(ipv6.length === 1 && ipv6[0].raw === '2001:0db8:85a3:0000:0000:8a2e:0370:7334', 'Detected IPv6');

// 3. Modes Verification
// A. Full Mask
const fullResult = sanitizeDocument(SAMPLE_SUPPORT_TICKET, 'FULL');
assert(fullResult.sanitizedText.includes('[REDACTED]'), 'Full Mask contains [REDACTED]');
assert(fullResult.sanitizedText.includes('9876-5432-1098-7654'), 'Full Mask keeps 16-digit reference untouched');
assert(!fullResult.sanitizedText.includes('4012 8888 8888 1881'), 'Full Mask redacts card');

// B. Partial Mask
const partialResult = sanitizeDocument(SAMPLE_SUPPORT_TICKET, 'PARTIAL');
assert(partialResult.sanitizedText.includes('1881'), 'Partial mask retains last 4 card digits (1881)');
assert(partialResult.sanitizedText.includes('ABCDE****F'), 'Partial mask retains PAN ABCDE****F');
assert(partialResult.sanitizedText.includes('9876-5432-1098-7654'), 'Partial mask keeps 16-digit reference untouched');

// C. Pseudonymize Mode
const pseudoResult = sanitizeDocument(SAMPLE_SUPPORT_TICKET, 'PSEUDONYMIZE');
const aliasOccurrences = (pseudoResult.sanitizedText.match(/EMAIL_01/g) || []).length;
assert(aliasOccurrences === 2, `Both email occurrences mapped to EMAIL_01 (found count: ${aliasOccurrences})`);
assert(pseudoResult.sanitizedText.includes('9876-5432-1098-7654'), 'Pseudonymize keeps 16-digit reference untouched');

// 4. CSV Preservation & RFC 4180
const csvRaw = 'Name,Notes,Phone,Email\n"Doe, John","Multi\nLine, with ""quotes""",+1 (555) 234-5678,alex.morgan@cybersecure-vault.io\n"Smith, Jane","Single line with, comma",+91 98765 43210,alex.morgan@cybersecure-vault.io\n';
const parsed = parseCsv(csvRaw);
assert(parsed.length === 3, 'Parsed 3 CSV rows (header + 2 records)');
assert(parsed[1][0] === 'Doe, John', 'Preserved quoted comma inside name field');
assert(parsed[1][1] === 'Multi\nLine, with "quotes"', 'Preserved newline and unescaped double quotes');
assert(parsed[2][0] === 'Smith, Jane', 'Preserved second row name');

const reserialized = serializeCsv(parsed);
assert(reserialized.includes('"Doe, John"'), 'Serialized CSV correctly quoted comma field');
assert(reserialized.includes('""quotes""'), 'Serialized CSV correctly re-escaped double quotes');

// Test Full Mask CSV
const csvSanitizedFull = sanitizeCsvDocument(csvRaw, 'FULL');
const reParsedFull = parseCsv(csvSanitizedFull.sanitizedText);
assert(reParsedFull.length === parsed.length, 'Row count strictly preserved after Full Mask');
assert(reParsedFull[0].length === 4 && reParsedFull[1].length === 4 && reParsedFull[2].length === 4, 'Column counts strictly preserved across all rows');
assert(reParsedFull[1][0] === 'Doe, John', 'Preserved non-sensitive field in row 1');
assert(reParsedFull[1][1] === 'Multi\nLine, with "quotes"', 'Preserved multiline cell in row 1');
assert(reParsedFull[1][2] === '[REDACTED]', 'Masked phone in row 1');
assert(reParsedFull[1][3] === '[REDACTED]', 'Masked email in row 1');

// Test Pseudonymize CSV across rows
const csvSanitizedPseudo = sanitizeCsvDocument(csvRaw, 'PSEUDONYMIZE');
const reParsedPseudo = parseCsv(csvSanitizedPseudo.sanitizedText);
assert(reParsedPseudo[1][3] === 'EMAIL_01', 'Row 1 email pseudonymized as EMAIL_01');
assert(reParsedPseudo[2][3] === 'EMAIL_01', 'Row 2 identical email also pseudonymized as EMAIL_01 across rows');

const spreadsheetSource = [['=Header', 'Notes'], [' \t＠Tag', 'Keep, these "quotes"'], ['Normal', 'First\nsecond']];
const spreadsheetCsv = createSpreadsheetCsv(serializeCsv(spreadsheetSource));
const spreadsheetRows = parseCsv(spreadsheetCsv);
assert(spreadsheetRows[0][0] === '[TEXT] =Header', 'Spreadsheet export prefixes formula-like headers');
assert(spreadsheetRows[1][0] === '[TEXT]  \t＠Tag', 'Spreadsheet export checks whitespace and full-width operators');
assert(spreadsheetRows[1][1] === spreadsheetSource[1][1] && spreadsheetRows[2][1] === spreadsheetSource[2][1], 'Spreadsheet export preserves ordinary values and multiline cells');
assert(spreadsheetCsv.startsWith('"[TEXT] =Header","Notes"'), 'Spreadsheet export quotes every field');

console.log('--- ALL TESTS PASSED SUCCESSFULLY! ---');
