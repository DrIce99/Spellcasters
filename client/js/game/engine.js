// engine.js - Motore di gioco: disegno dei simboli, cerchi magici, proiezioni, mana ed esperienza.
// Usato da lab.html (laboratorio) e da game.html (training e PvP).
import DollarRecognizer, { analyzeLaserStroke } from "./dollar-recognizer.js";
import { drawManaSegments, setManaValues, getManaValues, setCurrentMana, getCurrentMana } from "./manabar.js";
import { drawElementPattern, drawProjectilePolygonPattern, drawLaserPattern } from "./element-patterns.js";
import { loadPlayerFromDB, savePlayerData, incrementPlayerCounters, getCurrentUsername } from "../services/player-db.js";
import { VirtualMouseEntity, globalCollisionSystem } from "./collision-system.js";
import { Spark } from "./sparks.js";
import { drawParticleShape } from "./particle-shapes.js";
import { drawBrushStroke } from "./brush-stroke.js";
import { SpatialAreaRenderer } from "./spatial-shader.js";
import { PvPManager } from "./pvp-manager.js";
import {
  applyCameraShake, triggerCameraShake, updateRedOverlay, drawRedOverlay, triggerScreenFlash, drawScreenFlash
} from './damage-effects.js';
import { spawnRing, spawnCircleCollapse, spawnStrokeFade, drawFx, easeOutBack, easeOutCubic } from './fx.js';
import { playSfx } from '../ui/sfx.js';
import { matchesAction } from '../ui/keybindings.js';
import { trackQuest, setQuestBaseline } from '../services/quest-tracker.js';
import { enableQuestToasts } from '../ui/quest-toast.js';
import {
  loadSpellbook, getSpell, isSaveMode, toggleSaveMode, slotFromKeyEvent, isCircleSavable, saveCircleToSlot,
  recordOpponentSpell
} from './spellbook.js';
import {
  configureSpellbookOverlay, showSpellbookOverlay, hideSpellbookOverlay, updateSpellbookMode, refreshSpellbookSlot,
  refreshOpponentSpellbook, showSpellbookToast
} from '../ui/spellbook-overlay.js';
import { showBanner, replayClass } from '../ui/motion.js';
import {
  statusEffectManager, applyParalysis, updateStatusEffects, createElementalDebuffParticles
} from "./status-effects.js";
import { audioManager } from './audio-manager.js';
import {
  ELEMENTS, isElement, isSymbol, getElementColor, getOpponentElementColor, parseColor, withAlpha,
  NEUTRAL_COLOR, EMPTY_CIRCLE_COLOR, DEFAULT_SPAZIALE_COLOR
} from './elements.js';
import { getExpToNext, BURNOUT_FRAMES } from './progression.js';
import {
  computePlayerStats, getRecognitionThreshold, applyElementDefense, getAtkMultiplier, averageCritMultiplier,
  BASE_DAMAGE, SPATIAL_DAMAGE_AREA_UNIT
} from './player-stats.js';
import {
  getInteraction, blocksProjectiles, bouncesOffSurfaces, VARIANT_COLORS, VARIANT_DURATIONS,
  MAGMA_TRAIL_MS, LUSH_MANA_REGEN_MULTIPLIER
} from './spell-interactions.js';

const recognizer = new DollarRecognizer();
const username = getCurrentUsername();

const canvas = document.getElementById("spellCanvas");
canvas.addEventListener("contextmenu", (e) => e.preventDefault());
const ctx = canvas.getContext("2d");

// === AREA DI GIOCO ===
// Tutte le coordinate di gioco (mouse, cerchi, proiettili, aree) sono nel "mondo".
// Nel training il mondo è l'intero schermo; nel PvP è un rettangolo fisso, uguale per i due
// giocatori (l'intersezione dei loro schermi), centrato e rimpicciolito se la finestra è più piccola.
const world = { width: 0, height: 0, scale: 1, offsetX: 0, offsetY: 0, fixed: getPvPArena() };

/** @returns {{width: number, height: number} | null} null fuori dal PvP */
function getPvPArena() {
  if (new URLSearchParams(window.location.search).get('mode') !== 'pvp') return null;
  try {
    const matchData = JSON.parse(localStorage.getItem('currentMatchData'));
    if (matchData?.arenaWidth > 0 && matchData?.arenaHeight > 0) {
      return { width: matchData.arenaWidth, height: matchData.arenaHeight };
    }
    // Server vecchio: arena quadrata
    if (matchData?.arenaSize > 0) return { width: matchData.arenaSize, height: matchData.arenaSize };
  } catch { /* dati assenti o corrotti: si usa il ripiego */ }
  // Nessuna dimensione dal server: almeno il quadrato resta dentro questo schermo
  const side = Math.min(window.innerWidth, window.innerHeight);
  return { width: side, height: side };
}

