// progression.js - Curve di livello, esperienza e mana (valori condivisi tra pagine)

// Esperienza necessaria per passare dal livello indicato al successivo
export function getExpToNext(level) {
  return Math.floor(100 + 30 * Math.pow(level, 1.5));
}

// Mana, vita e danni non dipendono più dal livello: ogni livello dà un punto abilità
// (formule in player-stats.js)

export const BURNOUT_FRAMES = 300; // 5 secondi a 60fps
