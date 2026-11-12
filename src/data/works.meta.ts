/**
 * METADATI OPZIONALI DELLE FOTO — quasi sempre NON serve toccare questo file.
 *
 * ARCHIVIO FOTO (zero configurazione):
 *   1. Metti la foto originale in  src/assets/works/sink/  oppure  src/assets/works/cromo/
 *      (JPG / PNG / WebP / AVIF; consigliato lato lungo ≥ 2000 px)
 *   2. Rinominala con un numero: 01.jpg, 02.jpg, 03.jpg …  (l'ordine segue il nome)
 *   3. Salva. Il sito rileva da solo artista, proporzioni e orientamento,
 *      genera AVIF/WebP responsive e le inserisce in slideshow, portfolio e lightbox.
 *
 * Se vuoi aggiungere dettagli a una foto, usa la sua chiave "cartella/file":
 *
 *   'sink/01.jpg': {
 *     title: 'Titolo opera',                 // facoltativo
 *     alt: 'Descrizione per screen reader',  // CONSIGLIATO: descrivi ciò che si vede
 *     caption: 'Breve testo editoriale',     // sostituisce la frase di default nella slideshow
 *     focal: [0.5, 0.4],                     // punto d'interesse (x, y da 0 a 1) per zoom e dettagli macro
 *     showcase: true,                        // forza la presenza nella slideshow orizzontale
 *     alive: true,                           // opera usata nella sezione "Tattoo art that comes alive"
 *     hero: true,                            // opera usata come immagine della Hero (se non c'è src/assets/hero/)
 *     order: 1,                              // posizione manuale (numeri più bassi per primi)
 *   },
 *
 * Non descrivere né dichiarare stili o tecniche che non siano verificati.
 */
export interface WorkMeta {
  title?: string;
  alt?: string;
  caption?: string;
  focal?: [number, number];
  showcase?: boolean;
  alive?: boolean;
  hero?: boolean;
  order?: number;
}

export const workMeta: Record<string, WorkMeta> = {
  // 'sink/01.jpg': { alt: '…', showcase: true },
};
