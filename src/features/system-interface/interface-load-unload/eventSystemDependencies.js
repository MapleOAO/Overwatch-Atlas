/**
 * Event-system dependency loader.
 *
 * The landing page must not download and evaluate the complete Event Manager
 * stack before the user has chosen Story or Data Archive. Keep the historical
 * script order, but load it only when the event system is actually requested.
 */

import { versionedAssetUrl } from '../../universal-features/atlas-performance/runtimeAssetUrl.js';

const EVENT_DEPENDENCY_TIMEOUT_MS = 30000;

const EVENT_DEPENDENCIES = Object.freeze([
    ['src/features/system-interface/interface-shared/slide-effects/GlitchTextOverlay.js', 'classic'],
    ['src/features/system-interface/interface-info-display/eventSlideMetaDisplays.js', 'module'],
    ['src/features/system-interface/interface-shared/factionIdMatching.js', 'classic'],
    ['src/features/system-interface/interface-left-panel/event-system/data/EventDataService.js', 'module'],
    ['src/features/system-interface/interface-left-panel/event-system/lookup/LocationLabelResolver.js', 'module'],
    ['src/features/world/worldview-shared-assets/data/flagFileByCommonName.js', 'classic'],
    ['src/features/system-interface/interface-shared/flags/flagFileResolver.js', 'classic'],
    ['src/features/system-interface/interface-shared/flags/flagLocationContext.js', 'classic'],
    ['src/features/system-interface/interface-shared/flags/secondaryCountryFlags.js', 'classic'],
    ['src/features/system-interface/interface-shared/flags/relevancyRowFilterHighlight.js', 'classic'],
    ['src/features/system-interface/interface-shared/flags/slideBioConnections.js', 'classic'],
    ['src/features/system-interface/interface-shared/flags/slideRelevantLocations.js', 'classic'],
    ['src/features/system-interface/interface-shared/flags/slideStoryFilterPlaces.js', 'classic'],
    ['src/features/system-interface/interface-shared/flags/LocationFlagHelpers.js', 'classic'],
    ['src/features/system-interface/interface-shared/eventTimelineFields.js', 'classic'],
    ['src/features/system-interface/interface-load-unload/integration/timelineMarkerSync.js', 'classic'],
    ['src/features/system-interface/interface-shared/hover-badge/eraHoverPreviewTheme.js', 'module'],
    ['src/features/system-interface/interface-shared/hover-badge/SummaryInfoBadge.js', 'module'],
    ['src/features/data-workshop/archive-category-shared/ArchiveCategoryTypes.js', 'module'],
    ['src/features/data-workshop/archive-category-factions/ArchiveFactionOrdering.js', 'module'],
    ['src/features/data-workshop/archive-category-heroes/ArchiveHeroRoles.js', 'module'],
    ['src/features/data-workshop/archive-category-heroes/ArchiveHeroSubroles.js', 'module'],
    ['src/features/data-workshop/archive-category-heroes/ArchiveHeroSorting.js', 'module'],
    ['src/features/data-workshop/archive-category-shared/ArchiveLegacyHelpers.js', 'module'],
    ['src/features/system-interface/interface-left-panel/event-system/render/EventRenderService.js', 'module'],
    ['src/features/system-interface/interface-left-panel/event-system/edit/EventEditService.js', 'module'],
    ['src/features/system-interface/interface-platform-input/news-ticker/FooterNewsTicker.js', 'classic'],
    ['src/features/system-interface/interface-left-panel/event-system/form/fields/LocationTypeFields.js', 'classic'],
    ['src/features/system-interface/interface-left-panel/event-system/form/fields/SourcePairFields.js', 'classic'],
    ['src/features/system-interface/interface-left-panel/event-system/form/fields/HeadlineFields.js', 'classic'],
    ['src/features/system-interface/interface-left-panel/event-system/form/autocomplete/FormTokenAutocomplete.js', 'module'],
    ['src/features/system-interface/interface-left-panel/event-system/form/EventFormService.js', 'module'],
    ['src/features/system-interface/interface-shared/bio-archive/HeroRelevantLocationsEditor.js', 'classic'],
    ['src/features/system-interface/interface-shared/bio-archive/mirrorBioArchiveConnections.js', 'classic'],
    ['src/features/system-interface/interface-shared/bio-archive/bioArchiveConnectionRangesBridge.js', 'module'],
    ['src/features/system-interface/interface-shared/bio-archive/BioArchiveConnectionsEditor.js', 'classic'],
    ['src/features/system-interface/interface-left-panel/event-system/drag-drop/EventListReorderDragDrop.js', 'module'],
    ['src/features/system-interface/interface-left-panel/event-system/listeners/EventListenerService.js', 'module'],
    ['src/features/system-interface/interface-left-panel/event-system/interaction/EventInteractionService.js', 'module'],
    ['src/features/system-interface/interface-left-panel/event-system/boot/runEventManagerInit.js', 'classic'],
    ['src/features/system-interface/interface-left-panel/event-system/lookup/CityCoordinateLookup.js', 'classic'],
    ['src/features/system-interface/interface-shared/EventImagePathResolver.js', 'classic'],
    ['src/features/world/worldview-event-sync/WorldviewGlobeSync.js', 'classic'],
    ['src/features/system-interface/interface-filter-menu/FiltersPanel.js', 'module'],
]);

let dependenciesPromise = null;

function loadScript(path, type) {
    const existing = Array.from(document.scripts).find(
        (script) => script.dataset.atlasEventDependency === path,
    );
    if (existing?.dataset.atlasEventDependencyLoaded === 'true') return Promise.resolve();

    return new Promise((resolve, reject) => {
        const script = existing || document.createElement('script');
        let settled = false;
        const timer = window.setTimeout(() => {
            if (settled) return;
            settled = true;
            script.remove();
            reject(new Error(`Timed out loading event dependency: ${path}`));
        }, EVENT_DEPENDENCY_TIMEOUT_MS);

        script.dataset.atlasEventDependency = path;
        script.type = type === 'module' ? 'module' : 'text/javascript';
        script.onload = () => {
            if (settled) return;
            settled = true;
            window.clearTimeout(timer);
            script.dataset.atlasEventDependencyLoaded = 'true';
            resolve();
        };
        script.onerror = () => {
            if (settled) return;
            settled = true;
            window.clearTimeout(timer);
            script.remove();
            reject(new Error(`Failed to load event dependency: ${path}`));
        };

        if (!existing) {
            script.src = versionedAssetUrl(path);
            document.head.appendChild(script);
        }
    });
}
/** Load all legacy Event Manager globals once, on first real use. */
export function ensureEventSystemDependencies() {
    if (dependenciesPromise) return dependenciesPromise;

    dependenciesPromise = (async () => {
        for (const [path, type] of EVENT_DEPENDENCIES) {
            await loadScript(path, type);
        }
    })().catch((error) => {
        dependenciesPromise = null;
        throw error;
    });

    return dependenciesPromise;
}
