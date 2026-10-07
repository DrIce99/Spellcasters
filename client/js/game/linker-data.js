// linker-data.js - Regole dei Linker (artefatti): slot, rarità, statistiche, set, livelli, valute e pacchetti.
// Solo dati e calcoli, niente interfaccia né database: lo usano il gioco (player-stats.js), lo shop e la pagina info.
// Tutti i numeri di bilanciamento sono qui.
import { ELEMENTS } from './elements.js';

// Ordine = posizione attorno al cerchio, in senso orario partendo dall'alto
export const LINKER_SLOTS = [
  { key: 'core', label: 'Core' },
  { key: 'matrix', label: 'Matrix' },
  { key: 'relay', label: 'Relay' },
  { key: 'conduit', label: 'Conduit' },
  { key: 'apex', label: 'Apex' }
];

// --- Valute ---
export const CURRENCIES = {
  bitrune: { name: 'BitRune', symbol: '◈' },            // si guadagna vincendo, si spende nello shop
  catalizzante: { name: 'Catalizzante', symbol: '⬢' }    // si ottiene catalizzando Linker, serve per livellarli
};
export const WIN_REWARD = 60; // BitRune per ogni vittoria PvP

// --- Rarità (indice = stelle). Le sub stat sono tante quante le stelle, al massimo 4 ---
export const RARITIES = [
  null,
  { key: 'comune', name: 'Comune', color: '#9aa3b5', rate: 0.45, catalyst: 60 },
  { key: 'nonComune', name: 'Non comune', color: '#3fbf7f', rate: 0.30, catalyst: 120 },
  { key: 'raro', name: 'Raro', color: '#4a9eff', rate: 0.16, catalyst: 240 },
  { key: 'epico', name: 'Epico', color: '#a86bff', rate: 0.07, catalyst: 480 },
  { key: 'leggendario', name: 'Leggendario', color: '#f0a020', rate: 0.02, catalyst: 960 }
];
export const MAX_RARITY = 5;
export const MAX_SUB_STATS = 4;
export const LEGENDARY_MAIN_BONUS = 1.15; // la main stat dei leggendari è un po' più forte

export function subStatCount(rarity) {
  return Math.min(rarity, MAX_SUB_STATS);
}

// --- Statistiche ---
// main: [valore a +0, aumento per livello]; sub: valore fisso di una sub stat (e di ogni suo potenziamento).
// I valori non dipendono dalla rarità (tranne il bonus della main stat dei leggendari).
const PCT = true;
export const LINKER_STATS = {
  hp: { label: 'HP', main: [10, 2], sub: 5 },
  hpPct: { label: 'HP%', percent: PCT, main: [0.03, 0.006], sub: 0.02 },
  atk: { label: 'ATK', main: [1, 0.15], sub: 0.5 },
  atkPct: { label: 'ATK%', percent: PCT, main: [0.03, 0.006], sub: 0.02 },
  mp: { label: 'Mana', main: [2, 0.4], sub: 1 },
  mpPct: { label: 'Mana%', percent: PCT, main: [0.03, 0.006], sub: 0.02 },
  regenPct: { label: 'Rigenerazione mana%', percent: PCT, main: [0.05, 0.01], sub: 0.03 },
  critRate: { label: 'Tasso CRIT', percent: PCT, main: [0.02, 0.004], sub: 0.015 },
  critDmg: { label: 'DMG CRIT', percent: PCT, main: [0.04, 0.008], sub: 0.03 },
  ...Object.fromEntries(ELEMENTS.map(e => [
    `dmg_${e}`,
    { label: `Bonus DMG ${e.charAt(0).toUpperCase()}${e.slice(1)}`, percent: PCT, main: [0.03, 0.006], element: e }
  ]))
};
const ELEMENTAL_DMG = ELEMENTS.map(e => `dmg_${e}`);

export const SUB_STAT_POOL = ['hp', 'hpPct', 'atk', 'atkPct', 'mp', 'mpPct', 'regenPct', 'critRate', 'critDmg'];

// Main stat possibili per slot: ogni voce ha la stessa probabilità, e un gruppo (es. il bonus elementale)
// conta come una voce sola, con l'elemento scelto a caso
export const MAIN_STATS_BY_SLOT = {
  core: [['hp']],
  matrix: [['atk']],
  relay: [['mpPct'], ['regenPct'], ['mp']],
  conduit: [ELEMENTAL_DMG],
  apex: [['critRate'], ['critDmg'], ['atkPct'], ['hpPct'], ELEMENTAL_DMG]
};

export function mainStatValue(linker) {
  const [base, perLevel] = LINKER_STATS[linker.principale]?.main || [0, 0];
  const bonus = linker.rarita === MAX_RARITY ? LEGENDARY_MAIN_BONUS : 1;
  return (base + perLevel * (linker.livello || 0)) * bonus;
}

