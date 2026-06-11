import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Icon, type IconName } from '@/shared/ui';
import { cn, useSidebar } from '@/shared/lib';
import { ROUTES, sitePath } from '@/shared/config';
import { SITE_NAV } from '@/entities/site';
import styles from './Sidebar.module.css';

interface NavEntry {
  to: string;
  label: string;
  icon: IconName;
  badge?: string;
}

const TOP: NavEntry[] = [{ to: ROUTES.overview, label: 'Обзор хозяйства', icon: 'grid' }];
const DUTY: NavEntry = { to: ROUTES.duty, label: 'Моя смена', icon: 'user' };
const EVENTS: NavEntry[] = [
  { to: ROUTES.alerts, label: 'Тревоги', icon: 'alert', badge: '3' },
  { to: ROUTES.journal, label: 'Журнал событий', icon: 'file' },
];
const MANAGE: NavEntry[] = [
  { to: ROUTES.reports, label: 'Отчёты', icon: 'report' },
  { to: ROUTES.settings, label: 'Настройки', icon: 'settings' },
];

function Item({ entry, onNavigate }: { entry: NavEntry; onNavigate: () => void }) {
  return (
    <Link
      to={entry.to}
      onClick={onNavigate}
      className={styles.navItem}
      activeProps={{ className: cn(styles.navItem, styles.active) }}
    >
      <Icon name={entry.icon} className={styles.navIcon} />
      <span className={styles.navLabel}>{entry.label}</span>
      {entry.badge && <span className={styles.navBadge}>{entry.badge}</span>}
    </Link>
  );
}

export function Sidebar() {
  const { collapsed, mobileOpen, closeMobile } = useSidebar();
  const [sitesOpen, setSitesOpen] = useState(true);
  const dot = (s: string) =>
    s === 'ok' ? styles.dotOk : s === 'warn' ? styles.dotWarn : styles.dotAlarm;

  return (
    <aside
      className={cn(styles.sidebar, collapsed && styles.collapsed, mobileOpen && styles.mobileOpen)}
    >
      <div className={styles.logo}>
        <div className={styles.logoIcon}>
          <Icon name="layers" size={18} stroke="#fff" />
        </div>
        <div className={styles.logoText}>
          <div className={styles.logoName}>Остров</div>
          <div className={styles.logoSub}>Система мониторинга</div>
        </div>
      </div>

      <nav className={styles.nav}>
        <div className={styles.label}>Навигация</div>
        {TOP.map((e) => (
          <Item key={e.to} entry={e} onNavigate={closeMobile} />
        ))}

        <div className={cn(styles.group, sitesOpen && styles.groupOpen)}>
          <div className={styles.groupHeader} onClick={() => setSitesOpen((v) => !v)}>
            <Icon name="building" className={styles.navIcon} />
            <span className={styles.navLabel}>Участки</span>
            <Icon name="chevronRight" size={12} className={styles.chevron} />
          </div>
          <div className={styles.children}>
            {SITE_NAV.map((s) => (
              <Link
                key={s.id}
                to={sitePath(s.id)}
                onClick={closeMobile}
                className={styles.child}
                activeProps={{ className: cn(styles.child, styles.childActive) }}
              >
                <span className={cn(styles.childDot, dot(s.status))} />
                <span>{s.name}</span>
              </Link>
            ))}
          </div>
        </div>

        <Item entry={DUTY} onNavigate={closeMobile} />

        <div className={styles.divider} />
        <div className={styles.label}>События</div>
        {EVENTS.map((e) => (
          <Item key={e.to} entry={e} onNavigate={closeMobile} />
        ))}

        <div className={styles.divider} />
        <div className={styles.label}>Управление</div>
        {MANAGE.map((e) => (
          <Item key={e.to} entry={e} onNavigate={closeMobile} />
        ))}
      </nav>

      <div className={styles.footer}>
        <div className={styles.statusDot} />
        <div className={styles.statusText}>Система активна</div>
      </div>
    </aside>
  );
}
