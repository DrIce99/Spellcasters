// version.page.js - Pagina delle patch notes
import { initColorTheme, initUITheme } from '../ui/theme.js';
import { startFogBackground } from '../ui/fog-background.js';

initColorTheme();
initUITheme();

document.getElementById('home-btn').addEventListener('click', () => {
    window.location.href = '/home.html';
});

startFogBackground(document.getElementById('home-fog-canvas'));
