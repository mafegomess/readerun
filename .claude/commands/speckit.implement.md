---
description: Executa as tarefas de tasks.md da feature atual, fase por fase, marcando o progresso.
---

## Entrada

```text
$ARGUMENTS
```

A entrada pode limitar o escopo (ex.: "só a H1", "até T010").

## Passos

1. **Pré-condições**: a feature atual precisa ter `spec.md`, `plan.md` e `tasks.md`. Se existirem checklists em `checklists/` com itens abertos, mostre a tabela (checklist, total, feitos, pendentes) e pergunte se deve seguir mesmo assim.
2. **Carregue** a constituição, a spec, o plano, `research.md`, `data-model.md`, `contracts/` e `quickstart.md`.
3. **Execute fase por fase**, respeitando dependências; tarefas `[P]` podem ser feitas juntas.
   - Siga o estilo do código existente (TypeScript strict, comentários em PT-BR na mesma densidade, nomes como os atuais).
   - Ao concluir cada tarefa, marque `- [x]` no `tasks.md` na hora.
   - Em cada ponto de controle, verifique a história (typecheck e, se tiver gameplay, teste no navegador) antes de seguir.
   - Se uma tarefa se mostrar errada ou impossível, pare e reporte. Não improvise mudanças de escopo.
4. **Verificação final**: `npm run build` passando + roteiro do `quickstart.md` no navegador (desktop; toque quando aplicável). Relate com honestidade o que foi e o que não foi verificado.
5. **Relate**: tarefas concluídas, desvios do plano, o que testar manualmente e a sugestão de mensagem de commit. Não faça commit sem pedido.

Tudo em português do Brasil.
