/**
 * Gera toda a pixel art do jogo em public/assets/*.png, sem dependências externas.
 * Rode com `npm run gen:assets`. Os PNGs gerados são versionados, então só é
 * preciso rodar de novo ao alterar os desenhos aqui.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FOX_FRAMES, FOX_FRAME_COUNT } from '../src/data/foxFrames.ts';

// --out <pasta> gera em outro lugar (ex.: prévias para aprovação), sem tocar em public/assets
const outArg = process.argv.indexOf('--out');
const OUT = outArg > 0 ? process.argv[outArg + 1] : join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'assets');

type RGBA = [number, number, number, number];

function hex(h: string, a = 255): RGBA {
  const n = parseInt(h.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, a];
}

// ---------- raster ----------

class Img {
  w: number;
  h: number;
  data: Uint8Array;
  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.data = new Uint8Array(w * h * 4);
  }
  set(x: number, y: number, c: RGBA) {
    x = Math.floor(x);
    y = Math.floor(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 4;
    this.data[i] = c[0];
    this.data[i + 1] = c[1];
    this.data[i + 2] = c[2];
    this.data[i + 3] = c[3];
  }
  alpha(x: number, y: number) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0;
    return this.data[(y * this.w + x) * 4 + 3];
  }
  rect(x: number, y: number, w: number, h: number, c: RGBA) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, c);
  }
  ellipse(cx: number, cy: number, rx: number, ry: number, c: RGBA) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx;
        const dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.set(x, y, c);
      }
  }
  poly(pts: [number, number][], c: RGBA) {
    const ys = pts.map((p) => p[1]);
    for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) {
      const py = y + 0.5;
      const xs: number[] = [];
      for (let i = 0; i < pts.length; i++) {
        const [x0, y0] = pts[i];
        const [x1, y1] = pts[(i + 1) % pts.length];
        if ((y0 <= py && y1 > py) || (y1 <= py && y0 > py)) {
          xs.push(x0 + ((py - y0) / (y1 - y0)) * (x1 - x0));
        }
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2)
        for (let x = Math.ceil(xs[k] - 0.5); x <= Math.floor(xs[k + 1] - 0.5); x++) this.set(x, y, c);
    }
  }
  line(x0: number, y0: number, x1: number, y1: number, c: RGBA, thick = 1) {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2 + 1;
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const x = x0 + (x1 - x0) * t;
      const y = y0 + (y1 - y0) * t;
      this.rect(Math.round(x - (thick - 1) / 2), Math.round(y - (thick - 1) / 2), thick, thick, c);
    }
  }
  /** Contorno de 1px em volta de todos os pixels opacos. */
  outline(c: RGBA) {
    const mark: number[] = [];
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        if (this.alpha(x, y) > 0) continue;
        if (this.alpha(x - 1, y) || this.alpha(x + 1, y) || this.alpha(x, y - 1) || this.alpha(x, y + 1))
          mark.push(x, y);
      }
    for (let i = 0; i < mark.length; i += 2) this.set(mark[i], mark[i + 1], c);
  }
  blit(src: Img, dx: number, dy: number) {
    for (let y = 0; y < src.h; y++)
      for (let x = 0; x < src.w; x++) {
        const i = (y * src.w + x) * 4;
        if (src.data[i + 3] === 0) continue;
        this.set(dx + x, dy + y, [src.data[i], src.data[i + 1], src.data[i + 2], src.data[i + 3]]);
      }
  }
}

function sheet(frames: Img[]): Img {
  const out = new Img(frames[0].w * frames.length, frames[0].h);
  frames.forEach((f, i) => out.blit(f, i * f.w, 0));
  return out;
}

// ---------- png ----------

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Uint8Array) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  Buffer.from(data).copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

function png(img: Img): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(img.w, 0);
  ihdr.writeUInt32BE(img.h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc((img.w * 4 + 1) * img.h);
  for (let y = 0; y < img.h; y++) {
    raw[y * (img.w * 4 + 1)] = 0;
    Buffer.from(img.data.subarray(y * img.w * 4, (y + 1) * img.w * 4)).copy(raw, y * (img.w * 4 + 1) + 1);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', new Uint8Array()),
  ]);
}

function save(name: string, img: Img) {
  const path = join(OUT, name);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, png(img));
  console.log(`  ${name} (${img.w}x${img.h})`);
}

function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

// ---------- paleta ----------

