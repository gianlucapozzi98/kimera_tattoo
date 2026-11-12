import { gsap, canAnimate } from './gsap';
import { normalize, validateInquiry, validateFiles, type FieldErrors } from '../lib/inquiry';
import { site } from '../config/site';

const fieldCtl: Record<string, string> = {
  name: '#f-name',
  email: '#f-email',
  phone: '#f-phone',
  artist: 'input[name=artist]',
  type: '#f-type',
  size: '#f-size',
  area: '#f-area',
  message: '#f-message',
  files: '#f-files',
  consent: 'input[name=consent]',
};
const fieldLabel: Record<string, string> = {
  name: 'Nome',
  email: 'Email',
  phone: 'Telefono',
  artist: 'Artista desiderato',
  type: 'Tipologia',
  size: 'Dimensione indicativa',
  area: 'Zona del corpo',
  message: 'La tua idea',
  files: 'Immagini di riferimento',
  consent: 'Privacy',
};

const track = (name: string, params: Record<string, unknown> = {}) => window.dispatchEvent(new CustomEvent('kimera:track', { detail: { name, params } }));

export function initForm() {
  const form = document.querySelector<HTMLFormElement>('[data-form]');
  if (!form) return;
  const $ = <T extends HTMLElement>(s: string) => form.querySelector<T>(s)!;
  const root = form.closest<HTMLElement>('.request')!;
  const done = root.querySelector<HTMLElement>('[data-done]')!;
  const summary = $<HTMLElement>('[data-summary]');
  const summaryList = $<HTMLElement>('[data-summary-list]');
  const submit = $<HTMLButtonElement>('[data-submit]');
  const submitLabel = $<HTMLElement>('[data-submit-label]');
  const bar = $<HTMLElement>('[data-bar]');
  const status = $<HTMLElement>('[data-status]');
  const errBox = $<HTMLElement>('[data-error]');
  const errText = $<HTMLElement>('[data-error-text]');
  const ts = $<HTMLInputElement>('[data-ts]');
  const counter = $<HTMLElement>('[data-count]');
  const msg = $<HTMLTextAreaElement>('#f-message');
  const fileInput = $<HTMLInputElement>('[data-files-input]');
  const drop = $<HTMLElement>('[data-drop]');
  const list = $<HTMLElement>('[data-file-list]');

  ts.value = String(Date.now());
  let files: File[] = [];
  let sending = false;

  // ── contatore messaggio ──
  const upd = () => (counter.textContent = String(msg.value.length));
  msg.addEventListener('input', upd);
  upd();

  // ── allegati ──
  const key = (f: File) => `${f.name}|${f.size}|${f.lastModified}`;
  const renderFiles = () => {
    list.querySelectorAll<HTMLImageElement>('img').forEach((i) => URL.revokeObjectURL(i.src));
    list.innerHTML = '';
    files.forEach((f, i) => {
      const li = document.createElement('li');
      li.className = 'fchip';
      const th = document.createElement('span');
      th.className = 'fchip__th mono';
      if (/^image\/(jpeg|png|webp)$/.test(f.type)) {
        const im = document.createElement('img');
        im.alt = '';
        im.src = URL.createObjectURL(f);
        th.appendChild(im);
      } else th.textContent = f.name.split('.').pop()?.toUpperCase() ?? 'IMG';
      const n = document.createElement('span');
      n.className = 'fchip__n';
      n.textContent = f.name;
      n.title = f.name;
      const x = document.createElement('button');
      x.type = 'button';
      x.className = 'fchip__x';
      x.setAttribute('aria-label', `Rimuovi ${f.name}`);
      x.textContent = '✕';
      x.addEventListener('click', () => {
        files.splice(i, 1);
        renderFiles();
        setFieldError('files', validateFiles(files));
        fileInput.focus();
      });
      li.append(th, n, x);
      list.appendChild(li);
    });
  };
  const addFiles = (incoming: File[]) => {
    const seen = new Set(files.map(key));
    for (const f of incoming) if (!seen.has(key(f))) files.push(f);
    const err = validateFiles(files);
    if (err && files.length > site.form.maxFiles) files = files.slice(0, site.form.maxFiles);
    renderFiles();
    setFieldError('files', err);
    fileInput.value = '';
  };
  fileInput.addEventListener('change', () => addFiles([...(fileInput.files ?? [])]));
  ['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => (e.preventDefault(), drop.classList.add('is-over'))));
  ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => (e.preventDefault(), drop.classList.remove('is-over'))));
  drop.addEventListener('drop', (e) => addFiles([...((e as DragEvent).dataTransfer?.files ?? [])]));

  // ── errori ──
  const fieldEl = (k: string) => form.querySelector<HTMLElement>(`[data-field="${k}"]`);
  function setFieldError(k: string, msgText?: string) {
    const f = fieldEl(k);
    if (!f) return;
    f.classList.toggle('is-invalid', !!msgText);
    f.querySelector<HTMLElement>('[data-err]')!.textContent = msgText ?? '';
    f.querySelectorAll<HTMLElement>('input,select,textarea').forEach((c) => {
      if (msgText) c.setAttribute('aria-invalid', 'true');
      else c.removeAttribute('aria-invalid');
    });
  }
  const collect = () => {
    const fd = new FormData(form);
    const raw: Record<string, unknown> = {};
    for (const k of ['name', 'email', 'phone', 'artist', 'type', 'size', 'area', 'message']) raw[k] = fd.get(k);
    raw.consent = (form.elements.namedItem('consent') as HTMLInputElement).checked ? 'on' : '';
    return normalize(raw);
  };
  const validateAll = (): FieldErrors => {
    const e = validateInquiry(collect());
    const fe = validateFiles(files);
    if (fe) e.files = fe;
    return e;
  };
  const showErrors = (errors: FieldErrors, focus = true) => {
    Object.keys(fieldCtl).forEach((k) => setFieldError(k, (errors as Record<string, string>)[k]));
    const keys = Object.keys(errors);
    summary.hidden = keys.length === 0;
    summaryList.innerHTML = '';
    keys.forEach((k) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = fieldCtl[k] ?? '#';
      a.textContent = `${fieldLabel[k] ?? k}: ${(errors as Record<string, string>)[k]}`;
      a.addEventListener('click', (e) => {
        e.preventDefault();
        form.querySelector<HTMLElement>(fieldCtl[k])?.focus();
      });
      li.appendChild(a);
      summaryList.appendChild(li);
    });
    if (keys.length && focus) {
      summary.focus();
      summary.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
  };

  // validazione "dolce": al blur del campo e quando si corregge un errore
  const touched = new Set<string>();
  form.addEventListener('focusout', (e) => {
    const f = (e.target as Element).closest<HTMLElement>('[data-field]');
    if (!f || f.dataset.field === 'files') return;
    touched.add(f.dataset.field!);
    const errs = validateAll() as Record<string, string>;
    setFieldError(f.dataset.field!, errs[f.dataset.field!]);
  });
  form.addEventListener('input', (e) => {
    const f = (e.target as Element).closest<HTMLElement>('[data-field]');
    if (!f || !f.classList.contains('is-invalid')) return;
    const errs = validateAll() as Record<string, string>;
    setFieldError(f.dataset.field!, errs[f.dataset.field!]);
  });
  form.addEventListener('change', (e) => {
    const f = (e.target as Element).closest<HTMLElement>('[data-field]');
    if (!f || !f.classList.contains('is-invalid')) return;
    const errs = validateAll() as Record<string, string>;
    setFieldError(f.dataset.field!, errs[f.dataset.field!]);
  });

  // ── invio (XHR per avere la barra di progresso sugli allegati) ──
  const setSending = (v: boolean, pct = 0) => {
    sending = v;
    submit.disabled = v;
    submit.setAttribute('aria-busy', String(v));
    submitLabel.textContent = v ? (pct > 0 && pct < 100 ? `Invio… ${pct}%` : 'Invio…') : 'Invia la richiesta';
    bar.style.transform = `scaleX(${v ? pct / 100 : 0})`;
    status.textContent = v ? 'Invio in corso, non chiudere la pagina.' : '';
  };

  const showError = (text: string) => {
    errText.textContent = text;
    errBox.hidden = false;
    errBox.scrollIntoView({ block: 'center', behavior: 'auto' });
  };

  const showDone = (name: string) => {
    form.hidden = true;
    done.hidden = false;
    done.querySelector('[data-done-name]')!.textContent = name ? `, ${name.split(' ')[0]}` : '';
    if (canAnimate()) gsap.fromTo(done.children, { opacity: 0, y: 24 }, { opacity: 1, y: 0, stagger: 0.1, duration: 0.9, ease: 'power3.out' });
    done.focus();
    done.scrollIntoView({ block: 'center', behavior: 'auto' });
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (sending) return;
    errBox.hidden = true;
    const errors = validateAll();
    if (Object.keys(errors).length) {
      showErrors(errors);
      track('form_error', { reason: 'client_validation', fields: Object.keys(errors).join(',') });
      return;
    }
    showErrors({}, false);

    const fd = new FormData();
    const data = collect();
    Object.entries(data).forEach(([k, v]) => fd.append(k, v));
    fd.append('website', (form.elements.namedItem('website') as HTMLInputElement).value);
    fd.append('ts', ts.value);
    files.forEach((f) => fd.append('files', f, f.name));

    const xhr = new XMLHttpRequest();
    xhr.open('POST', form.action);
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.upload.onprogress = (ev) => ev.lengthComputable && setSending(true, Math.round((ev.loaded / ev.total) * 100));
    xhr.onload = () => {
      setSending(false);
      let body: { ok?: boolean; message?: string; errors?: FieldErrors } = {};
      try {
        body = JSON.parse(xhr.responseText);
      } catch {}
      if (xhr.status >= 200 && xhr.status < 300 && body.ok) {
        track('form_submit', { artist: data.artist, type: data.type, files: files.length });
        showDone(data.name);
        form.reset();
        files = [];
        renderFiles();
        upd();
        ts.value = String(Date.now());
      } else if (xhr.status === 422 && body.errors) {
        showErrors(body.errors);
        track('form_error', { reason: 'server_validation' });
      } else {
        showError(body.message || 'Qualcosa non ha funzionato. Riprova tra poco.');
        track('form_error', { reason: `http_${xhr.status}` });
      }
    };
    xhr.onerror = xhr.ontimeout = () => {
      setSending(false);
      showError('Connessione assente o instabile. Controlla la rete e riprova.');
      track('form_error', { reason: 'network' });
    };
    xhr.timeout = 120_000;
    setSending(true, 1);
    xhr.send(fd);
  });

  root.querySelector('[data-again]')!.addEventListener('click', () => {
    done.hidden = true;
    form.hidden = false;
    form.querySelector<HTMLElement>('#f-name')?.focus();
  });

  // ── preselezione artista da altre sezioni ──
  const pick = (id?: string | null) => {
    if (!id) return;
    const r = form.querySelector<HTMLInputElement>(`input[name=artist][value="${id}"]`);
    if (r) {
      r.checked = true;
      setFieldError('artist');
    }
  };
  document.addEventListener('click', (e) => {
    const t = (e.target as Element).closest<HTMLElement>('[data-artist-pick]');
    if (t) pick(t.dataset.artistPick);
  });
  document.addEventListener('kimera:pick-artist', (e) => pick((e as CustomEvent<string>).detail));

  // ── parametri URL (anche per il fallback senza JS) ──
  const q = new URLSearchParams(location.search);
  pick(q.get('artista'));
  const state = q.get('inquiry');
  if (state === 'ok') showDone('');
  if (state === 'error') showError('Non siamo riusciti a inviare la richiesta. Controlla i dati e riprova.');
  if (state) history.replaceState(null, '', location.pathname + location.hash);
}
