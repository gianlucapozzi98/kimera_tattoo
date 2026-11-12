// Carica Playwright: prima dal progetto, poi dall'installazione globale dell'ambiente.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let pw;
for (const p of ['playwright', 'playwright-core', '/opt/node22/lib/node_modules/playwright']) {
  try { pw = require(p); break; } catch {}
}
if (!pw) throw new Error('Playwright non trovato. Installa con: npm i -D playwright && npx playwright install chromium');
export const chromium = pw.chromium;
export const devices = pw.devices;
export const launch = (opts = {}) => {
  const exe = process.env.PW_CHROMIUM || (existsChromium());
  return chromium.launch({ headless: true, executablePath: exe || undefined, args: ['--no-sandbox'], ...opts });
};
import { existsSync } from 'node:fs';
function existsChromium() {
  return existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined;
}
