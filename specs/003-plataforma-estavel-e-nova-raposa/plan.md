# Plano de implementação: Plataforma móvel sem tremida e novo visual da raposa

**Feature**: `003-plataforma-estavel-e-nova-raposa` | **Data**: 2026-10-02 | **Spec**: [spec.md](./spec.md)

## Resumo

**H1**: a tremida foi medida e explicada ([research.md](./research.md), D1). A carona na plataforma é aplicada uma vez por quadro de tela, com o deslocamento do último passo de física. Isso oscila em quadros irregulares (até 14 px na tela a 60 Hz), e o elevador nem tem carona vertical. A correção move a carona para dentro de cada passo de física (evento `worldstep`): soma o deslocamento horizontal e encosta o pé da raposa no topo da plataforma. A animação passa a usar um "no chão" com tolerância.

**H2**: raposa redesenhada por código no estilo das referências (paleta laranja vivo, olho grande, contorno). As animações ganham o movimento da referência 2: cauda balançando, cauda na passada, corpo esticado no pulo, pouso e orelha. A prévia é aprovada antes de integrar.

## Contexto técnico

**Linguagem/versão**: TypeScript strict, Phaser 3.90 (Arcade Physics, passo fixo de 60 Hz)
**Dependências principais**: nenhuma nova
**Armazenamento**: sem mudanças
**Testes/verificação**: medição automatizada da oscilação (iframe + `game.step()`, 60/120/144 Hz com intervalos irregulares); `npm run build`; prévia da arte aprovada pela pessoa usuária; teste em aparelho real a 120 Hz
**Plataforma-alvo**: desktop e celular (60–144 Hz)
**Restrições**: colisão e física da raposa inalteradas; quadro de 32×32
**Escala/escopo**: 1 cena, 1 classe, 1 gerador, 1 arquivo de dados novo

## Verificação da constituição

| Princípio | Atende? | Observação |
|---|---|---|
| I. Estático e gratuito | ✅ | Nada muda na hospedagem |
| II. A leitura no centro | ✅ | Não afeta páginas nem revelação |
| III. Desktop e celular | ✅ | A correção vale para qualquer taxa de quadros (inclui celulares de 120 Hz) |
| IV. Conteúdo orientado a dados | ✅ | Mapas e livros intocados; ordem dos quadros centralizada em dados |
| V. Arte e som livres de licença | ✅ | Arte original gerada por código; referências de terceiros ficam fora do git e só orientam o estilo |
| VI. Português do Brasil | ✅ | — |
| VII. Verificar antes de concluir | ✅ | Medição antes e depois (CS-001/002), física conferida (CS-004), aparelho real declarado |

*Reavaliação pós-design*: sem violações.

## Estrutura afetada

```text
src/scenes/GameScene.ts      carona e controle das plataformas no evento worldstep; friction.x = 0; remove a carona do update()
src/systems/Fox.ts           "no chão" com tolerância para animação; pouso; orelha aleatória na pose parada; novas chaves de animação
src/data/foxFrames.ts        NOVO: layout dos 19 quadros (índices por animação), compartilhado por gerador e Boot
src/scenes/BootScene.ts      animações criadas a partir de foxFrames.ts (idle, run, jump, fall, land, hurt)
scripts/gen-assets.ts        raposa redesenhada: paleta nova, olho grande, cauda paramétrica, 27 quadros (19 no plano original; ajustado nas revisões da prévia); ícones regerados
public/assets/fox.png        folha nova (864×32)
public/assets/icon-*.png     regerados com a raposa nova
specs/001-…/plan.md          emenda curta: carona por passo de física
```

## Fase 0 – Pesquisa

Concluída em [research.md](./research.md): D1 causa medida · D2 carona no `worldstep` · D3 "no chão" com tolerância · D4 arte e paleta · D5 quadros · D6 pouso · D7 colisão · D8 aprovação.

## Fase 1 – Design

- **Modelo de dados**: [data-model.md](./data-model.md) (layout da folha da raposa).
- **Contratos**: [contracts/fox-animations.md](./contracts/fox-animations.md) (chaves de animação, quadros e quando cada uma toca) e [contracts/platform-carry.md](./contracts/platform-carry.md) (regras da carona por passo).
- **Roteiro de verificação**: [quickstart.md](./quickstart.md).

### Ordem sugerida

1. **H1 primeiro**: é independente, já medida, e pode ir sozinha para produção se a arte demorar.
2. **H2**: gerar a prévia → aprovação → integrar (folha, animações, `Fox`) → ícones.

## Correções pós-implementação

No teste em aparelho real, a tremida continuava (era a câmera, não a carona) e a cauda do pulo aparecia cortada. Ver research D9 e tarefas T020–T023: câmera sem arredondar a rolagem, física a 240 passos/s, quadros afastados da borda e verificação automática no gerador.

## Riscos e complexidade

| Risco / desvio | Por que é necessário | Alternativa mais simples descartada porque |
|---|---|---|
| Encostar o pé na plataforma a cada passo | elimina a separação vertical no elevador | só a carona horizontal deixaria o elevador piscando |
| Lógica no `worldstep` (fora do `update` da cena) | é o único ponto que roda uma vez por passo de física | o `update` roda por quadro de tela, que é a causa da tremida |
| Folha de 19 quadros desenhada por código | animações pedidas (cauda, pouso, orelha) | editar à mão num programa de pixel art não é reprodutível e foge do princípio V do projeto |
| Aprovação estética é subjetiva | CS-003 depende da pessoa usuária | prévia com animação e fundos reais reduz idas e vindas |
