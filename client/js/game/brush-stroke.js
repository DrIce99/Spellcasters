// brush-stroke.js - Disegno "a pennello" del tratto mentre si traccia un simbolo (tasto Z).
// È solo visivo: il riconoscimento usa sempre i punti originali.
//
// 1. media mobile per togliere il tremolio del mouse
// 2. Chaikin per arrotondare gli spigoli in una curva continua
// 3. contorno pieno a spessore variabile: sottile alle estremità e dove il gesto è veloce,
//    come l'inchiostro. Una sola forma piena, quindi niente sovrapposizioni più scure.

function movingAverage(points, radius = 2) {
  if (points.length <= 2) return points.slice();
  const out = [];
  for (let i = 0; i < points.length; i++) {
    // Le estremità restano dove le ha messe il giocatore
    if (i === 0 || i === points.length - 1) {
      out.push(points[i]);
      continue;
    }
    let sx = 0, sy = 0, n = 0;
    for (let k = Math.max(0, i - radius); k <= Math.min(points.length - 1, i + radius); k++) {
      sx += points[k].x;
      sy += points[k].y;
      n++;
    }
    out.push({ x: sx / n, y: sy / n });
  }
  return out;
}

function chaikin(points, iterations = 2) {
  let pts = points;
  for (let it = 0; it < iterations && pts.length > 2; it++) {
    const next = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      next.push({ x: a.x * 0.75 + b.x * 0.25, y: a.y * 0.75 + b.y * 0.25 });
      next.push({ x: a.x * 0.25 + b.x * 0.75, y: a.y * 0.25 + b.y * 0.75 });
    }
    next.push(pts[pts.length - 1]);
    pts = next;
  }
  return pts;
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {{x:number,y:number}[]} rawPoints punti del gesto
 * @param {{ color: string, glow?: string, width?: number }} style
 */
export function drawBrushStroke(ctx, rawPoints, { color, glow = color, width = 5 }) {
  if (!rawPoints || rawPoints.length < 2) return;
  const pts = chaikin(movingAverage(rawPoints));
  const n = pts.length;

  // Lunghezza progressiva, per assottigliare le estremità in base alla distanza percorsa
  const along = [0];
  for (let i = 1; i < n; i++) {
    along.push(along[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  }
  const total = along[n - 1] || 1;
  const taperLength = Math.min(40, total * 0.3);

  const left = [], right = [];
  for (let i = 0; i < n; i++) {
    const prev = pts[Math.max(0, i - 1)], next = pts[Math.min(n - 1, i + 1)];
    let tx = next.x - prev.x, ty = next.y - prev.y;
    const len = Math.hypot(tx, ty) || 1;
    tx /= len; ty /= len;

    const fromStart = along[i], toEnd = total - along[i];
    const taper = Math.min(1, fromStart / taperLength, toEnd / taperLength);
    const segment = i > 0 ? along[i] - along[i - 1] : 0;
    const speedFactor = Math.max(0.65, Math.min(1.1, 1.15 - segment / 30));
    const half = (width / 2) * (0.25 + 0.75 * taper) * speedFactor;

    left.push({ x: pts[i].x - ty * half, y: pts[i].y + tx * half });
    right.push({ x: pts[i].x + ty * half, y: pts[i].y - tx * half });
  }

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(left[0].x, left[0].y);
  for (let i = 1; i < n; i++) ctx.lineTo(left[i].x, left[i].y);
  for (let i = n - 1; i >= 0; i--) ctx.lineTo(right[i].x, right[i].y);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.shadowColor = glow;
  ctx.shadowBlur = 10;
  ctx.fill();
  ctx.restore();
}
