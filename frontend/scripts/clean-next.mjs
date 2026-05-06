/**
 * Remove Next.js output and webpack caches.
 * Run only while `next dev` is stopped, or the running server will point at missing files
 * (500: middleware-manifest.json, missing chunks, etc.).
 */
import { existsSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

for (const rel of ['.next', join('node_modules', '.cache')]) {
  const target = join(root, rel);
  if (existsSync(target)) {
    rmSync(target, { recursive: true, force: true });
    console.log(`Removed ${rel}`);
  }
}

console.log('Clean complete. Start the app with: npm run dev');
