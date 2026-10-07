// linker-circle.js - Cerchio personale del giocatore (pannello Linker in Info Giocatore).
// È un cerchio magico come quelli di gioco: anelli e segmenti radiali, i 5 slot dei Linker al posto
// delle cariche (ognuno con la sua grafica, vedi linker-art.js) e, al centro, il nome del giocatore
// in rune su un anello racchiuso tra due cerchi.
import { LINKER_SLOTS } from '../game/linker.js';
import { toRunes, RUNE_CROSS } from './runes.js';
import { loadLinkerArt, getLinkerArt, ART_RING_RADIUS, ART_HALF_SIZE } from './linker-art.js';

// Stesse misure dei cerchi di gioco (engine.js / element-patterns.js), in unità del cerchio
const RADIUS = 120;
const SLOT_ORBIT = RADIUS * 1.2 * 0.92;   // dove stanno le cariche
const SLOT_OUTER = RADIUS * 1.2 * 0.95 * 0.3;
// La grafica del Linker è scalata in modo che il suo anello esterno coincida con quello dello slot
const ART_SIZE = (SLOT_OUTER * ART_HALF_SIZE / ART_RING_RADIUS) * 2;
const EMPTY_SLOT_ALPHA = 0.75;             // slot senza Linker: grafica un po' spenta
const SELECTED_SLOT_SCALE = 1.12;          // lo slot selezionato si ingrandisce un po'

// Angolo (nel sistema del cerchio, prima della rotazione) dello slot i-esimo: il primo in alto, poi in senso orario
function slotAngle(index) {
  return -Math.PI / 2 + (Math.PI * 2 / LINKER_SLOTS.length) * index;
}
const RARITY_RING_GAP = 3.2;                // anelli della rarità attorno agli slot equipaggiati: uno per stella
const RARITY_RINGS_MAX = 5;
const EXTENT = SLOT_ORBIT + (SLOT_OUTER + RARITY_RING_GAP * (RARITY_RINGS_MAX + 1)) * 1.12; // metà del lato disegnato
const ROTATION_SPEED = 0.003;              // per frame a 60fps, come circleRotation in engine.js

// Anello del nome: le rune sono distribuite in modo uniforme su tutto l'anello (anche tra l'ultima e la prima
// c'è la stessa distanza), e tra una runa e l'altra ci sono almeno due altezze del font. La fascia tra i due
// cerchi è alta il doppio del font. Il raggio cresce con la lunghezza del nome (più lungo = anello più largo),
// finché resta dentro il cerchio principale: oltre, il font si rimpicciolisce.
const RUNE_FONT_MAX = 13;
const RUNE_RING_MAX = RADIUS * 0.8;        // cerchio esterno della fascia del nome
// Le rune staveless usano anche segni non runici (⸝ ˏ ╵ ◟...): servono font di simboli come riserva
const RUNE_FONT_FAMILY = "'Noto Sans Runic', 'Segoe UI Historic', 'Segoe UI Symbol', 'Noto Sans Symbols 2', sans-serif";

/** Misure dell'anello del nome per n rune: font, raggio, passo angolare tra le rune */
export function runeRingLayout(count) {
  let font = RUNE_FONT_MAX;
  // Raggio "naturale": la circonferenza contiene esattamente le rune alla distanza minima (2 × font)
  let radius = (count * 2 * font) / (2 * Math.PI);
  if (radius + font > RUNE_RING_MAX) {
    font = RUNE_RING_MAX / (count / Math.PI + 1);
    radius = (count * 2 * font) / (2 * Math.PI);
  }
  // Nomi corti: il raggio non scende sotto un minimo, quindi le rune si allargano oltre la distanza minima
  radius = Math.max(radius, font * 2.4);
  return { font, radius, step: (2 * Math.PI) / count };
}

export class LinkerCircle {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {{ color: string, name: string, alphabet?: string,
   *   equipped?: Record<string, { color: string, rarity: number } | null> }} options
   *   equipped: per ogni slot il colore del set e la rarità del Linker equipaggiato
   */
  constructor(canvas, { color, name, alphabet, equipped = {} }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.color = color;
    this.equipped = equipped;
    this.highlight = null; // slot sotto il mouse (sul cerchio o sulla sua riga nella lista)
    this.selected = null;  // slot aperto nell'inventario
    this.rotation = 0;
    this.running = false;
    this.lastTime = 0;
    this.alphabet = alphabet;
    this.setName(name);
    this.frame = this.frame.bind(this);
    // Le grafiche dei Linker arrivano dopo: appena pronte il cerchio si ridisegna
    loadLinkerArt().then(() => { if (!this.running) this.draw(); });
  }

  setName(name) {
    this.name = name;
    this.runes = [RUNE_CROSS, ...toRunes(name, this.alphabet)]; // la croce in alto segna l'inizio, il nome segue in senso orario
    this.ring = runeRingLayout(this.runes.length);
    if (!this.running) this.draw();
  }

  setAlphabet(alphabet) {
    this.alphabet = alphabet;
    this.setName(this.name);
  }

  setColor(color) {
    this.color = color;
    if (!this.running) this.draw();
  }

  setHighlight(slotKey) {
    this.highlight = slotKey;
    if (!this.running) this.draw();
  }

  setSelected(slotKey) {
    this.selected = slotKey;
    if (!this.running) this.draw();
  }

