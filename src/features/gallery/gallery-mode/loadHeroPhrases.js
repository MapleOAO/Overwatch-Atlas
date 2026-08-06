/**
 * Hero biography voicelines per hero from platform manifest (`heroPhrases`).
 * Each hero folder may include a `Selection.*` clip (plays on pick + eligible for random).
 */

import { assetFetchOptions, versionedAssetUrl } from '../../universal-features/atlas-performance/runtimeAssetUrl.js';

/** @type {Record<string, string[]> | null} */
let cachedHeroPhrasesMap = null;

async function fetchPlatformManifest() {
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
export async function loadHeroPhrasesMap() {
    if (cachedHeroPhrasesMap) return cachedHeroPhrasesMap;
    const manifest = await fetchPlatformManifest();
    const raw = manifest?.heroPhrases;
    cachedHeroPhrasesMap = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    return cachedHeroPhrasesMap;
}

export function clearHeroPhrasesCache() {
    cachedHeroPhrasesMap = null;
}

/**
 * @param {Record<string, string[]>} map
 * @param {string} heroFilterKey
 * @returns {string[]}
 */
export function getPhrasesForHero(map, heroFilterKey) {
    const key = String(heroFilterKey || '').trim();
    const list = key && map[key];
    if (!Array.isArray(list)) return [];
    return list.filter((f) => String(f || '').trim());
}

/**
 * Basename (no extension) for hero pick voicelines — e.g. Selection.ogg → "Selection".
 * @param {string} fileName
 * @returns {boolean}
 */
export function isHeroSelectionPhraseFile(fileName) {
    const base = String(fileName || '')
        .trim()
        .replace(/\.[^.]+$/i, '');
    return base.toLowerCase() === 'selection';
}

/**
 * @param {string[]} phraseFiles
 * @returns {string | null} First Selection clip in the hero folder, if any.
 */
export function findSelectionPhraseFile(phraseFiles) {
    if (!Array.isArray(phraseFiles)) return null;
    for (const file of phraseFiles) {
        const name = String(file || '').trim();
        if (name && isHeroSelectionPhraseFile(name)) return name;
    }
    return null;
}
