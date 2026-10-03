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
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return this;
    const i = (y * this.w + x) * 4;
    this.data[i] = c[0];
    this.data[i + 1] = c[1];
    this.data[i + 2] = c[2];
    this.data[i + 3] = c[3];
    return this;
  }
  alpha(x: number, y: number) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0;
    return this.data[(y * this.w + x) * 4 + 3];
  }
  rect(x: number, y: number, w: number, h: number, c: RGBA) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, c);
    return this;
  }
  ellipse(cx: number, cy: number, rx: number, ry: number, c: RGBA) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx;
        const dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.set(x, y, c);
      }
    return this;
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
    return this;
  }
  line(x0: number, y0: number, x1: number, y1: number, c: RGBA, thick = 1) {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2 + 1;
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const x = x0 + (x1 - x0) * t;
      const y = y0 + (y1 - y0) * t;
      this.rect(Math.round(x - (thick - 1) / 2), Math.round(y - (thick - 1) / 2), thick, thick, c);
    }
    return this;
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

// ---------- tilesets por cenário (16x16, 7 colunas x 3 linhas, margem 1 e espaçamento 2) ----------
// Mesmo layout para todos os cenários (os índices dos mapas não dependem do tema):
// linha 0: topo meio, topo esq, topo dir, topo único, tábua esq, tábua meio, tábua dir
// linha 1: corpo meio, corpo esq, corpo dir, corpo único, enfeite 1, enfeite 2, enfeite 3
// linha 2: teto esq, teto meio, teto dir, teto único, enfeite 1/2/3 espelhados

const TILE_MARGIN = 1;
const TILE_SPACING = 2;

type Tone3 = [RGBA, RGBA, RGBA]; // base, claro, escuro
type TopStyle = 'grass' | 'cobble' | 'sand' | 'moss' | 'castle' | 'paper';
type PlankStyle = 'wood' | 'white' | 'stone' | 'glass' | 'log' | 'deck' | 'board';
type DecorKind =
  | 'bush' | 'flowers' | 'tuft' | 'lamp' | 'bench' | 'vase' | 'fence' | 'barrel' | 'shell' | 'crate' | 'rope'
  | 'whitefence' | 'mailbox' | 'mushroom' | 'fern' | 'stump' | 'palm' | 'chest' | 'anchor' | 'torch' | 'banner'
  | 'urn' | 'can' | 'papers';

type TileStyle = { top: TopStyle; topC: Tone3; body: 'dirt' | 'stone'; bodyC: Tone3; plank: PlankStyle; decor: [DecorKind, DecorKind, DecorKind] };

const tone = (a: string, b: string, c: string): Tone3 => [hex(a), hex(b), hex(c)];

// research D9/D10
const TILE_STYLES: Record<string, TileStyle> = {
  padrao: { top: 'grass', topC: tone('#5fb04a', '#8fd36a', '#3f8a3a'), body: 'dirt', bodyC: tone('#8a5a3b', '#a8744f', '#6d4430'), plank: 'wood', decor: ['bush', 'flowers', 'tuft'] },
  'rio-antigo': { top: 'cobble', topC: tone('#9a9aa0', '#c4c4ca', '#5e5e66'), body: 'dirt', bodyC: tone('#7a5a40', '#94704f', '#5c4230'), plank: 'stone', decor: ['lamp', 'bench', 'vase'] },
  'vila-colonial': { top: 'grass', topC: tone('#6aa84f', '#94c76e', '#467a35'), body: 'dirt', bodyC: tone('#9a5a3a', '#b57250', '#74402a'), plank: 'wood', decor: ['fence', 'flowers', 'barrel'] },
  praia: { top: 'sand', topC: tone('#f2d48a', '#fff0b8', '#c9a45a'), body: 'dirt', bodyC: tone('#c9a45a', '#e2c27a', '#a88444'), plank: 'deck', decor: ['shell', 'crate', 'rope'] },
  'cidade-pequena': { top: 'grass', topC: tone('#7cb342', '#a5d16a', '#558b2f'), body: 'dirt', bodyC: tone('#a8522e', '#c46c44', '#7e3a20'), plank: 'white', decor: ['whitefence', 'mailbox', 'bush'] },
  floresta: { top: 'moss', topC: tone('#3e7a3a', '#5f9e4a', '#2a5428'), body: 'dirt', bodyC: tone('#4a3424', '#624632', '#33241a'), plank: 'log', decor: ['mushroom', 'fern', 'stump'] },
  'costa-colonial': { top: 'cobble', topC: tone('#c9b07a', '#e6d3a0', '#8a7448'), body: 'dirt', bodyC: tone('#7a5a3a', '#94704c', '#5a4028'), plank: 'deck', decor: ['palm', 'chest', 'anchor'] },
  castelo: { top: 'castle', topC: tone('#8a9ab5', '#b9c6dc', '#55627d'), body: 'stone', bodyC: tone('#6a7896', '#8492ae', '#4a5672'), plank: 'glass', decor: ['torch', 'banner', 'urn'] },
  favela: { top: 'paper', topC: tone('#7a6248', '#94795a', '#5a4834'), body: 'dirt', bodyC: tone('#6e5a44', '#88725a', '#52432f'), plank: 'board', decor: ['can', 'crate', 'papers'] },
};

