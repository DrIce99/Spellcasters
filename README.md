# Spellcasters
A simple web app game with *magic*

## Per lo sviluppatore

### Struttura del progetto

```
Spellcasters/
├── package.json          ← UNICO package.json (client + server)
├── vite.config.js        ← Vite usa client/ come root, la build finisce in dist/
├── .env.example          ← copialo in .env.local per usare il server locale
├── client/               ← tutto ciò che gira nel BROWSER
│   ├── index.html        ← login/registrazione
│   ├── home.html, lab.html, arena.html, game.html, player-info.html, version.html
│   ├── js/
│   │   ├── pages/        ← uno script per pagina (index.html → login.page.js, home.html → home.page.js, ...)
│   │   ├── game/         ← motore di gioco
│   │   │   ├── engine.js          ← loop principale: simboli, cerchi magici, proiezioni, mana, esperienza
│   │   │   ├── pvp-manager.js     ← partite PvP (WebSocket)
│   │   │   ├── training.js        ← manichino del training
│   │   │   ├── elements.js        ← elementi e colori condivisi
│   │   │   ├── progression.js     ← curve di livello/esperienza/mana
│   │   │   ├── dollar-recognizer.js, element-patterns.js, status-effects.js, ...
│   │   │   └── entities/enemy.js
│   │   ├── services/     ← config.js (URL server, Firebase), firebase.js, player-db.js
│   │   └── ui/           ← theme.js (giorno/notte, Classic/Rework), fog-background.js
│   ├── public/           ← file statici copiati così come sono: css/, sound/, img/
│   └── dev/              ← pagine di sviluppo NON incluse nella build (preview pattern, prototipo Open World)
└── server/
    └── server.js         ← server WebSocket: matchmaking, PvP, classifica
```

### Comandi

```bash
npm install        # una volta sola, nella root
npm run dev        # client in sviluppo (http://localhost:5173)
npm run server     # server WebSocket locale (porta 8080)
npm run build      # build di produzione in dist/
```

Di default il client usa il server online (`wss://spellcasters.onrender.com`).
Per usare quello locale crea `.env.local` nella root con `VITE_WS_URL=ws://localhost:8080`.

Il server in locale ha bisogno di `server/serviceAccountKey.json` (credenziali Firebase Admin, **mai** da committare);
online usa la variabile d'ambiente `FIREBASE_SERVICE_ACCOUNT`.

### Deploy

- **Server** (Render): comando di avvio `npm start` dalla root del repository.
- **Client**: root del repository, comando di build `npm run build`, cartella da pubblicare `dist/`.

### Flusso di una partita PvP

1. `arena.html` si registra al server e entra in coda.
2. Il server crea la partita e invia `matchFound` con un `rejoinToken` personale.
3. L'Arena passa a `game.html?mode=pvp`: la vecchia connessione si chiude, la nuova invia `rejoinMatch`
   (il server aspetta fino a 20 secondi prima di assegnare la sconfitta a tavolino).
4. Entrambi premono "Sono pronto" → countdown → partita attiva.

**ITA**

N.B. Per Player e Caster si intende la stessa cosa

# Sistema di magia:

1. il player deve creare un cerchio magico a partire dal nulla:
    - Ciò che deve fare è tracciare un movimento col mouse. Se quel movimento corrisponde all’inizio di qualcosa (vedi sotto), il puntatore del mouse si illumina per informare il giocatore che c’è qualcosa di realizzabile con quel gesto. Per generare ciò che è realizzabile, deve tenere premuto il tasto “Z”.

## Cosa accade quando si genera una magia:

In base a cosa si ha invocato, si hanno dei risultati diversi:

1. se si ha invocato un elemento (a vuoto, quindi non all’interno di un cerchio magico), dal mouse si sprigiona un debole effetto di particelle inerente a quell’elemento
2. se si ha invocato un cerchio magico, verrà generato un cerchio incolore (fucsia) che resterà sul banco (schermo) fino alla sua cancellazione (tenendo premuto “X” o tasto destro, si passa sopra col mouse come fosse una gomma \[basta che si cancelli metà del cerchio per eliminare l’intero cerchio, non serve cancellare ogni singolo punto\]).
    1. se si disegna un elemento all’interno del cerchio, viene “inciso” (nel cerchio) un cerchio magico del simbolo corrispondente a ciò che si ha disegnato (solo se realizzabile) \[dev deve disegnare ogni singolo cerchio possibile\] \[vale la stessa regola di eliminazione detta in precedenza\] \[il colore del cerchio magico globale cambia in base al colore corrispondente all’elemento\]
    2. se si disegna una proiezione all’interno del cerchio, viene aggiunto un cerchio concentrico di dimensione minore al cerchio di base, con delle “rune” in base al tipo di proiezione \[dev deve disegnare ogni possibile disegno\]
