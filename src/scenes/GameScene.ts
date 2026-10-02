import Phaser from 'phaser';
import { HEIGHT, LIVES, MAX_WIDTH, WIDTH } from '../config.ts';
import { BOOKS, getBook, hexColor, pagesToCollect, type Book } from '../data/books.ts';
import { music, sfx } from '../systems/audio.ts';
import { touch } from '../systems/controls.ts';
import { Fox } from '../systems/Fox.ts';
import { save } from '../systems/save.ts';
import { applyView, onViewChanged, screenOrigin } from '../systems/viewport.ts';

type TiledObject = Phaser.Types.Tilemaps.TiledObject & { class?: string };

type Mover = Phaser.Types.Physics.Arcade.ImageWithDynamicBody & {
  path: { sx: number; sy: number; dx: number; dy: number; len: number; speed: number; dir: number };
};

export type HudData = {
  book: Book;
  total: number;
  lives: number;
  collected: number;
  /** ao remontar a HUD (tela redimensionada), reabre o painel que estava aberto */
  state?: 'playing' | 'paused' | 'over';
};

export class GameScene extends Phaser.Scene {
  private book!: Book;
  private fox!: Fox;
  private movers: Mover[] = [];
  private riding: Mover | null = null;
  private total = 0;
  private collected = 0;
  private lives = LIVES;
  private respawn = { x: 0, bottom: 0 };
  private dying = false;
  private finished = false;
  private exit!: Phaser.Physics.Arcade.Sprite;
  private exitOpen = false;
  private lockedToastAt = 0;
  private sparks!: Phaser.GameObjects.Particles.ParticleEmitter;
  private bg: {
    sky: Phaser.GameObjects.Image;
    far: Phaser.GameObjects.TileSprite;
    near: Phaser.GameObjects.TileSprite;
    clouds: Phaser.GameObjects.TileSprite;
  } | null = null;
  private mapHeight = 0;

  constructor() {
    super('Game');
  }

  init(data: { bookId: string }) {
    this.book = getBook(data.bookId);
    this.movers = [];
    this.riding = null;
    this.collected = 0;
    this.lives = LIVES;
    this.dying = false;
    this.finished = false;
    this.exitOpen = false;
    this.lockedToastAt = 0;
    touch.reset();
  }

  create() {
    this.physics.resume(); // pode ter ficado pausada pelo game over anterior
    const map = this.make.tilemap({ key: `map-${this.book.id}` });
    const tiles = map.addTilesetImage('tiles', 'tiles')!;
    this.mapHeight = map.heightInPixels;
    this.makeBackground();

    map.createLayer('decor', tiles);
    const ground = map.createLayer('ground', tiles)!;
    ground.setCollisionByExclusion([-1]);
    const planks = map.createLayer('platforms', tiles)!;
    planks.setCollisionByExclusion([-1]);
    // tábuas são "one-way": dá pra pular através delas por baixo e pousar em cima
    planks.forEachTile((t) => {
      if (t.index < 0) return;
      t.setCollision(false, false, true, false, false);
      t.faceTop = true;
      t.faceBottom = t.faceLeft = t.faceRight = false;
    });

    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels + 200);
    this.physics.world.setBoundsCollision(true, true, false, false);

    const spikes = this.physics.add.staticGroup();
    const pages = this.physics.add.group({ allowGravity: false });
    const checkpoints = this.physics.add.staticGroup();
    const movers = this.physics.add.group({ allowGravity: false, immovable: true });
    let spawn: TiledObject | null = null;

