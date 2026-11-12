/**
 * KIMERA TATTOO — configurazione centrale del sito.
 *
 * Qui vive OGNI dato reale dello studio. Regola del progetto:
 * ciò che non è stato verificato resta `null` / vuoto — il sito si adatta
 * (nasconde il blocco o mostra un'alternativa) e `npm run content:check`
 * elenca cosa manca. Nulla viene inventato.
 *
 * I valori PUBLIC_* si impostano in `.env` (vedi .env.example).
 */

const env = import.meta.env;
const clean = (v: unknown): string | null => {
  const s = typeof v === 'string' ? v.trim() : '';
  return s ? s : null;
};

const digits = (v: string | null) => (v ? v.replace(/[^\d]/g, '') : null);

export const site = {
  name: 'Kimera Tattoo',
  shortName: 'Kimera',
  lang: 'it',
  locale: 'it_IT',
  /** URL pubblico (impostato da SITE_URL in build). */
  url: (env.SITE as string | undefined)?.replace(/\/$/, '') ?? 'https://kimeratattoo.example',
  /** True finché SITE_URL non è stato impostato: canonical/sitemap usano un segnaposto. */
  urlIsPlaceholder: (env.SITE as string | undefined)?.includes('kimeratattoo.example') ?? true,

  tagline: 'Your skin. Your story. Our art.',
  description:
    'Kimera Tattoo: studio di tatuaggi con due artisti, Sink e Cromo. Sfoglia i lavori, scegli l’artista e richiedi un appuntamento.',

  /** Link forniti dal cliente. */
  social: {
    instagram: {
      handle: 'kimeratattooshop',
      url: 'https://www.instagram.com/kimeratattooshop/',
      dm: 'https://ig.me/m/kimeratattooshop',
    },
  },
  /** Scheda Google dello studio (link fornito dal cliente). */
  google: {
    url: 'https://share.google/bWunjJj3uGW4HWz5r',
  },

  /** Contatti: null = non verificato → il blocco viene omesso. */
  contact: {
    whatsapp: digits(clean(env.PUBLIC_WHATSAPP_NUMBER)),
    email: clean(env.PUBLIC_CONTACT_EMAIL),
    phone: clean(env.PUBLIC_CONTACT_PHONE),
    /** Indirizzo: compilare SOLO quando verificato. */
    address: null as null | { street: string; zip: string; city: string; province?: string; country?: string },
    /** Orari: compilare SOLO quando verificati. */
    hours: null as null | string[],
  },

  /**
   * Dati del titolare del trattamento (Privacy / Termini).
   * Compilare con i dati reali: finché sono null le pagine legali mostrano
   * un segnaposto ben visibile.
   */
  legal: {
    companyName: null as string | null,
    vatNumber: null as string | null,
    fiscalCode: null as string | null,
    registeredOffice: null as string | null,
    privacyEmail: null as string | null,
    pec: null as string | null,
    /** Mesi di conservazione delle richieste ricevute dal modulo (da confermare con lo studio). */
    inquiryRetentionMonths: 12,
    lastUpdate: '12 novembre 2026',
  },

  analytics: {
    ga4: clean(env.PUBLIC_GA_MEASUREMENT_ID),
    plausibleDomain: clean(env.PUBLIC_PLAUSIBLE_DOMAIN),
  },

  /** Opzioni del modulo richiesta (modificabili senza toccare il codice). */
  form: {
    maxFiles: 5,
    maxFileMB: 8,
    maxMessageLength: 2000,
    types: [
      { value: 'nuovo', label: 'Nuovo tatuaggio' },
      { value: 'continuazione', label: 'Continuazione / integrazione di un lavoro esistente' },
      { value: 'ritocco', label: 'Ritocco' },
      { value: 'copertura', label: 'Copertura di un tatuaggio esistente' },
      { value: 'non-so', label: 'Non lo so ancora: voglio un consiglio' },
    ],
    sizes: [
      { value: 'piccolo', label: 'Piccolo (fino a ~10 cm)' },
      { value: 'medio', label: 'Medio (~10–20 cm)' },
      { value: 'grande', label: 'Grande (~20–40 cm)' },
      { value: 'progetto', label: 'Progetto esteso / più sedute' },
      { value: 'non-so', label: 'Non so ancora' },
    ],
    bodyAreas: [
      { value: 'braccio', label: 'Braccio' },
      { value: 'avambraccio', label: 'Avambraccio' },
      { value: 'spalla', label: 'Spalla' },
      { value: 'schiena', label: 'Schiena' },
      { value: 'torace', label: 'Torace' },
      { value: 'addome', label: 'Addome / fianco' },
      { value: 'gamba', label: 'Coscia / gamba' },
      { value: 'polpaccio-caviglia', label: 'Polpaccio / caviglia' },
      { value: 'mano-piede', label: 'Mano / piede' },
      { value: 'collo-testa', label: 'Collo / testa' },
      { value: 'altro', label: 'Altro / da definire' },
    ],
  },
} as const;

export type Site = typeof site;

/** Link WhatsApp precompilato, oppure null se il numero non è stato configurato. */
export function whatsappHref(text = 'Ciao Kimera Tattoo, vorrei richiedere un appuntamento.'): string | null {
  const n = site.contact.whatsapp;
  return n ? `https://wa.me/${n}?text=${encodeURIComponent(text)}` : null;
}

/** Elenco di ciò che manca prima del lancio (usato da `npm run content:check`). */
export function missingConfig(): string[] {
  const out: string[] = [];
  if (site.urlIsPlaceholder) out.push('SITE_URL non impostata (canonical, sitemap, Open Graph usano un segnaposto)');
  if (!site.contact.whatsapp) out.push('PUBLIC_WHATSAPP_NUMBER non impostato (il pulsante WhatsApp ripiega su Instagram DM)');
  if (!site.contact.email) out.push('PUBLIC_CONTACT_EMAIL non impostata');
  if (!site.contact.address) out.push('Indirizzo dello studio non verificato (site.contact.address)');
  if (!site.contact.hours) out.push('Orari non verificati (site.contact.hours)');
  if (!site.analytics.ga4 && !site.analytics.plausibleDomain) out.push('Analytics: imposta PUBLIC_GA_MEASUREMENT_ID o PUBLIC_PLAUSIBLE_DOMAIN');
  const l = site.legal;
  if (!l.companyName) out.push('Legale: ragione sociale / titolare mancante');
  if (!l.vatNumber) out.push('Legale: partita IVA mancante');
  if (!l.registeredOffice) out.push('Legale: sede legale mancante');
  if (!l.privacyEmail) out.push('Legale: email per richieste privacy mancante');
  return out;
}