function bodyTile(st: TileStyle, seed: number, left: boolean, right: boolean): Img {
  const t = new Img(16, 16);
  const [base, light, dark] = st.bodyC;
  t.rect(0, 0, 16, 16, base);
  if (st.body === 'stone') {
    // blocos de pedra em fiadas desencontradas
    for (let row = 0; row < 2; row++) {
      const y = row * 8;
      t.rect(0, y + 7, 16, 1, dark);
      const off = row % 2 ? 0 : 8;
      t.rect(off, y, 1, 7, dark);
      t.rect(off + 1, y, 6, 1, light);
    }
  } else {
    const r = rng(seed);
    for (let k = 0; k < 10; k++) {
      const x = Math.floor(r() * 15);
      const y = Math.floor(r() * 15);
      t.rect(x, y, r() > 0.5 ? 2 : 1, 1, r() > 0.4 ? dark : light);
    }
    if (st.top === 'moss' && seed % 2) t.line(3, 0, 7, 9, dark).line(7, 9, 6, 15, dark);
  }
  if (left) t.rect(0, 0, 1, 16, OUTLINE);
  if (right) t.rect(15, 0, 1, 16, OUTLINE);
  return t;
}

function topTile(st: TileStyle, seed: number, left: boolean, right: boolean): Img {
  const t = bodyTile(st, seed, left, right);
  const [base, light, dark] = st.topC;
  const r = rng(seed + 99);
  if (st.top === 'grass' || st.top === 'moss') {
    for (let x = 0; x < 16; x++) {
      const depth = (st.top === 'moss' ? 5 : 4) + Math.floor(r() * 3);
      t.rect(x, 0, 1, depth, base);
      t.set(x, depth, dark);
    }
    t.rect(0, 1, 16, 1, light);
    for (let k = 0; k < 4; k++) t.set(Math.floor(r() * 16), 2 + Math.floor(r() * 2), light);
  } else if (st.top === 'cobble') {
    t.rect(0, 0, 16, 6, dark);
    for (const [x, y, w] of [
      [0, 1, 4],
      [5, 1, 5],
      [11, 1, 5],
      [2, 4, 5],
      [8, 4, 4],
      [13, 4, 3],
    ])
      t.rect(x, y, w, 2, base).rect(x, y, w, 1, light);
  } else if (st.top === 'sand') {
    for (let x = 0; x < 16; x++) {
      const depth = 4 + Math.round(Math.sin((x + seed) * 0.7));
      t.rect(x, 0, 1, depth, base);
    }
    t.rect(0, 1, 16, 1, light);
    for (let k = 0; k < 5; k++) t.set(Math.floor(r() * 16), 2 + Math.floor(r() * 3), dark);
  } else if (st.top === 'castle') {
    t.rect(0, 0, 16, 4, base);
    t.rect(0, 1, 16, 1, light);
    t.rect(0, 4, 16, 1, dark);
    t.rect(7, 1, 1, 3, dark);
  } else {
    // terra batida com pedaços de papel
    t.rect(0, 0, 16, 4, base);
    t.rect(0, 1, 16, 1, light);
    t.rect(0, 4, 16, 1, dark);
    for (let k = 0; k < 3; k++) {
      const x = Math.floor(r() * 13);
      t.rect(x, 1 + Math.floor(r() * 2), 3, 2, r() > 0.5 ? hex('#efe8d8') : hex('#c9c2b0'));
    }
  }
  t.rect(0, 0, 16, 1, OUTLINE);
  if (left) t.rect(0, 0, 1, 16, OUTLINE);
  if (right) t.rect(15, 0, 1, 16, OUTLINE);
  return t;
}

