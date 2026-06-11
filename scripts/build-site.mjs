// Assembles the full deployable site into dist/:
//   dist/                <- static HTML prototypes + landing (served at the Pages root)
//   dist/app/            <- the built React app
//
// Run order:
//   1. build-static.mjs  -> static/
//   2. vite build        -> dist/app/  (done by the npm script before this, or here)
//   3. copy static/* -> dist/ root
import { cpSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const staticDir = join(root, 'static');
const dist = join(root, 'dist');

if (!existsSync(staticDir)) {
  console.error('static/ not found — run `pnpm build:static` first.');
  process.exit(1);
}
if (!existsSync(join(dist, 'app'))) {
  console.error('dist/app not found — run `pnpm build` (vite) first.');
  process.exit(1);
}

mkdirSync(dist, { recursive: true });
// Copy static prototypes + landing into the dist root (alongside app/).
cpSync(staticDir, dist, { recursive: true });
console.log('assembled dist/: static prototypes at root, React app at /app');