const OUTLINE = hex('#2a1a14');
const GRASS = hex('#5fb04a');
const GRASS_LIGHT = hex('#8fd36a');
const GRASS_DARK = hex('#3f8a3a');
const DIRT = hex('#8a5a3b');
const DIRT_DARK = hex('#6d4430');
const DIRT_LIGHT = hex('#a8744f');
const WOOD = hex('#a0673a');
const WOOD_LIGHT = hex('#c88a52');
const WOOD_DARK = hex('#6e4426');
const PAPER = hex('#fffaf0');
const PAPER_SHADE = hex('#e6dcc6');
const INK = hex('#7a6a5a');
const STEEL = hex('#c9d1d9');
const STEEL_DARK = hex('#8b98a5');
const RED = hex('#d6453d');
const GOLD = hex('#e8c170');
const WHITE = hex('#ffffff');

// ---------- raposa (32x32, de perfil olhando pra direita) ----------
// Desenho original no estilo das referências da spec 003: laranja vivo, olho grande,
// peito/ponta da cauda/miolo das orelhas brancos, pernas marrom-escuras, contorno escuro.
// Pés na linha 30 e tronco centrado em x ≈ 16: o corpo de colisão (14×20 em 9,11) não muda.

const FOX_ORANGE = hex('#f7a21b');
const FOX_LIGHT = hex('#ffc04a');
const FOX_SHADE = hex('#c45a14');
const FOX_LEG = hex('#5a2a0e');
const FOX_WHITE = hex('#ffffff');
const FOX_WHITE_SHADE = hex('#b9b9c2');

type Pt = [number, number];
type TailPose = { ctrl: Pt; tip: Pt };

type Pose = {
  /** deslocamento vertical do corpo e da cabeça */
  bob: number;
  /** deslocamento [dx, dy] do pé de cada perna: traseira longe, traseira perto, dianteira longe, dianteira perto */
  legs: [Pt, Pt, Pt, Pt];
  tail: TailPose;
  /** corpo mais comprido (pulo) */
  stretch?: number;
  /** cabeça um pouco à frente/para baixo, em px */
  head?: Pt;
  hurt?: boolean;
};

function bezier(a: Pt, c: Pt, b: Pt, t: number): Pt {
  const u = 1 - t;
  return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]];
}

/** Cauda volumosa: fina na base, gorda no meio, ponta branca; sombra por baixo. */
function drawTail(img: Img, base: Pt, pose: TailPose) {
  const radius = (t: number) => 1.3 + 2.3 * Math.sin(Math.PI * Math.min(1, t * 1.05));
  for (const pass of ['shade', 'main'] as const) {
    for (let t = 0; t <= 1.0001; t += 0.02) {
      const [x, y] = bezier(base, pose.ctrl, pose.tip, t);
      const r = radius(t);
      const white = t > 0.66;
      if (pass === 'shade') img.ellipse(x, y + 1, r, r, white ? FOX_WHITE_SHADE : FOX_SHADE);
      else img.ellipse(x, y, r, r * 0.92, white ? FOX_WHITE : FOX_ORANGE);
    }
  }
}

