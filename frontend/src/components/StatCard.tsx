import { useEffect } from 'react';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { usePreferences } from '../state/PreferencesContext';

function Count({ value }: { value: number }) {
  const { motionOff } = usePreferences();
  const progress = useSpring(0, { stiffness: 125, damping: 26 });
  const display = useTransform(progress, (number) => Math.round(number).toLocaleString());

  useEffect(() => {
    if (motionOff) progress.jump(value);
    else progress.set(value);
  }, [motionOff, progress, value]);

  return <><span className="sr-only">{value.toLocaleString()}</span><motion.span aria-hidden="true">{display}</motion.span></>;
}

export function StatCard({ label, value, description, accent, icon: Icon }: {
  label: string; value: number | ReactNode; description?: string; accent: string; icon: LucideIcon;
}) {
  return (
    <article data-accent={accent} className="accent-card stat-card">
      <div className="stat-card-top"><span>{label}</span><span className="stat-icon accent-ink"><Icon size={19} aria-hidden="true" /></span></div>
      <div className="stat-value">{typeof value === 'number' ? <Count value={value} /> : value}</div>
      {description && <p>{description}</p>}
    </article>
  );
}
