# Plano de implementação: Texto nítido e tela de jogo maior no celular

**Feature**: `002-texto-nitido-tela-mobile` | **Data**: 2026-10-02 | **Spec**: [spec.md](./spec.md)

## Resumo

Trocar a ampliação por CSS de um canvas fixo de 480×270 por renderização na resolução real do dispositivo, com zoom de câmera no Phaser. O texto passa a ser rasterizado no tamanho final, sem borrão.

A área lógica fica com altura fixa de 270 e largura variável de 480 a 630, para preencher telas de 16:9 a 21:9 sem distorcer e sem mudar o tamanho da raposa. No celular, o jogo entra em tela cheia quando o navegador permite, e a HUD e os botões respeitam o notch. Detalhes e alternativas em [research.md](./research.md).

## Contexto técnico

**Linguagem/versão**: TypeScript strict, Phaser 3.90
**Dependências principais**: nenhuma nova
**Armazenamento**: `localStorage`; novo campo `fullscreenHintSeen` no save (ver [data-model.md](./data-model.md))
**Testes/verificação**: `npm run build`; navegador em vários tamanhos de janela e com DPR 1 e 2; celular real (Android/Chrome e iPhone/Safari) para a História 2
**Plataforma-alvo**: desktop (1080p, 1440p, retina) e celulares de 6" a 6,7" na horizontal
**Metas de desempenho**: manter 60 fps; canvas limitado a DPR 2
**Restrições**: site estático; sem mudar física nem mapas (RF-011)
**Escala/escopo**: 5 cenas, 1 módulo novo, ícones e manifest

## Verificação da constituição

| Princípio | Atende? | Observação |
|---|---|---|
| I. Estático e gratuito | ✅ | Manifest e ícones são arquivos estáticos; nenhum serviço novo |
| II. A leitura no centro | ✅ | Objetivo principal: sinopse e textos legíveis |
| III. Desktop e celular | ✅ | Reforça: tela cheia, áreas seguras, só horizontal (mantido) |
| IV. Conteúdo orientado a dados | ✅ | Nada muda em livros ou mapas |
| V. Arte e som livres de licença | ✅ | Ícones gerados por `gen-assets.ts` |
| VI. Português do Brasil | ✅ | Dica do iOS em PT-BR; glifos da dica conferidos na fonte |
| VII. Verificar antes de concluir | ✅ | Roteiro no [quickstart.md](./quickstart.md); teste em aparelho real declarado como etapa manual |

*Reavaliação pós-design*: sem violações. O risco principal (pixels desiguais com zoom fracionário) está tratado em D4, com calibração visual.

## Estrutura afetada

```text
src/systems/viewport.ts      NOVO: calcula dpr, zoom, largura lógica, letterbox e áreas seguras; aplica nas câmeras; emite view:changed
src/main.ts                  Scale.NONE + tamanho do canvas pela viewport; listeners de resize/visualViewport; tela cheia no 1º toque
src/config.ts                WIDTH vira largura lógica mínima (480) e entra MAX_WIDTH (630); HEIGHT continua 270
src/ui.ts                    text() com resolution = zoom; backdrop() cobre a largura lógica
src/scenes/MenuScene.ts      layout relativo a L; reinicia em view:changed preservando a seleção; dica do iOS
src/scenes/GameScene.ts      câmera com zoom/viewport; fundo com largura L e deslocamento de scrollFactor 0; reage a view:changed sem reiniciar
src/scenes/HudScene.ts       ancoragem em L e nas áreas seguras; zonas de toque em coordenadas de mundo; reinicia em view:changed com o estado atual
src/scenes/RevealScene.ts    conteúdo centralizado em L; reinicia em view:changed sem repetir a animação
src/systems/save.ts          campo fullscreenHintSeen
src/style.css                canvas sem image-rendering forçado; sonda de área segura
index.html                   manifest, metas de app (iOS) e sonda de área segura
public/manifest.webmanifest  NOVO: display fullscreen, orientation landscape, ícones
scripts/gen-assets.ts        ícones de 180, 192 e 512 px
README.md                    seção sobre tela cheia / "Adicionar à Tela de Início"
```

## Fase 0 – Pesquisa

Concluída em [research.md](./research.md): D1 causa do borrão · D2 modelo de viewport · D3 câmeras · D4 arte com zoom fracionário · D5 tela cheia · D6 áreas seguras · D7 redimensionamento · D8 botões de toque.

## Fase 1 – Design

- **Modelo de dados**: [data-model.md](./data-model.md) define o objeto `view` e o campo novo do save.
- **Contratos**: [contracts/viewport.md](./contracts/viewport.md) traz a API do módulo `viewport`, o evento `view:changed` e os dados de reinício da HUD.
- **Roteiro de verificação**: [quickstart.md](./quickstart.md).

### Abordagem por história

- **H1 (texto nítido no desktop)**: viewport + DPR + `resolution` do texto. Toda a nitidez vem daí; as demais cenas só passam a usar `L`.
- **H2 (tela inteira no celular)**: largura lógica variável (preenche de 16:9 a 21:9), tela cheia, manifest + dica do iOS, áreas seguras, botões ancorados.
- **H3 (texto nítido no celular)**: mesma mudança da H1; só verificação.

## Riscos e complexidade

| Risco / desvio | Por que é necessário | Alternativa mais simples descartada porque |
|---|---|---|
| Layout passa a ter largura variável em todas as cenas | preencher de 16:9 a 21:9 sem distorcer (RF-005/006) | largura fixa com faixas laterais contraria CS-003 |
| Fundo com `scrollFactor 0` precisa de deslocamento manual com zoom | o Phaser escala esses objetos em torno do centro da câmera | posicionar o fundo pelo `worldView` a cada frame causa tremor (atraso de 1 frame) |
| Reiniciar HUD, Menu e Revelação no resize | layout sempre correto, código simples | reposicionar elemento por elemento é frágil e fácil de esquecer |
| Pixels desiguais com zoom fracionário | é o único jeito de preencher a tela mantendo o tamanho relativo | zoom inteiro deixaria faixas ou cortaria o mapa |
| Tela cheia indisponível no iPhone | limitação do Safari | contornada com manifest + dica |