function foxFrame(p: Pose): Img {
  const img = new Img(32, 32);
  const b = p.bob;
  const st = p.stretch ?? 0;
  const [hx, hy] = p.head ?? [0, 0];

  // pernas de trás (mais escuras) antes do corpo
  const hips: Pt[] = [
    [11 - st, 24 + b],
    [13 - st, 24 + b],
    [18 + st, 24 + b],
    [20 + st, 24 + b],
  ];
  const leg = (i: number) => {
    const [x0, y0] = hips[i];
    const [dx, dy] = p.legs[i];
    const fx = x0 + dx;
    const fy = 29 + dy;
    const far = i === 0 || i === 2;
    img.line(x0, y0, fx, fy, far ? hex('#3e1c08') : FOX_LEG, 2);
    // pé começa na perna e avança 1 px para a frente (no sentido em que a raposa olha)
    img.rect(Math.round(fx), Math.round(fy) + 1, 3, 1, far ? hex('#3e1c08') : FOX_LEG);
  };
  leg(0);
  leg(2);

  drawTail(img, [10 - st, 21 + b], p.tail);

  // corpo: sombra embaixo, laranja, brilho no dorso
  img.ellipse(15.5, 22.5 + b, 7.5 + st, 4.5, FOX_SHADE);
  img.ellipse(15.5, 21.8 + b, 7.3 + st, 4, FOX_ORANGE);
  img.rect(11 - st, 18 + b, 8 + st * 2, 1, FOX_LIGHT);
  // peito branco subindo para o pescoço
  img.ellipse(20.5 + st, 22 + b, 3, 3.6, FOX_WHITE);
  img.rect(19 + st, 24 + b, 4, 1, FOX_WHITE_SHADE);

  leg(1);
  leg(3);

  // cabeça grande
  const cx = 21.5 + st + hx;
  const cy = 13.5 + b + hy;
  // orelhas (a de trás primeiro)
  img.poly(
    [
      [cx - 5, cy - 2],
      [cx - 4, cy - 9],
      [cx - 1, cy - 4],
    ],
    FOX_SHADE,
  );
  img.poly(
    [
      [cx - 1, cy - 4],
      [cx + 1, cy - 11],
      [cx + 3.5, cy - 4],
    ],
    FOX_ORANGE,
  );
  img.poly(
    [
      [cx, cy - 5],
      [cx + 1, cy - 9],
      [cx + 2.2, cy - 5],
    ],
    FOX_WHITE,
  );
  img.ellipse(cx, cy, 5.6, 5, FOX_ORANGE);
  img.rect(Math.round(cx - 4), Math.round(cy - 5), 6, 1, FOX_LIGHT);
  // focinho: laranja em cima, branco embaixo, ponta escura
  img.poly(
    [
      [cx + 3, cy - 1],
      [cx + 8.5, cy + 1.5],
      [cx + 8, cy + 3],
      [cx + 3, cy + 4],
    ],
    FOX_ORANGE,
  );
  img.poly(
    [
      [cx - 1, cy + 2],
      [cx + 8, cy + 2.3],
      [cx + 7, cy + 3.6],
      [cx + 1, cy + 5],
      [cx - 2, cy + 4],
    ],
    FOX_WHITE,
  );
  img.rect(Math.round(cx + 7), Math.round(cy + 1), 2, 1, OUTLINE);
  // olho grande e retangular (2×3); no dano, um "x"
  const ex = Math.round(cx + 1);
  const ey = Math.round(cy - 2);
  if (p.hurt) {
    img.set(ex - 1, ey, OUTLINE);
    img.set(ex + 1, ey, OUTLINE);
    img.set(ex, ey + 1, OUTLINE);
    img.set(ex - 1, ey + 2, OUTLINE);
    img.set(ex + 1, ey + 2, OUTLINE);
  } else {
    img.rect(ex, ey, 2, 3, OUTLINE);
  }
  img.outline(OUTLINE);
  return img;
}

const STAND: [Pt, Pt, Pt, Pt] = [
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
];

// poses-chave da cauda parada (estilo da ref. 2): diagonal ↑, quase vertical, curvada no alto, reta para trás, caída com ponta curvada
const TAIL_KEYS: TailPose[] = [
  { ctrl: [5, 17], tip: [3, 9] },
  { ctrl: [7, 13], tip: [7, 5] },
  { ctrl: [5, 9], tip: [2, 13] },
  { ctrl: [6.5, 20], tip: [4.5, 19.5] },
  { ctrl: [3, 19], tip: [4, 27] },
];

/** Catmull-Rom fechada: passa por todas as poses-chave, sem quinas entre elas. */
function catmull(p0: number, p1: number, p2: number, p3: number, t: number) {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}

/** Ciclo fluido da cauda: n posições amostradas na curva fechada pelas poses-chave. */
function tailLoop(keys: TailPose[], n: number): TailPose[] {
  const k = keys.length;
  const out: TailPose[] = [];
  for (let i = 0; i < n; i++) {
    const u = (i / n) * k;
    const s = Math.floor(u);
    const t = u - s;
    const at = (j: number) => keys[(s + j + k) % k];
    const lerp = (sel: (p: TailPose) => Pt): Pt => [
      catmull(sel(at(-1))[0], sel(at(0))[0], sel(at(1))[0], sel(at(2))[0], t),
      catmull(sel(at(-1))[1], sel(at(0))[1], sel(at(1))[1], sel(at(2))[1], t),
    ];
    out.push({ ctrl: lerp((p) => p.ctrl), tip: lerp((p) => p.tip) });
  }
  return out;
}

