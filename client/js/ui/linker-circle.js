// linker-circle.js - Cerchio personale del giocatore (pannello Linker in Info Giocatore).
// È un cerchio magico come quelli di gioco: anelli e segmenti radiali, i 5 slot dei Linker al posto
// delle cariche (ognuno con la sua grafica, vedi linker-art.js) e, al centro, il nome del giocatore
// in rune su un anello racchiuso tra due cerchi.
// Lo slot selezionato ha lo stesso indicatore della carica selezionata in gioco (mirino e/o particelle, dalle
// impostazioni) e, quando si apre il suo inventario, il cerchio fa uno zoom su di lui (animejs).
import { animate } from 'animejs';
import { LINKER_SLOTS } from '../game/linker.js';
import { toRunes, RUNE_CROSS } from './runes.js';
import { loadLinkerArt, getLinkerArt, ART_RING_RADIUS, ART_HALF_SIZE } from './linker-art.js';

// Stesse misure dei cerchi di gioco (engine.js / element-patterns.js), in unità del cerchio
const RADIUS = 120;
const SLOT_ORBIT = RADIUS * 1.2 * 0.92;   // dove stanno le cariche
const SLOT_OUTER = RADIUS * 1.2 * 0.95 * 0.3;
// La grafica del Linker è scalata in modo che il suo anello esterno coincida con quello dello slot
const ART_SIZE = (SLOT_OUTER * ART_HALF_SIZE / ART_RING_RADIUS) * 2;

// Zoom sullo slot aperto: il cerchio si ingrandisce attorno allo slot e il bordo del canvas sfuma,
// così il disegno ingrandito non finisce tagliato di netto contro il resto della pagina
const ZOOM = 2;
const ZOOM_MS = 900;
const ZOOM_FADE = 0.3;                     // parte del raggio del canvas che sfuma a zoom pieno
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// Indicatore dello slot selezionato: lo stesso scelto nelle impostazioni per la carica selezionata in gioco
// ('none' in gioco nasconde l'indicatore, ma qui la selezione deve vedersi: resta il mirino)
const chargeIndicator = localStorage.getItem('chargeIndicator') || 'both';
const SHOW_PARTICLES = chargeIndicator === 'particles' || chargeIndicator === 'both';
const SHOW_RETICLE = chargeIndicator !== 'particles';
const MARKER_GAP = 7;                      // distanza del mirino dall'anello più esterno dello slot

// Angolo (nel sistema del cerchio, prima della rotazione) dello slot i-esimo: il primo in alto, poi in senso orario
function slotAngle(index) {
  return -Math.PI / 2 + (Math.PI * 2 / LINKER_SLOTS.length) * index;
}

