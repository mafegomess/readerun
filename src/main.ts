import Phaser from 'phaser';
import './style.css';
import { COLORS, HEIGHT, PHYSICS, WIDTH } from './config.ts';
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

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: WIDTH,
    height: HEIGHT,
    backgroundColor: COLORS.bg,
    pixelArt: true,
    roundPixels: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    input: { activePointers: 4 },
    physics: {
      default: 'arcade',
      arcade: { gravity: { x: 0, y: PHYSICS.gravity }, debug: false },
    },
    scene: [BootScene, MenuScene, GameScene, HudScene, RevealScene],
  });
  if (import.meta.env.DEV) (window as unknown as { game: Phaser.Game }).game = game;
}

void start();
