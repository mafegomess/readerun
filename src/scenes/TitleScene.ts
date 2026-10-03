import Phaser from 'phaser';
import { COLORS, WIDTH } from '../config.ts';
import { audio, music } from '../systems/audio.ts';
import { isIosBrowser, requestFullscreen } from '../systems/fullscreen.ts';
import { save } from '../systems/save.ts';
import { applyView, onViewChanged, view } from '../systems/viewport.ts';
import { button, text, type Button } from '../ui.ts';

/** Topo da prateleira de baixo em public/assets/shelf.png (ver genShelfBg). */
const SHELF_BOTTOM = 258;

/** Menu inicial: logo, raposa e os botões Jogar, Opções e Créditos (spec 004, História 1). */
export class TitleScene extends Phaser.Scene {
  private buttons: Button[] = [];
  private focus = 0;

  constructor() {
    super('Title');
  }

  init(data: { focus?: number }) {
    this.focus = data.focus ?? 0;
    this.buttons = [];
  }

  create() {
    const { width, safe } = view;
    const ox = Math.round((width - WIDTH) / 2);
    applyView(this.cameras.main, true);
    onViewChanged(this, () => this.scene.restart({ focus: this.focus }));
    music.stop();

    // estante de livros ao fundo (centralizada; telas largas mostram mais prateleira)
    this.add.image(width / 2, 0, 'shelf').setOrigin(0.5, 0);
    this.floatingPages();

    this.foxRoutine(ox);

    this.add.image(width / 2, 4, 'logo').setOrigin(0.5, 0);
    const subtitle = text(this, width / 2, 105, 'Recupere as páginas e descubra o livro', { color: COLORS.text, align: 'center', wrap: 420 })
      .setOrigin(0.5, 0)
      .setDepth(2);
    // faixa escura atrás do subtítulo, para ler sobre a madeira
    this.add
      .rectangle(width / 2, subtitle.y + subtitle.height / 2, subtitle.width + 16, subtitle.height + 8, 0x120c22, 0.8)
      .setDepth(1);

    const actions: [string, () => void][] = [
      [
        'Jogar',
        () => {
          requestFullscreen();
          this.scene.start('Menu');
        },
      ],
      ['Opções', () => this.scene.start('Options')],
      ['Créditos', () => this.scene.start('Credits')],
    ];
    this.buttons = actions.map(([label, fn], i) => {
      const b = button(this, width / 2, 152 + i * 28, label, fn, { width: 140, primary: i === 0 });
      b.on('pointerover', () => this.setFocus(i));
      return b;
    });

    const mute = this.add
      .image(width - safe.right - 14, 14 + safe.top, 'ui', audio.muted ? 5 : 4)
      .setScale(0.6)
      .setInteractive({ useHandCursor: true });
    mute.on('pointerup', () => mute.setFrame(audio.toggleMute() ? 5 : 4));

    if (isIosBrowser() && !save.fullscreenHintSeen) this.iosHint();

    const kb = this.input.keyboard!;
    kb.on('keydown-UP', () => this.setFocus(this.focus - 1));
    kb.on('keydown-DOWN', () => this.setFocus(this.focus + 1));
    kb.on('keydown-ENTER', () => this.buttons[this.focus].press());
    kb.on('keydown-SPACE', () => this.buttons[this.focus].press());
    this.setFocus(this.focus);
  }

  private setFocus(i: number) {
    this.buttons[this.focus]?.setFocused(false);
    this.focus = (i + this.buttons.length) % this.buttons.length;
    this.buttons[this.focus].setFocused(true);
  }

