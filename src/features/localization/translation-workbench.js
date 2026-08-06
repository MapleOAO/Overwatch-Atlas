const LOCALE = 'zh-CN';

const DATASETS = {
    event: { label: '事件', path: 'src/data/event-system/timeline-events.json', bucket: 'events', kind: 'event' },
    hero: { label: '英雄', path: 'src/data/story-archive/heroes.json', bucket: 'entities', kind: 'hero' },
    faction: { label: '阵营', path: 'src/data/story-archive/factions.json', bucket: 'entities', kind: 'faction' },
    npc: { label: 'NPC', path: 'src/data/story-archive/npcs.json', bucket: 'entities', kind: 'npc' },
    location: { label: '地点', path: 'src/data/story-archive/locations.json', bucket: 'entities', kind: 'location' },
};

const HEADLINE_DATASET = {
    label: '新闻标题',
    path: 'src/data/locales/zh-CN/headlines.json',
    bucket: 'entries',
};

const state = {
    canonical: {},
    locale: { ui: {}, glossary: {}, headlines: { entries: {} }, content: { events: {}, entities: {} } },
    serverWritable: false,
    rows: [],
    selectedKey: null,
};

const $ = (id) => document.getElementById(id);

function htmlEscape(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function rowsOf(data) {
    if (Array.isArray(data)) return data;
    return Array.isArray(data?.events) ? data.events : [];
}

function targetOf(value) {
    if (typeof value === 'string') return value.trim();
    return String(value?.target ?? value?.translation ?? '').trim();
}

function sourceHashRecord(record) {
    return JSON.stringify({
        name: record?.name ?? '',
        description: record?.description ?? '',
        variants: record?.variants ?? [],
    });
}

async function sourceHash(record) {
    if (!globalThis.crypto?.subtle || !globalThis.TextEncoder) return '';
    const bytes = new TextEncoder().encode(sourceHashRecord(record));
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)].map((n) => n.toString(16).padStart(2, '0')).join('');
}

