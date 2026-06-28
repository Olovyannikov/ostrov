import { useState } from 'react';
import { cn } from '@/shared/lib';
import styles from './AckDialog.module.css';

export interface AckResult {
  /** Сотрудник, снявший тревогу (фамилия). */
  employee: string;
  /** Комментарий к снятию (может быть пустым). */
  comment: string;
  /** Время снятия в формате ЧЧ:ММ. */
  at: string;
}

const OPERATORS = ['Иванов А.', 'Петров В.', 'Сидоров Н.'];

function nowHHMM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

interface AckDialogProps {
  title?: string;
  onConfirm: (result: AckResult) => void;
  onCancel: () => void;
}

export function AckDialog({ title = 'Снятие тревоги', onConfirm, onCancel }: AckDialogProps) {
  const [employee, setEmployee] = useState('');
  const [comment, setComment] = useState('');

  const canConfirm = employee.trim().length > 0;

  function confirm() {
    if (!canConfirm) return;
    onConfirm({ employee: employee.trim(), comment: comment.trim(), at: nowHHMM() });
  }

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className={styles.modal}>
        <div className={styles.hdr}>
          <span>{title}</span>
          <button className={styles.close} onClick={onCancel}>
            ×
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.field}>
            <div className={styles.label}>Сотрудник, снявший тревогу *</div>
            <input
              className={styles.input}
              placeholder="Фамилия И.О."
              value={employee}
              onChange={(e) => setEmployee(e.target.value)}
              autoFocus
            />
            <div className={styles.quickRow}>
              {OPERATORS.map((op) => (
                <button key={op} className={styles.quickBtn} onClick={() => setEmployee(op)}>
                  {op}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <div className={styles.label}>Комментарий</div>
            <textarea
              className={styles.textarea}
              placeholder="Причина, принятые меры…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className={styles.ftr}>
          <button className={cn(styles.btn, styles.btnOutline)} onClick={onCancel}>
            Отмена
          </button>
          <button
            className={cn(styles.btn, styles.btnPrimary)}
            disabled={!canConfirm}
            onClick={confirm}
          >
            Подтвердить снятие
          </button>
        </div>
      </div>
    </div>
  );
}
