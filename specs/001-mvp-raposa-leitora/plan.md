# Plano de implementação: MVP – A raposa leitora

**Feature**: `001-mvp-raposa-leitora` | **Data**: 2026-10-02 | **Spec**: [spec.md](./spec.md)
**Status**: Implementado (registro da arquitetura atual)

> **Emenda (002)**: a apresentação foi trocada pela da [002 – Texto nítido e tela maior no celular](../002-texto-nitido-tela-mobile/plan.md). O canvas agora usa a resolução real (`Scale.NONE`, DPR até 2), as câmeras usam zoom e a área lógica tem altura de 270 com largura de 480 a 630 (`src/systems/viewport.ts`). O tileset é extrudado (margem 1, espaçamento 2). As linhas abaixo sobre `main.ts` (FIT 480×270) e o tileset 7×2 sem margem descrevem o MVP original.

## Resumo

Jogo de plataforma 2D em Phaser 3 + TypeScript, empacotado com Vite como site estático. As fases são mapas do Tiled gerados por script, com tamanho proporcional ao livro. Arte e som são gerados por código. O progresso fica no `localStorage`.

## Contexto técnico

**Linguagem/versão**: TypeScript 7 (strict, `erasableSyntaxOnly`), Node 24 executando scripts `.ts` direto
**Dependências principais**: Phaser 3.90 (Arcade Physics), Vite 8
**Armazenamento**: `localStorage`, chave `readerun:save:v1`
**Testes/verificação**: `npm run build` = `check-maps` + `tsc --noEmit` + `vite build`; testes manuais/automatizados no navegador
**Plataforma-alvo**: navegadores desktop e celular; Vercel (preset Vite, saída `dist/`)
**Restrições**: sem backend; fonte Press Start 2P via Google Fonts (com fallback)
**Escala/escopo**: 3 livros/fases, 5 cenas

## Verificação da constituição

| Princípio | Atende? | Observação |
|---|---|---|
| I. Estático e gratuito | ✅ | Só arquivos estáticos; save tolerante a falhas |
| II. A leitura no centro | ✅ | `pageRule.ts` centraliza a regra; título oculto até concluir |
| III. Desktop e celular | ✅ | Teclado + zonas de toque; FIT 480×270; aviso de orientação |
| IV. Conteúdo orientado a dados | ✅ | `books.json` + mapas Tiled; `check-maps` no build; `gen:maps` não sobrescreve sem `--force` |
| V. Arte e som livres de licença | ✅ | `gen-assets.ts` + Web Audio; capas genéricas |
| VI. Português do Brasil | ✅ | Interface e comentários em PT-BR; setas Unicode trocadas por texto |
| VII. Verificar antes de concluir | ⚠️ | Build e fluxos testados; fases não jogadas de ponta a ponta e toque em aparelho real ainda não testado |

## Estrutura

```text
index.html                  página, fonte, aviso "gire o celular"
src/main.ts                 config do Phaser (480×270, pixelArt, FIT, Arcade gravity 1000)
src/config.ts               dimensões, física, vidas, cores
src/style.css
src/ui.ts                   text(), button() com foco por teclado, cover() (capa ilustrada/misteriosa), backdrop()
src/data/books.json         catálogo de livros (ver data-model.md)
src/data/books.ts           tipos + getBook/pagesToCollect
src/data/pageRule.ts        regra única de páginas por livro (usada também pelos scripts)
src/systems/Fox.ts          jogador: aceleração, coyote time, buffer, pulo variável, animações
src/systems/audio.ts        Web Audio: sfx.* e music.play/stop; desbloqueio no 1º gesto; mudo
src/systems/save.ts         localStorage com try/catch
src/systems/controls.ts     estado do toque (escrito pela HUD, lido pela raposa)
src/scenes/BootScene.ts     carrega assets e mapas, cria animações
src/scenes/MenuScene.ts     estante paginada de 3 livros, navegação por setas/Enter
src/scenes/GameScene.ts     mapa, objetos, colisões, morte/respawn, saída, fundo parallax por tema
src/scenes/HudScene.ts      corações, contador, avisos, toque, pausa, fim de jogo
src/scenes/RevealScene.ts   animação das páginas → capa; detalhes; rolagem para sinopse longa
scripts/gen-assets.ts       pixel art → PNG (encoder próprio, sem dependências)
scripts/gen-maps.ts         gerador de fases (JSON do Tiled), semente por id do livro
scripts/check-maps.ts       validação de mapas × books.json (roda no build)
public/assets/*.png         sprites gerados
public/maps/*.json          fases
```

## Decisões principais (research)

| Decisão | Motivo | Alternativas descartadas |
|---|---|---|
| Phaser 3 em vez de 4 | combinado na entrevista; API madura | Phaser 4 (o npm instala por padrão, mas a versão foi fixada em `^3`) |
| Fases geradas por script em formato Tiled | criar 3 fases rápido e manter edição visual depois | desenhar à mão (lento); formato próprio (perde o Tiled) |
| Arte por código com encoder PNG próprio | não depende de download; Tiled precisa de PNG real | SVG (suporte no Tiled incerto); canvas no runtime (não serve ao Tiled) |
| Céu com canvas nativo | `generateTexture` ignora `fillGradientStyle` | Graphics com gradiente (só funciona em WebGL ao vivo) |
| Carona manual em plataforma móvel (`deltaX` da plataforma) | o atrito do Arcade não carregava a raposa | friction nativo (testado, não funcionou) |
| Tábuas one-way por faces do tile | atravessar por baixo, pousar em cima | colisão completa (bate a cabeça) |
| HUD como cena paralela, com eventos `hud:*` | separar UI da física; pausar o Game sem pausar a UI | UI dentro da GameScene |
| Música agendada com lookahead e pulo de atraso | ritmo estável; sem rajada de notas ao voltar da aba | `setTimeout` por nota |

## Contratos internos

**Eventos GameScene → HudScene** (`gameScene.events`):

| Evento | Argumentos | Efeito na HUD |
|---|---|---|
| `hud:pages` | `(coletadas, total)` | atualiza o contador (dourado quando completo) |
| `hud:lives` | `(vidas)` | atualiza os corações |
| `hud:toast` | `(mensagem)` | aviso temporário (~2 s) |
| `hud:gameover` | — | painel de fim de jogo |
| `hud:finish` | — | esconde os controles de toque |

A HUD remove seus listeners no `shutdown`, porque o emissor da GameScene persiste entre reinícios.

**Física de referência** (limites para level design): gravidade 1000, pulo 360 px/s (~4 tiles de altura), corrida 130 px/s (~5 tiles de alcance), queda máxima 420.

## Riscos conhecidos

| Risco | Situação |
|---|---|
| Fases geradas nunca jogadas de ponta a ponta por uma pessoa | pendente: jogar as 3 |
| Toque não testado em aparelho real | pendente |
| Bundle de 1,2 MB (Phaser) | aceitável (330 KB gzip); avaliar se virar problema |
| Fonte via Google Fonts | sem rede, cai para monospace |
