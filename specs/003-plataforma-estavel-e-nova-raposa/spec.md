# Especificação: Plataforma móvel sem tremida e novo visual da raposa

**Feature**: `003-plataforma-estavel-e-nova-raposa`
**Criada em**: 2026-10-02
**Status**: Implementado e testado em aparelho real de 120 Hz (2026-10-02)
**Pedido original**: "quando a raposa está em cima da plataforma móvel ela começa a dar uma tremidinha, não deveria acontecer. Além disso quero fazer alterações na sprite da raposa, tenho algumas referencias para você"
**Base**: [001 – MVP](../001-mvp-raposa-leitora/spec.md) (História 1, cenário 3; RF-005) e [002](../002-texto-nitido-tela-mobile/spec.md) (nitidez da arte)

> As duas histórias são independentes: podem ser planejadas juntas e entregues separadamente.

## Cenários de uso e testes

### História 1 – Andar sobre plataformas móveis sem tremer (Prioridade: P1)

Quando a raposa sobe numa plataforma móvel (horizontal ou elevador), ela acompanha a plataforma de forma suave, sem tremer, esteja parada, andando ou pulando a partir dela.

**Por que essa prioridade**: é um defeito visível na jogabilidade atual; a tremida passa sensação de jogo quebrado e atrapalha a precisão do pulo.

**Teste independente**: subir numa plataforma horizontal e num elevador de qualquer fase e observar a raposa durante pelo menos um ciclo completo de ida e volta.

**Cenários de aceitação**:

1. **Dado** que a raposa está parada sobre uma plataforma horizontal, **quando** a plataforma se move e inverte o sentido, **então** a raposa acompanha sem tremer e sem escorregar em relação à plataforma.
2. **Dado** que a raposa está parada sobre um elevador, **quando** ele sobe e desce, **então** a raposa acompanha sem tremer, sem afundar na plataforma e sem trocar de animação (continua "parada", sem piscar para "caindo").
3. **Dado** que a raposa anda sobre a plataforma em movimento, **então** o movimento é suave, e a velocidade dela se soma à da plataforma.
4. **Dado** que a raposa está sobre a plataforma, **quando** pula, **então** o pulo funciona como no chão firme, e ela pode pousar de novo na plataforma.
5. **Dado** que a câmera acompanha a raposa sobre a plataforma, **então** a tela também não treme.

---

### História 2 – Raposa com visual novo (Prioridade: P2)

A raposa ganha um visual novo e animações mais vivas, criados a partir das referências enviadas pela pessoa usuária, mantendo a estética de pixel art do jogo. O movimento da cauda e do corpo segue o estilo da referência 2.

**Por que essa prioridade**: melhora a identidade visual; não bloqueia a jogabilidade.

**Teste independente**: abrir o menu e uma fase e ver a raposa nova em todas as animações (parada, correndo, pulando, caindo, pousando, levando dano).

**Cenários de aceitação**:

1. **Dado** o novo visual aprovado, **então** a raposa aparece com ele em todos os lugares: na fase, na raposa que corre no menu e no ícone do app.
2. **Dado** cada estado da raposa (parada, correndo, pulando, caindo, pousando, dano), **então** existe uma animação ou pose correspondente no novo visual.
3. **Dado** a raposa parada, **então** a cauda balança num ciclo de cerca de 5 posições (diagonal para cima → quase vertical → curvada no alto → reta para trás → caída com a ponta curvada), com o corpo e a cabeça se movendo juntos, guiados pela cauda: com a cauda no alto o corpo fica em cima; com a cauda baixa ele abaixa até 2 px (passando por 1 px).
4. **Dado** a raposa correndo, **então** a cauda sobe e desce no ritmo da passada.
5. **Dado** a raposa subindo num pulo, **então** o corpo fica esticado e a cauda reta para trás; **e quando** está caindo, a cauda fica levantada.
6. **Dado** que a raposa toca o chão depois de um pulo ou queda, **então** ela faz uma agachadinha rápida antes de voltar à pose normal, sem atrasar o controle (dá para andar ou pular de novo na hora).
7. **Dado** as referências, **então** o desenho as segue de perto (paleta, formas e proporções), adaptado ao pixel art de 32×32. Se a referência for um personagem de terceiros, vira uma versão original no mesmo estilo.
8. **Dado** a mudança de visual e de animação, **então** a física e a área de colisão continuam iguais (a cauda não colide), e as fases continuam completáveis. O tamanho do quadro continua 32×32.

---

### Casos de borda

- Plataforma invertendo o sentido exatamente quando a raposa pousa nela.
- Raposa na borda da plataforma (metade do corpo para fora).
- Elevador chegando ao topo, com a raposa saindo para o chão firme.
- Plataforma móvel encostando numa parede ou no chão com a raposa em cima.
- Pausar e retomar com a raposa sobre a plataforma.
- Taxas de quadro diferentes (monitores de 60 Hz e 120/144 Hz; celular mais lento).
- Novo visual: a raposa virada para a esquerda (espelhada) também deve ficar correta.
- Pouso numa plataforma móvel: a agachadinha não pode provocar tremida (História 1).
- Pousar e já sair andando ou pulando: a animação de pouso é interrompida sem travar o controle.
- Novo visual: legibilidade contra os 3 fundos de fase (céu escuro do Dom Casmurro, claro da Alice, verde do Alienista).

