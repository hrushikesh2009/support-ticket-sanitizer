import { LockKeyhole } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border py-5 text-sm text-muted">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <span>Support Ticket Sanitizer · PromptWars</span>
        <span className="inline-flex items-center gap-2">
          <LockKeyhole size={15} className="text-primary" aria-hidden="true" />
          Review the sanitized result before sharing.
        </span>
      </div>
    </footer>
  );
}
