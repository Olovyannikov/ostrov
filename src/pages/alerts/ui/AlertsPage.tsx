import { useState, useEffect, useRef, useCallback } from 'react';
import { Topbar } from '@/widgets/topbar';
import { Icon, Breadcrumb } from '@/shared/ui';
import { cn } from '@/shared/lib';
import { ALERT_EVENTS, type LogEvent } from '@/entities/event';
import { AckDialog, type AckResult } from '@/features/alarm/acknowledge';
import styles from './AlertsPage.module.css';

type AckMode = { type: 'one'; id: string } | { type: 'all' } | null;

type TabKey = 'all' | 'alarm' | 'warn' | 'service' | 'new';
type SortKey = 'priority' | 'time' | 'site';

const TYPE_LABEL: Record<string, string> = {
  alarm: '🔴 Авария',
  warn: '🟡 Предупреждение',
  service: '🔵 Сервис',
};

const SORT_LABELS: Record<SortKey, string> = {
  priority: 'По важности',
  time: 'По времени',
  site: 'По участку',
};

const PRIO: Record<string, number> = { alarm: 0, warn: 1, service: 2 };

const SITES = ['5 Озеро', 'Карджин', 'Ардон', 'Дарг Кох'];

function sortEvents(data: LogEvent[], sort: SortKey): LogEvent[] {
  return [...data].sort((a, b) => {
    if (sort === 'priority') {
      const pa = (a.accepted ? 10 : 0) + (PRIO[a.type] ?? 3);
      const pb = (b.accepted ? 10 : 0) + (PRIO[b.type] ?? 3);
      return pa !== pb ? pa - pb : b.time.localeCompare(a.time);
    }
    if (sort === 'time') return b.time.localeCompare(a.time);
    if (sort === 'site') return a.site.localeCompare(b.site, 'ru');
    return 0;
  });
}

