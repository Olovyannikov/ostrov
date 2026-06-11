import type { User } from './types';

/** System users (screen-8 → Пользователи). */
export const USERS: User[] = [
  {
    initials: 'ИА',
    name: 'Иванов А.И.',
    login: 'ivanov',
    role: 'duty',
    roleLabel: 'Дежурный',
    site: 'Ардон',
    lastLogin: '06:09, сегодня',
    active: true,
  },
  {
    initials: 'ПМ',
    name: 'Петров М.В.',
    login: 'petrov',
    role: 'admin',
    roleLabel: 'Администратор',
    site: 'Все участки',
    lastLogin: 'вчера, 22:14',
    active: true,
  },
  {
    initials: 'СК',
    name: 'Сидоров К.А.',
    login: 'sidorov',
    role: 'duty',
    roleLabel: 'Дежурный',
    site: 'Карджин',
    lastLogin: '05:50, сегодня',
    active: true,
  },
  {
    initials: 'НО',
    name: 'Новиков О.Г.',
    login: 'novikov',
    role: 'viewer',
    roleLabel: 'Наблюдатель',
    site: 'Дарг Кох',
    lastLogin: '3 дня назад',
    active: false,
  },
];
