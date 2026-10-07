// linker.js - Linker: artefatti che si equipaggiano nei 5 slot del cerchio personale del giocatore.
// Su Firestore: campo `linker` del giocatore = { colore: '#rrggbb', alfabeto, inventario: [...], equip: { core: id, ... } }.
// Le regole (statistiche, set, livelli, pacchetti) sono in linker-data.js; qui ci sono le letture del profilo.
import { isRuneAlphabet, DEFAULT_RUNE_ALPHABET } from '../ui/runes.js';
import { LINKER_SLOTS, getInventory } from './linker-data.js';

export { LINKER_SLOTS };

export const DEFAULT_LINKER_COLOR = '#7f5cff';

/** Colore del cerchio salvato, se valido ('#rrggbb'); altrimenti quello predefinito */
export function getLinkerColor(player) {
  const color = player?.linker?.colore;
  return typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color) ? color.toLowerCase() : DEFAULT_LINKER_COLOR;
}

/** Alfabeto runico scelto per il nome nel cerchio (chiave di RUNE_ALPHABETS in runes.js) */
export function getLinkerAlphabet(player) {
  const alphabet = player?.linker?.alfabeto;
  return isRuneAlphabet(alphabet) ? alphabet : DEFAULT_RUNE_ALPHABET;
}

/** Linker posseduti per quello slot */
export function getLinkerInventory(player, slotKey) {
  return getInventory(player).filter(linker => linker && linker.slot === slotKey);
}

/** Linker equipaggiato nello slot (equip salva il suo id), oppure null */
export function getEquippedLinker(player, slotKey) {
  const id = player?.linker?.equip?.[slotKey];
  if (id == null) return null;
  return getLinkerInventory(player, slotKey).find(linker => linker.id === id) || null;
}

/** Saldo di una valuta (bitrune, catalizzante) */
export function getCurrency(player, key) {
  return Math.max(0, Math.floor(Number(player?.valute?.[key]) || 0));
}