3. se si ha invocato una proiezione (a vuoto, quindi non all’interno di un cerchio magico avente già un elemento), del “mana puro” (effetto azzurro-trasparente) (è affetto da ogni tipo di resistenza \[vedi sotto\]) viene sprigionato secondo la proiezione invocata
4. il cerchio magico che si ha creato è trascinabile (se ne può tenere uno sullo schermo per volta)
5. se si vuole testare il cerchio magico, si può cliccare due volte su di esso per vederne il risultato (una volta invocato sparisce) (in battaglia, si applica immediatamente)
6. se si vuole “salvare” il cerchio magico, mentre si tiene premuto il tasto sinistro del mouse si clicca “S”. QUANDO SI SALVA, si può associare un disegno alla propria creazione, in modo da essere facilmente utilizzato in battaglia \[lato dev: prestare attenzione a tenere “unici” i disegni\]. Dopodiché esso verrà salvato nel proprio spellbook.

## Elementi:

- **Fuoco** (si genera disegnando una “y” al contrario)
- **Acqua** (si genera disegnando una goccia)
- **Aria** (si genera disegnando “un giro di molla” o "pigtail")
- **Terra** (si genera disegnando un quadrato \[a partire dal lato sinistro dal basso verso l’alto in poi\] con il punto di fine che oltrepassa la linea iniziale \[lato sinistro e inferiore devono essere intersecati\])
- **Fulmine** (si genera disegnando il simbolo del fulmine dall’alto verso il basso)
- **Luce** (si genera disegnando un “+” \[a partire da sinistra verso destra, si uniscono estremo destro con superiore e poi si traccia verso il basso\])
- **Oscurità** (si genera disegnando in maniera stilizzata delle corna)
- **Benessere** (simbolo dell’infinito \[a partire da sinistra\])
- … (da aggiungere una volta che funzionerà la base)

Cerchio magico:

- Un semplice cerchio

Proiezioni:

- **Proiettile** (si genera disegnando una linea semplice \[la direzione del lancio del proiettile dipende dalla direzione di punto iniziale del disegno e punto finale\])
- **Trappola** (si genera disegnando il simbolo di watch dogs, dopodiché si disegna il perimetro entro la cui area si attiverà la magia) (non si attiva fino a quando un player non ci sale sopra \[ovvero uno dei due mouse non si trova in quell’area\]) \[il mana viene consumato in base all’area\]
- **Laser** (si genera disegnando una linea semplice, torna indietro al punto di partenza e ripercorre la linea (come una “z” ma più appiattita)) (**magia permanente**: rimane attiva fino a quando non si annulla \[tasto destro del mouse\])
- **Stato** (si genera disegnando un triangolo con il lato sinistro verticale (la cui forma somiglia al puntatore del mouse)) (applica a sé) \[in base alla tabella degli elementi, aumenta/diminuisce la difesa in base a forze e resistenze (vedi di seguito) tranne per “Benessere”, che aumenta semplicemente la potenza di attacco\] (**magia permanente**)
- **Spaziale** (si genera disegnando una “N” (a partire da sinistra) e unendo il punto finale con quello iniziale) (funziona come trappola (per il calcolo del mana usato in base all’area), ma si attiva subito ed è una **magia permanente**)

## ANNULLAMENTO MAGIE PERMANENTI:

- Tasto destro del mouse sulla magia (se si usa un laser semplice tasto destro)

 ### Resistenze (-> = superefficace, l’opposto è resistenza/counter, TUTTO QUESTO SERVE SOLO PER LE DIFESE o per ANNULLARE/CONTRASTARE ALTRE MAGIE IN CAMPO):

- Acqua -> Fuoco, Terra
- Fuoco -> Aria, Terra
- Terra -> Aria
- Aria -> Acqua
- Fulmine -> Acqua
- Aria != (immune) a Fulmine
- Luce &lt;-&gt; Oscurità (resistono a vicenda)

### INTERAZIONI magie:

