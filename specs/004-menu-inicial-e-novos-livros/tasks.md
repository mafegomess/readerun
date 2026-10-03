# Tarefas: Menu inicial, opções, créditos e novos livros

**Entrada**: documentos em `specs/004-menu-inicial-e-novos-livros/`
**Pré-requisitos**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/options.md](./contracts/options.md), [contracts/navigation.md](./contracts/navigation.md), [quickstart.md](./quickstart.md)

## Formato: `- [ ] T000 [P?] [H?] Descrição com caminho do arquivo`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência)
- **[H1]** menu inicial · **[H2]** opções · **[H3]** créditos · **[H4]** livros

## Fase 1: Preparação

- [x] T001 [P] Adicionar a Atkinson Hyperlegible ao link do Google Fonts em `index.html` e esperar as duas fontes em `src/main.ts` (mesmo limite de 2,5 s)
- [x] T002 [P] `src/systems/save.ts`: campos `musicVolume` (0–10, padrão 7), `sfxVolume` (0–10, padrão 8) e `font` (`'pixel' | 'legivel'`, padrão `'pixel'`), com leitura tolerante e setters persistentes (data-model)

## Fase 2: Fundação (bloqueia H1–H3)

- [x] T003 `src/config.ts` + `src/ui.ts`: `FONTS` (família e escala) e `currentFont()`; `text()` aplica família, tamanho e espaçamento entre linhas escalados (contrato de opções)
- [x] T004 `src/systems/audio.ts`: `sfxGain` no caminho de todos os efeitos; `setMusicVolume`/`setSfxVolume`; ganhos iniciais a partir do save ao criar o `AudioContext`; `toggleMute` continua só no `master` (depende de T002)
- [x] T005 [P] `src/style.css` + `src/main.ts`: aviso "Gire o celular" segue a fonte escolhida (`document.body.dataset.font`) (depende de T002)

**Ponto de controle**: typecheck passa; trocar `save.font` no console e recarregar muda a fonte de todo o jogo

## Fase 3: História 4 – Novos livros (P1)

**Objetivo**: sai Alice; entram 6 livros com fase, páginas proporcionais (máximo 50), sinopse e tema
**Teste independente**: quickstart, passos 7 e 8

- [x] T006 [P] [H4] `src/data/pageRule.ts`: `MAX_GAME_PAGES = 50` e comentário atualizado
- [x] T007 [P] [H4] `src/data/books.json`: remover `alice`; adicionar os 6 livros de research D6 (id, título, autoria, ano, páginas, mapa, sinopse, tema), na ordem do data-model
- [x] T008 [H4] Apagar `public/maps/alice.json` e gerar os 6 mapas com `npm run gen:maps -- <id>` (depende de T006 e T007); conferir com `npm run check:maps`
- [x] T009 [H4] Verificar no navegador: estante com 8 livros em 3 páginas e sem Alice; save com `alice` concluído não quebra; cada fase nova abre com as páginas esperadas (15, 18, 20, 48, 20, 10) e chega à revelação; trechos do começo, meio e fim da fase de 48 seções sem trecho impossível (limites de pulo)
  - Resultado: 8 livros em 3 páginas de estante, sem Alice; save antigo com `alice` concluído abre sem erro; as 6 fases novas chegam à revelação com 15, 18, 20, 48, 20 e 10 páginas (mapas de 309 a 945 tiles).

**Ponto de controle**: catálogo novo jogável

## Fase 4: História 2 – Opções (P1)

**Objetivo**: volumes separados e troca de fonte, salvos
**Teste independente**: quickstart, passos 3 a 5

- [x] T010 [H2] Criar `src/scenes/OptionsScene.ts`: linhas Música (−, barra de 10 blocos, +), Efeitos (idem, tocando `sfx.page()` como exemplo), Fonte (Pixelada/Legível) e Voltar; foco por teclado (↑/↓ linha, ←/→ ajusta, Enter alterna, Esc volta); toque/mouse nos botões; reinicia a si mesma ao trocar a fonte; `applyView` + reinício em `view:changed` (depende de T003 e T004)
- [x] T011 [H2] Verificar no navegador: volumes aplicados na hora e independentes do mudo geral; fonte legível em menu, estante, HUD, avisos, revelação e créditos sem estourar layout; opções mantidas após recarregar; padrões com `localStorage` bloqueado
  - Resultado: teclado ajusta música (7→5) e efeitos (8→0, "sem som"), troca para a fonte legível e grava no save; Atkinson Hyperlegible nítida em opções, estante, HUD, revelação (sinopse mais longa coube) e créditos.

