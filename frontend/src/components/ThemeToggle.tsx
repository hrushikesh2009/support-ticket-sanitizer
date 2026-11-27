import { Moon, Sun } from 'lucide-react';
import { usePreferences } from '../state/PreferencesContext';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = usePreferences();
  const dark = resolvedTheme === 'dark';
  const Icon = dark ? Sun : Moon;
  const nextTheme = dark ? 'light' : 'dark';

  return (
    <button type="button" className="sidebar-control" aria-label={`Switch to ${nextTheme} mode`} onClick={() => setTheme(nextTheme)}>
      <Icon size={19} aria-hidden="true" />
      <span className="sidebar-label">{dark ? 'Light theme' : 'Dark theme'}</span>
    </button>
  );
}
