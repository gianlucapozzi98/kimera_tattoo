import { gsap, ScrollTrigger, canAnimate, finePointer, isDesktop } from './gsap';
import { lockScroll, unlockScroll } from './smooth';

const KEY = 'kimera-intro-seen';

export function initHero(): Promise<void> {
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  const root = document.documentElement;
  if (!hero || !canAnimate()) {
    root.classList.add('intro-done');
    window.dispatchEvent(new CustomEvent('kimera:intro-done'));
    return Promise.resolve();
  }

  const media = hero.querySelector<HTMLElement>('[data-hero-media]')!;
  const img = hero.querySelector<HTMLElement>('[data-hero-img]')!;
  const photo = img.querySelector<HTMLElement>('.photo');
  const intro = hero.querySelector<HTMLElement>('[data-intro]')!;
  const logo = hero.querySelector<HTMLElement>('[data-intro-logo]')!;
  const bar = hero.querySelector<HTMLElement>('[data-intro-bar]')!;
  const header = document.querySelector<HTMLElement>('[data-header]');
  const words = hero.querySelectorAll<HTMLElement>('.hero__title .sw__i');
  const ins = [...hero.querySelectorAll<HTMLElement>('[data-hero-in]')];
  const seal = hero.querySelector<HTMLElement>('[data-hero-seal]');

  let seen = false;
  try {
    seen = sessionStorage.getItem(KEY) === '1';
  } catch {}
  // ricarica a metà pagina (scroll ripristinato) o ritorno: versione rapida, senza schermo nero
  const fast = seen || window.scrollY > 240;
  try {
    sessionStorage.setItem(KEY, '1');
  } catch {}

  if (window.scrollY <= 240) lockScroll();

  return new Promise<void>((resolve) => {
    const tl = gsap.timeline({
      defaults: { ease: 'power3.out' },
      onComplete: () => {
        root.classList.add('intro-done');
        window.dispatchEvent(new CustomEvent('kimera:intro-done'));
        unlockScroll();
        intro.remove();
        ScrollTrigger.refresh();
        resolve();
      },
    });

    // Fase 1 — schermo molto scuro, il logo emerge piano
    if (!fast) {
      tl.to(logo, { opacity: 1, scale: 1.55, duration: 1.2, ease: 'power2.out' }, 0.15)
        .to(bar, { scaleX: 1, duration: 1.3, ease: 'power1.inOut' }, 0.25)
        .to(logo, { opacity: 0, duration: 0.5, ease: 'power2.in' }, 1.65)
        .to(bar, { opacity: 0, duration: 0.3 }, 1.65);
    } else {
      gsap.set(intro, { opacity: 0 });
    }
    const t0 = fast ? 0.05 : 1.95;

    // Fase 2 — sipario che si alza, immagine rivelata da maschera
    if (!fast) tl.to(intro, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.25, ease: 'power4.inOut' }, t0);
    tl.fromTo(media, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: fast ? 1.0 : 1.7, ease: 'power4.inOut' }, t0 + 0.12);
    tl.fromTo(img, { scale: fast ? 1.15 : 1.4 }, { scale: 1.02, duration: fast ? 1.8 : 3.0, ease: 'power3.out' }, t0 + 0.12);

    // Fase 3 — header, titolo, elementi secondari in sequenza
    if (header) tl.fromTo(header, { opacity: 0 }, { opacity: 1, duration: 1.0, ease: 'power2.out', clearProps: 'opacity' }, t0 + 0.9);
    tl.fromTo(
      words,
      { y: 0, yPercent: 112 },
      {
        y: 0,
        yPercent: 0,
        duration: 1.35,
        ease: 'power4.out',
        stagger: 0.16,
        onComplete: () => {
          hero.querySelector('[data-split]')?.classList.add('is-in');
          gsap.set(words, { clearProps: 'transform' });
        },
      },
      t0 + 1.05,
    );
    const moving = ins.filter((el) => el.dataset.heroIn !== 'fade' && el !== seal);
    const fading = ins.filter((el) => el.dataset.heroIn === 'fade');
    tl.fromTo(moving, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 1.1, stagger: 0.12, ease: 'power3.out' }, t0 + 1.6);
    tl.to(fading, { opacity: 1, duration: 1.2 }, t0 + 1.9);
    if (seal) tl.fromTo(seal, { opacity: 0, scale: 0.6, rotate: -120 }, { opacity: 1, scale: 1, rotate: 0, duration: 1.6, ease: 'power4.out' }, t0 + 1.7);

    // Parallasse allo scroll (creato subito: non interferisce con le tween d'ingresso)
    ScrollTrigger.create({
      trigger: hero,
      start: 'top top',
      end: 'bottom top',
      scrub: true,
      animation: gsap
        .timeline({ defaults: { ease: 'none' } })
        .to(img, { yPercent: 16 }, 0)
        .to(photo ?? img, { scale: 1.12 }, 0)
        .to('.hero__title', { yPercent: isDesktop() ? -22 : -10 }, 0)
        .to('.hero__foot', { yPercent: -30, opacity: 0 }, 0)
        .to('.hero__seal', { yPercent: 60, rotate: 90 }, 0),
    });

    // Parallasse al puntatore (solo mouse)
    if (finePointer() && isDesktop()) {
      const qImg = gsap.quickTo(img, 'x', { duration: 1.4, ease: 'power3.out' });
      const qTitle = gsap.quickTo('.hero__title', 'x', { duration: 1.4, ease: 'power3.out' });
      const qSeal = gsap.quickTo('.hero__seal', 'x', { duration: 1.6, ease: 'power3.out' });
      hero.addEventListener(
        'pointermove',
        (e) => {
          const nx = e.clientX / window.innerWidth - 0.5;
          qImg(nx * -22);
          qTitle(nx * 12);
          qSeal(nx * 26);
        },
        { passive: true },
      );
    }
  });
}
