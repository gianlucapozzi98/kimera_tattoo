/**
 * Test del modulo di richiesta — end to end contro il server di produzione (dist/server/entry.mjs).
 *   1. API: validazione server (campi mancanti, email errata, consenso, file non valido, file troppo grande, troppi file)
 *   2. API: honeypot, tempo minimo, rate limit, metodo non consentito, origin non valido
 *   3. API: invio valido con allegato → salvato in .data/inquiries (FORM_MODE=outbox)
 *   4. Browser: compilazione reale con Playwright (validazione client, upload, schermata di successo, anti-doppio-invio)
 */
import { spawn } from 'node:child_process';
import { readdirSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch } from './lib/pw.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 4399;
const base = `http://127.0.0.1:${PORT}`;
let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => { cond ? pass++ : fail++; console.log(`${cond ? '  ✔' : '  ✘'} ${name}${cond ? '' : '  ← ' + extra}`); };

if (!existsSync(resolve(root, 'dist/server/entry.mjs'))) { console.error('Esegui prima: npm run build'); process.exit(1); }
rmSync(resolve(root, '.data'), { recursive: true, force: true });

const server = spawn('node', ['dist/server/entry.mjs'], { cwd: root, env: { ...process.env, PORT: String(PORT), HOST: '127.0.0.1', FORM_MODE: 'outbox', NODE_ENV: 'production', TRUST_PROXY: '1' }, stdio: ['ignore', 'pipe', 'pipe'] });
let log = '';
server.stdout.on('data', (d) => (log += d)); server.stderr.on('data', (d) => (log += d));
for (let i = 0; i < 50; i++) { try { await fetch(base + '/'); break; } catch { await new Promise((r) => setTimeout(r, 200)); } }

// piccola PNG valida (1x1) e JPEG minimale
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==', 'base64');
const good = { name: 'Mario Rossi', email: 'mario@example.com', phone: '+39 333 1234567', artist: 'sink', type: 'nuovo', size: 'medio', area: 'braccio', message: 'Vorrei un lavoro sull\'avambraccio, ti allego un riferimento.', consent: 'on' };
let ipN = 10;
const post = async (fields, files = [], headers = {}) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) if (v !== undefined) fd.append(k, v);
  for (const f of files) fd.append('files', new Blob([f.data], { type: f.type }), f.name);
  const r = await fetch(base + '/api/inquiry', { method: 'POST', body: fd, headers: { Accept: 'application/json', 'X-Forwarded-For': `10.0.0.${ipN}`, ...headers } });
  let j = null; try { j = await r.json(); } catch {}
  return { status: r.status, body: j };
};

console.log('\nAPI — validazione');
let r = await post({ ...good, name: '' }); ok('nome mancante → 422', r.status === 422 && r.body.errors?.name, JSON.stringify(r));
r = await post({ ...good, email: 'non-una-email' }); ok('email non valida → 422', r.status === 422 && r.body.errors?.email);
r = await post({ ...good, phone: 'abc' }); ok('telefono non valido → 422', r.status === 422 && r.body.errors?.phone);
r = await post({ ...good, artist: 'altro' }); ok('artista fuori elenco → 422', r.status === 422 && r.body.errors?.artist);
r = await post({ ...good, message: 'corto' }); ok('descrizione troppo corta → 422', r.status === 422 && r.body.errors?.message);
r = await post({ ...good, consent: '' }); ok('consenso mancante → 422', r.status === 422 && r.body.errors?.consent);
r = await post({ ...good, message: 'x'.repeat(2001) }); ok('descrizione > 2000 → 422', r.status === 422 && r.body.errors?.message);
r = await post(good, [{ name: 'evil.png', type: 'image/png', data: Buffer.from('questo non è un PNG, solo testo lungo abbastanza') }]); ok('file con firma falsa → 422', r.status === 422 && r.body.errors?.files, JSON.stringify(r));
r = await post(good, [{ name: 'doc.pdf', type: 'application/pdf', data: PNG }]); ok('formato non consentito → 422', r.status === 422 && r.body.errors?.files);
r = await post(good, Array.from({ length: 6 }, (_, i) => ({ name: `a${i}.png`, type: 'image/png', data: PNG }))); ok('6 allegati → 422', r.status === 422 && r.body.errors?.files);
r = await post(good, [{ name: 'big.png', type: 'image/png', data: Buffer.concat([PNG, Buffer.alloc(9 * 1024 * 1024)]) }]); ok('allegato > 8 MB → 422', r.status === 422 && r.body.errors?.files, JSON.stringify(r).slice(0, 120));

