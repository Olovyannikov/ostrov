import { useState } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import type { ChartDataset } from 'chart.js';
import { Topbar } from '@/widgets/topbar';
import { Breadcrumb, Icon } from '@/shared/ui';
import { cn } from '@/shared/lib';
import { BASIN_DETAIL } from '@/entities/basin';
import type { BasinSensor, BasinEvent, NeighbourSeries } from '@/entities/basin';
import { AckDialog, type AckResult } from '@/features/alarm/acknowledge';
import styles from './BasinPage.module.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
  Tooltip,
  Legend
);

type Period = '24h' | '7d' | '30d';

const PERIOD_LABELS: Record<Period, string> = { '24h': '24ч', '7d': '7 дней', '30d': '30 дней' };

const STATUS_LABEL: Record<string, string> = { ok: 'Норма', warn: 'Внимание', alarm: 'Авария' };

function o2Color(v: number): string {
  return v < 7 ? '#ef4444' : v < 8 ? '#f59e0b' : '#16a34a';
}

const chartBaseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false as const,
  plugins: {
    legend: { display: false },
    tooltip: { mode: 'index' as const, intersect: false },
  },
  scales: {
    x: {
      grid: { color: '#f1f5f9' },
      ticks: { maxTicksLimit: 8, font: { size: 10 }, color: '#94a3b8' },
    },
    y: {
      grid: { color: '#f1f5f9' },
      ticks: { font: { size: 10 }, color: '#94a3b8' },
    },
  },
  elements: {
    point: { radius: 0, hoverRadius: 4 },
    line: { tension: 0.3, borderWidth: 2 },
  },
};

type LineDataset = ChartDataset<'line', number[]>;

function makeThreshLine(len: number, value: number, color: string): LineDataset {
  return {
    type: 'line',
    data: Array(len).fill(value) as number[],
    borderColor: color,
    borderDash: [5, 3],
    borderWidth: 1.5,
    pointRadius: 0,
    fill: false,
    label: '',
  };
}

interface ChartCardProps {
  title: string;
  subtitle?: string;
  data: number[];
  labels: string[];
  color: string;
  alarmLine?: number;
  warnLine?: number;
  threshLegend: { color: string; label: string }[];
}

