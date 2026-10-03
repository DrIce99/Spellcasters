// particle-shapes.js - Forma delle particelle in base all'elemento
//   acqua -> gocce tonde (il "pallino")
//   aria  -> linee sottili orientate nel senso del movimento, come raffiche di vento
//   fuoco -> lingue di fiamma: affusolate, più spesse al centro, rivolte verso l'alto
//   terra -> schegge di roccia: piccoli poligoni irregolari
//   fulmine -> scariche a zig-zag che sfarfallano
//   nessun elemento (mana puro, danni, scia del disegno) -> cerchio
//
// Una particella ha almeno { x, y, radius, dx, dy } e opzionalmente `element`.
// `angle` (radianti) è la direzione della proiezione che l'ha generata: se presente,
// la forma si orienta lungo il moto della magia invece che lungo il moto della particella.
// I dati di forma calcolati una volta sola sono salvati sulla particella con prefisso "_".

const TWO_PI = Math.PI * 2;

function drawCircle(ctx, p) {
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.radius, 0, TWO_PI);
  ctx.fill();
}

// Aria: segmento sottile lungo la direzione del moto (fermo -> direzione casuale fissa)
function drawWindStreak(ctx, p) {
  const speed = Math.hypot(p.dx, p.dy);
  if (p.angle !== undefined) {
    p._angle = p.angle;
  } else if (p._angle === undefined || speed > 0.2) {
    p._angle = speed > 0.2 ? Math.atan2(p.dy, p.dx) : Math.random() * TWO_PI;
  }
  const half = (p.radius * 3 + speed * 3 + (p.angle !== undefined ? p.radius * 2 : 0)) / 2;
  const cx = Math.cos(p._angle) * half;
  const cy = Math.sin(p._angle) * half;
  ctx.beginPath();
  ctx.moveTo(p.x - cx, p.y - cy);
  ctx.lineTo(p.x + cx, p.y + cy);
  ctx.lineWidth = Math.max(0.6, p.radius * 0.45);
  ctx.strokeStyle = ctx.fillStyle;
  ctx.stroke();
}

// Fuoco: fuso affusolato (sottile alle punte, spesso al centro).
// Libero sale verso l'alto inclinato dal vento laterale; in una proiezione la punta resta indietro, come una scia.
function drawFlame(ctx, p) {
  const angle = p.angle !== undefined
    ? p.angle + Math.PI
    : -Math.PI / 2 + Math.max(-0.9, Math.min(0.9, p.dx * 0.6));
  const half = p.radius * (p.angle !== undefined ? 2.4 : 1.9);
  const width = p.radius * 0.85;
  const ux = Math.cos(angle), uy = Math.sin(angle);   // asse della fiamma
  const px = -uy, py = ux;                             // perpendicolare
  const tipX = p.x + ux * half, tipY = p.y + uy * half;
  const baseX = p.x - ux * half * 0.7, baseY = p.y - uy * half * 0.7;
  ctx.beginPath();
  ctx.moveTo(baseX, baseY);
  ctx.quadraticCurveTo(p.x + px * width, p.y + py * width, tipX, tipY);
  ctx.quadraticCurveTo(p.x - px * width, p.y - py * width, baseX, baseY);
  ctx.fill();
}

// Terra: scheggia con 4-5 vertici irregolari, generata una volta per particella
function drawShard(ctx, p) {
  if (!p._shard) {
    const sides = 4 + Math.floor(Math.random() * 2);
    const rotation = Math.random() * TWO_PI;
    p._shard = Array.from({ length: sides }, (_, i) => {
      const a = rotation + (i / sides) * TWO_PI + (Math.random() - 0.5) * 0.6;
      const r = 0.65 + Math.random() * 0.5;
      return [Math.cos(a) * r, Math.sin(a) * r];
    });
  }
  const size = p.radius * 1.2;
  // In una proiezione la scheggia si allunga nella direzione di volo
  const stretch = p.angle !== undefined ? 1.7 : 1;
  const ca = Math.cos(p.angle || 0), sa = Math.sin(p.angle || 0);
  ctx.beginPath();
  p._shard.forEach(([sx, sy], i) => {
    const vx = sx * stretch, vy = sy;
    const x = p.x + (vx * ca - vy * sa) * size, y = p.y + (vx * sa + vy * ca) * size;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fill();
}

// Fulmine: piccola scarica a zig-zag, che cambia forma a ogni frame (sfarfalla)
function drawSpark(ctx, p) {
  const angle = p.angle !== undefined ? p.angle : Math.random() * TWO_PI;
  const len = p.radius * (p.angle !== undefined ? 5 : 3.5);
  const ux = Math.cos(angle), uy = Math.sin(angle);
  const px = -uy, py = ux;
  const steps = 3;
  ctx.beginPath();
  ctx.moveTo(p.x - ux * len / 2, p.y - uy * len / 2);
  for (let i = 1; i <= steps; i++) {
    const t = i / steps - 0.5;
    const side = i === steps ? 0 : (Math.random() - 0.5) * p.radius * 2.2;
    ctx.lineTo(p.x + ux * len * t + px * side, p.y + uy * len * t + py * side);
  }
  ctx.lineWidth = Math.max(0.8, p.radius * 0.5);
  ctx.strokeStyle = ctx.fillStyle;
  ctx.stroke();
}

const SHAPES = {
  acqua: drawCircle,
  aria: drawWindStreak,
  fuoco: drawFlame,
  terra: drawShard,
  fulmine: drawSpark
};

/** Disegna la particella con la forma del suo elemento; fillStyle è già il colore con l'alpha corrente */
export function drawParticleShape(ctx, p, fillStyle) {
  ctx.fillStyle = fillStyle;
  (SHAPES[p.element] || drawCircle)(ctx, p);
}
