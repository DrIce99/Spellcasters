// dollar-recognizer.js - Riconoscimento dei gesti (algoritmo "$1 Unistroke" semplificato)

const LASER_MIN_LENGTH = 40; // px: sotto questa lunghezza il tratto è troppo corto per essere un laser

/**
 * Laser: una linea percorsa avanti, indietro e di nuovo avanti (una "z" molto appiattita),
 * in qualsiasi direzione. Si proietta il tratto sull'asse inizio -> punto più lontano:
 * lungo l'asse deve andare 0 -> 1 -> 0 -> 1, restando vicino all'asse.
 * @returns {{ score: number, start: {x,y}, end: {x,y} }} end = punta della linea (direzione del laser)
 */
export function analyzeLaserStroke(points) {
  const none = { score: 0, start: points[0], end: points[points.length - 1] };
  if (points.length < 10) return none;

  const start = points[0];
  let far = start;
  let length = 0;
  for (const p of points) {
    const d = Math.hypot(p.x - start.x, p.y - start.y);
    if (d > length) {
      length = d;
      far = p;
    }
  }
  if (length < LASER_MIN_LENGTH) return none;

  const ux = (far.x - start.x) / length;
  const uy = (far.y - start.y) / length;
  let runningMax = -Infinity;
  let peak = 0;          // massimo raggiunto prima del ritorno
  let valley = Infinity; // punto più arretrato del ritorno
  let deepestDrop = 0;
  let maxSide = 0;
  let pathLength = 0;
  const along = points.map((p, i) => {
    const dx = p.x - start.x;
    const dy = p.y - start.y;
    const t = (dx * ux + dy * uy) / length;
    maxSide = Math.max(maxSide, Math.abs(dx * uy - dy * ux) / length);
    if (i > 0) pathLength += Math.hypot(p.x - points[i - 1].x, p.y - points[i - 1].y);
    return t;
  });
  let valleyIndex = -1;
  along.forEach((t, i) => {
    runningMax = Math.max(runningMax, t);
    if (runningMax - t > deepestDrop) {
      deepestDrop = runningMax - t;
      peak = runningMax;
      valley = t;
      valleyIndex = i;
    }
  });
  if (valleyIndex === -1) return none;
  const finalReach = Math.max(...along.slice(valleyIndex));

  const error = (1 - peak) + Math.max(0, valley) + (1 - finalReach);
  const sidePenalty = Math.max(0, maxSide - 0.2);
  const lengthPenalty = Math.max(0, Math.abs(pathLength / length - 3) - 0.8) * 0.3;
  const score = Math.max(0, Math.min(1, 1 - 0.6 * error - sidePenalty - lengthPenalty));
  return { score, start, end: far };
}

/**
 * Proiettile: una linea dritta in qualsiasi direzione. I template coprono solo 8 direzioni:
 * questo punteggio misura quanto il tratto è rettilineo, così vanno bene anche gli angoli intermedi.
 */
export function straightLineScore(points) {
  if (points.length < 10) return 0;
  const start = points[0];
  const end = points[points.length - 1];
  const length = Math.hypot(end.x - start.x, end.y - start.y);
  if (length < LASER_MIN_LENGTH) return 0;
  const ux = (end.x - start.x) / length;
  const uy = (end.y - start.y) / length;
  let pathLength = 0;
  let maxSide = 0;
  points.forEach((p, i) => {
    if (i > 0) pathLength += Math.hypot(p.x - points[i - 1].x, p.y - points[i - 1].y);
    maxSide = Math.max(maxSide, Math.abs((p.x - start.x) * uy - (p.y - start.y) * ux) / length);
  });
  const detour = 1 - length / pathLength;
  return Math.max(0, Math.min(1, 1 - 1.5 * detour - 2 * Math.max(0, maxSide - 0.08)));
}

export default class DollarRecognizer {
  constructor() {
    this.templates = [];
    this.addDefaultTemplates();
  }

