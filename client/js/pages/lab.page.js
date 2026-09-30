// lab.page.js - Laboratorio: si provano le magie senza nemici
import { initColorTheme } from '../ui/theme.js';
import '../game/engine.js';

initColorTheme();

document.getElementById('home-btn').onclick = () => {
  window.location.href = '/home.html';
};
