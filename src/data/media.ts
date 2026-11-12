/**
 * ARCHIVIO MEDIA NON-OPERE: logo, hero, ritratti, foto dello studio.
 * Stessa filosofia di works.ts: i file vengono rilevati da soli, altrimenti
 * il sito mostra segnaposto dichiarati — mai immagini di altri.
 *
 *   src/assets/brand/logo.svg|png|webp      logo ufficiale (da foto profilo Instagram)
 *   src/assets/hero/hero.jpg                immagine d'impatto della Hero (facoltativa)
 *   src/assets/artists/sink.jpg             ritratto di Sink
 *   src/assets/artists/cromo.jpg            ritratto di Cromo
 *   src/assets/studio/01.jpg, 02.jpg …      fotografie reali dell'ambiente
 */
import type { ImageMetadata } from 'astro';
import type { ArtistId } from '../config/artists';
import { works, aliveWork, hasRealWorks } from './works';

const collator = new Intl.Collator('it', { numeric: true });

const logoFiles = import.meta.glob<ImageMetadata>('/src/assets/brand/logo.{svg,png,webp,jpg,jpeg}', { eager: true, import: 'default' });
const heroFiles = import.meta.glob<ImageMetadata>('/src/assets/hero/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP,AVIF}', { eager: true, import: 'default' });
const portraitFiles = import.meta.glob<ImageMetadata>('/src/assets/artists/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP,AVIF}', { eager: true, import: 'default' });
const studioFiles = import.meta.glob<ImageMetadata>('/src/assets/studio/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP,AVIF}', { eager: true, import: 'default' });

export const logo: ImageMetadata | undefined = Object.values(logoFiles)[0];

/** Immagine della Hero: file dedicato → opera marcata hero → opera "alive" → nessuna (segnaposto). */
export function heroImage(): { image?: ImageMetadata; alt: string; placeholder: boolean } {
  const dedicated = Object.entries(heroFiles).sort(([a], [b]) => collator.compare(a, b))[0];
  if (dedicated) return { image: dedicated[1], alt: 'Fotografia di un tatuaggio realizzato presso Kimera Tattoo', placeholder: false };
  if (hasRealWorks) {
    const flagged = works.find((w) => w.hero) ?? aliveWork();
    return { image: flagged.image, alt: flagged.alt, placeholder: false };
  }
  return { alt: '', placeholder: true };
}

export function portrait(id: ArtistId): { image?: ImageMetadata; alt: string; placeholder: boolean } {
  const hit = Object.entries(portraitFiles).find(([p]) => new RegExp(`/${id}\\.[^/]+$`, 'i').test(p));
  if (hit) return { image: hit[1], alt: `Ritratto di ${id === 'sink' ? 'Sink' : 'Cromo'}, tatuatore di Kimera Tattoo`, placeholder: false };
  return { alt: '', placeholder: true };
}

export interface StudioPhoto {
  image?: ImageMetadata;
  alt: string;
  placeholder: boolean;
  slot: string;
  ratio: number;
}

export function studioPhotos(): StudioPhoto[] {
  const entries = Object.entries(studioFiles).sort(([a], [b]) => collator.compare(a, b));
  if (entries.length) {
    return entries.map(([, image], i) => ({
      image,
      alt: `Ambiente dello studio Kimera Tattoo, fotografia ${i + 1}`,
      placeholder: false,
      slot: '',
      ratio: image.width / image.height,
    }));
  }
  return [
    { alt: '', placeholder: true, slot: 'src/assets/studio/01.jpg', ratio: 1.6 },
    { alt: '', placeholder: true, slot: 'src/assets/studio/02.jpg', ratio: 0.8 },
    { alt: '', placeholder: true, slot: 'src/assets/studio/03.jpg', ratio: 1.2 },
  ];
}
