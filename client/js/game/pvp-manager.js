// pvp-manager.js - Gestione delle partite PvP, integrata con engine.js
import { VirtualMouseEntity, globalCollisionSystem } from "./collision-system.js";
import { triggerCameraShake, updateRedOverlay } from './damage-effects.js';
import { drawProjectilePolygonPattern, drawElementPattern } from "./element-patterns.js";
import { applyElementalHit, applyParalysis, statusEffectManager, createElementalDebuffParticles } from './status-effects.js';
import { audioManager } from './audio-manager.js';
import { getElementColor, getOpponentElementColor } from './elements.js';
import { VARIANT_COLORS } from './spell-interactions.js';
import { drawBrushStroke } from './brush-stroke.js';
import { computePlayerStats, applyElementDefense, BASE_DAMAGE, SPATIAL_DAMAGE_AREA_UNIT, SKILLS } from './player-stats.js';
import { WS_URL } from '../services/config.js';
import { loadPlayerFromDB, savePlayerData, getCurrentUsername } from '../services/player-db.js';

const OPPONENT_COLOR = '#ff6666';
const HIT_RADIUS = 30;

export class PvPManager {
    constructor(gameCanvas, gameContext, world) {
        this.canvas = gameCanvas;
        this.ctx = gameContext;
        this.world = world; // arena condivisa: tutte le coordinate sono relative a questa
        this.ws = null;
        this.isConnected = false;
        this.intentionalDisconnect = false;

        // Dati partita (salvati dall'Arena in localStorage)
        this.matchData = null;
        this.playerRole = null; // 'player1' o 'player2'
        this.opponentData = null;

        // Riferimenti allo stato di engine.js (aggiornati a ogni frame).
        // playerBody è ciò che viene colpito: coincide con virtualMouse tranne durante la paralisi
        this.gameHooks = {
            virtualMouse: null,
            playerBody: null,
            projectiles: null,
            magicCircle: null,
            playerHealth: 100,
            activeMagicParticles: null
        };

        // Stato sincronizzato dell'avversario
        this.opponent = {
            health: 100,
            position: { x: 0, y: 0 },
            virtualMouse: { x: 0, y: 0 },
            magicCircle: null,
            isAlive: true,
            casting: false,
            castingPoints: []
        };
        this.opponentEntity = null;
        this.opponentSpazialeAreas = []; // { id, points, element, variant, expiresAt }
        this.opponentLasers = [];        // { id, origin, dir, element, variant, expiresAt, damagePerTick, path }
        this.activeSpatialIntervals = {};
        this.opponentCircleRotation = 0;
        // Impostate da engine.js
        this.onSpellGranted = null;       // l'avversario ci cede un'area o un laser
        this.ownsSpell = null;            // (id) => true se l'area/il laser è nostro
        this.onOpponentProjectile = null; // crea il proiettile dell'avversario (con particelle e suono)
        this.onOpponentElement = null;    // elemento evocato a vuoto dall'avversario
        this.onOpponentLaserCast = null;  // nuovo laser dell'avversario (particelle e suono)
        this.shaderFillsAreas = false; // true = il riempimento delle aree lo disegna lo shader WebGL

        this.lastUpdateSent = 0;
        this.updateInterval = 1000 / 60;
        this.lastMagicCircleState = null;
        this.lastCastingState = null;
        this.processedHits = new Set();
        this.healthPersistenceKey = null;
        this.maxHealth = 100;
        this.opponentMaxHealth = 100;
        this.opponentAtk = SKILLS.atk.base; // serve per il danno del magma (media degli ATK)
        this.playerStats = computePlayerStats({}); // sostituite da engine.js quando arriva il profilo

        // loading -> waiting_for_ready -> countdown -> active -> finished
        this.matchState = 'loading';
        this.countdownCircle = null;

        this.preMatchOverlay = document.getElementById('pre-match-overlay');
        this.postMatchOverlay = document.getElementById('post-match-overlay');
        this.readyBtn = document.getElementById('ready-btn');
        this.readyContainer = document.getElementById('ready-container');
        this.readyTitle = document.getElementById('ready-title');
        this.readyMessage = document.getElementById('ready-message');
        this.countdownContainer = document.getElementById('countdown-container');
        this.countdownText = document.getElementById('countdown-text');
        this.matchResultText = document.getElementById('match-result-text');

        this.setupStatusEffectCallbacks();
        this.initializePvP();

        // Chiudendo la pagina la connessione cade: il server assegna la vittoria all'avversario
        window.addEventListener('beforeunload', () => {
            this.intentionalDisconnect = true;
            if (this.ws) this.ws.close();
        });
    }

    // ------------------------------------------------------------
    // INIZIALIZZAZIONE E CONNESSIONE
    // ------------------------------------------------------------

