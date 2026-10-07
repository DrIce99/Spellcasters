// linker-inventory.js - Inventario dei Linker di uno slot (pannello a destra del cerchio, come in Genshin Impact):
// griglia dei Linker posseduti, dettaglio di quello scelto (set, main stat, sub stat, bonus del set) con
// Equipaggia/Sostituisci/Rimuovi, Potenzia (schermata del livello) e Catalizza (cestino).
// Quando il contenuto cambia (altro slot, altro Linker, potenziamento...) i testi nuovi si scrivono (scramble.js).
import { snapshotTexts, scrambleChanged } from './scramble.js';
import {
  LINKER_SLOTS, LINKER_SETS, LINKER_STATS, RARITIES, CURRENCIES, LINKER_MAX_LEVEL, SUB_UPGRADE_EVERY,
  mainStatValue, subStatValue, formatStatValue, expToNextLevel, catalystToLevel, catalystYield
} from '../game/linker-data.js';

const SORTS = {
  rarita: (a, b) => (b.rarita || 0) - (a.rarita || 0) || (b.livello || 0) - (a.livello || 0),
  livello: (a, b) => (b.livello || 0) - (a.livello || 0) || (b.rarita || 0) - (a.rarita || 0)
};
const CONFIRM_MS = 3500; // il cestino resta in attesa di conferma per qualche secondo

const slotLabel = (key) => LINKER_SLOTS.find(s => s.key === key)?.label || key;
const statLabel = (key) => LINKER_STATS[key]?.label || key;
const setOf = (linker) => LINKER_SETS[linker.set] || { name: 'Set sconosciuto', color: 'var(--line-strong)' };
const catalyst = CURRENCIES.catalizzante;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function stars(count) {
  return '★'.repeat(Math.max(0, Math.min(5, count || 0)));
}

function button(className, text, onClick, { title, disabled } = {}) {
  const btn = el('button', className, text);
  btn.type = 'button';
  if (title) btn.title = title;
  btn.disabled = !!disabled;
  btn.addEventListener('click', onClick);
  return btn;
}

export class LinkerInventoryView {
  /**
   * @param {HTMLElement} inventory pannello con [data-role] title, count, sort, grid, detail
   * @param {object} options
   * @param {(slotKey: string) => { items: object[], equipped: object|null, canEdit: boolean, catalyst: number,
   *   setCounts: Record<string, number> }} options.getSlotData
   * @param {(slotKey: string, linker: object|null) => Promise<void>} options.onEquip null = svuota lo slot
   * @param {(linker: object, targetLevel: number) => Promise<{ linker: object, upgraded: string[] }>} options.onLevelUp
   * @param {(linker: object) => Promise<{ gained: number }>} options.onCatalyze
   */
  constructor(inventory, { getSlotData, onEquip, onLevelUp, onCatalyze }) {
    Object.assign(this, { getSlotData, onEquip, onLevelUp, onCatalyze });
    this.root = inventory;
    this.slot = null;
    this.pickedId = null;
    this.sort = 'rarita';
    this.mode = 'detail';          // detail | level (schermata del potenziamento)
    this.targetLevel = null;
    this.busy = false;
    this.highlightSubs = [];       // sub stat appena potenziate (bagliore dopo il potenziamento)
    this.confirmTimer = null;

    this.title = inventory.querySelector('[data-role="title"]');
    this.count = inventory.querySelector('[data-role="count"]');
    this.grid = inventory.querySelector('[data-role="grid"]');
    this.detail = inventory.querySelector('[data-role="detail"]');
    const sortSelect = inventory.querySelector('[data-role="sort"]');
    sortSelect.addEventListener('change', () => {
      this.sort = sortSelect.value;
      this.render();
    });
  }

  setSlot(slotKey) {
    if (slotKey !== this.slot) {
      this.pickedId = null;
      this.mode = 'detail';
    }
    this.slot = slotKey;
    if (slotKey) this.render();
  }

