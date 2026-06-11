export type UserRole = 'admin' | 'duty' | 'viewer';

export interface User {
  initials: string;
  name: string;
  login: string;
  role: UserRole;
  roleLabel: string;
  site: string;
  lastLogin: string;
  active: boolean;
}
