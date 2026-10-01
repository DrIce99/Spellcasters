// spell-interactions.js - Interazioni tra magie in campo (proiettili e aree spaziali)
//
// Una magia è descritta da { element, variant }. `variant` è lo stato che una magia può
// acquisire dopo un'interazione: 'lush' (rigogliosa) o 'magma'.
//
// Effetti possibili su una magia:
//   remove -> la magia sparisce (spenta, dissolta...)
//   ignite -> diventa fuoco (e, per le aree, passa al giocatore che ha lanciato il fuoco)
//   lush   -> diventa rigogliosa: rigenerazione di mana aumentata per entrambi i caster
//   magma  -> diventa magma: danneggia entrambi i caster (i proiettili lasciano una scia)

export const LUSH_DURATION_MS = 12000;
export const MAGMA_DURATION_MS = 5000;
export const MAGMA_TRAIL_MS = 2500;
export const LUSH_MANA_REGEN_MULTIPLIER = 3;

export const VARIANT_COLORS = {
  lush: '#7dff9a',
  magma: '#ff7a1a'
};

// Chiave = coppia di elementi in ordine alfabetico; valore = effetto su ciascun elemento
const ELEMENT_TABLE = {
  'acqua|fuoco': { fuoco: 'remove' },                // l'acqua spegne il fuoco
  'aria|fuoco': { aria: 'ignite' },                  // il fuoco incendia l'aria
  'acqua|aria': { acqua: 'remove' },                 // l'aria dissolve l'acqua
  'acqua|terra': { acqua: 'lush', terra: 'lush' },   // acqua + terra = rigoglio
  'fuoco|terra': { fuoco: 'magma', terra: 'magma' }  // fuoco + terra = magma
};

/**
 * Cosa succede quando la magia `a` tocca la magia `b`.
 * @returns {{ a: string|null, b: string|null }} effetto subito da ciascuna delle due
 */
export function getInteraction(a, b) {
  const none = { a: null, b: null };
  if (!a.element || !b.element) {
    // Una magia neutra non interagisce, a parte il raffreddamento del magma
    return coolMagma(a, b) || none;
  }

  // Le magie già trasformate (rigogliose / magma) non reagiscono più, tranne l'acqua sul magma
  if (a.variant || b.variant) return coolMagma(a, b) || none;

  if (a.element === b.element) return none;

  const key = [a.element, b.element].sort().join('|');
  const entry = ELEMENT_TABLE[key];
  if (!entry) return none;
  return { a: entry[a.element] || null, b: entry[b.element] || null };
}

// Extra: l'acqua raffredda il magma e lo fa sparire
function coolMagma(a, b) {
  if (a.element === 'acqua' && b.variant === 'magma') return { a: null, b: 'remove' };
  if (b.element === 'acqua' && a.variant === 'magma') return { a: 'remove', b: null };
  return null;
}

// Le aree di terra "pura" bloccano le proiezioni che non reagiscono con loro
export function blocksProjectiles(area) {
  return area.element === 'terra' && !area.variant;
}
