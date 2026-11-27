import { EntityCandidate, EntityType } from '../types';
import { isValidLuhn } from './luhn';

/**
 * Regex Definitions for all targeted sensitive entities
 */

// 1. Email: Standard RFC-compliant address matching
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;

// 2. IPv4: Valid dotted-decimal quad (0-255 in each octet)
const IPV4_REGEX = /\b(?:(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\b/g;

// 3. IPv6: Full and compressed formats
const IPV6_REGEX = /\b(?:(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,7}:|(?:[0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,5}(?::[0-9a-fA-F]{1,4}){1,2}|(?:[0-9a-fA-F]{1,4}:){1,4}(?::[0-9a-fA-F]{1,4}){1,3}|(?:[0-9a-fA-F]{1,4}:){1,3}(?::[0-9a-fA-F]{1,4}){1,4}|(?:[0-9a-fA-F]{1,4}:){1,2}(?::[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:(?::[0-9a-fA-F]{1,4}){1,6}|:(?:(?::[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(?::[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]+|::(?:ffff(?::0{1,4}){0,1}:){0,1}(?:(?:25[0-5]|(?:2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(?:25[0-5]|(?:2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\b/g;

// 4. Indian PAN: 5 uppercase letters, 4 digits, 1 uppercase letter
const PAN_REGEX = /\b[A-Z]{5}[0-9]{4}[A-Z]\b/g;

// 5. Indian Aadhaar: 12 digits, cannot start with 0 or 1, grouped as 4 4 4 or continuous
const AADHAAR_REGEX = /\b[2-9][0-9]{3}[\s-]?[0-9]{4}[\s-]?[0-9]{4}\b/g;

// 6. Credit Card Candidates: 13 to 19 digits separated by spaces, dashes, or continuous
// Must be strictly filtered via Luhn algorithm
const CARD_CANDIDATE_REGEX = /\b(?:\d[ -]*?){13,19}\b/g;

// 7. Phone Numbers: International (+ prefix), Indian (+91/0/10-digit starting 6-9), US/UK standard
const PHONE_REGEX = /(?:(?:\+|00)\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{3,4}(?:[\s.-]?\d{1,4})?\b/g;

/**
 * Priority order for resolving overlapping entity spans.
 * Specific and validated entities take precedence over broad patterns.
 */
const TYPE_PRIORITY: Record<EntityType, number> = {
  CARD: 100,    // Validated by Luhn Mod-10
  EMAIL: 90,    // Distinct @ syntax
  IPV6: 80,     // Distinct hex-colon format
  IPV4: 70,     // Precise 4-octet boundaries
  AADHAAR: 60,  // Precise 12-digit Indian format
  PAN: 50,      // Distinct 5-letter, 4-num, 1-letter format
  PHONE: 40,    // Broader numeric sequence
};

/**
 * Detects all entity candidates in raw text
 */
export function detectAllCandidates(text: string): EntityCandidate[] {
  const candidates: EntityCandidate[] = [];

  // Helper to collect regex matches
  const collect = (
    regex: RegExp,
    type: EntityType,
    validator?: (val: string, start: number, end: number) => boolean
  ) => {
    regex.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      const raw = match[0];
      const start = match.index;
      const end = start + raw.length;

      if (validator && !validator(raw, start, end)) {
        continue;
      }

      candidates.push({
        type,
        raw,
        start,
        end,
      });
    }
  };

  // 1. Credit Card candidates (Validate with Luhn!)
  collect(CARD_CANDIDATE_REGEX, 'CARD', (val) => {
    return isValidLuhn(val);
  });

  // 2. Emails
  collect(EMAIL_REGEX, 'EMAIL');

  // 3. IPv6
  collect(IPV6_REGEX, 'IPV6');

  // 4. IPv4
  collect(IPV4_REGEX, 'IPV4', (val) => {
    const octets = val.split('.');
    return octets.length === 4 && octets.every((o) => parseInt(o, 10) <= 255);
  });

  // 5. Indian PAN
  collect(PAN_REGEX, 'PAN');

  // 6. Indian Aadhaar (Must be an isolated 12-digit number, not part of longer sequence)
  collect(AADHAAR_REGEX, 'AADHAAR', (val, start, end) => {
    const beforeChar = text[start - 1] || ' ';
    const afterChar = text[end] || ' ';
    if (/[\d-]/.test(beforeChar) || /[\d-]/.test(afterChar)) {
      return false;
    }
    const digits = val.replace(/\D/g, '');
    return digits.length === 12 && !digits.startsWith('0') && !digits.startsWith('1');
  });

  // 7. Phone Numbers (Ensure isolated phone sequence, not part of 16-digit card/ref or timestamp)
  collect(PHONE_REGEX, 'PHONE', (val, start, end) => {
    const beforeChar = text[start - 1] || ' ';
    const afterChar = text[end] || ' ';
    if (/[\d-]/.test(beforeChar) || /[\d-]/.test(afterChar)) {
      return false;
    }
    const digits = val.replace(/\D/g, '');
    if (digits.length < 7 || digits.length > 15) return false;
    if (/^(\d)\1+$/.test(digits)) return false;
    return true;
  });

  return candidates;
}

/**
 * Resolves overlapping detections so each span gets one label and is counted once.
 */
export function resolveOverlaps(candidates: EntityCandidate[]): EntityCandidate[] {
  const sorted = [...candidates].sort((a, b) => {
    // 1. Priority
    const prioDiff = TYPE_PRIORITY[b.type] - TYPE_PRIORITY[a.type];
    if (prioDiff !== 0) return prioDiff;

    // 2. Length (longer match first)
    const lenA = a.end - a.start;
    const lenB = b.end - b.start;
    const lenDiff = lenB - lenA;
    if (lenDiff !== 0) return lenDiff;

    // 3. Start position
    return a.start - b.start;
  });

  const accepted: EntityCandidate[] = [];

  for (const cand of sorted) {
    // Check if cand overlaps with any already accepted candidate
    const hasOverlap = accepted.some(
      (acc) => Math.max(cand.start, acc.start) < Math.min(cand.end, acc.end)
    );

    if (!hasOverlap) {
      accepted.push(cand);
    }
  }

  // Final order by position in text
  return accepted.sort((a, b) => a.start - b.start);
}
