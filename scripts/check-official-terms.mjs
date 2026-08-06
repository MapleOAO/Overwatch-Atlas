import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOCALE_ROOT = path.join(ROOT, 'src/data/locales/zh-CN');
const REGISTRY_FILE = path.join(LOCALE_ROOT, 'official-terms.json');

const LEGACY_TARGETS = [
    '多米娜',
    '维德塔',
    '塞拉',
    '喷气背包猫',
    '瑞穗',
    '诗音',
    '维斯卡',
    '妖怪帮',
    'MEKA 小队',
    '朋克帮',
    '地平线月球基地',
    '锦绣塔',
    '瓦伊拉·辛格哈尼娅',
    '维什瓦卡玛·巴特',
    '维什卡·巴特',
    '川野瑞穗',
];

function readJson(file) {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function collectTargets(value, out = []) {
    if (Array.isArray(value)) {
        value.forEach((item) => collectTargets(item, out));
        return out;
    }
    if (!value || typeof value !== 'object') return out;
    for (const [key, child] of Object.entries(value)) {
        if ((key === 'target' || key === 'translation') && typeof child === 'string') out.push(child);
        else collectTargets(child, out);
    }
    return out;
}

const registry = readJson(REGISTRY_FILE);
const glossary = readJson(path.join(LOCALE_ROOT, 'glossary.json'));
const errors = [];
const terms = registry.terms || {};

for (const [source, expected] of Object.entries(terms)) {
    const actual = glossary.terms?.[source];
    if (!actual) {
        errors.push(`${source}: official registry entry is missing from glossary.json`);
        continue;
    }
    if (actual.target !== expected.target) {
        errors.push(`${source}: glossary target “${actual.target}” != official target “${expected.target}”`);
    }
    if (expected.status === 'reviewed' && actual.status !== 'reviewed') {
        errors.push(`${source}: official entry requires glossary status reviewed, got ${actual.status || 'missing'}`);
    }
    if (!String(expected.reference || '').startsWith('https://ow.blizzard.cn/')) {
        errors.push(`${source}: reference is not an ow.blizzard.cn page`);
    }
}

const localeFiles = ['ui.json', 'glossary.json', 'content.json', 'headlines.json'];
for (const file of localeFiles) {
    const values = collectTargets(readJson(path.join(LOCALE_ROOT, file)));
    for (const legacy of LEGACY_TARGETS) {
        const containsLegacy = (target) => legacy === '塞拉'
            ? target === legacy || target.startsWith(`${legacy}·`)
            : target.includes(legacy);
        if (values.some(containsLegacy)) {
            errors.push(`${file}: target still contains legacy term “${legacy}”`);
        }
    }
}

if (errors.length) {
    console.error(`[official-terms] failed with ${errors.length} error(s)`);
    errors.forEach((error) => console.error(`- ${error}`));
    process.exitCode = 1;
} else {
    console.log(`[official-terms] verified ${Object.keys(terms).length} registered terms; no legacy target remains`);
}
