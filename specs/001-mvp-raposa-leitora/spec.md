# Especificação: MVP – A raposa leitora

**Feature**: `001-mvp-raposa-leitora`
**Criada em**: 2026-10-02
**Status**: Implementado (documentação retroativa do MVP, commit `ccde68f`)
**Pedido original**: "Jogo de navegador em estilo runner. O jogador é uma raposa que corre e precisa recuperar páginas de livros perdidas. Cada fase representa um livro diferente, e ao pegar todas as páginas necessárias o livro é revelado e o jogador recebe uma recomendação."

> Esta spec registra o comportamento **atual** do jogo, servindo de base para as próximas features. Ajustes futuros devem referenciá-la ou emendá-la, sem contradizê-la em silêncio.

## Cenários de uso e testes

### História 1 – Jogar uma fase e recuperar as páginas (Prioridade: P1)

O jogador escolhe um livro, controla a raposa por uma fase de plataforma, desvia de buracos e espinhos, usa plataformas e coleta as páginas espalhadas.

**Por que essa prioridade**: é o núcleo do jogo; sem isso não existe nada.

**Teste independente**: abrir qualquer fase, andar, pular, coletar uma página e ver o contador subir.

**Cenários de aceitação**:

1. **Dado** que a fase começou, **quando** o jogador anda e pula, **então** a raposa se move com aceleração suave, e segurar o pulo faz ela pular mais alto do que um toque rápido.
2. **Dado** que a raposa encosta numa página, **então** a página some com brilho e som, e o contador `coletadas/total` aumenta.
3. **Dado** que a raposa está sobre uma plataforma móvel, **quando** a plataforma se desloca, **então** a raposa é carregada junto.
4. **Dado** que a raposa está embaixo de uma tábua flutuante, **quando** pula, **então** atravessa a tábua por baixo e pode pousar em cima.

---

### História 2 – Revelar o livro e receber a recomendação (Prioridade: P1)

Com todas as páginas coletadas, a saída (um púlpito com livro) se abre. Ao chegar nela, as páginas voam até o livro, que é revelado com capa, título, autor, ano e uma sinopse em "Por que ler".

**Por que essa prioridade**: é a recompensa e o propósito do jogo (recomendar leitura).

**Teste independente**: coletar todas as páginas de uma fase, tocar a saída e ver a tela de revelação.

**Cenários de aceitação**:

1. **Dado** que ainda faltam páginas, **quando** a raposa toca a saída, **então** aparece "Faltam N páginas!" (ou "Falta 1 página!") e a fase continua (aviso no máximo a cada 2,5 s).
2. **Dado** que a última página foi coletada, **então** a saída muda para o livro aberto e brilhante, e aparece "Todas as páginas! Leve-as até o livro.".
3. **Dado** que a saída está aberta, **quando** a raposa a toca, **então** a fase termina, o livro é marcado como lido e a tela de revelação aparece.
4. **Dado** que estou na revelação, **então** posso voltar para "Livros" ou "Jogar de novo".

---

### História 3 – Vidas, checkpoints e fim de jogo (Prioridade: P1)

O jogador tem 3 vidas por tentativa. Cair num buraco ou encostar num espinho custa uma vida. Marcadores de livro (checkpoints) guardam o ponto de retorno.

**Por que essa prioridade**: dá desafio sem frustração excessiva.

**Teste independente**: perder vidas de propósito e observar a volta ao checkpoint e o fim de jogo.

**Cenários de aceitação**:

1. **Dado** que a raposa encosta num marcador, **então** ele fica vermelho e passa a ser o ponto de retorno.
2. **Dado** que a raposa perde uma vida e ainda restam vidas, **então** ela volta ao último marcador (ou ao início), **mantendo as páginas já coletadas** nesta tentativa.
3. **Dado** que a última vida foi perdida, **então** aparece "Fim de jogo – As páginas se espalharam de novo..." com "Tentar de novo" (recomeça a fase do zero: 3 vidas, 0 páginas) e "Livros".

---

### História 4 – Escolher livros no menu (Prioridade: P2)

O menu mostra os livros como capas. Livros não lidos aparecem misteriosos ("Livro N", capa com "?") e com a quantidade de páginas; livros lidos mostram capa ilustrada, título e o botão "Ver livro".

**Teste independente**: abrir o menu antes e depois de concluir uma fase.

**Cenários de aceitação**:

1. **Dado** o primeiro acesso, **então** todos os livros estão liberados, mas nenhum título é revelado.
2. **Dado** que concluí um livro, **quando** volto ao menu (mesmo após recarregar a página), **então** ele aparece revelado, com "Ver livro" abrindo a recomendação.
3. **Dado** que há mais de 3 livros, **então** o menu pagina de 3 em 3 com setas.

