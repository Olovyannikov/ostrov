import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/widgets/app-layout';
import { OverviewPage } from '@/pages/overview';
import { SitePage } from '@/pages/site';
import { BasinPage } from '@/pages/basin';
import { AlertsPage } from '@/pages/alerts';
import { JournalPage } from '@/pages/journal';
import { ReportsPage } from '@/pages/reports';
import { DutyPage } from '@/pages/duty';
import { SettingsPage } from '@/pages/settings';

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/overview" replace />} />
          <Route path="/overview" element={<OverviewPage />} />
          <Route path="/duty" element={<DutyPage />} />
          <Route path="/site/:siteId" element={<SitePage />} />
          <Route path="/basin/:basinId" element={<BasinPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/journal" element={<JournalPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/overview" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
