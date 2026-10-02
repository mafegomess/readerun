import Phaser from 'phaser';
import { COLORS, LIVES } from '../config.ts';
import { audio } from '../systems/audio.ts';
import { touch } from '../systems/controls.ts';
import { applyView, onViewChanged, view } from '../systems/viewport.ts';
import { requestFullscreen } from '../systems/fullscreen.ts';
import { button, text, type Button } from '../ui.ts';
import type { GameScene, HudData } from './GameScene.ts';

type TouchButtons = { left: Phaser.GameObjects.Image; right: Phaser.GameObjects.Image; jump: Phaser.GameObjects.Image };

export class HudScene extends Phaser.Scene {
  private gameScene!: GameScene;
  private data0!: HudData;
  private hearts: Phaser.GameObjects.Image[] = [];
  private pagesText!: Phaser.GameObjects.Text;
  private toast!: Phaser.GameObjects.Text;
  private touchUi: TouchButtons | null = null;
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
    this.touchUi = null;
    this.panel = null;
    this.state = 'playing';
  }

  create() {
    const { width, height, safe } = view;
    applyView(this.cameras.main, true);
    this.gameScene = this.scene.get('Game') as GameScene;

    // tudo ancorado nas bordas da área lógica, afastado do notch e dos cantos
    const left = safe.left;
    const right = width - safe.right;
    const top = safe.top;
    for (let i = 0; i < LIVES; i++) {
      this.hearts.push(this.add.image(left + 12 + i * 15, top + 12, 'heart', i < this.data0.lives ? 0 : 1));
    }
    this.add.image(left + 66, top + 12, 'page');
    this.pagesText = text(this, left + 77, top + 8, '');
    this.setPages(this.data0.collected, this.data0.total, false);

    const pause = this.add
      .image(right - 14, top + 14, 'ui', 3)
      .setScale(0.6)
      .setInteractive({ useHandCursor: true });
    pause.on('pointerup', () => this.pause());
    const mute = this.add
      .image(right - 36, top + 14, 'ui', audio.muted ? 5 : 4)
      .setScale(0.6)
      .setInteractive({ useHandCursor: true });
    mute.on('pointerup', () => mute.setFrame(audio.toggleMute() ? 5 : 4));

    this.toast = text(this, width / 2, top + 34, '', { align: 'center', color: COLORS.gold })
      .setOrigin(0.5, 0)
      .setBackgroundColor('#1d1530cc')
      .setPadding(6, 5, 6, 3)
      .setVisible(false);

    if (this.sys.game.device.input.touch) {
      const y = height - safe.bottom - 30;
      this.touchUi = {
        left: this.add.image(left + 32, y, 'ui', 0).setAlpha(0.8),
        right: this.add.image(left + 84, y, 'ui', 1).setAlpha(0.8),
        jump: this.add.image(right - 36, y, 'ui', 2).setAlpha(0.8).setScale(1.15),
      };
    }

    const ev = this.gameScene.events;
    const onPages = (n: number, total: number) => this.setPages(n, total);
    const onLives = (n: number) => this.hearts.forEach((h, i) => h.setFrame(i < n ? 0 : 1));
    const onToast = (msg: string) => this.showToast(msg);
    const onOver = () => this.gameOver();
    const onFinish = () => {
      this.state = 'finished';
      this.setTouchVisible(false);
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

    // tela redimensionada/girada: remonta a HUD com o estado atual da fase
    onViewChanged(this, () => {
      if (this.state === 'finished') return;
      const state = this.state;
      this.scene.restart({ ...this.gameScene.hudSnapshot(), state } satisfies HudData);
    });

    const kb = this.input.keyboard!;
    kb.on('keydown-ESC', () => (this.state === 'paused' ? this.resume() : this.pause()));
    kb.on('keydown-P', () => (this.state === 'paused' ? this.resume() : this.pause()));
    kb.on('keydown-UP', () => this.moveFocus(-1));
    kb.on('keydown-DOWN', () => this.moveFocus(1));
    kb.on('keydown-ENTER', () => this.panelButtons[this.focus]?.press());

    // remontagem com painel aberto: a fase já está pausada/encerrada, só reabre o painel
    if (this.data0.state === 'paused') this.openPausePanel();
    else if (this.data0.state === 'over') this.gameOver();
  }

  update() {
    const t = this.touchUi;
    if (this.state !== 'playing' || !t) return;
    const cam = this.cameras.main;
    const bottomZone = view.height - view.safe.bottom - 90;
    const leftRightSplit = (t.left.x + t.right.x) / 2;
    const rightEnd = t.right.x + 46;
    const jumpStart = t.jump.x - 74;
    let left = false;
    let right = false;
    let jump = false;
    // zonas generosas na parte de baixo da tela, aceitando dedo deslizando entre botões;
    // o ponteiro vem em px do canvas e é convertido para coordenadas lógicas
    for (const p of this.input.manager.pointers) {
      if (!p.isDown) continue;
      const w = cam.getWorldPoint(p.x, p.y);
      if (w.y < bottomZone) continue;
      if (w.x < leftRightSplit) left = true;
      else if (w.x < rightEnd) right = true;
      else if (w.x > jumpStart) jump = true;
    }
    touch.left = left;
    touch.right = right;
    touch.jump = jump;
    t.left.setAlpha(left ? 1 : 0.7);
    t.right.setAlpha(right ? 1 : 0.7);
    t.jump.setAlpha(jump ? 1 : 0.7);
  }

  private setTouchVisible(v: boolean) {
    if (!this.touchUi) return;
    for (const b of Object.values(this.touchUi)) b.setVisible(v);
  }

  private setPages(n: number, total: number, animate = true) {
    this.pagesText.setText(`${n}/${total}`);
    this.pagesText.setColor(n === total ? COLORS.gold : COLORS.text);
    if (animate && n > 0) this.tweens.add({ targets: this.pagesText, scale: 1.3, duration: 90, yoyo: true });
  }

  private showToast(msg: string) {
    this.tweens.killTweensOf(this.toast);
    this.toast.setText(msg).setVisible(true).setAlpha(1);
    this.tweens.add({ targets: this.toast, alpha: 0, delay: 1800, duration: 400, onComplete: () => this.toast.setVisible(false) });
  }

  private pause() {
    if (this.state !== 'playing') return;
    touch.reset();
    this.scene.pause('Game');
    this.openPausePanel();
  }

  private openPausePanel() {
    this.state = 'paused';
    this.openPanel('Pausado', null, [
      [
        'Continuar',
        () => {
          requestFullscreen();
          this.resume();
        },
      ],
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
    this.setTouchVisible(false);
    this.openPanel('Fim de jogo', 'As páginas se espalharam de novo...', [
      [
        'Tentar de novo',
        () => {
          requestFullscreen();
          this.restart();
        },
      ],
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
    const { width, height } = view;
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