// Differenza tra due angoli per la via più breve (tra -π e π)
function angleDiff(from, to) {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}
const RARITY_RING_GAP = 3.2;                // anelli della rarità attorno agli slot equipaggiati: uno per stella
const RARITY_RINGS_MAX = 5;
const ringRadius = (i) => SLOT_OUTER + RARITY_RING_GAP * (i + 1);
// Metà del lato disegnato: ci sta anche il mirino (che pulsa del 6%) attorno allo slot con più anelli
const EXTENT = SLOT_ORBIT + (ringRadius(RARITY_RINGS_MAX - 1) + MARKER_GAP) * 1.06 + 6;
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
    this.markerAngle = null; // angolo del mirino: scorre verso lo slot selezionato
    this.particles = [];
    // Zoom (animato da zoomTo): fattore, distanza dal centro e angolo del punto inquadrato (nel sistema degli slot)
    this.view = { zoom: 1, focusR: 0, focusAngle: 0 };
    this.zoomAnimation = null;
    this.frameScale = 0;   // frame trascorsi dall'ultimo disegno (0 quando il cerchio è fermo)
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
    if (slotKey && !this.selected) this.markerAngle = null; // nuova selezione: il mirino compare già sullo slot
    this.selected = slotKey;
    if (!this.running) this.draw();
  }

  /** Zoom sullo slot indicato (null = di nuovo tutto il cerchio). Se c'è già uno zoom, scorre fino al nuovo slot */
  zoomTo(slotKey) {
    const { view } = this;
    const index = LINKER_SLOTS.findIndex(s => s.key === slotKey);
    const target = index === -1
      ? { zoom: 1, focusR: 0, focusAngle: view.focusAngle }
      : { zoom: ZOOM, focusR: SLOT_ORBIT, focusAngle: view.focusAngle + angleDiff(view.focusAngle, slotAngle(index)) };
    // Partendo da tutto il cerchio il punto inquadrato è il centro: l'angolo si può fissare subito
    if (index !== -1 && view.focusR < 0.5) view.focusAngle = target.focusAngle = slotAngle(index);
    this.zoomAnimation?.pause();
    this.zoomAnimation = null;
    if (reducedMotion.matches) {
      Object.assign(view, target);
      if (!this.running) this.draw();
      return;
    }
    this.zoomAnimation = animate(view, {
      ...target,
      duration: ZOOM_MS,
      ease: 'inOutQuart',
      onUpdate: () => { if (!this.running) this.draw(); }
    });
  }

  /** Torna subito a tutto il cerchio, senza animazione */
  resetZoom() {
    this.zoomAnimation?.pause();
    this.zoomAnimation = null;
    Object.assign(this.view, { zoom: 1, focusR: 0 });
    if (!this.running) this.draw();
  }

  // Punto inquadrato, nel sistema del cerchio dopo la rotazione (gli slot girano di -rotation)
  focusPoint() {
    const { focusR, focusAngle } = this.view;
    const angle = focusAngle - this.rotation;
    return { x: Math.cos(angle) * focusR, y: Math.sin(angle) * focusR };
  }

  /** Slot sotto il punto dello schermo indicato (coordinate del puntatore), oppure null */
  slotAt(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width) return null;
    const scale = rect.width / (EXTENT * 2) * this.view.zoom;
    const focus = this.focusPoint();
    const x = (clientX - rect.left - rect.width / 2) / scale + focus.x;
    const y = (clientY - rect.top - rect.height / 2) / scale + focus.y;
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
    this.frameScale = frameScale;
    this.draw();
    this.frameScale = 0;
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
    const scale = canvas.width / (EXTENT * 2) * this.view.zoom;
    const focus = this.focusPoint();
    ctx.setTransform(scale, 0, 0, scale, canvas.width / 2 - focus.x * scale, canvas.height / 2 - focus.y * scale);

    this.drawGlow();
    ctx.save();
    ctx.rotate(this.rotation);
    this.drawMainRings();
    this.drawNameRing();
    // Come le cariche nei cerchi di gioco: girano al contrario rispetto al cerchio
    ctx.rotate(-2 * this.rotation);
    this.drawSlots();
    if (SHOW_RETICLE) this.drawSelectedMarker();
    ctx.restore();
    if (SHOW_PARTICLES) this.drawParticles();
    this.drawEdgeFade();
  }

  // Durante lo zoom il bordo del canvas sfuma in un cerchio: il disegno ingrandito non ha bordi netti
  drawEdgeFade() {
    const amount = ZOOM_FADE * Math.min(1, Math.max(0, (this.view.zoom - 1) / (ZOOM - 1)));
    if (amount <= 0.001) return;
    const { ctx, canvas } = this;
    const half = canvas.width / 2;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const grad = ctx.createRadialGradient(half, half, half * (1 - amount), half, half, half);
    grad.addColorStop(0, '#000');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.globalCompositeOperation = 'destination-in';
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-over';
  }

  // Colore e misure di uno slot: quelli del set del Linker equipaggiato, altrimenti del cerchio
  slotStyle(key) {
    const linker = this.equipped[key] || null;
    const rings = linker ? Math.min(RARITY_RINGS_MAX, linker.rarity || 0) : 0;
    return { linker, rings, color: linker?.color || this.color, outer: rings ? ringRadius(rings - 1) : SLOT_OUTER };
  }

  // Mirino attorno allo slot selezionato, come quello della carica selezionata in gioco: quattro archi spezzati
  // che pulsano e girano, e che quando la selezione cambia scorrono lungo il cerchio per la via più breve
  drawSelectedMarker() {
    const index = LINKER_SLOTS.findIndex(s => s.key === this.selected);
    if (index === -1) return;
    const target = slotAngle(index);
    if (this.markerAngle === null) this.markerAngle = target;
    // Fermo (cerchio non animato) il mirino non avrebbe frame per scorrere: va subito sullo slot
    this.markerAngle = this.running
      ? this.markerAngle + angleDiff(this.markerAngle, target) * Math.min(1, 0.22 * this.frameScale)
      : target;

    const { ctx } = this;
    const { color, outer } = this.slotStyle(this.selected);
    const radius = (outer + MARKER_GAP) * (1 + Math.sin(performance.now() / 180) * 0.06);
    ctx.save();
    ctx.translate(Math.cos(this.markerAngle) * SLOT_ORBIT, Math.sin(this.markerAngle) * SLOT_ORBIT);
    ctx.rotate(-2 * this.rotation); // in tutto -3 × rotazione, come in gioco
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    for (let k = 0; k < 4; k++) {
      ctx.beginPath();
      ctx.arc(0, 0, radius, k * Math.PI / 2 + 0.3, (k + 1) * Math.PI / 2 - 0.3);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Particelle che si alzano dallo slot selezionato, come quelle della carica selezionata in gioco.
  // Vivono nel sistema del cerchio già ruotato: restano indietro mentre lo slot gira
  drawParticles() {
    const { ctx, particles, frameScale } = this;
    const index = LINKER_SLOTS.findIndex(s => s.key === this.selected);
    if (index !== -1 && frameScale) {
      const angle = slotAngle(index) - this.rotation;
      const { color, outer } = this.slotStyle(this.selected);
      const count = Math.round(6 * frameScale);
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = Math.sqrt(Math.random()) * outer;
        particles.push({
          x: Math.cos(angle) * SLOT_ORBIT + Math.cos(a) * r,
          y: Math.sin(angle) * SLOT_ORBIT + Math.sin(a) * r,
          radius: Math.random() * 2.5 + 1,
          alpha: 0.18 + Math.random() * 0.18,
          dx: (Math.random() - 0.5) * 0.6,
          dy: (Math.random() - 0.5) * 0.6,
          color
        });
      }
    }
    ctx.save();
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      p.x += p.dx * frameScale;
      p.y += p.dy * frameScale;
      p.alpha -= 0.01 * frameScale;
      p.radius *= 0.99 ** frameScale;
      if (p.alpha <= 0.01 || p.radius <= 0.2) particles.splice(i, 1);
    }
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
    const hovered = this.highlight === key;
    const { linker, rings, color, outer } = this.slotStyle(key);
    ctx.save();
    ctx.translate(x, y);
    // La parte superiore della grafica guarda verso l'esterno del cerchio
    ctx.rotate(angle + Math.PI / 2);

    // Slot vuoto: il suo cerchio magico non c'è. Resta solo il vertice del pentagono e, sotto il mouse,
    // un anello tratteggiato per far capire che lo slot si può aprire
    if (!linker) {
      if (hovered) {
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.55;
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 5]);
        ctx.beginPath();
        ctx.arc(0, 0, SLOT_OUTER, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
      return;
    }

    // Lo slot copre il pentagono e gli anelli del cerchio che passano sotto di lui
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(0, 0, outer + 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    // Leggero alone (più forte sotto il mouse); la selezione si vede dal mirino, non da un bagliore
    ctx.shadowColor = color;
    ctx.shadowBlur = hovered ? 18 : 10;
    ctx.fillStyle = color + (hovered ? '30' : '1a');
    ctx.beginPath();
    ctx.arc(0, 0, SLOT_OUTER, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    const art = getLinkerArt(key, color);
    if (art) {
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
