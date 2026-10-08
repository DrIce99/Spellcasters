# Spellcasters — Open World Developer Bible

> **Documento riservato al DEV.** Non è lore da mostrare al giocatore: contiene le corrispondenze tra la storia reale dello sviluppo e la storia del mondo, le verità nascoste e le soluzioni dei misteri (quando esistono). La lore narrativa è in [LORE.md](LORE.md).

*Stato del documento: prima stesura, aggiornata al 2026-10-08 (Revisione XIII in corso, 104 commit nella history git).*

---

## Legenda dei tag

| Tag | Significato |
|---|---|
| `[CANONE]` | Stabilito in `LORE.md`. Non si modifica. |
| `[CANONE APERTO]` | Stabilito in `LORE.md`, ma volutamente ambiguo. Non va risolto. |
| `[APOCRIFO]` | Libro IX di `LORE.md`: si racconta, non è legge. Non diventa vero automaticamente. |
| `[PROPOSTA]` | Idea nuova di questo documento, coerente con il canone ma non ancora approvata. |
| `[IPOTESI]` | Possibile interpretazione di un mistero. Non va mai trattata come verità. |
| `[NON CANONICO]` | Materiale di lavoro, esempio o variante scartabile. |
| `[DA DECIDERE]` | Scelta aperta che il DEV deve prendere prima di implementare. |
| `[DA SVILUPPARE]` | Seme da far crescere in futuro. |
| `[DA BILANCIARE]` | Numero indicativo, da tarare in fase di bilanciamento. |
| `[RICHIEDE MECCANICA]` | Serve codice nuovo (oggi il sistema non lo supporta). |
| `[DEV]` | Informazione che il giocatore non deve **mai** ricevere in forma esplicita. |

**Convenzione generale.** In ogni scheda, ciò che compare nel campo *Canone* è `[CANONE]`; tutto il resto della scheda è `[PROPOSTA]`, salvo tag diverso.

## Sistema degli identificativi

Ogni elemento ha un ID stabile, da usare nei riferimenti incrociati, nei ticket e nel codice futuro.

| Prefisso | Tipo | Esempio |
|---|---|---|
| `REV-` | Revisione / Silenzio / Risveglio | `REV-IX`, `SIL-LUNGO` |
| `P-` | Personaggio storico | `P-11` Halvard Rúnstedt |
| `A-` | Personaggio attuale (Open World) | `A-02` Tilde Varro |
| `F-` | Fazione | `F-01` Custodi della Soglia |
| `L-` | Luogo | `L-12` Kesh |
| `N-` / `EL-` / `MB-` / `B-` / `BM-` | Nemico / Elite / Miniboss / Boss / Boss maggiore | `BM-01` Il Doppio |
| `R-` | Reliquia / oggetto | `R-19` Pietra del Forse |
| `Q-` | Quest / storyline | `Q-03` Sessione Doppia |
| `I-` | Catena di indizi | `I-03` |
| `M-` | Mistero | `M-04` DrIce |
| `S-` | Set di Linker dell'Open World | `S-01` Eco di Sessione |
| `SEME-` | Seme per il futuro | `SEME-07` |

---

## 1. Scopo del documento

Questo documento è la **bibbia di progettazione narrativa e ludica dell'Open World** (roadmap: versione 2.0). Serve a tre cose:

1. **Non perdere il filo.** Ogni contenuto dell'Open World deve poter essere ricondotto, con una catena verificabile, a qualcosa che è successo davvero durante lo sviluppo:

   > **sviluppo reale → evento nella lore → elemento del mondo → contenuto giocabile → indizi → scoperta del giocatore**

2. **Far ricostruire la lore al giocatore.** Il giocatore non riceve la storia: la ricompone da frammenti, fonti in disaccordo, ambienti, comportamenti dei nemici e oggetti. Questo documento dice, per ogni verità, *dove sono i pezzi* e *chi mente*.

3. **Crescere con il progetto.** Ogni nuova versione del gioco produce nuove Revisioni, nuovi difetti antichi e nuove Ricalibrazioni. La sezione 19 descrive la procedura di aggiornamento.

Il principio che regge tutto:

> **Un bug realmente esistito durante lo sviluppo di Spellcasters può diventare un'entità realmente esistita nel mondo di Spellcasters.**

---

## 2. Stato canonico della lore

### Fonti, in ordine di autorità

| Fonte | Cosa stabilisce | Autorità |
|---|---|---|
| `LORE.md` | La lore narrativa: nomi, eventi, leggi, misteri. | **Canone narrativo.** In caso di conflitto con questo documento, vince `LORE.md`. |
| History git (`git log`) | Cosa è successo davvero, quando, in quale ordine. | **Verità storica dello sviluppo.** |
| `client/js/data/changelog.js` | Le versioni (→ Revisioni) e i loro contenuti. | Verità storica ufficiale (ricostruita dalla history git). |
| `client/js/data/balance-history.js` | I bilanciamenti (→ Ricalibrazioni). | Verità storica ufficiale. |
| Commenti nel codice | Difetti emersi in sviluppo e mai finiti nel changelog (es. i rimbalzi infiniti del laser di folgore). | Fonte secondaria. |
| `README.md` | Intenzioni di design, roadmap, elementi futuri. | Fonte di **intenzione**, non di storia. |

**Discordanze note tra le fonti** (da non "correggere" nella lore, vedi sezione 19):
- La roadmap del README usa numeri di versione (1.0, 1.1, 1.2…) diversi da quelli realmente usati (0.1 → 0.12). Per la lore valgono **solo** quelli del changelog.
- I `node_modules` sono stati rimossi due volte: il 2025-06-13 (`05d4f7d`) e il 2026-09-30 (`192ccb2`, "Commit digestion"). Il changelog cita solo la seconda. La lore canonica colloca il rogo dei Cumuli nella Revisione VIII; la prima purga è materiale per l'Open World (vedi `MB-02`).

### Stato del canone al 2026-10-08

- **Revisioni concluse:** I–XII (versioni 0.1.0 → 0.12.0).
- **Revisione in corso:** XIII (Linker, Fonderie, Emporio, BitRune, Catalizzante, Grimorio, Bacheca degli Incarichi).
- **Elementi canonici:** Fuoco, Acqua, Aria, Terra, Fulmine. **Proiezioni canoniche:** Proiettile, Spaziale, Laser.
- **Apocrifi** (Libro IX): Luce, Oscurità, Benessere, Veleno, Metallo, Ghiaccio; Trappola, Stato, Muro, Cinetica; Scissione; Terre Oltre il Campo; Tracciatori Nudi; l'Autore e l'Archivista.

### Scala temporale della lore `[CANONE]` + nota `[DEV]`

`LORE.md` usa per le Revisioni intervalli che **coincidono con il tempo reale**: "Quindici Giorni" (I–V), "due settimane dopo" (VI), "quattro mesi più tardi" (VII), "quasi un anno" (Lungo Silenzio), "in sette giorni" (VIII–XII). Questa coincidenza è un patrimonio: va mantenuta.

La Revisione XIII, invece, è ancora aperta: nel mondo è durata **anni** ("Nei primi anni dell'Era del Collegamento… le Sommosse del Grigio"). Non è una contraddizione: una Revisione non conclusa non ha una durata reale definita. **Regola:** la durata in-world di una Revisione aperta è libera; quella di una Revisione chiusa segue il tempo reale.

---

## 3. Regole narrative

**R1 — Catena tracciabile.** Nessun contenuto dell'Open World esiste senza una catena: fonte reale → evento lore → contenuto → indizi. Se un contenuto non ha una fonte reale, deve dichiararlo (`Fonte reale: nessuna — derivato da [elemento di lore]`).

**R2 — Principio della Persistenza** `[PROPOSTA — fondativa]`. *Una Revisione corregge le leggi, non cancella ciò che è già stato.* È l'estensione diretta del canone "Niente si cancella davvero" (`LORE.md`, Libro I). Quando i Custodi correggono un difetto, il Lettore smette di produrlo; ma ciò che il difetto aveva già generato non scompare: sprofonda nel Substrato o si rifugia nelle regioni dove il Lettore legge peggio, lontano dai Campi regolati. **È per questo che nell'Open World esistono i difetti antichi come creature.** Più un difetto è stato grave, più a lungo è sopravvissuto e più forte è ciò che ne resta.

**R3 — Proporzionalità.** Il rango di un'entità (Nemico → Boss maggiore) dipende dall'**importanza reale** del bug, calcolata con la rubrica della sezione 8, non dalla spettacolarità. Uno scostamento è ammesso solo con una *deroga motivata e scritta*.