---

### História 5 – Jogar no celular (Prioridade: P2)

**Cenários de aceitação**:

1. **Dado** um aparelho de toque, **então** aparecem botões de esquerda, direita e pulo; deslizar o dedo entre esquerda e direita funciona, e é possível andar e pular ao mesmo tempo (multitoque).
2. **Dado** um aparelho de toque na vertical, **então** aparece "Gire o celular para jogar".

---

### Casos de borda

- **Aba em segundo plano**: o jogo pausa sozinho; a música não "despeja" notas acumuladas ao voltar.
- **Armazenamento bloqueado** (modo privado): o jogo funciona normalmente, só não guarda o progresso.
- **Fonte pixelada indisponível** (sem internet): após 2,5 s o jogo inicia com fonte monoespaçada.
- **Morrer e tocar a saída ao mesmo tempo**: a morte tem prioridade; a fase não é concluída durante a animação de dano.
- **Mapa editado com número de páginas diferente do esperado**: o build falha no `check:maps`; em desenvolvimento, o jogo usa as páginas que existem no mapa (sempre completável) e avisa no console.
- **Retomar da pausa com o dedo/tecla pressionada**: não dispara pulo fantasma.

## Requisitos

### Requisitos funcionais

- **RF-001**: Cada livro DEVE ter uma fase própria com início, páginas a coletar, perigos e uma saída.
- **RF-002**: O número de páginas da fase DEVE ser `clamp(round(páginas_do_livro / 20), 5, 20)`.
- **RF-003**: O comprimento da fase DEVE crescer com o número de páginas (uma "seção" de desafios por página).
- **RF-004**: O jogador DEVE controlar a raposa livremente (esquerda, direita, pulo), com pulo de altura variável, tolerância de pulo logo após sair da borda e "memória" de pulo apertado pouco antes de pousar.
- **RF-005**: Perigos DEVEM incluir buracos, espinhos e plataformas móveis (horizontais e elevadores verticais), além de tábuas atravessáveis por baixo.
- **RF-006**: O jogador DEVE ter 3 vidas por tentativa; perder vida → volta ao checkpoint mantendo páginas; zerar vidas → fim de jogo e recomeço do zero.
- **RF-007**: A saída DEVE permanecer trancada até 100% das páginas e informar quantas faltam.
- **RF-008**: A revelação DEVE mostrar capa ilustrada, título, autor, ano e sinopse; livros não lidos NÃO DEVEM ter o título exibido em lugar nenhum.
- **RF-009**: Livros concluídos DEVEM ficar salvos no navegador e ser exibidos como lidos no menu.
- **RF-010**: Todos os livros DEVEM estar liberados desde o início.
- **RF-011**: O jogo DEVE ter pausa (botão, P ou Esc) com Continuar, Reiniciar fase e Livros.
- **RF-012**: O jogo DEVE ter música e efeitos sonoros, com botão de mudo lembrado entre sessões.
- **RF-013**: No desktop, a fase DEVE começar com uma dica dos controles.
- **RF-014**: Toda a interface DEVE estar em PT-BR.

### Entidades principais

- **Livro**: id, título, autor, ano, número de páginas do livro real, mapa, sinopse e tema de cores (céu, morros, capa).
- **Fase (mapa)**: camadas de chão, tábuas e decoração, mais objetos: início (1), saída (1), páginas (N), checkpoints, espinhos e plataformas móveis (com percurso e velocidade).
- **Progresso salvo**: lista de livros concluídos e preferência de mudo.
- **Tentativa**: vidas restantes, páginas coletadas e ponto de retorno (não é salva; reseta ao sair ou no fim de jogo).

## Critérios de sucesso

- **CS-001**: As 3 fases iniciais podem ser concluídas respeitando os limites do pulo (buracos ≤ 4 tiles, degraus ≤ 2 tiles, tábuas a 3 tiles de altura).
- **CS-002**: Concluir uma fase leva da coleta da última página até a revelação em menos de 3 s.
- **CS-003**: O progresso sobrevive a recarregar a página.
- **CS-004**: O build de produção passa (checagem de mapas + typecheck) e o site roda como estático.

## Premissas

- Livros de exemplo em domínio público (Dom Casmurro, Alice no País das Maravilhas, O Alienista), com páginas aproximadas (256, 160, 96); serão trocados pela pessoa usuária.
- 3 vidas, aproximadamente 1 checkpoint a cada 3 seções.
- Arte e áudio gerados por código.

## Fora de escopo (MVP)

- Inimigos, pontuação/estrelas, ranking, contas, salvamento na nuvem.
- Desbloqueio progressivo de fases.
- Link externo para compra do livro e citações.
