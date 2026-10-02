/**
 * Gera toda a pixel art do jogo em public/assets/*.png, sem dependências externas.
 * Rode com `npm run gen:assets`. Os PNGs gerados são versionados, então só é
 * preciso rodar de novo ao alterar os desenhos aqui.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'assets');

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
const FOX = hex('#e8792b');
const FOX_DARK = hex('#b5531c');
const CREAM = hex('#fff3e0');
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

// ---------- raposa (32x32, olhando pra direita) ----------

type Pose = {
  bob: number; // deslocamento vertical do corpo
  legs: [number, number][]; // deslocamento [dx, dy] do pé de cada perna: traseira1, traseira2, dianteira1, dianteira2
  tail: number; // inclinação da cauda
  hurt?: boolean;
};

function fox(p: Pose): Img {
  const img = new Img(32, 32);
  const b = p.bob;
  const hips: [number, number][] = [
    [10, 23 + b],
    [12, 23 + b],
    [18, 23 + b],
    [20, 23 + b],
  ];
  // pernas de trás (mais escuras) primeiro, para ficarem atrás do corpo
  [1, 3, 0, 2].forEach((i) => {
    const [hx, hy] = hips[i];
    const [dx, dy] = p.legs[i];
    const fx = hx + dx;
    const fy = 29 + dy;
    const far = i === 1 || i === 3;
    img.line(hx, hy, fx, fy, far ? FOX_DARK : FOX, 2);
    img.rect(fx - 1 + (fx >= hx ? 0 : 0), fy + 1, 3, 1, OUTLINE);
  });
  // cauda
  const t = p.tail;
  img.poly(
    [
      [9, 20 + b],
      [3, 15 + b - t],
      [1, 11 + b - t],
      [5, 12 + b - t],
      [10, 17 + b],
    ],
    FOX,
  );
  img.ellipse(5, 16 + b - t, 4, 3, FOX);
  img.ellipse(2.5, 12.5 + b - t, 2.2, 2.2, CREAM);
  // corpo
  img.ellipse(15, 21 + b, 7.5, 4.5, FOX);
  img.ellipse(15, 23.5 + b, 5, 2, FOX_DARK);
  img.ellipse(20, 22 + b, 3, 3, CREAM);
  // cabeça
  const hy = 14 + b;
  img.poly(
    [
      [19, hy - 2],
      [20, hy - 8],
      [23, hy - 3],
    ],
    FOX,
  );
  img.poly(
    [
      [23, hy - 3],
      [26, hy - 8],
      [26, hy - 1],
    ],
    FOX,
  );
  img.set(21, hy - 5, FOX_DARK);
  img.set(25, hy - 5, FOX_DARK);
  img.ellipse(22.5, hy + 1, 4.5, 4, FOX);
  img.poly(
    [
      [24, hy],
      [30, hy + 2],
      [29, hy + 3.5],
      [23, hy + 4.5],
    ],
    FOX,
  );
  img.poly(
    [
      [22, hy + 2.5],
      [29, hy + 2.5],
      [28, hy + 4],
      [22, hy + 5],
    ],
    CREAM,
  );
  img.set(29, hy + 2, OUTLINE);
  img.set(30, hy + 2, OUTLINE);
  if (p.hurt) {
    img.set(23, hy - 1, OUTLINE);
    img.set(25, hy + 1, OUTLINE);
    img.set(25, hy - 1, OUTLINE);
    img.set(23, hy + 1, OUTLINE);
    img.set(24, hy, OUTLINE);
  } else {
    img.rect(24, hy - 1, 1, 2, OUTLINE);
  }
  img.outline(OUTLINE);
  return img;
}

const STAND: [number, number][] = [
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
];

function genFox() {
  const frames = [
    fox({ bob: 0, legs: STAND, tail: 0 }), // 0 idle
    fox({ bob: 1, legs: STAND.map(([x]) => [x, 0]) as [number, number][], tail: 1 }), // 1 idle respira
    fox({ bob: 0, legs: [[-3, 0], [-1, -1], [3, 0], [1, -1]], tail: 0 }), // 2 corrida
    fox({ bob: -1, legs: [[1, -2], [2, -1], [-1, -2], [-2, -1]], tail: 2 }), // 3
    fox({ bob: 0, legs: [[-1, -1], [-3, 0], [1, -1], [3, 0]], tail: 1 }), // 4
    fox({ bob: -1, legs: [[2, -1], [1, -2], [-2, -1], [-1, -2]], tail: 2 }), // 5
    fox({ bob: -1, legs: [[3, -3], [2, -3], [4, -3], [3, -2]], tail: -1 }), // 6 pulo
    fox({ bob: 0, legs: [[-3, 0], [-2, 0], [2, 0], [3, 0]], tail: 3 }), // 7 queda
    fox({ bob: 1, legs: [[-2, 0], [2, 0], [-2, 0], [2, 0]], tail: -2, hurt: true }), // 8 dano
  ];
  save('fox.png', sheet(frames));
}

// ---------- tileset (16x16, 7 colunas x 2 linhas) ----------
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
  const out = new Img(16 * 7, 32);
  tiles.forEach((t, i) => out.blit(t, (i % 7) * 16, Math.floor(i / 7) * 16));
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

console.log('Gerando assets em public/assets:');
genFox();
genTiles();
genPage();
genSpike();
genPlatform();
genCheckpoint();
genExit();
genHeart();
genUi();
genSpark();
