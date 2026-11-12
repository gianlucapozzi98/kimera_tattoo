/**
 * Test delle interazioni principali nel browser (server di produzione):
 * menu a tutto schermo, slideshow pinned, artisti (hover/tap/tastiera), filtri portfolio,
 * lightbox (apri / naviga / Esc / ritorno del focus), FAQ, cookie banner + gating analytics, anchor nav.
 * Le parti che richiedono foto reali (lightbox, filtri) vengono saltate se l'archivio è vuoto.
 */
import { spawn } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch } from './lib/pw.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 4397, base = `http://127.0.0.1:${PORT}`;
const server = spawn('node', ['dist/server/entry.mjs'], { cwd: root, env: { ...process.env, PORT: String(PORT), HOST: '127.0.0.1', FORM_MODE: 'outbox', NODE_ENV: 'production' }, stdio: 'ignore' });
for (let i = 0; i < 50; i++) { try { await fetch(base + '/'); break; } catch { await new Promise((r) => setTimeout(r, 200)); } }
let pass = 0, fail = 0, skip = 0;
const ok = (n, c, x = '') => { c ? pass++ : fail++; console.log(`  ${c ? '✔' : '✘'} ${n}${c ? '' : '  ← ' + x}`); };
const sk = (n) => { skip++; console.log(`  ↷ ${n} (saltato: nessuna foto reale)`); };

const browser = await launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errors = []; const third = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('request', (r) => { const u = new URL(r.url()); if (u.hostname !== '127.0.0.1') third.push(u.hostname); });
await page.goto(base + '/', { waitUntil: 'load' });
await page.waitForTimeout(7000); // intro cinematografica

console.log('\nIntro e hero');
ok('intro completata (classe intro-done)', await page.evaluate(() => document.documentElement.classList.contains('intro-done')));
ok('overlay intro rimosso dal DOM', (await page.locator('[data-intro]').count()) === 0);
ok('titolo h1 visibile', await page.locator('h1').isVisible());
ok('Sink attivo di default (stato iniziale)', (await page.locator('#tab-sink').getAttribute('aria-selected')) === 'true' && (await page.locator('#tab-cromo').getAttribute('aria-selected')) === 'false');
ok('scroll sbloccato dopo l’intro', !(await page.evaluate(() => document.documentElement.classList.contains('is-locked'))));
const hasReal = (await page.locator('[data-lb-trigger]:not([disabled])').count()) > 0;

console.log('\nCookie / consenso (gating)');
await page.waitForTimeout(600);
ok('banner cookie mostrato al primo accesso', await page.locator('[data-cookie]').isVisible());
ok('nessuna richiesta a domini di terzi prima del consenso', third.length === 0, [...new Set(third)].join(','));
ok('banner: Rifiuta / Personalizza / Accetta presenti', (await page.locator('[data-cookie] .btn').count()) >= 3);
await page.locator('[data-cookie-reject]').click(); await page.waitForTimeout(700);
ok('Rifiuta chiude il banner', !(await page.locator('[data-cookie]').isVisible()));
ok('scelta salvata (analytics=false)', await page.evaluate(() => JSON.parse(localStorage.getItem('kimera-consent-v1')).analytics === false));
await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(3000);
ok('al ricaricamento il banner non riappare', !(await page.locator('[data-cookie]').isVisible()));
await page.locator('[data-cookie-open]').first().evaluate((e) => e.click()); await page.waitForTimeout(500);
ok('“Preferenze cookie” nel footer riapre le preferenze', await page.locator('[data-cookie-prefs]').isVisible());
await page.locator('[data-cookie-analytics]').check(); await page.locator('[data-cookie-save]').click(); await page.waitForTimeout(600);
ok('preferenza aggiornata (analytics=true)', await page.evaluate(() => JSON.parse(localStorage.getItem('kimera-consent-v1')).analytics === true));
ok('senza ID analytics configurato non parte nessuno script di terzi', third.length === 0, [...new Set(third)].join(','));

