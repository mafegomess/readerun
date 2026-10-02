# Roteiro de verificação: Texto nítido e tela de jogo maior no celular

## Automático

```bash
npm run build      # check-maps + typecheck + vite build
```

## Desktop (Chrome)

1. `npm run dev` e abrir http://localhost:5173.
2. **Nitidez (H1, CS-001)**: em janelas de 1920×1080, 1366×768 e 2560×1440, conferir com zoom de captura:
   - menu (título, nomes, "N páginas", botões)
   - fase (HUD, aviso de controles)
   - pausa e fim de jogo (painéis)
   - revelação (sinopse inteira)

   Resultado esperado: contornos da fonte pixelada definidos, sem halo cinza.
3. **Alta densidade**: repetir com DPR 2 (DevTools → dispositivo personalizado com DPR 2, ou zoom do navegador em 200%).
4. **Redimensionar no meio da fase (RF-004)**: coletar 1 página, perder 1 vida, redimensionar a janela. Esperado: vidas, páginas e posição mantidas; HUD reposicionada; texto nítido.
5. **Redimensionar com a pausa aberta e com o fim de jogo aberto**: o painel continua aberto e no lugar certo; o jogo não despausa.
6. **Proporções**:
   - janela 21:9 (ex.: 1890×810): preenche sem faixas e mostra mais cenário
   - janela 4:3 (1024×768): faixas em cima e embaixo, nada cortado
   - janela muito larga (> 21:9): faixas nas laterais
7. **Fases (RF-011)**: atravessar o primeiro trecho de uma fase com o teclado. A física continua igual (alcance do pulo, carona na plataforma).

## Celular (manual, em aparelho real)

8. **Android/Chrome**: abrir a URL (deploy de preview ou IP local), deitar o aparelho e tocar em um livro. Esperado (CS-004): tela cheia, sem barra do navegador.
9. **Preenchimento (CS-003)**: sem faixas vazias; a raposa com a mesma altura relativa de antes (CS-005).
10. **Áreas seguras**: em aparelho com notch, corações, contador, pausa/mudo e botões de toque fora do notch e dos cantos.
11. **Botões**: andar e pular ao mesmo tempo; o polegar alcança e acerta os botões sem cobrir a raposa.
12. **Sair da tela cheia no meio da fase** (gesto de voltar): o jogo se ajusta e continua; ao tocar "Continuar"/"Jogar", pede tela cheia de novo.
13. **Girar para a vertical**: aparece "Gire o celular para jogar"; ao voltar, a fase continua do mesmo ponto.
14. **iPhone/Safari**: a dica "Adicionar à Tela de Início" aparece no menu e some ao tocar (e não volta). Depois de adicionar à Tela de Início, abrir pelo ícone: o jogo abre em tela cheia.
15. **Texto (H3)**: menu, HUD e revelação legíveis sem dar zoom.
