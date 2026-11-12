# KIMERA TATTOO — Premium Digital Experience

Sito dello studio **Kimera Tattoo** (artisti: **Sink** · **Cromo**).
Direzione artistica **"Ink & Ash"**: dark editorial / brutalist premium, catalogo d'arte analogico — tavole numerate,
crocini di registro, grana di pellicola, tipografia oversized (Archivo variabile *wdth* + Instrument Serif + JetBrains Mono),
nero profondo, bianco sporco, grigi metallici.

> **Stato dei contenuti.** Instagram, Google e GitHub non erano raggiungibili dall'ambiente di sviluppo (policy di rete),
> quindi **logo, fotografie e dati dello studio non sono stati visti né usati**. Nulla è stato inventato e nessuna immagine
> di terzi è stata inserita: dove mancano foto il sito mostra *tavole segnaposto dichiarate* con il percorso esatto del file da
> aggiungere. Esegui `npm run content:check` per la lista di ciò che manca prima del lancio.

## Stack

| Strato | Scelta | Perché |
|---|---|---|
| Framework | **Astro 7** (pagine statiche + 1 endpoint server) | HTML pre-renderizzato, JS minimo, ottimizzazione immagini integrata |
| Animazione | **GSAP + ScrollTrigger (+ Flip)**, **Lenis** (solo mouse) | pin orizzontale, scrub, filtri animati; scroll fluido |
| Immagini | `astro:assets` → AVIF + WebP + fallback JPG, srcset, lazy | archivio "drop-in" senza configurazione |
| Font | Self-hosted (`@fontsource`) | nessuna chiamata a Google Fonts (GDPR), `font-display: swap`, preload |
| Modulo | `POST /api/inquiry` (Node adapter) + **nodemailer** | validazione reale, allegati, anti-spam |

Nessun framework UI e nessuna libreria di componenti: componenti `.astro` riutilizzabili e uno script per sezione, caricato solo se la sezione esiste.

## Avvio

```bash
nvm use            # Node 22
npm install
cp .env.example .env
npm run dev        # http://localhost:4321  (il modulo salva le richieste in .data/inquiries)
npm run build && npm start     # produzione (server Node)
```

## Struttura

```
src/
  components/   Header · Hero · Manifesto · HorizontalShowcase · AliveStory · Artists · Portfolio(+Lightbox)
                Studio · Faq · Contact(+ContactForm) · Footer · CookieBanner  + primitive (Photo, Plate, Split, Marks, Seal…)
  scripts/      main.ts (orchestratore) · hero · showcase · alive · artists · portfolio · lightbox · studio · form · consent · analytics …
  config/       site.ts (TUTTI i dati reali dello studio)  ·  artists.ts
  data/         works.ts (scoperta automatica foto) · works.meta.ts · media.ts · copy.ts (testi) · faq.ts
  lib/          inquiry.ts (validazione condivisa client/server) · mail.ts · ratelimit.ts
  pages/        index · privacy · terms · cookie-policy · 404 · robots.txt · sitemap.xml · api/inquiry
  assets/       ← QUI VANNO LE FOTO ORIGINALI (vedi src/assets/README.md)
scripts/        test-form · test-ui · audit · check-links · check-content · generate-brand-assets
deploy/         esempio nginx (compressione, cache, header di sicurezza)
```

## Come aggiungere le fotografie (zero configurazione)

1. Copia le foto in `src/assets/works/sink/` e `src/assets/works/cromo/` come `01.jpg`, `02.jpg`…
2. Ritratti in `src/assets/artists/sink.jpg` · `cromo.jpg`; ambienti in `src/assets/studio/01.jpg…`; logo in `src/assets/brand/logo.svg`.
3. `npm run assets:brand` rigenera favicon / icone / immagine Open Graph usando il logo.

Il sito rileva orientamento e proporzioni, alterna composizioni diverse nella slideshow (verticale / orizzontale / dettaglio macro / schermo intero),
costruisce la masonry del portfolio e la lightbox. Per titoli, testi alternativi descrittivi, punto d'interesse e opere "in evidenza" usa `src/data/works.meta.ts`.

## Configurazione (`.env.example`)

* `SITE_URL` — dominio definitivo (canonical, sitemap, Open Graph). Finché manca viene usato un segnaposto `kimeratattoo.example`.
* `PUBLIC_WHATSAPP_NUMBER`, `PUBLIC_CONTACT_EMAIL`, `PUBLIC_CONTACT_PHONE` — se mancano, i blocchi relativi si adattano (il pulsante WhatsApp ripiega su Instagram DM).
* `PUBLIC_GA_MEASUREMENT_ID` **o** `PUBLIC_PLAUSIBLE_DOMAIN` — analytics, caricati **solo dopo il consenso** (Consent Mode v2 negato di default).
* `SMTP_*`, `INQUIRY_TO`, `INQUIRY_FROM` — invio reale delle richieste. `FORM_MODE=outbox` salva su disco (sviluppo/test). Senza nessuno dei due, in produzione il modulo risponde 503 e rimanda a Instagram.
* `TRUST_PROXY=1` dietro reverse proxy (rate limit per IP reale).
* Dati legali (titolare, P.IVA, sede, email privacy) e orari/indirizzo: `src/config/site.ts` — lasciati `null` finché non verificati.

