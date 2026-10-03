// home.page.js - Schermata Home: navigazione, impostazioni, temi
import { createColorThemeToggle, initColorTheme } from '../ui/theme.js';
import { startFogBackground } from '../ui/fog-background.js';
import { CURRENT_VERSION } from '../data/changelog.js';

initColorTheme();

const username = localStorage.getItem('currentPlayer');
if (!username) {
    window.location.href = '/index.html';
}

// --- Navigazione ---
document.getElementById('btn-lab').onclick = () => { window.location.href = '/lab.html'; };
document.getElementById('btn-arena').onclick = () => { window.location.href = '/arena.html'; };
const versionBtn = document.getElementById('version');
versionBtn.textContent = `Version ${CURRENT_VERSION}`;
versionBtn.title = 'Patch notes';
versionBtn.onclick = () => { window.location.href = '/version.html'; };
document.getElementById('logout-btn').onclick = () => {
    localStorage.removeItem('currentPlayer');
    window.location.href = '/index.html';
};
document.getElementById('btn-player-info').onclick = () => {
    window.location.href = `/player-info.html?user=${encodeURIComponent(username)}`;
};

// --- Modale impostazioni ---
const settingsModal = document.getElementById('settings-modal');
document.getElementById('btn-settings').onclick = () => settingsModal.classList.remove('hidden');
document.getElementById('close-settings').onclick = () => settingsModal.classList.add('hidden');

const themeContainer = document.getElementById('theme-toggle-container');
themeContainer.appendChild(createColorThemeToggle());

// Numero particelle
const particleCount = document.getElementById('particle-count');
const particleCountValue = document.getElementById('particle-count-value');
const savedParticles = localStorage.getItem('particleCount');
if (savedParticles) particleCount.value = savedParticles;
particleCountValue.textContent = particleCount.value;
particleCount.oninput = (e) => {
    particleCountValue.textContent = e.target.value;
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
};

startFogBackground(document.getElementById('home-fog-canvas'));
