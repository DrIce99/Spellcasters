// player-db.js - Lettura/scrittura dei dati giocatore su Firestore
import { doc, setDoc, getDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "./firebase.js";

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
    mana: 10,
    manaMax: 10,
    vittorie: 0,
    partite: 0,
    magie: [],
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
