import { cn } from '@/shared/lib';
import styles from './StatusBadge.module.css';

export type Status = 'ok' | 'warn' | 'alarm' | 'service';

const LABEL: Record<Status, string> = {
  ok: 'Норма',
  warn: 'Внимание',
  alarm: 'Авария',
  service: 'Сервис',
};

interface StatusBadgeProps {
  status: Status;
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  return <span className={cn(styles.badge, styles[status])}>{label ?? LABEL[status]}</span>;
}
