# Contrato: módulo `viewport` e reação a redimensionamento

## `src/systems/viewport.ts`

```ts
export type Insets = { left: number; right: number; top: number; bottom: number };

export type View = {
  dpr: number;
  canvasWidth: number;
  canvasHeight: number;
  zoom: number;        // px do canvas por unidade lógica
  width: number;       // L, 480..630
  height: number;      // 270
  x: number;           // retângulo da área de jogo no canvas
  y: number;
  viewWidth: number;
  viewHeight: number;
  safe: Insets;        // unidades lógicas
};

/** Estado atual (somente leitura para as cenas). */
export const view: Readonly<View>;

/** Recalcula a partir da janela; chamado por main.ts. Retorna true se algo mudou. */
export function measureView(): boolean;

/**
 * Aplica viewport + zoom numa câmera.
 * Com `center = true` (cenas estáticas) também centraliza em (L/2, 135),
 * mostrando exatamente a área lógica 0..L × 0..270.
 */
export function applyView(cam: Phaser.Cameras.Scene2D.Camera, center?: boolean): void;

/** Deslocamento para objetos com scrollFactor 0 encostarem no canto superior esquerdo. */
export function screenOrigin(): { x: number; y: number }; // { L·(Z−1)/2, 270·(Z−1)/2 }
```

## Evento `view:changed`

- **Emissor**: `game.events`, emitido por `main.ts` depois de `game.scale.resize()` (debounce de 100 ms).
- **Argumento**: nenhum; leia `view`.
- **Assinantes** (todos removem o listener no `shutdown` da cena):

| Cena | Reação |
|---|---|
| `Game` | `applyView(câmera)`; ajusta largura e posição do fundo; **não reinicia** |
| `Hud` | `scene.restart(dadosAtuais)` |
| `Menu` | `scene.restart({ bookId: selecionado })` |
| `Reveal` | `scene.restart({ bookId, replay: true })` |

## Dados de reinício da HUD (`HudData`, amplia o da 001)

```ts
type HudData = {
  book: Book;
  total: number;
  lives: number;
  collected: number;                       // novo: páginas já coletadas
  state?: 'playing' | 'paused' | 'over';   // novo: reabre o painel certo sem pausar de novo
};
```

`GameScene` passa a expor `hudSnapshot(): HudData` para a HUD obter o estado atual.

## Textos

`ui.text()` define `resolution: view.zoom`. Textos criados antes de uma mudança de zoom só existem em cenas que reiniciam (Menu, HUD, Revelação), então não há texto com resolução desatualizada.
