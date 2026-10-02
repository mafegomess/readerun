# Tarefas: Plataforma móvel sem tremida e novo visual da raposa

**Entrada**: documentos em `specs/003-plataforma-estavel-e-nova-raposa/`
**Pré-requisitos**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/platform-carry.md](./contracts/platform-carry.md), [contracts/fox-animations.md](./contracts/fox-animations.md), [quickstart.md](./quickstart.md)

## Formato: `- [ ] T000 [P?] [H?] Descrição com caminho do arquivo`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência)
- **[H1]** plataforma móvel sem tremida · **[H2]** visual novo da raposa

## Fase 1: Preparação

- [x] T001 Guardar a medição "antes" da pesquisa (D1) como script reutilizável de verificação em `scratchpad` (iframe + `game.step()`, 60/120/144 Hz com intervalos irregulares, horizontal e elevador), para comparar depois da correção

## Fase 2: Fundação

*(nenhuma: as duas histórias são independentes)*

## Fase 3: História 1 – Plataforma móvel sem tremida (P1) 🎯 MVP

**Objetivo**: carona por passo de física, pé encostado, "no chão" estável
**Teste independente**: quickstart, passos 1 a 7

- [x] T002 [H1] `src/scenes/GameScene.ts`: no callback do collider raposa × plataformas, marcar `riding` só com `fox.touching.down && plataforma.touching.up && vy >= 0` (contrato, regra 1)
- [x] T003 [H1] `src/scenes/GameScene.ts`: registrar handler de `worldstep` (removido no `shutdown`) que aplica a carona (`deltaX` + pé no topo + `vy = 0`, sem carona durante `dying`) e depois limpa `riding`; remover a carona do `update()` (contrato, regra 2)
  - **Desvios registrados**: (a) a carona ficou **persistente**: começa no pouso (collider) e só termina ao pular, morrer, sair pela lateral ou se afastar mais de 4 px, porque no elevador descendo a colisão some por frações de pixel a cada passo; a `Fox` ganhou `supported`, que conta como chão. (b) "Pulou" passou a ser `vy < min(0, vy da plataforma) − 5`: no elevador subindo, a colisão dá à raposa a velocidade da plataforma (−35), e `vy >= 0` recusava a carona (a raposa voava na inversão do topo). (c) No `shutdown`, `this.physics.world` já é nulo: a referência do mundo é guardada ao registrar o evento.
- [x] T004 [H1] `src/scenes/GameScene.ts`: mover o controle de sentido/velocidade das plataformas do `update()` para o mesmo handler de `worldstep` e definir `friction.x = 0` nas plataformas (contrato, regras 3 e 4)
- [x] T005 [H1] `src/systems/Fox.ts`: "no chão" da animação com tolerância de ~60 ms (o pulo e o coyote time continuam usando o estado real) (research D3)
- [x] T006 [H1] Rodar a medição de T001 depois da correção: oscilação ≤ 1 px lógico, "no chão" sem piscar e só animação parada nos 6 cenários (horizontal/elevador × 60/120/144 Hz); conferir andar, pular, pousar na inversão, sair no topo do elevador e pausar sobre a plataforma (quickstart 2 a 6)
  - Resultado: 0 de oscilação, 0 piscadas e só `fox-idle` nos 6 cenários, em 10 s cada (antes: 5,25 px na horizontal a 60 Hz; 1,89 px e 2 piscadas no elevador). Andar, pular e pousar de volta, pousar na inversão, sair no topo do elevador (apertando antes do topo, como no MVP) e pausar: ok.
- [x] T007 [H1] Conferir a física inalterada: velocidade de 130 px/s e altura do pulo de ~62–64 px (quickstart 7, CS-004)
  - Resultado: 130 px/s e pulo de 62 px.

**Ponto de controle**: H1 pronta e medida; pode ir sozinha para produção

## Fase 4: História 2 – Visual novo da raposa (P2)

**Objetivo**: raposa original no estilo das referências, com as animações da ref. 2
**Teste independente**: quickstart, passos 8 a 12

