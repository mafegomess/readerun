# Modelo de dados: Menu inicial, opções, créditos e novos livros

## Save (`localStorage["readerun:save:v1"]`)

Campos novos opcionais (saves antigos leem os padrões); sem nova chave.

| Campo | Tipo | Padrão | Regra |
|---|---|---|---|
| `completed` | string[] | `[]` | como antes; ids de livros que saíram (ex.: `alice`) são ignorados |
| `muted` | boolean | `false` | mudo geral (atalho), como antes |
| `fullscreenHintSeen` | boolean | `false` | como antes |
| `musicVolume` | inteiro 0–10 | `7` | 0 = sem música |
| `sfxVolume` | inteiro 0–10 | `8` | 0 = sem efeitos |
| `font` | `'pixel' \| 'legivel'` | `'pixel'` | valor inválido → `'pixel'` |

## Regra de páginas (`src/data/pageRule.ts`)

`gamePagesFor(n) = clamp(round(n / 20), 5, 50)`: `MAX_GAME_PAGES` passa de 20 para 50.

## Livros (`src/data/books.json`)

Mesmo formato da 001. Sai `alice`; entram os 6 de [research.md](./research.md) (D6), com `map` igual ao `id`. Ordem: `dom-casmurro`, `o-alienista`, `capitaes-da-areia`, `o-sol-e-para-todos`, `jogos-vorazes`, `um-defeito-de-cor`, `trono-de-vidro`, `quarto-de-despejo`.

## Livros: campos novos (emenda H5)

| Campo | Tipo | Regra |
|---|---|---|
| `scenery` | `'rio-antigo' \| 'vila-colonial' \| 'praia' \| 'cidade-pequena' \| 'floresta' \| 'costa-colonial' \| 'castelo' \| 'favela'` | define tileset, enfeites e formato do fundo (research D9) |
| `level.weights` | objeto `{ desafio: peso }` | desafios: `gap`, `stepUp`, `stepDown`, `spikes`, `floating`, `movingH`, `lift`, `falling`, `springWall`, `spikeTrap` |
| `level.formats` | objeto `{ formato: peso }` | formatos: `ceiling`, `climb`, `branch` (chance de um trecho especial por seção) |

Pesos 0 desligam o item. A progressão de dificuldade do gerador continua valendo.

## Mapas (Tiled): mudanças (emenda H5)

- Tileset `tiles` com 21 tiles (7×3, margem 1, espaçamento 2); imagem `../assets/tiles-<scenery>.png`. Índices 1–14 iguais aos de hoje; 15–18 = teto (esquerda, meio, direita, única); 19–21 = enfeites extras.
- Objetos novos na camada `objects`:

| Tipo | Tamanho | Propriedades |
|---|---|---|
| `falling` | 48×16 | — |
| `spring` | 16×16 | — |
| `spikeTrap` | 16×16 | `period` (s, padrão 2,4), `offset` (s, padrão 0) |

- Camada de tiles `ground` passa a ter teto (tiles sólidos suspensos) nos corredores.

## Assets novos (emenda H5)

`tiles-<scenery>.png` (8), `falling.png`, `spring.png` (2 quadros), `spiketrap.png` (3 quadros).

## Fontes (`src/config.ts`)

```ts
export const FONTS = {
  pixel:   { family: '"Press Start 2P", monospace', scale: 1 },
  legivel: { family: '"Atkinson Hyperlegible", system-ui, sans-serif', scale: 1.375 },
} as const;
```

## Asset novo

`public/assets/logo.png`: logo "READERUN" em pixel art (tamanho definido na prévia; cabe em ~300×70 unidades lógicas).
