// engine.js - Motore di gioco: disegno dei simboli, cerchi magici, proiezioni, mana ed esperienza.
// Usato da lab.html (laboratorio) e da game.html (training e PvP).
import DollarRecognizer from "./dollar-recognizer.js";
import { drawManaSegments, setManaValues, getManaValues, setCurrentMana, getCurrentMana } from "./manabar.js";
import { drawElementPattern, drawProjectilePolygonPattern } from "./element-patterns.js";
import { loadPlayerFromDB, savePlayerData, incrementPlayerCounters, getCurrentUsername } from "../services/player-db.js";
import { VirtualMouseEntity, globalCollisionSystem } from "./collision-system.js";
import { Spark } from "./sparks.js";
import { drawParticleShape } from "./particle-shapes.js";
import { PvPManager } from "./pvp-manager.js";
import { applyCameraShake, triggerCameraShake, updateRedOverlay, drawRedOverlay } from './damage-effects.js';
import { statusEffectManager, applyElementalHit, updateStatusEffects, createElementalDebuffParticles } from "./status-effects.js";
import { audioManager } from './audio-manager.js';
import { isElement, getElementColor, parseColor, withAlpha, NEUTRAL_COLOR, EMPTY_CIRCLE_COLOR, DEFAULT_SPAZIALE_COLOR } from './elements.js';
import { getExpToNext, BURNOUT_FRAMES } from './progression.js';
import {
  computePlayerStats, getRecognitionThreshold, applyElementDefense, SPATIAL_DAMAGE_AREA_UNIT
} from './player-stats.js';
import {
  getInteraction, blocksProjectiles, VARIANT_COLORS,
  LUSH_DURATION_MS, MAGMA_DURATION_MS, MAGMA_TRAIL_MS, LUSH_MANA_REGEN_MULTIPLIER
} from './spell-interactions.js';

const recognizer = new DollarRecognizer();
const username = getCurrentUsername();

const canvas = document.getElementById("spellCanvas");
canvas.addEventListener("contextmenu", (e) => e.preventDefault());
const ctx = canvas.getContext("2d");

// === AREA DI GIOCO ===
// Tutte le coordinate di gioco (mouse, cerchi, proiettili, aree) sono nel "mondo".
// Nel training il mondo è l'intero schermo; nel PvP è un quadrato di lato fisso, uguale
// per i due giocatori, centrato e rimpicciolito se la finestra è più piccola.
const world = { width: 0, height: 0, scale: 1, offsetX: 0, offsetY: 0, fixedSize: getPvPArenaSize() };

function getPvPArenaSize() {
  if (new URLSearchParams(window.location.search).get('mode') !== 'pvp') return null;
  try {
    const matchData = JSON.parse(localStorage.getItem('currentMatchData'));
    if (matchData?.arenaSize > 0) return matchData.arenaSize;
  } catch { /* dati assenti o corrotti: si usa il ripiego */ }
  // Server vecchio senza arenaSize: almeno il quadrato resta dentro questo schermo
  return Math.min(window.innerWidth, window.innerHeight);
}

function layoutWorld() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  if (world.fixedSize) {
    world.width = world.height = world.fixedSize;
    world.scale = Math.min(1, canvas.width / world.width, canvas.height / world.height);
  } else {
    world.width = canvas.width;
    world.height = canvas.height;
    world.scale = 1;
  }
  world.offsetX = (canvas.width - world.width * world.scale) / 2;
  world.offsetY = (canvas.height - world.height * world.scale) / 2;
}
layoutWorld();

// === COSTANTI ===
const PROJECTILE_SPEED = 16;
const PROJECTILE_MANA_COST = 2;
const ELEMENT_MANA_COST = 1;
const MIN_LAUNCH_DISTANCE = 30;
const CIRCLE_RADIUS = 120;
const DRAW_SOUND_THROTTLE = 100;
const COUNTERS_SAVE_INTERVAL_MS = 1000;
const MANA_SAVE_INTERVAL_MS = 15000;

// === STATO DI GIOCO ===
let casting = false;
let points = [];               // punti del simbolo che si sta disegnando (tasto Z)
let particles = [];            // scia del disegno
let activeMagicParticles = [];
let fireParticles = [];
let projectiles = [];

// Cerchio magico: { x, y, radius, thickness, elemento, projections: [] }
// L'elemento appartiene al cerchio: quando il cerchio sparisce sparisce anche l'infusione,
// così un proiettile disegnato dopo è sempre neutro.
let magicCircle = null;
let circleRotation = 0;

let permanentSpazialeAreas = [];

// === STATO DELL'INPUT ===
let pointerDownOnCircle = false;
let isActivatingMagicCircle = false;   // trascinamento dal cerchio per lanciare una proiezione
let magicCircleDragStart = null;
let magicCircleDragEnd = null;
let isDrawingSpaziale = false;         // disegno del perimetro di un'area spaziale
let spazialePolygonPoints = [];
let spazialePolygonColor = DEFAULT_SPAZIALE_COLOR;
let lastDrawSoundTime = 0;

const particleCount = Number(localStorage.getItem('particleCount')) || 60;

// Mouse virtuale: con il pointer lock segue il mouse reale con un po' di inerzia
const virtualMouse = { x: world.width / 2, y: world.height / 2 };
const mouseTarget = { x: virtualMouse.x, y: virtualMouse.y };
const virtualMouseEntity = new VirtualMouseEntity(virtualMouse.x, virtualMouse.y);
globalCollisionSystem.registerEntity(virtualMouseEntity);

// Effetti di stato sul giocatore locale (aggiornati da status-effects.js)
const playerStatus = { speedMultiplier: 1, controlsInverted: false, stunned: false };

let collisionSparks = [];

let pvpManager = null;
let gameMode = 'training'; // 'training' | 'pvp'
let playerLife = 100;      // vita fuori dal PvP

// === PROGRESSIONE (caricata da Firebase) ===
let playerStats = computePlayerStats({}); // valori base finché non arriva il profilo
let playerLevel = 1;
let playerExp = 0;
let playerLoaded = false;

// Buffer salvati periodicamente su Firebase
let affinityToAdd = {};
let proiezioniToAdd = {};
let expToAdd = 0;

// L'esperienza si guadagna solo in una partita PvP online (non in training né in laboratorio)
function addExp(amount) {
  if (pvpManager && pvpManager.matchState === 'active') expToAdd += amount;
}
let lastCountersSave = Date.now();
let lastManaSave = Date.now();
let lastSavedMana = null;


// ============================================================
// INIZIALIZZAZIONE
// ============================================================

function initializeGameMode() {
  const params = new URLSearchParams(window.location.search);
  gameMode = params.get('mode') === 'pvp' ? 'pvp' : 'training';

  if (gameMode === 'pvp') {
    if (!localStorage.getItem('currentMatchData')) {
      console.error('❌ Dati match non trovati, ritorno all\'arena');
      window.location.href = '/arena.html';
      return;
    }
    pvpManager = new PvPManager(canvas, ctx, world);
    pvpManager.onAreaGranted = receiveGrantedArea;
    console.log('🎮 Modalità PvP inizializzata');
  }
  registerPlayerStatusCallbacks();
}

