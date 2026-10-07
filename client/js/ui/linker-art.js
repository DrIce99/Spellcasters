// linker-art.js - Grafica dei 5 Linker (client/public/img/<Nome>.svg) disegnata nel colore del cerchio.
// Gli SVG sono neri, con forme bianche che "bucano" il nero, su sfondo bianco: si trasformano in una maschera
// di trasparenza (nero = pieno, bianco = vuoto) una volta sola, poi si colorano al volo a ogni cambio di colore.
import { LINKER_SLOTS } from '../game/linker.js';

const MASK_SIZE = 320;          // lato in pixel della maschera (lo slot si vede a circa 90-180 pixel reali)
export const ART_RING_RADIUS = 356; // raggio dell'anello esterno negli SVG (viewBox -400..400)
export const ART_HALF_SIZE = 400;

// Disegnati a 800 unità e mostrati a meno di 100 px, i tratti da 1-4 unità sparirebbero:
// si ingrossano (i più sottili di più), come le linee della favicon
const strokeBoost = (width) => width * 1.5 + 4.5;

const masks = new Map(); // chiave dello slot -> canvas con la maschera
const tinted = new Map(); // colore -> (chiave dello slot -> canvas colorato); pochi colori alla volta
const MAX_TINTS = 12;
let loading = null;

/** Carica tutte le grafiche (una volta sola); si risolve anche se qualcuna manca */
export function loadLinkerArt() {
  loading ??= Promise.all(LINKER_SLOTS.map(async ({ key, label }) => {
    try {
      masks.set(key, await buildMask(`/img/${label}.svg`));
    } catch (error) {
      console.warn(`Grafica del Linker ${label} non disponibile:`, error);
    }
  }));
  return loading;
}

async function buildMask(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const svg = (await response.text())
    .replace(/\sstyle="background:[^"]*"/, '')
    .replace(/stroke-width="([\d.]+)"/g, (_, w) => `stroke-width="${strokeBoost(Number(w))}"`);

  const image = new Image();
  const blobUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    image.src = blobUrl;
    await image.decode();
  } finally {
    URL.revokeObjectURL(blobUrl);
  }

  // Sul bianco i "buchi" restano bianchi: l'opacità finale è quanto il pixel è scuro
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = MASK_SIZE;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, MASK_SIZE, MASK_SIZE);
  ctx.drawImage(image, 0, 0, MASK_SIZE, MASK_SIZE);
  const pixels = ctx.getImageData(0, 0, MASK_SIZE, MASK_SIZE);
  const data = pixels.data;
  for (let i = 0; i < data.length; i += 4) {
    const darkness = 255 - (data[i] + data[i + 1] + data[i + 2]) / 3;
    data[i] = data[i + 1] = data[i + 2] = 0;
    data[i + 3] = darkness;
  }
  ctx.putImageData(pixels, 0, 0);
  return canvas;
}

/**
 * Grafica del Linker nel colore indicato (null se non ancora caricata).
 * Le immagini colorate restano in memoria per gli ultimi colori usati (cerchio del giocatore, set nello shop).
 */
export function getLinkerArt(key, color) {
  const mask = masks.get(key);
  if (!mask) return null;
  if (!tinted.has(color)) {
    if (tinted.size >= MAX_TINTS) tinted.delete(tinted.keys().next().value);
    tinted.set(color, new Map());
  }
  const images = tinted.get(color);
  let image = images.get(key);
  if (!image) {
    image = document.createElement('canvas');
    image.width = image.height = MASK_SIZE;
    const ctx = image.getContext('2d');
    ctx.drawImage(mask, 0, 0);
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, MASK_SIZE, MASK_SIZE);
    images.set(key, image);
  }
  return image;
}
