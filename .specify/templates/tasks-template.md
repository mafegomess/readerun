# Tarefas: [NOME DA FEATURE]

**Entrada**: documentos em `specs/[NNN-slug]/`
**Pré-requisitos**: plan.md (obrigatório), spec.md (obrigatório), research.md, data-model.md, contracts/ (se existirem)

## Formato: `- [ ] T000 [P?] [H?] Descrição com caminho do arquivo`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência)
- **[H1], [H2]...**: história da spec a que a tarefa pertence
- Sempre inclua o caminho exato do arquivo

## Fase 1: Preparação

- [ ] T001 [...]

## Fase 2: Fundação (bloqueia as histórias)

- [ ] T002 [...]

**Ponto de controle**: base pronta, as histórias podem começar

## Fase 3: História 1 – [título] (P1) 🎯 MVP

**Objetivo**: [...]
**Teste independente**: [...]

- [ ] T003 [P] [H1] [...]
- [ ] T004 [H1] [...]

**Ponto de controle**: História 1 funciona e foi testada sozinha

## Fase 4: História 2 – [título] (P2)

- [ ] T005 [H2] [...]

## Fase final: Acabamento e verificação

- [ ] T0XX `npm run build` passa (check-maps + typecheck + vite build)
- [ ] T0XX Roteiro do quickstart.md executado no navegador (desktop e, se aplicável, toque)
- [ ] T0XX README/docs atualizados

## Dependências e ordem

- Preparação → Fundação → histórias por prioridade (ou em paralelo) → acabamento
- Dentro de cada história: dados/modelos → lógica → interface → verificação
