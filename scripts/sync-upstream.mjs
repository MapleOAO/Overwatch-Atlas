/**
 * Pull upstream/main into the localized branch without touching locale files.
 * Run from a clean feature branch; the script refuses main/master and dirty
 * worktrees so conflicts are visible and reviewable.
 */
import { spawnSync } from 'node:child_process';

const checkOnly = process.argv.includes('--check-only');
const run = (args, options = {}) => {
    const result = spawnSync('git', args, { encoding: 'utf8', stdio: options.capture ? 'pipe' : 'inherit' });
    if (result.status !== 0) throw new Error(`git ${args.join(' ')} failed (${result.status})`);
    return result.stdout?.trim() || '';
};
const npmRun = (script) => {
    const result = spawnSync('npm', ['run', '--silent', script], { encoding: 'utf8', stdio: 'inherit' });
    if (result.status !== 0) throw new Error(`npm run ${script} failed (${result.status})`);
};

const branch = run(['branch', '--show-current'], { capture: true });
if (!branch || branch === 'main' || branch === 'master') {
    throw new Error(`refusing to sync from protected branch: ${branch || '<detached>'}`);
}
const status = run(['status', '--porcelain'], { capture: true });
if (status) throw new Error('working tree is dirty; commit or stash changes before syncing');

run(['remote', 'get-url', 'upstream']);
run(['fetch', '--prune', 'upstream', 'main']);
const counts = run(['rev-list', '--left-right', '--count', `${branch}...upstream/main`], { capture: true });
console.log(`[upstream] branch ${branch}; divergence ${counts}`);
if (checkOnly) process.exit(0);

run(['merge', '--no-edit', 'upstream/main']);
npmRun('content:ids');
npmRun('i18n:build');
npmRun('i18n:check');