  render() {
    if (!this.slot) return;
    // Pannello già visibile: si animano solo i testi che cambiano (alla comparsa li anima tutti reveal())
    const before = this.root.classList.contains('visible') ? snapshotTexts(this.root) : null;
    const data = this.getSlotData(this.slot);
    const sorted = [...data.items].sort(SORTS[this.sort]);
    // Come in Genshin: si parte da quello equipaggiato, altrimenti dal primo della lista
    const picked = sorted.find(l => l.id === this.pickedId) || data.equipped || sorted[0] || null;
    if (picked?.id !== this.pickedId) this.mode = 'detail';
    this.pickedId = picked?.id ?? null;

    this.title.textContent = slotLabel(this.slot);
    this.count.textContent = String(data.items.length);
    this.grid.replaceChildren(...(sorted.length
      ? sorted.map(linker => this.card(linker, linker === picked, linker.id === data.equipped?.id))
      : [el('li', 'linker-grid-empty', `Non possiedi ancora Linker ${slotLabel(this.slot)}: li trovi nello shop.`)]));

    if (!picked) this.renderEmpty();
    else if (this.mode === 'level' && data.canEdit) this.renderLevelUp(picked, data);
    else this.renderDetail(picked, data);
    if (before) scrambleChanged(this.root, before);
  }

  /** Scrive con l'animazione tutti i testi dell'inventario (quando compare) */
  reveal() {
    scrambleChanged(this.root);
  }

  // --- Griglia ---

