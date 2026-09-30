// element-patterns.js
// Disegno dei pattern (rune) di elementi e proiezioni all'interno dei cerchi magici.

// colorOverride: se indicato, tutto il pattern usa quel colore (es. magie dell'avversario)
export function drawElementPattern(ctx, x, y, r, element, colorOverride = null) {
  ctx.save();
  ctx.translate(x, y);
  if (element === 'fuoco') {
    const c = colorOverride || 'orange';
    for (let i = 0; i < 16; i++) {
      let angle = (Math.PI * 2 / 16) * i;
      ctx.save();
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(r * 0.5, 0);
      ctx.lineTo(r * 0.7, Math.sin(Math.PI/8) * r * 0.2);
      ctx.lineTo(r * 0.9, 0);
      ctx.strokeStyle = c;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    }
    ctx.lineWidth = 3;
    ctx.strokeStyle = c;
    // Cerchio piccolo centrale
    strokeCircle(ctx, r * 0.22, 1);
    // Cerchio medio (tra quello piccolo e quello a 0.9)
    strokeCircle(ctx, (r * 0.22 + r * 0.9) / 2, 1);
    // Cerchio esterno che racchiude le fiamme
    strokeCircle(ctx, r * 0.9, 0.7);
    // Secondo cerchio esterno, più ampio
    strokeCircle(ctx, r * 0.97, 1);
    let grad = ctx.createRadialGradient(0,0,0,0,0,r);
    if (colorOverride) {
      grad.addColorStop(0, colorOverride + '40');
      grad.addColorStop(0.5, colorOverride + '20');
      grad.addColorStop(1, colorOverride + '10');
    } else {
      grad.addColorStop(0, '#fffbe0');
      grad.addColorStop(0.5, '#ff9900');
      grad.addColorStop(1, '#ff2222');
    }
    ctx.globalAlpha = 0.25;
    ctx.beginPath();
    ctx.arc(0,0,r*0.95,0,2*Math.PI);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  if (element === 'aria') {
    const c = colorOverride || '#aaf';
    // Cerchi concentrici
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.arc(0, 0, r * (0.3 + i * 0.18), 0, 2 * Math.PI);
      ctx.strokeStyle = c;
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.strokeStyle = c;
    ctx.lineWidth = 3;
    // Cerchi alle estremità interne ed esterne delle linee radiali
    strokeCircle(ctx, r * 0.3, 1);
    strokeCircle(ctx, r * 0.81, 1);
    // Linee radiali
    for (let i = 0; i < 12; i++) {
      let angle = (Math.PI * 2 / 12) * i;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * r * 0.3, Math.sin(angle) * r * 0.3);
      ctx.lineTo(Math.cos(angle) * r * 0.84, Math.sin(angle) * r * 0.84);
      ctx.strokeStyle = c;
      ctx.globalAlpha = 0.4;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    // Curve a spirale
    ctx.save();
    ctx.rotate(Math.PI/12);
    for (let s = 0; s < 3; s++) {
      ctx.beginPath();
      for (let t = 0; t < 60; t++) {
        let theta = t * 0.2 + s * Math.PI * 2 / 3;
        let rad = r * 0.3 + t * (r * 0.5 / 60) + Math.sin(theta*2) * 2;
        let px = Math.cos(theta) * rad;
        let py = Math.sin(theta) * rad;
        if (t === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = c;
      ctx.globalAlpha = 0.7;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();
    // Cerchio esterno aggiuntivo
    ctx.strokeStyle = c;
    ctx.lineWidth = 3;
    strokeCircle(ctx, r * 0.97, 1);
  }
  if (element === 'acqua') {
    const main = colorOverride || 'rgba(0,180,255,1)';
    // Cerchi concentrici (il primo pieno, gli altri semitrasparenti)
    for (let i = 1; i <= 4; i++) {
      ctx.beginPath();
      ctx.arc(0, 0, r * (0.25 + i * 0.15), 0, 2 * Math.PI);
      if (i === 1) {
        ctx.strokeStyle = main;
        ctx.lineWidth = 3;
        ctx.globalAlpha = 1;
      } else {
        ctx.strokeStyle = colorOverride || 'rgba(0,180,255,0.5)';
        ctx.lineWidth = 2;
        ctx.globalAlpha = colorOverride ? 0.5 : 1;
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    // Onde regolari
    for (let i = 1; i <= 3; i++) {
      ctx.save();
      ctx.rotate(i * Math.PI / 6);
      ctx.beginPath();
      for (let t = 0; t <= 64; t++) {
        let theta = t * Math.PI * 2 / 64;
        let rad = r * (0.35 + i * 0.13) + Math.sin(theta * 6 + i) * 7;
        let px = Math.cos(theta) * rad;
        let py = Math.sin(theta) * rad;
        if (t === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.strokeStyle = main;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }
    // Piccoli glifi/gocce
    for (let i = 0; i < 10; i++) {
      let angle = (Math.PI * 2 / 10) * i + Math.PI/10;
      let rad = r * 0.7;
      ctx.save();
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.ellipse(rad, 0, 6, 3, angle, 0, 2 * Math.PI);
      ctx.fillStyle = colorOverride ? colorOverride + '80' : 'rgba(0,200,255,0.5)';
      ctx.fill();
      ctx.restore();
    }
    // Cerchio esterno aggiuntivo
    ctx.strokeStyle = main;
    ctx.lineWidth = 3;
    strokeCircle(ctx, r * 0.97, 1);
  }
  if (element === 'terra') {
    const c = colorOverride || '#a86';
    // Cerchi concentrici
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.arc(0, 0, r * (0.32 + i * 0.18), 0, 2 * Math.PI);
      ctx.strokeStyle = c;
      ctx.globalAlpha = i === 2 ? 1 : 0.5;
      ctx.lineWidth = i === 2 ? 3 : 2;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    // Pentagono centrale
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      let angle = (Math.PI * 2 / 5) * i - Math.PI/2;
      let px = Math.cos(angle) * r * 0.38;
      let py = Math.sin(angle) * r * 0.38;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.strokeStyle = c;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.8;
    ctx.stroke();
    ctx.globalAlpha = 1;
    // Pentacolo (stelletta)
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      let angle = (Math.PI * 2 / 5) * i - Math.PI/2;
      ctx.lineTo(Math.cos(angle) * r * 0.38, Math.sin(angle) * r * 0.38);
      let angle2 = (Math.PI * 2 / 5) * ((i + 2) % 5) - Math.PI/2;
      ctx.lineTo(Math.cos(angle2) * r * 0.38, Math.sin(angle2) * r * 0.38);
    }
    ctx.closePath();
    ctx.strokeStyle = c;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.7;
    ctx.stroke();
    ctx.globalAlpha = 1;
    // Linee radiali
    for (let i = 0; i < 10; i++) {
      let angle = (Math.PI * 2 / 10) * i;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * r * 0.85, Math.sin(angle) * r * 0.85);
      ctx.strokeStyle = colorOverride || '#4a3';
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.4;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    // Cerchio esterno aggiuntivo
    ctx.strokeStyle = c;
    ctx.lineWidth = 3;
    strokeCircle(ctx, r * 0.97, 1);
  }
  if (element === 'fulmine') {
    const c = colorOverride || '#ffff55';
    // Raggi a zigzag
    for (let i = 0; i < 12; i++) {
      ctx.save();
      ctx.rotate((Math.PI * 2 / 12) * i);
      ctx.beginPath();
      ctx.moveTo(r * 0.2, 0);
      for (let j = 1; j <= 8; j++) {
        ctx.lineTo(r * (0.2 + j * 0.08), (j % 2 === 0) ? r * 0.03 : -r * 0.03);
      }
      ctx.strokeStyle = c;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.8;
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.restore();
    }
    // Cerchio centrale
    ctx.strokeStyle = c;
    ctx.lineWidth = 3;
    strokeCircle(ctx, r * 0.15, 1);
    // Archi elettrici
    for (let i = 0; i < 6; i++) {
      let angle = (Math.PI * 2 / 6) * i;
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * r * 0.6, Math.sin(angle) * r * 0.6, r * 0.1, 0, 2 * Math.PI);
      ctx.strokeStyle = c;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.7;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
  if (element === 'luce') {
    const c = colorOverride || '#ffffff';
    // Raggi alternati spessi/sottili
    for (let i = 0; i < 16; i++) {
      ctx.save();
      ctx.rotate((Math.PI * 2 / 16) * i);
      ctx.beginPath();
      ctx.moveTo(r * 0.1, 0);
      ctx.lineTo(r * 0.9, 0);
      ctx.strokeStyle = c;
      ctx.lineWidth = i % 2 === 0 ? 3 : 1.5;
      ctx.globalAlpha = i % 2 === 0 ? 0.8 : 0.5;
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.restore();
    }
    // Cerchi concentrici
    for (let i = 1; i <= 4; i++) {
      ctx.beginPath();
      ctx.arc(0, 0, r * (0.15 + i * 0.15), 0, 2 * Math.PI);
      ctx.strokeStyle = c;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.9 - i * 0.15;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    // Centro luminoso
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.1, 0, 2 * Math.PI);
    ctx.fillStyle = c + '99';
    ctx.fill();
  }
  ctx.restore();
}

// Cerchio centrato nell'origine con lo strokeStyle/lineWidth correnti
function strokeCircle(ctx, radius, alpha) {
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, 2 * Math.PI);
  ctx.globalAlpha = alpha;
  ctx.stroke();
  ctx.globalAlpha = 1;
}

// Pattern cerchio magico proiettile (fucsia, anello, interno libero)
export function drawProjectilePattern(ctx, x, y, r, color = "#ff33cc") {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.68 * 0.3, 0, 2 * Math.PI);
  ctx.lineWidth = 1.7;
  ctx.strokeStyle = color;
  ctx.globalAlpha = 1;
  ctx.stroke();
  ctx.globalAlpha = 1;
  // Anello esterno sottile
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.95 * 0.3, 0, 2 * Math.PI);
  ctx.lineWidth = 1.7;
  ctx.strokeStyle = color;
  ctx.globalAlpha = 1;
  ctx.stroke();
  ctx.globalAlpha = 1;
  // Glifi magici (piccoli archi)
  for (let i = 0; i < 6; i++) {
    let angle = (Math.PI * 2 / 6) * i;
    ctx.save();
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.arc(r * 0.82 * 0.3, 0, 6, Math.PI * 0.15, Math.PI * 0.85);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.7;
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.restore();
  }
  // Piccoli punti magici
  for (let i = 0; i < 12; i++) {
    let angle = (Math.PI * 2 / 12) * i;
    let px = Math.cos(angle) * r * 0.82 * 0.3;
    let py = Math.sin(angle) * r * 0.82 * 0.3;
    ctx.beginPath();
    ctx.arc(px, py, 2, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.7;
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

// Disegna un triangolo magico con ai vertici i cerchi magici del proiettile
export function drawMagicTrianglePattern(ctx, x, y, r, color = "#ff33cc", rotation = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(2*rotation);
  const R = r * 0.82 * 0.3; // raggio dei cerchi proiettile
  const triangleR = r * 0.92; // distanza dal centro ai vertici del triangolo
  // Calcola i vertici del triangolo
  const verts = [];
  for (let i = 0; i < 3; i++) {
    const angle = -Math.PI/2 + i * (2 * Math.PI / 3);
    verts.push({
      x: Math.cos(angle) * triangleR,
      y: Math.sin(angle) * triangleR
    });
  }
  // Disegna i cerchi magici del proiettile ai vertici
  for (let v of verts) {
    ctx.save();
    ctx.translate(v.x, v.y);
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, 2 * Math.PI);
    ctx.lineWidth = 4.2;
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.globalAlpha = 0.85;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    // Anello interno sottile
    ctx.beginPath();
    ctx.arc(0, 0, R * 0.63, 0, 2 * Math.PI);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.5;
    ctx.stroke();
    ctx.globalAlpha = 1;
    // Anello esterno sottile
    ctx.beginPath();
    ctx.arc(0, 0, R * 1, 0, 2 * Math.PI);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.5;
    ctx.stroke();
    ctx.globalAlpha = 1;
    // Glifi magici (piccoli archi)
    for (let i = 0; i < 6; i++) {
      let angle = (Math.PI * 2 / 6) * i;
      ctx.save();
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.arc(R, 0, 3, Math.PI * 0.15, Math.PI * 0.85);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.7;
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.restore();
    }
    // Piccoli punti magici
    for (let i = 0; i < 12; i++) {
      let angle = (Math.PI * 2 / 12) * i;
      let px = Math.cos(angle) * R;
      let py = Math.sin(angle) * R;
      ctx.beginPath();
      ctx.arc(px, py, 2, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.7;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }
  // Disegna le linee del triangolo che si fermano alla circonferenza esterna di ogni cerchio
  for (let i = 0; i < 3; i++) {
    const v1 = verts[i];
    const v2 = verts[(i + 1) % 3];
    // Calcola la direzione dal centro del cerchio v1 verso v2
    const dx = v2.x - v1.x;
    const dy = v2.y - v1.y;
    const dist = Math.hypot(dx, dy);
    // Punto di partenza: bordo esterno del cerchio v1 verso v2
    const startX = v1.x + (dx / dist) * R;
    const startY = v1.y + (dy / dist) * R;
    // Punto di arrivo: bordo esterno del cerchio v2 verso v1
    const endX = v2.x - (dx / dist) * R;
    const endY = v2.y - (dy / dist) * R;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3.2;
    ctx.globalAlpha = 0.85;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }
  // Disegna un triangolo interno sottile
  const shrink = 0.85; // Fattore di riduzione per il triangolo interno
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const angle = -Math.PI/2 + i * (2 * Math.PI / 3);
    const xInner = Math.cos(angle) * triangleR * shrink;
    const yInner = Math.sin(angle) * triangleR * shrink;
    if (i === 0) ctx.moveTo(xInner, yInner);
    else ctx.lineTo(xInner, yInner);
  }
  ctx.closePath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.1;
  ctx.globalAlpha = 0.55;
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();
}

// Funzione di inizializzazione per la preview
export function drawAllElementPatterns() {
  [
    ['pat-fuoco', 'fuoco'],
    ['pat-aria', 'aria'],
    ['pat-acqua', 'acqua'],
    ['pat-terra', 'terra']
  ].forEach(([id, el]) => {
    const c = document.getElementById(id);
    const ctx = c.getContext('2d');
    drawElementPattern(ctx, c.width/2, c.height/2, 90, el);
  });
}

export function drawProjectilePolygonPattern(ctx, x, y, r, count, color = "#ff33cc", rotation = 0, tipi = []) {
  if (count < 1) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);

  const polyR = r * 0.92;
  const verts = [];
  for (let i = 0; i < count; i++) {
    const angle = -Math.PI/2 + i * (2 * Math.PI / count);
    verts.push({
      x: Math.cos(angle) * polyR,
      y: Math.sin(angle) * polyR
    });
  }

  // Disegna il pattern corretto per ogni vertice
  for (let i = 0; i < verts.length; i++) {
    const v = verts[i];
    const tipo = Array.isArray(tipi) ? tipi[i] : tipi;
    if (tipo === "spaziale") {
      drawSpazialePattern(ctx, v.x, v.y, r, color, 0);
    } else {
      drawProjectilePattern(ctx, v.x, v.y, r, color);
    }
  }

  // Collega i cerchi con linee
  if (count > 1) {
    ctx.beginPath();
    for (let i = 0; i < count; i++) {
      const v = verts[i];
      if (i === 0) ctx.moveTo(v.x, v.y);
      else ctx.lineTo(v.x, v.y);
    }
    ctx.closePath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2;
    ctx.globalAlpha = 0.85;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

// Pattern per la proiezione permanente "spaziale"
export function drawSpazialePattern(ctx, x, y, r, color = "#00e0ff", rotation = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);

  // Cerchi concentrici
  for (let i = 1; i <= 4; i++) {
    ctx.beginPath();
    ctx.arc(0, 0, r * (0.25 + i * 0.16) * 0.3, 0, 2 * Math.PI);
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.5 + 0.1 * i;
    ctx.lineWidth = i === 4 ? 3 : 1.5;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Segmenti radiali (come raggi di energia)
  for (let i = 0; i < 8; i++) {
    let angle = (Math.PI * 2 / 8) * i + rotation;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * r * 0.25 * 0.3, Math.sin(angle) * r * 0.25  * 0.3);
    ctx.lineTo(Math.cos(angle) * r * 0.89 * 0.3, Math.sin(angle) * r * 0.89 * 0.3);
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.7;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Archi intrecciati (simbolo di distorsione spaziale)
  for (let i = 0; i < 3; i++) {
    ctx.save();
    ctx.rotate(i * Math.PI / 3 + rotation / 2);
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.65 * 0.3, r * 0.18  * 0.3, 0, 0, 2 * Math.PI);
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.6;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // Piccoli punti magici
  for (let i = 0; i < 12; i++) {
    let angle = (Math.PI * 2 / 12) * i;
    let px = Math.cos(angle) * r * 0.92 * 0.3;
    let py = Math.sin(angle) * r * 0.92 * 0.3;
    ctx.beginPath();
    ctx.arc(px, py, 2, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.6;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}