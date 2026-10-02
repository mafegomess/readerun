# Tarefas: Texto nítido e tela de jogo maior no celular

**Entrada**: documentos em `specs/002-texto-nitido-tela-mobile/`
**Pré-requisitos**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/viewport.md](./contracts/viewport.md), [quickstart.md](./quickstart.md)

## Formato: `- [ ] T000 [P?] [H?] Descrição com caminho do arquivo`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência)
- **[H1]** texto nítido no desktop · **[H2]** tela inteira no celular · **[H3]** texto nítido no celular

## Fase 1: Preparação

- [x] T001 Ajustar `src/config.ts`: `WIDTH` (480) passa a ser a largura lógica mínima, adicionar `MAX_WIDTH = 630` e `MAX_DPR = 2`, com comentário explicando a área lógica variável

## Fase 2: Fundação (bloqueia as histórias)

- [x] T002 Criar `src/systems/viewport.ts` com `view`, `measureView()`, `applyView(cam, center)` e `screenOrigin()`, conforme `contracts/viewport.md` e o cálculo de `data-model.md` (dpr limitado, zoom, L entre 480 e 630, letterbox; `safe` zerado por enquanto)
- [x] T003 Trocar a configuração de escala em `src/main.ts`: `Scale.NONE`, canvas com o tamanho de `view.canvasWidth/Height` e `scale.zoom = 1/dpr`; ouvir `resize` da janela e do `visualViewport` com debounce de 100 ms → `measureView()` → `game.scale.resize()` → emitir `view:changed` em `game.events`
- [x] T004 [P] Remover `image-rendering: pixelated` forçado do canvas em `src/style.css` (agora o canvas está em resolução nativa) e garantir que `#game` ocupe a janela inteira sem rolagem
- [x] T005 [P] Em `src/ui.ts`, `text()` passa a usar `resolution: view.zoom` e `backdrop()` passa a cobrir `view.width × view.height`

**Ponto de controle**: `npm run typecheck` passa; o jogo abre e o canvas tem o tamanho da janela × DPR

## Fase 3: História 1 – Texto nítido no desktop (P1) 🎯 MVP

**Objetivo**: todos os textos nítidos em qualquer janela, DPR e zoom do navegador
**Teste independente**: quickstart, passos 2 a 6

- [x] T006 [P] [H1] `src/scenes/MenuScene.ts`: `applyView(câmera, true)`; centralizar título, estante, setas de página e raposa corredora em `view.width`; reiniciar em `view:changed` preservando a estante e a seleção; remover o listener no `shutdown`
- [x] T007 [P] [H1] `src/scenes/RevealScene.ts`: `applyView(câmera, true)`; deslocar capa, coluna de texto e botões em `(view.width − 480) / 2`; reiniciar em `view:changed` com `replay: true`; remover o listener no `shutdown`
- [x] T008 [P] [H1] `src/scenes/BootScene.ts`: `applyView(câmera, true)` e barra de carregamento centralizada em `view.width`
- [x] T009 [H1] `src/scenes/GameScene.ts`: aplicar `applyView` na câmera (zoom + viewport, mantendo bounds/follow/deadzone); céu com `setDisplaySize(view.width, 270)`; TileSprites de nuvens e morros com largura `view.width`; posicionar os objetos de `scrollFactor 0` em `screenOrigin()`; em `view:changed`, reaplicar câmera e fundo sem reiniciar; remover o listener no `shutdown`
- [x] T010 [H1] `src/scenes/GameScene.ts`: expor `hudSnapshot(): HudData` (livro, total, vidas, coletadas) e ampliar o tipo `HudData` com `collected` e `state`, conforme o contrato
- [x] T011 [H1] `src/scenes/HudScene.ts`: `applyView(câmera, true)`; corações e contador ancorados à esquerda e pausa/mudo à direita de `view.width`; aviso e painéis centralizados em `view.width`; iniciar o contador com `data.collected`; em `view:changed`, `scene.restart({ ...game.hudSnapshot(), state })`, reabrindo o painel de pausa ou de fim de jogo sem pausar de novo; remover o listener no `shutdown` (depende de T010)
- [x] T012 [H1] Verificar no Chrome os passos 2 a 6 do quickstart (1080p, 1366×768, 1440p, DPR 2, redimensionar no meio da fase e com painéis abertos, proporções 21:9, 4:3 e > 21:9) e corrigir o que aparecer (ex.: deslocamento do fundo, pixels desiguais excessivos)
  - **Desvio registrado**: o zoom fracionário fez aparecer linhas verticais no chão (sangramento entre tiles do atlas). Corrigido com tileset extrudado (margem 1, espaçamento 2) em `scripts/gen-assets.ts` e `scripts/gen-maps.ts`, atualizando só o bloco `tilesets` dos 3 mapas. As TileSprites do fundo passaram a nascer com `MAX_WIDTH` em vez de serem redimensionadas (redimensionar deixava uma faixa escura na borda direita).
  - Teste feito em iframes de tamanho controlado, avançando quadros com `game.step()`, porque a janela do Chrome estava oculta; DPR 2 não pôde ser emulado (a máquina tem DPR 1,25).

