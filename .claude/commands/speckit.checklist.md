---
description: Gera um checklist focado (ex.: UX, celular, acessibilidade, conteúdo) que valida a QUALIDADE DOS REQUISITOS da feature atual.
---

## Entrada

```text
$ARGUMENTS
```

O texto acima indica o tema do checklist (ex.: "celular", "acessibilidade", "regras de jogo"). Se estiver vazio, pergunte o tema com opções.

## Princípio

Checklist = "testes unitários do texto da spec". Ele pergunta se os requisitos estão **completos, claros, consistentes e mensuráveis**, e não se o código funciona.

- ✅ "Está definido o que acontece se o jogador fechar a aba durante a revelação?"
- ❌ "Testar se a revelação aparece"

## Passos

1. Leia `spec.md` (e `plan.md`/`tasks.md`, se existirem) da feature atual.
2. Se o tema ou a profundidade estiverem vagos, faça até 3 perguntas rápidas (AskUserQuestion).
3. Crie `specs/NNN-slug/checklists/<tema>.md` a partir de `.specify/templates/checklist-template.md`:
   - Itens `CHK001...` agrupados por categoria (Completude, Clareza, Consistência, Mensurabilidade, Casos de borda, Lacunas)
   - Cada item referencia a seção da spec (`[Spec §RF-003]`) ou marca `[Lacuna]`
   - Se o arquivo já existir, acrescente itens sem apagar os anteriores
4. Relate: caminho, quantidade de itens e os 3 pontos mais preocupantes.

Tudo em português do Brasil.
