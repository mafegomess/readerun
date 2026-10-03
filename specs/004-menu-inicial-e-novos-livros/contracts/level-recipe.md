# Contrato: receita de fase e cenário por livro (emenda H5)

```jsonc
{
  "id": "jogos-vorazes",
  "scenery": "floresta",
  "level": {
    "weights": { "gap": 3, "spikes": 1, "spikeTrap": 3, "falling": 3, "floating": 2, "stepUp": 1, "stepDown": 1, "movingH": 1, "lift": 0, "springWall": 1 },
    "formats": { "ceiling": 0, "climb": 1, "branch": 1 }
  }
}
```

- O gerador lê `level` do livro; pesos ausentes valem 0. Um livro sem `level` usa a receita padrão (a de hoje).
- `formats`: a cada seção, a chance de virar um trecho especial é proporcional à soma dos pesos (no máximo 1 em cada 3 seções); o tipo é sorteado pelos pesos.
- Semente por `id` do livro, como hoje: a mesma receita gera sempre o mesmo mapa.
- `npm run gen:maps -- --force` refaz todos; `npm run gen:maps -- <id>` refaz um.
- O cenário (`scenery`) escolhe `tiles-<scenery>.png`, os enfeites e o fundo; as cores continuam em `theme`.
