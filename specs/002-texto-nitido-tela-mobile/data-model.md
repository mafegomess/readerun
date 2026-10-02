# Modelo de dados: Texto nítido e tela de jogo maior no celular

Alterações em relação ao [modelo da 001](../001-mvp-raposa-leitora/data-model.md).

## Viewport (`view`, em memória, recalculada a cada redimensionamento)

| Campo | Unidade | Regra |
|---|---|---|
| `dpr` | — | `min(window.devicePixelRatio, 2)` |
| `canvasWidth`, `canvasHeight` | px do canvas | tamanho CSS da janela × `dpr`, arredondado |
| `zoom` | px do canvas por unidade lógica | `altura da área de jogo / 270` |
| `width` | unidades lógicas | `L`, entre 480 e 630 |
| `height` | unidades lógicas | sempre 270 |
| `x`, `y`, `viewWidth`, `viewHeight` | px do canvas | retângulo da área de jogo dentro do canvas (letterbox fora de 16:9 a 21:9) |
| `safe.left/right/top/bottom` | unidades lógicas | insets de área segura convertidos (`cssPx · dpr / zoom`), já descontando o letterbox |

Cálculo:

```text
aspecto = canvasWidth / canvasHeight
se aspecto < 480/270:   zoom = canvasWidth / 480;  L = 480; faixas em cima e embaixo
se aspecto > 630/270:   zoom = canvasHeight / 270; L = 630; faixas nas laterais
senão:                  zoom = canvasHeight / 270; L = canvasWidth / zoom
```

## Progresso salvo (`readerun:save:v1`)

Campo novo, opcional e retrocompatível (saves antigos leem como `false`):

```json
{ "completed": [], "muted": false, "fullscreenHintSeen": false }
```

`fullscreenHintSeen` vira `true` quando a pessoa toca para fechar a dica "Adicionar à Tela de Início" do iOS. Não exige chave `v2`.

## Manifest (`public/manifest.webmanifest`)

`name: "Readerun"`, `short_name: "Readerun"`, `lang: "pt-BR"`, `display: "fullscreen"`, `orientation: "landscape"`, `background_color` e `theme_color` `#1d1530`, `start_url: "."`, ícones `assets/icon-192.png` e `assets/icon-512.png`.
