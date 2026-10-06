// lab.page.js - Laboratorio: si provano le magie senza nemici
import { initColorTheme } from '../ui/theme.js';
import { setPageFavicon } from '../ui/favicon.js';
import '../game/engine.js';
import { navigateTo } from '../ui/motion.js';

initColorTheme();
setPageFavicon({ element: 'acqua' }); // icona della scheda: un cerchio magico diverso per ogni pagina

document.getElementById('home-btn').onclick = () => navigateTo('/home.html');