**R4 — Mai esposizione diretta.** Nessun NPC conosce una verità importante per intero. Ogni verità importante richiede **almeno tre indizi indipendenti**, da **almeno due tipi di fonte** diversi (es. un'iscrizione e il comportamento di un nemico) e, se possibile, da **due fazioni** in disaccordo.

**R5 — Ogni fonte ha un punto di vista.** Ogni testo, NPC o iscrizione appartiene a una fazione, a un'epoca o a una persona, e porta con sé i loro errori. La sezione 6 elenca cosa ogni NPC crede *erroneamente*.

**R6 — Misteri protetti.** Alcuni misteri non vanno risolti, né nel gioco né in questo documento (sezione 13): la natura del Lettore, l'Autore, l'identità di DrIce, il Quadrato e il Ghiaccio, la morale della Catalisi, la causa del Lungo Silenzio, il sesto elemento di Aurel Maskh, ciò che c'è davvero oltre il Campo.

**R7 — Il giocatore intuisce, non legge il codice.** La corrispondenza bug → entità resta un sottotesto. Livelli di ammiccamento consentiti:

| Livello | Esempio | Uso |
|---|---|---|
| 0 — Nessuno | Il nemico funziona e basta. | Default per i Nemici comuni. |
| 1 — Visivo | Il Doppio ha due contorni che non coincidono. | Default per Elite e superiori. |
| 2 — Testuale sottile | Un'iscrizione: "Sigillato? Non ne sono certo." | Indizi importanti. |
| 3 — Easter egg esplicito | Nomi di moduli reali leggibili nei Frammenti dei Cumuli. | Solo in contenuti **opzionali e nascosti**. |

**R8 — Lessico.** Nei testi per il giocatore si usano solo termini della lore. I termini tecnici sono ammessi solo se già canonici (Linker, Core, Matrix, Relay, Conduit, Apex, Firewall, Overclock, Bus, Kernel, BitRune) o se seguono la regola dei nomi delle Fonderie (parola delle macchine + parola della magia).

**R9 — Stratificazione.** Ogni regione mostra tracce di Revisioni diverse (sezione 10). Il "dove" e il "quando" di un oggetto si leggono dallo strato in cui si trova.

**R10 — Regola della Doppia Natura** `[PROPOSTA]` (per i set di Linker dell'Open World). Il bonus a 2 pezzi è **il difetto addomesticato** (il bug trasformato in potere); il bonus a 4 pezzi è **la correzione** (la Revisione trasformata in padronanza). Chi completa il set "rivive" sia il problema sia la sua soluzione.

---

## 4. Cronologia delle Revisioni

Ogni riga collega una Revisione al suo periodo reale, ai commit chiave e alle tracce che ha lasciato nell'Open World. Gli strati archeologici sono descritti nella sezione 10.

| Strato | Revisione | Versione | Date reali | Commit chiave | Cosa è successo davvero | Evento lore `[CANONE]` | Tracce nell'Open World |
|---|---|---|---|---|---|---|---|
| Selvatico | — | pre-0.1 | 2025-06-04 | `4403717`, `3ddcc2c` | Primo commit; elementi e cerchio prima del primo rilascio. | Il Tempo Selvatico, Sefa, le Quattro Mani | Rovine dai Segni incoerenti; reliquie dei Primi Tracciatori |
| Fondazione | I | 0.1.0 | 2025-06-05 | `b65409a`, `1e926d1`, `aa9034b`, `1420d0f` | Cancellazione del cerchio aggiunta e poi corretta; mana; giorno/notte. | La Prima Magia; per la prima volta un cerchio si scioglie a comando | `N-01` Cerchi Indelebili |
| Fondazione | II | 0.2.0 | 2025-06-06/07 | `b7eb6bf`, `f8e4486`, `825a41c`, `df884eb`, `dca83fb` | Proiettile; "Add non-functional multiple projectiles"; burnout; esperienza; radar in Info. | La Linea e la Misura | `N-02` Cariche Mute; origine della Spirale (`B-02`) |
| Fondazione | III | 0.3.0 | 2025-06-11 | `4a7bac3`, `accfb7c` | Spaziale. | La Clessidra | Origine delle Mani Trattenute (`N-05`) |
| Fondazione | IV | 0.4.0 | 2025-06-13/19 | `6b32547`, `05d4f7d`, `13a67be`, `7d9e206` | Firestore; prima arena (non funzionante); prima rimozione dei `node_modules`; deploy con Vite e caos dei percorsi. | La Rete; l'Archivio Ardente; l'Arena Muta | `BM-03` Il Viandante; `B-01` L'Atteso; `R-17` Tavoletta Vuota; prima purga del Cumulo (`MB-02`) |
| Fondazione | V | 0.5.0 | 2025-06-20 | `0159c48`, `ed3cd0a`, `df14616` | Manichino; mouse virtuale; collisioni con scintille. | Il Manichino e la Sostituzione | `N-08` Manichini Selvatici; mistero del Quadrato |
| Duelli | VI | 0.6.0 | 2025-06-24 → 07-03 | `4f2c0ff`, `1ccf833`, `7c9b4e5`, `9f281e0`, `8990aa1` | PvP; password con hashing; wss; effetti di stato; profilo completato al login. | Il Duello; Arbitro; Sigillo dei Nomi; Afflizioni | `EL-07` Gli Incompiuti; origine di `B-04`, `BM-02`, `EL-04` |
| — | *(la Quiete)* `[PROPOSTA nome]` | — | 2025-07-03 → 11-11 | nessuno | Quattro mesi senza commit. | "Quattro mesi più tardi" | Nessuna traccia propria |
| Duelli | VII | 0.7.0 | 2025-11-11/13 | `61851c2`, `ca9c54e`, `32a89a7`, `97b4c56`, `28622f6`, `c753079`, `ed57d63` | Suoni; classifica; aree avversarie invisibili corrette; canvas spostato; uscita con cerchio attivo ("not fully fixed"); primo tentativo sul matchmaking ("Not sure"); URL di produzione rimasto su localhost. | La Voce della Tela; fine dei duelli al buio; Classifica | `B-04` Perimetro Cieco; `N-06` Scivolati; `MB-03` Orfano del Vincolo; `MB-01` Ospite di Casa; `R-19` Pietra del Forse |
| Silenzio | — | — | 2025-11-13 → 2026-09-30 | nessuno | Dieci mesi e mezzo senza commit. | Il Lungo Silenzio; la Guerra dei Campi Ciechi; i Doppi | `L-19` Zone del Silenzio; `BM-02` Il Vasto; `BM-01` Il Doppio |
| Risveglio | VIII | 0.8.0 | 2026-09-30 | `192ccb2`, `3f118bd` | "Commit digestion": rimossi 12.276 file, 1.555.906 righe; riorganizzazione client/server; fix multipli. | La Grande Pulizia; i Cumuli bruciati; Scarica Totale; Infusioni Fantasma | `MB-02` Il Cumulo; `EL-01`; `N-03`; `N-05`; `B-05` Incisione Contesa |
| Risveglio | IX | 0.9.0 | 2026-10-01 | `9de6345`, `6925df5` | Interazioni; arena quadrata ("Fix arena area (sadly)"); heartbeat e sessioni doppie. | Il Doppio e le Reazioni; il Quadrato della Convenzione | Fine di `BM-01`; prima fase di `BM-02`; `R-26` Pietre della Convenzione |
| Risveglio | X | 0.10.0 | 2026-10-01 | `302ac09`, `ffe53e1`, `a97ae70` | Nuovo sistema di statistiche; gesti semplificati; "UI rework"; "Dmg fix for magma". | La Riforma dei Livelli | Fine di `B-02` La Spirale; `EL-02` Colata Cieca; nascita del Volto Abbandonato |
| Risveglio | XI | 0.11.0 | 2026-10-03 | `16b5789`, `5ca83c0` | Fulmine e laser; correzione dei 144 Hz; riconoscimento dei simboli migliorato; copia fantasma dell'area ceduta; rimozione dei 7 fogli di stile "rework". | La Folgore e la Cavità; il Tempo Comune; la Rosa degli Otto Venti; il Volto Abbandonato | `B-03` Lo Sfasato; `EL-06` Rifiutati; `MB-04` Vento Inestinguibile; `EL-03` Riflesso Infinito; `L-18` |
| Risveglio | XII | 0.12.0 | 2026-10-06 | `be52a79`, `5d91b2f`, `98832ea`, `88abb2f` | Animazioni; rotella; patch notes con bilanciamenti; arena rettangolare; fix di fuoco, rigoglio e tema notte. | La Grazia; la Prima Ricalibrazione; il Campo d'Intersezione | Fine di `BM-02`; `EL-04` Tizzone; `EL-05` Fioritura Amara; `N-04` Lampo Bianco |
| Collegamento | XIII (in corso) | — | 2026-10-07 → | `04697a4`, `3344e70`, `e789da5`, `1ca2d90`, `5e6163e`, `6f62337` | Spellbook; pannello Linker; shop gacha; livello 32; statistiche divise; missioni. | L'Era del Collegamento | Le Fonderie; l'Emporio; i set dell'Open World (sezione 14) |
| — | ? | 2.0 | futuro | — | Open World. | `[DA DECIDERE]` (vedi `SEME-01`) | — |

`[DEV]` Una curiosità da custodire: il **Tempo Selvatico**, che nella lore dura secoli, corrisponde nella realtà a **un solo giorno** (il 2025-06-04, primo commit). Non va mai rivelato.

---

## 5. Mappa del mondo

### Principi di geografia `[PROPOSTA]`

1. **Il Centro è ciò che il giocatore conosce già.** Atrio, Laboratorio, Campo d'Addestramento, Arena, Emporio e Bacheca sono i luoghi del gioco attuale. Nell'Open World diventano il **Centro**: il punto di partenza, con l'Archivio Ardente sotto i piedi.
2. **Ogni elemento ha una terra.** Fuoco a Kesh, acqua nelle Piane di Sal (dove manca), aria e folgore sull'Orlo, terra nelle Brughiere di Holm. È coerente con le origini canoniche dei Segni.
3. **Le Reazioni avvengono ai confini.** Dove due terre elementali si toccano, la Tela reagisce come reagiscono le magie: magma tra Kesh e Holm (la Cava di Nerea Solt), rigoglio tra Holm e le Piane, tempeste elettrificate tra l'Orlo e le pozze delle Piane. La mappa *è* la tabella delle Reazioni.
4. **I difetti abitano gli interstizi.** I luoghi nati dai bug (Vie Sbagliate, Faglia, Volto Abbandonato, Campi Ciechi, Recinto Oscuro) non stanno *dentro* le terre elementali, ma *tra* di esse e attorno al Centro: sono gli scarti delle Revisioni.
5. **Oltre ogni bordo, le Terre Oltre il Campo.** L'Orlo è "dove la Tela sembra finire" `[CANONE]`: è l'accesso più naturale all'Oltre.

### Schema `[PROPOSTA]`

```
                        BRUGHIERE DI HOLM (terra)
                       /        |          \
            Oasi del Rigoglio   |      CAVA DI NEREA SOLT (magma)
                     /          |              \
  L'ORLO ---- [Vie Sbagliate] - CENTRO - [Vie Sbagliate] ---- KESH (fuoco)
 (aria/folgore)                 |  Atrio, Lab, Training, Arena,
     |                          |  Emporio, Bacheca
     |   Tempeste elettrificate |  ↓ Archivio Ardente (sotto)
     |          \               |  ↺ Arena Muta, Campi Ciechi,
     |           PIANE DI SAL (acqua scarsa, pozze di mana)   Recinto Oscuro,
     |                                                        Volto Abbandonato
TERRE OLTRE IL CAMPO (oltre ogni bordo; accesso principale dall'Orlo)

  La Faglia: una striscia di terra spostata rispetto al resto, tra il Centro e l'Orlo.
  Zone del Silenzio: sacche sparse in tutte le regioni.
```

### Indice dei luoghi

| Categoria | Luoghi |
|---|---|
| **Regioni** | `L-11` Piane di Sal · `L-12` Kesh · `L-13` Brughiere di Holm · `L-15` L'Orlo · `L-20` Terre Oltre il Campo · il Centro |
| **Biomi** | deserto salino con pozze di mana (Piane) · città di pietra rossa e cenere (Kesh) · brughiera di dolmen (Holm) · scogliere ventose (Orlo) · cava di magma (`L-14`) · oasi del Rigoglio · terre aperte e incompiute (Oltre) |
| **Città** | Kesh · il villaggio dei vasai delle Piane `[PROPOSTA]` · il Centro (Atrio e dintorni) |
| **Dungeon** | `L-05` Arena Muta e Coda Vecchia · `L-07` Recinto Oscuro · `L-10` Archivio Ardente · `L-14` Cava di Nerea Solt · `L-16` Vie Sbagliate · Osservatorio delle Frequenze (Orlo) · Torre della Misura (Kesh) |
| **Landmark** | Torre di Ilyen · Rovine del Secondo Rogo · Il Nocciolo (Holm) · Sala degli Specchi · Rosa degli Otto Venti · `L-17` La Faglia · `L-18` Quartiere del Volto Abbandonato · `L-06` Campi Ciechi · Primo Laboratorio · `L-19` Zone del Silenzio |

### Schede dei luoghi

#### L-01 — Atrio delle Nebbie
- **Tipo:** area speciale (hub).
- **Canone:** il luogo da cui ogni caster parte; foschia; fasci di luce che si muovono "come se qualcuno, molto in alto, spostasse delle lanterne"; da qui si raggiungono tutti i luoghi, il Ritratto e le Cronache.
- **Origine:** la Home del gioco (`home.html`, `fog-background.js`).
- **Aspetto:** una sala aperta, senza pareti visibili, dove la nebbia non si dirada mai del tutto. I fasci di luce scendono dall'alto e si spostano lenti.
- **Atmosfera:** sospesa, quieta. È l'unico luogo in cui non si sente mai il Rossore.
- **Elementi ambientali:** i fasci di luce si muovono secondo uno schema che si ripete (vedi Segreti); la Bacheca; le porte dei Varchi.
- **Abitanti:** caster di passaggio, copisti dei Custodi.
- **Fazioni:** Custodi (`F-01`), che vi tengono una copia pubblica delle Cronache.
- **Eventi storici:** nessuno noto. È il luogo più antico del Centro, e nessuno sa quando sia stato costruito.
- **NPC:** `A-01` Elvar Sund.
- **Nemici / Boss:** nessuno. È una zona sicura.
- **Reliquie:** `R-16` Frammenti delle Cronache (copie pubbliche).
- **Segreti:** `[CANONE APERTO]` chi sposta le lanterne. Il moto dei fasci non va spiegato (vedi `M-01`). Può però cambiare dopo ogni Revisione reale del gioco (vedi sezione 10, "Ricalibrazioni vive").
- **Cosa scopre il giocatore:** che le Cronache pubbliche hanno lacune (il Lungo Silenzio è una pagina vuota); che sono tutte firmate DrIce.
- **Collegamenti:** tutti i luoghi del Centro; `L-10` (l'accesso all'Archivio è sotto l'Atrio); `L-18`.

#### L-02 — Laboratorio (e Primo Laboratorio)
- **Tipo:** struttura (zona muta) + rovina (il Primo Laboratorio).
- **Canone:** l'unico luogo in cui si scrive nel Grimorio; zona muta (niente Esperienza, niente incarichi di combattimento); la Cornice è vera anche lì. L'iscrizione del primo Laboratorio: «Ogni cerchio che hai tracciato è ancora lì…».
- **Origine:** `lab.html`; modalità salvataggio dello spellbook.
- **Aspetto:** il Laboratorio attuale è un ambiente pulito, con un banco dove i Cursori si invertono. Il **Primo Laboratorio** `[PROPOSTA]` è una rovina della Fondazione, con l'architrave che porta l'iscrizione canonica.
- **Atmosfera:** silenzio da biblioteca; nel Primo Laboratorio, malinconia.
- **Elementi ambientali:** nel Primo Laboratorio, cerchi fucsia antichi incisi nel pavimento che non si possono cancellare (`N-01`).
- **Abitanti:** ricercatori; nessun combattente.
- **Fazioni:** Custodi, Connettori.
- **Eventi storici:** Rev I–III (il cerchio, la Linea, la Clessidra furono "fissati" qui, secondo i Custodi).
- **NPC:** nessuno fisso; nel Primo Laboratorio, la statua del Custode anonimo (`P-17`).
- **Nemici:** `N-01` Cerchi Indelebili (solo nel Primo Laboratorio).
- **Boss:** nessuno.
- **Reliquie:** `R-01` Coccio di Sefa (copia di studio); `R-30` Prima Pagina del Libro delle Ricalibrazioni.
- **Segreti:** l'iscrizione dell'architrave è firmata con una sola lettera consumata. `[DA DECIDERE]` quale (non deve risolvere `M-04`).
- **Cosa scopre il giocatore:** che nel Tempo Selvatico un cerchio sbagliato non si poteva sciogliere (i Cerchi Indelebili lo dimostrano).
- **Collegamenti:** `L-11` (Sefa), `L-10`, `M-01`.

#### L-03 — Campo d'Addestramento
- **Tipo:** struttura.
- **Canone:** il regno del Manichino; la Bacheca conta le azioni, l'Archivio non registra Esperienza. Il Manichino è fatto di quadrati; esistono Manichini inamovibili, leggeri, normali e pesanti, ma qui se ne vede solo uno, il leggero.
- **Origine:** `game.html?mode=training`; `training.js`; `entities/enemy.js` (tipi `dummy`, `light`, `normal`, `heavy`).
- **Aspetto:** un campo chiuso; al centro il Manichino leggero; lungo i bordi, rastrelliere di blocchi quadrati di ricambio.
- **Atmosfera:** routine, fatica.
- **Elementi ambientali:** la **statua di Teodor Vasko** `[PROPOSTA]`, con una mano di pietra e l'altra mancante; scintille sui punti d'impatto.
- **Abitanti:** allievi, istruttori.
- **Fazioni:** Connettori (costruttori del Manichino).
- **Eventi storici:** Rev V (Manichino e Sostituzione).
- **NPC:** `P-07` Teodor Vasko (statua e iscrizioni).
- **Nemici:** il Manichino (non ostile).
- **Boss:** nessuno.
- **Reliquie:** `R-07` Guanto di Vasko; `R-28` Blocco del Manichino.
- **Segreti:** nessun blocco del Manichino è mai stato trovato rotto. I blocchi di ricambio delle rastrelliere sono tutti **nuovi**: non ne è mai stato sostituito uno (`M-05`).
- **Cosa scopre il giocatore:** che il Cursore ha una forma scelta "per comodità" (iscrizione di Vasko), e che quella forma somiglia a qualcos'altro (`I-10`).
- **Collegamenti:** `L-20` (Manichini più pesanti), `M-05`, `Q-12`.

#### L-04 — Arena
- **Tipo:** struttura (città-arena).
- **Canone:** Sala del Conteggio dei Presenti, la Coda, la Classifica (dieci duelli per avere un nome), i Varchi verso i Campi d'Intersezione; l'Arbitro ascolta.
- **Origine:** `arena.html`, `server.js`, `pvp-manager.js`.
- **Aspetto:** un anello di pietra attorno a una sala circolare; al centro il numero del Conteggio, inciso in una pietra che cambia da sola.
- **Atmosfera:** tensione, attesa.
- **Elementi ambientali:** la Coda (un cerchio a terra su cui si attende); la Classifica scolpita; i Varchi con i loro Pegni di Ritorno.
- **Abitanti:** duellanti, spettatori, Connettori di guardia.
- **Fazioni:** l'Arbitrato (`F-09`), Connettori.
- **Eventi storici:** Rev VI (il Duello), VII (Classifica), IX (Battito), XII (Campo d'Intersezione).
- **NPC:** `A-02` Tilde Varro, `A-03` Mira Kell, `A-11` Rask il Coniatore.
- **Nemici / Boss:** nessuno nell'Arena attiva; i duelli PvP restano duelli.
- **Reliquie:** `R-18` Pegni di Ritorno non riscattati; `R-25` Registro del Battito.
- **Segreti:** sotto la Coda attuale c'è la **Coda Vecchia** (accesso a `L-05`).
- **Cosa scopre il giocatore:** che il Battito suona ogni venticinque battiti; che alcuni Pegni non furono mai riscattati.
- **Collegamenti:** `L-05`, `L-06`, `L-07`, `BM-01`.

#### L-05 — Arena Muta (e Coda Vecchia)
- **Tipo:** rovina + dungeon.
- **Canone:** la Prima Arena (Rev IV) non funzionò: per settimane le porte si aprirono su un campo vuoto. Le madri la usavano per spaventare i figli.
- **Origine:** prima arena non funzionante (`6b32547`, 2025-06-13) → funzionante solo con il PvPManager e il matchmaking (`4f2c0ff`, `a5b2612`, 2025-06-24/26). Tentativi intermedi: URL del servizio (`cb0ddf5`), import di `ws` (`79320f8`).
- **Aspetto:** un'arena intatta e perfettamente pulita, come se nessuno l'avesse mai usata. Nessuna traccia di combattimenti. Gli spalti sono vuoti ma i sedili sono consumati, come da un'attesa lunghissima.
- **Atmosfera:** silenzio totale. **Qui la Tela non ha voce** (è anteriore alla Rev VII): i passi, le magie, il vento non producono suono.
- **Elementi ambientali:** porte che si aprono su altre porte; una Sala del Conteggio ferma su **0**; nella Coda Vecchia, file di sagome immobili.
- **Abitanti:** nessuno di vivo.
- **Fazioni:** nessuna; i Connettori la sorvegliano da lontano.
- **Eventi storici:** Rev IV (costruzione e fallimento); Rev VII (l'Ospite di Casa); Lungo Silenzio (i Doppi nella Coda Vecchia).
- **NPC:** `A-03` Mira Kell all'ingresso.
- **Nemici:** `N-09` Doppi Minori (Coda Vecchia).
- **Boss:** `B-01` L'Atteso; `MB-01` L'Ospite di Casa (nell'atrio dell'Arena Muta); `BM-01` Il Doppio (nel fondo della Coda Vecchia).
- **Reliquie:** `R-19` Pietra del Forse; `R-21` Iscrizione della Vergogna.
- **Segreti:** il contatore del Conteggio, quando il giocatore sconfigge l'Atteso, passa da 0 a **1**. Il giocatore è il primo presente.
- **Cosa scopre il giocatore:** cosa serviva perché un duello potesse esistere (un indirizzo giusto, una voce, una coda) — vedi `Q-07`.
- **Collegamenti:** `L-04`, `BM-01`, `B-01`, `MB-01`, `I-04`, `I-07`.

#### L-06 — Campi Ciechi
- **Tipo:** landmark + area di combattimento.
- **Canone:** la Guerra dei Campi Ciechi (Lungo Silenzio): caster dai Campi più vasti colpivano da regioni che l'avversario non poteva vedere. Fine con la Convenzione: prima il Quadrato (Rev IX), poi il Campo d'Intersezione (Rev XII).
- **Origine:** arena PvP non condivisa tra schermi diversi → arena quadrata (`9de6345`, "Fix arena area (sadly)", lato predefinito 800) → rettangolo d'intersezione (0.12).
- **Aspetto:** una pianura disseminata di vecchi campi da duello di forme e dimensioni diverse, sovrapposti. Ai bordi di ciascuno, una fascia di Tela velata e buia. Al centro, quattro **Pietre della Convenzione** che delimitano un quadrato.
- **Atmosfera:** desolazione, sospetto. Sensazione costante di essere osservati da fuori.
- **Elementi ambientali:** colpi che arrivano da oltre il bordo della visuale; segni di bruciature fuori dai campi.
- **Abitanti:** reduci, cercatori di Pegni.
- **Fazioni:** Custodi (custodi della Convenzione), Arbitrato.
- **Eventi storici:** Guerra dei Campi Ciechi; firma della Convenzione.
- **NPC:** `A-04` Amsel il Vecchio.
- **Nemici:** `N-06` Scivolati (ai margini).
- **Boss:** `BM-02` Il Vasto.
- **Reliquie:** `R-26` Pietre della Convenzione.
- **Segreti:** sulle Pietre, sotto il testo della Convenzione, è inciso un segno di rammarico (`I-02`).
- **Cosa scopre il giocatore:** che il Quadrato fu un compromesso accettato a malincuore, e che la vera soluzione arrivò dopo.
- **Collegamenti:** `L-04`, `L-17`, `Q-04`.

#### L-07 — Recinto Oscuro
- **Tipo:** dungeon.
- **Canone:** i "duelli al buio" (Rev VII): le aree dell'avversario potevano essere invisibili.
- **Origine:** "Fix enemy areas not visible" (`61851c2`, 2025-11-11); il difetto nacque presumibilmente con la gestione PvP delle aree (`5319a2f`, 2025-06-27; origine dedotta, non verificata).
- **Aspetto:** un anfiteatro all'aperto. Il pavimento è perfettamente liscio e vuoto. Ovunque, invisibili, ci sono aree attive.
- **Atmosfera:** paranoia. Si muore senza capire perché.
- **Elementi ambientali:** le aree non si vedono, ma **si sentono**: ronzano (la Voce della Tela arrivò nella stessa Revisione che le rese visibili).
- **Abitanti:** nessuno.
- **Fazioni:** nessuna.
- **Eventi storici:** Rev VI–VII.
- **NPC:** epitaffi di caster caduti nei duelli al buio.
- **Nemici:** `N-05` Mani Trattenute.
- **Boss:** `B-04` Il Perimetro Cieco.
- **Reliquie:** nessuna specifica; epitaffi come frammenti.
- **Segreti:** la mappa delle aree invisibili coincide con il perimetro dell'anfiteatro disegnato al contrario.
- **Cosa scopre il giocatore:** che la Tela, prima di avere una voce, poteva anche nascondere.
- **Collegamenti:** `L-04`, `Q-07`, `S-07`.

#### L-08 — Emporio dei Linker
- **Tipo:** struttura.
- **Canone:** le Fonderie vendono le Estrazioni (Standard o di Fonderia, ×1 o ×10); le Sommosse del Grigio; il Patto delle Dieci e delle Sessanta.
- **Origine:** `shop.html`, `linker-data.js` (pacchetti, probabilità, garanzia).
- **Aspetto:** quattro banchi, uno per Fonderia, attorno a un pozzo centrale da cui "salgono" gli echi estratti.
- **Atmosfera:** commercio febbrile, speranza, delusione.
- **Elementi ambientali:** muri rinforzati (dopo le Sommosse); un memoriale di cristalli grigi.
- **Abitanti:** mercanti delle Fonderie, caster in fila.
- **Fazioni:** le Quattro Fonderie (`F-03`–`F-06`).
- **Eventi storici:** le Sommosse del Grigio; firma del Patto.
- **NPC:** rappresentanti delle Fonderie.
- **Nemici / Boss:** nessuno.
- **Reliquie:** `R-31` Grigi delle Sommosse.
- **Segreti:** il pozzo centrale è collegato al Rumore del Substrato; avvicinandosi di notte si sente il Rumore.
- **Cosa scopre il giocatore:** l'origine degli echi (`Q-11`).
- **Collegamenti:** `L-10`, `Q-11`, `M-12`.

#### L-09 — Bacheca degli Incarichi
- **Tipo:** landmark (nell'Atrio).
- **Canone:** tre incarichi al giorno, cinque a settimana; il Setaccio dei Nomi.
- **Origine:** `quests-data.js` (ordine mescolato con un hash del nome).
- **Aspetto:** una tavola di pietra; gli incarichi compaiono incisi da soli.
- **Elementi ambientali:** il **Setaccio dei Nomi** `[PROPOSTA]` è visibile: un disco forato che gira dietro la tavola.
- **Fazioni:** Custodi (la Bacheca è loro), Arbitrato (la paga in BitRune).
- **Segreti:** nessun incarico chiede mai di esplorare l'Oltre. `[DA DECIDERE]` se ciò cambi con l'Open World.
- **Cosa scopre il giocatore:** che ogni nome ha una strada diversa; che due caster con lo stesso nome avrebbero la stessa strada (`SEME-14`).
- **Collegamenti:** `L-01`, `F-01`.

#### L-10 — Archivio Ardente
- **Tipo:** dungeon (verticale, a strati).
- **Canone:** una pietra che non si raffredda mai; vi sono incisi nomi, livelli, affinità, mana, Grimori e Linker; "l'Archivio ricorda"; il Sigillo dei Nomi conserva solo l'impronta delle parole segrete; nella Grande Pulizia "dagli strati più profondi dell'Archivio furono bruciati i Cumuli"; in Rev VIII "i salvataggi dell'Archivio smisero di contraddirsi".
- **Origine:** Firestore; `player-db.js`; il vecchio `saves/players.json` (2025-06-13 → 2026-09-30, contenuto `{"data": ""}`); i `node_modules`.
- **Aspetto:** una discesa dentro una pietra viva e calda. Ogni piano è uno strato: in alto le incisioni recenti, sempre più antiche scendendo. In fondo, la cenere dei Cumuli.
- **Atmosfera:** calore crescente, sussurri di nomi.
- **Elementi ambientali:** pareti con nomi incisi (compreso quello del giocatore, che si aggiorna in tempo reale); incisioni doppie che si sovrappongono; impronte del Sigillo dei Nomi.
- **Abitanti:** Archivisti `[DA DECIDERE]` (vedi `F-02`).
- **Fazioni:** Connettori.
- **Eventi storici:** Rev IV (fondazione), VI (Sigillo dei Nomi), VIII (Grande Pulizia).
- **NPC:** `A-01` Elvar Sund (in visita), Archivisti.
- **Nemici:** `EL-07` Gli Incompiuti.
- **Boss:** `B-05` L'Incisione Contesa; `MB-02` Il Cumulo (sul fondo).
- **Reliquie:** `R-17` Tavoletta Vuota; `R-24` Frammenti dei Cumuli; `R-32` Chiave Nascosta; `R-33` Sigillo della Cornice.
- **Segreti:** il primo archivio non era ardente: era una **tavoletta fredda**, con una sola iscrizione vuota (`R-17`).
- **Cosa scopre il giocatore:** che l'Archivio ha avuto un predecessore; che le incisioni potevano contraddirsi; che i Cumuli erano già stati bruciati una volta e ricrebbero.
- **Collegamenti:** `L-01`, `L-08`, `Q-08`, `I-08`.

#### L-11 — Piane di Sal
- **Tipo:** regione / bioma (deserto salino).
- **Canone:** terra di Sefa (il Primo Cerchio), di Maro Teleth (la Goccia, la siccità di sette anni) e di Ione Calder (Bus di Mana); il mana affiora a pozze, come olio; la gente muore di sete accanto alle pozze.
- **Origine:** nessun bug: luogo di lore. Strati di Rev I–II.
- **Aspetto:** sale bianco a perdita d'occhio; pozze di mana azzurro (il colore del mana puro); argilla rossa attorno alle pozze, con cerchi tracciati a mano.
- **Atmosfera:** sete, luce accecante, antichità.
- **Elementi ambientali:** pozze di mana che esplodono se lasciate libere; i condotti di Ione Calder, in parte crollati; il villaggio dei vasai `[PROPOSTA]`.
- **Abitanti:** vasai, distributori del Bus di Mana.
- **Fazioni:** Bus di Mana (`F-05`).
- **Eventi storici:** il Primo Cerchio; la siccità di Maro; la fondazione del Bus di Mana.
- **NPC:** `A-06` Hadi, `A-09` Saba Calder; `P-01`, `P-03`, `P-14` (memorie).
- **Nemici:** `N-01` Cerchi Indelebili, `N-02` Cariche Mute, `N-03` Spiriti d'Infusione.
- **Boss:** `EL-01` La Scarica Totale (elite di zona).
- **Reliquie:** `R-01` Coccio di Sefa, `R-02` Borraccia di Maro, `R-14` Primo Condotto.
- **Segreti:** la prima pozza contenuta da Sefa esiste ancora, e il suo cerchio è ancora fucsia.
- **Cosa scopre il giocatore:** l'origine del cerchio; che la siccità di Maro coincide con i venti dell'Orlo `[IPOTESI in-world]` (l'aria disperde l'acqua).
- **Collegamenti:** `L-13` (Oasi del Rigoglio), `L-15` (tempeste), `Q-01`, `Q-02`.

#### L-12 — Kesh
- **Tipo:** città (pietra rossa) con landmark e dungeon.
- **Canone:** la città di Ilyen Kastra; la torre bruciata durante un assedio; il Secondo Rogo, secoli dopo, durato tre giorni, causato da "un duello senza regole, aree di fuoco e venti incendiati che passavano di mano in mano finché nessuno riuscì più a scioglierli"; nascita del Firewall Arcano.
- **Origine:** lore; corrispondenza `[PROPOSTA]` del Secondo Rogo con la "copia fantasma non annullabile" di un'area ceduta (fix 0.11; vedi `MB-04`).
- **Aspetto:** torri di pietra rossa, molte mozze; muri tagliafuoco tra le case; quartieri anneriti dal Rogo.
- **Atmosfera:** orgoglio ferito, calore costante.
- **Elementi ambientali:** la **Torre di Ilyen** (rimangono il pavimento e la trave inclinata: la Scala Spezzata in scala reale); le **Rovine del Secondo Rogo**, dove alcune aree d'aria incendiata bruciano ancora; la **Torre della Misura** `[PROPOSTA]`, una scala a spirale altissima.
- **Abitanti:** costruttori, soldati del Firewall, fabbri dell'Overclock.
- **Fazioni:** Firewall Arcano (`F-03`) e Overclock Runico (`F-04`): due filosofie opposte nella stessa città.
- **Eventi storici:** scoperta del fuoco; Secondo Rogo; fondazione delle due Fonderie.
- **NPC:** `A-07` Odile Brann, `A-08` Nilo Sarto; `P-02`, `P-12`, `P-13` (memorie).
- **Nemici:** `EL-04` Tizzone Mancante.
- **Boss:** `MB-04` Il Vento Inestinguibile (Rovine del Rogo); `B-02` La Spirale (Torre della Misura).
- **Reliquie:** `R-03` Trave di Kesh, `R-12` Mattone Tagliafuoco, `R-13` Bende dell'Accelerato.
- **Segreti:** il Rogo non fu causato soltanto da un duello senza regole (`I-09`).
- **Cosa scopre il giocatore:** che i venti incendiati erano diventati impossibili da sciogliere.
- **Collegamenti:** `L-14`, `Q-06`, `Q-10`.

#### L-13 — Brughiere di Holm
- **Tipo:** regione / bioma (brughiera di dolmen).
- **Canone:** i dolmen e Dagrun Holm, il loro custode.
- **Origine:** lore.
- **Aspetto:** colline verdi, cielo basso, dolmen ovunque. Il verde è vivo anche d'inverno.
- **Atmosfera:** solidità, pazienza.
- **Elementi ambientali:** dolmen che "respirano" (il suolo trattiene e lascia andare a intervalli: il Battito della Terra); **Oasi del Rigoglio** sul confine con le Piane; **Il Nocciolo** `[PROPOSTA]`, sede del Kernel Elementale, un seme di pietra gigantesco.
- **Abitanti:** pastori, custodi dei dolmen, studiosi del Kernel.
- **Fazioni:** Kernel Elementale (`F-06`).
- **Eventi storici:** scoperta della terra; la scomparsa di Aurel Maskh `[PROPOSTA]`.
- **NPC:** `A-10` Il Discepolo; `P-05`, `P-15` (memorie).
- **Nemici:** `EL-05` Fioritura Amara (oasi).
- **Boss:** nessuno.
- **Reliquie:** `R-05` Architrave di Holm, `R-15` Ultima Lettera di Aurel.
- **Segreti:** nel Nocciolo c'è una stanza chiusa che nessuno del Kernel ha mai aperto (`M-09`, `Q-13`). **Non va mai aperta del tutto.**
- **Collegamenti:** `L-11`, `L-14`, `Q-13`.

#### L-14 — Cava di Nerea Solt
- **Tipo:** dungeon (cava abbandonata).
- **Canone:** Nerea Solt vi passò dieci anni a far scontrare magie; vi perse la vista di un occhio; ne uscirono le Leggi delle Reazioni.
- **Origine:** `spell-interactions.js`; fix "Dmg fix for magma" (`a97ae70`).
- **Aspetto:** gradoni di pietra scavati, metà fusi in vetro nero; pozze di magma; pareti segnate da cerchi di prova.
- **Atmosfera:** laboratorio pericoloso; ogni passo rischia una Reazione.
- **Elementi ambientali:** zone dove le Reazioni avvengono da sole (magma, rigoglio, elettrificazione); tavole di Nerea incise nella roccia, numerate da 1 a 12; la tavola 7 è incisa da un'altra mano.
- **Abitanti:** `A-05` Teo Solt.
- **Fazioni:** Reattivisti (`F-08`).
- **Eventi storici:** codificazione delle Reazioni (Rev IX); aggiunta dell'Elettrificazione (Rev XI).
- **Nemici:** `EL-02` Colata Cieca.
- **Boss:** nessuno.
- **Reliquie:** `R-08` Occhio di Nerea e Quaderni della Cava.
- **Segreti:** chi ha inciso la tavola 7 `[DA DECIDERE]` (`M-15`).
- **Cosa scopre il giocatore:** le Reazioni come "leggi naturali" verificabili sul campo; che il magma una volta non sapeva "quanto" bruciare.
- **Collegamenti:** `L-12`, `L-13`, `L-15`.

#### L-15 — L'Orlo
- **Tipo:** regione / bioma (scogliere) con landmark e dungeon.
- **Canone:** dove la Tela "sembra finire a strapiombo sul nulla"; terra dei costruttori di aquiloni e di Sienne Vael; Vesh Arandel vi fu colpito dal fulmine.
- **Origine:** lore; bug del laser di folgore (commento nel codice: "con troppi rimbalzi copriva mezza arena"); correzione dei 144 Hz; Rosa degli Otto Venti (proiettile riconosciuto solo in 8 direzioni fino alla 0.11).
- **Aspetto:** scogliere altissime, vento incessante, temporali frequenti. Oltre il bordo, una nebbia che non è nebbia.
- **Atmosfera:** vertigine, elettricità nell'aria.
- **Elementi ambientali:** aquiloni abbandonati; parafulmini; la **Rosa degli Otto Venti** (una bussola di pietra a otto punte); la **Sala degli Specchi** (laboratorio di Corva Lenzi `[PROPOSTA]`); l'**Osservatorio delle Frequenze** (rovina dei Connettori, pieno di strumenti di misura del tempo).
- **Abitanti:** costruttori di aquiloni, Vesh Arandel (vivo `[PROPOSTA]`).
- **Fazioni:** Connettori (Osservatorio).
- **Eventi storici:** scoperta dell'aria; scoperta della folgore; nascita dei circuiti; scoperta della Cavità.
- **NPC:** `P-09` Vesh Arandel; `P-04`, `P-10` (memorie).
- **Nemici:** `EL-06` Rifiutati (variante degli Otto Venti), `EL-03` Riflesso Infinito.
- **Boss:** `B-03` Lo Sfasato (Osservatorio).
- **Reliquie:** `R-04` Aquilone di Sienne, `R-09` Calco della Cicatrice, `R-10` Lenti di Corva, `R-23` Quadrante del Tempo Comune, `R-29` Rosa degli Otto Venti.
- **Segreti:** l'accesso principale alle Terre Oltre il Campo.
- **Cosa scopre il giocatore:** che il bordo del mondo non è il bordo della Tela.
- **Collegamenti:** `L-11`, `L-17`, `L-20`, `Q-05`, `Q-14`.

#### L-16 — Le Vie Sbagliate
- **Tipo:** dungeon (labirinto di strade).
- **Canone:** nessuno. `[PROPOSTA]` da integrare in `LORE.md` (Rev IV) se approvato: **la Dispersione delle Vie**.
- **Origine:** il caos dei percorsi dopo il primo deploy (2025-06-18/19): file spostati dentro e fuori da `public`, import cambiati più volte, nome del modulo della barra del mana sbagliato, link resi assoluti; commit "Move files to correct paths (I SWEAR)" (`13a67be`); recidiva a novembre ("modify files path for deploy" `d4e6510`, "Second try" `00d1090`). Changelog 0.4: "Percorsi e import dei moduli dopo il deploy".
- **Aspetto:** strade che partono dal Centro verso le regioni ma arrivano altrove; cartelli che indicano direzioni impossibili; edifici di una regione trovati in un'altra (una torre di Kesh nelle Piane di Sal).
- **Atmosfera:** disorientamento, ironia amara.
- **Elementi ambientali:** cartelli con due indicazioni, una "pubblica" e una no; un portale chiamato **la Radice**.
- **Abitanti:** viandanti persi.
- **Fazioni:** Connettori (responsabili storici).
- **Eventi storici:** costruzione della Rete (Rev IV).
- **NPC:** epigrafi dei Connettori.
- **Nemici:** `N-07` Fumi.
- **Boss:** `BM-03` Il Viandante delle Vie Sbagliate.
- **Reliquie:** `R-20` Giuramento delle Vie; `R-33` Sigillo della Cornice (si trova qui, archiviato sotto un nome sbagliato, e va riportato nell'Archivio).
- **Segreti:** tutte le Vie ripartono dalla Radice.
- **Cosa scopre il giocatore:** che la Rete non nacque perfetta, e che qualcuno giurò più volte di averla sistemata.
- **Collegamenti:** `L-01`, `L-10`, `Q-09`.

#### L-17 — La Faglia
- **Tipo:** landmark.
- **Canone:** nessuno `[PROPOSTA]`.
- **Origine:** "Fix bug where canva does not come back from original position" (`97b4c56`, 2025-11-13; changelog 0.7: "Canvas che non tornava nella posizione originale").
- **Aspetto:** una striscia di terra spostata di qualche passo rispetto al resto del mondo: le strade non combaciano, un fiume si interrompe e riprende più in là.
- **Atmosfera:** straniamento.
- **Elementi ambientali:** oggetti che si trovano "un passo più in là" di dove sembrano.
- **Nemici:** `N-06` Scivolati.
- **Segreti:** la Faglia si è spostata durante uno scossone (il Sovraccarico di un caster potentissimo? `[IPOTESI in-world]`) e "non è più tornata al suo posto".
- **Collegamenti:** `L-06`, `L-15`.

#### L-18 — Quartiere del Volto Abbandonato
- **Tipo:** rovina (quartiere incompiuto nel Centro).
- **Canone:** il Volto Abbandonato (Rev XI): un tentativo dei Custodi di riscrivere l'aspetto della Tela, abbandonato prima di essere completato; "nessuno ne parla volentieri".
- **Origine:** "UI rework" (`ffe53e1`, 2026-10-01) → rimozione dei 7 fogli di stile "rework" (`5ca83c0`, 2026-10-03): arena, base, buttons, exp bar, home, modal, version.
- **Aspetto:** un quartiere costruito in uno stile diverso da tutto il resto, coperto da **sette drappi** di un colore che non compare altrove. Sotto i drappi, gli edifici sono finiti solo a metà.
- **Atmosfera:** imbarazzo, abbandono improvviso (tutto è rimasto com'era dopo due soli giorni di lavoro).
- **Elementi ambientali:** i Sette Drappi, uno per ogni luogo del Centro che avrebbero dovuto ricoprire.
- **Nemici:** `N-10` Senzavolto.
- **Boss:** nessuno.
- **Reliquie:** `R-22` I Sette Drappi.
- **Segreti:** il motivo dell'abbandono non va spiegato (`M-14`).
- **Cosa scopre il giocatore:** che ogni drappo corrisponde a un luogo che conosce.
- **Collegamenti:** `L-01`, `F-01`, `Q-15`.

#### L-19 — Zone del Silenzio
- **Tipo:** area speciale (fenomeno sparso).
- **Canone:** il Lungo Silenzio, quasi un anno senza Revisioni; "le Cronache di quel periodo sono vuote"; il silenzio "non fu pace".
- **Origine:** 2025-11-13 → 2026-09-30: nessun commit.
- **Aspetto:** sacche del mondo rimaste esattamente come al termine della Settima Revisione. Polvere ferma a mezz'aria. I fasci di luce dell'Atrio non vi arrivano.
- **Atmosfera:** sospensione. Il tempo non è fermo, ma nulla cambia.
- **Elementi ambientali:** nelle Zone del Silenzio valgono **le leggi della Rev VII**: niente Reazioni, niente folgore né laser, niente Ruota delle Cariche. Il giocatore che vi entra perde temporaneamente ciò che è arrivato dopo `[RICHIEDE MECCANICA]`.
- **Abitanti:** Tracciatori Nudi (vi si sentono a casa: lì i Linker non esistono ancora).
- **Fazioni:** Tracciatori Nudi (`F-07`).
- **Nemici:** quelli dell'epoca: `N-09` Doppi Minori, `B-04` residuo del Perimetro Cieco.
- **Reliquie:** pagine bianche delle Cronache.
- **Segreti:** il motivo del Silenzio è protetto (`M-06`).
- **Collegamenti:** `F-07`, `A-12`, `Q-03`, `Q-04`.

#### L-20 — Terre Oltre il Campo
- **Tipo:** regione (frontiera).
- **Canone:** `[APOCRIFO]` terre aperte, senza Arena e senza Convenzione, dove "i Manichini più pesanti… camminano liberi"; il Primo Passo (un quadrato che si sposta da sé verso destra su una Tela vuota).
- **Origine:** prototipo `client/dev/openworld/` (un quadrato animato di 250 unità verso destra con animejs); tipi `normal` e `heavy` di `enemy.js`, mai usati nel gioco.
- **Aspetto:** `[DA DECIDERE]`. Raccomandazione: terre **incompiute**, dove la Tela è tesa ma non ancora del tutto disegnata; più ci si allontana, più le forme si semplificano fino a diventare quadrati.
- **Atmosfera:** scoperta, vastità, inquietudine.
- **Nemici:** `N-08` Manichini Selvatici (normali, pesanti, inamovibili).
- **Reliquie:** `R-27` Registrazione del Primo Passo.
- **Segreti:** protetti (`M-08`). Non rivelare cosa c'è oltre l'ultima terra raggiungibile.
- **Collegamenti:** `L-15`, `L-03`, `Q-12`, `Q-14`.

---

## 6. NPC

### Come esistono i personaggi storici

Quasi tutti i personaggi di `LORE.md` sono **storici**: nell'Open World non si incontrano, si *ricostruiscono*. Ogni personaggio storico esiste attraverso almeno due di queste forme: statua, iscrizione, lettera, libro, reliquia, registrazione, testimonianza di un NPC vivo, luogo legato alla sua memoria. `[DA DECIDERE]` quali personaggi storici siano ancora vivi: la raccomandazione è **Vesh Arandel vivo** (testimone diretto della nascita dei circuiti) e **Aurel Maskh scomparso** (per proteggere `M-09`). Tutti gli altri sono morti o irraggiungibili.

### Personaggi storici

#### P-01 — Sefa, la Tracciatrice
- **Canone:** vasaia delle Piane di Sal; tracciò il primo cerchio nell'argilla attorno a una pozza di mana; il cerchio si accese di fucsia.
- **Periodo:** Tempo Selvatico. **Luogo:** Piane di Sal. **Fazione:** nessuna (i Custodi si dichiarano eredi della sua scuola).
- **Presenza:** leggenda; il cerchio originale attorno alla prima pozza (`L-11`); il coccio (`R-01`); canti dei vasai.
- **Personalità** `[PROPOSTA]`: pratica, silenziosa, per niente mistica. Voleva solo che la pozza non esplodesse.
- **Cosa sapeva:** che un contorno chiuso trattiene il mana. **Cosa non sapeva:** perché il cerchio fosse fucsia (lo capirono i sapienti dopo di lei). **Credenza errata** `[PROPOSTA]`: pensava che il fucsia fosse il colore del mana stesso, "arrabbiato".
- **Frammento** (canto dei vasai): *"Non l'ho chiamato. L'ho solo chiuso dentro."*
- **Quest:** `Q-01`. **Collegamenti:** `F-01`, `P-03`, `P-14`, `A-06`.
- **Importanza:** alta. È il punto di partenza di ogni ricostruzione.

#### P-02 — Ilyen Kastra, la Muratrice di Kesh
- **Canone:** costruttrice di torri a Kesh; la torre bruciò durante un assedio; tracciò la Scala Spezzata nella cenere.
- **Periodo:** Tempo Selvatico. **Luogo:** Kesh, Torre di Ilyen. **Fazione:** nessuna; il Firewall la venera come antenata morale.
- **Presenza:** la torre stessa (`L-12`), la trave (`R-03`), un registro dei costruttori di Kesh.
- **Personalità:** testarda, orgogliosa del proprio lavoro; la perdita della torre fu la perdita di tutto.
- **Sapeva:** come sta in piedi una costruzione. **Non sapeva:** che il fuoco sarebbe tornato a Kesh (Secondo Rogo). **Credenza errata:** che il fuoco "volesse" i muri (lo ha scritto come se il fuoco avesse una volontà).
- **Frammento:** *"Mi ha lasciato il pavimento e la trave. Il muro se l'è preso. Allora ho disegnato quello che mi aveva lasciato."*
- **Quest:** `Q-02`, `Q-10`. **Collegamenti:** `P-12`, `P-13`, `L-12`.

#### P-03 — Maro Teleth, il Pastore delle Piane di Sal
- **Canone:** siccità di sette anni; perse il gregge; tracciò il contorno dell'ultima goccia.
- **Periodo:** Tempo Selvatico, generazioni dopo Sefa. **Luogo:** Piane di Sal.
- **Presenza:** la borraccia (`R-02`); una tomba di sale; una ninnananna delle Piane.
- **Personalità:** rassegnato, poi ostinato.
- **Sapeva:** che l'acqua è ciò che manca. **Non sapeva:** perché la siccità fosse durata sette anni. **Credenza errata** `[IPOTESI in-world]`: che la siccità fosse una punizione. Le Piane, ai confini con l'Orlo, suggeriscono una spiegazione più naturale (l'aria disperde l'acqua), che resta comunque un'ipotesi.
- **Frammento:** *"Sette anni. L'ultima l'ho tenuta sul dito finché non ho saputo disegnarla."*
- **Quest:** `Q-02`. **Collegamenti:** `P-01`, `P-14`, `L-15`.

#### P-04 — Sienne Vael, la Tessitrice di Aquiloni
- **Canone:** scogliere dell'Orlo; il vento non spinge in linea retta; il Ricciolo.
- **Periodo:** Tempo Selvatico. **Luogo:** L'Orlo.
- **Presenza:** aquiloni (`R-04`), un laboratorio di tessitura in rovina.
- **Personalità:** curiosa, ironica, incapace di stare ferma.
- **Sapeva:** come si muove il vento. **Non sapeva:** che sull'Orlo, molto dopo di lei, sarebbe caduto il primo fulmine "ascoltato". **Credenza errata:** che oltre il bordo dell'Orlo non ci fosse niente.
- **Frammento:** *"Il vento torna sempre indietro. Bisogna solo aspettarlo dove torna."*
- **Quest:** `Q-02`, `Q-14`. **Collegamenti:** `P-09`, `L-20`.

#### P-05 — Dagrun Holm, il Custode dei Dolmen
- **Canone:** custode dei dolmen; tracciò il loro profilo dal basso; il Dolmen.
- **Periodo:** Tempo Selvatico. **Luogo:** Brughiere di Holm.
- **Presenza:** il primo dolmen (`R-05`), registri dei custodi.
- **Personalità:** lento, meticoloso, convinto che tutto vada costruito dal basso.
- **Sapeva:** che il quarto lato è la terra stessa. **Non sapeva:** che la terra avrebbe un giorno *bloccato* le magie. **Credenza errata:** che la terra sia immobile (il Battito della Terra dimostra che respira).
- **Frammento:** *"Si comincia dal suolo. Sempre."*
- **Quest:** `Q-02`. **Collegamenti:** `L-13`, `A-10`.

#### P-06 — Oda Nerys, la Cartografa
- **Canone:** cartografa al servizio di una corona di cui non resta il nome; la Clessidra Coricata; "lo spazio è tempo che si è sdraiato".
- **Periodo:** Tempo Selvatico. **Luogo** `[PROPOSTA]`: itinerante; la sua mappa è nelle Vie Sbagliate.
- **Presenza:** la Mappa della Clessidra (`R-06`), il primo disegno dello Spaziale.
- **Personalità:** precisa fino all'ossessione, poetica nelle note a margine.
- **Sapeva:** che un confine si chiude. **Non sapeva:** che il possesso dello spazio avrebbe avuto un costo continuo. **Credenza errata:** che una mappa fedele non possa mai sbagliare strada (le Vie Sbagliate la smentiscono, e la sua mappa è l'unica cosa che le attraversa correttamente).
- **Frammento:** *"Lo spazio è tempo che si è sdraiato."* `[CANONE]`
- **Quest:** `Q-02`, `Q-09`. **Collegamenti:** `L-16`, `BM-03`.

#### P-07 — Teodor Vasko, il Chirurgo del Gesto
- **Canone:** propose il Cursore; il "peso dell'anima" (l'inerzia che non riuscì a eliminare); scelse la forma a freccia per comodità; "molti anni dopo si sarebbe scoperto che il Lettore la riconosceva".
- **Periodo:** Revisione V. **Luogo:** Campo d'Addestramento. **Fazione:** Connettori.
- **Presenza:** statua con una sola mano (`L-03`); il guanto (`R-07`); appunti.
- **Personalità:** clinico, compassionevole verso gli allievi feriti.
- **Sapeva:** che la mano trema e che il corpo esposto è un bersaglio. **Non sapeva:** che Corpo e Cursore potessero separarsi. **Credenza errata `[CANONE]`:** che la forma del Cursore fosse arbitraria.
- **Frammento:** *"Ho scelto la freccia perché indica. Nient'altro. Una forma vale l'altra."* (Ironia scoperta solo con `I-10`.)
- **Quest:** `Q-12` (marginale), `SEME-05`. **Collegamenti:** `M-10`, `M-11`.

#### P-08 — Nerea Solt, la Reattivista
- **Canone:** dieci anni nella cava a far scontrare magie; perse la vista di un occhio; raccolse le Leggi delle Reazioni.
- **Periodo:** prima e durante la Revisione IX. **Luogo:** `L-14`. **Fazione:** Reattivisti (fondatrice `[PROPOSTA]`).
- **Presenza:** l'occhio di vetro (`R-08`), quaderni, le tavole incise.
- **Personalità:** spericolata, rigorosa, sarcastica sulla propria cecità parziale.
- **Sapeva:** tutte le Reazioni tra i quattro elementi antichi. **Non sapeva:** l'Elettrificazione (la folgore non era ancora legge). **Credenza errata `[PROPOSTA]`:** che le sue Leggi fossero complete.
- **Frammento:** *"Undici leggi. Ne manca una, lo sento. Non vivrò abbastanza per trovarla."* (Le leggi canoniche sono dodici: `M-15`.)
- **Quest:** `Q-10` (consulenza postuma). **Collegamenti:** `A-05`, `EL-02`.

#### P-09 — Vesh Arandel, la Mano Folgorata
- **Canone:** costruttore di strumenti sull'Orlo; colpito dal fulmine; la cicatrice; la Folgore; i circuiti; "il fulmine colpisce il corpo, mai la volontà".
- **Periodo:** prima della Revisione XI. **Luogo:** L'Orlo. **Fazione:** vicino ai Connettori.
- **Presenza:** **vivo** `[PROPOSTA]`, molto anziano; il calco della cicatrice (`R-09`).
- **Personalità:** schivo, ossessionato dalle misure, a disagio con la fama.
- **Sapeva:** come il mana scorre lungo un circuito. **Non sapeva:** cosa sarebbero diventati i circuiti (i Linker). **Credenza errata** `[PROPOSTA]`: si considera responsabile del Critico, "la prima violenza nata dalla macchina", e si sente in colpa.
- **Dialogo:** *"Ho ricopiato una cicatrice. Gli altri ci hanno costruito un'economia."*
- **Quest:** `Q-05` (l'Osservatorio era il suo), `Q-11`. **Collegamenti:** `P-10`, `P-11`, `B-03`.

#### P-10 — Corva Lenzi, l'Ottica
- **Canone:** molava lenti per i Connettori; scoprì la Cavità (andata, ritorno, andata); due specchi invisibili.
- **Periodo:** prima della Revisione XI. **Luogo** `[PROPOSTA]`: Sala degli Specchi, sull'Orlo. **Fazione:** Connettori.
- **Presenza** `[PROPOSTA]`: **scomparsa** nella Sala degli Specchi; restano le lenti (`R-10`) e un diario.
- **Personalità:** perfezionista, convinta che ogni fenomeno abbia un oggetto fisico dietro.
- **Sapeva:** come intrappolare il mana fino a farne un raggio. **Non sapeva:** che il raggio di folgore avrebbe rimbalzato senza fine. **Credenza errata `[PROPOSTA]`:** che i due specchi invisibili fossero oggetti reali nascosti nella Tela, da trovare. La sua ricerca la portò alla Sala degli Specchi, dove nacque il Riflesso Infinito (`EL-03`).
- **Frammento:** *"Gli specchi esistono. Devono esistere. Nessun raggio rimbalza sul nulla."*
- **Collegamenti:** `P-09`, `EL-03`.

#### P-11 — Halvard Rúnstedt, il Primo Collegatore
- **Canone:** runologo e costruttore di circuiti; il Cerchio Personale; i cinque Nodi; il nome in rune; la croce ᛭; il Violetto di Rúnstedt; sapeva incastonare i Linker ma non crearli.
- **Periodo:** inizio dell'Era del Collegamento. **Luogo** `[PROPOSTA]`: tomba nel Centro, sotto l'Emporio. **Fazione:** nessuna (rifiutò di fondare una Fonderia `[PROPOSTA]`).
- **Presenza:** il Trattato dei Nodi (`R-11`); la tomba, sopra la quale **il suo Cerchio Personale gira ancora** `[PROPOSTA]` (`M-26`).
- **Personalità:** studioso, idealista, ingenuo sulle conseguenze commerciali.
- **Sapeva:** perché le rune rendono unico un nome. **Non sapeva:** da dove sarebbero venuti i Linker (il Rumore del Substrato). **Credenza errata `[PROPOSTA]`:** che il Cerchio Personale avrebbe reso i caster più liberi; le Estrazioni li hanno resi dipendenti.
- **Frammento** (Trattato dei Nodi): *"Il corpo ha un soffitto. Il cerchio no."* `[CANONE]`
- **Quest:** `Q-11`. **Collegamenti:** tutte le Fonderie, `F-07`.

#### P-12 — Thessaly Brann, la Custode
- **Canone:** sopravvissuta al Secondo Rogo di Kesh; fondatrice del Firewall Arcano; *firewall* come muro tagliafuoco; "Ciò che resta in piedi, vince."
- **Periodo:** Era del Collegamento. **Luogo:** Kesh. **Fazione:** Firewall Arcano.
- **Presenza:** mattoni tagliafuoco con il suo marchio (`R-12`); ritratti nella sede del Firewall; la discendente `A-07`.
- **Personalità:** dura, protettiva, incapace di perdonare.
- **Sapeva:** come si ferma un incendio. **Non sapeva:** la causa profonda del Rogo. **Credenza errata `[PROPOSTA]`:** che il Rogo fosse colpa solo dell'imprudenza dei duellanti. In realtà i venti incendiati non si potevano più sciogliere per un difetto del Lettore (`MB-04`, `I-09`).
- **Frammento:** *"Nessuno riuscì a scioglierli. Nessuno ci provò abbastanza."*
- **Quest:** `Q-10`. **Collegamenti:** `P-02`, `P-13`, `MB-04`.

#### P-13 — Dario Venn, l'Accelerato
- **Canone:** fondatore dell'Overclock Runico; si ustionò entrambe le mani; "Il limite è un'opinione del metallo."
- **Periodo:** Era del Collegamento. **Luogo** `[PROPOSTA]`: Kesh. **Fazione:** Overclock Runico.
- **Presenza:** `[DA DECIDERE]` vivo e recluso, oppure morto. Le bende (`R-13`); l'apprendista `A-08`.
- **Personalità:** brillante, impaziente, disprezza chi si ferma.
- **Sapeva:** cosa succede a una runa oltre la sua frequenza. **Non sapeva:** che una frequenza diversa aveva falsato i duelli per anni (lo Sfasato). **Credenza errata `[PROPOSTA]`:** che andare "più veloci" sia sempre un vantaggio; il Tempo Comune lo smentisce.
- **Frammento:** *"Il limite è un'opinione del metallo."* `[CANONE]`
- **Quest:** `Q-05`, `Q-10`. **Collegamenti:** `P-12` (rivalità), `B-03`.

#### P-14 — Ione Calder, la Distributrice
- **Canone:** dalle Piane di Sal; condotti per portare il mana a chi non sapeva raccoglierlo; *omnibus*; "Ciò che scorre non si esaurisce."
- **Periodo:** Era del Collegamento. **Luogo:** Piane di Sal. **Fazione:** Bus di Mana.
- **Presenza:** il Primo Condotto (`R-14`), la tomba nel sale, la discendente `A-09`.
- **Personalità:** generosa, pragmatica, poco interessata al potere.
- **Sapeva:** come far scorrere il mana. **Non sapeva:** del Quinto che scende. **Credenza contraddetta `[PROPOSTA]`:** "Ciò che scorre non si esaurisce" è smentito dalla Catalisi (un quinto si perde sempre)… a meno che il Quinto, tornando nel Substrato, continui a scorrere. L'ambiguità va lasciata (`M-12`).
- **Collegamenti:** `P-01`, `P-03`, `F-05`.

#### P-15 — Aurel Maskh, l'Interiore
- **Canone:** fondatore del Kernel Elementale; cercava l'elemento più puro al centro di ogni elemento; si dice che cercasse un sesto elemento e che l'abbia trovato; l'ultima lettera: «Il Lettore conosce più forme di quante ce ne abbia mostrate.»
- **Periodo:** Era del Collegamento. **Luogo:** Il Nocciolo (`L-13`). **Fazione:** Kernel Elementale.
- **Presenza:** **scomparso** `[PROPOSTA]`. L'ultima lettera (`R-15`), la stanza chiusa del Nocciolo, il Discepolo (`A-10`).
- **Personalità:** mistico, introverso, dolce con gli allievi e spietato con sé stesso.
- **Sapeva:** `[CANONE APERTO]` forse ciò che c'è al centro degli elementi. **Non sapeva:** `[DA NON DEFINIRE]`. **Credenza:** che il Lettore nasconda forme. Non va né confermata né smentita.
- **Quest:** `Q-13`. **Collegamenti:** `M-09`, la Luce (Apocrifo).

#### P-16 — DrIce, l'Archivista
- **Canone:** firma di tutte le Cronache, dalla Prima Revisione a oggi; nessuno all'interno dell'ordine dice di conoscerlo; qualcuno lo legge come "il Dottore del Ghiaccio"; il Ghiaccio è l'unico elemento che nessuno sostiene di aver visto tracciare.
- **Periodo:** tutte le Revisioni. **Luogo:** nessuno. **Fazione:** nessuna nota.
- **Presenza:** **solo come firma.** Mai statua, mai voce, mai volto. Mai un NPC.
- **Cosa sa, cosa crede:** `[PROTETTO]` (`M-04`).
- **Regola:** DrIce non parla mai in prima persona in nessun contenuto. Le sue uniche parole sono le Cronache.
- **Collegamenti:** `M-01`, `M-04`, `M-05`.

#### P-17 — Il Custode anonimo della Prima Cronaca
- **Canone:** «Il Lettore non è cambiato. Siamo noi che, finalmente, abbiamo imparato a scrivere le sue leggi.»
- **Periodo:** Revisione I. **Luogo:** statua nel Primo Laboratorio `[PROPOSTA]`. **Fazione:** Custodi.
- **Credenza `[CANONE APERTO]`:** che i Custodi scrivano le leggi. È la posizione ufficiale dei Custodi, contraddetta dagli indizi sull'Autore (`I-13`), ma mai smentita definitivamente.

#### P-18 — La Caster del Prologo
- **Canone:** protagonista del Prologo e dell'Epilogo; senza nome; ha un Leggendario nell'Apice; vince un duello.
- **Presenza:** `[DA DECIDERE]`. Opzioni: (a) resta anonima per sempre; (b) diventa la prima mentore del giocatore, senza mai dire il proprio nome; (c) il suo nome si scopre solo leggendo le rune del suo Cerchio Personale. **Raccomandazione:** (c), come ricompensa nascosta (`M-27`).

### Personaggi attuali `[PROPOSTA]`

Personaggi vivi nell'epoca dell'Open World. Nessuno di loro conosce una verità importante per intero (R4).

| ID | Nome | Ruolo | Luogo | Fazione | Cosa sa | Cosa crede erroneamente | Quest |
|---|---|---|---|---|---|---|---|
| `A-01` | Elvar Sund | Custode copista delle Cronache | Atrio, Archivio | Custodi | La cronologia ufficiale delle Revisioni. | Che il Lungo Silenzio fu un periodo di studio voluto dai Custodi. | `Q-08`, `I-13` |
| `A-02` | Tilde Varro | Connettrice, manutentrice dell'Arbitro e del Battito | Arena | Connettori | La causa tecnica dei Doppi (porte mai chiuse, porte doppie). | Che i Doppi siano estinti. | `Q-03` |
| `A-03` | Mira Kell | Guardiana della Coda | Arena, ingresso dell'Arena Muta | Arbitrato | Ha visto un Doppio fermo in Coda, di notte. | Che i Doppi siano fantasmi di caster morti. | `Q-03`, `Q-07` |
| `A-04` | Amsel il Vecchio | Reduce della Guerra dei Campi Ciechi, dal Campo stretto | Campi Ciechi | nessuna | Come si moriva "colpiti dal nulla". | Che i caster dai Campi vasti barassero di proposito (molti non sapevano di vedere di più). | `Q-04` |
| `A-05` | Teo Solt | Pronipote di Nerea, custode della Cava | Cava di Nerea Solt | Reattivisti | Tutte le Reazioni, sul campo. | Che la tavola 7 sia stata incisa da Nerea in vecchiaia. | `Q-10` |
| `A-06` | Hadi | Vasaio, custode della prima pozza | Piane di Sal | nessuna | I canti di Sefa e Maro. | Che il fucsia sia il colore del mana "arrabbiato" (la credenza di Sefa). | `Q-01` |
| `A-07` | Odile Brann | Capitana del Firewall, discendente di Thessaly | Kesh | Firewall Arcano | La versione del Firewall sul Secondo Rogo. | Che l'Overclock abbia contribuito al Rogo. | `Q-10` |
| `A-08` | Nilo Sarto | Apprendista di Dario Venn, mani segnate | Kesh | Overclock Runico | Le frequenze delle rune. | Che il Tempo Comune sia una "frenata" imposta per invidia. | `Q-05`, `Q-10` |
| `A-09` | Saba Calder | Distributrice del Bus di Mana | Piane di Sal | Bus di Mana | La rete dei condotti, i luoghi dove il mana "si perde". | Che nulla vada perduto nella Catalisi. | `Q-11` |
| `A-10` | Il Discepolo | Ultimo allievo di Aurel Maskh, senza nome | Il Nocciolo | Kernel Elementale | L'ultima lettera; la stanza chiusa. | `[CANONE APERTO]` Che Aurel abbia trovato la Luce. Non va confermato. | `Q-13` |
| `A-11` | Rask il Coniatore | Maestro della Zecca dell'Arena | Arena | Arbitrato | Come si coniano i BitRune dal residuo dei Segni. | Che i BitRune siano "puliti" (senza eco). | `Q-11` |
| `A-12` | Livia Strand | Tracciatrice Nuda, nomade | Zone del Silenzio | Tracciatori Nudi | Che i Leggendari sono echi di ultimi cerchi. | Che **tutti** i Linker siano ultimi cerchi (il canone dice "quasi sempre", e solo per i Leggendari). | `Q-11` |

### Fazioni

Salvo il campo *Canone*, ogni dettaglio è `[PROPOSTA]`.

#### F-01 — Custodi della Soglia
- **Canone:** eredi della scuola di Sefa; scoprirono di poter rivedere il Lettore; registrano le Revisioni nelle Cronache; non spiegarono il Lungo Silenzio; tentarono il Volto Abbandonato; imposero il Patto delle Dieci e delle Sessanta.
- **Filosofia:** la Tela deve essere uguale per tutti. L'ordine è giustizia.
- **Obiettivi:** mantenere il monopolio delle Revisioni; proteggere il segreto di come avvengono.
- **Rapporti:** tollerano i Connettori (li considerano esecutori); arbitrano le Fonderie; temono i Tracciatori Nudi (perché ricordano il Tempo Selvatico).
- **Linker:** li hanno accettati con riserva; le obiezioni sul Critico sono scritte a margine delle Cronache.
- **Lettore:** sostengono di scriverne le leggi (`P-17`).
- **Personaggi:** `P-17`, `A-01`; DrIce firma le loro Cronache, ma non è riconosciuto come membro.
- **Luoghi:** Atrio, Primo Laboratorio, Bacheca.
- **Simbolo:** il Cerchio in Attesa (fucsia) con una soglia orizzontale.
- **Conflitti:** il segreto del Lungo Silenzio; la questione dell'Autore.
- **Quest:** `Q-08`, `Q-15`, `I-13`.

#### F-02 — Connettori
- **Canone:** gilda di ingegneri ai margini dei Custodi; costruirono Archivio, Arbitro, Manichino; studiarono il Lettore come un comparatore; con la folgore impararono i circuiti; chiamano il suono del Substrato "Rumore".
- **Filosofia:** tutto ciò che funziona si può misurare.
- **Obiettivi:** mantenere la Rete; capire il Rumore.
- **Rapporti:** fornitori delle Fonderie; si sentono sottovalutati dai Custodi.
- **Linker:** ne conoscono il funzionamento meglio di chiunque, ma non l'origine profonda degli echi.
- **Lettore:** lo considerano un meccanismo, non una coscienza.
- **Personaggi:** `P-07`, `P-10`, `A-02`. `[DA DECIDERE]` gli **Archivisti** (citati in `LORE.md`: "nemmeno gli Archivisti possono leggerla") sono un ramo dei Connettori o un ordine a sé.
- **Luoghi:** Archivio Ardente, Osservatorio delle Frequenze, Arena (manutenzione).
- **Simbolo:** due cerchi uniti da un segmento.
- **Colpe storiche (nascoste):** la Dispersione delle Vie (`BM-03`), la prima Arena (`B-01`).
- **Quest:** `Q-03`, `Q-05`, `Q-08`, `Q-09`.

#### F-03 — Firewall Arcano (verde acqua)
- **Canone:** fondato da Thessaly Brann dopo il Secondo Rogo di Kesh; i suoi Linker sono muri; 2 pezzi HP +15%, 4 pezzi difesa da tutti gli elementi +10%; rivale dell'Overclock.
- **Filosofia:** resistere è vincere. **Obiettivi:** che nessun Rogo si ripeta.
- **Linker:** li producono. **Lettore:** indifferenti, purché le regole tengano.
- **Personaggi:** `P-12`, `A-07`. **Luoghi:** Kesh (muri tagliafuoco). **Simbolo:** un muro di mattoni tra due fiamme.
- **Nemici:** l'Overclock (lo accusano di "accendere" ciò che non si spegne).
- **Quest:** `Q-10`.

#### F-04 — Overclock Runico (arancio)
- **Canone:** fondato da Dario Venn; runa oltre la frequenza; Linker instabili e caldi; 2 pezzi ATK +12%, 4 pezzi Tasso CRIT +10%.
- **Filosofia:** il limite è un'opinione. **Obiettivi:** superare il Soffitto con la velocità.
- **Lettore:** lo considerano un limite da forzare.
- **Personaggi:** `P-13`, `A-08`. **Luoghi:** forge a Kesh. **Simbolo:** una runa che fonde.
- **Conflitti:** il Tempo Comune è per loro una ferita (rallentò i "veloci").
- **Quest:** `Q-05`, `Q-10`.

#### F-05 — Bus di Mana (azzurro)
- **Canone:** fondato da Ione Calder; *omnibus*; 2 pezzi rigenerazione +20%, 4 pezzi consumo −10%; rivale silenzioso del Kernel.
- **Filosofia:** il mana è di tutti. **Obiettivi:** distribuire. **Linker:** li vendono al prezzo più basso possibile.
- **Personaggi:** `P-14`, `A-09`. **Luoghi:** Piane di Sal, condotti. **Simbolo:** tre linee che si uniscono in una.
- **Conflitti:** la Catalisi (chiedono che il Quinto che scende sia "restituito" in qualche forma).
- **Quest:** `Q-11`.

#### F-06 — Kernel Elementale (viola)
- **Canone:** fondato da Aurel Maskh; il nocciolo degli elementi; 2 pezzi Bonus DMG di tutti gli elementi +10%, 4 pezzi DMG CRIT +25%.
- **Filosofia:** scavare fino al centro. **Obiettivi:** ritrovare Aurel o ciò che ha trovato.
- **Lettore:** credono che nasconda forme (l'ultima lettera di Aurel).
- **Personaggi:** `P-15`, `A-10`. **Luoghi:** Il Nocciolo. **Simbolo:** un seme dentro un guscio aperto.
- **Conflitti:** interni (chi vuole aprire la stanza chiusa e chi no).
- **Quest:** `Q-13`.

#### F-07 — Tracciatori Nudi
- **Canone:** rifiutano i Linker; combattono con i soli Segni; considerano il Critico una violenza, le Estrazioni un'usura, la Catalisi una profanazione; "L'Arena conia le monete con cui si comprano le armi dell'Arena"; quando uno di loro vince, l'Arena tace.
- **Filosofia:** la magia è un gesto, non un oggetto. **Obiettivi:** testimoniare; non convertire.
- **Linker:** rifiuto totale. **Lettore:** lo rispettano come un interlocutore, non un servo.
- **Personaggi:** `A-12`. **Luoghi:** Zone del Silenzio, margini delle regioni. **Simbolo:** una mano aperta, vuota.
- **Alleati:** a volte i Reattivisti. **Nemici:** nessuno dichiarato; disprezzati dalle Fonderie.
- **Conflitti:** sanno (o credono di sapere) l'origine dei Leggendari.
- **Quest:** `Q-11`.

#### F-08 — Reattivisti `[PROPOSTA]`
- **Base canonica:** Nerea Solt è chiamata "la Reattivista".
- **Filosofia:** le leggi della Tela si scoprono provandole, non scrivendole.
- **Personaggi:** `P-08`, `A-05`. **Luoghi:** la Cava. **Simbolo:** due cerchi che si toccano con una scintilla.
- **Conflitti:** con i Custodi (che "scrivono" ciò che i Reattivisti hanno scoperto rischiando la vita).
- **Quest:** `Q-10`.

#### F-09 — L'Arbitrato dell'Arena `[PROPOSTA]`
- **Base canonica:** l'Arbitro, la Coda, la Zecca dell'Arena, la Classifica, il Conteggio dei Presenti.
- **Natura:** non una fazione ideologica, ma un'istituzione: chi custodisce i duelli.
- **Personaggi:** `A-03`, `A-11`. **Luoghi:** Arena. **Simbolo:** un cerchio diviso a metà da una linea verticale.
- **Quest:** `Q-03`, `Q-07`.

### Matrice delle interpretazioni

Lo stesso evento raccontato da fonti diverse. È la materia prima del sistema degli indizi (sezione 12). Le celle sono `[PROPOSTA]`.

| Evento | Custodi | Connettori | Fonderie | Tracciatori Nudi | Verità `[DEV]` |
|---|---|---|---|---|---|
| I Doppi | "Anomalie risolte dalla Nona Revisione." | "Porte mai chiuse. Errore di connessione." | Silenzio. | "La Rete ti ruba l'anima a pezzi." | Sessioni duplicate e connessioni cadute (`BM-01`). |
| La Guerra dei Campi Ciechi | "Un'ingiustizia sanata dalla Convenzione." | "Nessuno aveva previsto Campi diversi." | "Ha fatto nascere il bisogno di Linker." | "La prima guerra delle macchine." | Arena non condivisa tra schermi diversi (`BM-02`). |
| Le Revisioni | "Le scriviamo noi." | "Le eseguiamo noi." | "Le subiamo." | "Le fa qualcun altro." | `[PROTETTO]` (`M-01`, `M-03`). |
| L'origine dei Linker | Ufficialmente: "risonanze del Substrato". | "Echi cristallizzati dal Rumore." | "Sintonia." | "Morti altrui." | Echi di cerchi dissolti `[CANONE]`; per i Leggendari "quasi sempre" ultimi cerchi `[CANONE APERTO]`. |
| La Catalisi | "Necessaria." | "Il Quinto torna nel Substrato." | "Riciclo." | "Seconda morte." | `[PROTETTO]` (`M-12`). |
| Il Critico | "Accettato con riserva." | "Allineamento tra circuito e runa." | "Il nostro prodotto migliore." | "Violenza." | Meccanica introdotta con i Linker. |
| Il Lungo Silenzio | "Studio." | "I Custodi si sono divisi." | "Non c'eravamo ancora." | "Il Lettore ha smesso di rispondere." | `[PROTETTO]` (`M-06`). |
| Il Secondo Rogo | "Un duello senza regole." | "Un difetto delle cessioni." | Firewall: "colpa dei duellanti"; Overclock: "colpa del Firewall che non c'era". | "Avidità." | Il difetto della copia fantasma `[PROPOSTA]` (`MB-04`). |

---

## 7. Bestiario

Tutte le entità sono `[PROPOSTA]`, tranne i nomi già presenti in `LORE.md` (indicati nel campo *Trasposizione*). Il rango è calcolato con la rubrica della sezione 8 (**IG** = Indice di Gravità, da 0 a 13). Tutti i numeri sono `[DA BILANCIARE]`.

**Perché esistono** (vale per tutte le entità nate da un difetto): Principio della Persistenza (R2). La Revisione ha corretto la legge, ma ciò che il difetto aveva già prodotto è sprofondato nel Substrato e riaffiora dove il Lettore legge peggio.

### Boss maggiori

#### BM-01 — Il Doppio
- **Categoria:** Boss maggiore (IG 12).
- **Bug originale:** il giocatore "fantasma" del matchmaking. Una sessione duplicata (stesso utente connesso due volte, o connessione caduta senza chiusura dietro il proxy del server) restava in coda e veniva abbinata ad altri giocatori, rubando le partite.
- **Evento originale:** primo tentativo il 2025-11-13 (`c753079`, "Fix matchmaking bug? Not sure"; changelog 0.7: "Primo tentativo di correzione del matchmaking"). Il difetto sopravvive per tutto il Lungo Silenzio. Risolto il 2026-10-01 (`9de6345`) con un heartbeat ogni 25 secondi e la chiusura della sessione precedente (changelog 0.9).
- **Trasposizione nella lore:** `[CANONE]` i Doppi (Libro V, cap. 21), il Battito, "chi non risponde viene reciso", la seconda porta che chiude la prima, gli avvistamenti notturni in Coda.
- **Origine:** i Doppi recisi dal Battito non furono distrutti. Sprofondarono sotto la Coda e, nella Coda Vecchia dell'Arena Muta, si fusero in un'unica entità: la somma degli echi di tutti i caster che non chiusero mai la propria porta.
- **Aspetto:** una sagoma di caster con **due contorni che non coincidono**, come un Corpo e un Cursore disallineati. Al posto del volto, un Cerchio Personale: le rune dell'anello sono il **nome del giocatore**, nella Fila che il giocatore ha scelto. Le sue magie **non hanno il Rossore**: hanno i colori del giocatore.
- **Comportamento:** attende, immobile, in posa da Coda. Si muove solo quando il giocatore si ferma. Copia, non inventa.
- **Meccaniche:**
  1. *La Coda* — all'inizio il Doppio non c'è. Il giocatore deve "mettersi in Coda" su un cerchio a terra; dai lati emergono Doppi Minori (`N-09`) identici tra loro.
  2. *Sessione Doppia* — il Boss si divide in due. Una copia è "aperta" (reale), l'altra "chiusa": colpire quella chiusa cura quella aperta.
  3. *Il Battito* — a intervalli regolari (nella lore: ogni venticinque battiti; nel combattimento accorciato a 8 s `[DA BILANCIARE]`) un'onda chiede "ci sei?". Solo la copia reale risponde con un anello di luce.
  4. *Furto del Duello* — se il giocatore richiama una pagina del Grimorio, il Doppio la legge e la usa a sua volta ("ogni pagina aperta è una pagina letta").
- **Attacchi / abilità:** *Eco* (ripete l'ultima magia del giocatore un battito dopo); *Furto* (lancia l'ultimo cerchio del Grimorio usato dal giocatore); *Coda Fantasma* (Doppi Minori che bloccano la strada); *Recisione* (se il giocatore manca due Battiti, il suo Corpo e il suo Cursore si disallineano per qualche istante).
- **Debolezze:** il Battito rivela la copia reale; il `R-25` Registro del Battito lo fa suonare a comando; chi non usa il Grimorio non gli lascia niente da rubare.
- **Ambiente:** il fondo della Coda Vecchia, sotto l'Arena Muta (`L-05`).
- **Importanza narrativa:** la paura di essere sostituiti dalla propria eco. Anticipa la questione morale dei Linker (portare l'eco di qualcun altro).
- **Ricompensa:** set `S-01` Eco di Sessione; `R-19` Pietra del Forse (se non trovata prima); l'ultimo frammento di `Q-03`.
- **Collegamenti:** `F-02`, `F-09`, `A-02`, `A-03`, `L-05`, `B-01`, `M-07`, il Lungo Silenzio.
- **Come il giocatore lo scopre:**
  - *NPC:* Mira Kell giura di averne visto uno; Tilde Varro dice che sono estinti.
  - *Iscrizioni:* "Sigillato? Non ne sono certo." (`R-19`), incisa da un Connettore anonimo.
  - *Oggetti:* il Registro del Battito, che segna "venticinque".
  - *Nemici:* i Doppi Minori stanno fermi in posa da Coda e non attaccano finché il giocatore non si ferma.
  - *Boss:* l'anello del volto porta il nome del giocatore. Il giocatore capisce che il Doppio non è il fantasma di un morto, ma l'eco di un vivo: di chiunque abbia lasciato una porta aperta.

#### BM-02 — Il Vasto
- **Categoria:** Boss maggiore (IG 11).
- **Bug originale:** nell'arena PvP ogni giocatore vedeva il proprio schermo. Chi aveva uno schermo più grande poteva lanciare magie in zone che l'avversario non vedeva.
- **Evento originale:** difetto attivo dal PvP (0.6) fino al 2026-10-01: arena quadrata condivisa, lato predefinito 800 (`9de6345`, "Fix arena area (sadly)"; changelog 0.9). Soluzione definitiva il 2026-10-06: il rettangolo d'intersezione dei due schermi (changelog 0.12).
- **Trasposizione nella lore:** `[CANONE]` la Guerra dei Campi Ciechi; la Convenzione dell'Intersezione; il Quadrato (Rev IX); il Campo d'Intersezione (Rev XII).
- **Origine:** quando la Convenzione impose il Campo d'Intersezione, le porzioni di Tela fuori dall'intersezione restarono "di nessuno". Ciò che vi era stato tracciato durante la Guerra — magie lanciate dove l'altro non poteva vedere — si raccolse in un'unica volontà che vive nei margini.
- **Aspetto:** il Vasto non entra mai interamente nella visuale. Se ne vedono solo arti e bordi che spuntano dai margini, come una cornice viva. Il suo occhio è sempre appena oltre il bordo.
- **Comportamento:** paziente, opportunista. Attacca solo da dove il giocatore non guarda.
- **Meccaniche:**
  1. *Colpo dal Margine* — le magie arrivano da fuori dalla visuale. L'unico preavviso è un lampo sul bordo dello schermo, lo stesso del Presagio.
  2. *Fase del Quadrato* — attivando le quattro Pietre della Convenzione (`R-26`) il giocatore impone un campo quadrato **più piccolo** della propria visuale. Il Vasto viene trascinato dentro, ma anche il giocatore perde spazio: è un compromesso, accettato con rammarico.
  3. *Fase dell'Intersezione* — trovando l'ultimo testo della Convenzione (la versione della Rev XII), il campo diventa il rettangolo più grande possibile: il Vasto è interamente visibile e vulnerabile.
- **Attacchi / abilità:** *Colpo dal Margine*; *Campo Stretto* (restringe la visuale del giocatore con una vignettatura scura); *Area Oltre il Bordo* (aree tracciate dove il giocatore non vede).
- **Debolezze:** dentro l'Intersezione è lento ed esposto; non può attaccare da dove il giocatore guarda.
- **Ambiente:** i Campi Ciechi (`L-06`).
- **Importanza narrativa:** la prima ingiustizia della Tela regolata; il motivo per cui ogni duello moderno si combatte nel Campo d'Intersezione.
- **Ricompensa:** set `S-02` Viewport Cieco; il testo completo della Convenzione.
- **Collegamenti:** `F-01`, `F-09`, `A-04`, `R-26`, `I-02`, il Lungo Silenzio.
- **Come il giocatore lo scopre:** la testimonianza di Amsel ("mi colpivano dal nulla"); le Pietre con il numero ottocento e il segno di rammarico; i campi da duello di dimensioni diverse sovrapposti; il comportamento stesso del Boss, che rende letterale l'espressione "Campi Ciechi".

#### BM-03 — Il Viandante delle Vie Sbagliate
- **Categoria:** Boss maggiore (IG 11).
- **Bug originale:** dopo il primo deploy, percorsi e import dei moduli sbagliati: file spostati dentro e fuori dalla cartella `public`, import cambiati più volte, il modulo della barra del mana importato con il nome sbagliato, link da rendere assoluti. Il gioco online non si caricava.
- **Evento originale:** circa dodici commit tra il 2025-06-18 e il 2025-06-19, tra cui "Move files to correct paths (I SWEAR)" (`13a67be`); recidiva il 2025-11-12 ("modify files path for deploy" `d4e6510`, "Second try" `00d1090`). Changelog 0.4: "Percorsi e import dei moduli dopo il deploy".
- **Trasposizione nella lore:** **nessuna in `LORE.md`.** `[PROPOSTA]` da integrare nella Revisione IV: **la Dispersione delle Vie**. Mentre i Connettori costruivano la Rete, tutto ciò che vi viaggiava arrivava nel posto sbagliato: messaggi, strade, persino edifici. I Connettori giurarono più volte di aver rimesso ogni cosa al suo posto. Il difetto tornò per un breve periodo prima della Settima Revisione.
- **Origine:** le cose spostate nel posto sbagliato e mai rimesse a posto si sono raccolte attorno a un unico viandante, che non sa più da dove viene.
- **Aspetto:** un pellegrino incappucciato che porta un fascio di cartelli stradali, tutti rivolti in direzioni diverse; al posto del corpo, una sequenza di porte. Le sue orme vanno in una direzione diversa da quella in cui cammina. Porta una lanterna con scritto "pubblico".
- **Comportamento:** cortese, confuso, ostinato. Promette sempre la strada giusta.
- **Meccaniche:** è un Boss-labirinto. Teletrasporta il giocatore e i suoi cerchi; riordina le uscite dell'arena; i proiettili del giocatore escono da una porta diversa da quella in cui entrano. Per vincere il giocatore deve imporre il **Sentiero Assoluto**: attivare le pietre-indirizzo partendo dalla **Radice**, al centro, e procedendo verso l'esterno nell'ordine giusto. Ogni pietra attivata fissa una parte dell'arena.
- **Attacchi / abilità:** *Rinvio* (il proiettile del giocatore riemerge altrove); *Spostamento* (il cerchio magico del giocatore ricompare in un altro punto); *Giuramento* (indica una strada sicura che non lo è); *Seconda Prova* (se sconfitto prima di aver attivato tutte le pietre, ritorna).
- **Debolezze:** la Mappa della Clessidra di Oda Nerys (`R-06`) mostra le vie vere; le cose ancorate alla Radice non possono essere spostate.
- **Ambiente:** le Vie Sbagliate (`L-16`).
- **Importanza narrativa:** la Rete non è nata perfetta; i Connettori hanno una colpa storica che non raccontano.
- **Ricompensa:** set `S-03` Sentiero Assoluto; `R-20` Giuramento delle Vie; il ritrovamento del Sigillo della Cornice (`R-33`).
- **Collegamenti:** `F-02`, `P-06`, `L-10`, `L-16`, `I-14`.
- **Come il giocatore lo scopre:** edifici di una regione trovati in un'altra; un'iscrizione "Questa volta ogni cosa è al suo posto. Lo giuro." ripetuta tre volte da mani diverse; il Sigillo della Cornice archiviato sotto un nome sbagliato; il comportamento del Boss, che sposta ciò che il giocatore crea.

### Boss

#### B-01 — L'Atteso
- **Categoria:** Boss (IG 10).
- **Bug originale:** la prima arena non funzionava: il server WebSocket non era raggiungibile (URL del servizio sbagliato, import del modulo `ws` mancante) e mancavano ancora matchmaking e gestione del PvP.
- **Evento originale:** primi file dell'arena il 2025-06-13 (`6b32547`); correzioni il 2025-06-16/18 (`79320f8`, `cb0ddf5`, `f883986`); PvP funzionante solo dal 2025-06-24/26 (`4f2c0ff`, `a5b2612`). Changelog 0.4: "Prima versione dell'arena (non ancora funzionante)".
- **Trasposizione nella lore:** `[CANONE]` l'Arena Muta, le porte aperte su un campo vuoto, l'avversario che non arriva mai.
- **Origine:** tutta l'attesa dei caster nell'Arena Muta, condensata. È l'avversario che non arrivò.
- **Aspetto:** una sagoma di duellante sul lato opposto del campo, senza Cursore. Non è mai dove il giocatore guarda; si intravede solo con la coda dell'occhio.
- **Comportamento:** aspetta. Risponde solo quando il rito del duello è completo.
- **Meccaniche:** l'Atteso non compare finché il giocatore non ripara **il Primo Messaggio**: tre condizioni sparse nell'Arena Muta (*l'indirizzo giusto*, *la voce* — il modulo che mancava, *la Coda*). Solo allora il giocatore può dire "Sono pronto" e l'Atteso risponde. Combatte **con le sole magie della Fondazione** (cerchio, i quattro elementi, Linea, Clessidra): niente folgore, niente laser, niente Reazioni.
- **Attacchi / abilità:** *Silenzio* (durante lo scontro la Tela non ha voce: nessun suono, nemmeno quello delle magie del giocatore); *Attesa* (più il giocatore esita, più forte sarà il suo primo colpo); *Senza Rossore* (le sue magie hanno colori normali: si confondono con quelle del giocatore, perché nella Rev IV il Rossore non esisteva ancora).
- **Debolezze:** non conosce la folgore né la Cavità; non sa reagire alle Reazioni.
- **Ambiente:** Arena Muta (`L-05`).
- **Importanza narrativa:** la nascita del duello; perché esistono la Coda, l'Arbitro e il rito.
- **Ricompensa:** set `S-04` Socket Muto; il Conteggio dei Presenti dell'Arena Muta passa da 0 a 1.
- **Collegamenti:** `F-02`, `F-09`, `MB-01`, `BM-01`, `I-04`.
- **Come il giocatore lo scopre:** il Conteggio fermo a 0; i sedili consumati da un'attesa lunghissima; i racconti delle madri ("finisci nell'Arena Muta"); i tre pezzi del Primo Messaggio.

#### B-02 — La Spirale
- **Categoria:** Boss (IG 9).
- **Bug originale:** difetto di design: ogni livello aumentava automaticamente mana massimo e rigenerazione, quindi i giocatori più avanti diventavano più forti senza scegliere nulla.
- **Evento originale:** in vigore dalla 0.2 (esperienza e livelli) alla 0.10 (`302ac09`, "New stats system"): "Il livello non aumenta più mana massimo e rigenerazione"; nascono i punti abilità.
- **Trasposizione nella lore:** `[CANONE]` la Spirale e la Riforma dei Livelli (cap. 24).
- **Origine:** la crescita automatica accumulata da tutti i caster prima della Riforma, rimasta senza padrone.
- **Aspetto:** una colonna di anelli di luce che salgono a spirale, sempre più larghi. In cima, un numero di livello che cresce.
- **Comportamento:** non attacca molto. Cresce.
- **Meccaniche:** ogni pochi secondi la Spirale **sale di livello**: la sua barra dell'esperienza è visibile, e a ogni livello aumentano automaticamente vita, mana e rigenerazione. Il giocatore non può superarla in una gara di forza. Per vincere deve compiere la **Riforma**: distruggere i quattro pilastri dei Quattro Assi (Vitalità, Forza, Riserva, Parsimonia). Da quel momento ogni livello della Spirale diventa un Punto Abilità *non speso*: la Spirale è piena di possibilità e senza potere.
- **Attacchi / abilità:** *Livello* (cresce); *Misura* (mostra al giocatore il proprio livello e lo confronta col suo); *Spira* (un'onda che si allarga a ogni livello).
- **Debolezze:** dopo la Riforma, la sua vita resta quella dell'ultimo livello raggiunto.
- **Ambiente:** la Torre della Misura, a Kesh (`L-12`).
- **Importanza narrativa:** il potere che cresce da solo è un'ingiustizia; la libertà di scegliere vale più della forza.
- **Ricompensa:** set `S-05` Loop a Spirale.
- **Collegamenti:** `F-01`, Rev II (la Misura), Rev X, `I-06`.
- **Come il giocatore lo scopre:** registri della Torre con i livelli dei caster prima della Riforma; un NPC anziano che rimpiange "quando bastava crescere"; il comportamento del Boss.

#### B-03 — Lo Sfasato
- **Categoria:** Boss (IG 8).
- **Bug originale:** proiettili, mana ed effetti di stato erano legati alla frequenza dello schermo: a 144 Hz tutto andava più veloce che a 60 Hz.
- **Evento originale:** difetto attivo dalla 0.2 alla 0.11 (2026-10-03); correzione con un fattore di scala sul tempo reale trascorso. Changelog 0.11.
- **Trasposizione nella lore:** `[CANONE]` il Disallineamento delle Frequenze; il Tempo Comune.
- **Origine:** tutto ciò che corse "troppo veloce" prima del Tempo Comune.
- **Aspetto:** una figura che si muove a scatti e lascia dietro di sé copie ferme di ogni posa, come fotogrammi. Il suo corpo è circondato da un quadrante con sessanta tacche, che gira troppo in fretta.
- **Comportamento:** impaziente; agisce più volte di quanto il giocatore riesca a reagire.
- **Meccaniche:** lo Sfasato vive a una frequenza diversa: agisce circa 2,4 volte più spesso del giocatore (144/60). Sul pavimento ci sono **Quadranti del Tempo Comune**: dentro di essi lo Sfasato viene riportato alla frequenza del giocatore. Nella seconda fase accelera anche le Afflizioni che infligge.
- **Attacchi / abilità:** *Fotogramma* (lascia copie che esplodono); *Raffica* (proiettili più veloci del normale); *Accelerazione* (le Afflizioni subite dal giocatore scadono più tardi).
- **Debolezze:** dentro i Quadranti è vulnerabile; rompere il suo quadrante lo blocca per alcuni secondi.
- **Ambiente:** l'Osservatorio delle Frequenze, sull'Orlo (`L-15`).
- **Importanza narrativa:** un'ingiustizia invisibile, nascosta nel tempo stesso.
- **Ricompensa:** set `S-06` Frequenza del Battito; `R-23` Quadrante del Tempo Comune.
- **Collegamenti:** `F-02`, `F-04`, `P-09`, `P-13`, `A-08`, `I-05`.
- **Come il giocatore lo scopre:** registri dell'Osservatorio con duelli vinti sempre dagli stessi caster; strumenti di misura che danno numeri diversi a seconda di chi li legge; Nilo Sarto che chiama il Tempo Comune "una frenata imposta per invidia".

#### B-04 — Il Perimetro Cieco
- **Categoria:** Boss (IG 8).
- **Bug originale:** nel PvP le aree spaziali dell'avversario potevano non essere visibili.
- **Evento originale:** difetto nato presumibilmente con la gestione PvP delle aree (`5319a2f`, 2025-06-27; origine dedotta, non verificata), corretto il 2025-11-11 (`61851c2`, "Fix enemy areas not visible"; changelog 0.7).
- **Trasposizione nella lore:** `[CANONE]` i "duelli al buio" (cap. 18).
- **Origine:** le aree dei duelli al buio non sono mai state viste da nessuno, e quindi nessuno le ha mai sciolte. Sono rimaste.
- **Aspetto:** invisibile. Si manifesta soltanto come una distorsione ai bordi delle sue aree e come un **ronzio**.
- **Comportamento:** traccia aree invisibili e aspetta che il giocatore ci entri.
- **Meccaniche:** l'arena è piena di aree invisibili. Il giocatore le individua **con l'udito** (ogni area ronza: la Settima Revisione diede voce alla Tela nello stesso momento in cui rese visibili le aree), con le particelle delle Afflizioni che compaiono su di lui, o tracciando a sua volta aree che reagiscono con quelle nascoste.
- **Attacchi / abilità:** *Perimetro* (traccia un'area invisibile sotto il giocatore); *Buio* (spegne per un attimo gli effetti visivi delle magie del giocatore); *Epitaffio* (ogni caduto del Recinto lascia un'area permanente).
- **Debolezze:** il suono; le Reazioni (un'area d'acqua tracciata sopra un'area di fuoco nascosta la rivela).
- **Ambiente:** il Recinto Oscuro (`L-07`).
- **Importanza narrativa:** il motivo per cui la Tela ha bisogno di una voce.
- **Ricompensa:** set `S-07` Render Velato.
- **Collegamenti:** Rev VII, `L-07`, `L-19`.
- **Come il giocatore lo scopre:** epitaffi ("morto senza vedere niente"); il ronzio nel Recinto; il fatto che nelle Zone del Silenzio (rimaste alla Rev VII) le aree si vedono.

#### B-05 — L'Incisione Contesa
- **Categoria:** Boss (IG 8).
- **Bug originale:** salvataggi in conflitto: letture e scritture concorrenti sul profilo del giocatore si sovrascrivevano a vicenda, e i progressi potevano andare persi.
- **Evento originale:** difetto attivo dai primi salvataggi su Firestore (0.4); correzione nella 0.8 ("salvataggi in conflitto"): esperienza, livello e mana tenuti in memoria e salvati da un solo punto. Nella Rev XIII le missioni usano incrementi atomici invece delle transazioni, che durante il combattimento verrebbero rifiutate.
- **Trasposizione nella lore:** `[CANONE]` "i salvataggi dell'Archivio smisero di contraddirsi l'un l'altro" (Rev VIII).
- **Origine:** ogni incisione che l'Archivio fece e poi cancellò sovrascrivendola. Due mani che scrivono sulla stessa pietra.
- **Aspetto:** una lastra di pietra incandescente su cui due mani scrivono contemporaneamente. Il testo tremola tra due versioni.
- **Comportamento:** riscrive ciò che il giocatore fa.
- **Meccaniche:** l'Incisione contende lo stato del giocatore: la sua Cornice oscilla tra due valori, e vince l'ultimo scritto. Anche la vita del Boss è contesa: i danni inflitti vengono annullati se non sono **fissati** su una delle pietre-terminale dell'arena (un'azione unica, che non può essere interrotta: un'incisione atomica).
- **Attacchi / abilità:** *Sovrascrittura* (riporta un valore del giocatore a com'era pochi secondi prima); *Doppia Mano* (due attacchi simultanei, ne conta solo uno); *Perdita* (cancella le cariche non lanciate del cerchio del giocatore).
- **Debolezze:** le azioni atomiche; la Legge del Padrone (le magie permanenti del giocatore non possono essere riscritte).
- **Ambiente:** gli strati intermedi dell'Archivio Ardente (`L-10`).
- **Importanza narrativa:** la memoria della Tela può sbagliare; l'Archivio non è infallibile.
- **Ricompensa:** set `S-08` Incisione Atomica.
- **Collegamenti:** `F-02`, `EL-07`, `MB-02`, `R-17`, `I-08`.
- **Come il giocatore lo scopre:** pareti dell'Archivio con nomi incisi due volte con valori diversi; un Archivista che mostra il livello di un caster scritto in due modi; il comportamento del Boss.

### Miniboss

#### MB-01 — L'Ospite di Casa
- **Categoria:** Miniboss (IG 7).
- **Bug originale:** il client di produzione si collegava al server locale (`ws://localhost:8080`) invece che a quello online: nessun giocatore poteva entrare nell'arena.
- **Evento originale:** corretto il 2025-11-13 (`ed57d63`). Lo stesso indirizzo era già stato sbagliato e corretto a giugno (`cb0ddf5`). `[DEV]` Il messaggio del commit è un insulto rivolto dallo sviluppatore a sé stesso (vedi sezione 19).
- **Trasposizione nella lore:** nessuna in `LORE.md`. `[PROPOSTA]` Poco prima della Settima Revisione, il Varco verso l'Arena riportò per un breve periodo ogni caster **a casa propria**: si entrava per duellare e ci si ritrovava, soli, nel luogo da cui si era partiti.
- **Origine:** l'eco di quel Varco rivolto all'indietro.
- **Aspetto:** un padrone di casa gentile, in piedi su una soglia. Il suo volto è la facciata di una casa. Ogni porta che apre conduce al punto di partenza del giocatore.
- **Comportamento:** ospitale, cerimonioso, impossibile da superare.
- **Meccaniche:** ogni uscita riporta il giocatore all'inizio dell'area. Per uscire dal ciclo il giocatore deve trovare due leve, "Casa" e "Arena", e invertirle: una si spegne, l'altra si accende.
- **Attacchi / abilità:** *Bentornato* (riporta il giocatore all'ingresso); *Porta di Casa* (crea copie dell'ingresso).
- **Debolezze:** l'indirizzo giusto.
- **Ambiente:** l'atrio dell'Arena Muta (`L-05`).
- **Ricompensa:** Catalizzante; `R-21` Iscrizione della Vergogna; accesso alla Coda Vecchia.
- **Collegamenti:** `B-01`, `BM-03` (stessa famiglia di difetti), `I-07`.
- **Come il giocatore lo scopre:** l'iscrizione accanto alle leve: *"Sono stato uno sciocco."*

#### MB-02 — Il Cumulo
- **Categoria:** Miniboss (IG 6). Gigantesco, ma non pericoloso: **la grandezza non è gravità**.
- **Bug originale:** le dipendenze (`node_modules`) committate nel repository: migliaia di file ereditati che appesantivano tutto.
- **Evento originale:** prima rimozione il 2025-06-13 (`05d4f7d`); i file ricompaiono; seconda rimozione il 2026-09-30 (`192ccb2`, "Commit digestion": **12.276 file, 1.555.906 righe**). Changelog 0.8: "node_modules rimossi dal repository".
- **Trasposizione nella lore:** `[CANONE]` "Dagli strati più profondi dell'Archivio furono bruciati i Cumuli: migliaia di frammenti ereditati da epoche precedenti, che nessuno usava più e che appesantivano ogni cosa." `[PROPOSTA]` I Cumuli furono bruciati una prima volta durante la Rete, e ricrebbero.
- **Aspetto:** un ammasso colossale di frammenti incisi in lingue straniere, che riempie il fondo dell'Archivio. Si muove con una lentezza geologica.
- **Comportamento:** quasi inerte. Schiaccia ciò che gli sta davanti, ricresce se ferito in superficie.
- **Meccaniche:** è una spugna di danni che rigenera. Per sconfiggerlo il giocatore deve trovare **l'Unico Registro**, il manifesto da cui i Cumuli dipendono, e "digerirlo". Dopo la Digestione il Cumulo crolla in cenere.
- **Attacchi / abilità:** *Peso* (rallenta tutto ciò che gli è vicino); *Ricrescita* (rigenera se la radice è intatta); *Dipendenza* (i frammenti si attaccano alle magie del giocatore e ne aumentano il costo in mana).
- **Ambiente:** il fondo dell'Archivio Ardente (`L-10`).
- **Ricompensa:** molto Catalizzante (meno un quinto, che "scende"); `R-24` Frammenti dei Cumuli.
- **Collegamenti:** Rev IV, Rev VIII, `B-05`, `I-08`.
- **Come il giocatore lo scopre:** cenere antica e cenere recente su due livelli diversi dell'Archivio (due roghi); i frammenti con nomi stranieri (ammiccamento di livello 3, solo nei Frammenti nascosti).

#### MB-03 — L'Orfano del Vincolo
- **Categoria:** Miniboss (IG 6).
- **Bug originale:** uscendo dal gioco (ESC, perdita del pointer lock) con un cerchio magico attivo, lo stato del gioco si corrompeva; il click per riprendere il controllo poteva lanciare magie.
- **Evento originale:** 2025-11-13 (`28622f6`, "force fix, not fully fixed"): la correzione forzata cancellava il cerchio. Changelog 0.7: "Uscita dal gioco con un cerchio magico attivo". Oggi, uscendo, si annullano solo le azioni a metà e il cerchio resta dov'è.
- **Trasposizione nella lore:** coerente con `[CANONE]` (cap. 15): quando il Vincolo si scioglie, ogni gesto a metà va perduto, ma il cerchio resta. `[PROPOSTA]` Prima che questa legge fosse fissata, i caster che lasciavano il Campo con un cerchio attivo lo lasciavano **orfano**. I Custodi li distrussero con la forza, ma non tutti.
- **Aspetto:** un cerchio magico che gira senza nessuno al centro. Le sue cariche partono a caso. Il colore è quello del suo elemento, sbiadito.
- **Comportamento:** cerca una mano. Si avvicina ai caster e prova a "legarsi".
- **Meccaniche:** **non può essere distrutto definitivamente** ("not fully fixed"): se sconfitto con la forza, ricompare. Per chiuderlo davvero, il giocatore deve **adottarlo**: tracciare dentro di lui un elemento (che lo rende suo) e poi scioglierlo con la Legge dell'Àncora.
- **Attacchi / abilità:** *Carica Orfana* (lancia una carica a caso); *Click di Rientro* (quando il giocatore riprende il controllo dopo una pausa, l'Orfano lancia).
- **Ambiente:** ovunque ci siano stati duelli interrotti: Campi Ciechi, Arena Muta, Zone del Silenzio.
- **Ricompensa:** Catalizzante; un cerchio orfano adottato come elemento decorativo del Cerchio Personale `[PROPOSTA]`.
- **Collegamenti:** `P-07` (il Vincolo), Rev VII.

#### MB-04 — Il Vento Inestinguibile
- **Categoria:** Miniboss (IG 6).
- **Bug originale:** un'area d'aria incendiata e ceduta all'avversario lasciava al proprietario originale una copia fantasma che non si poteva annullare.
- **Evento originale:** changelog 0.11 (2026-10-03): "Un'area ceduta (aria incendiata) non lascia più una copia fantasma non annullabile all'avversario".
- **Trasposizione nella lore:** `[CANONE]` (cap. 27) la copia fantasma. `[PROPOSTA — corrispondenza]` il Secondo Rogo di Kesh, in cui i venti incendiati "passavano di mano in mano finché nessuno riuscì più a scioglierli", fu reso possibile da questo difetto.
- **Aspetto:** un vortice di vento incendiato in cui tremolano due colori: quello di chi lo accese e quello di chi lo cedette.
- **Comportamento:** cambia padrone, e a ogni cambio si duplica.
- **Meccaniche:** quando il giocatore incendia una sua area d'aria, questa passa al giocatore (Legge 2 delle Reazioni) ma lascia una **copia fantasma** che ferisce entrambi e non si può sciogliere. Per vincere bisogna contenerla con i **muri tagliafuoco** del Firewall, fino a soffocarla.
- **Ambiente:** le Rovine del Secondo Rogo, a Kesh (`L-12`).
- **Ricompensa:** Catalizzante; `R-12` Mattone Tagliafuoco; apre `Q-10`.
- **Collegamenti:** `P-12`, `F-03`, `F-04`, `I-09`, `M-20`.
- **Come il giocatore lo scopre:** le cronache del Firewall ("nessuno riuscì a scioglierli") confrontate con un registro dei Connettori ("le cessioni lasciavano un residuo") e con il comportamento del Miniboss.

### Elite

| ID | Nome | IG | Bug originale | Lore | Ambiente | Meccanica-chiave | Debolezza | Scoperta |
|---|---|---|---|---|---|---|---|---|
| `EL-01` | La Scarica Totale | 5 | Lanciare una carica consumava tutte le cariche del cerchio (fix 0.8). | `[CANONE]` La Scarica Totale (Rev VIII). | Piane di Sal, strato della Rev II | Un cerchio carico di molte cariche che le scarica tutte in un colpo solo, dopo un lungo preavviso. | Dopo la scarica resta vuoto e vulnerabile. | Crateri a raggiera nelle Piane; un manuale della Fondazione che raccomanda "una carica alla volta". |
| `EL-02` | La Colata Cieca | 5 | Il danno del magma non usava la forza dei caster (`a97ae70`, "Dmg fix for magma"). | `[CANONE]` Il magma ferisce "con una forza pari alla media delle loro"; prima no. | Cava di Nerea Solt | Magma che infligge danni casuali, senza misura. | Una volta "misurato" (Bilancia di Nerea) infligge la media della forza del giocatore e della sua. | Tavola 6 di Nerea, corretta a margine. |
| `EL-03` | Il Riflesso Infinito | 4 | Il laser di folgore rimbalzava troppe volte e copriva mezza arena (commento in `engine.js`; limite portato a 1 rimbalzo). | `[CANONE]` "Nei primi esperimenti rimbalzava senza limiti." | Sala degli Specchi (Orlo) | Un raggio di folgore che rimbalza su ogni superficie finché non riempie la stanza. | Rompere gli specchi riduce i rimbalzi a uno. | Diario di Corva Lenzi. |
| `EL-04` | Il Tizzone Mancante | 4 | La bruciatura perdeva l'ultimo danno (fix 0.12). | `[CANONE]` L'Ultimo Tizzone. | Kesh | Brucia sempre due volte invece di tre e ruba il terzo tizzone delle bruciature del giocatore. | Completare il terzo colpo lo spegne. | Il Libro delle Ricalibrazioni: "da allora il fuoco brucia tre volte, non due". |
| `EL-05` | La Fioritura Amara | 4 | La rigenerazione del rigoglio era annullata dal costo dell'area (fix e logica 0.12). | `[CANONE]` La fioritura amara. | Oasi del Rigoglio (Holm–Piane) | Un'area rigogliosa che sembra curare, ma svuota la Cornice. | Tagliare le radici azzera il suo costo. | Caster che si lamentano di "piante che bevono". |
| `EL-06` | I Rifiutati | 4 | Il cerchio non era riconosciuto se disegnato dal basso; il proiettile solo in 8 direzioni (fix 0.11). | `[CANONE]` La Rosa degli Otto Venti; il cerchio dal basso. | Orlo (variante *Otto Venti*), ovunque (variante *dal Basso*) | *Otto Venti*: si muovono e sparano solo in 8 direzioni. *Dal Basso*: cerchi capovolti e incompiuti. | Le diagonali "intermedie"; i Segni tracciati dal basso. | La Rosa degli Otto Venti, con sole otto punte. |
| `EL-07` | Gli Incompiuti | 4 | Al login il profilo poteva mancare di alcuni campi (`8990aa1`, fix 0.6; prima correzione al login `ad1d81f`). | Nessuna in `LORE.md`. `[PROPOSTA]` Caster incisi nell'Archivio a metà. | Archivio Ardente, Atrio | Figure senza alcune parti (senza livello, senza affinità). Rubano temporaneamente una statistica al giocatore. | Non hanno difese elementali (manca il campo). | Nomi incisi a metà sulle pareti dell'Archivio. |

### Nemici

| ID | Nome | IG | Origine reale | Descrizione e comportamento | Ambiente |
|---|---|---|---|---|---|
| `N-01` | Cerchi Indelebili | 3 | Cancellazione del cerchio aggiunta e corretta subito (`b65409a`, `1e926d1`, 0.1). | Vecchi cerchi fucsia che non si sciolgono con il Disperdi normale; generano Fumi. Si sciolgono solo sovrapponendovi un cerchio nuovo (una mano regge un solo cerchio). | Piane di Sal, Primo Laboratorio |
| `N-02` | Cariche Mute | 2 | "Add non-functional multiple projectiles" (`f8e4486`, 0.2). | Sciami di piccoli sigilli di carica che orbitano senza fare nulla, finché non si attaccano al cerchio del giocatore e ne "ammutoliscono" una carica. | Piane di Sal |
| `N-03` | Spiriti d'Infusione | 3 | Il proiettile libero portava l'elemento di un cerchio scomparso (fix 0.8). | Fiammelle elementali che restano dove un cerchio si è dissolto e infondono un elemento a caso nei proiettili neutri del giocatore (con Reazioni impreviste). | Ovunque si sia combattuto |
| `N-04` | Lampo Bianco | 2 | Tema notte: lampo chiaro all'apertura delle pagine (fix 0.12). | Appare solo nel Regime della Notte, presso i Varchi; acceca per un istante chi li attraversa. | Varchi, di notte |
| `N-05` | Mani Trattenute | 3 | Il click su un'area spaziale bloccava il disegno (fix 0.8). | Mani che emergono dalle aree e trattengono il Cursore, impedendo di tracciare. | Recinto Oscuro, aree antiche |
| `N-06` | Scivolati | 3 | Il canvas non tornava nella posizione originale (`97b4c56`, 0.7). | Creature che spostano il terreno di qualche passo; gli oggetti vicini a loro non sono dove sembrano. | La Faglia, Campi Ciechi |
| `N-07` | Fumi | — | Meccanica, non bug: il Segno Mancato. | Sbuffi grigi nati dai tratti rifiutati dal Lettore. Rallentano il tracciamento di chi attraversano. | Ovunque, soprattutto nelle Vie Sbagliate |
| `N-08` | Manichini Selvatici | — | Tipi di nemico mai usati in `enemy.js` (`normal`, `heavy`, `dummy`). | Manichini di quadrati, normali, pesanti o inamovibili. Sconfitti, **non si rompono**: si scompongono in blocchi intatti che più tardi si ricompongono (`M-05`). | Terre Oltre il Campo |
| `N-09` | Doppi Minori | — | Frammenti di `BM-01`. | Sagome immobili in posa da Coda; si muovono solo quando il giocatore si ferma. | Coda Vecchia, Zone del Silenzio |
| `N-10` | Senzavolto | 2 | Non un bug: il tema "Rework UI" abbandonato dopo due giorni (`ffe53e1` → `5ca83c0`). | Sagome senza tratti del viso, coperte da drappi; difendono il Quartiere del Volto Abbandonato senza sapere perché. | Quartiere del Volto Abbandonato |

---

## 8. Bug → Entità

### La rubrica dell'Indice di Gravità (IG)

L'IG misura l'**importanza reale** di un difetto nella storia dello sviluppo (R3).

| Criterio | Valori | Peso |
|---|---|---|
| **Impatto (I)** | 0 cosmetico o invisibile · 1 fastidio · 2 altera l'esito (ingiustizia, numeri sbagliati, perdita di dati) · 3 blocca il gioco o una sua parte essenziale | ×2 |
| **Tentativi (T)** | 0 un solo fix · 1 due tentativi · 2 tre o più, oppure "not fully fixed" | ×1 |
| **Peso nella Revisione (P)** | 0 assente dal changelog · 1 voce del changelog · 2 voce di primo piano, o motivo di un cambio di logica | ×1 |
| **Durata (D)** | +1 se è sopravvissuto ad almeno 6 versioni (solo se verificabile) | ×1 |
| **Portata del rimedio (R)** | 0 un punto del codice · 1 un sistema · 2 più sistemi o l'architettura | ×1 |

**IG = 2·I + T + P + D + R** (da 0 a 13).

| IG | Rango |
|---|---|
| 0–3 | Nemico |
| 4–5 | Elite |
| 6–7 | Miniboss |
| 8–10 | Boss |
| 11–13 | Boss maggiore |

**Deroghe:** il DEV può spostare un'entità di un rango al massimo, scrivendo il motivo nella tabella sotto. Le dimensioni fisiche di un'entità non dipendono dal rango (il Cumulo è enorme ma è un Miniboss).

### Tabella dei punteggi

| Entità | I | T | P | D | R | IG | Rango | Fonte reale |
|---|---|---|---|---|---|---|---|---|
| `BM-01` Il Doppio | 3 | 2 | 2 | 0 | 2 | **12** | Boss maggiore | `c753079`, `9de6345`; changelog 0.7, 0.9 |
| `BM-02` Il Vasto | 2 | 2 | 2 | 1 | 2 | **11** | Boss maggiore | `9de6345`; changelog 0.9, 0.12 |
| `BM-03` Il Viandante | 3 | 2 | 1 | 0 | 2 | **11** | Boss maggiore | `13a67be` e altri ~11 commit; `d4e6510`, `00d1090`; changelog 0.4 |
| `B-01` L'Atteso | 3 | 1 | 1 | 0 | 2 | **10** | Boss | `6b32547` → `4f2c0ff`, `a5b2612`; changelog 0.4 |
| `B-02` La Spirale | 2 | 0 | 2 | 1 | 2 | **9** | Boss | `302ac09`; changelog 0.10 |
| `B-03` Lo Sfasato | 2 | 0 | 1 | 1 | 2 | **8** | Boss | changelog 0.11 |
| `B-04` Il Perimetro Cieco | 3 | 0 | 1 | 0 | 1 | **8** | Boss | (`5319a2f`?) → `61851c2`; changelog 0.7 |
| `B-05` L'Incisione Contesa | 2 | 1 | 1 | 0 | 2 | **8** | Boss | changelog 0.8; commenti in `engine.js` e `quest-tracker.js` |
| `MB-01` L'Ospite di Casa | 3 | 1 | 0 | 0 | 0 | **7** | Miniboss | `cb0ddf5`, `ed57d63` |
| `MB-02` Il Cumulo | 1 | 1 | 1 | 0 | 2 | **6** | Miniboss | `05d4f7d`, `192ccb2`; changelog 0.8 |
| `MB-03` L'Orfano del Vincolo | 1 | 2 | 1 | 0 | 1 | **6** | Miniboss | `28622f6`; changelog 0.7 |
| `MB-04` Il Vento Inestinguibile | 2 | 0 | 1 | 0 | 1 | **6** | Miniboss | changelog 0.11 |
| `EL-01` La Scarica Totale | 2 | 0 | 1 | 0 | 0 | **5** | Elite | changelog 0.8 |
| `EL-02` La Colata Cieca | 2 | 0 | 0 | 0 | 1 | **5** | Elite | `a97ae70` |
| `EL-03` Il Riflesso Infinito | 2 | 0 | 0 | 0 | 0 | **4** | Elite | commento in `engine.js` (0.11) |
| `EL-04` Il Tizzone Mancante | 1 | 0 | 1 | 1 | 0 | **4** | Elite | changelog 0.12; `balance-history.js` |
| `EL-05` La Fioritura Amara | 1 | 0 | 2 | 0 | 0 | **4** | Elite | changelog 0.12 (fix e logica) |
| `EL-06` I Rifiutati | 1 | 0 | 1 | 1 | 0 | **4** | Elite | changelog 0.11 |
| `EL-07` Gli Incompiuti | 1 | 1 | 1 | 0 | 0 | **4** | Elite | `ad1d81f`, `8990aa1`; changelog 0.6 |
| `N-01` Cerchi Indelebili | 1 | 0 | 1 | 0 | 0 | **3** | Nemico | `b65409a`, `1e926d1`; changelog 0.1 |
| `N-02` Cariche Mute | 1 | 0 | 0 | 0 | 0 | **2** | Nemico | `f8e4486` |
| `N-03` Spiriti d'Infusione | 1 | 0 | 1 | 0 | 0 | **3** | Nemico | changelog 0.8 (durata non verificabile) |
| `N-04` Lampo Bianco | 0 | 0 | 1 | 1 | 0 | **2** | Nemico | changelog 0.12 |
| `N-05` Mani Trattenute | 1 | 0 | 1 | 0 | 0 | **3** | Nemico | changelog 0.8 |
| `N-06` Scivolati | 1 | 0 | 1 | 0 | 0 | **3** | Nemico | `97b4c56`; changelog 0.7 |
| `N-10` Senzavolto | 0 | 0 | 1 | 0 | 1 | **2** | Nemico | `ffe53e1`, `5ca83c0`; changelog 0.11 |

**Deroghe applicate:** nessuna.

**Nota sulla Spirale e sull'Atteso:** non sono bug in senso stretto (un difetto di design e una funzione incompleta). La rubrica si applica comunque: ciò che conta è il peso reale nello sviluppo.

### Difetti in attesa di forma

Difetti reali non ancora trasformati in entità. Da usare per contenuti futuri (vedi `SEME-11`).

| Difetto reale | Fonte | IG stimato | Idea `[DA SVILUPPARE]` |
|---|---|---|---|
| Tempi sbagliati del Battito della Terra | changelog 0.8 | 2–3 | *Il Battito Stonato*: dolmen che respirano fuori tempo. |
| Colori delle particelle sbagliati | changelog 0.8 | 1 | *Le Tinte Erranti*: particelle del colore di un altro elemento. |
| Particelle di lancio diverse per il proiettile avversario | changelog 0.11 | 1 | Variante cosmetica dei Rifiutati. |
| Etichette dei grafici in Info Giocatore in un altro font | changelog 0.11 | 1 | *Il Ritratto Straniero*: un Ritratto scritto con lettere che non sono rune. |
| Barre di scorrimento inutili nelle impostazioni | changelog 0.12 | 0–1 | Nessuna (troppo minore). |
| Compatibilità del build con il `top-level await` | `88d676f` | 1–2 | Da valutare. |
| Discordanze README ↔ codice (mana puro e resistenze; folgore bloccata o rimbalzante sulla terra) | sezione 19 | — | *Il Libro delle Intenzioni* (`SEME-12`). |

---

## 9. Oggetti e reliquie

Ogni reliquia è un frammento di prova. Nessuna, da sola, spiega un evento: va confrontata con altre fonti (R4). Tutte sono `[PROPOSTA]`, salvo il contenuto citato da `LORE.md`.

#### Reliquie dei Primi Tracciatori

**R-01 — Coccio di Sefa** · *Dove:* villaggio dei vasai (Piane di Sal), custodito da Hadi; copia di studio nel Primo Laboratorio · *Possessore:* Sefa
- *Origine e significato:* un frammento dell'argilla del primo cerchio, ancora fucsia.
- *Funzione:* oggetto chiave di `Q-01`. Posato dentro un cerchio vuoto, lo fa brillare più intensamente.
- *Contiene:* l'impronta di un dito. *Falso o incompleto:* Hadi lo racconta come "il colore del mana arrabbiato" (credenza di Sefa); le Cronache spiegano il fucsia come il colore della promessa.
- *Collegamenti:* `P-01`, `A-06`, `I-01`.

**R-02 — Borraccia di Maro** · *Dove:* tomba di sale, Piane di Sal · *Possessore:* Maro Teleth
- *Origine e significato:* vuota, con il contorno di una goccia graffiato sopra e sette tacche.
- *Funzione:* pezzo di `Q-02`. *Incompleto:* non dice perché la siccità durò sette anni.
- *Collegamenti:* `P-03`, `L-15` (i venti dell'Orlo).

**R-03 — Trave di Kesh** · *Dove:* Torre di Ilyen · *Possessore:* Ilyen Kastra
- *Origine e significato:* la trave inclinata rimasta dopo il crollo: la Scala Spezzata in scala reale.
- *Contiene:* i nomi incisi dei costruttori della torre e la frase "il muro se l'è preso".
- *Collegamenti:* `P-02`, `Q-02`, `Q-10`.

**R-04 — Aquilone di Sienne** · *Dove:* laboratorio in rovina, Orlo · *Possessore:* Sienne Vael
- *Funzione:* in `Q-14` l'aquilone, lasciato libero sul bordo dell'Orlo, viene tirato verso l'**oltre**: il vento torna da un luogo che non dovrebbe esistere.
- *Falso:* Sienne credeva che oltre il bordo non ci fosse niente.
- *Collegamenti:* `P-04`, `L-20`.

**R-05 — Architrave di Holm** · *Dove:* il primo dolmen, Brughiere di Holm · *Possessore:* Dagrun Holm
- *Funzione:* pezzo di `Q-02`. Il dolmen "respira" a intervalli regolari (il Battito della Terra).
- *Collegamenti:* `P-05`.

**R-06 — Mappa della Clessidra** · *Dove:* un archivio di mappe smarrito nelle Vie Sbagliate · *Possessore:* Oda Nerys
- *Contiene:* il primo disegno dello Spaziale e la frase canonica "lo spazio è tempo che si è sdraiato". Il nome della corona per cui lavorava Oda è stato raschiato via.
- *Funzione:* mostra le vie vere nel labirinto del Viandante (`BM-03`).
- *Collegamenti:* `P-06`, `L-16`, `I-14`.

#### Reliquie della Fondazione e dei Duelli

**R-07 — Guanto di Vasko** · *Dove:* Campo d'Addestramento · *Possessore:* Teodor Vasko
- *Origine e significato:* l'ultimo guanto della mano di carne, prima della Sostituzione.
- *Contiene:* un biglietto: "Ho scelto la freccia perché indica. Nient'altro. Una forma vale l'altra."
- *Falso:* la forma non era indifferente (`I-10`).
- *Collegamenti:* `P-07`, `M-10`.

**R-08 — Occhio di Nerea e Quaderni della Cava** · *Dove:* Cava di Nerea Solt · *Possessore:* Nerea Solt
- *Contiene:* l'occhio di vetro; i quaderni con undici leggi; la nota "ne manca una".
- *Incompleto:* le leggi canoniche sono dodici; la tavola 7 della cava è stata incisa da un'altra mano (`M-15`).
- *Collegamenti:* `P-08`, `A-05`, `EL-02`.

**R-16 — Frammenti delle Cronache** · *Dove:* ovunque (copie pubbliche nell'Atrio, originali nell'Archivio) · *Autore:* firmati DrIce
- *Funzione:* la fonte principale per la cronologia delle Revisioni.
- *Falso o incompleto:* `[PROPOSTA]` le copie pubbliche dei Custodi omettono il Volto Abbandonato e la Dispersione delle Vie; gli originali no. Confrontare copia e originale è un indizio (`I-13`, `I-14`).
- *Collegamenti:* `P-16`, `F-01`, `M-04`.

**R-17 — Tavoletta Vuota** · *Dove:* lo strato più profondo dell'Archivio, prima del fuoco
- *Origine reale:* il file `saves/players.json`, creato il 2025-06-13 e rimosso il 2026-09-30, il cui unico contenuto è sempre stato `{"data": ""}`.
- *Significato:* il primo archivio non era ardente: era una tavoletta fredda, con un'unica iscrizione, *"dati: nulla"*. Non ha mai ricordato niente.
- *Funzione:* `Q-08`; prova che l'Archivio ha avuto un predecessore.
- *Collegamenti:* `L-10`, `I-08`.

**R-18 — Pegni di Ritorno non riscattati** · *Dove:* Arena (un'urna presso i Varchi)
- *Significato:* ogni Pegno appartiene a un caster che non tornò entro venti battiti e perse a tavolino.
- *Funzione:* collezionabili; ognuno porta un nome e la data di una Revisione, e racconta una piccola storia.
- *Collegamenti:* Rev VIII, `F-09`.

**R-19 — Pietra del Forse** · *Dove:* Coda Vecchia, Arena Muta
- *Origine reale:* "Fix matchmaking bug? Not sure" (`c753079`).
- *Contiene:* *"Sigillato? Non ne sono certo."* Firma consumata di un Connettore.
- *Funzione:* `Q-03`. Prova che il primo tentativo contro i Doppi fallì.
- *Collegamenti:* `BM-01`, `I-03`.

**R-21 — Iscrizione della Vergogna** · *Dove:* atrio dell'Arena Muta, accanto alle leve "Casa" e "Arena"
- *Origine reale:* il commit `ed57d63`. `[DEV]` Il messaggio originale è volgare: nel gioco va sempre addolcito.
- *Contiene:* *"Sono stato uno sciocco."*
- *Collegamenti:* `MB-01`, `I-07`.

#### Reliquie del Risveglio

**R-20 — Giuramento delle Vie** · *Dove:* tre bivi delle Vie Sbagliate
- *Origine reale:* "Move files to correct paths (I SWEAR)" (`13a67be`), "Second try" (`00d1090`).
- *Contiene:* la stessa frase, incisa tre volte da mani diverse: *"Questa volta ogni cosa è al suo posto. Lo giuro."* La terza è più recente delle altre due.
- *Collegamenti:* `BM-03`, `I-14`.

**R-22 — I Sette Drappi** · *Dove:* Quartiere del Volto Abbandonato
- *Origine reale:* i sette fogli di stile "rework" rimossi in `5ca83c0` (arena, base, buttons, exp bar, home, modal, version).
- *Significato:* ognuno è ricamato con il nome di un luogo che avrebbe dovuto ricoprire: **Arena, Fondamenta, Sigilli, Misura, Atrio, Veli, Cronache**.
- *Funzione:* `Q-15`; il giocatore riconosce i luoghi che conosce.
- *Collegamenti:* `L-18`, `M-14`.

**R-23 — Quadrante del Tempo Comune** · *Dove:* Osservatorio delle Frequenze
- *Significato:* un quadrante con sessanta tacche: la frequenza a cui i Custodi riportarono il tempo di tutti.
- *Funzione:* crea una piccola zona di Tempo Comune; arma contro lo Sfasato.
- *Collegamenti:* `B-03`, `I-05`.

**R-24 — Frammenti dei Cumuli** · *Dove:* fondo dell'Archivio · Collezionabili
- *Origine reale:* i file rimossi dal "Commit digestion" (`192ccb2`).
- *Significato:* nella lore i frammenti bruciati furono **dodicimiladuecentosettantasei**. Il giocatore ne trova solo alcuni.
- *Contiene:* iscrizioni in lingue straniere, illeggibili. `[DEV]` Ammiccamento di livello 3 consentito solo qui: alcune iscrizioni possono essere nomi di moduli reali.
- *Collegamenti:* `MB-02`, `I-08`.

**R-25 — Registro del Battito** · *Dove:* officina di Tilde Varro, Arena
- *Origine reale:* l'heartbeat del server, ogni 25 secondi.
- *Contiene:* una colonna di segni, uno ogni venticinque battiti, e accanto a ognuno "ci sei?".
- *Funzione:* rivela la copia reale del Doppio.
- *Collegamenti:* `BM-01`, `A-02`.

**R-26 — Pietre della Convenzione** · *Dove:* Campi Ciechi
- *Origine reale:* "Fix arena area (sadly)" (`9de6345`), lato predefinito 800.
- *Contiene:* il testo della prima Convenzione; un lato di **ottocento passi**; sotto il testo, un piccolo segno inciso che i caster leggono come *"a malincuore"*.
- *Funzione:* attivano la Fase del Quadrato contro il Vasto.
- *Collegamenti:* `BM-02`, `I-02`.

**R-29 — Rosa degli Otto Venti** · *Dove:* L'Orlo
- *Significato:* una bussola di pietra con sole otto punte. Prima della Revisione XI la Linea si poteva tracciare solo in quelle otto direzioni.
- *Collegamenti:* `EL-06`.

**R-30 — Prima Pagina del Libro delle Ricalibrazioni** · *Dove:* Primo Laboratorio
- *Contiene:* "Effetti elementali più lunghi", con i segni ▲ ▼ ◆ e la nota sull'Ultimo Tizzone.
- *Collegamenti:* `EL-04`, Rev XII.

**R-32 — Chiave Nascosta dell'Archivio** · *Dove:* `[DA DECIDERE]`
- *Origine reale:* le credenziali del server spostate in una variabile d'ambiente (`55f038b`, 0.7).
- *Significato:* un tempo la chiave dell'Archivio era incisa sul muro dell'Archivio stesso, dove chiunque poteva leggerla. Nella Settima Revisione fu spostata in un luogo che conosce solo l'Arbitro.
- *Funzione:* `Q-08` (si trova il muro con l'incisione grattata via, mai la chiave).
- `[DEV]` Nessun contenuto del gioco deve **mai** riportare credenziali reali, nemmeno in forma di easter egg.

**R-33 — Sigillo della Cornice** · *Dove:* archiviato sotto un nome sbagliato, nelle Vie Sbagliate
- *Origine reale:* l'import del modulo della barra del mana con il nome di file sbagliato (`13721dc`).
- *Funzione:* va riportato all'Archivio; ricompensa estetica per la Cornice `[DA DECIDERE]`.
- *Collegamenti:* `BM-03`, `L-10`.

#### Reliquie dell'Era del Collegamento

**R-09 — Calco della Cicatrice** · *Dove:* casa di Vesh, Orlo · *Possessore:* Vesh Arandel
- *Contiene:* la linea spezzata, dall'alto verso il basso. *Funzione:* `Q-05`.
- *Collegamenti:* `P-09`.

**R-10 — Lenti di Corva** · *Dove:* Sala degli Specchi · *Possessore:* Corva Lenzi
- *Contiene:* due lenti e un diario: "Gli specchi esistono. Devono esistere."
- *Funzione:* ridurre i rimbalzi del Riflesso Infinito.
- *Falso:* gli specchi della Cavità non sono oggetti.
- *Collegamenti:* `P-10`, `EL-03`.

**R-11 — Trattato dei Nodi e Cerchio di Rúnstedt** · *Dove:* tomba di Halvard, sotto l'Emporio
- *Contiene:* "Il corpo ha un soffitto. Il cerchio no." e "So incastonarli. Non so crearli."
- *Mistero:* sopra la tomba il Cerchio Personale di Halvard, nel suo violetto, **gira ancora** (`M-26`).
- *Incompleto:* non dice da dove vengano i Linker.
- *Collegamenti:* `P-11`, `Q-11`.

**R-12 — Mattone Tagliafuoco** · *Dove:* Kesh · *Marchio:* Thessaly Brann
- *Funzione:* nel combattimento contro il Vento Inestinguibile permette di costruire muri.
- *Collegamenti:* `F-03`, `MB-04`.

**R-13 — Bende dell'Accelerato** · *Dove:* forgia dell'Overclock, Kesh · *Possessore:* Dario Venn
- *Contiene:* formule di frequenze delle rune, macchiate di bruciature. Una pagina parla di "caster più veloci degli altri" senza capire perché.
- *Collegamenti:* `P-13`, `B-03`.

**R-14 — Primo Condotto** · *Dove:* Piane di Sal · *Possessore:* Ione Calder
- *Contiene:* il marchio *omnibus*. Il condotto perde: in un punto il mana gocciola nel terreno.
- *Funzione:* `Q-11` (dove "scende" il Quinto?).
- *Collegamenti:* `P-14`, `M-12`.

**R-15 — Ultima Lettera di Aurel** · *Dove:* Il Nocciolo · *Possessore:* Aurel Maskh
- *Contiene:* `[CANONE]` "Il Lettore conosce più forme di quante ce ne abbia mostrate." L'ultima pagina è strappata. **Non va mai ritrovata.**
- *Collegamenti:* `P-15`, `M-09`, `Q-13`.

**R-31 — Grigi delle Sommosse** · *Dove:* memoriale dell'Emporio
- *Significato:* cristalli grigi lanciati contro i banchi durante le Sommosse del Grigio.
- *Collegamenti:* `L-08`, Patto delle Dieci e delle Sessanta.

#### Reliquie del mistero

**R-27 — Registrazione del Primo Passo** · *Dove:* archivio dei Connettori nell'Osservatorio
- *Origine reale:* il prototipo dell'Open World (`client/dev/openworld/`): un quadrato che si sposta di 250 unità verso destra.
- *Contiene:* un cristallo che mostra un quadrato che si sposta da sé per **duecentocinquanta passi** verso destra, su una Tela vuota.
- *Collegamenti:* `L-20`, `Q-14`, `M-08`.

**R-28 — Blocco del Manichino** · *Dove:* Campo d'Addestramento
- *Contiene:* niente. Un quadrato perfetto, senza un graffio.
- *Falso:* i Connettori lo definiscono "materiale muto".
- *Collegamenti:* `M-05`, `Q-12`.

---

## 10. Revisioni, Silenzi e Risvegli

### Le corrispondenze

| Sviluppo reale | Nel mondo |
|---|---|
| Versione del gioco | **Revisione** |
| Bug corretto | **Difetto antico** (con un nome; spesso un'entità dell'Open World) |
| Bilanciamento | **Ricalibrazione** (voce del Libro delle Ricalibrazioni: ▲ ▼ ◆) |
| Funzione nuova | **Scoperta**, o Segno reso legge |
| Funzione rimossa | **Abbandono** (es. il Volto Abbandonato) |
| Periodo senza sviluppo | **Silenzio** |
| Periodo di grande attività | **Risveglio** |
| Riorganizzazione del codice | **Pulizia** |

### Gli strati archeologici `[PROPOSTA]`

Ogni regione è composta da strati sovrapposti, come uno scavo. Il giocatore impara a riconoscerli e a datare ciò che trova.

| Strato | Revisioni | Palette e materiali | Suono | Leggi in vigore (nelle zone pure) | Entità tipiche |
|---|---|---|---|---|---|
| **Selvatico** | prima della I | forme organiche, irregolari; argilla, ossa, legno | naturale | Segni dal riconoscimento instabile `[RICHIEDE MECCANICA]` | nessuna nata da bug |
| **Fondazione** | I–V | geometria semplice; cerchi fucsia incisi; pietra chiara | **assente** (la Tela non aveva voce) | niente Afflizioni, niente Rossore | `N-01`, `N-02`, `B-01`, `BM-03` |
| **Duelli** | VI–VII | pietra d'arena, sfumature rossastre; anelli da duello | i primi suoni (dalla VII) | Afflizioni; Rossore | `B-04`, `EL-07`, `MB-01`, `MB-03` |
| **Silenzio** | tra VII e VIII | identico ai Duelli, ma coperto di polvere ferma a mezz'aria | ovattato | quelle della Rev VII | `N-09`, `BM-01` |
| **Risveglio** | VIII–XII | onde e anelli che si espandono, forme che si disegnano da sole; vetro nero del magma | pieno | Reazioni, folgore, laser, Tempo Comune | `EL-01…06`, `B-02`, `B-03`, `MB-04` |
| **Collegamento** | XIII | pentagoni, circuiti, anelli runici; i colori delle Fonderie | metallico, ronzante | tutte quelle attuali | i Boss dei set (sezione 14) |

**Leggere gli strati** `[PROPOSTA]`: la **Bussola del Varco** (il cerchio runico delle transizioni, con la corona di tacche simile a un quadrante) può diventare lo strumento del giocatore. Puntata su un oggetto o un edificio, l'ago indica la tacca della Revisione a cui appartiene.

### Luoghi rimaneggiati più volte

Alcuni luoghi mostrano più strati sovrapposti, e la sovrapposizione è essa stessa un racconto:
- **L'Arena:** dentro l'anello attuale si vedono, come cerchi concentrici nel pavimento, il quadrato della Rev IX e, sotto ancora, il campo vuoto della Rev IV.
- **I Campi Ciechi:** campi da duello di misure diverse (prima della Convenzione), il Quadrato (Rev IX), il Rettangolo (Rev XII).
- **L'Archivio Ardente:** strati verticali, dalla Tavoletta Vuota fino alle incisioni di oggi; due livelli di cenere (due roghi dei Cumuli).
- **Kesh:** la torre del Tempo Selvatico, le rovine del Rogo, i muri del Collegamento.

### Silenzi

- **La Quiete** `[PROPOSTA nome]`: i quattro mesi tra la Sesta e la Settima Revisione. In `LORE.md` è solo "quattro mesi più tardi". Nessuna traccia propria.
- **Il Lungo Silenzio** `[CANONE]`: le **Zone del Silenzio** (`L-19`) sono le sue tracce. Regola: la causa del Silenzio non va mai spiegata (`M-06`).

### Risvegli

- **Il Risveglio** `[CANONE]` (Rev VIII–XII, sette giorni): nell'Open World si riconosce dalla densità. Nelle zone del Risveglio molte cose sono cambiate tutte insieme, e i segni di cinque Revisioni si accavallano.

### Ricalibrazioni vive `[PROPOSTA]`

Quando il gioco reale riceve un bilanciamento, l'Open World ne riceve l'eco:
1. I Custodi annunciano una **Ricalibrazione** nell'Atrio (nuova voce del Libro delle Ricalibrazioni).
2. I dialoghi degli NPC che ne sono toccati cambiano (Nilo Sarto si lamenta di un nerf all'Overclock, Teo Solt annota una legge modificata).
3. I difetti corretti nella nuova versione vengono valutati con la rubrica (sezione 8) e possono diventare **nuove entità**, che compaiono nelle zone dello strato corrispondente.

`[IPOTESI]` Anche i Silenzi futuri potrebbero avere un'eco (per esempio, i fasci di luce dell'Atrio che rallentano). Da valutare con prudenza: rischia di diventare un espediente.

---

## 11. Quest e storyline

### Struttura generale `[PROPOSTA]`

L'Open World non ha una trama lineare, ma **archi** che il giocatore può affrontare in ordine libero, regione per regione. Ogni arco si chiude con una *comprensione*, non con una spiegazione.

| Arco | Quest | Domanda che il giocatore si pone | Comprensione finale |
|---|---|---|---|
| **I — Le Origini** | `Q-01`, `Q-02` | Da dove vengono i Segni? | I Segni sono nati da perdite: ogni forma era "ciò che restava". |
| **II — I Difetti Antichi** | `Q-03`…`Q-10`, `Q-15` | Perché il mondo è pieno di creature così strane? | La storia della Tela è una storia di correzioni, e ciò che è stato corretto non è scomparso. |
| **III — Il Collegamento** | `Q-11` | Cosa sono davvero i Linker che porto addosso? | Porto gli echi di altri. Cosa ne faccio è una scelta mia. |
| **Fili infiniti** | `Q-12`, `Q-13`, `Q-14`, `Q-16` | Chi scrive le leggi? Cosa c'è oltre? | **Nessuna risposta definitiva.** |

### Le quest

**Q-01 — Il Colore della Promessa** · Arco I · Piane di Sal
- *Fonte:* lore (Sefa); nessun bug. È la quest che insegna il sistema degli indizi.
- *Fasi:* 1) Hadi racconta che il fucsia è "il mana arrabbiato". 2) Il giocatore trova la prima pozza, ancora contenuta dal cerchio di Sefa. 3) Nel Primo Laboratorio una Cronaca spiega il fucsia come "il colore che l'occhio inventa". 4) Il giocatore traccia un cerchio vuoto e lo osserva.
- *Indizi:* `I-01`. *Ricompensa:* il Coccio di Sefa; la prima pagina del Taccuino.
- *Non rivela:* niente di nascosto: è il tutorial.

**Q-02 — Le Quattro Mani** · Arco I · Piane, Kesh, Orlo, Holm
- *Fonte:* lore.
- *Fasi:* un pellegrinaggio ai quattro luoghi dei Primi Tracciatori. In ognuno il giocatore trova la reliquia e una versione popolare della storia, diversa da quella delle Cronache.
- *Indizi:* le versioni popolari e quelle delle Cronache non coincidono mai del tutto.
- *Ricompensa:* un Segno decorativo per il Cerchio Personale per ogni Mano `[DA DECIDERE]`.
- *Non rivela:* se le Quattro Mani siano esistite davvero (`M-24`).

**Q-03 — Sessione Doppia** · Arco II · Arena, Arena Muta
- *Fonte reale:* il fantasma del matchmaking (`c753079`, `9de6345`).
- *Fasi:* 1) Mira Kell racconta di un Doppio in Coda; Tilde Varro dice che sono estinti. 2) Nel Registro del Battito il giocatore nota "ci sei?". 3) Nella Coda Vecchia trova la Pietra del Forse. 4) Doppi Minori immobili. 5) Il Doppio, che porta il nome del giocatore.
- *Indizi:* `I-03`. *Ricompensa:* `S-01`.
- *Non rivela:* che il Doppio nasce da un difetto della Rete (resta un'ipotesi dei Connettori).

**Q-04 — Con Rammarico** · Arco II · Campi Ciechi
- *Fonte reale:* l'arena non condivisa; "Fix arena area (sadly)".
- *Fasi:* 1) Amsel racconta i colpi dal nulla. 2) Il giocatore attraversa campi di misure diverse. 3) Le Pietre della Convenzione, con il segno di rammarico. 4) Il testo della seconda Convenzione. 5) Il Vasto.
- *Indizi:* `I-02`. *Ricompensa:* `S-02`.
- *Non rivela:* niente di protetto.

**Q-05 — Il Tempo Comune** · Arco II · Orlo, Kesh
- *Fonte reale:* la correzione dei 144 Hz.
- *Fasi:* 1) Nilo Sarto accusa il Tempo Comune di essere una "frenata". 2) Le Bende dell'Accelerato parlano di caster più veloci "senza motivo". 3) Vesh Arandel racconta l'Osservatorio. 4) I registri dell'Osservatorio: duelli vinti sempre dagli stessi. 5) Lo Sfasato.
- *Indizi:* `I-05`. *Ricompensa:* `S-06`.

**Q-06 — La Misura e la Spirale** · Arco II · Kesh
- *Fonte reale:* il vecchio sistema dei livelli e la Riforma (`302ac09`).
- *Fasi:* 1) Un NPC anziano rimpiange "quando bastava crescere". 2) I registri della Torre della Misura. 3) I quattro pilastri degli Assi. 4) La Spirale.
- *Indizi:* `I-06`. *Ricompensa:* `S-05`.

**Q-07 — Sono Pronto** · Arco II · Arena Muta
- *Fonte reale:* prima arena non funzionante; URL di produzione su localhost.
- *Fasi:* 1) Il Conteggio fermo a 0. 2) L'Ospite di Casa e le due leve, con l'Iscrizione della Vergogna. 3) I tre pezzi del Primo Messaggio (indirizzo, voce, coda). 4) Il rito: "Sono pronto". 5) L'Atteso.
- *Indizi:* `I-04`, `I-07`. *Ricompensa:* `S-04`; il Conteggio passa a 1.

