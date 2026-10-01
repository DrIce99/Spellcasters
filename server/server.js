// server.js - Server WebSocket: matchmaking, partite PvP e classifica
import { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import admin from 'firebase-admin';
import fs from 'fs';

// Credenziali Firebase Admin: variabile d'ambiente (deploy) oppure server/serviceAccountKey.json (locale)
let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
    const keyPath = new URL('./serviceAccountKey.json', import.meta.url);
    serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
}

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const dbAdmin = admin.firestore();

export { dbAdmin };

const port = process.env.PORT || 8080;
const wss = new WebSocketServer({ port });

// Strutture dati per gestire giocatori e partite
const connectedPlayers = new Map(); // Map<websocket, playerData>
let matchmakingQueue = [];          // giocatori in cerca di partita
const activeMatches = new Map();    // Map<matchId, matchData>

const MATCHMAKING_CONFIG = {
    LEVEL_TOLERANCE: 3,      // differenza massima di livello
    WINRATE_TOLERANCE: 0.3,  // differenza massima di win rate (30%)
    MATCH_TIMEOUT: 300000,   // 5 minuti per partita
    REJOIN_GRACE_MS: 20000,  // tempo per passare dalla pagina Arena alla pagina di gioco
    HEARTBEAT_MS: 25000,     // intervallo ping per scoprire le connessioni morte
    DEFAULT_ARENA_SIZE: 800, // lato dell'arena se nessun client ha inviato le dimensioni dello schermo
    DEFAULT_HP: 100,
    DEFAULT_ATK: 10,
    MAX_ATK: 1000,
    MAX_HP: 10000,
    MAX_ELEMENT_DEF: 0.9,
    MAX_HIT_DAMAGE: 1000
};

wss.on('connection', (ws) => {
    console.log('🔌 Nuovo giocatore connesso');

    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });

    ws.on('message', (message) => {
        try {
            handleMessage(ws, JSON.parse(message));
        } catch (error) {
            console.error('❌ Errore gestione messaggio:', error);
        }
    });

    ws.on('close', () => handlePlayerDisconnect(ws));

    broadcastOnlineCount();
});

function send(target, message) {
    const ws = target && target.ws !== undefined ? target.ws : target;
    if (ws && ws.readyState === 1) {
        ws.send(JSON.stringify(message));
    }
}

function handleMessage(ws, data) {
    switch (data.type) {
        case 'register':
            registerPlayer(ws, data);
            break;
        case 'rejoinMatch':
            rejoinMatch(ws, data);
            break;
        case 'requestOnlineCount':
            send(ws, { type: 'onlinePlayers', count: connectedPlayers.size });
            break;
        case 'joinMatchmaking':
        case 'startMatchmaking':
            joinMatchmaking(ws, data);
            break;
        case 'leaveMatchmaking':
        case 'cancelMatchmaking':
            leaveMatchmaking(ws);
            break;
        case 'playerReady':
            handlePlayerReady(ws);
            break;
        case 'playerMove':
            handlePlayerMove(ws, data);
            break;
        case 'projectileLaunch':
            relayToOpponent(ws, {
                type: 'opponentProjectile',
                start: data.start,
                velocity: data.velocity,
                color: data.color,
                tipo: data.tipo,
                element: data.element,
                maxLife: data.maxLife
            });
            break;
        case 'magicCircleUpdate':
            relayToOpponent(ws, { type: 'opponentMagicCircle', magicCircle: data.magicCircle });
            break;
        case 'playerCasting':
            relayToOpponent(ws, { type: 'opponentCasting', casting: data.casting, castingPoints: data.castingPoints });
            break;
        case 'spellCast':
            relayToOpponent(ws, {
                type: 'opponentSpell',
                spellType: data.spellType,
                position: data.position,
                polygonPoints: data.polygonPoints,
                element: data.element,
                areaId: data.areaId,
                variant: data.variant,
                expiresIn: data.expiresIn,
                giveToReceiver: data.giveToReceiver,
                damagePerTick: data.damagePerTick,
                magmaAtk: data.magmaAtk
            });
            break;
        case 'spellRemoval':
            relayToOpponent(ws, {
                type: 'opponentSpellRemoval',
                spellType: data.spellType,
                position: data.position,
                polygonPoints: data.polygonPoints,
                areaId: data.areaId
            });
            break;
        case 'projectileHit':
            handleProjectileHit(ws, data);
            break;
        case 'requestLeaderboard':
            sendLeaderboard(ws);
            break;
        default:
            console.log('🤔 Tipo messaggio sconosciuto:', data.type);
    }
}

