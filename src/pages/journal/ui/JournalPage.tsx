import { useState, useMemo, useCallback } from 'react';
import { Topbar } from '@/widgets/topbar';
import { Breadcrumb } from '@/shared/ui';
import { cn } from '@/shared/lib';
import { JOURNAL_EVENTS } from '@/entities/event';
import type { LogEvent } from '@/entities/event';
import styles from './JournalPage.module.css';

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

type TabType = 'all' | 'alarm' | 'warn' | 'service' | 'ok';
type SortCol = 'type' | 'time' | 'site' | 'accepted';
type SortDir = 1 | -1;
type Preset = 'today' | '3d' | '7d' | '30d' | 'custom';

// ──────────────────────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 15;

const TYPE_LABEL: Record<LogEvent['type'], string> = {
  alarm: '🔴 Авария',
  warn: '🟡 Предупреждение',
  service: '🔵 Сервис',
  ok: '🟢 Восстановление',
};

const TYPE_CSS_CLASS: Record<LogEvent['type'], string> = {
  alarm: styles.typeAlarm,
  warn: styles.typeWarn,
  service: styles.typeService,
  ok: styles.typeOk,
};

const OPERATORS = ['Иванов А.', 'Петров В.', 'Сидоров Н.', 'Система'];
const SITES = ['5 Озеро', 'Карджин', 'Ардон', 'Дарг Кох'];

const PRESETS: { id: Preset; label: string }[] = [
  { id: 'today', label: 'Сегодня' },
  { id: '3d', label: '3 дня' },
  { id: '7d', label: '7 дней' },
  { id: '30d', label: '30 дней' },
  { id: 'custom', label: 'Произвольный' },
];

const CSV_COLS: (keyof LogEvent)[] = [
  'id',
  'date',
  'time',
  'type',
  'site',
  'group',
  'basin',
  'sensor',
  'msg',
  'value',
  'accepted',
  'acceptedBy',
  'acceptedAt',
];

const CSV_HEADERS = [
  'ID',
  'Дата',
  'Время',
  'Тип',
  'Участок',
  'Группа',
  'Бассейн',
  'Датчик',
  'Сообщение',
  'Значение',
  'Принято',
  'Кто принял',
  'Время принятия',
];

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

function getSortValue(event: LogEvent, col: SortCol): string | number {
  if (col === 'accepted') return event.accepted ? 1 : 0;
  if (col === 'time') return `${event.date} ${event.time}`;
  return event[col] ?? '';
}

function buildCSV(data: LogEvent[]): string {
  const rows = [CSV_HEADERS, ...data.map((e) => CSV_COLS.map((c) => JSON.stringify(e[c] ?? '')))];
  return rows.map((r) => r.join(',')).join('\n');
}

