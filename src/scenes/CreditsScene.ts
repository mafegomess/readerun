import Phaser from 'phaser';
import { COLORS } from '../config.ts';
import { sfx } from '../systems/audio.ts';
import { applyView, onViewChanged, view } from '../systems/viewport.ts';
import { backdrop, button, text } from '../ui.ts';

// [título da seção, linhas]; título vazio = só texto
const CREDITS: [string, string[]][] = [
  ['Criação', ['Maria Fernanda Gomes Luiz']],
  ['Código, arte e música', ['feitos com ajuda de IA: Claude (Anthropic)']],
  [
    'Fontes',
    ['Press Start 2P - CodeMan38', '(SIL Open Font License 1.1)', 'Atkinson Hyperlegible - Braille Institute', '(SIL Open Font License 1.1)'],
  ],
  ['Motor', ['Phaser 3 - Phaser Studio (licença MIT)']],
  ['Livros', ['As obras recomendadas pertencem a seus autores e editoras.', 'As capas do jogo são ilustrações próprias.']],
  ['', ['Obrigada por jogar e boa leitura!']],
];

const AREA = { top: 42, bottom: 222 };

/** Créditos, com rolagem quando não cabem (spec 004, História 3). */
export class CreditsScene extends Phaser.Scene {
  constructor() {
    super('Credits');
  }

  create() {
    const { width } = view;
    applyView(this.cameras.main, true);
    onViewChanged(this, () => this.scene.restart());
    backdrop(this, 0x1d1530, 0x4a3a6b);
    text(this, width / 2, 14, 'Créditos', { size: 16, color: COLORS.gold }).setOrigin(0.5, 0);

    const content = this.add.container(0, 0);
    let y = AREA.top;
    for (const [title, lines] of CREDITS) {
      if (title) {
        const t = text(this, width / 2, y, title, { color: COLORS.gold, align: 'center' }).setOrigin(0.5, 0);
        content.add(t);
        y += t.height + 4;
      }
      for (const line of lines) {
        const t = text(this, width / 2, y, line, { align: 'center', wrap: 420 }).setOrigin(0.5, 0);
        content.add(t);
        y += t.height + 3;
      }
      y += 10;
    }

    // rolagem (setas, roda e arrasto) só se o texto não couber na área
    const overflow = y - AREA.bottom;
    if (overflow > 0) {
      const mask = this.make.graphics({}, false).fillRect(0, AREA.top, width, AREA.bottom - AREA.top);
      content.setMask(mask.createGeometryMask());
      const scrollBy = (dy: number) => content.setY(Phaser.Math.Clamp(content.y - dy, -overflow, 0));
      this.input.keyboard!.on('keydown-DOWN', () => scrollBy(16));
      this.input.keyboard!.on('keydown-UP', () => scrollBy(-16));
      this.input.on('wheel', (_p: unknown, _o: unknown, _dx: number, dy: number) => scrollBy(dy * 0.3));
      this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
        if (p.isDown) scrollBy((p.prevPosition.y - p.y) / view.zoom);
      });
      text(this, width / 2, AREA.bottom + 2, 'role para ver mais', { color: COLORS.muted }).setOrigin(0.5, 0);
    }

    button(this, width / 2, view.height - 20, 'Voltar', () => this.back(), { width: 130, primary: true });
    this.input.keyboard!.on('keydown-ESC', () => this.back());
    this.input.keyboard!.on('keydown-ENTER', () => this.back());
  }

  private back() {
    sfx.click();
    this.scene.start('Title');
  }
}
