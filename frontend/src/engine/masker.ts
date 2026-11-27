import {
  EntityType,
  ProcessedDocument,
  SanitizationMode,
  SanitizedEntitySpan,
} from '../types';
import { detectAllCandidates, resolveOverlaps } from './detector';
import { createEntityCounts } from './entityCounts';

/**
 * Produces a type-specific partial mask retaining safe, non-sensitive context fragments
 */
export function getPartialMask(raw: string, type: EntityType): string {
  switch (type) {
    case 'CARD': {
      const digits = raw.replace(/\D/g, '');
      const last4 = digits.slice(-4);
      if (raw.includes('-')) {
        return `****-****-****-${last4}`;
      } else if (raw.includes(' ')) {
        return `**** **** **** ${last4}`;
      }
      return `************${last4}`;
    }

    case 'AADHAAR': {
      const digits = raw.replace(/\D/g, '');
      const last4 = digits.slice(-4);
      if (raw.includes(' ')) {
        return `**** **** ${last4}`;
      }
      return `********${last4}`;
    }

    case 'PAN': {
      const clean = raw.trim().toUpperCase();
      if (clean.length === 10) {
        // e.g. ABCDE****F
        return `${clean.slice(0, 5)}****${clean.slice(9)}`;
      }
      return '*****' + clean.slice(-4);
    }

    case 'EMAIL': {
      const atIndex = raw.indexOf('@');
      if (atIndex > 1) {
        const user = raw.slice(0, atIndex);
        const domain = raw.slice(atIndex);
        const first = user[0];
        const last = user[user.length - 1];
        const maskedUser = user.length > 2 ? `${first}***${last}` : `${first}***`;
        return `${maskedUser}${domain}`;
      }
      return '***@***.***';
    }

    case 'PHONE': {
      const digits = raw.replace(/\D/g, '');
      const last4 = digits.slice(-4);
      // Retain a country code only when the input separates it from the local number.
      const countryCode = raw.match(/^\+\d{1,3}(?=[\s.(-])/)?.[0];
      return `${countryCode ? `${countryCode} ` : ''}******${last4}`;
    }

    case 'IPV4': {
      const parts = raw.split('.');
      if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.*.*`;
      }
      return '*.*.*.*';
    }

    case 'IPV6': {
      const parts = raw.split(':');
      if (parts.length >= 2) {
        return `${parts[0]}:${parts[1]}:****:****`;
      }
      return '****:****:****';
    }

    default:
      return '[REDACTED]';
  }
}

/**
 * Normalizes raw entity string for deterministic pseudonymization lookup
 */
function normalizeKey(raw: string, type: EntityType): string {
  switch (type) {
    case 'EMAIL':
    case 'IPV4':
    case 'IPV6':
    case 'PAN':
      return `${type}:${raw.trim().toLowerCase()}`;
    case 'CARD':
    case 'AADHAAR':
    case 'PHONE':
      // Strip spaces, dashes, parentheses to match identical phone/card numbers regardless of delimiter
      return `${type}:${raw.replace(/[\s\-().]/g, '')}`;
    default:
      return `${type}:${raw.trim()}`;
  }
}

/**
 * Generates an alias like EMAIL_01, PHONE_01, etc.
 */
function getAliasPrefix(type: EntityType): string {
  switch (type) {
    case 'CARD':
      return 'CARD';
    case 'EMAIL':
      return 'EMAIL';
    case 'IPV4':
    case 'IPV6':
      return 'IP';
    case 'PAN':
      return 'PAN';
    case 'AADHAAR':
      return 'AADHAAR';
    case 'PHONE':
      return 'PHONE';
    default:
      return 'ENTITY';
  }
}

/**
 * Core Sanitization function
 * Takes raw text and replaces detected entities according to the specified mode.
 * Supports persistent alias mapping across calls (essential for CSV processing).
 */
export function sanitizeDocument(
  text: string,
  mode: SanitizationMode,
  sharedAliasMap?: Map<string, string>,
  typeCounters?: Map<string, number>
): ProcessedDocument {
  const aliasMap = sharedAliasMap || new Map<string, string>();
  const counters = typeCounters || new Map<string, number>();

  const rawCandidates = detectAllCandidates(text);
  const resolvedCandidates = resolveOverlaps(rawCandidates);

  const counts = createEntityCounts();

  const entities: SanitizedEntitySpan[] = [];
  let sanitizedText = '';
  let lastIndex = 0;

  resolvedCandidates.forEach((cand, idx) => {
    // Append unchanged preceding text
    sanitizedText += text.substring(lastIndex, cand.start);

    // Update count
    counts[cand.type]++;
    counts.TOTAL++;

    let replacement = '';
    const normKey = normalizeKey(cand.raw, cand.type);

    if (mode === 'FULL') {
      replacement = '[REDACTED]';
    } else if (mode === 'PARTIAL') {
      replacement = getPartialMask(cand.raw, cand.type);
    } else if (mode === 'PSEUDONYMIZE') {
      if (aliasMap.has(normKey)) {
        replacement = aliasMap.get(normKey)!;
      } else {
        const prefix = getAliasPrefix(cand.type);
        const currentCount = (counters.get(prefix) || 0) + 1;
        counters.set(prefix, currentCount);
        const alias = `${prefix}_${currentCount.toString().padStart(2, '0')}`;
        aliasMap.set(normKey, alias);
        replacement = alias;
      }
    }

    const startInSanitized = sanitizedText.length;
    sanitizedText += replacement;
    const endInSanitized = sanitizedText.length;

    entities.push({
      id: `span-${idx}-${cand.start}`,
      type: cand.type,
      raw: cand.raw,
      origStart: cand.start,
      origEnd: cand.end,
      start: startInSanitized,
      end: endInSanitized,
      replacement,
    });

    lastIndex = cand.end;
  });

  // Append remaining text
  sanitizedText += text.substring(lastIndex);

  // Convert aliasMap to plain object
  const plainAliasMap: Record<string, string> = {};
  aliasMap.forEach((val, key) => {
    plainAliasMap[key] = val;
  });

  return {
    originalText: text,
    sanitizedText,
    entities,
    counts,
    aliasMap: plainAliasMap,
    isCsv: false,
  };
}
