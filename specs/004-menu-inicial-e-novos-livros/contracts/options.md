# Contrato: opções (áudio e fonte)

## `src/systems/save.ts`

```ts
save.musicVolume: number   // 0–10, get/set (arredonda e limita)
save.sfxVolume: number     // 0–10
save.font: 'pixel' | 'legivel'
```

Setters persistem na hora; falha de armazenamento é silenciosa (o valor vale na sessão).

## `src/systems/audio.ts`

```ts
audio.muted: boolean              // como hoje
audio.toggleMute(): boolean       // como hoje: só o ganho master (0 ↔ 0,6)
audio.setMusicVolume(v: number)   // salva e aplica: musicGain = 0,35 × v/10
audio.setSfxVolume(v: number)     // salva e aplica: sfxGain = v/10
```

- Grafo: osciladores de efeito → `sfxGain` → `master` → saída; música → `musicGain` → `master`.
- Ao criar o `AudioContext` (primeiro gesto), os ganhos começam com os valores salvos.
- Mudar um volume não altera `muted`, e vice-versa (RF-007).

## Fonte (`src/ui.ts` + `src/config.ts`)

```ts
currentFont(): { family: string; scale: number }   // a partir de save.font
text(scene, x, y, str, opts)                       // fontSize = round(size × scale); lineSpacing = round(base × scale)
```

- `FONTS.pixel` (escala 1) é o padrão; `FONTS.legivel` usa escala 1,375.
- `document.body.dataset.font = save.font` mantém o aviso HTML "Gire o celular" na mesma fonte.
- Trocar a fonte: a tela de opções reinicia a si mesma; as outras pegam a fonte nova quando são abertas.