function ChartCard({
  title,
  subtitle,
  data,
  labels,
  color,
  alarmLine,
  warnLine,
  threshLegend,
}: ChartCardProps) {
  const datasets: LineDataset[] = [
    {
      type: 'line',
      data,
      borderColor: color,
      backgroundColor: color + '18',
      fill: true,
      label: title,
    },
  ];
  if (alarmLine !== undefined) datasets.push(makeThreshLine(data.length, alarmLine, '#ef4444'));
  if (warnLine !== undefined) datasets.push(makeThreshLine(data.length, warnLine, '#f59e0b'));

  return (
    <div className={styles.card}>
      <div className={styles.cardTitle}>
        <span>{title}</span>
        {subtitle && <span className={styles.cardSubtitle}>{subtitle}</span>}
      </div>
      <div className={styles.chartWrap}>
        <Line data={{ labels, datasets }} options={chartBaseOptions} />
      </div>
      {threshLegend.length > 0 && (
        <div className={styles.threshLegend}>
          {threshLegend.map((t) => (
            <div key={t.label} className={styles.tlItem}>
              <div
                className={styles.tlLine}
                style={{ borderTopColor: t.color, borderTopStyle: 'dashed' }}
              />
              <span>{t.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── O₂ chart with neighbour comparison (Grafana-style) ───────────────────────

interface O2CardProps {
  labels: string[];
  o2: number[];
  neighbours: NeighbourSeries[];
}

function O2Card({ labels, o2, neighbours }: O2CardProps) {
  const [popupOpen, setPopupOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const current = neighbours.find((n) => n.current);
  const comparing = selected.size > 0;

  const datasets: LineDataset[] = [];
  if (!comparing) {
    datasets.push({
      type: 'line',
      data: o2,
      borderColor: '#ef4444',
      backgroundColor: '#ef444418',
      fill: true,
      label: 'O₂',
    });
  } else {
    neighbours.forEach((n) => {
      if (n.current || !selected.has(n.label)) return;
      datasets.push({
        type: 'line',
        data: n.data,
        borderColor: n.color,
        borderWidth: 1.5,
        pointRadius: 0,
        fill: false,
        label: n.label,
      });
    });
    if (current) {
      datasets.push({
        type: 'line',
        data: current.data,
        borderColor: current.color,
        borderWidth: 2.5,
        pointRadius: 0,
        fill: false,
        label: current.label,
      });
    }
  }
  datasets.push(makeThreshLine(o2.length, 7.0, '#ef4444'));
  datasets.push(makeThreshLine(o2.length, 8.0, '#f59e0b'));

  const legendItems = current
    ? [current, ...neighbours.filter((n) => !n.current && selected.has(n.label))]
    : [];

  return (
    <div className={styles.card}>
      <div className={cn(styles.cardTitle, styles.cardTitleWrap)}>
        <span>Кислород O₂</span>
        <span className={styles.cardSubtitle}>⚠ Критически низкий</span>
        <button
          className={cn(styles.cmpBtn, comparing && styles.cmpBtnActive)}
          onClick={() => setPopupOpen(true)}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          Сравнение соседних
        </button>
      </div>

      {comparing && (
        <div className={styles.cmpLegend}>
          {legendItems.map((n) => (
            <div key={n.label} className={cn(styles.cmpLegItem, n.current && styles.cmpLegCurr)}>
              <div className={styles.cmpLegLine} style={{ background: n.color }} />
              <span>{n.label}</span>
            </div>
          ))}
        </div>
      )}

      <div className={styles.chartWrap}>
        <Line data={{ labels, datasets }} options={chartBaseOptions} />
      </div>
      <div className={styles.threshLegend}>
        <div className={styles.tlItem}>
          <div
            className={styles.tlLine}
            style={{ borderTopColor: '#ef4444', borderTopStyle: 'dashed' }}
          />
          <span>Авария &lt; 7.0</span>
        </div>
        <div className={styles.tlItem}>
          <div
            className={styles.tlLine}
            style={{ borderTopColor: '#f59e0b', borderTopStyle: 'dashed' }}
          />
          <span>Внимание &lt; 8.0</span>
        </div>
      </div>

      {popupOpen && (
        <ComparePopup
          neighbours={neighbours}
          selected={selected}
          onApply={(next) => {
            setSelected(next);
            setPopupOpen(false);
          }}
          onClose={() => setPopupOpen(false)}
        />
      )}
    </div>
  );
}

interface ComparePopupProps {
  neighbours: NeighbourSeries[];
  selected: Set<string>;
  onApply: (next: Set<string>) => void;
  onClose: () => void;
}

function ComparePopup({ neighbours, selected, onApply, onClose }: ComparePopupProps) {
  const [draft, setDraft] = useState<Set<string>>(new Set(selected));
  const current = neighbours.find((n) => n.current);

  function toggle(label: string) {
    setDraft((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  return (
    <div className={styles.cmpOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.cmpModal}>
        <div className={styles.cmpModalHdr}>
          <span>Сравнение бассейнов группы А</span>
          <button className={styles.cmpClose} onClick={onClose}>
            ×
          </button>
        </div>
        <div className={styles.cmpModalSub}>
          Выберите бассейны для сравнения O₂ с текущим ({current?.label}):
        </div>
        <div className={styles.cmpList}>
          {current && (
            <div className={styles.cmpCurrentRow}>
              <div className={styles.cmpDot} style={{ background: current.color }} />
              <span className={styles.cmpCurrentName}>{current.label} (текущий)</span>
              <span style={{ color: o2Color(current.data[current.data.length - 1]) }}>
                {current.data[current.data.length - 1]} мг/л
              </span>
            </div>
          )}
          {neighbours.map((n) => {
            if (n.current) return null;
            const last = n.data[n.data.length - 1];
            return (
              <label key={n.label} className={styles.cmpRow}>
                <input
                  type="checkbox"
                  checked={draft.has(n.label)}
                  onChange={() => toggle(n.label)}
                  style={{ accentColor: n.color }}
                />
                <div className={styles.cmpDot} style={{ background: n.color }} />
                <span className={styles.cmpRowName}>{n.label}</span>
                <span style={{ color: o2Color(last), fontWeight: 600 }}>{last} мг/л</span>
              </label>
            );
          })}
        </div>
        <div className={styles.cmpModalFtr}>
          <button className={cn(styles.btn, styles.btnOutline)} onClick={onClose}>
            Отмена
          </button>
          <button className={cn(styles.btn, styles.btnPrimary)} onClick={() => onApply(draft)}>
            Применить
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Feeder activity (24h bar chart) ──────────────────────────────────────────

interface FeederCardProps {
  on: boolean;
  runtime: string;
  count: number;
  hourly: number[];
}

const feederOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false as const,
  plugins: { legend: { display: false }, tooltip: { enabled: false } },
  scales: {
    x: {
      grid: { display: false },
      ticks: { maxTicksLimit: 12, font: { size: 10 }, color: '#94a3b8' },
    },
    y: { display: false, min: 0, max: 1 },
  },
};

function FeederActivityCard({ on, runtime, count, hourly }: FeederCardProps) {
  const data = {
    labels: hourly.map((_, i) => `${i}:00`),
    datasets: [
      {
        data: hourly.map((v) => (v ? 1 : 0.05)),
        backgroundColor: hourly.map((v) => (v ? '#8b5cf6' : '#e2e8f0')),
        borderRadius: 3,
        barPercentage: 0.85,
        categoryPercentage: 0.95,
      },
    ],
  };
  return (
    <div className={styles.card}>
      <div className={styles.cardTitle}>
        <span>Кормушка — активность за сутки</span>
      </div>
      <div className={styles.feederStats}>
        <div className={styles.feederStat}>
          <div className={styles.feederStatLbl}>Статус</div>
          <div className={styles.feederStatVal} style={{ color: '#16a34a' }}>
            {on ? '✓ Включена' : '— Выключена'}
          </div>
        </div>
        <div className={styles.feederStat}>
          <div className={styles.feederStatLbl}>Время работы сегодня</div>
          <div className={styles.feederStatVal} style={{ color: '#0ea5e9' }}>
            {runtime}
          </div>
        </div>
        <div className={styles.feederStat}>
          <div className={styles.feederStatLbl}>Кормлений за сутки</div>
          <div className={styles.feederStatVal} style={{ color: '#8b5cf6' }}>
            {count} раз
          </div>
        </div>
      </div>
      <div className={styles.feederChartWrap}>
        <Bar data={data} options={feederOptions} />
      </div>
    </div>
  );
}

function SensorItem({ sensor }: { sensor: BasinSensor }) {
  return (
    <div className={styles.sensorItem}>
      <div className={styles.sensorName}>{sensor.name}</div>
      <div>
        <span className={cn(styles.sensorVal, styles[sensor.status])}>{sensor.value}</span>
        {sensor.unit && <span className={styles.sensorUnit}> {sensor.unit}</span>}
      </div>
      <div className={cn(styles.sensorStatus, styles[sensor.status])}>
        {sensor.status === 'alarm' ? '🔴 ' : sensor.status === 'warn' ? '⚠ ' : '✓ '}
        {STATUS_LABEL[sensor.status]}
      </div>
    </div>
  );
}

function EventItem({ event }: { event: BasinEvent }) {
  return (
    <div className={cn(styles.eventItem, styles[event.type])}>
      <div className={cn(styles.eventDot, styles[event.type])} />
      <div className={styles.eventBody}>
        <div className={styles.eventMsg}>{event.msg}</div>
        <div className={styles.eventWho}>{event.who}</div>
      </div>
      <div className={styles.eventRight}>
        <div className={styles.eventTime}>{event.time}</div>
        <div
          className={cn(styles.eventAckLabel, event.ack ? styles.eventAcked : styles.eventUnacked)}
        >
          {event.ack ? '✓ Принято' : '! Не принято'}
        </div>
      </div>
    </div>
  );
}

export function BasinPage() {
  const [ack, setAck] = useState<AckResult | null>(null);
  const [ackOpen, setAckOpen] = useState(false);
  const [feederOn, setFeederOn] = useState(true);
  const [period, setPeriod] = useState<Period>('24h');

  const { series, kpis, sensors, events, neighbours, feeder } = BASIN_DETAIL;

  const breadcrumb = (
    <Breadcrumb
      items={[
        { label: 'Обзор хозяйства', to: '/overview' },
        { label: '5 Озеро', to: '/site/ozero5' },
        { label: 'Группа A_01–25' },
        { label: BASIN_DETAIL.title },
      ]}
    />
  );

  return (
    <>
      <Topbar left={breadcrumb} />

      <div className={styles.content}>
        {/* Basin header */}
        <div className={styles.basinHeader}>
          <div>
            <div className={styles.bhTitle}>{BASIN_DETAIL.title}</div>
            <div className={styles.bhMeta}>{BASIN_DETAIL.meta}</div>
          </div>
          <div className={styles.bhKpis}>
            {kpis.map((k) => (
              <div key={k.unit} className={cn(styles.kpiBox, styles[k.status])}>
                <div className={cn(styles.kpiVal, styles[k.status])}>{k.value}</div>
                <div className={styles.kpiLbl}>{k.unit}</div>
              </div>
            ))}
          </div>
          <span className={cn(styles.statusBadge, styles.badgeAlarm)}>🔴 Авария</span>
        </div>

        {/* Action row */}
        <div className={styles.actionRow}>
          <button
            className={cn(styles.btn, ack ? styles.btnAccepted : styles.btnDanger)}
            onClick={() => setAckOpen(true)}
            disabled={ack !== null}
          >
            <Icon name="check" size={14} />
            {ack ? `✓ Принято · ${ack.employee}` : 'Принять аварию'}
          </button>
          <button className={cn(styles.btn, styles.btnOutline)} onClick={() => setAckOpen(true)}>
            <Icon name="edit" size={14} />
            Добавить комментарий
          </button>
          <button className={cn(styles.btn, styles.btnOutline)}>
            <Icon name="download" size={14} />
            Экспорт данных
          </button>
          <div className={styles.periodWrap}>
            <span className={styles.periodLabel}>Период:</span>
            <div className={styles.periodTabs}>
              {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
                <button
                  key={p}
                  className={cn(styles.ptab, period === p && styles.ptabActive)}
                  onClick={() => setPeriod(p)}
                >
                  {PERIOD_LABELS[p]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Charts column */}
        <div className={styles.chartsCol}>
          <O2Card labels={series.labels} o2={series.o2} neighbours={neighbours} />
          <ChartCard
            title="Температура"
            data={series.temp}
            labels={series.labels}
            color="#0284c7"
            warnLine={9.5}
            threshLegend={[{ color: '#f59e0b', label: 'Внимание > 9.5 °C' }]}
          />
          <FeederActivityCard
            on={feeder.on}
            runtime={feeder.runtime}
            count={feeder.count}
            hourly={feeder.hourly}
          />
        </div>

        {/* Sensors + controls */}
        <div className={styles.grid2}>
          {/* Sensors card */}
          <div className={styles.card}>
            <div className={styles.cardTitle}>
              <span>Датчики бассейна</span>
            </div>
            <div className={styles.sensorsGrid}>
              {sensors.map((s) => (
                <SensorItem key={s.name} sensor={s} />
              ))}
            </div>
          </div>

          {/* Feeder + aerator column */}
          <div className={styles.rightCol}>
            {/* Feeder control */}
            <div className={styles.feederCard}>
              <div className={styles.cardTitle}>
                <span>Управление кормушкой</span>
              </div>
              <div className={styles.feederRow}>
                <div className={styles.feederStatus}>
                  <div
                    className={styles.feederDot}
                    style={{ background: feederOn ? '#16a34a' : '#cbd5e1' }}
                  />
                  <span>{feederOn ? 'Кормушка активна' : 'Кормушка выключена'}</span>
                </div>
                <label className={styles.toggleSwitch}>
                  <input
                    type="checkbox"
                    checked={feederOn}
                    onChange={(e) => setFeederOn(e.target.checked)}
                  />
                  <div className={styles.toggleTrack} />
                  <div className={styles.toggleKnob} />
                </label>
              </div>
              <div className={styles.feederMeta}>
                Следующая подача: <strong>04:00</strong> · Порция: <strong>2.4 кг</strong> ·
                Суточная норма: <strong>14.4 кг</strong>
              </div>
              <div className={styles.feederBtns}>
                <button className={cn(styles.btn, styles.btnOutline, styles.btnSm)}>
                  <Icon name="play" size={13} />
                  Подать сейчас
                </button>
                <button className={cn(styles.btn, styles.btnOutline, styles.btnSm)}>
                  <Icon name="settings" size={13} />
                  Настройки
                </button>
              </div>
            </div>

            {/* Aerator card */}
            <div className={styles.feederCard}>
              <div className={styles.cardTitle}>
                <span>Аэратор LOXY</span>
              </div>
              <div className={styles.feederRow}>
                <div className={styles.feederStatus}>
                  <div className={styles.feederDot} style={{ background: '#16a34a' }} />
                  <span style={{ color: '#16a34a' }}>Работает · Норма</span>
                </div>
              </div>
              <div className={styles.feederMeta}>
                Время работы: <strong>14ч 22мин</strong> · Последняя проверка:{' '}
                <strong>02:00</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Event history */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>
            <span>История событий · Б-12</span>
            <span className={styles.cardTitleLink}>Полный журнал →</span>
          </div>
          {ack && (
            <div className={styles.ackBanner}>
              <strong>✓ Авария принята</strong> · {ack.employee} · {ack.at}
              {ack.comment && <div className={styles.ackComment}>«{ack.comment}»</div>}
            </div>
          )}
          <div className={styles.eventList}>
            {events.map((ev, i) => (
              <EventItem key={i} event={ev} />
            ))}
          </div>
        </div>
      </div>

      {ackOpen && (
        <AckDialog
          title="Принять аварию · Б-12"
          onConfirm={(result) => {
            setAck(result);
            setAckOpen(false);
          }}
          onCancel={() => setAckOpen(false)}
        />
      )}
    </>
  );
}
