export type EntityType =
  | 'EMAIL'
  | 'PHONE'
  | 'IPV4'
  | 'IPV6'
  | 'PAN'
  | 'AADHAAR'
  | 'CARD';

export type SanitizationMode = 'FULL' | 'PARTIAL' | 'PSEUDONYMIZE';

export interface EntityCandidate {
  type: EntityType;
  raw: string;
  start: number;
  end: number;
}

export interface SanitizedEntitySpan {
  id: string;
  type: EntityType;
  raw: string;
  origStart: number;
  origEnd: number;
  start: number;
  end: number;
  replacement: string;
}

export type EntityCounts = Record<EntityType, number> & { TOTAL: number };

export interface ProcessedDocument {
  originalText: string;
  sanitizedText: string;
  entities: SanitizedEntitySpan[];
  counts: EntityCounts;
  aliasMap: Record<string, string>;
  isCsv: boolean;
  csvData?: {
    headers: string[];
    sanitizedHeaders: string[];
    columnCounts: Partial<Record<EntityType, number>>[];
    originalRows: string[][];
    sanitizedRows: string[][];
  };
}

export interface EntityMeta {
  label: string;
  colorBg: string;
  colorBorder: string;
  colorText: string;
  badgeBg: string;
  badgeText: string;
  description: string;
}

export { ENTITY_METADATA } from './entityMeta';
