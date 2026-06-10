import * as params from '@params';

const resList = document.getElementById('searchResults');
const sInput = document.getElementById('searchInput');
const searchBox = document.getElementById('searchbox');

let fuse;
let lastQuery = '';
let currentElement = null;
let firstResult = null;
let lastResult = null;

const defaultFuseOptions = {
    distance: 100,
    threshold: 0.4,
    ignoreLocation: true,
    includeMatches: true,
    keys: ['title', 'permalink', 'summary', 'content']
};

const buildFuseOptions = () => {
    if (!params.fuseOpts) {
        return defaultFuseOptions;
    }
    return {
        isCaseSensitive: params.fuseOpts.iscasesensitive ?? false,
        includeScore: params.fuseOpts.includescore ?? false,
        includeMatches: true,
        minMatchCharLength: params.fuseOpts.minmatchcharlength ?? 1,
        shouldSort: params.fuseOpts.shouldsort ?? true,
        findAllMatches: params.fuseOpts.findallmatches ?? false,
        keys: params.fuseOpts.keys ?? defaultFuseOptions.keys,
        location: params.fuseOpts.location ?? 0,
        threshold: params.fuseOpts.threshold ?? defaultFuseOptions.threshold,
        distance: params.fuseOpts.distance ?? defaultFuseOptions.distance,
        ignoreLocation: params.fuseOpts.ignorelocation ?? defaultFuseOptions.ignoreLocation
    };
};

const debounce = (fn, delay) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = window.setTimeout(() => fn(...args), delay);
    };
};

const reset = () => {
    currentElement = null;
    firstResult = null;
    lastResult = null;
    resList.innerHTML = '';
    sInput.value = '';
    sInput.focus();
};

const setActiveResult = (element) => {
    document.querySelectorAll('.focus').forEach((item) => item.classList.remove('focus'));
    if (!element) return;
    element.focus();
    element.parentElement?.classList.add('focus');
    currentElement = element;
};

function escHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// Only highlight runs of >= minLen characters to suppress fuzzy single-char noise.
// For short queries (≤4 chars) require the full query length; longer queries allow 2+.
function minHighlightLen() {
    return lastQuery.length <= 4 ? lastQuery.length : 2;
}

function applyHighlights(str, indices) {
    if (!str) return '';
    if (!indices || !indices.length) return escHtml(str);
    const min = minHighlightLen();
    const sorted = [...indices]
        .filter(([s, e]) => e - s + 1 >= min)
        .sort((a, b) => a[0] - b[0]);
    if (!sorted.length) return escHtml(str);
    let out = '';
    let last = 0;
    for (const [s, e] of sorted) {
        if (s >= last) {
            out += escHtml(str.slice(last, s));
            out += '<mark>' + escHtml(str.slice(s, e + 1)) + '</mark>';
            last = e + 1;
        }
    }
    out += escHtml(str.slice(last));
    return out;
}

function getSnippet(content, indices) {
    if (!content) return '';
    const min = minHighlightLen();
    const significant = (indices || []).filter(([s, e]) => e - s + 1 >= min);
    if (!significant.length) {
        return escHtml(content.slice(0, 180)) + (content.length > 180 ? '…' : '');
    }
    const pad = 70;
    const [s0] = significant[0];
    const begin = Math.max(0, s0 - pad);
    const end = Math.min(content.length, s0 + 160);
    const chunk = content.slice(begin, end);
    const local = significant
        .map(([s, e]) => [s - begin, e - begin])
        .filter(([s, e]) => s >= 0 && e >= 0 && s < chunk.length);
    return (begin > 0 ? '…' : '') + applyHighlights(chunk, local) + (end < content.length ? '…' : '');
}

const renderResults = (results) => {
    if (!Array.isArray(results) || results.length === 0) {
        resList.innerHTML = '';
        firstResult = lastResult = currentElement = null;
        return;
    }

    const fragment = document.createDocumentFragment();

    for (const result of results) {
        const { item, matches } = result;

        const titleMatch   = matches?.find(m => m.key === 'title');
        const contentMatch = matches?.find(m => m.key === 'content');
        const summaryMatch = matches?.find(m => m.key === 'summary');

        const titleHtml = applyHighlights(item.title, titleMatch?.indices);

        let snippetHtml = '';
        if (contentMatch) {
            snippetHtml = getSnippet(item.content, contentMatch.indices);
        } else if (summaryMatch) {
            snippetHtml = getSnippet(item.summary, summaryMatch.indices);
        } else if (item.summary) {
            snippetHtml = escHtml(item.summary.slice(0, 180)) + (item.summary.length > 180 ? '…' : '');
        }

        const li = document.createElement('li');
        li.innerHTML =
            `<div class="search-result-title">${titleHtml}</div>` +
            (snippetHtml ? `<div class="search-result-snippet">${snippetHtml}</div>` : '') +
            `<a class="entry-link" href="${item.permalink}" aria-label="${escHtml(item.title)}"></a>`;

        fragment.appendChild(li);
    }

    resList.innerHTML = '';
    resList.appendChild(fragment);
    firstResult = resList.firstElementChild;
    lastResult = resList.lastElementChild;
};

const performSearch = () => {
    if (!fuse) return;
    const query = sInput.value.trim();
    if (!query) {
        lastQuery = '';
        renderResults([]);
        return;
    }
    lastQuery = query;
    const searchOptions = params.fuseOpts?.limit ? { limit: params.fuseOpts.limit } : undefined;
    const results = searchOptions ? fuse.search(query, searchOptions) : fuse.search(query);
    renderResults(results);
};

const initSearch = async () => {
    if (!sInput || !resList) return;
    sInput.disabled = false;
    sInput.focus();
    try {
        const response = await fetch('../index.json');
        if (!response.ok) throw new Error(`Search index load failed: ${response.status}`);
        const data = await response.json();
        if (data) fuse = new Fuse(data, buildFuseOptions());
    } catch (error) {
        console.error(error);
    }
};

window.addEventListener('load', initSearch);
sInput?.addEventListener('input', debounce(performSearch, 150));
sInput?.addEventListener('search', () => { if (!sInput.value) reset(); });

document.addEventListener('keydown', (event) => {
    const { key } = event;
    const active = document.activeElement;
    const isInSearchBox = searchBox?.contains(active);

    if (key === 'Escape') { reset(); return; }
    if (!firstResult || !isInSearchBox) return;

    if (key === 'ArrowDown') {
        event.preventDefault();
        if (active === sInput) {
            setActiveResult(firstResult.querySelector('.entry-link'));
        } else if (active?.parentElement !== lastResult) {
            setActiveResult(active?.parentElement?.nextElementSibling?.querySelector('.entry-link'));
        }
    } else if (key === 'ArrowUp') {
        event.preventDefault();
        if (active?.parentElement === firstResult) {
            setActiveResult(sInput);
        } else if (active !== sInput) {
            setActiveResult(active?.parentElement?.previousElementSibling?.querySelector('.entry-link'));
        }
    } else if (key === 'ArrowRight') {
        if (active?.matches?.('.entry-link')) active.click();
    }
});
