import type { APIRoute } from 'astro';
import { site } from '../config/site';

export const prerender = true;

export const GET: APIRoute = () =>
  new Response(
    ['User-agent: *', 'Allow: /', 'Disallow: /api/', '', `Sitemap: ${site.url}/sitemap.xml`, ''].join('\n'),
    { headers: { 'content-type': 'text/plain; charset=utf-8' } },
  );