    initializePvP() {
        const matchDataStr = localStorage.getItem('currentMatchData');
        if (!matchDataStr) {
            console.error('❌ Dati match non trovati');
            return;
        }

        this.matchData = JSON.parse(matchDataStr);
        this.playerRole = this.matchData.playerRole;
        this.opponentData = this.matchData.opponent;

        // Vita massima decisa dal server in base agli HP di ciascuno (punti abilità)
        const opponentRole = this.playerRole === 'player1' ? 'player2' : 'player1';
        const gameState = this.matchData.gameState || {};
        this.maxHealth = gameState[this.playerRole]?.maxHealth || 100;
        this.opponentMaxHealth = gameState[opponentRole]?.maxHealth || 100;
        this.gameHooks.playerHealth = this.maxHealth;
        this.opponentAtk = gameState[opponentRole]?.atk || SKILLS.atk.base;
        this.opponent.health = this.opponentMaxHealth;

        this.healthPersistenceKey = `match_health_${this.matchData.matchId}`;
        this.loadHealthFromStorage();

        // Posizione iniziale dell'avversario (lato opposto dello schermo)
        const margin = Math.min(200, this.world.width / 4);
        const startX = this.playerRole === 'player1' ? this.world.width - margin : margin;
        this.opponent.position = { x: startX, y: this.world.height / 2 };
        this.opponent.virtualMouse = { x: startX, y: this.world.height / 2 };

        this.setupPreMatchOverlay();
        this.connectToGameServer();

        this.opponentEntity = new VirtualMouseEntity(this.opponent.virtualMouse.x, this.opponent.virtualMouse.y, 25);
        this.opponentEntity.type = 'opponent';
        this.opponentEntity.mass = 0.5;
        this.opponentEntity.resistance = 0.8;
        globalCollisionSystem.registerEntity(this.opponentEntity);

        console.log(`⚔️ Partita PvP inizializzata - Ruolo: ${this.playerRole}`);
        console.log(`🎯 Avversario: ${this.opponentData.username} (Liv. ${this.opponentData.level})`);
    }

    connectToGameServer() {
        try {
            this.ws = new WebSocket(WS_URL);

            this.ws.onopen = () => {
                console.log('🎮 Connesso al server di gioco');
                this.isConnected = true;
                // Ci ricolleghiamo alla partita creata mentre eravamo nella pagina Arena
                this.send({
                    type: 'rejoinMatch',
                    matchId: this.matchData.matchId,
                    rejoinToken: this.matchData.rejoinToken,
                    username: getCurrentUsername()
                });
            };

            this.ws.onmessage = (event) => {
                try {
                    this.handleGameMessage(JSON.parse(event.data));
                } catch (error) {
                    console.error('❌ Errore parsing messaggio gioco:', error, event.data);
                }
            };

            this.ws.onerror = (error) => {
                console.error('❌ Errore WebSocket gioco:', error);
            };

            this.ws.onclose = () => {
                console.log('🔌 Connessione chiusa');
                this.isConnected = false;
                if (!this.intentionalDisconnect && this.matchState !== 'finished') {
                    setTimeout(() => {
                        if (!this.isConnected && !this.intentionalDisconnect) this.connectToGameServer();
                    }, 3000);
                }
            };
        } catch (error) {
            console.error('❌ Errore connessione WebSocket:', error);
        }
    }

