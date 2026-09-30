import { $, esc, qa, toast, copy, ago, emptyState, chips } from '../util.js';
import { S } from '../state.js';
import { listOf, patch, removeRef, addTo } from '../store.js';

/* ================= LIBRARY: things you chose to keep ================= */
const FILTERS = ['All', 'Boundaries', 'Relationship', 'Friends', 'Work', 'Family', 'College'];
let items = [], filt = 'All', q = '', fchips;

function drawLib() {
  const n = q.trim().toLowerCase();
  const list = items.filter(x => (filt === 'All' || (x.tags || []).includes(filt)) && (!n || (x.text + ' ' + (x.original || '')).toLowerCase().includes(n)));
  $('lib-list').innerHTML = !items.length ? emptyState('Save a rewrite and build your personal phrasebook.', 'Phrases you save from Analyze or Reply show up here, ready to copy the next time you need them.', 'Analyze something', 'analyze')
    : !list.length ? '<p class="muted" style="padding:20px 0">Nothing matches that. Try a different filter or search.</p>'
    : list.map(x => `<article class="item" data-id="${x.id}"><p class="txt">${esc(x.text)}</p><div class="meta">${[...(x.tags || []), x.approach].filter(Boolean).map(esc).join(' · ')}${x.tags?.length || x.approach ? ' · ' : ''}${ago(x.at)}</div>
      <div class="acts"><button class="btn ghost sm" data-a="copy">Copy</button><button class="btn ghost sm" data-a="edit">Edit</button><button class="btn ghost sm" data-a="del">Delete</button></div></article>`).join('');
}
export const library = {
  init(el) {
    el.innerHTML = `<div class="vh"><h1>My words</h1><p>Phrases you chose to keep, so the right sentence is one tap away.</p></div>
    <div class="tools"><input type="search" id="lib-q" placeholder="Search saved phrases…" aria-label="Search saved phrases"><div class="chips" id="lib-f"></div></div><div id="lib-list"></div>`;
    fchips = chips($('lib-f'), FILTERS, { value: 'All', onChange: v => { filt = v || 'All'; drawLib(); } });
    $('lib-q').oninput = e => { q = e.target.value; drawLib(); };
    $('lib-list').addEventListener('click', async e => {
      const b = e.target.closest('[data-a],[data-act]'); if (!b) return;
      if (b.dataset.act) { S.go(b.dataset.act); return; }
      const card = b.closest('.item'), it = items.find(x => x.id === card.dataset.id); if (!it) return;
      if (b.dataset.a === 'copy') copy(it.text).then(ok => { toast(ok ? 'Copied' : 'Copy failed'); });
      else if (b.dataset.a === 'del') { try { await removeRef(it.ref); items = items.filter(x => x !== it); drawLib(); toast('Removed'); } catch { toast('Could not remove. Try again.'); } }
      else if (b.dataset.a === 'edit') {
        const p = card.querySelector('.txt');
        if (p.tagName === 'P') { const t = document.createElement('textarea'); t.className = 'txt'; t.value = it.text; p.replaceWith(t); b.textContent = 'Save'; t.focus(); }
        else { const v = p.value.trim(); if (v) { try { await patch(it.ref, { text: v }); it.text = v; toast('Updated'); } catch { toast('Could not save the edit.'); } } drawLib(); }
      }
    });
  },
  async show() {
    try { items = await listOf('library', 200); } catch { $('lib-list').innerHTML = '<div class="err"><h3>Couldn\'t load your Library.</h3><p>Check your connection and open this page again.</p></div>'; return; }
    drawLib();
  }
};

/* ================= HISTORY: what you analyzed ================= */
let hist = [];
const drawHist = () => {
  $('his-list').innerHTML = !hist.length ? emptyState('Nothing here yet.', 'Your analyzed conversations appear here, on every device. Turn on "Don\'t save to history" to keep one out.', 'Analyze something', 'analyze')
    : hist.map(x => `<article class="item" data-id="${x.id}"><p>${esc(x.text.length > 160 ? x.text.slice(0, 158) + '…' : x.text)}</p><div class="meta">${ago(x.at)}${(x.result?.patterns || []).length ? ' · ' + [...new Set(x.result.patterns.map(p => p.type.replace('_', ' ')))].join(', ') : ''}</div>
      <div class="acts"><button class="btn ghost sm" data-a="open">Open</button><button class="btn ghost sm" data-a="del">Delete</button></div></article>`).join('');
};
export const history = {
  init(el) {
    el.innerHTML = `<div class="vh"><h1>History</h1><p>Things you analyzed. If you want to keep a phrase for reuse, save it to your Library.</p></div><div id="his-list"></div>`;
    $('his-list').addEventListener('click', async e => {
      const b = e.target.closest('[data-a],[data-act]'); if (!b) return;
      if (b.dataset.act) { S.go(b.dataset.act); return; }
      const it = hist.find(x => x.id === b.closest('.item').dataset.id); if (!it) return;
      if (b.dataset.a === 'open') S.go('analyze', { open: { text: it.text, result: it.result, settings: it.settings, chosen: it.chosen, ref: it.ref } });
      else if (b.dataset.a === 'del') { try { await removeRef(it.ref); hist = hist.filter(x => x !== it); drawHist(); toast('Deleted'); } catch { toast('Could not delete. Try again.'); } }
    });
  },
  async show() {
    try { hist = await listOf('analyses', 100); } catch { $('his-list').innerHTML = '<div class="err"><h3>Couldn\'t load your history.</h3><p>Check your connection and open this page again.</p></div>'; return; }
    drawHist();
  }
};
