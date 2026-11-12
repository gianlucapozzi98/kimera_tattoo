import { getConsent, type Consent } from './consent-store';

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...a: unknown[]) => void;
    plausible?: (name: string, opts?: { props?: Record<string, unknown> }) => void;
  }
}

interface Cfg {
  ga4: string | null;
  plausible: string | null;
}

let cfg: Cfg = { ga4: null, plausible: null };
let granted = false;
let loaded = false;

function inject(src: string, attrs: Record<string, string> = {}) {
  const s = document.createElement('script');
  s.async = true;
  s.src = src;
  Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v));
  document.head.appendChild(s);
}

function load() {
  if (loaded) return;
  loaded = true;
  if (cfg.ga4) {
    inject(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(cfg.ga4)}`);
    window.gtag?.('js', new Date());
    window.gtag?.('config', cfg.ga4, { anonymize_ip: true, allow_google_signals: false, allow_ad_personalization_signals: false });
  }
  if (cfg.plausible) {
    window.plausible = window.plausible || ((...a: unknown[]) => ((window.plausible as any).q = (window.plausible as any).q || []).push(a));
    inject('https://plausible.io/js/script.tagged-events.js', { 'data-domain': cfg.plausible, defer: '' });
  }
}

function apply(c: Consent | null) {
  granted = !!c?.analytics;
  window.gtag?.('consent', 'update', { analytics_storage: granted ? 'granted' : 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
  if (granted) load();
}

/** Registra un evento (solo con consenso e solo se un provider è configurato). */
export function track(name: string, params: Record<string, unknown> = {}) {
  if (!granted || !loaded) return;
  window.gtag?.('event', name, params);
  window.plausible?.(name, { props: params as Record<string, unknown> });
}

export function initAnalytics() {
  try {
    cfg = JSON.parse(document.getElementById('kimera-config')?.textContent || '{}');
  } catch {}

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  };
  // Consent Mode v2: tutto negato finché l'utente non sceglie
  window.gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });

  apply(getConsent());
  window.addEventListener('kimera:consent', (e) => apply((e as CustomEvent<Consent>).detail));
  window.addEventListener('kimera:track', (e) => {
    const d = (e as CustomEvent<{ name: string; params?: Record<string, unknown> }>).detail;
    track(d.name, d.params);
  });

  // eventi dichiarativi: data-track="nome" [data-track-label="…"]
  document.addEventListener('click', (e) => {
    const t = (e.target as Element).closest<HTMLElement>('[data-track]');
    if (!t) return;
    track(t.dataset.track!, { label: t.dataset.trackLabel ?? '', href: (t as HTMLAnchorElement).href ?? '' });
  });
}
