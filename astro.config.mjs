import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

export default defineConfig({
  site: process.env.SITE_URL || 'https://kimeratattoo.example',
  output: 'static',
  // bodySizeLimit: 5 allegati da 8 MB + campi del modulo (vedi src/config/site.ts → form)
  adapter: node({ mode: 'standalone', bodySizeLimit: 46 * 1024 * 1024 }),
  security: { checkOrigin: false },
});
