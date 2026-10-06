// sfx.js - Suoni brevi di interfaccia e di "transizione", sintetizzati con Web Audio (nessun file).
// Ogni suono è una ricetta in RECIPES. Per sostituirne uno con un file vero basta aggiungere il percorso
// in SFX_FILES con la stessa chiave (es. click: '/sound/ui/click.wav'): se il file si carica viene
// usato al posto della sintesi. Il volume è quello delle impostazioni (localStorage 'audioVolume').

const SFX_FILES = {
  // click: '/sound/ui/click.wav',
  // pageOut: '/sound/ui/page-out.wav',
};

let ctx = null;
let master = null;
let reverbSend = null;
let noiseBuffer = null;
let shaperCurve = null;
// Bus del suono che si sta costruendo: permette di scalarne il volume (opts.volume)
let bus = null;
let wetBus = null;
const fileBuffers = new Map();
const lastPlayed = new Map();

function readVolume() {
  const saved = parseInt(localStorage.getItem('audioVolume'), 10);
  return Number.isNaN(saved) ? 0.5 : Math.max(0, Math.min(1, saved / 100));
}

// Il contesto nasce al primo gesto dell'utente: prima il browser lo terrebbe sospeso
// e i suoni si accumulerebbero per partire tutti insieme al primo click.
function unlock() {
  if (!ctx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    ctx = new AudioContextClass();
    buildGraph();
    loadFiles();
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
}
for (const type of ['pointerdown', 'keydown']) {
  window.addEventListener(type, unlock, { capture: true, passive: true });
}

function buildGraph() {
  master = ctx.createGain();
  // Limitatore: più suoni sovrapposti non distorcono
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -10;
  limiter.knee.value = 8;
  limiter.ratio.value = 6;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.2;
  master.connect(limiter).connect(ctx.destination);

  const convolver = ctx.createConvolver();
  convolver.buffer = makeImpulse(1.8, 2.6);
  reverbSend = ctx.createGain();
  reverbSend.gain.value = 0.3;
  reverbSend.connect(convolver).connect(master);
}

function makeImpulse(seconds, decay) {
  const length = Math.floor(ctx.sampleRate * seconds);
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const data = impulse.getChannelData(c);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
  }
  return impulse;
}

function getNoise() {
  if (!noiseBuffer) {
    const length = ctx.sampleRate * 2;
    noiseBuffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
}

function getShaperCurve() {
  if (!shaperCurve) {
    shaperCurve = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) {
      const x = (i / 1023) * 2 - 1;
      shaperCurve[i] = Math.tanh(x * 4);
    }
  }
  return shaperCurve;
}

async function loadFiles() {
  for (const [name, url] of Object.entries(SFX_FILES)) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(response.status);
      fileBuffers.set(name, await ctx.decodeAudioData(await response.arrayBuffer()));
    } catch (error) {
      console.warn(`⚠️ sfx: impossibile caricare '${name}' da ${url}, uso il suono sintetizzato`, error);
    }
  }
}

// --- Mattoncini ---

// Uscita di un singolo strato: panning (anche in movimento) e mandata al riverbero
function output({ start, duration, pan = 0, panTo = null, wet = 0.3 }) {
  const input = ctx.createGain();
  let node = input;
  if ((pan || panTo !== null) && ctx.createStereoPanner) {
    const panner = ctx.createStereoPanner();
    panner.pan.setValueAtTime(pan, start);
    if (panTo !== null) panner.pan.linearRampToValueAtTime(panTo, start + duration);
    node.connect(panner);
    node = panner;
  }
  node.connect(bus);
  if (wet > 0) {
    const send = ctx.createGain();
    send.gain.value = wet;
    node.connect(send).connect(wetBus);
  }
  return input;
}

// Inviluppo attacco/decadimento esponenziale
function envelope(param, start, attack, decay, peak) {
  param.setValueAtTime(0.0001, start);
  param.exponentialRampToValueAtTime(Math.max(0.0002, peak), start + attack);
  param.exponentialRampToValueAtTime(0.0001, start + attack + decay);
}

// Frequenza fissa, glissando (to) oppure [inizio, picco a fine attacco, fine]
function sweep(param, start, attack, decay, freq, to) {
  if (Array.isArray(freq)) {
    param.setValueAtTime(freq[0], start);
    param.exponentialRampToValueAtTime(freq[1], start + attack);
    param.exponentialRampToValueAtTime(freq[2], start + attack + decay);
  } else {
    param.setValueAtTime(freq, start);
    if (to) param.exponentialRampToValueAtTime(to, start + attack + decay);
  }
}

