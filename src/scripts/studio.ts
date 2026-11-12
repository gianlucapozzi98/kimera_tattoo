import { gsap, canAnimate, ScrollTrigger } from './gsap';

export function initStudio() {
  const root = document.querySelector<HTMLElement>('[data-studio]');
  if (!root || !canAnimate()) return;
  const cover = root.querySelector<HTMLElement>('[data-cover]')!;
  const bg = root.querySelector<HTMLElement>('[data-bg]')!;
  const par = root.querySelector<HTMLElement>('[data-par]')!;
  const photo = par.querySelector<HTMLElement>('.photo');
  const words = root.querySelectorAll<HTMLElement>('.studio__title .sw__i');

  // la tavola si apre da cornice a tutto schermo, l'immagine si assesta
  gsap.fromTo(bg, { clipPath: 'inset(14% 7% 14% 7%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: { trigger: cover, start: 'top 95%', end: 'top 10%', scrub: 0.6 } });
  gsap.fromTo(photo ?? par, { scale: 1.3 }, { scale: 1.02, ease: 'none', scrollTrigger: { trigger: cover, start: 'top bottom', end: 'bottom top', scrub: 0.6 } });
  gsap.fromTo(par, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: cover, start: 'top bottom', end: 'bottom top', scrub: true } });
  ScrollTrigger.create({
    trigger: cover,
    start: 'top 45%',
    once: true,
    onEnter: () =>
      gsap.fromTo(words, { y: 0, yPercent: 112 }, { y: 0, yPercent: 0, stagger: 0.12, duration: 1.4, ease: 'power4.out' }),
  });
}
