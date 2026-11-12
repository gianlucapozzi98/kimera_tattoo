import { gsap, canAnimate } from './gsap';

/** Accordion accessibile (<details>) con apertura animata; apertura esclusiva. */
export function initFaq() {
  const root = document.querySelector<HTMLElement>('[data-faq]');
  if (!root) return;
  const qs = [...root.querySelectorAll<HTMLDetailsElement>('details.q')];
  const animate = canAnimate();

  const open = (d: HTMLDetailsElement) => {
    const body = d.querySelector<HTMLElement>('.q__a')!;
    d.open = true;
    if (!animate) return;
    gsap.fromTo(body, { height: 0, opacity: 0 }, { height: 'auto', opacity: 1, duration: 0.7, ease: 'power3.out', clearProps: 'height,opacity' });
  };
  const close = (d: HTMLDetailsElement) => {
    const body = d.querySelector<HTMLElement>('.q__a')!;
    if (!animate) {
      d.open = false;
      return;
    }
    gsap.to(body, { height: 0, opacity: 0, duration: 0.45, ease: 'power3.inOut', onComplete: () => {
      d.open = false;
      gsap.set(body, { clearProps: 'height,opacity' });
    } });
  };

  qs.forEach((d) => {
    d.querySelector('summary')!.addEventListener('click', (e) => {
      e.preventDefault();
      if (d.open) close(d);
      else {
        qs.filter((o) => o !== d && o.open).forEach(close);
        open(d);
      }
    });
  });
}
