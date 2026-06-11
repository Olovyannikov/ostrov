import { useState, useEffect, useRef } from 'react';
import { Topbar } from '@/widgets/topbar';
import { Icon, Breadcrumb } from '@/shared/ui';
import { cn } from '@/shared/lib';
import styles from './ReportsPage.module.css';

// ─── Static data ─────────────────────────────────────────────────────────────

const REPORT_TYPES = [
  { id: 'summary', name: 'Сводный по хозяйству', desc: 'Все участки, агрегированные показатели' },
  { id: 'site', name: 'По участку', desc: 'Детальные данные одного участка' },
  { id: 'events', name: 'По событиям', desc: 'Аварии и предупреждения за период' },
  { id: 'feed', name: 'По кормлению', desc: 'Активность кормушек, расход корма' },
] as const;

type ReportTypeId = (typeof REPORT_TYPES)[number]['id'];

const SITE_LIST = [
  { id: 'ardon', name: 'Ардон', pools: '48 бассейнов' },
  { id: 'kardzhin', name: 'Карджин', pools: '36 бассейнов' },
  { id: 'dargkokh', name: 'Дарг Кох', pools: '24 бассейна' },
  { id: 'ozero', name: '5 Озеро', pools: '27 бассейнов' },
] as const;

type SiteId = (typeof SITE_LIST)[number]['id'];

const PARAM_LIST = [
  { id: 'o2', label: 'O₂ (мг/л)', defaultOn: true },
  { id: 'temp', label: 'Температура', defaultOn: true },
  { id: 'ph', label: 'pH', defaultOn: true },
  { id: 'nh4', label: 'NH4', defaultOn: false },
  { id: 'alarms', label: 'Аварии', defaultOn: true },
  { id: 'feeders', label: 'Кормушки', defaultOn: false },
] as const;

type ParamId = (typeof PARAM_LIST)[number]['id'];

const O2_DATA = [8.9, 8.7, 8.4, 7.8, 8.6, 9.1, 8.8];
const ALARM_DATA = [1, 3, 5, 4, 2, 1, 1];

interface SiteRow {
  name: string;
  pools: number;
  o2avg: number;
  o2min: number;
  tavg: number;
  phavg: number;
  alarms: number;
  warnings: number;
  status: 'ok' | 'warn' | 'alarm';
  statusLabel: string;
}

const DETAIL_ROWS: SiteRow[] = [
  {
    name: 'Ардон',
    pools: 48,
    o2avg: 9.1,
    o2min: 7.8,
    tavg: 8.4,
    phavg: 7.2,
    alarms: 2,
    warnings: 5,
    status: 'ok',
    statusLabel: 'Норма',
  },
  {
    name: 'Карджин',
    pools: 36,
    o2avg: 5.8,
    o2min: 4.9,
    tavg: 8.7,
    phavg: 6.1,
    alarms: 9,
    warnings: 11,
    status: 'alarm',
    statusLabel: 'Аварии',
  },
  {
    name: 'Дарг Кох',
    pools: 24,
    o2avg: 8.6,
    o2min: 7.1,
    tavg: 8.2,
    phavg: 6.4,
    alarms: 4,
    warnings: 6,
    status: 'warn',
    statusLabel: 'Внимание',
  },
  {
    name: '5 Озеро',
    pools: 27,
    o2avg: 9.4,
    o2min: 8.2,
    tavg: 8.1,
    phavg: 7.0,
    alarms: 2,
    warnings: 3,
    status: 'ok',
    statusLabel: 'Норма',
  },
];

// ─── Period preset logic (fixed today = 2026-06-11) ──────────────────────────

const TODAY = new Date('2026-06-11');