  /**
   * A raposa na prateleira de baixo faz o que faz no jogo: corre até um ponto, uma página
   * aparece no ar, ela pula, pega a página (com brilho), pousa e segue para outro ponto.
   * Fica atrás dos botões, para nunca atrapalhar o clique.
   */
  private foxRoutine(ox: number) {
    const { width, safe } = view;
    const floorY = SHELF_BOTTOM - 15;
    const minX = safe.left + 24;
    const maxX = width - safe.right - 24;
    const fox = this.add.sprite(ox + 400, floorY, 'fox').play('fox-idle');
    const sparks = this.add.particles(0, 0, 'spark', {
      speed: { min: 30, max: 80 },
      lifespan: 450,
      scale: { start: 1, end: 0 },
      gravityY: 120,
      emitting: false,
    });
    const rnd = new Phaser.Math.RandomDataGenerator([`raposa-${Date.now()}`]);

    // só para (e pula) nas laterais: no centro, a página cobriria os botões
    const CLEAR = 90;
    const stops = (): [number, number][] => [
      [minX, width / 2 - CLEAR],
      [width / 2 + CLEAR, maxX],
    ];
    const next = () => {
      // alterna de lado na maioria das vezes, para a raposa atravessar a estante
      const [a, b] = stops()[fox.x < width / 2 ? (rnd.frac() < 0.75 ? 1 : 0) : rnd.frac() < 0.75 ? 0 : 1];
      let tx = rnd.between(Math.round(a), Math.round(b));
      if (Math.abs(tx - fox.x) < 50) tx = Phaser.Math.Clamp(fox.x + (fox.x < (a + b) / 2 ? 60 : -60), a, b);
      fox.setFlipX(tx < fox.x).play('fox-run', true);
      this.tweens.add({
        targets: fox,
        x: tx,
        duration: (Math.abs(tx - fox.x) / 110) * 1000,
        onComplete: () => catchPage(),
      });
    };

    const catchPage = () => {
      fox.play('fox-idle');
      const page = this.add.image(fox.x + (fox.flipX ? -5 : 5), floorY - 40, 'page').setAlpha(0);
      this.tweens.add({ targets: page, alpha: 1, y: page.y + 4, duration: 350 });
      this.time.delayedCall(450, () => {
        fox.play('fox-jump');
        this.tweens.add({
          targets: fox,
          y: floorY - 26,
          duration: 300,
          ease: 'Quad.out',
          yoyo: true,
          onYoyo: () => {
            fox.play('fox-fall');
            sparks.explode(10, page.x, page.y);
            page.destroy();
          },
          onComplete: () => {
            fox.play('fox-land');
            this.time.delayedCall(140, () => fox.play('fox-idle'));
            this.time.delayedCall(rnd.between(1200, 2400), next);
          },
        });
      });
    };

    this.time.delayedCall(900, next);
  }

  /** Páginas soltas subindo devagar ao fundo, como no tema do jogo. */
  private floatingPages() {
    const rnd = new Phaser.Math.RandomDataGenerator(['paginas']);
    for (let i = 0; i < 6; i++) {
      const p = this.add.image(rnd.between(10, Math.round(view.width) - 10), view.height + 20, 'page').setAlpha(0.35).setAngle(rnd.between(-30, 30));
      this.tweens.add({
        targets: p,
        y: -20,
        angle: p.angle + rnd.between(-90, 90),
        duration: rnd.between(9000, 15000),
        delay: i * 1800,
        repeat: -1,
        onRepeat: () => p.setX(rnd.between(10, Math.round(view.width) - 10)),
      });
    }
  }

  /** Safari no iPhone não tem tela cheia para páginas: ensina o atalho da Tela de Início. */
  private iosHint() {
    const { width, height, safe } = view;
    // uma linha só; toque fecha de vez
    const msg = text(this, width / 2, 0, 'Tela cheia: Compartilhar > Adicionar à Tela de Início  [x]', {
      color: COLORS.gold,
    }).setOrigin(0.5, 0);
    const boxH = msg.height + 8;
    const top = height - safe.bottom - boxH - 2;
    msg.setY(Math.round(top + 5));
    const box = this.add.rectangle(width / 2, top + boxH / 2, msg.width + 14, boxH, 0x120c22, 0.92);
    const hint = this.add.container(0, 0, [box, msg]).setDepth(20);
    box.setInteractive({ useHandCursor: true }).on('pointerup', () => {
      save.fullscreenHintSeen = true;
      hint.destroy();
    });
  }
}
