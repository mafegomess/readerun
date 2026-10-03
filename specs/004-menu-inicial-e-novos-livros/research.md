# Pesquisa: Menu inicial, opções, créditos e novos livros

## D1 – Fluxo de telas

**Decisão**: cenas novas `Title` (menu inicial), `Options` e `Credits`. A estante atual (cena `Menu`) passa a ser a tela "Fases".

```text
Boot → Title ─ Jogar ───→ Menu (Fases) ─ livro ─→ Game/Hud → Reveal
         │   ← Voltar ─────┘   ↑ "Livros" (Hud/Reveal) volta à estante, como hoje
         ├─ Opções ──→ Options ─ Voltar/Esc ─→ Title
         └─ Créditos → Credits ─ Voltar/Esc ─→ Title
```

- A chave `Menu` da estante fica igual, para não mexer em `Hud`/`Reveal`. A estante ganha o título "Escolha um livro" e o botão "Voltar" (Esc), e perde o título "READERUN", que vai para o menu inicial.
- O sorteio da dica do iPhone (spec 002) e o botão de mudo passam da estante para o menu inicial, que é a primeira tela.
- Pedido de tela cheia no celular: no "Jogar" do menu inicial, além dos pontos atuais.
- Navegação por teclado como nas telas atuais: setas movem o foco, Enter confirma, Esc volta.

**Alternativa descartada**: transformar a estante no próprio menu inicial com abas. O pedido é um menu inicial próprio, e abas complicariam o layout no celular.

## D2 – Nome estilizado (logo) e menu inicial

**Decisão final (aprovada após 4 rodadas de prévia, com uma referência de tela inicial da pessoa usuária):**
- Logo `logo.png` gerado por código: "READERUN" com letras próprias numa grade 5×7 (perna do R e diagonal do N como traços contínuos), degradê suave de 5 tons nas cores da raposa, brilho só no topo e contorno duplo, sobre uma **placa de madeira** com pregos.
- Identidade da raposa: orelhas espiando por cima da placa e cauda com ponta branca saindo pela lateral.
- Fundo `shelf.png`: estante de madeira com lombadas coloridas nas laterais e o centro livre para o título e os botões.
- A raposa tem uma rotina: corre pela prateleira de baixo, para nas laterais, pula para pegar uma página que aparece no ar (com o brilho de coleta) e segue. Nunca para sob os botões.

**Descartado nas prévias**: página aberta sob o nome; livro aberto no lugar do "A" (dificultava a leitura); filetes de brilho dentro das letras; raposa parada sem ação.

## D3 – Fonte comum

**Decisão**: Atkinson Hyperlegible (Google Fonts, OFL), carregada junto com a Press Start 2P.
- `ui.text()` lê o estilo atual das opções: família e **escala de tamanho**. A pixelada usa 8/16 px; a legível usa ~11/20 px, para a mesma altura visual e o mesmo espaço de layout. O espaçamento entre linhas também acompanha a escala.
- Trocar a fonte nas opções reinicia a própria tela de opções. As demais telas já são recriadas ao abrir, então pegam a fonte nova. HUD e revelação não ficam abertas enquanto se mexe nas opções.
- O aviso HTML "Gire o celular" segue a mesma escolha (classe no `<body>`).
- O `main.ts` espera as duas fontes carregarem, com o mesmo limite de 2,5 s.

**Motivo da escala**: a Press Start 2P é larga e "pesada" a 8 px; a Atkinson a 8 px ficaria pequena demais. Com a escala, o layout atual (desenhado para 8 px pixelado) continua cabendo.

## D4 – Áudio com volumes separados

**Decisão**, mantendo a arquitetura atual de Web Audio:
- `master`: mudo geral (0 ou 0,6), como hoje: o atalho de mudo continua o mesmo (RF-007).
- `musicGain`: `0,35 × música/10`.
- `sfxGain` (novo): `efeitos/10`; todos os efeitos passam por ele (hoje vão direto ao `master`).
- Volumes de 0 a 10, padrão música 7 e efeitos 8. 0 = silenciado; a tela mostra "sem som" naquele item.
- Ajustar os efeitos toca um `sfx.page()` de exemplo.
- Antes de o áudio ser liberado (primeiro toque), os valores são guardados e aplicados quando o `AudioContext` nascer.

## D5 – Controles das opções

**Decisão**: linhas com foco, uma por opção:

```text
Música      [-]  ■■■■■■■□□□  [+]
Efeitos     [-]  ■■■■■■■■□□  [+]
Fonte       [ Pixelada ]  /  [ Legível ]
                  [ Voltar ]
```