export function subStatValue(sub) {
  return (LINKER_STATS[sub.stat]?.sub || 0) * (1 + (sub.upgrades || 0));
}

export function formatStatValue(statKey, value) {
  if (LINKER_STATS[statKey]?.percent) return `+${(value * 100).toFixed(1)}%`;
  return `+${Number.isInteger(value) ? value : value.toFixed(1)}`;
}

// --- Set: bonus a 2 e a 4 pezzi equipaggiati (le chiavi sono quelle di LINKER_STATS più quelle sotto) ---
// Chiavi extra: elementalAll (bonus DMG a tutti gli elementi), elementDefAll (DEF da tutti gli elementi),
// manaReduction (riduzione del consumo di mana).
export const LINKER_SETS = {
  firewall: {
    name: 'Firewall Arcano', color: '#3fbf9f',
    bonus2: { hpPct: 0.15 }, text2: 'HP +15%',
    bonus4: { elementDefAll: 0.10 }, text4: 'DEF da tutti gli elementi +10%'
  },
  overclock: {
    name: 'Overclock Runico', color: '#ff7a45',
    bonus2: { atkPct: 0.12 }, text2: 'ATK +12%',
    bonus4: { critRate: 0.10 }, text4: 'Tasso CRIT +10%'
  },
  manabus: {
    name: 'Bus di Mana', color: '#4a9eff',
    bonus2: { regenPct: 0.20 }, text2: 'Rigenerazione mana +20%',
    bonus4: { manaReduction: 0.10 }, text4: 'Consumo di mana -10%'
  },
  kernel: {
    name: 'Kernel Elementale', color: '#c56bff',
    bonus2: { elementalAll: 0.10 }, text2: 'Bonus DMG di tutti gli elementi +10%',
    bonus4: { critDmg: 0.25 }, text4: 'DMG CRIT +25%'
  }
};

// --- Livelli ---
export const LINKER_MAX_LEVEL = 20;
export const SUB_UPGRADE_EVERY = 4;                 // ogni 4 livelli si potenzia una sub stat a caso
export const CATALYST_REFUND = 0.8;                 // catalizzando si recupera l'80% dell'esperienza investita

/** Esperienza (= Catalizzante) per passare dal livello indicato al successivo */
export function expToNextLevel(level) {
  return 60 + 15 * level;
}

export function totalExpInvested(linker) {
  let total = linker.exp || 0;
  for (let l = 0; l < (linker.livello || 0); l++) total += expToNextLevel(l);
  return total;
}

/** Catalizzante necessario per portare il Linker al livello indicato */
export function catalystToLevel(linker, targetLevel) {
  const target = Math.min(LINKER_MAX_LEVEL, targetLevel);
  let need = -(linker.exp || 0);
  for (let l = linker.livello || 0; l < target; l++) need += expToNextLevel(l);
  return Math.max(0, need);
}

export function catalystYield(linker) {
  return (RARITIES[linker.rarita]?.catalyst || 0) + Math.floor(totalExpInvested(linker) * CATALYST_REFUND);
}

/**
 * Aggiunge esperienza (senza modificare l'originale). Ogni 4 livelli una sub stat a caso sale di un potenziamento.
 * @returns {{ linker: object, upgraded: string[] }} upgraded = sub stat potenziate, in ordine
 */
export function addLinkerExp(linker, amount, random = Math.random) {
  const next = { ...linker, secondarie: (linker.secondarie || []).map(s => ({ ...s })) };
  const upgraded = [];
  next.exp = (next.exp || 0) + amount;
  next.livello = next.livello || 0;
  while (next.livello < LINKER_MAX_LEVEL && next.exp >= expToNextLevel(next.livello)) {
    next.exp -= expToNextLevel(next.livello);
    next.livello++;
    if (next.livello % SUB_UPGRADE_EVERY === 0 && next.secondarie.length > 0) {
      const sub = next.secondarie[Math.floor(random() * next.secondarie.length)];
      sub.upgrades = (sub.upgrades || 0) + 1;
      upgraded.push(sub.stat);
    }
  }
  if (next.livello >= LINKER_MAX_LEVEL) next.exp = 0;
  return { linker: next, upgraded };
}

// --- Pacchetti dello shop (gacha) ---
export const PACKS = {
  standard: { name: 'Pacchetto Standard', set: null, cost: 80, text: 'Un Linker di un set qualsiasi' },
  ...Object.fromEntries(Object.entries(LINKER_SETS).map(([key, set]) => [
    key, { name: `Pacchetto ${set.name}`, set: key, cost: 100, text: `Solo Linker del set ${set.name}` }
  ]))
};
export const MULTI_PULL = 10;
export const EPIC_PITY = 10;       // almeno un Epico (o meglio) ogni 10 pull
export const LEGENDARY_PITY = 60;  // un Leggendario garantito entro 60 pull

