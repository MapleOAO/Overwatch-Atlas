/**
 * Atlas localization runtime.
 *
 * The canonical data files stay in their original language and keep their
 * stable IDs.  This service only supplies display values, so localization
 * never changes asset paths, filter keys, Codex matching, or upstream data.
 */

const DEFAULT_LOCALE = 'zh-CN';
const LOCALE_STORAGE_KEY = 'atlasLocale';
const LOCALE_ROOT = 'src/data/locales';

const FALLBACK_UI = {
    'Main - Overwatch Atlas': '主界面 - 守望先锋档案馆',
    'Rotate your device': '请旋转设备',
    'Overwatch Atlas is built for portrait on mobile. Turn your phone upright to continue.': '守望先锋档案馆的移动版需要竖屏显示，请将设备转为竖屏后继续。',
    Event: '事件',
    Events: '事件',
    'Event Management': '事件管理',
    'Event Manager': '事件管理器',
    Save: '保存',
    Edit: '编辑',
    Delete: '删除',
    Close: '关闭',
    Cancel: '取消',
    Add: '添加',
    'Add Event': '添加事件',
    Import: '导入',
    Export: '导出',
    Merge: '合并',
    Search: '搜索',
    Clear: '清除',
    Apply: '应用',
    Reset: '重置',
    'Select all': '全选',
    'Delete selected': '删除所选',
    'Clear all': '全部清除',
    'Save Codex': '保存关系图谱',
    'Import JSON': '导入 JSON',
    'Export JSON': '导出 JSON',
    'Choose view': '选择视图',
    'Pick how the timeline opens.': '选择时间线的打开方式。',
    '3D Globe': '3D 地球',
    '2D Map': '2D 地图',
    'Interactive Worldview': '交互式世界观',
    'Connection Codex': '关系图谱',
    'Data Archive': '资料档案',
    'Story Archive': '故事档案',
    'View mode': '浏览模式',
    'View Mode': '浏览模式',
    'Dev Mode': '开发模式',
    'Music': '音乐',
    'Filters': '筛选',
    'Palette': '调色板',
    'Color Palette': '颜色主题',
    'Show Image': '显示图片',
    'Hide Image': '隐藏图片',
    'Image On': '图片开',
    'Image Off': '图片关',
    'Previous Event': '上一个事件',
    'Next Event': '下一个事件',
    'No Image': '无图片',
    'No description available.': '暂无描述。',
    'No description available': '暂无描述',
    'Year Unknown': '年份未知',
    'Loading Status': '加载状态',
    Loading: '加载中',
    'Loading World…': '正在加载世界……',
    'Loading World...': '正在加载世界……',
    'Choose a view': '选择视图',
    'Rotation controls': '旋转控制',
    'Transport and weather': '交通与天气',
    'Pagination and navigation': '分页与导航',
    'Map view and rotation': '地图视图与旋转',
    Connections: '关系',
    Sources: '来源',
    'Sources:': '来源：',
    Location: '地点',
    Country: '国家/地区',
    Countries: '国家/地区',
    Hero: '英雄',
    Heroes: '英雄',
    Faction: '阵营',
    Factions: '阵营',
    NPC: 'NPC',
    'NPCs': 'NPC',
    'Relevant locations': '相关地点',
    'Faction type': '阵营类型',
    'NPC category': 'NPC 类别',
    Role: '职责',
    Birthday: '生日',
    Age: '年龄',
    None: '无',
    Other: '其他',
    Tank: '重装',
    Damage: '输出',
    Support: '支援',
    Hero: '英雄',
    Country: '国家/地区',
    Break: '断开',
    Map: '地图',
    Globe: '地球',
    'Starts on Map': '从地图开始',
    'Starts on Globe': '从地球开始',
    'Event display options': '事件显示选项',
    'Show controls': '显示控件',
    'Hide controls': '隐藏控件',
    'Per page:': '每页：',
    'Show all': '显示全部',
    'Use filter selection': '使用当前筛选',
    'Click to cycle through variants': '点击切换变体',
    'Looking up...': '查询中……',
    Lookup: '查询',
    'Unsaved changes': '未保存的更改',
    'Targeted selection': '定向选择',
    'Link selections': '链接所选项',
    'Drag mode': '拖拽模式',
    'Network mode': '网络模式',
    'Check vs archives': '与档案进行检查',
    'Reset look to defaults': '恢复默认外观',
    'Cord & packet look (saved in this browser)': '连线与数据包外观（保存在此浏览器）',
    'Translation maintenance': '翻译维护',
    'Caps Lock': '大写锁定键',
    Shift: '上档键',
};