**Q-08 — Gli Strati dell'Archivio** · Arco II · Archivio Ardente
- *Fonte reale:* i salvataggi in conflitto; `players.json`; i `node_modules`; le credenziali spostate.
- *Fasi:* 1) Elvar Sund accompagna il giocatore negli strati alti. 2) Gli Incompiuti e i nomi incisi due volte. 3) L'Incisione Contesa. 4) La Tavoletta Vuota. 5) Due strati di cenere; il Cumulo.
- *Indizi:* `I-08`. *Ricompensa:* `S-08`; Frammenti dei Cumuli.
- *Non rivela:* dove sia la Chiave Nascosta.

**Q-09 — Le Vie Sbagliate** · Arco II · Vie Sbagliate
- *Fonte reale:* il caos dei percorsi del deploy.
- *Fasi:* 1) Una torre di Kesh nelle Piane di Sal. 2) I tre Giuramenti. 3) La Mappa della Clessidra. 4) Il Sigillo della Cornice, archiviato sotto un nome sbagliato. 5) Il Viandante e la Radice.
- *Indizi:* `I-14`. *Ricompensa:* `S-03`.
- *Nota:* richiede l'approvazione della Dispersione delle Vie come evento canonico (sezione 18).

**Q-10 — Il Secondo Rogo** · Arco II · Kesh, Cava
- *Fonte reale:* la copia fantasma delle aree cedute (0.11).
- *Fasi:* 1) Odile Brann (Firewall) e Nilo Sarto (Overclock) si accusano a vicenda. 2) Le Rovine del Rogo, dove i venti bruciano ancora. 3) Teo Solt spiega la Legge 2 delle Reazioni (chi accende il vento ne diventa padrone). 4) Un registro dei Connettori: "le cessioni lasciavano un residuo". 5) Il Vento Inestinguibile.
- *Indizi:* `I-09`. *Ricompensa:* Mattone Tagliafuoco; reputazione con una delle due Fonderie `[DA DECIDERE]`.
- *Non rivela:* esplicitamente che fu un difetto del Lettore. Il giocatore lo deduce.

