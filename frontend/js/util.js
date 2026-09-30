export const $ = id => document.getElementById(id);
export const qa = (s, r = document) => [...r.querySelectorAll(s)];
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const sleep = ms => new Promise(r => setTimeout(r, ms));

let tt;
export function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 1800); }
export async function copy(text) { try { await navigator.clipboard.writeText(text); return true; } catch { return false; } }

const ICONS = {
  home: '<path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
  comm: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  analyze: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  reply: '<polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/>',
  repair: '<polyline points="23 4 23 10 17 10"/><path d="M20.5 15a9 9 0 1 1-2.1-9.4L23 10"/>',
  practice: '<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.5 8.5 0 0 1-3.8-.9L3 21l2-5.2A8.4 8.4 0 1 1 21 11.5z"/>',
  learn: '<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/>',
  guide: '<circle cx="12" cy="12" r="10"/><polygon points="16.2 7.8 14.1 14.1 7.8 16.2 9.9 9.9"/>',
  library: '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
  history: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  insights: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
  settings: '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>',
  toolkit: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z"/>',
  get: '<path d="M12 3v12"/><polyline points="7 10 12 15 17 10"/><path d="M5 21h14"/>',
  more: '<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>',
  out: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>'
};
export const ic = n => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`;

/* chip group: single or multi select, optional deselect */
export function chips(el, options, { value, multi = false, none = false, onChange } = {}) {
  let val = multi ? new Set(value || []) : (value ?? null);
  const draw = () => { el.innerHTML = options.map(o => { const [v, l] = Array.isArray(o) ? o : [o, o]; const on = multi ? val.has(v) : val === v; return `<button type="button" class="chip" data-v="${esc(v)}" aria-pressed="${on}">${esc(l)}</button>`; }).join(''); };
  draw();
  el.onclick = e => {
    const b = e.target.closest('.chip'); if (!b) return; const v = b.dataset.v;
    if (multi) { val.has(v) ? val.delete(v) : val.add(v); } else val = (none && val === v) ? null : v;
    draw(); onChange?.(multi ? [...val] : val);
  };
  return { get: () => (multi ? [...val] : val), set: v => { val = multi ? new Set(v || []) : (v ?? null); draw(); } };
}

export const PN = { judgment: 'judgment', blame: 'blame', absolute: 'absolute language', demand: 'demand', vague_request: 'unclear request', sarcasm: 'possible sarcasm', threat: 'safety-sensitive language' };
export const PWHY = {
  judgment: 'A judgment describes what someone is, not what happened.',
  blame: 'Blame hands the cause of your feeling to the other person.',
  absolute: 'Words like always and never turn one moment into a verdict.',
  demand: 'A demand leaves no room for a real no.',
  vague_request: 'A vague request is hard to say yes to. Try one specific, doable thing.',
  sarcasm: 'Sarcasm can hide the real feeling underneath.',
  threat: 'This wording may relate to safety.'
};
export const pn = k => PN[k] || String(k || '').replace('_', ' ');

export function ago(d) {
  if (!d) return '';
  const s = (Date.now() - d.getTime()) / 1000;
  if (s < 90) return 'just now'; if (s < 3600) return Math.round(s / 60) + ' min ago'; if (s < 86400) return Math.round(s / 3600) + ' h ago';
  if (s < 604800) return Math.round(s / 86400) + ' d ago';
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}
export const greeting = () => { const h = new Date().getHours(); return h < 5 ? 'Still up' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : h < 22 ? 'Good evening' : 'Late night'; };
export const dayMs = 86400000;
export const emptyState = (title, text, btn, act) => `<div class="empty"><h3>${esc(title)}</h3><p>${esc(text)}</p>${btn ? `<button class="btn pri" data-act="${esc(act)}">${esc(btn)}</button>` : ''}</div>`;

/* Calm safety interruption (guide #48): coaching is separate from crisis support */
export const safetyBlock = note => `<div class="calm" role="alert"><h3>Let's pause before rewriting this.</h3>
<p>${esc(note || 'This message contains language that may relate to immediate safety. SAYWELL will not rewrite it into a stronger or more actionable message.')}</p>
<p class="muted">SAYWELL is a communication coach. It is not mental-health or crisis support. If you or someone else might be in danger, please reach a person now:</p>
<ul><li>In India: Tele-MANAS, 14416 (free, 24×7) or 1-800-891-4416. Emergency services: 112.</li><li>Elsewhere: local emergency services, or findahelpline.com to find a line in your country.</li><li>If you can, tell someone near you what is going on.</li></ul></div>`;

/* Library tags: derived when a rewrite is saved, used by the Library filters */
export function tagsFor(text, ctx, intent) {
  const t = [];
  if (intent === 'Set a boundary' || intent === 'Say no' || /\b(boundary|not comfortable|i won't|i will not|i need (some )?(time|space)|nahi karunga|nahi karungi)\b/i.test(text)) t.push('Boundaries');
  const map = { Partner: 'Relationship', Relationship: 'Relationship', Friend: 'Friends', Family: 'Family', College: 'College', Work: 'Work' };
  if (map[ctx]) t.push(map[ctx]);
  return t;
}
