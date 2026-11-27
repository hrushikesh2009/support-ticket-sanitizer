import { Asterisk, EyeOff, Hash } from 'lucide-react';
import type { SanitizationMode } from '../types';
import { MODES } from '../types/modes';

const icons = { FULL: EyeOff, PARTIAL: Asterisk, PSEUDONYMIZE: Hash };

export function ModeSelector({ mode, onChange }: { mode: SanitizationMode; onChange: (mode: SanitizationMode) => void }) {
  return (
    <div role="group" aria-label="Sanitization mode" className="flex flex-col sm:flex-row items-stretch gap-1.5 p-1 bg-canvas border border-border rounded-xl">
      {MODES.map(({ id, label, example }) => {
        const Icon = icons[id];
        return (
          <button key={id} type="button" onClick={() => onChange(id)}
            aria-pressed={mode === id} data-accent={id.toLowerCase()}
            className="tinted-control motion-control border border-transparent flex-1 flex items-center justify-between sm:justify-center gap-2 min-h-10 px-3 py-1.5 rounded-lg text-sm font-semibold text-muted transition-all duration-200"
          >
            <span className="inline-flex items-center gap-1.5"><Icon size={14} aria-hidden="true" />{label}</span>
            <span className="text-[10px] font-mono hidden md:inline-block" aria-hidden="true">{example}</span>
          </button>
        );
      })}
    </div>
  );
}