// Restituisce { player, match, isPlayer1, opponent } se il giocatore è in una partita attiva
function getActiveMatchContext(ws) {
    const player = connectedPlayers.get(ws);
    if (!player || player.status !== 'in_game') return null;
    const match = activeMatches.get(player.currentMatch);
    if (!match || match.matchState !== 'active') return null;
    const isPlayer1 = match.players[0].id === player.id;
    return { player, match, isPlayer1, opponent: match.players[isPlayer1 ? 1 : 0] };
}

// Inoltra un'azione del giocatore al suo avversario (solo a partita iniziata)
function relayToOpponent(ws, message) {
    const context = getActiveMatchContext(ws);
    if (!context) return;
    send(context.opponent, { ...message, timestamp: Date.now() });
}

function registerPlayer(ws, data) {
    // Stesso utente già connesso da un'altra connessione (riconnessione dopo una caduta
    // non rilevata, o seconda scheda): la vecchia sessione va rimossa, altrimenti resta
    // un "fantasma" in coda che può essere accoppiato con un altro giocatore.
    for (const [otherWs, other] of connectedPlayers) {
        if (otherWs === ws || other.username !== data.username || other.status === 'in_game') continue;
        const queueIndex = matchmakingQueue.findIndex(p => p.id === other.id);
        if (queueIndex !== -1) matchmakingQueue.splice(queueIndex, 1);
        connectedPlayers.delete(otherWs);
        send(otherWs, { type: 'sessionReplaced' });
        otherWs.close(); // se è davvero morta ci pensa l'heartbeat a chiuderla
        console.log(`♻️ Sessione precedente di ${other.username} sostituita`);
    }

    const playerData = {
        id: uuidv4(),
        username: data.username,
        level: data.level || 1,
        vittorie: data.vittorie || 0,
        partite: data.partite || 0,
        winRate: calculateWinRate(data.vittorie || 0, data.partite || 0),
        ws,
        status: 'online',
        currentMatch: null,
        rejoinToken: null,
        disconnectTimer: null,
        joinedAt: Date.now()
    };

    connectedPlayers.set(ws, playerData);
    send(ws, { type: 'registered', playerId: playerData.id, status: 'success' });

    console.log(`✅ Giocatore registrato: ${playerData.username} (Liv. ${playerData.level}, WR: ${(playerData.winRate * 100).toFixed(1)}%)`);
    broadcastOnlineCount();
}

// La pagina di gioco apre una nuova connessione: la colleghiamo alla partita trovata in Arena
function rejoinMatch(ws, data) {
    const match = activeMatches.get(data.matchId);
    const player = match && match.players.find(p => p.rejoinToken && p.rejoinToken === data.rejoinToken);

    if (!player) {
        send(ws, { type: 'matchNotFound' });
        return;
    }

    // La vecchia connessione (pagina Arena) non rappresenta più questo giocatore
    if (player.ws && player.ws !== ws) {
        connectedPlayers.delete(player.ws);
    }
    if (player.disconnectTimer) {
        clearTimeout(player.disconnectTimer);
        player.disconnectTimer = null;
    }

    player.ws = ws;
    player.status = 'in_game';
    connectedPlayers.set(ws, player);

    const playerRole = match.players[0].id === player.id ? 'player1' : 'player2';
    send(ws, { type: 'rejoined', matchId: match.id, playerRole, matchState: match.matchState });
    console.log(`🔁 ${player.username} è rientrato nella partita ${match.id}`);
    broadcastOnlineCount();
}

// Vita massima e difese elementali inviate dal client (punti abilità e affinità), con limiti
function sanitizeCombatStats(raw) {
    const clamp = (value, min, max, fallback) => {
        const n = Number(value);
        return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
    };
    const elementDef = {};
    for (const [element, value] of Object.entries(raw?.elementDef || {})) {
        if (typeof element === 'string' && element.length <= 20) {
            elementDef[element] = clamp(value, 0, MATCHMAKING_CONFIG.MAX_ELEMENT_DEF, 0);
        }
    }
    return {
        maxHp: clamp(raw?.maxHp, 1, MATCHMAKING_CONFIG.MAX_HP, MATCHMAKING_CONFIG.DEFAULT_HP),
        atk: clamp(raw?.atk, 1, MATCHMAKING_CONFIG.MAX_ATK, MATCHMAKING_CONFIG.DEFAULT_ATK),
        elementDef
    };
}

