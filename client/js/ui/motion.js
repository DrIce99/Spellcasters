// motion.js - Transizioni tra le pagine e micro-animazioni dell'interfaccia, con i loro suoni.
// Le animazioni sono in public/css/style-motion.css; qui ci sono solo gli "inneschi".
import { playSfx } from './sfx.js';

const root = document.documentElement;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const PAGE_EXIT_MS = 420;

// --- Cambio pagina ---
// All'arrivo il velo si apre da solo (solo CSS); in uscita si richiude e poi si cambia pagina.
let leaving = false;
export function navigateTo(url) {
  if (leaving) return;
  leaving = true;
  playSfx('pageOut');
  if (reducedMotion.matches) {
    window.location.href = url;
    return;
  }
  root.classList.add('is-leaving');
  setTimeout(() => { window.location.href = url; }, PAGE_EXIT_MS);
}

// Tornando indietro il browser può riprendere la pagina dalla cache così com'era: col velo chiuso
window.addEventListener('pageshow', (e) => {
  if (!e.persisted) return;
  root.classList.remove('is-leaving');
  leaving = false;
});

// --- Utilità ---

/** Chiama done alla fine dell'animazione di el (con un ripiego se l'evento non arriva) */
export function afterAnimation(el, done, fallbackMs = 800) {
  let finished = false;
  const finish = (e) => {
    // Ignora le animazioni dei figli e dei ::before/::after (arrivano con lo stesso evento)
    if (finished || (e && (e.target !== el || e.pseudoElement))) return;
    finished = true;
    el.removeEventListener('animationend', finish);
    done();
  };
  el.addEventListener('animationend', finish);
  setTimeout(finish, fallbackMs);
}

/** Riavvia un'animazione legata a una classe (es. 'bump', 'shake') */
export function replayClass(el, className) {
  if (!el) return;
  el.classList.remove(className);
  void el.offsetWidth; // reflow: senza, il browser non riparte da capo
  el.classList.add(className);
  afterAnimation(el, () => el.classList.remove(className), 1200);
}

/** Aggiorna un numero e lo fa "saltare" se è cambiato */
export function setCounter(el, value) {
  if (!el) return;
  const text = String(value);
  if (el.textContent === text) return;
  el.textContent = text;
  replayClass(el, 'bump');
}

// --- Pannelli e overlay ---

export function openModal(modal) {
  modal.classList.remove('hidden', 'is-closing');
  playSfx('modalOpen');
}

export function closeModal(modal) {
  if (modal.classList.contains('hidden') || modal.classList.contains('is-closing')) return;
  playSfx('modalClose');
  modal.classList.add('is-closing');
  afterAnimation(modal, () => {
    modal.classList.remove('is-closing');
    modal.classList.add('hidden');
  }, 400);
}

/** Dissolve un elemento e poi lo nasconde con la classe 'hidden' */
export function fadeOutAndHide(el, fallbackMs = 700) {
  if (!el || el.classList.contains('hidden')) return;
  el.classList.add('is-leaving');
  afterAnimation(el, () => {
    el.classList.remove('is-leaving');
    el.classList.add('hidden');
  }, fallbackMs);
}

/**
 * Sostituisce un pannello con un altro (es. login ↔ registrazione).
 * 'panel-in' resta finché il pannello è visibile: togliendola ripartirebbe la sua animazione d'ingresso.
 */
export function swapPanels(from, to) {
  if (from.classList.contains('panel-out')) return;
  playSfx('slide', { direction: 1 });
  from.classList.remove('panel-in');
  from.classList.add('panel-out');
  afterAnimation(from, () => {
    from.classList.remove('panel-out');
    from.style.display = 'none';
    to.style.display = '';
    to.classList.add('panel-in');
  }, 400);
}

/** Scuote un elemento (errore). Web Animations: non disturba le animazioni CSS già assegnate */
export function shake(el) {
  if (!el || reducedMotion.matches) return;
  el.animate(
    [{ translate: '0 0' }, { translate: '-7px 0' }, { translate: '6px 0' }, { translate: '-4px 0' }, { translate: '3px 0' }, { translate: '0 0' }],
    { duration: 420, easing: 'ease-out' }
  );
}

/** Scritta grande al centro dello schermo che compare e svanisce da sola (es. salita di livello) */
export function showBanner(title, subtitle = '', variant = 'level') {
  const banner = document.createElement('div');
  banner.className = `motion-banner ${variant}`;
  const strong = document.createElement('strong');
  strong.textContent = title;
  banner.appendChild(strong);
  if (subtitle) {
    const small = document.createElement('span');
    small.textContent = subtitle;
    banner.appendChild(small);
  }
  document.body.appendChild(banner);
  afterAnimation(banner, () => banner.remove(), 3600);
}

// --- Pulsanti: onda al click, suoni di passaggio e di click ---

function spawnRipple(button, x, y) {
  const rect = button.getBoundingClientRect();
  const size = Math.hypot(rect.width, rect.height) * 2;
  const ripple = document.createElement('span');
  ripple.className = 'btn-ripple';
  ripple.style.width = ripple.style.height = `${size}px`;
  ripple.style.left = `${x - rect.left - size / 2}px`;
  ripple.style.top = `${y - rect.top - size / 2}px`;
  button.appendChild(ripple);
  afterAnimation(ripple, () => ripple.remove(), 900);
}

document.addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return;
  const button = e.target.closest?.('button');
  if (button && !button.disabled) spawnRipple(button, e.clientX, e.clientY);
});

document.addEventListener('click', (e) => {
  const button = e.target.closest?.('button');
  if (button && !button.disabled) playSfx('click');
});

document.addEventListener('pointerover', (e) => {
  const button = e.target.closest?.('button');
  if (!button || button.disabled || button.contains(e.relatedTarget)) return;
  playSfx('hover', { throttle: 60 });
});
