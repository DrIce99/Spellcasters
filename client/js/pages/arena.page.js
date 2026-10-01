// arena.page.js - Lobby dell'Arena: matchmaking, classifica, accesso al training
import { getPlayerData } from '../services/player-db.js';
import { WS_URL } from '../services/config.js';
import { computePlayerStats, getCombatStats } from '../game/player-stats.js';
import { initColorTheme, initUITheme } from '../ui/theme.js';

class ArenaManager {
    constructor() {
        this.ws = null;
        this.playerId = null;
        this.currentMatch = null;
        this.playerData = null;
        this.isConnected = false;
        this.isRegistered = false;
        this.isLeaving = false; // true quando si lascia la pagina di proposito
        this.matchmakingStatus = 'idle'; // idle, searching, found

        this.setupEventListeners();
        this.loadPlayer();
        this.connectToServer();
    }

    async loadPlayer() {
        const username = localStorage.getItem('currentPlayer');
        if (!username) {
            this.updateStatusMessage('Accesso non effettuato. Ritorna alla Home per accedere.');
            return;
        }

        this.updateStatusMessage(`Caricamento dati per ${username}...`);
        try {
            this.playerData = await getPlayerData(username);
            if (!this.playerData) {
                this.updateStatusMessage('Utente non trovato nel database! Accesso necessario.');
                return;
            }
            document.getElementById('name-value').textContent = this.playerData.username;
            document.getElementById('level-value').textContent = this.playerData.livello || 1;
            this.updatePlayerStats();
            this.updateStatusMessage('Dati utente caricati. Connessione al server...');
            // La registrazione parte quando sia i dati sia la connessione sono pronti
            this.registerPlayer();
        } catch (error) {
            console.error('❌ Errore nel recupero dati utente:', error);
            this.updateStatusMessage('Errore di connessione al database. Controlla la Console.');
        }
    }

    updatePlayerStats() {
        if (!document.getElementById('player-stats')) {
            const stats = document.createElement('div');
            stats.id = 'player-stats';
            stats.innerHTML = `
                <h3>Statistiche PvP</h3>
                <p>Partite giocate: <span id="total-matches">0</span></p>
                <p>Vittorie: <span id="total-wins">0</span></p>
                <p>Win Rate: <span id="win-rate">0%</span></p>
            `;
            document.getElementById('player-info').appendChild(stats);
        }

        const partite = this.playerData.partite || 0;
        const vittorie = this.playerData.vittorie || 0;
        const winRate = partite > 0 ? vittorie / partite : 0;

        document.getElementById('total-matches').textContent = partite;
        document.getElementById('total-wins').textContent = vittorie;
        document.getElementById('win-rate').textContent = `${(winRate * 100).toFixed(1)}%`;
    }

    setupEventListeners() {
        document.getElementById('matchmaking-btn').addEventListener('click', () => this.toggleMatchmaking());

        document.getElementById('home-btn').addEventListener('click', () => {
            this.leaveMatchmaking();
            window.location.href = '/home.html';
        });

        document.getElementById('training-btn').addEventListener('click', () => {
            window.location.href = '/game.html?mode=training';
        });

        document.getElementById('open-leaderboard-btn').addEventListener('click', () => this.showLeaderboard());
        document.getElementById('close-leaderboard-btn').addEventListener('click', () => this.hideLeaderboard());

        window.addEventListener('beforeunload', () => {
            this.isLeaving = true;
            this.leaveMatchmaking();
            if (this.ws) this.ws.close();
        });
    }

    connectToServer() {
        try {
            this.ws = new WebSocket(WS_URL);

            this.ws.onopen = () => {
                console.log('✅ Connesso al server arena');
                this.isConnected = true;
                this.updateConnectionStatus('Connesso');
                this.registerPlayer();
            };

            this.ws.onmessage = (event) => {
                try {
                    this.handleServerMessage(JSON.parse(event.data));
                } catch (error) {
                    console.error('❌ Errore parsing messaggio server:', error);
                }
            };

            this.ws.onerror = (error) => {
                console.error('❌ Errore WebSocket:', error);
                this.updateConnectionStatus('Errore connessione');
            };

            this.ws.onclose = () => {
                console.log('🔌 Connessione chiusa');
                this.isConnected = false;
                this.isRegistered = false;
                this.playerId = null;
                this.matchmakingStatus = 'idle';
                this.updateMatchmakingUI();
                this.updateConnectionStatus('Disconnesso');
                this.updateOnlineCount(0);

                // Riprova la connessione dopo 5 secondi (ma non se stiamo cambiando pagina)
                if (!this.isLeaving) {
                    setTimeout(() => {
                        if (!this.isConnected && !this.isLeaving) this.connectToServer();
                    }, 5000);
                }
            };
        } catch (error) {
            console.error('❌ Errore creazione WebSocket:', error);
            this.updateConnectionStatus('Impossibile connettersi');
        }
    }