/** Teto de corredor: corpo com a borda de baixo marcada. */
function ceilingTile(st: TileStyle, seed: number, left: boolean, right: boolean): Img {
  const t = bodyTile(st, seed, left, right);
  t.rect(0, 13, 16, 2, st.bodyC[2]);
  t.rect(0, 15, 16, 1, OUTLINE);
  return t;
}

function plankTile(st: TileStyle, left: boolean, right: boolean): Img {
  const t = new Img(16, 16);
  const styles: Record<PlankStyle, Tone3> = {
    wood: [WOOD, WOOD_LIGHT, WOOD_DARK],
    white: tone('#e8e4d8', '#ffffff', '#a8a294'),
    stone: tone('#8a8a92', '#b4b4bc', '#5a5a62'),
    glass: [hex('#9fe0ff', 200), hex('#e8faff', 220), hex('#5aa8d0', 220)],
    log: tone('#7a4a28', '#9a6438', '#55331c'),
    deck: tone('#5a3a22', '#74502f', '#3a2414'),
    board: tone('#7a6a5a', '#968676', '#55483c'),
  };
  const [base, light, dark] = styles[st.plank];
  t.rect(0, 1, 16, 6, base);
  t.rect(0, 1, 16, 1, light);
  t.rect(0, 6, 16, 1, dark);
  if (st.plank === 'glass') {
    t.set(3, 3, light).set(4, 2, light).set(11, 4, light);
  } else if (st.plank === 'stone') {
    t.rect(7, 1, 1, 6, dark);
  } else if (st.plank === 'log') {
    t.rect(0, 3, 16, 1, dark);
  } else {
    t.set(4, 3, dark).set(11, 4, dark);
    if (st.plank === 'board') t.line(8, 2, 10, 5, dark);
  }
  t.rect(0, 0, 16, 1, OUTLINE);
  t.rect(0, 7, 16, 1, OUTLINE);
  if (left) {
    t.rect(0, 0, 1, 8, OUTLINE);
    if (st.plank !== 'glass') t.rect(2, 8, 2, 3, dark);
  }
  if (right) {
    t.rect(15, 0, 1, 8, OUTLINE);
    if (st.plank !== 'glass') t.rect(12, 8, 2, 3, dark);
  }
  return t;
}

