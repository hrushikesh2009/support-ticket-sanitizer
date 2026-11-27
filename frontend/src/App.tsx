import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { CsvPage } from './pages/CsvPage';
import { DashboardPage } from './pages/DashboardPage';
import { EntityTypesPage } from './pages/EntityTypesPage';
import { HomePage } from './pages/HomePage';
import { ModesPage } from './pages/ModesPage';
import { ScannerPage } from './pages/ScannerPage';
import { SettingsPage } from './pages/SettingsPage';
import { PreferencesProvider } from './state/PreferencesContext';
import { SessionProvider } from './state/SessionContext';
import './styles/shell.css';
import './styles/accents.css';
import './styles/pages.css';
import './styles/cyber-backdrop.css';

export default function App() {
  return (
    <PreferencesProvider>
      <SessionProvider>
        <HashRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<HomePage />} />
              <Route path="scanner" element={<ScannerPage />} />
              <Route path="csv" element={<CsvPage />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="modes" element={<ModesPage />} />
              <Route path="entity-types" element={<EntityTypesPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </HashRouter>
      </SessionProvider>
    </PreferencesProvider>
  );
}
