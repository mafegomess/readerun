# Especificação: Texto nítido e tela de jogo maior no celular

**Feature**: `002-texto-nitido-tela-mobile`
**Criada em**: 2026-10-02
**Status**: Implementado e testado em aparelho real (2026-10-02)
**Pedido original**: "no desktop, a fonte está meio embaçada, causa dificuldade na leitura. No mobile, a tela de jogo está pequena demais, atrapalha a jogabilidade."
**Base**: [001 – MVP](../001-mvp-raposa-leitora/spec.md) (emenda a História 5 e o RF-014 no que diz respeito à apresentação)

## Cenários de uso e testes

### História 1 – Ler os textos sem esforço no computador (Prioridade: P1)

Quem joga no computador lê o menu, a HUD, os avisos e principalmente a sinopse da revelação com letras de contorno definido, sem aspecto borrado, independentemente do tamanho da janela ou do monitor.

**Por que essa prioridade**: a recomendação do livro é texto; se a leitura cansa, o propósito do jogo (princípio II) se perde.

**Teste independente**: abrir o menu, uma fase (com aviso na tela) e a revelação em janelas de tamanhos diferentes, e comparar a nitidez do texto.

**Cenários de aceitação**:

1. **Dado** um monitor comum (1080p) com o navegador em tela inteira, **quando** abro qualquer tela, **então** todos os textos aparecem com bordas definidas, sem halo ou borrão.
2. **Dado** que redimensiono a janela, **quando** o jogo se ajusta ao novo tamanho, **então** o texto continua nítido sem precisar recarregar.
3. **Dado** uma tela de alta densidade (ex.: notebook com tela "retina") ou zoom do navegador entre 100% e 200%, **então** o texto continua nítido.
4. **Dado** a tela de revelação, **quando** leio a sinopse a uma distância normal do monitor, **então** consigo ler o parágrafo inteiro confortavelmente.

---

### História 2 – Jogar no celular usando a tela inteira (Prioridade: P1)

Quem joga no celular (na horizontal) tem a área de jogo aproveitando a tela toda, sem bordas sobrando e sem a interface do navegador roubando espaço quando o aparelho permitir esconder. O tamanho da raposa e dos objetos, em si, já está bom e deve ser mantido.

**Por que essa prioridade**: hoje a área de jogo pequena atrapalha a jogabilidade no celular, que é um dos públicos principais (princípio III).

**Teste independente**: abrir uma fase num celular comum na horizontal e conferir quanto da tela o jogo ocupa.

**Cenários de aceitação**:

1. **Dado** um celular comum na horizontal, **quando** abro o jogo, **então** a área de jogo preenche a tela disponível, sem faixas vazias nas laterais nem em cima e embaixo.
2. **Dado** um celular com tela mais alongada que 16:9 (ex.: 20:9), **então** o jogo preenche a largura extra mostrando mais cenário, sem esticar nem distorcer a arte.
3. **Dado** um aparelho que permite esconder a interface do navegador, **quando** começo a jogar, **então** o jogo passa a ocupar a tela inteira; **e quando** o aparelho não permite (ex.: Safari no iPhone), o jogo ocupa o máximo da área visível e ensina como ganhar mais espaço, se houver um jeito.
4. **Dado** que estou jogando no celular, **então** a raposa e os objetos têm o mesmo tamanho relativo de hoje (proporcional à altura da tela).
5. **Dado** os botões de toque na tela, **então** eles têm tamanho confortável para o polegar e não cobrem a raposa durante o jogo normal.
6. **Dado** o aparelho na vertical, **então** continua aparecendo o aviso "Gire o celular para jogar" (o jogo segue só na horizontal).

---

### História 3 – Texto nítido também no celular (Prioridade: P2)

Os mesmos critérios de nitidez da História 1 valem no celular, onde o texto também precisa continuar legível com a tela maior.

**Teste independente**: abrir menu, HUD e revelação no celular.

**Cenários de aceitação**:

1. **Dado** um celular comum, **quando** abro qualquer tela, **então** o texto está nítido e com tamanho legível sem dar zoom.

---

### Casos de borda

