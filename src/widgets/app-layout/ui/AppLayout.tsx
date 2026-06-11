import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { SidebarContext } from '@/shared/lib';
import styles from './AppLayout.module.css';

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <SidebarContext.Provider value={{ collapsed, toggle: () => setCollapsed((v) => !v) }}>
      <div className={styles.shell}>
        <Sidebar />
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </SidebarContext.Provider>
  );
}
