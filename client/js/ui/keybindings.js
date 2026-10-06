// keybindings.js - Tasti assegnati alle azioni, personalizzabili dalle impostazioni (salvati in localStorage)

const STORAGE_KEY = 'keyBindings';

// Azioni rimappabili e tasto predefinito (valore di KeyboardEvent.key, lettere in minuscolo)
export const KEY_ACTIONS = {
  cast: { label: 'Inizia/disegna spell', default: 'z' },
  cancel: { label: 'Annulla cerchio magico / magia attiva (oltre a RMB)', default: 'x' },
  themeDay: { label: 'Tema giorno', default: 'ArrowUp' },
  themeNight: { label: 'Tema notte', default: 'ArrowDown' }
};

// Tasti che non si possono assegnare: Esc chiude i menu ed esce dal gioco
const RESERVED_KEYS = ['Escape'];

const KEY_LABELS = {
  ' ': 'Spazio',
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
  Control: 'Ctrl',
  Enter: 'Invio',
  Backspace: '⌫',
  Tab: 'Tab'
};

let bindings = loadBindings();

/** "Z" e "z" sono lo stesso tasto (con o senza maiuscole) */
export function normalizeKey(key) {
  return typeof key === 'string' && key.length === 1 ? key.toLowerCase() : key;
}

function loadBindings() {
  const result = {};
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    saved = {};
  }
  for (const [action, { default: fallback }] of Object.entries(KEY_ACTIONS)) {
    const key = normalizeKey(saved[action]);
    result[action] = typeof key === 'string' && key && !RESERVED_KEYS.includes(key) ? key : fallback;
  }
  return result;
}

function saveBindings() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bindings));
  } catch {
    // localStorage non disponibile: i tasti valgono solo per questa pagina
  }
}

export function getKeyBinding(action) {
  return bindings[action];
}

/** true se l'evento da tastiera corrisponde al tasto assegnato all'azione */
export function matchesAction(event, action) {
  return normalizeKey(event.key) === bindings[action];
}

export function isReservedKey(key) {
  return RESERVED_KEYS.includes(key);
}

/**
 * Assegna un tasto a un'azione. Se il tasto era già usato da un'altra azione,
 * le due azioni si scambiano i tasti (nessuna resta senza).
 */
export function setKeyBinding(action, key) {
  key = normalizeKey(key);
  if (!KEY_ACTIONS[action] || !key || isReservedKey(key)) return;
  const previous = bindings[action];
  for (const [other, otherKey] of Object.entries(bindings)) {
    if (other !== action && otherKey === key) bindings[other] = previous;
  }
  bindings[action] = key;
  saveBindings();
}

export function resetKeyBindings() {
  for (const [action, { default: fallback }] of Object.entries(KEY_ACTIONS)) bindings[action] = fallback;
  saveBindings();
}

/** Nome leggibile di un tasto (es. "ArrowUp" -> "↑", "z" -> "Z") */
export function formatKey(key) {
  if (KEY_LABELS[key]) return KEY_LABELS[key];
  return key.length === 1 ? key.toUpperCase() : key;
}

// Le modifiche fatte in un'altra scheda valgono subito anche qui
window.addEventListener('storage', (e) => {
  if (e.key === STORAGE_KEY) bindings = loadBindings();
});
