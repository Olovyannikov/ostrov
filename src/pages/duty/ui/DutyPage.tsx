import { useState, useEffect } from 'react';
import { Topbar } from '@/widgets/topbar';
import { cn } from '@/shared/lib';
import styles from './DutyPage.module.css';

// ---------------------------------------------------------------------------
// Static data
// ---------------------------------------------------------------------------

type EventSeverity = 'alarm' | 'warn';

interface AttentionEvent {
  id: number;
  severity: EventSeverity;
  message: string;
  meta: string;
  metaStrong?: string;
  time: string;
}

const ATTENTION_EVENTS: AttentionEvent[] = [
  {
    id: 1,
    severity: 'alarm',
    message: 'Критически низкий O₂ — бассейн Б-12',
    meta: 'Ардон · Группа АД-2 · Датчик O2-Б12 · Значение: ',
    metaStrong: '6.4 мг/л',
    time: '05:21',
  },
  {
    id: 2,
    severity: 'alarm',
    message: 'Нет связи с датчиком T-Б07',
    meta: 'Ардон · Группа АД-1 · Датчик температуры',
    time: '05:14',
  },
  {
    id: 3,
    severity: 'warn',
    message: 'Низкий O₂ — бассейн Б-31',
    meta: 'Ардон · Группа АД-3 · Датчик O2-Б31 · Значение: ',
    metaStrong: '7.2 мг/л',
    time: '04:58',
  },
  {
    id: 4,
    severity: 'warn',
    message: 'pH ниже нормы — бассейн Б-19',
    meta: 'Ардон · Группа АД-2 · Датчик pH-Б19 · Значение: ',
    metaStrong: '6.1',
    time: '04:43',
  },
];

type BasinStatus = 'alarm' | 'warn';

interface BasinParam {
  label: string;
  value: string;
  valueColor?: 'alarm' | 'warn' | 'ok' | 'muted';
}

interface Basin {
  id: string;
  status: BasinStatus;
  statusLabel: string;
  params: BasinParam[];
}

const BASINS: Basin[] = [
  {
    id: 'Б-12',
    status: 'alarm',
    statusLabel: 'Авария',
    params: [
      { label: 'O₂', value: '6.4', valueColor: 'alarm' },
      { label: 'T°C', value: '8.4' },
      { label: 'pH', value: '6.9' },
      { label: 'Корм', value: 'Вкл', valueColor: 'ok' },
    ],
  },
  {
    id: 'Б-31',
    status: 'warn',
    statusLabel: 'Внимание',
    params: [
      { label: 'O₂', value: '7.2', valueColor: 'warn' },
      { label: 'T°C', value: '8.1' },
      { label: 'pH', value: '7.0' },
      { label: 'Корм', value: 'Вкл', valueColor: 'ok' },
    ],
  },
  {
    id: 'Б-19',
    status: 'warn',
    statusLabel: 'Внимание',
    params: [
      { label: 'O₂', value: '8.6' },
      { label: 'T°C', value: '8.3' },
      { label: 'pH', value: '6.1', valueColor: 'warn' },
      { label: 'Корм', value: 'Вкл', valueColor: 'ok' },
    ],
  },
  {
    id: 'Б-07',
    status: 'warn',
    statusLabel: 'Сервис',
    params: [
      { label: 'O₂', value: '8.9' },
      { label: 'T°C', value: '—', valueColor: 'muted' },
      { label: 'pH', value: '7.1' },
      { label: 'Корм', value: 'Вкл', valueColor: 'ok' },
    ],
  },
];

type TimelineDot = 'alarm' | 'warn' | 'ok' | 'service';

interface TimelineItem {
  dot: TimelineDot;
  dotLabel: string;
  message: string;
  meta: string;
}

