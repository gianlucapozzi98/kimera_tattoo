import { lockScroll, unlockScroll } from './smooth';

export function initHeader(): { closeMenu: () => void } {
  const header = document.querySelector<HTMLElement>('[data-header]');
  if (!header) return { closeMenu() {} };
  const toggle = header.querySelector<HTMLButtonElement>('[data-menu-toggle]')!;
  const menu = header.querySelector<HTMLElement>('[data-menu]')!;
  const label = header.querySelector<HTMLElement>('[data-menu-label]');
  let open = false;

  const focusables = () =>
    [...header.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')].filter((el) => {
      if (menu.contains(el)) return open;
      return el.offsetParent !== null;
    });

  const setOpen = (v: boolean) => {
    if (v === open) return;
    open = v;
    header.classList.toggle('is-menu-open', v);
    header.classList.remove('is-hidden');
    toggle.setAttribute('aria-expanded', String(v));
    toggle.setAttribute('aria-label', v ? 'Chiudi menu' : 'Apri menu');
    if (label) label.textContent = v ? 'Chiudi' : 'Menu';
    if (v) {
      menu.removeAttribute('inert');
      lockScroll();
      setTimeout(() => menu.querySelector<HTMLElement>('a')?.focus({ preventScroll: true }), 450);
    } else {
      menu.setAttribute('inert', '');
      unlockScroll();
    }
  };
  const closeMenu = () => {
    if (open) {
      setOpen(false);
    }
  };

  toggle.addEventListener('click', () => {
    setOpen(!open);
    if (!open) toggle.focus({ preventScroll: true });
  });
  menu.addEventListener('click', (e) => {
    if ((e.target as Element).closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', (e) => {
    if (!open) return;
    if (e.key === 'Escape') {
      setOpen(false);
      toggle.focus({ preventScroll: true });
    } else if (e.key === 'Tab') {
      const f = focusables();
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
  matchMedia('(min-width: 1100px)').addEventListener('change', () => {
    /* il menu resta disponibile anche su desktop: nessuna azione */
  });

  // — scroll: solido + nascondi/mostra —
  let lastY = window.scrollY;
  let ticking = false;
  const onScroll = () => {
    const y = window.scrollY;
    const dy = y - lastY;
    header.classList.toggle('is-solid', y > 40);
    if (!open) {
      if (y > 220 && dy > 6) header.classList.add('is-hidden');
      else if (dy < -4 || y < 120) header.classList.remove('is-hidden');
    }
    lastY = y;
    ticking = false;
  };
  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(onScroll);
      }
    },
    { passive: true },
  );
  onScroll();
  header.addEventListener('focusin', () => header.classList.remove('is-hidden'));

  // — sezione attiva —
  const links = [...header.querySelectorAll<HTMLAnchorElement>('.navlink[data-nav]')];
  const sections = links.map((l) => document.getElementById(l.dataset.nav!)).filter(Boolean) as HTMLElement[];
  if (sections.length) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (!en.isIntersecting) continue;
          links.forEach((l) => l.setAttribute('aria-current', String(l.dataset.nav === en.target.id)));
        }
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    sections.forEach((s) => io.observe(s));
  }

  return { closeMenu };
}