const TAIL_CYCLE = tailLoop(TAIL_KEYS, FOX_FRAMES.idle.length);

function foxPoses(): Pose[] {
  // parada: corpo e cabeça se movem juntos, guiados pela cauda: com a cauda no alto o corpo
  // fica em cima; com a cauda baixa o peso puxa o quadril e o corpo abaixa até IDLE_DIP px
  const IDLE_DIP = 2;
  const tipYs = TAIL_CYCLE.map((t) => t.tip[1]);
  const lo = Math.min(...tipYs);
  const hi = Math.max(...tipYs);
  const idle = TAIL_CYCLE.map((tail): Pose => {
    const bob = Math.round((IDLE_DIP * (tail.tip[1] - lo)) / (hi - lo));
    return { bob, legs: STAND, tail: { ctrl: [tail.ctrl[0], tail.ctrl[1] + bob], tip: [tail.tip[0], tail.tip[1] + bob] } };
  });
  // corrida: trote (diagonais em fase), corpo quica 2× por ciclo, cauda ondula com atraso
  const run: Pose[] = Array.from({ length: FOX_FRAMES.run.length }, (_, i): Pose => {
    const phi = (i / FOX_FRAMES.run.length) * Math.PI * 2;
    const foot = (offset: number): Pt => {
      const a2 = phi + offset;
      // pé apoiado vai da frente para trás (empurra o chão); levantado, volta para a frente
      return [Math.round(3 * Math.cos(a2)), -Math.round(Math.max(0, -Math.sin(a2)) * 2)];
    };
    const bob = -Math.round(0.5 - 0.5 * Math.cos(2 * phi));
    const wave = Math.sin(phi - 0.9);
    return {
      bob,
      legs: [foot(Math.PI), foot(0), foot(0), foot(Math.PI)],
      tail: { ctrl: [5, 17.5 + wave * 1.5], tip: [2, 13 + wave * 3] },
    };
  });
  const jump: Pose = { bob: -1, stretch: 1, legs: [[-4, -2], [-3, -2], [4, -3], [3, -2]], tail: { ctrl: [7.5, 19.5], tip: [5, 18.5] }, head: [-1, 1] };
  const fall: Pose = { bob: 0, legs: [[-2, 0], [-1, 0], [2, 0], [1, 0]], tail: { ctrl: [6, 13], tip: [5, 6] } };
  const land: Pose[] = [
    { bob: 2, legs: [[-2, 0], [-1, 0], [1, 0], [2, 0]], tail: { ctrl: [6.5, 22], tip: [4.5, 21] }, head: [0, 1] },
    { bob: 1, legs: STAND, tail: { ctrl: [5, 19], tip: [2, 16] } },
  ];
  const hurt: Pose = { bob: 1, legs: [[-2, 0], [2, 0], [-2, 0], [2, 0]], tail: { ctrl: [4, 22], tip: [2, 26] }, hurt: true };

  const byName: Record<keyof typeof FOX_FRAMES, Pose[]> = { idle, run, jump: [jump], fall: [fall], land, hurt: [hurt] };
  const poses: Pose[] = new Array(FOX_FRAME_COUNT);
  for (const [name, frames] of Object.entries(FOX_FRAMES) as [keyof typeof FOX_FRAMES, readonly number[]][]) {
    frames.forEach((frame, i) => (poses[frame] = byName[name][i]));
  }
  return poses;
}

function genFox() {
  const frames = foxPoses().map(foxFrame);
  // nada do desenho pode encostar na borda do quadro: o contorno ficaria de fora (parte cortada)
  const cut = frames.flatMap((img, i) => {
    for (let k = 0; k < 32; k++)
      for (const [x, y] of [[0, k], [31, k], [k, 0]] as Pt[]) {
        const o = (y * 32 + x) * 4;
        const isOutline = img.data[o] === OUTLINE[0] && img.data[o + 1] === OUTLINE[1] && img.data[o + 2] === OUTLINE[2];
        if (img.data[o + 3] && !isOutline) return [i];
      }
    return [];
  });
  if (cut.length && !process.argv.includes("--no-check")) throw new Error(`raposa cortada na borda do quadro: ${cut.join(", ")}`);
  save('fox.png', sheet(frames));
}

/** Quadro "parado" usado no ícone do app. */
function foxIconFrame() {
  return foxFrame({ bob: 0, legs: STAND, tail: TAIL_CYCLE[0] });
}