function registerPlayerStatusCallbacks() {
  statusEffectManager.registerMovementCallback('player', (modifier) => {
    playerStatus.speedMultiplier = modifier.speedMultiplier;
  });
  statusEffectManager.registerControlCallback('player', (inverted) => {
    playerStatus.controlsInverted = inverted;
  });
  statusEffectManager.registerStunCallback('player', (stunned) => {
    playerStatus.stunned = stunned;
  });

  // Nel PvP danni e particelle degli effetti sono gestiti dal PvPManager
  if (!pvpManager) {
    statusEffectManager.registerDamageCallback('player', (damage, source) => {
      const element = source === 'burning' ? 'fuoco' : null;
      playerLife = Math.max(0, playerLife - applyElementDefense(damage, playerStats, element));
      triggerCameraShake(5, 150);
    });
    statusEffectManager.registerVisualCallback('player', (effectType, element) => {
      if (effectType === 'debuff_particles') {
        createElementalDebuffParticles(element, virtualMouse, activeMagicParticles);
      }
    });
  }
}

async function loadPlayerProgress() {
  let player = null;
  try {
    player = await loadPlayerFromDB(username);
  } catch (error) {
    console.error('❌ Impossibile caricare il giocatore:', error);
  }
  if (player) {
    playerLevel = player.livello || 1;
    playerExp = player.esperienza || 0;
  }
  // Mana, vita, ATK e difese dipendono dai punti abilità e dall'affinità, non dal livello
  playerStats = computePlayerStats(player || {});
  setManaValues({ max: playerStats.mp, regen: playerStats.manaRegenPerFrame });
  playerLife = playerStats.hp;
  if (pvpManager) pvpManager.setPlayerStats(playerStats);

  // Il mana salvato si ricarica anche mentre si è offline
  const max = playerStats.mp;
  let mana = max;
  if (player && typeof player.mana === 'number' && typeof player.manaUpdatedAt === 'number') {
    const elapsedFrames = (Date.now() - player.manaUpdatedAt) / 1000 * 60;
    mana = Math.min(max, player.mana + elapsedFrames * playerStats.manaRegenPerFrame);
  }
  setCurrentMana(mana);
  lastSavedMana = mana;
  playerLoaded = true;
  drawExpBar();
}

// Nel PvP si possono lanciare magie solo a partita iniziata
function canAct() {
  return !pvpManager || pvpManager.matchState === 'active';
}

function isPointerLocked() {
  return document.pointerLockElement === canvas;
}


// ============================================================
// INPUT: MOUSE
// ============================================================

canvas.addEventListener("click", () => {
  audioManager.resumeContext();
  // Richiedere il lock quando è già attivo fa scattare di nuovo 'pointerlockchange':
  // lo chiediamo solo se serve davvero.
  if (!isPointerLocked()) {
    canvas.requestPointerLock();
    canvas.focus();
  }
});

canvas.addEventListener("mousedown", (e) => {
  // Il click che serve a riprendere il controllo del mouse non deve lanciare magie
  if (!isPointerLocked() || !canAct()) return;

  if (e.button === 2) {
    cancelAtVirtualMouse();
    return;
  }
  if (e.button !== 0 || !magicCircle) return;

  const dist = Math.hypot(virtualMouse.x - magicCircle.x, virtualMouse.y - magicCircle.y);
  if (dist > magicCircle.radius + 20) return;

  pointerDownOnCircle = true;
  const tipo = peekProjection();
  if (tipo === "spaziale") {
    isDrawingSpaziale = true;
    spazialePolygonPoints = [];
    spazialePolygonColor = magicCircle.elemento ? getElementColor(magicCircle.elemento) : DEFAULT_SPAZIALE_COLOR;
  } else if (tipo) {
    isActivatingMagicCircle = true;
    magicCircleDragStart = { x: magicCircle.x, y: magicCircle.y };
    magicCircleDragEnd = { x: virtualMouse.x, y: virtualMouse.y };
  }
});

canvas.addEventListener("mousemove", (e) => {
  if (!isPointerLocked()) return;

  let movementX = e.movementX;
  let movementY = e.movementY;
  // 🌪️ Aria: controlli invertiti
  if (playerStatus.controlsInverted) {
    movementX = -movementX;
    movementY = -movementY;
  }
  // Il movimento è in pixel dello schermo: lo riportiamo alla scala del mondo
  mouseTarget.x = Math.max(0, Math.min(world.width, mouseTarget.x + movementX / world.scale));
  mouseTarget.y = Math.max(0, Math.min(world.height, mouseTarget.y + movementY / world.scale));

  if (isDrawingSpaziale) {
    spazialePolygonPoints.push({ x: virtualMouse.x, y: virtualMouse.y });
    return;
  }
  if (isActivatingMagicCircle) {
    magicCircleDragEnd = { x: virtualMouse.x, y: virtualMouse.y };
  }
  if (casting) {
    const point = { x: virtualMouse.x, y: virtualMouse.y };
    points.push(point);
    particles.push(createTrailParticle(point.x, point.y));

    const now = Date.now();
    if (now - lastDrawSoundTime > DRAW_SOUND_THROTTLE) {
      audioManager.playDrawingSound();
      lastDrawSoundTime = now;
    }
    // Feedback: il bordo si illumina se il gesto somiglia a qualcosa di noto
    if (points.length > 5) {
      const partialResult = recognizer.recognize(points.slice(-10));
      canvas.style.boxShadow = partialResult.score > 0.5 ? `0 0 15px ${getElementColor(partialResult.name)}` : "none";
    }
  }
});

canvas.addEventListener("mouseup", (e) => {
  if (e.button !== 0) return;
  const wasOnCircle = pointerDownOnCircle;
  pointerDownOnCircle = false;

  // Fine disegno area spaziale (lo stato viene sempre azzerato, anche se l'area è troppo piccola)
  if (isDrawingSpaziale) {
    const polygon = spazialePolygonPoints;
    isDrawingSpaziale = false;
    spazialePolygonPoints = [];
    if (polygon.length > 2 && magicCircle && canCast()) {
      castSpazialeFromCircle(polygon);
    }
    return;
  }

  // Fine trascinamento: lancia una proiezione dal cerchio
  if (isActivatingMagicCircle) {
    const start = magicCircleDragStart;
    const end = magicCircleDragEnd;
    isActivatingMagicCircle = false;
    magicCircleDragStart = null;
    magicCircleDragEnd = null;
    if (magicCircle && canCast()) launchFromCircle(start, end);
    return;
  }

  // Click su un cerchio con solo l'elemento: mostra l'effetto dell'elemento
  if (wasOnCircle && magicCircle && magicCircle.elemento && canCast()) {
    showElementEffect(magicCircle.elemento, magicCircle);
    incrementaAffinitaBuffer(magicCircle.elemento);
    audioManager.playElementSpellSound(magicCircle.elemento);
  }
});

// Uscendo dal gioco (ESC) o rientrando si annullano solo le azioni a metà:
// il cerchio magico e le sue cariche restano dove sono.
document.addEventListener('pointerlockchange', resetInputState);

function resetInputState() {
  casting = false;
  points = [];
  pointerDownOnCircle = false;
  isActivatingMagicCircle = false;
  magicCircleDragStart = null;
  magicCircleDragEnd = null;
  isDrawingSpaziale = false;
  spazialePolygonPoints = [];
  canvas.style.boxShadow = "none";
}

window.addEventListener("resize", layoutWorld);


// ============================================================
// INPUT: TASTIERA (i tasti N/G per il tema sono gestiti da theme.js)
// ============================================================

window.addEventListener("keydown", (e) => {
  if ((e.key === "z" || e.key === "Z") && !casting && canAct()) {
    casting = true;
    points = [];
  }

  // 🧪 Test degli effetti di stato (solo fuori dal PvP)
  if (!pvpManager) {
    const testEffects = { '1': 'fuoco', '2': 'acqua', '3': 'aria', '4': 'terra' };
    if (testEffects[e.key]) applyElementalHit(testEffects[e.key], 'player');
  }
});

