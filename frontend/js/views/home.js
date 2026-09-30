import { $, esc, greeting, ago, pn } from '../util.js';
import { S, firstName } from '../state.js';
import { listOf, loadProgress } from '../store.js';
import { MODULES, PATTERN_MODULE, TRY_THIS } from '../data.js';

export default {
  init(el) {
    el.innerHTML = `<h1 class="hi" id="h-hi"></h1><p class="hq">What are you trying to say?</p>
    <div class="hbox"><textarea id="h-msg" rows="2" placeholder="What's on your mind?" aria-label="What are you trying to say"></textarea><button class="btn pri" id="h-go">Analyze</button></div>
    <div class="qa"><button data-go="analyze"><b>Analyze something</b><span>Before you send it</span></button><button data-go="reply"><b>Help me reply</b><span>Someone sent you something</span></button>
      <button data-go="repair"><b>Repair a conversation</b><span>Find where it turned</span></button><button data-go="practice"><b>Practice a conversation</b><span>Try it before the real one</span></button></div>
    <div class="hcols"><div><h2 style="font:500 13px var(--sans);color:var(--mu);margin-bottom:12px">Recent</h2><div id="h-rec"></div></div><div><h2 style="font:500 13px var(--sans);color:var(--mu);margin-bottom:12px">Your communication</h2><div id="h-ins"></div><div class="blk" style="margin-top:28px"><h2>Continue learning</h2><div id="h-learn"></div></div></div></div>`;
    const go = () => { const t = $('h-msg').value.trim(); S.go('analyze', t ? { text: t } : {}); $('h-msg').value = ''; };
    $('h-go').onclick = go;
    $('h-msg').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); go(); } });
    el.addEventListener('click', e => { const t = e.target.closest('[data-go]'); if (t) S.go(t.dataset.go); const r = e.target.closest('[data-open]'); if (r) { const it = S.homeRecent?.[+r.dataset.open]; if (it) S.go('analyze', { open: { text: it.text, result: it.result, settings: it.settings, chosen: it.chosen, ref: it.ref } }); } const l = e.target.closest('[data-learn]'); if (l) S.go('learn', l.dataset.learn ? { module: l.dataset.learn } : {}); });
  },
  async show() {
    $('h-hi').textContent = `${greeting()}, ${firstName()}.`;
    try {
      const l = await listOf('analyses', 60); S.homeRecent = l.slice(0, 3);
      $('h-rec').innerHTML = l.length ? l.slice(0, 3).map((x, i) => `<button class="rec" data-open="${i}">${esc(x.text.length > 90 ? x.text.slice(0, 88) + '…' : x.text)}<small>${ago(x.at)}</small></button>`).join('') : '<p class="muted">Nothing yet. Your last few analyses appear here.</p>';
      const c = {}; l.filter(x => Date.now() - x.at.getTime() < 7 * 86400000).forEach(x => new Set((x.result?.patterns || []).map(p => p.type)).forEach(t => c[t] = (c[t] || 0) + 1));
      const top = Object.entries(c).sort((a, b) => b[1] - a[1])[0];
      $('h-ins').innerHTML = top ? `<p class="serif" style="font-size:19px;line-height:1.45">Something you've been noticing: more ${esc(pn(top[0]))} this week.</p><p class="muted" style="margin-top:6px">${esc(TRY_THIS[top[0]] || '')}</p>` : '<p class="muted">A few saved analyses are enough to start spotting your patterns.</p>';
      const p = await loadProgress(), n = Object.values(p.modules || {}).filter(m => m.done).length, next = MODULES.find(m => !p.modules?.[m.id]?.done);
      $('h-learn').innerHTML = `<div class="pbar"><i style="width:${n / MODULES.length * 100}%"></i></div><p class="muted">${n} / ${MODULES.length} lessons completed</p>${next ? `<button class="btn ghost sm" data-learn="${next.id}" style="margin-top:10px">${n ? 'Next' : 'Start'}: ${esc(next.title)}</button>` : '<p class="muted" style="margin-top:6px">All lessons done. Replay any of them from Learn.</p>'}`;
    } catch { $('h-rec').innerHTML = '<p class="muted">Couldn\'t load your recent activity. Check your connection.</p>'; }
  }
};