function triggerDownload(content: string, filename: string, mime: string): void {
  const blob = new Blob(['﻿' + content], { type: mime });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ──────────────────────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────────────────────

export function JournalPage() {
  const [tab, setTab] = useState<TabType>('all');
  const [sortCol, setSortCol] = useState<SortCol>('time');
  const [sortDir, setSortDir] = useState<SortDir>(-1);
  const [page, setPage] = useState(PAGE_SIZE);
  const [search, setSearch] = useState('');
  const [site, setSite] = useState('');
  const [operator, setOperator] = useState('');
  const [preset, setPreset] = useState<Preset>('today');
  const [dateFrom, setDateFrom] = useState('2026-06-11');
  const [dateTo, setDateTo] = useState('2026-06-11');

  // Counts (always from full dataset)
  const counts = useMemo(
    () => ({
      all: JOURNAL_EVENTS.length,
      alarm: JOURNAL_EVENTS.filter((e) => e.type === 'alarm').length,
      warn: JOURNAL_EVENTS.filter((e) => e.type === 'warn').length,
      service: JOURNAL_EVENTS.filter((e) => e.type === 'service').length,
      ok: JOURNAL_EVENTS.filter((e) => e.type === 'ok').length,
    }),
    []
  );

  const resetPage = useCallback(() => setPage(PAGE_SIZE), []);

  const handleTabChange = useCallback(
    (t: TabType) => {
      setTab(t);
      resetPage();
    },
    [resetPage]
  );

  const handleFilterChange = useCallback(
    <T,>(setter: (v: T) => void) =>
      (v: T) => {
        setter(v);
        resetPage();
      },
    [resetPage]
  );

  const handleSort = useCallback(
    (col: SortCol) => {
      if (sortCol === col) {
        setSortDir((d) => (d === 1 ? -1 : 1));
      } else {
        setSortCol(col);
        setSortDir(-1);
      }
    },
    [sortCol]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return JOURNAL_EVENTS.filter((e) => {
      if (tab !== 'all' && e.type !== tab) return false;
      if (site && e.site !== site) return false;
      if (operator && e.acceptedBy !== operator) return false;
      if (q && ![e.msg, e.sensor, e.basin, e.site].join(' ').toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [tab, site, operator, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const va = getSortValue(a, sortCol);
      const vb = getSortValue(b, sortCol);
      if (va < vb) return sortDir;
      if (va > vb) return -sortDir;
      return 0;
    });
  }, [filtered, sortCol, sortDir]);

  const visible = sorted.slice(0, page);
  const total = sorted.length;

  const handleExportCSV = useCallback(() => {
    const csv = buildCSV(filtered);
    const date = new Date().toISOString().slice(0, 10);
    triggerDownload(csv, `journal_${date}.csv`, 'text/csv;charset=utf-8');
  }, [filtered]);

  // Sort arrow indicator
  function sortArrow(col: SortCol) {
    if (sortCol !== col) return <span className={styles.sortArrow}>↕</span>;
    return (
      <span className={cn(styles.sortArrow, styles.sortArrowActive)}>
        {sortDir === -1 ? '↓' : '↑'}
      </span>
    );
  }

  const breadcrumb = (
    <Breadcrumb
      items={[{ label: 'Обзор хозяйства', to: '/overview' }, { label: 'Журнал событий' }]}
    />
  );

  return (
    <>
      <Topbar left={breadcrumb} />

      <div className={styles.content}>
        {/* ── Page header ──────────────────────────────────────────────────── */}
        <div className={styles.pageHeader}>
          <div>
            <div className={styles.pageTitle}>Журнал событий</div>
            <div className={styles.pageSubtitle}>Полная история событий по всем участкам</div>
          </div>
          <div className={styles.headerStats}>
            <div className={styles.hstat}>
              <div className={styles.hstatVal}>{counts.all}</div>
              <div className={styles.hstatLbl}>Всего событий</div>
            </div>
            <div className={styles.hstat}>
              <div className={cn(styles.hstatVal, styles.valAlarm)}>{counts.alarm}</div>
              <div className={styles.hstatLbl}>Аварий</div>
            </div>
            <div className={styles.hstat}>
              <div className={cn(styles.hstatVal, styles.valWarn)}>{counts.warn}</div>
              <div className={styles.hstatLbl}>Предупреждений</div>
            </div>
            <div className={styles.hstat}>
              <div className={cn(styles.hstatVal, styles.valOk)}>{counts.ok}</div>
              <div className={styles.hstatLbl}>Восстановлений</div>
            </div>
          </div>
        </div>

        {/* ── Filter bar ────────────────────────────────────────────────────── */}
        <div className={styles.filterBar}>
          {/* Row 1: tabs + search + export */}
          <div className={styles.filterRow}>
            <div className={styles.tabGroup}>
              {(
                [
                  { id: 'all' as TabType, label: 'Все' },
                  { id: 'alarm' as TabType, label: 'Аварии' },
                  { id: 'warn' as TabType, label: 'Предупреждения' },
                  { id: 'service' as TabType, label: 'Сервис' },
                  { id: 'ok' as TabType, label: 'Восстановление' },
                ] satisfies { id: TabType; label: string }[]
              ).map((t) => (
                <button
                  key={t.id}
                  className={cn(styles.tabBtn, tab === t.id && styles.tabBtnActive)}
                  onClick={() => handleTabChange(t.id)}
                >
                  {t.label}
                  <span className={styles.tc}>{counts[t.id]}</span>
                </button>
              ))}
            </div>

            <div className={styles.fDivider} />

            <div className={styles.searchWrap}>
              <svg
                className={styles.searchIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                className={styles.searchInput}
                placeholder="Поиск по сообщению, датчику…"
                value={search}
                onChange={(e) => handleFilterChange(setSearch)(e.target.value)}
              />
            </div>

            <div className={styles.fSpacer} />

            <button className={cn(styles.btn, styles.btnOutline)} onClick={handleExportCSV}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Экспорт CSV
            </button>

            <button className={cn(styles.btn, styles.btnOutline)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              Экспорт Excel
            </button>
          </div>

          {/* Row 2: date range + site + operator */}
          <div className={styles.filterRow}>
            <span className={styles.fLbl}>Период:</span>

            <div className={styles.datePresets}>
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  className={cn(styles.preset, preset === p.id && styles.presetActive)}
                  onClick={() => setPreset(p.id)}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {preset === 'custom' && (
              <span className={styles.customDates}>
                <input
                  type="date"
                  className={styles.dateInput}
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
                <span className={styles.dateSep}>—</span>
                <input
                  type="date"
                  className={styles.dateInput}
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </span>
            )}

            <div className={styles.fDivider} />
            <span className={styles.fLbl}>Участок:</span>
            <select
              className={styles.select}
              value={site}
              onChange={(e) => handleFilterChange(setSite)(e.target.value)}
            >
              <option value="">Все</option>
              {SITES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <div className={styles.fDivider} />
            <span className={styles.fLbl}>Оператор:</span>
            <select
              className={styles.select}
              value={operator}
              onChange={(e) => handleFilterChange(setOperator)(e.target.value)}
            >
              <option value="">Все</option>
              {OPERATORS.map((op) => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Table ────────────────────────────────────────────────────────── */}
        <div className={styles.tableWrap}>
          <table className={styles.jtable}>
            <thead>
              <tr>
                <th
                  className={cn(sortCol === 'type' && styles.sorted)}
                  onClick={() => handleSort('type')}
                >
                  Тип {sortArrow('type')}
                </th>
                <th
                  className={cn(sortCol === 'time' && styles.sorted)}
                  onClick={() => handleSort('time')}
                >
                  Дата / Время {sortArrow('time')}
                </th>
                <th
                  className={cn(sortCol === 'site' && styles.sorted)}
                  onClick={() => handleSort('site')}
                >
                  Участок {sortArrow('site')}
                </th>
                <th>Группа / Бассейн</th>
                <th>Датчик</th>
                <th>Сообщение</th>
                <th>Значение</th>
                <th
                  className={cn(sortCol === 'accepted' && styles.sorted)}
                  onClick={() => handleSort('accepted')}
                >
                  Статус {sortArrow('accepted')}
                </th>
                <th>Принял</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((e) => (
                <tr
                  key={e.id}
                  className={cn(
                    !e.accepted && e.type !== 'ok' && e.type !== 'service' && styles.rowNew
                  )}
                >
                  <td>
                    <span className={cn(styles.typeBadge, TYPE_CSS_CLASS[e.type])}>
                      {TYPE_LABEL[e.type]}
                    </span>
                  </td>
                  <td className={styles.tdTime}>
                    <span className={styles.dateStr}>{e.date}</span>
                    <br />
                    <strong>{e.time}</strong>
                  </td>
                  <td>
                    <strong>{e.site}</strong>
                  </td>
                  <td className={styles.tdGroupBasin}>
                    <span className={styles.groupName}>{e.group}</span>
                    <br />
                    <span className={styles.basinName}>{e.basin}</span>
                  </td>
                  <td className={styles.tdSensor}>{e.sensor}</td>
                  <td className={styles.tdMsg}>{e.msg}</td>
                  <td>
                    <code className={styles.valueCode}>{e.value || '—'}</code>
                  </td>
                  <td>
                    {e.accepted ? (
                      <span className={styles.statusAccepted}>✓ Принято</span>
                    ) : (
                      <span className={styles.statusPending}>● Не принято</span>
                    )}
                  </td>
                  <td className={styles.tdAcceptedBy}>
                    {e.acceptedBy || '—'}
                    <br />
                    <span className={styles.acceptedAt}>{e.acceptedAt || ''}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {total === 0 && (
            <div className={styles.emptyState}>
              <p>Событий не найдено</p>
            </div>
          )}

          <div className={styles.tableFooter}>
            <span className={styles.pageInfo}>
              {total === 0 ? 'Нет событий' : `Показано ${Math.min(page, total)} из ${total}`}
            </span>
            {page < total && (
              <button className={styles.showMoreBtn} onClick={() => setPage((p) => p + PAGE_SIZE)}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  width="13"
                  height="13"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
                Показать ещё
              </button>
            )}
            <span />
          </div>
        </div>
      </div>
    </>
  );
}
