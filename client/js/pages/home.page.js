// home.page.js - Schermata Home: navigazione, impostazioni, temi
import { createColorThemeToggle, initColorTheme } from '../ui/theme.js';
import { setPageFavicon } from '../ui/favicon.js';
import { startFogBackground } from '../ui/fog-background.js';
import { CURRENT_VERSION } from '../data/changelog.js';
import { navigateTo, openModal, closeModal } from '../ui/motion.js';
import { playSfx } from '../ui/sfx.js';
import {
    KEY_ACTIONS, getKeyBinding, setKeyBinding, resetKeyBindings, formatKey, isReservedKey
} from '../ui/keybindings.js';

initColorTheme();
setPageFavicon({ charged: true }); // icona della scheda: un cerchio magico diverso per ogni pagina

const username = localStorage.getItem('currentPlayer');
if (!username) {
    window.location.href = '/index.html';
}

// --- Navigazione ---
document.getElementById('btn-lab').onclick = () => navigateTo('/lab.html');
document.getElementById('btn-arena').onclick = () => navigateTo('/arena.html');
const versionBtn = document.getElementById('version');
versionBtn.textContent = `Version ${CURRENT_VERSION}`;
versionBtn.title = 'Patch notes';
versionBtn.onclick = () => navigateTo('/version.html');
document.getElementById('logout-btn').onclick = () => {
    localStorage.removeItem('currentPlayer');
    navigateTo('/index.html');
};
document.getElementById('btn-player-info').onclick = () => {
    navigateTo(`/player-info.html?user=${encodeURIComponent(username)}`);
};

// --- Modale impostazioni ---
const settingsModal = document.getElementById('settings-modal');
document.getElementById('btn-settings').onclick = () => openModal(settingsModal);
document.getElementById('close-settings').onclick = () => closeModal(settingsModal);
// Si chiude anche cliccando fuori dal riquadro o con Esc
settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) closeModal(settingsModal);
});
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal(settingsModal);
});

// --- Tasti personalizzabili: clic sul tasto, poi si preme quello nuovo (Esc annulla) ---
const keybindingsContainer = document.getElementById('keybindings-custom');
const keyButtons = {};
let listeningAction = null;

const refreshKeyButtons = () => {
    for (const [action, btn] of Object.entries(keyButtons)) {
        const listening = action === listeningAction;
        btn.classList.toggle('listening', listening);
        btn.textContent = listening ? 'Premi un tasto…' : formatKey(getKeyBinding(action));
    }
};

const stopListening = () => {
    listeningAction = null;
    refreshKeyButtons();
};

for (const [action, { label }] of Object.entries(KEY_ACTIONS)) {
    const row = document.createElement('div');
    row.className = 'keybinding-row';
    const text = document.createElement('span');
    text.className = 'keybinding-label';
    text.textContent = label;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'key';
    btn.title = 'Clicca e premi il nuovo tasto';
    btn.onclick = () => {
        listeningAction = listeningAction === action ? null : action;
        refreshKeyButtons();
    };
    row.append(text, btn);
    keybindingsContainer.appendChild(row);
    keyButtons[action] = btn;
}
refreshKeyButtons();

// In fase di cattura: il tasto premuto non deve anche cambiare tema o chiudere il menu
window.addEventListener('keydown', (e) => {
    if (!listeningAction) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return; // da soli non bastano: si aspetta un tasto vero
    if (!isReservedKey(e.key)) {
        setKeyBinding(listeningAction, e.key);
        playSfx('tick', { value: 0.7 });
    }
    stopListening();
}, true);
// Cliccando altrove o chiudendo il menu si smette di aspettare il tasto
document.addEventListener('pointerdown', (e) => {
    if (listeningAction && !e.target.closest('.keybinding-row button.key')) stopListening();
});
document.getElementById('close-settings').addEventListener('click', stopListening);

document.getElementById('reset-keybindings').onclick = () => {
    resetKeyBindings();
    stopListening();
};

const themeContainer = document.getElementById('theme-toggle-container');
themeContainer.appendChild(createColorThemeToggle());

// Indicatore della carica selezionata nel cerchio magico (letto da engine.js all'avvio del gioco)
const CHARGE_INDICATORS = ['none', 'particles', 'reticle', 'both'];
const chargeIndicatorOptions = document.getElementById('charge-indicator-options');
const showChargeIndicator = (value) => {
    chargeIndicatorOptions.querySelectorAll('button').forEach(btn => {
        btn.setAttribute('aria-checked', String(btn.dataset.value === value));
    });
};
const savedIndicator = localStorage.getItem('chargeIndicator');
showChargeIndicator(CHARGE_INDICATORS.includes(savedIndicator) ? savedIndicator : 'both');
chargeIndicatorOptions.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-value]');
    if (!btn) return;
    localStorage.setItem('chargeIndicator', btn.dataset.value);
    showChargeIndicator(btn.dataset.value);
});

// Numero particelle
const particleCount = document.getElementById('particle-count');
const particleCountValue = document.getElementById('particle-count-value');
const savedParticles = localStorage.getItem('particleCount');
if (savedParticles) particleCount.value = savedParticles;
particleCountValue.textContent = particleCount.value;
particleCount.oninput = (e) => {
    particleCountValue.textContent = e.target.value;
    playSfx('tick', { value: (e.target.value - e.target.min) / (e.target.max - e.target.min), throttle: 40 });
    localStorage.setItem('particleCount', e.target.value);
};

// Volume audio
const audioVolumeSlider = document.getElementById('audio-volume');
const audioVolumeValue = document.getElementById('audio-volume-value');
const savedVolume = localStorage.getItem('audioVolume');
audioVolumeSlider.value = savedVolume ? parseInt(savedVolume) : 50;
audioVolumeValue.textContent = `${audioVolumeSlider.value}%`;
audioVolumeSlider.oninput = (e) => {
    audioVolumeValue.textContent = `${e.target.value}%`;
    localStorage.setItem('audioVolume', e.target.value);
    // Il "tick" suona già al nuovo volume: si sente subito quanto è forte
    playSfx('tick', { value: e.target.value / 100, throttle: 40 });
};

startFogBackground(document.getElementById('home-fog-canvas'));
