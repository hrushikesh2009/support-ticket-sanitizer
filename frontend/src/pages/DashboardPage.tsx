import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, Files, Fingerprint, ScanLine } from 'lucide-react';
import { ChartCard } from '../components/ChartCard';
import { PageLayout, Reveal } from '../components/PageLayout';
import { StatCard } from '../components/StatCard';
import { EMPTY_COUNTS, useSession } from '../state/SessionContext';
import { usePreferences } from '../state/PreferencesContext';
import { ENTITY_METADATA } from '../types';
import type { EntityType } from '../types';

const types = Object.keys(ENTITY_METADATA) as EntityType[];
const timeFormat = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });

export function DashboardPage() {
  const { scans } = useSession();
  const { motionOff } = usePreferences();
  const totals = scans.reduce((counts, scan) => {
    for (const type of types) counts[type] += scan.counts[type];
    counts.TOTAL += scan.counts.TOTAL;
    return counts;
  }, { ...EMPTY_COUNTS });
  const activeTypes = types.filter((type) => totals[type] > 0);
  const topType = activeTypes.reduce<EntityType | undefined>(
    (top, type) => !top || totals[type] > totals[top] ? type : top, undefined,
  );
  const maxCount = topType ? totals[topType] : 1;
  let segmentStart = 0;
  const segments = activeTypes.map((type) => {
    const start = segmentStart;
    const end = start + totals[type] / totals.TOTAL * 100;
    segmentStart = end;
    return `var(--entity-${type.toLowerCase()}) ${start}% ${end}%`;
  });

  return (
    <PageLayout title="Dashboard" accent="ipv6" description="See what the Scanner and CSV tools have detected in this browser session.">
      <Reveal className="dashboard-stats">
        <StatCard label="Total matches" value={totals.TOTAL} accent="ipv6" icon={Fingerprint} />
        <StatCard label="Entity types found" value={activeTypes.length} description="Of 7 supported types" accent="email" icon={Activity} />
        <StatCard label="Scans this session" value={scans.length} accent="phone" icon={Files} />
        <StatCard label="Most common entity" value={topType ? ENTITY_METADATA[topType].label : '—'} accent={topType?.toLowerCase() ?? 'pan'} icon={ScanLine} />
      </Reveal>
      <Reveal className="dashboard-charts" delay={0.08}>
        <ChartCard title="Matches by entity type" description="Detection counts from this session." accent="ipv6">
          <ul className="chart-bars" aria-label="Matches by entity type">
            {types.map((type) => (
              <li key={type} data-accent={type.toLowerCase()}>
                <span>{ENTITY_METADATA[type].label}</span>
                <span className="bar-track" aria-hidden="true"><motion.span className="bar-fill"
                  style={{ width: `${totals[type] / maxCount * 100}%` }}
                  initial={motionOff ? false : { scaleX: 0 }} animate={{ scaleX: 1 }}
                  transition={{ duration: motionOff ? 0 : 0.48, ease: 'easeOut' }}
                /></span>
                <strong>{totals[type]}</strong>
              </li>
            ))}
          </ul>
        </ChartCard>
        <ChartCard title="Share by type" description="Each category’s share of detected matches." accent="pseudonymize">
          <div className="donut-layout">
            <div className="chart-donut" aria-hidden="true"
              style={segments.length ? { '--donut-segments': `conic-gradient(${segments.join(', ')})` } as CSSProperties : undefined}
            ><div><strong>{totals.TOTAL}</strong><span>matches</span></div></div>
            {activeTypes.length > 0 ? (
              <ul className="chart-legend" aria-label="Share by type">
                {activeTypes.map((type) => <li data-accent={type.toLowerCase()} key={type}>
                  <span className="legend-dot" aria-hidden="true" /><span>{ENTITY_METADATA[type].label}</span>
                  <strong>{Math.round(totals[type] / totals.TOTAL * 100)}%</strong>
                </li>)}
              </ul>
            ) : <p className="text-sm text-muted">Run a scan to see the breakdown.</p>}
          </div>
        </ChartCard>
      </Reveal>
      <Reveal delay={0.16}>
        <ChartCard title="Recent scans" description="Scan history stores counts and times for this session." accent="phone">
          {scans.length ? (
            <ul className="recent-scans">
              {scans.slice(0, 8).map((scan) => (
                <li key={scan.id}>
                  <strong>{scan.source} scan</strong>
                  <span>{scan.counts.TOTAL} {scan.counts.TOTAL === 1 ? 'match' : 'matches'}</span>
                  <time dateTime={new Date(scan.scannedAt).toISOString()}>{timeFormat.format(scan.scannedAt)}</time>
                </li>
              ))}
            </ul>
          ) : <Link className="route-action motion-control" to="/scanner">Open Scanner</Link>}
        </ChartCard>
      </Reveal>
    </PageLayout>
  );
}