function pick(list, random) {
  return list[Math.floor(random() * list.length)];
}

/** Rarità di una pull, tenendo conto della garanzia. pity = { sinceEpic, sinceLegendary } (pull senza) */
export function rollRarity(pity, random = Math.random) {
  if (pity.sinceLegendary + 1 >= LEGENDARY_PITY) return 5;
  if (pity.sinceEpic + 1 >= EPIC_PITY) {
    // Garantito almeno Epico: tra Epico e Leggendario con le loro probabilità relative
    return random() < RARITIES[5].rate / (RARITIES[4].rate + RARITIES[5].rate) ? 5 : 4;
  }
  let roll = random();
  for (let r = MAX_RARITY; r >= 1; r--) {
    roll -= RARITIES[r].rate;
    if (roll < 0) return r;
  }
  return 1;
}

export function nextPity(pity, rarity) {
  return {
    sinceEpic: rarity >= 4 ? 0 : pity.sinceEpic + 1,
    sinceLegendary: rarity === 5 ? 0 : pity.sinceLegendary + 1
  };
}

export function newLinkerId(random = Math.random) {
  return `lk_${Date.now().toString(36)}${Math.floor(random() * 1e8).toString(36)}`;
}

/** Nuovo Linker a livello 0: slot a caso, main stat in base allo slot, sub stat diverse tra loro e dalla main */
export function generateLinker({ set, rarity, random = Math.random }) {
  const slot = pick(LINKER_SLOTS, random).key;
  const principale = pick(pick(MAIN_STATS_BY_SLOT[slot], random), random);
  const pool = SUB_STAT_POOL.filter(stat => stat !== principale);
  const secondarie = [];
  for (let i = 0; i < subStatCount(rarity) && pool.length; i++) {
    const [stat] = pool.splice(Math.floor(random() * pool.length), 1);
    secondarie.push({ stat, upgrades: 0 });
  }
  return { id: newLinkerId(random), set, slot, rarita: rarity, livello: 0, exp: 0, principale, secondarie, ottenuto: Date.now() };
}

/** Esegue n pull di un pacchetto. Restituisce i Linker ottenuti e la nuova garanzia. */
export function pullPack(packKey, count, pity, random = Math.random) {
  const pack = PACKS[packKey];
  const setKeys = Object.keys(LINKER_SETS);
  const linkers = [];
  let current = { sinceEpic: pity?.sinceEpic || 0, sinceLegendary: pity?.sinceLegendary || 0 };
  for (let i = 0; i < count; i++) {
    const rarity = rollRarity(current, random);
    current = nextPity(current, rarity);
    linkers.push(generateLinker({ set: pack.set || pick(setKeys, random), rarity, random }));
  }
  return { linkers, pity: current };
}

// --- Bonus dei Linker equipaggiati (usati da computePlayerStats) ---

export function getInventory(player) {
  return Array.isArray(player?.linker?.inventario) ? player.linker.inventario : [];
}

export function getEquippedLinkers(player) {
  const inventory = getInventory(player);
  const equip = player?.linker?.equip || {};
  return LINKER_SLOTS
    .map(({ key }) => inventory.find(l => l && l.id === equip[key] && l.slot === key))
    .filter(Boolean);
}

/** Quanti Linker equipaggiati per ogni set: { firewall: 2, ... } */
export function countEquippedSets(player) {
  const counts = {};
  for (const linker of getEquippedLinkers(player)) counts[linker.set] = (counts[linker.set] || 0) + 1;
  return counts;
}

/**
 * Somma di main stat, sub stat e bonus dei set attivi dei Linker equipaggiati.
 * @returns {{ totals: Record<string, number>, sets: { key: string, count: number, two: boolean, four: boolean }[] }}
 */
export function getLinkerBonuses(player) {
  const totals = {};
  const add = (key, value) => { totals[key] = (totals[key] || 0) + value; };
  for (const linker of getEquippedLinkers(player)) {
    add(linker.principale, mainStatValue(linker));
    for (const sub of linker.secondarie || []) add(sub.stat, subStatValue(sub));
  }
  const sets = [];
  for (const [key, count] of Object.entries(countEquippedSets(player))) {
    const set = LINKER_SETS[key];
    if (!set) continue;
    if (count >= 2) for (const [stat, value] of Object.entries(set.bonus2)) add(stat, value);
    if (count >= 4) for (const [stat, value] of Object.entries(set.bonus4)) add(stat, value);
    sets.push({ key, count, two: count >= 2, four: count >= 4 });
  }
  return { totals, sets };
}
