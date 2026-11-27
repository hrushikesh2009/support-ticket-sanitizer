import { Moon, SlidersHorizontal, Sparkles } from 'lucide-react';
import { PageLayout, Reveal } from '../components/PageLayout';
import { usePreferences } from '../state/PreferencesContext';
import type { ThemePreference } from '../state/PreferencesContext';
import { useSession } from '../state/SessionContext';
import type { SanitizationMode } from '../types';
import { MODES } from '../types/modes';

export function SettingsPage() {
  const { theme, setTheme, reduceMotion, setReduceMotion, defaultMode, setDefaultMode } = usePreferences();
  const { setScanner } = useSession();

  return (
    <PageLayout title="Settings" accent="partial" description="Set your preferences for this browser session.">
      <Reveal className="settings-stack">
        <div data-accent="ipv6" className="accent-card detail-card settings-row">
          <div className="settings-copy"><Moon size={20} className="accent-ink" aria-hidden="true" />
            <div><label htmlFor="theme-preference">Theme</label><p className="card-description">Choose light, dark, or your device’s setting.</p></div>
          </div>
          <select className="settings-select" id="theme-preference" value={theme} onChange={(event) => setTheme(event.target.value as ThemePreference)}>
            <option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option>
          </select>
        </div>
        <div data-accent="phone" className="accent-card detail-card settings-row">
          <div className="settings-copy"><Sparkles size={20} className="accent-ink" aria-hidden="true" />
            <div><label htmlFor="reduce-motion">Reduce motion</label><p className="card-description">Turn off animations. Your device’s reduced-motion setting also applies.</p></div>
          </div>
          <input type="checkbox" role="switch" id="reduce-motion" className="settings-switch" checked={reduceMotion}
            onChange={(event) => setReduceMotion(event.target.checked)} />
        </div>
        <div data-accent="pseudonymize" className="accent-card detail-card settings-row">
          <div className="settings-copy"><SlidersHorizontal size={20} className="accent-ink" aria-hidden="true" />
            <div><label htmlFor="default-mode">Default sanitization mode</label><p className="card-description">Start new scans with this mode.</p></div>
          </div>
          <select className="settings-select" id="default-mode" value={defaultMode} onChange={(event) => {
            const mode = event.target.value as SanitizationMode;
            setDefaultMode(mode);
            setScanner((draft) => draft.text.trim() ? draft : { ...draft, mode });
          }}>
            {MODES.map((mode) => <option value={mode.id} key={mode.id}>{mode.label}</option>)}
          </select>
        </div>
      </Reveal>
    </PageLayout>
  );
}
