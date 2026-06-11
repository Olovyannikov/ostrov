import type { OverviewEvent } from './types';

/** Active events on the overview dashboard (screen-1), grouped by tab. */
export const OVERVIEW_EVENTS: Record<'alarms' | 'warnings' | 'service', OverviewEvent[]> = {
  alarms: [
    {
      time: '14:32',
      location: 'Карджин · КГ-2',
      sensor: 'Датчик O₂-Б12',
      message: 'Критически низкий O₂ — бассейн Б-12',
      type: 'alarm',
      accepted: false,
    },
    {
      time: '14:29',
      location: 'Карджин · КГ-1',
      sensor: 'Насос НС-03',
      message: 'Насос НС-03 — авария подачи воды',
      type: 'alarm',
      accepted: false,
    },
    {
      time: '14:21',
      location: 'Дарг Кох · ДК-1',
      sensor: 'Датчик T-07',
      message: 'Нет связи с датчиком температуры T-07',
      type: 'alarm',
      accepted: false,
    },
  ],
  warnings: [
    {
      time: '14:45',
      location: 'Карджин · КГ-2',
      sensor: 'Датчик pH-08',
      message: 'pH ниже нормы — бассейн Б-08',
      type: 'warn',
      accepted: false,
    },
    {
      time: '14:38',
      location: 'Дарг Кох · ДК-2',
      sensor: 'Датчик O₂-04',
      message: 'O₂ приближается к нижнему порогу',
      type: 'warn',
      accepted: false,
    },
    {
      time: '14:15',
      location: 'Карджин · КГ-1',
      sensor: 'Датчик NH4-02',
      message: 'NH4 превышает допустимое значение',
      type: 'warn',
      accepted: false,
    },
    {
      time: '13:55',
      location: 'Ардон · КГ-3',
      sensor: 'Скважина №1',
      message: 'Снижение расхода воды — Скв. №1 (ПЧ ONI)',
      type: 'warn',
      accepted: false,
    },
  ],
  service: [
    {
      time: '13:50',
      location: 'Ардон · КГ-1',
      sensor: 'Кормушка FEED-03',
      message: 'Кормушка FEED-03 требует обслуживания',
      type: 'service',
      accepted: true,
    },
    {
      time: '13:22',
      location: 'Ардон · КГ-2',
      sensor: 'ЛОС-2 Мехфильтр №3',
      message: 'Плановое ТО мехфильтра — давление в норме',
      type: 'service',
      accepted: true,
    },
    {
      time: '12:10',
      location: '5 Озеро',
      sensor: 'КНС старая',
      message: 'Плановое ТО насоса КНС (ESQ-600)',
      type: 'service',
      accepted: true,
    },
  ],
};
