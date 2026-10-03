import Phaser from 'phaser';
import { WIDTH } from '../config.ts';
import type { Scenery } from '../data/books.ts';

/**
 * Camadas de fundo de cada cenário (spec 004, emenda H5). Tudo é periódico em
 * WIDTH (480 px) para a TileSprite emendar sem costura, e usa só a cor da camada
 * (vinda do tema do livro) com variações mais claras/escuras.
 */

type G = Phaser.GameObjects.Graphics;
type Layer = 'far' | 'near';

const shade = (color: number, amount: number) => {
  const c = Phaser.Display.Color.IntegerToColor(color);
  return (amount >= 0 ? c.lighten(amount * 100) : c.darken(-amount * 100)).color;
};

/** Desenha nas posições x, x−480 e x+480, para formas que cruzam a emenda. */
function wrap(draw: (x: number) => void, x: number) {
  for (const dx of [-WIDTH, 0, WIDTH]) draw(x + dx);
}

function hillsLine(g: G, base: number, waves: [number, number, number][]) {
  const yAt = (x: number) => base + waves.reduce((a, [amp, f, ph]) => a + amp * Math.sin((Math.PI * 2 * f * x) / WIDTH + ph), 0);
  for (let x = 0; x < WIDTH; x++) g.fillRect(x, Math.round(yAt(x)), 1, 270);
  return yAt;
}

function pines(g: G, color: number, count: number, ground: number, size: [number, number], seed: number) {
  const rnd = new Phaser.Math.RandomDataGenerator([`pinheiros-${seed}`]);
  g.fillStyle(color, 1);
  for (let i = 0; i < count; i++) {
    const x = (i * WIDTH) / count + rnd.between(-8, 8);
    const s = rnd.between(size[0], size[1]);
    wrap((px) => {
      g.fillTriangle(px - s, ground, px + s, ground, px, ground - s * 3);
      g.fillTriangle(px - s * 0.8, ground - s, px + s * 0.8, ground - s, px, ground - s * 3.6);
      g.fillRect(px - 1, ground - 2, 2, 6);
    }, x);
  }
  g.fillRect(0, ground, WIDTH, 270);
}

function houses(g: G, color: number, ground: number, opts: { count: number; minH: number; maxH: number; seed: number; tall?: boolean }) {
  const rnd = new Phaser.Math.RandomDataGenerator([`casas-${opts.seed}`]);
  const win = shade(color, 0.18);
  let x = 0;
  while (x < WIDTH) {
    const w = rnd.between(opts.tall ? 30 : 36, opts.tall ? 44 : 56);
    const h = rnd.between(opts.minH, opts.maxH);
    const px = x;
    g.fillStyle(color, 1);
    g.fillRect(px, ground - h, w - 2, h);
    g.fillTriangle(px - 3, ground - h, px + w + 1, ground - h, px + (w - 2) / 2, ground - h - rnd.between(10, 16));
    g.fillStyle(win, 1);
    const floors = Math.max(1, Math.floor(h / 18));
    for (let f = 0; f < floors; f++)
      for (let k = 0; k < 2; k++) g.fillRect(px + 6 + k * Math.floor((w - 14) / 2), ground - h + 6 + f * 18, 5, 8);
    x += w + rnd.between(0, 4);
  }
  g.fillStyle(color, 1);
  g.fillRect(0, ground, WIDTH, 270);
}

