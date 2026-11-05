// shop.page.js - Shop dei Linker: pacchetti gacha (uno per set + lo standard) pagati in BitRune
import { initColorTheme } from '../ui/theme.js';
import { setPageFavicon } from '../ui/favicon.js';
import { navigateTo, shake } from '../ui/motion.js';
import { playSfx } from '../ui/sfx.js';
import { getPlayerData, getCurrentUsername } from '../services/player-db.js';
import { pullLinkers } from '../services/linker-db.js';
import { getCurrency } from '../game/linker.js';
import {
  PACKS, LINKER_SETS, LINKER_SLOTS, LINKER_STATS, RARITIES, MAX_RARITY, MULTI_PULL, EPIC_PITY, LEGENDARY_PITY,
  CURRENCIES, mainStatValue, formatStatValue, countEquippedSets
} from '../game/linker-data.js';
import { loadLinkerArt, getLinkerArt } from '../ui/linker-art.js';
import { linkerHeader, linkerStats, setBonusBox } from '../ui/linker-detail.js';

initColorTheme();
setPageFavicon({ element: 'fulmine', charged: true }); // icona della scheda: un cerchio magico diverso per ogni pagina

const username = getCurrentUsername();
if (!username) window.location.href = '/index.html';

const STANDARD_COLOR = '#9aa3b5';
const REVEAL_GAP_MS = 120; // le carte del risultato si rivelano una dopo l'altra
const bitrune = CURRENCIES.bitrune;

let player = null;
let pulling = false;
let pickedCard = null; // carta del risultato di cui si vede il dettaglio

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

const packColor = (pack) => (pack.set ? LINKER_SETS[pack.set].color : STANDARD_COLOR);

// Disegna in un canvas la grafica di uno slot nel colore indicato (appena le grafiche sono caricate)
function slotArt(slotKey, color, size) {
  const canvas = el('canvas', 'linker-art');
  const dpr = window.devicePixelRatio || 1;
  canvas.width = canvas.height = Math.round(size * dpr);
  canvas.style.width = canvas.style.height = `${size}px`;
  loadLinkerArt().then(() => {
    const art = getLinkerArt(slotKey, color);
    if (art) canvas.getContext('2d').drawImage(art, 0, 0, canvas.width, canvas.height);
  });
  return canvas;
}

// --- Pacchetti ---

function renderPacks() {
  const owned = getCurrency(player, 'bitrune');
  const cards = Object.entries(PACKS).map(([key, pack]) => {
    const color = packColor(pack);
    const li = el('li', `shop-pack panel${pack.set ? '' : ' standard'}`);
    li.style.setProperty('--pack', color);

    const arts = el('div', 'shop-pack-arts');
    arts.append(...LINKER_SLOTS.map(({ key: slot }) => slotArt(slot, color, 46)));

    const info = el('div', 'shop-pack-info');
    info.append(el('h2', 'shop-pack-name', pack.name), el('p', 'shop-pack-text', pack.text));
    if (pack.set) {
      const set = LINKER_SETS[pack.set];
      info.append(el('p', 'shop-pack-bonus', `2 pezzi: ${set.text2}`), el('p', 'shop-pack-bonus', `4 pezzi: ${set.text4}`));
    } else {
      info.append(el('p', 'shop-pack-bonus', `Set possibili: ${Object.values(LINKER_SETS).map(s => s.name).join(', ')}`));
    }

    const buttons = el('div', 'shop-pack-buttons');
    for (const count of [1, MULTI_PULL]) {
      const cost = pack.cost * count;
      const btn = el('button', `shop-pull${count > 1 ? ' multi' : ''}`, `×${count} · ${cost} ${bitrune.symbol}`);
      btn.type = 'button';
      btn.disabled = pulling || owned < cost;
      btn.title = owned < cost ? `Servono ${cost} ${bitrune.name}` : `${count} pull per ${cost} ${bitrune.name}`;
      btn.addEventListener('click', () => pull(key, count));
      buttons.append(btn);
    }
    li.append(arts, info, buttons);
    return li;
  });
  document.getElementById('shop-packs').replaceChildren(...cards);
}

function renderStatus() {
  document.getElementById('shop-bitrune').textContent = player ? getCurrency(player, 'bitrune') : '…';
  const pity = player?.gacha?.pity || {};
  const toEpic = EPIC_PITY - (pity.sinceEpic || 0);
  const toLegendary = LEGENDARY_PITY - (pity.sinceLegendary || 0);
  document.getElementById('shop-pity').textContent =
    `Epico garantito entro ${toEpic} pull · Leggendario entro ${toLegendary}`;
  document.getElementById('shop-rates').textContent = 'Probabilità: ' + RARITIES.slice(1)
    .map(r => `${r.name} ${(r.rate * 100).toFixed(0)}%`).join(' · ');
}

async function reload() {
  try {
    player = await getPlayerData(username);
  } catch (error) {
    console.error('❌ Impossibile caricare il giocatore:', error);
  }
  renderStatus();
  renderPacks();
}