**Ponto de controle**: no desktop, textos nítidos em todas as telas e redimensionamento sem perda de estado

## Fase 4: História 2 – Tela inteira no celular (P1)

**Objetivo**: preencher a tela (16:9 a 21:9), tela cheia quando possível, HUD e botões fora do notch
**Teste independente**: quickstart, passos 8 a 14 (aparelho real)

- [x] T013 [P] [H2] Adicionar a sonda de área segura em `index.html` (elemento oculto com `padding: env(safe-area-inset-*)`) e o estilo em `src/style.css`; em `src/systems/viewport.ts`, ler os insets em `measureView()` e convertê-los para unidades lógicas descontando o letterbox
- [x] T014 [H2] `src/scenes/HudScene.ts`: descontar `view.safe` nos corações, contador, pausa/mudo e botões de toque (esquerda, direita e pulo ancorados nos cantos inferiores) e recalcular as zonas de toque com `camera.getWorldPoint(p.x, p.y)`, relativas às posições dos botões (depende de T011 e T013)
- [x] T015 [P] [H2] Criar `src/systems/fullscreen.ts`: `requestFullscreen()` só em aparelho de toque, com `navigationUI: 'hide'` + `screen.orientation.lock('landscape')`, ignorando falhas e sem fazer nada se já estiver em tela cheia ou se a API não existir
- [x] T016 [H2] Chamar `requestFullscreen()` no primeiro toque (listener em `src/main.ts`) e ao tocar "Jogar" (`src/scenes/MenuScene.ts`), "Continuar" e "Tentar de novo" (`src/scenes/HudScene.ts`) (depende de T015)
- [x] T017 [P] [H2] Gerar `icon-180.png`, `icon-192.png` e `icon-512.png` em `scripts/gen-assets.ts` (raposa sobre o fundo roxo do jogo) e rodar `npm run gen:assets`
- [x] T018 [H2] Criar `public/manifest.webmanifest` conforme `data-model.md` e adicionar em `index.html` o `<link rel="manifest">`, o `apple-touch-icon` e as metas `apple-mobile-web-app-capable` / `mobile-web-app-capable` / `apple-mobile-web-app-status-bar-style` (depende de T017)
- [x] T019 [P] [H2] `src/systems/save.ts`: campo `fullscreenHintSeen` (leitura retrocompatível + setter persistente)
- [x] T020 [H2] `src/scenes/MenuScene.ts`: no iOS fora do modo instalado (`navigator.standalone !== true`) e com a dica ainda não vista, mostrar "Dica: Compartilhar > Adicionar à Tela de Início para jogar em tela cheia" em faixa discreta; ao tocar, esconder e marcar `fullscreenHintSeen` (depende de T019; conferir os glifos na fonte pixelada, princípio VI)
- [x] T021 [H2] Simular no Chrome as proporções de celular (ex.: 844×390 e 915×412 com DPR 2) e conferir preenchimento, botões de toque visíveis e sem sobreposição com a HUD

**Ponto de controle**: proporções de celular preenchidas no simulador; itens de aparelho real listados para o teste manual

## Fase 5: História 3 – Texto nítido no celular (P2)

- [x] T022 [H3] Conferir, nas proporções de celular simuladas com DPR 2, a nitidez e a legibilidade do menu, da HUD e da revelação (quickstart, passo 15, versão simulada)

## Fase final: Acabamento e verificação

- [x] T023 [P] Atualizar `README.md` com uma seção sobre jogar no celular (tela cheia no Android e "Adicionar à Tela de Início" no iPhone)
- [x] T024 [P] Atualizar `specs/001-mvp-raposa-leitora/plan.md` (estrutura e decisões) para refletir o novo modelo de viewport, como emenda referenciando a 002
- [x] T025 Rodar `npm run build` (check-maps + typecheck + vite build)
- [x] T026 Atravessar o primeiro trecho de uma fase com o teclado para confirmar física e carona inalteradas (quickstart, passo 7; RF-011)
- [x] T027 Relatar o que foi verificado no navegador e listar os passos 8 a 14 do quickstart como pendentes de teste em aparelho real

## Dependências e ordem

- T001 → T002 → T003; T004 e T005 em paralelo depois de T002
- Fundação completa → H1. Dentro da H1: T006, T007 e T008 em paralelo; T009 → T010 → T011 → T012
- H2 depende de T011 (HUD com viewport). T013, T015, T017 e T019 em paralelo; depois T014, T016, T018 e T020; T021 por último
- H3 depende da H2 (proporções de celular). Acabamento por último
- **MVP sugerido**: Fundação + H1 já resolve o texto borrado no desktop e, de quebra, faz o desktop largo preencher a tela
