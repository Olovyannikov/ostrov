import { useState } from 'react';
import { Topbar } from '@/widgets/topbar';
import { Icon, Breadcrumb } from '@/shared/ui';
import { cn } from '@/shared/lib';
import { USERS } from '@/entities/user';
import type { User } from '@/entities/user';
import styles from './SettingsPage.module.css';

type Tab = 'users' | 'thresholds' | 'notifications' | 'profile';

interface ChannelState {
  telegram: boolean;
  sms: boolean;
  email: boolean;
}

interface NotifyRules {
  alarm: boolean;
  warning: boolean;
  service: boolean;
  recovery: boolean;
  nightOnly: boolean;
}

interface ProfileForm {
  fullName: string;
  email: string;
  phone: string;
}

interface PasswordForm {
  current: string;
  next: string;
  repeat: string;
}

const BREADCRUMB_ITEMS = [{ label: 'Обзор хозяйства', to: '/overview' }, { label: 'Настройки' }];

const TAB_ITEMS: { id: Tab; icon: React.ReactNode; label: string }[] = [
  {
    id: 'users',
    icon: <Icon name="users" size={15} />,
    label: 'Пользователи',
  },
  {
    id: 'thresholds',
    icon: <Icon name="activity" size={15} />,
    label: 'Пороговые значения',
  },
  {
    id: 'notifications',
    icon: <Icon name="bell" size={15} />,
    label: 'Уведомления',
  },
  {
    id: 'profile',
    icon: <Icon name="user" size={15} />,
    label: 'Профиль',
  },
];

interface ThreshRow {
  id: string;
  param: string;
  unit: string;
  warnMin: string;
  warnMax: string;
  alarmMin: string;
  alarmMax: string;
  noMax: boolean;
}

const INITIAL_THRESH: ThreshRow[] = [
  {
    id: 'o2',
    param: 'O₂',
    unit: 'мг/л',
    warnMin: '7.5',
    warnMax: '',
    alarmMin: '6.0',
    alarmMax: '',
    noMax: true,
  },
  {
    id: 'temp',
    param: 'Температура',
    unit: '°C',
    warnMin: '6.0',
    warnMax: '12.0',
    alarmMin: '4.0',
    alarmMax: '15.0',
    noMax: false,
  },
  {
    id: 'ph',
    param: 'pH',
    unit: '',
    warnMin: '6.5',
    warnMax: '7.5',
    alarmMin: '6.0',
    alarmMax: '8.0',
    noMax: false,
  },
  {
    id: 'nh4',
    param: 'NH4',
    unit: 'мг/л',
    warnMin: '0.8',
    warnMax: '',
    alarmMin: '1.5',
    alarmMax: '',
    noMax: true,
  },
  {
    id: 'level',
    param: 'Уровень воды',
    unit: 'м',
    warnMin: '1.2',
    warnMax: '1.8',
    alarmMin: '1.0',
    alarmMax: '2.0',
    noMax: false,
  },
  {
    id: 'turbidity',
    param: 'Мутность',
    unit: 'NTU',
    warnMin: '',
    warnMax: '15',
    alarmMin: '',
    alarmMax: '25',
    noMax: false,
  },
];

