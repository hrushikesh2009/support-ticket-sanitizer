import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { usePreferences } from '../state/PreferencesContext';

export function PageLayout({ title, description, accent = 'full', children }: { title: string; description: string; accent?: string; children: ReactNode }) {
  return (
    <section className="route-page" aria-labelledby="route-title">
      <div data-accent={accent} className="route-heading">
        <h1 id="route-title">{title}</h1>
        <p>{description}</p>
      </div>
      {children}
    </section>
  );
}

export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const { motionOff } = usePreferences();
  return (
    <motion.div className={className}
      initial={motionOff ? false : { opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: motionOff ? 0 : 0.36, delay: motionOff ? 0 : delay }}
    >{children}</motion.div>
  );
}
