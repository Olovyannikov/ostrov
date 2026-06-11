import { createContext, useContext } from 'react';

interface SidebarContextValue {
  /** Desktop: sidebar collapsed to zero width. */
  collapsed: boolean;
  /** Mobile: off-canvas drawer is open. */
  mobileOpen: boolean;
  /** Toggle — collapses on desktop, opens/closes the drawer on mobile. */
  toggle: () => void;
  /** Close the mobile drawer (e.g. after navigating). */
  closeMobile: () => void;
}

export const SidebarContext = createContext<SidebarContextValue>({
  collapsed: false,
  mobileOpen: false,
  toggle: () => {},
  closeMobile: () => {},
});

export const useSidebar = () => useContext(SidebarContext);