**Ponto de controle**: opções funcionando e persistidas

## Fase 5: História 1 – Menu inicial (P1)

**Objetivo**: logo estilizado, raposa e os três botões; estante vira "Fases"
**Teste independente**: quickstart, passos 1 e 2

- [x] T012 [H1] `scripts/gen-assets.ts`: logo "READERUN" com letras em grade, degradê da raposa e contorno, orelhas no primeiro R, ponta da cauda no último N e página aberta embaixo; gerar **prévia** com `--out` e apresentar para aprovação, ajustando até aprovar (CS-005)
  - Rodadas de aprovação: (1) letras em degradê com página aberta embaixo; (2) referência de tela inicial da pessoa usuária → estante de livros ao fundo, título numa placa de madeira, orelhas espiando por cima da placa e cauda pela lateral; (3) o "A" como livro aberto foi descartado (dificultava a leitura), letras sem filetes internos e com degradê suave de 5 tons; a raposa parada virou uma rotina (corre pela prateleira e pula para pegar páginas nas laterais); (4) perna do R e diagonal do N como traços contínuos. Aprovado.
- [x] T013 [H1] Gerar `public/assets/logo.png` aprovado e carregá-lo em `src/scenes/BootScene.ts`, que passa a iniciar `Title` (depende de T012)
- [x] T014 [H1] Criar `src/scenes/TitleScene.ts`: fundo, páginas flutuando, logo, raposa animada (`fox-idle`), botões Jogar (pede tela cheia no toque) / Opções / Créditos com foco por teclado, botão de mudo e dica do iPhone (vindos da estante); `applyView` + reinício em `view:changed`; registrar em `src/main.ts` (depende de T013)
- [x] T015 [H1] `src/scenes/MenuScene.ts` (Fases): título "Escolha um livro", botão Voltar e Esc → `Title`; remover logo, mudo e dica do iPhone (agora no menu inicial)
- [x] T016 [H1] Verificar no navegador: Jogar → livro em 2 ações (CS-001); voltas Fases→menu, HUD/Revelação→estante; navegação por mouse, teclado e toque; 844×390 com DPR 2 sem sobreposição
  - Resultado: Jogar → livro em 2 ações; Esc/Voltar das telas → menu inicial; 844×390 sem sobreposição. O logo entrou provisoriamente em `public/assets` para a aprovação ser feita no próprio menu (desvio da ordem T012 → T013).

**Ponto de controle**: o jogo abre no menu inicial aprovado

## Fase 6: História 3 – Créditos (P2)

- [x] T017 [H3] Criar `src/scenes/CreditsScene.ts` com o texto de research D8 (rolagem com ↑/↓, roda e arrasto quando não couber; Voltar/Esc → `Title`) e registrar em `src/main.ts`; conferir glifos (`—`, acentos) nas duas fontes, trocando por hífen se faltar
- [x] T018 [H3] Verificar no navegador: créditos completos nas duas fontes e no celular simulado

## Fase final: Acabamento e verificação

- [x] T019 [P] `README.md`: regra de páginas (5 a 50), menu inicial, opções e créditos; resolver a pendência registrada na constituição 1.0.1
- [x] T020 [P] `specs/001-mvp-raposa-leitora/spec.md`: nota de emenda (RF-002 com máximo 50; História 4: estante vira "Fases" atrás do menu inicial; RF-012: volumes nas opções)
- [x] T021 Apresentar as sinopses (research D6) para revisão da pessoa usuária e aplicar ajustes em `src/data/books.json`
  - Sinopses aprovadas sem alterações.
- [x] T022 Rodar `npm run build`
- [x] T023 Relatar o que foi verificado e listar o teste no celular (preview) como pendente

## Fase 7: História 5 – Cenários e fases variados (P1) *(emenda)*

**Objetivo**: um cenário por livro e fases com estrutura própria, todas completáveis
**Teste independente**: quickstart, passos 10 a 15

### Visual

