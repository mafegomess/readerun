import Phaser from 'phaser';
import { COLORS, FONTS } from './config.ts';
import { hexColor, type Book } from './data/books.ts';
import { sfx } from './systems/audio.ts';
import { save } from './systems/save.ts';
import { view } from './systems/viewport.ts';

type TextOpts = { size?: number; color?: string; wrap?: number; align?: 'left' | 'center' | 'right'; lineSpacing?: number };

/** Fonte escolhida nas Opções (família e escala de tamanho). */
export function currentFont() {
  return FONTS[save.font];
}

export function text(scene: Phaser.Scene, x: number, y: number, str: string, opts: TextOpts = {}) {
  const font = currentFont();
  const t = scene.add.text(Math.round(x), Math.round(y), str, {
    fontFamily: font.family,
    fontSize: `${Math.round((opts.size ?? 8) * font.scale)}px`,
    color: opts.color ?? COLORS.text,
    align: opts.align ?? 'left',
    lineSpacing: Math.round((opts.lineSpacing ?? 4) * font.scale),
    wordWrap: opts.wrap ? { width: opts.wrap, useAdvancedWrap: false } : undefined,
    // rasteriza no tamanho final da tela (zoom da câmera), sem borrão
    resolution: view.zoom,
  });
  return t;
}

export type Button = Phaser.GameObjects.Container & { setFocused(f: boolean): void; press(): void };

export function button(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  onClick: () => void,
  opts: { width?: number; primary?: boolean } = {},
): Button {
  const w = opts.width ?? Math.max(72, label.length * 8 + 20);
  const h = 20;
  const base = opts.primary ? 0xd6453d : COLORS.panel;
  const hover = opts.primary ? 0xe86a5f : 0x40336a;
  const g = scene.add.graphics();
  const draw = (fill: number, border: number) => {
    g.clear();
    g.fillStyle(0x000000, 0.35).fillRect(-w / 2 + 2, -h / 2 + 2, w, h);
    g.fillStyle(fill, 1).fillRect(-w / 2, -h / 2, w, h);
    g.lineStyle(1, border, 1).strokeRect(-w / 2 + 0.5, -h / 2 + 0.5, w - 1, h - 1);
  };
  draw(base, 0x120c22);
  const t = text(scene, 0, 0, label).setOrigin(0.5);
  t.setPosition(0, 1);
  const c = scene.add.container(Math.round(x), Math.round(y), [g, t]) as Button;
  c.setSize(w, h);
  c.setInteractive({ useHandCursor: true });
  c.on('pointerover', () => draw(hover, hexColor(COLORS.gold)));
  c.on('pointerout', () => draw(base, 0x120c22));
  c.press = () => {
    sfx.click();
    onClick();
  };
  c.on('pointerup', () => c.press());
  c.setFocused = (f: boolean) => (f ? draw(hover, hexColor(COLORS.gold)) : draw(base, 0x120c22));
  return c;
}

/** Capa ilustrada do livro (ou a capa "misteriosa", se ainda não foi revelado). */
export function cover(scene: Phaser.Scene, x: number, y: number, w: number, h: number, book: Book, revealed: boolean) {
  const c = scene.add.container(Math.round(x), Math.round(y));
  const g = scene.add.graphics();
  c.add(g);
  const left = -w / 2;
  const topY = -h / 2;
  g.fillStyle(0x000000, 0.35).fillRect(left + 3, topY + 3, w, h);
  if (!revealed) {
    g.fillStyle(0x3a2d5c, 1).fillRect(left, topY, w, h);
    g.fillStyle(0x2b2147, 1).fillRect(left, topY, 6, h);
    g.lineStyle(1, 0x6a5a99, 1).strokeRect(left + 9.5, topY + 4.5, w - 14, h - 9);
    c.add(text(scene, 3, -6, '?', { size: 16, color: COLORS.muted }).setOrigin(0.5));
    return c;
  }
  const main = hexColor(book.theme.cover);
  const accent = hexColor(book.theme.coverAccent);
  g.fillStyle(main, 1).fillRect(left, topY, w, h);
  g.fillStyle(0x000000, 0.25).fillRect(left, topY, 6, h);
  g.fillStyle(0xffffff, 0.08).fillRect(left + 6, topY, 2, h);
  g.lineStyle(1, accent, 1).strokeRect(left + 9.5, topY + 4.5, w - 14, h - 9);
  const title = text(scene, 3, topY + 12, book.title, {
    color: book.theme.coverAccent,
    wrap: w - 16,
    align: 'center',
    lineSpacing: 3,
  }).setOrigin(0.5, 0);
  const author = text(scene, 3, topY + h - 10, book.author, {
    color: '#ffffff',
    wrap: w - 16,
    align: 'center',
    lineSpacing: 2,
  }).setOrigin(0.5, 1);
  // ornamento entre título e autor, só se couber
  const oy = Math.round(title.y + title.height + 9);
  if (oy + 6 < author.y - author.height) {
    g.fillStyle(accent, 1);
    g.fillRect(3 - 10, oy, 20, 1);
    g.fillTriangle(3, oy - 3, 6, oy + 0.5, 3, oy + 4);
    g.fillTriangle(3, oy - 3, 0, oy + 0.5, 3, oy + 4);
  }
  c.add([title, author]);
  return c;
}

/** Fundo com degradê e morros, sem textura: usado nos menus. */
export function backdrop(scene: Phaser.Scene, top: number, bottom: number) {
  const g = scene.add.graphics();
  g.fillGradientStyle(top, top, bottom, bottom, 1);
  g.fillRect(0, 0, view.width, view.height);
  return g;
}