export function AlertsPage() {
  const [events, setEvents] = useState<LogEvent[]>(() => ALERT_EVENTS.map((e) => ({ ...e })));
  const [tab, setTabState] = useState<TabKey>('all');
  const [site, setSite] = useState('');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('priority');
  const [page, setPage] = useState(5);
  const [sortOpen, setSortOpen] = useState(false);
  const [ackMode, setAckMode] = useState<AckMode>(null);
  const sortWrapRef = useRef<HTMLDivElement>(null);

  // Close sort dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (sortWrapRef.current && !sortWrapRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleTabChange = useCallback((t: TabKey) => {
    setTabState(t);
    setPage(5);
  }, []);

  const handleSortChange = useCallback((s: SortKey) => {
    setSort(s);
    setPage(5);
    setSortOpen(false);
  }, []);

  const handleSiteChange = useCallback((value: string) => {
    setSite(value);
    setPage(5);
  }, []);

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    setPage(5);
  }, []);

  const applyAck = useCallback(
    (result: AckResult) => {
      setEvents((prev) =>
        prev.map((e) => {
          const match =
            ackMode?.type === 'one'
              ? e.id === ackMode.id
              : ackMode?.type === 'all' && e.type === 'alarm' && !e.accepted;
          if (!match) return e;
          return {
            ...e,
            accepted: true,
            acceptedBy: result.employee,
            acceptedAt: result.at,
            comment: result.comment || undefined,
          };
        })
      );
      setAckMode(null);
    },
    [ackMode]
  );

  // Filtering
  const filtered = events.filter((e) => {
    if (tab === 'alarm' && e.type !== 'alarm') return false;
    if (tab === 'warn' && e.type !== 'warn') return false;
    if (tab === 'service' && e.type !== 'service') return false;
    if (tab === 'new' && e.accepted) return false;
    if (site && e.site !== site) return false;
    if (query) {
      const q = query.toLowerCase();
      if (![e.msg, e.sensor, e.basin, e.site].join(' ').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const sorted = sortEvents(filtered, sort);
  const total = sorted.length;
  const visible = sorted.slice(0, page);

  // Summary counts (from full events list)
  const cntAlarm = events.filter((e) => e.type === 'alarm').length;
  const cntWarn = events.filter((e) => e.type === 'warn').length;
  const cntService = events.filter((e) => e.type === 'service').length;
  // cntNew used only for tab count below; computed per-tab via tabCount('new')

  // Tab counts (from full events list, no tab filter applied, only site+query)
  function tabCount(t: TabKey): number {
    return events.filter((e) => {
      if (t === 'alarm' && e.type !== 'alarm') return false;
      if (t === 'warn' && e.type !== 'warn') return false;
      if (t === 'service' && e.type !== 'service') return false;
      if (t === 'new' && e.accepted) return false;
      return true;
    }).length;
  }

  const today = new Date().toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <>
      <Topbar
        left={
          <Breadcrumb
            items={[
              { label: 'Обзор хозяйства', to: '/overview' },
              { label: 'Тревоги и предупреждения' },
            ]}
          />
        }
      />

      <div className={styles.content}>
        {/* PAGE HEADER */}
        <div className={styles.pageHeader}>
          <div>
            <div className={styles.pageTitle}>Тревоги и предупреждения</div>
            <div className={styles.pageSubtitle}>Активные события по всем участкам · {today}</div>
          </div>
          <div className={styles.summaryChips}>
            <div className={cn(styles.schip, styles.schipAlarm)}>
              <span className={cn(styles.schipDot, styles.dotAlarm)} />
              {cntAlarm} Аварии
            </div>
            <div className={cn(styles.schip, styles.schipWarn)}>
              <span className={cn(styles.schipDot, styles.dotWarn)} />
              {cntWarn} Предупреждения
            </div>
            <div className={cn(styles.schip, styles.schipService)}>
              <span className={cn(styles.schipDot, styles.dotService)} />
              {cntService} Сервис
            </div>
          </div>
        </div>

        {/* FILTER BAR */}
        <div className={styles.filterBar}>
          {/* Tabs */}
          <div className={styles.tabGroup}>
            {(
              [
                ['all', 'Все'],
                ['alarm', 'Аварии'],
                ['warn', 'Предупреждения'],
                ['service', 'Сервис'],
                ['new', 'Не принятые'],
              ] as [TabKey, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                className={cn(styles.tabBtn, tab === key && styles.tabActive)}
                onClick={() => handleTabChange(key)}
              >
                {label}
                <span className={styles.tabCnt}>{tabCount(key)}</span>
              </button>
            ))}
          </div>

          <div className={styles.fDivider} />

          {/* Site select */}
          <select
            className={styles.siteSelect}
            value={site}
            onChange={(e) => handleSiteChange(e.target.value)}
          >
            <option value="">Все участки</option>
            {SITES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Search */}
          <div className={styles.searchWrap}>
            <Icon name="search" size={13} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              placeholder="Поиск…"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
            />
          </div>

          <span className={styles.fSpacer} />

          {/* Sort dropdown */}
          <div className={styles.sortWrap} ref={sortWrapRef}>
            <button className={styles.sortBtn} onClick={() => setSortOpen((o) => !o)}>
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="6" y1="12" x2="18" y2="12" />
                <line x1="9" y1="18" x2="15" y2="18" />
              </svg>
              <span>{SORT_LABELS[sort]}</span>
              <Icon name="chevronDown" size={13} />
            </button>
            {sortOpen && (
              <div className={styles.sortDropdown}>
                {(['priority', 'time', 'site'] as SortKey[]).map((s) => (
                  <button
                    key={s}
                    className={cn(styles.sortOpt, sort === s && styles.sortOptActive)}
                    onClick={() => handleSortChange(s)}
                  >
                    {sort === s ? (
                      <Icon name="check" size={14} />
                    ) : (
                      <span className={styles.sortOptCheck} />
                    )}
                    {SORT_LABELS[s]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <button className={styles.btnOutline} onClick={() => setAckMode({ type: 'all' })}>
            <Icon name="check" size={13} />
            Принять все аварии
          </button>
          <button className={styles.btnOutline}>
            <Icon name="download" size={13} />
            Экспорт
          </button>
        </div>

        {/* TABLE */}
        <div className={styles.eventsWrap}>
          <table className={styles.eventsTable}>
            <thead>
              <tr>
                <th>Тип</th>
                <th>Время</th>
                <th>Участок</th>
                <th>Группа / Бассейн</th>
                <th>Датчик / Объект</th>
                <th>Сообщение</th>
                <th>Значение</th>
                <th>Статус</th>
                <th>Действие</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((e) => (
                <tr key={e.id} className={cn(!e.accepted && e.type !== 'service' && styles.rowNew)}>
                  <td>
                    <span
                      className={cn(
                        styles.typeBadge,
                        e.type === 'alarm' && styles.typeAlarm,
                        e.type === 'warn' && styles.typeWarn,
                        e.type === 'service' && styles.typeService
                      )}
                    >
                      {TYPE_LABEL[e.type] ?? e.type}
                    </span>
                  </td>
                  <td className={styles.tdTime}>
                    <span className={styles.tdDate}>{e.date}</span>
                    <br />
                    <strong>{e.time}</strong>
                  </td>
                  <td>
                    <strong>{e.site}</strong>
                  </td>
                  <td className={styles.tdGroupBasin}>
                    <span className={styles.tdGroup}>{e.group}</span>
                    <br />
                    <strong>{e.basin}</strong>
                  </td>
                  <td className={styles.tdSensor}>{e.sensor}</td>
                  <td className={styles.tdMsg}>{e.msg}</td>
                  <td>
                    <code className={styles.valueCode}>{e.value}</code>
                  </td>
                  <td>
                    {e.accepted ? (
                      <span className={styles.statusAccepted}>
                        ✓ Принято
                        {e.acceptedBy && (
                          <>
                            <br />
                            <span className={styles.statusBy}>
                              {e.acceptedBy}
                              {e.acceptedAt ? ` · ${e.acceptedAt}` : ''}
                            </span>
                          </>
                        )}
                        {e.comment && (
                          <>
                            <br />
                            <span className={styles.statusComment} title={e.comment}>
                              «{e.comment}»
                            </span>
                          </>
                        )}
                      </span>
                    ) : (
                      <span className={styles.statusNew}>● Не принято</span>
                    )}
                  </td>
                  <td>
                    {e.type === 'service' ? (
                      <span className={styles.actionDash}>—</span>
                    ) : (
                      <button
                        className={styles.acceptBtn}
                        disabled={e.accepted}
                        onClick={() => !e.accepted && setAckMode({ type: 'one', id: e.id })}
                      >
                        {e.accepted ? '✓ Принято' : 'Принять'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {total === 0 && (
            <div className={styles.emptyState}>
              <svg
                className={styles.emptyIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>Событий не найдено</p>
            </div>
          )}

          <div className={styles.tableFooter}>
            <span className={styles.paginationInfo}>
              {total === 0 ? 'Нет событий' : `Показано ${Math.min(page, total)} из ${total}`}
            </span>
            {page < total && (
              <button className={styles.showMoreBtn} onClick={() => setPage((p) => p + 5)}>
                <Icon name="chevronDown" size={13} />
                Показать ещё
              </button>
            )}
            <span />
          </div>
        </div>
      </div>

      {ackMode && (
        <AckDialog
          title={ackMode.type === 'all' ? 'Принять все аварии' : 'Снятие тревоги'}
          onConfirm={applyAck}
          onCancel={() => setAckMode(null)}
        />
      )}
    </>
  );
}