    send(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                matchId: this.matchData?.matchId,
                playerRole: this.playerRole,
                timestamp: Date.now(),
                ...message
            }));
        }
    }

    handleGameMessage(data) {
        switch (data.type) {
            case 'rejoined':
                console.log(`🔁 Rientrato nella partita (stato: ${data.matchState})`);
                break;
            case 'matchNotFound':
                this.handleMatchNotFound();
                break;
            case 'opponentReady':
                if (this.readyTitle && this.matchState === 'waiting_for_ready') {
                    this.readyMessage.textContent = 'L\'avversario è pronto!';
                }
                break;
            case 'matchStartCountdown':
                this.startCountdown();
                break;
            case 'opponentMove':
                this.handleOpponentMove(data);
                break;
            case 'opponentCasting':
                this.opponent.casting = data.casting;
                if (data.castingPoints) this.opponent.castingPoints = data.castingPoints;
                break;
            case 'opponentProjectile':
                this.handleOpponentProjectile(data);
                break;
            case 'opponentMagicCircle':
                this.opponent.magicCircle = data.magicCircle || null;
                break;
            case 'opponentSpell':
                this.handleOpponentSpell(data);
                break;
            case 'opponentSpellRemoval':
                if (data.spellType === 'laser') this.removeOpponentLaser(data.areaId);
                else this.removeOpponentArea(data.areaId);
                break;
            case 'projectileHit':
                this.handleProjectileHit(data);
                break;
            case 'opponentDisconnected':
                this.endMatch(true, 'opponent_disconnect');
                break;
            case 'gameEnd':
                this.handleGameEnd(data);
                break;
            case 'error':
                console.error('❌ Errore server:', data.message);
                break;
        }
    }

    // La partita non esiste più sul server (scaduta, o abbandonata durante il caricamento)
    handleMatchNotFound() {
        console.warn('⚠️ Partita non trovata sul server');
        // Connessione persa a partita iniziata: il server ci ha già dato la sconfitta a tavolino
        if (this.matchState === 'countdown' || this.matchState === 'active') {
            this.endMatch(false, 'forfeit');
            return;
        }
        this.matchState = 'finished';
        this.cleanupMatch();
        if (this.readyTitle) {
            this.readyContainer.classList.remove('hidden');
            this.readyTitle.textContent = 'Partita non più disponibile';
            this.readyMessage.textContent = 'Ritorno all\'arena...';
            this.readyBtn.classList.add('hidden');
        }
        setTimeout(() => { window.location.href = '/arena.html'; }, 2500);
    }

    // ------------------------------------------------------------
    // PRE-PARTITA E COUNTDOWN
    // ------------------------------------------------------------

    setupPreMatchOverlay() {
        if (!this.preMatchOverlay || !this.readyBtn || !this.readyContainer) {
            console.error("Elementi UI pre-partita non trovati!");
            this.matchState = 'active';
            return;
        }

        this.matchState = 'waiting_for_ready';
        this.preMatchOverlay.classList.remove('hidden');
        this.readyContainer.classList.remove('hidden');
        this.countdownContainer.classList.add('hidden');

        this.readyBtn.onclick = () => {
            audioManager.resumeContext();
            this.canvas.requestPointerLock();
            this.canvas.focus();

            this.send({ type: 'playerReady' });

            this.readyTitle.textContent = 'In attesa dell\'avversario...';
            this.readyMessage.textContent = 'Preparati alla battaglia!';
            this.readyBtn.disabled = true;
            this.readyBtn.textContent = 'Pronto!';
        };
    }

    getRandomElement() {
        const elements = ['fuoco', 'acqua', 'aria', 'terra', 'fulmine'];
        return elements[Math.floor(Math.random() * elements.length)];
    }

    getRandomProjectionType() {
        const types = ['proiettile', 'spaziale', 'laser'];
        return types[Math.floor(Math.random() * types.length)];
    }

    startCountdown() {
        if (this.matchState !== 'waiting_for_ready') return;

        audioManager.playClockSound();
        this.matchState = 'countdown';

        if (this.readyContainer) this.readyContainer.classList.add('hidden');
        if (this.countdownContainer) {
            this.countdownContainer.classList.remove('hidden');
            this.countdownContainer.classList.add('transparent-bg');
        }
        if (this.countdownText) this.countdownText.style.display = 'none';

        let count = 3;

        // Il countdown è un cerchio magico con 3 cariche casuali che si consumano
        this.countdownCircle = {
            x: this.world.width / 2,
            y: this.world.height / 2,
            radius: 150,
            projections: Array.from({ length: count }, () => this.getRandomProjectionType()),
            element: this.getRandomElement(),
            rotationDirection: 1,
            circleRotation: 0,
            projectionRotation: 0
        };

        triggerCameraShake(3, 1000);

        const interval = setInterval(() => {
            count--;
            if (!this.countdownCircle) {
                clearInterval(interval);
                return;
            }

            triggerCameraShake(3, 1000);
            if (count === 2) this.countdownCircle.rotationDirection = -1;

            if (count > 0) {
                this.countdownCircle.projections.pop();
                this.countdownCircle.element = this.getRandomElement();
            } else if (count === 0) {
                this.countdownCircle.projections = [];
                this.countdownCircle.element = this.getRandomElement();
                if (this.countdownText) {
                    this.countdownText.textContent = 'DUEL!';
                    this.countdownText.style.display = 'block';
                    this.countdownText.style.animation = 'pulse 0.5s 2';
                }
            } else {
                audioManager.stopClockSound();
                audioManager.playStartSound();
                clearInterval(interval);
                if (this.preMatchOverlay) this.preMatchOverlay.classList.add('hidden');
                this.countdownCircle = null;
                this.matchState = 'active';
                console.log("🟢 Partita attiva!");
            }
        }, 1000);
    }

    drawCountdownCircle(ctx) {
        const circle = this.countdownCircle;
        if (!circle) return;

        const { x, y, radius, projections, circleRotation, projectionRotation, element } = circle;
        const color = element ? getElementColor(element) : "#00e0ff";

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(circleRotation);
        ctx.translate(-x, -y);

        if (element) drawElementPattern(ctx, x, y, radius * 0.82, element);
        this.drawCircleRings(ctx, x, y, radius, color, 3);
        ctx.restore();

        if (projections && projections.length > 0) {
            drawProjectilePolygonPattern(ctx, x, y, radius * 1.2, projections.length, color, projectionRotation, projections);
        }
    }

    // Due cerchi concentrici con 24 segmenti radiali (la "cornice" di ogni cerchio magico)
    drawCircleRings(ctx, x, y, radius, color, thickness) {
        ctx.lineWidth = thickness;
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, y, radius + 20, 0, 2 * Math.PI);
        ctx.stroke();

        ctx.lineWidth = 1;
        const numSegments = 24;
        for (let i = 0; i < numSegments; i++) {
            const angle = (2 * Math.PI / numSegments) * i;
            ctx.beginPath();
            ctx.moveTo(x + Math.cos(angle) * (radius + 20), y + Math.sin(angle) * (radius + 20));
            ctx.lineTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
            ctx.stroke();
        }
    }

    // ------------------------------------------------------------
    // EFFETTI DI STATO
    // ------------------------------------------------------------

    // Movimento/controlli/stun del giocatore locale li gestisce engine.js
    setupStatusEffectCallbacks() {
        statusEffectManager.registerDamageCallback('player', (damage, source) => {
            const element = source === 'burning' ? 'fuoco' : null;
            this.gameHooks.playerHealth -= applyElementDefense(damage, this.playerStats, element);
            this.saveHealthToStorage();
            this.showDamageEffect(true);
            triggerCameraShake(5, 150);
            if (this.gameHooks.playerHealth <= 0) this.endMatch(false);
        });

        statusEffectManager.registerVisualCallback('player', (effectType, element) => {
            const position = this.gameHooks.playerBody || this.gameHooks.virtualMouse;
            if (!position) return;
            if (effectType === 'debuff_particles') {
                createElementalDebuffParticles(element, position, this.gameHooks.activeMagicParticles);
            } else if (effectType === 'burning') {
                this.createBurningParticles(position);
            }
        });

        // Gli effetti sull'avversario sono solo visivi: la sua vita la gestisce il suo client
        statusEffectManager.registerVisualCallback('opponent', (effectType, element) => {
            if (effectType === 'debuff_particles') {
                createElementalDebuffParticles(element, this.opponent.position, this.gameHooks.activeMagicParticles);
            } else if (effectType === 'burning') {
                this.createBurningParticles(this.opponent.position);
            }
        });
    }

    createBurningParticles(position) {
        for (let i = 0; i < 15; i++) {
            this.gameHooks.activeMagicParticles?.push({
                x: position.x + (Math.random() - 0.5) * 30,
                y: position.y + (Math.random() - 0.5) * 30,
                radius: Math.random() * 3 + 1,
                alpha: 0.8,
                dx: (Math.random() - 0.5) * 2,
                dy: Math.random() * -2 - 1,
                color: `rgba(255, ${50 + Math.random() * 50}, 0, `,
                element: 'fuoco'
            });
        }
    }

    // ------------------------------------------------------------
    // SALUTE
    // ------------------------------------------------------------

    loadHealthFromStorage() {
        try {
            const savedHealth = localStorage.getItem(this.healthPersistenceKey);
            if (!savedHealth) return;
            const healthData = JSON.parse(savedHealth);
            const opponentRole = this.playerRole === 'player1' ? 'player2' : 'player1';
            if (typeof healthData[this.playerRole] === 'number') this.gameHooks.playerHealth = healthData[this.playerRole];
            if (typeof healthData[opponentRole] === 'number') this.opponent.health = healthData[opponentRole];
        } catch (error) {
            console.error('❌ Errore caricamento salute:', error);
        }
    }

    saveHealthToStorage() {
        const opponentRole = this.playerRole === 'player1' ? 'player2' : 'player1';
        localStorage.setItem(this.healthPersistenceKey, JSON.stringify({
            [this.playerRole]: this.gameHooks.playerHealth,
            [opponentRole]: this.opponent.health
        }));
    }

    // ------------------------------------------------------------
    // MESSAGGI DELL'AVVERSARIO
    // ------------------------------------------------------------

    handleOpponentMove(data) {
        const prevPosition = { ...this.opponent.position };
        this.opponent.virtualMouse = data.virtualMouse;
        this.opponent.position = data.position || data.virtualMouse;

        // L'entità che collide è il corpo (position), che durante la paralisi resta fermo
        if (this.opponentEntity) {
            this.opponentEntity.x = this.opponent.position.x;
            this.opponentEntity.y = this.opponent.position.y;
            // Velocità amplificata per rendere visibili le collisioni
            this.opponentEntity.velocity.x = (this.opponent.position.x - prevPosition.x) * 2;
            this.opponentEntity.velocity.y = (this.opponent.position.y - prevPosition.y) * 2;
        }
    }

    handleOpponentProjectile(data) {
        this.onOpponentProjectile?.(data);
    }

    handleOpponentSpell(data) {
        if (data.spellType === 'elemento') {
            this.onOpponentElement?.(data);
            return;
        }
        const isLaser = data.spellType === 'laser';
        if ((data.spellType !== 'spaziale' && !isLaser) || !data.polygonPoints) {
            if (data.position) this.createOpponentSpellEffect(data.position);
            return;
        }

        const spellId = data.areaId || `${data.spellType}_${data.timestamp}`;

        // Le magie permanenti le modifica solo il proprietario. Un messaggio su una magia che è
        // già nostra (es. aggiornamento partito prima che ce la cedesse) è vecchio: si ignora,
        // altrimenti avremmo una copia "fantasma" dell'avversario sopra la nostra.
        if (this.ownsSpell?.(spellId)) return;

        // L'avversario ci cede la magia (es. la sua aria incendiata dal nostro fuoco)
        if (data.giveToReceiver) {
            if (isLaser) this.removeOpponentLaser(spellId);
            else this.removeOpponentArea(spellId);
            this.onSpellGranted?.(data);
            return;
        }

        if (isLaser) {
            this.handleOpponentLaser(spellId, data);
            return;
        }

        // Area già nota: è un aggiornamento (nuovo elemento o nuova variante)
        const existing = this.opponentSpazialeAreas.find(area => area.id === spellId);
        if (existing) {
            existing.element = data.element || existing.element;
            existing.variant = data.variant || null;
            existing.expiresAt = data.expiresIn ? Date.now() + data.expiresIn : null;
            if (data.damagePerTick > 0) existing.damagePerTick = data.damagePerTick;
            if (data.magmaAtk > 0) existing.variantAtk = data.magmaAtk;
            return;
        }

        this.registerOpponentArea({
            id: spellId,
            points: data.polygonPoints,
            element: data.element,
            variant: data.variant,
            expiresIn: data.expiresIn,
            damagePerTick: data.damagePerTick,
            variantAtk: data.magmaAtk
        });
    }

    // Laser: position = origine, polygonPoints = [origine, un punto lungo la direzione]
    handleOpponentLaser(id, data) {
        const existing = this.opponentLasers.find(laser => laser.id === id);
        if (existing) {
            existing.element = data.element || null;
            existing.variant = data.variant || null;
            existing.expiresAt = data.expiresIn ? Date.now() + data.expiresIn : null;
            if (data.damagePerTick > 0) existing.damagePerTick = data.damagePerTick;
            if (data.magmaAtk > 0) existing.variantAtk = data.magmaAtk;
            return;
        }
        const [origin, through] = data.polygonPoints;
        const length = Math.hypot(through.x - origin.x, through.y - origin.y) || 1;
        const laser = this.registerOpponentLaser({
            id,
            origin,
            dir: { x: (through.x - origin.x) / length, y: (through.y - origin.y) / length },
            element: data.element || null,
            variant: data.variant || null,
            expiresIn: data.expiresIn,
            damagePerTick: data.damagePerTick,
            variantAtk: data.magmaAtk
        });
        this.onOpponentLaserCast?.(laser);
    }

    // Il danno di chi tocca il raggio lo calcola engine.js (che conosce il percorso del laser)
    registerOpponentLaser({ id, origin, dir, element = null, variant = null, expiresIn = null, damagePerTick = null, variantAtk = null }) {
        const laser = {
            id,
            origin,
            dir,
            element,
            variant,
            expiresAt: expiresIn ? Date.now() + expiresIn : null,
            variantAtk,
            damagePerTick: damagePerTick > 0 ? damagePerTick : BASE_DAMAGE.laser,
            path: []
        };
        this.opponentLasers.push(laser);
        return laser;
    }

    removeOpponentLaser(id) {
        this.opponentLasers = this.opponentLasers.filter(laser => laser.id !== id);
    }

    // Aggiunge un'area avversaria, con il danno periodico per chi resta dentro.
    // damagePerTick lo calcola chi lancia l'area (dipende dal suo ATK); se manca si usa il valore base.
    registerOpponentArea({ id, points, element = null, variant = null, expiresIn = null, damagePerTick = null, variantAtk = null }) {
        if (this.activeSpatialIntervals[id]) return;
        this.opponentSpazialeAreas.push({
            id,
            points,
            element,
            variant,
            expiresAt: expiresIn ? Date.now() + expiresIn : null,
            variantAtk,
            damagePerTick: damagePerTick > 0
                ? damagePerTick
                : BASE_DAMAGE.spaziale * (this.calculatePolygonArea(points) / SPATIAL_DAMAGE_AREA_UNIT)
        });

        let ticks = 0;
        const maxTicks = 1000;

        this.activeSpatialIntervals[id] = setInterval(() => {
            if (++ticks > maxTicks) {
                this.removeOpponentArea(id);
                return;
            }
            if (this.matchState !== 'active') return;
            // Le aree trasformate (rigogliose / magma) hanno effetti propri: niente danno da area
            const area = this.opponentSpazialeAreas.find(a => a.id === id);
            if (!area || area.variant) return;
            const playerPos = this.gameHooks.playerBody || this.gameHooks.virtualMouse;
            if (playerPos && this.isPointInPolygon(playerPos, points)) {
                const element = area.element === 'spaziale' ? null : area.element;
                this.applyDamage(applyElementDefense(area.damagePerTick, this.playerStats, element));
                // ⚡ L'area di fulmine paralizza chi ci sta dentro (il corpo si ferma, il cursore no)
                if (element === 'fulmine') applyParalysis('player');
            }
        }, 500);
    }

    setPlayerStats(stats) {
        this.playerStats = stats;
    }

    // Danno non legato a un proiettile (aree, magma), già ridotto dalle difese:
    // salva la vita e controlla la sconfitta
    applyDamage(amount) {
        this.gameHooks.playerHealth -= amount;
        this.saveHealthToStorage();
        this.showDamageEffect(true);
        if (this.gameHooks.playerHealth <= 0) this.endMatch(false);
    }

    removeOpponentArea(areaId) {
        if (this.activeSpatialIntervals[areaId]) {
            clearInterval(this.activeSpatialIntervals[areaId]);
            delete this.activeSpatialIntervals[areaId];
        }
        this.opponentSpazialeAreas = this.opponentSpazialeAreas.filter(area => area.id !== areaId);
    }

    handleProjectileHit(data) {
        const hitId = `${data.projectileId || 'unknown'}_${data.timestamp}`;
        if (this.processedHits.has(hitId)) return;
        this.processedHits.add(hitId);
        if (this.processedHits.size > 100) {
            Array.from(this.processedHits).slice(0, -50).forEach(id => this.processedHits.delete(id));
        }

        if (data.target === this.playerRole) {
            this.gameHooks.playerHealth -= data.damage;
            this.saveHealthToStorage();
            this.showDamageEffect(true);
            if (data.element) applyElementalHit(data.element, 'player');
            if (this.gameHooks.playerHealth <= 0) this.endMatch(false);
        } else {
            this.opponent.health -= data.damage;
            this.showDamageEffect(false);
            if (data.element) applyElementalHit(data.element, 'opponent');
        }
    }

    handleGameEnd(data) {
        // winner null = tempo scaduto (pareggio)
        const won = data.winner ? data.winner === this.playerRole : null;
        this.endMatch(won, data.reason);
    }

    // ------------------------------------------------------------
    // INVIO AL SERVER
    // ------------------------------------------------------------

    sendSpellRemoval(spellData) {
        this.send({
            type: 'spellRemoval',
            spellType: spellData.type,
            position: spellData.position,
            polygonPoints: spellData.polygonPoints,
            areaId: spellData.areaId
        });
    }

    sendSpellCast(spellData) {
        this.send({
            type: 'spellCast',
            spellType: spellData.type,
            position: spellData.position,
            polygonPoints: spellData.polygonPoints,
            element: spellData.element,
            areaId: spellData.areaId,
            variant: spellData.variant,
            expiresIn: spellData.expiresIn,
            giveToReceiver: spellData.giveToReceiver,
            damagePerTick: spellData.damagePerTick,
            magmaAtk: spellData.magmaAtk
        });
    }

    sendProjectileLaunch({ start, velocity, color, tipo, element, maxLife }) {
        this.send({ type: 'projectileLaunch', start, velocity, color, tipo, element, maxLife });
    }

    sendMagicCircleUpdate(magicCircle) {
        this.send({
            type: 'magicCircleUpdate',
            magicCircle: magicCircle ? {
                x: magicCircle.x,
                y: magicCircle.y,
                radius: magicCircle.radius,
                element: magicCircle.elemento,
                projections: magicCircle.projections
            } : null
        });
    }

    // ------------------------------------------------------------
    // SINCRONIZZAZIONE CON ENGINE.JS (chiamata a ogni frame)
    // ------------------------------------------------------------

    syncWithMainGame(gameState) {
        this.opponentCircleRotation += 0.003;

        if (this.matchState === 'countdown' && this.countdownCircle) {
            const deltaRotationPerFrame = (2 * Math.PI) / 3600.0;
            const direction = this.countdownCircle.rotationDirection || 1;
            this.countdownCircle.circleRotation += deltaRotationPerFrame * direction;
            this.countdownCircle.projectionRotation -= deltaRotationPerFrame * 2 * direction;
        }

        if (this.matchState !== 'active') return;

        this.gameHooks.virtualMouse = gameState.virtualMouse;
        this.gameHooks.playerBody = gameState.playerBody;
        this.gameHooks.projectiles = gameState.projectiles;
        this.gameHooks.magicCircle = gameState.magicCircle;
        this.gameHooks.activeMagicParticles = gameState.activeMagicParticles;

        const now = Date.now();
        if (now - this.lastUpdateSent > this.updateInterval) {
            const body = gameState.playerBody || gameState.virtualMouse;
            this.send({
                type: 'playerMove',
                virtualMouse: { x: gameState.virtualMouse.x, y: gameState.virtualMouse.y },
                position: { x: body.x, y: body.y }
            });
            this.lastUpdateSent = now;
        }

        this.checkProjectileCollisions(gameState.projectiles);
        this.syncMagicCircle(gameState.magicCircle);
        this.syncCasting(gameState.casting, gameState.castingPoints);
    }

    syncMagicCircle(magicCircle) {
        const currentState = magicCircle ? {
            x: magicCircle.x,
            y: magicCircle.y,
            radius: magicCircle.radius,
            element: magicCircle.elemento,
            projections: magicCircle.projections.join(',')
        } : null;

        if (JSON.stringify(currentState) !== JSON.stringify(this.lastMagicCircleState)) {
            this.sendMagicCircleUpdate(magicCircle);
            this.lastMagicCircleState = currentState;
        }
    }

    syncCasting(casting, castingPoints) {
        if (this.lastCastingState === casting) return;
        this.send({ type: 'playerCasting', casting, castingPoints: castingPoints || [] });
        this.lastCastingState = casting;
    }

    // Chi spara decide se ha colpito: l'hit viene inviato al server, che lo inoltra al bersaglio
    checkProjectileCollisions(projectiles) {
        if (!projectiles || !this.opponent.isAlive) return;

        for (const projectile of projectiles) {
            if (projectile.hit) continue;

            if (projectile.owner === 'opponent') {
                // Colpito dall'avversario: qui solo feedback visivo (il danno arriva dal server)
                if (this.isProjectileHitting(projectile, this.gameHooks.playerBody || this.gameHooks.virtualMouse)) {
                    projectile.hit = true;
                    this.showDamageEffect(true);
                    triggerCameraShake(10, 250);
                    updateRedOverlay(this.gameHooks.playerHealth, this.maxHealth);
                }
            } else if (projectile.owner === 'local') {
                if (this.isProjectileHitting(projectile, this.opponent.position)) {
                    projectile.hit = true;
                    this.send({
                        type: 'projectileHit',
                        target: this.playerRole === 'player1' ? 'player2' : 'player1',
                        damage: this.calculateDamage(projectile),
                        element: projectile.element
                    });
                }
            }
        }
    }

    isProjectileHitting(projectile, position) {
        if (!position) return false;
        return Math.hypot(projectile.x - position.x, projectile.y - position.y) < HIT_RADIUS;
    }

    // Danno "lordo" (ATK, elemento, bonus danno): la difesa del bersaglio la applica il server
    calculateDamage(projectile) {
        // Il fulmine non ha moltiplicatore: in compenso rimbalza (più occasioni di colpire)
        const multiplierByElement = { fuoco: 1.1, acqua: 1.2, aria: 1.2, terra: 1.4, fulmine: 1 };
        const baseDamage = this.playerStats.damage.proiettile;
        const dmgBonus = this.playerStats.elementDmgBonus[projectile.element] || 0;
        const damage = baseDamage * (multiplierByElement[projectile.element] || 1) * (1 + dmgBonus);
        return Math.round(damage * 10) / 10;
    }

    // ------------------------------------------------------------
    // RENDERING (chiamato da engine.js)
    // ------------------------------------------------------------

    renderPvPElements(ctx) {
        this.removeExpiredOpponentAreas();
        if (this.matchState === 'countdown' && this.countdownCircle) {
            this.drawCountdownCircle(ctx);
        }
        this.drawOpponent(ctx);
        if (this.opponent.magicCircle) this.drawOpponentMagicCircle(ctx);
        if (this.opponent.casting) this.drawOpponentCasting(ctx);
        this.drawOpponentSpazialeAreas(ctx);
    }

    removeExpiredOpponentAreas() {
        const now = Date.now();
        this.opponentSpazialeAreas
            .filter(area => area.expiresAt && area.expiresAt <= now)
            .forEach(area => this.removeOpponentArea(area.id));
        this.opponentLasers = this.opponentLasers.filter(laser => !laser.expiresAt || laser.expiresAt > now);
    }

    drawOpponentSpazialeAreas(ctx) {
        if (this.opponentSpazialeAreas.length === 0) return;

        ctx.save();
        for (const area of this.opponentSpazialeAreas) {
            if (!area.points || area.points.length < 3) continue;
            ctx.beginPath();
            ctx.moveTo(area.points[0].x, area.points[0].y);
            for (let i = 1; i < area.points.length; i++) {
                ctx.lineTo(area.points[i].x, area.points[i].y);
            }
            ctx.closePath();
            const variantColor = VARIANT_COLORS[area.variant];
            if (!this.shaderFillsAreas) {
                ctx.globalAlpha = variantColor ? 0.25 : 1;
                ctx.fillStyle = variantColor || 'rgba(255, 100, 100, 0.15)';
                ctx.fill();
                ctx.globalAlpha = 1;
            }
        }
        ctx.restore();
    }

    // Mouse virtuale dell'avversario: come quello del giocatore ma rosso.
    // Se è paralizzato il corpo (position) resta fermo e il cursore si vede in trasparenza
    drawOpponent(ctx) {
        const body = this.opponent.position;
        const cursor = this.opponent.virtualMouse;
        this.drawReticle(ctx, body, "#ff4444", 1);
        if (Math.hypot(cursor.x - body.x, cursor.y - body.y) > 2) {
            this.drawReticle(ctx, cursor, "#ff4444", 0.4);
        }
    }

    drawReticle(ctx, pos, color, alpha) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 12, 0, 2 * Math.PI);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(pos.x - 6, pos.y);
        ctx.lineTo(pos.x + 6, pos.y);
        ctx.moveTo(pos.x, pos.y - 6);
        ctx.lineTo(pos.x, pos.y + 6);
        ctx.stroke();
        ctx.restore();
    }

    drawOpponentMagicCircle(ctx) {
        const circle = this.opponent.magicCircle;
        const { x, y, radius, element } = circle;
        const color = element ? getOpponentElementColor(element) : OPPONENT_COLOR;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(this.opponentCircleRotation);
        ctx.translate(-x, -y);

        if (element) {
            const glowRadius = radius + 24;
            const grad = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
            grad.addColorStop(0, color + 'cc');
            grad.addColorStop(0.45, color + '44');
            grad.addColorStop(0.85, color + '11');
            grad.addColorStop(1, color + '00');
            ctx.save();
            ctx.globalAlpha = 0.45;
            ctx.beginPath();
            ctx.arc(x, y, glowRadius, 0, 2 * Math.PI);
            ctx.fillStyle = grad;
            ctx.fill();
            ctx.restore();

            drawElementPattern(ctx, x, y, radius * 0.82, element, color);
        }

        if (circle.projections && circle.projections.length > 0) {
            drawProjectilePolygonPattern(ctx, x, y, radius * 1.2, circle.projections.length, color,
                -2 * this.opponentCircleRotation, circle.projections);
        }

        this.drawCircleRings(ctx, x, y, radius, color, 3);
        ctx.restore();

        // Particelle fluttuanti attorno al cerchio
        for (let i = 0; i < 4; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = radius + 10 + Math.random() * 15;
            this.gameHooks.activeMagicParticles?.push({
                x: x + Math.cos(angle + this.opponentCircleRotation) * dist,
                y: y + Math.sin(angle + this.opponentCircleRotation) * dist,
                radius: Math.random() * 1.5 + 0.5,
                alpha: 0.1 + Math.random() * 0.1,
                dx: (Math.random() - 0.5) * 0.3,
                dy: (Math.random() - 0.5) * 0.3,
                color,
                element
            });
        }
    }

    drawOpponentCasting(ctx) {
        const pts = this.opponent.castingPoints;
        if (!pts || pts.length < 2) return;

        drawBrushStroke(ctx, pts, { color: "rgba(255, 150, 150, 0.85)", glow: "rgba(255, 60, 60, 0.8)", width: 5 });
    }

    createOpponentSpellEffect(position) {
        for (let i = 0; i < 50; i++) {
            this.gameHooks.activeMagicParticles?.push({
                x: position.x + (Math.random() - 0.5) * 40,
                y: position.y + (Math.random() - 0.5) * 40,
                radius: Math.random() * 2 + 1,
                alpha: 0.15 + Math.random() * 0.15,
                dx: (Math.random() - 0.5) * 1.5,
                dy: (Math.random() - 0.5) * 1.5,
                color: 'rgba(255, 100, 100,'
            });
        }
    }

    showDamageEffect(isLocalPlayer) {
        const position = isLocalPlayer ? this.gameHooks.virtualMouse : this.opponent.virtualMouse;
        if (!position || !this.gameHooks.activeMagicParticles) return;

        for (let i = 0; i < 15; i++) {
            this.gameHooks.activeMagicParticles.push({
                x: position.x + (Math.random() - 0.5) * 30,
                y: position.y + (Math.random() - 0.5) * 30,
                radius: Math.random() * 3 + 2,
                alpha: 0.8,
                dx: (Math.random() - 0.5) * 3,
                dy: (Math.random() - 0.5) * 3 - 1,
                color: isLocalPlayer ? 'rgba(255, 100, 100,' : 'rgba(100, 255, 100,'
            });
        }
    }

    // ------------------------------------------------------------
    // FINE PARTITA
    // ------------------------------------------------------------

    /** @param {boolean|null} won - null = pareggio (tempo scaduto) */
    async endMatch(won, reason = 'normal') {
        if (this.matchState === 'finished') return;
        this.matchState = 'finished';

        let message;
        if (won === null) {
            message = 'Tempo scaduto: Pareggio';
        } else if (reason === 'forfeit') {
            message = won ? 'Vittoria per Forfeit' : 'Sconfitta per Forfeit';
        } else if (reason === 'opponent_disconnect') {
            message = 'Vittoria per Disconnessione';
        } else {
            message = won ? 'Vittoria!' : 'Sconfitta!';
        }

        if (this.postMatchOverlay && this.matchResultText) {
            this.matchResultText.textContent = message;
            this.matchResultText.className = won === null ? '' : (won ? 'victory' : 'defeat');
            this.postMatchOverlay.classList.remove('hidden');
        } else {
            alert(message);
        }
        document.exitPointerLock?.();

        await this.updatePlayerStats(won);
        this.cleanupMatch();

        setTimeout(() => { window.location.href = '/arena.html'; }, 3000);
    }

    cleanupMatch() {
        Object.values(this.activeSpatialIntervals).forEach(clearInterval);
        this.activeSpatialIntervals = {};
        this.opponentSpazialeAreas = [];
        this.opponentLasers = [];

        localStorage.removeItem('currentMatchData');
        if (this.healthPersistenceKey) localStorage.removeItem(this.healthPersistenceKey);

        this.intentionalDisconnect = true;
        if (this.ws) this.ws.close();
        this.isConnected = false;
    }

    async updatePlayerStats(won) {
        try {
            const username = getCurrentUsername();
            const playerData = await loadPlayerFromDB(username);
            if (!playerData) return;

            await savePlayerData(username, {
                partite: (playerData.partite || 0) + 1,
                vittorie: (playerData.vittorie || 0) + (won === true ? 1 : 0)
            });
        } catch (error) {
            console.error('❌ Errore aggiornamento statistiche:', error);
        }
    }

    isActive() {
        return this.matchData !== null && this.isConnected;
    }

    // ------------------------------------------------------------
    // GEOMETRIA
    // ------------------------------------------------------------

    calculatePolygonArea(vertices) {
        let area = 0;
        for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
            area += (vertices[j].x + vertices[i].x) * (vertices[j].y - vertices[i].y);
        }
        return Math.abs(area / 2);
    }

    isPointInPolygon(point, polygon) {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            if (((polygon[i].y > point.y) !== (polygon[j].y > point.y)) &&
                (point.x < (polygon[j].x - polygon[i].x) * (point.y - polygon[i].y) / (polygon[j].y - polygon[i].y) + polygon[i].x)) {
                inside = !inside;
            }
        }
        return inside;
    }
}
