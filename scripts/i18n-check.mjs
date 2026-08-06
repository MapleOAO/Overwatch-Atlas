/**
 * Validate the Chinese localization overlay against canonical data.
 *
 * The normal command is report-only so new upstream content does not block a
 * merge or a Pages build.  CI can use --strict when a release must be fully
 * translated.
 *
 * Usage:
 *   node scripts/i18n-check.mjs
 *   node scripts/i18n-check.mjs --strict
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STRICT = process.argv.includes('--strict');

const SOURCES = [
    { kind: 'event', archive: 'events', path: 'src/data/event-system/timeline-events.json' },
    { kind: 'hero', archive: 'entities', path: 'src/data/story-archive/heroes.json' },
    { kind: 'faction', archive: 'entities', path: 'src/data/story-archive/factions.json' },
    { kind: 'npc', archive: 'entities', path: 'src/data/story-archive/npcs.json' },
    { kind: 'location', archive: 'entities', path: 'src/data/story-archive/locations.json' },
];

function readJson(relativePath) {
    return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
}

function rowsOf(value) {
    if (Array.isArray(value)) return value;
    return Array.isArray(value?.events) ? value.events : [];
}

function sourceHash(record) {
    const stable = {
        name: record?.name ?? '',
        description: record?.description ?? '',
        variants: record?.variants ?? [],
    };
    return crypto.createHash('sha256').update(JSON.stringify(stable)).digest('hex');
}

function targetOf(value) {
    if (!value) return '';
    if (typeof value === 'string') return value.trim();
    return String(value.target ?? value.translation ?? '').trim();
}

function hasGlossary(glossary, source) {
    return Boolean(glossary?.terms?.[source] || glossary?.[source]);
}

const localeRoot = path.join(ROOT, 'src/data/locales/zh-CN');
const ui = readJson('src/data/locales/zh-CN/ui.json');
const glossary = readJson('src/data/locales/zh-CN/glossary.json');
const content = readJson('src/data/locales/zh-CN/content.json');

const errors = [];
const warnings = [];
const counts = {
    sourceRecords: 0,
    translatedNames: 0,
    translatedDescriptions: 0,
    missingNames: 0,
    missingDescriptions: 0,
    stale: 0,
};

for (const source of SOURCES) {
    const rows = rowsOf(readJson(source.path));
    const ids = new Set();
    for (const row of rows) {
        counts.sourceRecords += 1;
        const id = String(row?.id ?? '').trim();
        if (!id) {
            errors.push(`${source.path}: record has no stable id (${row?.name || 'unnamed'})`);
            continue;
        }
        if (ids.has(id)) errors.push(`${source.path}: duplicate id ${id}`);
        ids.add(id);

        const bucket = content?.[source.archive] || {};
        const translation = bucket[id] || {};
        const name = targetOf(translation.name || translation.title);
        const description = targetOf(translation.description);
        const glossaryName = hasGlossary(glossary, String(row?.name ?? '').trim());
        if (name || glossaryName) counts.translatedNames += 1;
        else {
            counts.missingNames += 1;
            warnings.push(`${source.kind} ${id}: missing name translation (${row?.name || 'unnamed'})`);
        }

        if (source.kind === 'event' && String(row?.description ?? '').trim()) {
            if (description) counts.translatedDescriptions += 1;
            else {
                counts.missingDescriptions += 1;
                warnings.push(`${source.kind} ${id}: missing description translation (${row?.name || 'unnamed'})`);
            }
        }

        if (translation.sourceHash && translation.sourceHash !== sourceHash(row)) {
            counts.stale += 1;
            warnings.push(`${source.kind} ${id}: source changed after translation (${row?.name || 'unnamed'})`);
        }
    }
}

for (const [key, entry] of Object.entries(ui.entries || {})) {
    if (!entry || !String(entry.source || '').trim() || !String(entry.target || '').trim()) {
        errors.push(`ui.json: incomplete entry ${key}`);
    }
}

for (const file of ['ui.json', 'glossary.json', 'content.json']) {
    const p = path.join(localeRoot, file);
    if (!fs.existsSync(p)) errors.push(`missing locale file: ${p}`);
}

console.log(JSON.stringify({
    locale: 'zh-CN',
    strict: STRICT,
    counts,
    errors,
    warnings: warnings.slice(0, 30),
    warningCount: warnings.length,
}, null, 2));

if (errors.length > 0 || (STRICT && warnings.length > 0)) process.exitCode = 1;
