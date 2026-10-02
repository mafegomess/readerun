# Roteiro de verificação: Plataforma móvel sem tremida e novo visual da raposa

## Automático

```bash
npm run build      # check-maps + typecheck + vite build
```

## H1 – Plataforma sem tremida (medição no navegador)

1. `npm run dev`; numa aba, carregar o jogo num iframe e avançar quadros com `game.step()`, como na pesquisa (D1).
2. Para plataforma horizontal e elevador, a 60 Hz (±2 ms), 120 Hz (±1,5 ms) e 144 Hz (±1,5 ms), com a raposa parada sobre a plataforma por 300 quadros:
   - oscilação de `raposa.x − plataforma.x` (horizontal) e `raposa.bottom − plataforma.top` (elevador) **≤ 1 px lógico** (CS-002)
   - "no chão" **sem piscar**
   - animações vistas: só `fox-idle`
3. Andar sobre a plataforma em movimento: o deslocamento é suave e as velocidades se somam.
4. Pular a partir da plataforma e pousar de novo nela; pousar exatamente quando ela inverte o sentido.
5. Elevador: chegar ao topo e sair andando para o chão firme.
6. Pausar e retomar em cima da plataforma.
7. **Física (CS-004)**: velocidade de 130 px/s e altura de pulo ~62–64 px, iguais às de antes.

## H2 – Visual novo

8. **Prévia** (antes de integrar): folha ampliada + página local com as animações sobre fundos escuro, claro e verde → aprovação da pessoa usuária (CS-003).
9. No jogo: parada (cauda em ciclo, corpo acompanhando), corrida (cauda na passada), pulo (corpo esticado), queda (cauda levantada), pouso (agachadinha), dano; tudo também virado para a esquerda.
10. Pousar e já sair andando ou pulando: o controle responde na hora (RF-011).
11. Menu: a raposa que corre usa o visual novo. Ícone do app regerado.
12. Legibilidade sobre os fundos de Dom Casmurro, Alice e O Alienista.

## Celular (manual)

13. Num aparelho de 120 Hz (ex.: o Galaxy usado nos testes), subir nas plataformas horizontal e elevador: nenhuma tremida perceptível (CS-001).