- [x] T024 [P] [H5] `src/data/books.ts` + `src/data/books.json`: tipos `Scenery` e `LevelRecipe`; campos `scenery` e `level` (pesos e formatos) nos 8 livros, conforme research D9/D14 e o contrato de receita
- [x] T025 [H5] `scripts/gen-assets.ts`: tileset 7×3 com a linha de teto (15–18) e enfeites extras (19–21); uma função de pintura por cenário gerando `tiles-<scenery>.png` (8), com o mesmo layout e extrusão (research D10)
- [x] T026 [P] [H5] Criar `src/systems/scenery.ts`: camadas de fundo (longe/perto) por cenário, periódicas em 480 px, com as cores do `theme` do livro (research D11)
- [x] T027 [H5] `src/scenes/GameScene.ts` + `src/scenes/BootScene.ts`: carregar os 8 tilesets; usar `tiles-<scenery>` e o fundo de `scenery.ts` na fase (depende de T024–T026)
- [x] T028 [H5] Gerar a **prévia dos 8 cenários** (início de cada fase com tileset, enfeites e fundo) e apresentar para aprovação, ajustando até aprovar (CS-006)

### Obstáculos

- [x] T029 [P] [H5] `scripts/gen-assets.ts`: `falling.png`, `spring.png` (2 quadros) e `spiketrap.png` (3 quadros), com a verificação de borda dos quadros
- [x] T030 [H5] `src/scenes/GameScene.ts`: plataforma que cai (treme 0,45 s, cai, volta em 2,5 s; repõe todas ao voltar ao checkpoint; entra na carona por passo), conforme o contrato de obstáculos (depende de T029)
- [x] T031 [H5] `src/scenes/GameScene.ts` + `src/config.ts` + `src/systems/Fox.ts` + `src/systems/audio.ts`: mola (`PHYSICS.springVelocity` 520; impulso não cortado ao soltar o pulo; quadro comprimido; `sfx.spring`) (depende de T029)
- [x] T032 [H5] `src/scenes/GameScene.ts`: espinho móvel (ciclo com `period`/`offset`, pontas antes de subir, mata só em pé, relógio da cena) (depende de T029)

### Estrutura e validação

- [x] T033 [H5] `scripts/gen-maps.ts`: ler `level` de cada livro (receita padrão se faltar); desafios novos `falling`, `springWall`, `spikeTrap`; trechos `ceiling`, `climb`, `branch` (research D13) com as restrições do contrato; tileset de 21 tiles e imagem por cenário (depende de T024)
- [x] T034 [P] [H5] Criar `scripts/check-levels.ts` (grafo de células de pé + regras de salto; saída e páginas alcançáveis e com volta; mensagem com fase e página), incluir no `build` do `package.json` e fazer `scripts/check-maps.ts` aceitar os tipos novos (research D15)
- [x] T035 [H5] Refazer os 8 mapas com `npm run gen:maps -- --force`, rodar `check-maps` e `check-levels` e ajustar o gerador até passar; provar que o `check-levels` falha com um buraco largo demais colocado de propósito (depende de T033 e T034)
- [x] T036 [H5] Verificar no navegador: obstáculos (quickstart 13), um trecho de cada formato percorrido com o teclado (14), contagem de objetos por mapa conforme as receitas (15) e as 8 fases lado a lado (12)

**Ponto de controle**: 8 cenários aprovados, obstáculos funcionando, 8 fases completáveis validadas no build

## Fase final da emenda

- [x] T037 [P] `README.md`: cenários, obstáculos novos, receita de fase no `books.json` e o `check-levels`; seção do Tiled atualizada (tipos de objeto novos, tileset 7×3)
- [x] T038 [P] `specs/001-mvp-raposa-leitora/spec.md` e `plan.md`: notas de emenda (cenário por livro, obstáculos novos, gerador ampliado, check-levels)
- [x] T039 Rodar `npm run build` (check-maps + check-levels + typecheck + vite build)

## Dependências e ordem

- T001 e T002 em paralelo → T003, T004, T005
- H4 (T006–T009) só depende de dados: pode começar logo após a Preparação, em paralelo com a Fundação
- H2 depende de T003/T004 · H1 depende de T003 (textos) e da aprovação do logo (T012) · H3 depende de T003
- **MVP sugerido**: H4 + H2 (conteúdo novo + opções); H1 e H3 em seguida
- **Emenda H5**: fechar antes as aprovações pendentes (T012 logo, T021 sinopses). Depois: T024 → (T025, T026 em paralelo) → T027 → T028 (aprovação dos cenários). Obstáculos T029 → T030/T031/T032. Estrutura: T033 e T034 em paralelo → T035 → T036. Por fim T037–T039 e T023 (relatório final)
