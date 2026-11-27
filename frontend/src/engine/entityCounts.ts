import type { EntityCounts } from '../types';

export function createEntityCounts(): EntityCounts {
  return {
    EMAIL: 0,
    PHONE: 0,
    IPV4: 0,
    IPV6: 0,
    PAN: 0,
    AADHAAR: 0,
    CARD: 0,
    TOTAL: 0,
  };
}
