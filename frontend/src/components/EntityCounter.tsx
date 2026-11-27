import React from 'react';
import { EntityCounts, EntityType, ENTITY_METADATA } from '../types';
import { Filter, Check } from 'lucide-react';

interface EntityCounterProps {
  counts: EntityCounts;
  selectedFilter: EntityType | 'ALL';
  onSelectFilter: (filter: EntityType | 'ALL') => void;
}

export const EntityCounter: React.FC<EntityCounterProps> = ({
  counts,
  selectedFilter,
  onSelectFilter,
}) => {
  const entityTypes: EntityType[] = ['EMAIL', 'PHONE', 'IPV4', 'IPV6', 'PAN', 'AADHAAR', 'CARD'];

  return (
    <div role="group" aria-label="Filter highlighted entity types" className="flex flex-wrap items-center gap-1.5 py-1">
      <div className="flex items-center gap-1 text-[11px] font-semibold text-muted mr-1">
        <Filter className="w-3 h-3 text-primary" />
        <span>Filter:</span>
      </div>

      {/* ALL Filter Badge */}
      <button
        type="button"
        onClick={() => onSelectFilter('ALL')}
        aria-pressed={selectedFilter === 'ALL'}
        className={`motion-control inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150 active:scale-[0.97] border ${
          selectedFilter === 'ALL'
            ? 'bg-primary text-primary-fg border-primary shadow-xs font-semibold'
            : 'bg-surface text-ink border-border hover:bg-canvas hover:border-border-strong'
        }`}
      >
        {selectedFilter === 'ALL' && <Check className="w-3 h-3" />}
        <span>All</span>
        <span
          className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
            selectedFilter === 'ALL' ? 'text-current' : 'bg-canvas text-muted'
          }`}
        >
          {counts.TOTAL}
        </span>
      </button>

      {/* Category Filter Badges */}
      {entityTypes.map((type) => {
        const meta = ENTITY_METADATA[type];
        const count = counts[type];
        const isSelected = selectedFilter === type;

        return (
          <button
            key={type}
            type="button"
            onClick={() => onSelectFilter(isSelected ? 'ALL' : type)}
            title={`${meta.label}: ${count} detected. Click to filter preview.`}
            aria-pressed={isSelected}
            data-accent={type.toLowerCase()}
            className={`tinted-control motion-control inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150 active:scale-[0.97] border ${
              isSelected
                ? 'ring-2 ring-primary border-primary font-bold shadow-xs ' + meta.badgeBg + ' ' + meta.badgeText
                : count > 0
                ? meta.badgeBg + ' ' + meta.badgeText + ' border-border/80 hover:border-border-strong'
                : 'bg-surface text-muted border-border'
            }`}
          >
            {isSelected && <Check className="w-3 h-3" />}
            <span>{meta.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                count > 0 ? 'bg-surface-raised text-current' : 'bg-canvas text-muted'
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