function decorTile(kind: DecorKind): Img {
  const t = new Img(16, 16);
  const G = GRASS;
  const GD = GRASS_DARK;
  switch (kind) {
    case 'bush':
      t.ellipse(5, 12, 4, 4, GD).ellipse(10, 11, 5, 5, G).ellipse(9, 9, 2, 2, GRASS_LIGHT);
      break;
    case 'flowers':
      for (const [x, c] of [
        [3, RED],
        [8, GOLD],
        [12, WHITE],
      ] as [number, RGBA][]) {
        t.rect(x, 11, 1, 5, GD).rect(x - 1, 10, 3, 1, c).rect(x, 9, 1, 3, c).set(x, 10, GOLD);
      }
      return t;
    case 'tuft':
      for (const x of [4, 6, 9, 11]) t.line(x, 15, x + (x % 3) - 1, 10 + (x % 4), GD);
      t.line(7, 15, 7, 9, G);
      return t;
    case 'lamp':
      t.rect(7, 4, 2, 12, hex('#3a3a44')).rect(5, 1, 6, 4, hex('#3a3a44')).rect(6, 2, 4, 2, hex('#ffe08a'));
      break;
    case 'bench':
      t.rect(2, 10, 12, 2, WOOD).rect(2, 7, 12, 2, WOOD).rect(3, 12, 1, 4, hex('#3a3a44')).rect(12, 12, 1, 4, hex('#3a3a44'));
      break;
    case 'vase':
      t.poly([[5, 9], [11, 9], [10, 15], [6, 15]], hex('#b5542c')).ellipse(8, 7, 4, 3, G);
      break;
    case 'fence':
      for (const x of [2, 7, 12]) t.rect(x, 8, 2, 8, WOOD);
      t.rect(1, 10, 14, 1, WOOD_DARK).rect(1, 13, 14, 1, WOOD_DARK);
      break;
    case 'barrel':
      t.rect(4, 7, 8, 9, WOOD).rect(4, 9, 8, 1, STEEL_DARK).rect(4, 13, 8, 1, STEEL_DARK);
      break;
    case 'shell':
      t.ellipse(8, 13, 4, 3, hex('#ffd0c0')).line(8, 10, 8, 15, hex('#e09a88')).line(6, 11, 7, 15, hex('#e09a88'));
      break;
    case 'crate':
      t.rect(3, 6, 10, 10, WOOD).rect(3, 6, 10, 1, WOOD_LIGHT).line(3, 6, 12, 15, WOOD_DARK);
      break;
    case 'rope':
      t.ellipse(8, 13, 6, 3, hex('#c9a46a')).ellipse(8, 13, 3, 1.5, hex('#8a6a3a'));
      break;
    case 'whitefence':
      for (const x of [2, 7, 12]) t.poly([[x, 7], [x + 1, 5], [x + 2, 7], [x + 2, 16], [x, 16]], hex('#f2efe6'));
      t.rect(1, 10, 14, 1, hex('#c9c4b6')).rect(1, 13, 14, 1, hex('#c9c4b6'));
      break;
    case 'mailbox':
      t.rect(7, 9, 2, 7, WOOD).rect(4, 4, 8, 5, hex('#3f6fb5')).rect(11, 3, 1, 3, RED);
      break;
    case 'mushroom':
      t.rect(7, 10, 3, 6, hex('#f2e6c4')).ellipse(8.5, 9, 5, 3, RED).set(6, 8, WHITE).set(10, 9, WHITE);
      break;
    case 'fern':
      for (const [dx, dy] of [[-5, -5], [-4, -7], [0, -9], [4, -7], [5, -5]]) t.line(8, 15, 8 + dx, 15 + dy, GD);
      break;
    case 'stump':
      t.rect(4, 10, 8, 6, hex('#6e4426')).ellipse(8, 10, 4, 2, hex('#b8844e')).ellipse(8, 10, 2, 1, hex('#8a5a32'));
      break;
    case 'palm':
      t.line(8, 15, 7, 8, hex('#8a6a3a'), 2);
      for (const [dx, dy] of [[-5, 2], [-4, -2], [4, -2], [5, 2]]) t.line(7, 7, 7 + dx, 7 + dy, G, 2);
      break;
    case 'chest':
      t.rect(3, 8, 10, 8, hex('#7a4a28')).rect(3, 8, 10, 2, hex('#5a3a22')).rect(7, 10, 2, 2, GOLD);
      break;
    case 'anchor':
      t.rect(7, 4, 2, 10, STEEL_DARK).rect(5, 5, 6, 1, STEEL_DARK).poly([[3, 11], [8, 15], [13, 11], [11, 11], [8, 13], [5, 11]], STEEL_DARK);
      break;
    case 'torch':
      t.rect(7, 7, 2, 9, WOOD_DARK).ellipse(8, 5, 2.5, 3.5, hex('#ff9a3a')).ellipse(8, 6, 1.2, 1.8, hex('#ffe08a'));
      break;
    case 'banner':
      t.rect(4, 2, 1, 14, WOOD_DARK).poly([[5, 3], [12, 3], [12, 11], [8.5, 9], [5, 11]], hex('#5a2a6e')).rect(7, 5, 3, 2, GOLD);
      break;
    case 'urn':
      t.poly([[5, 8], [11, 8], [12, 12], [10, 15], [6, 15], [4, 12]], hex('#5a6a90')).rect(6, 6, 4, 2, hex('#7a8ab0'));
      break;
    case 'can':
      t.rect(4, 10, 5, 6, STEEL).rect(4, 10, 5, 1, WHITE).rect(10, 12, 4, 4, hex('#b5413a'));
      break;
    case 'papers':
      t.rect(2, 13, 12, 3, hex('#efe8d8')).rect(4, 11, 9, 2, hex('#d8d0bc')).rect(6, 9, 6, 2, hex('#efe8d8'));
      break;
  }
  t.outline(OUTLINE);
  return t;
}

function flipped(img: Img): Img {
  const out = new Img(img.w, img.h);
  for (let y = 0; y < img.h; y++)
    for (let x = 0; x < img.w; x++) {
      const k = (y * img.w + x) * 4;
      if (img.data[k + 3]) out.set(img.w - 1 - x, y, [img.data[k], img.data[k + 1], img.data[k + 2], img.data[k + 3]]);
    }
  return out;
}

