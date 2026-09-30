import { $, esc, qa, chips, safetyBlock, pn } from './util.js';
import { post, pex } from './api.js';
import { S } from './state.js';
import { SAMPLES, DEMOS, FEEDBACK } from './data.js';
import { setBg, watchSections, reveal } from './bg.js';

export function initLanding(login) {
  setBg('hero'); watchSections(document.getElementById('land')); reveal(document.getElementById('land'));

  $('hbtn').onclick = () => { const s = $('hsay'); s.hidden = !s.hidden; $('hbtn').textContent = s.hidden ? 'See the rewrite' : 'Hide the rewrite'; };

  /* before / after tabs */
  const tabs = $('dtabs'); let cur = 0;
  const draw = () => {
    tabs.innerHTML = DEMOS.map((d, i) => `<button role="tab" aria-selected="${i === cur}" data-i="${i}">${esc(d.tab)}</button>`).join('');
    const d = DEMOS[cur];
    $('dba').innerHTML = `<div><h3>Before</h3><blockquote>${esc(d.before)}</blockquote></div><div class="after"><h3>After</h3><blockquote>${esc(d.after)}</blockquote><ul>${d.ch.map(c => `<li>${esc(c)}</li>`).join('')}</ul></div>`;
  };
  tabs.onclick = e => { const b = e.target.closest('button'); if (b) { cur = +b.dataset.i; draw(); } };
  draw();

  /* NVC story: one sentence that grows as you scroll */
  const steps = qa('.stp'), q = $('sq'), lab = $('sq-l');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      steps.forEach(s => s.classList.toggle('on', s === e.target));
      q.classList.add('swap');
      setTimeout(() => { q.textContent = e.target.dataset.q; lab.textContent = e.target.dataset.l; q.classList.remove('swap'); }, 220);
    }), { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach(s => io.observe(s));
  }

  $('fbs').innerHTML = FEEDBACK.map(([t, n]) => `<div><p>${esc(t)}</p><small>${esc(n)}</small></div>`).join('');

  /* try a sample, no account needed */
  const dlg = $('try'), ta = $('tmsg'), res = $('tres');
  const open = () => { dlg.showModal(); ta.focus(); };
  document.querySelectorAll('[data-try]').forEach(b => b.addEventListener('click', open));
  $('cta').onclick = open;
  $('tx').onclick = () => dlg.close();
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  $('tsamples').innerHTML = SAMPLES.slice(0, 3).map((s, i) => `<button class="chip" data-i="${i}">${esc(s.length > 46 ? s.slice(0, 44) + '…' : s)}</button>`).join('');
  $('tsamples').onclick = e => { const b = e.target.closest('.chip'); if (b) { ta.value = SAMPLES[b.dataset.i]; ta.dispatchEvent(new Event('input')); } };
  ta.oninput = () => { $('tcnt').textContent = ta.value.length + ' / 400'; };
  ta.value = SAMPLES[0]; ta.oninput();

  const ctaBlock = `<div class="conv"><p>Want to save rewrites, practice conversations and see your patterns?</p><button class="btn pri" id="tsign">Create your account</button></div>`;
  $('tgo').onclick = async () => {
    const text = ta.value.trim(); if (text.length < 3) return;
    $('tgo').disabled = true; res.innerHTML = '<p class="muted">Reading the words, looking for patterns…</p>';
    try {
      const r = await post('/api/demo', { text }, { auth: false });
      if (r.safety?.flag) { res.innerHTML = safetyBlock(r.safety.note); }
      else {
        const pills = (r.tags || []).map(t => `<span class="pill p">${esc(pn(t))}</span>`).join('');
        const und = [...(r.feelings || []).map(f => `<span class="pill f">${esc(f)}</span>`), ...(r.needs || []).map(f => `<span class="pill n">${esc(f)}</span>`)].join('');
        const rw = (l, x) => x?.text ? `<div class="rwl"><b>${l}</b><p>${esc(x.text)}</p>${x.why ? `<small>${esc(x.why)}</small>` : ''}</div>` : '';
        res.innerHTML = (pills ? `<div><p class="muted">Patterns noticed</p>${pills}</div>` : '<p class="muted">No strong patterns noticed.</p>')
          + (und ? `<div><p class="muted">What might be underneath</p>${und}</div>` : '')
          + (r.offline ? '<p class="muted">The live rewrite is unavailable right now. Try again in a moment, or create an account.</p>' : rw('In your voice', r.natural) + rw('With the NVC steps', r.nvc))
          + ctaBlock;
      }
    } catch (e) { res.innerHTML = `<p class="muted">${esc(e.message)}</p>` + ctaBlock; }
    $('tgo').disabled = false;
    const s = $('tsign'); if (s) s.onclick = () => { dlg.close(); login(); };
  };

  /* scenario cards: sign in first, then land on the right feature */
  qa('[data-go]').forEach(b => b.addEventListener('click', () => { S.pending = { go: b.dataset.go }; if (S.user) S.go(b.dataset.go); else login(); }));
}
