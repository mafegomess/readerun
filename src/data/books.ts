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

export type Book = {
  id: string;
  title: string;
  author: string;
  year: number;
  bookPages: number;
  map: string;
  synopsis: string;
  theme: Theme;
};

export const BOOKS: Book[] = data;

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