const FALLBACK_GLOSSARY = {
    Ana: '安娜',
    'Ana Amari': '安娜·阿玛莉',
    Anran: '安燃',
    Ashe: '艾什',
    Baptiste: '巴蒂斯特',
    Bastion: '堡垒',
    Brigitte: '布丽吉塔',
    Cassidy: '卡西迪',
    'D.mon': 'D.Va',
    'D.va': 'D.Va',
    Domina: '金驭',
    Doomfist: '末日铁拳',
    Echo: '回声',
    Emre: '埃姆雷',
    Freja: '弗蕾娅',
    Genji: '源氏',
    Hanzo: '半藏',
    Hazard: '骇灾',
    Illari: '伊拉莉',
    'Jetpack Cat': '飞天猫',
    'Junker Queen': '渣客女王',
    Junkrat: '狂鼠',
    Juno: '朱诺',
    Kiriko: '雾子',
    Lifeweaver: '生命之梭',
    'Lúcio': '卢西奥',
    Mauga: '毛加',
    Mei: '小美',
    Mercy: '天使',
    Mizuki: '瑞稀',
    Moira: '莫伊拉',
    Orisa: '奥丽莎',
    Pharah: '法老之鹰',
    Ramattra: '拉玛刹',
    Reaper: '死神',
    Reinhardt: '莱因哈特',
    Roadhog: '路霸',
    Shion: '死怨',
    Sigma: '西格玛',
    Sojourn: '索杰恩',
    'Soldier 76': '士兵：76',
    Sombra: '黑影',
    Symmetra: '秩序之光',
    Torbjörn: '托比昂',
    Tracer: '猎空',
    Vendetta: '斩仇',
    Venture: '探奇',
    Widowmaker: '黑百合',
    Winston: '温斯顿',
    'Wrecking Ball': '破坏球',
    Wuyang: '无漾',
    Zarya: '查莉娅',
    Zenyatta: '禅雅塔',
    Overwatch: '守望先锋',
    'Null Sector': '归零者',
    'Deadlock Rebels': '死局帮',
    'Shimada Clan': '岛田家族',
    'Hashimoto Clan': '桥本组',
    'Yokai Gang': '妖怪团',
    'Junker Monarchy': '渣客王国',
    'Los Muertos': '亡者',
    Blackwatch: '暗影守望',
    'Shambali Order': '香巴里寺',
    'Vishkar Corporation': '费斯卡集团',
    'Omnica Corporation': '全智机械公司',
    'Volskaya Industries': '沃斯卡娅工业',
    'M.E.K.A Squad': 'MEKA小队',
    'The Gwishin': '鬼神智械',
    'Anubis Directives': '阿努比斯指令',
    'Talon Empire': '黑爪帝国',
    'Lucheng Interstellar': '星际旅程集团',
    'The Phreaks': '躯体改造者们',
    'Horizon Lunar Colony': '“地平线”月球基地',
    'Lijiang Tower': '漓江塔',
    'Search & Rescue': '搜索与救援',
    'Space Station (ISS)': '国际空间站（ISS）',
    'Red Promise Escape Ship': '红色承诺逃生舰',
    Moon: '月球',
    Mars: '火星',
};

function isRecord(value) {
    return value && typeof value === 'object' && !Array.isArray(value);
}

function normalize(value) {
    return String(value ?? '')
        .replace(/\s+/g, ' ')
        .trim();
}

function flattenUiEntries(raw) {
    if (!isRecord(raw)) return {};
    const entries = isRecord(raw.entries) ? raw.entries : raw;
    const out = {};
    for (const [key, value] of Object.entries(entries)) {
        if (typeof value === 'string') {
            out[key] = { source: key, target: value, status: 'reviewed' };
        } else if (isRecord(value)) {
            out[key] = {
                source: String(value.source ?? key),
                target: String(value.target ?? value.translation ?? value.source ?? key),
                status: String(value.status ?? 'draft'),
                note: String(value.note ?? ''),
            };
        }
    }
    return out;
}

