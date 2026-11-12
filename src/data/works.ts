/**
 * ARCHIVIO OPERE — scoperta automatica delle fotografie.
 *
 * Le foto vivono in  src/assets/works/<artista>/<nn>.<ext>.
 * Quando la cartella è vuota il sito NON usa immagini di repertorio o di altri
 * tatuatori: genera "plate" segnaposto dichiarati (data-placeholder), con
 * il percorso esatto in cui inserire la foto originale.
 */
import type { ImageMetadata } from 'astro';
import { artists, type ArtistId } from '../config/artists';
import { workMeta } from './works.meta';

export type Orientation = 'portrait' | 'landscape' | 'square';

export interface Work {
  id: string;
  artist: ArtistId;
  artistName: string;
  /** Numero progressivo globale (1-based) nell'ordine di portfolio. */
  n: number;
  image?: ImageMetadata;
  ratio: number;
  orientation: Orientation;
  alt: string;
  title?: string;
  caption?: string;
  focal: { x: number; y: number };
  showcase: boolean;
  alive: boolean;
  hero: boolean;
  placeholder: boolean;
  /** Percorso suggerito per la foto reale (solo segnaposto). */
  slot?: string;
}

const collator = new Intl.Collator('it', { numeric: true });

const files = import.meta.glob<ImageMetadata>(
  '/src/assets/works/*/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP,AVIF}',
  { eager: true, import: 'default' },
);

export const orientationOf = (ratio: number): Orientation =>
  ratio < 0.88 ? 'portrait' : ratio > 1.15 ? 'landscape' : 'square';

function interleave<T>(a: T[], b: T[]): T[] {
  const out: T[] = [];
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i]) out.push(a[i]);
    if (b[i]) out.push(b[i]);
  }
  return out;
}

type Raw = { key: string; artist: ArtistId; file: string; image: ImageMetadata };

function discover(): Raw[] {
  const raws: Raw[] = [];
  for (const [path, image] of Object.entries(files)) {
    const m = path.match(/\/works\/([^/]+)\/([^/]+)$/);
    if (!m) continue;
    const artist = m[1].toLowerCase() as ArtistId;
    if (!(artist in artists)) continue; // cartelle non riconosciute vengono ignorate
    raws.push({ key: `${artist}/${m[2]}`, artist, file: m[2], image });
  }
  const sink = raws.filter((r) => r.artist === 'sink').sort((a, b) => collator.compare(a.file, b.file));
  const cromo = raws.filter((r) => r.artist === 'cromo').sort((a, b) => collator.compare(a.file, b.file));
  const merged = interleave(sink, cromo);
  // ordinamento manuale opzionale
  return merged
    .map((r, i) => ({ r, i, o: workMeta[r.key]?.order }))
    .sort((a, b) => (a.o ?? 1e6 + a.i) - (b.o ?? 1e6 + b.i))
    .map((x) => x.r);
}

/** Proporzioni dei segnaposto: alternano verticale / orizzontale / quadrato per mostrare il layout. */
const PLACEHOLDER_PLAN: Array<{ artist: ArtistId; ratio: number }> = [
  { artist: 'sink', ratio: 0.78 },
  { artist: 'cromo', ratio: 1.45 },
  { artist: 'sink', ratio: 0.8 },
  { artist: 'cromo', ratio: 1.0 },
  { artist: 'sink', ratio: 1.33 },
  { artist: 'cromo', ratio: 0.72 },
  { artist: 'sink', ratio: 0.85 },
  { artist: 'cromo', ratio: 1.25 },
  { artist: 'cromo', ratio: 0.8 },
];

function build(): { works: Work[]; real: boolean } {
  const raws = discover();
  if (raws.length) {
    const works = raws.map((r, i): Work => {
      const meta = workMeta[r.key] ?? {};
      const ratio = r.image.width / r.image.height;
      const n = i + 1;
      const a = artists[r.artist];
      return {
        id: `${r.artist}-${r.file.replace(/\.[^.]+$/, '')}`,
        artist: r.artist,
        artistName: a.name,
        n,
        image: r.image,
        ratio,
        orientation: orientationOf(ratio),
        alt: meta.alt ?? `Tatuaggio di ${a.name} — Kimera Tattoo, opera ${String(n).padStart(2, '0')}`,
        title: meta.title,
        caption: meta.caption,
        focal: { x: meta.focal?.[0] ?? 0.5, y: meta.focal?.[1] ?? 0.5 },
        showcase: !!meta.showcase,
        alive: !!meta.alive,
        hero: !!meta.hero,
        placeholder: false,
      };
    });
    return { works, real: true };
  }
  const counters: Record<ArtistId, number> = { sink: 0, cromo: 0 };
  const works = PLACEHOLDER_PLAN.map((p, i): Work => {
    counters[p.artist] += 1;
    const nn = String(counters[p.artist]).padStart(2, '0');
    const a = artists[p.artist];
    return {
      id: `${p.artist}-ph-${nn}`,
      artist: p.artist,
      artistName: a.name,
      n: i + 1,
      ratio: p.ratio,
      orientation: orientationOf(p.ratio),
      alt: '',
      focal: { x: 0.5, y: 0.5 },
      showcase: false,
      alive: false,
      hero: false,
      placeholder: true,
      slot: `src/assets/works/${p.artist}/${nn}.jpg`,
    };
  });
  return { works, real: false };
}

const built = build();

/** True quando esiste almeno una fotografia reale caricata dal cliente. */
export const hasRealWorks = built.real;
export const works: Work[] = built.works;
export const worksByArtist = (id: ArtistId) => works.filter((w) => w.artist === id);

/** Opere per la slideshow orizzontale (max 7): marcate `showcase`, altrimenti le prime alternate per artista. */
export function showcaseWorks(max = 7): Work[] {
  const flagged = works.filter((w) => w.showcase);
  const base = flagged.length ? flagged : works;
  return base.slice(0, max);
}

/** Opera protagonista della sezione "alive": marcata `alive`, altrimenti la prima verticale della slideshow. */
export function aliveWork(): Work {
  const flagged = works.find((w) => w.alive);
  if (flagged) return flagged;
  const show = showcaseWorks();
  return show.find((w) => w.orientation === 'portrait') ?? show[0] ?? works[0];
}

/** Opere in evidenza di un artista (es. per il pannello Artists). */
export const selectionFor = (id: ArtistId, max = 3): Work[] => worksByArtist(id).slice(0, max);
