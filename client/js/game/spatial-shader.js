// spatial-shader.js - Riempimento delle aree spaziali con shader WebGL (uno per elemento).
//
// Un canvas WebGL sta sotto al canvas 2D di gioco e ne copia la trasformazione (arena, scala,
// tremolio della camera). I contorni restano disegnati in 2D da engine.js / pvp-manager.js.
//
// I poligoni sono disegnati a mano: possono essere concavi o intrecciarsi. Invece di triangolarli
// si usa lo stencil buffer (regola pari/dispari): il "ventaglio" di triangoli inverte lo stencil,
// poi un rettangolo che copre l'area disegna lo shader solo dove lo stencil è dispari.

const VERTEX_SHADER = `
attribute vec2 a_pos;
uniform vec2 u_scale;
uniform vec2 u_translate;
uniform vec2 u_resolution;
varying vec2 v_world;
void main() {
  v_world = a_pos;
  vec2 screen = a_pos * u_scale + u_translate;
  vec2 clip = screen / u_resolution * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
}`;

const FRAGMENT_SHADER = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 v_world;
uniform float u_time;
uniform int u_type;
uniform vec3 u_tint;
uniform float u_tintMix;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
  return v;
}
// x = distanza dal seme più vicino, y = distanza approssimata dal bordo della cella
vec2 voronoi(vec2 p) {
  vec2 n = floor(p), f = fract(p);
  float d1 = 8.0, d2 = 8.0;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j));
      vec2 o = vec2(hash(n + g), hash(n + g + 17.3));
      vec2 r = g + o - f;
      float d = dot(r, r);
      if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) { d2 = d; }
    }
  }
  return vec2(sqrt(d1), sqrt(d2) - sqrt(d1));
}