// ---------- tileset (16x16, 7 colunas x 2 linhas, margem 1 e espaçamento 2) ----------

const TILE_MARGIN = 1;
const TILE_SPACING = 2;
// linha 0: grama meio, grama esq, grama dir, grama única, plataforma esq, plataforma meio, plataforma dir
// linha 1: terra meio, terra esq, terra dir, terra única, arbusto, flores, tufo

function dirtTile(seed: number, left: boolean, right: boolean): Img {
  const t = new Img(16, 16);
  t.rect(0, 0, 16, 16, DIRT);
  const r = rng(seed);
  for (let k = 0; k < 10; k++) {
    const x = Math.floor(r() * 15);
    const y = Math.floor(r() * 15);
    t.rect(x, y, r() > 0.5 ? 2 : 1, 1, r() > 0.4 ? DIRT_DARK : DIRT_LIGHT);
  }
  if (left) t.rect(0, 0, 1, 16, OUTLINE);
  if (right) t.rect(15, 0, 1, 16, OUTLINE);
  return t;
}

function grassTile(seed: number, left: boolean, right: boolean): Img {
  const t = dirtTile(seed, left, right);
  const r = rng(seed + 99);
  for (let x = 0; x < 16; x++) {
    const depth = 4 + Math.floor(r() * 3);
    t.rect(x, 0, 1, depth, GRASS);
    t.set(x, depth, GRASS_DARK);
  }
  t.rect(0, 0, 16, 1, OUTLINE);
  t.rect(0, 1, 16, 1, GRASS_LIGHT);
  for (let k = 0; k < 4; k++) t.set(Math.floor(r() * 16), 2 + Math.floor(r() * 2), GRASS_LIGHT);
  if (left) {
    t.rect(0, 0, 1, 16, OUTLINE);
    t.set(1, 1, GRASS);
  }
  if (right) {
    t.rect(15, 0, 1, 16, OUTLINE);
    t.set(14, 1, GRASS);
  }
  return t;
}

function plankTile(left: boolean, right: boolean): Img {
  const t = new Img(16, 16);
  t.rect(0, 1, 16, 6, WOOD);
  t.rect(0, 1, 16, 1, WOOD_LIGHT);
  t.rect(0, 6, 16, 1, WOOD_DARK);
  t.rect(0, 0, 16, 1, OUTLINE);
  t.rect(0, 7, 16, 1, OUTLINE);
  t.set(4, 3, WOOD_DARK);
  t.set(11, 4, WOOD_DARK);
  if (left) {
    t.rect(0, 0, 1, 8, OUTLINE);
    t.rect(2, 8, 2, 3, WOOD_DARK);
  }
  if (right) {
    t.rect(15, 0, 1, 8, OUTLINE);
    t.rect(12, 8, 2, 3, WOOD_DARK);
  }
  return t;
}

function decorTile(kind: 'bush' | 'flowers' | 'tuft'): Img {
  const t = new Img(16, 16);
  if (kind === 'bush') {
    t.ellipse(5, 12, 4, 4, GRASS_DARK);
    t.ellipse(10, 11, 5, 5, GRASS);
    t.ellipse(9, 9, 2, 2, GRASS_LIGHT);
    t.rect(0, 15, 16, 1, [0, 0, 0, 0]);
    t.outline(OUTLINE);
  } else if (kind === 'flowers') {
    for (const [x, c] of [
      [3, RED],
      [8, GOLD],
      [12, WHITE],
    ] as [number, RGBA][]) {
      t.rect(x, 11, 1, 5, GRASS_DARK);
      t.rect(x - 1, 10, 3, 1, c);
      t.rect(x, 9, 1, 3, c);
      t.set(x, 10, GOLD);
    }
  } else {
    for (const x of [4, 6, 9, 11]) t.line(x, 15, x + (x % 3) - 1, 10 + (x % 4), GRASS_DARK);
    t.line(7, 15, 7, 9, GRASS);
  }
  return t;
}

