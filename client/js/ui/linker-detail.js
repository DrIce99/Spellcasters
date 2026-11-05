// linker-detail.js - Pezzi del dettaglio di un Linker (intestazione, main stat, sub stat, bonus del set) e
// resoconto dei set equipaggiati. Li usano l'inventario della pagina info (linker-inventory.js) e lo shop.
// Stili in /css/style-linker.css.
import { LINKER_SLOTS, LINKER_SETS, LINKER_STATS, RARITIES, mainStatValue, subStatValue, formatStatValue } from '../game/linker-data.js';

export const SET_PIECES = [2, 4];
const MAX_SET_PIECES = SET_PIECES[SET_PIECES.length - 1];

export const slotLabel = (key) => LINKER_SLOTS.find(s => s.key === key)?.label || key;
export const statLabel = (key) => LINKER_STATS[key]?.label || key;
export const setInfo = (key) => LINKER_SETS[key] || { name: 'Set sconosciuto', color: 'var(--line-strong)' };

export function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function stars(count) {
  return '★'.repeat(Math.max(0, Math.min(5, count || 0)));
}

/** Titolo (set · slot) e riga con rarità, stelle e livello */
export function linkerHeader(linker) {
  const set = setInfo(linker.set);
  const rarity = RARITIES[linker.rarita];
  const title = el('h4', 'linker-detail-title', `${set.name} · ${slotLabel(linker.slot)}`);
  title.style.setProperty('--set', set.color);
  const meta = el('p', 'linker-detail-meta');
  const starsEl = el('span', 'linker-detail-stars', stars(linker.rarita));
  starsEl.style.color = rarity?.color || '';
  meta.append(el('span', null, `${rarity?.name || ''} `), starsEl, el('span', 'linker-detail-level', ` +${linker.livello || 0}`));
  return [title, meta];
}

export function mainStatLine(linker, value = mainStatValue(linker)) {
  const li = el('li', 'linker-stat main');
  li.append(el('span', 'linker-stat-name', statLabel(linker.principale)), el('span', 'linker-stat-value', formatStatValue(linker.principale, value)));
  return li;
}

/** @param {string[]} highlight sub stat appena potenziate (bagliore) */
export function subStatLines(linker, highlight = []) {
  return (linker.secondarie || []).map(sub => {
    const li = el('li', 'linker-stat sub');
    li.classList.toggle('just-upgraded', highlight.includes(sub.stat));
    const name = el('span', 'linker-stat-name', statLabel(sub.stat));
    // Numero di potenziamenti, solo per le sub stat migliorate almeno una volta
    if (sub.upgrades > 0) name.append(el('span', 'linker-stat-upgrades', `+${sub.upgrades}`));
    li.append(name, el('span', 'linker-stat-value', formatStatValue(sub.stat, subStatValue(sub))));
    return li;
  });
}

/** Lista di main stat e sub stat */
export function linkerStats(linker, highlight = []) {
  const stats = el('ul', 'linker-detail-stats');
  stats.append(mainStatLine(linker), ...subStatLines(linker, highlight));
  return stats;
}

/** Riquadro di un set: pezzi equipaggiati e bonus a 2 e 4 pezzi (quelli raggiunti in evidenza) */
export function setBonusBox(setKey, count) {
  const set = setInfo(setKey);
  const box = el('div', 'linker-set');
  box.dataset.key = setKey; // per scramble.js: il riquadro resta lo stesso anche se cambia posizione
  box.style.setProperty('--set', set.color);
  box.append(el('p', 'linker-set-name', `${set.name} (${count}/${MAX_SET_PIECES} equipaggiati)`));
  for (const pieces of SET_PIECES) {
    const line = el('p', 'linker-set-bonus', `${pieces} pezzi: ${set[`text${pieces}`] || '—'}`);
    line.classList.toggle('active', count >= pieces);
    box.append(line);
  }
  return box;
}

/**
 * Resoconto dei set dei Linker equipaggiati: un riquadro per ogni set con almeno un pezzo,
 * con i bonus attivi e quelli ancora da raggiungere
 * @param {Record<string, number>} setCounts pezzi equipaggiati per set (countEquippedSets)
 */
export function setSummary(setCounts) {
  const entries = Object.entries(setCounts)
    .filter(([key, count]) => LINKER_SETS[key] && count > 0)
    .sort((a, b) => b[1] - a[1]);
  if (!entries.length) return [el('p', 'linker-summary-empty', 'Nessun Linker equipaggiato: qui compariranno i bonus dei set.')];
  return entries.map(([key, count]) => setBonusBox(key, count));
}
