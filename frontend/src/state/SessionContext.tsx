import { createContext, useCallback, useContext, useRef, useState } from 'react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import type { EntityCounts, SanitizationMode } from '../types';

export const EMPTY_COUNTS: EntityCounts = { EMAIL: 0, PHONE: 0, IPV4: 0, IPV6: 0, PAN: 0, AADHAAR: 0, CARD: 0, TOTAL: 0 };

export interface ScannerDraft {
  text: string;
  name: string;
  format: 'auto' | 'txt' | 'csv';
  mode: SanitizationMode;
}

export interface ScanRecord {
  id: number;
  source: 'Scanner' | 'CSV';
  scannedAt: number;
  counts: EntityCounts;
}

interface SessionContextValue {
  scanner: ScannerDraft;
  setScanner: Dispatch<SetStateAction<ScannerDraft>>;
  scans: ScanRecord[];
  recordScan: (source: ScanRecord['source'], counts: EntityCounts) => void;
  recordScanner: (text: string, format: string, counts: EntityCounts | undefined) => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [scanner, setScanner] = useState<ScannerDraft>({ text: '', name: 'ticket-sanitized.txt', format: 'auto', mode: 'FULL' });
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const nextId = useRef(0);
  const lastScanner = useRef<{ text: string; format: string }>();

  const recordScan = useCallback((source: ScanRecord['source'], counts: EntityCounts) => {
    const scan = { id: ++nextId.current, source, scannedAt: Date.now(), counts: { ...counts } };
    setScans((previous) => [scan, ...previous]);
  }, []);

  const recordScanner = useCallback((text: string, format: string, counts: EntityCounts | undefined) => {
    if (!counts) {
      lastScanner.current = undefined;
      return;
    }
    if (lastScanner.current?.text === text && lastScanner.current.format === format) return;
    lastScanner.current = { text, format };
    recordScan('Scanner', counts);
  }, [recordScan]);

  return <SessionContext.Provider value={{ scanner, setScanner, scans, recordScan, recordScanner }}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error('SessionProvider is required');
  return session;
}
