import type { Site } from './types';

/** Production sites shown on the overview dashboard (from screen-1). */
export const SITES: Site[] = [
  {
    id: 'ardon',
    name: 'Участок Ардон',
    meta: '48 бассейнов · 3 группы',
    status: 'ok',
    statusLabel: 'Норма',
    params: [
      { label: 'O₂ средн.', value: '9.1', unit: 'мг/л', status: 'ok' },
      { label: 'Темп. ср.', value: '8.4', unit: '°C' },
      { label: 'pH средн.', value: '7.2' },
      { label: 'NH4 средн.', value: '0.08', unit: 'мг/л', status: 'ok' },
    ],
    equipment: [
      { label: 'Скв. №1–3', state: 'active' },
      { label: 'КТП 250/400 кВА', state: 'active' },
      { label: 'ЛОС-1,2,3', state: 'active' },
      { label: 'О₂ ёмк. №1,2', state: 'active' },
      { label: 'ДГУ-1,2 (250 кВт)', state: 'active' },
    ],
    feeders: '12 кормушек вкл.',
    events: [{ kind: 'service', label: '2 сервис' }],
  },
  {
    id: 'kardzhin',
    name: 'Участок Карджин',
    meta: '36 бассейнов · 2 группы',
    status: 'alarm',
    statusLabel: 'Авария',
    params: [
      { label: 'O₂ средн.', value: '5.8', unit: 'мг/л', status: 'alarm' },
      { label: 'Темп. ср.', value: '8.7', unit: '°C' },
      { label: 'pH средн.', value: '6.1', status: 'warn' },
      { label: 'NH4 средн.', value: '0.42', unit: 'мг/л', status: 'warn' },
    ],
    equipment: [
      { label: 'Насос НС-03 авар.', state: 'warn' },
      { label: 'КТП 630/160 кВА', state: 'active' },
      { label: 'Мехфильтры №1–3', state: 'active' },
      { label: 'О₂ ёмк. №1,2', state: 'active' },
      { label: 'ДГУ-1,2 (250 кВт)', state: 'active' },
    ],
    feeders: '8 кормушек вкл.',
    events: [
      { kind: 'alarm', label: '2 аварии' },
      { kind: 'warn', label: '3 предупр.' },
    ],
  },
  {
    id: 'dargkoh',
    name: 'Участок Дарг Кох',
    meta: '24 бассейна · 2 группы',
    status: 'warn',
    statusLabel: 'Внимание',
    params: [
      { label: 'O₂ средн.', value: '8.6', unit: 'мг/л', status: 'ok' },
      { label: 'Темп. ср.', value: '8.2', unit: '°C' },
      { label: 'pH средн.', value: '6.4' },
      { label: 'NH4 средн.', value: '0.11', unit: 'мг/л', status: 'ok' },
    ],
    equipment: [
      { label: 'Датчик T-07 нет связи', state: 'warn' },
      { label: 'КТП 630 кВА', state: 'active' },
      { label: 'ЛОС 6+3 мехфильтра', state: 'active' },
      { label: 'О₂ ёмк. №1,2', state: 'active' },
      { label: 'ДГУ 250 кВт', state: 'active' },
    ],
    feeders: '6 кормушек вкл.',
    events: [
      { kind: 'warn', label: '1 предупр.' },
      { kind: 'service', label: '1 сервис' },
    ],
  },
  {
    id: 'ozero5',
    name: 'Участок 5 Озеро',
    meta: '27 бассейнов · 1 группа',
    status: 'ok',
    statusLabel: 'Норма',
    params: [
      { label: 'O₂ средн.', value: '9.4', unit: 'мг/л', status: 'ok' },
      { label: 'Темп. ср.', value: '8.1', unit: '°C' },
      { label: 'pH средн.', value: '7.0' },
      { label: 'NH4 средн.', value: '0.06', unit: 'мг/л', status: 'ok' },
    ],
    equipment: [
      { label: 'Скв. №4,5', state: 'active' },
      { label: 'КТП 630 кВА', state: 'active' },
      { label: 'ЛОС-4 (8 фильтров)', state: 'active' },
      { label: 'О₂ ёмк. №1,2', state: 'active' },
      { label: 'ДГУ 400 кВт', state: 'active' },
    ],
    feeders: '8 кормушек вкл.',
    events: [{ kind: 'ok', label: 'Всё в норме' }],
  },
];

export const SITE_NAV = [
  { id: 'ardon', name: 'Ардон', status: 'ok' as SiteStatusDot },
  { id: 'kardzhin', name: 'Карджин', status: 'alarm' as SiteStatusDot },
  { id: 'dargkoh', name: 'Дарг Кох', status: 'warn' as SiteStatusDot },
  { id: 'ozero5', name: '5 Озеро', status: 'ok' as SiteStatusDot },
];

type SiteStatusDot = 'ok' | 'warn' | 'alarm';