- Toque/mouse: botões `-`/`+` e o seletor de fonte. Teclado: ↑/↓ escolhem a linha, ←/→ ajustam, Enter alterna a fonte, Esc volta.
- A barra é desenhada com retângulos (os glifos ■ □ não existem na fonte pixelada, princípio VI).
- Fica tudo dentro da área lógica de 480 de largura, centralizado em telas largas e afastado do notch.

## D6 – Livros e mapas

**Decisão**:
- `src/data/books.json`: remove `alice`; adiciona os 6 livros (dados abaixo). `public/maps/alice.json` é apagado.
- `src/data/pageRule.ts`: `MAX_GAME_PAGES` de 20 para **50** (RF-012). Mapas existentes continuam válidos (Dom Casmurro 13, O Alienista 5).
- Mapas novos com `npm run gen:maps -- <id>` para cada livro, em fases com uma seção por página. Um Defeito de Cor terá 48 seções (cerca de 1.300 tiles de largura e ~10 min de jogo). Os checkpoints a cada 3 seções e os limites de pulo continuam os mesmos.
- `check-maps` valida tudo no build (já usa a regra).
- Ordem na estante: Dom Casmurro, O Alienista e depois os 6 novos na ordem pedida; a estante pagina de 3 em 3.
- A tonalidade da música por fase segue a lista atual por índice.

**Desempenho**: um mapa de ~1.300×17 tiles em 3 camadas é leve para o Phaser (o tilemap só desenha a parte visível). O JSON fica com ~200 KB, aceitável.

### Conteúdo dos livros novos (para revisão da pessoa usuária)

Sinopses autorais, sem spoilers do desfecho, em tom de recomendação.

| id | Título | Autoria | Ano | Págs. | No jogo |
|---|---|---|---|---|---|
| `capitaes-da-areia` | Capitães da Areia | Jorge Amado | 1937 | 300 | 15 |
| `o-sol-e-para-todos` | O Sol é Para Todos | Harper Lee | 1960 | 350 | 18 |
| `jogos-vorazes` | Jogos Vorazes | Suzanne Collins | 2008 | 400 | 20 |
| `um-defeito-de-cor` | Um Defeito de Cor | Ana Maria Gonçalves | 2006 | 968 | 48 |
| `trono-de-vidro` | Trono de Vidro | Sarah J. Maas | 2012 | 392 | 20 |
| `quarto-de-despejo` | Quarto de Despejo | Carolina Maria de Jesus | 1960 | 200 | 10 |

**Capitães da Areia**: Nas ruas de Salvador, um grupo de meninos abandonados vive num trapiche à beira do mar e sobrevive de pequenos golpes, liderado pelo destemido Pedro Bala. Entre aventuras, amizade e liberdade, Jorge Amado mostra a infância que a cidade prefere não ver, com uma ternura que fica na memória.

**O Sol é Para Todos**: No Alabama dos anos 1930, a pequena Scout cresce entre brincadeiras e mistérios da vizinhança, até que seu pai, o advogado Atticus Finch, aceita defender um homem negro acusado injustamente. Um romance sobre justiça, empatia e coragem, contado pelo olhar de uma criança.

**Jogos Vorazes**: Em Panem, todo ano doze distritos enviam dois jovens para uma arena onde só um pode sair vivo, tudo transmitido como espetáculo. Quando a irmã caçula é sorteada, Katniss Everdeen se oferece no lugar dela. Uma distopia eletrizante sobre sobrevivência, desigualdade e o poder das imagens.

**Um Defeito de Cor**: Capturada ainda menina no Daomé e escravizada no Brasil, Kehinde narra sua vida inteira: a travessia, a Bahia do século XIX, a luta pela liberdade e a busca por um filho perdido. Um romance monumental que devolve ao leitor uma parte essencial da história do país.

**Trono de Vidro**: Celaena Sardothien, a assassina mais temida do reino, recebe uma chance de deixar as minas de sal onde cumpre pena: vencer uma competição mortal e se tornar campeã do rei que a aprisionou. Fantasia cheia de intriga, ação e magia escondida, abrindo uma série épica.

**Quarto de Despejo**: Nos anos 1950, Carolina Maria de Jesus, catadora de papel na favela do Canindé, em São Paulo, escreve em cadernos achados no lixo o dia a dia da fome, dos filhos e da cidade que a ignora. Um diário potente e lírico que se tornou um marco da literatura brasileira.

### Temas de cor (céu, morros, capa)

