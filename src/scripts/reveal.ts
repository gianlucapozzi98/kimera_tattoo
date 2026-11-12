import { gsap, ScrollTrigger, canAnimate } from './gsap';

/** Reveal generici guidati dallo scroll: testo, blocchi, immagini mascherate, parallasse. */
export function initReveals() {
  if (!canAnimate()) return;

  // blocchi (opacity + y)
  ScrollTrigger.batch('[data-reveal]:not([data-hero-in])', {
    start: 'top 90%',
    once: true,
    batchMax: 6,
    interval: 0.1,
    onEnter: (batch) =>
      gsap.fromTo(
        batch,
        { opacity: 0, y: (_, el) => ((el as HTMLElement).dataset.reveal === 'fade' ? 0 : 28) },
        {
          opacity: 1,
          y: 0,
          duration: 1.15,
          ease: 'power3.out',
          stagger: 0.09,
          overwrite: true,
          onComplete: () =>
            batch.forEach((el) => {
              el.classList.add('is-in');
              gsap.set(el, { clearProps: 'opacity,transform' });
            }),
        },
      ),
  });

  // titoli splittati (esclusa la hero, che ha una timeline propria)
  document.querySelectorAll<HTMLElement>('[data-split]').forEach((h) => {
    if (h.closest('[data-hero]') || h.closest('[data-no-auto-split]')) return;
    const words = h.querySelectorAll('.sw__i');
    ScrollTrigger.create({
      trigger: h,
      start: 'top 88%',
      once: true,
      onEnter: () =>
        gsap.fromTo(
          words,
          { y: 0, yPercent: 112 },
          {
            y: 0,
            yPercent: 0,
            duration: 1.25,
            ease: 'power4.out',
            stagger: 0.07,
            onComplete: () => {
              h.classList.add('is-in');
              gsap.set(words, { clearProps: 'transform' });
            },
          },
        ),
    });
  });

  // immagini con maschera (clip-path) + scala interna
  document.querySelectorAll<HTMLElement>('[data-clip]').forEach((el) => {
    const dir = el.dataset.clip || 'up';
    const from = { up: 'inset(100% 0% 0% 0%)', down: 'inset(0% 0% 100% 0%)', left: 'inset(0% 100% 0% 0%)', right: 'inset(0% 0% 0% 100%)' }[dir] ?? 'inset(100% 0% 0% 0%)';
    const inner = el.querySelector<HTMLElement>('[data-clip-inner]');
    gsap.set(el, { clipPath: from });
    const tl = gsap.timeline({
      paused: true,
      defaults: { ease: 'power4.inOut' },
    });
    tl.to(el, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5 }, 0);
    if (inner) tl.fromTo(inner, { scale: 1.3 }, { scale: 1, duration: 2.0, ease: 'power3.out' }, 0);
    ScrollTrigger.create({ trigger: el, start: 'top 85%', once: true, onEnter: () => tl.play() });
  });

  // parallasse generico: data-parallax="0.15" (frazione dell'altezza viewport)
  document.querySelectorAll<HTMLElement>('[data-parallax]').forEach((el) => {
    const amt = parseFloat(el.dataset.parallax || '0.12');
    gsap.fromTo(
      el,
      { y: () => -amt * window.innerHeight },
      {
        y: () => amt * window.innerHeight,
        ease: 'none',
        scrollTrigger: { trigger: el.closest('section') || el, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true },
      },
    );
  });
}
