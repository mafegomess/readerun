import Phaser from 'phaser';
import { PHYSICS } from '../config.ts';
import { sfx } from './audio.ts';
import { touch } from './controls.ts';

const ANIM_AIR_GRACE = 0.06;

type Keys = Record<'left' | 'right' | 'a' | 'd' | 'up' | 'w' | 'space' | 'z', Phaser.Input.Keyboard.Key>;

export class Fox extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;
  private keys: Keys;
  private coyote = 0;
  private buffer = 0;
  private jumping = false;
  private touchJumpWas = false;
  /** tempo sem chão, para a animação não piscar em frações de segundo no ar */
  private airTime = 0;
  private wasAnimGround = true;
  frozen = false;
  /** apoiada numa plataforma móvel (marcado pela GameScene a cada passo de física) */
  supported = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'fox', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setSize(14, 20).setOffset(9, 11);
    this.body.setMaxVelocityY(PHYSICS.maxFall);
    this.setDepth(10);
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = scene.input.keyboard!.addKeys({
      left: K.LEFT,
      right: K.RIGHT,
      a: K.A,
      d: K.D,
      up: K.UP,
      w: K.W,
      space: K.SPACE,
      z: K.Z,
    }) as Keys;
  }

  /** Coloca a raposa de pé com os pés em `bottom`. */
  placeAt(x: number, bottom: number) {
    this.body.reset(x, bottom - 15);
    this.setVelocity(0, 0);
    this.buffer = 0;
    this.coyote = 0;
    this.jumping = false;
    this.airTime = 0;
    this.wasAnimGround = true;
    this.supported = false;
    this.touchJumpWas = touch.jump;
  }

  clearInput() {
    this.buffer = 0;
    this.touchJumpWas = touch.jump;
    for (const k of Object.values(this.keys)) k.reset();
  }

  update(dt: number) {
    if (this.frozen) return;
    const k = this.keys;
    const left = k.left.isDown || k.a.isDown || touch.left;
    const right = k.right.isDown || k.d.isDown || touch.right;
    const jumpHeld = k.up.isDown || k.w.isDown || k.space.isDown || k.z.isDown || touch.jump;
    const JD = Phaser.Input.Keyboard.JustDown;
    const jumpPressed = JD(k.up) || JD(k.w) || JD(k.space) || JD(k.z) || (touch.jump && !this.touchJumpWas);
    this.touchJumpWas = touch.jump;

    const onGround = this.body.blocked.down || this.body.touching.down || this.supported;
    this.airTime = onGround ? 0 : this.airTime + dt;
    this.coyote = onGround ? PHYSICS.coyoteTime : Math.max(0, this.coyote - dt);
    this.buffer = jumpPressed ? PHYSICS.jumpBuffer : Math.max(0, this.buffer - dt);

    // aceleração suave até a velocidade alvo
    const dir = (right ? 1 : 0) - (left ? 1 : 0);
    const target = dir * PHYSICS.runSpeed;
    const accel = onGround ? PHYSICS.groundAccel : PHYSICS.airAccel;
    const vx = this.body.velocity.x + (target - this.body.velocity.x) * Math.min(1, accel * dt);
    this.setVelocityX(Math.abs(vx) < 1 ? 0 : vx);
    if (dir !== 0) this.setFlipX(dir < 0);

    if (this.buffer > 0 && this.coyote > 0) {
      this.setVelocityY(-PHYSICS.jumpVelocity);
      this.buffer = 0;
      this.coyote = 0;
      this.jumping = true;
      sfx.jump();
    }
    // soltar o botão cedo = pulo mais baixo
    if (this.jumping && !jumpHeld && this.body.velocity.y < 0) {
      this.setVelocityY(this.body.velocity.y * 0.45);
      this.jumping = false;
    }
    if (this.body.velocity.y >= 0) this.jumping = false;

    // a animação só considera "no ar" depois de ~60 ms sem chão (ou logo, se estiver subindo)
    const rising = this.body.velocity.y < 0;
    const animGround = onGround || (!rising && this.airTime < ANIM_AIR_GRACE);
    const landed = animGround && !this.wasAnimGround;
    this.wasAnimGround = animGround;
    this.pickAnimation(animGround, rising, landed, dir);
  }

  /** Só escolhe a animação: o pouso nunca atrasa o controle (spec 003, RF-011). */
  private pickAnimation(animGround: boolean, rising: boolean, landed: boolean, dir: number) {
    if (!animGround) {
      this.play(rising ? 'fox-jump' : 'fox-fall', true);
      return;
    }
    if (dir !== 0) {
      this.play('fox-run', true);
      return;
    }
    const current = this.anims.currentAnim?.key;
    const busy = this.anims.isPlaying && current === 'fox-land';
    if (landed) this.play('fox-land');
    else if (!busy && current !== 'fox-idle') this.play('fox-idle');
  }
}
