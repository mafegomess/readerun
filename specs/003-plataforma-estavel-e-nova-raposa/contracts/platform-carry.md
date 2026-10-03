# Contrato: carona em plataformas móveis (por passo de física)

## Onde

`GameScene`, no evento `worldstep` do Arcade (`this.physics.world.on('worldstep', …)`), removido no `shutdown` da cena. Ordem dentro de cada passo (Phaser 3.90, `World.step`): corpos se movem → colliders → `worldstep`.

## Regras

1. **Marcação** (callback do collider raposa × plataformas): `riding = plataforma` se `raposa.body.touching.down && plataforma.body.touching.up && raposa.body.velocity.y >= 0`.
2. **Carona** (`worldstep`), só se `riding` e a raposa não estiver morrendo:
   - `raposa.body.x += plataforma.body.deltaX()`
   - `raposa.body.y = plataforma.body.top − raposa.body.height` (pé encostado no topo)
   - `raposa.body.velocity.y = 0`
   - depois: `riding = null` (remarcado no próximo passo se o contato continuar)
3. **Controle da plataforma** (`worldstep`, para cada plataforma): inverter o sentido nas pontas do percurso e definir a velocidade do próximo passo (lógica atual, só mudada de lugar).
4. **Carona nativa desligada**: `plataforma.body.friction.x = 0`.
5. **Pulo**: `vy < 0` impede a marcação; a raposa sai da plataforma normalmente.
6. **Morte** (`dying`): sem carona; a colisão já é desligada hoje.
7. **Pausa**: a cena pausada não executa passos, então não há carona.

## Invariantes verificáveis (CS-001/002)

- Parada sobre a plataforma durante um ciclo inteiro: oscilação de `raposa.x − plataforma.x` ≤ 1 px lógico; `raposa.body.bottom − plataforma.body.top` ≈ 0.
- "No chão" sem piscar e animação só `fox-idle` enquanto parada sobre a plataforma.
- **Na tela**: com a raposa parada sobre a plataforma, o vai-e-vem dela e a irregularidade do chão ficam abaixo de 1 px de tela (câmera sem arredondar a rolagem, física a 240 passos/s; research D9).
- Valem a 60, 120 e 144 Hz, com intervalos irregulares entre quadros.
