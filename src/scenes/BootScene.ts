import Phaser from 'phaser';
import { BOOKS } from '../data/books.ts';
import { FOX_FRAMES } from '../data/foxFrames.ts';
import { COLORS } from '../config.ts';
import { applyView, view } from '../systems/viewport.ts';
import { text } from '../ui.ts';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    const { width, height } = view;
    applyView(this.cameras.main, true);
    const bar = this.add.graphics();
    const label = text(this, width / 2, height / 2 - 16, 'Carregando...', { color: COLORS.muted }).setOrigin(0.5);
    this.load.on('progress', (p: number) => {
      bar.clear();
      bar.fillStyle(0x40336a).fillRect(width / 2 - 80, height / 2, 160, 6);
      bar.fillStyle(0xe8c170).fillRect(width / 2 - 80, height / 2, 160 * p, 6);
    });
    this.load.on('loaderror', (file: Phaser.Loader.File) => label.setText(`Erro ao carregar ${file.key}`));

    this.load.setPath('assets/');
    this.load.spritesheet('fox', 'fox.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('checkpoint', 'checkpoint.png', { frameWidth: 16, frameHeight: 32 });
    this.load.spritesheet('exit', 'exit.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('heart', 'heart.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('ui', 'ui.png', { frameWidth: 32, frameHeight: 32 });
    this.load.image('tiles', 'tiles.png');
    this.load.image('page', 'page.png');
    this.load.image('spike', 'spike.png');
    this.load.image('platform', 'platform.png');
    this.load.image('spark', 'spark.png');

    this.load.setPath('maps/');
    for (const book of BOOKS) this.load.tilemapTiledJSON(`map-${book.id}`, `${book.map}.json`);
  }

  create() {
    // quadros e ritmos: specs/003-plataforma-estavel-e-nova-raposa/contracts/fox-animations.md
    const fox = (key: string, frames: readonly number[], frameRate = 1, repeat = 0) =>
      this.anims.create({ key, frames: this.anims.generateFrameNumbers('fox', { frames: [...frames] }), frameRate, repeat });
    fox('fox-idle', FOX_FRAMES.idle, 20, -1);
    fox('fox-run', FOX_FRAMES.run, 14, -1);
    fox('fox-jump', FOX_FRAMES.jump);
    fox('fox-fall', FOX_FRAMES.fall);
    fox('fox-land', FOX_FRAMES.land, 15);
    fox('fox-hurt', FOX_FRAMES.hurt);
    this.scene.start('Menu');
  }
}
