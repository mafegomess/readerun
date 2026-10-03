const KEY = 'readerun:save:v1';

export type FontStyle = 'pixel' | 'legivel';

type SaveData = {
  completed: string[];
  muted: boolean;
  /** dica "Adicionar à Tela de Início" do iPhone já fechada */
  fullscreenHintSeen: boolean;
  /** 0–10; 0 = sem música */
  musicVolume: number;
  /** 0–10; 0 = sem efeitos */
  sfxVolume: number;
  font: FontStyle;
};

const DEFAULTS: SaveData = { completed: [], muted: false, fullscreenHintSeen: false, musicVolume: 7, sfxVolume: 8, font: 'pixel' };

const volume = (v: unknown, fallback: number) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(10, Math.max(0, Math.round(v))) : fallback;

function load(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw);
    return {
      completed: Array.isArray(parsed.completed) ? parsed.completed.filter((x: unknown) => typeof x === 'string') : [],
      muted: parsed.muted === true,
      fullscreenHintSeen: parsed.fullscreenHintSeen === true,
      musicVolume: volume(parsed.musicVolume, DEFAULTS.musicVolume),
      sfxVolume: volume(parsed.sfxVolume, DEFAULTS.sfxVolume),
      font: parsed.font === 'legivel' ? 'legivel' : 'pixel',
    };
  } catch {
    return { ...DEFAULTS };
  }
}

const state = load();

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // modo privado ou armazenamento bloqueado: o jogo segue sem salvar
  }
}

export const save = {
  isCompleted: (bookId: string) => state.completed.includes(bookId),
  complete(bookId: string) {
    if (!state.completed.includes(bookId)) {
      state.completed.push(bookId);
      persist();
    }
  },
  get muted() {
    return state.muted;
  },
  set muted(v: boolean) {
    state.muted = v;
    persist();
  },
  get fullscreenHintSeen() {
    return state.fullscreenHintSeen;
  },
  set fullscreenHintSeen(v: boolean) {
    state.fullscreenHintSeen = v;
    persist();
  },
  get musicVolume() {
    return state.musicVolume;
  },
  set musicVolume(v: number) {
    state.musicVolume = volume(v, state.musicVolume);
    persist();
  },
  get sfxVolume() {
    return state.sfxVolume;
  },
  set sfxVolume(v: number) {
    state.sfxVolume = volume(v, state.sfxVolume);
    persist();
  },
  get font(): FontStyle {
    return state.font;
  },
  set font(v: FontStyle) {
    state.font = v === 'legivel' ? 'legivel' : 'pixel';
    persist();
  },
};
