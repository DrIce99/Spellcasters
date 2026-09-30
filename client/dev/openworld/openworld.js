// openworld.js - Prototipo del DLC Open World
import { animate } from 'animejs';
import { initColorTheme } from '../../js/ui/theme.js';

initColorTheme();

// animejs v4: animate(target, parametri)
animate('.square', {
    translateX: 250
});
