// theme.js - Tema colore (giorno/notte) ed effetto hover dei pulsanti
import { playSfx } from './sfx.js';

// --- Color Theme (Day/Night) ---
let currentColorTheme = 'day';
const DAY_COLOR = '#f0f4ff';
const NIGHT_COLOR = '#11141c';
const colorThemeListeners = new Set();

/** Imposta il tema colore e aggiorna la classe del body (usata dai CSS per le variabili). */
function setColorTheme(mode) {
  currentColorTheme = mode === 'night' ? 'night' : 'day';
  document.body.classList.remove('day', 'night');
  document.body.classList.add(currentColorTheme);
  document.body.style.backgroundColor = currentColorTheme === 'night' ? NIGHT_COLOR : DAY_COLOR;
  document.documentElement.dataset.theme = currentColorTheme; // usato dal velo di transizione (style-motion.css)
  localStorage.setItem('colorMode', currentColorTheme);
  colorThemeListeners.forEach(listener => listener(currentColorTheme));
}

/** Registra una funzione chiamata a ogni cambio di tema colore */
function onColorThemeChange(listener) {
  colorThemeListeners.add(listener);
}

function getColorTheme() {
  return currentColorTheme;
}

function initColorTheme() {
  const saved = localStorage.getItem('colorMode');
  setColorTheme(saved === 'night' ? 'night' : 'day');
}

/**
 * Cambio di tema scelto dall'utente: il nuovo tema si allarga a cerchio da origin ({x, y} in pixel)
 * dove il browser supporta le View Transitions. Durante la partita si cambia e basta:
 * la transizione congelerebbe il canvas per mezzo secondo.
 */
function switchColorTheme(mode, origin = null) {
  if (mode === currentColorTheme) return;
  playSfx('toggle', { on: mode === 'night' });
  const animate = document.startViewTransition
    && !document.getElementById('spellCanvas')
    && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!animate) {
    setColorTheme(mode);
    return;
  }
  const x = origin?.x ?? window.innerWidth / 2;
  const y = origin?.y ?? window.innerHeight / 2;
  const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
  const root = document.documentElement;
  // Niente transizioni CSS dei colori mentre il cerchio si allarga: si vedrebbero sfumare dentro
  root.classList.add('theme-switching');
  const transition = document.startViewTransition(() => setColorTheme(mode));
  transition.ready.then(() => {
    root.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
      { duration: 650, easing: 'cubic-bezier(.77, 0, .18, 1)', pseudoElement: '::view-transition-new(root)' }
    );
  }).catch(() => {});
  transition.finished.finally(() => root.classList.remove('theme-switching'));
}

// Crea un toggle DOM per cambiare tema COLORE
function createColorThemeToggle() {
  const btn = document.createElement('button');
  const updateText = (theme) => {
    btn.textContent = theme === 'night' ? '🌙 Notte' : '☀️ Giorno';
  };
  updateText(currentColorTheme);
  btn.style.margin = '10px';
  btn.onclick = (e) => switchColorTheme(currentColorTheme === 'night' ? 'day' : 'night', { x: e.clientX, y: e.clientY });
  colorThemeListeners.add(updateText);
  return btn;
}

// Tasti N/G per il tema colore (ignorati mentre si scrive in un campo di testo)
window.addEventListener("keydown", (e) => {
  const active = document.activeElement;
  if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;
  if (e.key === 'n' || e.key === 'N') switchColorTheme('night');
  if (e.key === 'g' || e.key === 'G') switchColorTheme('day');
});


// --- Effetto hover dei pulsanti (usato dai CSS tramite --mouse-x/--mouse-y) ---
document.addEventListener('mousemove', (e) => {
  if (e.target && e.target.tagName === 'BUTTON') {
    const btn = e.target;
    const rect = btn.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    btn.style.setProperty('--mouse-x', `${x}%`);
    btn.style.setProperty('--mouse-y', `${y}%`);
  }
});
// Uscendo dal pulsante la posizione resta: l'alone svanisce dove era il mouse invece di saltare al centro

export {
  setColorTheme,
  getColorTheme,
  onColorThemeChange,
  initColorTheme,
  createColorThemeToggle,
  DAY_COLOR,
  NIGHT_COLOR
};
