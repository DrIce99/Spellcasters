// spellbook-overlay.js - Gli slot dello spellbook in sovrimpressione: si vedono solo finché
// si tiene premuto il tasto (come la classifica negli sparatutto), con lo sfondo oscurato.
// Nel PvP sotto ai propri slot compaiono quelli che l'avversario ha già usato nel duello.
import { SPELLBOOK_SLOTS, getSpell, getOpponentSpells, isSaveMode } from '../game/spellbook.js';
import { getElementColor, EMPTY_CIRCLE_COLOR } from '../game/elements.js';
import { renderCircleImage } from './favicon.js';
import { getKeyBinding, formatKey } from './keybindings.js';

const PREVIEW_SIZE = 76; // lato in px CSS dell'anteprima del cerchio
const TOAST_MS = 1800;

// Impostato da engine.js: dove si possono salvare i cerchi e chi è l'avversario (null fuori dal PvP)
const config = { canSave: false, opponentName: null };

let overlay = null;
let modeLabel = null;
let hint = null;
let opponentSection = null;
let opponentTitle = null;
let opponentList = null;
let opponentEmpty = null;
const slotEls = new Map(); // slot -> elementi della card nei propri slot
let toast = null;
let toastTimer = null;

export function configureSpellbookOverlay({ canSave = false, opponentName = null } = {}) {
  config.canSave = canSave;
  config.opponentName = opponentName;
  if (overlay) render();
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function createSlotCard(slot) {
  const root = document.createElement('li');
  root.className = 'spellbook-slot';
  const key = document.createElement('span');
  key.className = 'spellbook-key';
  key.textContent = slot;
  const canvas = document.createElement('canvas');
  canvas.className = 'spellbook-preview';
  const name = document.createElement('span');
  name.className = 'spellbook-name';
  const charges = document.createElement('span');
  charges.className = 'spellbook-charges';
  root.append(key, canvas, name, charges);
  return { root, canvas, name, charges };
}

function fillSlotCard({ root, canvas, name, charges }, spell) {
  root.classList.toggle('empty', !spell);
  const dpr = window.devicePixelRatio || 1;
  canvas.width = canvas.height = Math.round(PREVIEW_SIZE * dpr);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!spell) {
    root.style.removeProperty('--slot-color');
    name.textContent = 'Vuoto';
    charges.textContent = '';
    return;
  }
  root.style.setProperty('--slot-color', spell.elemento ? getElementColor(spell.elemento) : EMPTY_CIRCLE_COLOR);
  ctx.drawImage(renderCircleImage({ element: spell.elemento, projections: spell.proiezioni, size: canvas.width }), 0, 0);
  name.textContent = spell.elemento ? capitalize(spell.elemento) : 'Mana puro';
  charges.textContent = spell.proiezioni.length > 0
    ? spell.proiezioni.map(capitalize).join(' · ')
    : 'Nessuna carica';
}

function createSection(titleText) {
  const section = document.createElement('section');
  section.className = 'spellbook-section';
  const title = document.createElement('h3');
  title.className = 'spellbook-section-title';
  title.textContent = titleText;
  const list = document.createElement('ol');
  list.className = 'spellbook-slots';
  section.append(title, list);
  return { section, title, list };
}

function build() {
  overlay = document.createElement('div');
  overlay.className = 'spellbook-overlay';
  overlay.hidden = true;
  overlay.setAttribute('aria-hidden', 'true');

  const panel = document.createElement('div');
  panel.className = 'spellbook-panel panel';

  const header = document.createElement('header');
  const title = document.createElement('h2');
  title.className = 'section-title';
  title.textContent = 'Spellbook';
  modeLabel = document.createElement('span');
  modeLabel.className = 'spellbook-mode';
  modeLabel.textContent = 'Modalità salvataggio';
  header.append(title, modeLabel);

  const own = createSection('I tuoi slot');
  for (let slot = 1; slot <= SPELLBOOK_SLOTS; slot++) {
    const card = createSlotCard(slot);
    own.list.appendChild(card.root);
    slotEls.set(slot, card);
  }

  const opponent = createSection('');
  opponent.section.classList.add('opponent');
  opponentSection = opponent.section;
  opponentTitle = opponent.title;
  opponentList = opponent.list;
  opponentEmpty = document.createElement('p');
  opponentEmpty.className = 'spellbook-empty';
  opponentEmpty.textContent = 'Non ha ancora evocato cerchi dallo spellbook';
  opponentSection.appendChild(opponentEmpty);

  hint = document.createElement('footer');
  hint.className = 'spellbook-hint';

  panel.append(header, own.section, opponentSection, hint);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);
}