  // Aggiungi i template predefiniti per i tuoi elementi
  addDefaultTemplates() {
    // Template per Fuoco (Y)
    this.addGesture('fuoco', [
        {x: 100, y: 120},  // Inizio in alto
        {x: 110, y: 110},
        {x: 120, y: 120},
    ]);

    this.addGesture('fuoco', [
        {x: 100, y: 100},  // Inizio in alto
        {x: 120, y: 120},
        {x: 100, y: 120},
    ]);

    // Template per Acqua (goccia)
    this.addGesture('acqua', [
        {x: 50, y: 50}, 
        {x: 55, y: 70},
        {x: 50, y: 75},
        {x: 45, y: 70},
        {x: 50, y: 50}
    ]);

    this.addGesture('acqua', [
        {x: 50, y: 50}, 
        {x: 45, y: 70},
        {x: 50, y: 75},
        {x: 55, y: 70},
        {x: 50, y: 50}
    ]);

    // Template per Aria (spirale)
    this.addGesture('aria', [
        {x: 90, y: 95},
        {x: 110, y: 100},
        {x: 120, y: 110},
        {x: 120, y: 120},
        {x: 115, y: 125},
        {x: 110, y: 120},
        {x: 110, y: 110},
        {x: 120, y: 100},
        {x: 140, y: 95}
    ]);

    // inverti i punti per creare una spirale in senso antiorario
    this.addGesture('aria', [
        {x: 140, y: 95},
        {x: 120, y: 100},
        {x: 110, y: 110},
        {x: 110, y: 120},
        {x: 115, y: 125},
        {x: 120, y: 120},
        {x: 120, y: 110},
        {x: 110, y: 100},
        {x: 90, y: 95}
    ]);

    // rifletti orizzontalmente per creare una spirale in senso antiorario
    this.addGesture('aria', [
        {x: 110, y: 125},
        {x: 90, y: 120},
        {x: 80, y: 110},
        {x: 80, y: 100},
        {x: 85, y: 95},
        {x: 90, y: 100},
        {x: 90, y: 110},
        {x: 80, y: 120},
        {x: 60, y: 125}
    ]);

    // rifletti orizzontalmente per creare una spirale in senso antiorario
    this.addGesture('aria', [
        {x: 60, y: 125},
        {x: 80, y: 120},
        {x: 90, y: 110},
        {x: 90, y: 100},
        {x: 85, y: 95},
        {x: 80, y: 100},
        {x: 80, y: 110},
        {x: 90, y: 120},
        {x: 110, y: 125}
    ]);

    // Template per Terra (quadrato)
    this.addGesture('terra', [
        {x: 60, y: 80},  // Inizio in alto a sinistra
        {x: 120, y: 80}, // Spostamento a destra
        {x: 120, y: 120}, // Spostamento in basso
        {x: 80, y: 120} // Spostamento a sinistra
    ]);

    this.addGesture('terra', [
        {x: 80, y: 60},  // Inizio in alto a sinistra
        {x: 80, y: 120}, // Spostamento a destra
        {x: 120, y: 120}, // Spostamento in basso
        {x: 120, y: 80} // Spostamento a sinistra
    ]);

    this.addGesture('terra', [
        {x: 40, y: 80},  // Inizio in alto a sinistra
        {x: 110, y: 80}, // Spostamento a destra
        {x: 120, y: 100}, // Spostamento in basso
        {x: 100, y: 120}, // Spostamento a sinistra
        {x: 80, y: 100}  // Spostamento in basso
    ]);

    this.addGesture('terra', [
        {x: 80, y: 40},  // Inizio in alto a sinistra
        {x: 80, y: 100}, // Spostamento a destra
        {x: 100, y: 120}, // Spostamento in basso
        {x: 120, y: 100}, // Spostamento a sinistra
        {x: 110, y: 80}  // Spostamento in basso
    ]);

    this.addGesture('cerchio', [
        {x: 100, y: 100}, // Inizio al centro
        {x: 120, y: 110}, // Spostamento a destra
        {x: 130, y: 130}, // Spostamento in basso a destra
        {x: 120, y: 150}, // Spostamento in basso
        {x: 100, y: 160}, // Spostamento a sinistra
        {x: 80, y: 150},  // Spostamento in basso a sinistra
        {x: 70, y: 130},  // Spostamento in alto a sinistra
        {x: 80, y: 110},  // Spostamento in alto
        {x: 100, y: 100}  // Chiusura del cerchio
    ]);

    // inverti i punti per creare un cerchio in senso antiorario
    this.addGesture('cerchio', [
        {x: 100, y: 100}, // Inizio al centro
        {x: 80, y: 110},  // Spostamento a destra
        {x: 70, y: 130},  // Spostamento in basso a destra
        {x: 80, y: 150},  // Spostamento in basso
        {x: 100, y: 160}, // Spostamento a sinistra
        {x: 120, y: 150}, // Spostamento in basso a sinistra
        {x: 130, y: 130}, // Spostamento in alto a sinistra
        {x: 120, y: 110}, // Spostamento in alto
        {x: 100, y: 100}  // Chiusura del cerchio
    ]);

    // Cerchio iniziato dal basso, in senso orario (verso sinistra)...
    this.addGesture('cerchio', [
        {x: 100, y: 160},
        {x: 80, y: 150},
        {x: 70, y: 130},
        {x: 80, y: 110},
        {x: 100, y: 100},
        {x: 120, y: 110},
        {x: 130, y: 130},
        {x: 120, y: 150},
        {x: 100, y: 160}
    ]);

    // ...e in senso antiorario (verso destra)
    this.addGesture('cerchio', [
        {x: 100, y: 160},
        {x: 120, y: 150},
        {x: 130, y: 130},
        {x: 120, y: 110},
        {x: 100, y: 100},
        {x: 80, y: 110},
        {x: 70, y: 130},
        {x: 80, y: 150},
        {x: 100, y: 160}
    ]);

    // Template per Fulmine: zig-zag dall'alto verso il basso
    // (diagonale verso sinistra, tratto verso destra, diagonale verso sinistra)
    this.addGesture('fulmine', [
        {x: 120, y: 60},
        {x: 95, y: 105},
        {x: 125, y: 100},
        {x: 100, y: 150}
    ]);

    // Fulmine speculare (diagonale verso destra, tratto verso sinistra, diagonale verso destra)
    this.addGesture('fulmine', [
        {x: 100, y: 60},
        {x: 125, y: 105},
        {x: 95, y: 100},
        {x: 120, y: 150}
    ]);

    this.addGesture('fulmine', [
        {x: 100, y: 150},
        {x: 125, y: 100},
        {x: 95, y: 105},
        {x: 120, y: 60}
    ]);

    // Fulmine speculare (diagonale verso destra, tratto verso sinistra, diagonale verso destra)
    this.addGesture('fulmine', [
        {x: 120, y: 150},
        {x: 95, y: 100},
        {x: 125, y: 105},
        {x: 100, y: 60}
    ]);

    this.addGesture('proiettile', [
        {x: 100, y: 100}, // Inizio al centro
        {x: 120, y: 90},  // Spostamento a destra
    ]);
    this.addGesture('proiettile', [
        {x: 100, y: 100}, // Inizio
        {x: 120, y: 100}  // Orizzontale destra
    ]);
    this.addGesture('proiettile', [
        {x: 100, y: 100}, // Inizio
        {x: 80, y: 100}   // Orizzontale sinistra
    ]);
    this.addGesture('proiettile', [
        {x: 100, y: 100}, // Inizio
        {x: 100, y: 80}   // Verticale su
    ]);
    this.addGesture('proiettile', [
        {x: 100, y: 100}, // Inizio
        {x: 100, y: 120}  // Verticale giù
    ]);
    this.addGesture('proiettile', [
        {x: 100, y: 100},
        {x: 120, y: 120}  
    ]);
    this.addGesture('proiettile', [
        {x: 100, y: 100},
        {x: 80, y: 120}   
    ]);
    this.addGesture('proiettile', [
        {x: 100, y: 100},
        {x: 120, y: 80}   
    ]);
    this.addGesture('proiettile', [
        {x: 100, y: 100},
        {x: 80, y: 80}   
    ]);

    this.addGesture('spaziale', [
        {x: 100, y: 100}, // Inizio al centro
        {x: 100, y: 80},  // Verticale su
        {x: 115, y: 100},  // Obliqua alto-destra
        {x: 115, y: 80}, // Verticale giù
    ]);
  }

