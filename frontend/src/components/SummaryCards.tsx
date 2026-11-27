import { Fingerprint, Layers3, SlidersHorizontal } from 'lucide-react';
import { ENTITY_METADATA } from '../types';
import type { EntityCounts, EntityType, SanitizationMode } from '../types';
import { MODES } from '../types/modes';
import { StatCard } from './StatCard';

const entityTypes = Object.keys(ENTITY_METADATA) as EntityType[];

export function SummaryCards({ counts, mode }: { counts: EntityCounts; mode: SanitizationMode }) {
  const activeTypes = entityTypes.filter((type) => counts[type] > 0).length;
  const currentMode = MODES.find(({ id }) => id === mode) ?? MODES[0];

  return (
    <div className="scanner-stats">
      <StatCard label="Matches detected" value={counts.TOTAL} accent="ipv6" icon={Fingerprint} />
      <StatCard label="Entity types found" value={activeTypes} description={`Of ${entityTypes.length} supported types`} accent="email" icon={Layers3} />
      <StatCard label="Active mode" value={currentMode.label} description={currentMode.example} accent={mode.toLowerCase()} icon={SlidersHorizontal} />
    </div>
  );
}