function genTileset(name: string, st: TileStyle) {
  const decor = st.decor.map(decorTile);
  const tiles = [
    topTile(st, 1, false, false),
    topTile(st, 2, true, false),
    topTile(st, 3, false, true),
    topTile(st, 4, true, true),
    plankTile(st, true, false),
    plankTile(st, false, false),
    plankTile(st, false, true),
    bodyTile(st, 5, false, false),
    bodyTile(st, 6, true, false),
    bodyTile(st, 7, false, true),
    bodyTile(st, 8, true, true),
    ...decor,
    ceilingTile(st, 9, true, false),
    ceilingTile(st, 10, false, false),
    ceilingTile(st, 11, false, true),
    ceilingTile(st, 12, true, true),
    ...decor.map(flipped),
  ];
  // tiles extrudados (margem 1, espaçamento 2, bordas duplicadas): com zoom de câmera
  // fracionário, a borda de um tile não amostra o vizinho e não aparecem linhas no chão
  const step = 16 + TILE_SPACING;
  const rows = 3;
  const out = new Img(TILE_MARGIN * 2 + 7 * 16 + 6 * TILE_SPACING, TILE_MARGIN * 2 + rows * 16 + (rows - 1) * TILE_SPACING);
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
  save(name, out);
}

function genTiles() {
  genTileset('tiles.png', TILE_STYLES.padrao);
  for (const [scenery, st] of Object.entries(TILE_STYLES)) if (scenery !== 'padrao') genTileset(`tiles-${scenery}.png`, st);
}

// ---------- obstáculos da emenda H5 ----------

