---
description: Quebra o plano da feature atual em tarefas executáveis e ordenadas (tasks.md), agrupadas por história.
---

## Entrada

```text
$ARGUMENTS
```

## Passos

1. **Feature atual**: a branch `NNN-slug` ou a spec de maior número. Exija `plan.md` e `spec.md`; se faltar, indique o comando anterior e pare. Leia também `research.md`, `data-model.md`, `contracts/` e `quickstart.md`, se existirem.
2. **Gere** `tasks.md` a partir de `.specify/templates/tasks-template.md`:
   - Fases: Preparação → Fundação → uma fase por história (na ordem de prioridade da spec) → Acabamento.
   - Formato estrito: `- [ ] T001 [P] [H1] Verbo + o quê em caminho/do/arquivo.ts`
   - `[P]` só quando os arquivos forem diferentes e não houver dependência.
   - Cada história deve terminar testável sozinha, com um ponto de controle.
   - A fase final sempre inclui `npm run build` e o roteiro do `quickstart.md` no navegador.
   - Tarefas pequenas o bastante para revisar uma a uma. Nada de tarefas genéricas tipo "implementar a feature".
3. **Relate**: total de tarefas, quantidade por história, oportunidades de paralelismo, o MVP sugerido (normalmente só a H1) e o próximo passo (`/speckit.analyze`, opcional, ou `/speckit.implement`).

Tudo em português do Brasil.
