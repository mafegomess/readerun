import data from './books.json';
import { gamePagesFor } from './pageRule.ts';

export type Theme = {
  skyTop: string;
  skyBottom: string;
  hillsFar: string;
  hillsNear: string;
  cover: string;
  coverAccent: string;
};

/** Cenário da fase: tileset, enfeites e formato do fundo (spec 004, emenda H5). */
export const SCENERIES = ['rio-antigo', 'vila-colonial', 'praia', 'cidade-pequena', 'floresta', 'costa-colonial', 'castelo', 'favela'] as const;
export type Scenery = (typeof SCENERIES)[number];

export type ChallengeName = 'gap' | 'stepUp' | 'stepDown' | 'spikes' | 'floating' | 'movingH' | 'lift' | 'falling' | 'springWall' | 'spikeTrap';
export type FormatName = 'ceiling' | 'climb' | 'branch';

/** Receita da fase: peso de cada desafio e de cada formato de trecho (0 desliga). */
export type LevelRecipe = {
  weights: Partial<Record<ChallengeName, number>>;
  formats: Partial<Record<FormatName, number>>;
};

export type Book = {
  id: string;
  title: string;
  author: string;
  year: number;
  bookPages: number;
  map: string;
  synopsis: string;
  scenery: Scenery;
  theme: Theme;
  level: LevelRecipe;
};

export const BOOKS = data as Book[];

export function getBook(id: string): Book {
  const book = BOOKS.find((b) => b.id === id);
  if (!book) throw new Error(`Livro desconhecido: ${id}`);
  return book;
}

export function pagesToCollect(book: Book): number {
  return gamePagesFor(book.bookPages);
}

export function hexColor(c: string): number {
  return parseInt(c.replace('#', ''), 16);
}
