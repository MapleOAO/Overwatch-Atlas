import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const localePath = path.join(ROOT, 'src/data/locales/zh-CN/content.json');
const locale = JSON.parse(fs.readFileSync(localePath, 'utf8'));
const strict = process.argv.includes('--strict');

const DATASETS = [
    ['event', 'src/data/event-system/timeline-events.json', 'events'],
    ['hero', 'src/data/story-archive/heroes.json', 'events'],
    ['faction', 'src/data/story-archive/factions.json', 'events'],
    ['npc', 'src/data/story-archive/npcs.json', 'events'],
    ['location', 'src/data/story-archive/locations.json', 'events'],
];

function hashRecord(record) {
    const clone = JSON.parse(JSON.stringify(record));
    delete clone.id;
    return crypto.createHash('sha256').update(JSON.stringify(clone)).digest('hex');
}

const result = {
    locale: locale.locale,
    strict,
    sourceRecords: 0,
    overlayRecords: 0,
    missingRecords: [],
    staleRecords: [],
    pendingNames: [],
    unreviewedNames: [],
    pendingDescriptions: [],
    unreviewedDescriptions: [],
    headlineSources: 0,
    headlineOverlays: 0,
    pendingHeadlines: [],
};

for (const [kind, relativePath, key] of DATASETS) {
    const source = JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
    const records = Array.isArray(source) ? source : source[key];
    const rows = locale.records?.[kind] || {};
    result.overlayRecords += Object.keys(rows).length;
    for (const record of records || []) {
        result.sourceRecords += 1;
        const row = rows[record.id];
        if (!row) {
            result.missingRecords.push(`${kind}:${record.id}:${record.name || ''}`);
            continue;
        }
        if (row.sourceHash !== hashRecord(record)) result.staleRecords.push(`${kind}:${record.id}`);
        if (!row.name?.target || row.name.target === record.name) result.pendingNames.push(`${kind}:${record.name}`);
        if (row.name?.target && row.name.status !== 'reviewed') result.unreviewedNames.push(`${kind}:${record.name}`);
        if (record.description && !row.description?.target) result.pendingDescriptions.push(`${kind}:${record.name}`);
        if (record.description && row.description?.target && row.description.status !== 'reviewed') {
            result.unreviewedDescriptions.push(`${kind}:${record.name}`);
        }
        if (kind === 'event') {
            for (const headline of Array.isArray(record.headlines) ? record.headlines : []) {
                const sourceHeadline = String(headline || '').trim();
                if (!sourceHeadline) continue;
                result.headlineSources += 1;
                const overlay = Object.values(locale.headlines || {}).find((entry) => entry.source === sourceHeadline);
                if (!overlay) result.pendingHeadlines.push(sourceHeadline);
                else result.headlineOverlays += 1;
            }
        }
    }
}

const errors = [...result.missingRecords, ...result.staleRecords];
if (strict) errors.push(
    ...result.pendingNames.map((x) => `pending-name:${x}`),
    ...result.unreviewedNames.map((x) => `unreviewed-name:${x}`),
    ...result.pendingDescriptions.map((x) => `pending-description:${x}`),
    ...result.unreviewedDescriptions.map((x) => `unreviewed-description:${x}`),
    ...result.pendingHeadlines.map((x) => `pending-headline:${x}`),
);
console.log(JSON.stringify({ ...result, errorCount: errors.length, errors: errors.slice(0, 100) }, null, 2));
if (errors.length) process.exitCode = 1;
