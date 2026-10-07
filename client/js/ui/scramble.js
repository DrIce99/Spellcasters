// scramble.js - Testi che si "scrivono" (scrambleText di animejs): partono vuoti, un cursore avanza e dietro di lui
// le lettere passano per qualche runa a caso prima di fermarsi su quella giusta.
// Si usa quando cambia il contenuto dei Linker: si animano solo i testi diversi da prima.
import { animate, scrambleText } from 'animejs';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const RUNES = 'ᚠ-ᛪ';            // blocco Unicode delle rune (stesso font del nome nel cerchio dei Linker)
const RUNE_FONTS = "'Noto Sans Runic', 'Segoe UI Historic'";
const STAGGER_MS = 22;           // le righe partono una dopo l'altra
const MAX_STAGGER_MS = 400;
// Elementi che non si toccano: controlli (perderebbero lo stato) ed emoji (scrambleText spezza le coppie surrogate)
const SKIP = 'button, select, option, input, textarea';

/** Riscrive il testo dell'elemento con l'animazione (subito, senza animazione, se il movimento è ridotto) */
export function scrambleIn(el, text = el.textContent, { delay = 0 } = {}) {
  el.textContent = '';
  if (reducedMotion.matches || !text.trim()) {
    el.textContent = text;
    return;
  }
  // Mentre si scrive l'elemento non deve collassare (le righe sotto salterebbero)
  el.classList.add('scrambling');
  // Il font dell'elemento di solito non ha le rune: si aggiungono in coda i font runici come riserva
  // (le lettere normali restano nel loro font)
  if (!el.style.fontFamily) el.style.fontFamily = `${getComputedStyle(el).fontFamily}, ${RUNE_FONTS}`;
  animate(el, {
    textContent: scrambleText({ text, chars: RUNES, cursor: '▌', override: '', revealRate: 50, settleDuration: 240 }),
    delay,
    onComplete: () => {
      el.classList.remove('scrambling');
      el.style.fontFamily = '';
    }
  });
}

// Elementi con solo testo dentro (niente figli): sono quelli che si possono riscrivere senza rompere nulla
function textLeaves(root) {
  return [...root.querySelectorAll('*')].filter(el =>
    !el.childElementCount && el.textContent.trim() && !el.closest(SKIP) && !el.hidden);
}

// Chiave stabile di un elemento: il suo data-key (es. l'id del Linker) o la posizione tra i fratelli, fino a root
function keyOf(el, root) {
  const parts = [];
  for (let node = el; node && node !== root; node = node.parentElement) {
    parts.push(node.dataset.key ?? `${node.tagName}${[...node.parentElement.children].indexOf(node)}`);
  }
  return parts.reverse().join('/');
}

/**
 * Fotografia dei testi dentro root, da passare a scrambleChanged dopo averne ricreato il contenuto.
 * I testi che si stavano ancora scrivendo contano come cambiati: nei nuovi elementi l'animazione riparte
 * (altrimenti un secondo render subito dopo il primo la cancellerebbe)
 */
export function snapshotTexts(root) {
  return new Map(textLeaves(root).map(el => [keyOf(el, root), el.classList.contains('scrambling') ? null : el.textContent]));
}

/** Riscrive con l'animazione i testi diversi dalla fotografia (senza fotografia: tutti) */
export function scrambleChanged(root, before = null) {
  let order = 0;
  for (const el of textLeaves(root)) {
    const text = el.textContent;
    if (before?.get(keyOf(el, root)) === text) continue;
    scrambleIn(el, text, { delay: Math.min(order++ * STAGGER_MS, MAX_STAGGER_MS) });
  }
}
