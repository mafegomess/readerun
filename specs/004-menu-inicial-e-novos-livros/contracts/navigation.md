# Contrato: navegação entre telas

| Cena (chave) | Entra por | Botões / ações | Esc |
|---|---|---|---|
| `Title` | `Boot`; "Voltar" de Fases, Opções e Créditos | Jogar → `Menu` (pede tela cheia no toque) · Opções → `Options` · Créditos → `Credits` · mudo | — |
| `Menu` (Fases) | Jogar; "Livros" da HUD e da Revelação | livro → `Game` · Ver livro → `Reveal` · Voltar → `Title` | → `Title` |
| `Options` | Opções | ±música · ±efeitos · fonte · Voltar → `Title` | → `Title` |
| `Credits` | Créditos | rolar · Voltar → `Title` | → `Title` |

## Teclado

- ↑/↓ movem o foco entre botões/linhas (menu inicial, opções, créditos rolam); ←/→ na estante trocam de livro (como hoje) e nas opções ajustam o valor; Enter confirma.
- O foco visível usa o destaque dourado atual dos botões (`setFocused`).

## Layout

- Conteúdo desenhado para 480 de largura e centralizado em `view.width`; elementos de canto respeitam `view.safe`.
- Todas as cenas novas usam `applyView(câmera, true)` e reiniciam em `view:changed` (como as telas de interface da spec 002).
