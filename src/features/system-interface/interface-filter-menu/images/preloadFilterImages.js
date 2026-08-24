/**
 * Compatibility hook for callers that used to warm every filter thumbnail.
 * Actual thumbnails now use native `loading="lazy"` in
 * `createFilterImageElement`, so this function intentionally does no network
 * work. Keeping the API avoids coupling the many filter panels to a new boot
 * sequence while eliminating the request burst.
 */

export function preloadFilterImages() {
    return 0;
}