function genTiles() {
  const tiles = [
    grassTile(1, false, false),
    grassTile(2, true, false),
    grassTile(3, false, true),
    grassTile(4, true, true),
    plankTile(true, false),
    plankTile(false, false),
    plankTile(false, true),
    dirtTile(5, false, false),
    dirtTile(6, true, false),
    dirtTile(7, false, true),
    dirtTile(8, true, true),
    decorTile('bush'),
    decorTile('flowers'),
    decorTile('tuft'),
  ];
  // tiles extrudados (margem 1, espaçamento 2, bordas duplicadas): com zoom de câmera
  // fracionário, a borda de um tile não amostra o vizinho e não aparecem linhas no chão
  const step = 16 + TILE_SPACING;
  const out = new Img(TILE_MARGIN * 2 + 7 * 16 + 6 * TILE_SPACING, TILE_MARGIN * 2 + 2 * 16 + TILE_SPACING);
  tiles.forEach((t, i) => {
    const ox = TILE_MARGIN + (i % 7) * step;
    const oy = TILE_MARGIN + Math.floor(i / 7) * step;
    for (let y = -1; y <= 16; y++)
      for (let x = -1; x <= 16; x++) {
        const sx = Math.min(15, Math.max(0, x));
        const sy = Math.min(15, Math.max(0, y));
        const k = (sy * 16 + sx) * 4;
        const c: RGBA = [t.data[k], t.data[k + 1], t.data[k + 2], t.data[k + 3]];
        if (c[3]) out.set(ox + x, oy + y, c);
      }
  });
  save('tiles.png', out);
}

// ---------- objetos ----------

function genPage() {
  const t = new Img(16, 16);
  t.poly(
    [
      [3, 2],
      [11, 1],
      [14, 4],
      [13, 14],
      [4, 15],
    ],
    PAPER,
  );
  t.poly(
    [
      [11, 1],
      [11, 4],
      [14, 4],
    ],
    PAPER_SHADE,
  );
  for (const y of [6, 8, 10, 12]) t.line(5, y, 11, y - 0.5, INK);
  t.outline(OUTLINE);
  save('page.png', t);
  return t;
}

function genSpike() {
  const t = new Img(16, 16);
  for (const x of [0, 5, 10]) {
    t.poly(
      [
        [x + 0.5, 16],
        [x + 3, 7],
        [x + 5.5, 16],
      ],
      STEEL,
    );
    t.line(x + 3, 8, x + 4.5, 15, STEEL_DARK);
  }
  t.outline(OUTLINE);
  save('spike.png', t);
}

function genPlatform() {
  const t = new Img(48, 16);
  t.rect(1, 1, 46, 8, WOOD);
  t.rect(1, 1, 46, 1, WOOD_LIGHT);
  t.rect(1, 8, 46, 1, WOOD_DARK);
  for (const x of [12, 24, 36]) t.rect(x, 2, 1, 6, WOOD_DARK);
  for (const x of [5, 42]) {
    t.rect(x - 1, 2, 3, 6, STEEL_DARK);
    t.rect(x, 3, 1, 1, STEEL);
  }
  t.outline(OUTLINE);
  save('platform.png', t);
}

function genCheckpoint() {
  const frames = [false, true].map((on) => {
    const t = new Img(16, 32);
    t.rect(4, 4, 2, 27, WOOD_DARK);
    t.rect(2, 30, 6, 2, WOOD);
    const c = on ? RED : hex('#9aa0a6');
    // marcador de livro com a ponta em "V"
    t.poly(
      [
        [6, 5],
        [14, 5],
        [14, 16],
        [10, 13],
        [6, 16],
      ],
      c,
    );
    if (on) t.rect(9, 7, 2, 2, GOLD);
    t.outline(OUTLINE);
    return t;
  });
  save('checkpoint.png', sheet(frames));
}

function genExit() {
  const frames = [false, true].map((open) => {
    const t = new Img(32, 32);
    // púlpito
    t.poly(
      [
        [12, 18],
        [20, 18],
        [19, 29],
        [13, 29],
      ],
      WOOD,
    );
    t.rect(9, 29, 14, 3, WOOD_DARK);
    t.poly(
      [
        [5, 14],
        [27, 14],
        [25, 19],
        [7, 19],
      ],
      WOOD_LIGHT,
    );
    if (open) {
      t.poly(
        [
          [5, 9],
          [16, 11],
          [16, 16],
          [6, 14],
        ],
        PAPER,
      );
      t.poly(
        [
          [27, 9],
          [16, 11],
          [16, 16],
          [26, 14],
        ],
        PAPER_SHADE,
      );
      for (const y of [11, 13]) {
        t.line(8, y, 14, y + 1, INK);
        t.line(18, y + 1, 24, y, INK);
      }
    } else {
      t.rect(8, 9, 16, 5, hex('#6b2f3a'));
      t.rect(8, 9, 16, 1, hex('#8e4552'));
      t.rect(8, 13, 16, 1, PAPER_SHADE);
      t.rect(14, 8, 4, 7, GOLD);
      t.rect(15, 10, 2, 2, OUTLINE);
    }
    t.outline(OUTLINE);
    return t;
  });
  save('exit.png', sheet(frames));
}

