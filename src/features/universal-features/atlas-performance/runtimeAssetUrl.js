/**
 * Shared cache/version helpers for static Pages assets.
 *
 * Local development intentionally stays cache-free so translation and asset
 * edits show up immediately. The Pages build injects a commit-based version
 * into <head>, which makes the same JSON/manifest URL reusable for every
 * reload while still invalidating it on a new deployment.
 */

export function getAtlasBuildVersion() {
    if (typeof window !== 'undefined' && window.__ATLAS_BUILD_VERSION__) {
        return String(window.__ATLAS_BUILD_VERSION__);
    }
    if (typeof document !== 'undefined') {
        const meta = document.querySelector('meta[name="atlas-build-version"]');
        if (meta?.content) return String(meta.content);
    }
    return '';
}

export function isStaticPagesBuild() {
    return typeof window !== 'undefined'
        && (window.__ATLAS_STATIC_BUILD__ === true || window.__ATLAS_IMAGE_FORMAT__ === 'webp');
}

export function versionedAssetUrl(assetPath) {
    const path = String(assetPath || '');
    const version = getAtlasBuildVersion();
    if (!version) return path;
    const separator = path.includes('?') ? '&' : '?';
    return `${path}${separator}v=${encodeURIComponent(version)}`;
}

export function assetFetchOptions() {
    return { cache: getAtlasBuildVersion() ? 'default' : 'no-store' };
}

/**
 * Pages serves the optimized derivative for the large image families. The
 * source tree remains PNG/JPEG so local editing and upstream merges stay
 * straightforward.
 */
export function optimizeImagePath(assetPath) {
    const path = String(assetPath || '');
    if (!isStaticPagesBuild()) return path;
    return path.replace(/\.(?:png|jpe?g)(?=([?#]|$))/gi, '.webp');
}
