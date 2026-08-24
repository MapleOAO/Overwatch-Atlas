import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const glossary = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/locales/zh-CN/glossary.json'), 'utf8'));

const REQUIRED = {
    Overwatch: '守望先锋',
    'Null Sector': '零度方阵',
    Talon: '黑爪',
    Genji: '源氏',
    'D.va': 'D.Va',
    'D.Va': 'D.Va',
    Sojourn: '索杰恩',
    'Lifeweaver': '生命之梭',
    'Junker Queen': '渣客女王',
    'Jetpack Cat': '飞天猫',
};

const errors = [];
for (const [source, expected] of Object.entries(REQUIRED)) {
    const actual = glossary.entries?.[source]?.target;
    if (actual !== expected) errors.push(`${source}: expected ${expected}, got ${actual || '<missing>'}`);
}
if (errors.length) {
    console.error('[official-terms] failed');
    errors.forEach((error) => console.error(`  - ${error}`));
    process.exitCode = 1;
} else {
    console.log(`[official-terms] verified ${Object.keys(REQUIRED).length} official CN terms`);
}

