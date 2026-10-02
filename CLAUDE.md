# Readerun

Jogo de plataforma 2D (Phaser 3 + TypeScript + Vite), site estático na Vercel. Visão geral e comandos no `README.md`.

## Como trabalhar neste projeto

- Siga a constituição: `.specify/memory/constitution.md`.
- Fluxo Spec Kit (comandos em `.claude/commands/speckit.*.md`, templates em `.specify/templates/`):
  `/speckit.specify` → `/speckit.clarify` → `/speckit.plan` → `/speckit.tasks` → `/speckit.analyze` (opcional) → `/speckit.implement`
- A estrutura do Spec Kit foi montada à mão (o `specify.exe` é bloqueado pelo Controle de Aplicativo do Windows nesta máquina). Não há scripts: os comandos numeram a feature e criam `specs/NNN-slug/` diretamente.
- Base do jogo documentada em `specs/001-mvp-raposa-leitora/` (spec, plano, modelo de dados).
- Entreviste a pessoa usuária antes de implementar. Tudo em PT-BR.
- Antes de concluir: `npm run build` e teste no navegador.