- se si passa una magia d’acqua su una magia in fiamme (o viceversa), il fuoco si spegne dove passa la magia.
- se si passa una magia di fuoco su una magia d’aria (o viceversa), l'aria si trasforma in fuoco (l'appartenenza della magia d'aria infuocata diventa del player che ha castato quella di fuoco)
- se si passa una magia d’aria su una magia d’acqua (o viceversa), l'acqua si dissolve
- se si passa una magia di fulmine su una magia d’acqua (o viceversa), essa si carica di elettricità che danneggia entrambi i Caster
- Aria ignora Fulmine
- Luce annulla Oscurità e viceversa (easter egg: in caso due laser di luce e oscurità si scontrano tra loro, i Caster rimangono ad evocarli come in Dragon Ball fino a quando il primo non termina mana. Animazione cinematica speciale)
- se si passa una magia di acqua su una magia di terra (o viceversa), essa diverrà rigogliosa e permetterà una rigenerazione aumentata di mana ad entrambi i Caster
- se si passa una magia di fuoco su una magia di terra (o viceversa), essa diverrà magma e arrecherà danno ad entrambi i Caster. Se è una proiezione, lascia dietro di sé una scia per 2.5 secondi.
- le proiezioni di terra ignorano le magie spaziali di fulmine, ma le proiezioni di fulmine vengono bloccate dalle magie spaziali di terra
- eccetto le interazioni precedentemente citate, la magia spaziale di terra blocca le proiezioni che entrano in contatto con essa
- fulmine potenzia il danno delle magie di luce

**Stato implementazione** (regole in `client/js/game/spell-interactions.js`, solo con gli elementi attuali; si applicano a proiettili e aree spaziali):

- acqua spegne fuoco; fuoco incendia aria (l'area passa a chi ha lanciato il fuoco); aria dissolve acqua
- acqua + terra = rigoglio (12 s, rigenerazione mana ×3 per entrambi); fuoco + terra = magma (5 s, danno a entrambi; i proiettili lasciano una scia di 2.5 s)
- l'area di terra blocca i proiettili che non reagiscono con lei
- extra: due proiettili avversari che si incrociano interagiscono tra loro; l'acqua raffredda il magma
- l'esperienza si guadagna solo nelle partite PvP online (non in laboratorio né in training)

IL MANA CHE SI POSSIEDE È LIMITATO ANCHE IN LABORATORIO.

UI per vedere quanto mana si possiede: perimetro colorato al limite dello schermo (in maniera simmetrica, è come una barra di caricamento il cui massimo è il centro del lato superiore e il minimo il centro del lato inferiore)

Più si utilizza la magia, più aumenta l’esperienza. L’esperienza permette di salire di livello e di aumentare:

- danno magico
- capienza massima di mana (in futuro dovrà esserci un matchmaking bilanciato in base al livello che si ha)
- velocità di rigenerazione di mana

Se si ignora il mana rimanente e lo si oltrepassa, si va in **burnout** (o overload) (le magie attive si annullano e non si possono utilizzare magie per 5 secondi)

### Effetti degli elementi sugli avversari:
se un proiettile infuso di un elemeno colpisce un avversario, questo avversario subisce le conseguenze del colpo in base all'elemento:
- fuoco: l'avversario "brucia" (subisce 1 di danno ogni 0.5 secondi per 1.5 secondi)
- acqua: l'avversario è rallentato del 20% per 1.5 secondi
- aria: i comandi dell'avversario (assi x e y) sono invertiti per 1.5 secondi
- terra: l'avversario non può muoversi per 0.5 secondi ogni 0.5 secondi per 2 volte
- fulmine: proiezione/laser: rimbalza su qualsiasi superficie (anche magie di terra); trappola/spaziale: paralizza l'avversario*

Quando un player è paralizzato a causa di una magia di fulmine, può comunque castare in modalità "virtuale" (si può muovere per disegnare magie, ma il corpo non si muove)

### Consumo di mana:
- Elementi: 1 mana
- Proiezioni (non permanenti): 2 mana
- Proiezioni (permanenti): mana graduale (consumo ogni 0.1 secondi)
- Proiezioni spaziali: mana in base all'area
- Cerchi magici: 0 mana
- Cerchi magici caricati di elementi e proiezioni (non permanenti): proiezione * 1.5 mana
- Cerchi magici caricati di elementi e proiezioni: proiezione (consumo ogni 0.1 secondi) mana

#### Note per lo sviluppatore:

##### Modalità di implementazione graduale:

- Alpha (di test per vedere se funziona):
  - Elementi: Acqua, Fuoco, Aria, Terra
  - Proiezioni: Proiettile
  - No magie permanenti (e sistema di annullamento)
  - No Arena
  - No interazione delle magie
  - UI di visualizzazione mana
  - Livello ed esperienza
- 1.0:
  - Implementazione magie permanenti (e sistema di annullamento)
  - Proiezioni: spaziale
- 1.1:
  - Arena
  - Sistema di interazione delle magie in campo
- 1.1.2:
  - Sistema di salvataggio delle magie
- 1.2:
  - Nuovi elementi: Fulmine, Luce, Oscurità
  - Nuove proiezioni: Trappola, laser
- 1.3:
  - Nuovo elemento: Benessere
  - Nuova proiezione: Stato (e sistema di resistenze)
  
...

- 2.0:
  - Open World