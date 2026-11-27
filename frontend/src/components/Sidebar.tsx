import { LayoutGroup, motion } from 'framer-motion';
import { BarChart3, FileSpreadsheet, Fingerprint, Home, Layers3, LockKeyhole, PanelLeftClose, PanelLeftOpen, ScanLine, Settings2, ShieldCheck, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { usePreferences } from '../state/PreferencesContext';

const links = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/scanner', label: 'Scanner', icon: ScanLine },
  { to: '/csv', label: 'CSV', icon: FileSpreadsheet },
  { to: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { to: '/modes', label: 'Modes', icon: Layers3 },
  { to: '/entity-types', label: 'Entity Types', icon: Fingerprint },
  { to: '/settings', label: 'Settings', icon: Settings2 },
];

interface SidebarProps {
  variant: 'desktop' | 'mobile';
  collapsed?: boolean;
  onToggle?: () => void;
  onClose?: () => void;
}

export function Sidebar({ variant, collapsed = false, onToggle, onClose }: SidebarProps) {
  const { motionOff } = usePreferences();
  return (
    <aside className="sidebar" data-icon-only={collapsed}>
      <div className="sidebar-brand">
        <span className="sidebar-logo"><ShieldCheck size={21} aria-hidden="true" /></span>
        <span className="sidebar-label">Support Ticket<br />Sanitizer</span>
        {variant === 'mobile' && <button type="button" className="shell-icon-button ml-auto" aria-label="Close navigation" onClick={onClose}><X size={20} /></button>}
      </div>
      <LayoutGroup id={variant}>
        <nav className="sidebar-nav" aria-label="Main navigation">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'} title={collapsed ? label : undefined} aria-label={label} onClick={onClose}>
              {({ isActive }) => <>
                {isActive && <motion.span className="nav-active-pill" layoutId={motionOff ? undefined : 'active-link'} transition={{ duration: motionOff ? 0 : 0.23 }} />}
                <Icon size={19} aria-hidden="true" />
                <span className="sidebar-label">{label}</span>
              </>}
            </NavLink>
          ))}
        </nav>
      </LayoutGroup>
      <div className="sidebar-footer">
        <span className="sidebar-privacy" title="Processed locally"><LockKeyhole size={17} aria-hidden="true" /><span className="sidebar-label">Processed locally</span></span>
        <ThemeToggle />
        {variant === 'desktop' && (
          <button type="button" className="sidebar-control" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} onClick={onToggle}>
            {collapsed ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}
            <span className="sidebar-label">Collapse sidebar</span>
          </button>
        )}
      </div>
    </aside>
  );
}
