# Archivio fotografico di Kimera Tattoo

Qui si inseriscono le **fotografie originali**. Nessun'altra configurazione: il sito rileva i file,
genera AVIF/WebP responsive, calcola le proporzioni e li dispone in slideshow, portfolio e lightbox.

| Cartella | Contenuto | Nome file |
|---|---|---|
| `brand/` | Logo ufficiale | `logo.svg` (meglio) / `logo.png` |
| `hero/` | Immagine d'impatto della Hero (facoltativa) | `hero.jpg` |
| `artists/` | Ritratti | `sink.jpg`, `cromo.jpg` |
| `works/sink/` | Lavori di Sink | `01.jpg`, `02.jpg`, … |
| `works/cromo/` | Lavori di Cromo | `01.jpg`, `02.jpg`, … |
| `studio/` | Ambienti dello studio | `01.jpg`, `02.jpg`, `03.jpg` |

* Formati: JPG, PNG, WebP, AVIF. Lato lungo consigliato **≥ 2400 px** (zoom e lightbox).
* Verticali, orizzontali, quadrate: il layout si adatta da solo. Alterna formati diversi per un ritmo migliore.
* Per titoli, testo alternativo, punto d'interesse del dettaglio macro o per scegliere quali opere finiscono
  nella slideshow: `src/data/works.meta.ts`.
* **Non usare** immagini di altri tatuatori né foto non autorizzate.
* Finché una cartella è vuota il sito mostra "tavole" segnaposto dichiarate (con il percorso esatto del file da inserire).
