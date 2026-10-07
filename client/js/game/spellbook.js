// spellbook.js - Cerchi magici salvati negli slot 1-9: si salvano solo in laboratorio, si evocano ovunque.
// Uno slot contiene { elemento, proiezioni }: l'elemento inciso e le cariche, nell'ordine in cui sono state incise.
// Nel PvP si tiene anche lo spellbook dell'avversario, ma solo gli slot che ha già usato in questo duello.
import { savePlayerSpell, getCurrentUsername } from '../services/player-db.js';
import { isElement, isProjection } from './elements.js';

export const SPELLBOOK_SLOTS = 9;

const slots = new Map(); // numero dello slot (1-9) -> magia salvata
const opponentSlots = new Map(); // slot già usati dall'avversario nel duello in corso
let saveMode = false;

/** Carica lo spellbook dal profilo del giocatore, scartando i dati non validi */
export function loadSpellbook(saved) {
  slots.clear();
  if (!saved || typeof saved !== 'object') return;
  for (const [key, spell] of Object.entries(saved)) {
    const slot = Number(key);
    const normalized = normalizeSpell(spell);
    if (isValidSlot(slot) && normalized) slots.set(slot, normalized);
  }
}

export function normalizeSpell(spell) {
  if (!spell || typeof spell !== 'object') return null;
  const elemento = isElement(spell.elemento) ? spell.elemento : null;
  const proiezioni = Array.isArray(spell.proiezioni) ? spell.proiezioni.filter(isProjection) : [];
  if (!elemento && proiezioni.length === 0) return null;
  return { elemento, proiezioni };
}

export function isValidSlot(slot) {
  return Number.isInteger(slot) && slot >= 1 && slot <= SPELLBOOK_SLOTS;
}

/** @returns {{elemento: string|null, proiezioni: string[]} | null} */
export function getSpell(slot) {
  return slots.get(slot) || null;
}

/** Un cerchio senza elemento né cariche non ha niente da salvare */
export function isCircleSavable(circle) {
  return !!circle && (!!circle.elemento || circle.projections.length > 0);
}

/**
 * Salva il cerchio magico nello slot. Lo spellbook locale si aggiorna subito,
 * il salvataggio su Firestore arriva dopo (la promise fallisce se non riesce).
 */
export function saveCircleToSlot(slot, circle) {
  const spell = normalizeSpell({ elemento: circle.elemento, proiezioni: [...circle.projections] });
  if (!isValidSlot(slot) || !spell) return Promise.reject(new Error('Niente da salvare'));
  slots.set(slot, spell);
  return savePlayerSpell(getCurrentUsername(), slot, { ...spell, savedAt: Date.now() });
}

/** L'avversario ha evocato il cerchio di un suo slot: da ora è visibile nel nostro overlay */
export function recordOpponentSpell(slot, spell) {
  const normalized = normalizeSpell(spell);
  if (!isValidSlot(slot) || !normalized) return false;
  const known = opponentSlots.get(slot);
  if (known && JSON.stringify(known) === JSON.stringify(normalized)) return false;
  opponentSlots.set(slot, normalized);
  return true;
}

/** Slot già usati dall'avversario, in ordine di numero: [[slot, magia], ...] */
export function getOpponentSpells() {
  return [...opponentSlots.entries()].sort((a, b) => a[0] - b[0]);
}

export function isSaveMode() {
  return saveMode;
}

/** @returns {boolean} il nuovo stato */
export function toggleSaveMode() {
  saveMode = !saveMode;
  return saveMode;
}

/** Slot associato al tasto premuto (1-9, anche dal tastierino numerico), altrimenti null */
export function slotFromKeyEvent(e) {
  const match = /^(?:Digit|Numpad)([1-9])$/.exec(e.code);
  return match ? Number(match[1]) : null;
}
