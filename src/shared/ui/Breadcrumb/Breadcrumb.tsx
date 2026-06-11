import { Link } from 'react-router-dom';
import styles from './Breadcrumb.module.css';

export interface Crumb {
  label: string;
  to?: string;
}

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <div className={styles.breadcrumb}>
      {items.map((c, i) => (
        <span key={i} className={styles.row}>
          {c.to ? (
            <Link className={styles.link} to={c.to}>
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