  /** Slot sotto il punto dello schermo indicato (coordinate del puntatore), oppure null */
  slotAt(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width) return null;
    const scale = rect.width / (EXTENT * 2);
    const x = (clientX - rect.left - rect.width / 2) / scale;
    const y = (clientY - rect.top - rect.height / 2) / scale;
    // Gli slot girano al contrario del cerchio: in tutto ruotano di -rotation (vedi draw)
    const index = LINKER_SLOTS.findIndex((_, i) => {
      const angle = slotAngle(i) - this.rotation;
      return Math.hypot(x - Math.cos(angle) * SLOT_ORBIT, y - Math.sin(angle) * SLOT_ORBIT) <= SLOT_OUTER;
    });
    return index === -1 ? null : LINKER_SLOTS[index].key;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.frame);
  }

  stop() {
    this.running = false;
  }

  frame(now) {
    if (!this.running) return;
    const frameScale = Math.min(now - this.lastTime, 50) / (1000 / 60);
    this.lastTime = now;
    this.rotation += ROTATION_SPEED * frameScale;
    this.draw();
    requestAnimationFrame(this.frame);
  }

  // Il canvas segue la sua dimensione CSS e la densità dello schermo
  resize() {
    const dpr = window.devicePixelRatio || 1;
    const size = Math.round(this.canvas.clientWidth * dpr);
    if (size > 0 && this.canvas.width !== size) this.canvas.width = this.canvas.height = size;
  }

  draw() {
    this.resize();
    const { ctx, canvas } = this;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const scale = canvas.width / (EXTENT * 2);
    ctx.setTransform(scale, 0, 0, scale, canvas.width / 2, canvas.height / 2);

    this.drawGlow();
    ctx.save();
    ctx.rotate(this.rotation);
    this.drawMainRings();
    this.drawNameRing();
    // Come le cariche nei cerchi di gioco: girano al contrario rispetto al cerchio
    ctx.rotate(-2 * this.rotation);
    this.drawSlots();
    ctx.restore();
  }

  drawGlow() {
    const { ctx, color } = this;
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, RADIUS + 30);
    grad.addColorStop(0, color + '33');
    grad.addColorStop(0.7, color + '14');
    grad.addColorStop(1, color + '00');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, RADIUS + 30, 0, Math.PI * 2);
    ctx.fill();
  }

  // Stessa struttura di drawMagicCircle in engine.js: due anelli e 24 segmenti radiali
  drawMainRings() {
    const { ctx, color } = this;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    for (const r of [RADIUS, RADIUS + 20]) {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.lineWidth = 1;
    for (let i = 0; i < 24; i++) {
      const angle = (Math.PI * 2 / 24) * i;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * (RADIUS + 20), Math.sin(angle) * (RADIUS + 20));
      ctx.lineTo(Math.cos(angle) * RADIUS, Math.sin(angle) * RADIUS);
      ctx.stroke();
    }
  }

  // Nome in rune lungo un anello, racchiuso tra due cerchi distanti il doppio dell'altezza del font
  drawNameRing() {
    const { ctx, color, runes } = this;
    const { font, radius, step } = this.ring;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    for (const r of [radius - font, radius + font]) {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = color;
    ctx.font = `${font}px ${RUNE_FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const start = -Math.PI / 2;
    runes.forEach((rune, i) => {
      ctx.save();
      ctx.rotate(start + i * step + Math.PI / 2);
      ctx.fillText(rune, 0, -radius);
      ctx.restore();
    });
  }

  drawSlots() {
    const { ctx, color } = this;
    const points = LINKER_SLOTS.map((_, i) => {
      const angle = slotAngle(i);
      return { x: Math.cos(angle) * SLOT_ORBIT, y: Math.sin(angle) * SLOT_ORBIT, angle };
    });

    // Pentagono che collega gli slot, come il poligono delle cariche
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2;
    ctx.globalAlpha = 0.85;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    LINKER_SLOTS.forEach(({ key }, i) => this.drawSlot(key, points[i]));
  }

  drawSlot(key, { x, y, angle }) {
    const { ctx } = this;
    const selected = this.selected === key;
    const active = selected || this.highlight === key;
    const linker = this.equipped[key] || null;
    const equipped = !!linker;
    // Slot con un Linker: tutto nel colore del suo set
    const color = linker?.color || this.color;
    const rings = equipped ? Math.min(RARITY_RINGS_MAX, linker.rarity || 0) : 0;
    const ringRadius = (i) => SLOT_OUTER + RARITY_RING_GAP * (i + 1);
    ctx.save();
    ctx.translate(x, y);
    // La parte superiore della grafica guarda verso l'esterno del cerchio
    ctx.rotate(angle + Math.PI / 2);
    if (selected) ctx.scale(SELECTED_SLOT_SCALE, SELECTED_SLOT_SCALE);
    // Lo slot copre il pentagono e gli anelli del cerchio che passano sotto di lui
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(0, 0, (rings ? ringRadius(rings - 1) : SLOT_OUTER) + 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    if (active || equipped) {
      ctx.shadowColor = color;
      ctx.shadowBlur = selected ? 26 : active ? 18 : 10;
      ctx.fillStyle = color + (selected ? '40' : active ? '30' : '1a');
      ctx.beginPath();
      ctx.arc(0, 0, SLOT_OUTER, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    const art = getLinkerArt(key, color);
    if (art) {
      ctx.globalAlpha = active || equipped ? 1 : EMPTY_SLOT_ALPHA;
      ctx.drawImage(art, -ART_SIZE / 2, -ART_SIZE / 2, ART_SIZE, ART_SIZE);
    } else {
      // Grafica non ancora caricata: solo l'anello dello slot
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.7;
      ctx.beginPath();
      ctx.arc(0, 0, SLOT_OUTER, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Rarità: anelli concentrici esterni, uno per stella, nel colore del set
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2;
    for (let i = 0; i < rings; i++) {
      ctx.beginPath();
      ctx.arc(0, 0, ringRadius(i), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
}
