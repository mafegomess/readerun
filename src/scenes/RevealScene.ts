import Phaser from 'phaser';
import { COLORS } from '../config.ts';
import { getBook, hexColor, pagesToCollect, type Book } from '../data/books.ts';
import { sfx } from '../systems/audio.ts';
import { backdrop, button, cover, text, type Button } from '../ui.ts';

const COVER = { x: 96, y: 144, w: 104, h: 140 };
const COL = { x: 176, w: 284, top: 52, bottom: 222 };

export class RevealScene extends Phaser.Scene {
  private book!: Book;
  private replay = false;
  private buttons: Button[] = [];
  private focus = 0;

  constructor() {
    super('Reveal');
  }

  init(data: { bookId: string; replay?: boolean }) {
    this.book = getBook(data.bookId);
    this.replay = data.replay ?? false;
    this.buttons = [];
    this.focus = 0;
  }

  create() {
    const { width } = this.scale;
    backdrop(this, 0x1d1530, hexColor(this.book.theme.skyTop));
    this.cameras.main.fadeIn(300);

    const header = text(this, width / 2, 16, this.replay ? 'Sua recomendação' : 'Livro revelado!', { size: 16, color: COLORS.gold }).setOrigin(
      0.5,
      0,
    );
    const art = cover(this, COVER.x, COVER.y, COVER.w, COVER.h, this.book, true);
    const details = this.details();

    if (this.replay) {
      this.showButtons();
      return;
    }

    // as páginas voam até o livro, que então aparece
    header.setAlpha(0);
    art.setScale(0).setAlpha(0);
    details.setAlpha(0);
    const n = pagesToCollect(this.book);
    const rnd = new Phaser.Math.RandomDataGenerator([this.book.id]);
    for (let i = 0; i < n; i++) {
      const angle = rnd.realInRange(0, Math.PI * 2);
      const p = this.add.image(COVER.x + Math.cos(angle) * 260, COVER.y + Math.sin(angle) * 200, 'page').setAngle(rnd.between(-40, 40));
      this.tweens.add({
        targets: p,
        x: COVER.x + rnd.between(-6, 6),
        y: COVER.y + rnd.between(-6, 6),
        angle: 0,
        duration: 650,
        delay: 150 + i * 90,
        ease: 'Quad.in',
        onComplete: () => {
          sfx.click();
          this.tweens.add({ targets: p, scale: 0, duration: 150, onComplete: () => p.destroy() });
        },
      });
    }
    const appear = 150 + n * 90 + 700;
    this.tweens.add({ targets: art, scale: 1, alpha: 1, duration: 450, delay: appear, ease: 'Back.out', onStart: () => sfx.unlock() });
    this.tweens.add({ targets: header, alpha: 1, duration: 300, delay: appear });
    this.tweens.add({ targets: details, alpha: 1, duration: 400, delay: appear + 350, onComplete: () => this.showButtons() });
  }

  private details() {
    const b = this.book;
    const c = this.add.container(0, 0);
    let y = COL.top;
    const title = text(this, COL.x, y, b.title, { color: COLORS.gold, wrap: COL.w });
    y += title.height + 6;
    const author = text(this, COL.x, y, `${b.author}, ${b.year}`, { color: COLORS.muted, wrap: COL.w });
    y += author.height + 12;
    const label = text(this, COL.x, y, 'Por que ler:', { color: COLORS.text });
    y += label.height + 6;
    const synopsis = text(this, COL.x, y, b.synopsis, { wrap: COL.w, lineSpacing: 5, color: '#e9e1f5' });
    c.add([title, author, label, synopsis]);

    // sinopse longa (livros adicionados depois): rolagem com roda/arrasto dentro da área
    const maxH = COL.bottom - y;
    if (synopsis.height > maxH) {
      const shape = this.make.graphics({}, false).fillRect(COL.x, y, COL.w, maxH);
      synopsis.setMask(shape.createGeometryMask());
      const top = y;
      const minY = top - (synopsis.height - maxH);
      const scrollBy = (dy: number) => synopsis.setY(Phaser.Math.Clamp(synopsis.y - dy, minY, top));
      this.input.on('wheel', (_p: unknown, _o: unknown, _dx: number, dy: number) => scrollBy(dy * 0.3));
      this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
        if (p.isDown && p.x > COL.x) scrollBy(p.prevPosition.y - p.y);
      });
      c.add(text(this, COL.x + COL.w, COL.bottom + 2, 'role para ler mais', { color: COLORS.muted }).setOrigin(1, 0));
    }
    return c;
  }

  private showButtons() {
    const y = this.scale.height - 22;
    this.buttons = [
      button(this, COL.x + 70, y, 'Livros', () => this.scene.start('Menu', { bookId: this.book.id }), { width: 130, primary: true }),
      button(this, COL.x + 214, y, 'Jogar de novo', () => this.scene.start('Game', { bookId: this.book.id }), { width: 140 }),
    ];
    const kb = this.input.keyboard!;
    const move = (d: number) => {
      this.buttons[this.focus].setFocused(false);
      this.focus = (this.focus + d + this.buttons.length) % this.buttons.length;
      this.buttons[this.focus].setFocused(true);
    };
    kb.on('keydown-LEFT', () => move(-1));
    kb.on('keydown-RIGHT', () => move(1));
    kb.on('keydown-ENTER', () => this.buttons[this.focus].press());
  }
}
