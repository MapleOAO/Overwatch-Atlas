/**
 * Runtime display helpers for data-backed labels.
 *
 * Canonical records remain in the source language so IDs, matching, image
 * paths, and upstream sync stay stable. These helpers only affect visible
 * labels and refresh once the locale files have finished loading.
 */

export function localizedEventName(event, sourceName, variantIndex = null) {
    const raw = String(sourceName ?? '');
    const i18n = typeof window !== 'undefined' ? window.AtlasI18n : null;
    if (!i18n?.displayName) return raw;
    return i18n.displayName(raw, {
        kind: 'event',
        id: event?.id,
        variantIndex,
    });
}

export function applyEventNameWhenLocaleReady({
    event,
    sourceName,
    variantIndex = null,
    isCurrent = null,
    apply,
}) {
    if (typeof apply !== 'function') return;

    const update = () => {
        if (typeof isCurrent === 'function' && !isCurrent()) return;
        apply(localizedEventName(event, sourceName, variantIndex));
    };

    update();
    const i18n = typeof window !== 'undefined' ? window.AtlasI18n : null;
    const ready = typeof window !== 'undefined'
        ? (window.AtlasI18nReady || i18n?.ready)
        : null;
    if (ready?.then) ready.then(update).catch(() => {});
}