console.log('\nAPI — sicurezza');
r = await post({ ...good, website: 'http://spam.example' }); ok('honeypot → finto successo, nessun salvataggio', r.status === 200 && r.body.ok === true);
r = await post({ ...good, ts: String(Date.now()) }); ok('compilato in < 2,5 s → scartato silenziosamente', r.status === 200 && r.body.ok === true);
r = await post(good, [], { Origin: 'https://evil.example', Host: '127.0.0.1:' + PORT }); ok('Origin di terzi → 403', r.status === 403, JSON.stringify(r));
const m = await fetch(base + '/api/inquiry', { method: 'GET' }); ok('GET → 405', m.status === 405);
const inj = await post({ ...good, name: 'Mario\r\nBcc: spam@example.com' }); ok('iniezione header nel nome → normalizzata (200)', inj.status === 200 && inj.body.ok, JSON.stringify(inj));

console.log('\nAPI — invio valido');
r = await post(good, [{ name: 'ref foto.png', type: 'image/png', data: PNG }]); ok('invio valido con allegato → 200 {ok:true,id}', r.status === 200 && r.body.ok && r.body.id, JSON.stringify(r));
const out = resolve(root, '.data', 'inquiries');
const dirs = existsSync(out) ? readdirSync(out) : [];
ok('richiesta salvata in .data/inquiries', dirs.length >= 2, `trovate ${dirs.length}`);
const last = dirs.map((d) => ({ d, files: readdirSync(resolve(out, d)) })).find((x) => x.files.includes('riferimento-1.png'));
ok('allegato salvato con nome sicuro (riferimento-1.png)', !!last);
if (last) {
  const j = JSON.parse(readFileSync(resolve(out, last.d, 'inquiry.json'), 'utf8'));
  ok('contenuto corretto (nome, email, artista)', j.name === 'Mario Rossi' && j.email === 'mario@example.com' && j.artist === 'sink');
}
const bots = dirs.map((d) => JSON.parse(readFileSync(resolve(out, d, 'inquiry.json'), 'utf8')));
ok('nessun salvataggio per honeypot / troppo veloce', !bots.some((b) => b.message?.includes('spam.example')) && bots.length === 2, `salvate ${bots.length}`);
ok('nome con newline ripulito', bots.some((b) => b.name === 'Mario Bcc: spam@example.com'), JSON.stringify(bots.map((b) => b.name)));

console.log('\nAPI — rate limit');
ipN = 200;
let limited = 0; for (let i = 0; i < 8; i++) { const x = await post(good); if (x.status === 429) limited++; }
ok('oltre 5 invii validi in 15 minuti → 429 (3 su 8 respinti)', limited === 3, `limitate: ${limited}`);
ipN = 201;
const inval = []; for (let i = 0; i < 12; i++) inval.push((await post({ ...good, email: 'x' })).status);
ok('richieste NON valide non consumano il tetto degli invii (12 × 422)', inval.every((c) => c === 422), inval.join(','));

console.log('\nBrowser — esperienza utente');
// riavvia il server per azzerare il rate limit
server.kill(); await new Promise((r) => setTimeout(r, 600));
const server2 = spawn('node', ['dist/server/entry.mjs'], { cwd: root, env: { ...process.env, PORT: String(PORT), HOST: '127.0.0.1', FORM_MODE: 'outbox', NODE_ENV: 'production', TRUST_PROXY: '1' }, stdio: 'ignore' });
for (let i = 0; i < 50; i++) { try { await fetch(base + '/'); break; } catch { await new Promise((r) => setTimeout(r, 200)); } }
rmSync(resolve(root, '.data'), { recursive: true, force: true });

const browser = await launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
const page = await ctx.newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message)); page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.goto(base + '/#contact'); await page.waitForTimeout(2500);
await page.getByRole('button', { name: 'Rifiuta' }).click().catch(() => {});

// 1) invio vuoto → riepilogo errori, focus sul riepilogo, nessuna richiesta di rete
let posts = 0; page.on('request', (rq) => rq.url().endsWith('/api/inquiry') && posts++);
await page.locator('[data-submit]').click();
ok('invio vuoto: appare il riepilogo errori', await page.locator('[data-summary]').isVisible());
ok('invio vuoto: nessuna richiesta di rete', posts === 0);
ok('invio vuoto: errori inline su nome ed email', (await page.locator('#e-name').innerText()).length > 0 && (await page.locator('#e-email').innerText()).length > 0);
ok('campo invalido marcato aria-invalid', (await page.locator('#f-name').getAttribute('aria-invalid')) === 'true');
ok('il focus va al riepilogo errori', await page.evaluate(() => document.activeElement?.hasAttribute('data-summary')));

// 2) email errata
await page.fill('#f-name', 'Giulia Bianchi'); await page.fill('#f-email', 'giulia@');
await page.locator('#f-email').blur();
ok('email errata: messaggio inline', (await page.locator('#e-email').innerText()).includes('email'));

