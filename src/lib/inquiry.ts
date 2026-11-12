/**
 * Validazione della richiesta di appuntamento — CONDIVISA tra browser e server.
 * Il server ripete sempre gli stessi controlli: il client serve solo per il feedback immediato.
 */
import { site } from '../config/site';

export const ARTIST_OPTIONS = [
  { value: 'sink', label: 'Sink' },
  { value: 'cromo', label: 'Cromo' },
  { value: 'indifferente', label: 'Nessuna preferenza' },
] as const;

export const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'] as const;
export const ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'] as const;

export interface InquiryInput {
  name: string;
  email: string;
  phone: string;
  artist: string;
  type: string;
  size: string;
  area: string;
  message: string;
  consent: string;
}

export type FieldErrors = Partial<Record<keyof InquiryInput | 'files', string>>;

const oneOf = (list: ReadonlyArray<{ value: string }>, v: string) => list.some((o) => o.value === v);
const label = (list: ReadonlyArray<{ value: string; label: string }>, v: string) => list.find((o) => o.value === v)?.label ?? v;
export const labels = {
  artist: (v: string) => label(ARTIST_OPTIONS, v),
  type: (v: string) => label(site.form.types, v),
  size: (v: string) => label(site.form.sizes, v),
  area: (v: string) => label(site.form.bodyAreas, v),
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalize(raw: Record<string, unknown>): InquiryInput {
  const s = (k: string) => (typeof raw[k] === 'string' ? (raw[k] as string).trim() : '');
  return {
    name: s('name').replace(/\s+/g, ' '),
    email: s('email').toLowerCase(),
    phone: s('phone'),
    artist: s('artist'),
    type: s('type'),
    size: s('size'),
    area: s('area'),
    message: s('message'),
    consent: s('consent'),
  };
}

export function validateInquiry(i: InquiryInput): FieldErrors {
  const e: FieldErrors = {};
  if (i.name.length < 2) e.name = 'Inserisci il tuo nome.';
  else if (i.name.length > 80) e.name = 'Il nome è troppo lungo (massimo 80 caratteri).';

  if (!i.email) e.email = 'Inserisci la tua email.';
  else if (!EMAIL.test(i.email) || i.email.length > 160) e.email = 'Controlla l’indirizzo email: sembra non valido.';

  if (i.phone) {
    const digits = i.phone.replace(/\D/g, '');
    if (!/^\+?[\d\s().-]{6,24}$/.test(i.phone) || digits.length < 6 || digits.length > 15) e.phone = 'Numero non valido: usa solo cifre, spazi e prefisso (es. +39 333 1234567).';
  }
  if (!oneOf(ARTIST_OPTIONS, i.artist)) e.artist = 'Scegli un artista oppure “Nessuna preferenza”.';
  if (!oneOf(site.form.types, i.type)) e.type = 'Seleziona il tipo di tatuaggio.';
  if (!oneOf(site.form.sizes, i.size)) e.size = 'Seleziona una dimensione indicativa.';
  if (!oneOf(site.form.bodyAreas, i.area)) e.area = 'Seleziona la zona del corpo.';

  if (i.message.length < 10) e.message = 'Racconta l’idea in almeno 10 caratteri.';
  else if (i.message.length > site.form.maxMessageLength) e.message = `Il testo è troppo lungo (massimo ${site.form.maxMessageLength} caratteri).`;

  if (i.consent !== 'on' && i.consent !== 'true') e.consent = 'Per inviare la richiesta devi accettare l’informativa privacy.';
  return e;
}

export interface FileLike {
  name: string;
  size: number;
  type: string;
}

export function validateFiles(files: FileLike[]): string | undefined {
  const max = site.form.maxFileMB * 1024 * 1024;
  if (files.length > site.form.maxFiles) return `Puoi allegare al massimo ${site.form.maxFiles} immagini.`;
  for (const f of files) {
    const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
    const okType = (ALLOWED_MIME as readonly string[]).includes(f.type) || (!f.type && (ALLOWED_EXT as readonly string[]).includes(ext));
    if (!okType || !(ALLOWED_EXT as readonly string[]).includes(ext)) return `“${f.name}”: formato non supportato. Usa JPG, PNG, WebP o HEIC.`;
    if (f.size > max) return `“${f.name}”: supera ${site.form.maxFileMB} MB.`;
    if (f.size === 0) return `“${f.name}”: file vuoto.`;
  }
  return undefined;
}

/** Controlla la firma binaria (magic bytes): non ci si fida dell'estensione dichiarata. */
export function sniffImage(buf: Uint8Array): 'jpeg' | 'png' | 'webp' | 'heic' | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpeg';
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'png';
  const ascii = (a: number, b: number) => String.fromCharCode(...buf.slice(a, b));
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'webp';
  if (ascii(4, 8) === 'ftyp' && /^(heic|heix|hevc|hevx|heim|heis|mif1|msf1)/.test(ascii(8, 12))) return 'heic';
  return null;
}
