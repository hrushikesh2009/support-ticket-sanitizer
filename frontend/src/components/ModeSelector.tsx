import type { KeyboardEvent } from 'react';
import { Asterisk, EyeOff, Hash } from 'lucide-react';
import type { SanitizationMode } from '../types';
import { MODES } from '../types/modes';

const icons = { FULL: EyeOff, PARTIAL: Asterisk, PSEUDONYMIZE: Hash };

export function ModeSelector({ mode, onChange }: { mode: SanitizationMode; onChange: (mode: SanitizationMode) => void }) {
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = MODES.findIndex(({ id }) => id === mode);
    let next: number;

    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        next = (index + MODES.length - 1) % MODES.length;
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        next = (index + 1) % MODES.length;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = MODES.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    onChange(MODES[next].id);
    event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]')[next]?.focus();
  }

  return (
    <div role="radiogroup" aria-label="Sanitization mode" onKeyDown={handleKeyDown}
      className="flex flex-col sm:flex-row items-stretch gap-1.5 p-1 bg-canvas border border-border rounded-xl">
      {MODES.map(({ id, label, example }) => {
        const Icon = icons[id];
        const selected = mode === id;
        return (
          <button key={id} type="button" role="radio" aria-checked={selected}
            tabIndex={selected ? 0 : -1} onClick={() => onChange(id)} data-accent={id.toLowerCase()}
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
