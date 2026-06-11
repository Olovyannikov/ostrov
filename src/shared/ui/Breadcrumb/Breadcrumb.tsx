import { Link } from '@tanstack/react-router';
import styles from './Breadcrumb.module.css';

export interface Crumb {
  label: string;
  to?: string;
  params?: Record<string, string>;
}

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <div className={styles.breadcrumb}>
      {items.map((c, i) => (
        <span key={i} className={styles.row}>
          {c.to ? (
            <Link className={styles.link} to={c.to} params={c.params}>
              {c.label}
            </Link>
          ) : (
            <span className={styles.current}>{c.label}</span>
          )}
          {i < items.length - 1 && <span className={styles.sep}>›</span>}
        </span>
      ))}
    </div>
  );
}
