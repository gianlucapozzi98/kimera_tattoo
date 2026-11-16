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

/*
 * Foto originali dai profili Instagram dello studio e degli artisti (novembre 2026).
 * Titoli = didascalie scritte dagli artisti nei post; fonti in src/assets/FONTI.md.
 */
export const workMeta: Record<string, WorkMeta> = {
  // — Sink (@sink_tatt00)
  'sink/01.jpg': { title: 'Back cover up', alt: 'Schiena maschile con un grande blackwork dark ornamental a forma di ali, fotografata davanti al logo Kimera', focal: [0.5, 0.35] },
  'sink/02.jpg': { title: 'Non dormire', alt: 'Dark lettering in nero pieno su fianco e schiena, vista laterale', focal: [0.45, 0.4] },
  'sink/03.jpg': { title: 'Dark ornamental forearm', alt: 'Avambraccio con forme dark ornamental nere e una mezzaluna', focal: [0.5, 0.3] },
  'sink/04.jpg': { title: 'Gothic back', alt: 'Schiena femminile interamente tatuata con architetture gotiche e un rosone alla base del collo', focal: [0.55, 0.28] },
  'sink/05.jpg': { title: 'Fluid dark shapes', alt: 'Schiena maschile con forme nere fluide che scendono dalle spalle', focal: [0.5, 0.35] },
  'sink/06.jpg': { title: 'Dark Shinigami', alt: 'Avambraccio con il volto di uno shinigami in black and grey, realizzato in una seduta', focal: [0.5, 0.45] },
  // — Cromo (@cromo_ink)
  'cromo/01.jpg': { title: 'Medusa & Negative Dark Ornamental', alt: 'Polpaccio con il volto di Medusa e serpenti in black and grey, con ornamenti in negativo', focal: [0.5, 0.3] },
  'cromo/02.jpg': { title: 'Ornamentale floreale', alt: 'Schiena femminile con un ornamentale floreale simmetrico dalle spalle alle scapole', focal: [0.5, 0.35] },
  'cromo/03.jpg': { title: 'Double Leg Ornamental Dark & Flower', alt: 'Retro di entrambe le gambe con fiori e ornamenti dark in nero', focal: [0.35, 0.35] },
  'cromo/04.jpg': { title: 'Infernum', alt: 'Backpiece con teschio, ossa e capra in blackwork', focal: [0.5, 0.45] },
  'cromo/05.jpg': { title: 'Bat Dark Tattoo', alt: 'Pipistrello ad ali spiegate con luna, tatuato sul petto', focal: [0.5, 0.35] },
  'cromo/06.jpg': { title: 'Ornamental Dark Head', alt: 'Ornamentale dark sul lato della testa rasata, fino al collo', focal: [0.4, 0.4] },
};
