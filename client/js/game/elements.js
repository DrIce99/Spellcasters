// elements.js - Elementi, proiezioni e colori condivisi da tutto il gioco

export const ELEMENTS = ['fuoco', 'acqua', 'aria', 'terra', 'fulmine'];
export const PROJECTIONS = ['proiettile', 'spaziale', 'laser'];
// Segni non elementali: il cerchio magico e le proiezioni
export const SYMBOLS = ['cerchio', ...PROJECTIONS];

export const ELEMENT_COLORS = {
  fuoco: '#ff5555',
  acqua: '#5555ff',
  aria: '#aaaaee',
  terra: '#55aa55',
  fulmine: '#ffff55',
  luce: '#ffffff'
};

// Varianti rossastre usate per disegnare le magie dell'avversario
export const OPPONENT_ELEMENT_COLORS = {
  fuoco: '#ff8888',
  acqua: '#ff6666',
  aria: '#ff9999',
  terra: '#cc4444',
  fulmine: '#ffaaaa',
  luce: '#ff7777'
};

export const NEUTRAL_COLOR = '#78dcff';        // mana puro (proiettile senza elemento)
export const EMPTY_CIRCLE_COLOR = '#ff33cc';   // cerchio magico non infuso
export const DEFAULT_SPAZIALE_COLOR = '#00e0ff';

export function isElement(name) {
  return ELEMENTS.includes(name);
}

export function isProjection(name) {
  return PROJECTIONS.includes(name);
}

export function isSymbol(name) {
  return SYMBOLS.includes(name);
}

export function getElementColor(element) {
  return ELEMENT_COLORS[element] || '#ffffff';
}

export function getOpponentElementColor(element) {
  return OPPONENT_ELEMENT_COLORS[element] || '#ff6666';
}

// --- Conversione colori ---
// Nel codice i colori arrivano in molti formati: '#rrggbb', '#rrggbb,', 'rgb(r,g,b)',
// 'rgba(r,g,b,a)' e il "prefisso" 'rgba(r,g,b,'. parseColor li normalizza tutti.
export function parseColor(color) {
  if (typeof color !== 'string') return { rgb: '120,220,255', a: 1 };
  const c = color.trim();
  if (c.startsWith('#')) {
    const hex = c.slice(1).replace(/[^0-9a-f]/gi, '');
    const full = hex.length === 3 ? hex.split('').map(h => h + h).join('') : hex.slice(0, 6);
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    if ([r, g, b].some(Number.isNaN)) return { rgb: '120,220,255', a: 1 };
    return { rgb: `${r},${g},${b}`, a: 1 };
  }
  const match = c.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?/i);
  if (match) {
    const a = match[4] !== undefined ? parseFloat(match[4]) : 1;
    return { rgb: `${Math.round(match[1])},${Math.round(match[2])},${Math.round(match[3])}`, a };
  }
  return { rgb: '120,220,255', a: 1 };
}

// Restituisce 'rgba(r,g,b,alpha)' partendo da qualsiasi formato supportato
export function withAlpha(color, alpha = 1) {
  const { rgb } = parseColor(color);
  return `rgba(${rgb},${alpha})`;
}
