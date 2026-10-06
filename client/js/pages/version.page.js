// version.page.js - Pagina delle patch notes (dati in data/changelog.js) e, nella vista a destra,
// storico dei bilanciamenti (dati in data/balance-history.js)
import { initColorTheme } from '../ui/theme.js';
import { setPageFavicon } from '../ui/favicon.js';
import { startFogBackground } from '../ui/fog-background.js';
import { CHANGELOG, CHANGE_TYPES, CURRENT_VERSION } from '../data/changelog.js';
import { BALANCE_HISTORY, VERDICTS } from '../data/balance-history.js';
import { getElementColor, isElement } from '../game/elements.js';
import { navigateTo } from '../ui/motion.js';
import { playSfx } from '../ui/sfx.js';

initColorTheme();
setPageFavicon({ element: 'aria' }); // icona della scheda: un cerchio magico diverso per ogni pagina

document.getElementById('home-btn').addEventListener('click', () => navigateTo('/home.html'));

function makeElement(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
}

function formatDate(isoDate) {
    return new Date(`${isoDate}T00:00:00`).toLocaleDateString('it-IT', {
        day: 'numeric', month: 'long', year: 'numeric'
    });
}

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const balanceVersions = new Set(BALANCE_HISTORY.map(entry => entry.version));

// ============================================================
// PATCH NOTES
// ============================================================

function renderChangelog() {
    document.getElementById('version-title').textContent = `Versione ${CURRENT_VERSION} - Patch Notes`;

    const container = document.getElementById('changelog');
    container.replaceChildren(...CHANGELOG.map((entry, index) => {
        const card = makeElement('div', 'version-info');
        card.appendChild(makeElement('p', 'version-date', formatDate(entry.date)));
        // La versione corrente ha il titolo animato
        card.appendChild(makeElement('h2', index === 0 ? 'special' : null, `Versione ${entry.version}: ${entry.title}`));

        // Le categorie compaiono sempre nello stesso ordine
        for (const [type, label] of Object.entries(CHANGE_TYPES)) {
            const items = entry.changes[type];
            if (!items?.length) continue;
            card.appendChild(makeElement('h3', null, label));
            const list = makeElement('ul', 'version-changes');
            items.forEach(item => list.appendChild(makeElement('li', null, item)));
            card.appendChild(list);
        }

        // Versione con bilanciamenti: scorciatoia verso le sue schede
        if (balanceVersions.has(entry.version)) {
            const link = makeElement('button', 'balance-link', '▲▼ Vedi i bilanciamenti');
            link.type = 'button';
            link.addEventListener('click', () => showBalance(true, { version: entry.version }));
            card.appendChild(link);
        }

        // Il contenitore esterno porta il "pad" sulla linea del tempo
        const wrapper = makeElement('div', index === 0 ? 'version-entry current' : 'version-entry');
        wrapper.classList.add('scroll-reveal');
        wrapper.appendChild(card);
        return wrapper;
    }));
}

// ============================================================
// STORICO DEI BILANCIAMENTI
// ============================================================

const formatNumber = (n) => String(Number(n.toFixed(2)));
const formatValue = (value, unit) => `${formatNumber(value)}${unit ? (unit === '%' ? '%' : ` ${unit}`) : ''}`;

function formatDelta(before, after) {
    if (before === after) return '=';
    if (before === 0) return after > 0 ? '+∞' : '−∞';
    const percent = Math.round((after - before) / Math.abs(before) * 100);
    return `${percent > 0 ? '+' : '−'}${Math.abs(percent)}%`;
}

// good = il nuovo valore favorisce chi lancia la magia, bad = lo sfavorisce
function statOutcome({ before, after, better = 'higher' }) {
    if (before === after) return 'same';
    const increased = after > before;
    return increased === (better === 'higher') ? 'good' : 'bad';
}

function statRow(stat, index) {
    const outcome = statOutcome(stat);
    const li = makeElement('li', `balance-stat ${outcome}`);

    const line = makeElement('div', 'balance-stat-line');
    line.appendChild(makeElement('span', 'balance-stat-label', stat.label));
    const values = makeElement('span', 'balance-stat-values', `${formatValue(stat.before, stat.unit)} → `);
    values.appendChild(makeElement('strong', null, formatValue(stat.after, stat.unit)));
    line.appendChild(values);
    const arrow = outcome === 'good' ? '▲ ' : outcome === 'bad' ? '▼ ' : '';
    line.appendChild(makeElement('span', 'balance-delta', arrow + formatDelta(stat.before, stat.after)));
    li.appendChild(line);

    // Due barre in scala tra loro: si vede subito quanto è cambiato il valore
    const max = Math.max(Math.abs(stat.before), Math.abs(stat.after)) || 1;
    const bars = makeElement('div', 'balance-bars');
    bars.setAttribute('aria-hidden', 'true');
    for (const [kind, value] of [['before', stat.before], ['after', stat.after]]) {
        const bar = makeElement('div', `balance-bar ${kind}`);
        const fill = makeElement('span');
        fill.style.setProperty('--w', `${Math.max(2, Math.abs(value) / max * 100)}%`);
        fill.style.setProperty('--delay', `${0.3 + index * 0.08 + (kind === 'after' ? 0.15 : 0)}s`);
        bar.appendChild(fill);
        bars.appendChild(bar);
    }
    li.appendChild(bars);
    return li;
}