window.addEventListener("keyup", (e) => {
  if ((e.key === "z" || e.key === "Z") && casting) {
    casting = false;
    recognizeSpell(points);
    points = [];
    canvas.style.boxShadow = "none";
  }
  if ((e.key === 'x' || e.key === 'X') && isPointerLocked() && canAct()) {
    cancelAtVirtualMouse();
  }
});


// ============================================================
// RICONOSCIMENTO DEI SIMBOLI
// ============================================================

// Ogni simbolo ha la sua soglia: l'affinità con un elemento ne tollera disegni più imprecisi.
// Vince il simbolo che supera la propria soglia con più margine.
function pickRecognizedSymbol(stroke) {
  const scores = recognizer.scoresByName(stroke);
  let best = null;
  let bestMargin = 0;
  for (const [name, score] of Object.entries(scores)) {
    const margin = score - getRecognitionThreshold(playerStats, name);
    if (margin > bestMargin) {
      bestMargin = margin;
      best = name;
    }
  }
  return best;
}

function recognizeSpell(stroke) {
  if (stroke.length < 10) return null;
  const name = pickRecognizedSymbol(stroke);
  if (!name) return null;

  // Dentro un cerchio magico i simboli caricano il cerchio invece di lanciare
  if (magicCircle) {
    if (name === "proiettile" || name === "spaziale") {
      magicCircle.projections.push(name);
      return name;
    }
    if (isElement(name)) {
      magicCircle.elemento = name;
      incrementaAffinitaBuffer(name);
      return name;
    }
  }

  if (name === "cerchio") {
    createMagicCircle();
  } else if (name === "proiettile") {
    // Proiettile libero: sempre mana puro (neutro)
    launchProjectile(stroke[0], stroke[stroke.length - 1]);
  } else if (isElement(name)) {
    if (spendMana(ELEMENT_MANA_COST)) {
      showElementEffect(name, virtualMouse);
      incrementaAffinitaBuffer(name);
      audioManager.playElementSpellSound(name);
    }
  }
  return name;
}


// ============================================================
// CERCHIO MAGICO
// ============================================================

function createMagicCircle() {
  magicCircle = {
    x: virtualMouse.x,
    y: virtualMouse.y,
    radius: CIRCLE_RADIUS,
    thickness: 3,
    elemento: null,
    projections: []
  };
}

function removeMagicCircle() {
  magicCircle = null;
  if (pvpManager && pvpManager.isActive()) {
    pvpManager.sendMagicCircleUpdate(null);
  }
}

// Le cariche si usano dall'ultima aggiunta (FILO)
function peekProjection() {
  if (!magicCircle || magicCircle.projections.length === 0) return null;
  return magicCircle.projections[magicCircle.projections.length - 1];
}

// Consuma UNA carica; se erano finite il cerchio sparisce (le aree spaziali restano)
function consumeCharge() {
  magicCircle.projections.pop();
  if (magicCircle.projections.length === 0) {
    removeMagicCircle();
  }
}

function canCast() {
  return canAct() && !getManaValues().inBurnout;
}

function launchFromCircle(start, end) {
  const tipo = peekProjection();
  if (!tipo || tipo === 'spaziale') return;
  // La carica si consuma solo se il lancio riesce (trascinamento abbastanza lungo e mana sufficiente)
  if (launchProjectile(start, end, { element: magicCircle.elemento, tipo })) {
    consumeCharge();
  }
}

function castSpazialeFromCircle(polygon) {
  polygon.push({ ...polygon[0] }); // chiude il poligono
  activateSpazialeArea(polygon, spazialePolygonColor, magicCircle.elemento);
  incrementaProiezioneUsataBuffer("spaziale");
  consumeCharge();
}

// Tasto destro / X: cancella l'area spaziale sotto il mouse, altrimenti il cerchio magico
function cancelAtVirtualMouse() {
  const mouse = { x: virtualMouse.x, y: virtualMouse.y };

  for (let i = permanentSpazialeAreas.length - 1; i >= 0; i--) {
    if (pointInPolygon(mouse, permanentSpazialeAreas[i].points)) {
      removeSpazialeAreaAt(i);
      return;
    }
  }

  if (!magicCircle) return;
  const dist = Math.hypot(mouse.x - magicCircle.x, mouse.y - magicCircle.y);
  if (dist <= magicCircle.radius) {
    // La cancellazione manuale del cerchio rimuove anche le aree spaziali
    removeAllSpazialeAreas();
    removeMagicCircle();
  }
}

function drawMagicCircle() {
  if (!magicCircle) return;
  const { x, y, radius, thickness, elemento } = magicCircle;
  const circleColor = elemento ? getElementColor(elemento) : EMPTY_CIRCLE_COLOR;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(circleRotation);
  ctx.translate(-x, -y);

  // Glow radiale
  if (elemento) {
    const glowRadius = radius + 24;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
    grad.addColorStop(0, circleColor + 'cc');
    grad.addColorStop(0.45, circleColor + '44');
    grad.addColorStop(0.85, circleColor + '11');
    grad.addColorStop(1, circleColor + '00');
    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.beginPath();
    ctx.arc(x, y, glowRadius, 0, 2 * Math.PI);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();

    drawElementPattern(ctx, x, y, radius * 0.82, elemento);
  }

  // Cariche (proiezioni) disposte a poligono
  if (magicCircle.projections.length > 0) {
    drawProjectilePolygonPattern(ctx, x, y, radius * 1.2, magicCircle.projections.length,
      circleColor, -2 * circleRotation, magicCircle.projections);
  }

  // Cerchi principali
  ctx.lineWidth = thickness;
  ctx.strokeStyle = circleColor;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, radius + 20, 0, 2 * Math.PI);
  ctx.stroke();

  // Segmenti radiali
  ctx.lineWidth = 1;
  const numSegments = 24;
  for (let i = 0; i < numSegments; i++) {
    const angle = (2 * Math.PI / numSegments) * i;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(angle) * (radius + 20), y + Math.sin(angle) * (radius + 20));
    ctx.lineTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
    ctx.stroke();
  }
  ctx.restore();

  // Particelle fluttuanti attorno al cerchio
  for (let i = 0; i < 4; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = radius + 10 + Math.random() * 15;
    activeMagicParticles.push({
      x: x + Math.cos(angle + circleRotation) * dist,
      y: y + Math.sin(angle + circleRotation) * dist,
      radius: Math.random() * 1.5 + 0.5,
      alpha: 0.1 + Math.random() * 0.1,
      dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.3,
      color: circleColor,
      element: elemento
    });
  }
}

// Particelle sulla carica che verrà usata per prima
function drawNextChargeParticles() {
  if (!magicCircle || magicCircle.projections.length < 1) return;

  const count = magicCircle.projections.length;
  const angle = -Math.PI / 2 + (2 * Math.PI / count) * (count - 1) - circleRotation;
  const r = magicCircle.radius * 1.1;
  const x = magicCircle.x + Math.cos(angle) * r;
  const y = magicCircle.y + Math.sin(angle) * r;
  const color = magicCircle.elemento ? getElementColor(magicCircle.elemento) : EMPTY_CIRCLE_COLOR;

  for (let i = 0; i < 6; i++) {
    activeMagicParticles.push({
      x: x + (Math.random() - 0.5) * 12,
      y: y + (Math.random() - 0.5) * 12,
      radius: Math.random() * 2 + 1,
      alpha: 0.18 + Math.random() * 0.18,
      dx: (Math.random() - 0.5) * 0.5,
      dy: (Math.random() - 0.5) * 0.5,
      color,
      element: magicCircle.elemento
    });
  }
}

