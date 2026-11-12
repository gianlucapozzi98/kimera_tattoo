import Lenis from 'lenis';
import { gsap, ScrollTrigger, canAnimate, finePointer } from './gsap';

let lenis: Lenis | null = null;

export function initSmooth() {
  if (!canAnimate() || !finePointer()) return;
  lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.95, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis?.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

export const getLenis = () => lenis;
export const lockScroll = () => {
  lenis?.stop();
  document.documentElement.classList.add('is-locked');
};
export const unlockScroll = () => {
  lenis?.start();
  document.documentElement.classList.remove('is-locked');
};

export function scrollToTarget(target: string | Element | number, opts: { offset?: number; duration?: number; immediate?: boolean } = {}) {
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  const offset = opts.offset ?? 0;
  if (lenis) {
    lenis.scrollTo((el as HTMLElement | number) ?? 0, { offset, duration: opts.duration ?? 1.7, immediate: opts.immediate, easing: (t: number) => 1 - Math.pow(1 - t, 4) });
  } else if (typeof el === 'number' || typeof target === 'number') {
    window.scrollTo({ top: Number(target) + offset, behavior: 'auto' });
  } else if (el) {
    const top = (el as HTMLElement).getBoundingClientRect().top + window.scrollY + offset;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
  }
}

/** Link ancora (#id) → scroll fluido + focus gestito per l'accessibilità. */
export function initAnchors(onNavigate?: () => void) {
  document.addEventListener('click', (e) => {
    const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash || url.hash === '#') return;
    const target = document.querySelector(url.hash);
    if (!target) return;
    e.preventDefault();
    onNavigate?.();
    const run = () => {
      scrollToTarget(target, { offset: url.hash === '#home' ? 0 : 0 });
      history.pushState(null, '', url.hash);
      (target as HTMLElement).setAttribute('tabindex', '-1');
      setTimeout(() => (target as HTMLElement).focus({ preventScroll: true }), 900);
    };
    // lascia il tempo al menu di sbloccare lo scroll
    requestAnimationFrame(run);
  });
}
