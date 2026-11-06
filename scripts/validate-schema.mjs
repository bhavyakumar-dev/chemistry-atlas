import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('./validate-schema.py', import.meta.url));
const candidates = process.platform === 'win32'
  ? [{ command: 'py', args: ['-3', script] }, { command: 'python', args: [script] }, { command: 'python3', args: [script] }]
  : [{ command: 'python3', args: [script] }, { command: 'python', args: [script] }];

for (const candidate of candidates) {
  const result = spawnSync(candidate.command, candidate.args, { stdio: 'inherit' });
  if (!result.error) process.exit(result.status ?? 1);
}
console.error('Python 3 is required for the schema smoke test.');
process.exit(1);
