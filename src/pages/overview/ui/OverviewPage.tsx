import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Topbar } from '@/widgets/topbar';
import { Icon, StatusBadge } from '@/shared/ui';
import { cn } from '@/shared/lib';
import { sitePath } from '@/shared/config';
import { SITES } from '@/entities/site';
import { OVERVIEW_EVENTS } from '@/entities/event';
import styles from './OverviewPage.module.css';

const KPIS = [
  { icon: 'alert', tone: 'red', val: '3', lbl: 'Аварий' },
  { icon: 'info', tone: 'amber', val: '7', lbl: 'Предупреждений' },
  { icon: 'checkCircle', tone: 'green', val: '142', lbl: 'Датчиков онлайн' },
  { icon: 'building', tone: 'blue', val: '5', lbl: 'Участков' },
  { icon: 'activity', tone: 'green', val: '98.6%', lbl: 'Доступность', valTone: 'lime' },
] as const;

type Tab = 'alarms' | 'warnings' | 'service';
const TAB_META: { id: Tab; label: string; count: number; tone: string }[] = [
  { id: 'alarms', label: 'Аварии', count: 3, tone: 'red' },
  { id: 'warnings', label: 'Предупреждения', count: 7, tone: 'amber' },
  { id: 'service', label: 'Сервис', count: 4, tone: 'blue' },
];

const TYPE_CLASS = { alarm: styles.typeAlarm, warn: styles.typeWarn, service: styles.typeService };
const TYPE_LABEL = { alarm: 'Авария', warn: 'Предупр.', service: 'Сервис' };

export function OverviewPage() {
  const navigate = useNavigate();
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [tab, setTab] = useState<Tab>('alarms');

  const kpiStrip = (
    <div className={styles.kpiStrip}>
      {KPIS.map((k) => (
        <div className={styles.kpiPill} key={k.lbl}>
          <div className={cn(styles.kpiIcon, styles[k.tone])}>
            <Icon name={k.icon} size={14} />
          </div>
          <div>
            <div className={cn(styles.kpiVal, styles[('valTone' in k && k.valTone) || k.tone])}>
              {k.val}
            </div>
            <div className={styles.kpiLbl}>{k.lbl}</div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <Topbar left={<span className={styles.title}>Обзор хозяйства</span>} right={kpiStrip} />

      <div className={styles.content}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>Производственные участки</span>
          <span className={styles.sectionMeta}>4 участка · 135 бассейнов</span>
        </div>

        <div className={styles.sitesGrid}>
          {SITES.map((site) => (
            <div
              key={site.id}
              className={cn(styles.siteCard, styles[site.status])}
              onClick={() => navigate(sitePath(site.id))}
            >
              <div className={styles.cardHeader}>
                <div>
                  <div className={styles.siteName}>{site.name}</div>
                  <div className={styles.siteMeta}>{site.meta}</div>
                </div>
                <StatusBadge status={site.status} label={site.statusLabel} />
              </div>

              <div className={styles.params}>
                {site.params.map((p) => (
                  <div key={p.label} className={cn(styles.param, p.status && styles[p.status])}>
                    <div className={styles.paramLabel}>{p.label}</div>
                    <div className={styles.paramValue}>
                      {p.value} {p.unit && <span className={styles.unit}>{p.unit}</span>}
                    </div>
                  </div>
                ))}
              </div>

              <button
                className={cn(styles.btnEquip, open[site.id] && styles.open)}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen((o) => ({ ...o, [site.id]: !o[site.id] }));
                }}
              >
                <Icon name="chevronDown" size={11} />
                {open[site.id] ? 'Скрыть' : 'Оборудование'}
              </button>
              {open[site.id] && (
                <div className={styles.equip}>
                  {site.equipment.map((eq) => (
                    <span
                      key={eq.label}
                      className={cn(
                        styles.chip,
                        eq.state === 'active' ? styles.active : styles.warn
                      )}
                    >
                      {eq.label}
                    </span>
                  ))}
                </div>
              )}

              <div className={styles.cardFooter}>
                <div className={styles.feeder}>
                  <span className={styles.feederDot} />
                  {site.feeders}
                </div>
                <div className={styles.evChips}>
                  {site.events.map((ev) => (
                    <span key={ev.label} className={cn(styles.evChip, evChipClass(ev.kind))}>
                      {ev.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.events}>
          <div className={styles.tabs}>
            {TAB_META.map((t) => (
              <div
                key={t.id}
                className={cn(styles.tab, tab === t.id && styles.tabActive)}
                onClick={() => setTab(t.id)}
              >
                {t.label} <span className={cn(styles.tabCount, styles[t.tone])}>{t.count}</span>
              </div>
            ))}
          </div>

          <div className={styles.eventsHead}>
            <span className={styles.sectionTitle}>Активные события</span>
          </div>

          <div className={styles.tableHeader}>
            <div>Время</div>
            <div>Участок · Группа</div>
            <div>Оборудование</div>
            <div>Сообщение</div>
            <div>Тип</div>
            <div>Действие</div>
          </div>

          {OVERVIEW_EVENTS[tab].map((e, i) => (
            <div className={styles.eventRow} key={i}>
              <div className={styles.evTime}>{e.time}</div>
              <div className={styles.evCell}>{e.location}</div>
              <div className={styles.evCell}>{e.sensor}</div>
              <div className={styles.evMsg}>{e.message}</div>
              <div>
                <span className={cn(styles.evType, TYPE_CLASS[e.type])}>{TYPE_LABEL[e.type]}</span>
              </div>
              <div>
                <button className={cn(styles.btnAccept, e.accepted ? styles.dis : styles.act)}>
                  Принять
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function evChipClass(kind: string) {
  return kind === 'alarm'
    ? styles.evAlarm
    : kind === 'warn'
      ? styles.evWarn
      : kind === 'service'
        ? styles.evService
        : styles.evOk;
}
