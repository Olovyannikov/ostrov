// Builds the static HTML prototype site from .sources/*.html into static/.
// - normalizes cross-links between screens
// - injects a universal sidebar-navigation script (wires nav items by their text)
// - injects a top banner linking to the React version
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(root, '.sources');
const outDir = join(root, 'static');
mkdirSync(outDir, { recursive: true });

// Screen file -> human title (for the landing page).
const SCREENS = [
  ['overview.html', 'Обзор хозяйства', 'Сводка по всем участкам, KPI и активные события'],
  ['site.html', 'Участок 5 Озеро', 'Карточки и схема бассейнов, фильтры'],
  ['basin.html', 'Бассейн Б-12', 'Графики параметров, датчики, управление кормушкой'],
  ['alerts.html', 'Тревоги и предупреждения', 'Таблица активных событий с фильтрами'],
  ['journal.html', 'Журнал событий', 'Полная история событий, экспорт CSV'],
  ['reports.html', 'Отчёты', 'Конструктор отчётов и предпросмотр'],
  ['duty.html', 'Дашборд дежурного', 'Сводка текущей смены'],
  ['settings.html', 'Настройки', 'Пользователи, пороги, уведомления, профиль'],
];

// Universal navigation wiring + React-version banner, injected before </body>.
const INJECT = `
<!-- injected by build-static.mjs -->
<style>
  .x-banner{position:fixed;right:14px;bottom:14px;z-index:9999;display:flex;gap:8px;align-items:center;
    background:#0f172a;color:#fff;border-radius:10px;padding:8px 12px;font:600 12px/1 'Inter','Segoe UI',system-ui,sans-serif;
    box-shadow:0 6px 24px rgba(0,0,0,.25);text-decoration:none}
  .x-banner a{color:#7dd3fc;text-decoration:none}
  .x-banner a:hover{text-decoration:underline}
</style>
<div class="x-banner">
  <span>Статичный HTML-прототип</span>·
  <a href="./index.html">все экраны</a>·
  <a href="./app/">React-версия →</a>
</div>
<script>
(function () {
  // Map nav/breadcrumb labels to target screens.
  var MAP = [
    ['моя смена', 'duty.html'],
    ['обзор хозяйства', 'overview.html'],
    ['ардон', 'site.html'],
    ['карджин', 'site.html'],
    ['дарг кох', 'site.html'],
    ['5 озеро', 'site.html'],
    ['озеро', 'site.html'],
    ['тревоги', 'alerts.html'],
    ['журнал', 'journal.html'],
    ['отчёт', 'reports.html'],
    ['отчет', 'reports.html'],
    ['настройки', 'settings.html'],
    ['бассейн б-12', 'basin.html'],
    ['группа a_01', 'basin.html'],
  ];
  function target(text) {
    var t = (text || '').toLowerCase().trim();
    for (var i = 0; i < MAP.length; i++) if (t.indexOf(MAP[i][0]) !== -1) return MAP[i][1];
    return null;
  }
  var here = location.pathname.split('/').pop();
  function wire(el) {
    if (el.dataset.xwired) return;
    var dest = target(el.textContent);
    if (!dest || dest === here) return;
    el.dataset.xwired = '1';
    el.style.cursor = 'pointer';
    el.addEventListener('click', function (e) {
      // ignore clicks on controls (chevrons, toggles) inside the item
      if (e.target.closest('.nav-chevron, input, .toggle, .view-toggle')) return;
      location.href = dest;
    });
  }
  function run() {
    document.querySelectorAll('.nav-item, .nav-child, .bc-link, .logo-icon, .sidebar-logo').forEach(wire);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
</script>
`;

