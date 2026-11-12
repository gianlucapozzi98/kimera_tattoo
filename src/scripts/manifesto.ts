import { gsap, canAnimate } from './gsap';

/** Le parole del manifesto si "accendono" una a una mentre si scorre. */
export function initManifesto() {
  if (!canAnimate()) return;
  const words = gsap.utils.toArray<HTMLElement>('[data-words] .mw');
  if (!words.length) return;
  gsap.fromTo(words, { opacity: 0.4 }, {
    opacity: 1,
    ease: 'none',
    stagger: 0.12,
    scrollTrigger: { trigger: '[data-words]', start: 'top 80%', end: 'bottom 55%', scrub: 0.6 },
  });
}
