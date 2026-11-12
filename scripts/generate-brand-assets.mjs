/**
 * Genera favicon, icone PWA, Open Graph e manifest in /public.
 *
 * - Senza logo ufficiale: usa un MONOGRAMMA TIPOGRAFICO provvisorio (non è il logo!).
 * - Con logo in src/assets/brand/logo.(svg|png|webp): lo inserisce al posto del monogramma.
 *
 *   npm run assets:brand
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch } from './lib/pw.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pub = resolve(root, 'public');
mkdirSync(pub, { recursive: true });
const font = (p) => readFileSync(resolve(root, 'node_modules', p)).toString('base64');
const archivo = font('@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2');
const serif = font('@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2');
const mono = font('@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2');

const logoPath = ['svg', 'png', 'webp'].map((e) => resolve(root, `src/assets/brand/logo.${e}`)).find(existsSync);
const logoUri = logoPath
  ? `data:${logoPath.endsWith('svg') ? 'image/svg+xml' : logoPath.endsWith('png') ? 'image/png' : 'image/webp'};base64,${readFileSync(logoPath).toString('base64')}`
  : null;

const css = `
@font-face{font-family:A;src:url(data:font/woff2;base64,${archivo}) format('woff2');font-weight:100 900;font-stretch:62% 125%}
@font-face{font-family:S;src:url(data:font/woff2;base64,${serif}) format('woff2');font-style:italic}
@font-face{font-family:M;src:url(data:font/woff2;base64,${mono}) format('woff2');font-weight:100 800}
*{box-sizing:border-box;margin:0}
body{background:#0a0a0b;color:#ece8df;overflow:hidden}
`;

const iconHtml = (size) => `<style>${css}
body{width:${size}px;height:${size}px;display:grid;place-items:center;position:relative}
.k{font-family:A;font-weight:900;font-stretch:125%;font-size:${size * 0.62}px;line-height:1;letter-spacing:-0.04em;transform:translateY(-${size * 0.015}px)}
.r{position:absolute;inset:${size * 0.07}px;border:${Math.max(1, size * 0.008)}px solid rgba(236,232,223,.35);border-radius:50%}
img{width:${size * 0.62}px;height:auto;max-height:${size * 0.62}px;object-fit:contain}
</style><div class="r"></div>${logoUri ? `<img src="${logoUri}">` : '<div class="k">K</div>'}`;

const ogHtml = `<style>${css}
body{width:1200px;height:630px;position:relative;background:#0a0a0b}
.g{position:absolute;inset:0;background:radial-gradient(70% 90% at 82% 30%,rgba(236,232,223,.10),transparent 60%),repeating-radial-gradient(circle at 82% 30%,rgba(236,232,223,.05) 0 1px,transparent 1px 16px)}
.m{position:absolute;width:26px;height:26px;border:0 solid #ece8df;opacity:.8}
.tl{left:44px;top:44px;border-left-width:2px;border-top-width:2px}.tr{right:44px;top:44px;border-right-width:2px;border-top-width:2px}
.bl{left:44px;bottom:44px;border-left-width:2px;border-bottom-width:2px}.br{right:44px;bottom:44px;border-right-width:2px;border-bottom-width:2px}
.t{position:absolute;left:72px;bottom:150px;font-family:A;font-weight:900;font-stretch:125%;font-size:200px;line-height:.8;letter-spacing:-0.05em}
.s{position:absolute;left:76px;bottom:92px;font-family:M;font-weight:600;font-size:22px;letter-spacing:.34em;text-transform:uppercase;color:#9a9da3}
.q{position:absolute;right:72px;bottom:86px;font-family:S;font-style:italic;font-size:44px;color:#ece8df}
.l{position:absolute;left:72px;top:72px;height:64px}
.top{position:absolute;right:76px;top:70px;font-family:M;font-weight:500;font-size:18px;letter-spacing:.2em;color:#9a9da3;text-transform:uppercase}
</style><div class="g"></div><i class="m tl"></i><i class="m tr"></i><i class="m bl"></i><i class="m br"></i>
${logoUri ? `<img class="l" src="${logoUri}">` : ''}
<div class="top">Sink × Cromo</div>
<div class="t">${logoUri ? '' : 'KIMERA'}</div><div class="s">${logoUri ? '' : 'Tattoo'}${logoUri ? 'Kimera Tattoo' : ''}</div><div class="q">Your skin. Your story. Our art.</div>`;

const browser = await launch();
const ctx = await browser.newContext({ deviceScaleFactor: 1 });
const page = await ctx.newPage();
const shot = async (html, w, h, type = 'png', quality) => {
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(`<html><body>${html}</body></html>`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
  return page.screenshot({ type, quality, clip: { x: 0, y: 0, width: w, height: h } });
};

const out = {};
for (const s of [48, 180, 192, 512]) out[s] = await shot(iconHtml(s), s, s);
writeFileSync(resolve(pub, 'apple-touch-icon.png'), out[180]);
writeFileSync(resolve(pub, 'icon-192.png'), out[192]);
writeFileSync(resolve(pub, 'icon-512.png'), out[512]);
// .ico (PNG incorporato)
const png = out[48];
const hdr = Buffer.alloc(22);
hdr.writeUInt16LE(0, 0); hdr.writeUInt16LE(1, 2); hdr.writeUInt16LE(1, 4);
hdr[6] = 48; hdr[7] = 48; hdr.writeUInt16LE(1, 10); hdr.writeUInt16LE(32, 12); hdr.writeUInt32LE(png.length, 14); hdr.writeUInt32LE(22, 18);
writeFileSync(resolve(pub, 'favicon.ico'), Buffer.concat([hdr, png]));
writeFileSync(resolve(pub, 'og-default.jpg'), await shot(ogHtml, 1200, 630, 'jpeg', 88));
await browser.close();

if (!logoPath || !logoPath.endsWith('svg')) {
  writeFileSync(resolve(pub, 'favicon.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#0a0a0b"/><circle cx="32" cy="32" r="28" fill="none" stroke="#ece8df" stroke-opacity=".35" stroke-width="1"/><path fill="#ece8df" d="M20 14h8.5v15.6L42.6 14H53L37.3 31.5 54 50H43.4L30.2 35.3 28.5 37V50H20z"/></svg>\n`);
} else {
  writeFileSync(resolve(pub, 'favicon.svg'), readFileSync(logoPath));
}
writeFileSync(resolve(pub, 'site.webmanifest'), JSON.stringify({
  name: 'Kimera Tattoo', short_name: 'Kimera', description: 'Kimera Tattoo — Sink & Cromo',
  start_url: '/', display: 'standalone', background_color: '#0a0a0b', theme_color: '#0a0a0b', lang: 'it',
  icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }, { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' }],
}, null, 2) + '\n');
console.log(logoPath ? `Asset generati con il logo: ${logoPath}` : 'Asset generati con monogramma provvisorio (nessun logo in src/assets/brand/).');
