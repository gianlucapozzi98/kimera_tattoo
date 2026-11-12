/**
 * Link checker sul sito compilato (dist/client).
 * Verifica: link interni, ancore (#id) e risorse (img, script, css, font, manifest, icone).
 * I link esterni vengono elencati; con --external vengono anche richiamati via HEAD.
 *
 *   npm run build && npm run test:links [-- --external]
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { resolve, dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'client');
if (!existsSync(root)) { console.error('Esegui prima: npm run build'); process.exit(1); }
const checkExternal = process.argv.includes('--external');

const walk = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : [p]; });
const htmlFiles = walk(root).filter((f) => f.endsWith('.html'));
const pageUrl = (f) => '/' + f.slice(root.length + 1).replace(/index\.html$/, '').replace(/\.html$/, '');
const ids = new Map(); // url → Set(id)
const docs = new Map();
for (const f of htmlFiles) {
  const html = readFileSync(f, 'utf8');
  const u = pageUrl(f);
  docs.set(u, html);
  ids.set(u, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
}

const resolveFile = (path) => {
  const clean = decodeURIComponent(path.split('#')[0].split('?')[0]);
  const candidates = [clean, clean + '/index.html', clean + '.html'];
  return candidates.some((c) => { const p = join(root, c); return existsSync(p) && statSync(p).isFile(); });
};
const dynamic = new Set(['/api/inquiry']); // endpoint POST (non è un link navigabile)

let broken = 0, checked = 0;
const externals = new Map();
const report = (page, what, msg) => { broken++; console.log(`  ✘ [${page}] ${what} → ${msg}`); };

for (const [page, html] of docs) {
  const found = [];
  for (const m of html.matchAll(/<(a|link|img|script|source|iframe)\b([^>]*)>/gi)) {
    const attrs = m[2];
    for (const a of ['href', 'src']) {
      const v = attrs.match(new RegExp(`\\s${a}="([^"]*)"`))?.[1];
      if (v) found.push({ tag: m[1].toLowerCase(), url: v, attrs });
    }
    const ss = attrs.match(/\ssrcset="([^"]*)"/)?.[1];
    if (ss) ss.split(',').forEach((p) => found.push({ tag: 'srcset', url: p.trim().split(/\s+/)[0], attrs }));
  }
  for (const { tag, url, attrs } of found) {
    if (!url || url.startsWith('data:') || url.startsWith('mailto:') || url.startsWith('tel:') || url.startsWith('javascript:')) continue;
    checked++;
    if (/^https?:\/\//.test(url) || url.startsWith('//')) {
      const full = url.startsWith('//') ? 'https:' + url : url;
      if (/kimeratattoo\.example/.test(full)) continue; // dominio segnaposto (canonical/og)
      (externals.get(full) ?? externals.set(full, []).get(full)).push(page);
      if (tag === 'a' && !/rel="[^"]*noopener/.test(attrs) && /target="_blank"/.test(attrs)) report(page, url, 'target=_blank senza rel=noopener');
      continue;
    }
    // interno
    const [p0, hash] = url.split('#');
    const targetPage = p0 === '' ? page : p0.startsWith('/') ? p0 : new URL(p0, 'http://x' + page).pathname;
    if (dynamic.has(targetPage)) continue;
    const isPage = !extname(targetPage) || targetPage.endsWith('/');
    if (isPage) {
      const norm = targetPage.endsWith('/') ? targetPage : targetPage + '/';
      if (!docs.has(norm) && !docs.has(targetPage)) { report(page, url, 'pagina inesistente'); continue; }
      if (hash && hash !== 'main' && !(ids.get(norm) ?? ids.get(targetPage))?.has(hash)) report(page, url, `ancora #${hash} assente nella pagina di destinazione`);
    } else if (!resolveFile(targetPage)) report(page, url, 'file mancante');
  }
}

console.log(`\nPagine analizzate: ${docs.size} — riferimenti interni/risorse controllati: ${checked}`);
console.log(`Link esterni (${externals.size}):`);
for (const [u, pages] of externals) console.log(`   • ${u}  (in ${[...new Set(pages)].join(', ')})`);

if (checkExternal) {
  console.log('\nVerifica HEAD dei link esterni…');
  for (const u of externals.keys()) {
    try { const r = await fetch(u, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(8000) }); console.log(`   ${r.status < 400 ? '✔' : '⚠'} ${r.status} ${u}`); }
    catch (e) { console.log(`   ⚠ non raggiungibile da qui (${e.cause?.code ?? e.message}) ${u}`); }
  }
}
console.log(broken ? `\n❌ ${broken} problemi` : '\n✅ Nessun link o risorsa interna rotta');
process.exit(broken ? 1 : 0);
