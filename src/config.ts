/**
 * Área lógica: a altura é sempre 270 e a largura varia de WIDTH (16:9) a
 * MAX_WIDTH (21:9), para preencher telas largas mostrando mais cenário.
 * Fora dessa faixa sobram faixas (letterbox). Ver src/systems/viewport.ts.
 */
export const WIDTH = 480;
export const MAX_WIDTH = 630;
export const HEIGHT = 270;
/** Teto da densidade de pixels do canvas: nítido o bastante e leve em celulares 3×. */
export const MAX_DPR = 2;
export const TILE = 16;

/**
 * Fontes do jogo (escolha nas Opções). A legível usa tamanhos maiores para ter a
 * mesma altura visual da pixelada e caber no mesmo layout (desenhado para 8/16 px).
 */
export const FONTS = {
  pixel: { family: '"Press Start 2P", monospace', scale: 1 },
  legivel: { family: '"Atkinson Hyperlegible", system-ui, sans-serif', scale: 1.375 },
} as const;

export const PHYSICS = {
  gravity: 1000,
  runSpeed: 130,
  groundAccel: 14,
  airAccel: 8,
  jumpVelocity: 360,
  maxFall: 420,
  coyoteTime: 0.1,
  jumpBuffer: 0.12,
  /**
   * Passos de física por segundo. 240 é múltiplo de 60 e 120 (e próximo de 144): quase todo
   * quadro desenhado tem passo, e a câmera não fica defasada da raposa (spec 003, tremida).
   */
  stepsPerSecond: 240,
  /** impulso da mola (spec 004, emenda H5): ~135 px de altura, cerca de 8 tiles */
  springVelocity: 520,
};

export const LIVES = 3;

export const COLORS = {
  bg: 0x1d1530,
  panel: 0x2b2147,
  text: '#fff3e0',
  muted: '#b7a9d6',
  gold: '#e8c170',
  red: '#d6453d',
};
