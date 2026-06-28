import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { Topbar } from '@/widgets/topbar';
import { StatusBadge, Breadcrumb } from '@/shared/ui';
import { cn } from '@/shared/lib';
import { basinPath } from '@/shared/config';
import { BASINS, BASIN_GROUPS, type Basin } from '@/entities/basin';
import { SITE_NAV } from '@/entities/site';
import styles from './SitePage.module.css';

type ViewMode = 'cards' | 'scheme';
type FilterMode = 'all' | 'alarm' | 'warn' | 'ok' | 'feed' | 'nofeed' | 'lowo2' | 'highph';

interface TipRow {
  k: string;
  v: string;
}
interface TipState {
  visible: boolean;
  x: number;
  y: number;
  title: string;
  rows: TipRow[];
}

const EMPTY_TIP: TipState = { visible: false, x: 0, y: 0, title: '', rows: [] };

const basinByNum = new Map<number, Basin>(BASINS.map((b) => [b.num, b]));

/** Группы в порядке тока воды для схемы каскада (сверху вниз). */
const SCHEME_GROUPS = [
  { label: 'A_01–25', from: 1, to: 25 },
  { label: 'A_26–50', from: 26, to: 50 },
  { label: 'A_51–75', from: 51, to: 75 },
  { label: 'A_76–100', from: 76, to: 100 },
  { label: 'Группа 101–130 (30 бассейнов)', from: 101, to: 130 },
];

const PUMP_TIP: TipRow[] = [
  { k: 'Статус', v: '✓ Работает' },
  { k: 'Расход', v: '850 м³/ч' },
  { k: 'Напор', v: '4.2 м' },
  { k: 'Мощность', v: '75 кВт' },
  { k: 'Последнее ТО', v: '12.05.2026' },
  { k: 'Следующее ТО', v: '12.08.2026' },
];

const MF_TIP: TipRow[] = [
  { k: 'Статус', v: '✓ Работает' },
  { k: 'Тип', v: 'Барабанный' },
  { k: 'Ячейка', v: '60 мкм' },
  { k: 'Промывка', v: 'Авто' },
  { k: 'Последнее ТО', v: '20.05.2026' },
  { k: 'Следующее ТО', v: '20.08.2026' },
];

function rangeNums(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}

function basinMatchesFilter(b: Basin, filter: FilterMode): boolean {
  if (filter === 'all') return true;
  if (filter === 'alarm') return b.status === 'alarm';
  if (filter === 'warn') return b.status === 'warn';
  if (filter === 'ok') return b.status === 'ok';
  if (filter === 'feed') return b.feeder === true;
  if (filter === 'nofeed') return b.feeder === false;
  if (filter === 'lowo2') return b.o2 < 8.0;
  if (filter === 'highph') return b.ph > 7.1;
  return true;
}

function groupAverages(nums: number[]) {
  const arr = nums.map((n) => basinByNum.get(n)).filter((b): b is Basin => b !== undefined);
  if (!arr.length) return { o2: '—', temp: '—', ph: '—', nh4: '—' };
  const avg = (key: 'o2' | 'temp' | 'ph') =>
    (arr.reduce((s, b) => s + b[key], 0) / arr.length).toFixed(1);
  return {
    o2: avg('o2'),
    temp: avg('temp'),
    ph: avg('ph'),
    nh4: (arr.reduce((s, b) => s + b.nh4, 0) / arr.length).toFixed(2),
  };
}

function basinTip(b: Basin): { title: string; rows: TipRow[] } {
  return {
    title: `Бассейн Б-${String(b.num).padStart(2, '0')}`,
    rows: [
      { k: 'O₂', v: `${b.o2} мг/л` },
      { k: 'Темп.', v: `${b.temp} °C` },
      { k: 'Кормушка', v: b.feeder ? '✓ Вкл' : '— Выкл' },
      { k: 'Время работы', v: b.feedTime },
      { k: 'Кормлений', v: b.feedCount ? `${b.feedCount} раз` : '0 раз' },
    ],
  };
}

