# Contrato: animações da raposa

Criadas na `BootScene` a partir de `FOX_FRAMES` (`src/data/foxFrames.ts`). Escolhidas pela `Fox` a cada quadro.

| Chave | Quadros | fps | Repete | Quando toca |
|---|---|---|---|---|
| `fox-idle` | `idle` (16) | 20 | sempre | no chão, sem comando horizontal |
| `fox-run` | `run` (6) | 14 | sempre | no chão, com comando horizontal |
| `fox-jump` | `jump` (1) | — | — | no ar, subindo (`vy < 0`) |
| `fox-fall` | `fall` (1) | — | — | no ar, descendo, depois de ~60 ms sem chão (tolerância da animação) |
| `fox-land` | `land` (2) | 15 | 1 vez | ao pousar sem comando horizontal; interrompida por qualquer comando ou pulo |
| `fox-hurt` | `hurt` (1) | — | — | ao levar dano (como hoje) |

## Regras

- **"No chão" da animação**: `blocked.down || touching.down || supported` (apoiada numa plataforma móvel, ver platform-carry.md), com tolerância de ~60 ms antes de virar "no ar". O pulo e o coyote time continuam usando o estado real (sem mudança).
- **Pouso**: detectado na transição "no ar" → "no chão" da animação. Não altera velocidade nem entrada (RF-011).
- **Espelhamento**: `flipX` como hoje; todos os quadros funcionam espelhados.
- **Menu**: a raposa que corre no menu usa `fox-run`, então troca automaticamente.
