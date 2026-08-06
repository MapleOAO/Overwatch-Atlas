/**
 * Add stable IDs to data records that pre-date the localization layer.
 *
 * IDs are generated once from the record kind and its current canonical name.
 * Existing IDs are never replaced, so later reordering or copy edits do not
 * change translation keys.
 *
 * Usage:
 *   node scripts/ensure-content-ids.mjs
 *   node scripts/ensure-content-ids.mjs --check
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const SOURCES = [
    { kind: 'event', path: 'src/data/event-system/timeline-events.json' },
    { kind: 'hero', path: 'src/data/story-archive/heroes.json' },
    { kind: 'faction', path: 'src/data/story-archive/factions.json' },
    { kind: 'npc', path: 'src/data/story-archive/npcs.json' },
    { kind: 'location', path: 'src/data/story-archive/locations.json' },
];

const checkOnly = process.argv.includes('--check');

function stableId(kind, name, duplicateIndex = 0) {
    const source = `${kind}\0${String(name || '').trim()}\0${duplicateIndex}`;
    const digest = crypto.createHash('sha1').update(source).digest('hex').slice(0, 12);
    return `${kind}-${digest}`;
}

function readJson(relativePath) {
    const absolutePath = path.join(ROOT, relativePath);
    return {
        absolutePath,
        value: JSON.parse(fs.readFileSync(absolutePath, 'utf8')),
    };
}

function writeJson(absolutePath, value) {
    fs.writeFileSync(absolutePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

let totalAdded = 0;
let totalExisting = 0;
let failures = 0;

for (const source of SOURCES) {
    const { absolutePath, value } = readJson(source.path);
    const rows = Array.isArray(value) ? value : value?.events;
    if (!Array.isArray(rows)) {
        console.error(`[content-ids] ${source.path}: expected an events array`);
        failures += 1;
        continue;
    }

    const names = new Map();
    let changed = false;
    for (const row of rows) {
        if (!row || typeof row !== 'object') continue;
        const name = String(row.name ?? '').trim();
        const duplicateIndex = names.get(name) || 0;
        names.set(name, duplicateIndex + 1);
        if (String(row.id || '').trim()) {
            totalExisting += 1;
            continue;
        }
        row.id = stableId(source.kind, name, duplicateIndex);
        totalAdded += 1;
        changed = true;
    }

    if (changed && !checkOnly) writeJson(absolutePath, value);
    console.log(
        `[content-ids] ${source.path}: ${rows.length} records, `
        + `${rows.filter((row) => row && row.id).length} with IDs`
        + (changed ? (checkOnly ? ' (would update)' : ' (updated)') : ''),
    );
}

if (failures > 0) process.exitCode = 1;
console.log(
    `[content-ids] ${checkOnly ? 'check complete' : 'migration complete'}: `
    + `${totalAdded} new, ${totalExisting} existing`,
);
