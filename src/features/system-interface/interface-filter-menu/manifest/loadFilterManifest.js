/**
 * Fetch `src/data/platform/manifest.json`, reorder its `heroes` / `factions` / `npcs`
 * lists by the Codex story archive. Filter thumbnails load lazily when their
 * chips enter the viewport; this avoids a burst of requests during boot.
 *
 * Cache-busting headers are aggressive (`Cache-Control: no-store` + query
 * param) because the dev server rewrites manifest.json on every asset add,
 * and stale chips with the wrong filename are very hard to debug.
 *
 * On failure (offline or 404) the panel still mounts — empty hero/faction
 * lists are passed through, and the user sees an empty filters tab rather
 * than a broken panel.
 */

import { applyStoryArchiveOrderFromNetwork } from './storyArchiveFilterOrder.js';

export async function loadFilterManifest(createFilterButtons, updateFilterCounts, preloadImages) {
    try {
        const cacheBuster = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const response = await fetch(`src/data/platform/manifest.json?v=${cacheBuster}`, {
            cache: 'no-store',
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache'
            }
        });
        const manifest = await response.json();

        let heroes = manifest.heroes ? [...manifest.heroes] : [];
        let npcs = manifest.npcs ? [...manifest.npcs] : [];
        let processedFactions = manifest.factions
            ? [...manifest.factions].map(f => ({ filename: f.filename, displayName: f.displayName }))
            : [];

        const ordered = await applyStoryArchiveOrderFromNetwork(heroes, processedFactions, npcs);
        heroes = ordered.heroes;
        processedFactions = ordered.factions;
        npcs = ordered.npcs;

        createFilterButtons(heroes, 'heroes', 'src/assets/images/Filters/Heroes');
        updateFilterCounts();

        return { heroes, factions: processedFactions, npcs };
    } catch (error) {
        console.error('Error loading manifest.json:', error);
        const heroes = [];
        const factions = [];
        createFilterButtons(heroes, 'heroes', 'src/assets/images/Filters/Heroes');
        return { heroes, factions, npcs: [] };
    }
}
