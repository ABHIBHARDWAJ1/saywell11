/* SAYWELL on-page card. Injected only when the user asks (shortcut or right-click). Shadow DOM keeps the page's CSS out. */
(() => {
  if (window.__swCard) return; window.__swCard = true;
  const MODES = { clearer: 'Clearer', kinder: 'Kinder', firmer: 'Firmer', shorter: 'Shorter' };
  const STAGES = ['Reading your words…', 'Noticing language patterns…', 'Looking underneath the wording…', 'Finding ways to say it…'];
  let host, root, box, target = null, st = null, timer = null;

  const CSS = `:host{all:initial}*{box-sizing:border-box}
  .c{position:fixed;z-index:2147483647;right:18px;bottom:18px;width:324px;max-height:82vh;overflow:auto;background:#11151B;color:#EFEAE0;border:1px solid #ffffff2a;border-radius:14px;padding:14px 16px;font:14px/1.5 system-ui,-apple-system,Segoe UI,sans-serif;box-shadow:0 18px 50px #000a}
  .top{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}.brand{font:400 12px Georgia,serif;letter-spacing:.22em;color:#D8B46E}
  .x{all:unset;cursor:pointer;color:#9299A7;font-size:20px;line-height:1;padding:0 4px}.x:hover{color:#EFEAE0}
  h2{font:400 18px/1.3 Georgia,serif;margin:0 0 8px}p{margin:6px 0;color:#9299A7;font-size:13px}
  .chips{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}
  .chip{all:unset;cursor:pointer;font-size:12.5px;padding:5px 10px;border-radius:99px;border:1px solid #D8B46E66;color:#D8B46E}.chip.on{background:#D8B46E22}.chip small{color:#9299A7;margin-left:4px}
  .det{background:#ffffff0a;border-radius:10px;padding:8px 10px;margin:6px 0;font-size:13px}.det b{color:#D8B46E;font-weight:600}
  .more{all:unset;cursor:pointer;color:#9299A7;font-size:12.5px;text-decoration:underline}
  .sug{margin:12px 0 4px;padding-top:10px;border-top:1px solid #ffffff1c}.lab{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#9299A7}
  .txt{font:400 16px/1.5 Georgia,serif;margin:6px 0 10px;white-space:pre-wrap}
  textarea{width:100%;min-height:84px;background:#07080C;color:#EFEAE0;border:1px solid #ffffff2a;border-radius:10px;padding:8px;font:15px/1.5 Georgia,serif;resize:vertical}
  .row{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0}
  .b{all:unset;cursor:pointer;font:600 12.5px system-ui,sans-serif;padding:7px 13px;border-radius:99px;border:1px solid #ffffff33;color:#EFEAE0}.b:hover{border-color:#D8B46E}
  .b.pri{background:#D8B46E;color:#15110a;border-color:#D8B46E}.b.pill{font-weight:500;padding:4px 10px}.b.pill.on{border-color:#D8B46E;color:#D8B46E}.b[disabled]{opacity:.5;cursor:default}
  .warn{background:#D9887322;border:1px solid #D9887366;color:#EFEAE0;border-radius:10px;padding:8px 10px;margin:6px 0;font-size:13px}
  .ok{color:#8FAE9A}details{font-size:12.5px;color:#9299A7;margin-top:6px}summary{cursor:pointer}
  .tip{font-size:12px;color:#9299A7;margin-top:10px;border-top:1px solid #ffffff14;padding-top:8px}`;

  const h = (tag, cls, txt, kids) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; (kids || []).forEach(k => k && e.append(k)); return e; };
  const btn = (label, fn, cls = '') => { const b = h('button', 'b ' + cls, label); b.onclick = fn; return b; };
  const ask = m => new Promise(r => chrome.runtime.sendMessage(m, x => r(chrome.runtime.lastError ? { ok: false } : x)));

  /* remember where the text came from so "Replace text" can put it back, and only there */
  function capture() {
    const a = document.activeElement;
    if (a && (a.tagName === 'TEXTAREA' || (a.tagName === 'INPUT' && /^(text|search|url)?$/.test(a.type)))) {
      const s = a.selectionStart, e = a.selectionEnd; return { kind: 'field', el: a, start: s !== e ? s : 0, end: s !== e ? e : a.value.length };
    }
    if (a && a.isContentEditable) {
      const sel = getSelection(); let range;
      if (sel.rangeCount && !sel.isCollapsed && a.contains(sel.anchorNode)) range = sel.getRangeAt(0).cloneRange();
      else { range = document.createRange(); range.selectNodeContents(a); }
      return { kind: 'editable', el: a, range };
    }
    return null;
  }
  function replaceText(newText) { // false = did nothing (the box changed since the check)
    const t = target, want = st.text.trim(); if (!t || !t.el.isConnected) return false;
    if (t.kind === 'field') {
      if (t.el.value.slice(t.start, t.end).trim() !== want) return false;
      t.el.focus(); t.el.setRangeText(newText, t.start, t.end, 'end'); t.el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: newText })); return true;
    }
    if (t.range.toString().trim() !== want) return false;
    t.el.focus(); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(t.range); return document.execCommand('insertText', false, newText);
  }
  async function copyText(t) {
    try { await navigator.clipboard.writeText(t); return true; } catch {
      const a = h('textarea'); a.value = t; a.style.cssText = 'position:fixed;opacity:0'; document.body.append(a); a.select(); const ok = document.execCommand('copy'); a.remove(); return ok;
    }
  }

  function close() { clearInterval(timer); host?.remove(); host = null; document.removeEventListener('keydown', onKey, true); }
  const onKey = e => { if (e.key === 'Escape') close(); };
  function mount() {
    if (host?.isConnected) return;
    host = document.createElement('div'); host.id = 'saywell-card'; root = host.attachShadow({ mode: 'open' });
    root.append(h('style', '', CSS)); box = h('div', 'c'); root.append(box); document.documentElement.append(host);
    document.addEventListener('keydown', onKey, true);
  }
  function draw(...kids) { // header stays, body is rebuilt
    const top = h('div', 'top', null, [h('span', 'brand', 'SAYWELL'), (() => { const x = h('button', 'x', '×'); x.setAttribute('aria-label', 'Close'); x.onclick = close; return x; })()]);
    box.replaceChildren(top, ...kids.filter(Boolean));
  }

  function render() {
    if (!st) return;
    clearInterval(timer);
    if (st.phase === 'empty') return draw(h('h2', '', 'Nothing to check'), h('p', '', 'Select some text or click into a text box first.'));
    if (st.phase === 'loading') {
      const p = h('p', '', STAGES[0]); let i = 0, n = 0;
      timer = setInterval(() => { n++; i = Math.min(i + 1, STAGES.length - 1); p.textContent = n > 5 ? 'Waking up the server. The first check can take up to a minute.' : STAGES[i]; }, 1300);
      return draw(h('h2', '', 'Checking…'), p);
    }
    if (st.phase === 'error') return draw(h('h2', '', st.message), h('div', 'row', null, [btn('Try again', () => run(st.mode || 'clearer'), 'pri'), btn('Open Saywell', () => ask({ type: 'sw-open', text: st.text }))]));
    const m = st.model, kids = [];
    if (m.safety) return draw(h('h2', '', m.headline), h('p', '', m.safetyNote || 'This message may be worth pausing over before sending.'));
    if (m.soft) kids.push(h('div', 'warn', 'Safety-sensitive wording noticed. This message may be worth pausing over before sending.'));
    kids.push(h('h2', '', m.shortHeadline));
    if (!m.items.length) kids.push(h('p', '', "That doesn't mean the message is perfect or imperfect. You can still ask Saywell to make it shorter, clearer or more direct."));
    else {
      const list = st.all ? m.items : m.items.slice(0, 3), chips = h('div', 'chips');
      list.forEach((it, i) => { const c = h('button', 'chip' + (st.open === i ? ' on' : ''), it.label); if (it.phrase) c.append(h('small', '', '“' + it.phrase.slice(0, 24) + '”')); c.onclick = () => { st.open = st.open === i ? null : i; render(); }; chips.append(c); });
      kids.push(chips);
      const o = list[st.open]; if (o) kids.push(h('div', 'det', null, [h('b', '', o.label), h('div', '', o.why)]));
      if (m.items.length > 3 && !st.all) { const more = h('button', 'more', 'See all patterns'); more.onclick = () => { st.all = true; render(); }; kids.push(more); }
    }
    if (!m.suggestion) kids.push(m.offline ? h('p', '', "A suggested version isn't available right now.") : null, m.offline ? btn('Try again', () => run(st.mode || 'clearer')) : null);
    else if (!st.reveal) kids.push(h('div', 'row', null, [btn('Make this clearer →', () => { st.reveal = true; render(); }, 'pri')]));
    else kids.push(suggestion(m));
    kids.push(h('div', 'row', null, [btn('Open full editor', () => ask({ type: 'sw-open', text: st.text }))]));
    if (st.tip) kids.push(h('div', 'tip', 'Tip: select text on any page and press Alt+Shift+S to check it.'));
    draw(...kids);
  }
  function suggestion(m) {
    const wrap = h('div', 'sug', null, [h('div', 'lab', 'Suggested version')]);
    if (st.editing) {
      const ta = h('textarea'); ta.value = st.draft ?? m.suggestion.text;
      wrap.append(ta, h('div', 'row', null, [btn('Save changes', () => { m.suggestion.text = ta.value.trim() || m.suggestion.text; st.editing = false; render(); }, 'pri'), btn('Cancel', () => { st.editing = false; render(); })]));
      return wrap;
    }
    wrap.append(h('div', 'txt', st.busy ? 'Finding a new version…' : m.suggestion.text));
    const pills = h('div', 'row');
    Object.entries(MODES).forEach(([k, v]) => { const b = btn(v, () => run(k), 'pill' + (m.mode === k ? ' on' : '')); if (st.busy) b.disabled = true; pills.append(b); });
    wrap.append(pills);
    const acts = h('div', 'row');
    const cp = btn(st.copied ? 'Copied ✓' : 'Copy', async () => { if (await copyText(m.suggestion.text)) { st.copied = true; render(); setTimeout(() => { if (st) { st.copied = false; render(); } }, 1200); } }, 'pri');
    acts.append(cp, btn('Edit', () => { st.editing = true; render(); }));
    if (target) acts.append(btn('Replace text', () => { st.confirm = true; render(); }));
    wrap.append(acts);
    if (st.confirm) {
      wrap.append(h('div', 'warn', 'Replace the text in the box with this version?'), h('div', 'row', null, [
        btn('Replace', () => { const ok = replaceText(m.suggestion.text); st.confirm = false; st.note = ok ? 'Replaced. Check it before you send.' : "The text box changed since the check, so nothing was replaced. Copy the version instead."; render(); }, 'pri'),
        btn('Keep mine', () => { st.confirm = false; render(); })]));
    }
    if (st.note) wrap.append(h('p', st.note.startsWith('Replaced') ? 'ok' : '', st.note));
    if (m.suggestion.why) { const d = h('details', '', null, [h('summary', '', 'Why this changed'), h('div', '', m.suggestion.why)]); wrap.append(d); }
    return wrap;
  }
  async function run(mode) { // regenerate with another mode
    st.busy = true; st.note = ''; render();
    const r = await ask({ type: 'sw-rewrite', text: st.text, mode });
    st.busy = false;
    if (r?.ok) { st.model = r.model; st.reveal = true; st.mode = mode; } else if (st.phase === 'error') { st.message = r?.message || st.message; } else st.note = r?.message || "Saywell couldn't reach the analysis service.";
    if (st.phase === 'error' && r?.ok) st.phase = 'result';
    render();
  }

  chrome.runtime.onMessage.addListener(m => {
    if (m?.type !== 'sw-show') return;
    if (m.phase === 'loading' || m.phase === 'empty') { target = capture(); }
    mount(); st = { ...(m.phase === 'result' && st?.text === m.text ? st : {}), ...m };
    if (m.phase === 'result') { st.reveal = !!m.reveal; st.open = null; st.all = false; st.editing = false; st.confirm = false; st.note = ''; st.mode = m.model.mode; }
    render();
  });
})();
