/** Central route path registry. Used by the router and the navigation widget. */
export const ROUTES = {
  home: '/',
  overview: '/overview',
  duty: '/duty',
  site: '/site/:siteId',
  basin: '/basin/:basinId',
  alerts: '/alerts',
  journal: '/journal',
  reports: '/reports',
  settings: '/settings',
} as const;

export const sitePath = (siteId: string) => `/site/${siteId}`;
export const basinPath = (basinId: string | number) => `/basin/${basinId}`;
