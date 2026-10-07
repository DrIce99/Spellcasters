// linker.js - Linker: artefatti che si equipaggiano nei 5 slot del cerchio personale del giocatore.
// Su Firestore: campo `linker` del giocatore = { colore: '#rrggbb', alfabeto, inventario: [...], equip: { core: id, ... } }.
// Un Linker dell'inventario ha almeno { id, slot } (slot = chiave di LINKER_SLOTS); rarità, livello e statistiche
// (rarita, livello, principale, secondarie) sono provvisori finché non sono definite le regole dei Linker.
import { isRuneAlphabet, DEFAULT_RUNE_ALPHABET } from '../ui/runes.js';

// Ordine = posizione attorno al cerchio, in senso orario partendo dall'alto
export const LINKER_SLOTS = [
  { key: 'core', label: 'Core' },
  { key: 'matrix', label: 'Matrix' },
  { key: 'relay', label: 'Relay' },
  { key: 'conduit', label: 'Conduit' },
  { key: 'apex', label: 'Apex' }
];

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
  const inventory = Array.isArray(player?.linker?.inventario) ? player.linker.inventario : [];
  return inventory.filter(linker => linker && linker.slot === slotKey);
}

/** Linker equipaggiato nello slot (equip salva il suo id), oppure null */
export function getEquippedLinker(player, slotKey) {
  const id = player?.linker?.equip?.[slotKey];
  if (id == null) return null;
  return getLinkerInventory(player, slotKey).find(linker => linker.id === id) || null;
}