console.log('\nMenu a tutto schermo');
await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(800);
await page.locator('[data-menu-toggle]').click(); await page.waitForTimeout(1500);
ok('menu aperto: aria-expanded=true', (await page.locator('[data-menu-toggle]').getAttribute('aria-expanded')) === 'true');
ok('menu non più inert e visibile', (await page.locator('[data-menu]').evaluate((e) => !e.hasAttribute('inert') && getComputedStyle(e).visibility === 'visible')));
ok('focus portato dentro il menu', await page.evaluate(() => !!document.activeElement?.closest('[data-menu]')));
await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab');
ok('focus trap: il focus resta nell’header', await page.evaluate(() => !!document.activeElement?.closest('[data-header]')));
await page.keyboard.press('Escape'); await page.waitForTimeout(1200);
ok('Esc chiude il menu e restituisce il focus al bottone', (await page.locator('[data-menu-toggle]').getAttribute('aria-expanded')) === 'false' && (await page.evaluate(() => document.activeElement?.hasAttribute('data-menu-toggle'))));
await page.locator('[data-menu-toggle]').click(); await page.waitForTimeout(1300);
await page.locator('.menu__link[data-nav=portfolio]').click(); await page.waitForTimeout(3200);
const y = await page.evaluate(() => Math.abs(document.getElementById('portfolio').getBoundingClientRect().top));
ok('link del menu: scroll alla sezione Portfolio', y < 120, `distanza ${y}px`);
ok('menu chiuso dopo la navigazione', (await page.locator('[data-menu-toggle]').getAttribute('aria-expanded')) === 'false');

console.log('\nSlideshow orizzontale (pinned)');
await page.evaluate(() => window.scrollTo(0, document.querySelector('.pin-spacer').getBoundingClientRect().top + window.scrollY)); await page.waitForTimeout(1500);
ok('modalità pinned attiva su desktop', await page.locator('[data-showcase].is-pinned').count() === 1);
const x0 = await page.evaluate(() => new DOMMatrix(getComputedStyle(document.querySelector('[data-rail]')).transform).m41);
await page.mouse.wheel(0, 1800); await page.waitForTimeout(2200);
const x1 = await page.evaluate(() => new DOMMatrix(getComputedStyle(document.querySelector('[data-rail]')).transform).m41);
ok('lo scroll verticale sposta la track in orizzontale', x1 < x0 - 300, `x0=${x0} x1=${x1}`);
ok('contatore progressivo aggiornato', Number(await page.locator('[data-cur]').innerText()) >= 1);
const barScale = await page.evaluate(() => new DOMMatrix(getComputedStyle(document.querySelector('[data-bar]')).transform).a);
ok('barra di avanzamento > 0', barScale > 0.05, String(barScale));

console.log('\nArtisti');
await page.mouse.move(3, 3);
await page.evaluate(() => document.getElementById('artists').scrollIntoView()); await page.waitForTimeout(1800);
await page.locator('#tab-cromo').hover(); await page.waitForTimeout(2200);
ok('hover su CROMO cambia artista', (await page.locator('#tab-cromo').getAttribute('aria-selected')) === 'true' && await page.locator('#panel-cromo').isVisible() && !(await page.locator('#panel-sink').isVisible()));
await page.locator('#tab-cromo').focus(); await page.keyboard.press('ArrowUp'); await page.waitForTimeout(2200);
ok('tastiera (frecce) cambia artista', (await page.locator('#tab-sink').getAttribute('aria-selected')) === 'true');
ok('link Instagram dell’artista corretto', (await page.locator('#panel-sink .panel__handle a').getAttribute('href')) === 'https://www.instagram.com/sink_tatt00/');
await page.locator('#panel-sink [data-artist-pick]').click(); await page.waitForTimeout(2500);
ok('CTA “Richiedi un appuntamento con Sink” preseleziona l’artista nel modulo', await page.locator('input[name=artist][value=sink]').isChecked());