function flattenTextEntries(raw) {
    if (!isRecord(raw)) return {};
    const entries = isRecord(raw.entries) ? raw.entries : raw;
    const out = {};
    for (const [key, value] of Object.entries(entries)) {
        if (typeof value === 'string') {
            out[key] = { source: key, target: value, status: 'reviewed' };
        } else if (isRecord(value)) {
            out[key] = {
                source: String(value.source ?? key),
                target: String(value.target ?? value.translation ?? value.source ?? key),
                status: String(value.status ?? 'draft'),
                note: String(value.note ?? ''),
            };
        }
    }
    return out;
}

function flattenGlossaryEntries(raw) {
    if (!isRecord(raw)) return {};
    const entries = isRecord(raw.terms) ? raw.terms : raw;
    const out = {};
    for (const [source, value] of Object.entries(entries)) {
        if (typeof value === 'string') {
            out[source] = { source, target: value, status: 'reviewed' };
        } else if (isRecord(value)) {
            out[source] = {
                source,
                target: String(value.target ?? value.translation ?? source),
                status: String(value.status ?? 'draft'),
                note: String(value.note ?? ''),
            };
        }
    }
    return out;
}

function asContentMap(raw) {
    if (!isRecord(raw)) return { events: {}, entities: {} };
    return {
        events: isRecord(raw.events) ? raw.events : {},
        entities: isRecord(raw.entities) ? raw.entities : {},
    };
}

function entryTarget(entry) {
    if (!entry) return '';
    if (typeof entry === 'string') return entry;
    return String(entry.target ?? entry.translation ?? entry.source ?? '');
}

function replaceTerms(text, entries) {
    let output = String(text ?? '');
    const ordered = Object.values(entries)
        .filter((entry) => entry && entry.source && entry.target && entry.source !== entry.target)
        .sort((a, b) => String(b.source).length - String(a.source).length);
    for (const entry of ordered) {
        const source = String(entry.source);
        const escaped = source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        output = output.replace(new RegExp(`(^|[^A-Za-z0-9])(${escaped})(?=$|[^A-Za-z0-9])`, 'gi'), `$1${entry.target}`);
    }
    return output;
}

function draftEventTitle(value, glossary) {
    let output = replaceTerms(value, glossary);
    const replacements = [
        [/\bis born\b/gi, '出生'],
        [/\bwas born\b/gi, '出生'],
        [/\bis made\b/gi, '被制造'],
        [/\bwas made\b/gi, '被制造'],
        [/\bgoes online\b/gi, '上线'],
        [/\bjoins\b/gi, '加入'],
        [/\bjoins the\b/gi, '加入'],
        [/\battacks\b/gi, '袭击'],
        [/\breturns\b/gi, '归来'],
        [/\bmeets\b/gi, '遇见'],
        [/\bopens\b/gi, '开启'],
        [/\bcloses\b/gi, '关闭'],
    ];
    for (const [pattern, replacement] of replacements) output = output.replace(pattern, replacement);
    return output;
}

function canonicalClone(value) {
    if (Array.isArray(value)) return value.map(canonicalClone);
    if (!isRecord(value)) return value;
    const out = {};
    for (const [key, child] of Object.entries(value)) {
        if (key === '__atlasLocalized') continue;
        out[key] = canonicalClone(child);
    }
    return out;
}

function variantTranslation(record, variantIndex, field) {
    const index = Number(variantIndex);
    if (!Number.isInteger(index) || index < 0 || !Array.isArray(record?.variants)) return null;
    return record.variants[index]?.[field] || null;
}

function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function compileTemplate(source) {
    const names = [];
    const pattern = escapeRegExp(source).replace(/\\\{([A-Za-z0-9_]+)\\\}/g, (_, name) => {
        names.push(name);
        return '(.+?)';
    });
    return { names, regex: new RegExp(`^${pattern}$`) };
}

class AtlasLocalization {
    constructor() {
        this.locale = this._readLocale();
        this.ui = flattenUiEntries(FALLBACK_UI);
        this.glossary = flattenGlossaryEntries(FALLBACK_GLOSSARY);
        this.headlines = {};
        this.content = { events: {}, entities: {} };
        this.ready = this._load();
        this._observer = null;
        this._applyScheduled = false;
    }

    _readLocale() {
        try {
            return localStorage.getItem(LOCALE_STORAGE_KEY) || DEFAULT_LOCALE;
        } catch (_) {
            return DEFAULT_LOCALE;
        }
    }

