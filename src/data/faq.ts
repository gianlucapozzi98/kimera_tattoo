/**
 * FAQ — bozza prudente, SENZA regole di studio inventate (prezzi, caparre,
 * età, cancellazioni…). Aggiungi qui le risposte ufficiali quando le avrai
 * dallo studio: il componente e il markup schema.org si aggiornano da soli.
 */
import { site } from '../config/site';

export interface Faq {
  q: string;
  /** Testo semplice (usato anche per il JSON-LD FAQPage). */
  a: string;
}

export const faqs: Faq[] = [
  {
    q: 'Come richiedo un appuntamento o un preventivo?',
    a: 'Compila il modulo nella sezione Contact descrivendo idea, zona del corpo e dimensione indicativa, oppure scrivici direttamente su WhatsApp o Instagram. Più dettagli e riferimenti invii, più precisa sarà la risposta dello studio.',
  },
  {
    q: 'Posso scegliere l’artista?',
    a: 'Sì. Nel modulo puoi indicare se preferisci Sink o Cromo, oppure lasciare la scelta allo studio. Per farti un’idea guarda le selezioni dei loro lavori e i profili Instagram.',
  },
  {
    q: 'Posso allegare immagini di riferimento?',
    a: `Sì, fino a ${site.form.maxFiles} immagini (JPG, PNG, WebP o HEIC, massimo ${site.form.maxFileMB} MB ciascuna). I riferimenti aiutano a capire composizione, dettagli e intenzione.`,
  },
  {
    q: 'Quanto costa un tatuaggio?',
    a: 'Dipende da più fattori: dimensione, zona del corpo, livello di dettaglio e tempo di lavoro. Invia la tua idea tramite il modulo e chiedi una valutazione all’artista.',
  },
  {
    q: 'Dove si trova lo studio e come vi contatto?',
    a: 'Posizione e informazioni aggiornate sono sulla scheda Google di Kimera Tattoo (link nella sezione Contact). Per disponibilità e orari scrivici tramite il modulo, WhatsApp o Instagram.',
  },
  {
    q: 'Dove posso vedere altri lavori?',
    a: 'Sul profilo Instagram dello studio (@kimeratattooshop) e su quelli dei due artisti: @sink_tatt00 e @cromo_ink.',
  },
  {
    q: 'Come vengono trattati i miei dati e le immagini che invio?',
    a: 'Solo per rispondere alla tua richiesta, come descritto nella Privacy Policy. Ti chiediamo di non inserire nel modulo dati relativi alla tua salute.',
  },
];
