// Più screenshot a diversi offset di scroll: node scripts/shots.mjs prefix --w 1440 --h 900 --scrolls 0,900 [--sel '#id'] [--full]
import { launch } from './lib/pw.mjs';
const args = process.argv.slice(2);
const prefix = args[0];
const get = (k, d) => { const i = args.indexOf('--' + k); return i > -1 ? args[i + 1] : d; };
const has = (k) => args.includes('--' + k);
const w = +get('w', 1440), h = +get('h', 900), wait = +get('wait', 6500);
const scrolls = get('scrolls', '0').split(',');
const base = get('base', 'http://127.0.0.1:4321'), path = get('path', '/');
const browser = await launch();
const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: +get('dpr', 1), hasTouch: has('touch'), isMobile: has('mobile'), reducedMotion: has('reduced') ? 'reduce' : 'no-preference' });
const page = await ctx.newPage();
const logs = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => logs.push('[pageerror] ' + e.message));
await page.goto(base + path, { waitUntil: 'load' });
await page.waitForTimeout(wait);
for (const s of scrolls) {
  let y = s;
  const pos = (sel) => page.evaluate((q) => { const el = document.querySelector(q); return el ? el.getBoundingClientRect().top + window.scrollY : 0; }, sel);
  if (/^[#.\[]/.test(s)) {
    const [sel, off] = s.split('+');
    y = (await pos(sel)) + (off ? +off : 0);
  }
  await page.evaluate((yy) => window.scrollTo(0, yy), +y);
  await page.waitForTimeout(+get('settle', 2200));
  const f = `${prefix}-${String(s).replace(/[^a-z0-9+]/gi, '_')}.png`;
  await page.screenshot({ path: f });
  console.log(f);
}
const info = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, h: document.documentElement.scrollHeight }));
console.log(JSON.stringify(info), logs.length ? '\n' + [...new Set(logs)].join('\n') : '');
await browser.close();