    async _loadJson(path, fallback) {
        try {
            const response = await fetch(`${path}?v=${Date.now()}`, { cache: 'no-store' });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (_) {
            return fallback;
        }
    }

    async _load() {
        const base = `${LOCALE_ROOT}/${encodeURIComponent(this.locale)}`;
        const [ui, glossary, headlines, content] = await Promise.all([
            this._loadJson(`${base}/ui.json`, {}),
            this._loadJson(`${base}/glossary.json`, {}),
            this._loadJson(`${base}/headlines.json`, {}),
            this._loadJson(`${base}/content.json`, {}),
        ]);
        this.ui = { ...this.ui, ...flattenUiEntries(ui) };
        this.glossary = { ...this.glossary, ...flattenGlossaryEntries(glossary) };
        this.headlines = flattenTextEntries(headlines);
        this.content = asContentMap(content);
        this._installDomLocalization();
        this.applyDocument();
        return this;
    }

    _installDomLocalization() {
        if (typeof document === 'undefined' || this._observer) return;
        const start = () => {
            if (!document.body || typeof MutationObserver === 'undefined') return;
            this._observer = new MutationObserver(() => this.scheduleApply());
            this._observer.observe(document.body, {
                childList: true,
                subtree: true,
                characterData: true,
            });
        };
        if (document.body) start();
        else document.addEventListener('DOMContentLoaded', start, { once: true });
    }

    scheduleApply() {
        if (this._applyScheduled) return;
        this._applyScheduled = true;
        setTimeout(() => {
            this._applyScheduled = false;
            this.applyDocument();
        }, 0);
    }

    _uiSourceMap() {
        const map = {};
        for (const entry of [...Object.values(this.ui), ...Object.values(this.headlines)]) {
            const source = normalize(entry?.source);
            const target = entryTarget(entry);
            if (source && target && source !== target) map[source] = target;
        }
        return map;
    }

    translateText(value) {
        const raw = String(value ?? '');
        const normalized = normalize(raw);
        if (!normalized) return raw;
        const sourceMap = this._uiSourceMap();
        if (sourceMap[normalized]) return sourceMap[normalized];

        let translated = raw;
        const entries = [...Object.values(this.ui), ...Object.values(this.headlines)]
            .map((entry) => ({ source: normalize(entry?.source), target: entryTarget(entry) }))
            .filter((entry) => entry.source && entry.target && entry.source !== entry.target)
            .sort((a, b) => b.source.length - a.source.length);
        for (const entry of entries) {
            if (entry.source.includes('{')) {
                const { names, regex } = compileTemplate(entry.source);
                translated = translated.replace(regex, (...args) => {
                    let output = entry.target;
                    names.forEach((name, index) => {
                        output = output.replace(new RegExp(`\\{${name}\\}`, 'g'), args[index + 1]);
                    });
                    return output;
                });
                continue;
            }
            if (entry.source.length < 3) continue;
            const pattern = /^[A-Za-z0-9]+$/.test(entry.source)
                ? new RegExp(`\\b${escapeRegExp(entry.source)}\\b`, 'g')
                : new RegExp(escapeRegExp(entry.source), 'g');
            translated = translated.replace(pattern, entry.target);
        }
        return translated;
    }

    applyDocument() {
        if (typeof document === 'undefined' || !document.documentElement) return;
        document.documentElement.lang = this.locale;
        const workbenchLink = document.getElementById('translationWorkbenchLink');
        if (workbenchLink) workbenchLink.hidden = !this.canEdit();
        const sourceMap = this._uiSourceMap();

        const title = document.querySelector('title');
        if (title) {
            const translatedTitle = sourceMap[normalize(title.textContent)];
            if (translatedTitle) title.textContent = translatedTitle;
        }

        const applyAttribute = (element, attribute) => {
            const value = normalize(element.getAttribute(attribute));
            if (!value) return;
            const translated = this.translateText(value);
            if (translated) element.setAttribute(attribute, translated);
        };

        document.querySelectorAll('[data-i18n]').forEach((element) => {
            const key = element.getAttribute('data-i18n');
            const translated = this.t(key);
            if (translated && translated !== key) element.textContent = translated;
        });
        document.querySelectorAll('[title], [aria-label], [placeholder], img[alt]').forEach((element) => {
            if (element.closest('script, style, textarea, [contenteditable="true"]')) return;
            applyAttribute(element, 'title');
            applyAttribute(element, 'aria-label');
            applyAttribute(element, 'placeholder');
            applyAttribute(element, 'alt');
        });

        if (!document.body) return;
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        const nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);
        for (const node of nodes) {
            const parent = node.parentElement;
            if (!parent || parent.closest('script, style, textarea, input, [contenteditable="true"], [data-no-i18n]')) continue;
            const raw = normalize(node.nodeValue);
            if (!raw) continue;
            const translated = this.translateText(raw);
            if (!translated || translated === raw) continue;
            const leading = String(node.nodeValue).match(/^\s*/)?.[0] || '';
            const trailing = String(node.nodeValue).match(/\s*$/)?.[0] || '';
            node.nodeValue = `${leading}${translated}${trailing}`;
        }
    }

