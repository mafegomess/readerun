# Plano de implementação: Menu inicial, opções, créditos e novos livros

**Feature**: `004-menu-inicial-e-novos-livros` | **Data**: 2026-10-02 | **Spec**: [spec.md](./spec.md)

## Resumo

Três cenas novas: menu inicial com logo em pixel art (orelhas e cauda da raposa nas letras, página de livro), opções e créditos. A estante atual vira a tela "Fases".
- **Opções**: volume de música e de efeitos separados (0–10, sobre um ganho próprio cada) e troca entre a fonte pixelada e a Atkinson Hyperlegible, aplicada pelo helper único de texto, com escala de tamanho. Tudo salvo no navegador.
- **Livros**: Alice sai e entram 6 livros novos, com mapas gerados, sinopses autorais e temas de cor.
- **Regra de páginas**: o máximo vai para 50 (Um Defeito de Cor fica com 48).

**Emenda H5**: cada livro ganha cenário próprio e fase com estrutura própria.
- **Visual**: tileset por cenário, com o mesmo layout 7×3 e uma linha nova de teto; fundo em camadas desenhado por cenário; 3 enfeites por cenário.
- **Fase**: receita por livro em `books.json`; três obstáculos novos (plataforma que cai, mola, espinho móvel); trechos com teto, subidas em andares e caminhos alternativos.
- **Mapas e validação**: todas as 8 fases refeitas; um teste de alcance no build garante que cada fase é completável.

Detalhes em [research.md](./research.md) (D1–D8 e, da emenda, D9–D15).

## Contexto técnico

**Linguagem/versão**: TypeScript strict, Phaser 3.90
**Dependências principais**: nenhuma nova (fonte Atkinson Hyperlegible via Google Fonts, como a atual)
**Armazenamento**: `localStorage` (`readerun:save:v1`) com campos novos opcionais
**Testes/verificação**: `npm run build` (check-maps valida os 8 mapas); navegação e opções no navegador (iframe + `game.step()`); prévia do logo aprovada; fase mais longa conferida como completável
**Plataforma-alvo**: desktop e celular (16:9 a 21:9, notch)
**Restrições**: site estático; física, raposa e mapas atuais intactos
**Escala/escopo**: 3 cenas novas, 6 livros, logo + estante; H5: 8 cenários (tileset + fundo + enfeites), 3 obstáculos, gerador ampliado, 8 mapas refeitos, 1 script de validação

## Verificação da constituição (1.0.1)

| Princípio | Atende? | Observação |
|---|---|---|
| I. Estático e gratuito | ✅ | Fonte via Google Fonts, como a atual; opções no `localStorage` com tolerância a falha |
| II. A leitura no centro | ✅ | Catálogo ampliado; regra proporcional centralizada (máximo 50); títulos continuam ocultos até concluir |
| III. Desktop e celular | ✅ | Telas novas com mouse, teclado e toque, layout na área lógica, notch respeitado |
| IV. Conteúdo orientado a dados | ✅ | Livros só por `books.json` + mapas gerados; check-maps no build |
| V. Arte e som livres de licença | ✅ | Logo gerado por código; capas genéricas; sinopses autorais; fontes OFL creditadas |
| VI. Português do Brasil | ✅ | Textos novos em PT-BR; glifos conferidos nas duas fontes |
| VII. Verificar antes de concluir | ✅ | Build, navegação, opções persistidas; H5: teste automático de alcance (`check-levels`) em toda fase, no build |

*Reavaliação pós-design*: sem violações. A fonte comum opcional emenda o RF-002 da spec 002, que continua valendo como padrão. H5: cenários e obstáculos gerados por código (V), receitas em dados (IV) e alcance validado no build (VII).

## Estrutura afetada

