// home.page.js - Schermata Home: navigazione, impostazioni, temi
import { createColorThemeToggle, initColorTheme } from '../ui/theme.js';
import { startFogBackground } from '../ui/fog-background.js';
import { CURRENT_VERSION } from '../data/changelog.js';
import { navigateTo, openModal, closeModal } from '../ui/motion.js';
import { playSfx } from '../ui/sfx.js';

initColorTheme();

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
