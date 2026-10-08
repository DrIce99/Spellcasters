# Spellcasters
A simple web app game with *magic*

- [Per lo sviluppatore](#per-lo-sviluppatore)
- [Game design](#game-design)
  - [Comandi](#comandi) · [Sistema di magia](#sistema-di-magia) · [Elementi](#elementi) · [Proiezioni](#proiezioni)
  - [Interazioni tra magie](#interazioni-tra-magie) · [Mana](#mana) · [Progressione](#progressione) · [Linker](#linker) · [Missioni](#missioni) · [Roadmap](#roadmap)

---

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
│   │   │   ├── spell-interactions.js ← regole delle interazioni tra magie
│   │   │   ├── fx.js              ← effetti nel canvas (onde d'urto, cerchio che si dissolve, tratto che sfuma)
│   │   │   ├── dollar-recognizer.js, element-patterns.js, status-effects.js, ...
│   │   │   └── entities/enemy.js
│   │   ├── data/         ← changelog.js (patch notes), balance-history.js (storico di buff e nerf)
│   │   ├── services/     ← config.js (URL server, Firebase), firebase.js, player-db.js
│   │   └── ui/           ← theme.js (giorno/notte), fog-background.js, motion.js (transizioni), sfx.js (suoni sintetizzati)
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

1. `arena.html` si registra al server e entra in coda (inviando le dimensioni dello schermo).
2. Il server crea la partita e invia `matchFound` con un `rejoinToken` personale e le dimensioni dell'arena.
3. L'Arena passa a `game.html?mode=pvp`: la vecchia connessione si chiude, la nuova invia `rejoinMatch`
   (il server aspetta fino a 20 secondi prima di assegnare la sconfitta a tavolino).
4. Entrambi premono "Sono pronto" → countdown → partita attiva.

L'arena è il rettangolo più grande che entrambi vedono per intero: l'intersezione dei due schermi
(larghezza minore × altezza minore, `arenaWidth`/`arenaHeight`). Chi ha lo schermo più grande la vede
centrata con un bordo; se la finestra viene rimpicciolita l'arena si scala. `arenaSize` (il lato del
quadrato che ci entra) resta nel messaggio solo per i client non aggiornati.

### Note tecniche

- **Suoni dei laser**: per ogni elemento `client/public/sound/sfx/lasr/<elemento>-lasr-init.wav` (suonato una volta all'accensione)
  seguito senza stacchi dal loop `<elemento>-lasr-cont.wav`. Il laser neutro usa `magk`; un elemento nuovo va aggiunto in
  `soundFiles` e `laserSoundTypes` di `audio-manager.js` (senza, usa i suoni neutri).
- **Suoni generati via Web Audio**: il ronzio delle aree di fulmine e il rimbalzo del fulmine (`createSynthesizedSounds` in `audio-manager.js`).
- **Suoni brevi di interfaccia e di transizione** (click, cambio pagina, cerchio evocato, runa incisa, simbolo fallito, annullamento,
  burnout, livello, colpi, esito): sintetizzati in `client/js/ui/sfx.js`. Per sostituirne uno con un file basta aggiungere il percorso
  in `SFX_FILES` con la stessa chiave.
- **File audio**: vanno in `client/public/sound/`, non in `dist/` (che viene svuotata a ogni build).
- **Transizioni**: per cambiare pagina si usa `navigateTo(url)` di `client/js/ui/motion.js` (velo a iride con il cerchio runico);
  le animazioni sono in `client/public/css/style-motion.css`, gli effetti nel canvas in `client/js/game/fx.js`.
- **Spellbook**: dati in `client/js/game/spellbook.js`, overlay in `client/js/ui/spellbook-overlay.js`
  (anteprime disegnate con `renderCircleImage` di `favicon.js`; stile in `style-spellbook.css`, con `.panel` e `.section-title`). Su Firestore è il campo `spellbook` del giocatore:
  `{ "1": { elemento, proiezioni: [...], savedAt }, ... }`, aggiornato uno slot alla volta (`savePlayerSpell`).
  Il cerchio evocato ha `spellbookElement` e `spellbookCharges[i]`; proiettili, laser e aree lanciati da lì ricevono
  `progress: { element, projection }` (`spellProgress()` in `engine.js`) e lo rispettano anche nei tick continui.
  Nel PvP il cerchio evocato porta con sé `spellbook: { slot, elemento, proiezioni }` nel messaggio `magicCircleUpdate`
  (il server lo inoltra così com'è, quindi non serve aggiornarlo): l'avversario lo registra con `recordOpponentSpell`.
  La modalità salvataggio inverte i colori del puntatore con `ctx.filter = 'invert(1)'` in `drawVirtualMouse`,
  quindi vale per qualsiasi aspetto del puntatore.
- **Linker**: slot e colore in `client/js/game/linker.js`, disegno del cerchio in `client/js/ui/linker-circle.js`,
  grafica degli slot in `client/js/ui/linker-art.js`: gli SVG (neri, con forme bianche che "bucano" il nero) diventano una
  maschera di trasparenza colorata al volo; i tratti vengono ingrossati perché a meno di 100 px quelli da 1-4 unità sparirebbero.
  Un nuovo SVG va disegnato allo stesso modo (viewBox -400..400, anello esterno a raggio ~356).
  Traslitterazione in rune in `client/js/ui/runes.js` con il pacchetto npm **riimut** (font Noto Sans Runic da Google Fonts,
  Segoe UI Historic come riserva). riimut su npm (0.9.1) non ha ancora le rune staveless, documentate nel suo README: la
  tabella è presa da riimut-rs (stesso autore, MIT) in `client/js/ui/staveless-futhark.js`. riimut è CommonJS: va importato
  con `import * as` (vedi il commento in `runes.js`), altrimenti con Vite è `undefined`.
  Selezione, animazione (tecnica FLIP con la Web Animations API) e inventario in `client/js/ui/linker-inspector.js`.
  Su Firestore è il campo `linker` del giocatore: `{ colore: '#rrggbb', alfabeto, inventario: [{ id, slot, ... }],
  equip: { core: id, matrix: id, relay: id, conduit: id, apex: id } }`. Un Linker è
  `{ id, set, slot, rarita, livello, exp, principale, secondarie: [{ stat, upgrades }] }`: i valori si calcolano dalle
  regole, così si possono ribilanciare senza toccare i dati salvati. Valute in `valute: { bitrune, catalizzante }`,
  garanzia del gacha in `gacha.pity`. Pull, catalisi, livelli ed equipaggiamento sono transazioni
  (`client/js/services/linker-db.js`); inventario e potenziamento in `client/js/ui/linker-inventory.js`.
- **Impostazioni** (salvate in `localStorage`): numero di particelle, volume, tema, indicatore della carica selezionata
  (`chargeIndicator`: nessuno / particelle / mirino / entrambi). Il gioco le legge all'apertura della pagina.

---

## Game design

> N.B. Per Player e Caster si intende la stessa cosa.

Legenda dello stato: ✅ implementato · 🔜 da implementare

### Comandi

| Tasto | Azione | Stato |
|---|---|---|
| **Z** (tenuto) | Disegna un simbolo muovendo il player | ✅ |
| **X** (tenuto) | Disegno virtuale: il player sta fermo finché non si rilascia il tasto, poi il puntatore torna sulla posizione del player (e non il contrario) | 🔜 1.2.5 |
| **Tasto destro** / **X** | Annulla, in ordine: il laser sotto il mouse, l'area sotto il mouse, il cerchio sotto il mouse (insieme a tutte le magie permanenti), altrimenti l'ultimo laser "semplice" (lanciato a vuoto) | ✅ |
| **Click sinistro sul cerchio + trascinamento** | Lancia la carica selezionata nella direzione del trascinamento (per la spaziale: si disegna il perimetro) | ✅ |
| **Rotella** | Sceglie quale carica del cerchio lanciare | ✅ |
| **R** (solo in laboratorio) | Entra/esce dalla modalità salvataggio: il puntatore ha i colori invertiti | ✅ |
| **1**–**9** | Evoca sotto il mouse il cerchio salvato nello slot (laboratorio, training e PvP). In modalità salvataggio (laboratorio): salva nello slot il cerchio magico sotto il mouse, sovrascrivendolo | ✅ |
| **Tab** (tenuto) | Mostra gli slot dello spellbook sopra il gioco, con lo sfondo oscurato; sparisce al rilascio. Nel PvP mostra anche gli slot già usati dall'avversario | ✅ |
| **↑** / **↓** | Tema giorno / notte | ✅ |

Z, X, R, Tab e i tasti del tema si possono riassegnare da **Impostazioni → Key Bindings** (salvati nel browser);
i tasti 1–9 sono fissi perché sono la barra degli slot. Le combinazioni con Ctrl/Alt (es. Ctrl+1) restano al browser.

Regole del disegno virtuale:
- non si possono sparare proiettili a vuoto, solo dai cerchi magici;
- solo con il disegno virtuale si possono evocare i **muri** e la **cinetica**;
- un player paralizzato dal fulmine può comunque castare in modalità virtuale (il cursore si muove per disegnare, il corpo no).

### Sistema di magia

Il player crea le magie a partire dal nulla: traccia un movimento col mouse tenendo premuto **Z**. Se quel movimento
corrisponde all'inizio di qualcosa di realizzabile, il bordo dello schermo si illumina per avvisarlo.

Cosa succede in base a ciò che si è invocato:

1. **Un elemento a vuoto** (fuori da un cerchio magico): dal mouse si sprigiona un debole effetto di particelle di quell'elemento.
2. **Un cerchio magico**: compare un cerchio incolore (fucsia) che resta sul campo finché non viene cancellato:
   tenendo premuto X o il tasto destro ci si passa sopra col mouse come una gomma, e basta cancellarne metà per eliminarlo
   tutto (oggi basta un click destro o X sul cerchio).
   1. Un **elemento** disegnato dentro il cerchio viene "inciso" nel cerchio, che prende il colore dell'elemento
      \[dev: disegnare il cerchio di ogni elemento\].
   2. Una **proiezione** disegnata dentro il cerchio aggiunge una carica: un cerchio concentrico più piccolo con le "rune"
      del tipo di proiezione \[dev: disegnare ogni proiezione\].
3. **Una proiezione a vuoto** (fuori da un cerchio con un elemento): si sprigiona "mana puro" (effetto azzurro trasparente),
   soggetto a tutte le resistenze.
4. Se il cerchio ha più cariche, con la **rotella** si sceglie quale lanciare: di default è l'ultima incisa, un mirino indica
   quella selezionata e dopo ogni lancio la selezione torna sull'ultima.
5. 🔜 Il cerchio magico è trascinabile (se ne può tenere uno sullo schermo per volta).
6. 🔜 Per testare il cerchio, doppio click su di esso: se ne vede il risultato e poi sparisce (in battaglia si applica subito).
7. Per **salvare** il cerchio (solo in laboratorio): **R** attiva la modalità salvataggio, poi col mouse sul cerchio
   si preme un numero da **1** a **9** e il cerchio (elemento e cariche, nell'ordine) finisce in quello slot dello
   spellbook. Un cerchio vuoto non si può salvare. Gli slot si vedono tenendo premuto **Tab**.
   Fuori dalla modalità salvataggio (e sempre in training e PvP), premendo il numero dello slot si evoca quel cerchio
   (elemento e cariche già incisi; sostituisce il cerchio in campo). **Ciò che arriva dallo spellbook non fa crescere
   affinità né contatori delle proiezioni**, nemmeno le magie permanenti finché restano attive; un elemento o una carica
   disegnati a mano su quel cerchio contano normalmente.
   Nel PvP l'overlay (Tab) mostra anche lo **spellbook dell'avversario**, ma solo gli slot che ha già evocato in quel
   duello: gli altri restano nascosti.

### Elementi

| Elemento | Simbolo | Effetto sull'avversario colpito ¹ | Stato |
|---|---|---|---|
| **Fuoco** | un triangolo rettangolo senza cateto verticale | brucia: 1 di danno ogni 1.5 s per 4.5 s | ✅ |
| **Acqua** | una goccia | rallentato del 20% per 5 s | ✅ |
| **Aria** | un giro di molla ("pigtail") | comandi invertiti (assi x e y) per 4 s | ✅ |
| **Terra** | tre lati di un quadrato, partendo dal lato sinistro dal basso verso l'alto | non può muoversi per 1 s, ogni 1 s, per 3 volte | ✅ |
| **Fulmine** | il simbolo del fulmine, dall'alto verso il basso | proiettile/laser: rimbalza su ogni superficie (anche sulla terra); trappola/spaziale: paralizza | ✅ |
| **Luce** | un "+": da sinistra a destra, poi si unisce l'estremo destro con quello superiore e si traccia verso il basso | vede sfocato per 2 s | 🔜 |
| **Oscurità** | delle corna stilizzate | accecato per 2 s | 🔜 |
| **Benessere** | il simbolo dell'infinito, partendo da sinistra | — (con la magia di Stato aumenta l'attacco) | 🔜 |
| **Ghiaccio** | un quadrato | scivola su qualsiasi superficie; si ferma quando l'angolo di impatto supera i 45° | 🔜 |
| **Metallo** | linea orizzontale, poi obliqua verso l'alto nella stessa direzione, poi verticale verso il basso | resta attratto verso il punto in cui è stato colpito (può comunque muoversi) | 🔜 |
| **Veleno** | il contorno di un teschio ² | avvelenato per sempre (0.1 di danno); si toglie solo con una magia d'acqua su se stessi (Stato, spaziale, ...) | 🔜 |

¹ Valori in `ELEMENT_EFFECTS_CONFIG` di `client/js/game/status-effects.js`. Ogni modifica va registrata anche in
`client/js/data/balance-history.js`, da cui la pagina delle patch notes mostra lo storico dei bilanciamenti.
² Per questo riconoscimento vanno ignorati inizio e fine del tratto (troppe combinazioni per gestirle a mano).

Il **cerchio magico** si evoca disegnando un semplice cerchio.

### Proiezioni

| Proiezione | Simbolo | Comportamento | Stato |
|---|---|---|---|
| **Proiettile** | una linea semplice | parte nella direzione dal punto iniziale a quello finale del disegno | ✅ |
| **Laser** | una linea, ritorno al punto di partenza e di nuovo la linea (una "z" appiattita) | **permanente**: resta attivo finché non si annulla | ✅ |
| **Spaziale** | una "N" (partendo da sinistra) chiusa unendo la fine con l'inizio | si disegna il perimetro dell'area, che si attiva subito; **permanente**, mana in base all'area | ✅ |
| **Trappola** | il simbolo di Watch Dogs, poi il perimetro dell'area | si attiva solo quando un player ci sale sopra; mana in base all'area | 🔜 |
| **Stato** | un triangolo con il lato sinistro verticale (come il puntatore del mouse) | si applica a sé: aumenta/diminuisce la difesa in base a forze e resistenze dell'elemento; con Benessere aumenta l'attacco. **Permanente** | 🔜 |
| **Muro** | come il proiettile, ma **solo con il disegno virtuale** | crea un muro lungo la linea disegnata; i proiettili ci rimbalzano (consuma poco mana). Se il proprietario disegna un elemento che lo attraversa (anche non in virtuale), il muro ne viene infuso | 🔜 |
| **Cinetica** | un cerchio sulla magia da spostare, poi il movimento da farle compiere; **solo con il disegno virtuale** | sposta le proprie magie in campo; più è veloce il tratto, più veloce è lo spostamento | 🔜 |

### Interazioni tra magie

Regole di design:

- **Acqua ↔ Fuoco**: dove passa l'acqua il fuoco si spegne.
- **Fuoco ↔ Aria**: l'aria diventa fuoco e passa a chi ha lanciato il fuoco.
- **Aria ↔ Acqua**: l'acqua si dissolve.
- **Fulmine ↔ Acqua**: l'acqua si elettrifica e danneggia entrambi i caster.
- **Aria** ignora il **Fulmine**.
- **Acqua ↔ Terra**: la magia diventa rigogliosa e aumenta la rigenerazione di mana di chi (tra i due caster) si trova al suo interno.
- **Fuoco ↔ Terra**: diventa magma e danneggia entrambi i caster; una proiezione di magma lascia una scia per 2.5 s.
- **Terra**: le proiezioni di terra ignorano le aree di fulmine, mentre le proiezioni di fulmine sono bloccate dalle aree di terra.
  A parte le interazioni sopra, l'area di terra blocca le proiezioni che la toccano.
- **Luce ↔ Oscurità**: si annullano a vicenda (easter egg: se due laser di luce e oscurità si scontrano, i caster restano
  a evocarli come in Dragon Ball finché il primo non finisce il mana, con un'animazione cinematica speciale).
- **Fulmine** potenzia il danno delle magie di luce.
- **Metallo** attrae a sé tutte le magie.
- **Ghiaccio** blocca come la terra.
  - colpito da **acqua**: l'acqua diventa ghiaccio (di chi ha lanciato il ghiaccio);
  - colpito da **aria**: esplode in piccoli frammenti in tutte le direzioni (di chi ha lanciato il ghiaccio);
  - colpito da **fuoco**: diventa acqua.
- **Acqua ↔ Veleno**: il veleno si dissolve.

\* N.B. per "priorità" si intende immunità da quella magia.

**Stato implementazione** (regole in `client/js/game/spell-interactions.js`, solo con gli elementi attuali; valgono per proiettili, laser e aree spaziali):

- acqua spegne fuoco; fuoco incendia aria (l'area passa a chi ha lanciato il fuoco); aria dissolve acqua
- acqua + terra = rigoglio (12 s, rigenerazione mana ×3 per chi sta dentro l'area o a contatto con il laser; finché è rigogliosa la magia non consuma mana a chi la possiede)
- fuoco + terra = magma (5 s, danno a entrambi in base alla media degli ATK di chi ha lanciato fuoco e terra; i proiettili lasciano una scia di 2.5 s)
- fulmine + acqua = elettrificata (4 s, danno a entrambi in base alla media degli ATK; un proiettile elettrificato folgora chi gli passa vicino)
- l'aria ignora il fulmine; le proiezioni di terra attraversano le aree di fulmine; l'area di terra blocca i proiettili che non reagiscono con lei
- proiettili (max 4 rimbalzi) e laser (1 rimbalzo) di fulmine rimbalzano sui bordi dell'arena e sulle aree di terra
- le aree di fulmine paralizzano (1.5 s, poi 1.5 s di immunità): il corpo resta fermo, il cursore si muove e si può disegnare
  (da collegare al disegno virtuale)
- laser: magia permanente (0.15 mana ogni 0.1 s), parte da un punto fisso fino al bordo dell'arena e si ferma sulle aree di terra
  con cui non reagisce. Interagisce con proiettili (attraversandoli), aree e altri laser con le stesse regole delle aree
  (un laser d'aria incendiato passa a chi ha lanciato il fuoco). Danno a chi tocca il raggio ogni 0.5 s
- extra: due proiettili avversari che si incrociano interagiscono tra loro; l'acqua raffredda il magma
- non ancora: Luce, Oscurità, Trappola (e quindi "fulmine potenzia la luce" e lo scontro tra laser di luce e oscurità)

### Mana

**Il mana che si possiede è limitato anche in laboratorio.**

Il mana si vede come un perimetro colorato sul bordo dello schermo: è simmetrico, come una barra di caricamento il cui massimo
è il centro del lato superiore e il minimo il centro del lato inferiore.

Consumo (valori nel codice, `engine.js`):

| Cosa | Costo |
|---|---|
| Elemento evocato a vuoto | 1 mana |
| Cerchio magico, elemento inciso nel cerchio, cariche | 0 mana |
| Proiettile (a vuoto o dal cerchio, con o senza elemento) | 2 mana |
| Laser (a vuoto o dal cerchio) | 0.15 mana all'accensione, poi 0.15 ogni 0.1 s (1.5 mana/s) finché resta attivo |
| Area spaziale | consumo continuo finché resta attiva, proporzionale alla superficie: 0.6 mana/s ogni 10.000 px² (minimo 0.6 mana/s) |
| Magia rigogliosa (acqua + terra) | nessun consumo finché dura l'effetto |

Tutti i costi sono ridotti dalla statistica **Riduzione consumo mana**. La rigenerazione di base è 0.3 mana/s (×3 con una magia
rigogliosa in campo).

Se si supera il mana rimasto si va in **burnout** (overload): le magie attive si annullano e non si può castare per 5 secondi;
alla fine si riparte dal 20% del mana massimo.

### Progressione

Formule in `client/js/game/player-stats.js`.

- L'esperienza si guadagna usando la magia, **solo nelle partite PvP online** (non in laboratorio né in training).
- Ogni livello oltre il primo dà **1 punto abilità**; il livello di per sé non aumenta più mana né rigenerazione.
- I punti si spendono nella pagina Info Giocatore (pannello "Statistiche") su HP, ATK base, MP e riduzione del consumo di mana.
  Su Firestore si salva `puntiAbilita` (punti spesi per statistica); i punti non spesi = (livello − 1) − somma.
- L'affinità con un elemento dà passivamente difesa da quell'elemento (fino al 30%) e un margine di errore maggiore
  nel disegnarne la runa (dal 40% fino al 50%).
- Allo stesso modo il cerchio e le proiezioni (proiettile, spaziale, laser) diventano più facili da riconoscere
  quante più volte vengono disegnati (dal 40% fino al 50%; contatore `segniDisegnati` su Firestore).
- Bonus danno elementale, tasso CRIT e DMG CRIT sono mostrati ma per ora restano a 0.
- In futuro: matchmaking bilanciato in base al livello.

### Linker

Artefatti (come quelli di Genshin) che si equipaggiano nel **cerchio personale** del giocatore, visibile nella pagina
Info Giocatore (linguetta **Linker** a sinistra). Tutti i numeri sono in `client/js/game/linker-data.js`.

**Valute**: ◈ **BitRune** (60 per ogni vittoria PvP, si spendono nello shop) e ⬢ **Catalizzante** (si ottiene catalizzando
i Linker, serve per farli salire di livello).

**Shop** (`shop.html`, dalla Home): un pacchetto per ogni set (100 ◈ a pull, solo Linker di quel set) e un pacchetto
standard (80 ◈, set qualsiasi); pull ×1 o ×10. Probabilità: Comune 45%, Non comune 30%, Raro 16%, Epico 7%,
Leggendario 2%; garanzia (condivisa tra i pacchetti): almeno un Epico ogni 10 pull, un Leggendario entro 60.

**Statistiche di un Linker**:

| Slot | Main stat possibili |
|---|---|
| Core | HP |
| Matrix | ATK |
| Relay | Mana%, Rigenerazione mana%, Mana |
| Conduit | Bonus DMG di un elemento |
| Apex | Tasso CRIT, DMG CRIT, ATK%, HP%, Bonus DMG di un elemento |

- Sub stat: tante quante le stelle, al massimo 4 (Comune 1 · Non comune 2 · Raro 3 · Epico e Leggendario 4), scelte tra
  HP, HP%, ATK, ATK%, Mana, Mana%, Rigenerazione mana%, Tasso CRIT, DMG CRIT; mai ripetute e mai uguali alla main stat.
- I valori sono fissi e non dipendono dalla rarità, tranne la main stat dei Leggendari (×1.15).
- **Livelli** (fino a +32): ogni livello aumenta la main stat; ogni 4 livelli una sub stat a caso riceve un potenziamento
  (il numero di potenziamenti è mostrato accanto alle sub stat migliorate). Il livello sale spendendo Catalizzante
  (pulsante ⬆, schermata con la barra dell'esperienza); il cestino 🗑 catalizza il Linker (resa in base alla rarità più
  l'80% del Catalizzante investito).
- **Set** (bonus a 2 e 4 pezzi equipaggiati): Firewall Arcano (HP +15% · DEF elementi +10%), Overclock Runico
  (ATK +12% · Tasso CRIT +10%), Bus di Mana (Rigenerazione mana +20% · Consumo di mana -10%), Kernel Elementale
  (Bonus DMG elementi +10% · DMG CRIT +25%).
- Effetti in gioco: valore base × (1 + %) + valore fisso. **Critico**: tasso base 0% (solo dai Linker), DMG CRIT base 50%;
  i proiettili tirano il critico a ogni colpo, laser e aree usano il valore medio.

- **5 slot**, uno per tipo di Linker: **Core**, **Matrix**, **Relay**, **Conduit**, **Apex**. Stanno dove i cerchi di gioco
  hanno le cariche, collegati da un pentagono; ogni slot è il cerchio magico del suo Linker (grafica in
  `client/public/img/<Nome>.svg`), nel colore del set del Linker equipaggiato, con la parte superiore rivolta verso
  l'esterno. Uno slot vuoto non ha cerchio: resta solo il vertice del pentagono (sotto il mouse un anello tratteggiato).
- Lo slot selezionato ha lo stesso indicatore della carica selezionata in gioco (mirino e/o particelle, secondo
  l'impostazione "indicatore della carica"; con "nessuno" resta il mirino), non più un bagliore.
- **Selezione e inventario** (come gli artefatti di Genshin Impact): cliccando uno slot sul cerchio o nella lista, la lista
  si restringe, le voci scendono a "trenino" e si mettono in fila sotto il cerchio (che si sposta a sinistra e fa uno
  zoom sullo slot con animejs, con il bordo che sfuma) e a destra compare l'inventario di quello slot: griglia dei Linker posseduti (ordinabile per rarità o livello) e dettaglio di quello
  scelto (statistiche, Equipaggia/Sostituisci/Rimuovi). Le voci sotto il cerchio fanno da schede per cambiare slot;
  ✕ o Esc chiudono con l'animazione al contrario. Quando il contenuto cambia (slot, Linker scelto, potenziamento) i testi
  nuovi si scrivono con lo `scrambleText` di animejs (rune a caso che si fermano sulle lettere giuste).
- L'intera sezione si adatta alla finestra: il cerchio prende l'altezza disponibile e l'inventario scorre al suo interno.
- Il cerchio ruota come tutti i cerchi magici e ha un **colore scelto dal giocatore** (salvato sul profilo).
- Al centro c'è il **nome del giocatore in rune** su un anello racchiuso tra due cerchi (fascia alta il doppio del font).
  Il giocatore sceglie l'alfabeto: **Elder Futhark**, **Younger Futhark**, **Short-twig Futhark**, **Staveless (Hälsinge)
  Futhark**, **Medieval Runerow**, **Anglo-Saxon Futhorc**. Le rune sono distribuite uniformemente su tutto l'anello (anche
  tra l'ultima e la prima c'è la stessa distanza), con almeno due altezze del font tra l'una e l'altra: il raggio cresce con
  la lunghezza del nome (oltre un certo limite il font si rimpicciolisce per restare dentro il cerchio). La croce runica ᛭
  in alto segna l'inizio del nome. Le cifre si scrivono in lettere (es. "9" → "nove"), i simboli diventano il separatore.

### Missioni

Pagina **Missioni** (`quests.html`, dalla Home: il pulsante mostra quante ricompense si possono riscattare).
Ricompense in BitRune, da riscattare a mano. Elenco e numeri in `client/js/game/quests-data.js`.

- **Giornaliere**: 3 al giorno (rinnovo a mezzanotte, ora locale), 15-40 ◈ ciascuna, +30 ◈ riscattandole tutte.
- **Settimanali**: 5 a settimana (rinnovo il lunedì), più lunghe, 120-300 ◈ ciascuna, +150 ◈ riscattandole tutte.
- Scelte in automatico e senza server: ogni giocatore ha un suo ordine delle missioni (mescolato in base al nome) che si
  percorre a rotazione, quindi una missione torna solo dopo tutte le altre (≥ 9 giorni / ≥ 4 settimane).
- Cosa conta: partite, vittorie e colpi a segno solo in PvP; lanci, cerchi, incisioni, spellbook, interazioni tra
  magie e mana speso in PvP e nel Training (non in Laboratorio); pull, livelli e catalisi dei Linker ovunque.
- Su Firestore: `missioni: { giornaliere|settimanali: { <numero del periodo>: { progressi: { id: n }, riscattate: [id],
  bonus } } }`: un periodo nuovo parte vuoto da solo. Gli eventi si accumulano e si salvano ogni 5 s, a fine partita e
  quando la pagina si nasconde (`client/js/services/quest-tracker.js`) con **incrementi atomici**, non transazioni:
  durante il combattimento il profilo viene aggiornato ogni secondo e una transazione verrebbe rifiutata. Il riscatto
  è una transazione (si fa fuori dal combattimento) e cancella i periodi passati.

### Roadmap

- **Alpha** (test per vedere se funziona):
  - Elementi: Acqua, Fuoco, Aria, Terra
  - Proiezioni: Proiettile
  - No magie permanenti (e sistema di annullamento)
  - No Arena
  - No interazione delle magie
  - UI di visualizzazione mana
  - Livello ed esperienza
- **1.0**:
  - Magie permanenti (e sistema di annullamento)
  - Proiezioni: Spaziale
- **1.1**:
  - Arena
  - Sistema di interazione delle magie in campo
- **1.1.2**:
  - Sistema di salvataggio delle magie
- **1.2**:
  - Nuovi elementi: Fulmine, Luce, Oscurità
  - Nuove proiezioni: Trappola, Laser
- **1.2.5**:
  - Disegno virtuale: premendo X invece di Z il player non si muove mentre si disegna
- **1.3**:
  - Nuovi elementi: Benessere e Veleno
  - Nuova proiezione: Stato (e sistema di resistenze)
- …
- **2.0**:
  - Open World
