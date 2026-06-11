export type BasinStatus = 'ok' | 'warn' | 'alarm';

export interface Basin {
  num: number;
  o2: number;
  temp: number;
  ph: number;
  nh4: number;
  feeder: boolean;
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

export interface BasinDetail {
  id: string;
  title: string;
  meta: string;
  status: BasinStatus;
  kpis: { value: string; unit: string; status: BasinStatus }[];
  sensors: BasinSensor[];
  events: BasinEvent[];
  series: {
    labels: string[];
    o2: number[];
    temp: number[];
    ph: number[];
    nh4: number[];
  };
}
