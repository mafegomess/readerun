# Especificação: Menu inicial, opções, créditos e novos livros

**Feature**: `004-menu-inicial-e-novos-livros`
**Criada em**: 2026-10-02
**Status**: Implementado e testado em aparelho real (2026-10-03)
**Pedido original**: "Quero criar um menu inicial que contenha o nome do jogo estilizado de uma forma que combine com o personagem e com o tema. O menu deve ter um botão que permite o jogador fazer alterações básicas de opções, como tirar a fonte pixelada, diminuir ou mutar a musica e os efeitos sonoros. Deve ter um botão com os créditos de criação do jogo. E deve ter um botão para acessar as fases. Nesse novo spec também quero fazer alterações nos livros que estão no jogo, tirar alice e colocar novos."
**Base**: [001 – MVP](../001-mvp-raposa-leitora/spec.md) (História 4, menu de livros; RF-002 regra de páginas, emendada aqui; RF-012 mudo), [002](../002-texto-nitido-tela-mobile/spec.md) (RF-002, fonte pixelada) e [003](../003-plataforma-estavel-e-nova-raposa/spec.md) (raposa)

> São cinco partes independentes: menu inicial, opções, créditos, troca de livros e (emenda) cenários e fases variados.

## Cenários de uso e testes

### História 1 – Abrir o jogo num menu inicial com a cara do Readerun (Prioridade: P1)

Ao abrir o jogo, a pessoa vê uma tela inicial com o nome "Readerun" estilizado, combinando com a raposa e com o tema de livros e páginas, e três botões: **Jogar** (leva às fases), **Opções** e **Créditos**.

**Por que essa prioridade**: é a primeira impressão do jogo e o ponto de entrada para tudo o que vem depois.

**Teste independente**: abrir o jogo e navegar pelos três botões, com mouse, teclado e toque.

**Cenários de aceitação**:

1. **Dado** que abro o jogo, **quando** o carregamento termina, **então** vejo o menu inicial (e não mais direto a estante de livros).
2. **Dado** o menu inicial, **então** o nome do jogo aparece estilizado, com elementos que remetem à raposa e aos livros/páginas, com a raposa presente na tela.
3. **Dado** o menu inicial, **quando** escolho "Jogar", **então** vou para a tela de escolha das fases (a estante de livros atual).
4. **Dado** a tela de fases ou o fim de uma revelação, **quando** escolho voltar, **então** volto ao menu inicial (a partir da estante) ou à estante (a partir da revelação, como hoje).
5. **Dado** qualquer tela do menu, **então** consigo navegar com mouse, teclado (setas + Enter, Esc para voltar) e toque.

---

### História 2 – Ajustar opções básicas (Prioridade: P1)

Em "Opções", a pessoa ajusta o volume da música e dos efeitos sonoros (separadamente, inclusive zerando/mutando cada um) e escolhe entre a fonte pixelada e uma fonte comum, mais fácil de ler. As escolhas ficam salvas.

**Por que essa prioridade**: acessibilidade e conforto (leitura e som); a fonte pixelada pode cansar quem lê a sinopse.

**Teste independente**: mudar cada opção, sair e voltar ao jogo (inclusive recarregando a página) e conferir que valeram.

**Cenários de aceitação**:

1. **Dado** a tela de opções, **quando** diminuo o volume da música, **então** a música fica mais baixa na hora; **e quando** levo a zero ou marco "sem música", **então** ela não toca.
2. **Dado** a tela de opções, **quando** ajusto os efeitos sonoros, **então** ouço um efeito de exemplo no novo volume, e os efeitos no jogo seguem esse volume.
3. **Dado** a tela de opções, **quando** troco para a fonte comum, **então** todos os textos do jogo (menus, HUD, avisos, revelação) passam a usar a fonte comum, nítida e legível; **e quando** volto para a pixelada, tudo volta.
4. **Dado** que mudei opções, **quando** recarrego a página, **então** as opções continuam como deixei.
5. **Dado** o botão de mudo que já existe no menu e na HUD, **então** ele continua funcionando como atalho de "silenciar tudo", sem apagar os volumes escolhidos nas opções.

---

### História 3 – Ver os créditos (Prioridade: P2)

Em "Créditos", a pessoa vê quem criou o jogo e o que foi usado para fazê-lo.

**Teste independente**: abrir os créditos e voltar ao menu.

**Cenários de aceitação**:

1. **Dado** a tela de créditos, **então** vejo "Maria Fernanda Gomes Luiz" como criadora do jogo e uma menção de que código, arte e música foram feitos com ajuda de IA (Claude, da Anthropic).
2. **Dado** a tela de créditos, **então** aparecem também os créditos obrigatórios ou de boa prática: fontes Press Start 2P (licença OFL, autoria CodeMan38) e Atkinson Hyperlegible (licença OFL, Braille Institute) e o motor Phaser.
3. **Dado** créditos maiores que a tela, **então** dá para rolar ou eles passam automaticamente.

---

### História 4 – Trocar os livros do jogo (Prioridade: P1)

Alice no País das Maravilhas sai do jogo e entram livros novos, cada um com sua fase, quantidade de páginas proporcional ao tamanho do livro, capa ilustrada, sinopse e tema de cores.

**Por que essa prioridade**: o catálogo é o coração do jogo (princípio II); a pessoa usuária quer escolher os livros recomendados.

**Teste independente**: abrir a estante e jogar uma fase de cada livro novo até a revelação.

**Cenários de aceitação**:

1. **Dado** a estante de livros, **então** Alice não aparece mais, e continuam Dom Casmurro e O Alienista e aparecem os 6 livros novos (páginas da edição de referência da pessoa usuária → páginas no jogo pela regra nova, máximo de 50):

   | Livro | Autoria | Págs. | No jogo |
   |---|---|---|---|
   | Capitães da Areia | Jorge Amado | 300 | 15 |
   | O Sol é Para Todos | Harper Lee | 350 | 18 |
   | Jogos Vorazes | Suzanne Collins | 400 | 20 |
   | Um Defeito de Cor | Ana Maria Gonçalves | 968 | 48 |
   | Trono de Vidro | Sarah J. Maas | 392 | 20 |
   | Quarto de Despejo | Carolina Maria de Jesus | 200 | 10 |
2. **Dado** um livro novo, **então** ele tem fase própria, completável, com páginas proporcionais ao tamanho do livro (1 a cada 20 páginas, de 5 a **50**) e tema de cores próprio.
5. **Dado** a regra nova, **então** livros longos geram fases longas e mais difíceis: Um Defeito de Cor tem 48 páginas a coletar, com checkpoints ao longo do caminho como nas demais.
3. **Dado** um livro novo concluído, **então** a revelação mostra capa ilustrada, título, autor, ano e uma sinopse autoral.
4. **Dado** um jogador que já tinha concluído Alice, **quando** abre a versão nova, **então** nada quebra: o progresso de Alice é ignorado e o dos outros livros continua valendo.

---

### História 5 – Cada livro com cenário e fase próprios (Prioridade: P1) *(emenda)*

Cada livro ganha um cenário visual ligado à sua história (chão, fundo e enfeites próprios) e uma fase com estrutura diferente: sua própria mistura de desafios, obstáculos novos e trechos com formatos variados. Hoje todas as fases parecem iguais (mesma grama, mesmos morros, mesma receita de obstáculos).

**Por que essa prioridade**: a variedade é o que faz valer a pena jogar cada livro; com 8 fases, a repetição fica evidente.

**Teste independente**: abrir duas fases quaisquer e perceber, nos primeiros segundos, que são lugares diferentes e que os desafios mudam.

**Cenários de aceitação**:

1. **Dado** qualquer par de fases, **então** elas têm chão, fundo e enfeites diferentes, ligados ao tema de cada livro (ex.: praia e trapiche em Capitães da Areia, floresta em Jogos Vorazes, castelo em Trono de Vidro, cidade em Quarto de Despejo). Livros com ambientação parecida (Dom Casmurro e O Alienista, ambos de Machado no século XIX) podem dividir peças, mas não o cenário inteiro.
2. **Dado** cada livro, **então** a fase tem uma mistura própria de desafios (ex.: uma com mais plataformas móveis, outra com mais buracos e espinhos, outra com mais subidas).
3. **Dado** o conjunto de fases, **então** existem obstáculos novos, usados de forma variada entre os livros: plataformas que caem pouco depois de pisadas, molas/trampolins que lançam a raposa mais alto e espinhos que sobem e descem.
4. **Dado** o conjunto de fases, **então** existem trechos com formatos diferentes: corredores com teto (cavernas/interiores), subidas em vários andares e caminhos alternativos com páginas escondidas.
5. **Dado** qualquer fase, **então** ela continua completável com a física atual, com as páginas na quantidade da regra e com checkpoints ao longo do caminho.
6. **Dado** os obstáculos novos, **então** eles são legíveis (dá para entender o que fazem só de ver) e avisam antes de agir (a plataforma treme antes de cair; o espinho mostra a ponta antes de subir).

