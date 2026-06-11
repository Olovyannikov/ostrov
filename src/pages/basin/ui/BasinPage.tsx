import { useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import type { ChartDataset } from 'chart.js';
import { Topbar } from '@/widgets/topbar';
import { Breadcrumb, Icon } from '@/shared/ui';
import { cn } from '@/shared/lib';
import { BASIN_DETAIL } from '@/entities/basin';
import type { BasinSensor, BasinEvent } from '@/entities/basin';
import styles from './BasinPage.module.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

type Period = '24h' | '7d' | '30d';

const PERIOD_LABELS: Record<Period, string> = { '24h': '24ч', '7d': '7 дней', '30d': '30 дней' };

const STATUS_LABEL: Record<string, string> = { ok: 'Норма', warn: 'Внимание', alarm: 'Авария' };

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

function makeThreshLine(data: number[], value: number, color: string): LineDataset {
  return {
    type: 'line',
    data: Array(data.length).fill(value) as number[],
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
  if (alarmLine !== undefined) datasets.push(makeThreshLine(data, alarmLine, '#ef4444'));
  if (warnLine !== undefined) datasets.push(makeThreshLine(data, warnLine, '#f59e0b'));

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
  const [alarmAccepted, setAlarmAccepted] = useState(false);
  const [feederOn, setFeederOn] = useState(true);
  const [period, setPeriod] = useState<Period>('24h');

  const { series, kpis, sensors, events } = BASIN_DETAIL;

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
            className={cn(styles.btn, alarmAccepted ? styles.btnAccepted : styles.btnDanger)}
            onClick={() => setAlarmAccepted(true)}
            disabled={alarmAccepted}
          >
            <Icon name="check" size={14} />
            {alarmAccepted ? '✓ Авария принята' : 'Принять аварию'}
          </button>
          <button className={cn(styles.btn, styles.btnOutline)}>
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

        {/* Charts 2-col grid */}
        <div className={styles.grid2}>
          <ChartCard
            title="Кислород O₂"
            subtitle="⚠ Критически низкий"
            data={series.o2}
            labels={series.labels}
            color="#ef4444"
            alarmLine={7.0}
            warnLine={8.0}
            threshLegend={[
              { color: '#ef4444', label: 'Авария < 7.0' },
              { color: '#f59e0b', label: 'Внимание < 8.0' },
            ]}
          />
          <ChartCard
            title="Температура"
            data={series.temp}
            labels={series.labels}
            color="#0284c7"
            warnLine={9.5}
            threshLegend={[{ color: '#f59e0b', label: 'Внимание > 9.5 °C' }]}
          />
          <ChartCard
            title="pH"
            data={series.ph}
            labels={series.labels}
            color="#8b5cf6"
            threshLegend={[{ color: '#f59e0b', label: 'Внимание: 6.5–7.5' }]}
          />
          <ChartCard
            title="Аммонийный азот NH4"
            data={series.nh4}
            labels={series.labels}
            color="#16a34a"
            warnLine={0.08}
            threshLegend={[{ color: '#f59e0b', label: 'Внимание > 0.08' }]}
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
          <div className={styles.eventList}>
            {events.map((ev, i) => (
              <EventItem key={i} event={ev} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
