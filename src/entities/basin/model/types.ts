export type BasinStatus = 'ok' | 'warn' | 'alarm';

export interface Basin {
  num: number;
  o2: number;
  temp: number;
  ph: number;
  nh4: number;
  feeder: boolean;
  /** Время работы кормушки за сутки, например "3ч 12м" ("—" если выключена). */
  feedTime: string;
  /** Количество кормлений за сутки (0 если выключена). */
  feedCount: number;
  status: BasinStatus;
}

export interface BasinSensor {
  name: string;
  value: string;
  unit?: string;
  status: BasinStatus;
}

export interface BasinEvent {
  time: string;
  type: 'alarm' | 'warn' | 'ok' | 'service';
  msg: string;
  who: string;
  ack: boolean;
}

/** Соседний бассейн группы для режима сравнения O₂ (как в Grafana). */
export interface NeighbourSeries {
  label: string;
  color: string;
  data: number[];
  /** true для текущего бассейна. */
  current: boolean;
}

/** Активность кормушки бассейна за сутки. */
export interface FeederActivity {
  on: boolean;
  /** Время работы за сутки, например "3ч 12м". */
  runtime: string;
  /** Число кормлений за сутки. */
  count: number;
  /** Почасовая активность (0/1) за 24 часа. */
  hourly: number[];
}

export interface BasinDetail {
  id: string;
  title: string;
  meta: string;
  status: BasinStatus;
  kpis: { value: string; unit: string; status: BasinStatus }[];
  sensors: BasinSensor[];
  events: BasinEvent[];
  feeder: FeederActivity;
  /** Ряды O₂ соседних бассейнов группы для попапа сравнения. */
  neighbours: NeighbourSeries[];
  series: {
    labels: string[];
    o2: number[];
    temp: number[];
    ph: number[];
    nh4: number[];
  };
}
