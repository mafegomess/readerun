# Roteiro de verificação: Menu inicial, opções, créditos e novos livros

## Automático

```bash
npm run build      # check-maps (8 mapas, Um Defeito de Cor com 48 páginas) + typecheck + vite build
```

## Navegador (iframe + `game.step()`, e visual por captura)

1. **Menu inicial**: abrir o jogo → menu inicial com logo, raposa animada e os botões Jogar/Opções/Créditos; navegar por mouse, teclado (↑/↓/Enter) e toque.
2. **Jogar → Fases → livro**: 2 ações até a fase (CS-001); Voltar/Esc da estante volta ao menu inicial; "Livros" da HUD e da Revelação continuam indo à estante.
3. **Opções – áudio**: música 0–10 muda o volume na hora; efeitos 0–10 tocam o exemplo; 0 silencia cada um; o mudo geral não apaga os volumes e vice-versa.
4. **Opções – fonte**: trocar para "Legível" → menu, estante, HUD, avisos, revelação (sinopse) e créditos na Atkinson Hyperlegible, nítida e sem estourar o layout; voltar para "Pixelada".
5. **Persistência**: recarregar a página → opções mantidas (CS-002); com `localStorage` bloqueado, o jogo abre com os padrões.
6. **Créditos**: texto completo (criadora, IA, fontes, Phaser, livros), rolagem quando não cabe, Voltar/Esc.
7. **Livros**: estante com 8 livros em 3 páginas, sem Alice; save com `alice` concluído não quebra nada.
8. **Fases novas**: cada uma abre, tem as páginas esperadas (15, 18, 20, 48, 20, 10) e chega à revelação (teleporte pelas páginas, como nos testes anteriores); conferir trechos da fase de 48 seções no começo, no meio e no fim.
9. **Celular (simulado)**: menu inicial, opções e créditos em 844×390 com DPR 2, sem sobreposição e longe do notch.

## Emenda H5 – cenários e fases variados

10. **Build**: `check-levels` passa nas 8 fases (saída e todas as páginas alcançáveis e com volta); um mapa com um buraco largo demais de propósito faz o build falhar indicando a fase.
11. **Prévia dos cenários** (antes de integrar): captura do início de cada fase com tileset, enfeites e fundo do cenário (CS-006).
12. **Lado a lado**: capturas do início das 8 fases são reconhecivelmente diferentes.
13. **Obstáculos**: plataforma que cai treme, cai e volta (e volta na hora ao perder vida); mola lança ~8 tiles e não corta ao soltar o pulo; espinho móvel mostra as pontas antes de subir e só mata em pé; tudo pausa junto com o jogo.
14. **Formatos**: um corredor com teto, uma subida em andares e um caminho alternativo de cada, percorridos com o teclado.
15. **Receitas**: contagem dos tipos de objeto por mapa bate com os destaques de research D14 (ex.: Jogos Vorazes com mais `spikeTrap`/`falling`; Capitães com mais `platform`).

## Aprovações da pessoa usuária

16. Prévia do logo (CS-005).
17. Revisão das sinopses dos 6 livros novos (research D6).
18. Teste no celular (preview da Vercel).
19. Prévia dos 8 cenários (emenda H5, CS-006).
