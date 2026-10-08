// quests-data.js - Missioni giornaliere e settimanali (ricompensa: BitRune). Solo dati e calcoli.
// Ogni giorno si assegnano DAILY_COUNT giornaliere e ogni settimana WEEKLY_COUNT settimanali, scelte in modo
// deterministico (giocatore + periodo): niente server, e una missione torna solo dopo che sono passate tutte
// le altre (~10 giorni per le giornaliere, ~4 settimane per le settimanali).
//
// Eventi (vedi quest-tracker.js): match_played, match_won, projectile_hit (solo PvP) · projectile_cast,
// laser_cast, area_cast, circle_summoned, element_engraved, spellbook_summon, interaction, mana_spent
// (PvP e Training) · linker_pull, linker_level, linker_catalyze (ovunque).
// Una missione con `element` / `variant` conta solo gli eventi con quel dettaglio.

export const DAILY_COUNT = 3;
export const WEEKLY_COUNT = 5;
export const DAILY_BONUS = 30;   // BitRune extra completando (e riscattando) tutte le giornaliere
export const WEEKLY_BONUS = 150; // e tutte le settimanali

const ELEMENT_NAMES = { fuoco: 'Fuoco', acqua: 'Acqua', aria: 'Aria', terra: 'Terra', fulmine: 'Fulmine' };
const perElement = (make) => Object.entries(ELEMENT_NAMES).map(([element, name]) => make(element, name));

export const DAILY_QUESTS = [
  { id: 'd_play2', event: 'match_played', target: 2, reward: 25, text: 'Gioca 2 partite PvP' },
  { id: 'd_play3', event: 'match_played', target: 3, reward: 35, text: 'Gioca 3 partite PvP' },
  { id: 'd_win1', event: 'match_won', target: 1, reward: 30, text: 'Vinci una partita PvP' },
  { id: 'd_win2', event: 'match_won', target: 2, reward: 40, text: 'Vinci 2 partite PvP' },
  { id: 'd_hit10', event: 'projectile_hit', target: 10, reward: 25, text: "Colpisci l'avversario con 10 proiettili" },
  { id: 'd_hit20', event: 'projectile_hit', target: 20, reward: 35, text: "Colpisci l'avversario con 20 proiettili" },
  { id: 'd_proj30', event: 'projectile_cast', target: 30, reward: 20, text: 'Lancia 30 proiettili' },
  { id: 'd_proj60', event: 'projectile_cast', target: 60, reward: 30, text: 'Lancia 60 proiettili' },
  ...perElement((element, name) => ({
    id: `d_proj_${element}`, event: 'projectile_cast', element, target: 15, reward: 25, text: `Lancia 15 proiettili di ${name}`
  })),
  { id: 'd_laser3', event: 'laser_cast', target: 3, reward: 20, text: 'Attiva 3 laser' },
  { id: 'd_laser6', event: 'laser_cast', target: 6, reward: 30, text: 'Attiva 6 laser' },
  { id: 'd_area3', event: 'area_cast', target: 3, reward: 20, text: 'Evoca 3 aree spaziali' },
  { id: 'd_area6', event: 'area_cast', target: 6, reward: 30, text: 'Evoca 6 aree spaziali' },
  { id: 'd_circle15', event: 'circle_summoned', target: 15, reward: 15, text: 'Evoca 15 cerchi magici' },
  { id: 'd_engrave10', event: 'element_engraved', target: 10, reward: 20, text: 'Incidi 10 elementi nei cerchi magici' },
  { id: 'd_spellbook3', event: 'spellbook_summon', target: 3, reward: 20, text: 'Evoca 3 cerchi dallo spellbook' },
  { id: 'd_magma', event: 'interaction', variant: 'magma', target: 1, reward: 25, text: 'Crea del magma (fuoco + terra)' },
  { id: 'd_lush', event: 'interaction', variant: 'lush', target: 1, reward: 25, text: 'Rendi rigogliosa una magia (acqua + terra)' },
  { id: 'd_charged', event: 'interaction', variant: 'charged', target: 1, reward: 25, text: "Elettrifica l'acqua con il fulmine" },
  { id: 'd_interact3', event: 'interaction', target: 3, reward: 30, text: 'Provoca 3 interazioni tra magie' },
  { id: 'd_mana150', event: 'mana_spent', target: 150, reward: 20, text: 'Spendi 150 mana' },
  { id: 'd_mana300', event: 'mana_spent', target: 300, reward: 30, text: 'Spendi 300 mana' },
  { id: 'd_pull1', event: 'linker_pull', target: 1, reward: 15, text: 'Fai una pull nello shop' },
  { id: 'd_level2', event: 'linker_level', target: 2, reward: 20, text: 'Fai salire i Linker di 2 livelli' },
  { id: 'd_catalyze1', event: 'linker_catalyze', target: 1, reward: 15, text: 'Catalizza un Linker' }
];