for (const f of readdirSync(srcDir)) {
  if (!f.endsWith('.html')) continue;
  let html = readFileSync(join(srcDir, f), 'utf8');
  // normalize any hard-coded old filenames
  html = html.replace(/screen-1-ostrov\.html/g, 'overview.html');
  // strip inline nav onclick handlers that hard-navigate (the injected script handles it)
  html = html.replace(/onclick="location\.href='[^']*'"/g, '');
  // inject before closing body
  html = html.replace('</body>', INJECT + '\n</body>');
  writeFileSync(join(outDir, f), html);
  console.log('built', f);
}

// Landing page
const cards = SCREENS.map(
  ([file, title, desc]) => `      <a class="card" href="./${file}">
        <div class="card-title">${title}</div>
        <div class="card-desc">${desc}</div>
        <div class="card-go">Открыть →</div>
      </a>`
).join('\n');

const landing = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Остров — Система мониторинга</title>
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{--bg:#f1f5f9;--surface:#fff;--border:#e2e8f0;--text:#1e293b;--muted:#64748b;--primary:#0284c7}
  body{font-family:'Inter','Segoe UI',system-ui,sans-serif;background:var(--bg);color:var(--text);min-height:100vh}
  .wrap{max-width:1040px;margin:0 auto;padding:48px 24px}
  .head{display:flex;align-items:center;gap:14px;margin-bottom:8px}
  .logo{width:44px;height:44px;border-radius:10px;background:linear-gradient(135deg,#0ea5e9,#0284c7);
    display:flex;align-items:center;justify-content:center}
  h1{font-size:26px;font-weight:800}
  .sub{color:var(--muted);font-size:14px;margin-bottom:28px}
  .versions{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:36px}
  .vcard{border:1px solid var(--border);background:var(--surface);border-radius:14px;padding:20px;text-decoration:none;color:inherit;transition:.15s}
  .vcard:hover{border-color:var(--primary);box-shadow:0 6px 20px rgba(2,132,199,.12);transform:translateY(-2px)}
  .vcard h2{font-size:17px;margin-bottom:6px}
  .vcard p{font-size:13px;color:var(--muted)}
  .vcard .tag{display:inline-block;margin-top:12px;font-size:12px;font-weight:700;color:var(--primary)}
  .section-title{font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:12px}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px}
  .card{border:1px solid var(--border);background:var(--surface);border-radius:12px;padding:16px;text-decoration:none;color:inherit;transition:.15s}
  .card:hover{border-color:var(--primary);box-shadow:0 4px 14px rgba(0,0,0,.06);transform:translateY(-1px)}
  .card-title{font-size:14px;font-weight:700;margin-bottom:4px}
  .card-desc{font-size:12px;color:var(--muted);min-height:32px}
  .card-go{font-size:12px;font-weight:700;color:var(--primary);margin-top:8px}
  footer{margin-top:40px;color:var(--muted);font-size:12px}
  footer a{color:var(--primary)}
</style>
</head>
<body>
  <div class="wrap">
    <div class="head">
      <div class="logo"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></svg></div>
      <h1>Остров</h1>
    </div>
    <div class="sub">Система мониторинга рыбоводного хозяйства · прототип</div>

    <div class="versions">
      <a class="vcard" href="./overview.html">
        <h2>📄 Статичный HTML</h2>
        <p>Восемь экранов на чистом HTML/CSS/JS. Без сборки, открываются как есть.</p>
        <span class="tag">Открыть обзор →</span>
      </a>
      <a class="vcard" href="./app/">
        <h2>⚛️ React-версия</h2>
        <p>То же приложение на React + FSD + TypeScript с роутингом.</p>
        <span class="tag">Открыть React-приложение →</span>
      </a>
    </div>

    <div class="section-title">Экраны (статичная версия)</div>
    <div class="grid">
${cards}
    </div>

    <footer>
      Исходники и README — на <a href="https://github.com/Olovyannikov/ostrov">GitHub</a>.
    </footer>
  </div>
</body>
</html>
`;
writeFileSync(join(outDir, 'index.html'), landing);
console.log('built index.html (landing)');
