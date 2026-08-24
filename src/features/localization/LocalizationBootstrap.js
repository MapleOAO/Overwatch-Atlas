import { localization } from './LocalizationService.js';

function publishReady(service) {
    if (typeof window === 'undefined') return;
    window.AtlasI18n = service;
    window.AtlasI18nReady = Promise.resolve(service);
    window.dispatchEvent(new CustomEvent('atlas:i18n-ready', { detail: service }));
}

async function boot() {
    try {
        await localization.init();
        publishReady(localization);
    } catch (error) {
        // The app remains usable in English if a locale asset is unavailable.
        console.warn('[AtlasI18n] zh-CN overlay unavailable:', error);
        publishReady(localization);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
    void boot();
}

