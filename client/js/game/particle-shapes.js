// particle-shapes.js - Forma delle particelle in base all'elemento
//   acqua -> gocce tonde (il "pallino")
//   aria  -> linee sottili orientate nel senso del movimento, come raffiche di vento
//   fuoco -> lingue di fiamma: affusolate, più spesse al centro, rivolte verso l'alto
//   terra -> schegge di roccia: piccoli poligoni irregolari
//   nessun elemento (mana puro, danni, scia del disegno) -> cerchio
//
// Una particella ha almeno { x, y, radius, dx, dy } e opzionalmente `element`.
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
  if (p._angle === undefined || speed > 0.2) {
    p._angle = speed > 0.2 ? Math.atan2(p.dy, p.dx) : Math.random() * TWO_PI;
  }
  const half = (p.radius * 3 + speed * 3) / 2;
  const cx = Math.cos(p._angle) * half;
  const cy = Math.sin(p._angle) * half;
  ctx.beginPath();
  ctx.moveTo(p.x - cx, p.y - cy);
  ctx.lineTo(p.x + cx, p.y + cy);
  ctx.lineWidth = Math.max(0.6, p.radius * 0.45);
  ctx.strokeStyle = ctx.fillStyle;
  ctx.stroke();
}

// Fuoco: fuso affusolato (sottile alle punte, spesso al centro), inclinato dal vento laterale
function drawFlame(ctx, p) {
  const angle = -Math.PI / 2 + Math.max(-0.9, Math.min(0.9, p.dx * 0.6));
  const half = p.radius * 1.9;
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
  ctx.beginPath();
  p._shard.forEach(([vx, vy], i) => {
    const x = p.x + vx * size, y = p.y + vy * size;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fill();
}

const SHAPES = {
  acqua: drawCircle,
  aria: drawWindStreak,
  fuoco: drawFlame,
  terra: drawShard
};

/** Disegna la particella con la forma del suo elemento; fillStyle è già il colore con l'alpha corrente */
export function drawParticleShape(ctx, p, fillStyle) {
  ctx.fillStyle = fillStyle;
  (SHAPES[p.element] || drawCircle)(ctx, p);
}
