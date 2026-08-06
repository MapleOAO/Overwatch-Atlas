import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOCALE_FILE = path.join(ROOT, 'src/data/locales/zh-CN/glossary.json');
const SOURCE_FILES = [
    'src/data/event-system/timeline-events.json',
    'src/data/story-archive/heroes.json',
    'src/data/story-archive/factions.json',
    'src/data/story-archive/npcs.json',
    'src/data/story-archive/locations.json',
    'src/data/worldview/locations.json',
    'src/data/worldview/location-display-names.json',
    'src/data/platform/manifest.json',
];
const DISPLAY_KEYS = new Set(['cityDisplayName', 'locationName', 'country', 'commonName']);
const ALLOWED_LATIN = ['MEKA'];

function readJson(file) {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function collect(value, out = []) {
    if (Array.isArray(value)) {
        value.forEach((item) => collect(item, out));
        return out;
    }
    if (!value || typeof value !== 'object') return out;
    for (const [key, child] of Object.entries(value)) {
        if (DISPLAY_KEYS.has(key) && typeof child === 'string') out.push(child);
        collect(child, out);
    }
    return out;
}

function localized(value, glossary) {
    let output = String(value ?? '');
    const entries = Object.entries(glossary.terms || {})
        .map(([source, entry]) => ({ source, target: typeof entry === 'string' ? entry : entry?.target }))
        .filter((entry) => entry.target && entry.source !== entry.target)
        .sort((a, b) => b.source.length - a.source.length);
    for (const entry of entries) {
        const escaped = entry.source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        output = output.replace(
            new RegExp(`(^|[^A-Za-z0-9])(${escaped})(?=$|[^A-Za-z0-9])`, 'gi'),
            `$1${entry.target}`,
        );
    }
    return output;
}

const glossary = readJson(LOCALE_FILE);
const values = [...new Set(SOURCE_FILES.flatMap((file) => collect(readJson(path.join(ROOT, file)))))]
    .filter((value) => /[A-Za-z]{3}/.test(value));
const failures = [];
for (const source of values) {
    let target = localized(source, glossary);
    for (const allowed of ALLOWED_LATIN) target = target.replaceAll(allowed, '');
    if (/[A-Za-z]{3}/.test(target)) failures.push(`${source} => ${localized(source, glossary)}`);
}

if (failures.length) {
    console.error(`[visible-zh] found ${failures.length} location/metadata labels with untranslated Latin text`);
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exitCode = 1;
} else {
    console.log(`[visible-zh] checked ${values.length} location/metadata labels; no untranslated visible Latin remains`);
}