function renderOwnSlots() {
  for (let slot = 1; slot <= SPELLBOOK_SLOTS; slot++) fillSlotCard(slotEls.get(slot), getSpell(slot));
}

// Solo gli slot che l'avversario ha già usato: gli altri restano nascosti
function renderOpponentSlots() {
  opponentSection.hidden = !config.opponentName;
  if (!config.opponentName) return;
  opponentTitle.textContent = `Spellbook di ${config.opponentName}`;
  const spells = getOpponentSpells();
  opponentList.replaceChildren(...spells.map(([slot, spell]) => {
    const card = createSlotCard(slot);
    fillSlotCard(card, spell);
    return card.root;
  }));
  opponentList.hidden = spells.length === 0;
  opponentEmpty.hidden = spells.length > 0;
}

// Tasto mostrato come un keycap, dentro al testo dei suggerimenti
function keycap(text) {
  const kbd = document.createElement('kbd');
  kbd.textContent = text;
  return kbd;
}

function renderHint() {
  const saveKey = formatKey(getKeyBinding('saveMode'));
  const slots = `1–${SPELLBOOK_SLOTS}`;
  const parts = [];
  if (config.canSave && isSaveMode()) {
    parts.push([keycap(slots), ' sul cerchio magico: salva'], [keycap(saveKey), ' esci dalla modalità salvataggio']);
  } else {
    parts.push([keycap(slots), ' evoca il cerchio salvato']);
    parts.push(config.canSave ? [keycap(saveKey), ' modalità salvataggio'] : ['I cerchi si salvano in laboratorio']);
  }
  const items = parts.map((content) => {
    const span = document.createElement('span');
    span.append(...content);
    return span;
  });
  hint.replaceChildren(...items);
}

function render() {
  renderOwnSlots();
  renderOpponentSlots();
  updateSpellbookMode();
}

/** Aggiorna l'indicazione della modalità salvataggio (anche a overlay aperto) */
export function updateSpellbookMode() {
  if (!overlay) return;
  modeLabel.hidden = !(config.canSave && isSaveMode());
  renderHint();
}

export function showSpellbookOverlay() {
  if (!overlay) build();
  if (!overlay.hidden) return;
  render();
  overlay.hidden = false;
}

export function hideSpellbookOverlay() {
  if (overlay) overlay.hidden = true;
}

/** Ridisegna uno slot appena salvato, con un bagliore se l'overlay è aperto */
export function refreshSpellbookSlot(slot) {
  if (!overlay) return;
  const card = slotEls.get(slot);
  fillSlotCard(card, getSpell(slot));
  card.root.classList.remove('saved');
  void card.root.offsetWidth; // riavvia l'animazione
  card.root.classList.add('saved');
}

/** L'avversario ha rivelato un nuovo slot: se l'overlay è aperto compare subito */
export function refreshOpponentSpellbook() {
  if (overlay && !overlay.hidden) renderOpponentSlots();
}

/** Breve messaggio in basso: conferma del salvataggio o motivo per cui non è riuscito */
export function showSpellbookToast(text, variant = 'success') {
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'spellbook-toast';
    toast.setAttribute('role', 'status');
    document.body.appendChild(toast);
  }
  toast.textContent = text;
  toast.dataset.variant = variant;
  toast.hidden = false;
  toast.classList.remove('show');
  void toast.offsetWidth;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, TOAST_MS);
}

// Uscendo dalla finestra (Alt+Tab) il keyup del tasto non arriva: l'overlay non deve restare aperto
window.addEventListener('blur', hideSpellbookOverlay);