| id | skyTop | skyBottom | hillsFar | hillsNear | cover | coverAccent |
|---|---|---|---|---|---|---|
| capitaes-da-areia | `#2f7fb5` | `#ffd59e` | `#e0b57a` | `#c8955a` | `#b5542c` | `#ffe2a8` |
| o-sol-e-para-todos | `#f2b45c` | `#fff1c9` | `#9fb86b` | `#7a9a4f` | `#7a3b2e` | `#f6d27a` |
| jogos-vorazes | `#1f2a2e` | `#c4683a` | `#3e5a3e` | `#2b4430` | `#1e1e24` | `#e8a33d` |
| um-defeito-de-cor | `#3a2a5e` | `#e6a15a` | `#7a4a3a` | `#5a3326` | `#5b1f2e` | `#e9c46a` |
| trono-de-vidro | `#16233f` | `#7b8fc4` | `#3b4a7a` | `#283559` | `#1b2c4f` | `#c9d6f0` |
| quarto-de-despejo | `#7d8fa0` | `#e8d9b8` | `#8c8274` | `#6e665a` | `#6d5a3e` | `#f2e3c2` |

## D7 – Saves antigos

**Decisão**: nenhuma migração. A estante só mostra os livros de `BOOKS`; um `alice` em `completed` é ignorado (RF-010). Campos novos no save (`musicVolume`, `sfxVolume`, `font`) entram como opcionais, com padrões na leitura, na mesma chave `readerun:save:v1`.

## D8 – Créditos

**Texto** (tela rolável se não couber; ↑/↓ e arrasto também rolam):

```text
Readerun

Criação
Maria Fernanda Gomes Luiz

Código, arte e música
feitos com ajuda de IA: Claude (Anthropic)

Fontes
Press Start 2P — CodeMan38 (SIL Open Font License 1.1)
Atkinson Hyperlegible — Braille Institute (SIL Open Font License 1.1)

Motor
Phaser 3 — Phaser Studio (licença MIT)

Livros
As obras recomendadas pertencem a seus autores e editoras.
As capas do jogo são ilustrações próprias.

Obrigada por jogar e boa leitura!
```

Os glifos `—` e acentos precisam existir nas duas fontes (a conferir na prévia; se faltar, troca por hífen).

---

# Emenda H5 – Cenários e fases variados

## D9 – Temas de cenário (um por livro)

**Decisão**: cada livro aponta para um `scenery` em `books.json`. Cada cenário define o tileset (chão, beirada, tábuas), 3 enfeites e o desenho das camadas de fundo. As cores de céu/morros/capa continuam vindo do `theme` do livro.

| Livro | `scenery` | Chão (topo / corpo) | Tábua (one-way) | Enfeites | Fundo (longe / perto) |
|---|---|---|---|---|---|
| Dom Casmurro | `rio-antigo` | paralelepípedos cinza / terra | beiral de pedra | lampião, banco, vaso | morros com o Pão de Açúcar / casarões com telhados |
| O Alienista | `vila-colonial` | grama / terra vermelha | tábua de madeira | cerca, flores, barril | serra suave / casinhas da vila e a Casa Verde |
| Capitães da Areia | `praia` | areia / areia molhada | trapiche escuro | concha, caixote, corda | mar com barcos / postes do trapiche |
| O Sol é Para Todos | `cidade-pequena` | grama / barro vermelho | tábua pintada de branco | cerca branca, caixa de correio, arbusto | campos / casas de madeira com varanda e um carvalho |
| Jogos Vorazes | `floresta` | musgo / terra escura com raízes | tronco | cogumelo, samambaia, toco | pinheiros longe / pinheiros densos |
| Um Defeito de Cor | `costa-colonial` | pedra de cantaria / terra | convés de navio | coqueiro pequeno, baú, âncora | mar e navio / sobrados coloridos e igreja |
| Trono de Vidro | `castelo` | blocos de pedra azulada / pedra | vidro (translúcido) | tocha, estandarte, vaso | montanhas / torres com janelas de vidro |
| Quarto de Despejo | `favela` | terra batida com papel / terra | tábua velha | lata, caixote, pilha de papel | prédios da cidade / barracos de madeira e zinco |

Dom Casmurro e O Alienista dividem o desenho dos casarões (com cores e chão diferentes), como a spec permite.

## D10 – Tilesets por cenário

**Decisão**: um PNG por cenário (`tiles-<scenery>.png`), todos com o **mesmo layout**, para os índices dos mapas não dependerem do tema. O layout passa de 7×2 para **7×3** (21 tiles), com uma linha nova de **teto** (terra com a borda de baixo: esquerda, meio, direita, única) para os corredores, mais 3 enfeites extras de reserva. Extrusão mantida (margem 1, espaçamento 2).
- Desenho por código em `gen-assets.ts`, com uma função por cenário que pinta topo, corpo, beirada e tábua sobre a mesma geometria.
- `GameScene` usa `addTilesetImage('tiles', 'tiles-<scenery>')`, e o `gen-maps` grava no JSON o caminho do PNG do cenário (para o Tiled abrir certo).

