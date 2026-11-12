import { gsap, canAnimate } from './gsap';
import { lockScroll, unlockScroll } from './smooth';

export interface LightboxApi {
  open: (trigger: HTMLButtonElement) => void;
  close: () => void;
}

const pad = (n: number) => String(n).padStart(2, '0');

export function initLightbox(root: HTMLElement, getTriggers: () => HTMLButtonElement[]): LightboxApi {
  const dlg = root.querySelector<HTMLDialogElement>('[data-lb]')!;
  const img = dlg.querySelector<HTMLImageElement>('[data-lb-img]')!;
  const cur = dlg.querySelector<HTMLElement>('[data-lb-cur]')!;
  const total = dlg.querySelector<HTMLElement>('[data-lb-total]')!;
  const artist = dlg.querySelector<HTMLElement>('[data-lb-artist]')!;
  const nEl = dlg.querySelector<HTMLElement>('[data-lb-n]')!;
  const ig = dlg.querySelector<HTMLAnchorElement>('[data-lb-ig]')!;
  const book = dlg.querySelector<HTMLAnchorElement>('[data-lb-book]')!;
  const stage = dlg.querySelector<HTMLElement>('[data-lb-stage]')!;

  let list: HTMLButtonElement[] = [];
  let idx = 0;
  let opener: HTMLButtonElement | null = null;
  let busy = false;

  const preload = (b?: HTMLButtonElement) => {
    if (b?.dataset.full) {
      const i = new Image();
      i.src = b.dataset.full;
    }
  };

  const show = (i: number, dir: 0 | 1 | -1 = 0) => {
    idx = (i + list.length) % list.length;
    const b = list[idx];
    const d = b.dataset;
    const animate = canAnimate();
    const apply = () => {
      img.src = d.full || '';
      img.alt = d.alt || '';
      if (d.w && d.h) {
        img.width = +d.w;
        img.height = +d.h;
      }
      cur.textContent = pad(idx + 1);
      total.textContent = pad(list.length);
      artist.textContent = d.name || '';
      nEl.textContent = d.n ? `— N° ${d.n}` : '';
      ig.href = d.ig || '#';
      ig.textContent = `@${d.handle ?? ''}`;
      ig.dataset.track = 'instagram_click';
      book.dataset.artistPick = (d.name || '').toLowerCase();
      preload(list[(idx + 1) % list.length]);
      preload(list[(idx - 1 + list.length) % list.length]);
    };
    if (!animate || dir === 0 && !dlg.open) {
      apply();
      return;
    }
    busy = true;
    if (dir === 0) {
      apply();
      gsap.fromTo(img, { opacity: 0, scale: 1.06, clipPath: 'inset(6% 6% 6% 6%)' }, { opacity: 1, scale: 1, clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: 'power4.out', onComplete: () => (busy = false) });
      return;
    }
    gsap.to(img, {
      opacity: 0,
      x: -60 * dir,
      duration: 0.28,
      ease: 'power2.in',
      onComplete: () => {
        apply();
        gsap.fromTo(img, { opacity: 0, x: 60 * dir }, { opacity: 1, x: 0, duration: 0.6, ease: 'power3.out', onComplete: () => (busy = false) });
      },
    });
  };

  const open = (trigger: HTMLButtonElement) => {
    list = getTriggers();
    const i = list.indexOf(trigger);
    if (i < 0) return;
    opener = trigger;
    lockScroll();
    dlg.showModal();
    show(i, 0);
    window.dispatchEvent(new CustomEvent('kimera:track', { detail: { name: 'lightbox_open', params: { work: trigger.dataset.n } } }));
  };
  const close = () => {
    if (!dlg.open) return;
    if (canAnimate()) {
      gsap.to(dlg, { opacity: 0, duration: 0.35, ease: 'power2.in', onComplete: () => {
        dlg.close();
        gsap.set(dlg, { clearProps: 'opacity' });
      } });
    } else dlg.close();
  };
  dlg.addEventListener('close', () => {
    unlockScroll();
    opener?.focus({ preventScroll: true });
  });
  dlg.addEventListener('cancel', (e) => {
    e.preventDefault();
    close();
  });

  const go = (d: 1 | -1) => {
    if (busy || list.length < 2) return;
    show(idx + d, d);
  };

  root.addEventListener('click', (e) => {
    const t = (e.target as Element).closest<HTMLButtonElement>('[data-lb-trigger]');
    if (t && !t.disabled) open(t);
  });
  dlg.querySelector('[data-lb-close]')!.addEventListener('click', close);
  dlg.querySelector('[data-lb-prev]')!.addEventListener('click', () => go(-1));
  dlg.querySelector('[data-lb-next]')!.addEventListener('click', () => go(1));
  book.addEventListener('click', (e) => {
    // chiude la lightbox e lascia che l'ancora porti al modulo
    e.preventDefault();
    const artistId = book.dataset.artistPick;
    close();
    setTimeout(() => {
      document.dispatchEvent(new CustomEvent('kimera:pick-artist', { detail: artistId }));
      document.querySelector<HTMLAnchorElement>('a[data-scroll-to="#contact"]')?.click();
    }, 400);
  });
  // click sullo sfondo (fuori dall'immagine) chiude
  stage.addEventListener('click', (e) => {
    if (e.target === stage) close();
  });
  dlg.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') go(1);
    else if (e.key === 'ArrowLeft') go(-1);
  });

  // swipe orizzontale
  let sx = 0;
  let sy = 0;
  let tracking = false;
  stage.addEventListener('pointerdown', (e) => {
    if ((e.target as Element).closest('button')) return;
    tracking = true;
    sx = e.clientX;
    sy = e.clientY;
  });
  stage.addEventListener('pointerup', (e) => {
    if (!tracking) return;
    tracking = false;
    const dx = e.clientX - sx;
    const dy = e.clientY - sy;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.4) go(dx < 0 ? 1 : -1);
  });
  stage.addEventListener('pointercancel', () => (tracking = false));

  return { open, close };
}
