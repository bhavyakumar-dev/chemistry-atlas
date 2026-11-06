import { spawnSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

const repo = process.env.GITHUB_REPOSITORY?.split('/')[1] || process.env.REPOSITORY_NAME || '';
const rootBase = process.env.VITE_BASE_PATH || (repo ? `/${repo}/` : '/');
const viteBin = path.join(process.cwd(), 'node_modules', 'vite', 'bin', 'vite.js');
if (!fs.existsSync(viteBin)) throw new Error('Vite is not installed. Run npm install first.');

function build(edition, outDir, basePath) {
  const env = { ...process.env, VITE_DEFAULT_EDITION: edition, VITE_BASE_PATH: basePath };
  const result = spawnSync(process.execPath, [viteBin, 'build', '--outDir', outDir], { stdio: 'inherit', env });
  if (result.status !== 0) throw new Error(`Build failed for ${edition} (exit ${result.status ?? 'unknown'}).`);
}

// Main GitHub Pages URL opens V5. Each release also receives a stable entry URL.
build('v5', 'dist', rootBase);
for (const edition of ['v1', 'v2', 'v3', 'v4', 'v5']) {
  build(edition, `dist/versions/${edition}`, `${rootBase}versions/${edition}/`);
}
console.log('Built root V5 plus /versions/v1/ through /versions/v5/.');
