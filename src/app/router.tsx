import {
  createRootRoute,
  createRoute,
  createRouter,
  createHashHistory,
  redirect,
  Navigate,
} from '@tanstack/react-router';
import { AppLayout } from '@/widgets/app-layout';
import { OverviewPage } from '@/pages/overview';
import { SitePage } from '@/pages/site';
import { BasinPage } from '@/pages/basin';
import { AlertsPage } from '@/pages/alerts';
import { JournalPage } from '@/pages/journal';
import { ReportsPage } from '@/pages/reports';
import { DutyPage } from '@/pages/duty';
import { SettingsPage } from '@/pages/settings';

const rootRoute = createRootRoute({ component: AppLayout });

const route = (path: string, component: () => JSX.Element) =>
  createRoute({ getParentRoute: () => rootRoute, path, component });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/overview' });
  },
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  route('/overview', OverviewPage),
  route('/duty', DutyPage),
  route('/site/$siteId', SitePage),
  route('/basin/$basinId', BasinPage),
  route('/alerts', AlertsPage),
  route('/journal', JournalPage),
  route('/reports', ReportsPage),
  route('/settings', SettingsPage),
]);

export const router = createRouter({
  routeTree,
  history: createHashHistory(),
  defaultNotFoundComponent: () => <Navigate to="/overview" />,
});
