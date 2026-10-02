/**
 * Quantas páginas a raposa precisa coletar numa fase, proporcional ao
 * número de páginas do livro real: 1 página no jogo a cada 20 do livro,
 * com mínimo de 5 e máximo de 20 para a fase não ficar curta nem cansativa.
 */
export const BOOK_PAGES_PER_GAME_PAGE = 20;
export const MIN_GAME_PAGES = 5;
export const MAX_GAME_PAGES = 20;

export function gamePagesFor(bookPages: number): number {
  const n = Math.round(bookPages / BOOK_PAGES_PER_GAME_PAGE);
  return Math.min(MAX_GAME_PAGES, Math.max(MIN_GAME_PAGES, n));
}
