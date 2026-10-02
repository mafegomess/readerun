---
description: Entrevista a pessoa usuária para eliminar ambiguidades da spec atual (até 5 perguntas) e grava as respostas na spec.
---

## Entrada

```text
$ARGUMENTS
```

Considere a entrada acima (se não estiver vazia) como foco extra.

## Passos

1. **Feature atual**: use a branch git `NNN-slug` se existir em `specs/`; senão, a spec de maior número; se houver dúvida, pergunte. Leia `spec.md`.
2. **Varredura de ambiguidades**, marcando cada categoria como Clara / Parcial / Faltando:
   - Escopo e fora de escopo · regras de jogo e condições de vitória/derrota · fluxo de telas e estados
   - Dados e persistência (o que salva, o que reseta) · controles (teclado e toque) · casos de borda e falhas
   - Conteúdo (textos, livros, quantidade) · desempenho e dispositivos · acessibilidade · termos inconsistentes
3. **Monte no máximo 5 perguntas**, priorizadas por impacto × incerteza. Só entram perguntas cuja resposta muda o design, as regras ou os testes. Nada de detalhe que um padrão razoável resolve.
4. **Pergunte uma de cada vez** (AskUserQuestion), com 2–4 opções, a recomendada primeiro e marcada "(Recomendado)" com o motivo. Pare antes se tudo crítico estiver resolvido ou se a pessoa disser "pronto" ou "chega".
5. **Depois de cada resposta**, atualize a spec na hora:
   - Em `## Esclarecimentos` → `### Sessão AAAA-MM-DD`: `- P: <pergunta> → R: <resposta>`
   - Aplique a decisão na seção certa (requisito, cenário, caso de borda, premissa) e remova o que ficou contraditório.
6. **Relate**: perguntas feitas, seções alteradas, tabela de cobertura por categoria e a recomendação de seguir para `/speckit.plan` ou fazer outra rodada.

Tudo em português do Brasil.
