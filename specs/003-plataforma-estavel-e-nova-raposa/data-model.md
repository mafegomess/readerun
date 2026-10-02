# Modelo de dados: Plataforma móvel sem tremida e novo visual da raposa

## Folha da raposa (`public/assets/fox.png`)

- Quadros de 32×32, em uma linha: 27 quadros, 864×32 px (ajustado nas revisões da prévia; o plano previa 19).
- Pés na linha 30; tronco centrado em x ≈ 16 (o espelhamento continua alinhado ao corpo de colisão).
- Corpo de colisão inalterado: 14×20, deslocamento (9, 11).

### Layout (`src/data/foxFrames.ts`)

```ts
export const FOX_FRAMES = {
  idle: [0 … 15],      // ciclo da cauda (16 posições suavizadas), corpo acompanhando
  run: [16 … 21],      // trote em 6 quadros
  jump: [22],
  fall: [23],
  land: [24, 25],
  hurt: [26],
} as const;
export const FOX_FRAME_COUNT = 27;
```

Fonte única da ordem: `scripts/gen-assets.ts` desenha os quadros nessa ordem e a `BootScene` cria as animações a partir dela.

## Paleta da raposa

Ver [research.md](./research.md), D4. Constantes em `scripts/gen-assets.ts` (`FOX_*`).

## Sem mudanças

Mapas, `books.json`, save e física (`src/config.ts`).
