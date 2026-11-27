import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { MotionConfig } from 'framer-motion';
import type { SanitizationMode } from '../types';

export type ThemePreference = 'system' | 'light' | 'dark';

interface Preferences {
  theme: ThemePreference;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: ThemePreference) => void;
  reduceMotion: boolean;
  setReduceMotion: (reduce: boolean) => void;
  motionOff: boolean;
  defaultMode: SanitizationMode;
  setDefaultMode: (mode: SanitizationMode) => void;
}

const PreferencesContext = createContext<Preferences | null>(null);

function useSystemPreference(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    media.addEventListener('change', update);
    update();
    return () => media.removeEventListener('change', update);
  }, [query]);
  return matches;
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemePreference>('system');
  const [reduceMotion, setReduceMotion] = useState(false);
  const [defaultMode, setDefaultMode] = useState<SanitizationMode>('FULL');
  const systemDark = useSystemPreference('(prefers-color-scheme: dark)');
  const systemReduced = useSystemPreference('(prefers-reduced-motion: reduce)');
  const resolvedTheme = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;
  const motionOff = reduceMotion || systemReduced;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', resolvedTheme === 'dark');
    root.dataset.motion = motionOff ? 'off' : 'on';
    root.style.colorScheme = resolvedTheme;
  }, [resolvedTheme, motionOff]);

  return (
    <PreferencesContext.Provider value={{ theme, resolvedTheme, setTheme, reduceMotion, setReduceMotion, motionOff, defaultMode, setDefaultMode }}>
      <MotionConfig reducedMotion={motionOff ? 'always' : 'never'}>{children}</MotionConfig>
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const preferences = useContext(PreferencesContext);
  if (!preferences) throw new Error('PreferencesProvider is required');
  return preferences;
}
