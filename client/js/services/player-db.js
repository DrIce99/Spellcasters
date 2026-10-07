// player-db.js - Lettura/scrittura dei dati giocatore su Firestore
import { doc, setDoc, getDoc, updateDoc, increment, runTransaction, FieldPath } from "firebase/firestore";
import { db } from "./firebase.js";
import { SKILLS, computePlayerStats, isSkillMaxed } from "../game/player-stats.js";

export function getCurrentUsername() {
  return localStorage.getItem('currentPlayer');
}

// Struttura di default di un giocatore (usata in registrazione e come fallback)
export function createDefaultPlayer(username, password = '') {
  return {
    username,
    password,
    esperienza: 0,
    livello: 1,
    affinita: {},        // {fuoco: n, acqua: n, ...}
    proiezioniUsate: {}, // {proiettile: n, spaziale: n}
    segniDisegnati: {},  // {cerchio: n, proiettile: n, spaziale: n, laser: n}: volte che il segno è stato riconosciuto
    mana: SKILLS.mp.base,
    puntiAbilita: {},    // {hp: n, atk: n, mp: n, riduzioneMana: n}: i non spesi = (livello - 1) - somma
    vittorie: 0,
    partite: 0,
    magie: [],
    spellbook: {},       // {'1': {elemento, proiezioni: [...], savedAt}, ...}: cerchi salvati negli slot 1-9
    predisposizione: {}
  };
}

// Carica i dati del giocatore (null se non esiste)
export async function loadPlayerFromDB(username) {
  if (!username) return null;
  const docSnap = await getDoc(doc(db, "players", username));
  return docSnap.exists() ? docSnap.data() : null;
}

// Senza argomenti restituisce il giocatore attualmente loggato
export async function getPlayerData(username = getCurrentUsername()) {
  return loadPlayerFromDB(username);
}

// Aggiorna solo i campi passati. Usa merge: così due salvataggi in parallelo
// (es. esperienza e affinità) non si sovrascrivono più a vicenda.
export async function savePlayerData(username, data) {
  if (!username) return;
  const ref = doc(db, "players", username);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { ...createDefaultPlayer(username, data.password), ...data });
    return;
  }
  await setDoc(ref, data, { merge: true });
}

/**
 * Spende un punto abilità su una statistica. In transazione: il controllo dei punti
 * disponibili e l'incremento avvengono insieme, così un doppio clic non spende punti inesistenti.
 * @returns {Promise<object>} il documento del giocatore aggiornato
 */
export async function spendSkillPoint(username, skill) {
  if (!username || !SKILLS[skill]) throw new Error('Statistica non valida');
  const ref = doc(db, "players", username);
  return runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists()) throw new Error('Giocatore non trovato');
    const data = snap.data();
    const stats = computePlayerStats(data);
    if (stats.skillPointsAvailable <= 0) throw new Error('Nessun punto abilità disponibile');
    if (isSkillMaxed(skill, stats.allocation[skill])) throw new Error('Statistica già al massimo');

    const puntiAbilita = { ...stats.allocation, [skill]: stats.allocation[skill] + 1 };
    transaction.update(ref, { puntiAbilita });
    return { ...data, puntiAbilita };
  });
}

// Incrementa atomicamente dei contatori annidati, es:
// incrementPlayerCounters('mario', { affinita: { fuoco: 2 }, proiezioniUsate: { proiettile: 1 } })
export async function incrementPlayerCounters(username, groups) {
  if (!username) return;
  const updates = {};
  for (const [group, counters] of Object.entries(groups)) {
    for (const [key, value] of Object.entries(counters)) {
      if (value) updates[`${group}.${key}`] = increment(value);
    }
  }
  if (Object.keys(updates).length === 0) return;
  try {
    await updateDoc(doc(db, "players", username), updates);
  } catch (error) {
    // Il documento non esiste ancora: lo crea e riprova
    if (error.code === 'not-found') {
      await savePlayerData(username, {});
      await updateDoc(doc(db, "players", username), updates);
    } else {
      throw error;
    }
  }
}

/**
 * Salva un cerchio magico in uno slot dello spellbook (sovrascrive quello che c'era).
 * Aggiorna solo quello slot: gli altri restano come sono.
 */
export async function savePlayerSpell(username, slot, spell) {
  if (!username) return;
  const ref = doc(db, "players", username);
  const field = new FieldPath('spellbook', String(slot));
  try {
    await updateDoc(ref, field, spell);
  } catch (error) {
    // Il documento non esiste ancora: lo crea e riprova
    if (error.code === 'not-found') {
      await savePlayerData(username, {});
      await updateDoc(ref, field, spell);
    } else {
      throw error;
    }
  }
}
