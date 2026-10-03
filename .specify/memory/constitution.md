<!--
Relatório de sincronização
- Versão: 1.0.0 → 1.0.1 (PATCH, 2026-10-02)
- Princípio alterado: II. A leitura no centro — só o exemplo da regra atual de páginas (máximo de 20 → 50, decidido na spec 004); o princípio não muda
- Templates: nenhum cita o exemplo; nada a propagar
- Pendências: nenhuma (README.md e src/data/pageRule.ts atualizados na implementação da spec 004)
- Histórico: 1.0.0 ratificada em 2026-10-02 (princípios I a VII)
-->

# Constituição do Readerun

## Princípios

### I. Estático e gratuito

- O jogo DEVE rodar como site 100% estático no plano gratuito da Vercel.
- NÃO DEVE haver backend, banco de dados, contas ou serviços pagos sem emenda a esta constituição.
- O progresso DEVE ficar no `localStorage`, e o jogo DEVE funcionar normalmente (sem travar nem dar erro) quando o armazenamento estiver bloqueado ou vazio.

*Por quê:* custo zero e manutenção mínima; qualquer pessoa joga só abrindo o link.

### II. A leitura no centro

- Cada fase DEVE representar um livro.
- O livro só DEVE ser revelado quando o jogador coletar **todas** as páginas da fase.
- A quantidade de páginas DEVE ser proporcional ao tamanho do livro real, por uma regra única e centralizada (hoje em `src/data/pageRule.ts`: 1 a cada 20 páginas, entre 5 e 50).
- A revelação DEVE mostrar, no mínimo, capa, título, autor e uma sinopse/recomendação curta.
- Fases ainda não concluídas NÃO DEVEM revelar o título do livro.

*Por quê:* o objetivo do jogo é despertar vontade de ler; a mecânica serve à recomendação.

### III. Desktop e celular

- Toda mecânica DEVE ser jogável tanto no teclado quanto no toque.
- O jogo DEVE se adaptar a qualquer tela (resolução base 480×270, escala proporcional) e, no celular, ser jogado na horizontal.
- Nenhuma feature PODE depender de hover, teclado físico ou tela grande para ser concluída.

*Por quê:* boa parte do público vai abrir o link no celular.

### IV. Conteúdo orientado a dados

- Livros DEVEM ser definidos em dados (`src/data/books.json`) e fases em mapas do Tiled (`public/maps/*.json`).
- Adicionar ou trocar um livro NÃO DEVE exigir mudança de código.
- Regras de consistência do conteúdo DEVEM ser checadas automaticamente no build (hoje: `scripts/check-maps.ts`).
- Os scripts geradores NÃO DEVEM sobrescrever conteúdo editado à mão sem pedido explícito (`--force`).

*Por quê:* o catálogo de livros vai crescer e precisa ser fácil de editar.

### V. Arte e som livres de licença

- Arte e som DEVEM ser gerados por código, criados a partir de referências da pessoa usuária ou ter licença livre compatível (ex.: CC0).
- Capas DEVEM ser ilustrações próprias e genéricas, sem reproduzir capas de editoras.
- Textos de livros DEVEM ser sinopses autorais; citações, quando houver, curtas e com atribuição.

*Por quê:* evitar problemas de direitos autorais num projeto público.

### VI. Português do Brasil

- Todo texto do jogo DEVE estar em PT-BR, com acentuação correta.
- Specs, planos, tarefas e comentários de código DEVEM ser escritos em PT-BR.
- Glifos usados na interface DEVEM existir na fonte pixelada; caso contrário, troque por texto.

*Por quê:* público-alvo brasileiro e consistência da experiência.

### VII. Verificar antes de concluir

- Nenhuma feature é dada como pronta sem `npm run build` passando (checagem de mapas + typecheck + build).
- Mudanças de gameplay DEVEM ser testadas no navegador, e o que não pôde ser testado (ex.: toque em aparelho real) DEVE ser declarado.
- Fases DEVEM respeitar os limites da física documentados (pulo de ~4 tiles de altura e ~5 de distância), para serem sempre completáveis.

*Por quê:* jogo quebrado ou fase impossível destrói a experiência.

## Restrições técnicas

- Phaser **3** (fixado em `^3`; migrar para o 4 exige emenda), TypeScript em modo strict, Vite.
- Scripts de Node em `.ts`, executados direto pelo Node (sem etapa de build).
- Sem dependências de runtime além do Phaser, salvo justificativa no plano.

## Fluxo de desenvolvimento

1. Toda mudança relevante passa pelo Spec Kit: `/speckit.specify` → `/speckit.clarify` → `/speckit.plan` → `/speckit.tasks` → (`/speckit.analyze`) → `/speckit.implement`.
2. Antes de implementar, a pessoa usuária é entrevistada sobre escopo, abordagem e casos de borda.
3. Ajustes pequenos (texto, cor, bug óbvio) podem dispensar spec, mas continuam sujeitos ao princípio VII.
4. Commits só com pedido explícito.

## Governança

- Esta constituição prevalece sobre outras práticas do projeto.
- Emendas são feitas com `/speckit.constitution`, com versionamento semântico (MAJOR: remove ou redefine princípio; MINOR: adiciona; PATCH: redação).
- Todo `plan.md` DEVE conter a verificação contra estes princípios.

**Versão**: 1.0.1 | **Ratificada em**: 2026-10-02 | **Última emenda**: 2026-10-02
