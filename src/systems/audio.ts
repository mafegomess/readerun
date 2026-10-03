import { save } from './save.ts';

/**
 * Efeitos e música sintetizados com Web Audio, sem arquivos de som.
 * O navegador só libera áudio depois de um gesto do usuário, então o
 * AudioContext é criado no primeiro toque/tecla (ver unlock()).
 */

type Wave = OscillatorType;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let musicGain: GainNode | null = null;
let sfxGain: GainNode | null = null;

// volumes das Opções (0–10) viram ganho; o mudo geral age só no master
const MASTER_ON = 0.6;
const MUSIC_BASE = 0.35;
const musicLevel = () => (MUSIC_BASE * save.musicVolume) / 10;
const sfxLevel = () => save.sfxVolume / 10;

let musicTimer: number | undefined;
let nextNoteTime = 0;
let step = 0;
let musicRoot = 0;

function unlock() {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = save.muted ? 0 : MASTER_ON;
    master.connect(ctx.destination);
    musicGain = ctx.createGain();
    musicGain.gain.value = musicLevel();
    musicGain.connect(master);
    sfxGain = ctx.createGain();
    sfxGain.gain.value = sfxLevel();
    sfxGain.connect(master);
  }
  if (ctx.state === 'suspended') void ctx.resume();
}

for (const ev of ['pointerdown', 'keydown', 'touchend']) {
  window.addEventListener(ev, unlock, { passive: true });
}

function note(freq: number, start: number, dur: number, wave: Wave, vol: number, out?: AudioNode, slideTo?: number) {
  if (!ctx || !master || !sfxGain) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = wave;
  osc.frequency.setValueAtTime(freq, start);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + dur);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(vol, start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  // sem saída definida é efeito sonoro: passa pelo volume de efeitos
  osc.connect(g).connect(out ?? sfxGain);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

function seq(freqs: number[], gap: number, dur: number, wave: Wave, vol: number) {
  if (!ctx) return;
  const t = ctx.currentTime;
  freqs.forEach((f, i) => note(f, t + i * gap, dur, wave, vol));
}

const now = () => ctx?.currentTime ?? 0;

export const sfx = {
  jump: () => note(260, now(), 0.14, 'square', 0.08, undefined, 520),
  page: () => seq([880, 1175, 1568], 0.06, 0.12, 'square', 0.07),
  hurt: () => note(320, now(), 0.35, 'sawtooth', 0.1, undefined, 70),
  checkpoint: () => seq([523, 659, 784], 0.08, 0.16, 'triangle', 0.15),
  unlock: () => seq([523, 659, 784, 1047, 1319], 0.07, 0.2, 'triangle', 0.15),
  locked: () => seq([220, 196], 0.1, 0.14, 'square', 0.06),
  win: () => seq([523, 659, 784, 1047, 784, 1047, 1319], 0.11, 0.25, 'triangle', 0.16),
  gameOver: () => seq([392, 330, 262, 196], 0.18, 0.3, 'triangle', 0.15),
  click: () => note(660, now(), 0.06, 'square', 0.05),
  spring: () => note(180, now(), 0.22, 'triangle', 0.14, undefined, 900),
};

// ---------- música ----------

const BPM = 112;
const EIGHTH = 60 / BPM / 2;
// pentatônica: semitons a partir da tônica; -1 = pausa
const MELODY = [0, 4, 7, 9, 7, 4, 2, -1, 0, 2, 4, 7, 9, 12, 9, -1, 7, 9, 7, 4, 2, 4, 0, -1, 2, 4, 2, 0, -3, 0, -1, -1];
const BASS = [0, 0, 7, 7, 5, 5, 7, 7];

const freq = (semi: number) => 220 * Math.pow(2, (musicRoot + semi) / 12);

function schedule() {
  if (!ctx || !musicGain) return;
  // aba em segundo plano atrasa o timer: pula as notas perdidas em vez de tocar todas de uma vez
  if (nextNoteTime < ctx.currentTime - 0.1) nextNoteTime = ctx.currentTime + 0.05;
  while (nextNoteTime < ctx.currentTime + 0.2) {
    const m = MELODY[step % MELODY.length];
    if (m >= 0) note(freq(m) * 2, nextNoteTime, EIGHTH * 0.9, 'square', 0.05, musicGain);
    if (step % 4 === 0) note(freq(BASS[(step / 4) % BASS.length]) / 2, nextNoteTime, EIGHTH * 3.5, 'triangle', 0.12, musicGain);
    nextNoteTime += EIGHTH;
    step++;
  }
}

export const music = {
  /** root: transposição em semitons, para cada livro ter seu "tom". */
  play(root = 0) {
    musicRoot = root;
    if (musicTimer !== undefined) return;
    step = 0;
    nextNoteTime = now() + 0.1;
    musicTimer = window.setInterval(schedule, 50);
  },
  stop() {
    if (musicTimer !== undefined) window.clearInterval(musicTimer);
    musicTimer = undefined;
  },
};

export const audio = {
  get muted() {
    return save.muted;
  },
  toggleMute() {
    save.muted = !save.muted;
    if (master && ctx) master.gain.setTargetAtTime(save.muted ? 0 : MASTER_ON, ctx.currentTime, 0.02);
    return save.muted;
  },
  get musicVolume() {
    return save.musicVolume;
  },
  /** 0–10; não mexe no mudo geral */
  setMusicVolume(v: number) {
    save.musicVolume = v;
    if (musicGain && ctx) musicGain.gain.setTargetAtTime(musicLevel(), ctx.currentTime, 0.02);
  },
  get sfxVolume() {
    return save.sfxVolume;
  },
  /** 0–10; não mexe no mudo geral */
  setSfxVolume(v: number) {
    save.sfxVolume = v;
    if (sfxGain && ctx) sfxGain.gain.setTargetAtTime(sfxLevel(), ctx.currentTime, 0.02);
  },
};
