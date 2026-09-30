// progression.js - Curve di livello, esperienza e mana (valori condivisi tra pagine)

// Esperienza necessaria per passare dal livello indicato al successivo
export function getExpToNext(level) {
  return Math.floor(100 + 30 * Math.pow(level, 1.5));
}

// Mana massimo e rigenerazione (per frame, ~60fps) in base al livello
export function getManaStatsForLevel(level) {
  return {
    max: level * 10,
    regenPerFrame: 0.01 * level * 0.2
  };
}

export const BURNOUT_FRAMES = 300; // 5 secondi a 60fps
