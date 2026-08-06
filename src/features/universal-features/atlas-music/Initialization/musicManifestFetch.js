/**
 * musicManifestFetch — fetch and parse `src/data/platform/manifest.json` for the music catalog.
 */

import { assetFetchOptions, versionedAssetUrl } from '../../atlas-performance/runtimeAssetUrl.js';

const getLogAssetLoad = () =>
    (typeof window !== 'undefined' && typeof window.logAssetLoad === 'function')
        ? window.logAssetLoad
        : () => {};

/**
 * @returns {Promise<{ music: Array<{ filename: string, name: string }> }>}
 */
export async function fetchMusicManifest() {
    const logAssetLoad = getLogAssetLoad();
    logAssetLoad('MUSIC', 'Loading manifest.json (PRIORITY)');

    const response = await fetch(
        versionedAssetUrl('src/data/platform/manifest.json'),
        assetFetchOptions(),
    );
    if (!response.ok) {
        throw new Error(`manifest.json HTTP ${response.status}`);
    }
    const manifest = await response.json();
    logAssetLoad('MUSIC', `manifest.json loaded (${manifest.music ? manifest.music.length : 0} music files)`);
    return manifest;
}
