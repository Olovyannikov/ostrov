import type { ReactNode } from 'react';
import { Icon } from '@/shared/ui';
import { useUpdatedTimer, useSidebar } from '@/shared/lib';
import styles from './Topbar.module.css';

interface TopbarProps {
  /** Breadcrumb or title shown next to the hamburger. */
  left: ReactNode;
  /** Right-aligned content; defaults to the "обновлено N сек" ticker. */
  right?: ReactNode;
  /** When true, hide the default timer (used when right is fully custom). */
  hideTimer?: boolean;
}

export function Topbar({ left, right, hideTimer }: TopbarProps) {
  const { toggle } = useSidebar();
  const updated = useUpdatedTimer();
  return (
    <header className={styles.topbar}>
      <button className={styles.toggle} onClick={toggle} aria-label="Свернуть меню">
        <Icon name="menu" size={18} />
      </button>
      {left}
      <span className={styles.spacer} />
      {right}
      {!hideTimer && <span className={styles.updated}>{updated}</span>}
    </header>
  );
}
