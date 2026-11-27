import { EntityChip } from '../components/EntityChip';
import { PageLayout, Reveal } from '../components/PageLayout';
import { ENTITY_METADATA } from '../types';
import type { EntityType } from '../types';

const examples: Record<EntityType, string> = {
  EMAIL: 'maya@example.com',
  PHONE: '+1 (555) 234-5678',
  IPV4: '192.0.2.42',
  IPV6: '2001:db8::1',
  PAN: 'ABCDE1234F',
  AADHAAR: '5489 1234 5678',
  CARD: '4012 8888 8888 1881',
};
const types = Object.keys(ENTITY_METADATA) as EntityType[];

export function EntityTypesPage() {
  return (
    <PageLayout title="Entity types" accent="pseudonymize" description="Review the seven supported detectors and their example patterns.">
      <Reveal className="reference-grid">
        {types.map((type) => (
          <article className="accent-card detail-card reference-card" data-accent={type.toLowerCase()} key={type}>
            <h2><EntityChip type={type} /></h2>
            <p className="card-description">{type === 'AADHAAR' ? 'Numbers that match the 12-digit Aadhaar format.' : ENTITY_METADATA[type].description}</p>
            <code className="reference-example accent-ink">{examples[type]}</code>
            {type === 'CARD' && <p className="card-description">Card candidates must pass the Luhn checksum. The sample trace reference fails it.</p>}
          </article>
        ))}
      </Reveal>
    </PageLayout>
  );
}
