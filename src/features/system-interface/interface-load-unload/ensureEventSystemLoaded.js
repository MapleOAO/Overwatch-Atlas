/** Load the Event System on demand for Story and Data Archive modes. */

let eventSystemPromise = null;

export function ensureEventSystemLoaded() {
    if (typeof window !== 'undefined' && window.eventManager) {
        return Promise.resolve(window.eventManager);
    }
    if (eventSystemPromise) return eventSystemPromise;

    eventSystemPromise = import('./EventSystemLoadOut.js?v=100')
        .then(({ loadEventSystem }) => loadEventSystem(null))
        .then(() => {
            if (!window.eventManager) {
                throw new Error('Event System failed to initialize');
            }
            return window.eventManager;
        })
        .catch((error) => {
            eventSystemPromise = null;
            throw error;
        });

    return eventSystemPromise;
}
