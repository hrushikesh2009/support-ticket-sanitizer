import { Link, useNavigate } from 'react-router-dom';
import { FileSpreadsheet, ScanLine } from 'lucide-react';
import { Hero } from '../components/Hero';
import { Reveal } from '../components/PageLayout';

export function HomePage() {
  const navigate = useNavigate();
  return (
    <>
      <Hero onTryDemo={() => navigate('/scanner', { state: { demo: true } })} />
      <section className="home-start" aria-labelledby="quick-start">
        <h2 id="quick-start">Quick start</h2>
        <Reveal className="reference-grid" delay={0.08}>
          <Link to="/scanner" data-accent="ipv6" className="accent-card detail-card quick-link motion-control">
            <ScanLine size={22} className="accent-ink" aria-hidden="true" />
            <div><h3>Open Scanner</h3><p className="card-description">Paste a ticket or import a file to compare changes.</p></div>
          </Link>
          <Link to="/csv" data-accent="email" className="accent-card detail-card quick-link motion-control">
            <FileSpreadsheet size={22} className="accent-ink" aria-hidden="true" />
            <div><h3>Open CSV tools</h3><p className="card-description">Review detections by column before exporting.</p></div>
          </Link>
        </Reveal>
      </section>
    </>
  );
}