function tone({ type = 'sine', freq = 440, to = null, t = 0, attack = 0.005, decay = 0.25, gain = 0.2, detune = 0, pan = 0, panTo = null, wet = 0.3, drive = false }) {
  const start = ctx.currentTime + t;
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.detune.value = detune;
  sweep(osc.frequency, start, attack, decay, freq, to);
  const amp = ctx.createGain();
  envelope(amp.gain, start, attack, decay, gain);
  let node = osc;
  if (drive) {
    const shaper = ctx.createWaveShaper();
    shaper.curve = getShaperCurve();
    node = node.connect(shaper);
  }
  node.connect(amp).connect(output({ start, duration: attack + decay, pan, panTo, wet }));
  osc.start(start);
  osc.stop(start + attack + decay + 0.05);
}

function noise({ t = 0, attack = 0.005, decay = 0.3, gain = 0.2, filter = 'bandpass', freq = 1000, to = null, q = 1, pan = 0, panTo = null, wet = 0.3 }) {
  const start = ctx.currentTime + t;
  const src = ctx.createBufferSource();
  src.buffer = getNoise();
  src.loop = true;
  const biquad = ctx.createBiquadFilter();
  biquad.type = filter;
  biquad.Q.value = q;
  sweep(biquad.frequency, start, attack, decay, freq, to);
  const amp = ctx.createGain();
  envelope(amp.gain, start, attack, decay, gain);
  src.connect(biquad).connect(amp).connect(output({ start, duration: attack + decay, pan, panTo, wet }));
  src.start(start, Math.random() * 1.5);
  src.stop(start + attack + decay + 0.05);
}

// Campana: parziali leggermente inarmoniche (metallic = più "rune incise", meno vetro)
function bell(freq, { t = 0, decay = 0.8, gain = 0.12, pan = 0, wet = 0.5, metallic = false } = {}) {
  const partials = metallic
    ? [[1, 1], [2.76, 0.45], [5.4, 0.22], [8.93, 0.1]]
    : [[1, 1], [2.01, 0.4], [3.02, 0.18], [4.17, 0.08]];
  partials.forEach(([ratio, amp], i) => {
    tone({ freq: freq * ratio, t, attack: 0.002, decay: decay / (1 + i * 0.7), gain: gain * amp, pan, wet });
  });
}

const arpeggio = (notes, { step = 0.07, t = 0, ...opts } = {}) =>
  notes.forEach((f, i) => bell(f, { t: t + i * step, ...opts }));

// --- Ricette ---
// Note (Hz): C5 523.25, E5 659.25, G5 783.99, A5 880, B5 987.77, C6 1046.5, E6 1318.5, G6 1567.98, B6 1975.53

