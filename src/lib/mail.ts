import nodemailer from 'nodemailer';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { labels, type InquiryInput } from './inquiry';

export interface Attachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

export type DeliveryMode = 'smtp' | 'outbox' | 'none';

export function deliveryMode(): DeliveryMode {
  const env = process.env;
  if (env.FORM_MODE === 'outbox') return 'outbox';
  if (env.SMTP_HOST && env.INQUIRY_TO) return 'smtp';
  // in sviluppo (astro dev) senza SMTP si salva su disco, così il form è provabile subito
  if (process.env.NODE_ENV !== 'production' && !env.SMTP_HOST) return 'outbox';
  return 'none';
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const oneLine = (s: string) => s.replace(/[\r\n]+/g, ' ').trim();

function render(i: InquiryInput, meta: { id: string; ip: string; files: number }) {
  const rows: Array<[string, string]> = [
    ['Nome', i.name],
    ['Email', i.email],
    ['Telefono', i.phone || '—'],
    ['Artista desiderato', labels.artist(i.artist)],
    ['Tipologia', labels.type(i.type)],
    ['Dimensione indicativa', labels.size(i.size)],
    ['Zona del corpo', labels.area(i.area)],
    ['Immagini allegate', String(meta.files)],
  ];
  const text = [
    'Nuova richiesta di appuntamento dal sito Kimera Tattoo',
    '',
    ...rows.map(([k, v]) => `${k}: ${v}`),
    '',
    'Descrizione dell’idea:',
    i.message,
    '',
    `— ID richiesta ${meta.id}`,
  ].join('\n');
  const html = `<div style="font-family:Arial,sans-serif;max-width:640px;color:#111">
  <h2 style="margin:0 0 16px">Nuova richiesta di appuntamento</h2>
  <table style="border-collapse:collapse;width:100%">${rows
    .map(([k, v]) => `<tr><td style="padding:6px 12px 6px 0;color:#666;white-space:nowrap;vertical-align:top">${esc(k)}</td><td style="padding:6px 0"><b>${esc(v)}</b></td></tr>`)
    .join('')}</table>
  <h3 style="margin:24px 0 8px">Descrizione dell’idea</h3>
  <p style="white-space:pre-wrap;margin:0">${esc(i.message)}</p>
  <p style="color:#999;font-size:12px;margin-top:28px">ID ${esc(meta.id)} · rispondi direttamente a questa email per scrivere al cliente.</p></div>`;
  return { text, html };
}

export async function deliver(i: InquiryInput, files: Attachment[], ip: string): Promise<{ id: string; mode: DeliveryMode }> {
  const id = randomUUID().slice(0, 8);
  const mode = deliveryMode();
  const { text, html } = render(i, { id, ip, files: files.length });

  if (mode === 'smtp') {
    const env = process.env;
    const transport = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: Number(env.SMTP_PORT || 587),
      secure: env.SMTP_SECURE === 'true',
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    });
    await transport.sendMail({
      from: env.INQUIRY_FROM || env.SMTP_USER || env.INQUIRY_TO,
      to: env.INQUIRY_TO,
      replyTo: { name: oneLine(i.name), address: i.email },
      subject: `Nuova richiesta da ${oneLine(i.name)} — ${labels.artist(i.artist)}`,
      text,
      html,
      attachments: files.map((f) => ({ filename: f.filename, content: f.content, contentType: f.contentType })),
    });
  } else if (mode === 'outbox') {
    const dir = join(process.cwd(), '.data', 'inquiries', `${new Date().toISOString().replace(/[:.]/g, '-')}-${id}`);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, 'inquiry.json'), JSON.stringify({ id, receivedAt: new Date().toISOString(), ...i, files: files.map((f) => f.filename) }, null, 2));
    await writeFile(join(dir, 'email.txt'), text);
    for (const f of files) await writeFile(join(dir, f.filename), f.content);
  }
  return { id, mode };
}