  card(linker, picked, isEquipped) {
    const set = setOf(linker);
    const li = el('li', 'linker-card');
    li.dataset.key = linker.id; // per scramble.js: la carta resta la stessa anche se cambia posizione
    li.style.setProperty('--rarity', RARITIES[linker.rarita]?.color || 'var(--line-strong)');
    li.style.setProperty('--set', set.color);
    li.classList.toggle('picked', picked);
    li.tabIndex = 0;
    li.title = `${set.name} · ${RARITIES[linker.rarita]?.name || ''}`;
    li.append(
      el('span', 'linker-card-level', `+${linker.livello || 0}`),
      el('span', 'linker-card-name', statLabel(linker.principale)),
      el('span', 'linker-card-set', set.name),
      el('span', 'linker-card-stars', stars(linker.rarita))
    );
    if (isEquipped) li.append(el('span', 'linker-card-equipped', 'Equipaggiato'));
    const pick = () => {
      if (this.pickedId === linker.id) return;
      this.pickedId = linker.id;
      this.mode = 'detail';
      this.highlightSubs = [];
      this.render();
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

  // --- Dettaglio ---

  renderEmpty() {
    this.detail.replaceChildren(
      el('h4', 'linker-detail-title', `${slotLabel(this.slot)}: vuoto`),
      el('p', 'linker-detail-empty', 'Ottieni Linker di questo tipo dai pacchetti dello shop: qui potrai vederne le statistiche, equipaggiarli e potenziarli.')
    );
  }

  header(linker) {
    const set = setOf(linker);
    const rarity = RARITIES[linker.rarita];
    const title = el('h4', 'linker-detail-title', `${set.name} · ${slotLabel(linker.slot)}`);
    title.style.setProperty('--set', set.color);
    const meta = el('p', 'linker-detail-meta');
    const starsEl = el('span', 'linker-detail-stars', stars(linker.rarita));
    starsEl.style.color = rarity?.color || '';
    meta.append(el('span', null, `${rarity?.name || ''} `), starsEl, el('span', 'linker-detail-level', ` +${linker.livello || 0}`));
    return [title, meta];
  }

  mainStatLine(linker, value = mainStatValue(linker)) {
    const li = el('li', 'linker-stat main');
    li.append(el('span', 'linker-stat-name', statLabel(linker.principale)), el('span', 'linker-stat-value', formatStatValue(linker.principale, value)));
    return li;
  }

  subStatLines(linker) {
    return (linker.secondarie || []).map(sub => {
      const li = el('li', 'linker-stat sub');
      li.classList.toggle('just-upgraded', this.highlightSubs.includes(sub.stat));
      const name = el('span', 'linker-stat-name', statLabel(sub.stat));
      // Numero di potenziamenti, solo per le sub stat migliorate almeno una volta
      if (sub.upgrades > 0) name.append(el('span', 'linker-stat-upgrades', `+${sub.upgrades}`));
      li.append(name, el('span', 'linker-stat-value', formatStatValue(sub.stat, subStatValue(sub))));
      return li;
    });
  }

  setBonus(linker, setCounts) {
    const set = setOf(linker);
    const count = setCounts[linker.set] || 0;
    const box = el('div', 'linker-set');
    box.style.setProperty('--set', set.color);
    box.append(el('p', 'linker-set-name', `${set.name} (${count}/4 equipaggiati)`));
    for (const [pieces, text] of [[2, set.text2], [4, set.text4]]) {
      const line = el('p', 'linker-set-bonus', `${pieces} pezzi: ${text || '—'}`);
      line.classList.toggle('active', count >= pieces);
      box.append(line);
    }
    return box;
  }

  renderDetail(linker, data) {
    const isEquipped = linker.id === data.equipped?.id;
    const stats = el('ul', 'linker-detail-stats');
    stats.append(this.mainStatLine(linker), ...this.subStatLines(linker));

    const actions = el('div', 'linker-detail-actions');
    if (data.canEdit) {
      actions.append(isEquipped
        ? button('linker-action', 'Rimuovi', () => this.run(() => this.onEquip(this.slot, null)))
        : button('linker-action primary', data.equipped ? 'Sostituisci' : 'Equipaggia', () => this.run(() => this.onEquip(this.slot, linker))));
      const maxed = (linker.livello || 0) >= LINKER_MAX_LEVEL;
      actions.append(
        button('linker-icon-btn', '⬆', () => this.openLevelUp(linker), {
          title: maxed ? 'Livello massimo raggiunto' : 'Potenzia (usa Catalizzante)', disabled: maxed
        }),
        this.catalyzeButton(linker)
      );
    }

    this.detail.replaceChildren(
      ...this.header(linker),
      stats,
      this.setBonus(linker, data.setCounts),
      ...(isEquipped ? [el('p', 'linker-detail-badge', 'Equipaggiato')] : []),
      actions
    );
  }

  // Cestino: al primo clic chiede conferma (mostrando il Catalizzante che si otterrà), al secondo catalizza
  catalyzeButton(linker) {
    const gain = catalystYield(linker);
    const btn = button('linker-icon-btn danger', '🗑', () => {
      if (!btn.classList.contains('confirming')) {
        btn.classList.add('confirming');
        btn.textContent = `Catalizza: +${gain} ${catalyst.symbol}`;
        clearTimeout(this.confirmTimer);
        this.confirmTimer = setTimeout(() => {
          btn.classList.remove('confirming');
          btn.textContent = '🗑';
        }, CONFIRM_MS);
        return;
      }
      clearTimeout(this.confirmTimer);
      this.run(async () => {
        await this.onCatalyze(linker);
        this.pickedId = null;
      });
    }, { title: `Catalizza: distrugge il Linker e dà ${gain} ${catalyst.name}` });
    return btn;
  }

  // --- Potenziamento (schermata del livello) ---

  openLevelUp(linker) {
    this.mode = 'level';
    this.targetLevel = Math.min(LINKER_MAX_LEVEL, (linker.livello || 0) + 1);
    this.highlightSubs = [];
    this.render();
  }

  renderLevelUp(linker, data) {
    const level = linker.livello || 0;
    const maxed = level >= LINKER_MAX_LEVEL;
    // Livello più alto raggiungibile con il Catalizzante posseduto
    let affordable = level;
    while (affordable < LINKER_MAX_LEVEL && catalystToLevel(linker, affordable + 1) <= data.catalyst) affordable++;
    this.targetLevel = Math.max(level + 1, Math.min(this.targetLevel || level + 1, LINKER_MAX_LEVEL));
    const target = this.targetLevel;
    const cost = maxed ? 0 : catalystToLevel(linker, target);
    const nextSubLevel = Math.min(LINKER_MAX_LEVEL, (Math.floor(level / SUB_UPGRADE_EVERY) + 1) * SUB_UPGRADE_EVERY);

    // Barra dell'esperienza del livello attuale (si vede solo qui)
    const need = expToNextLevel(level);
    const bar = el('div', 'linker-exp');
    const fill = el('div', 'linker-exp-fill');
    fill.style.width = maxed ? '100%' : `${Math.min(100, ((linker.exp || 0) / need) * 100)}%`;
    bar.append(fill);
    const barText = el('p', 'linker-exp-text', maxed ? 'Livello massimo' : `EXP ${linker.exp || 0} / ${need}`);

    const stepper = el('div', 'linker-level-stepper');
    const setTarget = (value) => {
      this.targetLevel = Math.max(level + 1, Math.min(LINKER_MAX_LEVEL, value));
      this.render();
    };
    stepper.append(
      button('linker-icon-btn', '−', () => setTarget(target - 1), { disabled: maxed || target <= level + 1 }),
      el('span', 'linker-level-target', maxed ? `+${level}` : `+${level} → +${target}`),
      button('linker-icon-btn', '+', () => setTarget(target + 1), { disabled: maxed || target >= LINKER_MAX_LEVEL })
    );
    const shortcuts = el('div', 'linker-level-shortcuts');
    shortcuts.append(
      button('linker-chip', `Prossima sub (+${nextSubLevel})`, () => setTarget(nextSubLevel), { disabled: maxed }),
      button('linker-chip', `Max raggiungibile (+${affordable})`, () => setTarget(affordable), { disabled: maxed || affordable <= level })
    );

    const preview = el('ul', 'linker-detail-stats');
    const mainNow = mainStatValue(linker);
    const mainAfter = mainStatValue({ ...linker, livello: target });
    const mainLine = this.mainStatLine(linker, mainNow);
    if (!maxed) mainLine.querySelector('.linker-stat-value').textContent =
      `${formatStatValue(linker.principale, mainNow)} → ${formatStatValue(linker.principale, mainAfter)}`;
    preview.append(mainLine, ...this.subStatLines(linker));
    const subUpgrades = Math.floor(target / SUB_UPGRADE_EVERY) - Math.floor(level / SUB_UPGRADE_EVERY);

    const owned = el('p', 'linker-level-cost');
    owned.append(
      el('span', null, `Costo: ${cost} ${catalyst.symbol}`),
      el('span', cost > data.catalyst ? 'insufficient' : null, `Posseduto: ${data.catalyst} ${catalyst.symbol}`)
    );

    const actions = el('div', 'linker-detail-actions');
    actions.append(
      button('linker-action', 'Indietro', () => {
        this.mode = 'detail';
        this.render();
      }),
      button('linker-action primary', 'Potenzia', () => this.run(async () => {
        const result = await this.onLevelUp(linker, target);
        this.highlightSubs = result?.upgraded || [];
        this.targetLevel = null;
      }), { disabled: maxed || cost > data.catalyst })
    );

    this.detail.replaceChildren(
      el('h4', 'linker-detail-title', 'Potenziamento'),
      ...this.header(linker),
      bar,
      barText,
      ...(maxed ? [] : [stepper, shortcuts]),
      preview,
      el('p', 'linker-level-note', subUpgrades > 0
        ? `Fino a +${target}: ${subUpgrades} sub stat ${subUpgrades === 1 ? 'verrà potenziata' : 'verranno potenziate'} a caso`
        : `Ogni ${SUB_UPGRADE_EVERY} livelli una sub stat a caso migliora (prossima a +${nextSubLevel})`),
      owned,
      actions
    );
  }

  // Esegue un'azione sul database bloccando i pulsanti finché non finisce
  async run(action) {
    if (this.busy) return;
    this.busy = true;
    this.detail.classList.add('busy');
    try {
      await action();
    } finally {
      this.busy = false;
      this.detail.classList.remove('busy');
      this.render();
    }
  }
}
