/**
 * Gera os mapas iniciais (formato JSON do Tiled) em public/maps/<livro>.json.
 *
 * A fase tem uma "seção" por página a coletar, então o comprimento é
 * proporcional ao tamanho do livro (ver src/data/pageRule.ts).
 *
 *   npm run gen:maps                 gera só os mapas que ainda não existem
 *   npm run gen:maps -- --force      sobrescreve todos (apaga edições feitas no Tiled!)
 *   npm run gen:maps -- alice        (re)gera só o mapa desse livro
 *
 * Os limites de pulo abaixo seguem a física de src/config.ts:
 * pulo máximo ~4 tiles de altura e ~5 de distância.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gamePagesFor } from '../src/data/pageRule.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const T = 16;
const H = 17; // altura do mapa em tiles

type Book = { id: string; title: string; bookPages: number; map: string };
type Prop = { name: string; type: string; value: string | number };
type Obj = { type: string; x: number; y: number; width: number; height: number; properties?: Prop[] };

const GRASS = { mid: 1, left: 2, right: 3, single: 4 };
const DIRT = { mid: 8, left: 9, right: 10, single: 11 };
const PLANK = { left: 5, mid: 6, right: 7 };
const DECOR = [12, 13, 14];

function hash(s: string) {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

function makeRng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generate(book: Book) {
  const rnd = makeRng(hash(book.id));
  const int = (a: number, b: number) => a + Math.floor(rnd() * (b - a + 1));
  const pages = gamePagesFor(book.bookPages);

  const cols: number[] = []; // altura do chão por coluna (0 = buraco)
  const planks: { x: number; row: number; w: number }[] = [];
  const objs: Obj[] = [];
  const noDecor = new Set<number>();
  let h = 4;

  const top = (hh = h) => H - hh;
  const flat = (n: number) => {
    for (let i = 0; i < n; i++) cols.push(h);
  };
  const gap = (n: number) => {
    for (let i = 0; i < n; i++) cols.push(0);
  };
  const obj = (type: string, tx: number, ty: number, tw = 1, th = 1, properties?: Prop[]) => {
    objs.push({ type, x: tx * T, y: ty * T, width: tw * T, height: th * T, properties });
  };

  type Spot = [number, number] | null;
  // Cada desafio devolve um bom lugar para a página (ou null).
  const challenges: Record<string, { weight: (d: number) => number; run: (d: number) => Spot }> = {
    gap: {
      weight: () => 3,
      run: (d) => {
        flat(2);
        const w = int(2, d > 0.5 ? 4 : 3);
        const start = cols.length;
        gap(w);
        flat(3);
        return [start + Math.floor(w / 2), top() - 2];
      },
    },
    stepUp: {
      weight: () => (h <= 7 ? 2 : 0),
      run: () => {
        flat(2);
        h += int(1, 2);
        flat(4);
        return null;
      },
    },
    stepDown: {
      weight: () => (h >= 4 ? 2 : 0),
      run: () => {
        flat(2);
        h -= int(1, Math.min(3, h - 2));
        flat(3);
        return null;
      },
    },
    spikes: {
      weight: (d) => 2 + d * 2,
      run: (d) => {
        flat(3);
        const n = int(1, d > 0.4 ? 3 : 2);
        const start = cols.length;
        for (let i = 0; i < n; i++) {
          obj('spike', start + i, top() - 1);
          noDecor.add(start + i);
        }
        flat(n);
        flat(3);
        return [start + Math.floor(n / 2), top() - 3];
      },
    },
    floating: {
      weight: () => 2,
      run: () => {
        flat(2);
        const start = cols.length;
        flat(9);
        const r1 = top() - 3;
        planks.push({ x: start + 1, row: r1, w: 3 });
        const r2 = r1 - 3;
        if (r2 >= 3 && rnd() < 0.6) {
          planks.push({ x: start + 5, row: r2, w: 3 });
          return [start + 6, r2 - 1];
        }
        return [start + 2, r1 - 1];
      },
    },
    movingH: {
      weight: (d) => (d > 0.15 ? 2 : 0),
      run: () => {
        flat(2);
        const w = int(7, 9);
        const start = cols.length;
        gap(w);
        flat(3);
        obj('platform', start, top(), 3, 1, [
          { name: 'dx', type: 'int', value: (w - 3) * T },
          { name: 'dy', type: 'int', value: 0 },
          { name: 'speed', type: 'float', value: 45 },
        ]);
        return [start + Math.floor(w / 2), top() - 2];
      },
    },
    lift: {
      weight: (d) => (d > 0.3 && h <= 6 ? 1.5 : 0),
      run: () => {
        flat(2);
        const start = cols.length;
        const low = top();
        gap(3);
        h += 5;
        flat(5);
        obj('platform', start, low, 3, 1, [
          { name: 'dx', type: 'int', value: 0 },
          { name: 'dy', type: 'int', value: -5 * T },
          { name: 'speed', type: 'float', value: 35 },
        ]);
        return [start + 1, top() - 2];
      },
    },
  };

  const pick = (d: number) => {
    const entries = Object.values(challenges).map((c) => [c, c.weight(d)] as const);
    let r = rnd() * entries.reduce((a, [, w]) => a + w, 0);
    for (const [c, w] of entries) if ((r -= w) < 0) return c;
    return entries[0][0];
  };

  // início
  flat(8);
  obj('spawn', 2, top() - 2, 1, 2);
  for (let c = 0; c < 6; c++) noDecor.add(c);

  for (let s = 0; s < pages; s++) {
    const d = s / Math.max(1, pages - 1);
    if (s > 0 && s % 3 === 0) {
      flat(1);
      obj('checkpoint', cols.length, top() - 2, 1, 2);
      noDecor.add(cols.length);
      flat(3);
    }
    let spot: Spot = null;
    for (let tries = 0; tries < 3 && !spot; tries++) {
      const first = pick(d).run(d);
      const second = pick(d).run(d);
      spot = second ?? first;
    }
    if (!spot) {
      flat(2);
      spot = [cols.length, top() - 2];
      flat(3);
    }
    obj('page', spot[0], spot[1]);
  }

  // fim
  flat(4);
  const exitX = cols.length + 3;
  obj('exit', exitX, top() - 2, 2, 2);
  flat(10);
  for (let c = exitX - 1; c < cols.length; c++) noDecor.add(c);

  // ---- camadas de tiles ----
  const W = cols.length;
  const ground = new Array(W * H).fill(0);
  const platforms = new Array(W * H).fill(0);
  const decor = new Array(W * H).fill(0);
  const covers = (c: number, row: number) => c < 0 || c >= W || (cols[c] > 0 && row >= top(cols[c]));

  for (let c = 0; c < W; c++) {
    if (cols[c] === 0) continue;
    for (let row = top(cols[c]); row < H; row++) {
      const set = row === top(cols[c]) ? GRASS : DIRT;
      const l = !covers(c - 1, row);
      const r = !covers(c + 1, row);
      ground[row * W + c] = l && r ? set.single : l ? set.left : r ? set.right : set.mid;
    }
    const flatHere = cols[c - 1] === cols[c] && cols[c + 1] === cols[c];
    if (flatHere && !noDecor.has(c) && rnd() < 0.18) {
      decor[(top(cols[c]) - 1) * W + c] = DECOR[int(0, DECOR.length - 1)];
    }
  }
  for (const p of planks) {
    for (let i = 0; i < p.w; i++) {
      platforms[p.row * W + p.x + i] = i === 0 ? PLANK.left : i === p.w - 1 ? PLANK.right : PLANK.mid;
    }
  }

  const tileLayer = (id: number, name: string, data: number[]) => ({
    id,
    name,
    type: 'tilelayer',
    x: 0,
    y: 0,
    width: W,
    height: H,
    opacity: 1,
    visible: true,
    data,
  });

  return {
    pages,
    map: {
      type: 'map',
      version: '1.10',
      tiledversion: '1.11.2',
      orientation: 'orthogonal',
      renderorder: 'right-down',
      infinite: false,
      compressionlevel: -1,
      width: W,
      height: H,
      tilewidth: T,
      tileheight: T,
      nextlayerid: 5,
      nextobjectid: objs.length + 1,
      properties: [{ name: 'book', type: 'string', value: book.id }],
      layers: [
        tileLayer(1, 'decor', decor),
        tileLayer(2, 'ground', ground),
        tileLayer(3, 'platforms', platforms),
        {
          id: 4,
          name: 'objects',
          type: 'objectgroup',
          draworder: 'topdown',
          x: 0,
          y: 0,
          opacity: 1,
          visible: true,
          objects: objs.map((o, i) => ({
            id: i + 1,
            name: '',
            rotation: 0,
            visible: true,
            ...o,
          })),
        },
      ],
      tilesets: [
        {
          firstgid: 1,
          name: 'tiles',
          image: '../assets/tiles.png',
          imagewidth: 126,
          imageheight: 36,
          columns: 7,
          tilecount: 14,
          tilewidth: T,
          tileheight: T,
          margin: 1,
          spacing: 2,
        },
      ],
    },
  };
}

const args = process.argv.slice(2);
const force = args.includes('--force');
const only = args.filter((a) => !a.startsWith('--'));
const books: Book[] = JSON.parse(readFileSync(join(ROOT, 'src/data/books.json'), 'utf8'));

for (const book of books) {
  if (only.length && !only.includes(book.id)) continue;
  const path = join(ROOT, 'public/maps', `${book.map}.json`);
  if (existsSync(path) && !force && !only.length) {
    console.log(`- ${book.map}.json já existe, mantido (use --force para sobrescrever)`);
    continue;
  }
  const { map, pages } = generate(book);
  writeFileSync(path, JSON.stringify(map));
  console.log(`✓ ${book.map}.json: ${book.bookPages} págs. no livro → ${pages} no jogo, ${map.width} tiles de largura`);
}
