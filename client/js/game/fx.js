// fx.js - Effetti di transizione del motore: onde d'urto, cerchi magici che si dissolvono,
// tratti dei simboli che sfumano. Disegnati in coordinate del mondo da engine.js (drawFx).
import { drawBrushStroke } from './brush-stroke.js';
import { withAlpha } from './elements.js';

const rings = [];       // onde d'urto che si allargano (o si stringono)
const collapses = [];   // cerchi magici che svaniscono
const strokes = [];     // tratti di simboli appena terminati

export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const easeInCubic = (t) => t * t * t;

/** Comparsa con leggero rimbalzo (0..1 -> 0..1, supera 1 a metà) */
export function easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

/**
 * Onda d'urto circolare. from > to = implosione.
 * @param {{color?: string, from?: number, to?: number, duration?: number, width?: number, delay?: number}} opts
 */
export function spawnRing(x, y, { color = '#78dcff', from = 0, to = 120, duration = 450, width = 3, delay = 0 } = {}) {
  rings.push({ x, y, color, from, to, duration, width, born: performance.now() + delay });
}

/** Il cerchio magico non c'è più: i suoi anelli si stringono e svaniscono girando */
export function spawnCircleCollapse(circle, color, rotation = 0, duration = 420) {
  collapses.push({ x: circle.x, y: circle.y, radius: circle.radius, color, rotation, duration, born: performance.now() });
}

/** Il tratto appena disegnato resta un attimo e sfuma, colorato in base all'esito */
export function spawnStrokeFade(points, { color, glow = color, duration = 380, jitter = 0 } = {}) {
  if (!points || points.length < 2) return;
  strokes.push({ points: points.slice(), color, glow, duration, jitter, born: performance.now() });
}

function progressOf(fx, now) {
  return Math.min(1, Math.max(0, (now - fx.born) / fx.duration));
}

export function drawFx(ctx) {
  const now = performance.now();

  for (let i = strokes.length - 1; i >= 0; i--) {
    const s = strokes[i];
    const t = progressOf(s, now);
    if (t >= 1) { strokes.splice(i, 1); continue; }
    // Un simbolo fallito trema mentre si spegne
    const points = s.jitter
      ? s.points.map(p => ({ x: p.x + (Math.random() - 0.5) * s.jitter * t, y: p.y + (Math.random() - 0.5) * s.jitter * t }))
      : s.points;
    ctx.save();
    ctx.globalAlpha = 1 - easeInCubic(t);
    drawBrushStroke(ctx, points, { color: s.color, glow: s.glow, width: 5 + 4 * (1 - t) });
    ctx.restore();
  }

  for (let i = rings.length - 1; i >= 0; i--) {
    const r = rings[i];
    if (now < r.born) continue;
    const t = progressOf(r, now);
    if (t >= 1) { rings.splice(i, 1); continue; }
    const radius = r.from + (r.to - r.from) * easeOutCubic(t);
    const alpha = 1 - t;
    ctx.save();
    // Alone largo e tenue + filo sottile e brillante
    ctx.strokeStyle = withAlpha(r.color, 0.25 * alpha);
    ctx.lineWidth = r.width * 4 * (1 - t * 0.5);
    ctx.beginPath();
    ctx.arc(r.x, r.y, Math.max(0, radius), 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = withAlpha(r.color, 0.9 * alpha);
    ctx.lineWidth = r.width * (1 - t * 0.6);
    ctx.stroke();
    ctx.restore();
  }

  for (let i = collapses.length - 1; i >= 0; i--) {
    const c = collapses[i];
    const t = progressOf(c, now);
    if (t >= 1) { collapses.splice(i, 1); continue; }
    const k = easeInCubic(t);
    const scale = 1 - 0.75 * k;
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.rotation + k * 1.2);
    ctx.globalAlpha = 1 - t;
    ctx.strokeStyle = c.color;
    ctx.lineWidth = 3 * (1 - t) + 0.5;
    for (const r of [c.radius, c.radius + 20]) {
      ctx.beginPath();
      ctx.arc(0, 0, r * scale, 0, Math.PI * 2);
      ctx.stroke();
    }
    // I segmenti radiali si "staccano" verso l'esterno
    ctx.lineWidth = 1;
    for (let s = 0; s < 24; s++) {
      const angle = (Math.PI * 2 / 24) * s;
      const inner = c.radius * scale + k * 30;
      const outer = (c.radius + 20) * scale + k * 50;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
      ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
      ctx.stroke();
    }
    ctx.restore();
  }
}
