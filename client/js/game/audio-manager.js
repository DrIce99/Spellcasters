// audio-manager.js - Gestione SFX per Spellcasters

class AudioManager {
    constructor() {
        // Inizializza il contesto audio se non esiste
        this.audioContext = null;
        this.initAudioContext();

        // Stato globale per l'audio
        this.enabled = true;
        this.globalVolume = 1.0; // Volume generale (0.0 a 1.0)

        // Buffer audio caricati
        this.audioBuffers = new Map();

        // Sorgenti attive (per gestire loop e stop)
        this.activeSources = new Map(); // key: 'id', value: AudioBufferSourceNode

        this.globalVolume = this.loadGlobalVolume();
        window.addEventListener('storage', (e) => {
            if (e.key === 'audioVolume') {
                this.globalVolume = this.loadGlobalVolume();
                console.log(`🔊 AudioManager: Volume globale aggiornato a ${this.globalVolume}`);
            }
        });

        // Tipi di suoni definiti
        this.soundTypes = {
            // --- Suoni Attuali ---
            MAGIC_CIRCLE_ACTIVE: 'magic_circle_active',
            PROJECTILE_NEUTRAL: 'projectile_neutral',
            PROJECTILE_FUOCO: 'projectile_fuoco',
            PROJECTILE_ACQUA: 'projectile_acqua',
            PROJECTILE_ARIA: 'projectile_aria',
            PROJECTILE_TERRA: 'projectile_terra',
            // --- Suoni Futuri ---
            SPELL_SPATIAL_NEUTRAL: 'spell_spatial_neutral',
            SPELL_SPATIAL_FUOCO: 'spell_spatial_fuoco',
            SPELL_SPATIAL_ACQUA: 'spell_spatial_acqua',
            SPELL_SPATIAL_ARIA: 'spell_spatial_aria',
            SPELL_SPATIAL_TERRA: 'spell_spatial_terra',
            SPELL_FUOCO: 'spell_fuoco',
            SPELL_ACQUA: 'spell_acqua',
            SPELL_ARIA: 'spell_aria',
            SPELL_TERRA: 'spell_terra',
            COLLISION_1: 'collision_1',
            COLLISION_2: 'collision_2',
            COLLISION_3: 'collision_3',
            COLLISION_4: 'collision_4',
            DRAW_1: 'draw_1',
            DRAW_2: 'draw_2',
            DRAW_3: 'draw_3',
            DRAW_4: 'draw_4',
            DRAW_5: 'draw_5',
            DRAW_6: 'draw_6',
            DRAW_7: 'draw_7',
            DRAW_8: 'draw_8',
            DRAW_9: 'draw_9',
            DRAW_10: 'draw_10',
            DRAW_11: 'draw_11',
            DRAW_12: 'draw_12',
            DRAW_13: 'draw_13',
            DRAW_14: 'draw_14',
            DRAW_15: 'draw_15',
            DRAW_16: 'draw_16',
            DRAW_17: 'draw_17',
            DRAW_18: 'draw_18',
            DRAW_19: 'draw_19',
            DRAW_20: 'draw_20',
            DRAW_21: 'draw_21',
            DRAW_22: 'draw_22',
            DRAW_23: 'draw_23',
            DRAW_24: 'draw_24',
            DRAW_25: 'draw_25',
            DRAW_26: 'draw_26',
            DRAW_27: 'draw_27',
            DRAW_28: 'draw_28',
            DRAW_29: 'draw_29',
            DRAW_30: 'draw_30',
            DRAW_31: 'draw_31',
            DRAW_32: 'draw_32',
            DRAW_33: 'draw_33',
            DRAW_34: 'draw_34',
            DRAW_35: 'draw_35',
            DRAW_36: 'draw_36',
            DRAW_37: 'draw_37',
            DRAW_38: 'draw_38',
            DRAW_39: 'draw_39',
            DRAW_40: 'draw_40',
            CLOCK: 'clock_sound',
            START_1: 'start_1',
            START_2: 'start_2',
            PROJECTILE_FULMINE: 'projectile_fulmine',
            SPELL_FULMINE: 'spell_fulmine',
            // Laser: per ogni elemento un "init" (con l'attacco) seguito senza stacchi dal loop "cont"
            LASER_INIT_NEUTRAL: 'laser_init_neutral',
            LASER_CONT_NEUTRAL: 'laser_cont_neutral',
            LASER_INIT_FUOCO: 'laser_init_fuoco',
            LASER_CONT_FUOCO: 'laser_cont_fuoco',
            LASER_INIT_ACQUA: 'laser_init_acqua',
            LASER_CONT_ACQUA: 'laser_cont_acqua',
            LASER_INIT_ARIA: 'laser_init_aria',
            LASER_CONT_ARIA: 'laser_cont_aria',
            LASER_INIT_TERRA: 'laser_init_terra',
            LASER_CONT_TERRA: 'laser_cont_terra',
            LASER_INIT_FULMINE: 'laser_init_fulmine',
            LASER_CONT_FULMINE: 'laser_cont_fulmine',
            // --- Suoni generati al volo (nessun file audio) ---
            SPELL_SPATIAL_FULMINE: 'spell_spatial_fulmine',
            FULMINE_BOUNCE: 'fulmine_bounce'
        };

        // Percorsi relativi a client/public (Vite li serve dalla root del sito)
        this.soundFiles = {
            // [ES: 'nome_sfx']: 'path/to/audio/file.wav'
            // --- ATTUALI ---
            [this.soundTypes.MAGIC_CIRCLE_ACTIVE]: '/sound/sfx/magic circle.wav', // Esempio
            [this.soundTypes.PROJECTILE_NEUTRAL]: '/sound/sfx/proj/right neutral swoosh.wav',
            [this.soundTypes.PROJECTILE_FUOCO]: '/sound/sfx/proj/right fire swoosh.wav',
            [this.soundTypes.PROJECTILE_ACQUA]: '/sound/sfx/proj/right water swoosh.wav',
            [this.soundTypes.PROJECTILE_ARIA]: '/sound/sfx/proj/right air swoosh.wav',
            [this.soundTypes.PROJECTILE_TERRA]: '/sound/sfx/proj/right earth swoosh.wav',
            // --- FUTURI ---
            // SPELL_SPATIAL_NEUTRAL: file non ancora creato (l'area neutra per ora è silenziosa)
            [this.soundTypes.SPELL_SPATIAL_FUOCO]: '/sound/sfx/hold/fire hold.wav',
            [this.soundTypes.SPELL_SPATIAL_ACQUA]: '/sound/sfx/hold/water hold.wav',
            [this.soundTypes.SPELL_SPATIAL_ARIA]: '/sound/sfx/hold/air hold.wav',
            [this.soundTypes.SPELL_SPATIAL_TERRA]: '/sound/sfx/hold/earth hold.wav',
            [this.soundTypes.SPELL_FUOCO]: '/sound/sfx/simple/fire single.wav',
            [this.soundTypes.SPELL_ACQUA]: '/sound/sfx/simple/water single.wav',
            [this.soundTypes.SPELL_ARIA]: '/sound/sfx/simple/air single.wav',
            [this.soundTypes.SPELL_TERRA]: '/sound/sfx/simple/earth single.wav',
            [this.soundTypes.COLLISION_1]: '/sound/sfx/blade to blade/0.wav',
            [this.soundTypes.COLLISION_2]: '/sound/sfx/blade to blade/289.wav',
            [this.soundTypes.COLLISION_3]: '/sound/sfx/blade to blade/m193.wav',
            [this.soundTypes.COLLISION_4]: '/sound/sfx/blade to blade/m648.wav',
            [this.soundTypes.DRAW_1]: '/sound/sfx/draw/untitled - Track 1_2.wav',
            [this.soundTypes.DRAW_2]: '/sound/sfx/draw/untitled - Track 2.wav',
            [this.soundTypes.DRAW_3]: '/sound/sfx/draw/untitled - Track 3.wav',
            [this.soundTypes.DRAW_4]: '/sound/sfx/draw/untitled - Track 4.wav',
            [this.soundTypes.DRAW_5]: '/sound/sfx/draw/untitled - Track 5.wav',
            [this.soundTypes.DRAW_6]: '/sound/sfx/draw/untitled - Track 6.wav',
            [this.soundTypes.DRAW_7]: '/sound/sfx/draw/untitled - Track 7.wav',
            [this.soundTypes.DRAW_8]: '/sound/sfx/draw/untitled - Track 8.wav',
            [this.soundTypes.DRAW_9]: '/sound/sfx/draw/untitled - Track 9.wav',
            [this.soundTypes.DRAW_10]: '/sound/sfx/draw/untitled - Track 10.wav',
            [this.soundTypes.DRAW_11]: '/sound/sfx/draw/untitled - Track 11.wav',
            [this.soundTypes.DRAW_12]: '/sound/sfx/draw/untitled - Track 12.wav',
            [this.soundTypes.DRAW_13]: '/sound/sfx/draw/untitled - Track 13.wav',
            [this.soundTypes.DRAW_14]: '/sound/sfx/draw/untitled - Track 14.wav',
            [this.soundTypes.DRAW_15]: '/sound/sfx/draw/untitled - Track 15.wav',
            [this.soundTypes.DRAW_16]: '/sound/sfx/draw/untitled - Track 16.wav',
            [this.soundTypes.DRAW_17]: '/sound/sfx/draw/untitled - Track 17.wav',
            [this.soundTypes.DRAW_18]: '/sound/sfx/draw/untitled - Track 18.wav',
            [this.soundTypes.DRAW_19]: '/sound/sfx/draw/untitled - Track 19.wav',
            [this.soundTypes.DRAW_20]: '/sound/sfx/draw/untitled - Track 20.wav',
            [this.soundTypes.DRAW_21]: '/sound/sfx/draw/untitled - Track 21.wav',
            [this.soundTypes.DRAW_22]: '/sound/sfx/draw/untitled - Track 22.wav',
            [this.soundTypes.DRAW_23]: '/sound/sfx/draw/untitled - Track 23.wav',
            [this.soundTypes.DRAW_24]: '/sound/sfx/draw/untitled - Track 24.wav',
            [this.soundTypes.DRAW_25]: '/sound/sfx/draw/untitled - Track 25.wav',
            [this.soundTypes.DRAW_26]: '/sound/sfx/draw/untitled - Track 26.wav',
            [this.soundTypes.DRAW_27]: '/sound/sfx/draw/untitled - Track 27.wav',
            [this.soundTypes.DRAW_28]: '/sound/sfx/draw/untitled - Track 28.wav',
            [this.soundTypes.DRAW_29]: '/sound/sfx/draw/untitled - Track 29.wav',
            [this.soundTypes.DRAW_30]: '/sound/sfx/draw/untitled - Track 30.wav',
            [this.soundTypes.DRAW_31]: '/sound/sfx/draw/untitled - Track 31.wav',
            [this.soundTypes.DRAW_32]: '/sound/sfx/draw/untitled - Track 32.wav',
            [this.soundTypes.DRAW_33]: '/sound/sfx/draw/untitled - Track 33.wav',
            [this.soundTypes.DRAW_34]: '/sound/sfx/draw/untitled - Track 34.wav',
            [this.soundTypes.DRAW_35]: '/sound/sfx/draw/untitled - Track 35.wav',
            [this.soundTypes.DRAW_36]: '/sound/sfx/draw/untitled - Track 36.wav',
            [this.soundTypes.DRAW_37]: '/sound/sfx/draw/untitled - Track 37.wav',
            [this.soundTypes.DRAW_38]: '/sound/sfx/draw/untitled - Track 38.wav',
            [this.soundTypes.DRAW_39]: '/sound/sfx/draw/untitled - Track 39.wav',
            [this.soundTypes.DRAW_40]: '/sound/sfx/draw/untitled - Track 40.wav',
            [this.soundTypes.CLOCK]: '/sound/sfx/clock.mp3',
            [this.soundTypes.START_1]: '/sound/sfx/VR_impact_clonk.wav',
            [this.soundTypes.START_2]: '/sound/sfx/VR_impact_clank.wav',
            [this.soundTypes.PROJECTILE_FULMINE]: '/sound/sfx/proj/lightning-proj.wav',
            [this.soundTypes.SPELL_FULMINE]: '/sound/sfx/simple/lightning single.wav',
            [this.soundTypes.LASER_INIT_NEUTRAL]: '/sound/sfx/lasr/magk-lasr-init.wav',
            [this.soundTypes.LASER_CONT_NEUTRAL]: '/sound/sfx/lasr/magk-lasr-cont.wav',
            [this.soundTypes.LASER_INIT_FUOCO]: '/sound/sfx/lasr/fire-lasr-init.wav',
            [this.soundTypes.LASER_CONT_FUOCO]: '/sound/sfx/lasr/fire-lasr-cont.wav',
            [this.soundTypes.LASER_INIT_ACQUA]: '/sound/sfx/lasr/water-lasr-init.wav',
            [this.soundTypes.LASER_CONT_ACQUA]: '/sound/sfx/lasr/water-lasr-cont.wav',
            [this.soundTypes.LASER_INIT_ARIA]: '/sound/sfx/lasr/air-lasr-init.wav',
            [this.soundTypes.LASER_CONT_ARIA]: '/sound/sfx/lasr/air-lasr-cont.wav',
            [this.soundTypes.LASER_INIT_TERRA]: '/sound/sfx/lasr/earth-lasr-init.wav',
            [this.soundTypes.LASER_CONT_TERRA]: '/sound/sfx/lasr/earth-lasr-cont.wav',
            [this.soundTypes.LASER_INIT_FULMINE]: '/sound/sfx/lasr/lightning-lasr-init.wav',
            [this.soundTypes.LASER_CONT_FULMINE]: '/sound/sfx/lasr/lightning-lasr-cont.wav'
        };

        // Coppie init/cont dei laser per elemento ('neutral' = mana puro).
        // Un elemento senza voce qui usa i suoni neutri.
        this.laserSoundTypes = {
            neutral: { init: this.soundTypes.LASER_INIT_NEUTRAL, cont: this.soundTypes.LASER_CONT_NEUTRAL },
            fuoco: { init: this.soundTypes.LASER_INIT_FUOCO, cont: this.soundTypes.LASER_CONT_FUOCO },
            acqua: { init: this.soundTypes.LASER_INIT_ACQUA, cont: this.soundTypes.LASER_CONT_ACQUA },
            aria: { init: this.soundTypes.LASER_INIT_ARIA, cont: this.soundTypes.LASER_CONT_ARIA },
            terra: { init: this.soundTypes.LASER_INIT_TERRA, cont: this.soundTypes.LASER_CONT_TERRA },
            fulmine: { init: this.soundTypes.LASER_INIT_FULMINE, cont: this.soundTypes.LASER_CONT_FULMINE }
        };
        this.laserVoices = new Map(); // elemento -> { gain, sources } dei laser in riproduzione

        // Stato specifico per i loop
        this.loopStates = {
            [this.soundTypes.MAGIC_CIRCLE_ACTIVE]: { isPlaying: false, id: null },
            [this.soundTypes.SPELL_SPATIAL_NEUTRAL]: { isPlaying: false, id: null },
            [this.soundTypes.SPELL_SPATIAL_FUOCO]: { isPlaying: false, id: null },
            [this.soundTypes.SPELL_SPATIAL_ACQUA]: { isPlaying: false, id: null },
            [this.soundTypes.SPELL_SPATIAL_ARIA]: { isPlaying: false, id: null },
            [this.soundTypes.SPELL_SPATIAL_TERRA]: { isPlaying: false, id: null },
            [this.soundTypes.SPELL_SPATIAL_FULMINE]: { isPlaying: false, id: null },
            [this.soundTypes.CLOCK]: { isPlaying: false, id: null },
            // [this.soundTypes.DRAWING_LOOP]: { isPlaying: false, id: null }, // Se implementato come loop
        };

        this.collisionSoundTypes = [
            this.soundTypes.COLLISION_1,
            this.soundTypes.COLLISION_2,
            this.soundTypes.COLLISION_3,
            this.soundTypes.COLLISION_4
        ];

        this.drawingSoundTypes = [
            this.soundTypes.DRAW_1, this.soundTypes.DRAW_2, this.soundTypes.DRAW_3,
            this.soundTypes.DRAW_4, this.soundTypes.DRAW_5, this.soundTypes.DRAW_6,
            this.soundTypes.DRAW_7, this.soundTypes.DRAW_8, this.soundTypes.DRAW_9,
            this.soundTypes.DRAW_10, this.soundTypes.DRAW_11, this.soundTypes.DRAW_12,
            this.soundTypes.DRAW_13, this.soundTypes.DRAW_14, this.soundTypes.DRAW_15,
            this.soundTypes.DRAW_16, this.soundTypes.DRAW_17, this.soundTypes.DRAW_18,
            this.soundTypes.DRAW_19, this.soundTypes.DRAW_20, this.soundTypes.DRAW_21,
            this.soundTypes.DRAW_22, this.soundTypes.DRAW_23, this.soundTypes.DRAW_24,
            this.soundTypes.DRAW_25, this.soundTypes.DRAW_26, this.soundTypes.DRAW_27,
            this.soundTypes.DRAW_28, this.soundTypes.DRAW_29, this.soundTypes.DRAW_30,
            this.soundTypes.DRAW_31, this.soundTypes.DRAW_32, this.soundTypes.DRAW_33,
            this.soundTypes.DRAW_34, this.soundTypes.DRAW_35, this.soundTypes.DRAW_36,
            this.soundTypes.DRAW_37, this.soundTypes.DRAW_38, this.soundTypes.DRAW_39,
            this.soundTypes.DRAW_40
        ];
    }

