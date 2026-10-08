// lab.page.js - Laboratorio: si provano le magie senza nemici
import { initColorTheme } from '../ui/theme.js';
import { setPageFavicon } from '../ui/favicon.js';
import '../game/engine.js';
import { navigateTo } from '../ui/motion.js';
import { flushQuests } from '../services/quest-tracker.js';

initColorTheme();
setPageFavicon({ element: 'acqua' }); // icona della scheda: un cerchio magico diverso per ogni pagina

document.getElementById('home-btn').onclick = () => {
  flushQuests(); // le missioni si salvano durante la transizione, non all'ultimo istante
  navigateTo('/home.html');
};
