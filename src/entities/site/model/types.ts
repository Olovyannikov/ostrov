export type SiteStatus = 'ok' | 'warn' | 'alarm';

export interface SiteParam {
  label: string;
  value: string;
  unit?: string;
  status?: SiteStatus;
}

export interface SiteEquipment {
  label: string;
  state: 'active' | 'warn';
}

export interface SiteEventCount {
  kind: 'alarm' | 'warn' | 'service' | 'ok';
  label: string;
}

export interface Site {
  id: string;
  name: string;
  meta: string;
  status: SiteStatus;
  statusLabel: string;
  params: SiteParam[];
  equipment: SiteEquipment[];
  feeders: string;
  events: SiteEventCount[];
}
