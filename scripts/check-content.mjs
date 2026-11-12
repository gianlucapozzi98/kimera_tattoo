/**
 * LISTA DI CONTROLLO PRE-LANCIO — cosa manca ancora da fornire / configurare.
 *   npm run content:check
 * Non fallisce mai: serve a sapere a che punto è il sito.
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const img = /\.(jpe?g|png|webp|avif)$/i;
const list = (d) => (existsSync(resolve(root, d)) ? readdirSync(resolve(root, d)).filter((f) => img.test(f)) : []);
const envFile = existsSync(resolve(root, '.env')) ? Object.fromEntries(readFileSync(resolve(root, '.env'), 'utf8').split('\n').filter((l) => /^\w+=/.test(l)).map((l) => [l.split('=')[0], l.slice(l.indexOf('=') + 1).trim()])) : {};
const env = (k) => (process.env[k] || envFile[k] || '').trim();

const rows = [];
const add = (area, ok, what, how) => rows.push({ area, ok, what, how });

// Brand e foto
const logo = ['svg', 'png', 'webp', 'jpg'].some((e) => existsSync(resolve(root, `src/assets/brand/logo.${e}`)));
add('Brand', logo, 'Logo ufficiale', 'Salva il logo (foto profilo Instagram, meglio in SVG/PNG ad alta risoluzione) come src/assets/brand/logo.svg o logo.png, poi: npm run assets:brand');
const sink = list('src/assets/works/sink').length, cromo = list('src/assets/works/cromo').length;
add('Foto', sink >= 4, `Opere di Sink (${sink})`, 'Inserisci le foto originali in src/assets/works/sink/ (01.jpg, 02.jpg…) — consigliate ≥ 6');
add('Foto', cromo >= 4, `Opere di Cromo (${cromo})`, 'Inserisci le foto originali in src/assets/works/cromo/ (01.jpg, 02.jpg…) — consigliate ≥ 6');
add('Foto', list('src/assets/hero').length > 0 || sink + cromo > 0, 'Immagine Hero', 'Facoltativa: src/assets/hero/hero.jpg (altrimenti usa un’opera)');
add('Foto', ['sink', 'cromo'].every((a) => list('src/assets/artists').some((f) => f.startsWith(a + '.'))), 'Ritratti degli artisti', 'src/assets/artists/sink.jpg e cromo.jpg');
add('Foto', list('src/assets/studio').length >= 1, `Foto dello studio (${list('src/assets/studio').length})`, 'src/assets/studio/01.jpg, 02.jpg, 03.jpg — fotografie reali degli ambienti');

// Configurazione
const site = readFileSync(resolve(root, 'src/config/site.ts'), 'utf8');
add('Dominio', !!env('SITE_URL'), 'SITE_URL', 'Imposta l’URL definitivo (canonical, sitemap, Open Graph)');
add('Contatti', !!env('PUBLIC_WHATSAPP_NUMBER'), 'Numero WhatsApp', 'PUBLIC_WHATSAPP_NUMBER=39333… (senza + né spazi). Finché manca, il pulsante ripiega su Instagram DM');
add('Contatti', !!env('PUBLIC_CONTACT_EMAIL'), 'Email pubblica', 'PUBLIC_CONTACT_EMAIL');
add('Contatti', !/address: null/.test(site), 'Indirizzo dello studio', 'Compila site.contact.address in src/config/site.ts SOLO quando verificato');
add('Contatti', !/hours: null/.test(site), 'Orari di apertura', 'Compila site.contact.hours SOLO quando verificati');
add('Modulo', !!(env('SMTP_HOST') && env('INQUIRY_TO')), 'Invio email del modulo (SMTP)', 'SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, INQUIRY_TO, INQUIRY_FROM — senza, in produzione il modulo risponde 503 e rimanda a Instagram');
add('Analytics', !!(env('PUBLIC_GA_MEASUREMENT_ID') || env('PUBLIC_PLAUSIBLE_DOMAIN')), 'Analytics', 'PUBLIC_GA_MEASUREMENT_ID o PUBLIC_PLAUSIBLE_DOMAIN (partono solo dopo il consenso cookie)');
for (const [k, label] of [['companyName', 'Ragione sociale / titolare'], ['vatNumber', 'Partita IVA'], ['registeredOffice', 'Sede legale'], ['privacyEmail', 'Email per richieste privacy']]) {
  add('Legale', !new RegExp(`${k}:\\s*null`).test(site), label, `Compila legal.${k} in src/config/site.ts (Privacy e Termini mostrano un segnaposto finché manca)`);
}
const art = readFileSync(resolve(root, 'src/config/artists.ts'), 'utf8');
add('Testi', !/Testo modificabile in src\/config\/artists\.ts/.test(art), 'Descrizioni degli artisti', 'Sostituisci i testi neutri in src/config/artists.ts con quelli reali (senza inventare stili o premi)');
add('Brand', !readFileSync(resolve(root, 'src/styles/global.css'), 'utf8').includes('--accent: #c8361f;'), 'Colore d’accento dal logo', 'Aggiorna --accent (e --accent-text) in src/styles/global.css con il colore del logo originale');

const groups = [...new Set(rows.map((r) => r.area))];
let missing = 0;
for (const g of groups) {
  console.log(`\n${g}`);
  for (const r of rows.filter((x) => x.area === g)) {
    console.log(`  ${r.ok ? '✔' : '✘'} ${r.what}${r.ok ? '' : '\n      → ' + r.how}`);
    if (!r.ok) missing++;
  }
}
console.log(`\n${missing ? `⚠ ${missing} elementi da completare prima del lancio.` : '✅ Tutto pronto per il lancio.'}`);
