// theme.js - Tema colore (giorno/notte) ed effetto hover dei pulsanti

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

// Crea un toggle DOM per cambiare tema COLORE
function createColorThemeToggle() {
  const btn = document.createElement('button');
  const updateText = (theme) => {
    btn.textContent = theme === 'night' ? '🌙 Notte' : '☀️ Giorno';
  };
  updateText(currentColorTheme);
  btn.style.margin = '10px';
  btn.onclick = () => setColorTheme(currentColorTheme === 'night' ? 'day' : 'night');
  colorThemeListeners.add(updateText);
  return btn;
}

// Tasti N/G per il tema colore (ignorati mentre si scrive in un campo di testo)
window.addEventListener("keydown", (e) => {
  const active = document.activeElement;
  if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;
  if (e.key === 'n' || e.key === 'N') setColorTheme('night');
  if (e.key === 'g' || e.key === 'G') setColorTheme('day');
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
document.addEventListener('mouseout', (e) => {
  if (e.target && e.target.tagName === 'BUTTON') {
    e.target.style.removeProperty('--mouse-x');
    e.target.style.removeProperty('--mouse-y');
  }
});

export {
  setColorTheme,
  getColorTheme,
  onColorThemeChange,
  initColorTheme,
  createColorThemeToggle,
  DAY_COLOR,
  NIGHT_COLOR
};
