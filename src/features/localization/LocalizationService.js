/**
 * Small, dependency-free runtime for the zh-CN overlay.
 *
 * The canonical application still owns the data and DOM lifecycle. This
 * service observes the DOM, translates stable labels/terms, and exposes
 * explicit helpers for data renderers that have a source record available.
 */

const LOCALE_ROOT = 'src/data/locales/zh-CN';
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'CODE', 'PRE']);

function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalize(value) {
    return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function sourceHash(record) {
    if (!record || typeof record !== 'object') return '';
    const copy = { ...record };
    delete copy.id;
    return JSON.stringify(copy);
}

export class LocalizationService {
    constructor(locale = 'zh-CN') {
        this.locale = locale;
        this.ui = new Map();
        this.glossary = new Map();
        this.records = new Map();
        this._ready = false;
        this._observer = null;
        this._scheduled = false;
        this._sourceToRecord = new Map();
    }

    async init() {
        if (this._ready) return this;
        const [ui, glossary, content] = await Promise.all([
            this._load('ui.json'),
            this._load('glossary.json'),
            this._load('content.json'),
        ]);
        for (const [source, entry] of Object.entries(ui?.entries || {})) {
            if (entry?.target) this.ui.set(normalize(source), String(entry.target));
        }
        for (const [source, entry] of Object.entries(glossary?.entries || {})) {
            if (entry?.target) this.glossary.set(normalize(source), String(entry.target));
        }
        for (const [kind, rows] of Object.entries(content?.records || {})) {
            for (const [id, row] of Object.entries(rows || {})) {
                this.records.set(`${kind}:${id}`, row);
                const sourceName = normalize(row?.name?.source);
                if (sourceName && row?.name?.target) this._sourceToRecord.set(sourceName, row);
            }
        }
        for (const row of Object.values(content?.headlines || {})) {
            if (row?.source && row?.target) this.glossary.set(normalize(row.source), String(row.target));
        }
        this._ready = true;
        this._installObserver();
        this.localizeDocument(document);
        return this;
    }

    async _load(file) {
        const response = await fetch(`${LOCALE_ROOT}/${file}`, { cache: 'no-store' });
        if (!response.ok) throw new Error(`Locale asset ${file} returned ${response.status}`);
        return response.json();
    }

    isReady() { return this._ready; }

    /** Exact UI/record translation followed by safe glossary substitution. */
    translate(value, options = {}) {
        const raw = String(value ?? '');
        const key = normalize(raw);
        if (!key) return raw;
        if (this.ui.has(key)) return this.ui.get(key);
        if (this._sourceToRecord.has(key)) return this._sourceToRecord.get(key).name.target;
        if (this.glossary.has(key)) return this.glossary.get(key);
        if (options.exactOnly) return raw;
        let output = raw;
        const entries = [...this.glossary.entries()].sort((a, b) => b[0].length - a[0].length);
        for (const [source, target] of entries) {
            if (!source || source.length < 2 || source === target) continue;
            output = output.replace(new RegExp(`\\b${escapeRegExp(source)}\\b`, 'g'), target);
        }
        return output;
    }

    t(value, options) { return this.translate(value, options); }

    displayName(value, context = {}) {
        if (context?.id && context?.kind) {
            const row = this.records.get(`${context.kind}:${context.id}`);
            if (row?.name?.target) return row.name.target;
        }
        return this.translate(value, { exactOnly: true });
    }

    displayDescription(record, kind = 'event', fallback = '') {
        const id = record && typeof record === 'object' ? record.id : '';
        const row = id ? this.records.get(`${kind}:${id}`) : null;
        if (row?.description?.target) return row.description.target;
        const source = fallback || (record && typeof record === 'object' ? String(record.description || '') : '');
        return source ? this.translate(source) : '';
    }

    localizeRecord(record, kind = 'event') {
        if (!record || typeof record !== 'object') return record;
        return {
            ...record,
            name: this.displayName(record.name, { id: record.id, kind }),
            description: this.displayDescription(record, kind, record.description),
        };
    }

    localizeDocument(root = document) {
        if (!root) return;
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        const textNodes = [];
        while (walker.nextNode()) textNodes.push(walker.currentNode);
        for (const node of textNodes) this._localizeTextNode(node);
        const elements = root.querySelectorAll ? root.querySelectorAll('*') : [];
        for (const element of elements) this._localizeAttributes(element);
    }

    _localizeTextNode(node) {
        const parent = node.parentElement;
        if (!parent || SKIP_TAGS.has(parent.tagName) || parent.isContentEditable) return;
        if (parent.closest('[data-i18n-skip="true"]')) return;
        const current = node.nodeValue;
        if (!current || !normalize(current)) return;
        const next = this.translate(current);
        if (next !== current) node.nodeValue = next;
    }

    _localizeAttributes(element) {
        if (!element || SKIP_TAGS.has(element.tagName)) return;
        for (const attribute of ['title', 'aria-label', 'placeholder']) {
            if (!element.hasAttribute(attribute)) continue;
            const current = element.getAttribute(attribute);
            const next = this.translate(current, { exactOnly: true });
            if (next !== current) element.setAttribute(attribute, next);
        }
        if (element.tagName === 'IMG' && element.alt) {
            const next = this.translate(element.alt, { exactOnly: true });
            if (next !== element.alt) element.alt = next;
        }
    }

    _installObserver() {
        if (this._observer || typeof MutationObserver === 'undefined') return;
        let pendingMutations = [];
        this._observer = new MutationObserver((mutations) => {
            pendingMutations.push(...mutations);
            if (this._scheduled) return;
            this._scheduled = true;
            queueMicrotask(() => {
                this._scheduled = false;
                const batch = pendingMutations;
                pendingMutations = [];
                for (const mutation of batch) {
                    if (mutation.type === 'characterData') {
                        this._localizeTextNode(mutation.target);
                        continue;
                    }
                    for (const node of mutation.addedNodes || []) {
                        if (node.nodeType === Node.TEXT_NODE) this._localizeTextNode(node);
                        else if (node.nodeType === Node.ELEMENT_NODE) {
                            this.localizeDocument(node);
                        }
                    }
                }
            });
        });
        const target = document.body || document.documentElement;
        if (target) this._observer.observe(target, { childList: true, subtree: true, characterData: true });
    }
}

export const localization = new LocalizationService();
