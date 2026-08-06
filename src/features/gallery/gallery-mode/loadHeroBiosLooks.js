/**
 * Hero biography looks per hero from platform manifest (`heroBios`).
 */

import {
    DEFAULT_HERO_BIO_LOOK,
    sortHeroBioLookNames,
} from './heroBiographyHeroicImagePaths.js';
import { assetFetchOptions, versionedAssetUrl } from '../../universal-features/atlas-performance/runtimeAssetUrl.js';

/** @type {Record<string, string[]> | null} */
let cachedHeroBiosMap = null;

export async function fetchPlatformManifest() {
    const response = await fetch(
        versionedAssetUrl('src/data/platform/manifest.json'),
        assetFetchOptions(),
    );
    if (!response.ok) {
        throw new Error(`manifest.json HTTP ${response.status}`);
    }
    return response.json();
}

/**
 * @returns {Promise<Record<string, string[]>>}
 */
export async function loadHeroBiosLooksMap() {
    if (cachedHeroBiosMap) return cachedHeroBiosMap;
    const manifest = await fetchPlatformManifest();
    const raw = manifest?.heroBios;
    cachedHeroBiosMap = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    return cachedHeroBiosMap;
}

export function clearHeroBiosLooksCache() {
    cachedHeroBiosMap = null;
}

/**
 * @param {Record<string, string[]>} map
 * @param {string} heroFilterKey
 * @returns {string[]}
 */
export function getLooksForHero(map, heroFilterKey) {
    const key = String(heroFilterKey || '').trim();
    const fromManifest = key && map[key];
    if (Array.isArray(fromManifest) && fromManifest.length > 0) {
        return sortHeroBioLookNames(fromManifest);
    }
    return [DEFAULT_HERO_BIO_LOOK];
}