    send(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
            return true;
        }
        return false;
    }

    registerPlayer() {
        // Serve sia la connessione aperta sia il profilo caricato da Firebase
        if (this.isRegistered || !this.isConnected || !this.playerData) return;

        this.send({
            type: 'register',
            username: this.playerData.username,
            level: this.playerData.livello || 1,
            vittorie: this.playerData.vittorie || 0,
            partite: this.playerData.partite || 0
        });
        this.isRegistered = true;
    }

    handleServerMessage(data) {
        switch (data.type) {
            case 'registered':
                this.playerId = data.playerId;
                this.updateStatusMessage('Registrato - Pronto per il matchmaking');
                this.updateMatchmakingUI();
                break;

            case 'onlinePlayers':
                this.updateOnlineCount(data.count);
                break;

            case 'playerCounts':
                this.updateOnlineCount(data.totalOnline);
                this.updateReadyCount(data.playersReady);
                break;

            case 'matchmakingJoined':
                this.matchmakingStatus = 'searching';
                this.updateMatchmakingUI();
                this.updateStatusMessage(`In coda... Posizione: ${data.queuePosition}`);
                break;

            case 'matchmakingLeft':
                this.matchmakingStatus = 'idle';
                this.updateMatchmakingUI();
                this.updateStatusMessage('Ricerca annullata');
                break;

            case 'matchFound':
                this.handleMatchFound(data);
                break;

            case 'matchmakingError':
                console.error('❌ Errore matchmaking dal server:', data.message);
                this.updateStatusMessage(`Errore: ${data.message}`);
                this.matchmakingStatus = 'idle';
                this.updateMatchmakingUI();
                break;

            case 'sessionReplaced':
                // Lo stesso utente si è collegato altrove: niente riconnessione automatica
                this.isLeaving = true;
                this.updateStatusMessage('Sessione aperta in un\'altra scheda. Ricarica la pagina per usare questa.');
                break;

            case 'leaderboardData':
                this.renderLeaderboard(data.leaderboard);
                break;

            default:
                console.log('📨 Messaggio server non gestito:', data.type);
        }
    }

    handleMatchFound(data) {
        this.currentMatch = data.matchId;
        this.matchmakingStatus = 'found';
        this.updateMatchmakingUI();
        this.updateStatusMessage(`Match trovato! Avversario: ${data.opponent.username} (Liv. ${data.opponent.level})`);

        // Mostra le informazioni del match per qualche secondo prima di iniziare
        setTimeout(() => this.startMatch(data), 3000);
    }

    startMatch(matchData) {
        // Dati letti da game.html?mode=pvp. rejoinToken permette di ricollegarsi
        // alla stessa partita dopo il cambio pagina (che chiude questa connessione).
        localStorage.setItem('currentMatchData', JSON.stringify({
            matchId: matchData.matchId,
            rejoinToken: matchData.rejoinToken,
            opponent: matchData.opponent,
            gameState: matchData.gameState,
            arenaSize: matchData.arenaSize,
            playerRole: matchData.playerRole,
            mode: 'pvp'
        }));

        this.isLeaving = true;
        window.location.href = '/game.html?mode=pvp';
    }

    toggleMatchmaking() {
        if (!this.isConnected) {
            this.updateStatusMessage('Errore: non connesso al server');
            return;
        }
        if (!this.playerData) {
            this.updateStatusMessage('Errore: dati giocatore non caricati');
            return;
        }
        if (!this.playerId) {
            this.updateStatusMessage('Registrazione sul server in corso, attendi...');
            this.registerPlayer();
            return;
        }

        if (this.matchmakingStatus === 'idle') {
            this.joinMatchmaking();
        } else if (this.matchmakingStatus === 'searching') {
            this.leaveMatchmaking();
        }
    }

    joinMatchmaking() {
        this.send({
            type: 'joinMatchmaking',
            level: this.playerData.livello || 1,
            vittorie: this.playerData.vittorie || 0,
            partite: this.playerData.partite || 0,
            // Il server ne ricava l'arena quadrata condivisa tra i due giocatori
            viewport: { width: window.innerWidth, height: window.innerHeight },
            // Vita massima e difese elementali (punti abilità e affinità)
            combatStats: getCombatStats(computePlayerStats(this.playerData))
        });
        this.updateStatusMessage('Entrando in coda...');
    }

    leaveMatchmaking() {
        if (this.matchmakingStatus === 'searching') {
            this.send({ type: 'leaveMatchmaking' });
        }
    }

    updateMatchmakingUI() {
        const btn = document.getElementById('matchmaking-btn');
        switch (this.matchmakingStatus) {
            case 'idle':
                btn.textContent = 'Cerca Partita';
                btn.disabled = false;
                break;
            case 'searching':
                btn.textContent = 'Annulla Ricerca';
                btn.disabled = false;
                break;
            case 'found':
                btn.textContent = 'Match Trovato!';
                btn.disabled = true;
                break;
        }
    }

    updateStatusMessage(message) {
        const statusElement = document.getElementById('status-message');
        if (statusElement) statusElement.textContent = message;
    }

    updateConnectionStatus(status) {
        let indicator = document.getElementById('connection-status');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'connection-status';
            document.getElementById('arena-container').appendChild(indicator);
        }
        indicator.textContent = `Stato: ${status}`;
        indicator.className = `connection-indicator ${status === 'Connesso' ? 'connected' : 'disconnected'}`;
    }

    updateOnlineCount(count) {
        const element = document.getElementById('online-players-count');
        if (element) element.textContent = count;
    }

    updateReadyCount(count) {
        const element = document.getElementById('ready-players-count');
        if (element) element.textContent = count;
    }

    showLeaderboard() {
        document.body.classList.add('show-leaderboard');
        if (!this.send({ type: 'requestLeaderboard' })) {
            this.updateStatusMessage('Non connesso al server per la classifica.');
            return;
        }
        this.updateStatusMessage('Caricamento classifica PvP...');
    }

    hideLeaderboard() {
        document.body.classList.remove('show-leaderboard');
    }

    renderLeaderboard(leaderboard) {
        const listContainer = document.getElementById('leaderboard-list');
        if (!listContainer) return;

        listContainer.innerHTML = '';
        this.updateStatusMessage('Classifica aggiornata');

        if (leaderboard.length === 0) {
            listContainer.innerHTML = '<p>Ancora nessun giocatore idoneo in classifica.</p>';
            return;
        }

        const ul = document.createElement('ul');
        ul.className = 'leaderboard-list';
        ul.innerHTML = `
            <li class="header">
                <span class="rank">#</span>
                <span class="name">Giocatore</span>
                <span class="winrate">Win Rate</span>
                <span class="wins">Vittorie</span>
                <span class="matches">Partite</span>
            </li>
        `;

        const rankClasses = ['gold-rank', 'silver-rank', 'bronze-rank'];
        leaderboard.forEach((player, index) => {
            const li = document.createElement('li');
            // textContent (non innerHTML): i nomi utente sono scelti dai giocatori
            const cells = [
                ['rank', `#${index + 1}`],
                ['name', `${player.username} (Liv. ${player.level})`],
                ['winrate', `${(player.winRate * 100).toFixed(1)}%`],
                ['wins', player.vittorie || 0],
                ['matches', player.partite]
            ];
            for (const [className, text] of cells) {
                const span = document.createElement('span');
                span.className = className;
                span.textContent = text;
                li.appendChild(span);
            }

            if (this.playerData && this.playerData.username === player.username) li.classList.add('my-rank');
            if (rankClasses[index]) li.classList.add(rankClasses[index]);

            ul.appendChild(li);
        });

        listContainer.appendChild(ul);
    }
}

initColorTheme();
initUITheme();
new ArenaManager();