function layoutWorld() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  if (world.fixed) {
    world.width = world.fixed.width;
    world.height = world.fixed.height;
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

// Riempimento delle aree spaziali con shader WebGL (se non disponibile: riempimento 2D semplice)
const areaShader = new SpatialAreaRenderer(canvas);

// === COSTANTI ===
// Le velocità sono espresse "per frame a 60fps": il movimento viene scalato con il tempo reale
// trascorso (frameScale), così la partita va alla stessa velocità su schermi a 60, 144 o 240 Hz.
const PROJECTILE_SPEED = 16;
const PROJECTILE_MANA_COST = 2;
const ELEMENT_MANA_COST = 1;
const MIN_LAUNCH_DISTANCE = 30;
const CIRCLE_RADIUS = 120;
const DRAW_SOUND_THROTTLE = 100;
const COUNTERS_SAVE_INTERVAL_MS = 1000;
const MANA_SAVE_INTERVAL_MS = 15000;
const FRAME_MS = 1000 / 60;
const OPPONENT_SOUND_VOLUME = 0.75;     // le magie dell'avversario suonano un po' più piano
const CIRCLE_APPEAR_MS = 450;           // il cerchio magico si "traccia" da solo quando compare
const CIRCLE_FLASH_MS = 500;            // bagliore del cerchio quando riceve un elemento o una carica
const WHEEL_STEP = 60;                  // delta della rotella per passare alla carica successiva (touchpad: più passi piccoli)

// ⚡ Fulmine: proiettili e laser rimbalzano sui bordi dell'arena e sulle aree di terra
const FULMINE_MAX_BOUNCES = 4;
const FULMINE_LASER_MAX_BOUNCES = 1;  // il laser è permanente: con troppi rimbalzi copriva mezza arena
const FULMINE_PROJECTILE_LIFE = 180;    // frame (3 s): rimbalzando non escono subito dall'arena

// Laser: magia permanente, consuma mana ogni 0.1 s finché non si annulla
const LASER_MANA_PER_TICK = 0.15;
const LASER_MANA_TICK_MS = 100;
const LASER_HIT_RADIUS = 18;            // distanza dal raggio entro cui si viene colpiti
const LASER_CANCEL_RADIUS = 20;         // distanza dal raggio entro cui il tasto destro lo annulla
const LASER_DAMAGE_TICK_MS = 500;

// Contatori che una magia fa crescere (affinità con l'elemento, uso della proiezione): tutti, salvo le magie dello spellbook
const FULL_PROGRESS = Object.freeze({ element: true, projection: true });

// === STATO DI GIOCO ===
let casting = false;
let points = [];               // punti del simbolo che si sta disegnando (tasto Z)
let particles = [];            // scia del disegno
let activeMagicParticles = [];
let fireParticles = [];
let projectiles = [];
// Laser del giocatore: { id, origin, dir, element, variant, expiresAt, simple, path, ... }
// (quelli dell'avversario sono in pvpManager.opponentLasers)
let lasers = [];

// Tempo reale dell'ultimo frame: frameScale = 1 a 60fps, 0.42 a 144fps...
let lastFrameTime = performance.now();
let frameScale = 1;
let frameMs = FRAME_MS;

// Cerchio magico: { x, y, radius, thickness, elemento, projections: [], selected, spellbookElement, spellbookCharges: [] }
// selected = indice della carica che partirà al prossimo lancio (la rotella del mouse la cambia)
// spellbookElement / spellbookCharges[i]: l'elemento / la carica i-esima vengono dallo spellbook, non da un disegno.
// Ciò che arriva dallo spellbook non fa crescere affinità né contatori delle proiezioni (vedi spellProgress).
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

// Indicatore della carica selezionata nel cerchio (impostazioni): 'none' | 'particles' | 'reticle' | 'both'
const chargeIndicator = localStorage.getItem('chargeIndicator') || 'both';
const showChargeParticles = chargeIndicator === 'particles' || chargeIndicator === 'both';
const showChargeReticle = chargeIndicator === 'reticle' || chargeIndicator === 'both';

// Mouse virtuale: con il pointer lock segue il mouse reale con un po' di inerzia
const virtualMouse = { x: world.width / 2, y: world.height / 2 };
const mouseTarget = { x: virtualMouse.x, y: virtualMouse.y };
const virtualMouseEntity = new VirtualMouseEntity(virtualMouse.x, virtualMouse.y);
globalCollisionSystem.registerEntity(virtualMouseEntity);

// Corpo del giocatore: è ciò che viene colpito. Di solito coincide con il mouse virtuale;
// durante la paralisi del fulmine resta fermo mentre il cursore continua a muoversi per disegnare.
const playerBody = { x: virtualMouse.x, y: virtualMouse.y, attached: true };

// Effetti di stato sul giocatore locale (aggiornati da status-effects.js)
const playerStatus = { speedMultiplier: 1, controlsInverted: false, stunned: false, paralyzed: false };

let collisionSparks = [];

let pvpManager = null;
let gameMode = 'training'; // 'training' | 'pvp'
const isLab = document.body.dataset.page === 'lab'; // i cerchi si salvano nello spellbook solo in laboratorio
let playerLife = 100;      // vita fuori dal PvP

// === PROGRESSIONE (caricata da Firebase) ===
let playerStats = computePlayerStats({}); // valori base finché non arriva il profilo
let playerLevel = 1;
let playerExp = 0;
let playerLoaded = false;

// Buffer salvati periodicamente su Firebase
let affinityToAdd = {};
let proiezioniToAdd = {};
let segniToAdd = {};
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
    pvpManager.onSpellGranted = receiveGrantedSpell;
    pvpManager.ownsSpell = ownsSpell;
    pvpManager.onOpponentProjectile = receiveOpponentProjectile;
    pvpManager.onOpponentElement = receiveOpponentElement;
    pvpManager.onOpponentLaserCast = receiveOpponentLaserCast;
    pvpManager.onOpponentSpellbook = (slot, spell) => {
      if (recordOpponentSpell(slot, spell)) refreshOpponentSpellbook();
    };
    pvpManager.shaderFillsAreas = areaShader.ok;
    console.log('🎮 Modalità PvP inizializzata');
  }
  configureSpellbookOverlay({
    canSave: isLab,
    opponentName: pvpManager ? (pvpManager.opponentData?.username || 'Avversario') : null
  });
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
  statusEffectManager.registerParalysisCallback('player', (paralyzed) => {
    playerStatus.paralyzed = paralyzed;
    if (paralyzed) playerBody.attached = false;
  });

  // Nel PvP danni e particelle degli effetti sono gestiti dal PvPManager
  if (!pvpManager) {
    statusEffectManager.registerDamageCallback('player', (damage, source) => {
      const element = source === 'burning' ? 'fuoco' : null;
      playerLife = Math.max(0, playerLife - applyElementDefense(damage, playerStats, element));
      triggerCameraShake(5, 150);
      triggerScreenFlash('#ff2a2a', 0.12, 220);
      playSfx('hit', { throttle: 150, volume: 0.7 });
    });
    statusEffectManager.registerVisualCallback('player', (effectType, element) => {
      if (effectType === 'debuff_particles') {
        createElementalDebuffParticles(element, playerBody, activeMagicParticles);
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
  loadSpellbook(player?.spellbook);
  // Missioni: in partita e nel training un avviso mostra quando avanzano (in laboratorio non contano)
  if (!isLab) {
    setQuestBaseline(player || {});
    enableQuestToasts();
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

// Missioni: le azioni di combattimento contano solo in una partita PvP in corso o nel training
// (non in laboratorio, dove si potrebbero completare senza combattere)
function questCombat(type, details) {
  const inMatch = pvpManager ? pvpManager.matchState === 'active' : !isLab;
  if (inMatch) trackQuest(type, details);
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

// Rotella: scorre tra le cariche del cerchio magico (giù = senso orario, su = antiorario).
// Bloccata mentre si sta già usando una carica (trascinamento o perimetro di un'area).
let wheelAccumulator = 0;
canvas.addEventListener("wheel", (e) => {
  e.preventDefault(); // niente zoom/scroll della pagina mentre si gioca
  if (!isPointerLocked() || !magicCircle || magicCircle.projections.length < 2) return;
  if (pointerDownOnCircle || isActivatingMagicCircle || isDrawingSpaziale) return;

  // deltaMode 1 = righe (Firefox): le riportiamo in pixel
  wheelAccumulator += e.deltaMode === 1 ? e.deltaY * 40 : e.deltaY;
  if (Math.abs(wheelAccumulator) < WHEEL_STEP) return;
  const step = Math.sign(wheelAccumulator);
  wheelAccumulator = 0;
  selectCharge(magicCircle.selected + step);
}, { passive: false });

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
    castElementEffect(magicCircle.elemento, magicCircle, { countAffinity: !magicCircle.spellbookElement });
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
// INPUT: TASTIERA (tasti rimappabili da keybindings.js; quelli del tema sono gestiti da theme.js)
// ============================================================

window.addEventListener("keydown", (e) => {
  if (matchesAction(e, 'cast') && !casting && canAct()) {
    casting = true;
    points = [];
  }

  handleSpellbookKeydown(e);
});

window.addEventListener("keyup", (e) => {
  if (matchesAction(e, 'cast') && casting) {
    casting = false;
    recognizeSpell(points);
    points = [];
    canvas.style.boxShadow = "none";
  }
  if (matchesAction(e, 'cancel') && isPointerLocked() && canAct()) {
    cancelAtVirtualMouse();
  }
  if (matchesAction(e, 'spellbook')) hideSpellbookOverlay();
});


// ============================================================
// SPELLBOOK (si salva in laboratorio, si evoca ovunque)
// ============================================================

// Tab (tenuto): mostra gli slot · R (laboratorio): entra/esce dalla modalità salvataggio ·
// 1-9: in modalità salvataggio salva nello slot il cerchio magico sotto il mouse, altrimenti evoca il cerchio salvato
function handleSpellbookKeydown(e) {
  if (e.ctrlKey || e.altKey || e.metaKey) return; // Ctrl+1, Ctrl+R, Ctrl+Tab... sono scorciatoie del browser
  if (matchesAction(e, 'spellbook')) {
    e.preventDefault(); // Tab non deve spostare il focus fuori dal canvas
    showSpellbookOverlay();
    return;
  }
  if (e.repeat) return; // tenendo premuto R la modalità non deve accendersi e spegnersi di continuo
  if (isLab && matchesAction(e, 'saveMode')) {
    const on = toggleSaveMode();
    playSfx('toggle', { on });
    updateSpellbookMode();
    return;
  }
  const slot = slotFromKeyEvent(e);
  if (!slot) return;
  if (isLab && isSaveMode()) saveMagicCircle(slot);
  else summonSpellbookCircle(slot);
}

// Evoca sotto il mouse il cerchio salvato nello slot, con elemento e cariche già incisi
function summonSpellbookCircle(slot) {
  const spell = getSpell(slot);
  if (!spell) {
    playSfx('fizzle');
    showSpellbookToast(`Lo slot ${slot} è vuoto`, 'error');
    return;
  }
  if (!canAct()) return;
  createMagicCircle(spell, slot);
  questCombat('spellbook_summon');
  const color = circleColorOf(magicCircle);
  magicCircle.flashAt = performance.now();
  spawnRing(magicCircle.x, magicCircle.y, { color, from: magicCircle.radius * 0.3, to: magicCircle.radius + 80, duration: 600, width: 3 });
  if (spell.elemento) audioManager.playElementSpellSound(spell.elemento, 0.6);
}

function saveMagicCircle(slot) {
  const mouse = virtualMouse;
  const onCircle = magicCircle && Math.hypot(mouse.x - magicCircle.x, mouse.y - magicCircle.y) <= magicCircle.radius + 20;
  if (!onCircle) {
    playSfx('fizzle');
    showSpellbookToast('Punta un cerchio magico per salvarlo', 'error');
    return;
  }
  if (!isCircleSavable(magicCircle)) {
    playSfx('fizzle');
    showSpellbookToast('Il cerchio è vuoto: incidi un elemento o una carica', 'error');
    return;
  }

  const color = circleColorOf(magicCircle);
  engraveCircle(color);
  spawnRing(magicCircle.x, magicCircle.y, { color, from: magicCircle.radius + 30, to: 10, duration: 420, width: 2 });
  playSfx('success');
  showSpellbookToast(`Cerchio salvato nello slot ${slot}`);
  saveCircleToSlot(slot, magicCircle).catch((error) => {
    console.error('❌ Salvataggio dello spellbook non riuscito:', error);
    showSpellbookToast(`Slot ${slot}: salvataggio online non riuscito`, 'error');
  });
  refreshSpellbookSlot(slot);
}


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
  if (!name) {
    fizzleStroke(stroke);
    return null;
  }
  // Il tratto non sparisce di colpo: si accende del colore di ciò che ha evocato e sfuma
  const symbolColor = isElement(name) ? getElementColor(name)
    : name === 'cerchio' ? EMPTY_CIRCLE_COLOR
    : magicCircle ? circleColorOf(magicCircle) : NEUTRAL_COLOR;
  spawnStrokeFade(stroke, { color: withAlpha(symbolColor, 0.9), glow: symbolColor });
  // Più un segno viene disegnato, più il suo riconoscimento diventa tollerante (come l'affinità per gli elementi)
  if (isSymbol(name)) incrementaSegnoDisegnatoBuffer(name);

  // Dentro un cerchio magico i simboli caricano il cerchio invece di lanciare
  if (magicCircle) {
    if (name === "proiettile" || name === "spaziale" || name === "laser") {
      magicCircle.projections.push(name);
      magicCircle.spellbookCharges.push(false);
      magicCircle.selected = magicCircle.projections.length - 1; // l'ultima incisa è pronta al lancio
      engraveCircle(circleColorOf(magicCircle));
      playSfx('engrave', { pitch: 1 + 0.12 * Math.min(6, magicCircle.projections.length - 1) });
      return name;
    }
    if (isElement(name)) {
      magicCircle.elemento = name;
      magicCircle.spellbookElement = false;
      questCombat('element_engraved', { element: name });
      incrementaAffinitaBuffer(name);
      const color = getElementColor(name);
      engraveCircle(color);
      spawnRing(magicCircle.x, magicCircle.y, { color, from: magicCircle.radius * 0.3, to: magicCircle.radius + 80, duration: 600, width: 3 });
      triggerScreenFlash(color, 0.08, 260);
      audioManager.playElementSpellSound(name, 0.6);
      playSfx('engrave', { pitch: 0.75 });
      return name;
    }
  }

  if (name === "cerchio") {
    createMagicCircle();
    questCombat('circle_summoned');
  } else if (name === "proiettile") {
    // Proiettile libero: sempre mana puro (neutro)
    launchProjectile(stroke[0], stroke[stroke.length - 1]);
  } else if (name === "laser") {
    // Laser libero ("semplice"): mana puro, parte dall'inizio del tratto verso la punta della linea
    if (canCast()) {
      const { start, end } = analyzeLaserStroke(stroke);
      launchLaser(start, end, { simple: true });
    }
  } else if (isElement(name)) {
    if (spendMana(ELEMENT_MANA_COST)) {
      castElementEffect(name, virtualMouse);
    }
  }
  return name;
}

// Simbolo non riconosciuto: il tratto trema e si spegne in uno sbuffo di fumo
function fizzleStroke(stroke) {
  spawnStrokeFade(stroke, { color: 'rgba(160, 166, 190, 0.75)', glow: 'rgba(255, 70, 70, 0.6)', duration: 450, jitter: 7 });
  const end = stroke[stroke.length - 1];
  for (let i = 0; i < 18; i++) {
    activeMagicParticles.push({
      x: end.x + (Math.random() - 0.5) * 16,
      y: end.y + (Math.random() - 0.5) * 16,
      radius: Math.random() * 3 + 2,
      alpha: 0.35 + Math.random() * 0.2,
      dx: (Math.random() - 0.5) * 1.2,
      dy: -Math.random() * 1.2 - 0.3,
      color: '#9aa0b8'
    });
  }
  playSfx('fizzle');
}

// Elemento evocato a vuoto (o click su un cerchio con solo l'elemento): particelle e suono,
// visibili e udibili anche dall'avversario
function castElementEffect(element, position, { countAffinity = true } = {}) {
  showElementEffect(element, position);
  if (countAffinity) incrementaAffinitaBuffer(element);
  audioManager.playElementSpellSound(element);
  if (pvpManager && pvpManager.isActive()) {
    pvpManager.sendSpellCast({ type: 'elemento', element, position: { x: position.x, y: position.y } });
  }
}

function receiveOpponentElement(data) {
  if (!isElement(data.element) || !data.position) return;
  showElementEffect(data.element, data.position);
  audioManager.playElementSpellSound(data.element, OPPONENT_SOUND_VOLUME);
}


// ============================================================
// CERCHIO MAGICO
// ============================================================

// spell: cerchio dello spellbook ({ elemento, proiezioni }) evocato dallo slot; senza, il cerchio nasce vuoto (disegnato a mano)
function createMagicCircle(spell = null, slot = null) {
  if (magicCircle) spawnCircleCollapse(magicCircle, circleColorOf(magicCircle), circleRotation);
  const projections = spell ? [...spell.proiezioni] : [];
  magicCircle = {
    x: virtualMouse.x,
    y: virtualMouse.y,
    radius: CIRCLE_RADIUS,
    thickness: 3,
    elemento: spell?.elemento || null,
    projections,
    selected: Math.max(0, projections.length - 1),
    spellbookElement: !!spell?.elemento,
    spellbookCharges: projections.map(() => !!spell),
    // Nel PvP viaggia con il cerchio: l'avversario vede quello slot nel suo overlay dello spellbook
    spellbook: spell ? { slot, elemento: spell.elemento, proiezioni: [...spell.proiezioni] } : null,
    bornAt: performance.now(), // animazione di comparsa (solo locale, non viene inviata all'avversario)
    flashAt: 0
  };
  // Un'onda che si allarga e una che si stringe e "fissa" il cerchio
  spawnRing(magicCircle.x, magicCircle.y, { color: EMPTY_CIRCLE_COLOR, from: 20, to: CIRCLE_RADIUS + 70, duration: 650, width: 2 });
  spawnRing(magicCircle.x, magicCircle.y, { color: EMPTY_CIRCLE_COLOR, from: CIRCLE_RADIUS + 110, to: CIRCLE_RADIUS + 20, duration: 520, width: 1.5, delay: 90 });
  playSfx('circleSummon');
}

function circleColorOf(circle) {
  return circle.elemento ? getElementColor(circle.elemento) : EMPTY_CIRCLE_COLOR;
}

// Bagliore del cerchio quando riceve un elemento o una carica
function engraveCircle(color) {
  magicCircle.flashAt = performance.now();
  spawnRing(magicCircle.x, magicCircle.y, { color, from: magicCircle.radius * 1.15, to: magicCircle.radius * 1.5, duration: 380, width: 2 });
}

// sound: 'circleFade' quando le cariche finiscono, 'dispel' quando lo si annulla
function removeMagicCircle(sound = 'circleFade') {
  if (magicCircle) {
    spawnCircleCollapse(magicCircle, circleColorOf(magicCircle), circleRotation);
    playSfx(sound);
  }
  magicCircle = null;
  if (pvpManager && pvpManager.isActive()) {
    pvpManager.sendMagicCircleUpdate(null);
  }
}

// Si lancia la carica selezionata: di default l'ultima aggiunta (FILO), con la rotella un'altra
function peekProjection() {
  if (!magicCircle || magicCircle.projections.length === 0) return null;
  return magicCircle.projections[magicCircle.selected];
}

// Consuma la carica selezionata; se erano finite il cerchio sparisce (le aree spaziali restano).
// Dopo il lancio la selezione torna sull'ultima carica, come prima della rotella.
function consumeCharge() {
  magicCircle.projections.splice(magicCircle.selected, 1);
  magicCircle.spellbookCharges.splice(magicCircle.selected, 1);
  magicCircle.selected = magicCircle.projections.length - 1;
  if (magicCircle.projections.length === 0) {
    removeMagicCircle();
  }
}

// Seleziona la carica index (gira attorno al cerchio) con un piccolo impulso visivo e sonoro
function selectCharge(index) {
  const count = magicCircle.projections.length;
  magicCircle.selected = ((index % count) + count) % count;
  const { x, y } = chargePosition(magicCircle.selected);
  spawnRing(x, y, { color: circleColorOf(magicCircle), from: 10, to: magicCircle.radius * 0.45, duration: 260, width: 2 });
  playSfx('select', { pitch: 1 + 0.5 * magicCircle.selected / Math.max(1, count - 1), throttle: 20 });
}

// Centro della carica i-esima, come la disegna drawProjectilePolygonPattern
function chargePosition(index, angleOverride = null) {
  const count = magicCircle.projections.length;
  const angle = (angleOverride ?? chargeAngle(index, count)) - circleRotation;
  const r = magicCircle.radius * 1.1;
  return { x: magicCircle.x + Math.cos(angle) * r, y: magicCircle.y + Math.sin(angle) * r };
}

function chargeAngle(index, count) {
  return -Math.PI / 2 + (2 * Math.PI / count) * index;
}

function canCast() {
  return canAct() && !getManaValues().inBurnout;
}

// Cosa fa crescere la carica selezionata: l'affinità con l'elemento e il contatore della proiezione
// contano solo se vengono da un disegno, non dallo spellbook
function spellProgress() {
  return {
    element: !magicCircle.spellbookElement,
    projection: !magicCircle.spellbookCharges[magicCircle.selected]
  };
}

function launchFromCircle(start, end) {
  const tipo = peekProjection();
  if (!tipo || tipo === 'spaziale') return;
  const progress = spellProgress();
  // La carica si consuma solo se il lancio riesce (trascinamento abbastanza lungo e mana sufficiente)
  const launched = tipo === 'laser'
    ? launchLaser(start, end, { element: magicCircle.elemento, progress })
    : launchProjectile(start, end, { element: magicCircle.elemento, tipo, progress });
  if (launched) consumeCharge();
}

function castSpazialeFromCircle(polygon) {
  polygon.push({ ...polygon[0] }); // chiude il poligono
  const progress = spellProgress();
  activateSpazialeArea(polygon, spazialePolygonColor, magicCircle.elemento, { progress });
  if (progress.projection) incrementaProiezioneUsataBuffer("spaziale");
  consumeCharge();
}

// Tasto destro / X, in ordine: il laser sotto il mouse, l'area spaziale sotto il mouse,
// il cerchio magico sotto il mouse; altrimenti l'ultimo laser "semplice" (lanciato a vuoto)
function cancelAtVirtualMouse() {
  const mouse = { x: virtualMouse.x, y: virtualMouse.y };

  for (let i = lasers.length - 1; i >= 0; i--) {
    if (distanceToPath(mouse, lasers[i].path) <= LASER_CANCEL_RADIUS) {
      dispelFx(mouse, laserColor(lasers[i], false));
      removeLaserById(lasers[i].id);
      return;
    }
  }

  for (let i = permanentSpazialeAreas.length - 1; i >= 0; i--) {
    if (pointInPolygon(mouse, permanentSpazialeAreas[i].points)) {
      dispelFx(mouse, permanentSpazialeAreas[i].color);
      removeSpazialeAreaAt(i);
      return;
    }
  }

  if (magicCircle && Math.hypot(mouse.x - magicCircle.x, mouse.y - magicCircle.y) <= magicCircle.radius) {
    // La cancellazione manuale del cerchio rimuove anche le magie permanenti
    removeAllSpazialeAreas();
    removeAllLasers();
    removeMagicCircle('dispel');
    return;
  }

  const simpleLaser = lasers.findLast(l => l.simple);
  if (simpleLaser) {
    dispelFx(simpleLaser.origin, laserColor(simpleLaser, false));
    removeLaserById(simpleLaser.id);
  }
}

// Magia annullata: un'onda che si richiude sul punto
function dispelFx(point, color) {
  spawnRing(point.x, point.y, { color: color || NEUTRAL_COLOR, from: 70, to: 4, duration: 320, width: 2 });
  playSfx('dispel');
}

function drawMagicCircle() {
  if (!magicCircle) return;
  const { x, y, radius, thickness, elemento } = magicCircle;
  const circleColor = elemento ? getElementColor(elemento) : EMPTY_CIRCLE_COLOR;

  // Comparsa: il cerchio si allarga con un piccolo rimbalzo mentre i tratti si disegnano in senso orario
  const now = performance.now();
  const appear = magicCircle.bornAt ? Math.min(1, (now - magicCircle.bornAt) / CIRCLE_APPEAR_MS) : 1;
  const sweep = easeOutCubic(appear);
  const scale = 0.7 + 0.3 * easeOutBack(appear);
  // Bagliore quando riceve un elemento o una carica (1 -> 0)
  const flash = magicCircle.flashAt ? Math.max(0, 1 - (now - magicCircle.flashAt) / CIRCLE_FLASH_MS) : 0;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(circleRotation);
  ctx.scale(scale, scale);
  ctx.translate(-x, -y);
  ctx.globalAlpha = sweep;

  // Glow radiale
  if (elemento) {
    const glowRadius = radius + 24 + flash * 36;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
    grad.addColorStop(0, circleColor + 'cc');
    grad.addColorStop(0.45, circleColor + '44');
    grad.addColorStop(0.85, circleColor + '11');
    grad.addColorStop(1, circleColor + '00');
    ctx.save();
    ctx.globalAlpha = (0.45 + flash * 0.45) * sweep;
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
  const arcStart = -Math.PI / 2;
  const arcEnd = arcStart + 2 * Math.PI * sweep;
  ctx.lineWidth = thickness + flash * 3;
  ctx.strokeStyle = circleColor;
  ctx.beginPath();
  ctx.arc(x, y, radius, arcStart, arcEnd);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, radius + 20, arcStart, arcEnd);
  ctx.stroke();

  // Segmenti radiali (compaiono insieme all'arco)
  ctx.lineWidth = 1;
  const numSegments = 24;
  for (let i = 0; i < numSegments * sweep; i++) {
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

  const { x, y } = chargePosition(magicCircle.selected);
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

// Mirino attorno alla carica selezionata: quando la selezione cambia (rotella o nuova carica)
// scorre lungo il cerchio per la via più breve invece di saltare
function drawSelectedChargeMarker() {
  if (!magicCircle || magicCircle.projections.length < 2) return; // con una sola carica non c'è scelta

  const target = chargeAngle(magicCircle.selected, magicCircle.projections.length);
  if (magicCircle.markerAngle === undefined) magicCircle.markerAngle = target;
  const diff = Math.atan2(Math.sin(target - magicCircle.markerAngle), Math.cos(target - magicCircle.markerAngle));
  magicCircle.markerAngle += diff * Math.min(1, 0.22 * frameScale);

  const { x, y } = chargePosition(magicCircle.selected, magicCircle.markerAngle);
  const color = circleColorOf(magicCircle);
  const radius = magicCircle.radius * 0.4 * (1 + Math.sin(performance.now() / 180) * 0.06);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-3 * circleRotation);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  // Quattro archi spezzati, come un mirino runico
  for (let k = 0; k < 4; k++) {
    ctx.beginPath();
    ctx.arc(0, 0, radius, k * Math.PI / 2 + 0.3, (k + 1) * Math.PI / 2 - 0.3);
    ctx.stroke();
  }
  ctx.restore();
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
// progress: { element, projection } - quali contatori aumentare (false per le magie dello spellbook)
function launchProjectile(start, end, { element = null, tipo = "proiettile", progress = FULL_PROGRESS } = {}) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const dist = Math.hypot(dx, dy);
  if (dist < MIN_LAUNCH_DISTANCE) return false;
  if (!spendMana(PROJECTILE_MANA_COST)) return false;

  const vx = (dx / dist) * PROJECTILE_SPEED;
  const vy = (dy / dist) * PROJECTILE_SPEED;
  const maxLife = getProjectileLife(start, vx, vy, element);
  const color = element ? getElementColor(element) : NEUTRAL_COLOR;

  createProjectile({ start, vx, vy, life: maxLife, color, tipo, element, owner: gameMode === 'pvp' ? 'local' : 'training' });

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

  if (progress.projection) incrementaProiezioneUsataBuffer(tipo);
  questCombat('projectile_cast', { element });
  addExp(2);
  audioManager.playProjectileSound(element);
  return true;
}

// Durata (in frame a 60fps) = tempo per uscire dall'area di gioco; i proiettili che rimbalzano durano di più
function getProjectileLife(start, vx, vy, element) {
  if (bouncesOffSurfaces(element)) return FULMINE_PROJECTILE_LIFE;
  const times = [];
  if (vx !== 0) times.push(vx > 0 ? (world.width - start.x) / vx : -start.x / vx);
  if (vy !== 0) times.push(vy > 0 ? (world.height - start.y) / vy : -start.y / vy);
  const positiveTimes = times.filter(t => t > 0);
  return Math.max(30, Math.floor(positiveTimes.length ? Math.min(...positiveTimes) : 1));
}

// Proiettili nostri e dell'avversario nascono allo stesso modo (stesse particelle di lancio),
// così a parità di velocità hanno anche lo stesso aspetto
function createProjectile({ start, vx, vy, life, color, tipo, element, owner }) {
  spawnLaunchParticles(start, vx, vy, color, element);
  spawnRing(start.x, start.y, { color, from: 6, to: 48, duration: 280, width: 2 });
  projectiles.push({
    x: start.x,
    y: start.y,
    prevX: start.x,
    prevY: start.y,
    vx,
    vy,
    life,
    alpha: 1,
    color,
    tipo,
    owner,
    element,
    bounces: bouncesOffSurfaces(element) ? FULMINE_MAX_BOUNCES : 0
  });
}

// Effetto particelle di lancio, orientate nella direzione del tiro
function spawnLaunchParticles(start, vx, vy, color, element) {
  const launchAngle = Math.atan2(vy, vx);
  for (let i = 0; i < 80; i++) {
    activeMagicParticles.push({
      x: start.x + (Math.random() - 0.5) * 22,
      y: start.y + (Math.random() - 0.5) * 22,
      radius: Math.random() * 2.2 + 1.2,
      alpha: 0.18 + Math.random() * 0.18,
      dx: (Math.random() - 0.5) * 1.5 + vx * 0.06,
      dy: (Math.random() - 0.5) * 1.5 + vy * 0.06,
      color,
      element,
      angle: launchAngle
    });
  }
}

function receiveOpponentProjectile(data) {
  if (!data.start || !data.velocity) return;
  const element = data.element || null;
  createProjectile({
    start: data.start,
    vx: data.velocity.x,
    vy: data.velocity.y,
    life: data.maxLife || 120,
    color: data.color || 'rgba(255, 100, 100,',
    tipo: data.tipo || 'proiettile',
    element,
    owner: 'opponent'
  });
  audioManager.playProjectileSound(element, OPPONENT_SOUND_VOLUME);
}

function updateProjectiles() {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    if (p.hit) {
      projectiles.splice(i, 1);
      continue;
    }

    p.prevX = p.x;
    p.prevY = p.y;
    p.x += p.vx * frameScale;
    p.y += p.vy * frameScale;
    p.life -= frameScale;
    p.alpha *= 0.97;

    // ⚡ Il fulmine rimbalza sui bordi dell'arena invece di uscire
    const outside = p.x < 0 || p.x > world.width || p.y < 0 || p.y > world.height;
    if (outside && p.bounces > 0) {
      if (p.x < 0 || p.x > world.width) p.vx = -p.vx;
      if (p.y < 0 || p.y > world.height) p.vy = -p.vy;
      p.x = Math.max(0, Math.min(world.width, p.x));
      p.y = Math.max(0, Math.min(world.height, p.y));
      p.bounces--;
      spawnBounceSparks(p);
    }

    // Scia: orientata lungo il moto del proiettile e trascinata leggermente indietro
    const trailAngle = Math.atan2(p.vy, p.vx);
    for (let j = 0; j < 8; j++) {
      activeMagicParticles.push({
        x: p.x + (Math.random() - 0.5) * 18,
        y: p.y + (Math.random() - 0.5) * 18,
        radius: Math.random() * 4 + 2.5,
        alpha: 0.22 + Math.random() * 0.18,
        dx: (Math.random() - 0.5) * 1.1 - p.vx * 0.08,
        dy: (Math.random() - 0.5) * 1.1 - p.vy * 0.08,
        color: p.color || NEUTRAL_COLOR,
        // Un proiettile elettrificato lascia scariche invece della sua forma solita
        element: p.charged && j % 2 === 0 ? 'fulmine' : p.element,
        angle: trailAngle
      });
    }

    if (p.life <= 0 || p.x < 0 || p.x > world.width || p.y < 0 || p.y > world.height) {
      projectiles.splice(i, 1);
    }
  }
}

function spawnBounceSparks(p) {
  audioManager.playFulmineBounceSound(p.owner === 'opponent' ? OPPONENT_SOUND_VOLUME : 1);
  for (let k = 0; k < 14; k++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 3 + 1;
    activeMagicParticles.push({
      x: p.x,
      y: p.y,
      radius: Math.random() * 2 + 1,
      alpha: 0.7,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      color: p.color || NEUTRAL_COLOR,
      element: 'fulmine'
    });
  }
}

// Fa rimbalzare il proiettile sul lato del poligono attraversato nell'ultimo frame
function bounceOffPolygon(p, polygon) {
  const hit = intersectSegmentWithPolygon({ x: p.prevX, y: p.prevY }, { x: p.x, y: p.y }, polygon);
  if (hit) {
    const reflected = reflect({ x: p.vx, y: p.vy }, hit.normal);
    p.vx = reflected.x;
    p.vy = reflected.y;
    // Torna appena prima del bordo, fuori dall'area
    const t = Math.max(0, hit.t - 0.02);
    p.x = p.prevX + (p.x - p.prevX) * t;
    p.y = p.prevY + (p.y - p.prevY) * t;
  } else {
    // Nessun lato trovato (es. era già dentro): torna indietro da dove è venuto
    p.vx = -p.vx;
    p.vy = -p.vy;
    p.x = p.prevX;
    p.y = p.prevY;
  }
  p.bounces--;
  spawnBounceSparks(p);
}


// ============================================================
// PROIEZIONE: LASER (magia permanente)
// ============================================================
// Il raggio parte da un punto fisso in una direzione e arriva al bordo dell'arena.
// Si ferma sulle aree di terra con cui non reagisce (come i proiettili); quello di fulmine
// invece rimbalza su bordi e terra. Il percorso (path) si ricalcola a ogni frame.
// Chi tocca un laser avversario subisce danno ogni 0.5 s; il proprietario paga mana ogni 0.1 s.

/**
 * @param {boolean} simple laser lanciato a vuoto: si annulla con il tasto destro anche lontano dal raggio
 * @returns {boolean} true se il laser è partito
 */
function launchLaser(start, end, { element = null, simple = false, progress = FULL_PROGRESS } = {}) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const dist = Math.hypot(dx, dy);
  if (dist < MIN_LAUNCH_DISTANCE) return false;
  if (!spendMana(LASER_MANA_PER_TICK)) return false;

  const laser = registerLocalLaser({
    id: `laser_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
    origin: { x: start.x, y: start.y },
    dir: { x: dx / dist, y: dy / dist },
    element,
    simple,
    progress
  });
  sendLaserUpdate(laser);
  spawnLaserCastParticles(laser, element ? getElementColor(element) : NEUTRAL_COLOR);

  if (progress.projection) incrementaProiezioneUsataBuffer('laser');
  questCombat('laser_cast', { element });
  if (element && progress.element) incrementaAffinitaBuffer(element);
  addExp(2);
  return true;
}

// Registra un laser del giocatore locale (lanciato da lui, oppure ceduto dall'avversario)
function registerLocalLaser({ id, origin, dir, element = null, variant = null, expiresAt = null, simple = false, progress = FULL_PROGRESS }) {
  const laser = {
    id,
    origin,
    dir,
    element,
    variant,
    expiresAt,
    simple,
    progress, // anche mentre resta acceso, un laser dello spellbook non fa crescere affinità e contatori
    path: [],
    manaTimer: 0,
    affinityTimer: 0
  };
  laser.path = computeLaserPath(laser);
  lasers.push(laser);
  return laser;
}

function spawnLaserCastParticles(laser, color) {
  const angle = Math.atan2(laser.dir.y, laser.dir.x);
  spawnRing(laser.origin.x, laser.origin.y, { color, from: 8, to: 70, duration: 380, width: 3 });
  for (let i = 0; i < 50; i++) {
    activeMagicParticles.push({
      x: laser.origin.x + (Math.random() - 0.5) * 20,
      y: laser.origin.y + (Math.random() - 0.5) * 20,
      radius: Math.random() * 2.2 + 1.2,
      alpha: 0.2 + Math.random() * 0.2,
      dx: (Math.random() - 0.5) * 1.5 + laser.dir.x * 2,
      dy: (Math.random() - 0.5) * 1.5 + laser.dir.y * 2,
      color,
      element: laser.element,
      angle
    });
  }
}

// Comunica all'avversario lo stato attuale di un nostro laser (stesso id = aggiornamento).
// Usa i campi già inoltrati dal server: position = origine, polygonPoints = [origine, punto sulla direzione]
function sendLaserUpdate(laser, extra = {}) {
  if (!pvpManager || !pvpManager.isActive()) return;
  const dmgBonus = playerStats.elementDmgBonus[laser.element] || 0;
  pvpManager.sendSpellCast({
    type: 'laser',
    position: laser.origin,
    polygonPoints: [laser.origin, { x: laser.origin.x + laser.dir.x * 100, y: laser.origin.y + laser.dir.y * 100 }],
    element: laser.element,
    areaId: laser.id,
    variant: laser.variant,
    expiresIn: laser.expiresAt ? Math.max(0, laser.expiresAt - Date.now()) : null,
    // Danno a tick: il critico (dai Linker) conta come valore medio
    damagePerTick: playerStats.damage.laser * (1 + dmgBonus) * averageCritMultiplier(playerStats),
    magmaAtk: laser.variantAtk,
    ...extra
  });
}

function receiveOpponentLaserCast(laser) {
  laser.path = computeLaserPath(laser);
  spawnLaserCastParticles(laser, laser.element ? getOpponentElementColor(laser.element) : '#ff6666');
}

function removeLaserById(id) {
  const index = lasers.findIndex(l => l.id === id);
  if (index === -1) return;
  lasers.splice(index, 1);
  if (pvpManager && pvpManager.isActive()) {
    pvpManager.sendSpellRemoval({ type: 'laser', areaId: id });
  }
}

function removeAllLasers() {
  [...lasers].forEach(l => removeLaserById(l.id));
}

function getOpponentLasers() {
  return pvpManager ? pvpManager.opponentLasers : [];
}

// Aree che fermano il laser: terra "pura" con cui il laser non reagisce
// (quelle da cui parte il laser non contano, come per i proiettili lanciati da dentro un'area)
function getLaserBlockers(laser) {
  const magic = { element: laser.element, variant: laser.variant };
  return [...permanentSpazialeAreas, ...getOpponentAreas()]
    .filter(area => {
      if (!blocksProjectiles(area)) return false;
      const result = getInteraction(magic, { element: area.element, variant: area.variant });
      return !result.a && !result.b && !pointInPolygon(laser.origin, area.points);
    })
    .map(area => area.points);
}

function computeLaserPath(laser) {
  const bounces = bouncesOffSurfaces(laser.element) && !laser.variant ? FULMINE_LASER_MAX_BOUNCES : 0;
  const blockers = getLaserBlockers(laser);
  let pos = { x: laser.origin.x, y: laser.origin.y };
  let dir = { x: laser.dir.x, y: laser.dir.y };
  const path = [pos];

  for (let i = 0; i <= bounces; i++) {
    const hit = castRay(pos, dir, blockers);
    path.push(hit.point);
    if (i === bounces || !hit.normal) break;
    dir = reflect(dir, hit.normal);
    // Si stacca appena dal bordo, per non ricolpire lo stesso lato
    pos = { x: hit.point.x + dir.x * 0.5, y: hit.point.y + dir.y * 0.5 };
  }
  return path;
}

// Primo ostacolo lungo il raggio: bordo dell'arena o lato di un'area che blocca
function castRay(pos, dir, blockers) {
  let best = { t: Infinity, point: null, normal: null };

  // Bordi dell'arena
  const tx = dir.x > 0 ? (world.width - pos.x) / dir.x : dir.x < 0 ? -pos.x / dir.x : Infinity;
  const ty = dir.y > 0 ? (world.height - pos.y) / dir.y : dir.y < 0 ? -pos.y / dir.y : Infinity;
  if (tx < ty) best = { t: Math.max(0, tx), normal: { x: dir.x > 0 ? -1 : 1, y: 0 } };
  else best = { t: Math.max(0, ty), normal: { x: 0, y: dir.y > 0 ? -1 : 1 } };

  for (const polygon of blockers) {
    for (let i = 0; i < polygon.length - 1; i++) {
      const hit = intersectRayWithSegment(pos, dir, polygon[i], polygon[i + 1]);
      if (hit && hit.t < best.t) best = hit;
    }
  }
  best.point = { x: pos.x + dir.x * best.t, y: pos.y + dir.y * best.t };
  return best;
}

// Magia "descrizione" di un laser per le regole di interazione
function laserMagic(laser) {
  return { element: laser.element, variant: laser.variant };
}

// Mana ogni 0.1 s, affinità ed esperienza ogni secondo, percorso aggiornato a ogni frame
function updateLasers() {
  for (const laser of [...lasers, ...getOpponentLasers()]) {
    laser.path = computeLaserPath(laser);
  }

  for (const laser of [...lasers]) {
    if (!lasers.includes(laser)) continue; // annullato da un burnout nel frattempo
    // Rigoglioso: non costa mana finché dura (il costo annullerebbe la rigenerazione aumentata)
    laser.manaTimer = isVariantAlive(laser, 'lush') ? 0 : laser.manaTimer + frameMs;
    while (laser.manaTimer >= LASER_MANA_TICK_MS) {
      laser.manaTimer -= LASER_MANA_TICK_MS;
      const cost = LASER_MANA_PER_TICK * (1 - playerStats.riduzioneMana);
      const currentMana = getCurrentMana();
      if (currentMana <= cost) {
        triggerBurnout();
        return;
      }
      setCurrentMana(currentMana - cost);
      questCombat('mana_spent', { amount: cost });
      addExp(cost);
    }
    laser.affinityTimer += frameMs;
    if (laser.affinityTimer >= 1000) {
      laser.affinityTimer -= 1000;
      if (laser.progress.projection) incrementaProiezioneUsataBuffer('laser', 0.01);
      if (laser.element && laser.progress.element) incrementaAffinitaBuffer(laser.element, LASER_MANA_PER_TICK);
    }
  }
}

function laserColor(laser, isOpponent) {
  if (laser.variant) return VARIANT_COLORS[laser.variant];
  if (isOpponent) return laser.element ? getOpponentElementColor(laser.element) : '#ff6666';
  return laser.element ? getElementColor(laser.element) : NEUTRAL_COLOR;
}

function drawLasers() {
  for (const laser of lasers) drawLaser(laser, laserColor(laser, false));
  for (const laser of getOpponentLasers()) drawLaser(laser, laserColor(laser, true));
}

function drawLaser(laser, color) {
  const path = laser.path;
  if (!path || path.length < 2) return;
  const time = performance.now() / 1000;
  const angle = Math.atan2(laser.dir.y, laser.dir.x);

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  // Luce additiva: dove i raggi si sovrappongono diventano più luminosi
  ctx.globalCompositeOperation = 'lighter';
  if (laser.element === 'fulmine' && !laser.variant) drawLightningBeam(laser, color, time);
  else drawEnergyBeam(laser, color, time);
  drawBeamImpact(path[path.length - 1], color, time);
  ctx.restore();

  // Runa all'origine, orientata come il raggio (lo stesso disegno della carica sul cerchio)
  drawLaserPattern(ctx, laser.origin.x, laser.origin.y, 62, color, angle);

  // Qualche particella lungo il raggio
  const seg = Math.floor(Math.random() * (path.length - 1));
  const t = Math.random();
  const a = path[seg], b = path[seg + 1];
  activeMagicParticles.push({
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    radius: Math.random() * 2 + 1,
    alpha: 0.35 + Math.random() * 0.2,
    dx: (Math.random() - 0.5) * 0.8,
    dy: (Math.random() - 0.5) * 0.8,
    color,
    element: laser.variant ? null : laser.element,
    angle: Math.atan2(b.y - a.y, b.x - a.x)
  });
}

// Ampiezza delle eliche che avvolgono il raggio, per elemento (l'aria vortica, la terra quasi niente)
const BEAM_HELIX_AMPLITUDE = { fuoco: 4, acqua: 7, aria: 10, terra: 2.5 };

// Raggio di energia: alone a strati, due eliche che ruotano e impulsi che scorrono verso la punta
function drawEnergyBeam(laser, color, time) {
  const path = laser.path;
  const phase = laser.origin.x * 0.05 + laser.origin.y * 0.03; // ogni laser pulsa per conto suo
  const pulse = 1 + 0.12 * Math.sin(time * 9 + phase);
  // Il fuoco tremola, gli altri pulsano regolari
  const flicker = laser.element === 'fuoco' && !laser.variant ? 0.85 + Math.random() * 0.3 : 1;

  ctx.strokeStyle = color;
  strokePath(path, 26 * pulse * flicker, 0.08);
  strokePath(path, 13 * pulse * flicker, 0.2);
  strokePath(path, 6 * flicker, 0.5);

  const amplitude = laser.variant ? 5 : (BEAM_HELIX_AMPLITUDE[laser.element] ?? 5);
  ctx.strokeStyle = withAlpha(lightenColor(color, 0.45), 1);
  for (const offset of [0, Math.PI]) {
    strokeHelix(path, amplitude, 48, time * 7 + offset + phase, 1.4, 0.55);
  }

  // Nucleo bianco e impulsi che corrono lungo il raggio
  ctx.strokeStyle = '#ffffff';
  strokePath(path, 2.4, 0.9);
  ctx.setLineDash([14, 46]);
  ctx.lineDashOffset = -time * 320;
  strokePath(path, 4.5, 0.45);
  ctx.setLineDash([]);
}

// Fulmine: una saetta frastagliata che cambia forma a scatti, con un secondo filo e qualche ramo
function drawLightningBeam(laser, color, time) {
  if (!laser._bolt || time - laser._boltTime > 0.06) {
    laser._boltTime = time;
    laser._bolt = lightningAlongPath(laser.path, 0.12);
    laser._bolt2 = lightningAlongPath(laser.path, 0.08);
    laser._branches = lightningBranches(laser._bolt);
  }

  ctx.strokeStyle = color;
  strokePath(laser.path, 22, 0.07);
  strokePath(laser._bolt, 9, 0.22);
  strokePath(laser._bolt2, 1.5, 0.55);
  for (const branch of laser._branches) strokePath(branch, 1.6, 0.6);
  ctx.strokeStyle = '#fffbe0';
  strokePath(laser._bolt, 2.2, 1);
}

// Punto d'impatto: un bagliore che pulsa dove il raggio si ferma
function drawBeamImpact(point, color, time) {
  const radius = 16 + 4 * Math.sin(time * 14);
  const glow = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius);
  glow.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
  glow.addColorStop(0.35, withAlpha(color, 0.5));
  glow.addColorStop(1, withAlpha(color, 0));
  ctx.globalAlpha = 1;
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius, 0, 2 * Math.PI);
  ctx.fill();
}

function strokePath(points, width, alpha) {
  ctx.globalAlpha = alpha;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.stroke();
}

// Elica: linea che oscilla attorno al percorso (sinusoide perpendicolare che scorre nel tempo)
function strokeHelix(path, amplitude, wavelength, phase, width, alpha) {
  if (amplitude <= 0) return;
  ctx.globalAlpha = alpha;
  ctx.lineWidth = width;
  ctx.beginPath();
  let travelled = 0;
  let first = true;
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i], b = path[i + 1];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    if (len === 0) continue;
    const nx = -(b.y - a.y) / len, ny = (b.x - a.x) / len;
    for (let d = 0; d <= len; d += 5) {
      // L'elica parte stretta dalla runa e si allarga nei primi 40 px
      const grow = Math.min(1, (travelled + d) / 40);
      const offset = amplitude * grow * Math.sin(((travelled + d) / wavelength) * Math.PI * 2 - phase);
      const x = a.x + (b.x - a.x) * (d / len) + nx * offset;
      const y = a.y + (b.y - a.y) * (d / len) + ny * offset;
      if (first) { ctx.moveTo(x, y); first = false; } else ctx.lineTo(x, y);
    }
    travelled += len;
  }
  ctx.stroke();
}

// Saetta lungo un percorso: spostamento del punto medio, ricorsivo, proporzionale alla lunghezza
const LIGHTNING_MAX_OFFSET = 9;

function lightningAlongPath(path, roughness) {
  const result = [path[0]];
  for (let i = 0; i < path.length - 1; i++) {
    lightningSegment(path[i], path[i + 1], roughness, result);
  }
  return result;
}

function lightningSegment(a, b, roughness, out) {
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  if (len < 14) {
    out.push(b);
    return;
  }
  // Scostamento limitato: la saetta resta vicina al raggio vero (quello che colpisce)
  const offset = (Math.random() - 0.5) * 2 * Math.min(len * roughness, LIGHTNING_MAX_OFFSET);
  const mid = {
    x: (a.x + b.x) / 2 - (b.y - a.y) / len * offset,
    y: (a.y + b.y) / 2 + (b.x - a.x) / len * offset
  };
  lightningSegment(a, mid, roughness, out);
  lightningSegment(mid, b, roughness, out);
}

// Brevi rami che si staccano dalla saetta principale
function lightningBranches(bolt) {
  const branches = [];
  const count = Math.min(4, Math.floor(bolt.length / 25));
  for (let i = 0; i < count; i++) {
    const index = 1 + Math.floor(Math.random() * (bolt.length - 2));
    const from = bolt[index], next = bolt[index + 1];
    const angle = Math.atan2(next.y - from.y, next.x - from.x) + (Math.random() < 0.5 ? -1 : 1) * (0.4 + Math.random() * 0.5);
    const length = 25 + Math.random() * 45;
    const to = { x: from.x + Math.cos(angle) * length, y: from.y + Math.sin(angle) * length };
    const branch = [from];
    lightningSegment(from, to, 0.18, branch);
    branches.push(branch);
  }
  return branches;
}

// Schiarisce un colore verso il bianco (amount 0..1)
function lightenColor(color, amount) {
  const [r, g, b] = parseColor(color).rgb.split(',').map(Number);
  const mix = (v) => Math.round(v + (255 - v) * amount);
  return `rgb(${mix(r)},${mix(g)},${mix(b)})`;
}

// ============================================================
// PROIEZIONE: SPAZIALE (aree permanenti)
// ============================================================

// Danno ogni 0.5 s a chi sta dentro l'area: lo calcola chi la lancia (dipende dal suo ATK)
function getAreaDamagePerTick(polygon, element) {
  const dmgBonus = playerStats.elementDmgBonus[element] || 0;
  return playerStats.damage.spaziale * (polygonArea(polygon) / SPATIAL_DAMAGE_AREA_UNIT) * (1 + dmgBonus)
    * averageCritMultiplier(playerStats); // il critico (dai Linker) conta come valore medio
}

// Registra un'area del giocatore locale (lanciata da lui, oppure ceduta dall'avversario)
function registerLocalArea({ id, polygon, color, element, variant = null, expiresAt = null, progress = FULL_PROGRESS }) {
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
    affinityTimer: 0,
    progress // un'area dello spellbook non fa crescere affinità e contatori finché resta attiva
  });
  return size;
}

function activateSpazialeArea(polygon, color, element, { progress = FULL_PROGRESS } = {}) {
  const areaId = `area_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  const areaElement = element || 'spaziale';

  const size = registerLocalArea({ id: areaId, polygon, color, element: areaElement, progress });
  questCombat('area_cast', { element });
  if (element && progress.element) incrementaAffinitaBuffer(element);
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

function removeSpazialeAreaById(id) {
  const index = permanentSpazialeAreas.findIndex(a => a.id === id);
  if (index !== -1) removeSpazialeAreaAt(index);
}

function removeSpazialeAreaAt(index) {
  const [area] = permanentSpazialeAreas.splice(index, 1);
  notifyAreaRemoval(area);
}

function removeAllSpazialeAreas() {
  const removed = permanentSpazialeAreas;
  permanentSpazialeAreas = [];
  removed.forEach(notifyAreaRemoval);
}

// Le aree consumano mana finché esistono; se il mana finisce svaniscono tutte
function updateSpazialeAreas() {
  if (permanentSpazialeAreas.length === 0) return;

  const deltaTime = frameMs / 1000;
  let manaToDrain = 0;
  for (const area of permanentSpazialeAreas) {
    // Un'area rigogliosa non costa mana finché dura: altrimenti il suo consumo (~2 mana/s per un'area media)
    // supererebbe la rigenerazione aumentata e chi la possiede vedrebbe il mana scendere comunque
    if (!isVariantAlive(area, 'lush')) manaToDrain += area.manaDrain * frameScale * (1 - playerStats.riduzioneMana);
    area.affinityTimer += deltaTime;
    if (area.affinityTimer >= 1) {
      area.affinityTimer -= 1;
      if (area.progress.projection) incrementaProiezioneUsataBuffer("spaziale", 0.5 * (area.size / 700) * 0.01);
      if (isElement(area.element) && area.progress.element) incrementaAffinitaBuffer(area.element, area.manaDrain);
    }
  }

  const currentMana = getCurrentMana();
  if (manaToDrain > 0 && currentMana <= manaToDrain) {
    triggerBurnout();
  } else {
    setCurrentMana(currentMana - manaToDrain);
    questCombat('mana_spent', { amount: manaToDrain });
  }
  addExp(manaToDrain);
}

function drawSpazialePolygon() {
  if (!isDrawingSpaziale || spazialePolygonPoints.length < 2) return;
  drawPolygon(spazialePolygonPoints, spazialePolygonColor);
}

function drawPermanentSpazialeAreas() {
  for (const area of permanentSpazialeAreas) {
    drawPolygon(area.points, area.color, { fill: !areaShader.ok, stroke: false });

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

function drawPolygon(polygon, color, { fill = true, stroke = true } = {}) {
  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.beginPath();
  ctx.moveTo(polygon[0].x, polygon[0].y);
  for (let i = 1; i < polygon.length; i++) {
    ctx.lineTo(polygon[i].x, polygon[i].y);
  }
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = color;
    ctx.fill();
  }
  if (stroke) {
    ctx.globalAlpha = 1;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.restore();
}


// ============================================================
// INTERAZIONI TRA MAGIE (regole in spell-interactions.js)
// ============================================================
// Ogni client simula le interazioni su tutte le magie che vede (anche quelle dell'avversario).
// Una magia PERMANENTE (area o laser) però viene modificata solo dal suo proprietario, che avvisa
// l'avversario: così i due client non si contraddicono. I proiettili si risolvono su entrambi i lati.

const VARIANT_TICK_MS = 500;
const MAGMA_AREA_DAMAGE = 0.5;
const MAGMA_TRAIL_DAMAGE = 1;
const MAGMA_TRAIL_RADIUS = 28;
const CHARGED_DAMAGE = 0.75;          // magie elettrificate in campo: danno a entrambi i caster
const CHARGED_SHOCK_DAMAGE = 1.5;     // proiettile elettrificato che passa vicino a un caster
const CHARGED_SHOCK_RADIUS = 70;
const PROJECTILE_COLLISION_RADIUS = 24;
const PARALYSIS_CHECK_MS = 500;

const interactedAreaPairs = new Set(); // coppie di magie permanenti (aree e laser) che hanno già interagito
let magmaTrail = [];          // { x, y, expiresAt, atk }: pozze lasciate dai proiettili di magma
let lastVariantDamage = 0;
let lastLaserDamage = 0;
let lastParalysisCheck = 0;

// ATK di chi ha lanciato una magia ('local' | 'opponent' | 'training')
function getOwnerAtk(owner) {
  return owner === 'opponent' && pvpManager ? pvpManager.opponentAtk : playerStats.atk;
}

// Magma (fuoco + terra) ed elettrificazione (fulmine + acqua) usano la media degli ATK dei due caster
function averageAtk(ownerA, ownerB) {
  return (getOwnerAtk(ownerA) + getOwnerAtk(ownerB)) / 2;
}

function getOpponentAreas() {
  return pvpManager ? pvpManager.opponentSpazialeAreas : [];
}

// true se l'area o il laser con questo id è nostro (serve al PvPManager per ignorare
// aggiornamenti dell'avversario su magie che non gli appartengono più)
function ownsSpell(id) {
  return permanentSpazialeAreas.some(a => a.id === id) || lasers.some(l => l.id === id);
}

function isVariantAlive(spell, variant, now = Date.now()) {
  return spell.variant === variant && (!spell.expiresAt || spell.expiresAt > now);
}

function getAllPermanentSpells() {
  return [...permanentSpazialeAreas, ...getOpponentAreas(), ...lasers, ...getOpponentLasers()];
}

// La rigenerazione aumentata vale solo per chi sta dentro una magia rigogliosa:
// dentro il poligono di un'area o a contatto con il raggio di un laser
function isLushActive() {
  const now = Date.now();
  const inside = (s) => s.points ? pointInPolygon(playerBody, s.points)
    : distanceToPath(playerBody, s.path) <= LASER_HIT_RADIUS;
  return getAllPermanentSpells().some(s => isVariantAlive(s, 'lush', now) && inside(s));
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
    magmaAtk: area.variantAtk, // campo storico: ATK medio di magma ed elettrificazione
    ...extra
  });
}

// Lush / magma / charged: la magia cambia stato per un tempo limitato, poi sparisce
function applyVariant(spell, effect, causerOwner) {
  spell.variant = effect;
  questCombat('interaction', { variant: effect }); // le magie modificate qui sono sempre nostre
  // Le magie modificate qui sono sempre nostre: l'altro caster è chi ha causato l'effetto
  if (effect === 'magma' || effect === 'charged') spell.variantAtk = averageAtk('local', causerOwner);
  spell.expiresAt = Date.now() + VARIANT_DURATIONS[effect];
}

// causerOwner: 'local' | 'opponent' | 'training' = chi ha lanciato la magia che ha provocato l'effetto
function applyAreaEffect(area, effect, causerOwner) {
  // Un'area già ceduta o rimossa non è più nostra: niente aggiornamenti "fantasma" all'avversario
  if (!permanentSpazialeAreas.includes(area)) return;

  if (effect === 'remove') {
    removeSpazialeAreaById(area.id);
    return;
  }

  if (VARIANT_DURATIONS[effect]) {
    applyVariant(area, effect, causerOwner);
    area.color = VARIANT_COLORS[effect];
    sendAreaUpdate(area);
    return;
  }

  if (effect === 'ignite') {
    area.element = 'fuoco';
    area.color = getElementColor('fuoco');

    // L'area incendiata passa a chi ha lanciato il fuoco (che da ora ne paga il mana e può annullarla)
    if (causerOwner === 'opponent' && pvpManager && pvpManager.isActive()) {
      permanentSpazialeAreas = permanentSpazialeAreas.filter(a => a.id !== area.id);
      pvpManager.registerOpponentArea({
        id: area.id,
        points: area.points,
        element: 'fuoco'
      });
      sendAreaUpdate(area, { giveToReceiver: true });
    } else {
      sendAreaUpdate(area);
    }
  }
}

function applyLaserEffect(laser, effect, causerOwner) {
  if (!lasers.includes(laser)) return;

  if (effect === 'remove') {
    removeLaserById(laser.id);
    return;
  }

  if (VARIANT_DURATIONS[effect]) {
    applyVariant(laser, effect, causerOwner);
    sendLaserUpdate(laser);
    return;
  }

  if (effect === 'ignite') {
    laser.element = 'fuoco';
    // Come per le aree: il laser incendiato passa a chi ha lanciato il fuoco
    if (causerOwner === 'opponent' && pvpManager && pvpManager.isActive()) {
      lasers = lasers.filter(l => l.id !== laser.id);
      pvpManager.registerOpponentLaser({ id: laser.id, origin: laser.origin, dir: laser.dir, element: 'fuoco' });
      sendLaserUpdate(laser, { giveToReceiver: true });
    } else {
      sendLaserUpdate(laser);
    }
  }
}

// L'avversario ci cede una magia permanente (la sua aria / il suo laser incendiati dal nostro fuoco)
function receiveGrantedSpell(data) {
  if (ownsSpell(data.areaId) || !data.polygonPoints) return;
  const expiresAt = data.expiresIn ? Date.now() + data.expiresIn : null;

  if (data.spellType === 'laser') {
    const [origin, through] = data.polygonPoints;
    const length = Math.hypot(through.x - origin.x, through.y - origin.y) || 1;
    registerLocalLaser({
      id: data.areaId,
      origin,
      dir: { x: (through.x - origin.x) / length, y: (through.y - origin.y) / length },
      element: data.element || null,
      variant: data.variant || null,
      expiresAt
    });
    return;
  }

  registerLocalArea({
    id: data.areaId,
    polygon: data.polygonPoints,
    color: getElementColor(data.element),
    element: data.element,
    variant: data.variant,
    expiresAt
  });
}

// otherOwner: proprietario della magia con cui il proiettile ha interagito
function applyProjectileEffect(projectile, effect, otherOwner) {
  // Interazioni dei nostri proiettili (per le missioni)
  if (projectile.owner !== 'opponent' && ['lush', 'magma', 'charged'].includes(effect)) {
    questCombat('interaction', { variant: effect });
  }
  if (effect === 'remove' || effect === 'lush') {
    projectile.hit = true; // sparisce al prossimo aggiornamento
  } else if (effect === 'ignite') {
    projectile.element = 'fuoco';
    projectile.color = getElementColor('fuoco');
  } else if (effect === 'magma') {
    projectile.magma = true;
    projectile.magmaAtk = averageAtk(projectile.owner, otherOwner);
  } else if (effect === 'charged') {
    projectile.charged = true;
    projectile.chargedAtk = averageAtk(projectile.owner, otherOwner);
    projectile.color = VARIANT_COLORS.charged;
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
        applyProjectileEffect(p, result.a, owner);
        if (owner === 'local' && result.b) applyAreaEffect(area, result.b, p.owner);
      } else if (blocksProjectiles(area)) {
        // La terra blocca ciò che non reagisce con lei; il fulmine invece ci rimbalza sopra
        if (p.bounces > 0) {
          bounceOffPolygon(p, area.points);
          p.inside.delete(area.id);
        } else {
          p.hit = true;
        }
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
      applyProjectileEffect(a, result.a, b.owner);
      applyProjectileEffect(b, result.b, a.owner);
      if (a.hit) break;
    }
  }
}

// Un proiettile che ATTRAVERSA un laser interagisce con esso (una volta per laser).
// I laser non fermano i proiettili: se non reagiscono, si incrociano e basta.
function updateProjectileLaserInteractions() {
  const allLasers = [
    ...lasers.map(laser => ({ laser, owner: 'local' })),
    ...getOpponentLasers().map(laser => ({ laser, owner: 'opponent' }))
  ];
  if (allLasers.length === 0) return;

  for (const p of projectiles) {
    if (p.hit) continue;
    p.crossedLasers = p.crossedLasers || new Set();
    for (const { laser, owner } of allLasers) {
      if (p.crossedLasers.has(laser.id)) continue;
      if (distanceToPath(p, laser.path) > LASER_HIT_RADIUS) continue;
      p.crossedLasers.add(laser.id);

      const result = getInteraction({ element: p.element }, laserMagic(laser));
      applyProjectileEffect(p, result.a, owner);
      if (owner === 'local' && result.b) applyLaserEffect(laser, result.b, p.owner);
      if (p.hit) break;
    }
  }
}

// Coppie di magie permanenti (area-area, laser-area, laser-laser) che si toccano:
// ognuno modifica solo le proprie, una sola volta per coppia
function updatePermanentSpellInteractions() {
  const spells = [
    ...permanentSpazialeAreas.map(spell => ({ spell, kind: 'area', owner: 'local' })),
    ...lasers.map(spell => ({ spell, kind: 'laser', owner: 'local' })),
    ...getOpponentAreas().map(spell => ({ spell, kind: 'area', owner: 'opponent' })),
    ...getOpponentLasers().map(spell => ({ spell, kind: 'laser', owner: 'opponent' }))
  ];

  for (let i = 0; i < spells.length; i++) {
    const a = spells[i];
    if (a.owner !== 'local') break; // le coppie tra magie dell'avversario le gestisce lui
    for (let j = i + 1; j < spells.length; j++) {
      const b = spells[j];
      // Una delle due può essere stata ceduta o rimossa poco fa da questo stesso ciclo
      if (!isStillOwned(a) || (b.owner === 'local' && !isStillOwned(b))) continue;

      const key = a.spell.id < b.spell.id ? `${a.spell.id}|${b.spell.id}` : `${b.spell.id}|${a.spell.id}`;
      if (interactedAreaPairs.has(key)) continue;

      const result = getInteraction(spellMagic(a), spellMagic(b));
      if (!result.a && !result.b) continue;
      if (!spellsTouch(a, b)) continue;

      interactedAreaPairs.add(key);
      applyPermanentEffect(a, result.a, b.owner);
      if (b.owner === 'local') applyPermanentEffect(b, result.b, 'local');
    }
  }
}

function isStillOwned({ spell, kind }) {
  return kind === 'area' ? permanentSpazialeAreas.includes(spell) : lasers.includes(spell);
}

function spellMagic({ spell }) {
  return { element: spell.element, variant: spell.variant };
}

function applyPermanentEffect({ spell, kind }, effect, causerOwner) {
  if (!effect) return;
  if (kind === 'area') applyAreaEffect(spell, effect, causerOwner);
  else applyLaserEffect(spell, effect, causerOwner);
}

function spellsTouch(a, b) {
  if (a.kind === 'area' && b.kind === 'area') return polygonsOverlap(a.spell.points, b.spell.points);
  if (a.kind === 'laser' && b.kind === 'laser') return pathsIntersect(a.spell.path, b.spell.path);
  const laser = a.kind === 'laser' ? a.spell : b.spell;
  const area = a.kind === 'area' ? a.spell : b.spell;
  return pathTouchesPolygon(laser.path, area.points);
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

// ⚡ Paralisi: chi sta dentro un'area di fulmine avversaria resta fermo (lo decide il suo client,
// in pvp-manager.js). Qui mostriamo lo stesso effetto sull'avversario dentro le nostre aree.
function updateParalysisVisuals(now) {
  if (!pvpManager || !pvpManager.isActive() || now - lastParalysisCheck < PARALYSIS_CHECK_MS) return;
  lastParalysisCheck = now;
  const body = pvpManager.opponent.position;
  const inside = permanentSpazialeAreas.some(a => a.element === 'fulmine' && !a.variant && pointInPolygon(body, a.points));
  if (inside) applyParalysis('opponent');
}

// Chi tocca un laser avversario subisce danno ogni 0.5 s (lo calcola il client di chi viene colpito)
function updateLaserDamage(now) {
  if (now - lastLaserDamage < LASER_DAMAGE_TICK_MS) return;
  lastLaserDamage = now;
  for (const laser of getOpponentLasers()) {
    if (laser.variant) continue; // le varianti hanno i loro effetti
    if (distanceToPath(playerBody, laser.path) <= LASER_HIT_RADIUS) {
      damageLocalPlayer(laser.damagePerTick || BASE_DAMAGE.laser, laser.element);
    }
  }
}

// Magma ed elettrificazione: scie, scadenza delle magie trasformate e danno ai caster
function updateVariantEffects() {
  const now = Date.now();

  for (const p of projectiles) {
    if (!p.magma || p.hit) continue;
    p.trailTick = (p.trailTick || 0) + 1;
    if (p.trailTick % 3 === 0) {
      magmaTrail.push({ x: p.x, y: p.y, expiresAt: now + MAGMA_TRAIL_MS, atk: p.magmaAtk || playerStats.atk });
    }
  }
  magmaTrail = magmaTrail.filter(t => t.expiresAt > now);

  permanentSpazialeAreas
    .filter(a => a.expiresAt && a.expiresAt <= now)
    .forEach(a => removeSpazialeAreaById(a.id));
  lasers
    .filter(l => l.expiresAt && l.expiresAt <= now)
    .forEach(l => removeLaserById(l.id));

  updateParalysisVisuals(now);
  updateLaserDamage(now);

  if (now - lastVariantDamage < VARIANT_TICK_MS) return;
  // Il danno scala con la media degli ATK dei due caster che hanno creato la variante;
  // con più fonti attive conta la più forte
  const spells = getAllPermanentSpells();
  const strongest = (variant) => {
    const alive = spells.filter(s => isVariantAlive(s, variant, now));
    return alive.length ? Math.max(...alive.map(s => s.variantAtk || playerStats.atk)) : 0;
  };

  let fireDamage = 0;
  const magmaAtk = strongest('magma');
  if (magmaAtk) fireDamage += MAGMA_AREA_DAMAGE * getAtkMultiplier(magmaAtk); // il magma in campo ferisce entrambi
  const touchedTrail = magmaTrail.filter(t => Math.hypot(t.x - playerBody.x, t.y - playerBody.y) < MAGMA_TRAIL_RADIUS);
  if (touchedTrail.length > 0) {
    fireDamage += MAGMA_TRAIL_DAMAGE * getAtkMultiplier(Math.max(...touchedTrail.map(t => t.atk)));
  }

  let shockDamage = 0;
  const chargedAtk = strongest('charged');
  if (chargedAtk) shockDamage += CHARGED_DAMAGE * getAtkMultiplier(chargedAtk); // l'acqua elettrificata ferisce entrambi
  const shocking = projectiles.filter(p => p.charged && !p.hit &&
    Math.hypot(p.x - playerBody.x, p.y - playerBody.y) < CHARGED_SHOCK_RADIUS);
  if (shocking.length > 0) {
    shockDamage += CHARGED_SHOCK_DAMAGE * getAtkMultiplier(Math.max(...shocking.map(p => p.chargedAtk || playerStats.atk)));
  }

  if (fireDamage > 0 || shockDamage > 0) {
    lastVariantDamage = now;
    if (fireDamage > 0) damageLocalPlayer(fireDamage, 'fuoco');      // il magma brucia: conta la difesa dal fuoco
    if (shockDamage > 0) damageLocalPlayer(shockDamage, 'fulmine');
  }
}

function updateMagicInteractions() {
  updateLasers();
  updateProjectileAreaInteractions();
  updateProjectileLaserInteractions();
  updateProjectileCollisions();
  updatePermanentSpellInteractions();
  updateVariantEffects();
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
    case 'fulmine':
      // Scariche che esplodono verso l'esterno, con un lampo al centro
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 2;
        newParticles.push({
          x: x + Math.cos(angle) * 6,
          y: y + Math.sin(angle) * 6,
          radius: Math.random() * 2.5 + 1.5,
          alpha: 0.9,
          dx: Math.cos(angle) * speed,
          dy: Math.sin(angle) * speed,
          element: 'fulmine',
          angle,
          color: `rgba(255, 255, ${120 + Math.random() * 135}, ${Math.random() * 0.4 + 0.6})`
        });
      }
      for (let i = 0; i < 6; i++) {
        newParticles.push({
          x, y,
          radius: 14 - i * 2,
          alpha: 0.5,
          dx: 0,
          dy: 0,
          color: 'rgba(255, 255, 220, 0.5)'
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

// Tratto del simbolo in disegno: arrotondato e a spessore variabile (solo visivo)
function drawPath() {
  drawBrushStroke(ctx, points, { color: "rgba(190, 245, 255, 0.85)", glow: "rgba(0, 234, 255, 0.8)", width: 5 });
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
  questCombat('mana_spent', { amount });
  return true;
}

// Burnout: niente magie per 5 secondi e le magie attive si annullano
function triggerBurnout() {
  const alreadyInBurnout = getManaValues().inBurnout;
  setManaValues({ burnout: true, burnoutT: BURNOUT_FRAMES, current: 0 });
  removeAllSpazialeAreas();
  removeAllLasers();
  if (alreadyInBurnout) return;
  // Sovraccarico: lampo rosso, scossone, onda che esplode dal giocatore
  triggerScreenFlash('#ff2020', 0.35, 600);
  triggerCameraShake(12, 450);
  spawnRing(playerBody.x, playerBody.y, { color: '#ff3030', from: 10, to: 220, duration: 700, width: 4 });
  playSfx('burnout');
}

function regenMana() {
  let { mana, manaMax, manaRecoverSpeed, inBurnout, burnoutTimer } = getManaValues();
  if (inBurnout) {
    burnoutTimer -= frameScale;
    if (burnoutTimer <= 0) {
      inBurnout = false;
      mana = manaMax * 0.2;
      // Si può di nuovo lanciare: il mana torna con un'onda azzurra che si raccoglie sul giocatore
      triggerScreenFlash('#00eaff', 0.1, 400);
      spawnRing(playerBody.x, playerBody.y, { color: '#00eaff', from: 160, to: 14, duration: 520, width: 2 });
      playSfx('manaRestored');
    }
  } else if (mana < manaMax) {
    // Dentro una magia rigogliosa: rigenerazione aumentata (vale per entrambi i caster)
    const regenMultiplier = isLushActive() ? LUSH_MANA_REGEN_MULTIPLIER : 1;
    mana = Math.min(manaMax, mana + manaRecoverSpeed * regenMultiplier * frameScale);
  }
  setManaValues({ current: mana, burnout: inBurnout, burnoutT: burnoutTimer });
}

function incrementaAffinitaBuffer(elemento, valore = 1) {
  affinityToAdd[elemento] = (affinityToAdd[elemento] || 0) + valore;
}

function incrementaProiezioneUsataBuffer(tipo, valore = 1) {
  proiezioniToAdd[tipo] = (proiezioniToAdd[tipo] || 0) + valore;
}

function incrementaSegnoDisegnatoBuffer(segno) {
  segniToAdd[segno] = (segniToAdd[segno] || 0) + 1;
}

// Esperienza, livello e mana sono tenuti in memoria (questa pagina è l'unica a modificarli)
// e salvati su Firebase: niente più letture/scritture concorrenti che si sovrascrivono.
function flushExperience() {
  if (!playerLoaded || expToAdd <= 0) return;
  playerExp += expToAdd;
  expToAdd = 0;

  // Salire di livello non cambia le statistiche: dà un punto abilità da spendere nelle info giocatore
  const previousLevel = playerLevel;
  while (playerExp >= getExpToNext(playerLevel)) {
    playerExp -= getExpToNext(playerLevel);
    playerLevel++;
  }
  if (playerLevel > previousLevel) {
    const points = playerLevel - previousLevel;
    showBanner(`Livello ${playerLevel}`, points > 1 ? `+${points} punti abilità` : '+1 punto abilità');
    playSfx('levelUp');
    spawnRing(playerBody.x, playerBody.y, { color: '#55ff71', from: 10, to: 180, duration: 800, width: 3 });
  }

  savePlayerData(username, {
    esperienza: playerExp,
    livello: playerLevel
  }).catch(error => console.error('❌ Errore salvataggio esperienza:', error));
  drawExpBar();
}

function flushCounters() {
  const groups = { affinita: affinityToAdd, proiezioniUsate: proiezioniToAdd, segniDisegnati: segniToAdd };
  if (Object.values(groups).every(group => Object.keys(group).length === 0)) return;
  affinityToAdd = {};
  proiezioniToAdd = {};
  segniToAdd = {};
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
  // Il numero del livello "salta" quando cambia (non al primo caricamento)
  if (lvl.dataset.shown && lvl.dataset.shown !== String(playerLevel)) replayClass(lvl, 'bump');
  lvl.dataset.shown = playerLevel;

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
}

// ⚡ Il corpo segue il mouse virtuale, tranne durante la paralisi: resta fermo e,
// finita la paralisi, raggiunge il cursore alla velocità massima normale
function updatePlayerBody() {
  const prevX = playerBody.x;
  const prevY = playerBody.y;
  if (playerBody.attached) {
    playerBody.x = virtualMouse.x;
    playerBody.y = virtualMouse.y;
  } else if (!playerStatus.paralyzed && !playerStatus.stunned) {
    const dx = virtualMouse.x - playerBody.x;
    const dy = virtualMouse.y - playerBody.y;
    const dist = Math.hypot(dx, dy);
    const step = 40 * playerStatus.speedMultiplier;
    if (dist <= step) {
      playerBody.attached = true;
      playerBody.x = virtualMouse.x;
      playerBody.y = virtualMouse.y;
    } else {
      playerBody.x += (dx / dist) * step;
      playerBody.y += (dy / dist) * step;
    }
  }

  virtualMouseEntity.x = playerBody.x;
  virtualMouseEntity.y = playerBody.y;
  const moved = Math.hypot(playerBody.x - prevX, playerBody.y - prevY);
  if (moved > 0) {
    virtualMouseEntity.velocity.x = playerBody.x - prevX;
    virtualMouseEntity.velocity.y = playerBody.y - prevY;
  }
}

function drawReticle(x, y, color, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.arc(x, y, 12, 0, 2 * Math.PI);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 6, y);
  ctx.lineTo(x + 6, y);
  ctx.moveTo(x, y - 6);
  ctx.lineTo(x, y + 6);
  ctx.stroke();
  ctx.restore();
}

function drawVirtualMouse() {
  ctx.save();
  // Modalità salvataggio dello spellbook: il puntatore ha i colori invertiti.
  // Il filtro vale per tutto ciò che viene disegnato qui, qualunque sia l'aspetto del puntatore.
  if (isSaveMode()) ctx.filter = 'invert(1)';
  if (playerBody.attached) {
    drawReticle(virtualMouse.x, virtualMouse.y, "#00e0ff");
  } else {
    // Paralizzato: il corpo è fermo, il cursore "virtuale" serve solo a disegnare
    drawReticle(playerBody.x, playerBody.y, getElementColor('fulmine'));
    drawReticle(virtualMouse.x, virtualMouse.y, "#00e0ff", 0.45);
  }
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

// Riflette il vettore v rispetto a una normale (anche non normalizzata)
function reflect(v, normal) {
  const len = Math.hypot(normal.x, normal.y) || 1;
  const nx = normal.x / len, ny = normal.y / len;
  const dot = v.x * nx + v.y * ny;
  return { x: v.x - 2 * dot * nx, y: v.y - 2 * dot * ny };
}

// Raggio pos + dir*t contro il segmento a-b: { t, normal } oppure null
function intersectRayWithSegment(pos, dir, a, b) {
  const ex = b.x - a.x, ey = b.y - a.y;
  const denom = dir.x * ey - dir.y * ex;
  if (Math.abs(denom) < 1e-9) return null;
  const qx = a.x - pos.x, qy = a.y - pos.y;
  const t = (qx * ey - qy * ex) / denom;
  const u = (qx * dir.y - qy * dir.x) / denom;
  if (t <= 1e-6 || u < 0 || u > 1) return null;
  return { t, normal: { x: -ey, y: ex } };
}

// Segmento p-q contro un poligono: primo lato attraversato { t (0..1 lungo p-q), normal } oppure null
function intersectSegmentWithPolygon(p, q, polygon) {
  const dir = { x: q.x - p.x, y: q.y - p.y };
  let best = null;
  for (let i = 0; i < polygon.length - 1; i++) {
    const hit = intersectRayWithSegment(p, dir, polygon[i], polygon[i + 1]);
    if (hit && hit.t <= 1 && (!best || hit.t < best.t)) best = hit;
  }
  return best;
}

function segmentsIntersect(a, b, c, d) {
  const hit = intersectRayWithSegment(a, { x: b.x - a.x, y: b.y - a.y }, c, d);
  return !!hit && hit.t <= 1;
}

function distanceToSegment(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  const t = lenSq ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq)) : 0;
  return Math.hypot(p.x - (a.x + dx * t), p.y - (a.y + dy * t));
}

// Distanza di un punto da una spezzata (il percorso di un laser)
function distanceToPath(p, path) {
  if (!path || path.length < 2) return Infinity;
  let best = Infinity;
  for (let i = 0; i < path.length - 1; i++) {
    best = Math.min(best, distanceToSegment(p, path[i], path[i + 1]));
  }
  return best;
}

function pathsIntersect(pathA, pathB) {
  if (!pathA || !pathB) return false;
  for (let i = 0; i < pathA.length - 1; i++) {
    for (let j = 0; j < pathB.length - 1; j++) {
      if (segmentsIntersect(pathA[i], pathA[i + 1], pathB[j], pathB[j + 1])) return true;
    }
  }
  return false;
}

// Il laser tocca un'area se un suo tratto ne attraversa il bordo o se un suo vertice è dentro
function pathTouchesPolygon(path, polygon) {
  if (!path || path.length < 2) return false;
  if (path.some(p => pointInPolygon(p, polygon))) return true;
  for (let i = 0; i < path.length - 1; i++) {
    if (intersectSegmentWithPolygon(path[i], path[i + 1], polygon)) return true;
  }
  return false;
}


// ============================================================
// LOOP PRINCIPALE
// ============================================================

// Fuori dall'arena PvP lo schermo è oscurato, con un bordo che ne segna il limite
function drawArenaFrame() {
  if (!world.fixed) return;
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
  if (world.fixed) {
    ctx.beginPath();
    ctx.rect(0, 0, world.width, world.height);
    ctx.clip();
  }
}

const OPPONENT_AREA_TINT = '#ff4d4d';

// Disegna le aree (nostre e dell'avversario) sul canvas WebGL con la stessa trasformazione del 2D
function renderAreaShaders() {
  if (!areaShader.ok) return;
  const areas = permanentSpazialeAreas.map(area => ({
    points: area.points,
    element: area.element,
    variant: area.variant,
    tint: area.element === 'spaziale' ? DEFAULT_SPAZIALE_COLOR : getElementColor(area.element)
  }));
  for (const area of getOpponentAreas()) {
    areas.push({
      points: area.points,
      element: area.element || 'spaziale',
      variant: area.variant,
      tint: OPPONENT_AREA_TINT,
      tintMix: area.variant ? 0 : 0.45
    });
  }
  const t = ctx.getTransform();
  const clip = world.fixed
    ? { x: t.e, y: t.f, width: world.width * t.a, height: world.height * t.d }
    : null;
  areaShader.render(areas, t, clip);
}

// Suoni continui delle magie in campo, nostre e dell'avversario: un loop per elemento delle aree,
// uno per elemento dei laser (il suono di accensione è l'inizio del loop) e quello dei cerchi magici
const activeSpatialLoops = new Set();
function updatePermanentSpellSounds() {
  const wanted = new Set([...permanentSpazialeAreas, ...getOpponentAreas()]
    .map(a => a.element)
    .filter(isElement));
  for (const element of ELEMENTS) {
    const playing = activeSpatialLoops.has(element);
    if (wanted.has(element) === playing) continue;
    audioManager.setSpatialSpellLoopPlaying(element, !playing);
    if (playing) activeSpatialLoops.delete(element);
    else activeSpatialLoops.add(element);
  }
  const laserElements = new Set([...lasers, ...getOpponentLasers()].map(l => l.element || null));
  for (const element of [null, ...ELEMENTS]) {
    audioManager.setLaserLoopPlaying(element, laserElements.has(element));
  }
  const opponentCircle = pvpManager && pvpManager.isActive() && pvpManager.opponent.magicCircle;
  audioManager.setMagicCircleLoopPlaying(!!magicCircle || !!opponentCircle);
}

// Tempo reale dall'ultimo frame (limitato, così una pausa della scheda non fa "saltare" le magie)
function updateFrameTime() {
  const now = performance.now();
  frameMs = Math.min(now - lastFrameTime, FRAME_MS * 3);
  frameScale = frameMs / FRAME_MS;
  lastFrameTime = now;
}

function animate() {
  updateFrameTime();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  applyCameraShake(ctx);
  drawArenaFrame();
  enterWorldSpace();
  renderAreaShaders();

  updateStatusEffects(frameMs / 1000);
  updateVirtualMouse();
  updatePlayerBody();
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
  drawFx(ctx);

  if (pvpManager && pvpManager.isActive()) {
    pvpManager.syncWithMainGame({
      virtualMouse,
      playerBody,
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
  if (showChargeParticles) drawNextChargeParticles();
  if (showChargeReticle) drawSelectedChargeMarker();
  updateMagicInteractions();
  updateProjectiles();
  drawMagmaTrail();
  drawSpazialePolygon();
  drawPermanentSpazialeAreas();
  drawLasers();
  updateSpazialeAreas();
  updatePermanentSpellSounds();

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
  drawScreenFlash(ctx, canvas);

  circleRotation += 0.003 * frameScale;
  drawManaSegments();
  ctx.restore();

  requestAnimationFrame(animate);
}

initializeGameMode();
audioManager.loadAllSounds();
loadPlayerProgress();
animate();
