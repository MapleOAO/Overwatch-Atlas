import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const content = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/locales/zh-CN/content.json'), 'utf8'));
const ui = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/locales/zh-CN/ui.json'), 'utf8'));
const strict = process.argv.includes('--strict');
const hasHan = (value) => /[\u3400-\u9fff]/u.test(String(value || ''));
const pending = [];

for (const [kind, rows] of Object.entries(content.records || {})) {
    for (const row of Object.values(rows || {})) {
        const officialAcronym = /^(?:D\.Va|D\.Mon|MEKA|SST|IJC|E\d+)$/u.test(String(row?.name?.target || ''));
        if (row?.name?.target && !hasHan(row.name.target) && !officialAcronym) {
            pending.push(`${kind}:${row.name.source} -> ${row.name.target}`);
        }
        if (row?.description?.target && !hasHan(row.description.target)) {
            pending.push(`${kind}:${row.name?.source || ''}:description`);
        }
    }
}
for (const [source, row] of Object.entries(ui.entries || {})) {
    if (row?.target && !hasHan(row.target)) pending.push(`ui:${source} -> ${row.target}`);
}

console.log(JSON.stringify({ checked: Object.keys(ui.entries || {}).length + Object.values(content.records || {}).reduce((n, rows) => n + Object.keys(rows).length, 0), pendingCount: pending.length, pending: pending.slice(0, 100) }, null, 2));
if (strict && pending.length) process.exitCode = 1;
