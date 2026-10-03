/**
 * Confere que toda fase é completável (spec 004, emenda H5, CS-007): a saída é
 * alcançável a partir do início, toda página é alcançável e, de cada página,
 * ainda dá para chegar à saída. Roda no build depois do check-maps.
 *
 * Não simula a física: monta as células onde a raposa fica de pé (chão, tábuas,
 * percurso das plataformas móveis, plataformas que caem) e liga as células pelas
 * regras de salto de src/config.ts (sobe ~3 tiles, ~8 com mola; alcance de ~5),
 * respeitando paredes e tetos. Vale também para mapas editados no Tiled.
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const T = 16;

type Book = { id: string; map: string };
type TiledObj = { type?: string; class?: string; name?: string; x: number; y: number; width: number; height: number; properties?: { name: string; value: number }[] };
type Layer = { name: string; data?: number[]; objects?: TiledObj[] };

const MAX_UP = 3;
const MAX_UP_SPRING = 8;

/** Alcance horizontal por altura subida (positiva) ou descida (negativa). */
function reach(up: number) {
  if (up <= 0) return 5 + Math.floor(Math.min(-up, 6) / 2);
  if (up === 1) return 5;
  if (up === 2) return 4;
  return 3;
}

function checkMap(book: Book): string[] {
  const path = join(ROOT, 'public/maps', `${book.map}.json`);
  if (!existsSync(path)) return ['arquivo não encontrado'];
  const map = JSON.parse(readFileSync(path, 'utf8'));
  const W: number = map.width;
  const H: number = map.height;
  const layer = (name: string) => (map.layers as Layer[]).find((l) => l.name === name);
  const ground = layer('ground')?.data ?? [];
  const planks = layer('platforms')?.data ?? [];
  const objects = (layer('objects')?.objects ?? []).map((o) => ({ ...o, kind: o.type || o.class || o.name || '' }));
  const prop = (o: TiledObj, name: string) => Number(o.properties?.find((p) => p.name === name)?.value ?? 0);

  const solid = (c: number, r: number) => {
    if (c < 0 || c >= W) return true; // limites laterais do mundo
    if (r < 0 || r >= H) return false;
    return ground[r * W + c] > 0;
  };
  const oneway = (c: number, r: number) => r >= 0 && r < H && c >= 0 && c < W && planks[r * W + c] > 0;
  const key = (c: number, r: number) => r * W + c;
  const tile = (o: TiledObj) => [Math.round(o.x / T), Math.round(o.y / T)] as const;

  const spikes = new Set<number>();
  const springs = new Set<number>();
  for (const o of objects) {
    const [c, r] = tile(o);
    if (o.kind === 'spike') spikes.add(key(c, r));
    if (o.kind === 'spring') springs.add(key(c, r));
  }

  // superfícies de plataformas (móveis e que caem): cada uma vira um grupo ligado entre si
  const groups: number[][] = [];
  const onPlatform = new Set<number>();
  for (const o of objects) {
    if (o.kind !== 'platform' && o.kind !== 'falling') continue;
    const [pc, pr] = tile(o);
    const dx = o.kind === 'platform' ? Math.round(prop(o, 'dx') / T) : 0;
    const dy = o.kind === 'platform' ? Math.round(prop(o, 'dy') / T) : 0;
    const cells: number[] = [];
    const [c0, c1] = [Math.min(pc, pc + dx), Math.max(pc, pc + dx) + 2];
    const [r0, r1] = [Math.min(pr, pr + dy) - 1, Math.max(pr, pr + dy) - 1];
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) if (r >= 0 && !solid(c, r)) cells.push(key(c, r));
    groups.push(cells);
    for (const k of cells) onPlatform.add(k);
  }

  const standable = (c: number, r: number) => {
    if (c < 0 || c >= W || r < 0 || r >= H) return false;
    if (solid(c, r) || solid(c, r - 1) || spikes.has(key(c, r))) return false;
    return solid(c, r + 1) || oneway(c, r + 1) || onPlatform.has(key(c, r));
  };
  const clear = (c: number, rTop: number, rBottom: number) => {
    for (let r = Math.min(rTop, rBottom); r <= Math.max(rTop, rBottom); r++) if (solid(c, r)) return false;
    return true;
  };

  const nodes: [number, number][] = [];
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) if (standable(c, r)) nodes.push([c, r]);
  const isNode = new Set(nodes.map(([c, r]) => key(c, r)));

  // pode ir da célula A (c1, r1) até B (c2, r2) com um salto ou uma queda?
  const move = (c1: number, r1: number, c2: number, r2: number) => {
    const up = r1 - r2;
    const maxUp = springs.has(key(c1, r1)) ? MAX_UP_SPRING : MAX_UP;
    if (up > maxUp || Math.abs(c2 - c1) > reach(up)) return false;
    const step = Math.sign(c2 - c1);
    if (up > 0) {
      // sobe na coluna de saída e atravessa na altura de chegada
      if (!clear(c1, r2 - 1, r1)) return false;
      for (let c = c1 + step; c !== c2 + step && step !== 0; c += step) if (!clear(c, r2 - 1, r2)) return false;
    } else {
      // atravessa na altura de saída e cai na coluna de chegada
      for (let c = c1 + step; c !== c2 + step && step !== 0; c += step) if (!clear(c, r1 - 1, r1)) return false;
      if (!clear(c2, r1, r2)) return false;
    }
    return true;
  };

  const edges = new Map<number, number[]>();
  const addEdge = (a: number, b: number) => {
    if (a === b) return;
    const list = edges.get(a) ?? [];
    list.push(b);
    edges.set(a, list);
  };
  const byCol = new Map<number, number[]>();
  for (const [c, r] of nodes) byCol.set(c, [...(byCol.get(c) ?? []), r]);
  for (const [c1, r1] of nodes)
    for (let dc = -8; dc <= 8; dc++)
      for (const r2 of byCol.get(c1 + dc) ?? []) if (move(c1, r1, c1 + dc, r2)) addEdge(key(c1, r1), key(c1 + dc, r2));
  // andar sobre a plataforma: todas as células do percurso se ligam
  for (const cells of groups) for (const a of cells) if (isNode.has(a)) for (const b of cells) if (isNode.has(b)) addEdge(a, b);

  const bfs = (starts: number[], graph: Map<number, number[]>) => {
    const seen = new Set(starts);
    const queue = [...starts];
    while (queue.length) for (const n of graph.get(queue.shift()!) ?? []) if (!seen.has(n)) seen.add(n), queue.push(n);
    return seen;
  };
  const reverse = new Map<number, number[]>();
  for (const [a, list] of edges) for (const b of list) reverse.set(b, [...(reverse.get(b) ?? []), a]);

  const errors: string[] = [];
  const spawn = objects.find((o) => o.kind === 'spawn');
  const exit = objects.find((o) => o.kind === 'exit');
  if (!spawn || !exit) return ['sem spawn ou exit'];
  const [sc, sr] = tile(spawn);
  const startCell = key(sc, sr + Math.round(spawn.height / T) - 1);
  if (!isNode.has(startCell)) return ['o início não está sobre chão'];
  const reached = bfs([startCell], edges);

  const [ec, er] = tile(exit);
  const exitCells = nodes.filter(([c, r]) => r === er + 1 && c >= ec - 1 && c <= ec + 2).map(([c, r]) => key(c, r));
  if (!exitCells.some((k) => reached.has(k))) errors.push(`saída em (${ec}, ${er}) inalcançável a partir do início`);
  const toExit = bfs(exitCells, reverse);

  objects
    .filter((o) => o.kind === 'page')
    .forEach((p, i) => {
      const [pc, pr] = tile(p);
      // células de onde a raposa encosta na página (de pé ou pulando até ~4 tiles, sem bater em teto)
      const touch = nodes
        .filter(([c, r]) => Math.abs(c - pc) <= 2 && r - pr >= 0 && r - pr <= 4 && clear(c, pr, r - 1))
        .map(([c, r]) => key(c, r));
      const ok = touch.filter((k) => reached.has(k));
      if (!ok.length) errors.push(`página ${i + 1} em (${pc}, ${pr}) inalcançável`);
      else if (!ok.some((k) => toExit.has(k))) errors.push(`página ${i + 1} em (${pc}, ${pr}) sem volta para a saída`);
    });
  return errors;
}

const books: Book[] = JSON.parse(readFileSync(join(ROOT, 'src/data/books.json'), 'utf8'));
let failed = 0;
for (const book of books) {
  const errors = checkMap(book);
  if (errors.length) {
    failed++;
    for (const e of errors) console.error(`✗ ${book.map}.json: ${e}`);
  } else console.log(`✓ ${book.map}.json: completável`);
}
if (failed) process.exit(1);
