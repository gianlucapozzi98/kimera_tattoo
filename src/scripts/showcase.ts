import { gsap, ScrollTrigger, canAnimate, mm } from './gsap';
import { getLenis } from './smooth';

const pad = (n: number) => String(n).padStart(2, '0');

export function initShowcase() {
  const root = document.querySelector<HTMLElement>('[data-showcase]');
  if (!root) return;
  const viewport = root.querySelector<HTMLElement>('[data-viewport]')!;
  const track = root.querySelector<HTMLElement>('[data-rail]')!;
  const slides = [...track.querySelectorAll<HTMLElement>('[data-slide]')];
  const bar = root.querySelector<HTMLElement>('[data-bar]')!;
  const cur = root.querySelector<HTMLElement>('[data-cur]')!;
  const artistEl = root.querySelector<HTMLElement>('[data-artist-label]')!;
  const plates = slides.filter((s) => s.dataset.artist);
  let pinned = false;

  const setActive = (slide: HTMLElement) => {
    slides.forEach((s) => s.classList.toggle('is-active', s === slide));
    const i = plates.indexOf(slide);
    if (i >= 0) {
      cur.textContent = pad(i + 1);
      artistEl.textContent = slide.dataset.artist ?? '—';
    } else {
      cur.textContent = slide === slides[0] ? '00' : pad(plates.length);
      artistEl.textContent = '—';
    }
  };
  setActive(slides[0]);

  // ── Modalità nativa: mobile, reduced-motion, no-JS (scroll-snap) ──
  let raf = 0;
  const onNative = () => {
    raf = 0;
    if (pinned) return;
    const max = viewport.scrollWidth - viewport.clientWidth;
    bar.style.transform = `scaleX(${max > 0 ? viewport.scrollLeft / max : 0})`;
    const probe = viewport.scrollLeft + viewport.clientWidth * 0.4;
    let best = slides[0];
    let bd = Infinity;
    for (const s of slides) {
      const left = s.getBoundingClientRect().left - track.getBoundingClientRect().left;
      const d = Math.abs(left + s.offsetWidth / 2 - probe);
      if (d < bd) {
        bd = d;
        best = s;
      }
    }
    setActive(best);
  };
  viewport.addEventListener(
    'scroll',
    () => {
      if (pinned) {
        if (viewport.scrollLeft !== 0) viewport.scrollLeft = 0; // il focus non deve spostare il pannello
        return;
      }
      if (!raf) raf = requestAnimationFrame(onNative);
    },
    { passive: true },
  );
  onNative();

  // ── Modalità cinematografica: pinned + scorrimento orizzontale guidato dallo scroll ──
  mm.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
    if (!canAnimate()) return;
    pinned = true;
    root.classList.add('is-pinned');
    viewport.scrollLeft = 0;

    const dist = () => Math.max(0, track.scrollWidth - viewport.clientWidth);
    const move = gsap.to(track, { x: () => -dist(), ease: 'none' });
    const st = ScrollTrigger.create({
      trigger: root,
      start: 'top top',
      end: () => `+=${Math.round(dist() * 0.75)}`,
      pin: true,
      pinSpacing: true,
      scrub: 0.5,
      animation: move,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        bar.style.transform = `scaleX(${self.progress})`;
      },
    });

    slides.forEach((slide, i) => {
      const common = { trigger: slide, containerAnimation: move, scrub: true } as const;
      const isFull = slide.classList.contains('slide--full');
      const isMacro = slide.classList.contains('slide--macro');
      const frame = slide.querySelector<HTMLElement>('[data-frame]');
      const par = slide.querySelector<HTMLElement>('[data-par]');
      const photo = slide.querySelector<HTMLElement>('.photo');
      const num = slide.querySelector<HTMLElement>('[data-num]');
      const ins = slide.querySelectorAll<HTMLElement>('[data-in]');
      const words = slide.querySelectorAll<HTMLElement>('.sw__i');

      ScrollTrigger.create({
        trigger: slide,
        containerAnimation: move,
        start: 'left 55%',
        end: 'right 55%',
        onToggle: (self) => self.isActive && setActive(slide),
      });

      if (frame) {
        // maschera che si apre da destra mentre la tavola entra
        gsap.fromTo(
          frame,
          { clipPath: 'inset(0% 0% 0% 100%)' },
          { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: { ...common, start: 'left 98%', end: isFull ? 'left 8%' : 'left 55%' } },
        );
      }
      if (par && !isMacro) {
        gsap.fromTo(par, { xPercent: -4.5 }, { xPercent: 4.5, ease: 'none', scrollTrigger: { ...common, start: 'left right', end: 'right left' } });
      }
      if (photo && !isMacro) {
        gsap.fromTo(photo, { scale: 1.16 }, { scale: 1.02, ease: 'none', scrollTrigger: { ...common, start: 'left 98%', end: 'left 30%' } });
      }
      if (photo && isMacro) {
        // zoom progressivo sul dettaglio (la fotografia resta intatta: cambia solo l'inquadratura)
        gsap.fromTo(photo, { scale: 1.55 }, { scale: 2.6, ease: 'none', scrollTrigger: { ...common, start: 'left 95%', end: 'right 15%' } });
      }
      if (num) {
        gsap.fromTo(num, { xPercent: 22 }, { xPercent: -22, ease: 'none', scrollTrigger: { ...common, start: 'left right', end: 'right left' } });
      }
      if (i === 0) {
        // intro: ingresso a tempo quando la sezione entra in vista
        gsap.set([...ins, ...words], { willChange: 'transform' });
        ScrollTrigger.create({
          trigger: root,
          start: 'top 75%',
          once: true,
          onEnter: () => gsap.fromTo(ins, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1.1, stagger: 0.12, ease: 'power3.out', delay: 0.5 }),
        });
        gsap.set(ins, { opacity: 0 });
      } else if (ins.length || words.length) {
        const tl = gsap.timeline({ scrollTrigger: { ...common, start: 'left 82%', end: 'left 30%' }, defaults: { ease: 'none' } });
        if (words.length) tl.fromTo(words, { y: 0, yPercent: 112 }, { y: 0, yPercent: 0, stagger: 0.1 }, 0);
        if (ins.length) tl.fromTo(ins, { opacity: 0, y: 34 }, { opacity: 1, y: 0, stagger: 0.18 }, 0.1);
      }
    });

    // tastiera: se un elemento nella slideshow riceve il focus, porta lo scroll alla sua tavola
    const onFocusIn = (e: FocusEvent) => {
      const slide = (e.target as Element).closest('[data-slide]') as HTMLElement | null;
      if (!slide) return;
      const left = slide.getBoundingClientRect().left - track.getBoundingClientRect().left;
      const p = Math.min(1, Math.max(0, (left - 40) / Math.max(1, dist())));
      const y = st.start + p * (st.end - st.start);
      const lenis = getLenis();
      if (lenis) lenis.scrollTo(y, { duration: 1.2 });
      else window.scrollTo({ top: y });
    };
    track.addEventListener('focusin', onFocusIn);

    return () => {
      pinned = false;
      root.classList.remove('is-pinned');
      track.removeEventListener('focusin', onFocusIn);
      gsap.set(track, { clearProps: 'transform' });
      bar.style.transform = '';
      onNative();
    };
  });
}
