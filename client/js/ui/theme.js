// theme.js - Gestione completa del sistema di temi (Colore e UI)

// --- Color Theme (Day/Night) ---
let currentColorTheme = 'day';
const DAY_COLOR = '#ffffff';
const NIGHT_COLOR = '#111111';
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


// --- UI Theme (Classic/Rework) ---
// Il tema Rework è ancora in sviluppo: viene applicato solo ai fogli di stile
// marcati con l'attributo data-ui-theme (Home, Arena, Patch notes).
let currentUITheme = 'classic';
const UI_THEMES = {
  classic: { name: 'Classic UI', suffix: '' },
  rework: { name: 'Rework UI', suffix: '-rework' }
};
const uiThemeListeners = new Set();

function setUITheme(mode) {
  currentUITheme = mode === 'rework' ? 'rework' : 'classic';
  localStorage.setItem('uiMode', currentUITheme);
  applyUITheme(currentUITheme);
  uiThemeListeners.forEach(listener => listener(currentUITheme));
}

function getUITheme() {
  return currentUITheme;
}

function initUITheme() {
  const saved = localStorage.getItem('uiMode');
  setUITheme(saved === 'rework' ? 'rework' : 'classic');
}

// Scambia style-xxx.css <-> style-xxx-rework.css
function applyUITheme(theme) {
  const suffix = UI_THEMES[theme].suffix;
  document.querySelectorAll('link[rel="stylesheet"][data-ui-theme]').forEach(link => {
    const href = link.getAttribute('href');
    const basePath = href.replace(/-rework\.css$/, '.css');
    link.setAttribute('href', basePath.replace(/\.css$/, `${suffix}.css`));
  });
}

// Crea un toggle DOM per cambiare tema UI
function createUIThemeToggle() {
  const btn = document.createElement('button');
  const updateText = (theme) => {
    btn.textContent = `Tema: ${UI_THEMES[theme].name}`;
  };
  updateText(currentUITheme);
  btn.style.margin = '10px';
  btn.onclick = () => setUITheme(currentUITheme === 'rework' ? 'classic' : 'rework');
  uiThemeListeners.add(updateText);
  return btn;
}

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
  initColorTheme,
  createColorThemeToggle,
  setUITheme,
  getUITheme,
  initUITheme,
  createUIThemeToggle,
  DAY_COLOR,
  NIGHT_COLOR
};