function drawMagicCircleDragTrail() {
  if (!isActivatingMagicCircle || !magicCircleDragStart || !magicCircleDragEnd || !magicCircle) return;
  ctx.save();
  ctx.globalAlpha = 0.7;
  ctx.lineWidth = 8;
  ctx.strokeStyle = magicCircle.elemento ? getElementColor(magicCircle.elemento) : withAlpha(NEUTRAL_COLOR, 0.7);
  ctx.beginPath();
  ctx.moveTo(magicCircleDragStart.x, magicCircleDragStart.y);
  ctx.lineTo(magicCircleDragEnd.x, magicCircleDragEnd.y);
  ctx.stroke();
  ctx.restore();
}


// ============================================================
// PROIEZIONE: PROIETTILE
// ============================================================

/**
 * Lancia un proiettile da start verso end.
 * @returns {boolean} true se il proiettile è partito (serve per decidere se consumare la carica)
 */
function launchProjectile(start, end, { element = null, tipo = "proiettile" } = {}) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const dist = Math.hypot(dx, dy);
  if (dist < MIN_LAUNCH_DISTANCE) return false;
  if (!spendMana(PROJECTILE_MANA_COST)) return false;

  const vx = (dx / dist) * PROJECTILE_SPEED;
  const vy = (dy / dist) * PROJECTILE_SPEED;
  const color = element ? getElementColor(element) : NEUTRAL_COLOR;

  // Effetto particelle di lancio
  for (let i = 0; i < 80; i++) {
    activeMagicParticles.push({
      x: start.x + (Math.random() - 0.5) * 22,
      y: start.y + (Math.random() - 0.5) * 22,
      radius: Math.random() * 2.2 + 1.2,
      alpha: 0.18 + Math.random() * 0.18,
      dx: (Math.random() - 0.5) * 1.5,
      dy: (Math.random() - 0.5) * 1.5,
      color,
      element
    });
  }

  // Durata = frame necessari per uscire dall'area di gioco
  const times = [];
  if (vx !== 0) times.push(vx > 0 ? (world.width - start.x) / vx : -start.x / vx);
  if (vy !== 0) times.push(vy > 0 ? (world.height - start.y) / vy : -start.y / vy);
  const positiveTimes = times.filter(t => t > 0);
  const maxLife = Math.max(30, Math.floor(positiveTimes.length ? Math.min(...positiveTimes) : 1));

  projectiles.push({
    x: start.x,
    y: start.y,
    vx,
    vy,
    life: maxLife,
    alpha: 1,
    color,
    tipo,
    owner: gameMode === 'pvp' ? 'local' : 'training',
    element
  });

  if (pvpManager && pvpManager.isActive()) {
    pvpManager.sendProjectileLaunch({
      start,
      velocity: { x: vx, y: vy },
      // Il proiettile neutro l'avversario lo vede col suo colore di default
      color: element ? color : null,
      tipo,
      element,
      maxLife
    });
  }

  incrementaProiezioneUsataBuffer(tipo);
  addExp(2);
  audioManager.playProjectileSound(element);
  return true;
}

function updateProjectiles() {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    if (p.hit) {
      projectiles.splice(i, 1);
      continue;
    }

    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    p.alpha *= 0.97;

    // Scia
    for (let j = 0; j < 8; j++) {
      activeMagicParticles.push({
        x: p.x + (Math.random() - 0.5) * 18,
        y: p.y + (Math.random() - 0.5) * 18,
        radius: Math.random() * 4 + 2.5,
        alpha: 0.22 + Math.random() * 0.18,
        dx: (Math.random() - 0.5) * 1.1,
        dy: (Math.random() - 0.5) * 1.1,
        color: p.color || NEUTRAL_COLOR,
        element: p.element
      });
    }

    if (p.life <= 0 || p.x < 0 || p.x > world.width || p.y < 0 || p.y > world.height) {
      projectiles.splice(i, 1);
    }
  }
}


// ============================================================
// PROIEZIONE: SPAZIALE (aree permanenti)
// ============================================================

// Danno ogni 0.5 s a chi sta dentro l'area: lo calcola chi la lancia (dipende dal suo ATK)
function getAreaDamagePerTick(polygon, element) {
  const dmgBonus = playerStats.elementDmgBonus[element] || 0;
  return playerStats.damage.spaziale * (polygonArea(polygon) / SPATIAL_DAMAGE_AREA_UNIT) * (1 + dmgBonus);
}

// Registra un'area del giocatore locale (lanciata da lui, oppure ceduta dall'avversario)
function registerLocalArea({ id, polygon, color, element, variant = null, expiresAt = null }) {
  const size = polygonArea(polygon);
  permanentSpazialeAreas.push({
    id,
    points: polygon.map(p => ({ ...p })),
    size,
    color: VARIANT_COLORS[variant] || color,
    element,
    variant,
    expiresAt,
    manaDrain: Math.max(0.01, size / 10000 * 0.01), // mana per frame
    affinityTimer: 0
  });
  audioManager.setSpatialSpellLoopPlaying(element === 'spaziale' ? null : element, true);
  return size;
}

