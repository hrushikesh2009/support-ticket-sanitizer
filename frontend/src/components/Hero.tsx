import { LockKeyhole } from 'lucide-react';
import { AnimatedHeading } from './AnimatedHeading';
import { ContourBackground } from './ContourBackground';

export function Hero({ onTryDemo }: { onTryDemo: () => void }) {
  return (
    <section className="hero-layout mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-labelledby="hero-title">
      <div className="hero-frame">
        <ContourBackground />
        <div className="hero-lock" aria-hidden="true">
          <div className="hero-lock-tile"><LockKeyhole strokeWidth={1.3} /></div>
        </div>
        <div className="hero-copy">
          <p className="hero-kicker">Browser-only redaction</p>
          <AnimatedHeading />
          <p className="hero-description">
            Redact sensitive details before handing support tickets to engineering.
            Compare the results and download a clean copy in your browser.
          </p>
          <button type="button" className="hero-action motion-control" onClick={onTryDemo}>Try demo</button>
        </div>
      </div>
    </section>
  );
}
