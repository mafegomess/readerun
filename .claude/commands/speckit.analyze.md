---
description: Análise somente leitura da consistência entre spec.md, plan.md, tasks.md e a constituição, antes de implementar.
---

## Entrada

```text
$ARGUMENTS
```

## Regras

- **Somente leitura**: não altere nenhum arquivo. Ao final, ofereça correções e aplique só com aprovação.
- A constituição é inegociável aqui: conflito com ela é sempre CRÍTICO. Mudar princípio exige `/speckit.constitution`.

## Passos

1. Carregue `spec.md`, `plan.md`, `tasks.md` da feature atual e `.specify/memory/constitution.md`.
2. Procure:
   - **Cobertura**: requisito (RF/CS) sem tarefa; tarefa sem requisito ou história
   - **Duplicação**: requisitos repetidos ou quase iguais
   - **Ambiguidade**: termos vagos ("rápido", "intuitivo") sem métrica; marcadores pendentes
   - **Inconsistência**: termos diferentes para a mesma coisa; plano contradiz spec; ordem de tarefas impossível
   - **Constituição**: qualquer violação de princípio
   - **Lacunas**: casos de borda da spec sem tratamento no plano ou nas tarefas
3. Relate em tabela (ID, categoria, severidade CRÍTICO/ALTO/MÉDIO/BAIXO, local, resumo, recomendação), com no máximo 50 achados. Inclua a tabela de cobertura requisito → tarefas e as métricas (% de requisitos cobertos, quantidade de críticos).
4. Termine com as próximas ações: se houver CRÍTICO, resolver antes do `/speckit.implement`; senão, pode seguir. Pergunte se deve sugerir as edições concretas.

Tudo em português do Brasil.
