# Остров — система мониторинга рыбоводного хозяйства

Прототип интерфейса мониторинга УЗВ-хозяйства (участки, бассейны, датчики O₂/T/pH/NH4,
тревоги, журнал, отчёты, настройки). Репозиторий содержит **две версии одного приложения**,
которые деплоятся вместе на GitHub Pages:

| Версия                | Что это                                                  | Где открыть             |
| --------------------- | -------------------------------------------------------- | ----------------------- |
| 📄 **Статичный HTML** | 8 экранов на чистом HTML/CSS/JS, без сборки              | корень сайта `/ostrov/` |
| ⚛️ **React**          | то же приложение на React + FSD + TypeScript с роутингом | `/ostrov/app/`          |

🔗 **Демо:** https://olovyannikov.github.io/ostrov/
(лендинг со ссылками на обе версии)

---

## Экраны

1. **Обзор хозяйства** — KPI, карточки участков, активные события (вкладки).
2. **Участок** — карточки/схема бассейнов, фильтры, тултипы (100 бассейнов).
3. **Бассейн** — графики параметров (Chart.js), датчики, управление кормушкой.
4. **Тревоги** — таблица активных событий с фильтрами, сортировкой, «принять».
5. **Журнал событий** — полная история, сортируемая таблица, экспорт CSV.
6. **Отчёты** — конструктор отчёта и предпросмотр (KPI, мини-графики, таблица).
7. **Моя смена** — дашборд дежурного (сводка, бассейны с отклонениями, хронология).
8. **Настройки** — пользователи, пороги, уведомления, профиль.

---

## Структура репозитория

```
.
├── .sources/              # исходные HTML-прототипы (источник правды для статики)
├── static/                # сгенерированная статичная версия (build:static) — в .gitignore
├── scripts/
│   ├── build-static.mjs   # .sources → static (чинит навигацию, добавляет лендинг)
│   └── build-site.mjs     # собирает dist: статика в корень + React в /app
├── src/                   # React-приложение, архитектура Feature-Sliced Design
│   ├── app/               # точка входа, роутер, глобальные стили и токены
│   ├── pages/             # overview, site, basin, alerts, journal, reports, duty, settings
│   ├── widgets/           # app-layout (+ sidebar), topbar
│   ├── entities/          # site, basin, event, user — типы + мок-данные
│   └── shared/            # ui (Icon, StatusBadge, Breadcrumb), lib, config
├── index.html             # Vite-entry React-приложения
├── vite.config.ts         # base = /ostrov/app/ (на CI), outDir = dist/app
└── .github/workflows/deploy.yml
```

### Feature-Sliced Design

Слои сверху вниз: `app → pages → widgets → entities → shared`.
Импорты идут только «вниз», слайсы общаются через публичные API (`index.ts`).
Соблюдение архитектуры проверяется [Steiger](https://github.com/feature-sliced/steiger)
(`pnpm lint:fsd`).

---

## Разработка

```bash
pnpm install
pnpm dev            # Vite dev-server (React-версия)
```

### Сборка

```bash
pnpm build:static   # .sources → static/
pnpm build          # tsc + vite → dist/app/   (GH_PAGES=1 ставит base /ostrov/app/)
pnpm build:site     # собрать всё в dist/ (статика в корне + React в /app)
```

Полная сборка как на проде:

```bash
pnpm build:static && GH_PAGES=1 pnpm build && pnpm build:site
pnpm preview        # предпросмотр React-сборки
```

### Качество кода

```bash
pnpm lint           # ESLint
pnpm lint:fsd       # Steiger (правила FSD)
pnpm typecheck      # tsc --noEmit
pnpm format         # Prettier --write
pnpm format:check   # Prettier --check
```

---

## Коммиты

Используются [Conventional Commits](https://www.conventionalcommits.org/).
Git-хуки ставятся автоматически при `pnpm install` ([lefthook](https://github.com/evilmartians/lefthook)):

- **pre-commit** — ESLint + Prettier на изменённых файлах;
- **commit-msg** — проверка сообщения через commitlint.

Удобный интерактивный коммит ([commitizen](https://github.com/commitizen/cz-cli)):

```bash
pnpm commit
```

Пример сообщения: `feat(basin): add NH4 threshold line to chart`.

---

## Деплой

GitHub Actions (`.github/workflows/deploy.yml`) на каждый push в `main`:

1. собирает статику и React-приложение (`GH_PAGES=1`, base `/ostrov/app/`);
2. компонует `dist/` (статика в корне, React в `dist/app/`);
3. публикует артефакт на GitHub Pages.

Маршруты на проде:

- `/ostrov/` — лендинг и статичные экраны (`/ostrov/overview.html`, …);
- `/ostrov/app/` — React-приложение (роутинг через TanStack Router c hash-историей,
  напр. `/ostrov/app/#/basin/Б-12`). Интерфейс адаптивный: на мобильных боковое меню
  сворачивается в бургер-драйвер.

> Данные во всех экранах — мок-данные из прототипов; бэкенда нет.

## Стек

React 18 · TypeScript · Vite · TanStack Router · Chart.js · Feature-Sliced Design ·
ESLint · Prettier · Steiger · lefthook · commitlint · commitizen · pnpm.
