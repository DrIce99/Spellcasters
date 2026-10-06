// lab.page.js - Laboratorio: si provano le magie senza nemici
import { initColorTheme } from '../ui/theme.js';
import '../game/engine.js';
import { navigateTo } from '../ui/motion.js';

initColorTheme();

document.getElementById('home-btn').onclick = () => navigateTo('/home.html');
