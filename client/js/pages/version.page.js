// version.page.js - Pagina delle patch notes (dati in data/changelog.js)
import { initColorTheme } from '../ui/theme.js';
import { startFogBackground } from '../ui/fog-background.js';
import { CHANGELOG, CHANGE_TYPES, CURRENT_VERSION } from '../data/changelog.js';
import { navigateTo } from '../ui/motion.js';

initColorTheme();

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
        // Il contenitore esterno porta il "pad" sulla linea del tempo
        const wrapper = makeElement('div', index === 0 ? 'version-entry current' : 'version-entry');
        wrapper.classList.add('scroll-reveal');
        wrapper.appendChild(card);
        return wrapper;
    }));
}

renderChangelog();

// Le schede compaiono quando entrano nello schermo (una volta sola)
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
        if (!entry.isIntersecting) return;
        // Quelle visibili insieme (es. all'apertura) entrano a cascata
        entry.target.style.transitionDelay = `${0.35 + i * 0.08}s`;
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
    });
}, { threshold: 0.12 });
document.querySelectorAll('.scroll-reveal').forEach(el => revealObserver.observe(el));
startFogBackground(document.getElementById('home-fog-canvas'));
