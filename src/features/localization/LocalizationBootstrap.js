import { AtlasI18n } from './LocalizationService.js';

// Keep the promise visible for loaders that need translated display data before
// their first render.  The service itself is intentionally safe to use before
// the JSON files finish loading because it has a built-in fallback glossary.
if (typeof window !== 'undefined') {
    window.AtlasI18n = AtlasI18n;
    window.AtlasI18nReady = AtlasI18n.ready;
}