    const objects = map.getObjectLayer('objects')?.objects ?? [];
    for (const o of objects as TiledObject[]) {
      const kind = o.type || o.class || o.name;
      const x = o.x ?? 0;
      const y = o.y ?? 0;
      const w = o.width ?? 16;
      const h = o.height ?? 16;
      switch (kind) {
        case 'spawn':
          spawn = o;
          break;
        case 'spike': {
          const s = spikes.create(x + 8, y + 8, 'spike') as Phaser.Physics.Arcade.Sprite;
          (s.body as Phaser.Physics.Arcade.StaticBody).setSize(12, 7).setOffset(2, 9);
          break;
        }
        case 'page': {
          const p = pages.create(x + 8, y + 8, 'page') as Phaser.Physics.Arcade.Sprite;
          p.setDepth(5);
          this.tweens.add({ targets: p, y: p.y - 3, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut', delay: x % 900 });
          break;
        }
        case 'checkpoint': {
          const c = checkpoints.create(x + 8, y + 16, 'checkpoint', 0) as Phaser.Physics.Arcade.Sprite;
          c.setData('bottom', y + h);
          break;
        }
        case 'exit': {
          this.exit = this.physics.add.staticSprite(x + 16, y + 16, 'exit', 0);
          (this.exit.body as Phaser.Physics.Arcade.StaticBody).setSize(20, 28);
          break;
        }
        case 'platform': {
          const m = movers.create(x + w / 2, y + 8, 'platform') as Mover;
          m.body.setSize(48, 10, false).setOffset(0, 0);
          m.body.checkCollision.down = m.body.checkCollision.left = m.body.checkCollision.right = false;
          const dx = Number(this.prop(o, 'dx') ?? 0);
          const dy = Number(this.prop(o, 'dy') ?? 0);
          m.path = { sx: m.x, sy: m.y, dx, dy, len: Math.hypot(dx, dy) || 1, speed: Number(this.prop(o, 'speed') ?? 40), dir: 1 };
          this.movers.push(m);
          break;
        }
      }
    }

    this.total = pages.getLength();
    const expected = pagesToCollect(this.book);
    if (this.total !== expected) {
      console.warn(`[readerun] ${this.book.map}.json tem ${this.total} páginas; pelo tamanho do livro seriam ${expected}.`);
    }
    if (!spawn || !this.exit) throw new Error(`Mapa ${this.book.map}.json precisa de "spawn" e "exit".`);

    this.respawn = { x: (spawn.x ?? 0) + 8, bottom: (spawn.y ?? 0) + (spawn.height ?? 32) };
    this.fox = new Fox(this, 0, 0);
    this.fox.setCollideWorldBounds(true);
    this.fox.placeAt(this.respawn.x, this.respawn.bottom);

    this.physics.add.collider(this.fox, ground);
    this.physics.add.collider(this.fox, planks);
    this.physics.add.collider(this.fox, movers, (_f, m) => {
      if (this.fox.body.touching.down) this.riding = m as Mover;
    });
    this.physics.add.overlap(this.fox, spikes, () => this.die());
    this.physics.add.overlap(this.fox, pages, (_f, p) => this.collect(p as Phaser.Physics.Arcade.Sprite));
    this.physics.add.overlap(this.fox, checkpoints, (_f, c) => this.reachCheckpoint(c as Phaser.Physics.Arcade.Sprite));
    this.physics.add.overlap(this.fox, this.exit, () => this.reachExit());

    this.sparks = this.add.particles(0, 0, 'spark', {
      speed: { min: 30, max: 90 },
      lifespan: 500,
      scale: { start: 1, end: 0 },
      gravityY: 120,
      emitting: false,
    });
    this.sparks.setDepth(20);

    const cam = this.cameras.main;
    applyView(cam);
    // tela redimensionada/girada: só reajusta câmera e fundo, a tentativa continua
    onViewChanged(this, () => {
      applyView(cam);
      this.layoutBackground();
    });
    cam.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    cam.startFollow(this.fox, true, 0.12, 0.12);
    cam.setDeadzone(40, 60);
    cam.fadeIn(300);

    music.play([0, 5, -3, 2, 7][BOOKS.indexOf(this.book) % 5]);
    this.scene.launch('Hud', this.hudSnapshot());
    if (!this.sys.game.device.input.touch) {
      this.time.delayedCall(500, () => this.events.emit('hud:toast', 'SETAS mover   ESPAÇO pular   P pausar'));
    }
  }

  update(_time: number, deltaMs: number) {
    const dt = Math.min(deltaMs, 50) / 1000;
    // carona: a raposa acompanha o deslocamento horizontal da plataforma em que está
    if (this.riding) this.fox.x += this.riding.body.deltaX();
    this.riding = null;
    this.fox.update(dt);
    if (!this.dying && this.fox.y > this.mapHeight + 24) this.die();

    for (const m of this.movers) {
      const p = m.path;
      const along = ((m.x - p.sx) * p.dx + (m.y - p.sy) * p.dy) / p.len;
      if (along >= p.len) p.dir = -1;
      else if (along <= 0) p.dir = 1;
      m.setVelocity((p.dx / p.len) * p.speed * p.dir, (p.dy / p.len) * p.speed * p.dir);
    }

    if (this.bg) {
      const sx = this.cameras.main.scrollX;
      this.bg.far.tilePositionX = sx * 0.15;
      this.bg.near.tilePositionX = sx * 0.35;
      this.bg.clouds.tilePositionX = sx * 0.05 + this.time.now * 0.004;
    }
  }

  /** Estado atual para (re)montar a HUD. */
  hudSnapshot(): HudData {
    return { book: this.book, total: this.total, lives: this.lives, collected: this.collected };
  }

  /** HUD chama ao retomar a pausa, para um toque antigo não virar pulo. */
  resumeInput() {
    this.fox.clearInput();
  }

  private prop(o: TiledObject, name: string) {
    return (o.properties as { name: string; value: unknown }[] | undefined)?.find((p) => p.name === name)?.value;
  }

  private collect(page: Phaser.Physics.Arcade.Sprite) {
    if (this.dying || !page.body?.enable) return;
    page.disableBody(false, false);
    this.tweens.killTweensOf(page);
    this.tweens.add({ targets: page, y: page.y - 16, alpha: 0, scale: 1.6, duration: 300, onComplete: () => page.destroy() });
    this.sparks.explode(10, page.x, page.y);
    this.collected++;
    sfx.page();
    this.events.emit('hud:pages', this.collected, this.total);
    if (this.collected === this.total) this.openExit();
  }

  private openExit() {
    this.exitOpen = true;
    this.exit.setFrame(1);
    const glow = this.add.ellipse(this.exit.x, this.exit.y - 6, 34, 22, 0xfff3b0, 0.35).setDepth(this.exit.depth - 1);
    this.tweens.add({ targets: glow, scale: 1.25, alpha: 0.15, duration: 700, yoyo: true, repeat: -1 });
    sfx.unlock();
    this.events.emit('hud:toast', 'Todas as páginas! Leve-as até o livro.');
  }

  private reachCheckpoint(cp: Phaser.Physics.Arcade.Sprite) {
    if (this.dying || cp.getData('active')) return;
    cp.setData('active', true).setFrame(1);
    this.respawn = { x: cp.x, bottom: cp.getData('bottom') };
    sfx.checkpoint();
    this.sparks.explode(8, cp.x + 4, cp.y - 8);
  }

  private reachExit() {
    if (this.dying || this.finished) return;
    if (this.exitOpen) return this.finish();
    if (this.time.now < this.lockedToastAt) return;
    this.lockedToastAt = this.time.now + 2500;
    const missing = this.total - this.collected;
    sfx.locked();
    this.events.emit('hud:toast', missing === 1 ? 'Falta 1 página!' : `Faltam ${missing} páginas!`);
  }

  private die() {
    if (this.dying || this.finished) return;
    this.dying = true;
    this.lives--;
    this.events.emit('hud:lives', this.lives);
    sfx.hurt();
    this.cameras.main.shake(160, 0.006);
    this.fox.frozen = true;
    this.fox.play('fox-hurt');
    this.fox.body.checkCollision.none = true;
    this.fox.setVelocity(0, -220);

    this.time.delayedCall(900, () => {
      if (this.lives <= 0) return this.gameOver();
      this.fox.body.checkCollision.none = false;
      this.fox.placeAt(this.respawn.x, this.respawn.bottom);
      this.fox.frozen = false;
      this.dying = false;
      this.tweens.add({ targets: this.fox, alpha: 0.3, duration: 90, yoyo: true, repeat: 3, onComplete: () => this.fox.setAlpha(1) });
    });
  }

  private gameOver() {
    music.stop();
    sfx.gameOver();
    this.physics.pause();
    this.events.emit('hud:gameover');
  }

  private finish() {
    this.finished = true;
    this.fox.frozen = true;
    this.fox.setVelocityX(0);
    this.fox.play('fox-idle');
    save.complete(this.book.id);
    music.stop();
    sfx.win();
    this.events.emit('hud:finish');
    this.sparks.explode(30, this.exit.x, this.exit.y - 8);
    this.time.delayedCall(1300, () => {
      this.cameras.main.fadeOut(400, 29, 21, 48);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.stop('Hud');
        this.scene.start('Reveal', { bookId: this.book.id, replay: false });
      });
    });
  }

  private makeBackground() {
    const t = this.book.theme;
    const key = (k: string) => `${k}-${this.book.id}`;
    if (!this.textures.exists(key('sky'))) {
      // generateTexture desenha em canvas, que ignora fillGradientStyle: o céu usa gradiente nativo
      const sky = this.textures.createCanvas(key('sky'), WIDTH, HEIGHT)!;
      const ctx = sky.getContext();
      const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
      grad.addColorStop(0, t.skyTop);
      grad.addColorStop(1, t.skyBottom);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      sky.refresh();

      const g = this.make.graphics({}, false);

      // morros periódicos em 480px para a TileSprite emendar sem costura
      const hills = (k: string, color: string, base: number, waves: [number, number, number][], trees: boolean) => {
        g.clear();
        g.fillStyle(hexColor(color), 1);
        const yAt = (x: number) => base + waves.reduce((a, [amp, f, ph]) => a + amp * Math.sin((Math.PI * 2 * f * x) / WIDTH + ph), 0);
        for (let x = 0; x < WIDTH; x++) g.fillRect(x, Math.round(yAt(x)), 1, HEIGHT);
        if (trees) {
          for (let i = 0; i < 9; i++) {
            const x = 20 + i * 53 + ((i * 37) % 19);
            const y = Math.round(yAt(x));
            const s = 6 + ((i * 7) % 5);
            g.fillTriangle(x - s, y + 2, x + s, y + 2, x, y - s * 2.6);
            g.fillRect(x - 1, y, 2, 6);
          }
        }
        g.generateTexture(key(k), WIDTH, HEIGHT);
      };
      hills('far', t.hillsFar, 150, [[16, 2, 0], [9, 5, 1]], false);
      hills('near', t.hillsNear, 190, [[12, 3, 2], [6, 7, 0]], true);

      g.clear();
      g.fillStyle(0xffffff, 0.55);
      for (const [cx, cy, s] of [
        [40, 40, 1],
        [190, 70, 0.7],
        [330, 30, 1.2],
        [420, 85, 0.8],
      ]) {
        g.fillRect(cx, cy, 34 * s, 7 * s);
        g.fillRect(cx + 6 * s, cy - 5 * s, 18 * s, 6 * s);
      }
      g.generateTexture(key('clouds'), WIDTH, 120);
      g.destroy();
    }
    this.bg = {
      sky: this.add.image(0, 0, key('sky')).setOrigin(0).setScrollFactor(0).setDepth(-10),
      clouds: this.add.tileSprite(0, 0, MAX_WIDTH, 120, key('clouds')).setOrigin(0).setScrollFactor(0).setDepth(-9),
      far: this.add.tileSprite(0, 0, MAX_WIDTH, HEIGHT, key('far')).setOrigin(0).setScrollFactor(0).setDepth(-8),
      near: this.add.tileSprite(0, 0, MAX_WIDTH, HEIGHT, key('near')).setOrigin(0).setScrollFactor(0).setDepth(-7),
    };
    this.layoutBackground();
  }

  /**
   * O fundo já nasce com a largura máxima (o que sobra fica fora da tela); aqui só
   * é reposicionado. Objetos com scrollFactor 0 são escalados em torno do centro
   * da câmera, por isso o deslocamento de screenOrigin().
   */
  private layoutBackground() {
    if (!this.bg) return;
    const o = screenOrigin();
    this.bg.sky.setPosition(o.x, o.y).setDisplaySize(MAX_WIDTH, HEIGHT);
    for (const t of [this.bg.clouds, this.bg.far, this.bg.near]) t.setPosition(o.x, o.y);
  }
}
