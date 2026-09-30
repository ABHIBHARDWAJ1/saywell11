import { $, esc, toast } from '../util.js';
import { post } from '../api.js';
import { addTo, listOf } from '../store.js';
import { SCENARIOS, LEVELS } from '../data.js';

let sc = SCENARIOS[6].s, scTitle = SCENARIOS[6].t, level = 'Beginner', hist = [], sess, busy = false, draft = '';
const CHK = [['observation', 'Observation'], ['feeling', 'Feeling'], ['need', 'Need'], ['request', 'Request']];
const REV = [['observation', 'Observation'], ['feeling', 'Feeling'], ['need', 'Need'], ['request', 'Request'], ['boundary', 'Boundary'], ['listening', 'Listening']];

function drawPick() {
  $('p-sc').innerHTML = SCENARIOS.map(s => `<button type="button" data-id="${s.id}" aria-pressed="${s.s === sc}"><b>${esc(s.t)}</b><span>${esc(s.b)}</span></button>`).join('');
  $('p-lv').innerHTML = LEVELS.map(([l, d]) => `<button type="button" data-l="${l}" aria-pressed="${l === level}"><b>${l}</b><span>${esc(d)}</span></button>`).join('');
}
const turn = (who, text, extra = '') => { const log = $('s-log'); log.insertAdjacentHTML('beforeend', `<div class="turnb ${who}"><small>${who === 'you' ? 'You' : 'Them'}</small><p>${esc(text)}</p>${extra}</div>`); log.scrollTop = log.scrollHeight; };

async function begin() {
  if (busy) return; busy = true; hist = [];
  sess.hidden = false; document.body.style.overflow = 'hidden';
  $('s-title').textContent = scTitle; $('s-lvl').textContent = level; $('s-log').innerHTML = ''; $('s-input').hidden = false; $('s-in').value = draft; draft = ''; $('s-end').hidden = false;
  $('s-log').insertAdjacentHTML('beforeend', '<div class="muted" id="s-wait">Setting the scene…</div>');
  try { const r = await post('/api/practice', { scenario: sc, level, history: [], start: true }); $('s-wait')?.remove(); hist.push({ role: 'them', text: r.reply }); turn('them', r.reply); $('s-in').focus(); }
  catch (e) { $('s-wait')?.remove(); turn('them', "I can't start right now. " + e.message); }
  busy = false;
}
async function send() {
  const t = $('s-in').value.trim(); if (!t || busy) return; busy = true; $('s-send').disabled = true; $('s-in').value = '';
  turn('you', t); hist.push({ role: 'you', text: t });
  try {
    const r = await post('/api/practice', { scenario: sc, level, history: hist });
    if (r.safety) { turn('them', r.reply); $('s-input').hidden = true; busy = false; $('s-send').disabled = false; return; }
    const c = r.checklist || {};
    const chk = `<div class="chk" aria-label="Communication check">${CHK.map(([k, l]) => `<span class="${c[k] ? 'y' : ''}">${c[k] ? '✓' : '○'} ${l}</span>`).join('')}</div>${r.tip ? `<p class="tip">${esc(r.tip)}</p>` : ''}`;
    const mine = $('s-log').querySelectorAll('.turnb.you'); mine[mine.length - 1]?.insertAdjacentHTML('beforeend', chk);
    hist.push({ role: 'them', text: r.reply }); turn('them', r.reply);
  } catch (e) { turn('them', e.message); $('s-in').value = t; hist.pop(); }
  busy = false; $('s-send').disabled = false; $('s-in').focus();
}
async function finish() {
  if (busy) return;
  if (!hist.some(h => h.role === 'you')) { closeSess(); return; }
  busy = true; $('s-input').hidden = true; $('s-end').hidden = true; $('s-log').insertAdjacentHTML('beforeend', '<div class="muted" id="s-wait">Reviewing how it went…</div>');
  try {
    const { review: v } = await post('/api/practice', { scenario: sc, level, history: hist, review: true }); $('s-wait')?.remove();
    const rows = REV.map(([k, l]) => `<div><span>${l}</span><span class="${v[k] === true ? 'y' : 'n'}">${v[k] === true ? '✓' : v[k] === false ? '○' : 'n/a'}</span></div>`).join('');
    $('s-log').insertAdjacentHTML('beforeend', `<div class="turnb"><h2 class="serif" style="font-size:28px;margin:8px 0 4px">How did you communicate?</h2><div class="rev">${rows}</div>
      ${v.well ? `<small>One thing you did well</small><p>${esc(v.well)}</p>` : ''}${v.next ? `<small style="margin-top:14px">One thing to try next time</small><p>${esc(v.next)}</p>` : ''}
      <div class="chips" style="margin-top:20px"><button class="btn pri" id="s-again">Practice again</button><button class="btn ghost" id="s-done">Close</button></div></div>`);
    $('s-log').scrollTop = $('s-log').scrollHeight;
    $('s-again').onclick = () => { busy = false; begin(); }; $('s-done').onclick = closeSess;
    addTo('practice', { scenario: sc, title: scTitle, level, review: v, turns: hist.filter(h => h.role === 'you').length }).catch(() => {});
  } catch (e) { $('s-wait')?.remove(); $('s-log').insertAdjacentHTML('beforeend', `<div class="err"><p>${esc(e.message)}</p><div class="acts"><button class="btn ghost sm" id="s-done">Close</button></div></div>`); $('s-done').onclick = closeSess; }
  busy = false;
}
function closeSess() { sess.hidden = true; document.body.style.overflow = ''; busy = false; }

