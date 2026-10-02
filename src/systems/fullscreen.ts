/**
 * Tela cheia no celular. O navegador só permite pedir dentro de um gesto do
 * usuário (toque), por isso é chamado no primeiro toque e ao tocar em
 * "Jogar", "Continuar" e "Tentar de novo" (caso a pessoa tenha saído da tela cheia).
 * No iPhone (Safari) a API não existe para páginas: lá vale "Adicionar à Tela de Início".
 */

// decide pelo último ponteiro, não pelo aparelho: num notebook com tela de toque,
// clicar com o mouse não deve jogar a página para tela cheia
let lastPointerType = '';
window.addEventListener('pointerdown', (e) => (lastPointerType = e.pointerType), { capture: true, passive: true });

export function lastInputWasTouch() {
  return lastPointerType === 'touch';
}

export function requestFullscreen() {
  if (!lastInputWasTouch() || document.fullscreenElement) return;
  const el = document.documentElement;
  if (!el.requestFullscreen) return;
  el.requestFullscreen({ navigationUI: 'hide' })
    .then(() => {
      // trava na horizontal quando suportado (Chrome no Android); falhar é normal em outros
      const orientation = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
      return orientation.lock?.('landscape');
    })
    .catch(() => {
      // sem permissão ou sem suporte: o jogo segue na janela normal
    });
}

/** iPhone/iPad no Safari, fora do modo "Tela de Início". */
export function isIosBrowser() {
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return ios && !standalone;
}
