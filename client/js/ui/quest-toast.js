// quest-toast.js - Avviso minimale in partita quando una missione avanza (in basso a sinistra, non blocca il mouse).
// Una sola etichetta per missione: se avanza di nuovo mentre è visibile si aggiorna il numero invece di accumularsi.
// Le missioni con obiettivi grandi (es. 2000 mana) si aggiornano a scatti, non a ogni tick.
import { onQuestProgress } from '../services/quest-tracker.js';

const VISIBLE_MS = 2600;
const COMPLETED_MS = 4500;
const STEPS = 20; // un avviso ogni ~5% dell'obiettivo

let container = null;
const toasts = new Map(); // id missione -> { el, timer }

function ensureContainer() {
  if (container) return container;
  container = document.createElement('div');
  container.className = 'quest-toasts';
  container.setAttribute('aria-live', 'polite');
  document.body.appendChild(container);
  return container;
}

function show({ quest, before, after }) {
  const step = Math.max(1, Math.ceil(quest.target / STEPS));
  const completed = after >= quest.target;
  // Solo quando si supera uno scatto (o si completa): niente avvisi a ogni frazione di mana
  if (!completed && Math.floor(after / step) === Math.floor(before / step)) return;

  let toast = toasts.get(quest.id);
  if (!toast) {
    const el = document.createElement('div');
    el.className = 'quest-toast';
    const title = document.createElement('span');
    title.className = 'quest-toast-title';
    const count = document.createElement('span');
    count.className = 'quest-toast-count';
    el.append(title, count);
    ensureContainer().appendChild(el);
    toast = { el, title, count, timer: null };
    toasts.set(quest.id, toast);
  }
  toast.el.classList.toggle('completed', completed);
  toast.title.textContent = completed ? `✓ ${quest.text}` : quest.text;
  toast.count.textContent = completed ? `◈ ${quest.reward} da riscattare` : `${Math.floor(after)}/${quest.target}`;
  // Piccolo impulso a ogni aggiornamento
  toast.el.classList.remove('bump');
  void toast.el.offsetWidth;
  toast.el.classList.add('bump');

  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => {
    toast.el.classList.add('leaving');
    setTimeout(() => {
      toast.el.remove();
      if (toasts.get(quest.id) === toast) toasts.delete(quest.id);
    }, 300);
  }, completed ? COMPLETED_MS : VISIBLE_MS);
  toast.el.classList.remove('leaving');
}

/** Attiva gli avvisi delle missioni in questa pagina */
export function enableQuestToasts() {
  return onQuestProgress(show);
}
