---
description: Cria a especificação de uma nova feature (specs/NNN-slug/spec.md) a partir de uma descrição em linguagem natural.
---

## Entrada

```text
$ARGUMENTS
```

O texto acima **é** a descrição da feature. Se estiver vazio, peça a descrição e pare.

## Passos

1. **Nome e número**
   - Gere um slug curto (2–4 palavras, minúsculas, sem acento, com hífens), ex.: `inimigos-patrulha`.
   - Próximo número: o maior `NNN` em `specs/` + 1, com 3 dígitos.
   - Crie `specs/NNN-slug/`. Se o repositório git estiver limpo o suficiente, crie e troque para a branch `NNN-slug`. Se houver mudanças não commitadas, pergunte antes de trocar de branch.
2. **Contexto**: leia `.specify/memory/constitution.md` e as specs existentes que tenham relação (principalmente `specs/001-*`, a base do jogo), para não contradizer o que já existe.
3. **Escreva** `specs/NNN-slug/spec.md` a partir de `.specify/templates/spec-template.md`:
   - Foco no QUÊ e no PORQUÊ do ponto de vista do jogador. Sem tecnologia, arquivos ou APIs.
   - Histórias priorizadas e testáveis de forma independente, com cenários Dado/Quando/Então.
   - Requisitos funcionais testáveis (RF-NNN) e critérios de sucesso mensuráveis (CS-NNN).
   - Para lacunas, use padrões razoáveis e registre em "Premissas". Use `[PRECISA ESCLARECER: ...]` só para o que muda escopo, regra de jogo ou experiência, e **no máximo 3**.
4. **Valide** a spec, criando `specs/NNN-slug/checklists/requisitos.md`:
   - Sem detalhe de implementação; requisitos testáveis e sem ambiguidade; critérios mensuráveis; casos de borda listados; escopo delimitado.
   - Corrija o que falhar (até 3 rodadas).
5. **Marcadores restantes**: se sobrar algum `[PRECISA ESCLARECER]`, apresente as perguntas com opções (use AskUserQuestion), atualize a spec com as respostas e registre em `## Esclarecimentos`.
6. **Relate**: caminho da spec, branch, resultado do checklist e próximo passo sugerido (`/speckit.clarify` se ainda houver dúvidas relevantes; senão, `/speckit.plan`).

Não implemente nada neste comando. Tudo em português do Brasil.
