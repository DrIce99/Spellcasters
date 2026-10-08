// linker-db.js - Operazioni sui Linker e sulle valute, sempre in transazione: il controllo del saldo e la
// modifica avvengono insieme, così un doppio clic non spende valuta che non c'è e non duplica Linker.
import { doc, runTransaction, updateDoc, increment } from "firebase/firestore";
import { db } from "./firebase.js";
import { savePlayerData } from "./player-db.js";
import { trackQuest, flushQuests } from "./quest-tracker.js";
import {
  PACKS, LINKER_SLOTS, pullPack, catalystYield, catalystToLevel, addLinkerExp, LINKER_MAX_LEVEL, getInventory
} from "../game/linker-data.js";

function playerRef(username) {
  if (!username) throw new Error('Nessun giocatore connesso');
  return doc(db, "players", username);
}

const balance = (data, key) => Math.max(0, Math.floor(Number(data?.valute?.[key]) || 0));

// Missioni dei Linker: contano ovunque e si salvano subito dopo l'operazione riuscita
function questAfter(promise, type, amountOf) {
  return promise.then((result) => {
    trackQuest(type, { amount: amountOf(result) });
    flushQuests();
    return result;
  });
}

async function withPlayer(username, change) {
  const ref = playerRef(username);
  return runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists()) throw new Error('Giocatore non trovato');
    return change(snap.data(), (fields) => transaction.update(ref, fields));
  });
}

/**
 * Pull da un pacchetto dello shop (count = 1 o 10).
 * @returns {Promise<{ linkers: object[], player: object }>}
 */
export function pullLinkers(username, packKey, count) {
  const pack = PACKS[packKey];
  if (!pack || count < 1) return Promise.reject(new Error('Pacchetto non valido'));
  return questAfter(withPlayer(username, (data, update) => {
    const cost = pack.cost * count;
    const bitrune = balance(data, 'bitrune');
    if (bitrune < cost) throw new Error('BitRune insufficienti');
    const { linkers, pity } = pullPack(packKey, count, data.gacha?.pity);
    const inventario = [...getInventory(data), ...linkers];
    update({ 'valute.bitrune': bitrune - cost, 'linker.inventario': inventario, 'gacha.pity': pity });
    return { linkers, player: { ...data, valute: { ...data.valute, bitrune: bitrune - cost }, linker: { ...data.linker, inventario }, gacha: { ...data.gacha, pity } } };
  }), 'linker_pull', () => count);
}

/** Catalizza (distrugge) un Linker: restituisce il Catalizzante ottenuto. Se era equipaggiato, lo slot si svuota. */
export function catalyzeLinker(username, linkerId) {
  return questAfter(withPlayer(username, (data, update) => {
    const inventory = getInventory(data);
    const linker = inventory.find(l => l.id === linkerId);
    if (!linker) throw new Error('Linker non trovato');
    const gained = catalystYield(linker);
    const catalizzante = balance(data, 'catalizzante') + gained;
    const fields = {
      'linker.inventario': inventory.filter(l => l.id !== linkerId),
      'valute.catalizzante': catalizzante
    };
    if (data.linker?.equip?.[linker.slot] === linkerId) fields[`linker.equip.${linker.slot}`] = null;
    update(fields);
    return { gained, catalizzante };
  }), 'linker_catalyze', () => 1);
}

/**
 * Spende Catalizzante per portare il Linker al livello indicato.
 * @returns {Promise<{ linker: object, upgraded: string[], spent: number }>} upgraded = sub stat potenziate
 */
export function levelUpLinker(username, linkerId, targetLevel) {
  return questAfter(withPlayer(username, (data, update) => {
    const inventory = getInventory(data);
    const index = inventory.findIndex(l => l.id === linkerId);
    if (index === -1) throw new Error('Linker non trovato');
    const current = inventory[index];
    if ((current.livello || 0) >= LINKER_MAX_LEVEL) throw new Error('Livello massimo già raggiunto');
    const spent = catalystToLevel(current, targetLevel);
    const owned = balance(data, 'catalizzante');
    if (spent <= 0) throw new Error('Livello non valido');
    if (owned < spent) throw new Error('Catalizzante insufficiente');
    const { linker, upgraded } = addLinkerExp(current, spent);
    const inventario = inventory.map((l, i) => (i === index ? linker : l));
    update({ 'linker.inventario': inventario, 'valute.catalizzante': owned - spent });
    return { linker, upgraded, spent, levels: (linker.livello || 0) - (current.livello || 0) };
  }), 'linker_level', (result) => result.levels);
}

/** Equipaggia un Linker nel suo slot (linkerId null = svuota lo slot) */
export function equipLinker(username, slotKey, linkerId) {
  if (!LINKER_SLOTS.some(s => s.key === slotKey)) return Promise.reject(new Error('Slot non valido'));
  return withPlayer(username, (data, update) => {
    if (linkerId != null) {
      const linker = getInventory(data).find(l => l.id === linkerId);
      if (!linker || linker.slot !== slotKey) throw new Error('Linker non valido per questo slot');
    }
    update({ [`linker.equip.${slotKey}`]: linkerId });
  });
}

/** Ricompensa di fine partita (incremento atomico: non serve leggere il saldo) */
export async function addBitRune(username, amount) {
  if (!username || !(amount > 0)) return;
  try {
    await updateDoc(playerRef(username), { 'valute.bitrune': increment(amount) });
  } catch (error) {
    if (error.code !== 'not-found') throw error;
    await savePlayerData(username, { valute: { bitrune: amount, catalizzante: 0 } });
  }
}
