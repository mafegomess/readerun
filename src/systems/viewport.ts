import Phaser from 'phaser';
import { HEIGHT, MAX_DPR, MAX_WIDTH, WIDTH } from '../config.ts';

/**
 * O canvas é desenhado na resolução real da tela (CSS × dpr) e a ampliação
 * da arte de 480×270 é feita pelo zoom das câmeras. Assim o texto é rasterizado
 * já no tamanho final, sem o borrão de esticar uma imagem pequena via CSS.
 */

export type Insets = { left: number; right: number; top: number; bottom: number };

export type View = {
  dpr: number;
  canvasWidth: number;
  canvasHeight: number;
  /** px do canvas por unidade lógica */
  zoom: number;
  /** largura lógica, de WIDTH a MAX_WIDTH */
  width: number;
  /** altura lógica, sempre HEIGHT */
  height: number;
  /** retângulo da área de jogo dentro do canvas (fora dele, letterbox) */
  x: number;
  y: number;
  viewWidth: number;
  viewHeight: number;
  /** áreas seguras (notch, cantos) em unidades lógicas */
  safe: Insets;
};

const state: View = {
  dpr: 1,
  canvasWidth: WIDTH,
  canvasHeight: HEIGHT,
  zoom: 1,
  width: WIDTH,
  height: HEIGHT,
  x: 0,
  y: 0,
  viewWidth: WIDTH,
  viewHeight: HEIGHT,
  safe: { left: 0, right: 0, top: 0, bottom: 0 },
};

export const view: Readonly<View> = state;

function cssInsets(): Insets {
  const probe = document.getElementById('safe-area');
  if (!probe) return { left: 0, right: 0, top: 0, bottom: 0 };
  const s = getComputedStyle(probe);
  return {
    left: parseFloat(s.paddingLeft) || 0,
    right: parseFloat(s.paddingRight) || 0,
    top: parseFloat(s.paddingTop) || 0,
    bottom: parseFloat(s.paddingBottom) || 0,
  };
}

/** Recalcula a viewport a partir da janela. Retorna true se algo mudou. */
export function measureView(): boolean {
  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
  const cssW = window.innerWidth;
  const cssH = window.innerHeight;
  const cw = Math.max(1, Math.round(cssW * dpr));
  const ch = Math.max(1, Math.round(cssH * dpr));

  let zoom: number;
  let width: number;
  const aspect = cw / ch;
  if (aspect < WIDTH / HEIGHT) {
    zoom = cw / WIDTH;
    width = WIDTH;
  } else if (aspect > MAX_WIDTH / HEIGHT) {
    zoom = ch / HEIGHT;
    width = MAX_WIDTH;
  } else {
    zoom = ch / HEIGHT;
    width = cw / zoom;
  }
  const viewWidth = Math.round(width * zoom);
  const viewHeight = Math.round(HEIGHT * zoom);
  const x = Math.round((cw - viewWidth) / 2);
  const y = Math.round((ch - viewHeight) / 2);

  // insets em px CSS → unidades lógicas, descontando o que o letterbox já afasta
  const ins = cssInsets();
  const toLogical = (cssPx: number, letterbox: number) => Math.max(0, (cssPx * dpr - letterbox) / zoom);
  const safe = {
    left: toLogical(ins.left, x),
    right: toLogical(ins.right, cw - x - viewWidth),
    top: toLogical(ins.top, y),
    bottom: toLogical(ins.bottom, ch - y - viewHeight),
  };

  const changed =
    cw !== state.canvasWidth ||
    ch !== state.canvasHeight ||
    dpr !== state.dpr ||
    (Object.keys(safe) as (keyof Insets)[]).some((k) => Math.abs(safe[k] - state.safe[k]) > 0.01);
  Object.assign(state, { dpr, canvasWidth: cw, canvasHeight: ch, zoom, width, height: HEIGHT, x, y, viewWidth, viewHeight, safe });
  return changed;
}

/**
 * Aplica a área de jogo e o zoom numa câmera. Com `center`, mostra exatamente a
 * área lógica 0..width × 0..height (cenas de interface). A origem da câmera fica
 * em 0,5 porque os limites do follow do Phaser assumem isso.
 */
export function applyView(cam: Phaser.Cameras.Scene2D.Camera, center = false) {
  cam.setViewport(state.x, state.y, state.viewWidth, state.viewHeight);
  cam.setZoom(state.zoom);
  if (center) cam.centerOn(state.width / 2, state.height / 2);
}

/** Onde pôr um objeto com scrollFactor 0 para ele encostar no canto superior esquerdo. */
export function screenOrigin() {
  return {
    x: (state.width * (state.zoom - 1)) / 2,
    y: (state.height * (state.zoom - 1)) / 2,
  };
}

export const VIEW_CHANGED = 'view:changed';

/** Assina mudanças de viewport e remove a assinatura quando a cena encerrar. */
export function onViewChanged(scene: Phaser.Scene, fn: () => void) {
  const events = scene.game.events;
  events.on(VIEW_CHANGED, fn);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => events.off(VIEW_CHANGED, fn));
}
