/**
 * Add stable IDs to canonical content records.
 *
 * IDs are derived from the English source name plus a deterministic duplicate
 * ordinal. The English files remain the source of truth; locale overlays key by
 * these IDs so an upstream reorder does not invalidate translations.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILES = [
    ['event', 'src/data/event-system/timeline-events.json', 'events'],
    ['hero', 'src/data/story-archive/heroes.json', 'events'],
    ['faction', 'src/data/story-archive/factions.json', 'events'],
    ['npc', 'src/data/story-archive/npcs.json', 'events'],
    ['location', 'src/data/story-archive/locations.json', 'events'],
];

function stableId(kind, name, ordinal) {
    const digest = crypto
        .createHash('sha1')
        .update(`${kind}:${String(name || '').trim().toLowerCase()}:${ordinal}`)
        .digest('hex')
        .slice(0, 12);
    return `${kind}-${digest}`;
}

let changed = 0;
let missing = 0;

for (const [kind, relativePath, arrayKey] of FILES) {
    const filePath = path.join(ROOT, relativePath);
    if (!fs.existsSync(filePath)) continue;
    const document = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const records = Array.isArray(document) ? document : document[arrayKey];
    if (!Array.isArray(records)) continue;
    const seenNames = new Map();
    for (const record of records) {
        const name = String(record?.name || record?.displayName || record?.title || '').trim();
        const ordinal = seenNames.get(name.toLowerCase()) || 0;
        seenNames.set(name.toLowerCase(), ordinal + 1);
        const expected = stableId(kind, name, ordinal);
        if (!record.id) {
            record.id = expected;
            changed += 1;
        }
        if (!record.id) missing += 1;
    }
    if (process.argv.includes('--check')) continue;
    fs.writeFileSync(filePath, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
}

if (process.argv.includes('--check')) {
    if (changed || missing) {
        console.error(`[content:ids] ${changed} records need IDs`);
        process.exitCode = 1;
    } else {
        console.log('[content:ids] stable IDs verified');
    }
} else {
    console.log(`[content:ids] added ${changed} stable IDs`);
}
