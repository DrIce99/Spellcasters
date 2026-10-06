// balance-history.js - Storico dei bilanciamenti (buff e nerf), mostrato nella pagina delle patch notes.
// Una voce per versione, la più recente in cima. Quando si cambia un valore di gioco
// (es. ELEMENT_EFFECTS_CONFIG in game/status-effects.js) va aggiunta qui la modifica.
//
// Ogni modifica:
//  - target:  elemento ('fuoco', 'acqua', ...) oppure un'altra chiave (es. 'mana'): gli elementi prendono il loro colore
//  - effect:  cosa è cambiato (es. 'Bruciatura')
//  - verdict: 'buff' | 'nerf' | 'rework' visto da chi lancia la magia ('rework' = alcuni valori salgono, altri scendono)
//  - note:    una frase che riassume la modifica
//  - stats:   valori prima/dopo; better = 'higher' se un valore più alto favorisce chi lancia la magia, 'lower' il contrario
//             (decide il colore della freccia di ogni riga)

export const VERDICTS = {
  buff: { label: 'Buff', symbol: '▲' },
  nerf: { label: 'Nerf', symbol: '▼' },
  rework: { label: 'Modifica', symbol: '◆' }
};

export const BALANCE_HISTORY = [
  {
    version: '0.12.0',
    date: '2026-10-06',
    title: 'Effetti elementali più lunghi',
    changes: [
      {
        target: 'terra',
        effect: 'Stordimento',
        verdict: 'buff',
        note: 'Tre stordimenti da 1 s invece di due da 0.5 s: il tempo totale da fermi triplica',
        stats: [
          { label: 'Durata di ogni stordimento', before: 0.5, after: 1, unit: 's', better: 'higher' },
          { label: 'Pausa tra gli stordimenti', before: 0.5, after: 1, unit: 's', better: 'lower' },
          { label: 'Numero di stordimenti', before: 2, after: 3, better: 'higher' },
          { label: 'Tempo totale da fermi', before: 1, after: 3, unit: 's', better: 'higher' }
        ]
      },
      {
        target: 'aria',
        effect: 'Controlli invertiti',
        verdict: 'buff',
        note: 'I comandi restano invertiti quasi tre volte più a lungo',
        stats: [
          { label: 'Durata', before: 1.5, after: 4, unit: 's', better: 'higher' }
        ]
      },
      {
        target: 'acqua',
        effect: 'Rallentamento',
        verdict: 'rework',
        note: 'Molto più leggero ma più che triplicato nella durata',
        stats: [
          { label: 'Rallentamento', before: 60, after: 20, unit: '%', better: 'higher' },
          { label: 'Durata', before: 1.5, after: 5, unit: 's', better: 'higher' }
        ]
      },
      {
        target: 'fuoco',
        effect: 'Bruciatura',
        verdict: 'rework',
        note: 'Danni più lenti ma più duraturi. Fix: prima l\'ultimo danno andava perso (2 invece di 3)',
        stats: [
          { label: 'Danno per tick', before: 1, after: 1, better: 'higher' },
          { label: 'Intervallo tra i danni', before: 0.5, after: 1.5, unit: 's', better: 'lower' },
          { label: 'Durata', before: 1.5, after: 4.5, unit: 's', better: 'higher' },
          { label: 'Danno totale', before: 2, after: 3, better: 'higher' }
        ]
      }
    ]
  }
];
