---
description: Cria ou emenda a constituição do projeto (.specify/memory/constitution.md) e propaga as mudanças para os templates.
---

## Entrada

```text
$ARGUMENTS
```

Considere a entrada acima (se não estiver vazia) antes de prosseguir.

## Passos

1. Leia `.specify/memory/constitution.md`. Identifique princípios, seções, versão e datas atuais.
2. Interprete o pedido: novo princípio, alteração, remoção ou só esclarecimento de texto. Se for ambíguo, **pergunte antes de editar**: a constituição é decisão da pessoa usuária.
3. Defina a nova versão (versionamento semântico):
   - **MAJOR**: remove ou redefine princípio de forma incompatível
   - **MINOR**: adiciona princípio/seção ou amplia orientação de forma relevante
   - **PATCH**: redação, clareza, erros de digitação
4. Escreva a constituição atualizada:
   - Cada princípio com nome, regras declarativas e testáveis (use DEVE / NÃO DEVE) e uma linha de justificativa.
   - Atualize `Última emenda` com a data de hoje; mantenha `Ratificada em`.
   - No topo, um comentário HTML de **relatório de sincronização**: versão antiga → nova, princípios alterados, templates afetados.
5. Propague: confira `.specify/templates/plan-template.md` (tabela "Verificação da constituição"), `spec-template.md`, `tasks-template.md` e os comandos em `.claude/commands/speckit.*.md`. Ajuste o que referenciar princípios alterados.
6. Mostre um resumo: nova versão e motivo, arquivos alterados e sugestão de mensagem de commit. Não faça commit sem pedido.

Tudo em português do Brasil.
