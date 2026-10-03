# Contrato: obstáculos novos (emenda H5)

## Plataforma que cai (`falling`)

- Corpo imóvel, sem gravidade, colisão só por cima (como as plataformas móveis); participa da carona por passo (sem deslocamento horizontal).
- Primeiro contato por cima → estado `shaking` por 0,45 s (tremor de 1 px na arte, sem mover o corpo) → `falling` (gravidade ligada, sem colisão com a raposa depois de 0,15 s de queda) → some ao sair do mapa → volta ao lugar 2,5 s depois (`idle`).
- Ao perder vida e voltar ao checkpoint: todas as plataformas que caem voltam a `idle` na hora.

## Mola (`spring`)

- Sobreposição testada só quando a raposa está descendo (`vy > 0`) e com os pés na metade de cima da mola.
- Efeito: `vy = −PHYSICS.springVelocity` (520 px/s, ~135 px de altura); a raposa entra em `fox-jump`; a mola mostra o quadro comprimido por 120 ms; som `sfx.spring` (novo, curto).
- Soltar o botão de pulo não corta o impulso da mola (diferente do pulo normal).

## Espinho móvel (`spikeTrap`)

- Ciclo de `period` segundos (padrão 2,4), deslocado por `offset`: escondido (60% do ciclo, seguro) → pontas (0,4 s, seguro, quadro 2) → em pé (resto, mata, quadro 3).
- Tempo pelo relógio da cena (pausa junto com o jogo).
- A área mortal é a mesma do espinho fixo; só vale no estado "em pé".

## Validação

- `check-maps` aceita os três tipos; `check-levels` trata `falling` como chão, `spring` como ponto de subida de até 8 tiles e `spikeTrap` como passável (dá para pular por cima ou esperar).
- Restrição do gerador: nada de `spikeTrap` em spawn ou checkpoint, nem mola sob teto a menos de 9 tiles.
