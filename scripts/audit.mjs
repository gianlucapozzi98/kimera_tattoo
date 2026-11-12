/**
 * Audit automatico su 3 viewport (desktop / tablet / mobile) per ogni pagina:
 *   • errori console, pageerror, richieste fallite, immagini rotte
 *   • overflow orizzontale
 *   • accessibilità con axe-core (WCAG 2.1 A/AA + best practice), in modalità reduced-motion
 *   • SEO di base: title, description, canonical, Open Graph, h1, alt, lang
 *   • target touch ≥ 24×24 px su mobile, skip-link, landmark
 * Avvia da solo il server di produzione. Uso: npm run build && npm run test:audit
 */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch } from './lib/pw.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const axePath = require.resolve('axe-core/axe.min.js');
const PORT = 4398, base = `http://127.0.0.1:${PORT}`;
const server = spawn('node', ['dist/server/entry.mjs'], { cwd: root, env: { ...process.env, PORT: String(PORT), HOST: '127.0.0.1', FORM_MODE: 'outbox', NODE_ENV: 'production' }, stdio: 'ignore' });
for (let i = 0; i < 50; i++) { try { await fetch(base + '/'); break; } catch { await new Promise((r) => setTimeout(r, 200)); } }

const pages = ['/', '/privacy/', '/terms/', '/cookie-policy/', '/404/'];
const viewports = [
  { name: 'desktop 1440×900', w: 1440, h: 900, mobile: false },
  { name: 'tablet 820×1180', w: 820, h: 1180, mobile: true },
  { name: 'mobile 390×844', w: 390, h: 844, mobile: true },
];
const browser = await launch();
let problems = 0;
const flag = (msg) => { problems++; console.log('    ✘ ' + msg); };

for (const vp of viewports) {
  console.log(`\n━━ ${vp.name}`);
  for (const path of pages) {
    // 1) movimento attivo: errori runtime
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, isMobile: vp.mobile, hasTouch: vp.mobile });
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
    page.on('console', (m) => m.type() === 'error' && !(path === '/404/' && /404/.test(m.text())) && errs.push('console: ' + m.text()));
    page.on('requestfailed', (r) => !/mtalk\.google|googletagmanager|plausible/.test(r.url()) && errs.push('requestfailed: ' + r.url()));
    page.on('response', (r) => r.status() >= 400 && path !== '/404/' && errs.push(`HTTP ${r.status()}: ${r.url()}`));
    await page.goto(base + (path === '/404/' ? '/pagina-che-non-esiste' : path), { waitUntil: 'load' });
    await page.waitForTimeout(path === '/' ? 7000 : 1500);
    if (path === '/') { for (const y of [800, 2500, 5000, 9000, 14000]) { await page.evaluate((yy) => window.scrollTo(0, yy), y); await page.waitForTimeout(500); } await page.evaluate(() => window.scrollTo(0, 0)); }
    const m = await page.evaluate(() => {
      const q = (s) => document.querySelector(s);
      const imgs = [...document.images];
      return {
        title: document.title, desc: q('meta[name=description]')?.content, canon: q('link[rel=canonical]')?.href,
        og: ['og:title', 'og:description', 'og:image', 'og:url'].filter((p) => !q(`meta[property="${p}"]`)?.content),
        tw: q('meta[name="twitter:card"]')?.content, lang: document.documentElement.lang, h1: document.querySelectorAll('h1').length,
        noAlt: imgs.filter((i) => !i.hasAttribute('alt')).length, broken: imgs.filter((i) => i.complete && i.naturalWidth === 0 && i.currentSrc).map((i) => i.currentSrc),
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        icon: !!q('link[rel~=icon]'), manifest: !!q('link[rel=manifest]'), skip: !!q('.skip-link'), main: !!q('main'), nav: !!q('nav'), footer: !!q('footer'),
        small: [...document.querySelectorAll('a,button,input:not([type=hidden]),select,textarea,summary')].filter((e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && (r.width < 24 || r.height < 24) && !e.closest('.sr-only, .hp') && !(e.classList.contains('check')) && !(cs.display === 'inline' && e.closest('p, li, dd, address')) ; }).slice(0, 5).map((e) => `${e.tagName}.${e.className}[${(e.textContent || '').trim().slice(0, 18)}] ${Math.round(e.getBoundingClientRect().width)}×${Math.round(e.getBoundingClientRect().height)}`),
      };
    });
    await ctx.close();
    console.log(`  ${path}`);
    errs.forEach((e) => flag(e));
    if (!m.title || m.title.length > 70) flag(`title mancante o troppo lungo (${m.title?.length})`);
    if (!m.desc || m.desc.length < 50 || m.desc.length > 175) flag(`meta description da rivedere (${m.desc?.length ?? 0} car.)`);
    if (!m.canon) flag('canonical mancante');
    if (m.og.length) flag('Open Graph incompleto: ' + m.og.join(','));
    if (m.tw !== 'summary_large_image') flag('twitter:card mancante');
    if (m.lang !== 'it') flag('lang non impostato');
    if (m.h1 !== 1) flag(`h1 presenti: ${m.h1} (deve essere 1)`);
    if (m.noAlt) flag(`${m.noAlt} immagini senza attributo alt`);
    if (m.broken.length) flag('immagini rotte: ' + m.broken.join(', '));
    if (m.overflow > 0) flag(`overflow orizzontale di ${m.overflow}px`);
    if (!m.icon || !m.manifest) flag('favicon o manifest mancanti');
    if (!m.skip || !m.main || !m.nav || !m.footer) flag('landmark/skip-link mancanti');
    if (m.small.length) flag('target interattivi < 24px: ' + m.small.join(' | '));

    // 2) accessibilità: reduced motion = stato finale stabile
    const ctx2 = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, isMobile: vp.mobile, hasTouch: vp.mobile, reducedMotion: 'reduce' });
    const p2 = await ctx2.newPage();
    await p2.goto(base + (path === '/404/' ? '/pagina-che-non-esiste' : path), { waitUntil: 'load' });
    await p2.waitForTimeout(1500);
    await p2.addScriptTag({ path: axePath });
    const res = await p2.evaluate(async () => {
      const r = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] }, resultTypes: ['violations'] });
      return r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, n: v.nodes.length, sample: v.nodes.slice(0, 2).map((n) => n.target.join(' ')) }));
    });
    await ctx2.close();
    const serious = res.filter((v) => ['serious', 'critical'].includes(v.impact));
    res.forEach((v) => (['serious', 'critical'].includes(v.impact) ? flag : (m) => console.log('    ⚠ ' + m))(`axe [${v.impact}] ${v.id}: ${v.help} (${v.n}) → ${v.sample.join(' ; ')}`));
    if (!errs.length && !res.length) console.log('    ✔ nessun problema');
    void serious;
  }
}
await browser.close(); server.kill();
console.log(problems ? `\n❌ ${problems} problemi da correggere` : '\n✅ Audit superato: nessun errore, nessuna violazione grave');
process.exit(problems ? 1 : 0);