void main() {
  float t = u_time;
  vec3 col;
  float alpha;

  if (u_type == 1) {
    // FUOCO: lingue di fuoco che salgono
    vec2 uv = v_world / 70.0 + vec2(0.0, t * 0.9);
    float n = fbm(uv);
    float n2 = fbm(uv * 1.7 + n * 1.5 + vec2(0.0, t * 0.6));
    float f = smoothstep(0.35, 0.9, n2);
    col = mix(vec3(0.55, 0.05, 0.0), vec3(1.0, 0.45, 0.05), f);
    col = mix(col, vec3(1.0, 0.9, 0.45), smoothstep(0.72, 0.95, n2));
    alpha = 0.22 + 0.5 * f;
  } else if (u_type == 2) {
    // ACQUA: caustiche, come la luce sul fondo di una piscina
    vec2 p = v_world / 55.0;
    float lines = 0.0;
    for (int i = 0; i < 3; i++) {
      p += vec2(sin(p.y * 1.7 + t * 0.7), cos(p.x * 1.3 - t * 0.7)) * 0.7;
      lines = max(lines, pow(1.0 - abs(sin(p.x + p.y)), 12.0));
      lines = max(lines, 0.7 * pow(1.0 - abs(sin(p.x * 0.7 - p.y * 1.3)), 14.0));
    }
    float depth = fbm(v_world / 120.0 + t * 0.05);
    col = mix(vec3(0.06, 0.25, 0.65) * (0.7 + 0.5 * depth), vec3(0.7, 0.95, 1.0), lines);
    alpha = 0.3 + 0.45 * lines;
  } else if (u_type == 3) {
    // ARIA: raffiche che scorrono, deformate da un rumore lento
    vec2 uv = v_world / 28.0;
    float w = fbm(uv * 0.35 + vec2(t * 0.3, 0.0));
    float s1 = sin((uv.x + uv.y * 0.35) * 2.2 + w * 7.0 - t * 4.0);
    float s2 = sin((uv.x * 0.8 - uv.y * 0.2) * 3.1 + w * 5.0 - t * 5.5 + 1.7);
    float streak = max(smoothstep(0.9, 1.0, s1), 0.7 * smoothstep(0.93, 1.0, s2));
    col = vec3(0.82, 0.84, 0.99);
    alpha = 0.08 + 0.5 * streak + 0.1 * w;
  } else if (u_type == 4) {
    // TERRA: lastre di roccia con crepe
    vec2 v = voronoi(v_world / 45.0);
    float crack = 1.0 - smoothstep(0.0, 0.08, v.y);
    float shade = 0.6 + 0.4 * noise(v_world / 12.0);
    col = mix(vec3(0.58, 0.47, 0.3) * shade, vec3(0.18, 0.13, 0.07), crack);
    alpha = 0.42 + 0.3 * crack;
  } else if (u_type == 5) {
    // RIGOGLIOSA: verde vivo che respira, con scintille
    float n = fbm(v_world / 60.0 + t * 0.1);
    vec2 cell = floor(v_world / 14.0);
    float glint = 1.0 - smoothstep(0.0, 0.2, length(fract(v_world / 14.0) - 0.5));
    float sparkle = step(0.97, hash(cell + floor(t * 3.0))) * glint;
    col = mix(vec3(0.1, 0.45, 0.2), vec3(0.5, 1.0, 0.6), n) + sparkle;
    alpha = 0.3 + 0.3 * n + 0.5 * sparkle;
  } else if (u_type == 6) {
    // MAGMA: crosta scura con crepe incandescenti che pulsano
    vec2 v = voronoi(v_world / 40.0 + vec2(0.0, t * 0.15));
    float crack = 1.0 - smoothstep(0.0, 0.12, v.y);
    float glow = 0.6 + 0.4 * sin(t * 3.0 + v.x * 6.0);
    col = mix(vec3(0.12, 0.04, 0.02), vec3(1.0, 0.45, 0.05) * glow, crack);
    alpha = 0.55 + 0.35 * crack;
  } else {
    // MANA PURO: griglia arcana che pulsa a onde
    vec2 uv = v_world / 40.0;
    vec2 g = abs(fract(uv) - 0.5);
    float grid = 1.0 - smoothstep(0.0, 0.05, min(g.x, g.y));
    float wave = 0.5 + 0.5 * sin(fbm(uv * 0.3) * 8.0 - t * 2.5);
    col = u_tint;
    alpha = 0.1 + 0.4 * grid * wave + 0.08 * wave;
  }

  // Tinta del proprietario (aree dell'avversario tendenti al rosso)
  col = mix(col, u_tint, u_tintMix);
  gl_FragColor = vec4(col * alpha, alpha);
}`;

const SHADER_TYPES = { spaziale: 0, fuoco: 1, acqua: 2, aria: 3, terra: 4, lush: 5, magma: 6 };

function hexToRgb(hex) {
  const h = (hex || '#00e0ff').replace('#', '');
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
}

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader));
  }
  return shader;
}

export class SpatialAreaRenderer {
  /** @param {HTMLCanvasElement} mainCanvas canvas 2D di gioco: quello WebGL va subito sotto */
  constructor(mainCanvas) {
    this.mainCanvas = mainCanvas;
    this.ok = false;
    try {
      this.canvas = document.createElement('canvas');
      this.canvas.id = 'spatial-gl';
      Object.assign(this.canvas.style, {
        position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
        pointerEvents: 'none', zIndex: '0'
      });
      const gl = this.canvas.getContext('webgl', { stencil: true, premultipliedAlpha: true, antialias: true });
      if (!gl) return;
      this.gl = gl;

      const program = gl.createProgram();
      gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER));
      gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
      this.program = program;

      this.loc = {
        pos: gl.getAttribLocation(program, 'a_pos'),
        scale: gl.getUniformLocation(program, 'u_scale'),
        translate: gl.getUniformLocation(program, 'u_translate'),
        resolution: gl.getUniformLocation(program, 'u_resolution'),
        time: gl.getUniformLocation(program, 'u_time'),
        type: gl.getUniformLocation(program, 'u_type'),
        tint: gl.getUniformLocation(program, 'u_tint'),
        tintMix: gl.getUniformLocation(program, 'u_tintMix')
      };
      this.buffer = gl.createBuffer();

      // Il canvas 2D deve stare sopra a quello WebGL
      mainCanvas.style.position = 'relative';
      mainCanvas.style.zIndex = '1';
      mainCanvas.parentNode.insertBefore(this.canvas, mainCanvas);
      this.ok = true;
    } catch (error) {
      console.warn('⚠️ Shader delle aree non disponibili, uso il riempimento semplice:', error);
      this.ok = false;
      this.canvas?.remove();
    }
  }

  /**
   * @param {{ points: {x,y}[], element: string, variant?: string, tint?: string, tintMix?: number }[]} areas
   * @param {DOMMatrix} transform trasformazione del contesto 2D in coordinate del mondo
   * @param {{ x, y, width, height }|null} clip rettangolo (in pixel dello schermo) dell'arena, o null
   */
  render(areas, transform, clip = null) {
    if (!this.ok) return;
    const gl = this.gl;
    const { width, height } = this.mainCanvas;
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }

    gl.viewport(0, 0, width, height);
    gl.clearColor(0, 0, 0, 0);
    gl.clearStencil(0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
    if (areas.length === 0) return;

    gl.useProgram(this.program);
    gl.uniform2f(this.loc.scale, transform.a, transform.d);
    gl.uniform2f(this.loc.translate, transform.e, transform.f);
    gl.uniform2f(this.loc.resolution, width, height);
    gl.uniform1f(this.loc.time, performance.now() / 1000);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.enableVertexAttribArray(this.loc.pos);
    gl.vertexAttribPointer(this.loc.pos, 2, gl.FLOAT, false, 0, 0);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.STENCIL_TEST);
    if (clip) {
      gl.enable(gl.SCISSOR_TEST);
      gl.scissor(Math.round(clip.x), Math.round(height - clip.y - clip.height), Math.round(clip.width), Math.round(clip.height));
    } else {
      gl.disable(gl.SCISSOR_TEST);
    }

    for (const area of areas) {
      const pts = area.points;
      if (!pts || pts.length < 3) continue;

      // 1) Stencil: ogni triangolo del ventaglio inverte il bit -> dentro = dispari
      const fan = new Float32Array(pts.length * 2);
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      pts.forEach((p, i) => {
        fan[i * 2] = p.x;
        fan[i * 2 + 1] = p.y;
        minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
      });
      gl.colorMask(false, false, false, false);
      gl.stencilFunc(gl.ALWAYS, 0, 1);
      gl.stencilOp(gl.KEEP, gl.KEEP, gl.INVERT);
      gl.bufferData(gl.ARRAY_BUFFER, fan, gl.STREAM_DRAW);
      gl.drawArrays(gl.TRIANGLE_FAN, 0, pts.length);

      // 2) Shader sul rettangolo che contiene l'area, solo dove lo stencil è dispari
      //    (e lo stencil torna a zero, pronto per l'area successiva)
      gl.colorMask(true, true, true, true);
      gl.stencilFunc(gl.EQUAL, 1, 1);
      gl.stencilOp(gl.ZERO, gl.ZERO, gl.ZERO);
      const typeKey = area.variant || area.element;
      gl.uniform1i(this.loc.type, SHADER_TYPES[typeKey] ?? 0);
      gl.uniform3fv(this.loc.tint, hexToRgb(area.tint));
      gl.uniform1f(this.loc.tintMix, area.tintMix || 0);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        minX, minY, maxX, minY, maxX, maxY,
        minX, minY, maxX, maxY, minX, maxY
      ]), gl.STREAM_DRAW);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
  }
}