function fmt(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function applyPreset(preset: string): { from: string; to: string } {
  const d2 = new Date(TODAY);
  const d1 = new Date(TODAY);
  if (preset === 'yesterday') {
    d1.setDate(d1.getDate() - 1);
    d2.setDate(d2.getDate() - 1);
  } else if (preset === '7d') {
    d1.setDate(d1.getDate() - 7 + 1);
  } else if (preset === '30d') {
    d1.setDate(d1.getDate() - 30 + 1);
  } else if (preset === 'month') {
    d1.setDate(1);
  }
  // 'today' and 'custom' fall through: from = to = today
  return { from: fmt(d1), to: fmt(d2) };
}

// ─── Types ────────────────────────────────────────────────────────────────────

type PreviewState = 'empty' | 'generating' | 'report';

// ─── Component ────────────────────────────────────────────────────────────────

export function ReportsPage() {
  const [reportType, setReportType] = useState<ReportTypeId>('summary');
  const [preset, setPreset] = useState('7d');
  const [dateFrom, setDateFrom] = useState('2026-06-05');
  const [dateTo, setDateTo] = useState('2026-06-11');
  const [sites, setSites] = useState<Set<SiteId>>(
    new Set(['ardon', 'kardzhin', 'dargkokh', 'ozero'])
  );
  const [params, setParams] = useState<Set<ParamId>>(
    new Set(PARAM_LIST.filter((p) => p.defaultOn).map((p) => p.id))
  );
  const [preview, setPreview] = useState<PreviewState>('empty');

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, []);

  function handlePresetChange(value: string) {
    setPreset(value);
    if (value !== 'custom') {
      const range = applyPreset(value);
      setDateFrom(range.from);
      setDateTo(range.to);
    }
  }

  function toggleSite(id: SiteId) {
    setSites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleParam(id: ParamId) {
    setParams((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleGenerate() {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    setPreview('generating');
    timerRef.current = setTimeout(() => {
      setPreview('report');
      timerRef.current = null;
    }, 1600);
  }

  function handleDownloadCSV() {
    const header = 'Участок,Бассейнов,O2 ср,O2 мин,T ср,pH ср,Аварий,Предупр';
    const rows = DETAIL_ROWS.map(
      (r) =>
        `${r.name},${r.pools},${r.o2avg},${r.o2min},${r.tavg},${r.phavg},${r.alarms},${r.warnings}`
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'otchet_' + new Date().toISOString().slice(0, 10) + '.csv';
    a.click();
  }

  function handleDownloadExcel() {
    window.alert('Генерация Excel — функция будет доступна в финальной версии');
  }

  function handleDownloadPDF() {
    window.alert('Генерация PDF — функция будет доступна в финальной версии');
  }

  const breadcrumb = (
    <Breadcrumb items={[{ label: 'Обзор хозяйства', to: '/overview' }, { label: 'Отчёты' }]} />
  );

  return (
    <>
      <Topbar left={breadcrumb} />

      <div className={styles.content}>
        {/* ── LEFT COLUMN ── */}
        <div className={styles.colLeft}>
          {/* Report type */}
          <div className={styles.card}>
            <div className={styles.cardTitle}>
              <Icon name="file" size={15} />
              Тип отчёта
            </div>
            <div className={styles.reportTypes}>
              {REPORT_TYPES.map((rt) => (
                <div
                  key={rt.id}
                  className={cn(styles.rtype, reportType === rt.id && styles.rtypeSelected)}
                  onClick={() => setReportType(rt.id)}
                >
                  <div className={styles.rtypeRadio} />
                  <div>
                    <div className={styles.rtypeName}>{rt.name}</div>
                    <div className={styles.rtypeDesc}>{rt.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Period */}
          <div className={styles.card}>
            <div className={styles.cardTitle}>
              {/* calendar inline SVG */}
              <svg
                width={15}
                height={15}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Период
            </div>
            <div className={styles.fGroup}>
              <div className={styles.fLabel}>Быстрый выбор</div>
              <select
                className={styles.select}
                value={preset}
                onChange={(e) => handlePresetChange(e.target.value)}
              >
                <option value="today">Сегодня</option>
                <option value="yesterday">Вчера</option>
                <option value="7d">Последние 7 дней</option>
                <option value="30d">Последние 30 дней</option>
                <option value="month">Текущий месяц</option>
                <option value="custom">Произвольный период</option>
              </select>
            </div>
            <div className={styles.fGroup}>
              <div className={styles.fLabel}>С</div>
              <input
                className={styles.dateInput}
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPreset('custom');
                }}
              />
            </div>
            <div className={cn(styles.fGroup, styles.fGroupLast)}>
              <div className={styles.fLabel}>По</div>
              <input
                className={styles.dateInput}
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPreset('custom');
                }}
              />
            </div>
          </div>

          {/* Sites */}
          <div className={styles.card}>
            <div className={styles.cardTitle}>
              <Icon name="building" size={15} />
              Участки
            </div>
            <div className={styles.siteList}>
              {SITE_LIST.map((s) => (
                <div
                  key={s.id}
                  className={cn(styles.siteItem, sites.has(s.id) && styles.siteItemChecked)}
                  onClick={() => toggleSite(s.id)}
                >
                  <div className={styles.siteCheck} />
                  <span>{s.name}</span>
                  <span className={styles.sitePools}>{s.pools}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Parameters */}
          <div className={styles.card}>
            <div className={styles.cardTitle}>
              <Icon name="activity" size={15} />
              Параметры
            </div>
            <div className={styles.checkGrid}>
              {PARAM_LIST.map((p) => (
                <div
                  key={p.id}
                  className={cn(styles.checkItem, params.has(p.id) && styles.checkItemChecked)}
                  onClick={() => toggleParam(p.id)}
                >
                  <div className={styles.checkDot} />
                  {p.label}
                </div>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <button className={styles.btnGenerate} onClick={handleGenerate}>
            <svg
              width={14}
              height={14}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="5 12 12 5 19 12" />
              <polyline points="5 19 12 12 19 19" />
            </svg>
            Сформировать отчёт
          </button>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className={styles.colRight}>
          {preview === 'empty' && (
            <div className={styles.emptyPreview}>
              <svg
                className={styles.emptyIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              <div className={styles.emptyTitle}>Выберите параметры и сформируйте отчёт</div>
              <div className={styles.emptySub}>
                Настройте тип, период и участки слева, затем нажмите «Сформировать отчёт»
              </div>
            </div>
          )}

          {preview === 'generating' && (
            <div className={styles.generating}>
              <div className={styles.spinner} />
              <div className={styles.genTxt}>Формируем отчёт…</div>
            </div>
          )}

          {preview === 'report' && (
            <div className={styles.reportContent}>
              {/* Header card */}
              <div className={styles.card}>
                <div className={styles.previewHeader}>
                  <div>
                    <div className={styles.previewTitle}>Сводный отчёт по хозяйству</div>
                    <div className={styles.previewMeta}>
                      {dateFrom.split('-').reverse().join('.')} —{' '}
                      {dateTo.split('-').reverse().join('.')} · Все участки · 135 бассейнов
                    </div>
                  </div>
                  <div className={styles.previewActions}>
                    <button className={styles.btnOutline} onClick={handleDownloadCSV}>
                      <Icon name="download" size={14} />
                      CSV
                    </button>
                    <button className={styles.btnOutline} onClick={handleDownloadExcel}>
                      <Icon name="file" size={14} />
                      Excel
                    </button>
                    <button className={styles.btnPrimary} onClick={handleDownloadPDF}>
                      <Icon name="download" size={14} />
                      Скачать PDF
                    </button>
                  </div>
                </div>
              </div>

              {/* KPI + charts card */}
              <div className={styles.card}>
                <div className={styles.cardTitle}>
                  <Icon name="activity" size={15} />
                  Сводные показатели за период
                </div>
                <div className={styles.summaryGrid}>
                  <div className={styles.scard}>
                    <div className={styles.scardVal}>8.6</div>
                    <div className={styles.scardLbl}>O₂ ср. мг/л</div>
                  </div>
                  <div className={styles.scard}>
                    <div className={styles.scardVal}>8.3</div>
                    <div className={styles.scardLbl}>T°C ср.</div>
                  </div>
                  <div className={styles.scard}>
                    <div className={styles.scardVal}>6.9</div>
                    <div className={styles.scardLbl}>pH ср.</div>
                  </div>
                  <div className={cn(styles.scard, styles.scardAlarm)}>
                    <div className={styles.scardVal}>17</div>
                    <div className={styles.scardLbl}>Аварий</div>
                  </div>
                </div>

                <div className={styles.chartRow}>
                  <div className={styles.chartArea}>
                    <div className={styles.chartLbl}>O₂ по дням (мг/л)</div>
                    <div className={styles.miniChart}>
                      {O2_DATA.map((v, i) => (
                        <div
                          key={i}
                          className={styles.bar}
                          style={{ height: `${(v / 12) * 100}%`, background: '#0284c7' }}
                          title={String(v)}
                        />
                      ))}
                    </div>
                  </div>
                  <div className={styles.chartArea}>
                    <div className={styles.chartLbl}>Аварии по дням</div>
                    <div className={styles.miniChart}>
                      {ALARM_DATA.map((v, i) => (
                        <div
                          key={i}
                          className={styles.bar}
                          style={{ height: `${(v / 6) * 100}%`, background: '#ef4444' }}
                          title={String(v)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Detail table card */}
              <div className={styles.card}>
                <div className={styles.cardTitle}>
                  <Icon name="report" size={15} />
                  Детализация по участкам
                </div>
                <div className={styles.dtableWrap}>
                  <table className={styles.dtable}>
                    <thead>
                      <tr>
                        <th>Участок</th>
                        <th>Бассейнов</th>
                        <th>O₂ ср.</th>
                        <th>O₂ мин.</th>
                        <th>T°C ср.</th>
                        <th>pH ср.</th>
                        <th>Аварий</th>
                        <th>Предупр.</th>
                        <th>Статус</th>
                      </tr>
                    </thead>
                    <tbody>
                      {DETAIL_ROWS.map((row) => (
                        <tr key={row.name}>
                          <td>
                            <strong>{row.name}</strong>
                          </td>
                          <td>{row.pools}</td>
                          <td className={o2AvgClass(row.o2avg, styles)}>{row.o2avg}</td>
                          <td className={o2MinClass(row.o2min, styles)}>{row.o2min}</td>
                          <td>{row.tavg}</td>
                          <td>{row.phavg}</td>
                          <td>{row.alarms}</td>
                          <td>{row.warnings}</td>
                          <td>
                            <span className={cn(styles.pill, pillClass(row.status, styles))}>
                              {row.statusLabel}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function o2AvgClass(v: number, s: Record<string, string>): string {
  return v >= 8 ? s.valOk : v >= 6 ? s.valWarn : s.valAlarm;
}

function o2MinClass(v: number, s: Record<string, string>): string {
  return v >= 7 ? s.valOk : v >= 5 ? s.valWarn : s.valAlarm;
}

function pillClass(status: SiteRow['status'], s: Record<string, string>): string {
  return status === 'ok' ? s.pillOk : status === 'warn' ? s.pillWarn : s.pillAlarm;
}