**Q-11 — Il Rumore del Substrato** · Arco III · Emporio, tomba di Rúnstedt, Zone del Silenzio, Piane
- *Fonte:* lore (origine dei Linker, Catalisi, Tracciatori Nudi).
- *Fasi:* 1) Di notte, il pozzo dell'Emporio "suona". 2) Il Trattato dei Nodi: Halvard non sapeva crearli. 3) Livia Strand: "porti addosso morti". 4) Rask: "i BitRune sono puliti". 5) Il Primo Condotto che perde.
- *Indizi:* `I-11`. *Ricompensa:* una scelta di atteggiamento (Fonderie, Bus, Tracciatori) senza un esito "giusto" `[DA DECIDERE]`.
- *Non rivela:* se la Catalisi sia una liberazione o una seconda morte (`M-12`).

**Q-12 — Il Quadrato** · Filo infinito · Campo d'Addestramento, Terre Oltre il Campo
- *Fonte:* il Manichino di quadrati; il Ghiaccio apocrifo; DrIce.
- *Fasi:* indizi sparsi, che non si chiudono mai: il Blocco del Manichino che non si rompe; i Manichini Selvatici che si ricompongono; il Segno del Ghiaccio (il Quadrato); la firma DrIce.
- *Indizi:* `I-12`. *Ricompensa:* nessuna ricompensa finale. Solo la domanda.

