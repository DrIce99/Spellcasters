// changelog.js - Storico delle versioni (ricostruito dalla history git, commit raggruppati per feature).
// La prima voce è la versione corrente: la usano il pulsante in home e la pagina delle patch notes.
// Per una nuova versione basta aggiungere una voce in cima.

export const CHANGE_TYPES = {
  feature: 'Nuove funzionalità',
  logic: 'Modifiche di logica e bilanciamento',
  rework: 'Rework',
  fix: 'Fix'
};

export const CHANGELOG = [
  {
    version: '0.12.0',
    date: '2026-10-06',
    title: 'Animazioni, suoni e bilanciamenti',
    changes: {
      feature: [
        'Transizioni animate tra le pagine, ingressi a cascata, modali e pannelli animati, cambio tema a cerchio',
        'Nuovi effetti sonori di interfaccia e di gioco: cerchio evocato, runa incisa, simbolo fallito, annullamento, burnout, salita di livello, colpi ed esito della partita',
        'Effetti visivi in partita: il cerchio magico si disegna comparendo e si dissolve sparendo, il tratto del simbolo sfuma, onde d\'urto e lampi',
        'Rotella del mouse: sceglie quale carica del cerchio magico lanciare, con un mirino sulla carica selezionata',
        'Impostazioni: indicatore della carica selezionata (nessuno, particelle, mirino o entrambi)',
        'Patch notes: nuova scheda "Bilanciamenti" con lo storico di buff e nerf'
      ],
      logic: [
        'Bilanciamento degli effetti elementali (fuoco, acqua, aria e terra): i dettagli sono nella scheda Bilanciamenti',
        'PvP: l\'arena è il rettangolo visibile da entrambi i giocatori (prima era un quadrato più piccolo)',
        'Le magie rigogliose (acqua + terra) non consumano mana finché dura l\'effetto'
      ],
      fix: [
        'La rigenerazione aumentata delle magie rigogliose non si vedeva: il consumo dell\'area era più alto del bonus',
        'La bruciatura del fuoco perdeva l\'ultimo danno',
        'Tema notte: niente più lampo chiaro all\'apertura delle pagine',
        'Impostazioni: barre di scorrimento inutili nel riquadro'
      ]
    }
  },
  {
    version: '0.11.0',
    date: '2026-10-03',
    title: 'Fulmine e Laser',
    changes: {
      feature: [
        'Nuovo elemento: Fulmine (zig-zag dall\'alto verso il basso). I suoi proiettili e laser rimbalzano sui bordi e sulle aree di terra, le sue aree paralizzano',
        'Paralisi: il corpo resta fermo ma il cursore si muove e si può continuare a disegnare',
        'Nuova proiezione: Laser (linea avanti, indietro e di nuovo avanti, in qualsiasi direzione). Magia permanente: consuma mana ogni 0.1 s e si annulla con il tasto destro',
        'Interazioni: il fulmine elettrifica l\'acqua (danno a entrambi i caster), l\'aria lo ignora; i laser interagiscono con proiettili, aree e altri laser',
        'Effetti sonori delle magie dell\'avversario (proiettili, elementi, aree, laser e cerchio magico)',
        'Effetti sonori del laser per elemento (compreso il fuoco) e del fulmine (evocazione, proiettile e rimbalzo)'
      ],
      rework: [
        'Nuova grafica del cerchio magico del fulmine, della carica laser e del raggio laser',
        'Rimosso il tema sperimentale "Rework UI": resta solo quello classico (con giorno/notte)'
      ],
      logic: [
        'Il proiettile si riconosce in qualsiasi direzione, non solo nelle 8 principali'
      ],
      fix: [
        'Il cerchio magico si riconosce anche se disegnato partendo dal basso, in entrambi i sensi',
        'Proiettili, mana ed effetti di stato vanno alla stessa velocità con qualsiasi frequenza dello schermo (prima a 144 Hz andavano più veloci)',
        'Il proiettile dell\'avversario ha le stesse particelle di lancio del proprio',
        'Un\'area ceduta (aria incendiata) non lascia più una copia "fantasma" non annullabile all\'avversario',
        'Info Giocatore: le etichette dei grafici restavano in un altro font se il font del gioco arrivava in ritardo'
      ]
    }
  },
  {
    version: '0.10.0',
    date: '2026-10-01',
    title: 'Statistiche',
    changes: {
      feature: [
        'Punti abilità: uno per ogni livello, da spendere su HP, ATK base, MP e riduzione consumo mana',
        'Pannello "Statistiche" nella pagina Info Giocatore con l\'elenco completo e l\'anteprima dei potenziamenti',
        'L\'affinità con un elemento dà difesa da quell\'elemento e un margine di errore maggiore nel disegnarne la runa'
      ],
      logic: [
        'Il livello non aumenta più mana massimo e rigenerazione: il mana dipende solo dai punti MP',
        'Vita massima e difese elementali gestite dal server in base alle statistiche di ciascun giocatore',
        'Danni di proiettili e aree spaziali scalati sull\'ATK di chi li lancia'
      ]
    }
  },
  {
    version: '0.9.0',
    date: '2026-10-01',
    title: 'Interazioni',
    changes: {
      feature: [
        'Interazioni tra magie: l\'acqua spegne il fuoco, il fuoco incendia l\'aria, l\'aria dissolve l\'acqua',
        'Acqua + terra = area rigogliosa (rigenerazione di mana aumentata per entrambi i caster)',
        'Fuoco + terra = magma (danno a entrambi i caster, scia dietro ai proiettili)',
        'Le aree spaziali di terra bloccano i proiettili',
        'Arena PvP quadrata, uguale per entrambi i giocatori anche con schermi diversi'
      ],
      logic: [
        'L\'esperienza si guadagna solo nelle partite PvP online'
      ],
      fix: [
        'Matchmaking: giocatore "fantasma" duplicato che rubava le partite (heartbeat e sessioni doppie)'
      ]
    }
  },
  {
    version: '0.8.0',
    date: '2026-09-30',
    title: 'Pulizia',
    changes: {
      rework: [
        'Struttura del progetto riorganizzata (client/ + server/, un solo package.json)',
        'node_modules rimossi dal repository'
      ],
      fix: [
        'Le cariche del cerchio magico non si consumano più tutte insieme',
        'I proiettili liberi sono sempre neutri',
        'Il click su un\'area spaziale non blocca più il disegno delle magie',
        'PvP: rientro nella partita dopo il cambio pagina, pareggio allo scadere del tempo',
        'Tempi dello stordimento di terra, colori delle particelle, salvataggi in conflitto'
      ]
    }
  },
  {
    version: '0.7.0',
    date: '2025-11-13',
    title: 'Suono e classifica',
    changes: {
      feature: [
        'Effetti sonori e impostazioni audio',
        'Schermate pre-partita (pronto + countdown) e post-partita',
        'Classifica PvP globale nell\'arena'
      ],
      rework: [
        'Interfaccia della home ottimizzata',
        'Rendering delle particelle ottimizzato',
        'Credenziali Firebase del server lette da variabile d\'ambiente'
      ],
      fix: [
        'Aree dell\'avversario non visibili',
        'Canvas che non tornava nella posizione originale',
        'Uscita dal gioco con un cerchio magico attivo',
        'Primo tentativo di correzione del matchmaking'
      ]
    }
  },
  {
    version: '0.6.0',
    date: '2025-07-03',
    title: 'PvP',
    changes: {
      feature: [
        'Matchmaking (ricerca e annullamento) e duelli PvP online',
        'Sincronizzazione di mouse, cerchi magici, proiettili e aree spaziali tra i giocatori',
        'Effetti di stato elementali: bruciatura, rallentamento, comandi invertiti, stordimento',
        'Vita salvata durante la partita'
      ],
      logic: [
        'Password salvate con hashing',
        'Connessione sicura (wss) al server di produzione'
      ],
      fix: [
        'Profilo giocatore completato con tutti i campi al login'
      ]
    }
  },
  {
    version: '0.5.0',
    date: '2025-06-20',
    title: 'Manichino',
    changes: {
      feature: [
        'Modalità training con manichino',
        'Sistema di collisioni con scintille'
      ],
      rework: [
        'Mouse reale sostituito dal mouse virtuale'
      ]
    }
  },
  {
    version: '0.4.0',
    date: '2025-06-19',
    title: 'Online',
    changes: {
      feature: [
        'Salvataggio dei giocatori su Firestore',
        'Prima versione dell\'arena (non ancora funzionante) con server WebSocket',
        'Contatore dei giocatori online',
        'Pagina di gioco con modalità training e duello'
      ],
      rework: [
        'Build con Vite e primo deploy',
        'Barra del mana come modulo separato'
      ],
      fix: [
        'Percorsi e import dei moduli dopo il deploy'
      ]
    }
  },
  {
    version: '0.3.0',
    date: '2025-06-11',
    title: 'Spaziale',
    changes: {
      feature: [
        'Proiezione spaziale: aree permanenti che consumano mana in base alla grandezza',
        'Particelle sulla prossima carica del cerchio magico'
      ],
      logic: [
        'Eliminazione del cerchio magico e tracciamento delle proiezioni rivisti'
      ]
    }
  },
  {
    version: '0.2.0',
    date: '2025-06-07',
    title: 'Proiettili',
    changes: {
      feature: [
        'Proiettile: disegno e lancio',
        'Cerchio magico caricabile: trascinandolo lancia proiettili infusi dell\'elemento',
        'Esperienza, livelli e barra dell\'esperienza',
        'Pagina Info Giocatore con grafici di affinità e predisposizione'
      ],
      logic: [
        'Burnout quando si supera il mana disponibile'
      ],
      rework: [
        'Fogli di stile divisi in moduli'
      ]
    }
  },
  {
    version: '0.1.0',
    date: '2025-06-05',
    title: 'Prima magia',
    changes: {
      feature: [
        'Elementi: fuoco, acqua, aria, terra',
        'Cerchio magico, con incisione dell\'elemento e cancellazione',
        'Sistema di mana con barra lungo il bordo dello schermo',
        'Tema giorno/notte',
        'Pagina di login, home e impostazioni (numero di particelle, tasti)'
      ],
      fix: [
        'Cancellazione del cerchio magico'
      ]
    }
  }
];

export const CURRENT_VERSION = CHANGELOG[0].version;