```text
src/scenes/TitleScene.ts      NOVO: logo, raposa animada, Jogar/Opções/Créditos, mudo, dica do iPhone
src/scenes/OptionsScene.ts    NOVO: volumes de música e efeitos, fonte; foco por teclado
src/scenes/CreditsScene.ts    NOVO: créditos roláveis
src/scenes/MenuScene.ts       vira "Fases": título "Escolha um livro", botão Voltar/Esc; sai o logo, o mudo e a dica do iPhone
src/scenes/BootScene.ts       carrega logo.png; inicia Title
src/main.ts                   registra as cenas novas; espera as duas fontes
src/ui.ts                     text() usa a fonte e a escala da opção atual
src/config.ts                 FONTS (pixelada/legível: família, escala)
src/systems/audio.ts          sfxGain; volumes de música/efeitos; aplica opções ao criar o AudioContext
src/systems/save.ts           musicVolume, sfxVolume, font (opcionais, com padrões)
src/style.css                 aviso "Gire o celular" segue a fonte escolhida
index.html                    Atkinson Hyperlegible no link do Google Fonts
src/data/pageRule.ts          MAX_GAME_PAGES = 50
src/data/books.json           sai alice; entram 6 livros
public/maps/*.json            sai alice.json; entram 6 mapas gerados
scripts/gen-assets.ts         logo.png (letras em grade, orelhas, cauda, página)
README.md                     regra de páginas (5 a 50), menu/opções/créditos
specs/001-…/spec.md           nota de emenda: RF-002 (máximo 50) e História 4 (estante vira "Fases")

# emenda H5
src/data/books.json           scenery + level (receita) por livro
src/data/books.ts             tipos Scenery e LevelRecipe
src/systems/scenery.ts        NOVO: fundo em camadas por cenário (periódico em 480 px)
src/scenes/GameScene.ts       tileset por cenário; fundo por cenário; obstáculos falling, spring e spikeTrap; repor plataformas ao voltar ao checkpoint
src/scenes/BootScene.ts       carrega tiles-<scenery>.png e os sprites novos
scripts/gen-assets.ts         8 tilesets 7×3 (com teto), enfeites por cenário, falling.png, spring.png, spiketrap.png
scripts/gen-maps.ts           receitas por livro, trechos novos (teto, andares, alternativo, mola), obstáculos novos, caminho do tileset por cenário; --force para refazer os 8
scripts/check-levels.ts       NOVO: teste de alcance (saída e páginas alcançáveis e com volta), no build
scripts/check-maps.ts         aceita os tipos de objeto novos
public/maps/*.json            8 mapas refeitos
package.json                  build roda check-levels
```

## Fase 0 – Pesquisa

Concluída em [research.md](./research.md): D1 fluxo de telas · D2 logo · D3 fonte comum · D4 áudio · D5 controles das opções · D6 livros, mapas e conteúdo (sinopses e temas) · D7 saves antigos · D8 créditos.

## Fase 1 – Design

- **Modelo de dados**: [data-model.md](./data-model.md) (save com opções, entradas novas de livros, regra).
- **Contratos**: [contracts/options.md](./contracts/options.md) (API de opções, áudio e fonte) e [contracts/navigation.md](./contracts/navigation.md) (cenas, botões, teclas).
- **Roteiro de verificação**: [quickstart.md](./quickstart.md).

### Ordem sugerida (com a emenda H5)

0. Fechar as aprovações pendentes (logo e sinopses).
1. H5 visual: tilesets, enfeites e fundos → **prévia dos 8 cenários para aprovação** (CS-006) → integração.
2. H5 estrutura: obstáculos novos na GameScene → gerador ampliado com receitas → `check-levels` → refazer os 8 mapas → jogar trechos de cada fase.

### Ordem sugerida (original)

1. **Livros (H4)**: independente e de baixo risco; destrava o conteúdo.
2. **Opções (H2)**: base de áudio e fonte, usada pelas telas novas.
3. **Menu inicial (H1)**: prévia do logo → aprovação → cena.
4. **Créditos (H3)**.

## Riscos e complexidade

| Risco / desvio | Por que é necessário | Alternativa mais simples descartada porque |
|---|---|---|
| Escala por fonte em `ui.text()` | a Atkinson a 8 px fica ilegível; sem escala, layouts quebram | ajustar cada tela para cada fonte duplicaria o layout |
| Fase de 48 seções | pedido explícito de manter a proporção | limitar a 20 foi recusado pela pessoa usuária |
| Logo com letras próprias desenhadas por código | identidade ligada à raposa (RF-002) | usar a fonte do jogo com efeitos não remete à raposa |
| Gerador bem mais complexo (H5) | variedade real de estrutura por livro | variar só os pesos não muda o formato das fases |
| Teste de alcance por grafo, não por simulação física (H5) | rápido, determinístico e roda em todo build | bots de física seriam lentos e frágeis |
| 8 tilesets em vez de 1 (H5) | um tema por livro | recolorir o mesmo tileset não muda o "lugar" |
| Livros fora do domínio público | escolha da pessoa usuária | a mitigação (título/autoria + sinopse autoral + capa genérica) segue o princípio V |
