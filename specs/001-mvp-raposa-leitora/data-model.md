# Modelo de dados: MVP – A raposa leitora

## Livro (`src/data/books.json`, array)

| Campo | Tipo | Regra |
|---|---|---|
| `id` | string | único, minúsculas e hífens; usado na chave do mapa e no save |
| `title` | string | exibido só depois de concluído |
| `author` | string | |
| `year` | number | |
| `bookPages` | number | páginas do livro real → `gamePagesFor()` define as páginas da fase |
| `map` | string | nome do arquivo em `public/maps/<map>.json` |
| `synopsis` | string | texto autoral de recomendação; sinopses longas ganham rolagem |
| `theme.skyTop` / `theme.skyBottom` | `#rrggbb` | degradê do céu da fase |
| `theme.hillsFar` / `theme.hillsNear` | `#rrggbb` | morros do parallax |
| `theme.cover` / `theme.coverAccent` | `#rrggbb` | capa ilustrada |

## Progresso salvo (`localStorage["readerun:save:v1"]`)

```json
{ "completed": ["dom-casmurro"], "muted": false }
```

Valores inválidos são descartados na leitura. Mudanças incompatíveis exigem uma nova chave (`v2`) com migração.

## Mapa (`public/maps/<map>.json`, formato JSON do Tiled)

- Tiles de 16×16, altura de 17 tiles; tileset embutido `tiles` (`../assets/tiles.png`, 7×2).
- Camadas de tiles: `decor` (sem colisão), `ground` (sólido), `platforms` (one-way).
- Camada de objetos `objects`; o tipo é lido de `type`, `class` ou `name`, nessa ordem:

| Tipo | Tamanho | Quantidade | Propriedades |
|---|---|---|---|
| `spawn` | 16×32 | exatamente 1 | — |
| `exit` | 32×32 | exatamente 1 | — |
| `page` | 16×16 | `gamePagesFor(bookPages)` | — |
| `checkpoint` | 16×32 | 0+ | — |
| `spike` | 16×16 | 0+ | — |
| `platform` | 48×16 | 0+ | `dx`, `dy` (px, percurso de ida a partir da posição inicial), `speed` (px/s) |

Validado por `scripts/check-maps.ts` (contagem de páginas, spawn, exit, camadas).

## Tentativa (memória da GameScene, não é salva)

`vidas` (começa em 3), `coletadas`, `respawn {x, bottom}`, `exitOpen`, `dying`, `finished`.
