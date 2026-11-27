import { Link } from 'react-router-dom';
import { PageLayout, Reveal } from '../components/PageLayout';
import { sanitizeDocument } from '../engine/masker';
import { MODES } from '../types/modes';

const example = 'Contact maya@example.com. Follow up at maya@example.com.';

export function ModesPage() {
  return (
    <PageLayout title="Sanitization modes" description="Compare how each mode handles the same email appearing twice in a ticket.">
      <Reveal className="reference-grid">
        {MODES.map((mode) => (
          <article key={mode.id} data-accent={mode.id.toLowerCase()} className="accent-card detail-card reference-card">
            <h2>{mode.label}</h2>
            <p className="card-description">{mode.description}</p>
            <code className="reference-example accent-ink">{sanitizeDocument(example, mode.id).sanitizedText}</code>
            <p className="card-description">{mode.use}</p>
          </article>
        ))}
      </Reveal>
      <div><Link to="/scanner" className="route-action motion-control">Open Scanner</Link></div>
    </PageLayout>
  );
}
