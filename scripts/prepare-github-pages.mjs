/**
 * Copies the static site into _site/ for GitHub Pages, excluding dev-only paths.
 * Run after scripts/generate-manifest.js: npm run build:pages
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, '_site');

const OPTIMIZED_IMAGE_DIRS = [
    // Convert every raster image in the published bundle. The source tree
    // keeps PNG/JPEG for upstream-friendly editing; only _site gets WebP.
    // This also covers the previously missed Menu/Bios/World View/Icon assets.
    'src/assets/images',
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
    'translations.html',
]);

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
    if (relativePath.includes('/Maps/Utility/')) {
        return { quality: 90, effort: 4, alphaQuality: 90 };
    }
    if (relativePath.includes('/Maps/')) {
        return { quality: 88, effort: 4, alphaQuality: 88 };
    }
    if (relativePath.includes('/Archive/')) {
        return { quality: 84, effort: 4, alphaQuality: 84 };
    }
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
    for (const oldValue of variants) {
        replacements.set(oldValue, optimized(oldValue));
    }
}

async function optimizeStaticImages() {
    sharp.cache({ memory: 256, files: 0, items: 50 });
    sharp.concurrency(2);

    const imageFiles = [];
    for (const relativeRoot of OPTIMIZED_IMAGE_DIRS) {
        const absoluteRoot = path.join(OUT, relativeRoot);
        if (!fs.existsSync(absoluteRoot)) continue;
        for (const file of listFiles(absoluteRoot)) {
            if (RASTER_EXTENSIONS.has(path.extname(file).toLowerCase())) {
                imageFiles.push(file);
            }
        }
    }

    const replacements = new Map();
    let originalBytes = 0;
    let optimizedBytes = 0;
    for (let index = 0; index < imageFiles.length; index += 1) {
        const sourcePath = imageFiles[index];
        const relativePath = path.relative(OUT, sourcePath).split(path.sep).join('/');
        const outputPath = sourcePath.replace(/\.(?:png|jpe?g)$/i, '.webp');
        const sourceBytes = fs.statSync(sourcePath).size;
        // Encode in memory first. This makes the replacement atomic from the
        // publisher's point of view: a failed/empty encode never removes the
        // source image or rewrites references to a broken asset.
        const outputBuffer = await sharp(sourcePath)
            .webp(webpOptions(relativePath))
            .toBuffer();
        if (!outputBuffer.length) {
            console.warn(`Skipped empty WebP encode: ${relativePath}`);
            continue;
        }
        fs.writeFileSync(outputPath, outputBuffer);
        originalBytes += sourceBytes;
        optimizedBytes += outputBuffer.length;
        addImagePathReplacements(replacements, relativePath);
        fs.rmSync(sourcePath, { force: true });
    }

    const textFiles = listFiles(OUT).filter((file) => TEXT_EXTENSIONS.has(path.extname(file).toLowerCase()));
    for (const file of textFiles) {
        let source = fs.readFileSync(file, 'utf8');
        let next = source;
        for (const [oldValue, newValue] of replacements) {
            if (next.includes(oldValue)) next = next.split(oldValue).join(newValue);
        }
        if (next !== source) fs.writeFileSync(file, next, 'utf8');
    }

    // Sharp can leave an atomic-write scratch file if a previous encode was
    // interrupted. It is never part of the published asset set.
    for (const file of listFiles(path.join(OUT, 'src/assets/images'))) {
        if (/^\.[^/]+\.(?:png|jpe?g)\.[A-Za-z0-9_-]+$/i.test(path.basename(file))) {
            fs.rmSync(file, { force: true });
        }
    }
    for (const relativeRoot of OPTIMIZED_IMAGE_DIRS) {
        const absoluteRoot = path.join(OUT, relativeRoot);
        if (!fs.existsSync(absoluteRoot)) continue;
        for (const file of listFiles(absoluteRoot)) {
            if (RASTER_EXTENSIONS.has(path.extname(file).toLowerCase())) {
                const webpPath = file.replace(/\.(?:png|jpe?g)$/i, '.webp');
                let hasValidWebp = false;
                try {
                    hasValidWebp = fs.statSync(webpPath).size > 0;
                } catch (_) { /* keep the source fallback when WebP is absent */ }
                if (hasValidWebp) fs.rmSync(file, { force: true });
            }
        }
    }

    const saved = originalBytes > 0 ? (1 - optimizedBytes / originalBytes) * 100 : 0;
    console.log(
        `Optimized ${imageFiles.length} static images: ${originalBytes} -> ${optimizedBytes} bytes (${saved.toFixed(1)}% smaller)`,
    );
}

async function main() {
    fs.rmSync(OUT, { recursive: true, force: true });
    copyRecursive(ROOT, OUT);

// Never publish the local write server with the static Pages bundle.
    fs.rmSync(path.join(OUT, 'src', 'server.js'), { force: true });

// Ensure Jekyll is disabled on Pages
    fs.writeFileSync(path.join(OUT, '.nojekyll'), '');

// Mark deploy as static so runtime matches GitHub Pages (file over localStorage, no /api writes)
const siteIndex = path.join(OUT, 'index.html');
const buildVersion = process.env.GITHUB_SHA || process.env.SOURCE_VERSION || 'local';
if (fs.existsSync(siteIndex)) {
    let html = fs.readFileSync(siteIndex, 'utf8');
    if (!/name=["']timeline-deploy["']/i.test(html)) {
        const marker = '<meta name="timeline-deploy" content="static">';
        if (/<meta\s+charset=/i.test(html)) {
            html = html.replace(/(<meta\s+charset=["']UTF-8["']\s*\/?>)/i, `$1\n    ${marker}`);
        } else {
            html = html.replace(/<head(\s[^>]*)?>/i, (m) => `${m}\n    ${marker}`);
        }
        fs.writeFileSync(siteIndex, html, 'utf8');
    }

    const versionMarker = '<meta name="atlas-build-version" content="' + buildVersion + '">';
    if (!/name=["']atlas-build-version["']/i.test(html)) {
        html = html.replace(/<head(\s[^>]*)?>/i, (match) => `${match}\n    ${versionMarker}`);
    }
    const runtimeScript = '<script id="atlas-static-runtime">'
        + 'window.__ATLAS_STATIC_BUILD__=true;'
        + 'window.__ATLAS_BUILD_VERSION__=' + JSON.stringify(buildVersion) + ';'
        + 'window.__ATLAS_IMAGE_FORMAT__="webp";'
        + 'window.atlasOptimizeImagePath=function(path){var s=String(path||""),h=s.search("[?#]"),e=h<0?s.length:h,d=s.slice(0,e),i=d.lastIndexOf("."),x=d.slice(i).toLowerCase();return (x===".png"||x===".jpg"||x===".jpeg")?d.slice(0,i)+".webp"+s.slice(e):s;};'
        + '</script>';
    if (!/id=["']atlas-static-runtime["']/i.test(html)) {
        html = html.replace(/<\/head>/i, `${runtimeScript}\n</head>`);
    }
    fs.writeFileSync(siteIndex, html, 'utf8');
}

    await optimizeStaticImages();
    console.log('GitHub Pages output:', OUT);
}

main().catch((error) => {
    console.error('GitHub Pages build failed:', error);
    process.exitCode = 1;
});