const RECIPES = {
  // Interfaccia
  hover: () => tone({ freq: 2100, to: 2500, attack: 0.002, decay: 0.05, gain: 0.03, wet: 0.15 }),
  click: () => {
    noise({ filter: 'bandpass', freq: 3800, q: 2, attack: 0.001, decay: 0.04, gain: 0.18, wet: 0.1 });
    tone({ type: 'triangle', freq: 1320, to: 880, attack: 0.002, decay: 0.12, gain: 0.08, wet: 0.25 });
  },
  tick: ({ value = 0.5 } = {}) => tone({ type: 'triangle', freq: 500 + value * 900, attack: 0.001, decay: 0.05, gain: 0.07, wet: 0.1 }),
  toggle: ({ on = true } = {}) => {
    tone({ type: 'triangle', freq: on ? 660 : 990, to: on ? 990 : 660, attack: 0.004, decay: 0.16, gain: 0.08, wet: 0.3 });
    bell(on ? 1318.5 : 987.77, { t: 0.08, decay: 0.5, gain: 0.05 });
  },
  // Transizione di pagina: un "portale" che si chiude, soffio che sale e accordo luminoso
  pageOut: () => {
    noise({ filter: 'bandpass', freq: [380, 2800, 700], q: 1.3, attack: 0.24, decay: 0.3, gain: 0.22, wet: 0.5 });
    [880, 1108.73, 1318.5].forEach((f, i) =>
      tone({ freq: f, t: 0.04 + i * 0.05, attack: 0.08, decay: 0.45, gain: 0.035, detune: (i - 1) * 6, wet: 0.8 }));
  },
  // Pannelli che scorrono (direction 1 = verso destra)
  slide: ({ direction = 1 } = {}) => {
    noise({ filter: 'bandpass', freq: [300, 2200, 500], q: 1.4, attack: 0.2, decay: 0.35, gain: 0.2, pan: -0.7 * direction, panTo: 0.7 * direction, wet: 0.35 });
    tone({ freq: 660, to: 1320, attack: 0.15, decay: 0.3, gain: 0.025, wet: 0.6 });
  },
  modalOpen: () => {
    noise({ filter: 'highpass', freq: [1500, 4000, 3000], q: 0.7, attack: 0.12, decay: 0.2, gain: 0.05, wet: 0.5 });
    [1318.5, 1975.53].forEach((f, i) => tone({ type: 'triangle', freq: f, t: i * 0.06, attack: 0.004, decay: 0.35, gain: 0.06, wet: 0.6 }));
  },
  modalClose: () => {
    [1975.53, 1318.5].forEach((f, i) => tone({ type: 'triangle', freq: f, t: i * 0.05, attack: 0.004, decay: 0.25, gain: 0.04, wet: 0.5 }));
  },
  error: () => {
    [0, 0.11].forEach(t => {
      tone({ type: 'triangle', freq: 220, to: 175, t, attack: 0.004, decay: 0.13, gain: 0.14, wet: 0.15 });
      tone({ type: 'square', freq: 110, to: 88, t, attack: 0.004, decay: 0.1, gain: 0.025, wet: 0 });
    });
  },
  success: () => arpeggio([783.99, 987.77, 1174.66, 1567.98], { step: 0.07, decay: 0.7, gain: 0.07 }),
  spend: () => {
    noise({ filter: 'bandpass', freq: [500, 4200, 4200], q: 2, attack: 0.18, decay: 0.08, gain: 0.08, wet: 0.3 });
    tone({ type: 'triangle', freq: 523.25, to: 1046.5, attack: 0.02, decay: 0.2, gain: 0.06, wet: 0.3 });
    bell(1567.98, { t: 0.18, decay: 0.7, gain: 0.08 });
  },
  matchFound: () => {
    tone({ freq: 110, to: 55, attack: 0.005, decay: 0.6, gain: 0.35, wet: 0.3 });
    noise({ filter: 'highpass', freq: [3000, 6000, 4000], q: 0.5, attack: 0.05, decay: 0.6, gain: 0.05, wet: 0.7 });
    arpeggio([659.25, 783.99, 987.77, 1318.5], { t: 0.05, step: 0.08, decay: 0.9, gain: 0.08 });
  },

  // Gioco
  // Cerchio magico evocato: rigonfiamento grave + accordo che si accende a cascata
  circleSummon: () => {
    tone({ freq: 196, to: 392, attack: 0.25, decay: 0.7, gain: 0.08, wet: 0.5 });
    noise({ filter: 'bandpass', freq: [200, 1400, 300], q: 0.8, attack: 0.18, decay: 0.5, gain: 0.08, wet: 0.5 });
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
      tone({ type: 'triangle', freq: f, t: i * 0.045, attack: 0.05, decay: 1.0, gain: 0.03, detune: (i % 2 ? 5 : -5), wet: 0.9 }));
  },
  // Runa incisa nel cerchio (elemento o carica): "ping" metallico
  engrave: ({ pitch = 1 } = {}) => {
    noise({ filter: 'highpass', freq: 5000, attack: 0.001, decay: 0.03, gain: 0.08, wet: 0.2 });
    bell(1318.5 * pitch, { decay: 0.6, gain: 0.07, metallic: true, wet: 0.6 });
  },
  // Carica selezionata con la rotella: scatto di una ghiera runica (più acuto verso le ultime cariche)
  select: ({ pitch = 1 } = {}) => {
    noise({ filter: 'bandpass', freq: 4200 * pitch, q: 3, attack: 0.001, decay: 0.025, gain: 0.1, wet: 0.1 });
    tone({ type: 'triangle', freq: 880 * pitch, to: 1100 * pitch, attack: 0.002, decay: 0.07, gain: 0.05, wet: 0.35 });
  },
  // Simbolo non riconosciuto: sbuffo che si spegne
  fizzle: () => {
    noise({ filter: 'lowpass', freq: [2600, 2600, 180], q: 0.8, attack: 0.005, decay: 0.35, gain: 0.12, wet: 0.15 });
    tone({ freq: 480, to: 130, attack: 0.005, decay: 0.28, gain: 0.05, wet: 0.15 });
  },
  // Magia annullata: risucchio verso il basso
  dispel: () => {
    noise({ filter: 'bandpass', freq: [3200, 3200, 260], q: 2.2, attack: 0.06, decay: 0.3, gain: 0.14, wet: 0.35 });
    tone({ type: 'triangle', freq: 1200, to: 220, attack: 0.01, decay: 0.32, gain: 0.06, wet: 0.4 });
  },
  // Cerchio che svanisce dopo l'ultima carica
  circleFade: () => arpeggio([1046.5, 783.99], { step: 0.08, decay: 0.6, gain: 0.03, wet: 0.8 }),
  burnout: () => {
    tone({ freq: 130, to: 32, attack: 0.005, decay: 0.9, gain: 0.35, wet: 0.3, drive: true });
    noise({ filter: 'lowpass', freq: [4000, 4000, 90], q: 0.7, attack: 0.005, decay: 0.8, gain: 0.25, wet: 0.4 });
    tone({ freq: 3520, attack: 0.02, decay: 1.8, gain: 0.015, wet: 0.2 }); // fischio nelle orecchie
  },
  manaRestored: () => {
    noise({ filter: 'bandpass', freq: [300, 5000, 5000], q: 1.5, attack: 0.35, decay: 0.15, gain: 0.07, wet: 0.5 });
    arpeggio([659.25, 830.61, 987.77], { t: 0.3, step: 0.05, decay: 0.9, gain: 0.06 });
  },
  levelUp: () => {
    tone({ freq: 130.81, attack: 0.02, decay: 1.2, gain: 0.12, wet: 0.5 });
    arpeggio([523.25, 659.25, 783.99, 1046.5, 1318.5], { step: 0.08, decay: 1.1, gain: 0.08 });
    noise({ filter: 'highpass', freq: [4000, 7000, 5000], q: 0.5, attack: 0.3, decay: 0.8, gain: 0.04, t: 0.25, wet: 0.8 });
  },
  hit: () => {
    tone({ freq: 170, to: 48, attack: 0.002, decay: 0.22, gain: 0.3, wet: 0.1 });
    noise({ filter: 'lowpass', freq: 1400, attack: 0.001, decay: 0.08, gain: 0.2, wet: 0.1 });
  },
  // Colpo andato a segno sull'avversario
  hitConfirm: () => {
    bell(1975.53, { decay: 0.25, gain: 0.05, metallic: true, wet: 0.2 });
    tone({ type: 'triangle', freq: 880, to: 1320, attack: 0.002, decay: 0.08, gain: 0.05, wet: 0.1 });
  },
  victory: () => {
    tone({ freq: 130.81, attack: 0.3, decay: 2, gain: 0.12, wet: 0.6 });
    arpeggio([523.25, 659.25, 783.99], { step: 0.06, decay: 1.2, gain: 0.07 });
    arpeggio([698.46, 880, 1046.5], { t: 0.35, step: 0.06, decay: 1.2, gain: 0.07 });
    arpeggio([783.99, 987.77, 1174.66, 1567.98], { t: 0.7, step: 0.06, decay: 1.8, gain: 0.08 });
  },
  defeat: () => {
    tone({ freq: 98, attack: 0.4, decay: 2.2, gain: 0.12, wet: 0.6 });
    [392, 369.99, 311.13, 261.63].forEach((f, i) =>
      tone({ type: 'triangle', freq: f, t: i * 0.28, attack: 0.02, decay: 0.8, gain: 0.07, wet: 0.6 }));
  },
  draw: () => {
    tone({ freq: 523.25, attack: 0.3, decay: 1.5, gain: 0.06, wet: 0.7 });
    tone({ freq: 783.99, attack: 0.3, decay: 1.5, gain: 0.05, wet: 0.7 });
  }
};

function playBuffer(buffer) {
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.connect(bus);
  src.start();
}

/**
 * Riproduce un effetto. opts: parametri della ricetta, più
 *  - volume (0..1, moltiplica il volume generale)
 *  - throttle (ms minimi tra due riproduzioni dello stesso suono, default 30)
 */
export function playSfx(name, opts = {}) {
  if (!ctx || ctx.state !== 'running') return;
  const now = performance.now();
  if (now - (lastPlayed.get(name) || 0) < (opts.throttle ?? 30)) return;
  lastPlayed.set(name, now);

  const volume = readVolume() * (opts.volume ?? 1);
  if (volume <= 0) return;
  master.gain.value = 1;
  bus = ctx.createGain();
  bus.gain.value = volume;
  bus.connect(master);
  wetBus = ctx.createGain();
  wetBus.gain.value = volume;
  wetBus.connect(reverbSend);

  const buffer = fileBuffers.get(name);
  if (buffer) playBuffer(buffer);
  else RECIPES[name]?.(opts);
}
