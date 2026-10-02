import Phaser from 'phaser';
import { COLORS } from '../config.ts';
import { BOOKS, pagesToCollect } from '../data/books.ts';
import { audio, music, sfx } from '../systems/audio.ts';
import { save } from '../systems/save.ts';
import { applyView, onViewChanged, view } from '../systems/viewport.ts';
import { isIosBrowser, requestFullscreen } from '../systems/fullscreen.ts';
import { backdrop, button, cover, text, type Button } from '../ui.ts';

const PER_PAGE = 3;

export class MenuScene extends Phaser.Scene {
  private shelf = 0;
  private selected = 0;
  private cards: Phaser.GameObjects.Container[] = [];
  private frame!: Phaser.GameObjects.Graphics;

  constructor() {
    super('Menu');
  }

  init(data: { bookId?: string }) {
    // volta com o último livro jogado já selecionado
    const idx = data.bookId ? BOOKS.findIndex((b) => b.id === data.bookId) : -1;
    if (idx >= 0) {
      this.shelf = Math.floor(idx / PER_PAGE);
      this.selected = idx % PER_PAGE;
    }
  }

  create() {
    const { width, height } = view;
    applyView(this.cameras.main, true);
    // nova proporção de tela: remonta o menu mantendo o livro selecionado
    onViewChanged(this, () => this.scene.restart({ bookId: BOOKS[this.bookIndex(this.selected)]?.id }));
    music.stop();
    backdrop(this, 0x1d1530, 0x4a3a6b);
    this.stars();

    text(this, width / 2, 8, 'READERUN', { size: 16, color: COLORS.gold }).setOrigin(0.5, 0);
    text(this, width / 2, 29, 'Recupere as páginas e descubra o livro', { color: COLORS.muted }).setOrigin(0.5, 0);

    this.frame = this.add.graphics().setDepth(5);
    this.buildShelf();

    const runner = this.add.sprite(-20, height - 14, 'fox').play('fox-run').setDepth(1);
    this.tweens.add({ targets: runner, x: width + 20, duration: 7000, repeat: -1, repeatDelay: 1500 });
    this.add.rectangle(width / 2, height - 1, width, 2, 0x5fb04a).setDepth(1);

    const mute = this.add
      .image(width - view.safe.right - 14, 14 + view.safe.top, 'ui', audio.muted ? 5 : 4)
      .setScale(0.6)
      .setInteractive({ useHandCursor: true });
    mute.on('pointerup', () => mute.setFrame(audio.toggleMute() ? 5 : 4));

    if (isIosBrowser() && !save.fullscreenHintSeen) this.iosHint();

    const kb = this.input.keyboard!;
    kb.on('keydown-LEFT', () => this.move(-1));
    kb.on('keydown-RIGHT', () => this.move(1));
    kb.on('keydown-A', () => this.move(-1));
    kb.on('keydown-D', () => this.move(1));
    kb.on('keydown-ENTER', () => this.play(this.bookIndex(this.selected)));
    kb.on('keydown-SPACE', () => this.play(this.bookIndex(this.selected)));
  }

  private stars() {
    const rnd = new Phaser.Math.RandomDataGenerator(['readerun']);
    for (let i = 0; i < 40; i++) {
      const s = this.add.rectangle(rnd.between(0, Math.round(view.width)), rnd.between(0, 200), 1, 1, 0xffffff, rnd.realInRange(0.2, 0.7));
      this.tweens.add({ targets: s, alpha: 0.1, duration: rnd.between(800, 2000), yoyo: true, repeat: -1 });
    }
  }

  /** Safari no iPhone não tem tela cheia para páginas: ensina o atalho da Tela de Início. */
  private iosHint() {
    const { width, height, safe } = view;
    // uma linha só, para não cobrir os botões "Ver livro"; toque fecha de vez
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

  private bookIndex(slot: number) {
    return this.shelf * PER_PAGE + slot;
  }

  private shelfCount() {
    return Math.ceil(BOOKS.length / PER_PAGE);
  }

  private buildShelf() {
    this.cards.forEach((c) => c.destroy());
    this.cards = [];
    const { width } = view;
    const slots = BOOKS.slice(this.shelf * PER_PAGE, (this.shelf + 1) * PER_PAGE);
    const spacing = 140;
    const x0 = width / 2 - ((slots.length - 1) * spacing) / 2;

    slots.forEach((book, slot) => {
      const done = save.isCompleted(book.id);
      const x = x0 + slot * spacing;
      const card = this.add.container(x, 0);
      const art = cover(this, 0, 108, 96, 120, book, done);
      art.setSize(96, 120).setInteractive({ useHandCursor: true });
      art.on('pointerover', () => this.select(slot));
      art.on('pointerup', () => this.play(this.bookIndex(slot)));
      card.add(art);

      const label = done ? book.title : `Livro ${this.bookIndex(slot) + 1}`;
      card.add(text(this, 0, 176, label, { wrap: 128, align: 'center', color: done ? COLORS.gold : COLORS.text }).setOrigin(0.5, 0));
      card.add(text(this, 0, 202, `${pagesToCollect(book)} páginas`, { color: COLORS.muted }).setOrigin(0.5, 0));
      if (done) {
        const see: Button = button(this, 0, 228, 'Ver livro', () => this.scene.start('Reveal', { bookId: book.id, replay: true }), {
          width: 92,
        });
        card.add(see);
      }
      this.cards.push(card);
    });

    if (this.shelfCount() > 1) {
      const prev = button(this, view.safe.left + 18, 108, '<', () => this.turnShelf(-1), { width: 20 });
      const next = button(this, width - view.safe.right - 18, 108, '>', () => this.turnShelf(1), { width: 20 });
      this.cards.push(prev, next);
    }

    this.selected = Math.min(this.selected, slots.length - 1);
    this.drawFrame();
  }

  private turnShelf(dir: number) {
    const n = this.shelfCount();
    this.shelf = (this.shelf + dir + n) % n;
    this.buildShelf();
  }

  private move(dir: number) {
    const count = Math.min(PER_PAGE, BOOKS.length - this.shelf * PER_PAGE);
    const next = this.selected + dir;
    if (next < 0 || next >= count) {
      if (this.shelfCount() > 1) {
        this.turnShelf(dir);
        this.selected = dir > 0 ? 0 : Math.min(PER_PAGE, BOOKS.length - this.shelf * PER_PAGE) - 1;
        this.drawFrame();
      }
      return;
    }
    sfx.click();
    this.select(next);
  }

  private select(slot: number) {
    this.selected = slot;
    this.drawFrame();
  }

  private drawFrame() {
    const card = this.cards[this.selected];
    this.frame.clear();
    if (!card) return;
    this.frame.lineStyle(2, 0xe8c170, 1).strokeRect(card.x - 53, 108 - 64, 110, 128);
  }

  private play(index: number) {
    const book = BOOKS[index];
    if (!book) return;
    sfx.click();
    requestFullscreen();
    this.scene.start('Game', { bookId: book.id });
  }
}