function joinMatchmaking(ws, data) {
    const player = connectedPlayers.get(ws);
    if (!player) {
        send(ws, { type: 'matchmakingError', message: 'Giocatore non registrato' });
        return;
    }
    if (player.status !== 'online') {
        send(ws, { type: 'matchmakingError', message: 'Giocatore non valido o già in coda' });
        return;
    }

    // Statistiche più recenti inviate dal client
    player.level = data.level || player.level;
    player.vittorie = data.vittorie ?? player.vittorie;
    player.partite = data.partite ?? player.partite;
    player.winRate = calculateWinRate(player.vittorie, player.partite);
    player.combatStats = sanitizeCombatStats(data.combatStats);
    // Lato massimo di un'arena quadrata che entra nello schermo del giocatore
    const viewportSide = Math.floor(Math.min(Number(data.viewport?.width), Number(data.viewport?.height)));
    player.viewportSide = viewportSide > 0 ? viewportSide : null;

    player.status = 'matchmaking';
    player.queueJoinTime = Date.now();
    matchmakingQueue.push(player);

    send(ws, {
        type: 'matchmakingJoined',
        queuePosition: matchmakingQueue.length,
        estimatedWait: estimateWaitTime()
    });

    console.log(`🔍 ${player.username} si è unito al matchmaking`);
    broadcastOnlineCount();
}

function leaveMatchmaking(ws) {
    const player = connectedPlayers.get(ws);
    if (!player) return;

    const index = matchmakingQueue.findIndex(p => p.id === player.id);
    if (index !== -1) {
        matchmakingQueue.splice(index, 1);
        player.status = 'online';
        send(ws, { type: 'matchmakingLeft' });
        console.log(`❌ ${player.username} ha lasciato il matchmaking`);
        broadcastOnlineCount();
    }
}

function attemptMatchmaking() {
    // Mai accoppiare qualcuno la cui connessione non è più aperta
    matchmakingQueue = matchmakingQueue.filter(p => p.ws && p.ws.readyState === 1);

    // Ricomincia dall'inizio della coda dopo ogni match creato
    let madeMatch = true;
    while (madeMatch && matchmakingQueue.length >= 2) {
        madeMatch = false;
        for (let i = 0; i < matchmakingQueue.length - 1 && !madeMatch; i++) {
            for (let j = i + 1; j < matchmakingQueue.length; j++) {
                const player1 = matchmakingQueue[i];
                const player2 = matchmakingQueue[j];
                if (isValidMatch(player1, player2)) {
                    // Rimuovi prima l'indice più alto
                    matchmakingQueue.splice(j, 1);
                    matchmakingQueue.splice(i, 1);
                    createMatch(player1, player2);
                    console.log(`⚔️ Match creato: ${player1.username} vs ${player2.username}`);
                    madeMatch = true;
                    break;
                }
            }
        }
    }
}

function isValidMatch(player1, player2) {
    if (player1.username === player2.username) return false;

    const maxWait = Math.max(Date.now() - player1.queueJoinTime, Date.now() - player2.queueJoinTime);

    // Più si aspetta, più i criteri si allargano
    const levelTolerance = MATCHMAKING_CONFIG.LEVEL_TOLERANCE + Math.floor(maxWait / 10000);
    const winRateTolerance = MATCHMAKING_CONFIG.WINRATE_TOLERANCE + maxWait / 100000;

    if (Math.abs(player1.level - player2.level) > levelTolerance) return false;

    // Il win rate conta solo se entrambi hanno già giocato
    if (player1.partite > 0 && player2.partite > 0) {
        if (Math.abs(player1.winRate - player2.winRate) > winRateTolerance) return false;
    }
    return true;
}

// Arena quadrata condivisa: il lato è il più grande che entra in entrambi gli schermi,
// così nessuno dei due può raggiungere zone che l'altro non vede
function computeArenaSize(player1, player2) {
    const sides = [player1.viewportSide, player2.viewportSide].filter(Boolean);
    return sides.length ? Math.min(...sides) : MATCHMAKING_CONFIG.DEFAULT_ARENA_SIZE;
}

function buildPlayerGameState(player) {
    const maxHealth = player.combatStats?.maxHp || MATCHMAKING_CONFIG.DEFAULT_HP;
    return {
        id: player.id,
        username: player.username,
        level: player.level,
        health: maxHealth,
        maxHealth,
        atk: player.combatStats?.atk || MATCHMAKING_CONFIG.DEFAULT_ATK,
        elementDef: player.combatStats?.elementDef || {}
    };
}