  addGesture(name, points) {
    points = this.normalize(points);
    this.templates.push({
      name: name,
      points: points
    });
  }

  recognize(points) {
    if (points.length < 10) return { name: 'unknown', score: 0 };

    points = this.normalize(points);
    let bestMatch = { score: 0 };

    for (const template of this.templates) {
      const score = this.compare(points, template.points);
      if (score > bestMatch.score) {
        bestMatch = { name: template.name, score: score };
      }
    }

    return bestMatch;
  }

  // Punteggio migliore per ogni simbolo (serve per applicare soglie diverse a ciascuno)
  scoresByName(points) {
    if (points.length < 10) return {};
    const normalized = this.normalize(points);
    const scores = {};
    for (const template of this.templates) {
      const score = this.compare(normalized, template.points);
      if (score > (scores[template.name] ?? -Infinity)) scores[template.name] = score;
    }
    // Proiettile e laser si disegnano in qualsiasi direzione: li riconosce un'analisi geometrica
    scores.proiettile = Math.max(scores.proiettile ?? 0, straightLineScore(points));
    scores.laser = analyzeLaserStroke(points).score;
    return scores;
  }

  normalize(points) {
    // 1. Ridimensiona e trasla
    const { minX, minY, width, height } = this.boundingBox(points);
    // Evita la divisione per zero se tutti i punti coincidono
    const scale = Math.max(width, height) || 1;
    const newPoints = [];
    
    for (const point of points) {
      newPoints.push({
        x: (point.x - minX) / scale * 100,
        y: (point.y - minY) / scale * 100
      });
    }

    // 2. Riesempio a 64 punti equidistanti
    return this.resample(newPoints, 64);
  }

