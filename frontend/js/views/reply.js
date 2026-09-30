import { $, esc, qa, toast, copy, safetyBlock, pn, PWHY, tagsFor } from '../util.js';
import { post } from '../api.js';
import { S } from '../state.js';
import { addTo } from '../store.js';

const GOALS = [['understand', 'Understand them'], ['calm', 'Reply calmly'], ['boundary', 'Set a boundary'], ['warm', 'Keep things warm'], ['end', 'End the conversation']];
const OPTS = [['reply_now', 'Reply now'], ['pause', 'Pause'], ['ask', 'Ask a question'], ['boundary', 'Set boundary'], ['dont_engage', "Don't engage"]];
const OPT_DRAFT = { reply_now: 'Listen first', ask: 'Clarify', boundary: 'Set a boundary' };
const pills = (a, c) => (a || []).map(x => `<span class="pill ${c}">${esc(x)}</span>`).join('');

const draftCards = (drafts, hl) => `<div class="rwrow" style="grid-template-columns:repeat(2,minmax(0,1fr))">${drafts.map((d, i) => `<article class="rc ${hl && d.approach === hl ? 'used' : ''}" data-i="${i}"><h3>${esc(d.approach)}</h3><p class="txt">${esc(d.text)}</p>
  <div class="acts"><button class="btn ghost sm" data-act="copy">Copy</button><button class="btn ghost sm" data-act="save">Save</button></div>${d.why ? `<details><summary>Why this works</summary><p>${esc(d.why)}</p></details>` : ''}</article>`).join('')}</div>`;

function wireDrafts(root, getDrafts) {
  root.addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); const card = e.target.closest('.rc'); if (!b || !card || !['copy', 'save'].includes(b.dataset.act)) return;
    const d = getDrafts()[+card.dataset.i]; if (!d) return;
    if (b.dataset.act === 'copy') copy(d.text).then(ok => toast(ok ? 'Copied' : 'Copy failed'));
    else addTo('library', { text: d.text, original: '', context: '', intent: d.approach === 'Set a boundary' ? 'Set a boundary' : '', approach: d.approach, tags: tagsFor(d.text, '', d.approach === 'Set a boundary' ? 'Set a boundary' : '') }).then(() => toast('Saved to Library')).catch(() => toast('Could not save. Try again.'));
  });
}
const errBlock = (title, msg) => `<div class="err" role="alert"><h3>${esc(title)}</h3><p>${esc(msg)} What you pasted is still in the box.</p><div class="acts"><button class="btn pri sm" data-act="retry">Try again</button></div></div>`;

/* =============== REPLY =============== */
let rGoal = null, rDrafts = [], rData = null;
export const reply = {
  init(el) {
    el.innerHTML = `<div class="vh"><h1>Someone said this to me</h1><p>Paste what they sent. Saywell helps you understand it first, then choose how to answer.</p></div>
    <label class="muted" for="r-msg">What did they say?</label>
    <div class="editor"><textarea id="r-msg" placeholder="Paste what they sent." style="min-height:130px"></textarea></div>
    <p class="muted" style="margin-bottom:8px">What do you want to do?</p><div class="goals" id="r-goals">${GOALS.map(([k, l]) => `<button type="button" data-k="${k}" aria-pressed="false">${l}</button>`).join('')}</div>
    <button class="btn pri" id="r-go">Help me reply</button><div id="r-out" class="res"></div>`;
    $('r-goals').onclick = e => { const b = e.target.closest('button'); if (!b) return; rGoal = rGoal === b.dataset.k ? null : b.dataset.k; qa('#r-goals button').forEach(x => x.setAttribute('aria-pressed', x.dataset.k === rGoal)); };
    const run = async () => {
      const m = $('r-msg').value; if (m.trim().length < 3) { $('r-msg').focus(); return; }
      $('r-go').disabled = true; $('r-out').innerHTML = '<div class="load"><div class="on"><i></i>Reading the message</div><div><i></i>Thinking about what may be behind it</div></div>';
      try { rData = await post('/api/reply', { mode: 'reply', message: m, goal: rGoal || '' }); rDrafts = rData.drafts || []; draw(); }
      catch (e) { $('r-out').innerHTML = errBlock("Couldn't read that message.", e.message); }
      $('r-go').disabled = false;
    };
    $('r-go').onclick = run;
    $('r-out').addEventListener('click', e => { const b = e.target.closest('[data-act=retry]'); if (b) run(); });
    wireDrafts($('r-out'), () => rDrafts);
    function draw() {
      const r = rData;
      if (r.safety?.flag) { $('r-out').innerHTML = safetyBlock(r.safety.note); return; }
      const u = r.underneath || {}, sug = r.suggested;
      $('r-out').innerHTML = `<section class="sect"><h2>What we can tell from this message</h2><p class="inl">${esc(r.doing) || '<span class="muted">Hard to say from this alone.</span>'}</p>
        <div style="margin-top:12px">${pills(u.feelings, 'f')}${pills(u.needs, 'n')}</div></section>
        <section class="sect"><h2>Before you reply</h2><p class="inl" style="margin-bottom:12px">Do you want to respond, clarify, pause, or leave this for later?</p>
        <div class="opts" id="r-opts">${OPTS.map(([k, l]) => `<button type="button" class="chip" data-k="${k}" aria-pressed="false">${l}${sug === k ? '<small>suggested</small>' : ''}</button>`).join('')}</div><div id="r-optx"></div></section>
        <section class="sect" id="r-dr"><h2>Choose your response</h2>${rDrafts.length ? draftCards(rDrafts) : '<p class="muted">No drafts this time. Pausing may be the better move.</p>'}</section>`;
      $('r-opts').onclick = e => {
        const b = e.target.closest('.chip'); if (!b) return; const k = b.dataset.k;
        qa('#r-opts .chip').forEach(x => x.setAttribute('aria-pressed', x === b));
        const quiet = k === 'pause' || k === 'dont_engage';
        $('r-optx').innerHTML = `<div class="optx">${esc(r.options?.[k] || '')}${quiet ? '<br><span class="muted">No reply needed right now. The drafts below are here if you change your mind.</span>' : ''}</div>`;
        qa('#r-dr .rc').forEach((c, i) => c.classList.toggle('used', OPT_DRAFT[k] && rDrafts[i]?.approach === OPT_DRAFT[k]));
      };
      if (sug) { const b = $('r-opts').querySelector(`[data-k=${sug}]`); if (b) b.click(); }
    }
  },
  show(p = {}) { if (p.text) { $('r-msg').value = p.text; } }
};

