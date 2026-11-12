import { gsap, ScrollTrigger, canAnimate, finePointer, mm } from './gsap';

const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initAlive() {
  const root = document.querySelector<HTMLElement>('[data-alive]');
  if (!root) return;
  const frame = root.querySelector<HTMLElement>('[data-frame]')!;
  const main = root.querySelector<HTMLElement>('[data-main]')!;
  const lens = root.querySelector<HTMLElement>('[data-lens]')!;
  const lensIn = root.querySelector<HTMLElement>('[data-lens-in]')!;
  const light = root.querySelector<HTMLElement>('[data-light]')!;

  initLens(frame, main, lens, lensIn, light);
  if (!reduceMotion()) initDust(root);

  // Focale (punto d'interesse) → origine dello zoom
  const photo = main.querySelector<HTMLElement>('.photo');
  const fx = photo?.style.getPropertyValue('--fx') || '50%';
  const fy = photo?.style.getPropertyValue('--fy') || '50%';
  main.style.setProperty('--ox', fx);
  main.style.setProperty('--oy', fy);

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    if (!canAnimate()) return;
    const desktop = matchMedia('(min-width: 900px)').matches;
    const acts = [...root.querySelectorAll<HTMLElement>('[data-act]')];
    const words = root.querySelectorAll<HTMLElement>('.alive__title .sw__i');
    const frag = root.querySelector<HTMLElement>('[data-frag]')!;
    const ring = root.querySelector<HTMLElement>('[data-ring]')!;
    const ghost = root.querySelector<HTMLElement>('[data-ghost]')!;
    const rays = root.querySelector<HTMLElement>('[data-rays]')!;
    const giant = root.querySelector<HTMLElement>('[data-giant]')!;

    const setAct = (i: number) => acts.forEach((a, j) => a.classList.toggle('is-on', j === i));
    setAct(0);

    if (desktop) {
      root.classList.add('is-scrub');
      // timeline unica: 3 atti — l'opera, il dettaglio, oltre la cornice
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: root,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.7,
          invalidateOnRefresh: true,
          onUpdate: (self) => setAct(self.progress < 0.34 ? 0 : self.progress < 0.67 ? 1 : 2),
        },
      });
      // ATTO I — la maschera si apre, l'opera si assesta
      tl.fromTo(frame, { clipPath: 'inset(32% 32% 32% 32%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.22 }, 0)
        .fromTo(main, { scale: 1.25 }, { scale: 1, duration: 0.3 }, 0)
        .fromTo(words, { y: 0, yPercent: 112 }, { y: 0, yPercent: 0, stagger: 0.03, duration: 0.18 }, 0.02)
        .fromTo(ghost, { scale: 1.5, rotate: -4 }, { scale: 1.15, rotate: 3, duration: 1 }, 0)
        .fromTo(rays, { rotate: 0, scale: 0.9 }, { rotate: 40, scale: 1.1, duration: 1 }, 0)
        .fromTo(giant, { xPercent: 6 }, { xPercent: -10, duration: 1 }, 0)
        // ATTO II — avvicinamento al dettaglio
        .to(main, { scale: 1.9, duration: 0.32 }, 0.34)
        .to(frame, { boxShadow: '0 60px 120px -30px rgba(0,0,0,.95)', duration: 0.1 }, 0.34)
        .fromTo(ring, { opacity: 0, scale: 0.2 }, { opacity: 0.9, scale: 1.2, duration: 0.14 }, 0.4)
        .to(ring, { opacity: 0, scale: 3.4, duration: 0.18 }, 0.54)
        // ATTO III — il frammento esce dalla cornice
        .to(main, { scale: 1.06, duration: 0.28 }, 0.68)
        .fromTo(frag, { opacity: 0, scale: 0.55, xPercent: -60, yPercent: -20, rotate: -6 }, { opacity: 1, scale: 1, xPercent: 0, yPercent: 0, rotate: 2, duration: 0.26 }, 0.68)
        .to(frame, { xPercent: -6, duration: 0.3 }, 0.7)
        .to(frag, { yPercent: -10, duration: 0.06 }, 0.94);
      gsap.set(frag, { opacity: 0 });
    } else {
      // mobile: reveal semplici, nessun pin
      gsap.fromTo(frame, { clipPath: 'inset(26% 18% 26% 18%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'power4.inOut', duration: 1.4, scrollTrigger: { trigger: frame, start: 'top 80%', once: true } });
      gsap.fromTo(main, { scale: 1.3 }, { scale: 1, ease: 'power3.out', duration: 2, scrollTrigger: { trigger: frame, start: 'top 80%', once: true } });
      gsap.fromTo(main, { scale: 1 }, { scale: 1.45, ease: 'none', scrollTrigger: { trigger: frame, start: 'top 20%', end: 'bottom top', scrub: true, immediateRender: false } });
      gsap.fromTo(frag, { yPercent: 20, rotate: -5, opacity: 0 }, { yPercent: 0, rotate: 2, opacity: 1, ease: 'power3.out', duration: 1.2, scrollTrigger: { trigger: frag, start: 'top 92%', once: true } });
      gsap.fromTo(ghost, { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom top', scrub: true } });
      words.length && gsap.fromTo(words, { y: 0, yPercent: 112 }, { y: 0, yPercent: 0, stagger: 0.08, duration: 1.1, ease: 'power4.out', scrollTrigger: { trigger: root, start: 'top 70%', once: true } });
    }

    return () => root.classList.remove('is-scrub');
  });

  void ScrollTrigger;
}

/** Lente: la stessa fotografia, ingrandita ×2.4 attorno al puntatore. Nessuna deformazione dell'opera. */
function initLens(frame: HTMLElement, main: HTMLElement, lens: HTMLElement, lensIn: HTMLElement, light: HTMLElement) {
  const ZOOM = 2.4;
  const clone = main.cloneNode(true) as HTMLElement;
  clone.removeAttribute('data-main');
  clone.setAttribute('aria-hidden', 'true');
  clone.style.cssText = 'position:absolute;inset:0;transform:none;';
  clone.querySelectorAll('img').forEach((img) => {
    img.removeAttribute('loading');
    img.sizes = '280vw'; // forza il candidato ad alta risoluzione per l'ingrandimento
    img.alt = '';
  });
  lensIn.appendChild(clone);

  let w = 0;
  let h = 0;
  let D = 176;
  let tx = 0;
  let ty = 0;
  let cx = 0;
  let cy = 0;
  let active = false;
  let raf = 0;
  const measure = () => {
    const r = frame.getBoundingClientRect();
    w = r.width;
    h = r.height;
    D = lens.offsetWidth;
    lensIn.style.width = `${w * ZOOM}px`;
    lensIn.style.height = `${h * ZOOM}px`;
  };
  const tick = () => {
    cx += (tx - cx) * 0.22;
    cy += (ty - cy) * 0.22;
    lens.style.transform = `translate3d(${cx - D / 2}px, ${cy - D / 2}px, 0)`;
    lensIn.style.transform = `translate3d(${D / 2 - cx * ZOOM}px, ${D / 2 - cy * ZOOM}px, 0)`;
    frame.style.setProperty('--mx', `${cx}px`);
    frame.style.setProperty('--my', `${cy}px`);
    raf = active || Math.abs(tx - cx) > 0.3 || Math.abs(ty - cy) > 0.3 ? requestAnimationFrame(tick) : 0;
  };
  const move = (e: PointerEvent) => {
    const r = frame.getBoundingClientRect();
    tx = e.clientX - r.left;
    ty = e.clientY - r.top;
    if (!active) {
      active = true;
      measure();
      cx = tx;
      cy = ty;
      frame.classList.add('is-hover');
    }
    if (!raf) raf = requestAnimationFrame(tick);
  };
  const leave = () => {
    active = false;
    frame.classList.remove('is-hover');
  };
  frame.addEventListener('pointerenter', move);
  frame.addEventListener('pointermove', move);
  frame.addEventListener('pointerleave', leave);
  frame.addEventListener('pointercancel', leave);
  frame.addEventListener('pointerup', (e) => e.pointerType === 'touch' && leave());
  window.addEventListener('resize', () => active && measure());
  void light;
  void finePointer;
  void canAnimate;
}

/** Polvere / cenere in sospensione: pochi punti, solo quando la sezione è visibile. */
function initDust(root: HTMLElement) {
  const canvas = root.querySelector<HTMLCanvasElement>('[data-dust]');
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx) return;
  const DPR = Math.min(devicePixelRatio || 1, 1.5);
  let W = 0;
  let H = 0;
  const N = matchMedia('(max-width: 899px)').matches ? 26 : 54;
  const P = Array.from({ length: N }, () => ({ x: Math.random(), y: Math.random(), r: 0.5 + Math.random() * 1.6, v: 0.015 + Math.random() * 0.05, s: Math.random() * 6.28, a: 0.12 + Math.random() * 0.35 }));
  const size = () => {
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  };
  size();
  window.addEventListener('resize', size);
  let visible = false;
  let raf = 0;
  let last = performance.now();
  const frame = (t: number) => {
    const dt = Math.min(0.05, (t - last) / 1000);
    last = t;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#ece8df';
    for (const p of P) {
      p.y -= p.v * dt;
      p.s += dt * 0.6;
      if (p.y < -0.02) {
        p.y = 1.02;
        p.x = Math.random();
      }
      const x = (p.x + Math.sin(p.s) * 0.012) * W;
      ctx.globalAlpha = p.a * (0.6 + 0.4 * Math.sin(p.s * 1.7));
      ctx.beginPath();
      ctx.arc(x, p.y * H, p.r, 0, 6.283);
      ctx.fill();
    }
    raf = visible ? requestAnimationFrame(frame) : 0;
  };
  new IntersectionObserver(
    ([en]) => {
      visible = en.isIntersecting;
      if (visible && !raf) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    },
    { rootMargin: '100px' },
  ).observe(root);
}
