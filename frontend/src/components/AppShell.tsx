import { useEffect, useRef, useState } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import { Menu, ShieldCheck } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Footer } from './Footer';
import { Sidebar } from './Sidebar';
import { usePreferences } from '../state/PreferencesContext';

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const main = useRef<HTMLElement>(null);
  const location = useLocation();
  const outlet = useOutlet();
  const { motionOff: reducedMotion } = usePreferences();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    main.current?.focus({ preventScroll: true });
  }, [location.pathname]);

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 900px)');
    const closeDrawer = () => {
      if (desktop.matches) dialog.current?.close();
    };
    desktop.addEventListener('change', closeDrawer);
    return () => desktop.removeEventListener('change', closeDrawer);
  }, []);

  return (
    <div className="app-shell" data-collapsed={collapsed}>
      <div className="cyber-backdrop" aria-hidden="true" />
      <a className="skip-link" href="#main-content" onClick={(event) => {
        event.preventDefault();
        main.current?.focus();
      }}>Skip to content</a>
      <div className="desktop-sidebar">
        <Sidebar variant="desktop" collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />
      </div>
      <header className="mobile-header">
        <button type="button" className="shell-icon-button" aria-label="Open navigation" onClick={() => dialog.current?.showModal()}>
          <Menu size={21} aria-hidden="true" />
        </button>
        <ShieldCheck size={19} className="text-primary" aria-hidden="true" />
        <span>Support Ticket Sanitizer</span>
      </header>
      <dialog ref={dialog} id="mobile-navigation" className="mobile-drawer" aria-label="Navigation"
        onClick={(event) => {
          if (event.target === event.currentTarget) dialog.current?.close();
        }}
      >
        <Sidebar variant="mobile" onClose={() => dialog.current?.close()} />
      </dialog>
      <div className="app-main">
        <main ref={main} id="main-content" tabIndex={-1} className="min-w-0 flex-1">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={location.pathname}
              initial={reducedMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? undefined : { opacity: 0, y: -4, transition: { duration: 0.1 } }}
              transition={{ duration: reducedMotion ? 0 : 0.18 }}
            >
              {outlet}
            </motion.div>
          </AnimatePresence>
        </main>
        <Footer />
      </div>
    </div>
  );
}
