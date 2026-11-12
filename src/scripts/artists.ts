import { gsap, canAnimate } from './gsap';

export function initArtists() {
  const root = document.querySelector<HTMLElement>('[data-artists]');
  if (!root) return;
  const tabs = [...root.querySelectorAll<HTMLElement>('[data-tab]')];
  const panels = [...root.querySelectorAll<HTMLElement>('[data-panel]')];
  const imgs = [...root.querySelectorAll<HTMLElement>('[data-img]')];
  let active = tabs[0]?.dataset.tab ?? '';
  let busy = false;
  let pending: string | null = null;

  const animate = canAnimate();
  // un puntatore fermo mentre la pagina scorre NON deve cambiare artista: contano solo i veri movimenti del mouse
  let lastScroll = 0;
  window.addEventListener('scroll', () => (lastScroll = performance.now()), { passive: true });

  const activate = (id: string, opts: { focus?: boolean } = {}) => {
    if (id === active) return;
    if (busy) {
      pending = id; // l'ultima richiesta vince, senza interrompere la transizione in corso
      return;
    }
    const prev = active;
    active = id;
    tabs.forEach((t) => {
      const on = t.dataset.tab === id;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    if (opts.focus) tabs.find((t) => t.dataset.tab === id)?.focus({ preventScroll: true });

    const nextImg = imgs.find((i) => i.dataset.img === id)!;
    const prevImg = imgs.find((i) => i.dataset.img === prev)!;
    const nextPanel = panels.find((p) => p.dataset.panel === id)!;
    const prevPanel = panels.find((p) => p.dataset.panel === prev)!;

    if (!animate) {
      imgs.forEach((i) => i.classList.toggle('is-active', i === nextImg));
      panels.forEach((p) => p.classList.toggle('is-active', p === nextPanel));
      return;
    }

    busy = true;
    const nextIn = nextImg.querySelector<HTMLElement>('[data-in]')!;
    const prevIn = prevImg.querySelector<HTMLElement>('[data-in]')!;
    nextImg.classList.add('is-active');
    gsap.set(nextImg, { zIndex: 2, clipPath: 'inset(100% 0% 0% 0%)' });
    gsap.set(prevImg, { zIndex: 1 });
    const tl = gsap.timeline({
      onComplete: () => {
        prevImg.classList.remove('is-active');
        gsap.set([prevImg, nextImg], { clearProps: 'zIndex,clipPath' });
        gsap.set([prevIn, nextIn], { clearProps: 'transform,filter' });
        busy = false;
        if (pending && pending !== active) {
          const p = pending;
          pending = null;
          activate(p);
        }
        pending = null;
      },
    });
    // transizione cinematografica: maschera che sale + controscala + il vecchio ritratto si spegne
    tl.to(nextImg, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.05, ease: 'power4.inOut' }, 0)
      .fromTo(nextIn, { scale: 1.35 }, { scale: 1, duration: 1.6, ease: 'power3.out' }, 0)
      .to(prevIn, { scale: 1.12, filter: 'brightness(0.35)', duration: 1.05, ease: 'power2.in' }, 0);

    // testo
    tl.to(prevPanel, { opacity: 0, y: -14, duration: 0.3, ease: 'power2.in', onComplete: () => {
      prevPanel.classList.remove('is-active');
      gsap.set(prevPanel, { clearProps: 'opacity,transform' });
      nextPanel.classList.add('is-active');
    } }, 0)
      .fromTo(nextPanel, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', clearProps: 'opacity,transform' }, 0.38);
  };

  tabs.forEach((t) => {
    const id = t.dataset.tab!;
    // desktop: al passaggio del mouse; touch/tastiera: tap / focus + invio
    // pointermove (oltre a pointerenter): se il puntatore resta fermo durante lo scroll non scatta nulla,
    // appena si muove di nuovo sopra il nome l'artista cambia
    const hover = (e: PointerEvent) => e.pointerType === 'mouse' && performance.now() - lastScroll > 140 && activate(id);
    t.addEventListener('pointerenter', hover);
    t.addEventListener('pointermove', hover);
    t.addEventListener('click', () => activate(id));
    t.addEventListener('keydown', (e) => {
      const i = tabs.indexOf(t);
      let n = -1;
      if (['ArrowDown', 'ArrowRight'].includes(e.key)) n = (i + 1) % tabs.length;
      if (['ArrowUp', 'ArrowLeft'].includes(e.key)) n = (i - 1 + tabs.length) % tabs.length;
      if (e.key === 'Home') n = 0;
      if (e.key === 'End') n = tabs.length - 1;
      if (n > -1) {
        e.preventDefault();
        activate(tabs[n].dataset.tab!, { focus: true });
      }
    });
  });

  // altri moduli possono selezionare un artista (es. CTA di portfolio / lightbox)
  document.addEventListener('kimera:select-artist', (e) => {
    const id = (e as CustomEvent<string>).detail;
    if (id) activate(id);
  });
}
