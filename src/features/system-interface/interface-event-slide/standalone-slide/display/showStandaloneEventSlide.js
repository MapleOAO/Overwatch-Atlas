/**
 * Extracted from the standalone-slide factory (window.standaloneEventSlide).
 * The factory's showStandaloneEventSlide method delegates here so the factory file stays
 * scannable; the heavy body lives in this single-purpose file.
 *
 * The slide parameter is the standalone-slide controller (i.e. acts as
 * the original method's `this`).
 */

export function runShowStandaloneEventSlide(slide, eventData, globalIndex) {
            if (!eventData) return;
            
            const isMultiEvent = Array.isArray(eventData.variants) && eventData.variants.length > 0;
            const variantIndex = eventData.variantIndex || 0;
            slide.currentVariantIndex = variantIndex;
            const displayEvent = isMultiEvent && eventData.variants[variantIndex] 
                ? { ...eventData, ...eventData.variants[variantIndex] }
                : eventData;
            
            // Get event data for display
            let eventName = displayEvent.name || eventData.name || 'Unnamed Event';
            let description = displayEvent.description || '';
            const i18n = typeof window !== 'undefined' ? window.AtlasI18n : null;
            const archiveSource = window.eventManager?.dataService?.getArchiveSource?.();
            const localizationKind = archiveSource && archiveSource !== 'story' ? 'entity' : 'event';
            if (i18n) {
                eventName = i18n.displayName(eventName, {
                    kind: localizationKind,
                    id: eventData.id,
                    variantIndex,
                });
                description = i18n.displayText(description, {
                    kind: localizationKind,
                    id: eventData.id,
                    field: 'description',
                    variantIndex,
                });
            }

            // Get image path — dock rows are always main-timeline story art
            const useStoryDockImages = !!slide._presentationFromDockTimeline;
            let imagePath = null;
            if (window.NavigationImageHelpers?.getEventImagePath) {
                imagePath = window.NavigationImageHelpers.getEventImagePath(
                    displayEvent,
                    displayEvent.name || eventData.name,
                    useStoryDockImages ? 'story' : undefined
                );
            } else if (window.eventManager?.getEventImagePath) {
                imagePath = window.eventManager.getEventImagePath(
                    displayEvent.name,
                    displayEvent.image,
                    useStoryDockImages ? 'story' : undefined
                );
            } else {
                imagePath = displayEvent.image || displayEvent.imagePath || null;
            }
            
            // Apply glitch text if enabled
            if (window.GlitchTextService?.isEnabled?.()) {
                eventName = window.GlitchTextService.getDisplayEventName(eventName);
            }
            
            // Call the full displaySlide method with all features
            slide.displaySlide(eventName, imagePath, description, eventData, isMultiEvent, displayEvent);
            
            // Update nav buttons
            slide.updateNavButtons();
}
