import { gsap, ScrollTrigger, canAnimate } from './gsap';

/** Footer animato: la parola KIMERA sale lettera per lettera quando entra in vista. */
export function initFooter() {
  const root = document.querySelector<HTMLElement>('[data-footer]');
  if (!root || !canAnimate()) return;
  const chars = root.querySelectorAll<HTMLElement>('.ch__i');
  if (!chars.length) return;
  gsap.set(chars, { y: 0, yPercent: 105 });
  ScrollTrigger.create({
    trigger: root.querySelector('[data-wordmark]'),
    start: 'top 100%',
    once: true,
    onEnter: () =>
      gsap.to(chars, {
        yPercent: 0,
        duration: 1.5,
        ease: 'power4.out',
        stagger: 0.09,
        onComplete: () => {
          root.classList.add('is-in');
          gsap.set(chars, { clearProps: 'transform' });
        },
      }),
  });
  const seal = root.querySelector('.footer__seal');
  if (seal) gsap.to(seal, { rotate: 360, ease: 'none', scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom bottom', scrub: true } });
}
