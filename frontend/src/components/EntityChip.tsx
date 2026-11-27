import { ENTITY_METADATA } from '../types';
import type { EntityType } from '../types';

export function EntityChip({ type, count }: { type: EntityType; count?: number }) {
  const meta = ENTITY_METADATA[type];
  return (
    <span data-accent={type.toLowerCase()} className={`entity-chip ${meta.badgeBg} ${meta.badgeText}`}>
      {meta.label}{count !== undefined && <span className="font-mono">{count}</span>}
    </span>
  );
}