function genObstacles() {
  // plataforma que cai: tábua rachada, com pregos frouxos
  const fall = new Img(48, 16);
  fall.rect(1, 1, 46, 8, WOOD).rect(1, 1, 46, 1, WOOD_LIGHT).rect(1, 8, 46, 1, WOOD_DARK);
  fall.line(14, 2, 18, 8, WOOD_DARK).line(30, 2, 27, 8, WOOD_DARK);
  for (const x of [5, 42]) fall.rect(x, 3, 2, 2, STEEL_DARK);
  fall.outline(OUTLINE);
  save('falling.png', fall);

  // mola: solta e comprimida
  const spring = (compressed: boolean) => {
    const s = new Img(16, 16);
    const top = compressed ? 10 : 4;
    s.rect(2, 14, 12, 2, STEEL_DARK);
    for (let y = top + 2; y < 14; y += 2) s.rect(4, y, 8, 1, STEEL);
    s.rect(1, top, 14, 2, RED).rect(1, top, 14, 1, hex('#ff8a7a'));
    s.outline(OUTLINE);
    return s;
  };
  save('spring.png', sheet([spring(false), spring(true)]));

  // espinho móvel: escondido, pontas aparecendo, em pé
  const trap = (height: number) => {
    const s = new Img(16, 16);
    s.rect(0, 13, 16, 3, STEEL_DARK);
    for (let i = 0; i < 4; i++) s.rect(i * 4 + 1, 14, 2, 1, OUTLINE);
    if (height > 0)
      for (const x of [0, 5, 10])
        s.poly(
          [
            [x + 0.5, 13],
            [x + 3, 13 - height],
            [x + 5.5, 13],
          ],
          STEEL,
        );
    s.outline(OUTLINE);
    return s;
  };
  save('spiketrap.png', sheet([trap(0), trap(3), trap(8)]));
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

// ---------- logo "READERUN" e estante do menu inicial (spec 004) ----------
// Letras próprias numa grade 5×7 (diagonais do R e do N como traços contínuos), com o degradê da raposa, numa placa de madeira;
// as orelhas da raposa espiam por cima da placa e a cauda sai pela lateral.

const LOGO_GLYPHS: Record<string, string[]> = {
  R: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  N: ['10001', '10001', '10001', '10001', '10001', '10001', '10001'],
};

const SHELF_WOOD = hex('#5a3820');
const SHELF_WOOD_LIGHT = hex('#7a4c2a');
const SHELF_WOOD_DARK = hex('#3b2414');
const SHELF_BACK = hex('#2a170c');
const SHELF_BACK_LINE = hex('#331d10');

/** Placa de madeira com moldura e pregos. */
function woodPlaque(img: Img, x: number, y: number, w: number, h: number) {
  img.rect(x, y, w, h, SHELF_WOOD_DARK);
  img.rect(x + 2, y + 2, w - 4, h - 4, SHELF_WOOD);
  img.rect(x + 2, y + 2, w - 4, 1, SHELF_WOOD_LIGHT);
  // veios
  const r = rng(77);
  for (let k = 0; k < 9; k++) {
    const vy = y + 5 + Math.floor(r() * (h - 10));
    const vx = x + 6 + Math.floor(r() * (w - 40));
    img.rect(vx, vy, 10 + Math.floor(r() * 24), 1, SHELF_WOOD_DARK);
  }
  for (const [px, py] of [
    [x + 4, y + 4],
    [x + w - 6, y + 4],
    [x + 4, y + h - 6],
    [x + w - 6, y + h - 6],
  ])
    img.rect(px, py, 2, 2, STEEL_DARK);
}

function genLogo() {
  const word = 'READERUN';
  const B = 6;
  const GAP = 6;
  const letterW = 5 * B;
  const wordW = word.length * (letterW + GAP) - GAP;
  const PLAQUE_PAD_X = 12;
  const PLAQUE_PAD_Y = 10;
  const earsH = 27;
  const plaqueX = 4;
  const plaqueY = earsH;
  const plaqueW = wordW + PLAQUE_PAD_X * 2;
  const plaqueH = 7 * B + PLAQUE_PAD_Y * 2;
  const W = plaqueX + plaqueW + 26; // espaço para a cauda
  const H = plaqueY + plaqueH + 4;
  const img = new Img(W, H);
  const left = plaqueX + PLAQUE_PAD_X;
  const top = plaqueY + PLAQUE_PAD_Y;

  // orelhas atrás da placa (a raposa espiando por cima)
  const rx = left;
  img.poly(
    [
      [rx - 2, plaqueY + 6],
      [rx + 5, plaqueY - 25],
      [rx + 15, plaqueY + 6],
    ],
    FOX_SHADE,
  );
  img.poly(
    [
      [rx + 10, plaqueY + 6],
      [rx + 19, plaqueY - 27],
      [rx + 30, plaqueY + 6],
    ],
    FOX_ORANGE,
  );
  img.poly(
    [
      [rx + 15, plaqueY + 4],
      [rx + 19, plaqueY - 18],
      [rx + 25, plaqueY + 4],
    ],
    FOX_WHITE,
  );

  // cauda saindo pela lateral direita da placa
  const base: Pt = [plaqueX + plaqueW - 4, plaqueY + plaqueH - 12];
  const ctrl: Pt = [plaqueX + plaqueW + 22, plaqueY + plaqueH - 6];
  const tip: Pt = [plaqueX + plaqueW + 16, plaqueY + 6];
  for (const pass of ['shade', 'main'] as const) {
    for (let t = 0; t <= 1.0001; t += 0.02) {
      const [x, y] = bezier(base, ctrl, tip, t);
      const r = 2 + 4.2 * Math.sin(Math.PI * Math.min(1, t * 1.05));
      const white = t > 0.7;
      if (pass === 'shade') img.ellipse(x + 1, y + 1, r, r, white ? FOX_WHITE_SHADE : FOX_SHADE);
      else img.ellipse(x, y, r, r * 0.92, white ? FOX_WHITE : FOX_ORANGE);
    }
  }

  woodPlaque(img, plaqueX, plaqueY, plaqueW, plaqueH);

  // letras: primeiro a forma (uma cor só), depois o degradê suave por altura e o brilho só no topo
  const letters = new Img(W, H);
  const FILL = FOX_ORANGE;
  [...word].forEach((ch, i) => {
    const gx = left + i * (letterW + GAP);
    const glyph = LOGO_GLYPHS[ch];
    glyph.forEach((line, row) =>
      [...line].forEach((cell, col) => {
        if (cell === '1') letters.rect(gx + col * B, top + row * B, B, B, FILL);
      }),
    );
    // traços diagonais contínuos (perna do R, diagonal do N), com a mesma espessura dos blocos
    const stroke = (x0: number, y0: number, x1: number, y1: number) =>
      letters.poly(
        [
          [gx + x0 * B, top + y0 * B],
          [gx + (x0 + 1) * B, top + y0 * B],
          [gx + (x1 + 1) * B, top + y1 * B],
          [gx + x1 * B, top + y1 * B],
        ],
        FILL,
      );
    if (ch === 'R') stroke(2, 3.5, 4, 7);
    if (ch === 'N') stroke(0.8, 0, 3.2, 7);
  });
  // degradê em 5 tons (claro em cima, sombra embaixo), com pontilhado na troca de tom
  const tones = ['#ffd36a', '#ffc04a', '#f7a21b', '#e2861c', '#c45a14'].map((c) => hex(c));
  const letterH = 7 * B;
  for (let y = top; y < top + letterH; y++)
    for (let x = 0; x < W; x++) {
      if (!letters.alpha(x, y)) continue;
      const f = ((y - top) / letterH) * tones.length;
      let band = Math.floor(f);
      if (f - band > 0.7 && (x + y) % 2 === 0) band++;
      const c = tones[Math.min(tones.length - 1, band)];
      // brilho só na primeira linha de cima de cada letra (sem filetes no meio)
      letters.set(x, y, y === top ? hex('#ffe08a') : c);
    }
  // contorno duplo nas letras, para destacar sobre a madeira
  letters.outline(OUTLINE);
  letters.outline(hex('#1d1530'));
  img.blit(letters, 0, 0);
  img.outline(OUTLINE);
  save('logo.png', img);
}

/** Fundo do menu inicial: estante com lombadas coloridas nas laterais e o centro livre. */
function genShelfBg() {
  const W = 630;
  const H = 270;
  const img = new Img(W, H);
  img.rect(0, 0, W, H, SHELF_BACK);
  for (let x = 0; x < W; x += 30) img.rect(x, 0, 1, H, SHELF_BACK_LINE);

  const boards = [66, 132, 198, 258]; // topo de cada prateleira
  const r = rng(2026);
  const colors = ['#b5413a', '#d98a3a', '#e8c170', '#5f9e6e', '#3f7fb5', '#7a5aa6', '#c25a8a', '#3a8a8a', '#a8b85a', '#e6e0cc'].map((c) =>
    hex(c),
  );
  const center = W / 2;
  // zonas com livros: laterais; o centro fica livre para a placa e os botões
  const zones: [number, number][] = [
    [10, center - 150],
    [center + 150, W - 10],
  ];
  boards.forEach((boardY, shelf) => {
    const prevY = shelf === 0 ? 0 : boards[shelf - 1] + 8;
    for (const [z0, z1] of zones) {
      let x = z0;
      while (x < z1 - 6) {
        if (r() < 0.12) {
          x += 6 + Math.floor(r() * 10); // vão entre livros
          continue;
        }
        const bw = 6 + Math.floor(r() * 8);
        if (x + bw > z1) break;
        const bh = Math.min(boardY - prevY - 6, 26 + Math.floor(r() * 22));
        const c = colors[Math.floor(r() * colors.length)];
        const dark: RGBA = [Math.round(c[0] * 0.7), Math.round(c[1] * 0.7), Math.round(c[2] * 0.7), 255];
        img.rect(x, boardY - bh, bw, bh, c);
        img.rect(x + bw - 2, boardY - bh + 1, 1, bh - 1, dark);
        // faixas da lombada
        const band = boardY - bh + 4 + Math.floor(r() * 6);
        img.rect(x + 1, band, bw - 3, 2, dark);
        if (r() < 0.5) img.rect(x + 1, band + 5, bw - 3, 1, hex('#f2e6c4'));
        x += bw + 1;
      }
    }
    // prateleira
    img.rect(0, boardY, W, 8, SHELF_WOOD);
    img.rect(0, boardY, W, 1, SHELF_WOOD_LIGHT);
    img.rect(0, boardY + 7, W, 1, SHELF_WOOD_DARK);
  });
  // laterais do móvel
  for (const x of [0, W - 8]) {
    img.rect(x, 0, 8, H, SHELF_WOOD);
    img.rect(x + (x === 0 ? 7 : 0), 0, 1, H, SHELF_WOOD_DARK);
  }
  save('shelf.png', img);
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
genObstacles();
const page = genPage();
genSpike();
genPlatform();
genCheckpoint();
genExit();
genHeart();
genUi();
genSpark();
genIcons(page);
genLogo();
genShelfBg();
