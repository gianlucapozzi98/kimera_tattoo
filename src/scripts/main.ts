import { gsap, ScrollTrigger, canAnimate } from './gsap';
import { initSmooth, initAnchors } from './smooth';
import { initHeader } from './header';
import { initHero } from './hero';
import { initReveals } from './reveal';
import { initCursor } from './cursor';

const root = document.documentElement;
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

async function boot() {
  root.classList.add('ready'); // disattiva il failsafe: gli script girano
  const { closeMenu } = initHeader();
  initSmooth();
  initAnchors(closeMenu);
  initCursor();

  const heroDone = initHero();

  // moduli per sezione: caricati solo se la sezione esiste nella pagina
  const loaders: Array<Promise<unknown>> = [];
  const has = (sel: string) => !!document.querySelector(sel);
  if (has('[data-showcase]')) loaders.push(import('./showcase').then((m) => m.initShowcase()));
  if (has('[data-alive]')) loaders.push(import('./alive').then((m) => m.initAlive()));
  if (has('[data-artists]')) loaders.push(import('./artists').then((m) => m.initArtists()));
  if (has('[data-portfolio]')) loaders.push(import('./portfolio').then((m) => m.initPortfolio()));
  if (has('[data-studio]')) loaders.push(import('./studio').then((m) => m.initStudio()));
  if (has('[data-manifesto]')) loaders.push(import('./manifesto').then((m) => m.initManifesto()));
  if (has('[data-footer]')) loaders.push(import('./footer').then((m) => m.initFooter()));
  if (has('[data-form]')) loaders.push(import('./form').then((m) => m.initForm()));
  if (has('[data-faq]')) loaders.push(import('./faq').then((m) => m.initFaq()));
  if (has('[data-cookie]')) loaders.push(import('./consent').then((m) => m.initConsent()));
  loaders.push(import('./analytics').then((m) => m.initAnalytics()));

  initReveals();
  await Promise.allSettled(loaders);
  await heroDone;
  ScrollTrigger.refresh();
  // mantiene i trigger corretti quando font e immagini hanno finito di caricare
  window.addEventListener('load', () => ScrollTrigger.refresh());
  if (document.fonts?.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  void gsap;
  void canAnimate;
}

boot().catch((err) => {
  // se qualcosa va storto, mostra comunque tutto
  console.error('[kimera] init error', err);
  root.classList.add('anim-fail');
});