    loadGlobalVolume() {
        const saved = localStorage.getItem('audioVolume');
        const percent = saved ? parseInt(saved) : 50; // stesso default dello slider nelle impostazioni
        return Math.max(0, Math.min(1, percent / 100));
    }

    resumeContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume().then(() => {
                console.log("🎵 AudioManager: Contesto audio ripreso con successo (post-click).");
            }).catch(err => {
                console.error("❌ AudioManager: Errore nel riprendere il contesto audio:", err);
            });
        }
    }

    initAudioContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log("🎵 AudioManager: Contesto audio inizializzato.");

            // --- 🎧 Reverb di base ---
            this.convolver = this.audioContext.createConvolver();

            // Se hai un file impulse response (es. 'reverb_hall.wav'):
            fetch('/sound/impulse/reverb_hall.wav')
                .then(res => {
                    if (!res.ok) throw new Error('impulse non trovato');
                    return res.arrayBuffer();
                })
                .then(buf => this.audioContext.decodeAudioData(buf))
                .then(decoded => {
                    this.convolver.buffer = decoded;
                    console.log("🌫️ AudioManager: Reverb caricato da file impulse.");
                })
                .catch(() => {
                    console.warn("⚠️ AudioManager: Nessun file di impulse trovato, uso reverb sintetico.");
                    this.convolver.buffer = this.generateSimpleReverbImpulse(2.5, 2.0);
                });

            // Crea un nodo di mix per controllare la quantità di reverb
            this.reverbGain = this.audioContext.createGain();
            this.reverbGain.gain.value = 0.35; // regolabile (0.0 = secco, 1.0 = molto riverberato)

            // Collega la catena audio globale
            this.convolver.connect(this.reverbGain);
            this.reverbGain.connect(this.audioContext.destination);
        }
    }

    generateSimpleReverbImpulse(duration = 2.0, decay = 2.0) {
        const rate = this.audioContext.sampleRate;
        const length = rate * duration;
        const impulse = this.audioContext.createBuffer(2, length, rate);
        for (let i = 0; i < 2; i++) {
            const channel = impulse.getChannelData(i);
            for (let j = 0; j < length; j++) {
                channel[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / length, decay);
            }
        }
        return impulse;
    }

    // Suoni senza file audio, generati qui: il ronzio delle aree di fulmine e il rimbalzo del fulmine.
    // Per sostituirli basta aggiungere il file in soundFiles con la stessa chiave.
    createSynthesizedSounds() {
        const ctx = this.audioContext;
        const rate = ctx.sampleRate;
        const TWO_PI = Math.PI * 2;
        const make = (seconds, fill) => {
            const length = Math.floor(rate * seconds);
            const buffer = ctx.createBuffer(1, length, rate);
            const data = buffer.getChannelData(0);
            fill(data, length);
            // Normalizza il picco
            let peak = 0;
            for (let i = 0; i < length; i++) peak = Math.max(peak, Math.abs(data[i]));
            if (peak > 0) for (let i = 0; i < length; i++) data[i] *= 0.8 / peak;
            return buffer;
        };
        // Rumore "a scatti": il volume cambia ogni pochi millisecondi, come uno scoppiettio
        const crackle = () => {
            let gate = 1;
            let low = 0;
            return (i) => {
                if (i % 160 === 0) gate = Math.random() < 0.45 ? 1 : 0.08;
                low += ((Math.random() * 2 - 1) - low) * 0.6;
                return low * gate;
            };
        };

        const synthesized = {
            // Rimbalzo del fulmine: solo lo scoppiettio elettrico, che si spegne in fretta
            [this.soundTypes.FULMINE_BOUNCE]: make(0.45, (data, length) => {
                const noise = crackle();
                for (let i = 0; i < length; i++) {
                    const t = i / rate;
                    data[i] = Math.exp(-t * 7) * noise(i);
                }
            }),
            // Ronzio elettrico continuo (loop: frequenze intere sui 2 s per non avere scatti)
            [this.soundTypes.SPELL_SPATIAL_FULMINE]: make(2, (data, length) => {
                const noise = crackle();
                const edge = Math.floor(rate * 0.05);
                for (let i = 0; i < length; i++) {
                    const t = i / rate;
                    const saw = ((t * 60) % 1) * 2 - 1;
                    const buzz = 0.35 * saw + 0.2 * Math.sin(TWO_PI * 120 * t);
                    const sparks = i > edge && i < length - edge && Math.sin(TWO_PI * 3 * t) > 0.6 ? noise(i) * 0.5 : 0;
                    data[i] = buzz + sparks;
                }
            })
        };
        for (const [type, buffer] of Object.entries(synthesized)) {
            if (!this.audioBuffers.has(type)) this.audioBuffers.set(type, buffer);
        }
    }

    async loadAllSounds() {
        console.log("🎵 AudioManager: Caricamento di tutti i suoni...");
        this.createSynthesizedSounds();
        const promises = Object.entries(this.soundFiles).map(([type, url]) => this.loadSound(type, url));
        try {
            await Promise.all(promises);
            console.log("🎵 AudioManager: Tutti i suoni caricati con successo.");
        } catch (e) {
            console.error("❌ AudioManager: Errore nel caricamento dei suoni:", e);
        }
    }

    async loadSound(type, url) {
        if (this.audioBuffers.has(type)) {
            console.warn(`🎵 AudioManager: Suono '${type}' già caricato.`);
            return this.audioBuffers.get(type);
        }

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Errore nel caricamento ${url}: ${response.status}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.audioBuffers.set(type, audioBuffer);
            console.log(`🎵 AudioManager: Suono '${type}' caricato da ${url}`);
            return audioBuffer;
        } catch (error) {
            console.error(`❌ AudioManager: Impossibile caricare il suono '${type}' da ${url}:`, error);
            // Potresti voler impostare un buffer "silenzio" o null in caso di errore
            // this.audioBuffers.set(type, null);
            return null;
        }
    }

    // --- Metodi Pubblici per la Riproduzione ---

    playSound(type, volume = 1.0, playbackRate = 1.0) {
        if (!this.enabled || !this.audioBuffers.has(type)) return;

        const buffer = this.audioBuffers.get(type);
        if (!buffer) {
            console.warn(`🎵 AudioManager: Buffer mancante per il suono '${type}', impossibile riprodurre.`);
            return;
        }

        // Controlla se è un loop attivo e gestiscilo
        if (this.loopStates[type]) {
            if (this.loopStates[type].isPlaying) {
                console.log(`🎵 AudioManager: Loop '${type}' già in riproduzione.`);
                return; // Non riprodurlo se già attivo
            }
        }

        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.playbackRate.value = playbackRate; // Velocità di riproduzione

        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = volume * this.globalVolume;

        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        gainNode.connect(this.convolver);

        // Gestisci i loop
        if (this.loopStates[type]) {
            source.loop = true;
            this.loopStates[type].isPlaying = true;
            this.loopStates[type].id = source;
            console.log(`🔁 AudioManager: Loop '${type}' avviato.`);
        }

        source.start(0);

        // Gestisci la rimozione della sorgente attiva quando finisce (se non è un loop)
        if (!this.loopStates[type]) {
            source.onended = () => {
                this.activeSources.delete(`${type}_${source}`);
                console.log(`⏹️ AudioManager: Suono '${type}' terminato.`);
            };
            // Aggiungi la sorgente ai controlli attivi (se non è un loop gestito separatamente)
            // Non serve aggiungere i loop qui, sono gestiti separatamente
        }

        // Non serve aggiungere i loop qui, sono gestiti separatamente
        if (!this.loopStates[type]) {
            this.activeSources.set(`${type}_${source}`, source);
        }
    }

    stopSound(type) {
        if (this.loopStates[type] && this.loopStates[type].isPlaying) {
            const source = this.loopStates[type].id;
            if (source) {
                source.stop(); // <-- DECOMMENTA E USA QUESTA RIGA
                
                this.loopStates[type].isPlaying = false;
                this.loopStates[type].id = null;
                console.log(`⏹️ AudioManager: Loop '${type}' fermato.`);
            }
        }
        // Per suoni non loopati, potresti avere un sistema di stop specifico se necessario
        // ma generalmente si lasciano terminare naturalmente.
    }

    // Metodo specifico per gestire il loop del cerchio magico
    setMagicCircleLoopPlaying(isPlaying) {
        if (isPlaying) {
            if (!this.loopStates[this.soundTypes.MAGIC_CIRCLE_ACTIVE].isPlaying) {
                this.playSound(this.soundTypes.MAGIC_CIRCLE_ACTIVE, 0.5); // Volume leggermente più basso per il loop
            }
        } else {
            this.stopSound(this.soundTypes.MAGIC_CIRCLE_ACTIVE);
        }
    }

    // Metodo per riprodurre il suono di collisione normale
    playCollisionSound(volume = 0.8) { // <-- 1. Accetta un parametro 'volume'
        // Ferma temporaneamente il loop di collisione continua se attivo
        // (potrebbe non essere sempre desiderato, dipende dalla logica)
        // this.setCollisionContinuousLoopPlaying(false);

        const randomSoundType = this.collisionSoundTypes[Math.floor(Math.random() * this.collisionSoundTypes.length)];
        // 2. Usa il volume ricevuto (o 0.8 se non specificato)
        this.playSound(randomSoundType, volume); 
    }

    // Metodo per riprodurre il suono di un proiettile specifico
    // (volumeScale < 1 per le magie dell'avversario)
    playProjectileSound(element = null, volumeScale = 1) {
        let soundType = this.soundTypes.PROJECTILE_NEUTRAL;
        if (element) {
            const elementMap = {
                'fuoco': this.soundTypes.PROJECTILE_FUOCO,
                'acqua': this.soundTypes.PROJECTILE_ACQUA,
                'aria': this.soundTypes.PROJECTILE_ARIA,
                'terra': this.soundTypes.PROJECTILE_TERRA,
                'fulmine': this.soundTypes.PROJECTILE_FULMINE,
            };
            soundType = elementMap[element] || soundType;
        }
        this.playSound(soundType, 0.6 * volumeScale); // Volume leggermente più basso
    }

    // Rimbalzo di un proiettile di fulmine (sui bordi o sulla terra)
    playFulmineBounceSound(volumeScale = 1) {
        this.playSound(this.soundTypes.FULMINE_BOUNCE, 0.45 * volumeScale);
    }

    // Un suono per elemento finché c'è almeno un laser di quell'elemento in campo (nostro o dell'avversario).
    // element null = mana puro. Si può chiamare a ogni frame: parte e si ferma solo quando serve.
    setLaserLoopPlaying(element, isPlaying) {
        const key = element || 'neutral';
        const voice = this.laserVoices.get(key);
        if (isPlaying && !voice) this.startLaserVoice(key);
        else if (!isPlaying && voice) this.stopLaserVoice(key);
    }

    // L'"init" suona una volta, il "cont" parte esattamente alla sua fine e va in loop
    startLaserVoice(key) {
        if (!this.enabled) return;
        const types = this.laserSoundTypes[key] || this.laserSoundTypes.neutral;
        const init = this.audioBuffers.get(types.init);
        const cont = this.audioBuffers.get(types.cont);
        if (!cont) return; // non ancora caricato: si riprova al prossimo frame

        const gain = this.audioContext.createGain();
        gain.gain.value = 0.35 * this.globalVolume;
        gain.connect(this.audioContext.destination);
        gain.connect(this.convolver);

        const now = this.audioContext.currentTime;
        const sources = [];
        let loopStart = now;
        if (init) {
            const intro = this.audioContext.createBufferSource();
            intro.buffer = init;
            intro.connect(gain);
            intro.start(now);
            sources.push(intro);
            loopStart = now + init.duration;
        }
        const loop = this.audioContext.createBufferSource();
        loop.buffer = cont;
        loop.loop = true;
        loop.connect(gain);
        loop.start(loopStart);
        sources.push(loop);
        this.laserVoices.set(key, { gain, sources });
    }

    // Breve dissolvenza per non sentire lo "scatto" quando il laser si spegne
    stopLaserVoice(key) {
        const voice = this.laserVoices.get(key);
        this.laserVoices.delete(key);
        const now = this.audioContext.currentTime;
        voice.gain.gain.setValueAtTime(voice.gain.gain.value, now);
        voice.gain.gain.linearRampToValueAtTime(0, now + 0.15);
        for (const source of voice.sources) {
            try { source.stop(now + 0.16); } catch { /* già fermo */ }
        }
    }

    // Metodo per riprodurre il suono di una magia spaziale specifica (futuro)
    setSpatialSpellLoopPlaying(element = null, isPlaying) {
        let soundType = this.soundTypes.SPELL_SPATIAL_NEUTRAL;
        if (element) {
            const elementMap = {
                'fuoco': this.soundTypes.SPELL_SPATIAL_FUOCO,
                'acqua': this.soundTypes.SPELL_SPATIAL_ACQUA,
                'aria': this.soundTypes.SPELL_SPATIAL_ARIA,
                'terra': this.soundTypes.SPELL_SPATIAL_TERRA,
                'fulmine': this.soundTypes.SPELL_SPATIAL_FULMINE,
            };
            soundType = elementMap[element] || soundType;
        }

        if (isPlaying) {
            if (!this.loopStates[soundType] || !this.loopStates[soundType].isPlaying) {
                this.playSound(soundType, 0.65); // Avvia il loop
            }
        } else {
            // Interrompe il loop se è in riproduzione
            this.stopSound(soundType); 
        }
        console.log("🔊 Spatial loop set:", element, " -> ", isPlaying);
    }

    // Metodo per riprodurre il suono di un elemento evocato (senza proiezione)
    playElementSpellSound(element, volumeScale = 1) {
        if (!element) return;

        const elementMap = {
            'fuoco': this.soundTypes.SPELL_FUOCO,
            'acqua': this.soundTypes.SPELL_ACQUA,
            'aria': this.soundTypes.SPELL_ARIA,
            'terra': this.soundTypes.SPELL_TERRA,
            'fulmine': this.soundTypes.SPELL_FULMINE,
        };

        const soundType = elementMap[element];
        if (soundType) {
            this.playSound(soundType, 0.7 * volumeScale); // Volume 0.7
        }
    }

    // Metodo per riprodurre un suono di disegno casuale
    playDrawingSound(volume = 0.3) {
        const randomSoundType = this.drawingSoundTypes[Math.floor(Math.random() * this.drawingSoundTypes.length)];
        this.playSound(randomSoundType, volume);
    }

    playClockSound() {
        this.playSound(this.soundTypes.CLOCK, 0.5); // Volume ridotto
    }

    stopClockSound() {
        this.stopSound(this.soundTypes.CLOCK);
    }

    playStartSound(random = true) {
        let soundType = this.soundTypes.START_1;
        if (random) {
            soundType = Math.random() < 0.5 ? this.soundTypes.START_1 : this.soundTypes.START_2;
        }
        this.playSound(soundType, 0.9); // Volume leggermente ridotto
    }

    // --- Controllo Generale ---
    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            // Ferma tutti i suoni attivi quando l'audio è disabilitato
            this.stopAllSounds();
        }
    }

    setGlobalVolume(volume) {
        this.globalVolume = Math.max(0, Math.min(1, volume)); // Limita tra 0 e 1
    }

    loopWithCrossfade(type, volume = 1.0, fadeTime = 0.2) {
        if (!this.audioBuffers.has(type)) return;
        const buffer = this.audioBuffers.get(type);
    
        const playLoop = () => {
            const source = this.audioContext.createBufferSource();
            source.buffer = buffer;
    
            const gainNode = this.audioContext.createGain();
            gainNode.gain.value = 0.0; // parte silenzioso
    
            source.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            gainNode.connect(this.convolver);
    
            source.start();
    
            // Fade in
            gainNode.gain.linearRampToValueAtTime(volume * this.globalVolume, this.audioContext.currentTime + fadeTime);
    
            // Prepara il prossimo loop prima che finisca
            const overlapTime = fadeTime; // crossfade duration
            const nextStart = this.audioContext.currentTime + buffer.duration - overlapTime;
            setTimeout(() => playLoop(), (buffer.duration - overlapTime) * 1000);
    
            // Fade out prima di fermare
            setTimeout(() => {
                gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + fadeTime);
                source.stop(this.audioContext.currentTime + fadeTime);
            }, (buffer.duration - overlapTime) * 1000);
        };
    
        playLoop();
    }

    stopAllSounds() {
        [...this.laserVoices.keys()].forEach(key => this.stopLaserVoice(key));
        // Ferma tutti i loop attivi
        for (const [type, state] of Object.entries(this.loopStates)) {
            if (state.isPlaying) {
                this.stopSound(type);
            }
        }
        // Ferma le sorgenti non loopate (se necessario, anche se spesso terminano da sole)
        // for (const [id, source] of this.activeSources) {
        //     source.stop();
        // }
        this.activeSources.clear();
    }
}

// --- Esportazione ---
// Crea un'istanza globale (o usa un pattern singleton se preferisci)
const audioManager = new AudioManager();

// Esporta l'istanza e i tipi di suono per l'uso in altri file
export { audioManager, AudioManager }; // Potresti esportare solo audioManager se non serve la classe intera altrove