// --- Pull ---

async function pull(packKey, count) {
  if (pulling) return;
  pulling = true;
  renderPacks();
  const errorEl = document.getElementById('shop-error');
  errorEl.textContent = '';
  try {
    const result = await pullLinkers(username, packKey, count);
    player = result.player;
    showResults(result.linkers);
  } catch (error) {
    console.error('❌ Pull non riuscita:', error);
    errorEl.textContent = `Pull non riuscita: ${error.message || 'errore sconosciuto'}`;
    playSfx('error');
    shake(errorEl);
  } finally {
    pulling = false;
    renderStatus();
    renderPacks();
  }
}

function resultCard(linker, index) {
  const set = LINKER_SETS[linker.set];
  const rarity = RARITIES[linker.rarita];
  const slot = LINKER_SLOTS.find(s => s.key === linker.slot);
  const li = el('li', `pull-card rarity-${linker.rarita}`);
  li.style.setProperty('--rarity', rarity.color);
  li.style.setProperty('--set', set.color);
  li.style.animationDelay = `${index * REVEAL_GAP_MS}ms`;
  li.append(
    el('span', 'pull-card-stars', '★'.repeat(linker.rarita)),
    slotArt(linker.slot, set.color, 64),
    el('span', 'pull-card-slot', slot?.label || linker.slot),
    el('span', 'pull-card-main', `${LINKER_STATS[linker.principale]?.label} ${formatStatValue(linker.principale, mainStatValue(linker))}`),
    el('span', 'pull-card-set', set.name),
    el('span', 'pull-card-rarity', rarity.name)
  );
  // Cliccando la carta si vede il dettaglio del Linker (main stat, sub stat, bonus del set)
  li.tabIndex = 0;
  li.setAttribute('role', 'button');
  li.setAttribute('aria-expanded', 'false');
  li.title = 'Vedi il dettaglio';
  const toggle = () => (pickedCard === li ? hideDetail() : showDetail(linker, li));
  li.addEventListener('click', toggle);
  li.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle();
    }
  });
  return li;
}

// --- Dettaglio di un Linker ottenuto ---

function showDetail(linker, card) {
  pickedCard?.classList.remove('picked');
  pickedCard?.setAttribute('aria-expanded', 'false');
  pickedCard = card;
  card.classList.add('picked');
  card.setAttribute('aria-expanded', 'true');

  const detail = document.getElementById('pull-detail');
  detail.style.setProperty('--set', LINKER_SETS[linker.set]?.color || STANDARD_COLOR);
  const close = el('button', 'pull-detail-close', '✕');
  close.type = 'button';
  close.title = 'Chiudi il dettaglio';
  close.setAttribute('aria-label', 'Chiudi il dettaglio');
  close.addEventListener('click', hideDetail);
  // Il riquadro del set conta i pezzi già equipaggiati: si vede subito se il nuovo Linker completa un bonus
  const setCounts = countEquippedSets(player);
  detail.replaceChildren(close, ...linkerHeader(linker), linkerStats(linker), setBonusBox(linker.set, setCounts[linker.set] || 0));
  detail.hidden = false;
  detail.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function hideDetail() {
  pickedCard?.classList.remove('picked');
  pickedCard?.setAttribute('aria-expanded', 'false');
  pickedCard?.focus();
  pickedCard = null;
  document.getElementById('pull-detail').hidden = true;
}

function closeResults() {
  hideDetail();
  document.getElementById('pull-overlay').hidden = true;
}

function showResults(linkers) {
  const best = Math.max(...linkers.map(l => l.rarita));
  document.getElementById('pull-title').textContent =
    best === MAX_RARITY ? 'Linker Leggendario ottenuto!' : `${linkers.length === 1 ? 'Linker ottenuto' : 'Linker ottenuti'}`;
  hideDetail();
  document.getElementById('pull-results').replaceChildren(...linkers.map(resultCard));
  const overlay = document.getElementById('pull-overlay');
  overlay.hidden = false;
  overlay.dataset.best = String(best);
  playSfx(best >= 4 ? 'levelUp' : 'success');
}

document.getElementById('pull-close').addEventListener('click', closeResults);
// #linker: la pagina info si apre direttamente sul pannello dei Linker
const toLinkers = () => navigateTo(`/player-info.html?user=${encodeURIComponent(username)}#linker`);
document.getElementById('pull-linker').addEventListener('click', toLinkers);
document.getElementById('shop-linker-btn').addEventListener('click', toLinkers);
document.getElementById('home-btn').addEventListener('click', () => navigateTo('/home.html'));
window.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (pickedCard) hideDetail(); // prima si chiude il dettaglio, poi il risultato
  else closeResults();
});
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && !pulling) reload();
});

// I pacchetti si vedono subito; saldo e pulsanti si aggiornano quando arriva il profilo
renderStatus();
renderPacks();
if (username) reload();