---

### Casos de borda

- Armazenamento bloqueado: opções valem só na sessão; o jogo funciona com os padrões.
- Trocar a fonte com a HUD ou a revelação abertas: a troca vale ao voltar para essas telas (ou na hora, se possível), sem quebrar o layout.
- Fonte comum com textos longos (sinopse, créditos): continuam cabendo ou rolando.
- Volume zero na música com o mudo geral desligado, e vice-versa: os dois controles não brigam.
- Navegador sem áudio liberado (antes do primeiro toque): as opções continuam ajustáveis, valendo quando o áudio liberar.
- Celular na horizontal: menu inicial, opções e créditos cabem na tela (16:9 a 21:9) e respeitam o notch.
- Mais de 3 livros: a estante já pagina de 3 em 3.
- Save antigo com "alice" concluído.
- Livro concluído cuja fase foi refeita: continua concluído (o progresso é por livro, não por mapa).
- Plataforma que cai com a raposa em cima de outra plataforma móvel, ou ao morrer e voltar ao checkpoint: as plataformas que caíram voltam ao lugar.
- Mola embaixo de um teto baixo: a fase não pode lançar a raposa contra um teto que a prenda.
- Caminho alternativo com página: precisa ter volta, para a raposa não ficar presa nem perder a página obrigatória.
- Espinho que sobe e desce sobre um checkpoint ou no ponto de reaparecimento: não pode haver.

## Requisitos

### Requisitos funcionais

- **RF-001**: O jogo DEVE abrir num menu inicial com o nome estilizado e os botões Jogar, Opções e Créditos.
- **RF-002**: O nome estilizado DEVE remeter à raposa e ao tema de livros/páginas, em pixel art coerente com o jogo, e a raposa DEVE aparecer no menu inicial.
- **RF-003**: "Jogar" DEVE levar à estante de fases atual; a estante DEVE ter um caminho de volta ao menu inicial.
- **RF-004**: As opções DEVEM permitir ajustar separadamente o volume da música e o dos efeitos (incluindo silenciar cada um) e escolher entre fonte pixelada e fonte comum.
- **RF-005**: As opções DEVEM valer na hora e ficar salvas no navegador.
- **RF-006**: A fonte comum DEVE ser de alta legibilidade (Atkinson Hyperlegible, licença OFL), valer em todos os textos do jogo e ser nítida em qualquer tela (mesmos critérios da spec 002).
- **RF-007**: O mudo geral existente DEVE continuar como atalho, sem apagar os volumes escolhidos.
- **RF-008**: Os créditos DEVEM listar a criadora (Maria Fernanda Gomes Luiz), a ajuda de IA (Claude, da Anthropic) e os recursos de terceiros usados (fontes Press Start 2P e Atkinson Hyperlegible, ambas OFL, e Phaser).
- **RF-009**: Alice DEVE sair do jogo; os novos livros DEVEM entrar com fase, páginas proporcionais, capa ilustrada genérica, sinopse autoral e tema de cores (princípios II, IV e V).
- **RF-012**: A regra de páginas por livro DEVE passar a ser 1 a cada 20 páginas do livro, com mínimo de 5 e **máximo de 50** (emenda ao RF-002 da spec 001). Livros cujo resultado não muda (todos com até 400 páginas) mantêm suas fases.
- **RF-013** *(emenda)*: Cada livro DEVE ter um cenário próprio (chão, fundo em camadas e enfeites) ligado ao tema da história, gerado por código como o resto da arte (princípio V).
- **RF-014** *(emenda)*: Cada livro DEVE ter uma receita própria de fase (mistura e frequência dos desafios, formatos de trecho), definida em dados junto do livro (princípio IV).
- **RF-015** *(emenda)*: O jogo DEVE ganhar três obstáculos novos: plataforma que cai (treme, cai e volta ao lugar depois), mola/trampolim (lança mais alto que o pulo normal) e espinho móvel (sobe e desce em ciclo, com aviso antes de subir).
- **RF-016** *(emenda)*: O gerador DEVE produzir trechos com teto, subidas em vários andares e caminhos alternativos com páginas, sempre dentro dos limites da física (pulo de ~4 tiles de altura e ~5 de distância, mola conforme o plano).
- **RF-017** *(emenda)*: Todas as 8 fases DEVEM ser refeitas com o novo gerador; a validação no build DEVE continuar conferindo páginas, início e saída, e passar a conferir os objetos novos.
- **RF-010**: Saves antigos com livros removidos NÃO DEVEM quebrar o jogo.
- **RF-011**: Todas as telas novas DEVEM funcionar com mouse, teclado e toque, em desktop e celular (princípio III).

