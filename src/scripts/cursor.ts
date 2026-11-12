import { gsap, canAnimate, finePointer } from './gsap';

/** Piccolo cursore-etichetta che segue il mouse (solo pointer fine). Non nasconde il cursore nativo. */
export function initCursor() {
  if (!canAnimate() || !finePointer()) return;
  const el = document.createElement('div');
  el.className = 'cursor';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<span class="cursor__label mono"></span>';
  document.body.appendChild(el);
  const label = el.querySelector<HTMLElement>('.cursor__label')!;
  const xTo = gsap.quickTo(el, 'x', { duration: 0.45, ease: 'power3.out' });
  const yTo = gsap.quickTo(el, 'y', { duration: 0.45, ease: 'power3.out' });
  let shown = false;

  window.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType === 'touch') return;
      xTo(e.clientX);
      yTo(e.clientY);
      if (!shown) {
        shown = true;
        gsap.to(el, { opacity: 1, duration: 0.4 });
      }
    },
    { passive: true },
  );
  document.addEventListener('pointerleave', () => {
    shown = false;
    gsap.to(el, { opacity: 0, duration: 0.3 });
  });

  document.addEventListener('pointerover', (e) => {
    const t = (e.target as Element).closest?.('[data-cursor]') as HTMLElement | null;
    if (t) {
      label.textContent = t.dataset.cursor || '';
      el.classList.add('is-active');
    } else {
      el.classList.remove('is-active');
    }
  });
}
