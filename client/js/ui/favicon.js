// favicon.js - Icona della scheda: un cerchio magico del gioco, diverso per ogni pagina.
// È disegnato con le stesse funzioni usate in partita, così resta sempre uguale ai cerchi veri.
import { drawElementPattern, drawProjectilePolygonPattern } from '../game/element-patterns.js';
import { getElementColor, EMPTY_CIRCLE_COLOR, PROJECTIONS } from '../game/elements.js';

const ICON_SIZE = 64;
// Si disegna alla scala del gioco (cerchio di raggio 120) e poi si rimpicciolisce
const DRAW_SIZE = 384;
const RADIUS = 120;
// Rimpicciolito di 6 volte un tratto di 3 px sparirebbe: le linee vengono ingrossate
const LINE_BOOST = 2.6;
const BACKGROUND = '#11141c';

/**
 * Imposta l'icona della pagina.
 * @param {object} options
 * @param {string|null} [options.element] elemento infuso nel cerchio (null = cerchio vuoto)
 * @param {boolean} [options.charged] mostra le tre cariche (proiettile, spaziale, laser) attorno al cerchio
 */
export function setPageFavicon({ element = null, charged = false } = {}) {
  try {
    const link = document.querySelector('link[rel="icon"]') || document.head.appendChild(
      Object.assign(document.createElement('link'), { rel: 'icon' })
    );
    link.type = 'image/png';
    link.href = renderCircleIcon(element, charged);
  } catch (error) {
    console.warn('Icona della pagina non disponibile:', error);
  }
}

export function renderCircleIcon(element, charged) {
  const big = document.createElement('canvas');
  big.width = big.height = DRAW_SIZE;
  const ctx = big.getContext('2d');
  boostLineWidth(ctx, LINE_BOOST);

  const c = DRAW_SIZE / 2;
  const color = element ? getElementColor(element) : EMPTY_CIRCLE_COLOR;
  // Fondo scuro rotondo: il cerchio si legge sia sulle schede chiare che su quelle scure
  ctx.beginPath();
  ctx.arc(c, c, c, 0, Math.PI * 2);
  ctx.fillStyle = BACKGROUND;
  ctx.fill();

  // Il cerchio riempie l'icona (l'anello esterno ha raggio RADIUS + 20)
  const scale = 1.18;
  ctx.save();
  ctx.translate(c, c);
  ctx.scale(scale, scale);
  ctx.translate(-c, -c);
  drawGameCircle(ctx, c, c, color, element, charged);
  ctx.restore();

  const icon = document.createElement('canvas');
  icon.width = icon.height = ICON_SIZE;
  const iconCtx = icon.getContext('2d');
  iconCtx.imageSmoothingEnabled = true;
  iconCtx.imageSmoothingQuality = 'high';
  iconCtx.drawImage(big, 0, 0, ICON_SIZE, ICON_SIZE);
  return icon.toDataURL('image/png');
}

// Stessa struttura di drawMagicCircle in engine.js, senza animazioni
function drawGameCircle(ctx, x, y, color, element, charged) {
  if (element) {
    const glowRadius = RADIUS + 24;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
    grad.addColorStop(0, color + 'cc');
    grad.addColorStop(0.45, color + '44');
    grad.addColorStop(0.85, color + '11');
    grad.addColorStop(1, color + '00');
    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.beginPath();
    ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();
    drawElementPattern(ctx, x, y, RADIUS * 0.82, element);
  }

  // In partita le cariche stanno fuori dal cerchio: qui vanno dentro, o uscirebbero dall'icona
  if (charged) {
    drawProjectilePolygonPattern(ctx, x, y, RADIUS * 0.6, PROJECTIONS.length, color, 0, PROJECTIONS);
  }

  ctx.lineWidth = 3;
  ctx.strokeStyle = color;
  for (const r of [RADIUS, RADIUS + 20]) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.lineWidth = 1;
  const segments = 24;
  for (let i = 0; i < segments; i++) {
    const angle = (Math.PI * 2 / segments) * i;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(angle) * (RADIUS + 20), y + Math.sin(angle) * (RADIUS + 20));
    ctx.lineTo(x + Math.cos(angle) * RADIUS, y + Math.sin(angle) * RADIUS);
    ctx.stroke();
  }
}

// Moltiplica ogni lineWidth impostato su questo contesto (anche dentro le funzioni dei pattern)
function boostLineWidth(ctx, factor) {
  const descriptor = Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, 'lineWidth');
  Object.defineProperty(ctx, 'lineWidth', {
    get() { return descriptor.get.call(this) / factor; },
    set(value) { descriptor.set.call(this, value * factor); }
  });
}
