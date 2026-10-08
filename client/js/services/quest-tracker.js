// quest-tracker.js - Avanzamento e riscatto delle missioni (quests-data.js).
// Gli eventi si accumulano in memoria e si salvano ogni FLUSH_MS (e a fine partita / quando la pagina si nasconde)
// con INCREMENTI ATOMICI: durante il combattimento il gioco aggiorna il profilo ogni secondo (affinità, esperienza...)
// e una transazione su quel documento verrebbe rifiutata quasi sempre. I progressi stanno sotto il periodo
// (missioni.giornaliere.<giorno>.progressi.<id>), così il rinnovo è automatico. Il riscatto resta una transazione.
import { doc, runTransaction, updateDoc, increment, FieldPath } from "firebase/firestore";
import { db } from "./firebase.js";
import { getCurrentUsername } from "./player-db.js";
import {
  QUEST_PERIODS, getActiveQuests, currentPeriodState, questProgressFor, periodIndex
} from "../game/quests-data.js";

const FLUSH_MS = 5000;

const pending = new Map(); // "tipo|elemento|variante" -> quantità non ancora salvata
let flushTimer = null;

// Progressi noti in locale (dal profilo caricato + eventi di questa pagina): servono per avvisare subito
// il giocatore, senza aspettare il salvataggio. null = profilo non ancora caricato, niente avvisi.
let local = null;          // { [period]: { index, progressi: { id: n } } }
const listeners = new Set();

/** Progressi già salvati, da cui partono gli avvisi (chiamata quando il gioco carica il profilo) */
export function setQuestBaseline(player) {
  local = {};
  for (const period of Object.keys(QUEST_PERIODS)) {
    const state = currentPeriodState(player, period);
    local[period] = { index: state.periodo, progressi: { ...state.progressi } };
  }
}

/**
 * Avvisa quando una missione attiva avanza: listener({ period, quest, before, after }).
 * @returns {() => void} per smettere di ascoltare
 */
export function onQuestProgress(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyProgress(event) {
  if (!local || listeners.size === 0) return;
  const username = getCurrentUsername();
  for (const period of Object.keys(QUEST_PERIODS)) {
    const index = periodIndex(period);
    if (local[period]?.index !== index) local[period] = { index, progressi: {} }; // periodo nuovo
    const progressi = local[period].progressi;
    for (const quest of getActiveQuests(period, username, index)) {
      const before = progressi[quest.id] || 0;
      if (before >= quest.target) continue;
      const gained = questProgressFor(quest, event);
      if (!gained) continue;
      const after = Math.min(quest.target, before + gained);
      progressi[quest.id] = after;
      for (const listener of listeners) listener({ period, quest, before, after });
    }
  }
}

/**
 * Registra un evento per le missioni (si salva più tardi).
 * @param {string} type es. 'projectile_cast'
 * @param {{ element?: string|null, variant?: string|null, amount?: number }} [details]
 */
export function trackQuest(type, { element = null, variant = null, amount = 1 } = {}) {
  if (!(amount > 0) || !getCurrentUsername()) return;
  notifyProgress({ type, element, variant, amount });
  const key = `${type}|${element || ''}|${variant || ''}`;
  pending.set(key, (pending.get(key) || 0) + amount);
  if (!flushTimer) flushTimer = setTimeout(() => flushQuests(), FLUSH_MS);
}

/** Salva subito gli eventi accumulati (solo per le missioni attive in questo periodo) */
export async function flushQuests() {
  clearTimeout(flushTimer);
  flushTimer = null;
  const username = getCurrentUsername();
  if (pending.size === 0 || !username) return;

  const events = [...pending].map(([key, amount]) => {
    const [type, element, variant] = key.split('|');
    return { type, element: element || null, variant: variant || null, amount };
  });
  pending.clear();

  // Un incremento per ogni missione attiva che questi eventi fanno avanzare (il tetto si applica in lettura)
  const updates = [];
  for (const period of Object.keys(QUEST_PERIODS)) {
    const index = periodIndex(period);
    for (const quest of getActiveQuests(period, username, index)) {
      const gained = events.reduce((sum, event) => sum + questProgressFor(quest, event), 0);
      if (gained > 0) updates.push(new FieldPath('missioni', period, String(index), 'progressi', quest.id), increment(gained));
    }
  }
  if (updates.length === 0) return;
  try {
    await updateDoc(doc(db, "players", username), ...updates);
  } catch (error) {
    // Non salvati: tornano in coda per il prossimo tentativo (senza avvisare di nuovo)
    for (const event of events) {
      const key = `${event.type}|${event.element || ''}|${event.variant || ''}`;
      pending.set(key, (pending.get(key) || 0) + event.amount);
    }
    if (!flushTimer) flushTimer = setTimeout(() => flushQuests(), FLUSH_MS);
    console.error('❌ Salvataggio delle missioni non riuscito:', error);
  }
}

/** Riscatta una missione completata (o il bonus, con questId null): aggiunge i BitRune */
export function claimQuest(username, period, questId) {
  const ref = doc(db, "players", username);
  return runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists()) throw new Error('Giocatore non trovato');
    const player = snap.data();
    const state = currentPeriodState(player, period);
    const active = getActiveQuests(period, username, state.periodo);
    let reward;
    if (questId == null) {
      if (state.bonus) throw new Error('Bonus già riscattato');
      if (!active.every(q => state.riscattate.includes(q.id))) throw new Error('Completa prima tutte le missioni');
      reward = QUEST_PERIODS[period].bonus;
      state.bonus = true;
    } else {
      const quest = active.find(q => q.id === questId);
      if (!quest) throw new Error('Missione scaduta');
      if (state.riscattate.includes(questId)) throw new Error('Missione già riscattata');
      if ((state.progressi[questId] || 0) < quest.target) throw new Error('Missione non ancora completata');
      reward = quest.reward;
      state.riscattate = [...state.riscattate, questId];
    }
    const bitrune = Math.max(0, Math.floor(Number(player.valute?.bitrune) || 0)) + reward;
    // Si riscrive solo il periodo corrente: i periodi passati spariscono
    const { progressi, riscattate, bonus } = state;
    transaction.update(ref, {
      [`missioni.${period}`]: { [String(state.periodo)]: { progressi, riscattate, bonus } },
      'valute.bitrune': bitrune
    });
    return { reward, bitrune };
  });
}

// Quando la pagina si nasconde o si chiude si salva quello che manca (un incremento parte subito)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) flushQuests();
});
window.addEventListener('pagehide', () => {
  flushQuests();
});
