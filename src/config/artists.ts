/**
 * I due artisti di Kimera Tattoo.
 *
 * Nome e profilo Instagram sono quelli forniti dal cliente.
 * `bio` è volutamente neutra: NON contiene stili, specializzazioni, premi o
 * esperienze, perché non sono stati forniti. Sostituiscila con il testo reale
 * quando disponibile.
 */
export type ArtistId = 'sink' | 'cromo';

export interface Artist {
  id: ArtistId;
  name: string;
  /** Nome in maiuscolo mostrato in tipografia oversized. */
  display: string;
  handle: string;
  instagram: string;
  /** Testo modificabile. */
  bio: string;
  /** Breve etichetta editoriale (es. "Artista 01"). */
  role: string;
}

export const artists: Record<ArtistId, Artist> = {
  sink: {
    id: 'sink',
    name: 'Sink',
    display: 'SINK',
    handle: 'sink_tatt00',
    instagram: 'https://www.instagram.com/sink_tatt00/',
    role: 'Artista 01',
    bio: 'Una delle due firme di Kimera Tattoo. Qui sotto trovi una selezione dei suoi lavori; il racconto completo sta nel suo profilo Instagram. (Testo modificabile in src/config/artists.ts)',
  },
  cromo: {
    id: 'cromo',
    name: 'Cromo',
    display: 'CROMO',
    handle: 'cromo_ink',
    instagram: 'https://www.instagram.com/cromo_ink/',
    role: 'Artista 02',
    bio: 'La seconda firma di Kimera Tattoo. Qui sotto trovi una selezione dei suoi lavori; il racconto completo sta nel suo profilo Instagram. (Testo modificabile in src/config/artists.ts)',
  },
};

export const artistList: Artist[] = [artists.sink, artists.cromo];
