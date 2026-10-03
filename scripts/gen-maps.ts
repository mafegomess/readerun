/**
 * Gera os mapas (formato JSON do Tiled) em public/maps/<livro>.json.
 *
 * A fase tem uma "seção" por página a coletar, então o comprimento é
 * proporcional ao tamanho do livro (ver src/data/pageRule.ts). Cada livro tem a
 * sua receita (`level` em books.json): o peso de cada desafio e de cada trecho
 * especial (spec 004, emenda H5). O cenário (`scenery`) escolhe o tileset.
 *
 *   npm run gen:maps                 gera só os mapas que ainda não existem
 *   npm run gen:maps -- --force      sobrescreve todos (apaga edições feitas no Tiled!)
 *   npm run gen:maps -- alice        (re)gera só o mapa desse livro
 *
 * Os limites de pulo seguem a física de src/config.ts: pulo de ~4 tiles de
 * altura e ~5 de distância; mola de ~8 tiles. scripts/check-levels.ts confere
 * no build que toda fase é completável.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gamePagesFor } from '../src/data/pageRule.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const T = 16;
const H = 17; // altura do mapa em tiles

type Weights = Record<string, number>;
type Book = { id: string; title: string; bookPages: number; map: string; scenery?: string; level?: { weights?: Weights; formats?: Weights } };
type Prop = { name: string; type: string; value: string | number };
type Obj = { type: string; x: number; y: number; width: number; height: number; properties?: Prop[] };

// índices do tileset 7×3 (mesmo layout em todos os cenários)
const TOP = { mid: 1, left: 2, right: 3, single: 4 };
const BODY = { mid: 8, left: 9, right: 10, single: 11 };
const CEIL = { left: 15, mid: 16, right: 17, single: 18 };
const PLANK = { left: 5, mid: 6, right: 7 };
const DECOR = [12, 13, 14, 19, 20, 21];

// receita de antes da emenda, para livros sem `level`
const DEFAULT_WEIGHTS: Weights = { gap: 3, stepUp: 2, stepDown: 2, spikes: 2, floating: 2, movingH: 2, lift: 1.5 };

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
  const weights = book.level?.weights ?? DEFAULT_WEIGHTS;
  const formats = book.level?.formats ?? {};

  const cols: number[] = []; // altura do chão por coluna (0 = buraco)
  const ceilings: { x: number; bottom: number }[] = []; // teto suspenso: linha de baixo do teto por coluna
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
  const moving = (tx: number, ty: number, dx: number, dy: number, speed: number) =>
    obj('platform', tx, ty, 3, 1, [
      { name: 'dx', type: 'int', value: dx },
      { name: 'dy', type: 'int', value: dy },
      { name: 'speed', type: 'float', value: speed },
    ]);

  type Spot = [number, number] | null;
  type Gate = (d: number) => boolean;
  // Cada desafio devolve um bom lugar para a página (ou null). `gate` liga o desafio
  // conforme o progresso da fase (d de 0 a 1) e a altura atual do chão.
  const challenges: Record<string, { gate: Gate; run: (d: number) => Spot }> = {
    gap: {
      gate: () => true,
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
      gate: () => h <= 7,
      run: () => {
        flat(2);
        h += int(1, 2);
        flat(4);
        return null;
      },
    },
    stepDown: {
      gate: () => h >= 4,
      run: () => {
        flat(2);
        h -= int(1, Math.min(3, h - 2));
        flat(3);
        return null;
      },
    },
    spikes: {
      gate: () => true,
      run: (d) => {
        flat(3);
        const n = int(1, d > 0.4 ? 3 : 2);
        const start = cols.length;
        for (let i = 0; i < n; i++) {
          obj('spike', start + i, top() - 1);
          noDecor.add(start + i);
        }
        flat(n + 3);
        return [start + Math.floor(n / 2), top() - 3];
      },
    },
    floating: {
      gate: () => top() - 3 >= 3,
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
      gate: (d) => d > 0.1,
      run: () => {
        flat(2);
        const w = int(7, 9);
        const start = cols.length;
        gap(w);
        flat(3);
        moving(start, top(), (w - 3) * T, 0, 45);
        return [start + Math.floor(w / 2), top() - 2];
      },
    },
    lift: {
      gate: (d) => d > 0.25 && h <= 6,
      run: () => {
        flat(2);
        const start = cols.length;
        const low = top();
        gap(3);
        h += 5;
        flat(5);
        moving(start, low, 0, -5 * T, 35);
        return [start + 1, top() - 2];
      },
    },
    falling: {
      // tábua que cai no meio de um buraco largo: pisar e pular logo
      gate: (d) => d > 0.1,
      run: () => {
        flat(2);
        const w = 7;
        const start = cols.length;
        gap(w);
        flat(3);
        obj('falling', start + 2, top(), 3, 1);
        return [start + 3, top() - 2];
      },
    },
    springWall: {
      // parede alta demais para o pulo: sobe pela mola
      gate: (d) => d > 0.2 && h <= 5,
      run: () => {
        flat(3);
        obj('spring', cols.length - 1, top() - 1);
        noDecor.add(cols.length - 1);
        h += int(5, 6);
        flat(5);
        return [cols.length - 3, top() - 2];
      },
    },
    spikeTrap: {
      gate: (d) => d > 0.15,
      run: () => {
        flat(3);
        const n = int(1, 2);
        const start = cols.length;
        for (let i = 0; i < n; i++) {
          obj('spikeTrap', start + i * 2, top() - 1, 1, 1, [
            { name: 'period', type: 'float', value: 2.4 },
            { name: 'offset', type: 'float', value: Math.round(i * 1.2 * 10) / 10 },
          ]);
          noDecor.add(start + i * 2);
        }
        flat(n * 2 + 3);
        return [start + n, top() - 3];
      },
    },
  };

  // Trechos especiais: sempre devolvem o lugar da página.
  const specials: Record<string, { gate: () => boolean; run: () => [number, number] }> = {
    ceiling: {
      // corredor com teto a 5 tiles do chão (o pulo vai a 4): só buracos curtos e espinhos dentro
      gate: () => top() - 6 >= 1,
      run: () => {
        flat(2);
        const start = cols.length;
        const len = int(10, 16);
        const mid = start + Math.floor(len / 2);
        for (let i = 0; i < len; i++) {
          const c = start + i;
          if (i === Math.floor(len / 2) - 1 || i === Math.floor(len / 2)) gap(1);
          else flat(1);
          ceilings.push({ x: c, bottom: top() - 6 });
          noDecor.add(c);
        }
        obj('spike', start + 2, top() - 1);
        flat(2);
        return [mid + 2, top() - 2];
      },
    },
    climb: {
      // tábuas em zigue-zague, um andar a cada 3 tiles; a página fica no topo
      gate: () => top() - 6 >= 3,
      run: () => {
        flat(2);
        const start = cols.length;
        flat(12);
        let row = top() - 3;
        let left = true;
        let last: [number, number] = [start + 2, row - 1];
        while (row >= 3) {
          const x = left ? start + 1 : start + 6;
          planks.push({ x, row, w: 4 });
          last = [x + 1, row - 1];
          left = !left;
          row -= 3;
        }
        return last;
      },
    },
    branch: {
      // rota alta por tábuas com uma página, voltando ao caminho principal mais à frente
      gate: () => top() - 6 >= 3,
      run: () => {
        flat(2);
        const start = cols.length;
        flat(16);
        const r1 = top() - 3;
        const r2 = r1 - 3;
        planks.push({ x: start + 1, row: r1, w: 3 });
        planks.push({ x: start + 5, row: r2, w: 3 });
        planks.push({ x: start + 10, row: r2, w: 3 });
        return [start + 11, r2 - 1];
      },
    },
  };

  const pickWeighted = <K extends string>(table: Record<K, { gate: (d: number) => boolean }>, w: Weights, d: number): K | null => {
    const entries = (Object.keys(table) as K[]).map((k) => [k, table[k].gate(d) ? (w[k] ?? 0) : 0] as const);
    const total = entries.reduce((a, [, v]) => a + v, 0);
    if (total <= 0) return null;
    let r = rnd() * total;
    for (const [k, v] of entries) if ((r -= v) < 0) return k;
    return null;
  };
  const runChallenge = (d: number): Spot => {
    const k = pickWeighted(challenges, weights, d) ?? 'gap';
    return challenges[k].run(d);
  };

  // início
  flat(8);
  obj('spawn', 2, top() - 2, 1, 2);
  for (let c = 0; c < 6; c++) noDecor.add(c);

  const formatSum = Object.values(formats).reduce((a, v) => a + v, 0);
  let sinceSpecial = 3;
  for (let s = 0; s < pages; s++) {
    const d = s / Math.max(1, pages - 1);
    if (s > 0 && s % 3 === 0) {
      flat(1);
      obj('checkpoint', cols.length, top() - 2, 1, 2);
      noDecor.add(cols.length);
      flat(3);
    }
    let spot: Spot = null;
    // no máximo 1 trecho especial a cada 3 seções, com chance pela soma dos pesos
    if (formatSum > 0 && sinceSpecial >= 2 && s > 0 && rnd() < Math.min(0.5, formatSum / 6)) {
      // elevadores e degraus deixam o chão alto, sem espaço para teto ou andares:
      // desce antes (descer é sempre alcançável)
      if (h > 6) {
        flat(2);
        h = int(4, 5);
        flat(3);
      }
      const k = pickWeighted(specials, formats, d);
      if (k) {
        spot = specials[k].run();
        sinceSpecial = 0;
      }
    }
    if (!spot) {
      sinceSpecial++;
      for (let tries = 0; tries < 3 && !spot; tries++) {
        const first = runChallenge(d);
        const second = runChallenge(d);
        spot = second ?? first;
      }
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
      const set = row === top(cols[c]) ? TOP : BODY;
      const l = !covers(c - 1, row);
      const r = !covers(c + 1, row);
      ground[row * W + c] = l && r ? set.single : l ? set.left : r ? set.right : set.mid;
    }
    const flatHere = cols[c - 1] === cols[c] && cols[c + 1] === cols[c];
    if (flatHere && !noDecor.has(c) && rnd() < 0.18) {
      decor[(top(cols[c]) - 1) * W + c] = DECOR[int(0, DECOR.length - 1)];
    }
  }
  // tetos: 3 linhas de corpo, com a linha de baixo marcada
  const ceilAt = new Map(ceilings.map((k) => [k.x, k.bottom]));
  for (const { x, bottom } of ceilings) {
    const l = ceilAt.get(x - 1) !== bottom;
    const r = ceilAt.get(x + 1) !== bottom;
    for (let row = Math.max(0, bottom - 2); row <= bottom; row++) {
      const set = row === bottom ? CEIL : BODY;
      ground[row * W + x] = l && r ? set.single : l ? set.left : r ? set.right : set.mid;
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
          image: book.scenery ? `../assets/tiles-${book.scenery}.png` : '../assets/tiles.png',
          imagewidth: 126,
          imageheight: 54,
          columns: 7,
          tilecount: 21,
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
  const objects = (map.layers[3] as { objects: Obj[] }).objects;
  const kinds = objects.reduce<Record<string, number>>((a, o) => ((a[o.type] = (a[o.type] ?? 0) + 1), a), {});
  const extras = ['platform', 'falling', 'spring', 'spikeTrap', 'spike'].map((k) => `${k} ${kinds[k] ?? 0}`).join(', ');
  console.log(`✓ ${book.map}.json: ${pages} páginas, ${map.width} tiles (${extras})`);
}
