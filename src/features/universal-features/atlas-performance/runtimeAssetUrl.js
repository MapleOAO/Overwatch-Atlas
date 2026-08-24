/** Runtime helpers injected by the static Pages build. */

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
    return typeof window !== 'undefined' && window.__ATLAS_STATIC_BUILD__ === true;
}

export function optimizeImagePath(assetPath) {
    const path = String(assetPath || '');
    if (!isStaticPagesBuild() && typeof window !== 'undefined' && window.__ATLAS_IMAGE_FORMAT__ !== 'webp') {
        return path;
    }
    if (!/(?:^|\/)src\/assets\/images\/(?:Archive|Maps|Background(?:%20| )Pattern)\//i.test(path)) {
        return path;
    }
    return path.replace(/\.(?:png|jpe?g)(?=([?#]|$))/gi, '.webp');
}

export function versionedAssetUrl(assetPath) {
    const path = String(assetPath || '');
    const version = getAtlasBuildVersion();
    if (!version) return path;
    return `${path}${path.includes('?') ? '&' : '?'}v=${encodeURIComponent(version)}`;
}

export function assetFetchOptions() {
    return { cache: getAtlasBuildVersion() ? 'default' : 'no-store' };
}