    t(key, variables = {}) {
        const entry = this.ui[key];
        let value = entryTarget(entry);
        if (!value) {
            const source = String(key ?? '');
            for (const candidate of Object.values(this.ui)) {
                const template = normalize(candidate?.source);
                if (!template || !template.includes('{')) continue;
                const names = [];
                const pattern = template.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\{([A-Za-z0-9_]+)\\\}/g, (_, name) => {
                    names.push(name);
                    return '(.+?)';
                });
                const match = source.match(new RegExp(`^${pattern}$`));
                if (!match) continue;
                value = entryTarget(candidate) || template;
                names.forEach((name, index) => {
                    value = value.replace(new RegExp(`\\{${name}\\}`, 'g'), match[index + 1]);
                });
                break;
            }
        }
        value = value ? this.translateText(value) : this.translateText(key);
        for (const [name, replacement] of Object.entries(variables)) {
            value = value.replace(new RegExp(`\\{${name}\\}`, 'g'), String(replacement));
        }
        return value;
    }

    displayName(source, options = {}) {
        const raw = String(source ?? '');
        if (!raw) return raw;
        const id = String(options.id || '').trim();
        const entity = id ? this.content.entities[id] : null;
        const record = options.kind === 'event' && id ? this.content.events[id] : entity;
        const explicit = entryTarget(
            variantTranslation(record, options.variantIndex, 'name')
            || record?.name
            || record?.title,
        );
        if (explicit) return explicit;
        const replaced = replaceTerms(raw, this.glossary);
        if (options.kind === 'event') return draftEventTitle(replaced, this.glossary);
        return replaced;
    }

    displayText(source, options = {}) {
        const raw = String(source ?? '');
        if (!raw) return raw;
        if (String(options.field || 'description') === 'headline') {
            const headline = Object.values(this.headlines).find((entry) => normalize(entry?.source) === normalize(raw));
            const translatedHeadline = entryTarget(headline);
            if (translatedHeadline) return translatedHeadline;
            const fallback = replaceTerms(raw, this.glossary);
            return /[A-Za-z]{3}/.test(fallback) ? '（新闻标题待翻译）' : fallback;
        }
        const id = String(options.id || '').trim();
        const field = String(options.field || 'description');
        const bucket = options.kind === 'event' ? this.content.events : this.content.entities;
        const record = id ? bucket[id] : null;
        const explicit = entryTarget(variantTranslation(record, options.variantIndex, field) || record?.[field]);
        if (explicit) return explicit;
        return replaceTerms(raw, this.glossary);
    }

    displayEvent(event, variant = null) {
        const source = variant || event || {};
        const kind = event?.id ? 'event' : 'entity';
        return {
            ...source,
            displayName: this.displayName(source.name, { kind, id: event?.id }),
            displayDescription: this.displayText(source.description, { kind, id: event?.id }),
        };
    }

    canonical(value) {
        return canonicalClone(value);
    }

    canEdit() {
        if (typeof window === 'undefined') return false;
        return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    }

    async setLocale(locale) {
        const normalized = String(locale || DEFAULT_LOCALE).trim() || DEFAULT_LOCALE;
        if (normalized === this.locale) return this;
        this.locale = normalized;
        try { localStorage.setItem(LOCALE_STORAGE_KEY, normalized); } catch (_) {}
        await this._load();
        window.dispatchEvent(new CustomEvent('atlas-locale-changed', { detail: { locale: normalized } }));
        return this;
    }
}

export const AtlasI18n = new AtlasLocalization();

if (typeof window !== 'undefined') {
    window.AtlasI18n = AtlasI18n;
}

export function displayName(source, options) {
    return window.AtlasI18n?.displayName?.(source, options) || String(source ?? '');
}

export function displayText(source, options) {
    return window.AtlasI18n?.displayText?.(source, options) || String(source ?? '');
}