const draw: Record<Scenery, (g: G, layer: Layer, color: number) => void> = {
  'rio-antigo': (g, layer, color) => {
    g.fillStyle(color, 1);
    if (layer === 'far') {
      hillsLine(g, 175, [
        [10, 2, 0],
        [5, 5, 1],
      ]);
      // Pão de Açúcar e o morro da Urca
      wrap((x) => {
        g.fillEllipse(x, 150, 46, 96);
        g.fillEllipse(x + 46, 170, 54, 52);
      }, 330);
    } else houses(g, color, 228, { count: 9, minH: 34, maxH: 56, seed: 1 });
  },
  'vila-colonial': (g, layer, color) => {
    g.fillStyle(color, 1);
    if (layer === 'far') {
      hillsLine(g, 160, [
        [14, 2, 1],
        [6, 4, 0],
      ]);
      return;
    }
    houses(g, color, 230, { count: 8, minH: 24, maxH: 36, seed: 2 });
    // igrejinha com torre
    wrap((x) => {
      g.fillStyle(color, 1);
      g.fillRect(x, 170, 18, 60);
      g.fillTriangle(x - 2, 170, x + 20, 170, x + 9, 152);
    }, 300);
  },
  praia: (g, layer, color) => {
    if (layer === 'far') {
      // mar com reflexos e barcos ao longe
      g.fillStyle(color, 1);
      g.fillRect(0, 176, WIDTH, 94);
      g.fillStyle(shade(color, 0.25), 1);
      for (let i = 0; i < 14; i++) g.fillRect((i * 37) % WIDTH, 186 + ((i * 13) % 50), 12, 1);
      g.fillStyle(shade(color, -0.35), 1);
      for (const bx of [70, 260, 400])
        wrap((x) => {
          g.fillRect(x, 172, 18, 4);
          g.fillTriangle(x + 8, 172, x + 8, 154, x + 18, 170);
        }, bx);
      return;
    }
    // trapiche: deque e estacas
    g.fillStyle(color, 1);
    for (const [x0, w] of [
      [20, 160],
      [260, 140],
    ])
      wrap((x) => {
        g.fillRect(x, 206, w, 5);
        for (let p = 0; p < w; p += 20) g.fillRect(x + p, 206, 4, 64);
      }, x0);
  },
  'cidade-pequena': (g, layer, color) => {
    g.fillStyle(color, 1);
    if (layer === 'far') {
      hillsLine(g, 190, [
        [6, 2, 0],
        [3, 6, 2],
      ]);
      return;
    }
    houses(g, color, 232, { count: 7, minH: 26, maxH: 38, seed: 4 });
    // carvalho grande
    wrap((x) => {
      g.fillStyle(color, 1);
      g.fillRect(x - 3, 180, 6, 52);
      for (const [dx, dy, r] of [
        [0, 168, 22],
        [-18, 178, 16],
        [18, 178, 16],
      ])
        g.fillCircle(x + dx, dy, r);
    }, 210);
  },
  floresta: (g, layer, color) => {
    if (layer === 'far') pines(g, color, 22, 200, [5, 8], 1);
    else pines(g, color, 12, 232, [10, 15], 2);
  },
  'costa-colonial': (g, layer, color) => {
    if (layer === 'far') {
      g.fillStyle(color, 1);
      g.fillRect(0, 180, WIDTH, 90);
      g.fillStyle(shade(color, -0.4), 1);
      // navio de três mastros
      wrap((x) => {
        g.fillRect(x, 168, 70, 10);
        g.fillTriangle(x + 70, 168, x + 82, 168, x + 70, 178);
        for (const m of [16, 35, 54]) {
          g.fillRect(x + m, 120, 2, 48);
          g.fillTriangle(x + m - 12, 160, x + m + 12, 160, x + m, 128);
        }
      }, 300);
      return;
    }
    houses(g, color, 230, { count: 9, minH: 44, maxH: 72, seed: 6, tall: true });
    // igreja de duas torres
    wrap((x) => {
      g.fillStyle(color, 1);
      g.fillRect(x, 150, 44, 80);
      for (const tx of [0, 32]) {
        g.fillRect(x + tx, 130, 12, 20);
        g.fillTriangle(x + tx - 1, 130, x + tx + 13, 130, x + tx + 6, 118);
      }
    }, 120);
  },
  castelo: (g, layer, color) => {
    g.fillStyle(color, 1);
    if (layer === 'far') {
      // montanhas recortadas
      for (const [x0, h, w] of [
        [0, 90, 110],
        [90, 120, 130],
        [210, 80, 100],
        [300, 110, 120],
        [400, 95, 110],
      ])
        wrap((x) => g.fillTriangle(x - w / 2, 230, x + w / 2, 230, x, 230 - h), x0);
      g.fillRect(0, 230, WIDTH, 40);
      return;
    }
    // muralha com ameias e torres com janelas de vidro
    g.fillRect(0, 200, WIDTH, 70);
    for (let x = 0; x < WIDTH; x += 16) g.fillRect(x, 192, 9, 8);
    const glass = shade(color, 0.35);
    for (const tx of [60, 220, 380])
      wrap((x) => {
        g.fillStyle(color, 1);
        g.fillRect(x, 130, 34, 70);
        g.fillTriangle(x - 4, 130, x + 38, 130, x + 17, 96);
        g.fillStyle(glass, 1);
        g.fillRect(x + 13, 146, 8, 14);
        g.fillRect(x + 13, 172, 8, 12);
      }, tx);
  },
  favela: (g, layer, color) => {
    if (layer === 'far') {
      // prédios da cidade ao fundo
      const rnd = new Phaser.Math.RandomDataGenerator(['predios']);
      const win = shade(color, 0.2);
      let x = 0;
      while (x < WIDTH) {
        const w = rnd.between(24, 40);
        const h = rnd.between(50, 110);
        g.fillStyle(color, 1);
        g.fillRect(x, 200 - h, w - 3, h + 70);
        g.fillStyle(win, 1);
        for (let wy = 200 - h + 6; wy < 196; wy += 9) for (let wx = x + 4; wx < x + w - 7; wx += 7) g.fillRect(wx, wy, 3, 4);
        x += w;
      }
      return;
    }
    // barracos em andares, subindo o morro
    const rnd = new Phaser.Math.RandomDataGenerator(['barracos']);
    const roof = shade(color, 0.15);
    for (let row = 0; row < 3; row++) {
      let x = rnd.between(-10, 10);
      const ground = 236 - row * 22;
      while (x < WIDTH) {
        const w = rnd.between(18, 30);
        const h = rnd.between(16, 24);
        g.fillStyle(color, 1);
        g.fillRect(x, ground - h, w - 2, h + row * 22 + 20);
        g.fillStyle(roof, 1);
        g.fillTriangle(x - 2, ground - h, x + w, ground - h, x + w, ground - h - 5);
        x += w + rnd.between(4, 22);
      }
    }
  },
};

/** Desenha a camada `layer` do cenário em `g` (área WIDTH × 270). */
export function drawScenery(g: G, scenery: Scenery, layer: Layer, color: number) {
  draw[scenery](g, layer, color);
}