function verdictPill(verdict, text) {
    const { symbol, label } = VERDICTS[verdict];
    return makeElement('span', `verdict-pill ${verdict}`, `${symbol} ${text ?? label}`);
}

function balanceCard(change) {
    const card = makeElement('article', `balance-card panel scroll-reveal ${change.verdict}`);
    card.dataset.target = change.target;

    const header = makeElement('div', 'balance-card-header');
    const target = makeElement('div', 'balance-target');
    const element = makeElement('span', 'balance-element');
    const dot = makeElement('span', 'el-dot');
    if (isElement(change.target)) dot.style.setProperty('--el', getElementColor(change.target));
    element.append(dot, capitalize(change.target));
    target.append(element, makeElement('span', 'balance-effect', change.effect));
    header.append(target, verdictPill(change.verdict));
    card.appendChild(header);

    if (change.note) card.appendChild(makeElement('p', 'balance-note', change.note));

    const stats = makeElement('ul', 'balance-stats');
    change.stats.forEach((stat, i) => stats.appendChild(statRow(stat, i)));
    card.appendChild(stats);
    return card;
}

function renderBalanceHistory() {
    const container = document.getElementById('balance-history');
    if (!BALANCE_HISTORY.length) {
        container.replaceChildren(makeElement('p', 'balance-empty', 'Nessun bilanciamento registrato.'));
        return;
    }

    container.replaceChildren(...BALANCE_HISTORY.map(entry => {
        const section = makeElement('section', 'balance-version');
        section.dataset.version = entry.version;

        const header = makeElement('header', 'balance-version-header');
        header.appendChild(makeElement('h2', null, `Versione ${entry.version}${entry.title ? `: ${entry.title}` : ''}`));
        header.appendChild(makeElement('span', 'balance-version-date', formatDate(entry.date)));
        // Riepilogo: quanti buff, nerf e modifiche in questa versione
        const summary = makeElement('div', 'balance-version-summary');
        for (const verdict of Object.keys(VERDICTS)) {
            const count = entry.changes.filter(c => c.verdict === verdict).length;
            if (count) summary.appendChild(verdictPill(verdict, String(count)));
        }
        header.appendChild(summary);
        section.appendChild(header);

        const grid = makeElement('div', 'balance-grid');
        entry.changes.forEach(change => grid.appendChild(balanceCard(change)));
        section.appendChild(grid);
        return section;
    }));
}

// Filtri: "Tutti" + un pulsante per ogni elemento (o altro bersaglio) presente nello storico
function renderBalanceFilters() {
    const targets = [...new Set(BALANCE_HISTORY.flatMap(entry => entry.changes.map(c => c.target)))];
    if (targets.length < 2) return;

    const container = document.getElementById('balance-filters');
    const buttons = [null, ...targets].map(target => {
        const btn = makeElement('button', 'filter-chip');
        btn.type = 'button';
        btn.setAttribute('aria-pressed', String(target === null));
        if (target) {
            const dot = makeElement('span', 'el-dot');
            if (isElement(target)) dot.style.setProperty('--el', getElementColor(target));
            btn.append(dot, capitalize(target));
        } else {
            btn.textContent = 'Tutti';
        }
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
            applyBalanceFilter(target);
            playSfx('tick', { value: 0.6 });
        });
        return btn;
    });
    container.replaceChildren(...buttons);
}

function applyBalanceFilter(target) {
    for (const card of document.querySelectorAll('.balance-card')) {
        card.hidden = target !== null && card.dataset.target !== target;
    }
    // Una versione senza schede visibili sparisce del tutto
    for (const section of document.querySelectorAll('.balance-version')) {
        section.hidden = !section.querySelector('.balance-card:not([hidden])');
    }
}

// ============================================================
// CAMBIO VISTA (patch notes ↔ bilanciamenti)
// ============================================================

const BALANCE_HASH = '#bilanciamenti';

/** @param {{version?: string, sound?: boolean}} options version: scorre fino ai bilanciamenti di quella versione */
function showBalance(show, { version = null, sound = true } = {}) {
    const changed = document.body.classList.contains('show-balance') !== show;
    document.body.classList.toggle('show-balance', show);
    if (changed && sound) playSfx('slide', { direction: show ? -1 : 1 });
    // L'indirizzo ricorda la vista: un link a version.html#bilanciamenti apre direttamente lo storico
    history.replaceState(null, '', show ? BALANCE_HASH : window.location.pathname);
    if (show && version) {
        const section = document.querySelector(`.balance-version[data-version="${CSS.escape(version)}"]`);
        section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

document.getElementById('open-balance-btn').addEventListener('click', () => showBalance(true));
document.getElementById('close-balance-btn').addEventListener('click', () => showBalance(false));

renderChangelog();
renderBalanceFilters();
renderBalanceHistory();
if (window.location.hash === BALANCE_HASH) showBalance(true, { sound: false });

// Le schede compaiono quando entrano nello schermo (una volta sola); quelle dei bilanciamenti
// fanno anche crescere le barre. Le schede della vista nascosta entrano quando la vista scorre dentro.
const revealObserver = new IntersectionObserver((entries) => {
    entries.filter(entry => entry.isIntersecting).forEach((entry, i) => {
        // Quelle visibili insieme (es. all'apertura) entrano a cascata
        entry.target.style.transitionDelay = `${0.35 + i * 0.08}s`;
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
    });
}, { threshold: 0.12 });
document.querySelectorAll('.scroll-reveal').forEach(el => revealObserver.observe(el));
startFogBackground(document.getElementById('home-fog-canvas'));