/* =============== REPAIR (conversation lens) =============== */
const parse = t => t.split('\n').map(x => x.trim()).filter(Boolean).slice(0, 60).map(l => { const m = l.match(/^([^:]{1,20}):\s*(.+)$/); return { speaker: m ? m[1].trim() : '', text: m ? m[2] : l }; });
let msgs = [], lens = null, me = '', rows = [], open = -1;

const spark = items => {
  const W = Math.max(320, items.length * 56), H = 90, x = i => 24 + i * (W - 48) / Math.max(1, items.length - 1), y = v => H - 16 - v * (H - 32);
  const col = v => (v < .34 ? 'var(--sage)' : v < .67 ? 'var(--gold)' : 'var(--coral)');
  return `<div class="spark"><svg width="${W}" height="${H}" role="img" aria-label="Pattern intensity across the conversation"><polyline fill="none" stroke="var(--ln2)" stroke-width="2" points="${items.map((m, i) => x(i) + ',' + y(m.intensity)).join(' ')}"/>${items.map((m, i) => `<circle cx="${x(i)}" cy="${y(m.intensity)}" r="5" fill="${col(m.intensity)}"/>`).join('')}</svg></div>
  <p class="hint">Pattern intensity across the conversation. It reflects language patterns in each message, not anyone's emotions.</p>`;
};

export const repair = {
  init(el) {
    el.innerHTML = `<div class="vh"><h1>Where did the conversation turn?</h1><p>Paste a chat or read a screenshot. Saywell finds where the language shifted and helps you repair it.</p></div>
    <div id="l-in"><div class="editor"><textarea id="l-msg" placeholder="Paste a chat, one message per line. Use Name: message." style="min-height:170px"></textarea></div>
      <div class="ctxrow" style="grid-template-columns:1fr;align-items:center"><div class="chips" style="align-items:center"><button class="btn pri" id="l-go">Show the flow</button><label class="btn ghost" style="cursor:pointer">Read a screenshot<input type="file" id="l-shot" accept="image/*" hidden></label><span class="muted" id="l-ocr"></span></div></div>
      <p class="hint">Screenshots are read on your device with OCR. You will check every line before anything is analyzed.</p></div>
    <div id="l-val" hidden></div><div id="l-out" class="res"></div>`;
    $('l-go').onclick = () => { msgs = parse($('l-msg').value); if (msgs.length < 2) { $('l-out').innerHTML = '<p class="muted">Paste at least two messages, one per line.</p>'; return; } analyze(); };
    $('l-shot').onchange = ocr;
    $('l-out').addEventListener('click', onOut);
    $('l-val').addEventListener('click', onVal);
  },
  show(p = {}) { if (p.text) { $('l-msg').value = p.text; } }
};

