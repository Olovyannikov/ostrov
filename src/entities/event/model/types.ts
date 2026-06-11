export type EventType = 'alarm' | 'warn' | 'service' | 'ok';

/** Compact event shown in the overview "active events" tabs (screen-1). */
export interface OverviewEvent {
  time: string;
  location: string;
  sensor: string;
  message: string;
  type: Exclude<EventType, 'ok'>;
  accepted: boolean;
}

/** Alert row (screen-4) and journal row (screen-5) share this richer shape. */
export interface LogEvent {
  id: string;
  date: string;
  time: string;
  type: EventType;
  accepted: boolean;
  site: string;
  group: string;
  basin: string;
  sensor: string;
  msg: string;
  value: string;
  threshold?: string;
  acceptedBy?: string;
  acceptedAt?: string;
}