## Deploy

`Dockerfile` pronto (build args per le variabili pubbliche, segreti SMTP a runtime). Il server Node serve file statici **senza compressione né header di
sicurezza**: mettilo dietro nginx/Caddy/Cloudflare (`deploy/nginx.conf.example`). Con gzip/brotli il bundle JS (141 KB grezzo) scende a ~45 KB.

## Checklist richiesta — dove e come è verificata

| Punto | Stato | Dove / come |
|---|---|---|
| Privacy policy | ✔ bozza completa (GDPR art. 13) | `/privacy/` — da completare con i dati del titolare e far rivedere a un legale |
| Terms page | ✔ bozza | `/terms/` |
| Cookie policy + **cookie consent** | ✔ | banner Rifiuta / Personalizza / Accetta con pari evidenza, riapribile dal footer, scadenza 6 mesi; nessuna richiesta a terzi prima del consenso (test UI) |
| Clear CTA | ✔ | Hero (2), header "Prenota", fine slideshow, ogni artista, portfolio, lightbox, footer, Contact |
| FAQ | ✔ 7 risposte prudenti (nessuna regola di studio inventata) + JSON-LD `FAQPage` | `src/data/faq.ts` |
| robots.txt · sitemap.xml | ✔ | `/robots.txt`, `/sitemap.xml` (escludono `/api/` e la 404) |
| Custom 404 | ✔ | `src/pages/404.astro`, verificata con status 404 |
| Alt text | ✔ | alt su ogni immagine reale (default descrittivo, sostituibile in `works.meta.ts`); segnaposto decorativi `aria-hidden` |
| Analytics | ✔ predisposto, **serve l'ID** | GA4 o Plausible, solo con consenso; eventi CTA/form/lightbox via `data-track` |
| Meta title / description | ✔ per pagina | verificate da `npm run test:audit` (lunghezze comprese) |
| Social share | ✔ Open Graph + Twitter Card | `public/og-default.jpg` 1200×630 (tipografica, provvisoria) |
| Favicon | ✔ | `favicon.svg`/`.ico`, apple-touch, icone 192/512, `site.webmanifest` (monogramma provvisorio → logo) |
| Canonical URIs | ✔ | per pagina, da `SITE_URL` |
| Mobile version | ✔ composizione dedicata | hero, slideshow a swipe con scroll-snap (nessun blocco dello scroll), artisti a tap, alive semplificata |
| Accessibility | ✔ | axe-core 0 violazioni (WCAG 2.2 AA + best practice) su 5 pagine × 3 viewport; skip-link, landmark, focus trap, dialog nativo, `prefers-reduced-motion`, tastiera ovunque |
| Test forms | ✔ 47 test | `npm run test:form` |
| Broken links | ✔ | `npm run test:links` (236 riferimenti interni/risorse). I 6 link esterni sono elencati; non verificabili dall'ambiente di sviluppo |
| Performance | ✔ | Lighthouse (server grezzo, senza compressione): desktop **96/100/100/100**, mobile **83/100/100/100** (perf/a11y/best-practices/SEO) |

## Test

```bash
npm run build
npm run test:links      # link interni, ancore, risorse
npm run test:form       # 47 controlli: validazione server, anti-bot, rate limit, allegati, flusso reale nel browser
node scripts/test-ui.mjs # 55 controlli: menu, slideshow pinned, artisti, filtri, lightbox, FAQ, cookie, 404, SEO files
npm run test:audit      # axe + SEO + overflow + console su desktop/tablet/mobile
npm run check           # type-check Astro/TypeScript
```
I test browser usano Playwright (`npm i -D playwright && npx playwright install chromium` se non presente).

## Motion design (sintesi)

* **Intro**: schermo scuro → logo emerge → sipario che sale → immagine rivelata da maschera `clip-path` con scala/parallasse → titolo per parole → elementi secondari in sequenza. Una sola volta per sessione.
* **Slideshow**: sezione pinned, scroll verticale → scorrimento orizzontale; maschere, parallasse interna, numeri giganti a velocità diversa, zoom progressivo sui dettagli macro, contatore e barra di avanzamento. Su mobile: swipe nativo con snap.
* **Alive**: tre atti guidati dallo scroll (opera → dettaglio → frammento che esce dalla cornice), **lente ×2.4** al passaggio del mouse (stessa foto, mai deformata), luce, polvere in sospensione.
* **Artisti**: hover (desktop) / tap (mobile) / frecce (tastiera) → transizione cinematografica tra i ritratti.
* **Portfolio**: masonry, filtri animati con GSAP Flip, hover controllato, lightbox a schermo intero (tastiera, swipe, preload dei vicini).
* **Footer**: wordmark KIMERA che sale lettera per lettera.
* `prefers-reduced-motion`: nessuna animazione, slideshow come scroller orizzontale nativo, tutto leggibile e navigabile.

## Da completare prima del lancio

Logo e foto originali · ritratti · numero WhatsApp / email / indirizzo / orari (solo se verificati) · dati legali e revisione di privacy/termini/FAQ ·
descrizioni degli artisti · colore d'accento dal logo (`--accent` in `src/styles/global.css`) · `SITE_URL` · SMTP · ID analytics · eventuale versione inglese.