**Q-13 — Il Nocciolo** · Filo infinito · Brughiere di Holm
- *Fonte:* Aurel Maskh e il sesto elemento.
- *Fasi:* il Discepolo, l'Ultima Lettera, la stanza chiusa. La stanza si può socchiudere, ma non aprire.
- *Non rivela:* cosa trovò Aurel (`M-09`).

**Q-14 — Il Primo Passo** · Filo infinito · Orlo, Terre Oltre il Campo
- *Fonte reale:* il prototipo dell'Open World.
- *Fasi:* la Registrazione del Primo Passo; l'Aquilone di Sienne tirato verso l'oltre; il primo ingresso nelle Terre Oltre il Campo.
- *Non rivela:* cosa c'è alla fine dell'Oltre (`M-08`).

**Q-15 — Il Volto Abbandonato** · Secondaria · Centro
- *Fonte reale:* il tema "Rework UI".
- *Fasi:* i Sette Drappi; il riconoscimento dei luoghi ricamati; le Cronache pubbliche che tacciono, gli originali che ne parlano.
- *Non rivela:* perché fu abbandonato (`M-14`).

**Q-16 — La Scissione** · Futura `[DA DECIDERE]`
- *Fonte reale:* il disegno virtuale (tasto X, roadmap 1.2.5), non ancora implementato.
- *Idea:* quando il disegno virtuale entrerà nel gioco, Vesh Arandel e la statua di Vasko diventano i due "maestri" di una quest che insegna la Scissione. Muro e Cinetica restano apocrifi finché non sono implementati.

