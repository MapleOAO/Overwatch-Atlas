/**
 * Copies the static site into _site/ for GitHub Pages, excluding dev-only paths.
 * Run after scripts/generate-manifest.js: npm run build:pages
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildTimelineBundleStamp } from '../src/features/system-interface/interface-left-panel/event-system/data/timelineBundleStamp.js';
import { buildDialogueTheaterBundleStamp } from '../src/features/dialogue-theater/data/dialogueTheaterBundleStamp.js';

let sharp = null;
try {
    ({ default: sharp } = await import('sharp'));
} catch (_) {
    console.warn('[pages] sharp is not installed; keeping source raster files for this local build');
}
let staticImageFormat = 'source';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, '_site');

// The heavy families are converted for Pages. Smaller filter/UI icons stay in
// PNG because they are addressed by many legacy dynamic paths and do not
// justify a compatibility break; the source tree remains untouched.
const OPTIMIZED_IMAGE_DIRS = [
    'src/assets/images/Archive',
    'src/assets/images/Maps',
    'src/assets/images/Background Pattern',
];
const RASTER_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg']);
const TEXT_EXTENSIONS = new Set(['.html', '.js', '.mjs', '.cjs', '.css', '.json', '.md', '.xml', '.svg']);

const EXCLUDE_NAMES = new Set([
    '.git',
    '.github',
    'node_modules',
    '_site',
    '.cursor',
    'terminals',
    'scripts',
    'docs',
]);

const MIN_CODEX_SAVE_VERSION = 5;

function shouldCopyName(name) {
    if (EXCLUDE_NAMES.has(name)) return false;
    if (name === '.env' || name === '.env.local') return false;
    return true;
}

function copyRecursive(srcDir, destDir) {
    fs.mkdirSync(destDir, { recursive: true });
    const entries = fs.readdirSync(srcDir, { withFileTypes: true });
    for (const ent of entries) {
        if (!shouldCopyName(ent.name)) continue;
        const from = path.join(srcDir, ent.name);
        const to = path.join(destDir, ent.name);
        if (ent.isDirectory()) {
            copyRecursive(from, to);
        } else if (ent.isSymbolicLink()) {
            continue;
        } else {
            fs.copyFileSync(from, to);
        }
    }
}

function listFiles(rootDir) {
    const files = [];
    const walk = (dir) => {
        for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
            const fullPath = path.join(dir, ent.name);
            if (ent.isDirectory()) walk(fullPath);
            else if (ent.isFile()) files.push(fullPath);
        }
    };
    walk(rootDir);
    return files;
}

function webpOptions(relativePath) {
    if (relativePath.includes('/Maps/Utility/')) return { quality: 90, effort: 4, alphaQuality: 90 };
    if (relativePath.includes('/Maps/')) return { quality: 88, effort: 4, alphaQuality: 88 };
    if (relativePath.includes('/Archive/')) return { quality: 84, effort: 4, alphaQuality: 84 };
    return { quality: 86, effort: 4, alphaQuality: 86 };
}

function addImagePathReplacements(replacements, relativePath) {
    const normalized = relativePath.split(path.sep).join('/');
    const withoutSrc = normalized.startsWith('src/') ? normalized.slice(4) : normalized;
    const encodeDirectoriesOnly = (value) => {
        const slash = value.lastIndexOf('/');
        if (slash < 0) return value;
        return `${encodeURI(value.slice(0, slash))}/${value.slice(slash + 1)}`;
    };
    const variants = new Set([
        normalized,
        withoutSrc,
        encodeURI(normalized),
        encodeURI(withoutSrc),
        encodeDirectoriesOnly(normalized),
        encodeDirectoriesOnly(withoutSrc),
    ]);
    const optimized = (value) => value.replace(/\.(?:png|jpe?g)$/i, '.webp');
    for (const oldValue of variants) replacements.set(oldValue, optimized(oldValue));
}

async function optimizeStaticImages() {
    if (!sharp) return;
    sharp.cache({ memory: 128, files: 0, items: 25 });
    sharp.concurrency(2);
    const imageFiles = [];
    for (const relativeRoot of OPTIMIZED_IMAGE_DIRS) {
        const absoluteRoot = path.join(OUT, relativeRoot);
        if (!fs.existsSync(absoluteRoot)) continue;
        for (const file of listFiles(absoluteRoot)) {
            if (RASTER_EXTENSIONS.has(path.extname(file).toLowerCase())) imageFiles.push(file);
        }
    }

    const replacements = new Map();
    let originalBytes = 0;
    let optimizedBytes = 0;
    for (const sourcePath of imageFiles) {
        const relativePath = path.relative(OUT, sourcePath).split(path.sep).join('/');
        const outputPath = sourcePath.replace(/\.(?:png|jpe?g)$/i, '.webp');
        const outputBuffer = await sharp(sourcePath).webp(webpOptions(relativePath)).toBuffer();
        if (!outputBuffer.length) continue;
        fs.writeFileSync(outputPath, outputBuffer);
        originalBytes += fs.statSync(sourcePath).size;
        optimizedBytes += outputBuffer.length;
        addImagePathReplacements(replacements, relativePath);
        fs.rmSync(sourcePath, { force: true });
    }

    const textFiles = listFiles(OUT).filter((file) => TEXT_EXTENSIONS.has(path.extname(file).toLowerCase()));
    for (const file of textFiles) {
        const source = fs.readFileSync(file, 'utf8');
        let next = source;
        for (const [oldValue, newValue] of replacements) {
            if (next.includes(oldValue)) next = next.split(oldValue).join(newValue);
        }
        if (next !== source) fs.writeFileSync(file, next, 'utf8');
    }

    const saved = originalBytes > 0 ? (1 - optimizedBytes / originalBytes) * 100 : 0;
    staticImageFormat = 'webp';
    console.log(`Optimized ${imageFiles.length} images: ${originalBytes} -> ${optimizedBytes} bytes (${saved.toFixed(1)}% smaller)`);
}

function escapeHtmlAttr(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;');
}

function injectStaticDeployMeta(siteIndex) {
    if (!fs.existsSync(siteIndex)) {
        throw new Error('Missing _site/index.html');
    }
    let html = fs.readFileSync(siteIndex, 'utf8');
    if (!/name=["']timeline-deploy["']/i.test(html)) {
        const marker = '<meta name="timeline-deploy" content="static">';
        if (/<meta\s+charset=/i.test(html)) {
            html = html.replace(/(<meta\s+charset=["']UTF-8["']\s*\/?>)/i, `$1\n    ${marker}`);
        } else {
            html = html.replace(/<head(\s[^>]*)?>/i, (m) => `${m}\n    ${marker}`);
        }
    }
    fs.writeFileSync(siteIndex, html, 'utf8');
}

function injectBuildRuntime(siteIndex) {
    const buildVersion = process.env.GITHUB_SHA || process.env.SOURCE_VERSION || 'local';
    let html = fs.readFileSync(siteIndex, 'utf8');
    if (!/name=["']atlas-build-version["']/i.test(html)) {
        const marker = `<meta name="atlas-build-version" content="${escapeHtmlAttr(buildVersion)}">`;
        html = html.replace(/<head(\s[^>]*)?>/i, (m) => `${m}\n    ${marker}`);
    }
    if (!/id=["']atlas-static-runtime["']/i.test(html)) {
        const runtime = '<script id="atlas-static-runtime">'
            + 'window.__ATLAS_STATIC_BUILD__=true;'
            + `window.__ATLAS_BUILD_VERSION__=${JSON.stringify(buildVersion)};`
            + 'window.__ATLAS_IMAGE_FORMAT__="webp";'
            + 'window.atlasOptimizeImagePath=function(p){var s=String(p||""),h=s.search("[?#]"),e=h<0?s.length:h,d=s.slice(0,e),i=d.lastIndexOf("."),x=d.slice(i).toLowerCase();return(x===".png"||x===".jpg"||x===".jpeg")?d.slice(0,i)+".webp"+s.slice(e):s;};'
            + 'window.atlasOptimizeImagePath=(function(previous){return function(p){var s=String(p||""),heavy=/(?:^|\\/)src\\/assets\\/images\\/(?:Archive|Maps|Background(?:%20| )Pattern)\\//i.test(s);return heavy?previous(s):s;};})(window.atlasOptimizeImagePath);'
            + `window.__ATLAS_IMAGE_FORMAT__=${JSON.stringify(staticImageFormat)};`
            + `if(window.__ATLAS_IMAGE_FORMAT__!=="webp")window.atlasOptimizeImagePath=function(p){return String(p||"");};`
            + '</script>';
        html = html.replace(/<\/head>/i, `${runtime}\n</head>`);
    }
    fs.writeFileSync(siteIndex, html, 'utf8');
}

function injectTimelineBundleMeta(siteIndex) {
    const timelinePath = path.join(OUT, 'src', 'data', 'event-system', 'timeline-events.json');
    if (!fs.existsSync(timelinePath)) {
        throw new Error('Missing _site/src/data/event-system/timeline-events.json');
    }
    const data = JSON.parse(fs.readFileSync(timelinePath, 'utf8'));
    const events = Array.isArray(data.events) ? data.events : [];
    const count = events.length;
    // Content hash over the full bundle, so any committed change ships a new stamp and
    // reliably overrides stale browser caches (see timelineBundleStamp.js).
    const stamp = buildTimelineBundleStamp(events);
    const countMeta = `<meta name="timeline-bundle-events" content="${count}">`;
    const stampMeta = `<meta name="timeline-bundle-stamp" content="${escapeHtmlAttr(stamp)}">`;

    let html = fs.readFileSync(siteIndex, 'utf8');
    html = html.replace(/\s*<meta name=["']timeline-bundle-events["'][^>]*>\s*/gi, '\n');
    html = html.replace(/\s*<meta name=["']timeline-bundle-stamp["'][^>]*>\s*/gi, '\n');

    const anchor = /<meta name=["']timeline-deploy["'][^>]*>/i;
    if (anchor.test(html)) {
        html = html.replace(anchor, (m) => `${m}\n    ${countMeta}\n    ${stampMeta}`);
    } else if (/<meta\s+charset=/i.test(html)) {
        html = html.replace(
            /(<meta\s+charset=["']UTF-8["']\s*\/?>)/i,
            `$1\n    ${countMeta}\n    ${stampMeta}`,
        );
    } else {
        html = html.replace(/<head(\s[^>]*)?>/i, (m) => `${m}\n    ${countMeta}\n    ${stampMeta}`);
    }

    fs.writeFileSync(siteIndex, html, 'utf8');
}

function injectDialogueTheaterBundleMeta(siteIndex) {
    const conversationsPath = path.join(
        OUT,
        'src',
        'data',
        'dialogue-theater',
        'conversations.json',
    );
    if (!fs.existsSync(conversationsPath)) {
        throw new Error('Missing _site/src/data/dialogue-theater/conversations.json');
    }
    const data = JSON.parse(fs.readFileSync(conversationsPath, 'utf8'));
    const conversations = Array.isArray(data.conversations) ? data.conversations : [];
    const count = conversations.length;
    const stamp = buildDialogueTheaterBundleStamp(conversations);
    const countMeta = `<meta name="dialogue-theater-bundle-conversations" content="${count}">`;
    const stampMeta = `<meta name="dialogue-theater-bundle-stamp" content="${escapeHtmlAttr(stamp)}">`;

    let html = fs.readFileSync(siteIndex, 'utf8');
    html = html.replace(/\s*<meta name=["']dialogue-theater-bundle-conversations["'][^>]*>\s*/gi, '\n');
    html = html.replace(/\s*<meta name=["']dialogue-theater-bundle-stamp["'][^>]*>\s*/gi, '\n');

    const anchor = /<meta name=["']timeline-bundle-stamp["'][^>]*>/i;
    if (anchor.test(html)) {
        html = html.replace(anchor, (m) => `${m}\n    ${countMeta}\n    ${stampMeta}`);
    } else if (/<meta name=["']timeline-deploy["'][^>]*>/i.test(html)) {
        html = html.replace(
            /<meta name=["']timeline-deploy["'][^>]*>/i,
            (m) => `${m}\n    ${countMeta}\n    ${stampMeta}`,
        );
    } else if (/<meta\s+charset=/i.test(html)) {
        html = html.replace(
            /(<meta\s+charset=["']UTF-8["']\s*\/?>)/i,
            `$1\n    ${countMeta}\n    ${stampMeta}`,
        );
    } else {
        html = html.replace(/<head(\s[^>]*)?>/i, (m) => `${m}\n    ${countMeta}\n    ${stampMeta}`);
    }

    fs.writeFileSync(siteIndex, html, 'utf8');
}

function removeDevOnlyArtifacts() {
    const paths = [
        path.join(OUT, 'src', 'server.js'),
    ];
    for (const p of paths) {
        if (fs.existsSync(p)) fs.rmSync(p, { force: true });
    }
}

function validateStaticSite() {
    const errors = [];

    if (staticImageFormat === 'webp') {
        for (const relativeRoot of OPTIMIZED_IMAGE_DIRS) {
            const absoluteRoot = path.join(OUT, relativeRoot);
            if (!fs.existsSync(absoluteRoot)) continue;
            const rasterLeftovers = listFiles(absoluteRoot).filter((file) =>
                RASTER_EXTENSIONS.has(path.extname(file).toLowerCase()),
            );
            if (rasterLeftovers.length) {
                errors.push(
                    `${relativeRoot} still contains ${rasterLeftovers.length} raster file(s) after WebP build`,
                );
            }
        }
    }

    if (!fs.existsSync(path.join(OUT, '.nojekyll'))) {
        errors.push('Missing _site/.nojekyll');
    }

    const siteIndex = path.join(OUT, 'index.html');
    if (!fs.existsSync(siteIndex)) {
        errors.push('Missing _site/index.html');
    } else {
        const html = fs.readFileSync(siteIndex, 'utf8');
        if (!/name=["']timeline-deploy["']/i.test(html)) {
            errors.push('index.html missing <meta name="timeline-deploy" content="static">');
        }
        if (!/name=["']timeline-bundle-stamp["']/i.test(html)) {
            errors.push('index.html missing <meta name="timeline-bundle-stamp" …> (run build:pages)');
        }
        if (!/name=["']timeline-bundle-events["']/i.test(html)) {
            errors.push('index.html missing <meta name="timeline-bundle-events" …> (run build:pages)');
        }
        if (!/name=["']dialogue-theater-bundle-stamp["']/i.test(html)) {
            errors.push(
                'index.html missing <meta name="dialogue-theater-bundle-stamp" …> (run build:pages)',
            );
        }
        if (!/name=["']dialogue-theater-bundle-conversations["']/i.test(html)) {
            errors.push(
                'index.html missing <meta name="dialogue-theater-bundle-conversations" …> (run build:pages)',
            );
        }
    }

    const timelinePath = path.join(OUT, 'src', 'data', 'event-system', 'timeline-events.json');
    if (!fs.existsSync(timelinePath)) {
        errors.push('Missing _site/src/data/event-system/timeline-events.json');
    } else {
        try {
            const timeline = JSON.parse(fs.readFileSync(timelinePath, 'utf8'));
            const n = Array.isArray(timeline.events) ? timeline.events.length : 0;
            if (n === 0) errors.push('timeline-events.json has zero events');
        } catch (e) {
            errors.push(`timeline-events.json is not valid JSON: ${e?.message || e}`);
        }
    }

    const conversationsPath = path.join(
        OUT,
        'src',
        'data',
        'dialogue-theater',
        'conversations.json',
    );
    if (!fs.existsSync(conversationsPath)) {
        errors.push('Missing _site/src/data/dialogue-theater/conversations.json');
    } else {
        try {
            const theater = JSON.parse(fs.readFileSync(conversationsPath, 'utf8'));
            const n = Array.isArray(theater.conversations) ? theater.conversations.length : 0;
            if (n === 0) errors.push('conversations.json has zero conversations');
        } catch (e) {
            errors.push(`conversations.json is not valid JSON: ${e?.message || e}`);
        }
    }

    const codexPath = path.join(OUT, 'src', 'data', 'codex', 'codex-labels.json');
    if (!fs.existsSync(codexPath)) {
        errors.push('Missing _site/src/data/codex/codex-labels.json');
    } else {
        try {
            const codex = JSON.parse(fs.readFileSync(codexPath, 'utf8'));
            const v = typeof codex.v === 'number' ? codex.v : 0;
            if (v < MIN_CODEX_SAVE_VERSION) {
                errors.push(
                    `codex-labels.json v${v} is below v${MIN_CODEX_SAVE_VERSION} (connection metadata requires v5+)`,
                );
            }
            if (!Array.isArray(codex.connections)) {
                errors.push('codex-labels.json missing connections[] array (commit Codex v5 export before deploy)');
            }
            const nodeCount = Array.isArray(codex.nodes) ? codex.nodes.length : 0;
            if (nodeCount === 0) {
                errors.push('codex-labels.json has zero nodes');
            }
        } catch (e) {
            errors.push(`codex-labels.json is not valid JSON: ${e?.message || e}`);
        }
    }

    const manifestPath = path.join(OUT, 'src', 'data', 'platform', 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
        errors.push('Missing _site/src/data/platform/manifest.json (run generate-manifest first)');
    }

    if (fs.existsSync(path.join(OUT, 'src', 'server.js'))) {
        errors.push('Dev server file should not be published: _site/src/server.js');
    }

    if (errors.length) {
        console.error('GitHub Pages build validation failed:');
        for (const msg of errors) {
            console.error(`  - ${msg}`);
        }
        process.exit(1);
    }
}

function printSummary() {
    const codexPath = path.join(OUT, 'src', 'data', 'codex', 'codex-labels.json');
    const codex = JSON.parse(fs.readFileSync(codexPath, 'utf8'));
    const manifest = JSON.parse(
        fs.readFileSync(path.join(OUT, 'src', 'data', 'platform', 'manifest.json'), 'utf8'),
    );
    const timeline = JSON.parse(
        fs.readFileSync(path.join(OUT, 'src', 'data', 'event-system', 'timeline-events.json'), 'utf8'),
    );
    console.log('GitHub Pages output:', OUT);
    console.log(`  timeline-events.json: ${timeline.events?.length ?? 0} events`);
    console.log(
        `  codex-labels.json: v${codex.v}, ${codex.nodes?.length ?? 0} nodes, `
            + `${codex.edges?.length ?? 0} edges, ${codex.connections?.length ?? 0} connection row(s)`,
    );
    console.log(
        `  manifest: ${manifest.heroes?.length ?? 0} heroes, `
            + `${manifest.factions?.length ?? 0} factions, ${manifest.npcs?.length ?? 0} npcs`,
    );
    const theater = JSON.parse(
        fs.readFileSync(path.join(OUT, 'src', 'data', 'dialogue-theater', 'conversations.json'), 'utf8'),
    );
    const siteBytes = listFiles(OUT).reduce((sum, file) => sum + fs.statSync(file).size, 0);
    console.log(`  conversations.json: ${theater.conversations?.length ?? 0} conversations`);
    console.log(`  static output size: ${(siteBytes / (1024 ** 3)).toFixed(2)} GiB`);
    console.log('  static deploy meta injected; dev-only paths excluded');
}

fs.rmSync(OUT, { recursive: true, force: true });
copyRecursive(ROOT, OUT);

fs.writeFileSync(path.join(OUT, '.nojekyll'), '');

await optimizeStaticImages();
injectStaticDeployMeta(path.join(OUT, 'index.html'));
injectBuildRuntime(path.join(OUT, 'index.html'));
injectTimelineBundleMeta(path.join(OUT, 'index.html'));
injectDialogueTheaterBundleMeta(path.join(OUT, 'index.html'));
removeDevOnlyArtifacts();
validateStaticSite();
printSummary();
