import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import vercel from '@astrojs/vercel';

// Su Vercel (variabile VERCEL impostata in automatico durante la build) usa l'adapter Vercel;
// altrove (Docker / VPS, vedi deploy/) resta il server Node standalone.
const onVercel = !!process.env.VERCEL;

export default defineConfig({
  site: process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'https://kimeratattoo.example'),
  output: 'static',
  // bodySizeLimit: 5 allegati da 8 MB + campi del modulo (vedi src/config/site.ts → form)
  adapter: onVercel ? vercel() : node({ mode: 'standalone', bodySizeLimit: 46 * 1024 * 1024 }),
  security: { checkOrigin: false },
});
