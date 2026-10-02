# Pesquisa: Plataforma móvel sem tremida e novo visual da raposa

## D1 – Causa da tremida (medida)

**Medição** (iframe com quadros avançados por `game.step()`, Alice, 300 quadros, intervalos irregulares para simular um navegador real):

| Caso | Oscilação raposa × plataforma (lógico) | Na tela (px) | "No chão" piscando | Animações vistas |
|---|---|---|---|---|
| Horizontal, 60 Hz ±2 ms | **5,25** | **14** | 0 | parada |
| Horizontal, 120 Hz ±1,5 ms | 0 | 1 | 0 | parada |
| Horizontal, 144 Hz ±1,5 ms | 0 | 1 | 0 | parada |
| Elevador, 60 Hz | **1,89** | 5 | **2** | parada, **pulo, queda** |
| Elevador, 144 Hz | **1,89** | 6 | **2** | parada, **pulo, queda** |

Com intervalos perfeitamente regulares (60 e 144 Hz), a plataforma horizontal não oscilava: a tremida depende da irregularidade dos quadros, comum em navegadores e celulares.

**Diagnóstico**:
1. **Horizontal**: a carona é feita em `GameScene.update()` (uma vez por quadro de tela), somando `plataforma.body.deltaX()`. No Arcade Physics, `deltaX()` é o deslocamento do **último passo de física** (passo fixo de 60 Hz, conferido em `Body.update` e `World.update` do Phaser 3.90). Quando um quadro tem 0 passos (quadro curto), a carona soma um deslocamento que não aconteceu; quando tem 2 passos (quadro longo), soma só um dos dois. A raposa adianta e atrasa em relação à plataforma: a tremida.
2. **Elevador**: não há carona vertical. A cada passo, a gravidade separa a raposa da plataforma que desce ou a plataforma a empurra para cima. O "no chão" pisca e a animação alterna para pulo e queda.
3. Resta 1 px de tela de arredondamento (`roundPixels` com zoom fracionário), que equivale a ~0,4 px lógico e fica dentro do CS-002.

## D2 – Correção da carona

**Decisão**: fazer a carona **dentro do passo de física**, no evento `worldstep` do Arcade, que dispara depois do movimento dos corpos e das colisões de cada passo (ordem conferida em `World.step`).
- O callback do collider raposa × plataforma marca `riding = plataforma` quando a raposa está apoiada (`raposa.touching.down` e `plataforma.touching.up`) e não está subindo (`vy >= 0`).
- No `worldstep`: se `riding`, somar `plataforma.body.deltaX()` à posição do corpo da raposa e **encostar** o pé dela no topo da plataforma (`corpo.bottom = plataforma.top`), zerando a velocidade vertical. Depois, `riding = null` (é remarcado no próximo passo se o contato continuar).
- O controle das plataformas (inverter o sentido nas pontas) também passa para o `worldstep`, para cada passo usar o sentido certo mesmo com 2 passos no mesmo quadro.
- A carona nativa do Arcade (`friction.x` da plataforma) é desligada (`friction.x = 0`), para nunca somar em dobro.

**Motivo**: por passo, o deslocamento aplicado é exatamente o da plataforma naquele passo, em qualquer taxa de quadros (RF-004). Encostar o pé elimina a separação no elevador, e o "no chão" fica estável.

**Alternativas descartadas**:
- *Confiar só na carona nativa* (`friction`): ela só age quando há separação vertical naquele passo, por isso falhou no MVP. Não resolve o elevador.
- *Mover as plataformas por tween/posição*: mexe na física das plataformas e não resolve o problema de amostragem.
- *Passo de física igual à taxa de quadros* (`fixedStep: false`): física dependente do fps, o que contraria a CS-004 (pulo igual) e a VII.

## D3 – "No chão" para animação

**Decisão**: a animação usa um "no chão" com tolerância de ~60 ms: só considera "no ar" depois desse tempo sem contato. A física e o pulo continuam com o estado real e o coyote time atual. Evita piscar para queda em degraus de 1 px ou na inversão de plataformas, e dispara o pouso (D6) só em pousos de verdade.

## D4 – Arte nova (estilo das referências)

**Referências** (ver spec): (1) raposa de frente, pixel art de banco de imagens; (2) sprites de perfil animados, origem não identificada. Ambas de terceiros: o desenho é **original**, gerado por código em `scripts/gen-assets.ts`, sem copiar pixels.

**Paleta** (RF-010, cores aproximadas da ref. 1):

| Papel | Cor |
|---|---|
| laranja principal | `#f7a21b` |
| laranja claro (brilho) | `#ffc04a` |
| sombra marrom-avermelhada | `#c45a14` |
| marrom das pernas e pés | `#5a2a0e` |
| branco | `#ffffff` |
| sombra do branco | `#b9b9c2` |
| olho / contorno | `#2a1a14` |

**Forma** (ref. 2): perfil, proporção compacta, cabeça grande, cauda volumosa com ponta branca, orelhas pontudas com miolo branco, olho preto grande e retangular (2×3 px), focinho branco.

**Técnica**: manter as primitivas atuais (elipses, polígonos, linhas grossas, contorno automático), com uma cauda **paramétrica** (ângulo da base, curvatura, posição da ponta). Assim, as 5 posições do ciclo e as poses de corrida, pulo e queda saem da mesma função.

## D5 – Quadros e animações

| Animação | Quadros | Ritmo | Observação |
|---|---|---|---|
| `fox-idle` | 16 | 20 fps (~0,8 s/ciclo) | cauda numa curva fechada (Catmull-Rom) pelas 5 poses-chave; corpo e cabeça juntos abaixam até 2 px quando a cauda está baixa (emenda 3) |
| `fox-run` | 6 | 14 fps | trote calculado (diagonais em fase; pé apoiado vai para trás, levantado avança), corpo quica 2× por ciclo, cauda ondula com atraso |
| `fox-jump` | 1 | — | corpo esticado, cauda reta para trás |
| `fox-fall` | 1 | — | pernas estendidas, cauda levantada |
| `fox-land` | 2 | 15 fps, 1 vez | agachadinha; só se pousar sem andar; qualquer comando interrompe |
| `fox-hurt` | 1 | — | como hoje, com o visual novo |

Total: 27 quadros de 32×32 (folha de 864×32). *Ajustado nas revisões da prévia (o plano previa 19): cauda mais fluida, ciclo mais calmo, corrida suavizada e, por fim, sem a variante da orelha.* A ordem fica centralizada em `src/data/foxFrames.ts`, usada pelo gerador e pela `BootScene`, para não divergirem.

## D6 – Pouso sem atrasar o controle (RF-011)

**Decisão**: o pouso é só uma escolha de animação na `Fox`. Na transição "no ar → no chão" (com a tolerância de D3), se não houver comando horizontal, toca `fox-land` uma vez; ao terminar, ou com qualquer comando, segue para corrida, parada ou pulo. A física e o controle não esperam a animação.

## D7 – Colisão inalterada (RF-008)

O corpo continua 14×20 com deslocamento (9, 11). A arte nova mantém os pés na linha 30 do quadro e o tronco centrado em x ≈ 16, para que o espelhamento (`flipX`) continue alinhado ao corpo. A cauda pode passar do corpo, porque não colide.

## D8 – Aprovação do visual (CS-003)

Antes de integrar no jogo, gerar uma **prévia** em `scratchpad`: a folha ampliada e uma página HTML local com as animações rodando sobre os 3 fundos de fase (escuro, claro, verde). Só depois da aprovação o sprite entra no jogo e o ícone é regerado.