export const WEEKLY_QUESTS = [
  { id: 'w_play10', event: 'match_played', target: 10, reward: 160, text: 'Gioca 10 partite PvP' },
  { id: 'w_play20', event: 'match_played', target: 20, reward: 260, text: 'Gioca 20 partite PvP' },
  { id: 'w_win5', event: 'match_won', target: 5, reward: 200, text: 'Vinci 5 partite PvP' },
  { id: 'w_win10', event: 'match_won', target: 10, reward: 300, text: 'Vinci 10 partite PvP' },
  { id: 'w_hit100', event: 'projectile_hit', target: 100, reward: 180, text: "Colpisci l'avversario con 100 proiettili" },
  { id: 'w_proj250', event: 'projectile_cast', target: 250, reward: 150, text: 'Lancia 250 proiettili' },
  ...perElement((element, name) => ({
    id: `w_proj_${element}`, event: 'projectile_cast', element, target: 80, reward: 160, text: `Lancia 80 proiettili di ${name}`
  })),
  { id: 'w_laser25', event: 'laser_cast', target: 25, reward: 150, text: 'Attiva 25 laser' },
  { id: 'w_area25', event: 'area_cast', target: 25, reward: 150, text: 'Evoca 25 aree spaziali' },
  { id: 'w_circle80', event: 'circle_summoned', target: 80, reward: 120, text: 'Evoca 80 cerchi magici' },
  { id: 'w_spellbook20', event: 'spellbook_summon', target: 20, reward: 140, text: 'Evoca 20 cerchi dallo spellbook' },
  { id: 'w_magma5', event: 'interaction', variant: 'magma', target: 5, reward: 170, text: 'Crea del magma 5 volte' },
  { id: 'w_lush5', event: 'interaction', variant: 'lush', target: 5, reward: 170, text: 'Rendi rigogliose 5 magie' },
  { id: 'w_charged5', event: 'interaction', variant: 'charged', target: 5, reward: 170, text: "Elettrifica l'acqua 5 volte" },
  { id: 'w_mana2000', event: 'mana_spent', target: 2000, reward: 160, text: 'Spendi 2000 mana' },
  { id: 'w_pull10', event: 'linker_pull', target: 10, reward: 140, text: 'Fai 10 pull nello shop' },
  { id: 'w_level12', event: 'linker_level', target: 12, reward: 160, text: 'Fai salire i Linker di 12 livelli' },
  { id: 'w_catalyze5', event: 'linker_catalyze', target: 5, reward: 120, text: 'Catalizza 5 Linker' }
];

export const QUEST_PERIODS = {
  giornaliere: { label: 'Giornaliere', quests: DAILY_QUESTS, count: DAILY_COUNT, bonus: DAILY_BONUS },
  settimanali: { label: 'Settimanali', quests: WEEKLY_QUESTS, count: WEEKLY_COUNT, bonus: WEEKLY_BONUS }
};

// --- Periodi (ora locale): un giorno da mezzanotte a mezzanotte, una settimana da lunedì a lunedì ---

const DAY_MS = 86400000;
function localDayIndex(date) {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS);
}
// Il giorno 0 (1/1/1970) era un giovedì: +3 fa iniziare le settimane di lunedì
const weekIndexOf = (dayIndex) => Math.floor((dayIndex + 3) / 7);

/** Indice del periodo corrente (giorni o settimane dal 1970) */
export function periodIndex(period, date = new Date()) {
  const day = localDayIndex(date);
  return period === 'settimanali' ? weekIndexOf(day) : day;
}

/** Millisecondi al prossimo rinnovo */
export function msUntilReset(period, date = new Date()) {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1); // mezzanotte prossima
  if (period === 'settimanali') {
    const daysToMonday = (8 - next.getDay()) % 7; // getDay: 0 = domenica
    next.setDate(next.getDate() + daysToMonday);
  }
  return next - date;
}

// --- Estrazione deterministica ---

function hashString(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Missioni assegnate al giocatore nel periodo indicato (stesso risultato su qualsiasi dispositivo) */
export function getActiveQuests(period, username, index = periodIndex(period)) {
  const { quests, count } = QUEST_PERIODS[period];
  // Ogni giocatore ha un suo ordine (mescolato in base al nome) che si percorre a rotazione, `count` alla volta:
  // una missione torna solo dopo aver visto tutte le altre. Il numero di missioni non è multiplo di `count`,
  // così a ogni giro i gruppi del giorno/della settimana cambiano.
  const order = [...quests];
  const random = seededRandom(hashString(`${username}|${period}`));
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const start = (index * count) % order.length;
  return Array.from({ length: Math.min(count, order.length) }, (_, i) => order[(start + i) % order.length]);
}

/** Quanto un evento fa avanzare una missione */
export function questProgressFor(quest, event) {
  if (quest.event !== event.type) return 0;
  if (quest.element && quest.element !== event.element) return 0;
  if (quest.variant && quest.variant !== event.variant) return 0;
  return event.amount;
}

/**
 * Stato del periodo corrente. Su Firestore i progressi stanno sotto il numero del periodo
 * (missioni.giornaliere.<giorno>): un periodo nuovo parte vuoto da solo.
 * I progressi possono superare l'obiettivo (sono incrementi): chi li mostra li limita al target.
 */
export function currentPeriodState(player, period, index = periodIndex(period)) {
  const saved = player?.missioni?.[period]?.[String(index)];
  return {
    periodo: index,
    progressi: saved?.progressi || {},
    riscattate: Array.isArray(saved?.riscattate) ? saved.riscattate : [],
    bonus: !!saved?.bonus
  };
}

/** Missioni da riscattare (completate e non ancora riscattate), compreso il bonus finale */
export function countClaimable(player, username) {
  let count = 0;
  for (const period of Object.keys(QUEST_PERIODS)) {
    const state = currentPeriodState(player, period);
    const active = getActiveQuests(period, username);
    const done = active.filter(q => (state.progressi[q.id] || 0) >= q.target);
    count += done.filter(q => !state.riscattate.includes(q.id)).length;
    if (!state.bonus && active.every(q => state.riscattate.includes(q.id))) count++;
  }
  return count;
}
