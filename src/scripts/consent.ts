import { gsap, canAnimate } from './gsap';
import { getConsent, setConsent } from './consent-store';

/** Banner cookie: Rifiuta / Personalizza / Accetta con pari evidenza. Riapribile dal footer. */
export function initConsent() {
  const el = document.querySelector<HTMLElement>('[data-cookie]');
  if (!el) return;
  const main = el.querySelector<HTMLElement>('[data-cookie-main]')!;
  const prefs = el.querySelector<HTMLElement>('[data-cookie-prefs]')!;
  const analytics = el.querySelector<HTMLInputElement>('[data-cookie-analytics]')!;
  let lastFocus: HTMLElement | null = null;

  const show = (opts: { prefs?: boolean } = {}) => {
    lastFocus = document.activeElement as HTMLElement | null;
    el.hidden = false;
    main.hidden = !!opts.prefs;
    prefs.hidden = !opts.prefs;
    analytics.checked = !!getConsent()?.analytics;
    if (canAnimate()) gsap.fromTo(el, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' });
    el.querySelector<HTMLElement>(opts.prefs ? '[data-cookie-save]' : '[data-cookie-accept]')?.focus({ preventScroll: true });
  };
  const hide = () => {
    const done = () => {
      el.hidden = true;
      lastFocus?.focus?.({ preventScroll: true });
    };
    if (canAnimate()) gsap.to(el, { opacity: 0, y: 16, duration: 0.4, ease: 'power2.in', onComplete: done });
    else done();
  };

  el.querySelector('[data-cookie-accept]')!.addEventListener('click', () => {
    setConsent(true);
    hide();
  });
  el.querySelector('[data-cookie-reject]')!.addEventListener('click', () => {
    setConsent(false);
    hide();
  });
  el.querySelector('[data-cookie-custom]')!.addEventListener('click', () => {
    main.hidden = true;
    prefs.hidden = false;
    el.querySelector<HTMLElement>('[data-cookie-save]')?.focus();
  });
  el.querySelector('[data-cookie-save]')!.addEventListener('click', () => {
    setConsent(analytics.checked);
    hide();
  });
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && getConsent()) hide();
  });

  document.addEventListener('click', (e) => {
    if ((e.target as Element).closest('[data-cookie-open]')) {
      e.preventDefault();
      show({ prefs: true });
    }
  });

  // il banner compare a intro conclusa, per non sporcare la prima impressione
  if (!getConsent()) {
    const go = () => setTimeout(() => show(), 900);
    if (document.documentElement.classList.contains('intro-done')) go();
    else window.addEventListener('kimera:intro-done', go, { once: true });
  }
}
