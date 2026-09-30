const $ = id => document.getElementById(id);
const t = $('t'), out = $('out'), MAX = 1500;
let mode = 'clearer', seq = 0, tm, stageTm, ran = null, model = null, open = null, all = false, editing = false, copied = false;

const el = (tag, cls, txt, kids) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; (kids || []).forEach(k => k && e.append(k)); return e; };
const btn = (label, fn, cls = '') => { const b = el('button', 'b ' + cls, label); b.onclick = fn; return b; };
const setStatus = (k, txt) => { $('dot').className = 'dot ' + k; $('stt').textContent = txt; };
const webOpen = (o = {}) => chrome.tabs.create({ url: SW.webUrl(t.value.trim(), o) });

/* ---- mode pills ---- */
Object.entries(SW.MODES).forEach(([k, v]) => {
  const b = el('button', 'b pill' + (k === mode ? ' on' : ''), v); b.dataset.m = k; b.onclick = () => {
    mode = k; document.querySelectorAll('#modes .pill').forEach(x => x.classList.toggle('on', x.dataset.m === k));
    if (ran && ran === t.value.trim()) check(); // same text, new direction: regenerate
  }; $('modes').append(b);
});

/* ---- hint line: empty / typing / long ---- */
function hint() {
  const n = t.value.trim().length;
  $('hint').textContent = n === 0 ? 'Write or paste something.' : n > MAX ? `${n.toLocaleString()} characters. Saywell checks the first ${MAX.toLocaleString()} here. Open the full editor for all of it.` : n < 3 ? 'Keep going.' : `Ready to check. ${n.toLocaleString()} characters.`;
  $('hint').style.color = n > MAX ? 'var(--coral)' : '';
}
t.addEventListener('input', () => {
  hint(); clearTimeout(tm);
  if (ran !== null && ran !== t.value.trim()) { /* text changed: old result no longer matches */ }
  if ($('auto').checked && t.value.trim().length >= 12) tm = setTimeout(check, 1300);
});
t.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') check(); });
$('clear').onclick = () => { t.value = ''; out.replaceChildren(); ran = null; model = null; hint(); t.focus(); };
$('paste').onclick = async () => {
  try { const c = await navigator.clipboard.readText(); if (c) { t.value = c.slice(0, 4000); hint(); t.focus(); return; } } catch { /* no clipboard permission */ }
  t.focus(); $('hint').textContent = 'Press Ctrl+V to paste.';
};
$('go').onclick = check;
document.querySelectorAll('[data-tool]').forEach(b => b.onclick = () => webOpen({ go: 'toolkit', tool: b.dataset.tool }));
chrome.storage.local.get('auto').then(v => { $('auto').checked = !!v.auto; });
$('auto').onchange = () => chrome.storage.local.set({ auto: $('auto').checked });

/* ---- the check ---- */
const STAGES = ['Reading your words…', 'Noticing language patterns…', 'Looking underneath the wording…', 'Finding ways to say it…'];
async function check() {
  clearTimeout(tm); const text = t.value.trim();
  if (text.length < 3) { t.focus(); return; }
  const my = ++seq; $('go').disabled = true; setStatus('wait', 'Checking…');
  const p = el('p', 'stage', STAGES[0]); out.replaceChildren(p); let i = 0, n = 0; clearInterval(stageTm);
  stageTm = setInterval(() => { n++; i = Math.min(i + 1, STAGES.length - 1); p.textContent = n > 5 ? 'Waking up the server. The first check can take up to a minute.' : STAGES[i]; }, 1300);
  try {
    const res = await SW.api('/api/ext', { text: text.slice(0, MAX), mode });
    if (my !== seq) return;
    model = SW.view(res); ran = text; open = null; all = false; editing = false; copied = false; draw(); setStatus('ok', 'Ready');
  } catch (e) {
    if (my !== seq) return;
    out.replaceChildren(el('h2', '', e.server ? e.message : SW.CALM_ERR), el('div', 'row', null, [btn('Try again', check, 'pri'), btn('Open Saywell', () => webOpen())]));
    setStatus('bad', 'Offline');
  } finally { if (my === seq) { clearInterval(stageTm); $('go').disabled = false; } }
}

