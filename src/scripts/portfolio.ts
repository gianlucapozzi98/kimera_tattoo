import { gsap, ScrollTrigger, canAnimate } from './gsap';
import { Flip } from 'gsap/Flip';
import { initLightbox } from './lightbox';

gsap.registerPlugin(Flip);

export function initPortfolio() {
  const root = document.querySelector<HTMLElement>('[data-portfolio]');
  if (!root) return;
  const grid = root.querySelector<HTMLElement>('[data-grid]')!;
  const items = [...grid.querySelectorAll<HTMLElement>('[data-item]')];
  const tiles = [...grid.querySelectorAll<HTMLElement>('[data-tile]')];
  const chips = [...root.querySelectorAll<HTMLButtonElement>('[data-filter]')];
  const empty = root.querySelector<HTMLElement>('[data-empty]');
  let current = 'all';

  const lb = initLightbox(root, () => items.filter((i) => !i.hidden).map((i) => i.querySelector<HTMLButtonElement>('[data-lb-trigger]')!).filter((b) => b && !b.disabled));

  const apply = (filter: string) => {
    const animate = canAnimate();
    const targets = [...items, ...tiles, ...grid.querySelectorAll<HTMLElement>('[data-tile-cta]')];
    const state = animate ? Flip.getState(targets) : null;
    items.forEach((it) => (it.hidden = filter !== 'all' && it.dataset.artist !== filter));
    tiles.forEach((t) => (t.hidden = filter !== 'all')); // gli interludi editoriali appaiono solo nella vista completa
    if (empty) empty.hidden = items.some((i) => !i.hidden);
    if (state) {
      Flip.from(state, {
        duration: 0.9,
        ease: 'power3.inOut',
        absolute: true,
        nested: false,
        stagger: 0.025,
        onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.7, delay: 0.25, ease: 'power3.out' }),
        onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.9, duration: 0.35, ease: 'power2.in' }),
        onComplete: () => ScrollTrigger.refresh(),
      });
    } else {
      ScrollTrigger.refresh();
    }
  };

  chips.forEach((c) =>
    c.addEventListener('click', () => {
      const f = c.dataset.filter!;
      if (f === current) return;
      current = f;
      chips.forEach((x) => {
        const on = x === c;
        x.classList.toggle('is-on', on);
        x.setAttribute('aria-pressed', String(on));
      });
      apply(f);
    }),
  );

  // le miniature nella sezione Artists aprono la lightbox sulla stessa opera
  document.addEventListener('click', (e) => {
    const t = (e.target as Element).closest<HTMLElement>('[data-lightbox-open]');
    if (!t) return;
    const id = t.dataset.lightboxOpen!;
    if (current !== 'all') {
      current = 'all';
      chips.forEach((x) => {
        const on = x.dataset.filter === 'all';
        x.classList.toggle('is-on', on);
        x.setAttribute('aria-pressed', String(on));
      });
      items.forEach((it) => (it.hidden = false));
      tiles.forEach((tl) => (tl.hidden = false));
    }
    const trigger = items.find((i) => i.dataset.id === id)?.querySelector<HTMLButtonElement>('[data-lb-trigger]');
    if (trigger && !trigger.disabled) lb.open(trigger);
  });

  // reveal scrollato degli elementi della griglia
  if (canAnimate()) {
    ScrollTrigger.batch(items, {
      start: 'top 92%',
      once: true,
      batchMax: 4,
      interval: 0.12,
      onEnter: (batch) => {
        const medias = batch.map((b) => (b as HTMLElement).querySelector<HTMLElement>('.item__media')!);
        gsap.fromTo(medias, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'power4.inOut', stagger: 0.12 });
        gsap.fromTo(
          medias.map((m) => m.querySelector('.photo')),
          { scale: 1.3 },
          { scale: 1, duration: 1.8, ease: 'power3.out', stagger: 0.12, clearProps: 'transform' },
        );
      },
    });
    // il clip parte "chiuso" via GSAP solo dopo che è stato osservato per evitare flash: lo impostiamo subito
    items.forEach((it) => gsap.set(it.querySelector('.item__media'), { clipPath: 'inset(100% 0% 0% 0%)' }));
  }
}
