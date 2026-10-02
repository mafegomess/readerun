# Readerun

Jogo de plataforma 2D no navegador: uma raposa recupera páginas perdidas de livros. Cada fase é um livro; ao juntar todas as páginas, o livro é revelado com uma recomendação.

Phaser 3 + TypeScript + Vite, site estático (Vercel). Progresso salvo no `localStorage`.

## Rodando

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # confere os mapas, checa tipos e gera dist/
```

Controles: setas/A-D para andar, espaço/W/Z/↑ para pular (segurar pula mais alto), P/Esc para pausar. No celular aparecem botões na tela (jogue com o aparelho deitado).

## Regras

- 3 vidas por tentativa. Ao perder uma vida, volta ao último marcador (checkpoint) sem perder as páginas já pegas.
- Sem vidas: fim de jogo, a fase recomeça do zero.
- O livro só é revelado com 100% das páginas; antes disso, a saída fica trancada.
- **Páginas por fase são proporcionais ao livro real**: 1 a cada 20 páginas, entre 5 e 20 (`src/data/pageRule.ts`).

## Adicionando ou trocando livros

1. Edite `src/data/books.json` (título, autor, ano, `bookPages`, sinopse, cores do tema). O `id` também é o nome do mapa (`map`).
2. Gere o mapa inicial: `npm run gen:maps -- <id>`. O tamanho da fase segue o número de páginas.
3. (Opcional) Ajuste a fase no [Tiled](https://www.mapeditor.org/): abra `public/maps/<id>.json`.
4. `npm run check:maps` confere se o número de páginas bate com o livro (isso também roda no build).

`npm run gen:maps` sem argumentos só cria mapas que ainda não existem. `--force` sobrescreve todos e **apaga edições feitas no Tiled**.

### Editando no Tiled

- Camadas de tiles: `ground` (chão sólido), `platforms` (tábuas que dá para atravessar por baixo) e `decor` (enfeites sem colisão).
- Camada de objetos `objects`, usando o campo **Class/Type** do objeto:
  - `spawn` (1 por mapa), `exit` (1 por mapa, 32×32), `page`, `checkpoint`, `spike`
  - `platform`: plataforma móvel de 48×16 com propriedades `dx`/`dy` (percurso em px, por exemplo `dy = -80` sobe 5 tiles) e `speed` (px/s).
- Física: o pulo alcança cerca de 4 tiles de altura e 5 de distância.

## Arte e som

Toda a pixel art é gerada por código em `scripts/gen-assets.ts` (`npm run gen:assets` recria `public/assets/*.png`). Música e efeitos são sintetizados com Web Audio (`src/systems/audio.ts`). Para trocar por arte própria, basta substituir os PNGs mantendo tamanhos e quadros.

## Deploy na Vercel

O repositório já tem `vercel.json`. Escolha uma opção:

- `npx vercel` (login na primeira vez) e depois `npx vercel --prod`; ou
- suba o repo para o GitHub e importe em vercel.com/new: o preset Vite é detectado.