### Entidades principais

- **Opções**: volume da música, volume dos efeitos, mudo geral (já existe), estilo de fonte (pixelada/comum).
- **Livro**: como na 001, com os livros novos.
- **Créditos**: lista de pessoas/papéis e de recursos de terceiros com licença.

## Critérios de sucesso

- **CS-001**: Do carregamento ao início de uma fase, no máximo 2 toques/cliques a partir do menu inicial (Jogar → livro).
- **CS-002**: As opções sobrevivem a recarregar a página.
- **CS-003**: Com a fonte comum, a sinopse de ~300 caracteres é lida sem esforço a cerca de 60 cm de um monitor 1080p e num celular comum.
- **CS-004**: Cada livro novo pode ser concluído do início à revelação, e o build valida a quantidade de páginas de cada mapa.
- **CS-005**: A pessoa usuária aprova o nome estilizado (prévia antes de integrar, como na raposa).
- **CS-006** *(emenda)*: Em capturas lado a lado do início de cada fase, as 8 são reconhecivelmente diferentes; a pessoa usuária aprova os cenários (prévia antes de integrar).
- **CS-007** *(emenda)*: Todas as fases são completáveis: um teste automático percorre cada fase verificando que cada salto exigido está dentro da física e que toda página obrigatória é alcançável e tem volta.

## Premissas

- A estante de livros atual vira a tela "Fases"; o menu inicial é uma tela nova antes dela.
- Fonte pixelada continua sendo o padrão; a fonte comum é opcional.
- Volumes em passos simples (ex.: 0 a 10), com o mudo geral à parte.
- Os mapas são gerados por um gerador ampliado (emenda), com o tamanho proporcional ao livro; Dom Casmurro e O Alienista também são refeitos (decisão padrão, para revisão).
- Capas continuam ilustrações genéricas (princípio V) e sinopses são autorais, escritas no plano e revisadas pela pessoa usuária. Os livros novos não estão em domínio público: o jogo cita título e autoria e recomenda a leitura, sem reproduzir texto ou capas das editoras.
- Ordem na estante: os livros atuais primeiro, depois os novos na ordem em que foram listados (8 livros, 3 páginas de estante).
- Um Defeito de Cor fica com 48 páginas no jogo (regra nova, máximo de 50); a fase fica cerca de 2,4× mais longa que a maior atual. Checkpoints continuam a cada 3 páginas; o fim de jogo continua recomeçando a fase do zero (regra da 001).

## Esclarecimentos

### Sessão 2026-10-02

- P: Dom Casmurro e O Alienista continuam? → R: Sim, os dois continuam; só Alice sai.
- P: Quais livros novos entram? → R: Capitães da Areia (Jorge Amado, 300 págs.), O Sol é Para Todos (Harper Lee, 350), Jogos Vorazes (Suzanne Collins, 400), Um Defeito de Cor (Ana Maria Gonçalves, 968), Trono de Vidro (Sarah J. Maas, 392) e Quarto de Despejo (Carolina Maria de Jesus, 200).
- P: (pedido da pessoa usuária) Manter a proporção em Um Defeito de Cor? → R: Sim: o máximo da regra passa de 20 para 50 páginas, para dar mais dificuldade.
- **Emenda (H5)** – P: Qual decisão alterar? → R: As duas: o cenário igual em todas as fases (desde o MVP) e o "fora de escopo" da 004 sobre jogabilidade/mapas.
- P: Como deve ser a variedade visual? → R: Um tema por livro, ligado à história (livros parecidos podem dividir peças).
- P: Que variedade de estrutura? → R: Mistura própria por livro, obstáculos novos e formatos de fase (teto, subidas em andares, caminhos alternativos).
- P: Qual fonte comum? → R: Alta legibilidade (Atkinson Hyperlegible).
- P: O que aparece nos créditos? → R: Maria Fernanda Gomes Luiz como criadora, os créditos à IA e aos recursos de terceiros.

## Fora de escopo

- Outras opções (controles personalizados, idioma, dificuldade, tela cheia manual).
- Mudanças na física da raposa (velocidade, pulo) e no visual dela. *(Emenda: obstáculos e estrutura das fases passaram a fazer parte do escopo — História 5.)*
- Progresso em nuvem, contas ou ranking.
