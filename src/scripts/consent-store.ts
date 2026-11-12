/** Archivio del consenso cookie (localStorage, con scadenza a 6 mesi). */
const KEY = 'kimera-consent-v1';
const MAX_AGE = 1000 * 60 * 60 * 24 * 180;

export interface Consent {
  v: 1;
  analytics: boolean;
  ts: number;
}

export function getConsent(): Consent | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as Consent;
    if (c.v !== 1 || Date.now() - c.ts > MAX_AGE) return null; // scaduto: va richiesto di nuovo
    return c;
  } catch {
    return null;
  }
}

export function setConsent(analytics: boolean): Consent {
  const c: Consent = { v: 1, analytics, ts: Date.now() };
  try {
    localStorage.setItem(KEY, JSON.stringify(c));
  } catch {
    /* modalità privata: il consenso vale per la sessione corrente */
  }
  window.dispatchEvent(new CustomEvent('kimera:consent', { detail: c }));
  return c;
}
