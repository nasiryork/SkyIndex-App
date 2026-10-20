// Copies only the files the live app needs into dist/ (for uploading to Cloudflare Pages).
// Usage: node scripts/make-dist.mjs
import { cpSync, rmSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = root + 'dist';
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist);
for (const f of ['index.html', 'styles.css', 'app.js', 'sw.js', 'manifest.webmanifest', 'data', 'icons']) {
  cpSync(root + f, `${dist}/${f}`, { recursive: true });
}
console.log('dist/ ready');
