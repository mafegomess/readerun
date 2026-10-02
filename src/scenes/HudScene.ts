import Phaser from 'phaser';
import { COLORS, LIVES } from '../config.ts';
import { audio } from '../systems/audio.ts';
import { touch } from '../systems/controls.ts';
import { button, text, type Button } from '../ui.ts';
import type { GameScene, HudData } from './GameScene.ts';

export class HudScene extends Phaser.Scene {
  private gameScene!: GameScene;
  private data0!: HudData;
  private hearts: Phaser.GameObjects.Image[] = [];
  private pagesText!: Phaser.GameObjects.Text;
  private toast!: Phaser.GameObjects.Text;
  private touchUi: Phaser.GameObjects.Image[] = [];
  private panel: Phaser.GameObjects.Container | null = null;
  private panelButtons: Button[] = [];
  private focus = 0;
  private state: 'playing' | 'paused' | 'over' | 'finished' = 'playing';

  constructor() {
    super('Hud');
  }

  init(data: HudData) {
    this.data0 = data;
    this.hearts = [];
    this.touchUi = [];
    this.panel = null;
    this.state = 'playing';
  }

  create() {
    const { width } = this.scale;
    this.gameScene = this.scene.get('Game') as GameScene;

    for (let i = 0; i < LIVES; i++) {
      this.hearts.push(this.add.image(12 + i * 15, 12, 'heart', i < this.data0.lives ? 0 : 1));
    }
    this.add.image(66, 12, 'page');
    this.pagesText = text(this, 77, 8, '');
    this.setPages(0, this.data0.total);

    const pause = this.add.image(width - 14, 14, 'ui', 3).setScale(0.6).setInteractive({ useHandCursor: true });
    pause.on('pointerup', () => this.pause());
    const mute = this.add
      .image(width - 36, 14, 'ui', audio.muted ? 5 : 4)
      .setScale(0.6)
      .setInteractive({ useHandCursor: true });
    mute.on('pointerup', () => mute.setFrame(audio.toggleMute() ? 5 : 4));

    this.toast = text(this, width / 2, 34, '', { align: 'center', color: COLORS.gold })
      .setOrigin(0.5, 0)
      .setBackgroundColor('#1d1530cc')
      .setPadding(6, 5, 6, 3)
      .setVisible(false);

    if (this.sys.game.device.input.touch) {
      const y = this.scale.height - 30;
      this.touchUi = [
        this.add.image(32, y, 'ui', 0).setAlpha(0.8),
        this.add.image(84, y, 'ui', 1).setAlpha(0.8),
        this.add.image(width - 36, y, 'ui', 2).setAlpha(0.8).setScale(1.15),
      ];
    }

    const ev = this.gameScene.events;
    const onPages = (n: number, total: number) => this.setPages(n, total);
    const onLives = (n: number) => this.hearts.forEach((h, i) => h.setFrame(i < n ? 0 : 1));
    const onToast = (msg: string) => this.showToast(msg);
    const onOver = () => this.gameOver();
    const onFinish = () => {
      this.state = 'finished';
      this.touchUi.forEach((b) => b.setVisible(false));
      touch.reset();
    };
    const onHidden = () => this.pause();
    ev.on('hud:pages', onPages);
    ev.on('hud:lives', onLives);
    ev.on('hud:toast', onToast);
    ev.on('hud:gameover', onOver);
    ev.on('hud:finish', onFinish);
    this.game.events.on(Phaser.Core.Events.HIDDEN, onHidden);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      ev.off('hud:pages', onPages);
      ev.off('hud:lives', onLives);
      ev.off('hud:toast', onToast);
      ev.off('hud:gameover', onOver);
      ev.off('hud:finish', onFinish);
      this.game.events.off(Phaser.Core.Events.HIDDEN, onHidden);
      touch.reset();
    });

    const kb = this.input.keyboard!;
    kb.on('keydown-ESC', () => (this.state === 'paused' ? this.resume() : this.pause()));
    kb.on('keydown-P', () => (this.state === 'paused' ? this.resume() : this.pause()));
    kb.on('keydown-UP', () => this.moveFocus(-1));
    kb.on('keydown-DOWN', () => this.moveFocus(1));
    kb.on('keydown-ENTER', () => this.panelButtons[this.focus]?.press());
  }

  update() {
    if (this.state !== 'playing' || !this.touchUi.length) return;
    const { width, height } = this.scale;
    let left = false;
    let right = false;
    let jump = false;
    // zonas generosas na parte de baixo da tela, aceitando dedo deslizando entre botões
    for (const p of this.input.manager.pointers) {
      if (!p.isDown || p.y < height - 90) continue;
      if (p.x < 58) left = true;
      else if (p.x < 130) right = true;
      else if (p.x > width - 110) jump = true;
    }
    touch.left = left;
    touch.right = right;
    touch.jump = jump;
    this.touchUi[0].setAlpha(left ? 1 : 0.7);
    this.touchUi[1].setAlpha(right ? 1 : 0.7);
    this.touchUi[2].setAlpha(jump ? 1 : 0.7);
  }

  private setPages(n: number, total: number) {
    this.pagesText.setText(`${n}/${total}`);
    this.pagesText.setColor(n === total ? COLORS.gold : COLORS.text);
    if (n > 0) this.tweens.add({ targets: this.pagesText, scale: 1.3, duration: 90, yoyo: true });
  }

  private showToast(msg: string) {
    this.tweens.killTweensOf(this.toast);
    this.toast.setText(msg).setVisible(true).setAlpha(1);
    this.tweens.add({ targets: this.toast, alpha: 0, delay: 1800, duration: 400, onComplete: () => this.toast.setVisible(false) });
  }

  private pause() {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    touch.reset();
    this.scene.pause('Game');
    this.openPanel('Pausado', null, [
      ['Continuar', () => this.resume()],
      ['Reiniciar fase', () => this.restart()],
      ['Livros', () => this.toMenu()],
    ]);
  }

  private resume() {
    if (this.state !== 'paused') return;
    this.closePanel();
    this.state = 'playing';
    this.scene.resume('Game');
    this.gameScene.resumeInput();
  }

  private gameOver() {
    this.state = 'over';
    touch.reset();
    this.touchUi.forEach((b) => b.setVisible(false));
    this.openPanel('Fim de jogo', 'As páginas se espalharam de novo...', [
      ['Tentar de novo', () => this.restart()],
      ['Livros', () => this.toMenu()],
    ]);
  }

  private restart() {
    this.closePanel();
    this.scene.stop();
    this.gameScene.scene.restart();
  }

  private toMenu() {
    this.closePanel();
    this.scene.stop('Game');
    this.scene.start('Menu', { bookId: this.data0.book.id });
  }

  private openPanel(title: string, subtitle: string | null, actions: [string, () => void][]) {
    const { width, height } = this.scale;
    this.closePanel();
    const items: Phaser.GameObjects.GameObject[] = [
      this.add.rectangle(width / 2, height / 2, width, height, 0x120c22, 0.7).setInteractive(),
      text(this, width / 2, 70, title, { size: 16, color: COLORS.gold }).setOrigin(0.5),
    ];
    if (subtitle) items.push(text(this, width / 2, 96, subtitle, { color: COLORS.muted }).setOrigin(0.5));
    this.panelButtons = actions.map(([label, fn], i) => button(this, width / 2, 126 + i * 28, label, fn, { width: 150, primary: i === 0 }));
    this.panel = this.add.container(0, 0, [...items, ...this.panelButtons]).setDepth(100);
    this.focus = 0;
  }

  private moveFocus(d: number) {
    if (!this.panelButtons.length) return;
    this.panelButtons[this.focus].setFocused(false);
    this.focus = (this.focus + d + this.panelButtons.length) % this.panelButtons.length;
    this.panelButtons[this.focus].setFocused(true);
  }

  private closePanel() {
    this.panel?.destroy();
    this.panel = null;
    this.panelButtons = [];
  }
}
