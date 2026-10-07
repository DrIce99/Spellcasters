// linker-inspector.js - Selezione di uno slot dei Linker e inventario (come gli artefatti di Genshin Impact).
// Selezionando uno slot (sul cerchio o nella lista) parte la transizione:
//   1. la lista degli slot a destra si restringe orizzontalmente;
//   2. le voci, una dopo l'altra (a "trenino"), scendono e poi si mettono in fila sotto il cerchio,
//      che intanto si sposta a sinistra;
//   3. a destra compare l'inventario dei Linker di quello slot, con il dettaglio di quello scelto.
// Le voci sotto il cerchio fanno da schede: si cambia slot senza chiudere. ✕ o Esc chiudono (animazione al contrario).
import { LINKER_SLOTS } from '../game/linker.js';

const COMPACT_MS = 380;      // fase 1: la lista si restringe
const TRAIN_MS = 720;        // fase 2: durata del viaggio di ogni voce
const TRAIN_GAP_MS = 80;     // ritardo tra una voce e la successiva
const CIRCLE_MS = 780;
const INVENTORY_MS = 320;    // fase 3: comparsa/sparizione dell'inventario
const EASE = 'cubic-bezier(.65, 0, .35, 1)';

const SORTS = {
  rarita: (a, b) => (b.rarita || 0) - (a.rarita || 0) || (b.livello || 0) - (a.livello || 0),
  livello: (a, b) => (b.livello || 0) - (a.livello || 0) || (b.rarita || 0) - (a.rarita || 0)
};

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const wait = (ms) => new Promise(resolve => setTimeout(resolve, reducedMotion.matches ? 0 : ms));
const label = (slotKey) => LINKER_SLOTS.find(s => s.key === slotKey)?.label || slotKey;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function stars(count) {
  return '★'.repeat(Math.max(0, Math.min(5, count || 0)));
}

export class LinkerInspector {
  /**
   * @param {object} options
   * @param {HTMLElement} options.layout contenitore di cerchio, lista e inventario
   * @param {HTMLCanvasElement} options.canvas
   * @param {HTMLElement} options.list lista degli slot (una riga per slot, con data-slot)
   * @param {HTMLElement} options.inventory pannello dell'inventario
   * @param {import('./linker-circle.js').LinkerCircle} options.circle
   * @param {(slotKey: string) => { items: object[], equipped: object|null, canEdit: boolean }} options.getSlotData
   * @param {(slotKey: string, linker: object) => void} [options.onEquip]
   * @param {(slotKey: string) => void} [options.onUnequip]
   */
  constructor({ layout, canvas, list, inventory, circle, getSlotData, onEquip, onUnequip }) {
    Object.assign(this, { layout, canvas, list, inventory, circle, getSlotData, onEquip, onUnequip });
    this.state = 'closed';     // closed | opening | open | closing
    this.slot = null;          // slot aperto
    this.pickedId = null;      // Linker scelto nella griglia (mostrato nel dettaglio)
    this.sort = 'rarita';

    this.title = inventory.querySelector('[data-role="title"]');
    this.count = inventory.querySelector('[data-role="count"]');
    this.grid = inventory.querySelector('[data-role="grid"]');
    this.detail = inventory.querySelector('[data-role="detail"]');
    const sortSelect = inventory.querySelector('[data-role="sort"]');
    sortSelect.addEventListener('change', () => {
      this.sort = sortSelect.value;
      this.renderInventory();
    });
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
    if (this.slot) this.renderInventory();
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
    if (slotKey !== this.slot) this.pickedId = null;
    this.slot = slotKey;
    this.circle.setSelected(slotKey);
    this.markRows();
    if (slotKey) this.renderInventory();
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

  // --- Inventario: griglia dei Linker dello slot e dettaglio di quello scelto ---

  renderInventory() {
    const { items, equipped, canEdit } = this.getSlotData(this.slot);
    const sorted = [...items].sort(SORTS[this.sort]);
    // Come in Genshin: si parte da quello equipaggiato, altrimenti dal primo della lista
    const picked = sorted.find(l => l.id === this.pickedId) || equipped || sorted[0] || null;
    this.pickedId = picked?.id ?? null;

    this.title.textContent = label(this.slot);
    this.count.textContent = String(items.length);

    if (sorted.length === 0) {
      this.grid.replaceChildren(el('li', 'linker-grid-empty', `Non possiedi ancora Linker ${label(this.slot)}.`));
    } else {
      this.grid.replaceChildren(...sorted.map(linker => this.card(linker, linker === picked, linker.id === equipped?.id)));
    }
    this.renderDetail(picked, equipped, canEdit);
  }

  card(linker, picked, isEquipped) {
    const li = el('li', `linker-card rarity-${linker.rarita || 0}`);
    li.tabIndex = 0;
    li.classList.toggle('picked', picked);
    li.append(
      el('span', 'linker-card-level', `+${linker.livello || 0}`),
      el('span', 'linker-card-name', linker.nome || label(linker.slot)),
      el('span', 'linker-card-stars', stars(linker.rarita))
    );
    if (isEquipped) li.append(el('span', 'linker-card-equipped', 'Equipaggiato'));
    const pick = () => {
      this.pickedId = linker.id;
      this.renderInventory();
    };
    li.addEventListener('click', pick);
    li.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        pick();
      }
    });
    return li;
  }

  renderDetail(linker, equipped, canEdit) {
    const { detail } = this;
    if (!linker) {
      detail.replaceChildren(
        el('h4', 'linker-detail-title', `${label(this.slot)}: vuoto`),
        el('p', 'linker-detail-empty', 'Quando otterrai dei Linker di questo tipo li troverai qui: selezionane uno per vederne le statistiche ed equipaggiarlo.')
      );
      return;
    }
    const isEquipped = linker.id === equipped?.id;
    const rows = [];
    if (linker.principale) rows.push(this.statLine(linker.principale, 'main'));
    for (const sub of linker.secondarie || []) rows.push(this.statLine(sub, 'sub'));

    const actions = el('div', 'linker-detail-actions');
    if (canEdit) {
      if (isEquipped) {
        const remove = el('button', 'linker-action', 'Rimuovi');
        remove.addEventListener('click', () => this.onUnequip?.(this.slot));
        actions.append(remove);
      } else {
        const equip = el('button', 'linker-action primary', equipped ? 'Sostituisci' : 'Equipaggia');
        equip.addEventListener('click', () => this.onEquip?.(this.slot, linker));
        actions.append(equip);
      }
    }

    detail.replaceChildren(
      el('h4', 'linker-detail-title', linker.nome || label(this.slot)),
      el('p', 'linker-detail-meta', `${label(this.slot)} · +${linker.livello || 0}`),
      el('p', `linker-detail-stars rarity-${linker.rarita || 0}`, stars(linker.rarita)),
      ...(rows.length ? [el('ul', 'linker-detail-stats')] : []),
      ...(isEquipped ? [el('p', 'linker-detail-badge', 'Equipaggiato')] : []),
      actions
    );
    detail.querySelector('.linker-detail-stats')?.append(...rows);
  }

  statLine({ nome, valore }, kind) {
    const li = el('li', `linker-stat ${kind}`);
    li.append(el('span', 'linker-stat-name', nome ?? ''), el('span', 'linker-stat-value', valore ?? ''));
    return li;
  }
}