function genHeart() {
  const frames = [true, false].map((full) => {
    const t = new Img(16, 16);
    const c = full ? RED : hex('#5a4a4a');
    t.ellipse(5, 6, 3.5, 3.5, c);
    t.ellipse(11, 6, 3.5, 3.5, c);
    t.poly(
      [
        [1.6, 7],
        [14.4, 7],
        [8, 14],
      ],
      c,
    );
    if (full) t.rect(4, 4, 2, 2, hex('#ff9b8f'));
    t.outline(OUTLINE);
    return t;
  });
  save('heart.png', sheet(frames));
}

function genUi() {
  const BG = hex('#1d1530', 150);
  const FG = hex('#ffffff', 230);
  const base = () => {
    const t = new Img(32, 32);
    t.ellipse(16, 16, 15, 15, BG);
    return t;
  };
  const left = base();
  left.poly(
    [
      [9, 16],
      [19, 9],
      [19, 23],
    ],
    FG,
  );
  const right = base();
  right.poly(
    [
      [23, 16],
      [13, 9],
      [13, 23],
    ],
    FG,
  );
  const jump = base();
  jump.poly(
    [
      [16, 8],
      [24, 18],
      [8, 18],
    ],
    FG,
  );
  jump.rect(13, 18, 6, 6, FG);
  const pause = base();
  pause.rect(11, 10, 3, 12, FG);
  pause.rect(18, 10, 3, 12, FG);
  const speaker = (on: boolean) => {
    const t = base();
    t.rect(8, 13, 4, 6, FG);
    t.poly(
      [
        [11, 13],
        [17, 8],
        [17, 24],
        [11, 19],
      ],
      FG,
    );
    if (on) {
      t.line(20, 12, 21, 16, FG);
      t.line(21, 16, 20, 20, FG);
      t.line(23, 10, 25, 16, FG);
      t.line(25, 16, 23, 22, FG);
    } else {
      t.line(20, 12, 25, 20, FG, 2);
      t.line(25, 12, 20, 20, FG, 2);
    }
    return t;
  };
  save('ui.png', sheet([left, right, jump, pause, speaker(true), speaker(false)]));
}

function genSpark() {
  const t = new Img(8, 8);
  t.rect(3, 0, 2, 8, hex('#fff3b0'));
  t.rect(0, 3, 8, 2, hex('#fff3b0'));
  t.rect(3, 3, 2, 2, WHITE);
  save('spark.png', t);
}

// ---------- ícones do app (Tela de Início / manifest) ----------

function scaledBlit(dst: Img, src: Img, dx: number, dy: number, scale: number) {
  for (let y = 0; y < src.h * scale; y++)
    for (let x = 0; x < src.w * scale; x++) {
      const k = (Math.floor(y / scale) * src.w + Math.floor(x / scale)) * 4;
      if (src.data[k + 3]) dst.set(dx + x, dy + y, [src.data[k], src.data[k + 1], src.data[k + 2], src.data[k + 3]]);
    }
}

function genIcons(page: Img) {
  const foxImg = foxIconFrame();
  for (const size of [180, 192, 512]) {
    const icon = new Img(size, size);
    icon.rect(0, 0, size, size, hex('#1d1530'));
    // raposa ampliada em escala inteira, com uma página flutuando acima
    const scale = Math.floor((size * 0.85) / 32);
    const fw = 32 * scale;
    scaledBlit(icon, foxImg, Math.round((size - fw) / 2), Math.round(size * 0.97 - fw), scale);
    const ps = Math.max(1, Math.floor(scale / 2));
    scaledBlit(icon, page, Math.round(size * 0.1), Math.round(size * 0.1), ps);
    save(`icon-${size}.png`, icon);
  }
}

console.log('Gerando assets em public/assets:');
genFox();
genTiles();
const page = genPage();
genSpike();
genPlatform();
genCheckpoint();
genExit();
genHeart();
genUi();
genSpark();
genIcons(page);