// 3) compilazione corretta
await page.fill('#f-email', 'giulia@example.com'); await page.fill('#f-phone', '+39 347 0000000');
await page.locator('.seg__opt', { hasText: 'Cromo' }).click();
await page.selectOption('#f-type', 'nuovo'); await page.selectOption('#f-size', 'medio'); await page.selectOption('#f-area', 'schiena');
await page.fill('#f-message', 'Vorrei un soggetto botanico in stile fine line sulla schiena, ti allego due riferimenti.');
ok('contatore caratteri aggiornato', Number(await page.locator('[data-count]').innerText()) > 30);
// allegati: 2 buoni
const tmp = resolve(root, '.data'); import('node:fs').then(() => {});
const { writeFileSync, mkdirSync } = await import('node:fs'); mkdirSync(tmp, { recursive: true });
writeFileSync(resolve(tmp, 'a.png'), PNG); writeFileSync(resolve(tmp, 'b.png'), PNG); writeFileSync(resolve(tmp, 'note.pdf'), 'x');
await page.setInputFiles('#f-files', [resolve(tmp, 'a.png'), resolve(tmp, 'b.png')]);
ok('2 anteprime allegati mostrate', (await page.locator('.fchip').count()) === 2);
await page.locator('.fchip__x').first().click();
ok('rimozione di un allegato', (await page.locator('.fchip').count()) === 1);
await page.setInputFiles('#f-files', [resolve(tmp, 'note.pdf')]);
ok('PDF rifiutato lato client con messaggio', (await page.locator('#e-files').innerText()).includes('formato non supportato'));
await page.locator('.fchip__x').last().click().catch(() => {});

// 4) senza consenso → bloccato
await page.locator('[data-submit]').click();
ok('senza consenso privacy: invio bloccato', (await page.locator('#e-consent').innerText()).length > 0 && posts === 0);
await page.locator('.check').click();

// 5) invio reale (attende >2,5 s dal caricamento, già trascorsi)
const [resp] = await Promise.all([page.waitForResponse((x) => x.url().endsWith('/api/inquiry')), page.locator('[data-submit]').click()]);
ok('invio reale: HTTP 200', resp.status() === 200, String(resp.status()));
await page.waitForSelector('[data-done]:not([hidden])', { timeout: 5000 }).catch(() => {});
ok('schermata di conferma mostrata', await page.locator('[data-done]').isVisible());
ok('conferma personalizzata col nome', /giulia/i.test(await page.locator('[data-done]').innerText()));
ok('modulo nascosto dopo l’invio', !(await page.locator('[data-form]').isVisible()));
const saved = existsSync(out) ? readdirSync(out) : [];
ok('richiesta del browser salvata lato server', saved.length === 1, `salvate ${saved.length}`);
if (saved.length) {
  const f = readdirSync(resolve(out, saved[0]));
  ok('allegato del browser ricevuto', f.includes('riferimento-1.png'), f.join(','));
  const j = JSON.parse(readFileSync(resolve(out, saved[0], 'inquiry.json'), 'utf8'));
  ok('artista "cromo" e zona "schiena" ricevuti', j.artist === 'cromo' && j.area === 'schiena');
}
ok('nessun errore JS in console', errors.length === 0, errors.join(' | '));
await page.getByRole('button', { name: /Invia un.altra richiesta/ }).click();
ok('“Invia un’altra richiesta” riapre il modulo', await page.locator('[data-form]').isVisible());

// 6) preselezione artista dalla sezione Artists
await page.goto(base + '/?artista=sink#contact'); await page.waitForTimeout(1500);
ok('?artista=sink preseleziona Sink', await page.locator('input[name=artist][value=sink]').isChecked());

// 7) errore di rete → messaggio con alternative
await page.route('**/api/inquiry', (route) => route.abort());
await page.fill('#f-name', 'Test Rete'); await page.fill('#f-email', 't@example.com');
await page.locator('.seg__opt', { hasText: 'Nessuna' }).click();
await page.selectOption('#f-type', 'nuovo'); await page.selectOption('#f-size', 'piccolo'); await page.selectOption('#f-area', 'altro');
await page.fill('#f-message', 'Prova di errore di rete, almeno dieci caratteri.'); await page.locator('.check').click();
await page.locator('[data-submit]').click(); await page.waitForTimeout(800);
ok('errore di rete: banner con alternative', (await page.locator('[data-error]').isVisible()) && (await page.locator('[data-error]').innerText()).includes('Instagram'));
ok('dopo l’errore il pulsante torna attivo', await page.locator('[data-submit]').isEnabled());

await browser.close(); server2.kill();
rmSync(resolve(root, '.data'), { recursive: true, force: true });
console.log(`\n${fail === 0 ? '✅' : '❌'} ${pass} superati, ${fail} falliti`);
process.exit(fail ? 1 : 0);
