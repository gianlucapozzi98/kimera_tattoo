/**
 * TESTI EDITORIALI — modificabili.
 *
 * Regola: nessuna affermazione fattuale sullo studio, sugli artisti, sulle
 * tecniche o sulle esperienze (non sono state fornite). Solo voce di brand,
 * aforismi e indicazioni d'uso del sito. Sostituisci liberamente con testi reali.
 */

export const nav = [
  { label: 'Home', href: '#home', id: 'home' },
  { label: 'The Artists', href: '#artists', id: 'artists' },
  { label: 'Portfolio', href: '#portfolio', id: 'portfolio' },
  { label: 'The Studio', href: '#studio', id: 'studio' },
  { label: 'Contact', href: '#contact', id: 'contact' },
] as const;

export const hero = {
  lines: ['Your skin.', 'Your story.', 'Our art.'],
  sub: 'Pelle, storia, segno. Kimera Tattoo è lo studio di Sink e Cromo.',
};

export const manifesto = {
  text: 'Una *pelle* è l’unica tela che non si archivia: si porta addosso, per sempre. Per questo il *segno* va scelto con cura, disegnato con rispetto e inciso senza compromessi.',
  definition: {
    term: 'kimera',
    phon: 'ki·mè·ra',
    pos: 's.f.',
    body: 'dal greco Χίμαιρα — creatura mitologica composta da parti diverse, fuse in un solo corpo.',
  },
};

/** Frasi editoriali che accompagnano le opere nella slideshow quando non c'è una `caption` dedicata. */
export const showcaseLines = [
  'Ogni pelle è un archivio. Qui si scrive una volta sola.',
  'Il segno non chiede permesso: resta.',
  'Dettaglio — dove l’inchiostro incontra la pelle.',
  'Una storia, un corpo, una sola occasione per farla bene.',
  'Il vuoto conta quanto il segno.',
  'Dettaglio — la distanza giusta per guardare davvero.',
  'Ciò che resta, quando tutto il resto passa.',
];

export const alive = {
  kicker: 'Tattoo art that comes alive',
  title: ['L’OPERA', 'OLTRE', 'LA CORNICE'],
  acts: [
    { n: 'I', t: 'L’opera', d: 'La fotografia originale, senza filtri né ritocchi.' },
    { n: 'II', t: 'Il dettaglio', d: 'Ci si avvicina: ogni linea ha la sua ragione.' },
    { n: 'III', t: 'Oltre il bordo', d: 'Un frammento esce dalla cornice. L’opera non cambia: cambia lo sguardo.' },
  ],
  hint: 'Passa il mouse sull’opera per esplorarne i dettagli',
  hintTouch: 'Trascina il dito sull’opera per esplorarne i dettagli',
};

export const studio = {
  kicker: 'The Studio',
  title: ['UNO SPAZIO.', 'UN’IDENTITÀ.'],
  intro:
    'Il racconto di Kimera passa anche dai suoi ambienti. Le fotografie reali dello studio verranno inserite qui, per far sentire l’atmosfera prima ancora di entrare.',
  pillars: [
    { n: '01', t: 'Atmosfera', d: 'Un luogo ha un carattere. Il tatuaggio comincia già da come ci si sente entrando.' },
    { n: '02', t: 'Cura', d: 'Negli spazi, nei dettagli, nel modo di accogliere: la cura è parte del lavoro.' },
    { n: '03', t: 'Esperienza', d: 'Dalla prima richiesta all’ultima seduta, un percorso pensato attorno a chi lo vive.' },
    { n: '04', t: 'Identità', d: 'Due artisti, due firme riconoscibili, un solo studio.' },
  ],
};

export const contact = {
  title: ['LET’S CREATE', 'SOMETHING', 'PERMANENT.'],
  lead: 'Hai un’idea, un riferimento, una pelle da raccontare? Scrivici: più dettagli ci dai, più la risposta sarà precisa.',
  steps: [
    { n: '01', t: 'Racconta l’idea', d: 'Descrivi cosa vorresti, anche solo a parole.' },
    { n: '02', t: 'Aggiungi i dettagli', d: 'Zona del corpo, dimensione indicativa e immagini di riferimento.' },
    { n: '03', t: 'Scegli l’artista', d: 'Sink, Cromo, oppure lascia la scelta allo studio.' },
  ],
};
