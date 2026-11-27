import type { ReactNode } from 'react';

export function ChartCard({ title, description, accent, children }: {
  title: string; description: string; accent: string; children: ReactNode;
}) {
  return (
    <section data-accent={accent} className="accent-card detail-card">
      <h2>{title}</h2>
      <p className="card-description">{description}</p>
      {children}
    </section>
  );
}
