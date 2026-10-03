import Phaser from 'phaser';
import { COLORS, WIDTH } from '../config.ts';
import { audio, sfx } from '../systems/audio.ts';
import { save, type FontStyle } from '../systems/save.ts';
import { applyView, onViewChanged, view } from '../systems/viewport.ts';
import { backdrop, button, text, type Button } from '../ui.ts';

const ROWS = ['music', 'sfx', 'font', 'back'] as const;
type Row = (typeof ROWS)[number];

/** Opções: volume da música, volume dos efeitos e fonte (spec 004, História 2). */
export class OptionsScene extends Phaser.Scene {
  private focus = 0;
  private ox = 0;
  private frame!: Phaser.GameObjects.Graphics;
  private bars: Partial<Record<'music' | 'sfx', { g: Phaser.GameObjects.Graphics; label: Phaser.GameObjects.Text }>> = {};
  private rowY: Record<Row, number> = { music: 78, sfx: 118, font: 158, back: 236 };

  constructor() {
    super('Options');
  }

  init(data: { focus?: number }) {
    this.focus = data.focus ?? 0;
    this.bars = {};
  }

  create() {
    const { width } = view;
    this.ox = Math.round((width - WIDTH) / 2);
    applyView(this.cameras.main, true);
    onViewChanged(this, () => this.scene.restart({ focus: this.focus }));
    backdrop(this, 0x1d1530, 0x4a3a6b);

    text(this, width / 2, 18, 'Opções', { size: 16, color: COLORS.gold }).setOrigin(0.5, 0);
    this.frame = this.add.graphics();

    this.volumeRow('music', 'Música');
    this.volumeRow('sfx', 'Efeitos');
    this.fontRow();
    const back: Button = button(this, width / 2, this.rowY.back, 'Voltar', () => this.back(), { width: 130, primary: true });
    back.on('pointerover', () => this.setFocus(3));

    const kb = this.input.keyboard!;
    kb.on('keydown-UP', () => this.setFocus(this.focus - 1));
    kb.on('keydown-DOWN', () => this.setFocus(this.focus + 1));
    kb.on('keydown-LEFT', () => this.adjust(-1));
    kb.on('keydown-RIGHT', () => this.adjust(1));
    kb.on('keydown-ENTER', () => this.activate());
    kb.on('keydown-SPACE', () => this.activate());
    kb.on('keydown-ESC', () => this.back());
    this.setFocus(this.focus);
  }

  private volumeRow(row: 'music' | 'sfx', label: string) {
    const y = this.rowY[row];
    const x = this.ox;
    const index = ROWS.indexOf(row);
    text(this, x + 60, y, label).setOrigin(0, 0.5);
    const minus = button(this, x + 214, y, '-', () => this.step(row, -1), { width: 22 });
    const plus = button(this, x + 356, y, '+', () => this.step(row, 1), { width: 22 });
    for (const b of [minus, plus]) b.on('pointerover', () => this.setFocus(index));
    this.bars[row] = { g: this.add.graphics(), label: text(this, x + 376, y, '', { color: COLORS.muted }).setOrigin(0, 0.5) };
    this.drawBar(row, row === 'music' ? audio.musicVolume : audio.sfxVolume);
  }

  /** Barra de 10 blocos desenhada com retângulos (■ □ não existem na fonte pixelada). */
  private drawBar(row: 'music' | 'sfx', v: number) {
    const bar = this.bars[row];
    if (!bar) return;
    const y = this.rowY[row];
    const x0 = this.ox + 232;
    bar.g.clear();
    for (let i = 0; i < 10; i++) {
      const on = i < v;
      bar.g.fillStyle(on ? 0xe8c170 : 0x40336a, 1).fillRect(x0 + i * 11, y - 5, 9, 10);
      bar.g.lineStyle(1, 0x120c22, 1).strokeRect(x0 + i * 11 + 0.5, y - 4.5, 8, 9);
    }
    bar.label.setText(v === 0 ? 'sem som' : String(v));
  }

  private fontRow() {
    const y = this.rowY.font;
    const x = this.ox;
    text(this, x + 60, y, 'Fonte').setOrigin(0, 0.5);
    const options: [FontStyle, string, number][] = [
      ['pixel', 'Pixelada', x + 250],
      ['legivel', 'Legível', x + 352],
    ];
    for (const [style, label, bx] of options) {
      const b = button(this, bx, y, label, () => this.setFont(style), { width: 96, primary: save.font === style });
      b.on('pointerover', () => this.setFocus(2));
    }
    text(this, this.ox + WIDTH / 2, y + 30, 'Exemplo: a raposa encontrou mais uma página!', {
      color: COLORS.muted,
      align: 'center',
      wrap: 360,
    }).setOrigin(0.5, 0);
  }

  private setFont(style: FontStyle) {
    if (save.font === style) return;
    save.font = style;
    document.body.dataset.font = style;
    // todos os textos são criados com a fonte atual: remonta a tela para aplicar
    this.scene.restart({ focus: 2 });
  }

  private setFocus(i: number) {
    this.focus = (i + ROWS.length) % ROWS.length;
    const row = ROWS[this.focus];
    const y = this.rowY[row];
    this.frame.clear();
    if (row === 'back') return;
    this.frame.lineStyle(1, 0xe8c170, 1).strokeRect(this.ox + 48.5, y - 14.5, WIDTH - 97, 29);
  }

  private adjust(d: number) {
    const row = ROWS[this.focus];
    if (row === 'music') this.step('music', d);
    else if (row === 'sfx') this.step('sfx', d);
    else if (row === 'font') this.setFont(d < 0 ? 'pixel' : 'legivel');
  }

  private step(row: 'music' | 'sfx', d: number) {
    const get = row === 'music' ? () => audio.musicVolume : () => audio.sfxVolume;
    const v = Math.min(10, Math.max(0, get() + d));
    if (v === get()) return;
    if (row === 'music') audio.setMusicVolume(v);
    else {
      audio.setSfxVolume(v);
      sfx.page();
    }
    this.drawBar(row, v);
  }

  private activate() {
    const row = ROWS[this.focus];
    if (row === 'font') this.setFont(save.font === 'pixel' ? 'legivel' : 'pixel');
    else if (row === 'back') this.back();
  }

  private back() {
    sfx.click();
    this.scene.start('Title');
  }
}
