# Readerun

Jogo de plataforma 2D no navegador: uma raposa recupera páginas perdidas de livros. Cada fase é um livro; ao juntar todas as páginas, o livro é revelado com uma recomendação.

Phaser 3 + TypeScript + Vite, site estático (Vercel). Progresso salvo no `localStorage`.

## Rodando

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # confere os mapas, checa tipos e gera dist/
```

O jogo abre no menu inicial: **Jogar** (escolha do livro), **Opções** (volume da música e dos efeitos, fonte pixelada ou legível, tudo salvo no navegador) e **Créditos**.

Controles: setas/A-D para andar, espaço/W/Z/↑ para pular (segurar pula mais alto), P/Esc para pausar. No celular aparecem botões na tela (jogue com o aparelho deitado).

### Tela e celular

- O jogo é desenhado na resolução real da tela (até 2× a densidade) e se adapta a qualquer janela. Telas de 16:9 a 21:9 são preenchidas por inteiro, mostrando mais cenário nas laterais; fora dessa faixa sobram faixas nas bordas.
- **Android (Chrome)**: o jogo entra em tela cheia no primeiro toque e trava na horizontal.
- **iPhone (Safari)**: o Safari não permite tela cheia para páginas. Use Compartilhar → Adicionar à Tela de Início e abra pelo ícone: o jogo abre em tela cheia (o menu mostra essa dica uma vez).
- HUD e botões de toque se afastam do notch e dos cantos arredondados.

## Regras

- 3 vidas por tentativa. Ao perder uma vida, volta ao último marcador (checkpoint) sem perder as páginas já pegas.
- Sem vidas: fim de jogo, a fase recomeça do zero.
- O livro só é revelado com 100% das páginas; antes disso, a saída fica trancada.
- **Páginas por fase são proporcionais ao livro real**: 1 a cada 20 páginas, entre 5 e 50 (`src/data/pageRule.ts`). Livros longos geram fases longas e mais difíceis.

## Adicionando ou trocando livros

1. Edite `src/data/books.json`: título, autor, ano, `bookPages`, sinopse, cores do tema, `scenery` (cenário) e `level` (receita da fase). O `id` também é o nome do mapa (`map`).
2. Gere o mapa inicial: `npm run gen:maps -- <id>`. O tamanho da fase segue o número de páginas.
3. (Opcional) Ajuste a fase no [Tiled](https://www.mapeditor.org/): abra `public/maps/<id>.json`.
4. `npm run check:maps` confere páginas, início e saída; `npm run check:levels` confere que a fase é completável (saída e todas as páginas alcançáveis, e de cada página dá para voltar). Os dois rodam no build.

### Cenários e receitas de fase

- **`scenery`**: um de `rio-antigo`, `vila-colonial`, `praia`, `cidade-pequena`, `floresta`, `costa-colonial`, `castelo`, `favela`. Define o tileset (`tiles-<scenery>.png`), os enfeites e o desenho do fundo (`src/systems/scenery.ts`). As cores continuam em `theme`.
- **`level.weights`**: peso de cada desafio (0 desliga): `gap`, `stepUp`, `stepDown`, `spikes`, `floating`, `movingH` (plataforma móvel), `lift` (elevador), `falling` (plataforma que cai), `springWall` (parede com mola), `spikeTrap` (espinho móvel).
- **`level.formats`**: peso de cada trecho especial: `ceiling` (corredor com teto), `climb` (subida em andares) e `branch` (caminho alternativo com página).

`npm run gen:maps` sem argumentos só cria mapas que ainda não existem. `--force` sobrescreve todos e **apaga edições feitas no Tiled**.

### Editando no Tiled

- Tileset `tiles` com 21 tiles (7×3): topo do chão, tábuas, corpo, enfeites, teto de corredor (15–18) e enfeites extras (19–21). O mapa aponta para o PNG do cenário do livro.
- Camadas de tiles: `ground` (chão e tetos sólidos), `platforms` (tábuas que dá para atravessar por baixo) e `decor` (enfeites sem colisão).
- Camada de objetos `objects`, usando o campo **Class/Type** do objeto:
  - `spawn` (1 por mapa), `exit` (1 por mapa, 32×32), `page`, `checkpoint`, `spike`
  - `platform`: plataforma móvel de 48×16 com propriedades `dx`/`dy` (percurso em px, por exemplo `dy = -80` sobe 5 tiles) e `speed` (px/s).
  - `falling`: plataforma de 48×16 que treme, cai pouco depois de pisada e volta ao lugar.
  - `spring`: mola de 16×16 apoiada no chão; lança a raposa cerca de 8 tiles para cima.
  - `spikeTrap`: espinho móvel de 16×16, com `period` (s, padrão 2,4) e `offset` (s); só mata quando está em pé.
- Física: o pulo alcança cerca de 4 tiles de altura e 5 de distância; a mola, cerca de 8 tiles. O `check:levels` usa esses limites.

## Arte e som

Toda a pixel art é gerada por código em `scripts/gen-assets.ts` (`npm run gen:assets` recria `public/assets/*.png`; `-- --out <pasta>` gera em outro lugar, para prévias). Cada cenário tem seu tileset e seus enfeites, e os obstáculos (`falling.png`, `spring.png`, `spiketrap.png`) também saem daí. A raposa tem 27 quadros (cauda balançando com o corpo acompanhando, trote, pulo, queda, pouso e dano), na ordem definida em `src/data/foxFrames.ts`, que também alimenta as animações do jogo. Música e efeitos são sintetizados com Web Audio (`src/systems/audio.ts`). Para trocar por arte própria, basta substituir os PNGs mantendo tamanhos e quadros.

## Deploy na Vercel

O repositório já tem `vercel.json`. Escolha uma opção:

- `npx vercel` (login na primeira vez) e depois `npx vercel --prod`; ou
- suba o repo para o GitHub e importe em vercel.com/new: o preset Vite é detectado.