/* ---- results ---- */
function draw() {
  const m = model, kids = [];
  if (m.safety) { out.replaceChildren(el('h2', '', m.headline), el('p', '', m.safetyNote || 'This message may be worth pausing over before sending.')); return; }
  if (m.soft) kids.push(el('div', 'warn', 'Safety-sensitive wording noticed. This message may be worth pausing over before sending.'));
  kids.push(el('h2', '', m.headline));
  if (!m.items.length) kids.push(el('p', '', "That doesn't mean the message is perfect or imperfect. You can still ask Saywell to make it shorter, clearer or more direct."));
  else {
    const list = all ? m.items : m.items.slice(0, 3), chips = el('div', 'chips');
    list.forEach((it, i) => { const c = el('button', 'chip' + (open === i ? ' on' : ''), it.label); if (it.phrase) c.append(el('small', '', '“' + it.phrase.slice(0, 26) + '”')); c.onclick = () => { open = open === i ? null : i; draw(); }; chips.append(c); });
    kids.push(chips);
    const o = list[open]; if (o) kids.push(el('div', 'det', null, [el('b', '', o.label), el('div', '', o.why), btn('Change this part', () => document.querySelector('.sug')?.scrollIntoView({ behavior: 'smooth' }), 'pill')]));
    if (m.items.length > 3 && !all) kids.push(btn('See all patterns', () => { all = true; draw(); }, 'pill'));
    if (m.items.length === 1) { /* one pattern: the headline already says so, keep it short */ }
  }
  if (t.value.trim().length > MAX) kids.push(el('p', '', `Only the first ${MAX.toLocaleString()} characters were checked.`), btn('Open full editor', () => webOpen({ go: 'analyze', run: true })));
  kids.push(m.suggestion ? suggestion(m) : el('div', null, null, [el('p', '', m.offline ? "A suggested version isn't available right now." : ''), m.offline ? btn('Try again', check) : null]));
  out.replaceChildren(...kids);
}
function suggestion(m) {
  const wrap = el('div', 'sug', null, [el('div', 'lab', 'Suggested version')]);
  if (editing) {
    const ta = el('textarea'); ta.value = m.suggestion.text; ta.style.minHeight = '90px';
    wrap.append(ta, el('div', 'row', null, [btn('Save changes', () => { m.suggestion.text = ta.value.trim() || m.suggestion.text; editing = false; draw(); }, 'pri'), btn('Cancel', () => { editing = false; draw(); })]));
    return wrap;
  }
  wrap.append(el('div', 'txt', m.suggestion.text));
  wrap.append(el('div', 'row', null, [
    btn(copied ? 'Copied ✓' : 'Copy', async () => { try { await navigator.clipboard.writeText(m.suggestion.text); copied = true; draw(); setTimeout(() => { copied = false; draw(); }, 1200); } catch { /* clipboard blocked */ } }, 'pri'),
    btn('Edit', () => { editing = true; draw(); }),
    btn('Open full Saywell', () => webOpen({ go: 'analyze', run: true }))
  ]));
  if (m.suggestion.why) wrap.append(el('details', '', null, [el('summary', '', 'Why this changed'), el('div', '', m.suggestion.why)]));
  return wrap;
}

/* ---- on open: fill in the selected text (activeTab, only because you opened the popup) and show server status ---- */
(async () => {
  hint(); t.focus();
  SW.ping().then(ok => setStatus(ok ? 'ok' : 'bad', ok ? 'Ready' : 'Offline'));
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !/^(https?|file):/.test(tab.url || '')) return;
    const [r] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => String(getSelection() || '').trim() });
    if (r?.result && !t.value) { t.value = r.result.slice(0, 4000); hint(); }
  } catch { /* page not scriptable */ }
})();
