const KEY = 'readerun:save:v1';

type SaveData = {
  completed: string[];
  muted: boolean;
};

const DEFAULTS: SaveData = { completed: [], muted: false };

function load(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw);
    return {
      completed: Array.isArray(parsed.completed) ? parsed.completed.filter((x: unknown) => typeof x === 'string') : [],
      muted: parsed.muted === true,
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
};