function createMatch(player1, player2) {
    const matchId = uuidv4();
    const matchData = {
        id: matchId,
        players: [player1, player2],
        arenaSize: computeArenaSize(player1, player2),
        startTime: Date.now(),
        player1Ready: false,
        player2Ready: false,
        matchState: 'waiting_for_ready', // waiting_for_ready -> starting -> active
        gameState: {
            player1: buildPlayerGameState(player1),
            player2: buildPlayerGameState(player2)
        }
    };

    activeMatches.set(matchId, matchData);

    for (const player of [player1, player2]) {
        player.status = 'in_game';
        player.currentMatch = matchId;
        player.rejoinToken = uuidv4();
    }

    const buildMatchFound = (self, opponent, playerRole) => ({
        type: 'matchFound',
        matchId,
        rejoinToken: self.rejoinToken,
        opponent: { username: opponent.username, level: opponent.level, winRate: opponent.winRate },
        gameState: matchData.gameState,
        arenaSize: matchData.arenaSize,
        playerRole
    });

    send(player1, buildMatchFound(player1, player2, 'player1'));
    send(player2, buildMatchFound(player2, player1, 'player2'));
    broadcastOnlineCount();
}

function handlePlayerReady(ws) {
    const player = connectedPlayers.get(ws);
    if (!player || player.status !== 'in_game') return;

    const match = activeMatches.get(player.currentMatch);
    if (!match || match.matchState !== 'waiting_for_ready') return;

    console.log(`👍 ${player.username} è pronto per il match ${match.id}`);

    const isPlayer1 = match.players[0].id === player.id;
    if (isPlayer1) match.player1Ready = true;
    else match.player2Ready = true;

    send(match.players[isPlayer1 ? 1 : 0], { type: 'opponentReady' });

    if (match.player1Ready && match.player2Ready) {
        console.log(`🏁 Entrambi i giocatori pronti! Avvio countdown per ${match.id}`);
        match.matchState = 'starting';
        match.players.forEach(p => send(p, { type: 'matchStartCountdown' }));

        // Dopo il countdown del client (3 s + "DUEL!") la partita diventa attiva
        setTimeout(() => {
            if (activeMatches.has(match.id)) {
                match.matchState = 'active';
                console.log(`🟢 Match ${match.id} è ora attivo.`);
            }
        }, 4000);
    }
}

function handlePlayerMove(ws, data) {
    const context = getActiveMatchContext(ws);
    if (!context) return;
    send(context.opponent, {
        type: 'opponentMove',
        virtualMouse: data.virtualMouse,
        position: data.position,
        playerRole: context.isPlayer1 ? 'player1' : 'player2',
        timestamp: Date.now()
    });
}

function handleProjectileHit(ws, data) {
    const context = getActiveMatchContext(ws);
    if (!context) return;
    const { match, isPlayer1, opponent } = context;

    // Chi invia l'hit è chi ha sparato: il bersaglio è sempre l'avversario
    const targetKey = isPlayer1 ? 'player2' : 'player1';
    const shooterKey = isPlayer1 ? 'player1' : 'player2';
    const target = match.gameState[targetKey];

    // Danno lordo del tiratore, ridotto dalla difesa del bersaglio verso quell'elemento
    const rawDamage = Math.min(MATCHMAKING_CONFIG.MAX_HIT_DAMAGE, Math.max(0, Number(data.damage) || 0));
    const defense = (data.element && target.elementDef?.[data.element]) || 0;
    const damage = Math.round(rawDamage * (1 - defense) * 10) / 10;
    target.health -= damage;

    send(opponent, {
        type: 'projectileHit',
        target: targetKey,
        damage,
        element: data.element,
        timestamp: Date.now()
    });

    if (match.gameState[targetKey].health <= 0) {
        endMatch(match.id, 'health', shooterKey);
    }
}

function endMatch(matchId, reason, winner = null) {
    const match = activeMatches.get(matchId);
    if (!match) return;
    activeMatches.delete(matchId);

    const [player1, player2] = match.players;
    if (winner === 'player1') {
        updatePlayerStats(player1, true);
        updatePlayerStats(player2, false);
    } else if (winner === 'player2') {
        updatePlayerStats(player1, false);
        updatePlayerStats(player2, true);
    }

    const matchResults = {
        type: 'gameEnd',
        reason: reason === 'disconnect' ? 'forfeit' : reason,
        winner,
        duration: Date.now() - match.startTime,
        finalGameState: match.gameState
    };

    for (const player of match.players) {
        send(player, matchResults);
        if (player.disconnectTimer) {
            clearTimeout(player.disconnectTimer);
            player.disconnectTimer = null;
        }
        player.status = 'online';
        player.currentMatch = null;
        player.rejoinToken = null;
    }

    console.log(`🏁 Match terminato: ${reason} - Vincitore: ${winner || 'Nessuno'}`);
}