function activateSpazialeArea(polygon, color, element) {
  const areaId = `area_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  const areaElement = element || 'spaziale';

  const size = registerLocalArea({ id: areaId, polygon, color, element: areaElement });
  if (element) incrementaAffinitaBuffer(element);
  addExp(Math.floor(size / 1000));

  if (pvpManager && pvpManager.isActive()) {
    pvpManager.sendSpellCast({
      type: 'spaziale',
      position: polygonCenter(polygon),
      polygonPoints: polygon,
      element: areaElement,
      areaId,
      damagePerTick: getAreaDamagePerTick(polygon, areaElement)
    });
  }

  // Particelle magiche lungo il bordo
  for (let i = 0; i < polygon.length - 1; i++) {
    const p1 = polygon[i], p2 = polygon[i + 1];
    for (let t = 0; t < 1; t += 0.1) {
      activeMagicParticles.push({
        x: p1.x + (p2.x - p1.x) * t,
        y: p1.y + (p2.y - p1.y) * t,
        radius: Math.random() * 2 + 1,
        alpha: 0.5 + Math.random() * 0.3,
        dx: (Math.random() - 0.5) * 0.5,
        dy: (Math.random() - 0.5) * 0.5,
        color,
        element
      });
    }
  }
}

function notifyAreaRemoval(area) {
  if (pvpManager && pvpManager.isActive()) {
    pvpManager.sendSpellRemoval({
      type: 'spaziale',
      position: polygonCenter(area.points),
      polygonPoints: area.points,
      areaId: area.id
    });
  }
}

// Ferma il suono dell'elemento solo se non restano altre aree dello stesso elemento
function stopSpatialLoopIfUnused(element) {
  if (!permanentSpazialeAreas.some(a => a.element === element)) {
    audioManager.setSpatialSpellLoopPlaying(element === 'spaziale' ? null : element, false);
  }
}

function removeSpazialeAreaById(id) {
  const index = permanentSpazialeAreas.findIndex(a => a.id === id);
  if (index !== -1) removeSpazialeAreaAt(index);
}

function removeSpazialeAreaAt(index) {
  const [area] = permanentSpazialeAreas.splice(index, 1);
  notifyAreaRemoval(area);
  stopSpatialLoopIfUnused(area.element);
}

function removeAllSpazialeAreas() {
  const removed = permanentSpazialeAreas;
  permanentSpazialeAreas = [];
  removed.forEach(notifyAreaRemoval);
  new Set(removed.map(a => a.element)).forEach(stopSpatialLoopIfUnused);
}

// Le aree consumano mana finché esistono; se il mana finisce svaniscono tutte
function updateSpazialeAreas() {
  if (permanentSpazialeAreas.length === 0) return;

  const deltaTime = 1 / 60;
  let manaToDrain = 0;
  for (const area of permanentSpazialeAreas) {
    manaToDrain += area.manaDrain * (1 - playerStats.riduzioneMana);
    area.affinityTimer += deltaTime;
    if (area.affinityTimer >= 1) {
      area.affinityTimer -= 1;
      incrementaProiezioneUsataBuffer("spaziale", 0.5 * (area.size / 700) * 0.01);
      if (isElement(area.element)) incrementaAffinitaBuffer(area.element, area.manaDrain);
    }
  }

  const currentMana = getCurrentMana();
  if (currentMana <= manaToDrain) {
    triggerBurnout();
  } else {
    setCurrentMana(currentMana - manaToDrain);
  }
  addExp(manaToDrain);
}

function drawSpazialePolygon() {
  if (!isDrawingSpaziale || spazialePolygonPoints.length < 2) return;
  drawPolygon(spazialePolygonPoints, spazialePolygonColor);
}

function drawPermanentSpazialeAreas() {
  for (const area of permanentSpazialeAreas) {
    drawPolygon(area.points, area.color);

    if (Math.random() < 0.05) { // 5% per frame: scintilla lungo il bordo
      const edgeIndex = Math.floor(Math.random() * (area.points.length - 1));
      const p1 = area.points[edgeIndex];
      const p2 = area.points[edgeIndex + 1];
      const t = Math.random();
      activeMagicParticles.push({
        x: p1.x + (p2.x - p1.x) * t,
        y: p1.y + (p2.y - p1.y) * t,
        radius: Math.random() * 1.5 + 0.5,
        alpha: 0.4 + Math.random() * 0.3,
        dx: (Math.random() - 0.5) * 0.5,
        dy: (Math.random() - 0.5) * 0.5,
        color: area.color,
        element: area.variant ? null : area.element
      });
    }
  }
}

function drawPolygon(polygon, color) {
  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.beginPath();
  ctx.moveTo(polygon[0].x, polygon[0].y);
  for (let i = 1; i < polygon.length; i++) {
    ctx.lineTo(polygon[i].x, polygon[i].y);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}


// ============================================================
// INTERAZIONI TRA MAGIE (regole in spell-interactions.js)
// ============================================================
// Ogni client simula le interazioni su tutte le magie che vede (anche quelle dell'avversario).
// Una AREA però viene modificata solo dal suo proprietario, che avvisa l'avversario:
// così i due client non si contraddicono. I proiettili si risolvono su entrambi i lati.

const MAGMA_TICK_MS = 500;
const MAGMA_AREA_DAMAGE = 0.5;
const MAGMA_TRAIL_DAMAGE = 1;
const MAGMA_TRAIL_RADIUS = 28;
const PROJECTILE_COLLISION_RADIUS = 24;

const interactedAreaPairs = new Set();
let magmaTrail = [];          // { x, y, expiresAt }: pozze lasciate dai proiettili di magma
let lastMagmaDamage = 0;

function getOpponentAreas() {
  return pvpManager ? pvpManager.opponentSpazialeAreas : [];
}

function isVariantAlive(area, variant, now = Date.now()) {
  return area.variant === variant && (!area.expiresAt || area.expiresAt > now);
}

function isLushActive() {
  return permanentSpazialeAreas.some(a => isVariantAlive(a, 'lush'))
    || getOpponentAreas().some(a => isVariantAlive(a, 'lush'));
}

function damageLocalPlayer(amount, element = null) {
  amount = applyElementDefense(amount, playerStats, element);
  if (pvpManager) {
    if (pvpManager.matchState === 'active') pvpManager.applyDamage(amount);
  } else {
    playerLife = Math.max(0, playerLife - amount);
    triggerCameraShake(3, 100);
  }
}

// Comunica all'avversario lo stato attuale di una nostra area (stesso id = aggiornamento)
function sendAreaUpdate(area, extra = {}) {
  if (!pvpManager || !pvpManager.isActive()) return;
  pvpManager.sendSpellCast({
    type: 'spaziale',
    position: polygonCenter(area.points),
    polygonPoints: area.points,
    element: area.element,
    areaId: area.id,
    variant: area.variant,
    expiresIn: area.expiresAt ? Math.max(0, area.expiresAt - Date.now()) : null,
    damagePerTick: getAreaDamagePerTick(area.points, area.element),
    ...extra
  });
}

// causerOwner: 'local' | 'opponent' | 'training' = chi ha lanciato la magia che ha provocato l'effetto
function applyAreaEffect(area, effect, causerOwner) {
  if (effect === 'remove') {
    removeSpazialeAreaById(area.id);
    return;
  }

  if (effect === 'lush' || effect === 'magma') {
    area.variant = effect;
    area.color = VARIANT_COLORS[effect];
    area.expiresAt = Date.now() + (effect === 'lush' ? LUSH_DURATION_MS : MAGMA_DURATION_MS);
    sendAreaUpdate(area);
    return;
  }

  if (effect === 'ignite') {
    const previousElement = area.element;
    area.element = 'fuoco';
    area.color = getElementColor('fuoco');

    // L'area incendiata passa a chi ha lanciato il fuoco
    if (causerOwner === 'opponent' && pvpManager && pvpManager.isActive()) {
      permanentSpazialeAreas = permanentSpazialeAreas.filter(a => a.id !== area.id);
      stopSpatialLoopIfUnused(previousElement);
      pvpManager.registerOpponentArea({ id: area.id, points: area.points, element: 'fuoco' });
      sendAreaUpdate(area, { giveToReceiver: true });
    } else {
      stopSpatialLoopIfUnused(previousElement);
      audioManager.setSpatialSpellLoopPlaying('fuoco', true);
      sendAreaUpdate(area);
    }
  }
}

// L'avversario ci cede un'area (la sua aria è stata incendiata dal nostro fuoco)
function receiveGrantedArea(data) {
  if (permanentSpazialeAreas.some(a => a.id === data.areaId)) return;
  registerLocalArea({
    id: data.areaId,
    polygon: data.polygonPoints,
    color: getElementColor(data.element),
    element: data.element,
    variant: data.variant,
    expiresAt: data.expiresIn ? Date.now() + data.expiresIn : null
  });
}

function applyProjectileEffect(projectile, effect) {
  if (effect === 'remove' || effect === 'lush') {
    projectile.hit = true; // sparisce al prossimo aggiornamento
  } else if (effect === 'ignite') {
    projectile.element = 'fuoco';
    projectile.color = getElementColor('fuoco');
  } else if (effect === 'magma') {
    projectile.magma = true;
  }
}

// Un proiettile che ENTRA in un'area interagisce con essa (una volta per ingresso)
function updateProjectileAreaInteractions() {
  const areas = [
    ...permanentSpazialeAreas.map(area => ({ area, owner: 'local' })),
    ...getOpponentAreas().map(area => ({ area, owner: 'opponent' }))
  ];

  for (const p of projectiles) {
    if (p.hit) continue;
    // Alla prima verifica registriamo solo dove si trova, senza considerarlo un ingresso
    // (es. proiettile lanciato dall'interno di un'area)
    const isFirstCheck = !p.inside;
    if (isFirstCheck) p.inside = new Set();

    for (const { area, owner } of areas) {
      if (owner === 'local' && !permanentSpazialeAreas.includes(area)) continue; // rimossa nel frattempo
      if (!pointInPolygon(p, area.points)) {
        p.inside.delete(area.id);
        continue;
      }
      if (p.inside.has(area.id)) continue;
      p.inside.add(area.id);
      if (isFirstCheck) continue;

      const result = getInteraction(
        { element: p.element },
        { element: area.element, variant: area.variant }
      );
      if (result.a || result.b) {
        applyProjectileEffect(p, result.a);
        if (owner === 'local' && result.b) applyAreaEffect(area, result.b, p.owner);
      } else if (blocksProjectiles(area)) {
        p.hit = true; // la terra blocca ciò che non reagisce con lei
      }
      if (p.hit) break;
    }
  }
}

// Due proiettili di giocatori diversi che si incrociano interagiscono tra loro
function updateProjectileCollisions() {
  for (let i = 0; i < projectiles.length; i++) {
    const a = projectiles[i];
    if (a.hit) continue;
    for (let j = i + 1; j < projectiles.length; j++) {
      const b = projectiles[j];
      if (b.hit || a.owner === b.owner) continue;
      if (Math.hypot(a.x - b.x, a.y - b.y) > PROJECTILE_COLLISION_RADIUS) continue;

      const result = getInteraction({ element: a.element }, { element: b.element });
      if (!result.a && !result.b) continue;
      applyProjectileEffect(a, result.a);
      applyProjectileEffect(b, result.b);
      if (a.hit) break;
    }
  }
}

function polygonBounds(points) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, minY, maxX, maxY };
}

function polygonsOverlap(pointsA, pointsB) {
  const a = polygonBounds(pointsA);
  const b = polygonBounds(pointsB);
  if (a.maxX < b.minX || b.maxX < a.minX || a.maxY < b.minY || b.maxY < a.minY) return false;
  const anyInside = (from, into) => {
    for (let i = 0; i < from.length; i += 3) {
      if (pointInPolygon(from[i], into)) return true;
    }
    return false;
  };
  return anyInside(pointsA, pointsB) || anyInside(pointsB, pointsA);
}

// Aree che si sovrappongono: ognuno modifica solo le proprie, una sola volta per coppia
function updateAreaInteractions() {
  const mine = permanentSpazialeAreas.slice();
  const theirs = getOpponentAreas().slice();

  for (let i = 0; i < mine.length; i++) {
    const a = mine[i];
    const candidates = [
      ...mine.slice(i + 1).map(area => ({ area, owner: 'local' })),
      ...theirs.map(area => ({ area, owner: 'opponent' }))
    ];

    for (const { area: b, owner } of candidates) {
      const key = a.id < b.id ? `${a.id}|${b.id}` : `${b.id}|${a.id}`;
      if (interactedAreaPairs.has(key)) continue;

      const result = getInteraction(
        { element: a.element, variant: a.variant },
        { element: b.element, variant: b.variant }
      );
      if (!result.a && !result.b) continue;
      if (!polygonsOverlap(a.points, b.points)) continue;

      interactedAreaPairs.add(key);
      if (result.a) applyAreaEffect(a, result.a, owner);
      if (result.b && owner === 'local') applyAreaEffect(b, result.b, 'local');
    }
  }
}

// Magma: scia dei proiettili, scadenza delle aree trasformate e danno ai caster
function updateMagma() {
  const now = Date.now();

  for (const p of projectiles) {
    if (!p.magma || p.hit) continue;
    p.trailTick = (p.trailTick || 0) + 1;
    if (p.trailTick % 3 === 0) magmaTrail.push({ x: p.x, y: p.y, expiresAt: now + MAGMA_TRAIL_MS });
  }
  magmaTrail = magmaTrail.filter(t => t.expiresAt > now);

  permanentSpazialeAreas
    .filter(a => a.expiresAt && a.expiresAt <= now)
    .forEach(a => removeSpazialeAreaById(a.id));

  if (now - lastMagmaDamage < MAGMA_TICK_MS) return;
  let damage = 0;
  const magmaAreaActive = permanentSpazialeAreas.some(a => isVariantAlive(a, 'magma', now))
    || getOpponentAreas().some(a => isVariantAlive(a, 'magma', now));
  if (magmaAreaActive) damage += MAGMA_AREA_DAMAGE; // il magma in campo ferisce entrambi i caster
  if (magmaTrail.some(t => Math.hypot(t.x - virtualMouse.x, t.y - virtualMouse.y) < MAGMA_TRAIL_RADIUS)) {
    damage += MAGMA_TRAIL_DAMAGE;
  }
  if (damage > 0) {
    lastMagmaDamage = now;
    damageLocalPlayer(damage, 'fuoco'); // il magma brucia: conta la difesa dal fuoco
  }
}

function updateMagicInteractions() {
  updateProjectileAreaInteractions();
  updateProjectileCollisions();
  updateAreaInteractions();
  updateMagma();
}

function drawMagmaTrail() {
  if (magmaTrail.length === 0) return;
  const now = Date.now();
  ctx.save();
  for (const t of magmaTrail) {
    const life = Math.max(0, (t.expiresAt - now) / MAGMA_TRAIL_MS);
    ctx.globalAlpha = 0.25 + 0.55 * life;
    ctx.fillStyle = VARIANT_COLORS.magma;
    ctx.beginPath();
    ctx.arc(t.x, t.y, MAGMA_TRAIL_RADIUS * (0.5 + 0.5 * life), 0, 2 * Math.PI);
    ctx.fill();
  }
  ctx.restore();
}


// ============================================================
// EFFETTI DEGLI ELEMENTI E PARTICELLE
// ============================================================

function createTrailParticle(x, y) {
  return {
    x,
    y,
    radius: Math.random() * 2 + 1,
    alpha: 1,
    dx: (Math.random() - 0.5) * 1.5,
    dy: (Math.random() - 0.5) * 1.5
  };
}

function showElementEffect(type, position) {
  const { x, y } = position;
  const count = particleCount;
  const newParticles = [];

  switch (type) {
    case 'fuoco':
      for (let i = 0; i < count; i++) {
        fireParticles.push({
          x: x + (Math.random() - 0.5) * 40,
          y: y + (Math.random() - 0.5) * 40,
          radius: Math.random() * 4 + 2,
          alpha: 1,
          dy: Math.random() * -2 - 0.5,
          dx: (Math.random() - 0.5) * 0.5,
          element: 'fuoco',
          color: `rgba(${200 + Math.random() * 55}, ${50 + Math.random() * 80}, 0, ${Math.random() * 0.8 + 0.2})`
        });
      }
      break;
    case 'acqua':
      for (let i = 0; i < count * 1.2; i++) {
        newParticles.push({
          x: x + (Math.random() - 0.5) * 30,
          y: y + (Math.random() - 0.5) * 30,
          radius: Math.random() * 3 + 1,
          alpha: 0.8,
          dy: Math.random() * 2 + 1,
          dx: (Math.random() - 0.5) * 0.3,
          element: 'acqua',
          color: `rgba(${100 + Math.random() * 50}, ${150 + Math.random() * 100}, 255, ${Math.random() * 0.6 + 0.3})`
        });
      }
      break;
    case 'aria':
      for (let i = 0; i < count * 1.5; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 2;
        newParticles.push({
          x,
          y,
          radius: Math.random() * 2 + 1,
          alpha: 0.6,
          dy: Math.sin(angle) * speed,
          dx: Math.cos(angle) * speed,
          element: 'aria',
          color: 'rgba(170,170,238,'
        });
      }
      break;
    case 'terra':
      for (let i = 0; i < count * 0.8; i++) {
        const r = Math.floor(180 + Math.random() * 40);
        const g = Math.floor(160 + Math.random() * 30);
        const b = Math.floor(100 + Math.random() * 40);
        newParticles.push({
          x: x + (Math.random() - 0.5) * 30,
          y: y + (Math.random() - 0.5) * 30,
          radius: Math.random() * 4 + 2,
          alpha: 1,
          dy: Math.random() * 0.2 - 0.1,
          dx: Math.random() * 0.2 - 0.1,
          element: 'terra',
          color: `rgba(${r},${g},${b},`
        });
      }
      break;
  }
  activeMagicParticles.push(...newParticles);
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.dx;
    p.y += p.dy;
    p.alpha -= 0.02;
    if (p.alpha <= 0) particles.splice(i, 1);
  }
}

function drawParticles() {
  for (const p of particles) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, 2 * Math.PI);
    ctx.fillStyle = `rgba(150, 200, 255, ${p.alpha})`;
    ctx.fill();
  }
}

// Il colore di una particella può arrivare in vari formati: lo convertiamo una volta
// sola e poi applichiamo l'alpha corrente, così la particella sfuma correttamente.
function particleFillStyle(p) {
  if (p._rgb === undefined) {
    const parsed = parseColor(p.color);
    p._rgb = parsed.rgb;
    p._alpha = parsed.a;
  }
  return `rgba(${p._rgb},${Math.max(0, p.alpha * p._alpha)})`;
}

function drawFireParticles() {
  for (const p of fireParticles) {
    drawParticleShape(ctx, p, particleFillStyle(p));
    p.x += p.dx;
    p.y += p.dy;
    p.alpha -= 0.015;
    p.radius *= 0.98;
  }
  fireParticles = fireParticles.filter(p => p.alpha > 0 && p.radius > 0.5);
}

function drawMagicParticles() {
  for (let i = activeMagicParticles.length - 1; i >= 0; i--) {
    const p = activeMagicParticles[i];
    drawParticleShape(ctx, p, particleFillStyle(p));
    p.x += p.dx;
    p.y += p.dy;
    p.alpha -= 0.01;
    p.radius *= 0.99;
    if (p.alpha <= 0.01 || p.radius <= 0.2) {
      activeMagicParticles.splice(i, 1);
    }
  }
}

function drawPath() {
  if (points.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.strokeStyle = "rgba(180, 240, 255, 0.6)";
  ctx.lineWidth = 3;
  ctx.stroke();
}


// ============================================================
// MANA, ESPERIENZA E SALVATAGGI
// ============================================================

function spendMana(amount) {
  if (getManaValues().inBurnout) return false;
  amount *= 1 - playerStats.riduzioneMana;
  if (getCurrentMana() < amount) {
    triggerBurnout();
    return false;
  }
  setCurrentMana(getCurrentMana() - amount);
  return true;
}

// Burnout: niente magie per 5 secondi e le magie attive si annullano
function triggerBurnout() {
  setManaValues({ burnout: true, burnoutT: BURNOUT_FRAMES, current: 0 });
  removeAllSpazialeAreas();
}

function regenMana() {
  let { mana, manaMax, manaRecoverSpeed, inBurnout, burnoutTimer } = getManaValues();
  if (inBurnout) {
    burnoutTimer--;
    if (burnoutTimer <= 0) {
      inBurnout = false;
      mana = manaMax * 0.2;
    }
  } else if (mana < manaMax) {
    // Aree rigogliose in campo: rigenerazione aumentata per entrambi i caster
    const regenMultiplier = isLushActive() ? LUSH_MANA_REGEN_MULTIPLIER : 1;
    mana = Math.min(manaMax, mana + manaRecoverSpeed * regenMultiplier);
  }
  setManaValues({ current: mana, burnout: inBurnout, burnoutT: burnoutTimer });
}

function incrementaAffinitaBuffer(elemento, valore = 1) {
  affinityToAdd[elemento] = (affinityToAdd[elemento] || 0) + valore;
}

function incrementaProiezioneUsataBuffer(tipo, valore = 1) {
  proiezioniToAdd[tipo] = (proiezioniToAdd[tipo] || 0) + valore;
}

// Esperienza, livello e mana sono tenuti in memoria (questa pagina è l'unica a modificarli)
// e salvati su Firebase: niente più letture/scritture concorrenti che si sovrascrivono.
function flushExperience() {
  if (!playerLoaded || expToAdd <= 0) return;
  playerExp += expToAdd;
  expToAdd = 0;

  // Salire di livello non cambia le statistiche: dà un punto abilità da spendere nelle info giocatore
  while (playerExp >= getExpToNext(playerLevel)) {
    playerExp -= getExpToNext(playerLevel);
    playerLevel++;
  }

  savePlayerData(username, {
    esperienza: playerExp,
    livello: playerLevel
  }).catch(error => console.error('❌ Errore salvataggio esperienza:', error));
  drawExpBar();
}

function flushCounters() {
  if (Object.keys(affinityToAdd).length === 0 && Object.keys(proiezioniToAdd).length === 0) return;
  const groups = { affinita: affinityToAdd, proiezioniUsate: proiezioniToAdd };
  affinityToAdd = {};
  proiezioniToAdd = {};
  incrementPlayerCounters(username, groups)
    .catch(error => console.error('❌ Errore salvataggio affinità/proiezioni:', error));
}

function saveMana(force = false) {
  if (!playerLoaded || !username) return;
  const mana = getCurrentMana();
  if (!force && lastSavedMana !== null && Math.abs(mana - lastSavedMana) < 0.01) return;
  lastSavedMana = mana;
  savePlayerData(username, { mana, manaUpdatedAt: Date.now() })
    .catch(error => console.error('❌ Errore salvataggio mana:', error));
}

function savePeriodically() {
  const now = Date.now();
  if (now - lastCountersSave > COUNTERS_SAVE_INTERVAL_MS) {
    lastCountersSave = now;
    flushCounters();
    flushExperience();
  }
  if (now - lastManaSave > MANA_SAVE_INTERVAL_MS) {
    lastManaSave = now;
    saveMana();
  }
}

window.addEventListener('pagehide', () => {
  flushCounters();
  flushExperience();
  saveMana(true);
});

function drawExpBar() {
  const bar = document.getElementById('exp-bar');
  const lvl = document.getElementById('exp-level');
  const glow = document.querySelector('.exp-bar-glow');
  const barContainer = document.getElementById('exp-bar-container');
  if (!bar || !lvl || !glow || !barContainer) return;

  const prevPerc = parseFloat(bar.style.getPropertyValue('width')) / 100 || 0;
  const perc = Math.min(1, playerExp / getExpToNext(playerLevel));
  lvl.textContent = playerLevel;
  bar.style.width = (perc * 100) + "%";
  barContainer.classList.add('exp-visible');
  lvl.classList.add('exp-visible');

  if (window._expBarHideTimeout) clearTimeout(window._expBarHideTimeout);
  window._expBarHideTimeout = setTimeout(() => {
    barContainer.classList.remove('exp-visible');
    lvl.classList.remove('exp-visible');
  }, 1000);

  if (perc > prevPerc) {
    glow.classList.remove('animate');
    void glow.offsetWidth; // forza il reflow per riavviare l'animazione
    setTimeout(() => glow.classList.add('animate'), 0);
    setTimeout(() => glow.classList.remove('animate'), 1100);
  }
}


// ============================================================
// MOUSE VIRTUALE, COLLISIONI E SCINTILLE
// ============================================================

function updateVirtualMouse() {
  // 🗿 Terra: stordito, il mouse virtuale non si muove
  if (playerStatus.stunned) return;

  const dx = mouseTarget.x - virtualMouse.x;
  const dy = mouseTarget.y - virtualMouse.y;
  const dist = Math.hypot(dx, dy);

  // 💧 Acqua: rallentamento
  const maxSpeed = 40 * playerStatus.speedMultiplier;
  const speed = Math.min(dist * 0.25, maxSpeed);

  if (dist > 0.5) {
    virtualMouse.x += (dx / dist) * speed;
    virtualMouse.y += (dy / dist) * speed;
  } else {
    virtualMouse.x = mouseTarget.x;
    virtualMouse.y = mouseTarget.y;
  }

  virtualMouse.x = Math.max(0, Math.min(world.width, virtualMouse.x));
  virtualMouse.y = Math.max(0, Math.min(world.height, virtualMouse.y));

  virtualMouseEntity.x = virtualMouse.x;
  virtualMouseEntity.y = virtualMouse.y;
  if (dist > 0) {
    virtualMouseEntity.velocity.x = (dx / dist) * speed;
    virtualMouseEntity.velocity.y = (dy / dist) * speed;
  }
}

function drawVirtualMouse() {
  ctx.save();
  ctx.beginPath();
  ctx.arc(virtualMouse.x, virtualMouse.y, 12, 0, 2 * Math.PI);
  ctx.strokeStyle = "#00e0ff";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(virtualMouse.x - 6, virtualMouse.y);
  ctx.lineTo(virtualMouse.x + 6, virtualMouse.y);
  ctx.moveTo(virtualMouse.x, virtualMouse.y - 6);
  ctx.lineTo(virtualMouse.x, virtualMouse.y + 6);
  ctx.stroke();
  ctx.restore();
}

// Chiamata da collision-system.js quando due entità si scontrano
function createCollisionSparks(x, y, entity1, entity2, collision) {
  const velocity1 = Math.hypot(entity1.velocity?.x || 0, entity1.velocity?.y || 0);
  const velocity2 = Math.hypot(entity2.velocity?.x || 0, entity2.velocity?.y || 0);
  const totalImpact = velocity1 + velocity2;

  const minSparks = 1;
  const maxSparks = 3;
  const sparkCount = Math.floor(minSparks + (totalImpact / 10) * (maxSparks - minSparks));

  // Le scintille "rimbalzano" lungo la normale di collisione
  const normalX = collision.normal?.x || 0;
  const normalY = collision.normal?.y || 0;
  const baseSpeed = Math.min(2 + totalImpact * 0.3, 8);
  const baseLength = Math.min(0.5 + totalImpact * 0.1, 2.5);

  for (let i = 0; i < sparkCount; i++) {
    const spreadAngle = Math.PI * 0.6;
    const angle = Math.atan2(normalY, normalX) + (Math.random() - 0.5) * spreadAngle;
    const speed = baseSpeed * (0.7 + Math.random() * 0.6);
    const length = baseLength * (0.8 + Math.random() * 0.4);
    collisionSparks.push(new Spark(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, length));
  }

  const MIN_VOLUME = 0.1;
  const MAX_VOLUME = 0.9;
  const MAX_IMPACT_FOR_VOLUME = 25.0;
  const normalizedImpact = Math.min(1.0, totalImpact / MAX_IMPACT_FOR_VOLUME);
  audioManager.playCollisionSound(MIN_VOLUME + normalizedImpact * (MAX_VOLUME - MIN_VOLUME));
}
window.createCollisionSparks = createCollisionSparks;

function updateCollisionSparks() {
  for (let i = collisionSparks.length - 1; i >= 0; i--) {
    if (!collisionSparks[i].update()) collisionSparks.splice(i, 1);
  }
}

function drawCollisionSparks() {
  for (const spark of collisionSparks) spark.draw(ctx);
}


// ============================================================
// GEOMETRIA
// ============================================================

function pointInPolygon(point, vs) {
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i].x, yi = vs[i].y;
    const xj = vs[j].x, yj = vs[j].y;
    const intersect = ((yi > point.y) !== (yj > point.y)) &&
      (point.x < (xj - xi) * (point.y - yi) / (yj - yi + 0.00001) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function polygonArea(polygon) {
  let area = 0;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    area += (polygon[j].x + polygon[i].x) * (polygon[j].y - polygon[i].y);
  }
  return Math.abs(area / 2);
}

function polygonCenter(polygon) {
  return {
    x: polygon.reduce((sum, p) => sum + p.x, 0) / polygon.length,
    y: polygon.reduce((sum, p) => sum + p.y, 0) / polygon.length
  };
}


// ============================================================
// LOOP PRINCIPALE
// ============================================================

// Fuori dall'arena PvP lo schermo è oscurato, con un bordo che ne segna il limite
function drawArenaFrame() {
  if (!world.fixedSize) return;
  const w = world.width * world.scale;
  const h = world.height * world.scale;
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
  ctx.beginPath();
  ctx.rect(0, 0, canvas.width, canvas.height);
  ctx.rect(world.offsetX, world.offsetY, w, h);
  ctx.fill("evenodd");
  ctx.strokeStyle = "rgba(0, 224, 255, 0.35)";
  ctx.lineWidth = 2;
  ctx.strokeRect(world.offsetX, world.offsetY, w, h);
  ctx.restore();
}

// Da qui in poi si disegna in coordinate del mondo (ritagliate all'arena nel PvP)
function enterWorldSpace() {
  ctx.save();
  ctx.translate(world.offsetX, world.offsetY);
  ctx.scale(world.scale, world.scale);
  if (world.fixedSize) {
    ctx.beginPath();
    ctx.rect(0, 0, world.width, world.height);
    ctx.clip();
  }
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  applyCameraShake(ctx);
  drawArenaFrame();
  enterWorldSpace();

  updateStatusEffects(1 / 60);
  updateVirtualMouse();
  globalCollisionSystem.update();
  updateCollisionSparks();
  drawVirtualMouse();

  if (typeof window.drawTrainingEnemies === 'function') {
    window.drawTrainingEnemies(ctx);
  }

  if (casting) drawPath();
  updateParticles();
  drawParticles();
  drawFireParticles();
  drawMagicParticles();

  if (pvpManager && pvpManager.isActive()) {
    pvpManager.syncWithMainGame({
      virtualMouse,
      projectiles,
      magicCircle,
      activeMagicParticles,
      casting,
      castingPoints: points
    });
    pvpManager.renderPvPElements(ctx);
  }

  drawCollisionSparks();
  drawMagicCircle();
  audioManager.setMagicCircleLoopPlaying(!!magicCircle);
  drawNextChargeParticles();
  updateMagicInteractions();
  updateProjectiles();
  drawMagmaTrail();
  drawSpazialePolygon();
  drawPermanentSpazialeAreas();
  updateSpazialeAreas();

  savePeriodically();
  regenMana();

  drawMagicCircleDragTrail();
  ctx.restore(); // fine coordinate del mondo

  let health;
  let maxHealth;
  if (pvpManager && pvpManager.isActive()) {
    health = pvpManager.gameHooks.playerHealth;
    maxHealth = pvpManager.maxHealth;
  } else {
    playerLife = Math.min(playerStats.hp, playerLife + 0.05); // in training la vita si rigenera
    health = playerLife;
    maxHealth = playerStats.hp;
  }
  updateRedOverlay(health, maxHealth);
  drawRedOverlay(ctx, canvas);

  circleRotation += 0.003;
  drawManaSegments();
  ctx.restore();

  requestAnimationFrame(animate);
}

initializeGameMode();
audioManager.loadAllSounds();
loadPlayerProgress();
animate();
