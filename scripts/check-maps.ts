/**
 * Confere se cada mapa em public/maps bate com src/data/books.json:
 * o número de páginas é o esperado para o tamanho do livro e existem
 * o ponto de partida (spawn) e a saída (exit). Roda antes de todo build,
 * para pegar erros de edições feitas no Tiled.
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gamePagesFor } from '../src/data/pageRule.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
type Book = { id: string; bookPages: number; map: string };
type TiledObj = { type?: string; class?: string; name?: string };

const books: Book[] = JSON.parse(readFileSync(join(ROOT, 'src/data/books.json'), 'utf8'));
let errors = 0;

for (const book of books) {
  const path = join(ROOT, 'public/maps', `${book.map}.json`);
  const fail = (msg: string) => {
    console.error(`✗ ${book.map}.json: ${msg}`);
    errors++;
  };
  if (!existsSync(path)) {
    fail('arquivo não encontrado (rode `npm run gen:maps`)');
    continue;
  }
  const map = JSON.parse(readFileSync(path, 'utf8'));
  const layer = map.layers.find((l: { name: string }) => l.name === 'objects');
  if (!layer) {
    fail('camada de objetos "objects" não encontrada');
    continue;
  }
  const kinds = (layer.objects as TiledObj[]).map((o) => o.type || o.class || o.name);
  const count = (k: string) => kinds.filter((t) => t === k).length;
  const expected = gamePagesFor(book.bookPages);
  const before = errors;
  if (count('page') !== expected)
    fail(`tem ${count('page')} páginas, mas o livro (${book.bookPages} págs.) pede ${expected}`);
  if (count('spawn') !== 1) fail(`precisa de exatamente 1 "spawn" (tem ${count('spawn')})`);
  if (count('exit') !== 1) fail(`precisa de exatamente 1 "exit" (tem ${count('exit')})`);
  for (const name of ['ground', 'platforms', 'decor'])
    if (!map.layers.some((l: { name: string }) => l.name === name)) fail(`camada de tiles "${name}" não encontrada`);
  if (errors === before) console.log(`✓ ${book.map}.json: ${expected} páginas`);
}

if (errors) process.exit(1);