## Requisitos

### Requisitos funcionais

- **RF-001**: Sobre qualquer plataforma móvel, a raposa NÃO DEVE tremer, seja na própria posição, na animação ou na câmera.
- **RF-002**: A raposa DEVE acompanhar o deslocamento da plataforma (horizontal e vertical) sem escorregar quando está parada.
- **RF-003**: O estado "no chão" DEVE ser estável sobre a plataforma, para que pulo, tolerância de pulo e animação funcionem como no chão firme.
- **RF-004**: O comportamento DEVE ser o mesmo em taxas de quadro diferentes.
- **RF-005**: O visual da raposa DEVE ser substituído pelo novo, criado a partir das referências, em pixel art coerente com o resto do jogo.
- **RF-006**: O tamanho do quadro DEVE continuar 32×32. A paleta, as formas e as proporções DEVEM seguir as referências de perto. As animações DEVEM ganhar o movimento no estilo da referência 2, conforme a História 2 (cenários 3 a 6): cauda balançando na pose parada (com o corpo acompanhando), cauda acompanhando a passada na corrida, corpo esticado no pulo, cauda levantada na queda e agachadinha no pouso. A quantidade de quadros de cada animação é definida no plano.
- **RF-010**: O novo visual DEVE ter: paleta laranja vivo puxado para o amarelo com sombras marrom-avermelhadas; peito, ponta da cauda e parte de dentro das orelhas brancos (sombra cinza); pernas marrom-escuras; olho preto grande e retangular, visto de perfil; contorno escuro como os demais sprites do jogo.
- **RF-007**: O novo visual DEVE cobrir todas as poses (parada, corrida, pulo, queda, pouso, dano), também espelhado para a esquerda.
- **RF-011**: A agachadinha do pouso DEVE ser só visual: NÃO DEVE atrasar nem bloquear o controle.
- **RF-008**: A área de colisão e a física da raposa NÃO DEVEM mudar (a jogabilidade e a dificuldade ficam iguais).
- **RF-009**: A arte DEVE seguir o princípio V: original, gerada por código a partir das referências, sem reproduzir personagens ou artes protegidas.

## Critérios de sucesso

- **CS-001**: Em 3 ciclos completos de ida e volta de cada tipo de plataforma (horizontal e elevador), nenhuma tremida perceptível da raposa ou da câmera.
- **CS-002**: Sobre a plataforma parada em relação a ela, a raposa não se desloca mais de 1 pixel lógico ao longo de um ciclo inteiro.
- **CS-003**: A pessoa usuária aprova o novo visual comparando-o com as referências.
- **CS-004**: As 3 fases continuam completáveis, com a mesma velocidade e altura de pulo de antes.

## Premissas

- A tremida acontece tanto nas plataformas horizontais quanto nos elevadores; ambos entram no escopo.
- As referências estão em `referencias/` (fora do git e do deploy): (1) raposa sentada de frente, em pixel art de banco de imagens com direitos de terceiros; (2) sprites de raposa de perfil, correndo e deitada, de origem não identificada. Ambas são de terceiros: a raposa nova é um desenho original que segue o estilo delas, sem copiar pixels (princípio V).
- A vista de perfil e a proporção compacta vêm da referência 2; paleta, rosto e detalhes brancos vêm da referência 1.
- O novo visual vale também para o ícone do app (gerado a partir da raposa).

## Esclarecimentos

### Sessão 2026-10-02

- P: O que pode mudar na sprite da raposa? → R: Só a aparência (mesmo tamanho e poses).
- P: Quão perto das referências o desenho deve ficar? → R: Seguir de perto (versão original se for personagem de terceiros).
- P: Qual paleta? → R: Laranja vivo da referência 1.
- P: Contorno escuro? → R: Sim, como os demais sprites do jogo.
- P: Como deve ser o rosto? → R: Olho grande e fofo da referência 1, adaptado ao perfil.
- **Emenda 3** (na revisão da prévia): a orelha não mexe mais; corpo e cabeça se movem juntos (com o aceno separado a cabeça parecia sair do corpo), guiados pela altura da cauda.
- **Emenda 2** (na revisão da arte no jogo): a orelha inclina para a frente, não para trás; parada, o corpo acompanha a cauda (respiração do tronco e aceno da cabeça), em vez de ficar imóvel.
- **Emenda** (pedido da pessoa usuária, antes do plano): as animações também mudam, com movimento no estilo da referência 2. Substitui a resposta "só a aparência / mesma quantidade de quadros".
- P: Quais animações ganham o movimento da referência 2? → R: Todas: parada (cauda balançando), corrida (cauda na passada), pulo e queda (corpo esticado, cauda levantada) e pouso + orelhas.

## Fora de escopo

- Mudar a física, a velocidade das plataformas ou os mapas.
- Novos personagens, inimigos ou skins selecionáveis.
- Mudança de tamanho da raposa.
- A pose de alerta da referência 2 (cauda em pé), que não tem um momento correspondente no jogo.
- Movimento de orelha (removido na emenda 3).
- Redesenhar outros sprites (páginas, tiles, HUD), salvo se as referências pedirem e houver nova spec.