console.log('\nPortfolio e lightbox');
await page.evaluate(() => document.getElementById('portfolio').scrollIntoView()); await page.waitForTimeout(1500);
const total = await page.locator('[data-item]').count();
if (hasReal) {
  await page.locator('[data-filter=cromo]').click(); await page.waitForTimeout(1500);
  const vis = await page.locator('[data-item]:not([hidden])').count();
  const allCromo = await page.evaluate(() => [...document.querySelectorAll('[data-item]:not([hidden])')].every((i) => i.dataset.artist === 'cromo'));
  ok(`filtro Cromo: ${vis}/${total} opere, tutte di Cromo`, vis > 0 && vis < total && allCromo);
  ok('filtro: aria-pressed aggiornato', (await page.locator('[data-filter=cromo]').getAttribute('aria-pressed')) === 'true');
  await page.locator('[data-filter=all]').click(); await page.waitForTimeout(1500);
  ok('filtro Tutti ripristina tutte le opere', (await page.locator('[data-item]:not([hidden])').count()) === total);
  const first = page.locator('[data-lb-trigger]:not([disabled])').first();
  await first.scrollIntoViewIfNeeded(); await first.click(); await page.waitForTimeout(1500);
  ok('lightbox aperta (dialog modale)', await page.locator('[data-lb]').evaluate((d) => d.open));
  ok('immagine full-size caricata', await page.locator('[data-lb-img]').evaluate((i) => i.complete && i.naturalWidth > 800));
  ok('contatore 01 / NN', (await page.locator('[data-lb-cur]').innerText()) === '01');
  await page.keyboard.press('ArrowRight'); await page.waitForTimeout(1200);
  ok('→ passa alla seconda opera', (await page.locator('[data-lb-cur]').innerText()) === '02');
  await page.locator('[data-lb-prev]').click(); await page.waitForTimeout(1200);
  ok('pulsante precedente torna alla prima', (await page.locator('[data-lb-cur]').innerText()) === '01');
  ok('link Instagram dell’artista nella lightbox', /instagram\.com\/(sink_tatt00|cromo_ink)/.test(await page.locator('[data-lb-ig]').getAttribute('href')));
  await page.keyboard.press('Escape'); await page.waitForTimeout(900);
  ok('Esc chiude la lightbox', !(await page.locator('[data-lb]').evaluate((d) => d.open)));
  ok('il focus torna all’opera aperta', await page.evaluate(() => document.activeElement?.hasAttribute('data-lb-trigger')));
  ok('scroll sbloccato dopo la chiusura', !(await page.evaluate(() => document.documentElement.classList.contains('is-locked'))));
  await page.mouse.move(5, 5);
  await page.locator('#tab-sink').evaluate((e) => e.scrollIntoView()); await page.waitForTimeout(800);
  await page.mouse.move(5, 5);
  await page.locator('#panel-sink .thumb:not([disabled])').first().click(); await page.waitForTimeout(1500);
  ok('miniatura in “Artists” apre la lightbox', await page.locator('[data-lb]').evaluate((d) => d.open));
  await page.keyboard.press('Escape'); await page.waitForTimeout(800);
} else { ['filtro', 'lightbox'].forEach(sk); ok('segnaposto del portfolio non aprono la lightbox (disabled)', (await page.locator('[data-lb-trigger]:not([disabled])').count()) === 0); }

console.log('\nFAQ');
await page.evaluate(() => document.getElementById('faq').scrollIntoView()); await page.waitForTimeout(1500);
const q = page.locator('details.q').first();
await q.locator('summary').click(); await page.waitForTimeout(1000);
ok('apre una domanda', await q.evaluate((d) => d.open));
await page.locator('details.q').nth(1).locator('summary').click(); await page.waitForTimeout(1200);
ok('apertura esclusiva: la prima si chiude', !(await q.evaluate((d) => d.open)));
await page.locator('details.q').nth(1).locator('summary').focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(900);
ok('tastiera: Invio richiude', !(await page.locator('details.q').nth(1).evaluate((d) => d.open)));

console.log('\nFooter e navigazione');
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await page.waitForTimeout(2500);
ok('wordmark KIMERA animata e visibile', await page.locator('.footer__wordmark').isVisible());
await page.locator('.footer__top-btn').click(); await page.waitForTimeout(3500);
ok('“Torna su” riporta in cima', (await page.evaluate(() => window.scrollY)) < 50, String(await page.evaluate(() => window.scrollY)));

console.log('\nPagine di servizio');
for (const [p, h] of [['/privacy/', 'Privacy Policy'], ['/terms/', 'Termini di utilizzo'], ['/cookie-policy/', 'Cookie Policy']]) {
  const r = await page.goto(base + p); ok(`${p} → 200 con h1 “${h}”`, r.status() === 200 && (await page.locator('h1').innerText()).toLowerCase().includes(h.toLowerCase()));
}
const nf = await page.goto(base + '/non-esiste'); ok('404 personalizzata (status 404 + contenuto del sito)', nf.status() === 404 && (await page.content()).includes('Segno non trovato'));
const rb = await (await fetch(base + '/robots.txt')).text(); ok('robots.txt con Sitemap e Disallow /api/', rb.includes('Sitemap:') && rb.includes('Disallow: /api/'));
const sm = await (await fetch(base + '/sitemap.xml')).text(); ok('sitemap.xml valida con le pagine indicizzabili', sm.includes('<urlset') && sm.includes('/privacy/') && !sm.includes('404'));
const ld = await (await fetch(base + '/')).text(); ok('JSON-LD TattooParlor + FAQPage presenti', ld.includes('"TattooParlor"') && ld.includes('"FAQPage"'));
const real = errors.filter((e) => !/status of 404/.test(e));
ok('nessun errore JS in tutta la sessione (escluso il 404 voluto)', real.length === 0, real.join(' | '));

await browser.close(); server.kill();
console.log(`\n${fail === 0 ? '✅' : '❌'} ${pass} superati, ${fail} falliti, ${skip} saltati`);
process.exit(fail ? 1 : 0);