---

## 12. Sistema degli indizi

### Meccaniche `[PROPOSTA]`

**Il Taccuino del Tracciatore.** Registra ogni frammento trovato *alla lettera*, con la fonte (fazione, NPC, iscrizione, comportamento osservato) e lo strato di provenienza. **Non registra mai conclusioni.** Non c'è una percentuale di "lore scoperta".

**Il Segno della Comprensione** `[RICHIEDE MECCANICA]`. Nel Taccuino c'è una piccola Tela su cui i frammenti sono disposti come punti. Il giocatore collega due o più frammenti **tracciando un solo tratto** tra loro: la Legge del Tratto Unico applicata al pensiero. Se il collegamento corrisponde a una deduzione canonica, il Lettore lo **riconosce**: il tratto si accende del colore dell'evento e qualcosa cambia nel mondo (un dialogo nuovo, un'iscrizione che diventa leggibile, un NPC che rivede una credenza). Nessun testo spiega la conclusione. Se il collegamento è sbagliato, il tratto diventa un Segno Mancato e si spegne in fumo, senza penalità.

**Affidabilità delle fonti.** Ogni frammento porta il simbolo della sua fazione (sezione 6). Il giocatore impara da solo chi tende a mentire, chi omette e chi sbaglia in buona fede.

**Regole di distribuzione:**
1. Ogni deduzione importante ha **almeno tre indizi** (A, B, C).
2. Almeno uno degli indizi è **non testuale** (ambiente, comportamento di un nemico, oggetto, architettura).
3. Almeno due indizi provengono da **fonti di tipo diverso** (R4).
4. L'indizio **C** deve permettere di reinterpretare **A**: è il momento "aspetta… quindi quello che ho trovato prima significava questo".
5. Le catene dei **misteri protetti** non hanno mai una conclusione (vedi `I-12`, `I-13`).

### Catene di indizi

#### I-01 — Il Colore della Promessa (`Q-01`)
- **A:** Hadi: *"Il fucsia è il colore del mana arrabbiato."*
- **B:** la prima pozza, contenuta dal cerchio di Sefa, è perfettamente calma. Eppure il cerchio è fucsia.
- **C:** una Cronaca del Primo Laboratorio: *"Il fucsia non esiste nell'arcobaleno."* E il cerchio vuoto del giocatore è fucsia finché non vi incide un elemento.
- **Conclusione del giocatore:** il fucsia non è un umore del mana, è il colore di un contenitore vuoto. Sefa stessa non aveva capito la propria scoperta.
- **Cosa cambia:** Hadi ammette il dubbio, oppure lo rifiuta con ostinazione `[DA DECIDERE]`.

#### I-02 — Con Rammarico (`Q-04`)
- **A:** Amsel: *"Mi colpivano dal nulla. Non ho mai visto chi."*
- **B:** nei Campi Ciechi i campi da duello hanno misure diverse; ci sono bruciature *fuori* dai bordi.
- **C:** le Pietre della Convenzione: un quadrato di ottocento passi, più piccolo di qualunque Campo, e un segno di rammarico; più avanti, il testo della seconda Convenzione: "il più grande che entrambi vedono".
- **Conclusione:** la Guerra nacque da Campi disuguali. Il Quadrato fu un compromesso doloroso, che tolse spazio a tutti; la vera soluzione arrivò dopo. Rilettura di A: chi colpiva Amsel forse non sapeva di vedere più di lui.
- **Ammiccamento:** livello 2 (il "sadly" del commit diventa "a malincuore").

#### I-03 — Il Doppio (`Q-03`)
- **A:** Mira Kell: *"L'ho visto. Era fermo in Coda, di notte. Aveva la mia stessa postura."*
- **B:** il Registro del Battito: un segno ogni venticinque battiti, e accanto *"ci sei?"*.
- **C:** la Pietra del Forse (*"Sigillato? Non ne sono certo."*); i Doppi Minori, che si muovono solo quando il giocatore si ferma; l'anello del Doppio, che porta **il nome del giocatore**.
- **Conclusione:** i Doppi non sono fantasmi di morti, ma echi di vivi che hanno lasciato una porta aperta. Il primo sigillo fallì. Il Battito funziona perché *chiede*. Chiunque potrebbe avere un Doppio, anche il giocatore.
- **Cosa cambia:** Tilde Varro corregge la propria credenza: i Doppi non sono estinti, sono sepolti.

#### I-04 — Il Primo Messaggio (`Q-07`)
- **A:** il Conteggio dell'Arena Muta è fermo a 0, ma i sedili sono consumati.
- **B:** le storie delle madri; la Cronaca: *"le porte si aprirono su un campo vuoto"*.
- **C:** i tre pezzi del Primo Messaggio (l'indirizzo, la voce, la coda); l'Atteso combatte senza suono, senza Rossore e con le sole magie della Fondazione.
- **Conclusione:** la prima Arena fallì perché il canale tra i caster non esisteva ancora. Un duello ha bisogno di un indirizzo, di una voce e di una coda. L'Atteso appartiene alla Rev IV: il giocatore lo **data** dal suo modo di combattere.

#### I-05 — Il Tempo Comune (`Q-05`)
- **A:** Nilo Sarto: *"Il Tempo Comune è una frenata, imposta da chi non sapeva andare veloce."*
- **B:** le Bende dell'Accelerato: *"alcuni caster sono più rapidi degli altri, e non so perché"*.
- **C:** i registri dell'Osservatorio: certi caster vincevano sempre; gli strumenti danno numeri diversi a seconda di chi li legge; lo Sfasato agisce più spesso del giocatore finché non entra in un Quadrante.
- **Conclusione:** alcuni caster erano più veloci non per abilità, ma per frequenza. Il Tempo Comune non fu una frenata, fu una giustizia. Rilettura di A e del motto di Dario Venn.

#### I-06 — La Spirale (`Q-06`)
- **A:** un anziano di Kesh: *"Una volta bastava crescere. Ogni livello ti dava di più."*
- **B:** nei registri della Torre della Misura livello e mana salgono sempre insieme, fino a una data precisa.
- **C:** la Spirale sale di livello da sola; la Riforma la spegne trasformando la forza in punti non spesi.
- **Conclusione:** il vecchio potere cresceva da solo, e premiava chi era già avanti. La Riforma ha sostituito il potere con la scelta. Rilettura di A: la nostalgia di un'ingiustizia.

#### I-07 — L'Ospite di Casa (`Q-07`)
- **A:** una diceria: *"Un tempo, varcando l'Arena, ci si ritrovava a casa propria."*
- **B:** due leve, "Casa" e "Arena": quando una è accesa, l'altra è spenta.
- **C:** l'iscrizione accanto alle leve: *"Sono stato uno sciocco."*
- **Conclusione:** qualcuno lasciò il Varco rivolto verso casa, per errore, e lo ammise. **Chi** l'abbia scritto non viene mai detto: il dubbio alimenta `M-01` senza risolverlo.
- **Ammiccamento:** livello 2.

#### I-08 — Gli Strati dell'Archivio (`Q-08`)
- **A:** Elvar Sund: *"L'Archivio ricorda. Non sbaglia mai."*
- **B:** nomi incisi due volte con valori diversi; gli Incompiuti, incisi a metà.
- **C:** la Tavoletta Vuota sul fondo (*"dati: nulla"*); due strati di cenere; un muro con un'incisione grattata via (la Chiave).
- **Conclusione:** l'Archivio non è sempre stato ardente; può sbagliare e sovrascrivere; ha bruciato due volte il proprio passato. Rilettura di A: ricordare non significa non sbagliare.

#### I-09 — Il Secondo Rogo (`Q-10`)
- **A:** Odile Brann (Firewall): *"Un duello senza regole. L'imprudenza dei duellanti."*
- **B:** Nilo Sarto (Overclock): *"Il Firewall non esisteva ancora. Chi poteva fermarlo?"*
- **C:** un registro dei Connettori: *"le cessioni lasciavano un residuo che nessuno poteva sciogliere"*; Teo Solt spiega la Legge 2 (chi accende il vento ne diventa padrone); la Cronaca della Rev XI sulla copia fantasma; il Vento Inestinguibile, che si duplica a ogni cessione.
- **Conclusione:** il Rogo fu reso possibile da un difetto corretto solo con l'Undicesima Revisione. Nessuna delle due Fonderie ha ragione fino in fondo.

#### I-10 — Il Puntatore (`M-10`)
- **A:** il biglietto di Vasko: *"Ho scelto la freccia perché indica. Una forma vale l'altra."*
- **B:** il Cursore del giocatore: un triangolo con il lato sinistro verticale.
- **C:** un frammento apocrifo sul Segno dello Stato, *"un triangolo con il lato sinistro verticale"*; la Cronaca: *"si sarebbe scoperto che il Lettore la riconosceva"*.
- **Conclusione:** la forma del Cursore è un Segno. Ogni caster porta addosso, senza saperlo, il disegno di sé stesso. Lo Stato resta comunque apocrifo.

#### I-11 — Il Rumore del Substrato (`Q-11`)
- **A:** il Trattato dei Nodi: *"So incastonarli. Non so crearli."*
- **B:** di notte il pozzo dell'Emporio suona; un Connettore parla di "echi cristallizzati".
- **C:** Livia Strand: *"Porti addosso dei morti."* L'iscrizione del Primo Laboratorio: *"Ogni cerchio che hai tracciato è ancora lì… scende soltanto più in basso."* Il Primo Condotto che perde mana nel terreno.
- **Conclusione:** i Linker sono echi di cerchi dissolti; i Leggendari, quasi sempre, di ultimi cerchi. Il cerchio dissolto del giocatore, un giorno, potrebbe diventare il Linker di qualcun altro. Il giudizio morale resta al giocatore.

#### I-12 — Il Quadrato (`M-05`) — **catena senza conclusione**
- **A:** il Blocco del Manichino non si è mai rotto; i blocchi di ricambio non sono mai stati usati.
- **B:** i Manichini Selvatici si scompongono in blocchi intatti e si ricompongono.
- **C:** il Segno apocrifo del Ghiaccio è il Quadrato; le Cronache sono firmate da DrIce, "il Dottore del Ghiaccio".
- **Conclusione:** **nessuna.** Il giocatore può solo sospettare un legame tra il Quadrato, il Ghiaccio e DrIce. **Regola:** non aggiungere mai un indizio D che lo confermi.

#### I-13 — Chi scrive le leggi (`M-01`, `M-03`) — **catena senza conclusione**
- **A:** il Custode anonimo: *"Siamo noi che, finalmente, abbiamo imparato a scrivere le sue leggi."*
- **B:** i Custodi non sanno spiegare il Lungo Silenzio; le loro copie delle Cronache omettono il Volto Abbandonato e la Dispersione delle Vie.
- **C:** i fasci di luce dell'Atrio, mossi "da qualcuno molto in alto"; il ritmo delle Revisioni (quindici giorni, quattro mesi, un anno, sette giorni), che non sembra quello di un ordine; tutte le Cronache firmate DrIce.
- **Conclusione:** **nessuna definitiva.** Solo il sospetto che i Custodi non siano gli unici, o i veri, autori delle Revisioni.

#### I-14 — Le Vie Sbagliate (`Q-09`)
- **A:** una torre di Kesh, intera, in mezzo alle Piane di Sal.
- **B:** tre Giuramenti identici, *"Lo giuro"*, incisi da mani diverse; il terzo è più recente.
- **C:** le Cronache pubbliche non parlano della Dispersione, gli originali sì; la Mappa di Oda mostra le vie vere; il Sigillo della Cornice archiviato sotto il nome sbagliato.
- **Conclusione:** la Rete nacque rotta; i Connettori giurarono più volte di averla aggiustata; il fallimento fu nascosto dalle copie ufficiali.

---

## 13. Misteri

### Panoramica

| Stato | Misteri |
|---|---|
| **Risolti** | `M-21` Guerra dei Campi Ciechi · `M-22` Disallineamento delle Frequenze · `M-23` Sommosse del Grigio · `M-30` La Spirale |
| **Parzialmente risolti** | `M-07` Il Doppio · `M-10` Il Cursore e lo Stato · `M-12` I Linker, i Leggendari e la Catalisi · `M-20` Il Secondo Rogo · `M-29` Cosa sanno i Tracciatori Nudi |
| **Irrisolti** (protetti) | `M-01` L'Autore · `M-02` La natura del Lettore · `M-03` Chi rivede il Lettore · `M-04` DrIce · `M-05` Il Quadrato e il Ghiaccio · `M-06` Il Lungo Silenzio · `M-08` Oltre il Campo · `M-09` Aurel Maskh e il sesto elemento · `M-13` Il Rossore · `M-14` Il Volto Abbandonato · `M-24` Le Quattro Mani |
| **Falsi misteri** | `M-16` Le ventiquattro tacche · `M-17` Le sedici fiamme · `M-18` Le nove caselle · `M-19` La Quinta Parte |
| **Da sviluppare** | `M-11` La Scissione · `M-15` La tavola 7 · `M-25` Lo Stallo · `M-26` Il Cerchio di Rúnstedt · `M-27` La Caster del Prologo · `M-28` La lettera consumata del Primo Laboratorio |

### Misteri irrisolti

#### M-01 — L'Autore
- **Verità canonica:** `[CANONE APERTO]` I testi più antichi parlano di un Autore che ha teso la Tela, "ma non dicono altro". Nessuna verità oltre a questa.
- **Conoscenza comune:** i caster comuni "hanno smesso di chiederselo da secoli".
- **Leggenda:** l'Autore sposta le lanterne dell'Atrio.
- **Falsa interpretazione:** "L'Autore è il Lettore." Non è stabilito; non va né confermato né smentito.
- **Informazione incompleta:** il ritmo delle Revisioni non sembra umano (`I-13`).
- **Informazione segreta:** nessuna. Non esiste una rivelazione finale.
- **Informazione DEV:** la figura dell'Autore nasce dal fatto che le Revisioni seguono i commit reali: è un riflesso dello sviluppo. Questa è l'**ispirazione**, non una soluzione: nel mondo il rapporto tra Autore, Archivista, Custodi e Lettore resta aperto.
- **Ipotesi ammesse** `[IPOTESI]`: (a) l'Autore esiste ed è fuori dalla Tela; (b) l'Autore è un'invenzione dei Custodi per giustificare il proprio potere; (c) l'Autore e DrIce sono la stessa cosa; (d) "Autore" è il nome antico di ciò che oggi si chiama Lettore. Nessuna va confermata.
- **Regola:** mistero di lunghissimo periodo. Nessuna quest lo chiude.

#### M-02 — La natura del Lettore
- **Verità canonica:** `[CANONE APERTO]` Nessuno sa cosa sia. Per i mistici è una coscienza, per gli ingegneri un comparatore. Le sue leggi (Tratto Unico, Soglia, Familiarità, Precedenza) sono certe.
- **Conoscenza comune:** "il Lettore legge".
- **Falsa interpretazione:** i Connettori: "è solo un meccanismo".
- **Informazione segreta:** il Lettore riconosce più forme di quelle ufficiali (la forma del Cursore, `I-10`; l'ultima lettera di Aurel).
- **Informazione DEV:** corrisponde al riconoscitore di gesti (`dollar-recognizer.js`, soglia 60%, margine dal 40% al 50%). **Mai** suggerirlo nel gioco oltre l'ammiccamento di livello 1.
- **Regola:** il Lettore non parla mai.

#### M-03 — Chi rivede il Lettore
- **Verità canonica:** `[CANONE APERTO]` I Custodi sostengono di farlo; il Lungo Silenzio, il Risveglio e il Volto Abbandonato raccontano "un'altra storia".
- **Conoscenza comune:** le Revisioni sono opera dei Custodi.
- **Falsa interpretazione** (forse): la versione ufficiale.
- **Informazione incompleta:** i Custodi non sanno spiegare i propri Silenzi.
- **Informazione DEV:** le Revisioni sono le versioni reali del gioco.
- **Ipotesi ammesse:** (a) i Custodi eseguono, ma non decidono; (b) i Custodi interpretano ciò che il Lettore decide da solo; (c) i Custodi sono in contatto con l'Autore; (d) i Custodi hanno perso il controllo delle Revisioni durante il Lungo Silenzio.

#### M-04 — DrIce, l'Archivista
- **Verità canonica:** `[CANONE APERTO]` Firma di tutte le Cronache; nessuno nell'ordine dice di conoscerlo; c'è chi lo legge "il Dottore del Ghiaccio".
- **Conoscenza comune:** "un nome sulle Cronache".
- **Leggenda:** l'Archivista vive dentro l'Archivio Ardente, e scrive con il calore della pietra.
- **Falsa interpretazione:** "DrIce è un Custode come gli altri."
- **Informazione incompleta:** le copie pubbliche delle Cronache portano la firma, ma non sono state scritte dalla stessa mano degli originali `[PROPOSTA]`.
- **Informazione DEV:** "DrIce" è il nome che compare nei credits del gioco (`version.html`). Nel mondo resta protetto.
- **Ipotesi ammesse:** (a) DrIce è l'Autore; (b) è un titolo tramandato tra gli Archivisti; (c) è il Lettore che firma; (d) è legato al Ghiaccio e al Quadrato. Nessuna va confermata.
- **Regola:** DrIce non compare mai come personaggio (`P-16`).

#### M-05 — Il Quadrato, il Manichino e il Ghiaccio
- **Verità canonica:** `[CANONE]` Il Manichino è fatto di quadrati perché il quadrato "allora" era una forma che il Lettore non leggeva; "Nessuno si è mai chiesto perché il Manichino non si rompa mai." `[APOCRIFO]` Il Segno del Ghiaccio è il Quadrato; il Ghiaccio è l'unico elemento che nessuno sostiene di aver visto tracciare.
- **Conoscenza comune:** il quadrato è un materiale "muto", utile per costruire.
- **Falsa interpretazione:** i Connettori: "il quadrato è solo una forma senza significato".
- **Informazione segreta (scopribile):** i blocchi del Manichino non si rompono e si ricompongono (`I-12`).
- **Informazione DEV:** il Manichino usa un'immagine quadrata (`square.png`) solo perché era un segnaposto. Il mistero nasce da un segnaposto. Il Ghiaccio è un elemento futuro del README.
- **Regola:** la catena `I-12` non ha conclusione. Il giorno in cui il Ghiaccio diventerà un elemento giocabile `[DA DECIDERE]` andrà deciso se il Quadrato e il Manichino vi siano legati.

#### M-06 — Il Lungo Silenzio
- **Verità canonica:** `[CANONE APERTO]` Quasi un anno senza Revisioni; i Custodi non spiegarono; tre ipotesi popolari (studio, divisione, il Lettore smise di rispondere).
- **Conoscenza comune:** "il Silenzio".
- **Falsa interpretazione:** Elvar Sund: "fu un periodo di studio voluto".
- **Informazione DEV:** dieci mesi e mezzo senza commit (2025-11-13 → 2026-09-30). La causa reale appartiene alla vita reale e **non entra nella lore**.
- **Regola:** nessuna delle tre ipotesi canoniche va confermata.

#### M-08 — Le Terre Oltre il Campo e il Primo Passo
- **Verità canonica:** `[APOCRIFO]` I Connettori sono convinti che la registrazione del Primo Passo sia una visione dell'Oltre.
- **Conoscenza comune:** "oltre l'Orlo non c'è niente" (credenza di Sienne Vael).
- **Informazione segreta:** l'Aquilone di Sienne viene tirato verso l'oltre (`R-04`).
- **Informazione DEV:** il prototipo dell'Open World è un quadrato che si sposta di 250 unità (`client/dev/openworld/`).
- **Regola:** l'Open World **è** l'Oltre, ma non deve mai finire: deve esistere sempre un bordo ulteriore, non raggiungibile.

#### M-09 — Aurel Maskh e il sesto elemento
- **Verità canonica:** `[CANONE APERTO]` Si dice che cercasse un sesto elemento e che lo abbia trovato.
- **Leggenda:** Aurel trovò la Luce al centro di tutti gli elementi.
- **Informazione incompleta:** l'ultima lettera, con l'ultima pagina strappata.
- **Informazione DEV:** il Rosone e il colore della Luce esistono già nel codice (`element-patterns.js`, `elements.js`), ma la Luce non è un elemento giocabile.
- **Ipotesi ammesse:** (a) il sesto elemento è la Luce; (b) è un elemento sconosciuto; (c) Aurel non trovò nulla e scomparve per questo.
- **Regola:** la stanza del Nocciolo non si apre del tutto; l'ultima pagina non si trova.

#### M-13 — Il Rossore
- **Verità canonica:** `[CANONE APERTO]` "Nessuno sa se sia la Tela a tingerle o l'occhio di chi combatte."
- **Informazione DEV:** è una scelta di leggibilità dell'interfaccia (colori dell'avversario in `elements.js`).
- **Regola:** mistero minore; può restare aperto per sempre senza danni.

#### M-14 — Il Volto Abbandonato
- **Verità canonica:** `[CANONE APERTO]` Il tentativo fu abbandonato; nessuno ne parla volentieri.
- **Informazione DEV:** il tema "Rework UI" visse due giorni (2026-10-01 → 2026-10-03).
- **Regola:** il motivo dell'abbandono non va spiegato.

#### M-24 — Le Quattro Mani: storia o leggenda?
- **Verità canonica:** `[CANONE APERTO]` "Le loro storie non sono verificabili."
- **Informazione DEV:** il Tempo Selvatico corrisponde a un solo giorno reale (il primo commit).
- **Regola:** le reliquie dei Primi Tracciatori possono essere autentiche o no. Il gioco non lo dice mai.

### Misteri parzialmente risolti

#### M-07 — Il Doppio
- **Verità canonica:** `[CANONE]` echi di caster dalle porte rimaste aperte o doppie; il Battito li recide.
- **Informazione scopribile:** il primo sigillo fallì; i Doppi sono sepolti, non estinti (`I-03`).
- **Resta aperto:** se un Doppio possa ancora formarsi oggi.

#### M-10 — Il Cursore e lo Stato
- **Verità canonica:** `[CANONE]` Il Lettore riconosce la forma del Cursore. `[APOCRIFO]` Lo Stato ha la forma del Puntatore.
- **Resta aperto:** che cosa succeda se un caster traccia sé stesso (lo Stato non è legge).

#### M-12 — I Linker, i Leggendari e la Catalisi
- **Verità canonica:** `[CANONE]` I Linker sono echi del Rumore del Substrato; un Leggendario è "quasi sempre" l'eco di un ultimo cerchio; un quinto del Catalizzante si perde sempre.
- **Falsa interpretazione:** Livia Strand: "tutti i Linker sono morti"; Rask: "i BitRune sono puliti" `[IPOTESI]` (anche i BitRune vengono da residui di Segni).
- **Resta aperto e protetto:** se la Catalisi sia una liberazione o una seconda morte.

#### M-20 — Il Secondo Rogo
- **Verità canonica:** `[CANONE]` un duello senza regole e venti incendiati impossibili da sciogliere.
- **Informazione scopribile** `[PROPOSTA]`: il difetto della copia fantasma (`I-09`).
- **Resta aperto:** chi abbia acceso il primo fuoco.

#### M-29 — Cosa sanno i Tracciatori Nudi
- **Verità canonica:** `[CANONE]` rifiutano i Linker.
- **Resta aperto:** come abbiano saputo dei Leggendari prima degli altri `[DA DECIDERE]`.

### Misteri risolti

| ID | Mistero | Risposta canonica | Dove si ricostruisce |
|---|---|---|---|
| `M-21` | La Guerra dei Campi Ciechi | Campi disuguali; Convenzione dell'Intersezione | `I-02` |
| `M-22` | Il Disallineamento | Frequenze diverse; Tempo Comune | `I-05` |
| `M-23` | Le Sommosse del Grigio | Estrazioni senza garanzia; Patto delle Dieci e delle Sessanta | memoriale dell'Emporio |
| `M-30` | La Spirale | Crescita automatica; Riforma | `I-06` |

### Falsi misteri

Domande che i caster si pongono, ma la cui risposta è irrilevante o è una coincidenza. Devono restare **dibattiti** nel mondo; il DEV conosce la verità prosaica.

| ID | Dibattito in-world | Verità `[DEV]` |
|---|---|---|
| `M-16` | Le ventiquattro tacche sono le rune della Fila Antica o le ore di un giorno? | Nel codice i segmenti radiali del cerchio sono 24 (`numSegments`). Una scelta estetica. |
| `M-17` | Le sedici fiamme del fuoco sono le sedici rune della Fila Giovane? | Il Rosone del fuoco ha 16 raggi. Coincidenza. |
| `M-18` | Le nove caselle della Matrix sono le nove pagine del Grimorio? | La griglia 3×3 di `Matrix.svg` e i 9 slot dello spellbook sono nati separatamente. `[DA DECIDERE]` se renderla una connessione voluta. |
| `M-19` | La Quinta Parte è misericordia o elemosina? | Dopo il burnout il mana riparte dal 20%. È una scelta di bilanciamento. |

### Misteri da sviluppare `[DA SVILUPPARE]`

- **`M-11` La Scissione:** cosa succede al Corpo durante una Scissione lunga? Il Cursore può allontanarsi troppo?
- **`M-15` La tavola 7:** chi incise la legge dell'Elettrificazione nella Cava di Nerea Solt, che morì convinta che le leggi fossero undici?
- **`M-25` Lo Stallo:** la profezia del raggio di luce contro il raggio d'oscurità. Va tenuta per il giorno in cui Luce e Oscurità diventeranno legge.
- **`M-26` Il Cerchio di Rúnstedt:** il Cerchio Personale "appartiene a un caster per tutta la vita". Perché quello di Halvard gira ancora sopra la sua tomba?
- **`M-27` La Caster del Prologo:** il suo nome è nelle rune del suo Cerchio Personale (vedi `P-18`).
- **`M-28` La lettera consumata del Primo Laboratorio:** quale lettera firma l'iscrizione dell'architrave? Non deve risolvere `M-04`.

---

## 14. Linker dell'Open World

### Regole generali

**Cosa resta identico** (sistema canonico, `linker-data.js`):
- cinque Nodi (Core, Matrix, Relay, Conduit, Apex), uno per Linker;
- risonanza principale decisa dal Nodo, con le regole di sempre (Core: Vitalità; Matrix: Forza; Relay: Mana%, Rigenerazione%, Mana; Conduit: Bonus DMG di un elemento; Apex: Tasso CRIT, DMG CRIT, ATK%, HP%, Bonus DMG elementale);
- risonanze secondarie dalle Nove Risonanze, tante quante le stelle (massimo quattro), mai ripetute né uguali alla principale;
- Scala dei Cinque Lumi; valori indipendenti dalla rarità, salvo la principale dei Leggendari (×1,15);
- bonus a 2 e a 4 pezzi; **nessun bonus a 5**;
- Gradi fino a +32, una risonanza secondaria potenziata ogni quattro gradi;
- Catalisi con la resa dell'80%.

**Cosa cambia** `[PROPOSTA]`:
- **Origine.** I set dell'Open World non vengono dalle Fonderie. Quando un difetto antico viene sconfitto, la sua eco non sprofonda nel Substrato: **si cristallizza subito**, senza bisogno di essere sintonizzata. I caster li chiamano **Linker Orfani**. Gli Orfani di uno stesso difetto si riconoscono tra loro come quelli di una stessa Fonderia: la Risonanza nasce dall'origine comune.
- **Ottenimento.** Solo come ricompensa del Boss collegato, ripetibile. Slot casuale, come oggi. Rarità minima **Raro** (un Boss non lascia echi deboli) `[DA BILANCIARE]`. Il Patto delle Dieci e delle Sessanta vale solo per l'Emporio: `[DA DECIDERE]` se le cacce abbiano una garanzia propria.
- **Colore.** Ogni set ha un colore, come le Fonderie; il set del Doppio non ne ha uno proprio (vedi `S-01`).
- **La Memoria dell'Eco** `[PROPOSTA]`. Ogni Linker Orfano rivela una riga della propria memoria ogni quattro gradi, cioè ogni volta che una risonanza secondaria si rafforza (la stessa cadenza del sistema attuale). A +32 il giocatore ha letto otto righe per Linker: quaranta righe per set, che raccontano il difetto dal suo punto di vista. È il modo in cui il set "spiega sé stesso" senza esposizione diretta.
- **Effetti.** Regola della Doppia Natura (R10): il bonus a 2 pezzi è il difetto addomesticato, quello a 4 pezzi è la correzione. Molti effetti richiedono codice nuovo (`[RICHIEDE MECCANICA]`); tutti i numeri sono `[DA BILANCIARE]`.
- **Nomi.** Regola delle Fonderie: una parola delle macchine e una della magia.

**Il Patto e gli Orfani** `[IPOTESI]`. I Linker Orfani non sono legati da nessun patto, eppure la loro Risonanza si ferma a quattro come quella delle Fonderie. Le Fonderie sostengono che il Patto del Quinto Nodo sia una loro scelta; gli Orfani suggeriscono che forse il Patto abbia solo dato un nome a una legge della Tela. **Non va risolto**: è un indizio per `Q-11`. `[DA DECIDERE]` se renderlo esplicito.

### I set

#### S-01 — Eco di Sessione
- **Colore:** nessun colore proprio: prende **il colore del Cerchio Personale di chi lo indossa**, come il Doppio copia chi ha davanti.
- **Origine narrativa:** l'eco cristallizzata del Doppio, la somma delle porte lasciate aperte.
- **Boss:** `BM-01` Il Doppio. **Evento:** i Doppi del Lungo Silenzio; il Battito della Nona Revisione.
- **Linker:** 5.

| Nodo | Nome | Significato |
|---|---|---|
| Core | Il Cuore che Risponde | Il Battito chiede "ci sei?"; il cuore risponde. |
| Matrix | Lo Stampo Gemello | Lo stampo da cui escono le copie. |
| Relay | La Seconda Porta | La sessione doppia che chiude la prima. |
| Conduit | Il Condotto dell'Eco | Ciò che porta l'eco fuori dal cerchio. |
| Apex | La Vetta non Recisa | Ciò che è sopravvissuto al Battito. |

- **Rarità:** da Raro a Leggendario. **Risonanze:** regole canoniche.
- **Descrizione narrativa:** *"Non sa di chi è. Sa solo che qualcuno, una volta, non ha chiuso la porta."*
- **Bonus a 2 pezzi — Eco** (il difetto): ogni proiettile lanciato da un cerchio ha il 20% di probabilità di generare un'eco, una copia di mana puro che parte 0,4 battiti dopo nella stessa direzione e infligge il 40% del danno. `[RICHIEDE MECCANICA]`
- **Bonus a 4 pezzi — Battito** (la correzione): ogni 25 battiti la prossima eco è garantita e porta l'elemento del cerchio, con le sue Reazioni. Gli effetti che copiano o rubano le tue magie falliscono contro di te: la seconda porta chiude la prima.
- **Quinto Nodo** `[DA DECIDERE]`: con quattro pezzi, l'Eco imita al 50% una risonanza secondaria del Linker nel quinto Nodo. *Imita, non possiede*. Vincolo: l'effetto **non** si applica se il quinto Linker appartiene allo stesso set, altrimenti sarebbe un bonus a 5 pezzi travestito.

#### S-02 — Viewport Cieco
- **Colore:** il nero velato dei margini `[PROPOSTA: #3a3f55]`.
- **Origine narrativa:** ciò che fu tracciato oltre la vista altrui durante la Guerra dei Campi Ciechi.
- **Boss:** `BM-02` Il Vasto. **Evento:** la Guerra dei Campi Ciechi; la Convenzione.

| Nodo | Nome | Significato |
|---|---|---|
| Core | Il Margine Stretto | La vita dei caster dai Campi stretti, come Amsel. |
| Matrix | Gli Ottocento Passi | Il lato del Quadrato della prima Convenzione. |
| Relay | La Cornice Larga | Il Campo più vasto, che vedeva di più. |
| Conduit | Il Colpo dal Nulla | Ciò che arrivava da oltre il bordo. |
| Apex | L'Occhio d'Intersezione | L'occhio dell'Apice che vede solo ciò che vedono entrambi. |

- **Descrizione narrativa:** *"Fu forgiato dove nessuno guardava."*
- **Bonus a 2 pezzi — Campo Cieco:** le tue magie infliggono il 15% di danno in più ai nemici che non ti stanno guardando. `[RICHIEDE MECCANICA]` (orientamento dei nemici).
- **Bonus a 4 pezzi — Intersezione:** subisci il 20% di danno in meno dalle magie lanciate da fuori dalla tua visuale; chi ti attacca da fuori campo viene segnalato sul bordo dello schermo per 3 battiti.
- **Quinto Nodo:** nessuna relazione.

#### S-03 — Sentiero Assoluto
- **Colore:** l'ocra dei cartelli stradali `[PROPOSTA: #c9a227]`.
- **Origine narrativa:** ciò che la Dispersione delle Vie spostò e che nessuno rimise a posto.
- **Boss:** `BM-03` Il Viandante delle Vie Sbagliate. **Evento:** la Dispersione delle Vie (Rev IV, `[PROPOSTA]`).

| Nodo | Nome | Significato |
|---|---|---|
| Core | La Radice | Il punto da cui ripartono tutte le vie. |
| Matrix | L'Indirizzo Esatto | Ciò che ogni cosa avrebbe dovuto avere. |
| Relay | Il Bivio Pubblico | Il bivio tra la via "pubblica" e quella che non lo era. |
| Conduit | Il Modulo Ritrovato | Il Sigillo della Cornice, archiviato sotto il nome sbagliato. |
| Apex | Il Giuramento | "Lo giuro", inciso tre volte. |

- **Descrizione narrativa:** *"Questa volta ogni cosa è al suo posto."*
- **Bonus a 2 pezzi — Vie Sbagliate:** una volta ogni 15 battiti, il tuo prossimo proiettile porta con sé il tuo cerchio magico, che ricompare nel punto d'impatto con le cariche rimaste. `[RICHIEDE MECCANICA]`
- **Bonus a 4 pezzi — Ogni Cosa al Suo Posto:** lo Smarrimento (aria) che subisci dura la metà; sei immune agli effetti che spostano il tuo Corpo o il tuo cerchio contro la tua volontà.
- **Quinto Nodo:** nessuna relazione.

#### S-04 — Socket Muto
- **Colore:** il grigio pietra dell'Arena Muta `[PROPOSTA: #8a8f99]`.
- **Origine narrativa:** l'attesa di chi entrò nella Prima Arena e non trovò nessuno.
- **Boss:** `B-01` L'Atteso. **Evento:** l'Arena Muta (Rev IV).

| Nodo | Nome | Significato |
|---|---|---|
| Core | La Sala Vuota | Il campo su cui si aprivano le porte. |
| Matrix | Il Conteggio Zero | Il numero dei presenti, fermo. |
| Relay | Il Canale | Il passaggio che ancora non esisteva. |
| Conduit | Il Primo Messaggio | L'indirizzo, la voce, la coda. |
| Apex | Sono Pronto | La frase del rito. |

- **Descrizione narrativa:** *"Ha aspettato così a lungo che ha imparato a farlo bene."*
- **Bonus a 2 pezzi — Attesa:** per ogni 2 battiti in cui non lanci magie, la tua prossima magia infligge l'8% di danno in più (fino al 32%).
- **Bonus a 4 pezzi — Duello Trovato:** quando un nemico entra per la prima volta nel tuo Campo, per 5 battiti il tuo Tasso CRIT aumenta del 15%.
- **Quinto Nodo:** nessuna relazione.

#### S-05 — Loop a Spirale
- **Colore:** il verde dell'anello che si allarga a ogni salita di livello `[PROPOSTA: #55ff71, lo stesso colore usato nel gioco]`.
- **Origine narrativa:** la crescita automatica dei tempi prima della Riforma.
- **Boss:** `B-02` La Spirale. **Evento:** la Spirale e la Riforma dei Livelli (Rev X).

| Nodo | Nome | Significato |
|---|---|---|
| Core | Il Primo Livello | Il punto in cui la Spirale cominciò. |
| Matrix | La Spira | Ogni giro più largo del precedente. |
| Relay | La Misura | La Seconda Revisione, che insegnò al Lettore a misurare. |
| Conduit | Il Punto non Speso | Ciò che la Riforma restituì: possibilità. |
| Apex | La Riforma | La fine della Spirale. |

- **Descrizione narrativa:** *"Cresceva senza scegliere. Poi qualcuno le ha chiesto cosa volesse diventare."*
- **Bonus a 2 pezzi — Spirale:** ogni colpo a segno consecutivo aumenta la tua Forza del 2%, fino a 8 volte. I cumuli si azzerano se manchi un colpo o vai in Sovraccarico. `[RICHIEDE MECCANICA]`
- **Bonus a 4 pezzi — Possibilità:** quando i cumuli si azzerano, recuperi 1 mana per ogni cumulo perso.
- **Quinto Nodo:** nessuna relazione.

#### S-06 — Frequenza del Battito
- **Colore:** il bianco-azzurro del Tempo Comune `[PROPOSTA: #9fd8ff]`.
- **Origine narrativa:** tutto ciò che corse troppo veloce prima del Tempo Comune.
- **Boss:** `B-03` Lo Sfasato. **Evento:** il Disallineamento delle Frequenze; il Tempo Comune (Rev XI).

| Nodo | Nome | Significato |
|---|---|---|
| Core | Il Battito Comune | Il tempo uguale per tutti. |
| Matrix | Il Fotogramma | Ogni posa lasciata indietro dallo Sfasato. |
| Relay | Il Sessantesimo | La frequenza a cui fu riportato il tempo. |
| Conduit | Centoquarantaquattro | La frequenza dei caster che correvano più veloci. |
| Apex | Il Quadrante | Lo strumento del Tempo Comune. |

- **Descrizione narrativa:** *"Ha sempre vinto. Non ha mai saputo perché."*
- **Bonus a 2 pezzi — Alta Frequenza:** i tuoi proiettili viaggiano il 25% più veloci.
- **Bonus a 4 pezzi — Tempo Comune:** le Afflizioni che fermano o rallentano il tuo Corpo (Gravame, Battito della Terra, Paralisi) durano il 30% in meno.
- **Quinto Nodo:** nessuna relazione.

#### S-07 — Render Velato
- **Colore:** il viola-nero del Recinto Oscuro `[PROPOSTA: #4b3b6b]`.
- **Origine narrativa:** le aree che nessuno vide, e che quindi nessuno sciolse.
- **Boss:** `B-04` Il Perimetro Cieco. **Evento:** i duelli al buio (Rev VI–VII).

| Nodo | Nome | Significato |
|---|---|---|
| Core | Il Velo | Ciò che copriva le aree. |
| Matrix | Il Perimetro | La forma che nessuno vedeva. |
| Relay | Il Ronzio | La voce che le rese percepibili. |
| Conduit | L'Epitaffio | I caduti del Recinto. |
| Apex | L'Occhio Riaperto | La Settima Revisione. |

- **Descrizione narrativa:** *"Si sente prima di vederlo. Prima, non si sentiva nemmeno."*
- **Bonus a 2 pezzi — Duello al Buio:** le tue aree spaziali sono velate: i nemici non le evitano. Il primo battito in cui un nemico vi si trova infligge il 20% di danno in più. `[RICHIEDE MECCANICA]`
- **Bonus a 4 pezzi — La Voce della Tela:** le aree nemiche invisibili o velate ti vengono rivelate; subisci il 15% di danno in meno dalle aree.
- **Quinto Nodo:** nessuna relazione.

#### S-08 — Incisione Atomica
- **Colore:** il rosso brace dell'Archivio `[PROPOSTA: #d9480f]`.
- **Origine narrativa:** le incisioni sovrascritte nell'Archivio Ardente.
- **Boss:** `B-05` L'Incisione Contesa. **Evento:** i salvataggi che si contraddicevano (Rev VIII).

| Nodo | Nome | Significato |
|---|---|---|
| Core | La Prima Incisione | Ciò che era scritto prima. |
| Matrix | La Seconda Mano | Chi scriveva sopra. |
| Relay | L'Incremento | Il modo di scrivere senza cancellare. |
| Conduit | La Pietra che Ricorda | L'Archivio stesso. |
| Apex | L'Ultima Parola | L'ultima scrittura, quella che vinceva. |

- **Descrizione narrativa:** *"Due mani sulla stessa pietra. Ne restava una sola."*
- **Bonus a 2 pezzi — Sovrascrittura:** quando incidi un nuovo elemento su un cerchio che ne aveva già uno, la prima carica lanciata porta entrambi gli elementi e reagisce come entrambi. `[RICHIEDE MECCANICA]` Attenzione: effetto molto forte. Alternativa più semplice `[NON CANONICO]`: recuperi 2 mana a ogni sovrascrittura.
- **Bonus a 4 pezzi — Atomicità:** le tue aree e i tuoi raggi ignorano la prima Reazione nemica che li muterebbe; la protezione si ricarica dopo 10 battiti. La Legge del Padrone resa inviolabile.
- **Quinto Nodo:** nessuna relazione.

---

## 15. Collegamenti Boss → Linker → Lore

Ogni set chiude una catena. Il giocatore la percorre in ordine sparso, ma alla fine tutti gli anelli si toccano.

**S-01 — Eco di Sessione**
- **Evento storico:** i Doppi nella Coda, durante il Lungo Silenzio.
- **Sviluppo reale:** sessioni duplicate nel matchmaking (`c753079` → `9de6345`).
- **Entità e luogo:** `BM-01` Il Doppio, nella Coda Vecchia sotto l'Arena Muta (`L-05`).
- **Quest e indizi:** `Q-03`, `I-03` (Mira Kell, il Registro del Battito, la Pietra del Forse).
- **Combattimento:** la Coda, la Sessione Doppia, il Battito, il Furto del Grimorio.
- **Set ed effetti:** l'eco (2 pezzi), il Battito (4 pezzi).
- **Lore scoperta:** i Doppi erano echi di vivi; chiunque può averne uno. La Memoria dell'Eco, grado dopo grado, racconta la notte in cui un caster lasciò la sua porta aperta.

**S-02 — Viewport Cieco**
- **Evento storico:** la Guerra dei Campi Ciechi. **Sviluppo reale:** arena non condivisa → "Fix arena area (sadly)" → rettangolo d'intersezione.
- **Entità e luogo:** `BM-02` Il Vasto, nei Campi Ciechi (`L-06`).
- **Quest e indizi:** `Q-04`, `I-02` (Amsel, le Pietre, il segno di rammarico).
- **Combattimento:** Colpo dal Margine, Fase del Quadrato, Fase dell'Intersezione.
- **Set ed effetti:** colpire chi non guarda (2), non essere colpiti da chi non si vede (4).
- **Lore scoperta:** il Quadrato fu un compromesso; la giustizia arrivò dopo.

**S-03 — Sentiero Assoluto**
- **Evento storico:** la Dispersione delle Vie `[PROPOSTA]`. **Sviluppo reale:** il caos dei percorsi del deploy (`13a67be`, `00d1090`).
- **Entità e luogo:** `BM-03` Il Viandante, nelle Vie Sbagliate (`L-16`).
- **Quest e indizi:** `Q-09`, `I-14` (la torre fuori posto, i tre Giuramenti, la Mappa di Oda).
- **Combattimento:** il labirinto, la Radice.
- **Set ed effetti:** spostare il proprio cerchio (2), non essere spostati (4).
- **Lore scoperta:** la Rete nacque rotta, e il fallimento fu nascosto dalle Cronache pubbliche.

**S-04 — Socket Muto**
- **Evento storico:** l'Arena Muta. **Sviluppo reale:** la prima arena non funzionante (`6b32547` → `4f2c0ff`).
- **Entità e luogo:** `B-01` L'Atteso, nell'Arena Muta (`L-05`); `MB-01` L'Ospite di Casa nell'atrio.
- **Quest e indizi:** `Q-07`, `I-04`, `I-07`.
- **Combattimento:** il Primo Messaggio, il rito, il Silenzio.
- **Set ed effetti:** l'attesa che si carica (2), il duello che finalmente arriva (4).
- **Lore scoperta:** cosa serve perché due caster possano incontrarsi.

**S-05 — Loop a Spirale**
- **Evento storico:** la Spirale. **Sviluppo reale:** livelli che aumentavano automaticamente il mana; nuovo sistema di statistiche (`302ac09`).
- **Entità e luogo:** `B-02` La Spirale, nella Torre della Misura (Kesh).
- **Quest e indizi:** `Q-06`, `I-06`.
- **Combattimento:** la crescita automatica, i quattro pilastri, la Riforma.
- **Set ed effetti:** la forza che cresce da sola (2), la possibilità che nasce dalla perdita (4).
- **Lore scoperta:** il potere che cresce da solo è un'ingiustizia.

**S-06 — Frequenza del Battito**
- **Evento storico:** il Disallineamento delle Frequenze. **Sviluppo reale:** la velocità del gioco legata alla frequenza dello schermo (fix 0.11).
- **Entità e luogo:** `B-03` Lo Sfasato, nell'Osservatorio delle Frequenze (Orlo).
- **Quest e indizi:** `Q-05`, `I-05`.
- **Combattimento:** i Fotogrammi, i Quadranti del Tempo Comune.
- **Set ed effetti:** essere più veloci (2), non essere fermati (4).
- **Lore scoperta:** alcune vittorie del passato non furono meritate.

**S-07 — Render Velato**
- **Evento storico:** i duelli al buio. **Sviluppo reale:** aree avversarie invisibili (origine presunta `5319a2f`, fix `61851c2`).
- **Entità e luogo:** `B-04` Il Perimetro Cieco, nel Recinto Oscuro (`L-07`).
- **Quest e indizi:** epitaffi del Recinto; le Zone del Silenzio, dove le aree si vedono.
- **Combattimento:** aree invisibili ma udibili.
- **Set ed effetti:** nascondere le proprie aree (2), vedere quelle nemiche (4).
- **Lore scoperta:** la Tela ebbe bisogno di una voce per non nascondere più.

**S-08 — Incisione Atomica**
- **Evento storico:** i salvataggi che si contraddicevano. **Sviluppo reale:** letture e scritture concorrenti; salvataggi da un solo punto e incrementi atomici.
- **Entità e luogo:** `B-05` L'Incisione Contesa, negli strati intermedi dell'Archivio (`L-10`).
- **Quest e indizi:** `Q-08`, `I-08`.
- **Combattimento:** la Sovrascrittura, le pietre-terminale.
- **Set ed effetti:** due elementi in un colpo (2), magie permanenti che non si lasciano riscrivere (4).
- **Lore scoperta:** anche la memoria della Tela può sbagliare.

**Come il giocatore capisce che non è casuale.** Le parole tornano. "Sono Pronto", "Il Giuramento", "Gli Ottocento Passi", "Il Ronzio" sono prima frasi trovate negli indizi, poi nomi di Linker, poi righe della Memoria dell'Eco. Quando il giocatore riconosce nel nome di un Linker una frase letta su una pietra, ha capito che i set sono pezzi di storia.

---

## 16. Semi per il futuro

Niente di questa sezione è canonico. Sono idee da non perdere.

| ID | Seme | Stato | Note |
|---|---|---|---|
| `SEME-01` | **Numerazione delle Revisioni future.** La 0.13 chiude la Revisione XIII? La 1.0 è una "Prima Chiusura", l'inizio di un nuovo ciclo? La 2.0 (Open World) è "la Revisione del Primo Passo"? | `[DA DECIDERE]` | Decidere prima di rilasciare la 1.0. |
| `SEME-02` | **Luce e Oscurità.** Quando diventeranno legge: il Primo Tracciatore della Luce potrebbe essere legato ad Aurel Maskh (senza confermare `M-09`); lo Stallo diventa un evento PvP rarissimo o un incontro dell'Open World. | `[DA SVILUPPARE]` | Il Rosone della Luce esiste già nel codice. |
| `SEME-03` | **Veleno e Benessere.** Veleno: un guaritore delle Piane di Sal, perché solo l'acqua lo scioglie. Benessere: un Segno senza Primo Tracciatore noto, l'unico "trovato in un sogno". | `[PROPOSTA]` | |
| `SEME-04` | **Metallo.** Nasce nelle forge di Kesh (la Scala Spezzata a cui è stato restituito il muro). L'Overclock e il Firewall se ne contenderanno la paternità. | `[PROPOSTA]` | |
| `SEME-05` | **Ghiaccio.** Non assegnare un Primo Tracciatore prima di aver deciso `M-05`. Possibile momento chiave: "il Quadrato si scioglie". | `[DA DECIDERE]` | Massima cautela: tocca DrIce. |
| `SEME-06` | **Trappola.** Il Segno del Cane da Guardia potrebbe essere stato usato dall'Arbitrato come sigillo delle sentinelle dell'Arena. | `[PROPOSTA]` | |
| `SEME-07` | **Stato.** Quando sarà implementato, la quest rivela che ogni caster porta il proprio Segno addosso (il Cursore). | `[DA SVILUPPARE]` | Chiude parzialmente `M-10`. |
| `SEME-08` | **La Scissione** (`Q-16`), con Muro e Cinetica. Vesh e la statua di Vasko come maestri. | `[DA SVILUPPARE]` | Legata alla roadmap 1.2.5. |
| `SEME-09` | **Una quinta Fonderia.** Deve nascere da un evento. Esempio: uno scisma del Kernel dopo la scoperta della Luce, *Shader Luminoso*. | `[PROPOSTA]` | Il canone parla di "Quattro Fonderie": una quinta è un'aggiunta, non una contraddizione. |
| `SEME-10` | **Set dai Miniboss.** *Buffer di Scarica* (Scarica Totale: scaricare tutte le cariche di proposito), *Residuo di Cessione* (Vento Inestinguibile: ciò che si cede lascia un'impronta), *Cache del Cumulo* (Cumulo: grande riserva, lenta). | `[PROPOSTA]` | |
| `SEME-11` | **I difetti della Revisione XIII.** I bug che emergeranno nel sistema dei Linker, dello shop o delle missioni diventeranno le prime entità dell'Era del Collegamento. | `[DA SVILUPPARE]` | Usare la rubrica. |
| `SEME-12` | **Il Libro delle Intenzioni.** Un antico libro dei Custodi che descrive le leggi della Tela come *avrebbero dovuto essere*: è il README. Contiene leggi sbagliate (il mana puro "soggetto a tutte le resistenze"; la folgore "bloccata" dalla terra) e una lista di **profezie** (Luce, Oscurità, Trappola, Benessere, Veleno, Stato, "le Terre Oltre il Campo"). Alcune profezie si sono avverate (la folgore e la Cavità erano annunciate), altre no. | `[PROPOSTA]` | Fonte inaffidabile ideale per il sistema degli indizi. |
| `SEME-13` | **Il Cerchio di Rúnstedt** che gira sopra la tomba (`M-26`). | `[DA SVILUPPARE]` | |
| `SEME-14` | **I Gemelli di Setaccio.** Due caster con lo stesso nome riceverebbero gli stessi incarichi nello stesso ordine. Un nome come destino. Possibile legame con i Doppi. | `[IPOTESI]` | Reale: l'ordine delle missioni dipende da un hash del nome. |
| `SEME-15` | **Il Duello Nudo.** Una modalità o un'arena dei Tracciatori Nudi, senza Linker, dove a ogni vittoria l'Arena tace. | `[PROPOSTA]` | |
| `SEME-16` | **Il bordo ulteriore.** Nelle Terre Oltre il Campo le forme si semplificano fino ai quadrati; esiste sempre un bordo non raggiungibile. | `[PROPOSTA]` | Protegge `M-08`. |
| `SEME-17` | **Il pellegrinaggio dei duecentocinquanta passi.** Camminare per 250 passi verso destra dal bordo dell'Orlo, come il Primo Passo. Cosa succede alla fine `[DA DECIDERE]`. | `[PROPOSTA]` | |
| `SEME-18` | **La Cronaca non firmata.** L'unica Cronaca senza la firma di DrIce. Un oggetto rarissimo, che non spiega nulla ma pone la domanda. | `[IPOTESI]` | Da usare una sola volta. |
| `SEME-19` | **La stanza del Nocciolo socchiusa.** Dalla fessura filtra una luce bianca. Nessuno può entrare. | `[PROPOSTA]` | Protegge `M-09`. |
| `SEME-20` | **Le Ricalibrazioni vive** (sezione 10). | `[PROPOSTA]` | Richiede un processo di rilascio. |
| `SEME-21` | **La Caster del Prologo come mentore** (`P-18`). | `[DA DECIDERE]` | |
| `SEME-22` | **I colori degli strati.** I nemici dell'Open World non hanno il Rossore (che riguarda i caster in duello), ma la tinta della loro Revisione: fucsia sbiadito per la Fondazione, rossastro per i Duelli, grigio polvere per il Silenzio. | `[DA DECIDERE]` | |
| `SEME-23` | **I Cumuli sopravvissuti.** `[DEV]` Sul disco di sviluppo esiste ancora una vecchia cartella `src/spellcasters/node_modules`, non tracciata da git. Nella lore: una discarica di Cumuli mai bruciati, fuori dalla vista dell'Archivio. | `[IPOTESI]` | Easter egg di livello 3. |
| `SEME-24` | **Gli Archivisti** come ordine autonomo, custodi di DrIce senza conoscerlo. | `[DA DECIDERE]` | Vedi `F-02`. |

---

## 17. Tabella generale delle corrispondenze

Indice rapido: da dove viene ogni elemento.

| Elemento originale | Tipo originale | Elemento lore | Tipo Open World | Importanza | Collegamenti |
|---|---|---|---|---|---|
| Primo commit (2025-06-04) | Storia | Tempo Selvatico | Strato archeologico | Alta | Quattro Mani, `M-24` |
| Cerchio magico | Feature | Sefa, il Primo Cerchio | Luogo, quest (`Q-01`) | Alta | `L-11`, `R-01` |
| Fuoco, Acqua, Aria, Terra | Feature | Le Quattro Mani | Regioni, reliquie (`Q-02`) | Alta | Kesh, Piane, Orlo, Holm |
| Fulmine | Feature | Vesh Arandel | NPC vivo, reliquia | Alta | `L-15`, `B-03` |
| Proiettile | Feature | La Linea | Meccanica | Media | `EL-06` |
| Spaziale | Feature | Oda Nerys, la Clessidra | Reliquia (`R-06`) | Media | `BM-03` |
| Laser | Feature | Corva Lenzi, la Cavità | NPC scomparsa, luogo | Media | `EL-03` |
| Riconoscitore dei gesti | Feature | Il Lettore | Mistero (`M-02`) | Alta | Tutto |
| Barra del mana sul bordo | Feature | La Cornice | Meccanica | Media | `R-33` |
| Burnout | Feature | Il Sovraccarico, la Quinta Parte | Meccanica, falso mistero | Media | `M-19` |
| Mouse virtuale | Feature | La Sostituzione, il Cursore | Statua, quest | Alta | `P-07`, `I-10` |
| Manichino del training | Feature | Il Manichino di quadrati | Nemico (`N-08`), mistero | Alta | `M-05`, `Q-12` |
| Tipi `normal` / `heavy` mai usati | Codice inutilizzato | Manichini più pesanti | Nemici dell'Oltre | Media | `L-20` |
| Firestore | Feature | Archivio Ardente | Dungeon (`L-10`) | Alta | `B-05`, `MB-02` |
| `saves/players.json` vuoto | File storico | Tavoletta Vuota | Reliquia (`R-17`) | Media | `I-08` |
| Password con hashing | Feature | Sigillo dei Nomi | Elemento ambientale | Bassa | `L-10` |
| wss | Feature | Canale Sigillato | Elemento ambientale | Bassa | `MB-01` |
| Credenziali in variabile d'ambiente | Rework | Chiave Nascosta | Reliquia assente (`R-32`) | Bassa | `Q-08` |
| Arena non funzionante (0.4) | Feature incompleta | Arena Muta | Dungeon, Boss (`B-01`) | Alta | `S-04` |
| URL di produzione su localhost | Bug | Il Varco rivolto a casa | Miniboss (`MB-01`) | Media | `R-21` |
| Caos dei percorsi del deploy | Bug | Dispersione delle Vie `[PROPOSTA]` | Boss maggiore (`BM-03`) | Alta | `S-03`, `L-16` |
| Modulo della barra del mana con nome sbagliato | Bug | Sigillo della Cornice | Reliquia (`R-33`) | Bassa | `BM-03` |
| Matchmaking fantasma | Bug | I Doppi | Boss maggiore (`BM-01`) | Altissima | `S-01`, `Q-03` |
| Heartbeat 25 s | Fix | Il Battito | Reliquia (`R-25`), meccanica | Alta | `BM-01` |
| Rientro in 20 s | Feature | Varco dei Venti Battiti, Pegni | Collezionabili (`R-18`) | Bassa | `L-04` |
| Arena non condivisa tra schermi | Bug | Guerra dei Campi Ciechi | Boss maggiore (`BM-02`) | Altissima | `S-02`, `L-06` |
| "Fix arena area (sadly)" | Fix | Il Quadrato "a malincuore" | Reliquia (`R-26`) | Alta | `I-02` |
| Aree avversarie invisibili | Bug | Duelli al buio | Boss (`B-04`) | Alta | `S-07`, `L-07` |
| 144 Hz | Bug | Disallineamento, Tempo Comune | Boss (`B-03`) | Alta | `S-06` |
| Livelli che aumentavano il mana | Design | La Spirale, la Riforma | Boss (`B-02`) | Alta | `S-05` |
| Salvataggi in conflitto | Bug | Incisioni contraddittorie | Boss (`B-05`) | Alta | `S-08` |
| `node_modules` committati | Cattiva pratica | I Cumuli | Miniboss (`MB-02`) | Media | `R-24` |
| Uscita con cerchio attivo ("not fully fixed") | Bug | Il cerchio orfano | Miniboss (`MB-03`) | Media | `P-07` |
| Copia fantasma dell'area ceduta | Bug | Secondo Rogo `[PROPOSTA]` | Miniboss (`MB-04`) | Media | `F-03`, `F-04` |
| Cariche consumate tutte insieme | Bug | Scarica Totale | Elite (`EL-01`) | Media | `SEME-10` |
| Danno del magma | Bug | La Colata Cieca | Elite (`EL-02`) | Bassa | `L-14` |
| Laser di folgore con rimbalzi infiniti | Bug di sviluppo | Il Riflesso Infinito | Elite (`EL-03`) | Bassa | `P-10` |
| Ultimo tick del fuoco perso | Bug | L'Ultimo Tizzone | Elite (`EL-04`) | Bassa | `R-30` |
| Rigoglio senza effetto visibile | Bug | La fioritura amara | Elite (`EL-05`) | Bassa | Oasi |
| Riconoscimento dal basso e in 8 direzioni | Limite | Rosa degli Otto Venti | Elite (`EL-06`) | Bassa | `R-29` |
| Profilo incompleto al login | Bug | Gli Incompiuti | Elite (`EL-07`) | Bassa | `L-10` |
| Cancellazione del cerchio | Bug | Cerchi Indelebili | Nemico (`N-01`) | Bassa | `L-02` |
| Proiettili multipli non funzionanti | Feature rotta | Cariche Mute | Nemico (`N-02`) | Bassa | `L-11` |
| Proiettili liberi non neutri | Bug | Infusioni Fantasma | Nemico (`N-03`) | Bassa | — |
| Lampo chiaro nel tema notte | Bug | Lampo Bianco | Nemico (`N-04`) | Bassa | Varchi |
| Click sull'area che blocca il disegno | Bug | Mani Trattenute | Nemico (`N-05`) | Bassa | `L-07` |
| Canvas spostato | Bug | La Faglia | Landmark e nemico (`L-17`, `N-06`) | Bassa | `L-06` |
| Segno non riconosciuto | Feature | Segno Mancato | Nemico (`N-07`) | Bassa | Ovunque |
| Tema "Rework UI" | Feature abbandonata | Il Volto Abbandonato | Luogo (`L-18`) | Media | `R-22`, `M-14` |
| Pausa di 4 mesi (2025) | Storia | "Quattro mesi più tardi" | — | Bassa | `SEME-01` |
| Pausa di 10 mesi e mezzo | Storia | Il Lungo Silenzio | Zone del Silenzio (`L-19`) | Altissima | `M-06` |
| Cinque versioni in sette giorni | Storia | Il Risveglio | Strato archeologico | Alta | Sezione 10 |
| Patch notes | Feature | Le Cronache | Reliquie (`R-16`) | Alta | `P-16` |
| Storico dei bilanciamenti | Feature | Libro delle Ricalibrazioni | Reliquia (`R-30`) | Media | `EL-04` |
| Credits "DrIce" | Credits | DrIce, l'Archivista | Mistero (`M-04`) | Altissima | `M-01`, `M-05` |
| Transizioni con il cerchio runico | Feature | I Varchi, la Bussola | Strumento del giocatore | Media | Sezione 10 |
| Favicon per pagina | Feature | Gli Emblemi | Elemento ambientale | Bassa | `L-01` |
| Sfondo di nebbia della Home | Feature | Atrio delle Nebbie | Hub (`L-01`) | Media | `M-01` |
| Spellbook | Feature | Il Grimorio | Meccanica | Media | `BM-01` |
| Pannello dei Linker | Feature | Halvard Rúnstedt, Cerchio Personale | Tomba, reliquia (`R-11`) | Alta | `Q-11` |
| Set dei Linker | Feature | Le Quattro Fonderie | Fazioni (`F-03`…`F-06`) | Alta | Kesh, Piane, Holm |
| Shop gacha e garanzia | Feature | Emporio, Patto delle Dieci e delle Sessanta | Luogo (`L-08`) | Media | `R-31` |
| Missioni con hash del nome | Feature | Bacheca, Setaccio dei Nomi | Luogo (`L-09`) | Bassa | `SEME-14` |
| Prototipo Open World | Prototipo | Il Primo Passo | Reliquia (`R-27`), regione | Alta | `L-20`, `M-08` |
| README (intenzioni e roadmap) | Documento | Il Libro delle Intenzioni `[PROPOSTA]` | Fonte inaffidabile | Media | `SEME-12` |

---

## 18. Regole anti-contraddizione

Questa sezione è l'**API della lore**: ciò che il futuro sviluppo dell'Open World può usare, estendere o non toccare.

| Elemento | Stabilito | Modificabile | Non modificabile | Ambiguo | Volutamente sconosciuto |
|---|---|---|---|---|---|
| **Tela e Substrato** | Il mondo è una superficie; sotto scorre il Substrato; niente si cancella davvero. | Geografia, regioni nuove. | "Niente si cancella davvero." | Cosa ci sia sotto il Substrato. | Chi ha teso la Tela. |
| **Mana, Cornice, Sovraccarico** | Mana puro azzurro e senza elemento; Cornice dallo Zenit al Nadir; Sovraccarico di 5 battiti con ritorno della Quinta Parte. | I valori numerici (con una Ricalibrazione). | Il mana puro non reagisce e non ha difese elementali. | Misericordia o elemosina. | — |
| **Il Lettore** | Tratto Unico, Soglia, Familiarità, Precedenza; Presagio; Segno Mancato. | Le soglie numeriche (Ricalibrazioni). | Le quattro leggi; il Lettore non parla. | Coscienza o meccanismo. | La sua natura. |
| **Il Cerchio** | Fucsia quando è vuoto; gratuito; gira sempre; uno per mano; 2 anelli e 24 tacche; Legge dell'Àncora. | L'aspetto, purché riconoscibile. | Il fucsia; la Legge del Gesto; una mano, un cerchio. | Il significato delle 24 tacche. | — |
| **Elementi canonici** | Cinque: Fuoco, Acqua, Aria, Terra, Fulmine, con Segni, Rosoni, colori e Afflizioni. | Valori delle Afflizioni (Ricalibrazioni). | I Segni e i loro Primi Tracciatori. | Se le Quattro Mani siano esistite. | — |
| **Proiezioni canoniche** | Linea, Clessidra Coricata, Cavità. | Valori. | I Segni; il laser e lo Spaziale sono permanenti. | — | — |
| **Afflizioni e Reazioni** | Le 12 Leggi di Nerea Solt; Ardore, Gravame, Smarrimento, Battito della Terra, Paralisi. | Valori; nuove Reazioni per i nuovi elementi. | Le Reazioni esistenti tra i cinque elementi. | Chi incise la tavola 7. | — |
| **Revisioni** | Dodici concluse, la tredicesima in corso; intervalli reali delle Revisioni chiuse. | Le Revisioni future. | Date, ordine e contenuto delle Revisioni I–XII. | Chi le fa davvero. | Come avvengono. |
| **Corpo e Cursore** | Due cose che di solito coincidono; il Vincolo; il peso dell'anima. | — | La distinzione Corpo/Cursore. | Quanto possano separarsi. | — |
| **Arbitro e Convenzione** | L'Arbitro ascolta; il rito; il Battito; il Campo d'Intersezione. | L'aspetto dell'Arena. | "Nessuno può raggiungere ciò che l'altro non vede." | — | — |
| **Riforma** | Un Livello dà un Punto Abilità; i Quattro Assi; la Legge della Metà. | Nuovi Assi (con una Revisione). | Il livello non dà potere automatico. | — | — |
| **Cerchio Personale e Nodi** | Cinque Nodi in quest'ordine; nome in rune; croce ᛭; sei File; Violetto di Rúnstedt. | Nuove File; un sesto Nodo solo con una Revisione maggiore. | L'ordine dei Nodi e il cammino del mana. | Perché il cerchio di Halvard gira ancora. | — |
| **Fonderie e Risonanza** | Quattro Fonderie con fondatori, colori e bonus; Risonanza a 2 e a 4; Patto del Quinto Nodo. | Nuove Fonderie (da un evento). | Nessun bonus a 5 pezzi. | Patto o legge naturale (`[IPOTESI]` degli Orfani). | — |
| **Sintonia e Catalisi** | Gli echi vengono dal Rumore; la Scala dei Cinque Lumi; 32 Gradi; un quinto si perde sempre. | Valori. | Gli echi; il Quinto che scende. | I Leggendari "quasi sempre" ultimi cerchi. | Se la Catalisi sia una seconda morte. |
| **Estrazioni e BitRune** | Patto delle Dieci e delle Sessanta; Zecca dell'Arena; 60 BitRune per vittoria. | Prezzi e probabilità. | L'esistenza del Patto. | Se anche i BitRune portino echi. | — |
| **Grimorio** | Nove pagine; scritto solo nel Laboratorio; "ciò che è richiamato non è vissuto"; "ogni pagina aperta è letta". | Il numero delle pagine (con una Revisione). | Le due leggi. | — | — |
| **Personaggi storici** | I fatti di `LORE.md` per ciascuno. | Personalità, luoghi di sepoltura, reliquie. | I fatti canonici. | Chi è ancora vivo (`[DA DECIDERE]`). | — |
| **Apocrifi** | Si raccontano. | Possono diventare legge solo con una Revisione esplicita. | Non diventano veri "per inerzia". | Tutto. | — |
| **Autore, DrIce, Lettore, Custodi** | Le frasi di `LORE.md`, nient'altro. | Si possono aggiungere indizi, mai conferme. | Non si risolvono. | Tutto il rapporto tra loro. | Tutto il rapporto tra loro. |
| **Principio della Persistenza** `[PROPOSTA]` | I difetti corretti sopravvivono come entità. | Il modo in cui riaffiorano. | — (se approvato: che un fix non cancella il passato). | — | — |
| **Linker Orfani** `[PROPOSTA]` | Echi di difetti sconfitti, cristallizzati senza Fonderia. | Tutto, finché non è approvato. | Il rispetto del sistema canonico dei Linker. | Il Patto. | — |

### Regole d'oro

1. **`LORE.md` vince.** Se questo documento lo contraddice, si corregge questo documento.
2. **Le Revisioni chiuse sono storia.** Le Revisioni I–XII non si riscrivono: si possono solo *scoprire* dettagli nuovi (come la Dispersione delle Vie), coerenti con ciò che dicono.
3. **Ogni contenuto ha una fonte**, reale o di lore, dichiarata.
4. **Il rango segue la gravità reale**, non la spettacolarità.
5. **Ogni verità ha almeno tre indizi**, di cui uno non testuale.
6. **Nessun NPC sa tutto.**
7. **I misteri protetti non si chiudono**, nemmeno in questo documento.
8. **Gli Apocrifi non diventano veri per inerzia.**
9. **Il sistema dei Linker non si reinventa**: si estende.
10. **Un mistero irrisolto è un contenuto.**

---

## 19. Informazioni riservate al DEV

Tutto ciò che segue è `[DEV]`: non deve mai arrivare al giocatore in forma esplicita.

### Corrispondenze nascoste

- **Il Tempo Selvatico** corrisponde a un solo giorno reale: il 2025-06-04, data del primo commit.
- **Il Lungo Silenzio** corrisponde a 10 mesi e mezzo senza commit (2025-11-13 → 2026-09-30). La causa reale appartiene alla vita reale e non entra nella lore.
- **DrIce** è il nome che compare nei credits del gioco (`version.html`).
- **L'Autore** è nato come riflesso dello sviluppo reale. È un'ispirazione, non una soluzione (`M-01`).
- **I Cumuli:** "Commit digestion" (`192ccb2`), 12.276 file e 1.555.906 righe rimosse; prima rimozione il 2025-06-13 (`05d4f7d`). Una copia dei vecchi `node_modules` esiste ancora sul disco di sviluppo, fuori da git (`src/spellcasters/node_modules`).
- **La Tavoletta Vuota:** `saves/players.json`, contenuto `{"data": ""}`, dal 2025-06-13 al 2026-09-30.
- **Il Quadrato degli Ottocento:** costante `DEFAULT_ARENA_SIZE: 800` del server.
- **Il Battito:** `HEARTBEAT_MS: 25000`. **Il Varco dei Venti Battiti:** `REJOIN_GRACE_MS: 20000`.
- **I Sette Drappi:** i sette file `style-*-rework.css` rimossi in `5ca83c0`.
- **Il Primo Passo:** `client/dev/openworld/openworld.js`, un quadrato animato con `translateX: 250`.
- **Il Manichino di quadrati:** tutte le parti del nemico usano lo stesso segnaposto, `square.png`.

### Messaggi di commit da addolcire

| Commit | Messaggio originale | Uso nel gioco |
|---|---|---|
| `ed57d63` | Un insulto dello sviluppatore a sé stesso | *"Sono stato uno sciocco."* (`R-21`) |
| `13a67be` | "Move files to correct paths (I SWEAR)" | *"Lo giuro."* (`R-20`) |
| `c753079` | "Fix matchmaking bug? Not sure" | *"Sigillato? Non ne sono certo."* (`R-19`) |
| `9de6345` | "Fix arena area (sadly)" | Il segno "a malincuore" sulle Pietre (`R-26`) |
| `28622f6` | "force fix, not fully fixed" | L'Orfano del Vincolo non si distrugge del tutto (`MB-03`) |
| `192ccb2` | "Commit digestion" | La Digestione del Cumulo (`MB-02`) |

### Discordanze note

| Discordanza | Fonti | Scelta della lore |
|---|---|---|
| Il mana puro è "soggetto a tutte le resistenze" (README), ma il codice non gli applica difese elementali. | README ↔ `player-stats.js` | Si segue il codice. Il README diventa il Libro delle Intenzioni (`SEME-12`). |
| Le proiezioni di folgore sono "bloccate" dalle aree di terra (README), ma nel codice vi rimbalzano. | README ↔ `spell-interactions.js` | Si segue il codice. |
| La roadmap del README (1.0, 1.1, 1.2…) non corrisponde alle versioni reali (0.1 → 0.12). | README ↔ changelog | Valgono le versioni del changelog. |
| La lore dice che i duelli furono falsati "per anni" dai 144 Hz; nella realtà sono circa 16 mesi. | `LORE.md` ↔ git | Tensione tollerata. |
| L'Era del Collegamento dura "anni" nella lore; nella realtà pochi giorni. | `LORE.md` ↔ git | Risolta: una Revisione aperta ha durata libera (sezione 2). |
| I `node_modules` furono rimossi due volte; il changelog ne cita una. | git ↔ changelog | La prima purga diventa materiale dell'Open World (`MB-02`). |

### Proposte che, se approvate, vanno integrate in `LORE.md`

1. **La Dispersione delle Vie** (Rev IV) e il Viandante (`BM-03`).
2. **Il Varco rivolto a casa** (Rev VII) e l'Ospite di Casa (`MB-01`).
3. **Il Principio della Persistenza** (R2).
4. **I Linker Orfani** (sezione 14).
5. **La corrispondenza tra il Secondo Rogo e la copia fantasma** (`MB-04`).
6. **Il nome della Quiete**, i quattro mesi tra la Sesta e la Settima Revisione.
7. **Il Libro delle Intenzioni** (`SEME-12`).

### Procedura di aggiornamento (a ogni nuova versione del gioco)

1. **Revisione.** Aggiungi la versione come Revisione nella sezione 4 e, in forma narrativa, in `LORE.md`.
2. **Difetti.** Per ogni bug corretto calcola l'IG (sezione 8). Con IG ≥ 2 aggiungilo alla tabella *Difetti in attesa di forma* o crea subito un'entità.
3. **Ricalibrazioni.** Ogni bilanciamento diventa una voce del Libro delle Ricalibrazioni e, nell'Open World, una Ricalibrazione viva (sezione 10).
4. **Scoperte.** Ogni funzione nuova diventa una scoperta. Se introduce un Segno, servono un Primo Tracciatore, una ragione per la sua forma, un Rosone, un colore, un'Afflizione e una Reazione.
5. **Silenzi e Risvegli.** Una pausa di oltre due mesi senza commit è un Silenzio (diamogli un nome); tre o più versioni in una settimana sono un Risveglio.
6. **Indici.** Aggiorna la tabella delle corrispondenze (sezione 17) e l'API della lore (sezione 18).
7. **Misteri.** Controlla che nessuna novità chiuda un mistero protetto.

### Checklist per ogni nuovo contenuto dell'Open World

- [ ] Ha una catena completa: fonte reale → evento lore → contenuto → indizi → scoperta.
- [ ] Ha un ID e i riferimenti incrociati.
- [ ] Le verità importanti hanno almeno tre indizi, di cui uno non testuale.
- [ ] Ogni affermazione nuova ha il suo tag (`[PROPOSTA]`, `[IPOTESI]`, …).
- [ ] Non contraddice `LORE.md` né la sezione 18.
- [ ] Non risolve un mistero protetto.
- [ ] Nei testi per il giocatore usa solo il lessico della lore.
- [ ] Se nasce da un bug, il suo rango segue la rubrica (o ha una deroga scritta).
- [ ] Se è un set di Linker, rispetta il sistema canonico e la Regola della Doppia Natura.

