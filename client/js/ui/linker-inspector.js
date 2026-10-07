// linker-inspector.js - Selezione di uno slot dei Linker e inventario (come gli artefatti di Genshin Impact).
// Selezionando uno slot (sul cerchio o nella lista) parte la transizione:
//   1. la lista degli slot a destra si restringe orizzontalmente;
//   2. le voci, una dopo l'altra (a "trenino"), scendono e poi si mettono in fila sotto il cerchio,
//      che intanto si sposta a sinistra;
//   3. a destra compare l'inventario dei Linker di quello slot, con il dettaglio di quello scelto.
// Le voci sotto il cerchio fanno da schede: si cambia slot senza chiudere. ✕ o Esc chiudono (animazione al contrario).
import { LinkerInventoryView } from './linker-inventory.js';

const COMPACT_MS = 380;      // fase 1: la lista si restringe
const TRAIN_MS = 720;        // fase 2: durata del viaggio di ogni voce
const TRAIN_GAP_MS = 80;     // ritardo tra una voce e la successiva
const CIRCLE_MS = 780;
const INVENTORY_MS = 320;    // fase 3: comparsa/sparizione dell'inventario
const EASE = 'cubic-bezier(.65, 0, .35, 1)';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const wait = (ms) => new Promise(resolve => setTimeout(resolve, reducedMotion.matches ? 0 : ms));

