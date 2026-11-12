// Screenshot rapido per sviluppo: node scripts/shot.mjs out.png --w 1440 --h 900 --path / --scroll 0 --wait 5500 [--full] [--mobile]
import { launch } from './lib/pw.mjs';
const args = process.argv.slice(2);
const out = args[0];
const get = (k, d) => { const i = args.indexOf('--' + k); return i > -1 ? args[i + 1] : d; };
const has = (k) => args.includes('--' + k);
const w = +get('w', 1440), h = +get('h', 900), path = get('path', '/'), scroll = get('scroll', '0'), wait = +get('wait', 5500);
const base = get('base', 'http://127.0.0.1:4321');
const sel = get('sel', '');
const browser = await launch();
const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: +get('dpr', 1), hasTouch: has('touch'), isMobile: has('mobile'), reducedMotion: has('reduced') ? 'reduce' : 'no-preference' });
const page = await ctx.newPage();
const logs = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => logs.push('[pageerror] ' + e.message));
page.on('requestfailed', (r) => logs.push('[reqfail] ' + r.url()));
await page.goto(base + path, { waitUntil: 'load' });
await page.waitForTimeout(wait);
if (sel) { await page.evaluate((s) => document.querySelector(s)?.scrollIntoView({ block: 'start' }), sel); await page.waitForTimeout(1800); }
else if (scroll !== '0') { await page.evaluate((y) => window.scrollTo(0, y), +scroll); await page.waitForTimeout(1800); }
await page.screenshot({ path: out, fullPage: has('full') });
const info = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, h: document.documentElement.scrollHeight }));
console.log(JSON.stringify(info), logs.length ? '\n' + [...new Set(logs)].join('\n') : '');
await browser.close();