- [x] T008 [P] [H2] Criar `src/data/foxFrames.ts` com `FOX_FRAMES` e `FOX_FRAME_COUNT` (data-model)
- [x] T009 [H2] `scripts/gen-assets.ts`: paleta nova (`FOX_*`, research D4), cabeça com olho grande retangular, focinho e peito brancos, orelhas com miolo branco (variante com orelha dobrada) e pernas marrom-escuras, mantendo pés na linha 30 e tronco centrado em x ≈ 16 (research D7)
- [x] T010 [H2] `scripts/gen-assets.ts`: cauda paramétrica (ângulo da base, curvatura, ponta branca com sombra) e as 19 poses na ordem de `FOX_FRAMES`: 5 do ciclo da cauda, 5 com orelha dobrada, 4 de corrida (cauda na passada), pulo esticado, queda com cauda levantada, 2 de pouso e dano (depende de T008 e T009)
- [x] T011 [H2] Gerar a **prévia** em `scratchpad`: folha ampliada e página HTML local com as animações rodando sobre os fundos escuro, claro e verde, também espelhadas; apresentar para aprovação e ajustar até aprovar (CS-003) (depende de T010)
  - Rodadas de aprovação: (1) cauda mais fluida → ciclo interpolado (Catmull-Rom) pelas 5 poses-chave; (2) ciclo mais calmo (~0,8 s, 16 quadros a 20 fps) e corrida em 6 quadros com trote calculado; (3) a corrida parecia andar para trás → corrigida a fase em que o pé levanta; (4) pixel do pé fazia parecer virado ao contrário → pé passou a avançar para a frente. Aprovado (folha de 43 quadros). Depois, na revisão no jogo: (5) orelha inclinando para a frente e corpo respirando; (6) a pessoa usuária pediu para tirar a orelha e mover corpo e cabeça juntos, guiados pela cauda (o aceno separado fazia a cabeça parecer sair do corpo). Por fim, o abaixamento do corpo passou de 1 para 2 px (`IDLE_DIP`), aprovado. Folha final: 27 quadros (864×32). Gerador ganhou `--out <pasta>` para prévias.
- [x] T012 [H2] Rodar `npm run gen:assets` com a arte aprovada (folha `fox.png` 608×32 e ícones `icon-*.png` regerados) (depende de T011)
- [x] T013 [H2] `src/scenes/BootScene.ts`: criar `fox-idle`, `fox-run`, `fox-jump`, `fox-fall`, `fox-land` e `fox-hurt` a partir de `FOX_FRAMES`, com os fps do contrato (depende de T008)
- [x] T014 [H2] `src/systems/Fox.ts`: escolher as animações pelo contrato: pouso na transição "no ar → no chão" sem comando horizontal (interrompível, sem afetar controle), orelha sorteada a cada 2–5 s só parada no chão, queda só depois da tolerância (depende de T005 e T013)
- [x] T015 [H2] Verificar no navegador os passos 9 a 12 do quickstart (todas as poses, espelhamento, pouso sem atraso de controle, menu, ícone, legibilidade nos 3 fundos) e repetir a medição de T006 com a arte nova (a agachadinha não pode reintroduzir tremida)
  - Resultado: orelha aparece sozinha parada; pulo → queda → pouso → parada; pousar já andando vai direto para a corrida, com a mesma aceleração (0 → 104 px/s em 100 ms); medição da carona repetida com a arte nova, incluindo pousar sobre a plataforma: 0 de oscilação e 0 piscadas. Raposa espelhada legível no fundo escuro.

**Ponto de controle**: raposa nova aprovada e integrada, sem regressão da H1

## Fase final: Acabamento e verificação

- [x] T016 [P] Emenda curta em `specs/001-mvp-raposa-leitora/plan.md`: carona por passo de física (`worldstep`) e folha da raposa com 19 quadros
- [x] T017 [P] Atualizar `README.md` (seção Arte e som: a raposa e suas animações vêm de `gen-assets.ts`; layout em `src/data/foxFrames.ts`)
- [x] T018 Rodar `npm run build` (check-maps + typecheck + vite build)
- [x] T019 Relatar o que foi medido e verificado, e listar o passo 13 do quickstart (aparelho real de 120 Hz) como teste manual pendente

## Dependências e ordem

- T001 → H1 (T002 → T003 → T004 → T005 → T006 → T007)
- H2: T008 e T009 em paralelo → T010 → T011 (aprovação) → T012; T013 depende de T008; T014 depende de T005 e T013; T015 por último
- H1 e H2 são independentes, mas T014 reaproveita a tolerância de T005, então a H1 vem antes
- **MVP sugerido**: só a H1, que já pode ir para produção enquanto a arte é aprovada
