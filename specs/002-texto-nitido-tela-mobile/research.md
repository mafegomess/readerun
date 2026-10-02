# Pesquisa: Texto nítido e tela de jogo maior no celular

## D1 – Causa do texto borrado

**Diagnóstico**: o jogo renderiza num canvas fixo de 480×270 e o navegador amplia esse canvas por CSS (`Scale.FIT`) por um fator quebrado (ex.: 1523/480 = 3,17×). O texto é rasterizado pelo canvas 2D a 8 px, com bordas suavizadas (pixels semitransparentes). Na ampliação, essas bordas viram blocos acinzentados: o "embaçado". Em telas de alta densidade (DPR 2), a perda dobra, porque o canvas tem menos pixels do que a tela.

**Decisão**: renderizar na **resolução real do dispositivo** e aplicar a ampliação dentro do Phaser (zoom de câmera), em vez de ampliar a imagem pronta via CSS. O texto é rasterizado já no tamanho final (`resolution` do Text = zoom), então a fonte pixelada sai com contornos definidos.

**Alternativas descartadas**:
- *Só aumentar a `resolution` do Text*: não resolve, porque o texto continuaria sendo desenhado num canvas de 480×270.
- *Dobrar a resolução lógica (960×540) e todas as coordenadas*: refatoração enorme (mapas, física, layout), sem ganho sobre o zoom.
- *Texto em DOM sobreposto ao canvas*: dois sistemas de layout, problemas de sincronia com a câmera e com a pausa.
- *Escala inteira com bordas* (2×, 3×): nitidez perfeita, mas deixa faixas vazias, o que contradiz a História 2.

## D2 – Modelo de viewport (área lógica variável)

**Decisão**:
- Canvas = tamanho CSS da janela × `dpr`, com `dpr = min(devicePixelRatio, 2)`. O CSS do canvas é reduzido por `scale.zoom = 1/dpr`, usando `Scale.NONE` com redimensionamento manual.
- **Altura lógica fixa em 270** (o mapa tem 272 px de altura) e **largura lógica variável** `L`, entre 480 (16:9) e 630 (21:9).
- Zoom da câmera `Z = alturaDoCanvas / 270`, fracionário. Assim a raposa mantém a mesma altura relativa (CS-005) e telas largas mostram mais cenário (RF-006).
- Abaixo de 16:9 (janela alta, tablet 4:3) e acima de 21:9: faixas (letterbox) centralizadas via `camera.setViewport`. A spec só exige preencher de 16:9 a 21:9.

**Motivo do teto de DPR em 2**: em celulares com DPR 3, um canvas de 2532×1170 custa memória e GPU sem ganho visível para uma fonte pixelada; com DPR 2 o texto já fica nítido.

**Alternativas descartadas**: `Scale.RESIZE` sem DPR (não fica nítido em retina); zoom inteiro (`floor`) com área extra (mostraria além da altura do mapa).

## D3 – Câmeras com zoom

**Decisão**: manter a origem da câmera em 0,5, porque o `clampX/clampY` do Phaser 3.90 assume essa origem (conferido em `BaseCamera.js`; com outra origem, os limites do follow ficariam errados).
- Cenas estáticas (Menu, HUD, Revelação): `setZoom(Z)` + `centerOn(L/2, 135)`, mostrando exatamente a área lógica (0..L, 0..270).
- Fase: `setZoom(Z)` + bounds + follow, como hoje.
- Objetos com `scrollFactor 0` (fundo da fase) são escalados em torno do centro da câmera. É preciso deslocá-los em `L·(Z−1)/2` na horizontal e `270·(Z−1)/2` na vertical para encostarem no canto da tela.

## D4 – Arte pixelada com zoom fracionário

**Decisão**: manter `pixelArt: true` + `roundPixels: true`. Com zoom fracionário em resolução real, alguns pixels da arte ocupam N e outros N+1 pixels de tela. Com N ≥ 2 (sempre, nos aparelhos-alvo), a diferença é imperceptível e muito menor que a do método atual de ampliar por CSS. A calibração é visual, no navegador.

## D5 – Tela cheia no celular

**Decisão**:
- No primeiro toque em aparelho de toque (gesto do usuário, exigido pelo navegador), chamar `document.documentElement.requestFullscreen({ navigationUI: 'hide' })` e depois `screen.orientation.lock('landscape')`, ignorando falhas.
- Pedir de novo ao tocar "Jogar" ou "Continuar", caso a pessoa tenha saído da tela cheia.
- Sair da tela cheia no meio da fase apenas redimensiona o jogo (RF-004).

**iPhone (Safari)**: não há Fullscreen API para páginas. Alternativas: (a) `manifest.webmanifest` com `display: fullscreen` e `orientation: landscape`, mais as metas `apple-mobile-web-app-capable`, para abrir em tela cheia quando adicionado à Tela de Início; (b) uma dica única no menu, só no iOS fora do modo instalado: "Dica: Compartilhar → Adicionar à Tela de Início para jogar em tela cheia".

**Ícones**: o manifest exige ícones de 192 e 512 px. Serão gerados por `gen-assets.ts` (princípio V), junto com o `apple-touch-icon` de 180 px.

## D6 – Áreas seguras (notch, cantos)

**Decisão**: o canvas ocupa a tela inteira (inclusive atrás do notch, onde só aparece o fundo). HUD e botões de toque se afastam dos insets.
- Os insets são lidos de um elemento-sonda com `padding: env(safe-area-inset-*)` e convertidos para unidades lógicas (`cssPx · dpr / Z`).

**Alternativa descartada**: aplicar o padding de área segura no contêiner do canvas. Seria mais simples, mas no iPhone deitado perderia cerca de 11% da largura, contra o CS-003.

## D7 – Reação a redimensionamento e rotação

**Decisão**:
- Ouvir `resize` da janela e do `visualViewport` (barra do navegador aparecendo e sumindo), com debounce de 100 ms.
- Recalcular a viewport, chamar `game.scale.resize()` e emitir `view:changed` em `game.events`.
- Fase: reaplicar câmera e fundo, preservando o estado.
- HUD: reiniciar a cena com o estado atual vindo da fase (vidas, páginas, painel aberto).
- Menu e Revelação: reiniciar a cena (a Revelação volta sem repetir a animação).

**Motivo**: reconstruir o layout das cenas de interface é mais simples e confiável do que reposicionar cada elemento; a fase nunca reinicia, então nada da tentativa se perde.

## D8 – Botões de toque

**Decisão**: manter os botões de 32 unidades lógicas. Num celular de ~390 px CSS de altura, `Z_css ≈ 1,44`, o que dá cerca de 46 px CSS (~12 mm), acima do mínimo de ~9 mm (RF-008).
- Posição ancorada nas bordas da área lógica, descontando os insets.
- As zonas de toque passam a usar coordenadas de mundo (`camera.getWorldPoint`).
