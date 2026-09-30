import { $, esc, qa, chips, toast, copy, safetyBlock, pn, PWHY, emptyState, tagsFor } from '../util.js';
import { post, classifyText } from '../api.js';
import { S } from '../state.js';
import { addTo, patch } from '../store.js';
import { EXAMPLES } from '../data.js';

const CTXS = ['Partner', 'Friend', 'Family', 'College', 'Work'];
const RELS = { Partner: ['Partner', 'Ex', 'Crush', 'Close friend'], Friend: ['Close friend', 'Roommate', 'Acquaintance'], Family: ['Parent', 'Sibling', 'Relative'], College: ['Classmate', 'Professor', 'Senior', 'Junior'], Work: ['Peer', 'Manager', 'Client', 'Direct report'] };
const TONES = ['Natural', 'Gentle', 'Direct', 'Warm', 'Firm'];
const INTENTS = ['Be understood', 'Set a boundary', 'Ask for something', 'Apologize', 'Give feedback', 'Reconnect', 'Say no'];
const LENGTHS = [['one_line', 'One line'], ['short', 'Short'], ['normal', 'Normal'], ['detailed', 'Detailed']];
const LANGS = [['auto', 'Auto-detect'], ['english', 'English'], ['hinglish', 'Hinglish']];
const NAMES = { minimal: 'Keep my voice', natural: 'Clearer', direct: 'Direct', nvc: 'NVC style' };
const PRESETS = [['keep_words', 'Keep my words'], ['clearer', 'Make clearer'], ['less_reactive', 'Less reactive'], ['confident', 'More confident'], ['shorter', 'Shorter'], ['human', 'More human']];
const STEPS = ['Reading the words', 'Looking for patterns', 'Finding what may be underneath', 'Preparing a few ways to say it'];

let ta, ctx, rel, tone, intent, len, lang, cur = null, busy = false, dim, drawer, preset, loadTimer;

/* older saved analyses stored rewrites as plain strings and had no notice/changes */
const norm = r => ({ ...r, rewrites: Object.fromEntries(Object.entries(r.rewrites || {}).map(([k, v]) => [k, typeof v === 'string' ? { text: v, why: '' } : v]).filter(([, v]) => v?.text)), changes: r.changes || [], notice: r.notice || { kind: 'none' } });
const settings = () => ({
  context: ctx.get() || 'Partner', relation: rel.get() || '', tone: tone.get() || 'Natural', intent: intent.get() || '', length: len.get() || 'normal', voice: +$('a-voice').value, language: lang.get() || 'auto',
  keepHinglish: $('a-kh').checked, keep: { boundary: $('a-kb').checked, emotion: $('a-ke').checked, meaning: $('a-km').checked }
});
export const scenarioFrom = (text, context) => `You need to say this to someone (${context || 'someone close'}): "${text.slice(0, 140)}"`;

function highlight(text, patterns) {
  const rs = [];
  (patterns || []).forEach((p, i) => { const k = p.phrase; if (!k) return; const at = text.indexOf(k); if (at < 0 || rs.some(r => at < r.e && at + k.length > r.s)) return; rs.push({ s: at, e: at + k.length, i }); });
  rs.sort((a, b) => a.s - b.s); let out = '', pos = 0;
  rs.forEach(r => { out += esc(text.slice(pos, r.s)) + `<mark tabindex="0" role="button" data-i="${r.i}" aria-label="Why this phrase">${esc(text.slice(r.s, r.e))}</mark>`; pos = r.e; });
  return out + esc(text.slice(pos));
}

function applyDefaults() {
  const p = S.prefs, t = p.tone === 'Assertive' ? 'Firm' : p.tone;
  ctx.set(CTXS.includes(p.context) ? p.context : (p.context === 'Relationship' ? 'Partner' : 'Partner')); tone.set(TONES.includes(t) ? t : 'Natural');
  lang.set(p.language || 'auto'); len.set(p.length || 'normal'); $('a-voice').value = p.voice ?? 35; $('a-kh').checked = !!p.keepHinglish; $('a-priv').checked = p.saveHistory === false;
  rel.set(null); drawRel();
}
const drawRel = () => { rel = chips($('a-rel'), RELS[ctx.get()] || [], { value: null, none: true }); };

