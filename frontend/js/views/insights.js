import { $, esc, emptyState, pn, dayMs } from '../util.js';
import { S } from '../state.js';
import { listOf, savePrefs } from '../store.js';
import { PATTERN_MODULE, TRY_THIS } from '../data.js';

const count = list => { const c = {}; list.forEach(x => new Set((x.result?.patterns || []).map(p => p.type)).forEach(t => { c[t] = (c[t] || 0) + 1; })); return c; };
const CTX_NAME = { Partner: 'relationships', Friend: 'friendships', Family: 'family', College: 'college', Work: 'work' };

export async function weeklyData() {
  const l = await listOf('analyses', 200), now = Date.now();
  const week = l.filter(x => now - x.at.getTime() < 7 * dayMs), prev = l.filter(x => { const d = now - x.at.getTime(); return d >= 7 * dayMs && d < 14 * dayMs; });
  return { all: l, week, prev, wc: count(week), pc: count(prev) };
}

export default {
  init(el) { el.innerHTML = `<div class="vh"><h1>Your communication patterns</h1><p>Noticed from the analyses you saved. These are habits of language, not a score of you as a person.</p></div><div id="in-body"></div>`; },
  async show() {
    const b = $('in-body'); b.innerHTML = '<p class="muted">Looking at your recent analyses…</p>';
    let d; try { d = await weeklyData(); } catch { b.innerHTML = '<div class="err"><h3>Couldn\'t load your insights.</h3><p>Check your connection and open this page again.</p></div>'; return; }
    if (d.all.length < 2) { b.innerHTML = emptyState('A few conversations are enough to start spotting your patterns.', 'Analyze a couple of messages and leave "Don\'t save to history" off. Your patterns show up here.', 'Analyze something', 'analyze'); b.onclick = e => e.target.closest('[data-act]') && S.go('analyze'); return; }
    const monthAgo = Date.now() - 30 * dayMs, month = d.all.filter(x => x.at.getTime() > monthAgo), mc = count(month), n = month.length;
    const top = Object.entries(d.wc).sort((a, z) => z[1] - a[1])[0] || Object.entries(mc).sort((a, z) => z[1] - a[1])[0];
    const ctxs = {}; d.week.forEach(x => { const c = x.settings?.context; if (c) ctxs[c] = (ctxs[c] || 0) + 1; });
    const ctxTop = Object.entries(ctxs).sort((a, z) => z[1] - a[1])[0];
    const rows = Object.entries(mc).sort((a, z) => z[1] - a[1]);
    b.innerHTML = `<div class="ins-top"><div class="stat"><b>${d.week.length}</b><span>${d.week.length === 1 ? 'analysis' : 'analyses'} this week</span></div><div class="stat"><b>${n}</b><span>in the last 30 days</span></div><div class="stat"><b>${top ? esc(pn(top[0])) : 'None'}</b><span>most common pattern</span></div></div>
    ${top ? `<p class="inl" style="margin:18px 0 8px">${esc(top[0] === 'absolute' ? 'You used words like “always” or “never” in ' : 'This pattern showed up in ')}${(d.wc[top[0]] || mc[top[0]])} of your ${d.wc[top[0]] ? 'analyses this week' : 'saved analyses this month'}.</p>` : ''}
    <div class="blk"><h2>Patterns, this month</h2>${rows.length ? rows.map(([k, v]) => { const m = Math.max(...Object.values(mc)), pc = d.pc[k] || 0, wc = d.wc[k] || 0, mod = PATTERN_MODULE[k];
      return `<div class="prow"><div class="h"><span class="serif" style="font-size:19px">${esc(pn(k))}</span><span class="muted">${v} of ${n}</span></div>
      <div class="pr2"><span>Last week</span><span class="old"><i style="display:block;width:${d.prev.length ? pc / d.prev.length * 100 : 0}%"></i></span><span>${pc}</span></div>
      <div class="pr2"><span>This week</span><span><i style="display:block;width:${d.week.length ? wc / d.week.length * 100 : 0}%"></i></span><span>${wc}</span></div>
      <div class="tryit"><span><b style="font-weight:500">Try this:</b> ${esc(TRY_THIS[k] || 'Say what happened in one plain sentence.')}</span>${mod ? `<button class="btn ghost sm" data-mod="${mod}">Practice this</button>` : ''}</div></div>`; }).join('') : '<p class="muted">No strong patterns in your recent analyses.</p>'}</div>
    ${S.prefs.weeklyCard !== false ? `<div class="wk"><h2>Your Saywell reflection</h2><p>You analyzed ${d.week.length} message${d.week.length === 1 ? '' : 's'} this week.</p>${ctxTop ? `<p>The situations you explored most often involved ${esc(CTX_NAME[ctxTop[0]] || ctxTop[0].toLowerCase())}.</p>` : ''}${top ? `<p>One pattern that came up repeatedly was ${esc(pn(top[0]))}.</p>` : ''}
      <p class="muted" style="margin-top:6px">Choose one skill to work on next week:</p><div class="chips" id="wk-c">${[['m1', 'Observation'], ['m4', 'Requests'], ['m5', 'Owning feelings'], ['m6', 'Boundaries'], ['m7', 'Listening']].map(([id, l]) => `<button class="chip" data-mod="${id}" aria-pressed="${S.prefs.focus === id}" data-focus="${id}">${l}</button>`).join('')}</div></div>` : ''}`;
    b.onclick = e => {
      const t = e.target.closest('[data-mod]'); if (!t) return;
      if (t.dataset.focus) { savePrefs({ focus: t.dataset.focus }); }
      S.go('learn', { module: t.dataset.mod });
    };
  }
};
