import { useCallback, useState } from 'react';
import { Outlet } from '@tanstack/react-router';
import { Sidebar } from './Sidebar';
import { SidebarContext } from '@/shared/lib';
import styles from './AppLayout.module.css';

const MOBILE_QUERY = '(max-width: 768px)';

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggle = useCallback(() => {
    if (window.matchMedia(MOBILE_QUERY).matches) setMobileOpen((v) => !v);
    else setCollapsed((v) => !v);
  }, []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return (
    <SidebarContext.Provider value={{ collapsed, mobileOpen, toggle, closeMobile }}>
      <div className={styles.shell}>
        <Sidebar />
        {mobileOpen && <div className={styles.backdrop} onClick={closeMobile} />}
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </SidebarContext.Provider>
  );
}