function showLoading() {
  const out = $('a-out'); let i = 0;
  const draw = () => { out.innerHTML = `<div class="load" role="status" aria-live="polite">${STEPS.map((s, k) => `<div class="${k === i ? 'on' : k < i ? 'done' : ''}"><i></i>${s}</div>`).join('')}</div>`; };
  draw(); clearInterval(loadTimer); loadTimer = setInterval(() => { if (i < STEPS.length - 1) { i++; draw(); } }, 1500);
}
function showError(msg, retry) {
  clearInterval(loadTimer);
  $('a-out').innerHTML = `<div class="err" role="alert"><h3>Couldn't analyze that message.</h3><p>${esc(msg)} What you typed is still in the box.</p><div class="acts"><button class="btn pri sm" data-act="retry">Try again</button><button class="btn ghost sm" data-act="draft">Save draft locally</button></div></div>`;
  $('a-out').dataset.retry = retry || '';
}

async function run(extra = {}) {
  if (busy) return; const text = ta.value; if (text.trim().length < 3) { ta.focus(); return; }
  busy = true; $('a-go').disabled = true; showLoading();
  try {
    const s = settings(), r = norm(await post('/api/analyze', { text, ...s, ...extra }));
    clearInterval(loadTimer); cur = { text, result: r, settings: s, used: null, ref: null }; render();
    if (!r.safety?.flag && !$('a-priv').checked && S.prefs.saveHistory !== false) { try { cur.ref = await addTo('analyses', { text, result: r, settings: s }); } catch { /* history is best effort */ } }
    if (window.innerWidth < 1180) $('a-out').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (e) { showError(e.message); }
  busy = false; $('a-go').disabled = false;
}

function render() {
  const out = $('a-out'), { text, result: r } = cur;
  if (r.safety?.flag) { out.innerHTML = `<div class="res">${safetyBlock(r.safety.note)}</div>`; return; }
  const n = r.notice || {}, keys = ['minimal', 'natural', 'direct', 'nvc'].filter(k => r.rewrites[k]);
  const chipsOf = (a, c) => (a || []).map(x => `<span class="pill ${c}">${esc(x)}</span>`).join('') || '<span class="muted">Not enough to say. What do you think it is?</span>';
  const noticeHtml = n.kind && n.kind !== 'none' && n.text ? `<div class="note ${esc(n.kind)}"><p>${esc(n.text)}</p>${n.kind === 'manipulation' ? '<div><button class="btn ghost sm" data-act="reframe">Rewrite around what you actually need</button></div>' : ''}</div>` : '';
  const after = r.rewrites[cur.used || keys[0]]?.text || '';
  out.innerHTML = `<div class="res">${noticeHtml}
  <section class="sect"><h2>Your words</h2><p class="inl" id="a-inl">${highlight(text, r.patterns)}</p>${(r.patterns || []).length ? '<p class="hint">Tap an underlined phrase to see why.</p>' : '<p class="hint">No strong patterns noticed.</p>'}<div id="a-exp"></div></section>
  <section class="sect"><h2><span class="num">01</span>What happened</h2><p class="inl">${esc(r.observation) || '<span class="muted">Nothing clear yet.</span>'}</p></section>
  <section class="sect"><h2><span class="num">02</span>What may be underneath</h2><div class="und"><div><h3>Possible feelings</h3>${chipsOf(r.feelings, 'f')}</div><div><h3>Possible needs</h3>${chipsOf(r.needs, 'n')}</div></div>${r.protecting ? `<p class="prot">What you may be trying to protect: ${esc(r.protecting)}</p>` : ''}</section>
  <section class="sect"><h2><span class="num">03</span>What could you ask for?</h2><p class="ask">${esc(r.request) || '<span class="muted">Nothing specific yet.</span>'}</p></section>
  ${keys.length ? `<section class="sect"><div class="rwh"><h2 style="margin:0">Ways to say it</h2><button class="btn ghost sm" data-act="drawer">Rewrite controls</button></div><p class="orig">${esc(text)}</p>
    <div class="rwrow" id="a-rw">${keys.map(k => `<article class="rc ${cur.used === k ? 'used' : ''}" data-k="${k}"><h3>${NAMES[k]}</h3><p class="txt">${esc(r.rewrites[k].text)}</p>
      <div class="acts"><button class="btn ghost sm" data-act="copy">Copy</button><button class="btn ghost sm" data-act="save">Save</button><button class="btn ghost sm" data-act="edit">Edit</button><button class="btn pri sm" data-act="use">Use this version</button></div>
      <div><button class="lnk" data-act="prac">Practice saying it</button></div>
      ${r.rewrites[k].why ? `<details><summary>Why this changed</summary><p>${esc(r.rewrites[k].why)}</p></details>` : ''}</article>`).join('')}</div></section>
  <section class="sect"><h2>Before and after</h2><div class="ba2"><div><h3>Before</h3><p>${esc(text)}</p></div><div><h3>After</h3><p id="a-after">${esc(after)}</p></div>${r.changes.length ? `<div class="ch">${r.changes.map(c => `<span class="pill">${esc(c)}</span>`).join('')}</div>` : ''}</div></section>
  <div class="usebar"><button class="btn pri" data-act="usecur">Use this</button></div>` : '<p class="muted">No rewrites this time. Add a little more, or try a different goal.</p>'}</div>`;
  const row = $('a-rw'); if (row) row.onscroll = () => { const c = row.querySelector('.rc'); if (c) cur.idx = Math.round(row.scrollLeft / (c.offsetWidth + 12)); };
}

function useVersion(k) {
  const t = cur.result.rewrites[k]?.text; if (!t) return;
  copy(t); cur.used = k; qa('.rc', $('a-out')).forEach(c => c.classList.toggle('used', c.dataset.k === k)); $('a-after') && ($('a-after').textContent = t);
  toast('Copied. Ready to send.'); if (cur.ref) patch(cur.ref, { chosen: k }).catch(() => {});
}
async function applyControls() {
  if (!cur) return; const b = $('a-apply'); b.disabled = true;
  const sl = k => +$('a-s-' + k).value;
  try {
    const r = await post('/api/rewrite', { text: cur.text, ...settings(), preset: preset.get() || '', sliders: { warm: sl('warm'), direct: sl('direct'), short: sl('short'), emotional: sl('emotional') } });
    if (r.safety?.flag) { cur.result = { ...cur.result, safety: r.safety, rewrites: {} }; }
    else if (Object.keys(r.rewrites || {}).length) { cur.result = norm({ ...cur.result, rewrites: r.rewrites, changes: r.changes?.length ? r.changes : cur.result.changes }); cur.used = null; }
    else toast('No new rewrites came back. Try a different setting.');
    closeDrawer(); render(); if (cur.ref) patch(cur.ref, { result: cur.result }).catch(() => {});
  } catch (e) { toast(e.message); }
  b.disabled = false;
}
const openDrawer = () => { dim.hidden = drawer.hidden = false; drawer.querySelector('button').focus(); };
const closeDrawer = () => { dim.hidden = drawer.hidden = true; };

export default {
  init(el) {
    el.innerHTML = `<div class="vh"><h1>Say what you really mean.</h1><p>Paste a message, thought, or draft. Saywell helps you understand what may be underneath it and express it more clearly.</p></div>
    <div class="ws split"><div class="ws-l">
      <div class="ctxrow"><label>For</label><div class="chips" id="a-ctx"></div></div>
      <div class="ctxrow"><label>Sound</label><div class="chips" id="a-tone"></div></div>
      <div class="ctxrow"><label>Goal</label><div><div class="chips" id="a-int"></div></div></div>
      <div class="editor"><textarea id="a-msg" placeholder="Write your message…" aria-label="Your message"></textarea><div class="live" id="a-live" aria-live="polite"></div>
        <div class="ebar"><button class="btn ghost sm" id="a-ex">Example</button><button class="btn ghost sm" id="a-paste">Paste</button><button class="btn ghost sm" id="a-clear">Clear</button>
          <label class="tg"><input type="checkbox" id="a-priv"><i></i>Don't save to history</label><span class="cnt" id="a-cnt">0 characters</span><button class="btn pri" id="a-go">Analyze</button></div></div>
      <p class="hint" id="a-privhint">This message won't appear in your Saywell history.</p>
      <details class="more"><summary>Fine-tune how it sounds</summary><div class="more-in">
        <div><p class="muted" style="margin-bottom:8px">More specific about who (optional)</p><div class="chips" id="a-rel"></div></div>
        <div><p class="muted" style="margin-bottom:8px">Keep what matters</p><div style="display:grid;gap:10px"><label class="tg"><input type="checkbox" id="a-kb"><i></i>Keep my boundary</label><label class="tg"><input type="checkbox" id="a-ke"><i></i>Keep my emotion</label><label class="tg"><input type="checkbox" id="a-km"><i></i>Keep my meaning</label></div></div>
        <div><p class="muted" style="margin-bottom:6px">Voice</p><input type="range" id="a-voice" min="0" max="100" value="35" aria-label="More like me to more polished"><div class="ends"><span>More like me</span><span>More polished</span></div></div>
        <div><p class="muted" style="margin-bottom:8px">Length</p><div class="chips" id="a-len"></div></div>
        <div><p class="muted" style="margin-bottom:8px">Language</p><div class="chips" id="a-lang"></div><label class="tg" style="margin-top:10px"><input type="checkbox" id="a-kh"><i></i>Keep my Hinglish and slang</label></div>
      </div></details></div>
    <div class="ws-r" id="a-out"></div></div>`;
    dim = Object.assign(document.createElement('div'), { className: 'dim', hidden: true }); dim.onclick = closeDrawer;
    drawer = Object.assign(document.createElement('aside'), { className: 'drawer', hidden: true });
    drawer.setAttribute('aria-label', 'Rewrite controls');
    drawer.innerHTML = `<h2>How should this sound?</h2><p class="muted">Pick a preset, nudge the sliders, then apply. Your original stays untouched.</p><div class="chips" id="a-pre"></div>
      ${['warm:Warm', 'direct:Direct', 'short:Short', 'emotional:Emotional'].map(x => { const [k, l] = x.split(':'); return `<div class="rl"><label for="a-s-${k}">${l}</label><input type="range" id="a-s-${k}" min="0" max="100" value="50"></div>`; }).join('')}
      <div class="foot"><button class="btn pri" id="a-apply">Apply</button><button class="btn ghost" id="a-reset">Reset</button><button class="btn ghost" id="a-dclose">Close</button></div>`;
    document.body.append(dim, drawer);
    ta = $('a-msg');
    ctx = chips($('a-ctx'), CTXS, { value: 'Partner', onChange: () => drawRel() }); rel = chips($('a-rel'), RELS.Partner, { none: true });
    tone = chips($('a-tone'), TONES, { value: 'Natural' }); intent = chips($('a-int'), INTENTS, { none: true });
    len = chips($('a-len'), LENGTHS, { value: 'normal' }); lang = chips($('a-lang'), LANGS, { value: 'auto' }); preset = chips($('a-pre'), PRESETS, { none: true });
    $('a-dclose').onclick = closeDrawer; $('a-apply').onclick = applyControls;
    $('a-reset').onclick = () => { preset.set(null); ['warm', 'direct', 'short', 'emotional'].forEach(k => $('a-s-' + k).value = 50); };
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !drawer.hidden) closeDrawer(); });

    $('a-go').onclick = () => run();
    ta.addEventListener('keydown', e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') run(); });
    $('a-ex').onclick = () => { ta.value = EXAMPLES[Math.floor(Math.random() * EXAMPLES.length)]; ta.dispatchEvent(new Event('input')); ta.focus(); };
    $('a-clear').onclick = () => { ta.value = ''; ta.dispatchEvent(new Event('input')); $('a-out').innerHTML = emptyOut(); cur = null; ta.focus(); };
    $('a-paste').onclick = async () => { try { ta.value = await navigator.clipboard.readText(); ta.dispatchEvent(new Event('input')); } catch { toast('Paste with Ctrl+V or long-press instead.'); } };
    $('a-priv').onchange = () => { $('a-privhint').textContent = $('a-priv').checked ? "This message won't appear in your Saywell history." : 'Saved analyses appear in History on every device you sign in on.'; };
    let tm; ta.oninput = () => {
      $('a-cnt').textContent = ta.value.length + ' characters'; clearTimeout(tm);
      tm = setTimeout(async () => {
        const t = ta.value; if (t.trim().length < 8) { $('a-live').textContent = ''; return; }
        const p = await classifyText(t); if (!p) return;
        const hit = Object.keys(p).filter(k => p[k] > .5);
        $('a-live').innerHTML = hit.length ? 'Patterns noticed: ' + hit.map(k => `<span class="pill p" title="${esc(PWHY[k] || '')}">${esc(pn(k))}</span>`).join('') : 'No strong patterns noticed.';
      }, 700);
    };
    $('a-out').innerHTML = emptyOut();

    $('a-out').addEventListener('click', e => {
      const m = e.target.closest('mark');
      if (m && cur) { const p = cur.result.patterns[+m.dataset.i]; qa('mark', $('a-out')).forEach(x => x.classList.toggle('on', x === m)); $('a-exp').innerHTML = `<div class="explain"><b>“${esc(p.phrase)}”</b> <span class="pill p" style="margin:0 0 0 6px">${esc(pn(p.type))}</span><br>${esc(p.why || PWHY[p.type] || '')}</div>`; return; }
      const b = e.target.closest('[data-act]'); if (!b) return; const a = b.dataset.act, card = b.closest('.rc'), k = card?.dataset.k;
      if (a === 'retry') run();
      else if (a === 'draft') { try { localStorage.setItem('saywell.draft', ta.value); toast('Draft saved on this device.'); } catch { toast('Could not save the draft here.'); } }
      else if (a === 'reframe') run({ reframe: true });
      else if (a === 'drawer') openDrawer();
      else if (a === 'copy') copy(cur.result.rewrites[k].text).then(ok => toast(ok ? 'Copied' : 'Copy failed'));
      else if (a === 'use') useVersion(k);
      else if (a === 'usecur') useVersion(qa('.rc', $('a-out'))[cur.idx || 0]?.dataset.k);
      else if (a === 'prac') S.go('practice', { custom: scenarioFrom(cur.text, cur.settings.context), draft: cur.result.rewrites[k].text });
      else if (a === 'save') addTo('library', { text: cur.result.rewrites[k].text, original: cur.text, context: cur.settings.context, intent: cur.settings.intent, approach: NAMES[k], tags: tagsFor(cur.result.rewrites[k].text, cur.settings.context, cur.settings.intent) }).then(() => toast('Saved to Library')).catch(() => toast('Could not save. Try again.'));
      else if (a === 'edit') {
        const t = card.querySelector('.txt');
        if (t.tagName === 'P') { const x = document.createElement('textarea'); x.className = 'txt'; x.value = cur.result.rewrites[k].text; t.replaceWith(x); b.textContent = 'Done'; x.focus(); }
        else { cur.result.rewrites[k].text = t.value; const p = document.createElement('p'); p.className = 'txt'; p.textContent = t.value; t.replaceWith(p); b.textContent = 'Edit'; if (cur.used === k) $('a-after').textContent = t.value; }
      }
    });
    applyDefaults();
  },
  show(p = {}) {
    closeDrawer();
    if (!cur && !ta.value) applyDefaults();
    else $('a-priv').checked = $('a-priv').checked || S.prefs.saveHistory === false;
    if (!ta.value && !p.text && !p.open) { try { const d = localStorage.getItem('saywell.draft'); if (d) { ta.value = d; localStorage.removeItem('saywell.draft'); toast('Restored your saved draft.'); } } catch { /* ignore */ } }
    if (p.intent) intent.set(p.intent); if (p.ctx) { ctx.set(p.ctx); drawRel(); }
    if (p.open) { ta.value = p.open.text; cur = { text: p.open.text, result: norm(p.open.result), settings: p.open.settings || settings(), used: p.open.chosen || null, ref: p.open.ref || null }; render(); }
    else if (p.text) { ta.value = p.text; cur = null; $('a-out').innerHTML = emptyOut(); if (p.run) run(); }
    ta.dispatchEvent(new Event('input'));
    if (!p.text && !p.open) ta.focus({ preventScroll: true });
  }
};
const emptyOut = () => `<div class="res">${emptyState('Your analysis appears here.', 'Write or paste something on the left. Saywell shows the patterns, what may be underneath, and a few ways to say it.')}</div>`;