- Barra de endereço do navegador do celular aparecendo e sumindo durante o jogo.
- Celulares com entalhe (notch) ou cantos arredondados: HUD e botões não podem ficar escondidos.
- Girar o aparelho no meio da fase: o jogo se reajusta sem perder o progresso da tentativa.
- Tablets (tela grande com toque) e notebooks com tela de toque.
- Janela de desktop muito estreita ou muito baixa.
- Sair da tela inteira (se ela for usada) no meio da fase.
- Telas com proporção diferente de 16:9 (ex.: celulares 20:9 e monitores ultrawide).

## Requisitos

### Requisitos funcionais

- **RF-001**: Todo texto do jogo DEVE ser exibido nítido (bordas definidas, sem borrão) em qualquer tamanho de janela, densidade de tela e zoom de navegador entre 100% e 200%.
- **RF-002**: Os textos DEVEM manter a estética pixelada atual (a mesma fonte pixelada em todo o jogo), apenas nítida e em tamanho legível.
- **RF-003**: A arte do jogo (sprites e cenário) DEVE continuar com pixels nítidos e uniformes, sem distorção, em qualquer tamanho de tela.
- **RF-004**: O jogo DEVE se reajustar a mudanças de tamanho ou orientação sem recarregar e sem perder o estado da tentativa.
- **RF-005**: No celular na horizontal, a área de jogo DEVE preencher a tela disponível, sem faixas vazias, em proporções de 16:9 até 21:9.
- **RF-006**: Em telas mais largas que 16:9, o jogo DEVE mostrar mais cenário na horizontal, sem esticar a arte, mantendo o tamanho da raposa proporcional à altura da tela.
- **RF-007**: Quando o aparelho permitir, o jogo DEVE ocupar a tela inteira, escondendo a interface do navegador. Se não permitir, DEVE aproveitar o máximo da área visível.
- **RF-008**: Os botões de toque DEVEM ter área de toque confortável (pelo menos cerca de 9 mm) e ficar fora das áreas inseguras da tela (notch, cantos arredondados).
- **RF-009**: HUD, botões de toque e avisos NÃO DEVEM se sobrepor entre si em nenhuma proporção de tela suportada.
- **RF-010**: O jogo continua jogável só na horizontal no celular; na vertical, mantém o aviso "Gire o celular para jogar".
- **RF-011**: As fases DEVEM continuar completáveis e com a mesma dificuldade; esta feature não altera física nem mapas.

## Critérios de sucesso

- **CS-001**: Comparando antes e depois lado a lado, num monitor 1080p, num 1440p e numa tela de alta densidade, nenhuma das telas (menu, fase, pausa, fim de jogo, revelação) apresenta texto borrado.
- **CS-002**: A sinopse da revelação (cerca de 300 caracteres) é lida por inteiro sem esforço a cerca de 60 cm de um monitor 1080p.
- **CS-003**: Num celular comum na horizontal, a área de jogo ocupa pelo menos 95% da área visível da tela (sem faixas vazias perceptíveis).
- **CS-004**: Em aparelhos Android com Chrome, o jogo fica em tela inteira (sem barra do navegador) a partir do primeiro toque para jogar.
- **CS-005**: A raposa mantém a mesma altura relativa à tela de hoje (~12% da altura), sem ficar maior nem menor.

## Premissas

- O problema de nitidez aparece em todos os textos do desktop, não só em uma tela.
- "Celular comum" = aparelho atual de 6" a 6,7", em Chrome (Android) ou Safari (iOS).
- No iPhone, o Safari não permite tela inteira para páginas comuns; ali vale o "máximo da área visível" (RF-007).
- Mostrar mais cenário nas laterais em telas largas é aceitável e não muda a dificuldade, porque só antecipa a visão do que vem pela frente.

## Esclarecimentos

### Sessão 2026-10-02

- P: No celular, o que está pequeno demais? → R: Só a área do jogo; o tamanho da raposa e dos objetos está ok.
- P: Qual orientação o jogo deve suportar no celular? → R: Só na horizontal (mantém o princípio III).
- P: Como deve ficar o visual dos textos? → R: Pixelado, mas nítido (mesma fonte pixelada em todo o jogo).

## Fora de escopo

- Redesenhar telas, trocar a arte ou mudar a física e os mapas.
- Aproximar a câmera ou mudar o tamanho da raposa e dos objetos (o tamanho atual está bom).
- Novos controles (ex.: joystick virtual) ou personalização de controles.
- Opções de tamanho de fonte ou acessibilidade avançada (podem virar feature própria).