// Statistiche in memoria (quelle persistenti le salva il client su Firebase)
function updatePlayerStats(player, won) {
    player.partite = (player.partite || 0) + 1;
    if (won) player.vittorie = (player.vittorie || 0) + 1;
    player.winRate = calculateWinRate(player.vittorie || 0, player.partite);
    console.log(`📊 ${player.username}: ${won ? 'Vittoria' : 'Sconfitta'} - WinRate: ${(player.winRate * 100).toFixed(1)}%`);
}

function forfeit(match, player) {
    if (!activeMatches.has(match.id)) return;
    const opponent = match.players.find(p => p.id !== player.id);
    send(opponent, {
        type: 'opponentDisconnected',
        message: 'Il tuo avversario si è disconnesso. Hai vinto per abbandono!'
    });
    endMatch(match.id, 'disconnect', opponent.id === match.players[0].id ? 'player1' : 'player2');
}

function handlePlayerDisconnect(ws) {
    const player = connectedPlayers.get(ws);
    if (!player) return;
    connectedPlayers.delete(ws);

    console.log(`🔌 ${player.username} disconnesso`);

    const queueIndex = matchmakingQueue.findIndex(p => p.id === player.id);
    if (queueIndex !== -1) matchmakingQueue.splice(queueIndex, 1);

    const match = player.currentMatch && activeMatches.get(player.currentMatch);
    if (match && player.ws === ws) {
        if (match.matchState === 'waiting_for_ready') {
            // Normale: il giocatore sta passando dalla pagina Arena a quella di gioco.
            // Ha REJOIN_GRACE_MS per ricollegarsi con rejoinMatch, poi perde a tavolino.
            player.ws = null;
            player.disconnectTimer = setTimeout(() => {
                player.disconnectTimer = null;
                if (!player.ws) forfeit(match, player);
            }, MATCHMAKING_CONFIG.REJOIN_GRACE_MS);
        } else {
            forfeit(match, player);
        }
    }

    broadcastOnlineCount();
}

function estimateWaitTime() {
    return Math.max(5, matchmakingQueue.length * 10); // secondi
}

function broadcastOnlineCount() {
    const message = {
        type: 'playerCounts',
        totalOnline: connectedPlayers.size,
        playersReady: matchmakingQueue.length
    };
    connectedPlayers.forEach(player => send(player, message));
}

function calculateWinRate(vittorie, partite) {
    return partite > 0 ? (vittorie / partite) : 0;
}

async function getAllPlayersFromDB() {
    const snapshot = await dbAdmin.collection('players').get();
    return snapshot.docs.map(doc => doc.data());
}

async function sendLeaderboard(ws) {
    const MIN_MATCHES_FOR_LEADERBOARD = 10;

    let allPlayers;
    try {
        allPlayers = await getAllPlayersFromDB();
    } catch (error) {
        console.error('❌ Errore nel fetch dei giocatori dal DB Admin:', error);
        send(ws, { type: 'matchmakingError', message: 'Errore interno del server (DB).' });
        return;
    }

    const leaderboard = allPlayers
        .map(p => {
            const partite = p.partite || 0;
            const vittorie = p.vittorie || 0;
            return {
                username: p.username,
                level: p.livello || 1,
                vittorie,
                partite,
                winRate: partite > 0 ? vittorie / partite : 0
            };
        })
        .filter(p => p.partite >= MIN_MATCHES_FOR_LEADERBOARD)
        .sort((a, b) => b.winRate - a.winRate)
        .slice(0, 50);

    send(ws, { type: 'leaderboardData', leaderboard });
    console.log(`📊 Leaderboard inviata (${leaderboard.length} giocatori idonei).`);
}

// Pulizia periodica delle partite scadute
setInterval(() => {
    const now = Date.now();
    activeMatches.forEach((match, matchId) => {
        if (now - match.startTime > MATCHMAKING_CONFIG.MATCH_TIMEOUT) {
            console.log(`🧹 Pulizia match scaduto: ${matchId}`);
            endMatch(matchId, 'timeout');
        }
    });
}, 10000);

// Heartbeat: chiude le connessioni che non rispondono al ping (cadute senza un "close"
// pulito, frequenti dietro il proxy di Render). Il "close" poi passa da handlePlayerDisconnect.
setInterval(() => {
    wss.clients.forEach(ws => {
        if (!ws.isAlive) {
            ws.terminate();
            return;
        }
        ws.isAlive = false;
        ws.ping();
    });
}, MATCHMAKING_CONFIG.HEARTBEAT_MS);

// Cuore del matchmaking, eseguito regolarmente
setInterval(attemptMatchmaking, 3000);

console.log(`🚀 Server WebSocket avviato sulla porta ${port}`);
console.log(`⚔️ Sistema matchmaking attivo`);
