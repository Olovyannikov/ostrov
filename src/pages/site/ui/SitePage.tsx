import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Topbar } from '@/widgets/topbar';
import { StatusBadge, Breadcrumb } from '@/shared/ui';
import { cn } from '@/shared/lib';
import { basinPath } from '@/shared/config';
import { BASINS, BASIN_GROUPS, type Basin } from '@/entities/basin';
import { SITE_NAV } from '@/entities/site';
import styles from './SitePage.module.css';

type ViewMode = 'cards' | 'scheme';
type FilterMode = 'all' | 'alarm' | 'warn' | 'ok' | 'feed' | 'nofeed' | 'lowo2' | 'highph';

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  basin: Basin | null;
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

export function SitePage() {
  const { siteId } = useParams<{ siteId: string }>();
  const navigate = useNavigate();

  const siteEntry = SITE_NAV.find((s) => s.id === siteId);
  const siteName = siteEntry ? `Участок ${siteEntry.name}` : 'Участок 5 Озеро';

  const [view, setView] = useState<ViewMode>('cards');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<FilterMode>('all');
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, y: 0, basin: null });

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
      navigate(basinPath(num));
    },
    [navigate]
  );

  const showTooltip = useCallback((e: React.MouseEvent, basin: Basin) => {
    setTooltip({ visible: true, x: e.clientX + 14, y: e.clientY + 14, basin });
  }, []);

  const moveTooltip = useCallback((e: React.MouseEvent) => {
    setTooltip((prev) => ({ ...prev, x: e.clientX + 14, y: e.clientY + 14 }));
  }, []);

  const hideTooltip = useCallback(() => {
    setTooltip((prev) => ({ ...prev, visible: false }));
  }, []);

  // Close tooltip when switching away from scheme
  useEffect(() => {
    if (view !== 'scheme') {
      setTooltip((prev) => ({ ...prev, visible: false }));
    }
  }, [view]);

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
            <div className={styles.siteSubtitle}>100 бассейнов · 4 группы · 142 датчика онлайн</div>
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
              <div className={cn(styles.skpiVal, styles.skpiOk)}>{feedersOn}/100</div>
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
        </div>

        {/* CARDS VIEW */}
        {view === 'cards' && (
          <div className={styles.cardsView}>
            {BASIN_GROUPS.map((group) => {
              const nums = Array.from(
                { length: group.to - group.from + 1 },
                (_, i) => group.from + i
              );
              const groupBasins = nums
                .map((n) => BASINS.find((b) => b.num === n))
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
            {/* Filter bar */}
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

            {/* Scheme container */}
            <div className={styles.schemeContainer}>
              {/* TOP: basins 71–100 */}
              <SchemeSection
                nums={Array.from({ length: 30 }, (_, i) => 71 + i)}
                label="30 бассейнов 4×40м · Блок 71–100"
                labelBg="#dbeafe"
                filter={filter}
                onMouseEnter={showTooltip}
                onMouseMove={moveTooltip}
                onMouseLeave={hideTooltip}
                onBasinClick={handleBasinClick}
              />
              <div className={styles.schRoad} />

              {/* MIDDLE double: A_76–100 | A_51–75 */}
              <div className={styles.schDouble}>
                <SchemeSection
                  nums={Array.from({ length: 25 }, (_, i) => 100 - i)}
                  label="A_76–100"
                  labelBg="#e0f2fe"
                  filter={filter}
                  onMouseEnter={showTooltip}
                  onMouseMove={moveTooltip}
                  onMouseLeave={hideTooltip}
                  onBasinClick={handleBasinClick}
                />
                <SchemeSection
                  nums={Array.from({ length: 25 }, (_, i) => 75 - i)}
                  label="A_51–75 · Ардон 5-е Озеро"
                  labelBg="#fef3c7"
                  filter={filter}
                  onMouseEnter={showTooltip}
                  onMouseMove={moveTooltip}
                  onMouseLeave={hideTooltip}
                  onBasinClick={handleBasinClick}
                />
              </div>
              <div className={styles.schRoad} />

              {/* BOTTOM double: A_26–50 | A_01–25 */}
              <div className={styles.schDouble}>
                <SchemeSection
                  nums={Array.from({ length: 25 }, (_, i) => 50 - i)}
                  label="A_26–50"
                  labelBg="#f0fdf4"
                  filter={filter}
                  onMouseEnter={showTooltip}
                  onMouseMove={moveTooltip}
                  onMouseLeave={hideTooltip}
                  onBasinClick={handleBasinClick}
                />
                <SchemeSection
                  nums={Array.from({ length: 25 }, (_, i) => 25 - i)}
                  label="A_01–25"
                  labelBg="#f0fdf4"
                  filter={filter}
                  onMouseEnter={showTooltip}
                  onMouseMove={moveTooltip}
                  onMouseLeave={hideTooltip}
                  onBasinClick={handleBasinClick}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* TOOLTIP */}
      {tooltip.visible && tooltip.basin && (
        <SchemeTooltip basin={tooltip.basin} x={tooltip.x} y={tooltip.y} />
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
  const { num, o2, temp, ph, nh4, feeder, status } = basin;
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
      <div className={styles.bcRow}>
        <span className={styles.bcKey}>pH</span>
        <span className={styles.bcVal}>{ph}</span>
      </div>
      <div className={styles.bcRow}>
        <span className={styles.bcKey}>NH4</span>
        <span className={styles.bcVal}>{nh4}</span>
      </div>
      <div className={styles.bcFeeder}>
        <div className={cn(styles.feederDot, !feeder && styles.feederOff)} />
        {feeder ? 'Кормушка вкл' : 'Кормушка выкл'}
      </div>
    </div>
  );
}

interface SchemeSectionProps {
  nums: number[];
  label: string;
  labelBg: string;
  filter: FilterMode;
  onMouseEnter: (e: React.MouseEvent, basin: Basin) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseLeave: () => void;
  onBasinClick: (num: number) => void;
}

function SchemeSection({
  nums,
  label,
  labelBg,
  filter,
  onMouseEnter,
  onMouseMove,
  onMouseLeave,
  onBasinClick,
}: SchemeSectionProps) {
  return (
    <div className={styles.schSection}>
      <div className={styles.schSectionLabel} style={{ background: labelBg }}>
        {label}
      </div>
      <div className={styles.schRow}>
        {nums.map((n) => {
          const b = BASINS.find((basin) => basin.num === n);
          if (!b) return null;
          const dimmed = !basinMatchesFilter(b, filter);
          return (
            <div
              key={n}
              className={cn(styles.schBasin, styles[b.status], dimmed && styles.schDimmed)}
              onMouseEnter={(e) => !dimmed && onMouseEnter(e, b)}
              onMouseMove={(e) => !dimmed && onMouseMove(e)}
              onMouseLeave={() => !dimmed && onMouseLeave()}
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

interface SchemeTooltipProps {
  basin: Basin;
  x: number;
  y: number;
}

function SchemeTooltip({ basin, x, y }: SchemeTooltipProps) {
  const ref = useRef<HTMLDivElement>(null);
  const numStr = String(basin.num).padStart(2, '0');
  return (
    <div ref={ref} className={styles.tooltip} style={{ left: x, top: y }}>
      <div className={styles.ttTitle}>Бассейн Б-{numStr}</div>
      <div className={styles.ttRow}>
        <span>O₂</span>
        <span className={styles.ttVal}>{basin.o2} мг/л</span>
      </div>
      <div className={styles.ttRow}>
        <span>Темп.</span>
        <span className={styles.ttVal}>{basin.temp} °C</span>
      </div>
      <div className={styles.ttRow}>
        <span>pH</span>
        <span className={styles.ttVal}>{basin.ph}</span>
      </div>
      <div className={styles.ttRow}>
        <span>NH4</span>
        <span className={styles.ttVal}>{basin.nh4} мг/л</span>
      </div>
      <div className={styles.ttRow}>
        <span>Кормушка</span>
        <span className={styles.ttVal}>{basin.feeder ? '✓ Вкл' : '— Выкл'}</span>
      </div>
    </div>
  );
}
