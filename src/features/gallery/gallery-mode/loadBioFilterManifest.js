/**
 * Manifest entries for Biography mode chips (heroes / factions / NPCs / locations).
 */

import { getHeroDisplayName, getFilterKeyAndDisplayName } from '../../system-interface/interface-filter-menu/buttons/filterKeyMapping.js';
import { normalizeBioBiographyCategory } from './bioBiographyCategories.js';
import { assetFetchOptions, versionedAssetUrl } from '../../universal-features/atlas-performance/runtimeAssetUrl.js';

/**
 * @typedef {import('./bioBiographyCategories.js').BioBiographyArchiveCategory} BioBiographyArchiveCategory
 */

/** @type {object | null} */
let manifestCache = null;

async function loadPlatformManifest() {
    if (manifestCache) return manifestCache;
    const response = await fetch(
        versionedAssetUrl('src/data/platform/manifest.json'),
        assetFetchOptions(),
    );
    if (!response.ok) {
        throw new Error(`manifest.json HTTP ${response.status}`);
    }
    manifestCache = await response.json();
    return manifestCache;
}

export function clearBioFilterManifestCache() {
    manifestCache = null;
}

/**
 * @param {BioBiographyArchiveCategory} category
 * @returns {Promise<Array<string|{ filename: string, displayName: string }>>}
 */
export async function loadBioFilterManifestEntries(category) {
    const cat = normalizeBioBiographyCategory(category);
    const manifest = await loadPlatformManifest();

    if (cat === 'locations') {
        return [];
    }

    if (cat === 'factions') {
        const factions = Array.isArray(manifest.factions) ? [...manifest.factions] : [];
        factions.sort((a, b) =>
            String(a?.displayName || '').localeCompare(
                String(b?.displayName || ''),
                undefined,
                { numeric: true, sensitivity: 'base' },
            ),
        );
        return factions;
    }

    if (cat === 'npcs') {
        const npcs = Array.isArray(manifest.npcs) ? [...manifest.npcs] : [];
        npcs.sort((a, b) =>
            getHeroDisplayName(a).localeCompare(getHeroDisplayName(b), undefined, {
                numeric: true,
                sensitivity: 'base',
            }),
        );
        return npcs;
    }

    const heroes = Array.isArray(manifest.heroes) ? [...manifest.heroes] : [];
    heroes.sort((a, b) =>
        getHeroDisplayName(a).localeCompare(getHeroDisplayName(b), undefined, {
            numeric: true,
            sensitivity: 'base',
        }),
    );
    return heroes;
}

/** @returns {Promise<string[]>} */
export async function loadHeroFilterManifest() {
    const heroes = await loadBioFilterManifestEntries('heroes');
    return /** @type {string[]} */ (heroes);
}

/**
 * @param {BioBiographyArchiveCategory} category
 * @param {string|{ filename: string, displayName: string }} item
 */
export function resolveBioManifestChipIdentity(category, item) {
    const cat = normalizeBioBiographyCategory(category);
    const filterType =
        cat === 'factions' ? 'factions' : cat === 'npcs' ? 'npcs' : 'heroes';
    return getFilterKeyAndDisplayName(item, filterType);
}
