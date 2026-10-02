/**
 * Ordem dos quadros da folha da raposa (public/assets/fox.png, quadros de 32×32).
 * Fonte única: scripts/gen-assets.ts desenha nesta ordem e a BootScene cria as
 * animações a partir daqui.
 */
export const FOX_FRAMES = {
  /** ciclo da cauda balançando (16 posições suavizadas entre 5 poses-chave, ~0,8 s a 20 fps); o corpo acompanha a cauda */
  idle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  /** trote em 6 quadros, com a cauda ondulando */
  run: [16, 17, 18, 19, 20, 21],
  jump: [22],
  fall: [23],
  land: [24, 25],
  hurt: [26],
} as const;

export const FOX_FRAME_COUNT = 27;