let threshSeq = 0;
function newThreshRow(): ThreshRow {
  threshSeq += 1;
  return {
    id: `custom-${threshSeq}`,
    param: '',
    unit: '',
    warnMin: '',
    warnMax: '',
    alarmMin: '',
    alarmMax: '',
    noMax: false,
  };
}

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const [showAddUser, setShowAddUser] = useState(false);

  // Add-user form state
  const [newFullName, setNewFullName] = useState('');
  const [newLogin, setNewLogin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('Дежурный');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newSite, setNewSite] = useState('Все участки');

  // Threshold rows state
  const [threshRows, setThreshRows] = useState<ThreshRow[]>(INITIAL_THRESH);
  const [warnDelay, setWarnDelay] = useState('30');
  const [alarmDelay, setAlarmDelay] = useState('10');

  // Notification channels state
  const [channels, setChannels] = useState<ChannelState>({
    telegram: true,
    sms: true,
    email: false,
  });

  // Notification rules state
  const [rules, setRules] = useState<NotifyRules>({
    alarm: true,
    warning: true,
    service: true,
    recovery: false,
    nightOnly: true,
  });

  // Telegram bot form
  const [botToken, setBotToken] = useState('7012345678:AAF_xxxxxxxxxxxxxxxxxxxxxxx');
  const [chatId, setChatId] = useState('-100123456789');

  // Profile form state
  const [profile, setProfile] = useState<ProfileForm>({
    fullName: 'Иванов Алексей Иванович',
    email: 'ivanov@ostrov.ru',
    phone: '+7 918 123-45-67',
  });

  // Password form state
  const [passwords, setPasswords] = useState<PasswordForm>({ current: '', next: '', repeat: '' });

  // Interface settings (defaultChecked is fine here — no controlled tracking needed)
  const [soundAlert, setSoundAlert] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [darkTheme, setDarkTheme] = useState(false);

  function toggleChannel(key: keyof ChannelState) {
    setChannels((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function updateThreshCell(
    rowIdx: number,
    field: 'param' | 'unit' | 'warnMin' | 'warnMax' | 'alarmMin' | 'alarmMax',
    value: string
  ) {
    setThreshRows((rows) => rows.map((r, i) => (i === rowIdx ? { ...r, [field]: value } : r)));
  }

  function addThreshRow() {
    setThreshRows((rows) => [...rows, newThreshRow()]);
  }

  function removeThreshRow(rowIdx: number) {
    setThreshRows((rows) => rows.filter((_, i) => i !== rowIdx));
  }

  return (
    <>
      <Topbar left={<Breadcrumb items={BREADCRUMB_ITEMS} />} />

      <div className={styles.settingsWrap}>
        {/* Left vertical tab menu */}
        <div className={styles.settingsTabs}>
          {TAB_ITEMS.map((t) => (
            <button
              key={t.id}
              className={cn(styles.stab, activeTab === t.id && styles.stabActive)}
              onClick={() => setActiveTab(t.id)}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Content area */}
        <div className={styles.settingsContent}>
          {/* ─── USERS TAB ─── */}
          {activeTab === 'users' && (
            <div>
              <div className={styles.sectionHdr}>
                <div className={styles.sectionTitle}>Пользователи системы</div>
                <button
                  className={cn(styles.btn, styles.btnPrimary)}
                  onClick={() => setShowAddUser((v) => !v)}
                >
                  <Icon name="plus" size={14} />
                  Добавить пользователя
                </button>
              </div>

              <div className={cn(styles.card, styles.cardNoPad)}>
                <div className={styles.utableWrap}>
                  <table className={styles.utable}>
                    <thead>
                      <tr>
                        <th />
                        <th>Имя</th>
                        <th>Логин</th>
                        <th>Роль</th>
                        <th>Участок</th>
                        <th>Последний вход</th>
                        <th>Статус</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {USERS.map((u: User) => (
                        <tr key={u.login}>
                          <td>
                            <div className={cn(styles.avatar, !u.active && styles.avatarInactive)}>
                              {u.initials}
                            </div>
                          </td>
                          <td>
                            <strong className={!u.active ? styles.textMuted : undefined}>
                              {u.name}
                            </strong>
                          </td>
                          <td className={styles.textMuted}>{u.login}</td>
                          <td>
                            <span
                              className={cn(
                                styles.rolePill,
                                u.role === 'admin' && styles.roleAdmin,
                                u.role === 'duty' && styles.roleDuty,
                                u.role === 'viewer' && styles.roleViewer
                              )}
                            >
                              {u.roleLabel}
                            </span>
                          </td>
                          <td>{u.site}</td>
                          <td className={styles.textMuted}>{u.lastLogin}</td>
                          <td>
                            <span
                              className={cn(
                                styles.badge,
                                u.active ? styles.badgeOk : styles.badgeInactive
                              )}
                            >
                              {u.active ? 'Активен' : 'Неактивен'}
                            </span>
                          </td>
                          <td>
                            <div className={styles.tblActions}>
                              <button className={styles.iconBtn} title="Редактировать">
                                <Icon name="edit" size={13} />
                              </button>
                              <button
                                className={cn(styles.iconBtn, styles.iconBtnDanger)}
                                title="Удалить"
                              >
                                <Icon name="trash" size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {showAddUser && (
                <div className={styles.card}>
                  <div className={styles.cardTitle}>Новый пользователь</div>
                  <div className={styles.cardSub}>Заполните данные учётной записи</div>
                  <div className={styles.fRow}>
                    <div className={styles.fGroup}>
                      <div className={styles.fLabel}>Фамилия Имя Отчество</div>
                      <input
                        type="text"
                        className={styles.input}
                        placeholder="Иванов Алексей Иванович"
                        value={newFullName}
                        onChange={(e) => setNewFullName(e.target.value)}
                      />
                    </div>
                    <div className={styles.fGroup}>
                      <div className={styles.fLabel}>Логин</div>
                      <input
                        type="text"
                        className={styles.input}
                        placeholder="ivanov_a"
                        value={newLogin}
                        onChange={(e) => setNewLogin(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className={styles.fRow}>
                    <div className={styles.fGroup}>
                      <div className={styles.fLabel}>Пароль</div>
                      <input
                        type="password"
                        className={styles.input}
                        placeholder="Минимум 8 символов"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                    <div className={styles.fGroup}>
                      <div className={styles.fLabel}>Роль</div>
                      <select
                        className={styles.input}
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                      >
                        <option>Дежурный</option>
                        <option>Администратор</option>
                        <option>Наблюдатель</option>
                      </select>
                    </div>
                  </div>
                  <div className={styles.fRow}>
                    <div className={styles.fGroup}>
                      <div className={styles.fLabel}>Email</div>
                      <input
                        type="email"
                        className={styles.input}
                        placeholder="ivanov@ostrov.ru"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                      />
                    </div>
                    <div className={styles.fGroup}>
                      <div className={styles.fLabel}>Телефон (для SMS)</div>
                      <input
                        type="text"
                        className={styles.input}
                        placeholder="+7 900 000-00-00"
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className={styles.fRow}>
                    <div className={cn(styles.fGroup, styles.fGroupFull)}>
                      <div className={styles.fLabel}>Доступ к участкам</div>
                      <select
                        className={styles.input}
                        value={newSite}
                        onChange={(e) => setNewSite(e.target.value)}
                      >
                        <option>Все участки</option>
                        <option>Ардон</option>
                        <option>Карджин</option>
                        <option>Дарг Кох</option>
                        <option>5 Озеро</option>
                      </select>
                    </div>
                  </div>
                  <div className={styles.btnRow}>
                    <button
                      className={cn(styles.btn, styles.btnOutline)}
                      onClick={() => setShowAddUser(false)}
                    >
                      Отмена
                    </button>
                    <button className={cn(styles.btn, styles.btnPrimary)}>
                      Создать пользователя
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── THRESHOLDS TAB ─── */}
          {activeTab === 'thresholds' && (
            <div>
              <div className={styles.sectionHdr}>
                <div className={styles.sectionTitle}>Пороговые значения параметров</div>
                <button className={cn(styles.btn, styles.btnPrimary)}>
                  <Icon name="save" size={14} />
                  Сохранить изменения
                </button>
              </div>

              <div className={styles.card}>
                <div className={styles.cardTitle}>Параметры воды</div>
                <div className={styles.cardSub}>
                  Warning — предупреждение, Alarm — критическая тревога. Применяется ко всем
                  бассейнам участка по умолчанию. Можно добавлять и удалять параметры.
                </div>
                <div className={styles.threshTableWrap}>
                  <table className={styles.threshTable}>
                    <thead>
                      <tr>
                        <th>Параметр</th>
                        <th>Ед. изм.</th>
                        <th>Участок</th>
                        <th className={styles.levelWarn}>Warning мин.</th>
                        <th className={styles.levelWarn}>Warning макс.</th>
                        <th className={styles.levelAlarm}>Alarm мин.</th>
                        <th className={styles.levelAlarm}>Alarm макс.</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {threshRows.map((row, i) => (
                        <tr key={row.id}>
                          <td>
                            <input
                              type="text"
                              className={cn(styles.threshInput, styles.threshParamInput)}
                              placeholder="Параметр"
                              value={row.param}
                              onChange={(e) => updateThreshCell(i, 'param', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className={cn(styles.threshInput, styles.threshUnitInput)}
                              placeholder="—"
                              value={row.unit}
                              onChange={(e) => updateThreshCell(i, 'unit', e.target.value)}
                            />
                          </td>
                          <td className={styles.textMuted}>Все</td>
                          <td>
                            <input
                              type="number"
                              className={styles.threshInput}
                              value={row.warnMin}
                              onChange={(e) => updateThreshCell(i, 'warnMin', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className={cn(styles.threshInput, row.noMax && styles.threshDisabled)}
                              disabled={row.noMax}
                              value={row.noMax ? '' : row.warnMax}
                              placeholder={row.noMax ? '—' : ''}
                              onChange={(e) => updateThreshCell(i, 'warnMax', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className={styles.threshInput}
                              value={row.alarmMin}
                              onChange={(e) => updateThreshCell(i, 'alarmMin', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className={cn(styles.threshInput, row.noMax && styles.threshDisabled)}
                              disabled={row.noMax}
                              value={row.noMax ? '' : row.alarmMax}
                              placeholder={row.noMax ? '—' : ''}
                              onChange={(e) => updateThreshCell(i, 'alarmMax', e.target.value)}
                            />
                          </td>
                          <td>
                            <button
                              className={cn(styles.iconBtn, styles.iconBtnDanger)}
                              title="Удалить параметр"
                              onClick={() => removeThreshRow(i)}
                            >
                              <Icon name="trash" size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button
                  className={cn(styles.btn, styles.btnOutline, styles.addParamBtn)}
                  onClick={addThreshRow}
                >
                  <Icon name="plus" size={14} />
                  Добавить параметр
                </button>
              </div>

              <div className={styles.card}>
                <div className={styles.cardTitle}>Задержка перед тревогой</div>
                <div className={styles.cardSub}>
                  Время (в секундах) в течение которого значение должно оставаться за порогом,
                  прежде чем создастся событие
                </div>
                <div className={styles.fRow}>
                  <div className={styles.fGroup}>
                    <div className={styles.fLabel}>Warning — задержка, сек</div>
                    <input
                      type="number"
                      className={styles.input}
                      value={warnDelay}
                      onChange={(e) => setWarnDelay(e.target.value)}
                    />
                  </div>
                  <div className={styles.fGroup}>
                    <div className={styles.fLabel}>Alarm — задержка, сек</div>
                    <input
                      type="number"
                      className={styles.input}
                      value={alarmDelay}
                      onChange={(e) => setAlarmDelay(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── NOTIFICATIONS TAB ─── */}
          {activeTab === 'notifications' && (
            <div>
              <div className={styles.sectionHdr}>
                <div className={styles.sectionTitle}>Каналы уведомлений</div>
              </div>

              <div className={styles.card}>
                <div className={styles.cardTitle}>Способ оповещения</div>
                <div className={styles.cardSub}>Выберите активные каналы доставки уведомлений</div>
                <div className={styles.channelGrid}>
                  {/* Telegram */}
                  <div
                    className={cn(
                      styles.channelCard,
                      channels.telegram && styles.channelCardActive
                    )}
                    onClick={() => toggleChannel('telegram')}
                  >
                    <div
                      className={cn(
                        styles.channelIcon,
                        channels.telegram && styles.channelIconActive
                      )}
                    >
                      <Icon name="message" size={16} />
                    </div>
                    <div className={styles.channelName}>Telegram</div>
                    <div className={styles.channelStatus}>
                      {channels.telegram ? 'Подключён' : 'Отключён'}
                    </div>
                  </div>

                  {/* SMS */}
                  <div
                    className={cn(styles.channelCard, channels.sms && styles.channelCardActive)}
                    onClick={() => toggleChannel('sms')}
                  >
                    <div
                      className={cn(styles.channelIcon, channels.sms && styles.channelIconActive)}
                    >
                      {/* Phone/SMS icon — inline raw SVG */}
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                        <line x1="12" y1="18" x2="12.01" y2="18" />
                      </svg>
                    </div>
                    <div className={styles.channelName}>SMS</div>
                    <div className={styles.channelStatus}>
                      {channels.sms ? 'Подключён' : 'Отключён'}
                    </div>
                  </div>

                  {/* E-mail */}
                  <div
                    className={cn(styles.channelCard, channels.email && styles.channelCardActive)}
                    onClick={() => toggleChannel('email')}
                  >
                    <div
                      className={cn(styles.channelIcon, channels.email && styles.channelIconActive)}
                    >
                      {/* Mail icon — inline raw SVG */}
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    </div>
                    <div className={styles.channelName}>E-mail</div>
                    <div className={styles.channelStatus}>
                      {channels.email ? 'Подключён' : 'Не настроен'}
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.card}>
                <div className={styles.cardTitle}>Правила отправки</div>
                <div className={styles.cardSub}>
                  Настройте при каких событиях отправлять уведомления
                </div>
                <ToggleRow
                  name="Alarm — критическая тревога"
                  desc="Мгновенное уведомление при выходе за критический порог"
                  checked={rules.alarm}
                  onChange={(v) => setRules((r) => ({ ...r, alarm: v }))}
                />
                <ToggleRow
                  name="Warning — предупреждение"
                  desc="Уведомление при превышении предупредительного порога"
                  checked={rules.warning}
                  onChange={(v) => setRules((r) => ({ ...r, warning: v }))}
                />
                <ToggleRow
                  name="Service — сервисные события"
                  desc="Потеря связи с датчиком, технические ошибки"
                  checked={rules.service}
                  onChange={(v) => setRules((r) => ({ ...r, service: v }))}
                />
                <ToggleRow
                  name="Восстановление"
                  desc="Уведомление при возврате параметра в норму"
                  checked={rules.recovery}
                  onChange={(v) => setRules((r) => ({ ...r, recovery: v }))}
                />
                <ToggleRow
                  name="Ночное время (22:00–07:00)"
                  desc="Отправлять только Alarm в ночное время"
                  checked={rules.nightOnly}
                  onChange={(v) => setRules((r) => ({ ...r, nightOnly: v }))}
                />
              </div>

              <div className={styles.card}>
                <div className={styles.cardTitle}>Telegram Bot</div>
                <div className={styles.cardSub}>Настройки подключения к боту</div>
                <div className={styles.fRow}>
                  <div className={styles.fGroup}>
                    <div className={styles.fLabel}>Bot Token</div>
                    <input
                      type="text"
                      className={styles.input}
                      value={botToken}
                      onChange={(e) => setBotToken(e.target.value)}
                    />
                  </div>
                  <div className={styles.fGroup}>
                    <div className={styles.fLabel}>Chat ID / Group ID</div>
                    <input
                      type="text"
                      className={styles.input}
                      value={chatId}
                      onChange={(e) => setChatId(e.target.value)}
                    />
                  </div>
                </div>
                <div className={styles.btnRow}>
                  <button className={cn(styles.btn, styles.btnOutline)}>
                    <Icon name="send" size={14} />
                    Отправить тест
                  </button>
                  <button className={cn(styles.btn, styles.btnPrimary)}>
                    <Icon name="save" size={14} />
                    Сохранить
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── PROFILE TAB ─── */}
          {activeTab === 'profile' && (
            <div>
              <div className={styles.sectionHdr}>
                <div className={styles.sectionTitle}>Мой профиль</div>
              </div>

              <div className={styles.card}>
                <div className={styles.profileTop}>
                  <div className={styles.profileAvatar}>ИА</div>
                  <div>
                    <div className={styles.profileName}>{profile.fullName}</div>
                    <div className={styles.profileRole}>Дежурный · Участок Ардон</div>
                  </div>
                </div>
                <div className={styles.cardDivider} />
                <div className={styles.fRow}>
                  <div className={styles.fGroup}>
                    <div className={styles.fLabel}>Фамилия Имя Отчество</div>
                    <input
                      type="text"
                      className={styles.input}
                      value={profile.fullName}
                      onChange={(e) => setProfile((p) => ({ ...p, fullName: e.target.value }))}
                    />
                  </div>
                  <div className={styles.fGroup}>
                    <div className={styles.fLabel}>Логин</div>
                    <input
                      type="text"
                      className={cn(styles.input, styles.inputDisabled)}
                      value="ivanov"
                      disabled
                    />
                  </div>
                </div>
                <div className={styles.fRow}>
                  <div className={styles.fGroup}>
                    <div className={styles.fLabel}>Email</div>
                    <input
                      type="email"
                      className={styles.input}
                      value={profile.email}
                      onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                    />
                  </div>
                  <div className={styles.fGroup}>
                    <div className={styles.fLabel}>Телефон</div>
                    <input
                      type="text"
                      className={styles.input}
                      value={profile.phone}
                      onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                    />
                  </div>
                </div>
                <div className={styles.btnRow}>
                  <button className={cn(styles.btn, styles.btnPrimary)}>
                    <Icon name="save" size={14} />
                    Сохранить изменения
                  </button>
                </div>
              </div>

              <div className={styles.card}>
                <div className={styles.cardTitle}>Смена пароля</div>
                <div className={styles.cardSub}>
                  Рекомендуем менять пароль не реже одного раза в 3 месяца
                </div>
                <div className={styles.fRow}>
                  <div className={cn(styles.fGroup, styles.fGroupFull)}>
                    <div className={styles.fLabel}>Текущий пароль</div>
                    <input
                      type="password"
                      className={styles.input}
                      placeholder="••••••••"
                      value={passwords.current}
                      onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
                    />
                  </div>
                </div>
                <div className={styles.fRow}>
                  <div className={styles.fGroup}>
                    <div className={styles.fLabel}>Новый пароль</div>
                    <input
                      type="password"
                      className={styles.input}
                      placeholder="Минимум 8 символов"
                      value={passwords.next}
                      onChange={(e) => setPasswords((p) => ({ ...p, next: e.target.value }))}
                    />
                  </div>
                  <div className={styles.fGroup}>
                    <div className={styles.fLabel}>Повторите пароль</div>
                    <input
                      type="password"
                      className={styles.input}
                      placeholder="Повторите пароль"
                      value={passwords.repeat}
                      onChange={(e) => setPasswords((p) => ({ ...p, repeat: e.target.value }))}
                    />
                  </div>
                </div>
                <div className={styles.btnRow}>
                  <button className={cn(styles.btn, styles.btnPrimary)}>Изменить пароль</button>
                </div>
              </div>

              <div className={styles.card}>
                <div className={styles.cardTitle}>Настройки интерфейса</div>
                <ToggleRow
                  name="Звуковое оповещение при тревоге"
                  desc="Воспроизводить звуковой сигнал при новом Alarm"
                  checked={soundAlert}
                  onChange={setSoundAlert}
                />
                <ToggleRow
                  name="Авто-обновление данных"
                  desc="Обновлять данные на экране каждые 30 секунд"
                  checked={autoRefresh}
                  onChange={setAutoRefresh}
                />
                <ToggleRow
                  name="Тёмная тема"
                  desc="Переключить интерфейс на тёмное оформление"
                  checked={darkTheme}
                  onChange={setDarkTheme}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ─── Reusable toggle-row sub-component ─── */
interface ToggleRowProps {
  name: string;
  desc: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

function ToggleRow({ name, desc, checked, onChange }: ToggleRowProps) {
  return (
    <div className={styles.toggleRow}>
      <div className={styles.toggleInfo}>
        <div className={styles.toggleName}>{name}</div>
        <div className={styles.toggleDesc}>{desc}</div>
      </div>
      <label className={styles.toggle}>
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <div className={styles.toggleTrack} />
      </label>
    </div>
  );
}