const TIMELINE: TimelineItem[] = [
  {
    dot: 'alarm',
    dotLabel: '!',
    message: 'Критически низкий O₂ в Б-12 — 6.4 мг/л',
    meta: '05:21 · Авария · Не принята',
  },
  {
    dot: 'alarm',
    dotLabel: '!',
    message: 'Нет связи с датчиком T-Б07',
    meta: '05:14 · Авария · Не принята',
  },
  {
    dot: 'warn',
    dotLabel: '▲',
    message: 'Низкий O₂ в Б-31 — 7.2 мг/л',
    meta: '04:58 · Предупреждение · Не принято',
  },
  {
    dot: 'warn',
    dotLabel: '▲',
    message: 'pH ниже нормы в Б-19 — 6.1',
    meta: '04:43 · Предупреждение · Принято Ивановым А.',
  },
  {
    dot: 'ok',
    dotLabel: '✓',
    message: 'O₂ в Б-44 вернулся в норму — 8.7 мг/л',
    meta: '03:31 · Восстановление',
  },
  {
    dot: 'service',
    dotLabel: 'S',
    message: 'Датчик T-Б07 переведён в сервис',
    meta: '02:15 · Сервис · Иванов А.',
  },
  {
    dot: 'ok',
    dotLabel: '→',
    message: 'Начало смены · Иванов А.И.',
    meta: '20:00 · Участок Ардон · 48 бассейнов',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getNow(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Shift indicator (topbar right slot)
// ---------------------------------------------------------------------------

function ShiftIndicator() {
  const [clock, setClock] = useState<string>(getNow);

  useEffect(() => {
    const id = setInterval(() => setClock(getNow()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={styles.shiftInfo}>
      <span className={styles.shiftDot} />
      <span>
        Смена активна · <strong>{clock}</strong> · осталось 2ч 13м
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function DutyPage() {
  const [accepted, setAccepted] = useState<Set<number>>(new Set());

  function accept(id: number) {
    setAccepted((prev) => new Set(prev).add(id));
  }

  return (
    <>
      <Topbar left={<span>Моя смена</span>} hideTimer right={<ShiftIndicator />} />

      <div className={styles.content}>
        {/* Greeting / shift summary */}
        <div className={styles.greetingCard}>
          <div className={styles.greetingLeft}>
            <h2>Сводка текущей смены</h2>
            <p>Смена 20:00–08:00 · Участок Ардон · 48 бассейнов под наблюдением</p>
          </div>
          <div className={styles.greetingStats}>
            <div className={cn(styles.gstat, styles.gstatAlarm)}>
              <div className={styles.gstatVal}>2</div>
              <div className={styles.gstatLbl}>Аварии</div>
            </div>
            <div className={cn(styles.gstat, styles.gstatWarn)}>
              <div className={styles.gstatVal}>4</div>
              <div className={styles.gstatLbl}>Внимание</div>
            </div>
            <div className={styles.gstat}>
              <div className={cn(styles.gstatVal, styles.gstatValBlue)}>42</div>
              <div className={styles.gstatLbl}>В норме</div>
            </div>
          </div>
        </div>

        {/* Top row: event list (span 2) + quick actions */}
        <div className={styles.topRow}>
          {/* Attention events — span 2 cols */}
          <div className={cn(styles.card, styles.cardSpan2)}>
            <div className={styles.sectionHdr}>
              <div className={styles.sectionTitle}>
                {/* triangle / alert icon inline */}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                </svg>
                Требуют внимания прямо сейчас
              </div>
              <span className={styles.sectionLink}>Все тревоги →</span>
            </div>

            <div className={styles.eventList}>
              {ATTENTION_EVENTS.map((ev) => (
                <div
                  key={ev.id}
                  className={cn(
                    styles.eventItem,
                    ev.severity === 'alarm' ? styles.eventAlarm : styles.eventWarn,
                    accepted.has(ev.id) && styles.eventDimmed
                  )}
                >
                  <div
                    className={cn(
                      styles.eventIcon,
                      ev.severity === 'alarm' ? styles.eventIconAlarm : styles.eventIconWarn
                    )}
                  />
                  <div className={styles.eventBody}>
                    <div className={styles.eventMsg}>{ev.message}</div>
                    <div className={styles.eventMeta}>
                      {ev.meta}
                      {ev.metaStrong && <strong>{ev.metaStrong}</strong>}
                    </div>
                    <div className={styles.eventActions}>
                      <button
                        className={cn(styles.btnSm, styles.btnAccept)}
                        disabled={accepted.has(ev.id)}
                        onClick={() => accept(ev.id)}
                        style={
                          accepted.has(ev.id)
                            ? { background: '#86efac', color: '#15803d' }
                            : undefined
                        }
                      >
                        {accepted.has(ev.id) ? 'Принято' : 'Принять'}
                      </button>
                      <button className={cn(styles.btnSm, styles.btnDetail)}>
                        Перейти к бассейну
                      </button>
                    </div>
                  </div>
                  <div className={styles.eventTime}>{ev.time}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className={styles.card}>
            <div className={styles.sectionHdr}>
              <div className={styles.sectionTitle}>
                {/* lightning bolt */}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                Быстрые действия
              </div>
            </div>

            <div className={styles.quickGrid}>
              <button className={cn(styles.qaBtn, styles.qaBtnAlert)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                </svg>
                Принять все
                <br />
                аварии
              </button>
              <button className={styles.qaBtn}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                Журнал
                <br />
                моей смены
              </button>
              <button className={styles.qaBtn}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                </svg>
                Схема
                <br />
                участка
              </button>
              <button className={styles.qaBtn}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <line x1="9" y1="21" x2="9" y2="9" />
                </svg>
                Сдать
                <br />
                смену
              </button>
            </div>

            {/* Shift interval progress */}
            <div className={styles.shiftInterval}>
              <div className={styles.shiftIntervalLabel}>Интервал смены</div>
              <div className={styles.o2BarBg}>
                <div className={styles.o2BarFill} />
              </div>
              <div className={styles.o2Label}>
                <span>20:00</span>
                <span className={styles.o2LabelCenter}>Осталось 2ч 13м</span>
                <span>08:00</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom row: basins + timeline */}
        <div className={styles.bottomRow}>
          {/* Basins with deviations */}
          <div className={styles.card}>
            <div className={styles.sectionHdr}>
              <div className={styles.sectionTitle}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" />
                  <path d="M16 7V5a2 2 0 0 0-4 0v2" />
                </svg>
                Мои бассейны с отклонениями
              </div>
              <span className={styles.sectionLink}>Все 48 →</span>
            </div>

            <div className={styles.basinGrid}>
              {BASINS.map((basin) => (
                <div
                  key={basin.id}
                  className={cn(
                    styles.basinCard,
                    basin.status === 'alarm' ? styles.basinAlarm : styles.basinWarn
                  )}
                >
                  <div className={styles.basinTop}>
                    <div className={styles.basinName}>{basin.id}</div>
                    <div
                      className={cn(
                        styles.basinStatus,
                        basin.status === 'alarm' ? styles.statusAlarm : styles.statusWarn
                      )}
                    >
                      {basin.statusLabel}
                    </div>
                  </div>
                  <div className={styles.basinParams}>
                    {basin.params.map((p) => (
                      <div key={p.label} className={styles.bparam}>
                        {p.label}{' '}
                        <strong
                          className={
                            p.valueColor === 'alarm'
                              ? styles.colorAlarm
                              : p.valueColor === 'warn'
                                ? styles.colorWarn
                                : p.valueColor === 'ok'
                                  ? styles.colorOk
                                  : p.valueColor === 'muted'
                                    ? styles.colorMuted
                                    : undefined
                          }
                        >
                          {p.value}
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div className={styles.card}>
            <div className={styles.sectionHdr}>
              <div className={styles.sectionTitle}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                Хронология смены
              </div>
              <span className={styles.sectionLink}>Полный журнал →</span>
            </div>

            <div className={styles.timeline}>
              {TIMELINE.map((item, i) => (
                <div key={i} className={styles.tlItem}>
                  <div
                    className={cn(
                      styles.tlDot,
                      item.dot === 'alarm'
                        ? styles.tlDotAlarm
                        : item.dot === 'warn'
                          ? styles.tlDotWarn
                          : item.dot === 'ok'
                            ? styles.tlDotOk
                            : styles.tlDotService
                    )}
                  >
                    {item.dotLabel}
                  </div>
                  <div className={styles.tlBody}>
                    <div className={styles.tlMsg}>{item.message}</div>
                    <div className={styles.tlMeta}>{item.meta}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
