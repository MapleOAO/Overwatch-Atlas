/**
 * Pull upstream changes into the local Chinese-maintenance branch.
 *
 * This script only fetches from the read-only `upstream` remote and merges into
 * the current non-main branch. It never pushes to upstream and never edits the
 * local main branch automatically.
 *
 * Usage:
 *   npm run sync:upstream:check
 *   npm run sync:upstream
 *   node scripts/sync-upstream.mjs --no-build
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = new Set(process.argv.slice(2));
const CHECK_ONLY = args.has('--check-only');
const NO_BUILD = args.has('--no-build');
const REMOTE = process.env.ATLAS_UPSTREAM_REMOTE || 'upstream';
const BRANCH = process.env.ATLAS_UPSTREAM_BRANCH || 'main';
const REF = `${REMOTE}/${BRANCH}`;

function run(command, commandArgs, options = {}) {
    const result = spawnSync(command, commandArgs, {
        cwd: ROOT,
        stdio: 'inherit',
        encoding: 'utf8',
        ...options,
    });
    if (result.error) throw result.error;
    if (result.status !== 0) {
        throw new Error(`${command} ${commandArgs.join(' ')} failed with exit code ${result.status}`);
    }
    return result;
}

function capture(command, commandArgs) {
    const result = spawnSync(command, commandArgs, {
        cwd: ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
    });
    if (result.error) throw result.error;
    if (result.status !== 0) {
        throw new Error((result.stderr || '').trim() || `${command} ${commandArgs.join(' ')} failed`);
    }
    return result.stdout.trim();
}

function assertRepository() {
    if (!fs.existsSync(path.join(ROOT, '.git'))) {
        throw new Error(`不是 Git 仓库：${ROOT}`);
    }
    const branch = capture('git', ['branch', '--show-current']);
    if (!branch) throw new Error('当前处于 detached HEAD，不能执行上游同步。');
    if (branch === 'main' || branch === 'master') {
        throw new Error(`当前分支是 ${branch}。请先切换到 cn-main 或其他本地维护分支，再执行同步。`);
    }
    const status = capture('git', ['status', '--porcelain']);
    if (status) {
        throw new Error('工作区不干净。请先提交、暂存或另存当前改动，再执行同步。');
    }
}

function assertRemote() {
    try {
        capture('git', ['config', '--get', `remote.${REMOTE}.url`]);
    } catch (_) {
        throw new Error(
            `缺少 ${REMOTE} 远程仓库。请执行：git remote add upstream https://github.com/DiegoSolanoC/Overwatch-Atlas.git`,
        );
    }
}

function reportAheadBehind() {
    const counts = capture('git', ['rev-list', '--left-right', '--count', `HEAD...${REF}`]).split(/\s+/).map(Number);
    const ahead = counts[0] || 0;
    const behind = counts[1] || 0;
    console.log(`[sync] 当前分支相对 ${REF}：本地领先 ${ahead}，落后 ${behind}`);
    return { ahead, behind };
}

try {
    assertRepository();
    assertRemote();
    run('git', ['fetch', '--prune', REMOTE, BRANCH]);
    const { behind } = reportAheadBehind();

    if (CHECK_ONLY) {
        console.log(behind > 0 ? '[sync] 有可合并的上游更新。' : '[sync] 当前分支已包含上游最新提交。');
        process.exit(0);
    }
    if (behind === 0) {
        console.log('[sync] 没有需要合并的上游更新。');
        process.exit(0);
    }

    run('git', ['merge', '--no-edit', REF]);
    run('node', ['scripts/ensure-content-ids.mjs']);
    run('node', ['scripts/i18n-check.mjs']);
    if (!NO_BUILD) run('npm', ['run', 'build:pages']);

    console.log('\n[sync] 同步完成。请检查译文与冲突解决结果，然后提交并推送当前分支到 origin。');
} catch (error) {
    console.error(`[sync] ${error.message}`);
    process.exitCode = 1;
}
