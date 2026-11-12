import type { APIRoute } from 'astro';
import { site } from '../../config/site';
import { normalize, validateInquiry, validateFiles, sniffImage, type FieldErrors } from '../../lib/inquiry';
import { deliver, deliveryMode, type Attachment } from '../../lib/mail';
import { rateLimit } from '../../lib/ratelimit';

export const prerender = false;

const MAX_BODY = (site.form.maxFiles * site.form.maxFileMB + 2) * 1024 * 1024;

const json = (status: number, body: Record<string, unknown>, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers } });

/** Browser senza JS: reindirizza invece di mostrare JSON. */
const back = (state: 'ok' | 'error') => new Response(null, { status: 303, headers: { location: `/?inquiry=${state}#contact`, 'cache-control': 'no-store' } });

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true; // client non-browser / no-JS legacy
  try {
    const o = new URL(origin);
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
    const siteHost = new URL(site.url).host;
    return o.host === host || o.host === siteHost || o.hostname === 'localhost' || o.hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const wantsJson = (request.headers.get('accept') || '').includes('application/json');
  const fail = (status: number, message: string, extra: Record<string, unknown> = {}) =>
    wantsJson ? json(status, { ok: false, message, ...extra }) : back('error');

  if (!sameOrigin(request)) return fail(403, 'Richiesta non consentita.');

  const len = Number(request.headers.get('content-length') || 0);
  if (len > MAX_BODY) return fail(413, `Gli allegati sono troppo pesanti (massimo ${site.form.maxFiles} immagini da ${site.form.maxFileMB} MB).`);

  const ip = (process.env.TRUST_PROXY === '1' ? request.headers.get('x-forwarded-for')?.split(',')[0].trim() : '') || clientAddress || 'unknown';
  // tetto generoso su TUTTE le richieste (anti-abuso/upload), tetto stretto sulle richieste valide (anti-spam)
  const burst = rateLimit(`all:${ip}`, 40, 15 * 60_000);
  if (!burst.ok) {
    const message = 'Troppe richieste in poco tempo. Riprova più tardi o scrivici su Instagram.';
    return wantsJson ? json(429, { ok: false, message }, { 'retry-after': String(burst.retryAfter) }) : back('error');
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail(400, 'Modulo non leggibile. Riprova.');
  }

  // anti-bot: honeypot + tempo minimo di compilazione (solo se il client JS lo ha inviato)
  const honeypot = String(form.get('website') || '');
  const ts = Number(form.get('ts') || 0);
  const tooFast = ts > 0 && Date.now() - ts < 2500;
  if (honeypot || tooFast) return wantsJson ? json(200, { ok: true, id: 'ok' }) : back('ok'); // finto successo: non aiutare i bot

  const raw: Record<string, unknown> = {};
  for (const k of ['name', 'email', 'phone', 'artist', 'type', 'size', 'area', 'message', 'consent']) raw[k] = form.get(k);
  const data = normalize(raw);
  const errors: FieldErrors = validateInquiry(data);

  const fileEntries = form.getAll('files').filter((f): f is File => typeof f !== 'string' && f.size > 0);
  const fileErr = validateFiles(fileEntries.map((f) => ({ name: f.name, size: f.size, type: f.type })));
  if (fileErr) errors.files = fileErr;

  if (Object.keys(errors).length) {
    return wantsJson ? json(422, { ok: false, message: 'Controlla i campi evidenziati.', errors }) : back('error');
  }

  // verifica firma binaria e prepara gli allegati con nomi sicuri
  const attachments: Attachment[] = [];
  for (const [idx, f] of fileEntries.entries()) {
    const buf = Buffer.from(await f.arrayBuffer());
    const kind = sniffImage(buf);
    if (!kind) return wantsJson ? json(422, { ok: false, message: 'Controlla i campi evidenziati.', errors: { files: `“${f.name}” non sembra un’immagine valida.` } }) : back('error');
    const ext = kind === 'jpeg' ? 'jpg' : kind;
    const mime = kind === 'jpeg' ? 'image/jpeg' : kind === 'png' ? 'image/png' : kind === 'webp' ? 'image/webp' : 'image/heic';
    attachments.push({ filename: `riferimento-${idx + 1}.${ext}`, content: buf, contentType: mime });
  }

  const rl = rateLimit(`ok:${ip}`, 5, 15 * 60_000);
  if (!rl.ok) {
    const message = 'Hai inviato troppe richieste in poco tempo. Riprova più tardi o scrivici su Instagram.';
    return wantsJson ? json(429, { ok: false, message }, { 'retry-after': String(rl.retryAfter) }) : back('error');
  }

  if (deliveryMode() === 'none') {
    console.error('[inquiry] Nessun metodo di consegna configurato (SMTP_HOST + INQUIRY_TO, oppure FORM_MODE=outbox).');
    return fail(503, 'Il modulo non è ancora attivo. Scrivici su Instagram o WhatsApp: ti rispondiamo volentieri.');
  }

  try {
    const { id } = await deliver(data, attachments, ip);
    return wantsJson ? json(200, { ok: true, id }) : back('ok');
  } catch (err) {
    console.error('[inquiry] invio fallito', err);
    return fail(502, 'Non siamo riusciti a inviare la richiesta. Riprova tra poco o scrivici su Instagram.');
  }
};

export const ALL: APIRoute = () => json(405, { ok: false, message: 'Metodo non consentito.' }, { allow: 'POST' });