export function SitePage() {
  const { siteId } = useParams({ strict: false });
  const navigate = useNavigate();

  const siteEntry = SITE_NAV.find((s) => s.id === siteId);
  const siteName = siteEntry ? `Участок ${siteEntry.name}` : 'Участок 5 Озеро';

  const [view, setView] = useState<ViewMode>('cards');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<FilterMode>('all');
  const [fullscreen, setFullscreen] = useState(false);
  const [tip, setTip] = useState<TipState>(EMPTY_TIP);

  const feedersOn = BASINS.filter((b) => b.feeder).length;

  const countByStatus = {
    all: BASINS.length,
    alarm: BASINS.filter((b) => b.status === 'alarm').length,
    warn: BASINS.filter((b) => b.status === 'warn').length,
    ok: BASINS.filter((b) => b.status === 'ok').length,
  };

  const toggleGroup = useCallback((id: string) => {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handleBasinClick = useCallback(
    (num: number) => {
      navigate({ to: basinPath(num) });
    },
    [navigate]
  );

  const showTip = useCallback((e: React.MouseEvent, title: string, rows: TipRow[]) => {
    setTip({ visible: true, x: e.clientX + 14, y: e.clientY + 14, title, rows });
  }, []);
  const moveTip = useCallback((e: React.MouseEvent) => {
    setTip((prev) => (prev.visible ? { ...prev, x: e.clientX + 14, y: e.clientY + 14 } : prev));
  }, []);
  const hideTip = useCallback(() => setTip((prev) => ({ ...prev, visible: false })), []);

  // Hide tooltip when leaving scheme view
  useEffect(() => {
    if (view !== 'scheme') setTip((prev) => ({ ...prev, visible: false }));
  }, [view]);

  // Esc closes fullscreen
  useEffect(() => {
    if (!fullscreen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setFullscreen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [fullscreen]);

  const filterActiveClass: Record<FilterMode, string> = {
    all: styles.filterActiveAll,
    alarm: styles.filterActiveAlarm,
    warn: styles.filterActiveWarn,
    ok: styles.filterActiveOk,
    feed: styles.filterActiveFeed,
    nofeed: styles.filterActiveFeed,
    lowo2: styles.filterActiveWarn,
    highph: styles.filterActiveWarn,
  };

  const filterBar = (
    <div className={styles.filterBar}>
      <FilterButton
        active={filter === 'all'}
        activeClass={filterActiveClass.all}
        onClick={() => setFilter('all')}
      >
        <span>Все бассейны</span>
        <span className={styles.filterCount}>{countByStatus.all}</span>
      </FilterButton>
      <div className={styles.filterDivider} />
      <FilterButton
        active={filter === 'alarm'}
        activeClass={filterActiveClass.alarm}
        onClick={() => setFilter('alarm')}
      >
        <span className={styles.fDot} style={{ background: '#ef4444' }} />
        Авария
        <span className={styles.filterCount}>{countByStatus.alarm}</span>
      </FilterButton>
      <FilterButton
        active={filter === 'warn'}
        activeClass={filterActiveClass.warn}
        onClick={() => setFilter('warn')}
      >
        <span className={styles.fDot} style={{ background: '#f59e0b' }} />
        Внимание
        <span className={styles.filterCount}>{countByStatus.warn}</span>
      </FilterButton>
      <FilterButton
        active={filter === 'ok'}
        activeClass={filterActiveClass.ok}
        onClick={() => setFilter('ok')}
      >
        <span className={styles.fDot} style={{ background: '#16a34a' }} />
        Норма
        <span className={styles.filterCount}>{countByStatus.ok}</span>
      </FilterButton>
      <div className={styles.filterDivider} />
      <FilterButton
        active={filter === 'feed'}
        activeClass={filterActiveClass.feed}
        onClick={() => setFilter('feed')}
      >
        🟢 Кормушка вкл
      </FilterButton>
      <FilterButton
        active={filter === 'nofeed'}
        activeClass={filterActiveClass.nofeed}
        onClick={() => setFilter('nofeed')}
      >
        ⚪ Кормушка выкл
      </FilterButton>
      <div className={styles.filterDivider} />
      <FilterButton
        active={filter === 'lowo2'}
        activeClass={filterActiveClass.lowo2}
        onClick={() => setFilter('lowo2')}
      >
        📉 O₂ &lt; 8.0
      </FilterButton>
      <FilterButton
        active={filter === 'highph'}
        activeClass={filterActiveClass.highph}
        onClick={() => setFilter('highph')}
      >
        ⚗️ pH &gt; 7.1
      </FilterButton>
    </div>
  );

  const scheme = (
    <SiteScheme
      filter={filter}
      onBasinEnter={(e, b) => {
        const t = basinTip(b);
        showTip(e, t.title, t.rows);
      }}
      onMove={moveTip}
      onLeave={hideTip}
      onBasinClick={handleBasinClick}
      onEquipEnter={(e, title, rows) => showTip(e, title, rows)}
    />
  );

  return (
    <>
      <Topbar
        left={
          <Breadcrumb
            items={[{ label: 'Обзор хозяйства', to: '/overview' }, { label: siteName }]}
          />
        }
      />

      <div className={styles.content}>
        {/* SITE HEADER */}
        <div className={styles.siteHeader}>
          <div>
            <div className={styles.siteTitle}>{siteName}</div>
            <div className={styles.siteSubtitle}>130 бассейнов · 5 групп · 142 датчика онлайн</div>
          </div>
          <div className={styles.siteKpis}>
            <div className={styles.skpi}>
              <div className={cn(styles.skpiVal, styles.skpiOk)}>9.4</div>
              <div className={styles.skpiLbl}>O₂ мг/л</div>
            </div>
            <div className={styles.skpi}>
              <div className={cn(styles.skpiVal, styles.skpiNorm)}>8.1</div>
              <div className={styles.skpiLbl}>Темп. °C</div>
            </div>
            <div className={styles.skpi}>
              <div className={cn(styles.skpiVal, styles.skpiNorm)}>7.0</div>
              <div className={styles.skpiLbl}>pH средн.</div>
            </div>
            <div className={styles.skpi}>
              <div className={cn(styles.skpiVal, styles.skpiOk)}>0.06</div>
              <div className={styles.skpiLbl}>NH4 мг/л</div>
            </div>
            <div className={styles.skpi}>
              <div className={cn(styles.skpiVal, styles.skpiOk)}>{feedersOn}/130</div>
              <div className={styles.skpiLbl}>Кормушки</div>
            </div>
          </div>
          <StatusBadge status="ok" label="Норма" />
        </div>

        {/* TOOLBAR */}
        <div className={styles.toolbar}>
          <div className={styles.viewToggle}>
            <button
              className={cn(styles.vtBtn, view === 'cards' && styles.vtActive)}
              onClick={() => setView('cards')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
              Карточки
            </button>
            <button
              className={cn(styles.vtBtn, view === 'scheme' && styles.vtActive)}
              onClick={() => setView('scheme')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="3" y1="15" x2="21" y2="15" />
                <line x1="9" y1="3" x2="9" y2="21" />
              </svg>
              Схема
            </button>
          </div>
          <div className={styles.toolbarSpacer} />
          <div className={styles.legend}>
            <div className={styles.legItem}>
              <div className={cn(styles.legDot, styles.legOk)} />
              Норма
            </div>
            <div className={styles.legItem}>
              <div className={cn(styles.legDot, styles.legWarn)} />
              Внимание
            </div>
            <div className={styles.legItem}>
              <div className={cn(styles.legDot, styles.legAlarm)} />
              Авария
            </div>
          </div>
          {view === 'scheme' && (
            <button className={styles.btnFs} onClick={() => setFullscreen(true)}>
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M16 21h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              </svg>
              Полный экран
            </button>
          )}
        </div>

        {/* CARDS VIEW */}
        {view === 'cards' && (
          <div className={styles.cardsView}>
            {BASIN_GROUPS.map((group) => {
              const groupBasins = rangeNums(group.from, group.to)
                .map((n) => basinByNum.get(n))
                .filter((b): b is Basin => b !== undefined);
              const alarmCount = groupBasins.filter((b) => b.status === 'alarm').length;
              const warnCount = groupBasins.filter((b) => b.status === 'warn').length;
              const isCollapsed = collapsed[group.id];

              return (
                <div
                  key={group.id}
                  className={cn(styles.groupBlock, isCollapsed && styles.groupCollapsed)}
                >
                  <div className={styles.groupHeader} onClick={() => toggleGroup(group.id)}>
                    <span className={styles.groupTitle}>{group.label}</span>
                    <span className={styles.groupMeta}>{groupBasins.length} бассейнов</span>
                    <div className={styles.groupBadges}>
                      {alarmCount > 0 && (
                        <span className={cn(styles.chip, styles.chipAlarm)}>
                          {alarmCount} аварий
                        </span>
                      )}
                      {warnCount > 0 && (
                        <span className={cn(styles.chip, styles.chipWarn)}>
                          {warnCount} внимание
                        </span>
                      )}
                      {alarmCount === 0 && warnCount === 0 && (
                        <span className={cn(styles.chip, styles.chipOk)}>Норма</span>
                      )}
                    </div>
                    <svg
                      className={styles.groupCollapseIcon}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                  {!isCollapsed && (
                    <div className={styles.groupBody}>
                      {groupBasins.map((b) => (
                        <BasinCard key={b.num} basin={b} onClick={() => handleBasinClick(b.num)} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* SCHEME VIEW */}
        {view === 'scheme' && (
          <div className={styles.schemeView}>
            {filterBar}
            <div className={styles.schemeContainer}>{scheme}</div>
          </div>
        )}
      </div>

      {/* FULLSCREEN OVERLAY */}
      {fullscreen && (
        <div className={styles.fsOverlay}>
          <div className={styles.fsBar}>
            <span className={styles.fsTitle}>{siteName} — Схема бассейнов</span>
            <div className={styles.fsFilters}>{filterBar}</div>
            <button className={styles.fsCollapseBtn} onClick={() => setFullscreen(false)}>
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M16 21h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              </svg>
              Свернуть
            </button>
          </div>
          <div className={styles.fsBody}>
            <div className={styles.schemeContainer}>{scheme}</div>
          </div>
        </div>
      )}

      {/* TOOLTIP */}
      {tip.visible && (
        <div className={styles.tooltip} style={{ left: tip.x, top: tip.y }}>
          <div className={styles.ttTitle}>{tip.title}</div>
          {tip.rows.map((r) => (
            <div key={r.k} className={styles.ttRow}>
              <span>{r.k}</span>
              <span className={styles.ttVal}>{r.v}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

interface BasinCardProps {
  basin: Basin;
  onClick: () => void;
}

function BasinCard({ basin, onClick }: BasinCardProps) {
  const { num, o2, temp, feeder, feedTime, feedCount, status } = basin;
  const numStr = String(num).padStart(2, '0');
  return (
    <div className={cn(styles.basinCard, styles[status])} onClick={onClick}>
      <div className={styles.bcNum}>Б-{numStr}</div>
      <div className={styles.bcRow}>
        <span className={styles.bcKey}>O₂</span>
        <span className={cn(styles.bcVal, styles[status])}>{o2} мг/л</span>
      </div>
      <div className={styles.bcRow}>
        <span className={styles.bcKey}>Темп.</span>
        <span className={styles.bcVal}>{temp} °C</span>
      </div>
      <div className={styles.bcFeeder}>
        <div className={cn(styles.feederDot, !feeder && styles.feederOff)} />
        {feeder ? `Вкл · ${feedTime} · ${feedCount} корм.` : 'Выкл'}
      </div>
    </div>
  );
}

interface SiteSchemeProps {
  filter: FilterMode;
  onBasinEnter: (e: React.MouseEvent, basin: Basin) => void;
  onMove: (e: React.MouseEvent) => void;
  onLeave: () => void;
  onBasinClick: (num: number) => void;
  onEquipEnter: (e: React.MouseEvent, title: string, rows: TipRow[]) => void;
}

function SiteScheme({
  filter,
  onBasinEnter,
  onMove,
  onLeave,
  onBasinClick,
  onEquipEnter,
}: SiteSchemeProps) {
  return (
    <div className={styles.schOuter}>
      {/* Left canal column with equipment */}
      <div className={styles.schLeftCol}>
        <div className={styles.schCanalPipe} />
        <div className={styles.schLeftInner}>
          <div className={styles.schInLabel}>↓ ВХОД</div>
          <div className={styles.schCanalText}>Канал подачи воды (с Ардона)</div>
          <div className={styles.schFlowArrow}>↓</div>
          <div
            className={styles.schPumpCard}
            onMouseEnter={(e) => onEquipEnter(e, 'Насос', PUMP_TIP)}
            onMouseMove={onMove}
            onMouseLeave={onLeave}
          >
            <div className={styles.schPumpIcon}>⊕</div>
            <div className={styles.schPumpName}>Насос</div>
          </div>
          <div className={styles.schFlowArrow}>↓</div>
          <div
            className={styles.schMfCard}
            onMouseEnter={(e) => onEquipEnter(e, 'Микрофильтр (МФ)', MF_TIP)}
            onMouseMove={onMove}
            onMouseLeave={onLeave}
          >
            <div className={styles.schMfDot} />
            <div className={styles.schMfName}>
              МФ
              <br />
              <span className={styles.schMfSub}>микрофильтр</span>
            </div>
          </div>
        </div>
      </div>

      {/* Groups cascade column */}
      <div className={styles.schGroupsCol}>
        <div className={styles.schBanner}>↓ ВХОД воды (с Ардона после МФ)</div>

        <div className={styles.schPair}>
          <SchemeGroup
            group={SCHEME_GROUPS[0]}
            filter={filter}
            onBasinEnter={onBasinEnter}
            onMove={onMove}
            onLeave={onLeave}
            onBasinClick={onBasinClick}
            onEquipEnter={onEquipEnter}
          />
          <SchemeGroup
            group={SCHEME_GROUPS[1]}
            filter={filter}
            onBasinEnter={onBasinEnter}
            onMove={onMove}
            onLeave={onLeave}
            onBasinClick={onBasinClick}
            onEquipEnter={onEquipEnter}
          />
        </div>
        <div className={styles.schFlowText}>↓ по течению</div>
        <div className={styles.schPair}>
          <SchemeGroup
            group={SCHEME_GROUPS[2]}
            filter={filter}
            onBasinEnter={onBasinEnter}
            onMove={onMove}
            onLeave={onLeave}
            onBasinClick={onBasinClick}
            onEquipEnter={onEquipEnter}
          />
          <SchemeGroup
            group={SCHEME_GROUPS[3]}
            filter={filter}
            onBasinEnter={onBasinEnter}
            onMove={onMove}
            onLeave={onLeave}
            onBasinClick={onBasinClick}
            onEquipEnter={onEquipEnter}
          />
        </div>
        <div className={styles.schFlowText}>↓ по течению</div>
        <SchemeGroup
          group={SCHEME_GROUPS[4]}
          filter={filter}
          onBasinEnter={onBasinEnter}
          onMove={onMove}
          onLeave={onLeave}
          onBasinClick={onBasinClick}
          onEquipEnter={onEquipEnter}
        />

        <div className={styles.schBanner}>↓ ВЫХОД</div>
      </div>
    </div>
  );
}

interface SchemeGroupProps {
  group: { label: string; from: number; to: number };
  filter: FilterMode;
  onBasinEnter: (e: React.MouseEvent, basin: Basin) => void;
  onMove: (e: React.MouseEvent) => void;
  onLeave: () => void;
  onBasinClick: (num: number) => void;
  onEquipEnter: (e: React.MouseEvent, title: string, rows: TipRow[]) => void;
}

function SchemeGroup({
  group,
  filter,
  onBasinEnter,
  onMove,
  onLeave,
  onBasinClick,
  onEquipEnter,
}: SchemeGroupProps) {
  const nums = rangeNums(group.from, group.to);
  const avg = groupAverages(nums);
  const groupTip: TipRow[] = [
    { k: 'O₂ (среднее)', v: `${avg.o2} мг/л` },
    { k: 'Темп. (среднее)', v: `${avg.temp} °C` },
    { k: 'pH (среднее)', v: `${avg.ph}` },
    { k: 'NH4 (среднее)', v: `${avg.nh4} мг/л` },
  ];

  return (
    <div>
      <div className={styles.schGrpHdr}>
        <strong className={styles.schGrpLabel}>{group.label}</strong>
        <span className={styles.schGrpStat}>
          O₂: <b>{avg.o2}</b> мг/л
        </span>
        <span className={styles.schGrpStat}>
          Темп.: <b>{avg.temp}</b> °C
        </span>
        <span className={cn(styles.schGrpStat, styles.schGrpStatMuted)}>
          pH: <b>{avg.ph}</b>
        </span>
        <span className={styles.schGrpStat}>
          NH4: <b>{avg.nh4}</b> мг/л
        </span>
        <span
          className={styles.schGrpFaint}
          onMouseEnter={(e) => onEquipEnter(e, group.label, groupTip)}
          onMouseMove={onMove}
          onMouseLeave={onLeave}
        >
          (общие по группе)
        </span>
      </div>
      <div className={styles.schGrpRow}>
        {nums.map((n) => {
          const b = basinByNum.get(n);
          if (!b) return null;
          const dimmed = !basinMatchesFilter(b, filter);
          return (
            <div
              key={n}
              className={cn(styles.schBasin, styles[b.status], dimmed && styles.schDimmed)}
              onMouseEnter={(e) => !dimmed && onBasinEnter(e, b)}
              onMouseMove={(e) => !dimmed && onMove(e)}
              onMouseLeave={() => !dimmed && onLeave()}
              onClick={() => !dimmed && onBasinClick(n)}
            >
              <div className={cn(styles.schDot, !b.feeder && styles.schDotOff)} />
              <div className={styles.schO2}>{b.o2}</div>
              <div className={styles.schNum}>{n}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface FilterButtonProps {
  active: boolean;
  activeClass: string;
  onClick: () => void;
  children: React.ReactNode;
}

function FilterButton({ active, activeClass, onClick, children }: FilterButtonProps) {
  return (
    <button className={cn(styles.filterBtn, active && activeClass)} onClick={onClick}>
      {children}
    </button>
  );
}