export class LinkerInspector {
  /**
   * @param {object} options
   * @param {HTMLElement} options.layout contenitore di cerchio, lista e inventario
   * @param {HTMLCanvasElement} options.canvas
   * @param {HTMLElement} options.list lista degli slot (una riga per slot, con data-slot)
   * @param {HTMLElement} options.inventory pannello dell'inventario
   * @param {import('./linker-circle.js').LinkerCircle} options.circle
   * @param {object} options.actions dati e azioni dell'inventario (vedi LinkerInventoryView)
   */
  constructor({ layout, canvas, list, inventory, circle, actions }) {
    Object.assign(this, { layout, canvas, list, inventory, circle });
    this.state = 'closed';     // closed | opening | open | closing
    this.slot = null;          // slot aperto
    this.view = new LinkerInventoryView(inventory, actions);
    inventory.querySelector('[data-role="close"]').addEventListener('click', () => this.close());

    this.bindCanvas();
    this.bindList();
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.state === 'open') this.close();
    });
  }

  // --- Input: slot sul cerchio e righe della lista ---

  bindCanvas() {
    const { canvas, circle } = this;
    canvas.addEventListener('pointermove', (e) => {
      const slot = circle.slotAt(e.clientX, e.clientY);
      canvas.style.cursor = slot ? 'pointer' : '';
      if (slot !== circle.highlight) {
        circle.setHighlight(slot);
        this.markRows();
      }
    });
    canvas.addEventListener('pointerleave', () => {
      canvas.style.cursor = '';
      circle.setHighlight(null);
      this.markRows();
    });
    canvas.addEventListener('click', (e) => {
      const slot = circle.slotAt(e.clientX, e.clientY);
      if (slot) this.open(slot);
    });
  }

  bindList() {
    this.list.addEventListener('click', (e) => {
      const row = e.target.closest('[data-slot]');
      if (row) this.open(row.dataset.slot);
    });
    this.list.addEventListener('pointerover', (e) => {
      const row = e.target.closest('[data-slot]');
      this.circle.setHighlight(row ? row.dataset.slot : null);
    });
    this.list.addEventListener('pointerleave', () => this.circle.setHighlight(null));
  }

  /** Da chiamare quando la pagina ricrea le righe della lista o cambiano i dati del giocatore */
  refresh() {
    this.markRows();
    if (this.slot) this.view.render();
  }

  markRows() {
    for (const row of this.list.querySelectorAll('[data-slot]')) {
      row.classList.toggle('selected', row.dataset.slot === this.slot);
      row.classList.toggle('hover', row.dataset.slot === this.circle.highlight);
      row.setAttribute('aria-selected', String(row.dataset.slot === this.slot));
    }
  }

  // --- Apertura e chiusura ---

  /** Apre l'inventario dello slot; se è già aperto cambia solo slot */
  async open(slotKey) {
    if (this.state === 'opening' || this.state === 'closing') return;
    this.select(slotKey);
    if (this.state === 'open') return;

    this.state = 'opening';
    // 1. La lista si restringe sul posto
    await this.resizeList(() => this.layout.classList.add('compacting'));

    // 2. Nuova disposizione; le voci partono da dov'erano e arrivano sotto il cerchio a trenino
    const rows = [...this.list.children];
    const first = rows.map(r => r.getBoundingClientRect());
    const circleFirst = this.canvas.getBoundingClientRect();
    this.inventory.hidden = false;
    this.layout.classList.add('inspecting');
    await Promise.all([
      this.slideCircle(circleFirst),
      ...rows.map((row, i) => this.train(row, first[i], i, 'down-then-across'))
    ]);

    // 3. A destra compare l'inventario
    this.inventory.classList.add('visible');
    await wait(INVENTORY_MS);
    this.state = 'open';
  }

  async close() {
    if (this.state !== 'open') return;
    this.state = 'closing';
    this.inventory.classList.remove('visible');
    await wait(INVENTORY_MS);

    // Le voci tornano nella lista a destra: prima in orizzontale, poi in su
    const rows = [...this.list.children];
    const first = rows.map(r => r.getBoundingClientRect());
    const circleFirst = this.canvas.getBoundingClientRect();
    this.layout.classList.remove('inspecting');
    this.inventory.hidden = true;
    await Promise.all([
      this.slideCircle(circleFirst),
      ...rows.map((row, i) => this.train(row, first[i], rows.length - 1 - i, 'across-then-up'))
    ]);

    // La lista torna larga
    this.select(null);
    await this.resizeList(() => this.layout.classList.remove('compacting'));
    this.state = 'closed';
  }

  // Cambia la larghezza della lista con un'animazione tra due misure in pixel: una transizione CSS
  // tra "100%" e una larghezza fissa, dentro la griglia, partirebbe da zero invece che dalla larghezza attuale
  resizeList(changeLayout) {
    const from = this.list.getBoundingClientRect().width;
    changeLayout();
    const to = this.list.getBoundingClientRect().width;
    if (reducedMotion.matches || from === to) return Promise.resolve();
    return this.list.animate([{ width: `${from}px` }, { width: `${to}px` }], { duration: COMPACT_MS, easing: EASE })
      .finished.catch(() => {});
  }

  /** Chiude subito, senza animazioni (es. uscendo dal pannello) */
  closeInstantly() {
    this.layout.classList.remove('inspecting', 'compacting');
    this.inventory.classList.remove('visible');
    this.inventory.hidden = true;
    this.state = 'closed';
    this.select(null);
  }

  select(slotKey) {
    this.slot = slotKey;
    this.circle.setSelected(slotKey);
    this.markRows();
    this.view.setSlot(slotKey);
  }

  // Tecnica FLIP: l'elemento è già nella posizione finale, si anima la differenza dalla posizione di partenza
  train(row, from, order, path) {
    const to = row.getBoundingClientRect();
    const dx = from.left - to.left;
    const dy = from.top - to.top;
    if (reducedMotion.matches || (!dx && !dy)) return Promise.resolve();
    // Tappa intermedia: alla quota finale (giù) oppure alla colonna finale (di lato)
    const middle = path === 'down-then-across' ? `translate(${dx}px, 0)` : `translate(0, ${dy}px)`;
    const animation = row.animate([
      { transform: `translate(${dx}px, ${dy}px)` },
      { transform: middle, offset: 0.5 },
      { transform: 'translate(0, 0)' }
    ], { duration: TRAIN_MS, delay: order * TRAIN_GAP_MS, easing: EASE, fill: 'backwards' });
    return animation.finished.catch(() => {});
  }

  slideCircle(from) {
    const to = this.canvas.getBoundingClientRect();
    const dx = from.left - to.left;
    const dy = from.top - to.top;
    if (reducedMotion.matches || (!dx && !dy)) return Promise.resolve();
    return this.canvas.animate(
      [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }],
      { duration: CIRCLE_MS, easing: EASE, fill: 'backwards' }
    ).finished.catch(() => {});
  }
}