## D11 – Fundos por cenário

**Decisão**: o fundo continua desenhado em tempo de execução (cores do livro), mas o formato das camadas vem de uma função por cenário em `src/systems/scenery.ts`: morros, mar com barcos, casarões, pinheiros, torres, barracos e prédios, sempre periódicos em 480 px, para a TileSprite emendar sem costura. Morros continuam como reserva.

## D12 – Obstáculos novos

| Tipo (Tiled) | Tamanho | Comportamento | Aviso | Propriedades |
|---|---|---|---|---|
| `falling` | 48×16 | tábua one-way; 0,45 s depois de pisada, treme e cai; volta ao lugar 2,5 s depois | treme 0,45 s | — |
| `spring` | 16×16 | ao cair sobre ela, lança a raposa com `vy = −520` (~8 tiles de altura); comprime na animação | mola visível | — |
| `spikeTrap` | 16×16 | ciclo: escondido (seguro) → pontas aparecem (seguro, 0,4 s) → em pé (mata, 1 s) | pontas antes de subir | `period` (s), `offset` (s) |

- Implementação na `GameScene`: plataforma que cai é um corpo imóvel com colisão só por cima (como as móveis), que vira corpo com gravidade ao cair e é reposto no tempo certo. A mola é uma sobreposição testada só com a raposa descendo. O espinho móvel alterna a área mortal pelo relógio da cena (pausa junto com o jogo).
- Ao perder vida e voltar ao checkpoint, plataformas que caíram voltam ao lugar.
- Arte nova em `gen-assets.ts`: `falling.png` (tábua rachada), `spring.png` (2 quadros: solta e comprimida) e `spiketrap.png` (3 quadros: escondido, pontas, em pé).

## D13 – Formatos de trecho

O gerador ganha trechos novos, sempre dentro dos limites da física:
- **Corredor com teto**: teto a 5 tiles do chão (a raposa pula 4), por 10 a 18 tiles; dentro, só buracos de até 3 e espinhos (nada de mola nem elevador).
- **Subida em andares**: tábuas em zigue-zague a cada 3 tiles de altura até um patamar alto, com a página no topo; a descida é pulando para o chão adiante.
- **Caminho alternativo**: rota alta por tábuas, com uma página, que volta ao caminho principal mais à frente. A rota baixa continua passável, e a alta é alcançável voltando um pouco (sem armadilha de mão única).
- **Parede com mola**: degrau de 6 a 7 tiles subido com mola (alternativa ao elevador).

## D14 – Receita de fase por livro

**Decisão**: `books.json` ganha `level`, com o peso de cada desafio e de cada formato. O gerador sorteia com esses pesos, mantendo a progressão de dificuldade atual (mais desafios difíceis perto do fim).

| Livro | Destaques da receita |
|---|---|
| Dom Casmurro | degraus, tábuas e caminhos alternativos (telhados); poucos perigos |
| O Alienista | curta e leve: buracos, espinhos, uma plataforma que cai |
| Capitães da Areia | plataformas móveis (barcos), buracos (mar), molas |
| O Sol é Para Todos | subidas em andares (árvore, casas), tábuas, caminhos alternativos |
| Jogos Vorazes | espinhos móveis (armadilhas), plataformas que caem (galhos), buracos |
| Um Defeito de Cor | longa e progressiva: de tudo, com corredores com teto (porão do navio) e plataformas móveis |
| Trono de Vidro | corredores com teto, espinhos móveis, vidro que cai, elevadores |
| Quarto de Despejo | subidas em andares (barracos), molas, buracos |

## D15 – Teste de que dá para terminar cada fase (CS-007)

**Decisão**: um script novo, `scripts/check-levels.ts`, roda no build depois do `check-maps`. Ele lê cada mapa, monta as "células onde dá para ficar de pé" (chão, tábuas, plataformas móveis e que caem ao longo do percurso) e liga essas células com as regras de salto:
- alcance horizontal de até 5 tiles;
- subida de até 3 tiles, ou 8 com mola;
- descida livre, menos dentro de buraco;
- teto limitando a altura do pulo.

Por busca no grafo, ele exige que:
- **a saída seja alcançável** a partir do início;
- **toda página seja alcançável**: há célula de pé a até 2 tiles na horizontal e até 3 abaixo dela;
- **toda página tenha volta**: da célula dela é possível chegar à saída.

Falha = build quebra, com a fase e a página indicadas.

**Motivo**: com obstáculos e formatos novos, a regra "o gerador respeita os limites" deixa de ser óbvia; o teste garante o princípio VII para qualquer mapa, inclusive editados no Tiled.

**Alternativa descartada**: simular a física de verdade com bots: caro, lento e frágil para rodar a cada build.
