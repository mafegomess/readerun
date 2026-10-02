---
description: Gera o plano técnico da feature atual (plan.md, research.md, data-model.md, contracts/, quickstart.md) a partir da spec.
---

## Entrada

```text
$ARGUMENTS
```

Use a entrada acima (se houver) como orientação técnica extra.

## Passos

1. **Feature atual**: a branch `NNN-slug` ou a spec de maior número em `specs/`. Leia `spec.md` e `.specify/memory/constitution.md`.
   - Se a spec ainda tiver `[PRECISA ESCLARECER]` ou nenhuma sessão de esclarecimento em tema com ambiguidade relevante, avise e sugira `/speckit.clarify` antes. Siga só se a pessoa confirmar.
2. **Conheça o código atual** antes de decidir: leia os arquivos que a feature vai tocar (cenas em `src/scenes/`, sistemas em `src/systems/`, dados em `src/data/`, scripts em `scripts/`). O plano deve encaixar no que existe, sem reescrever à toa.
3. **Escreva** `plan.md` a partir de `.specify/templates/plan-template.md`:
   - Preencha o contexto técnico.
   - **Verificação da constituição**: avalie cada princípio. Violações só entram justificadas na tabela "Riscos e complexidade". Violação injustificada = pare e reporte.
4. **Fase 0** → `research.md`: para cada dúvida técnica, registre Decisão / Motivo / Alternativas descartadas.
5. **Fase 1** (só o que se aplicar):
   - `data-model.md`: entidades novas ou formatos alterados (ex.: campos novos em `books.json`, objetos/propriedades do Tiled, chaves do save)
   - `contracts/`: formatos de arquivo, eventos entre cenas (ex.: `hud:*`), propriedades de objetos do Tiled
   - `quickstart.md`: roteiro de verificação passo a passo, no navegador e nos scripts
6. **Reavalie a constituição** depois do design e atualize a tabela.
7. **Relate**: artefatos gerados, decisões principais e próximo passo (`/speckit.tasks`).

Não implemente nada neste comando. Tudo em português do Brasil.