async function fetchJson(path) {
    const response = await fetch(`${path}?v=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`${path} HTTP ${response.status}`);
    return response.json();
}

function setStatus(text, type = '') {
    const el = $('serverStatus');
    el.textContent = text;
    el.className = `status ${type}`.trim();
}

function normalizeLocaleBundle(files) {
    return {
        ui: files?.['ui.json'] || {},
        glossary: files?.['glossary.json'] || {},
        headlines: files?.['headlines.json'] || { entries: {} },
        content: {
            events: files?.['content.json']?.events || {},
            entities: files?.['content.json']?.entities || {},
            ...files?.['content.json'],
        },
    };
}

async function loadLocale() {
    const localFiles = await Promise.all([
        fetchJson(`src/data/locales/${LOCALE}/ui.json`),
        fetchJson(`src/data/locales/${LOCALE}/glossary.json`),
        fetchJson(`src/data/locales/${LOCALE}/headlines.json`),
        fetchJson(`src/data/locales/${LOCALE}/content.json`),
    ]);
    let files = {
        'ui.json': localFiles[0],
        'glossary.json': localFiles[1],
        'headlines.json': localFiles[2],
        'content.json': localFiles[3],
    };
    try {
        const response = await fetch('/api/localization', { cache: 'no-store' });
        if (response.ok) {
            const apiBundle = await response.json();
            if (apiBundle?.files) {
                files = { ...files, ...apiBundle.files };
                state.serverWritable = true;
            }
        }
    } catch (_) {
        state.serverWritable = false;
    }
    state.locale = normalizeLocaleBundle(files);
}

function contentEntry(row) {
    const dataset = DATASETS[row.kind];
    return state.locale.content?.[dataset.bucket]?.[row.id] || {};
}

function glossaryTarget(source) {
    const terms = state.locale.glossary?.terms || {};
    return targetOf(terms[String(source || '').trim()]);
}

function makeCanonicalRows() {
    const rows = [];
    for (const [kind, dataset] of Object.entries(DATASETS)) {
        for (const record of rowsOf(state.canonical[kind])) {
            const id = String(record?.id || '').trim();
            if (!id) continue;
            const entry = state.locale.content?.[dataset.bucket]?.[id] || {};
            rows.push({
                key: `${kind}:${id}`,
                type: 'canonical',
                kind,
                id,
                dataset,
                record,
                name: String(record.name || ''),
                description: String(record.description || ''),
                targetName: targetOf(entry.name),
                targetDescription: targetOf(entry.description),
                status: String(entry.status || entry.name?.status || 'draft'),
                note: String(entry.note || ''),
                glossaryName: glossaryTarget(record.name),
            });
        }
    }
    return rows;
}

function makeUiRows() {
    const entries = state.locale.ui?.entries || {};
    return Object.entries(entries).map(([id, entry]) => ({
        key: `ui:${id}`,
        type: 'ui',
        id,
        name: String(entry?.source || id),
        description: '',
        targetName: targetOf(entry),
        targetDescription: '',
        status: String(entry?.status || 'draft'),
        note: String(entry?.note || ''),
        entry,
    }));
}

function makeGlossaryRows() {
    const terms = state.locale.glossary?.terms || {};
    return Object.entries(terms).map(([id, entry]) => ({
        key: `glossary:${id}`,
        type: 'glossary',
        id,
        name: id,
        description: '',
        targetName: targetOf(entry),
        targetDescription: '',
        status: String(entry?.status || 'draft'),
        note: String(entry?.note || ''),
        sourceNote: String(entry?.source || ''),
        entry,
    }));
}

function makeHeadlineRows() {
    const entries = state.locale.headlines?.entries || {};
    return Object.entries(entries).map(([id, entry]) => ({
        key: `headline:${id}`,
        type: 'headline',
        id,
        name: String(entry?.source || id),
        description: '',
        targetName: targetOf(entry),
        targetDescription: '',
        status: String(entry?.status || 'draft'),
        note: String(entry?.note || ''),
        entry,
    }));
}

function rebuildRows() {
    state.rows = [...makeCanonicalRows(), ...makeUiRows(), ...makeGlossaryRows(), ...makeHeadlineRows()];
}

function currentMode() {
    return $('datasetSelect').value;
}

function rowsForMode() {
    const mode = currentMode();
    if (mode === 'ui') return state.rows.filter((row) => row.type === 'ui');
    if (mode === 'glossary') return state.rows.filter((row) => row.type === 'glossary');
    if (mode === 'headline') return state.rows.filter((row) => row.type === 'headline');
    return state.rows.filter((row) => row.type === 'canonical' && row.kind === mode);
}

function rowIsMissing(row) {
    if (row.type === 'canonical') return !row.targetName && !row.targetDescription;
    return !row.targetName;
}

function rowMatchesStatus(row, filter) {
    if (filter === 'all') return true;
    if (filter === 'missing') return rowIsMissing(row);
    return row.status === filter;
}

function renderList() {
    const list = $('recordList');
    const query = $('searchInput').value.trim().toLowerCase();
    const status = $('statusFilter').value;
    const rows = rowsForMode().filter((row) => {
        const haystack = `${row.name} ${row.targetName} ${row.description} ${row.targetDescription} ${row.id}`.toLowerCase();
        return (!query || haystack.includes(query)) && rowMatchesStatus(row, status);
    });
    const label = DATASETS[currentMode()]?.label
        || (currentMode() === 'ui' ? '界面文案' : currentMode() === 'headline' ? HEADLINE_DATASET.label : '术语表');
    $('stats').textContent = `${label}：显示 ${rows.length} 条；本地服务器写入：${state.serverWritable ? '可用' : '不可用（可导出文件）'}`;
    list.innerHTML = '';
    if (!rows.length) {
        list.innerHTML = '<div class="empty">没有匹配条目。</div>';
        return;
    }
    for (const row of rows) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `list-item${state.selectedKey === row.key ? ' selected' : ''}`;
        const statusClass = rowIsMissing(row) ? 'missing' : row.status;
        const statusLabel = rowIsMissing(row) ? '未翻译' : (row.status === 'reviewed' ? '已审核' : '待核对');
        button.innerHTML = `<span class="pill ${htmlEscape(statusClass)}">${htmlEscape(statusLabel)}</span><strong>${htmlEscape(row.targetName || row.name)}</strong><small>${htmlEscape(row.name)}${row.id ? ` · ${htmlEscape(row.id)}` : ''}</small>`;
        button.addEventListener('click', () => {
            state.selectedKey = row.key;
            renderList();
            renderEditor();
        });
        list.appendChild(button);
    }
}

function fieldHtml(label, source, target, field, multiline = false) {
    const control = multiline
        ? `<textarea data-field="${field}">${htmlEscape(target)}</textarea>`
        : `<input data-field="${field}" value="${htmlEscape(target)}">`;
    return `<div class="field"><label>${htmlEscape(label)}</label><div class="source">${htmlEscape(source || '（无）')}</div>${control}</div>`;
}

function renderCanonicalEditor(row) {
    const entry = contentEntry(row);
    const suggested = row.glossaryName && !row.targetName ? `<div class="hint">术语表建议：${htmlEscape(row.glossaryName)}（保存后将成为此条目的明确译文）</div>` : '';
    const variants = Array.isArray(row.record.variants) ? row.record.variants : [];
    const variantHtml = variants.map((variant, index) => {
        const translated = Array.isArray(entry.variants) ? entry.variants[index] || {} : {};
        return `<div class="variant"><div class="variant-title">变体 ${index + 1}</div>${fieldHtml('原文名称', variant?.name || '', targetOf(translated.name), `variant-${index}-name`)}${fieldHtml('原文描述', variant?.description || '', targetOf(translated.description), `variant-${index}-description`, true)}</div>`;
    }).join('');
    return `<h2>${htmlEscape(row.dataset.label || DATASETS[row.kind].label)}：${htmlEscape(row.name)}</h2>
        <div class="source-id">稳定 ID：${htmlEscape(row.id)}</div>
        ${fieldHtml('原文名称', row.name, row.targetName, 'name')}
        ${suggested}
        ${fieldHtml('原文描述', row.description, row.targetDescription, 'description', true)}
        ${variantHtml ? `<div class="field"><label>事件变体（可选）</label>${variantHtml}</div>` : ''}
        <div class="row"><div class="field"><label>翻译状态</label><select data-field="status"><option value="draft" ${row.status === 'draft' ? 'selected' : ''}>草稿 / 待核对</option><option value="needs-review" ${row.status === 'needs-review' ? 'selected' : ''}>需要复核</option><option value="reviewed" ${row.status === 'reviewed' ? 'selected' : ''}>已审核</option></select></div><div class="field"><label>备注</label><input data-field="note" value="${htmlEscape(row.note)}"></div></div>
        <div class="actions"><span class="hint">稳定 ID 与原始英文数据分离；上游更新后如原文变化，校验会标记译文需要复核。</span></div>`;
}

function renderSimpleEditor(row, title, sourceLabel, noteLabel) {
    return `<h2>${htmlEscape(title)}</h2>
        <div class="source-id">键：${htmlEscape(row.id)}</div>
        ${fieldHtml(sourceLabel, row.name, row.targetName, 'name')}
        <div class="row"><div class="field"><label>翻译状态</label><select data-field="status"><option value="draft" ${row.status === 'draft' ? 'selected' : ''}>草稿 / 待核对</option><option value="needs-review" ${row.status === 'needs-review' ? 'selected' : ''}>需要复核</option><option value="reviewed" ${row.status === 'reviewed' ? 'selected' : ''}>已审核</option></select></div><div class="field"><label>${htmlEscape(noteLabel)}</label><input data-field="note" value="${htmlEscape(row.note || row.sourceNote || '')}"></div></div>`;
}

function renderEditor() {
    const editor = $('editor');
    const row = state.rows.find((item) => item.key === state.selectedKey);
    if (!row) {
        editor.innerHTML = '<div class="empty">请选择左侧条目开始维护。</div>';
        return;
    }
    if (row.type === 'canonical') editor.innerHTML = renderCanonicalEditor(row);
    else if (row.type === 'ui') editor.innerHTML = renderSimpleEditor(row, `界面文案：${row.id}`, '英文原文', '备注');
    else if (row.type === 'headline') editor.innerHTML = renderSimpleEditor(row, `新闻标题：${row.id}`, '英文原文', '来源 / 备注');
    else editor.innerHTML = renderSimpleEditor(row, '术语表', '英文术语', '来源 / 备注');
}

function readField(field) {
    return $("editor").querySelector(`[data-field="${field}"]`)?.value?.trim() || '';
}

function makeTranslatedField(target, status, note) {
    if (!target) return null;
    const field = { target, status: status || 'draft' };
    if (note) field.note = note;
    return field;
}

function downloadJson(filename, data) {
    const blob = new Blob([`${JSON.stringify(data, null, 2)}\n`], { type: 'application/json;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

async function writeLocaleFile(file, data) {
    if (!state.serverWritable) {
        downloadJson(`zh-CN-${file}`, data);
        setStatus('已导出，请手动覆盖 locale 文件', 'warn');
        return;
    }
    const response = await fetch('/api/localization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: LOCALE, file, data }),
    });
    if (!response.ok) throw new Error(`保存失败：HTTP ${response.status}`);
}

async function saveCurrent() {
    const row = state.rows.find((item) => item.key === state.selectedKey);
    if (!row) {
        setStatus('请先选择条目', 'warn');
        return;
    }
    const status = readField('status') || 'draft';
    const note = readField('note');
    if (row.type === 'canonical') {
        const targetName = readField('name');
        const targetDescription = readField('description');
        const content = state.locale.content;
        const bucket = row.dataset.bucket;
        const existing = { ...(content[bucket]?.[row.id] || {}) };
        const next = { ...existing };
        const nameField = makeTranslatedField(targetName, status, note);
        const descriptionField = makeTranslatedField(targetDescription, status, note);
        if (nameField) next.name = nameField; else delete next.name;
        if (descriptionField) next.description = descriptionField; else delete next.description;
        const variantFields = (Array.isArray(row.record.variants) ? row.record.variants : []).map((_, index) => {
            const name = readField(`variant-${index}-name`);
            const description = readField(`variant-${index}-description`);
            return {
                name: makeTranslatedField(name, status, note),
                description: makeTranslatedField(description, status, note),
            };
        });
        if (variantFields.some((item) => item.name || item.description)) next.variants = variantFields;
        else delete next.variants;
        if (next.name || next.description || next.variants) {
            next.status = status;
            if (note) next.note = note; else delete next.note;
            const hash = await sourceHash(row.record);
            if (hash) next.sourceHash = hash;
            content[bucket] = { ...(content[bucket] || {}), [row.id]: next };
        } else {
            const nextBucket = { ...(content[bucket] || {}) };
            delete nextBucket[row.id];
            content[bucket] = nextBucket;
        }
        await writeLocaleFile('content.json', content);
    } else if (row.type === 'ui') {
        const ui = state.locale.ui;
        ui.entries = { ...(ui.entries || {}), [row.id]: {
            source: row.name,
            target: readField('name'),
            status,
            ...(note ? { note } : {}),
        } };
        await writeLocaleFile('ui.json', ui);
    } else if (row.type === 'headline') {
        const headlines = state.locale.headlines;
        const entries = { ...(headlines.entries || {}) };
        const target = readField('name');
        if (target) {
            entries[row.id] = {
                source: row.name,
                target,
                status,
                ...(note ? { note } : {}),
            };
        } else {
            delete entries[row.id];
        }
        headlines.entries = entries;
        await writeLocaleFile('headlines.json', headlines);
    } else {
        const glossary = state.locale.glossary;
        const terms = { ...(glossary.terms || {}) };
        const target = readField('name');
        if (target) {
            terms[row.id] = { target, status, source: note || row.sourceNote || '人工维护' };
        } else {
            delete terms[row.id];
        }
        glossary.terms = terms;
        await writeLocaleFile('glossary.json', glossary);
    }
    rebuildRows();
    renderList();
    renderEditor();
    setStatus(state.serverWritable ? '已保存到本地仓库' : '已导出 locale 文件', 'ok');
}

function exportAll() {
    downloadJson('zh-CN-ui.json', state.locale.ui);
    downloadJson('zh-CN-glossary.json', state.locale.glossary);
    downloadJson('zh-CN-headlines.json', state.locale.headlines);
    downloadJson('zh-CN-content.json', state.locale.content);
    setStatus('已导出 4 个 locale 文件', 'ok');
}

async function loadAll() {
    setStatus('正在加载…');
    try {
        const entries = await Promise.all(Object.entries(DATASETS).map(async ([kind, dataset]) => [kind, await fetchJson(dataset.path)]));
        state.canonical = Object.fromEntries(entries);
        await loadLocale();
        rebuildRows();
        renderList();
        renderEditor();
        setStatus(state.serverWritable ? '本地服务器可写' : '只读：可编辑并导出', state.serverWritable ? 'ok' : 'warn');
    } catch (error) {
        console.error(error);
        setStatus(`加载失败：${error.message}`, 'warn');
        $('recordList').innerHTML = `<div class="empty">${htmlEscape(error.message)}<br>请在仓库根目录运行 <code>node src/server.js</code>。</div>`;
    }
}

$('datasetSelect').addEventListener('change', () => {
    state.selectedKey = null;
    renderList();
    renderEditor();
});
$('searchInput').addEventListener('input', renderList);
$('statusFilter').addEventListener('change', renderList);
$('reloadButton').addEventListener('click', loadAll);
$('saveButton').addEventListener('click', () => saveCurrent().catch((error) => {
    console.error(error);
    setStatus(error.message, 'warn');
}));
$('exportButton').addEventListener('click', exportAll);

loadAll();