  resample(points, n) {
    const interval = this.pathLength(points) / (n - 1);
    let newPoints = [points[0]];
    let D = 0;

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const d = this.distance(prev, curr);

      if (d > 0 && D + d >= interval) {
        const qx = prev.x + ((interval - D) / d) * (curr.x - prev.x);
        const qy = prev.y + ((interval - D) / d) * (curr.y - prev.y);
        newPoints.push({ x: qx, y: qy });
        points.splice(i, 0, { x: qx, y: qy });
        D = 0;
      } else {
        D += d;
      }
    }

    // Aggiungi l'ultimo punto se necessario
    if (newPoints.length < n) {
      newPoints.push(points[points.length - 1]);
    }

    return newPoints;
  }

  pathLength(points) {
    let length = 0;
    for (let i = 1; i < points.length; i++) {
      length += this.distance(points[i - 1], points[i]);
    }
    return length;
  }

  boundingBox(points) {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    
    for (const point of points) {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    }

    return {
      minX, minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  distance(p1, p2) {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }

  compare(points1, points2) {
    // Distanza media tra punti corrispondenti
    // (il ricampionamento può produrre un punto in più o in meno: si confronta il minimo comune)
    const n = Math.min(points1.length, points2.length);
    if (n === 0) return 0;
    let sum = 0;
    for (let i = 0; i < n; i++) {
      sum += this.distance(points1[i], points2[i]);
    }
    const avg = sum / n;

    // Converti in punteggio (1 = perfetto, 0 = pessimo)
    const maxSize = 100; // Dimensione area normalizzata
    return 1 - (avg / (0.5 * maxSize));
  }
}