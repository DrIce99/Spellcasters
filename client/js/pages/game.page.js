// game.page.js - game.html?mode=training (manichino) oppure game.html?mode=pvp (duello)
import { initColorTheme } from '../ui/theme.js';
import { setPageFavicon } from '../ui/favicon.js';
import { setupTrainingDummy } from '../game/training.js';
import { navigateTo } from '../ui/motion.js';

initColorTheme();
setPageFavicon({ element: 'fuoco' }); // icona della scheda: un cerchio magico diverso per ogni pagina

const mode = new URLSearchParams(window.location.search).get('mode') === 'pvp' ? 'pvp' : 'training';

if (mode === 'training') {
  const homeBtn = document.createElement('button');
  homeBtn.id = 'home-btn';
  homeBtn.className = 'btn-permanent';
  homeBtn.textContent = 'Home';
  homeBtn.onclick = () => navigateTo('/home.html');
  document.body.insertBefore(homeBtn, document.body.firstChild);

  setupTrainingDummy(document.getElementById('spellCanvas'));
}

// Il motore legge la modalità dall'URL e, se serve, avvia il PvPManager
await import('../game/engine.js');
