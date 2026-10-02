import Phaser from 'phaser';
import './style.css';
import { COLORS, PHYSICS } from './config.ts';
import { measureView, view, VIEW_CHANGED } from './systems/viewport.ts';
import { lastInputWasTouch, requestFullscreen } from './systems/fullscreen.ts';
import { BootScene } from './scenes/BootScene.ts';
import { MenuScene } from './scenes/MenuScene.ts';
import { GameScene } from './scenes/GameScene.ts';
import { HudScene } from './scenes/HudScene.ts';
import { RevealScene } from './scenes/RevealScene.ts';

async function start() {
  // espera a fonte pixelada para o texto não nascer com a fonte padrão
  try {
    await Promise.race([document.fonts.load('8px "Press Start 2P"'), new Promise((r) => setTimeout(r, 2500))]);
  } catch {
    // sem a fonte, segue com monospace
  }

  measureView();
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: view.canvasWidth,
    height: view.canvasHeight,
    backgroundColor: COLORS.bg,
    pixelArt: true,
    roundPixels: true,
    // canvas em resolução real; o CSS o reduz de volta ao tamanho da janela
    scale: {
      mode: Phaser.Scale.NONE,
      zoom: 1 / view.dpr,
    },
    input: { activePointers: 4 },
    physics: {
      default: 'arcade',
      arcade: { gravity: { x: 0, y: PHYSICS.gravity }, debug: false },
    },
    scene: [BootScene, MenuScene, GameScene, HudScene, RevealScene],
  });
  // janela redimensionada, celular girado ou barra do navegador aparecendo/sumindo
  let timer: number | undefined;
  const onResize = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      if (!measureView()) return;
      game.scale.zoom = 1 / view.dpr;
      game.scale.resize(view.canvasWidth, view.canvasHeight);
      game.events.emit(VIEW_CHANGED);
    }, 100);
  };
  window.addEventListener('resize', onResize);
  window.visualViewport?.addEventListener('resize', onResize);
  // celular: tela cheia já no primeiro toque (precisa ser dentro de um gesto)
  const firstTouch = () => {
    if (!lastInputWasTouch()) return;
    requestFullscreen();
    window.removeEventListener('pointerup', firstTouch);
  };
  window.addEventListener('pointerup', firstTouch);

  if (import.meta.env.DEV) (window as unknown as { game: Phaser.Game }).game = game;
}

void start();