async function analyze() {
  $('l-val').hidden = true; $('l-in').hidden = false; $('l-out').innerHTML = '<div class="load"><div class="on"><i></i>Reading each message</div><div><i></i>Finding where the language shifted</div></div>';
  try {
    lens = await post('/api/lens', { messages: msgs }, { auth: false });
    const sp = [...new Set(lens.messages.map(m => m.speaker).filter(Boolean))]; me = sp.includes(me) ? me : (sp[0] || ''); open = -1; draw();
  } catch (e) { $('l-out').innerHTML = errBlock("Couldn't read that conversation.", e.message); }
}

function draw() {
  const items = lens.messages, sp = [...new Set(items.map(m => m.speaker).filter(Boolean))], t = lens.turning, s = lens.summary;
  const turnHtml = t !== null && s ? `<section class="sect"><div class="tp"><h2 style="margin:0">The conversation shifted here.</h2><blockquote>“${esc(items[t].text)}”</blockquote>${items[t].speaker ? `<p class="muted">${esc(items[t].speaker)}</p>` : ''}
      <div class="bhr"><div><h3>Before</h3><p>${esc(s.before)}</p></div><div><h3>Here</h3><p>${esc(s.here)}</p></div><div><h3>After</h3><p>${esc(s.after)}</p></div></div></div></section>`
    : `<section class="sect"><div class="note"><p>No clear turning point. The language patterns stayed fairly steady, or the conversation started charged.</p></div></section>`;
  $('l-out').innerHTML = `${turnHtml}<section class="sect"><h2>Communication pattern flow</h2>
    ${sp.length > 1 ? `<div class="who"><label for="l-me">Which one is you?</label><select id="l-me">${sp.map(x => `<option ${x === me ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select></div>` : ''}
    <div class="tl">${items.map((m, i) => `${i === t ? '<div class="turn">turning point</div>' : ''}<button type="button" class="msg ${m.speaker && m.speaker === me ? 'me' : ''} ${i === open ? 'on' : ''}" data-i="${i}">${m.speaker ? `<small>${esc(m.speaker)}</small>` : ''}<span>${esc(m.text)}</span><span class="lb ${['neutral', 'eases'].includes(m.label) ? 'ok' : ''}">${esc(m.label)}</span></button>`).join('')}</div>
    <div id="l-det" class="explain">Tap any message to see its patterns and a way to say it differently.</div></section>
    <section class="sect"><h2>Pattern intensity</h2>${spark(items)}</section>
    <section class="sect"><h2>Repair</h2><p class="muted" style="margin-bottom:12px">Draft a message that acknowledges what happened and reconnects.</p><button class="btn pri" data-act="repair">Draft a repair message</button><div id="l-rep" style="margin-top:16px"></div></section>`;
  const sel = $('l-me'); if (sel) sel.onchange = () => { me = sel.value; draw(); };
  wireDrafts($('l-rep'), () => repDrafts);
}
let repDrafts = [];
async function onOut(e) {
  const b = e.target.closest('[data-act],.msg'); if (!b) return;
  if (b.classList.contains('msg')) {
    open = +b.dataset.i; const m = lens.messages[open]; qa('.msg', $('l-out')).forEach(x => x.classList.toggle('on', x === b));
    const why = m.tags.map(k => `<p><span class="pill p" style="margin-right:8px">${esc(pn(k))}</span>${esc(PWHY[k] || '')}</p>`).join('');
    $('l-det').innerHTML = `<b>${esc(m.speaker || 'Message ' + (open + 1))}</b><p style="margin:6px 0 10px">${esc(m.text)}</p>${why || '<p class="muted">No strong patterns in this message.</p>'}<div style="margin-top:10px"><button class="btn ghost sm" data-act="rw">Rewrite this message</button></div><div id="l-rw"></div>`;
    return;
  }
  const a = b.dataset.act;
  if (a === 'rw') {
    const m = lens.messages[open]; b.disabled = true; $('l-rw').innerHTML = '<p class="muted" style="margin-top:10px">Finding another way to say it…</p>';
    try {
      const r = await post('/api/rewrite', { text: m.text, tone: S.prefs.tone === 'Assertive' ? 'Firm' : S.prefs.tone, language: S.prefs.language, keepHinglish: S.prefs.keepHinglish, length: 'short', voice: S.prefs.voice });
      if (r.safety?.flag) { $('l-rw').innerHTML = safetyBlock(r.safety.note); }
      else $('l-rw').innerHTML = ['natural', 'direct'].filter(k => r.rewrites?.[k]).map(k => `<div style="margin-top:12px"><span class="muted">${k === 'natural' ? 'Natural' : 'Direct'}</span><p class="serif" style="font-size:18px;margin:2px 0 6px">${esc(r.rewrites[k].text)}</p><button class="btn ghost sm" data-act="cp" data-t="${esc(r.rewrites[k].text)}">Copy</button></div>`).join('') || '<p class="muted">No rewrite came back.</p>';
    } catch (er) { $('l-rw').innerHTML = `<p class="muted" style="margin-top:10px">${esc(er.message)}</p>`; }
    b.disabled = false;
  } else if (a === 'cp') { copy(b.dataset.t).then(ok => toast(ok ? 'Copied' : 'Copy failed')); }
  else if (a === 'repair') {
    b.disabled = true; $('l-rep').innerHTML = '<p class="muted">Drafting…</p>';
    try { const d = await post('/api/reply', { mode: 'repair', message: lens.messages.map(m => (m.speaker ? m.speaker + ': ' : '') + m.text).join('\n') }); repDrafts = d.drafts || []; $('l-rep').innerHTML = d.safety?.flag ? safetyBlock(d.safety.note) : (repDrafts.length ? draftCards(repDrafts) : '<p class="muted">No draft came back. Try again.</p>'); }
    catch (er) { $('l-rep').innerHTML = `<p class="muted">${esc(er.message)}</p>`; }
    b.disabled = false;
  } else if (a === 'retry') analyze();
}

/* screenshot: OCR in the browser, then the person checks every line */
async function ocr(e) {
  const f = e.target.files[0]; if (!f) return; $('l-ocr').textContent = 'Reading the image in your browser…';
  try {
    if (!window.Tesseract) await new Promise((ok, no) => { const t = document.createElement('script'); t.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js'; t.onload = ok; t.onerror = no; document.head.append(t); });
    const r = await window.Tesseract.recognize(f, 'eng');
    const lines = r.data.text.split('\n').map(l => l.trim()).filter(l => l.length > 2);
    if (!lines.length) throw new Error('empty');
    rows = lines.map((t, i) => ({ text: t.replace(/^[^:]{1,20}:\s+/, ''), who: i % 2 === 0 ? 'Them' : 'Me', off: false }));
    $('l-ocr').textContent = ''; validate();
  } catch { $('l-ocr').textContent = 'Could not read that image. Paste the text instead.'; }
  e.target.value = '';
}
function validate() {
  $('l-in').hidden = true; $('l-out').innerHTML = ''; $('l-val').hidden = false;
  $('l-val').innerHTML = `<h2 style="font-size:24px;margin-bottom:6px">We found ${rows.length} message${rows.length === 1 ? '' : 's'}.</h2><p class="muted">Screenshots can be misread. Fix the text, set who said each line, join lines that belong together, and ignore anything that is not a message.</p>
  <div class="vrows">${rows.map((r, i) => `<div class="vr ${r.off ? 'off' : ''}" data-i="${i}"><button class="chip" data-a="who" aria-pressed="${r.who === 'Me'}">${r.who}</button><textarea>${esc(r.text)}</textarea><button class="btn ghost sm" data-a="join" ${i ? '' : 'disabled'}>Join up</button><span style="display:flex;gap:6px"><button class="btn ghost sm" data-a="off">${r.off ? 'Use' : 'Ignore'}</button><button class="btn ghost sm" data-a="del" aria-label="Delete message">×</button></span></div>`).join('')}</div>
  <div class="chips"><button class="btn pri" data-a="go">Analyze conversation</button><button class="btn ghost" data-a="flip">Flip all speakers</button><button class="btn ghost" data-a="cancel">Cancel</button></div>`;
}
const sync = () => qa('#l-val .vr').forEach((el, i) => { if (rows[i]) rows[i].text = el.querySelector('textarea').value; });
function onVal(e) {
  const b = e.target.closest('[data-a]'); if (!b) return; sync(); const i = +b.closest('.vr')?.dataset.i, a = b.dataset.a;
  if (a === 'who') rows[i].who = rows[i].who === 'Me' ? 'Them' : 'Me';
  else if (a === 'off') rows[i].off = !rows[i].off;
  else if (a === 'del') rows.splice(i, 1);
  else if (a === 'join' && i > 0) { rows[i - 1].text += ' ' + rows[i].text; rows.splice(i, 1); }
  else if (a === 'flip') rows.forEach(r => r.who = r.who === 'Me' ? 'Them' : 'Me');
  else if (a === 'cancel') { $('l-val').hidden = true; $('l-in').hidden = false; return; }
  else if (a === 'go') { msgs = rows.filter(r => !r.off && r.text.trim()).map(r => ({ speaker: r.who, text: r.text.trim() })); if (msgs.length < 2) { toast('Keep at least two messages.'); return; } me = 'Me'; analyze(); return; }
  validate();
}