export default {
  init(el) {
    el.innerHTML = `<div class="vh"><h1>Practice a hard conversation.</h1><p>Pick a situation. Saywell plays the other side and checks what you said as you go.</p></div>
    <p class="muted">What do you want to practice?</p><div class="scs" id="p-sc"></div>
    <details class="more" style="margin-bottom:22px" id="p-cd"><summary>Create my own scenario</summary><div class="more-in"><textarea id="p-cu" placeholder="Describe the situation and who you are talking to. Example: My manager keeps adding work after 6 pm." style="min-height:90px"></textarea></div></details>
    <p class="muted">How hard should they make it?</p><div class="lvls" id="p-lv"></div>
    <button class="btn pri" id="p-go">Start</button>
    <div class="blk"><h2>Recent sessions</h2><div id="p-rec"></div></div>`;
    sess = document.createElement('div'); sess.className = 'sess'; sess.hidden = true; sess.setAttribute('role', 'dialog'); sess.setAttribute('aria-label', 'Practice conversation');
    sess.innerHTML = `<div class="sess-top"><div class="t"><small>Practice</small><b id="s-title"></b></div><span class="pill" id="s-lvl"></span><button class="btn ghost sm" id="s-end">End and review</button><button class="btn ghost sm" id="s-x" aria-label="Close">×</button></div>
      <div class="sess-log" id="s-log" aria-live="polite"></div>
      <div class="sess-in" id="s-input"><textarea id="s-in" placeholder="Your response. Try observation, feeling, need, request." aria-label="Your response"></textarea><div class="r"><span class="muted">Ctrl + Enter to send</span><button class="btn pri" id="s-send">Send</button></div></div>`;
    $('app').append(sess);
    drawPick();
    $('p-sc').onclick = e => { const b = e.target.closest('button'); if (!b) return; const s = SCENARIOS.find(x => x.id === b.dataset.id); sc = s.s; scTitle = s.t; $('p-cu').value = ''; drawPick(); };
    $('p-lv').onclick = e => { const b = e.target.closest('button'); if (b) { level = b.dataset.l; drawPick(); } };
    $('p-cu').oninput = () => { const v = $('p-cu').value.trim(); if (v) { sc = v.slice(0, 280); scTitle = 'Your scenario'; document.querySelectorAll('#p-sc button').forEach(x => x.setAttribute('aria-pressed', 'false')); } };
    $('p-go').onclick = begin; $('s-send').onclick = send; $('s-end').onclick = finish;
    $('s-x').onclick = () => { if (!hist.some(h => h.role === 'you') || confirm('Leave this practice without a review?')) closeSess(); };
    $('s-in').addEventListener('keydown', e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') send(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !sess.hidden && !hist.some(h => h.role === 'you')) closeSess(); });
  },
  async show(p = {}) {
    if (p.custom) { $('p-cu').value = p.custom; $('p-cd').open = true; sc = p.custom; scTitle = 'Your scenario'; drawPick(); document.querySelectorAll('#p-sc button').forEach(x => x.setAttribute('aria-pressed', 'false')); draft = p.draft || ''; toast('Scenario ready. Pick a level and press Start.'); }
    if (p.scenario) { const s = SCENARIOS.find(x => x.id === p.scenario); if (s) { sc = s.s; scTitle = s.t; drawPick(); } }
    try {
      const l = await listOf('practice', 5);
      $('p-rec').innerHTML = l.length ? l.map(x => `<div class="rec" style="cursor:default">${esc(x.title || 'Practice')}<small>${esc(x.level)} · ${x.turns || 0} message${x.turns === 1 ? '' : 's'}</small></div>`).join('') : '<p class="muted">Nothing yet. Your finished sessions show up here.</p>';
    } catch { $('p-rec').innerHTML = ''; }
  }
};
