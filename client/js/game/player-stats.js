// player-stats.js - Statistiche del giocatore: punti abilità, affinità e valori derivati.
// Unico posto in cui sono definite le formule: lo usano il gioco, l'arena e la pagina info.
import { ELEMENTS, SYMBOLS } from './elements.js';

// Statistiche potenziabili con i punti abilità (salvati su DB in `puntiAbilita`)
export const SKILLS = {
  hp: { label: 'HP', base: 100, perPoint: 10 },
  atk: { label: 'ATK base', base: 10, perPoint: 1 },
  mp: { label: 'MP', base: 20, perPoint: 5 },
  riduzioneMana: { label: 'Riduzione consumo mana', base: 0, perPoint: 0.02, max: 0.5, percent: true }
};

// Rigenerazione del mana: non dipende più dal livello (~0.3 mana al secondo a 60fps)
export const MANA_REGEN_PER_FRAME = 0.005;

// Danni base con ATK = SKILLS.atk.base; scalano in proporzione all'ATK
export const BASE_DAMAGE = {
  proiettile: 15,
  spaziale: 0.5, // per tick (ogni 0.5 s) ogni 700 px² di area
  laser: 4       // per tick (ogni 0.5 s) a chi tocca il raggio
};
export const SPATIAL_DAMAGE_AREA_UNIT = 700;

// Bonus passivi dall'affinità: crescono con rendimenti decrescenti verso il massimo
const AFFINITY_SCALE = 500;
const MAX_AFFINITY_DEF = 0.30;              // 30% di difesa dall'elemento
const BASE_RECOGNITION_MARGIN = 0.40;       // errore tollerato nel disegno (soglia 60%)
const MAX_AFFINITY_RECOGNITION_BONUS = 0.10;
// Cerchio e proiezioni: il margine cresce con il numero di volte che il segno è stato disegnato
const SYMBOL_PRACTICE_SCALE = 300;

function affinityCurve(affinity) {
  return 1 - Math.exp(-Math.max(0, affinity || 0) / AFFINITY_SCALE);
}

function practiceCurve(timesDrawn) {
  return 1 - Math.exp(-Math.max(0, timesDrawn || 0) / SYMBOL_PRACTICE_SCALE);
}

function sanitizeAllocation(raw) {
  const allocation = {};
  for (const key of Object.keys(SKILLS)) {
    const value = Math.floor(Number(raw?.[key]) || 0);
    allocation[key] = Math.max(0, value);
  }
  return allocation;
}

export function getSkillValue(key, points) {
  const skill = SKILLS[key];
  const value = skill.base + skill.perPoint * points;
  return skill.max !== undefined ? Math.min(skill.max, value) : value;
}

export function isSkillMaxed(key, points) {
  const skill = SKILLS[key];
  return skill.max !== undefined && skill.base + skill.perPoint * points >= skill.max;
}

// Ogni livello oltre il primo vale un punto abilità
export function getTotalSkillPoints(level) {
  return Math.max(0, (level || 1) - 1);
}

export function getAtkMultiplier(atk) {
  return atk / SKILLS.atk.base;
}

/** Tutte le statistiche di un giocatore a partire dal suo documento su Firestore */
export function computePlayerStats(playerData = {}) {
  const level = playerData.livello || 1;
  const allocation = sanitizeAllocation(playerData.puntiAbilita);
  const spent = Object.values(allocation).reduce((sum, n) => sum + n, 0);
  const affinity = playerData.affinita || {};
  const timesDrawn = playerData.segniDisegnati || {};

  const atk = getSkillValue('atk', allocation.atk);
  const atkMultiplier = getAtkMultiplier(atk);

  const elementDmgBonus = {};
  const elementDef = {};
  const recognitionMargin = {};
  for (const element of ELEMENTS) {
    const curve = affinityCurve(affinity[element]);
    elementDmgBonus[element] = 0; // nessuna fonte per ora
    elementDef[element] = MAX_AFFINITY_DEF * curve;
    recognitionMargin[element] = BASE_RECOGNITION_MARGIN + MAX_AFFINITY_RECOGNITION_BONUS * curve;
  }
  for (const symbol of SYMBOLS) {
    recognitionMargin[symbol] = BASE_RECOGNITION_MARGIN + MAX_AFFINITY_RECOGNITION_BONUS * practiceCurve(timesDrawn[symbol]);
  }

  return {
    level,
    allocation,
    skillPointsSpent: spent,
    skillPointsAvailable: Math.max(0, getTotalSkillPoints(level) - spent),

    hp: getSkillValue('hp', allocation.hp),
    atk,
    mp: getSkillValue('mp', allocation.mp),
    riduzioneMana: getSkillValue('riduzioneMana', allocation.riduzioneMana),
    manaRegenPerFrame: MANA_REGEN_PER_FRAME,

    damage: {
      proiettile: BASE_DAMAGE.proiettile * atkMultiplier,
      spaziale: BASE_DAMAGE.spaziale * atkMultiplier,
      laser: BASE_DAMAGE.laser * atkMultiplier
    },
    elementDmgBonus,
    elementDef,
    critRate: 0, // non ancora implementati
    critDmg: 0,
    recognitionMargin
  };
}

// Soglia minima di somiglianza per riconoscere un simbolo (1 - margine di errore)
export function getRecognitionThreshold(stats, name) {
  const margin = stats?.recognitionMargin?.[name] ?? BASE_RECOGNITION_MARGIN;
  return 1 - margin;
}

// Danno ricevuto dopo la difesa elementale (null = mana puro, nessuna difesa)
export function applyElementDefense(damage, stats, element) {
  const def = (element && stats?.elementDef?.[element]) || 0;
  return damage * (1 - def);
}

// Dati inviati al server per la partita: vita massima, ATK e difese
export function getCombatStats(stats) {
  return { maxHp: stats.hp, atk: stats.atk, elementDef: { ...stats.elementDef } };
}
