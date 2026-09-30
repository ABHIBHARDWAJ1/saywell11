import { $, esc, qa } from '../util.js';
import { S } from '../state.js';
import { listOf, loadProgress, saveProgress } from '../store.js';
import { MODULES, MOD_BY_ID, PATTERN_MODULE, FEEL, FEEL_NOTE, NEEDS, PATTERNS, GUIDE_PROSE, GUIDE_TABS } from '../data.js';

/* ================= LEARN ================= */
let prog, dq = null, root;
const doneCount = () => Object.values(prog.modules || {}).filter(m => m.done).length;

async function suggestion() {
  try {
    const l = await listOf('analyses', 60), c = {};
    l.forEach(x => (x.result?.patterns || []).forEach(p => { c[p.type] = (c[p.type] || 0) + 1; }));
    const top = Object.entries(c).sort((a, b) => b[1] - a[1])[0];
    const id = top && PATTERN_MODULE[top[0]];
    if (!id || prog.modules?.[id]?.done) return '';
    const names = { m1: 'observations and judgments', m4: 'requests and demands', m5: 'owning your feelings', m2: 'feelings and thoughts', m6: 'boundaries' };
    return `<div class="suggest"><span>You often work with ${names[id] || 'this skill'}. Want to practice that difference?</span><button class="btn pri sm" data-open="${id}">Practice now</button></div>`;
  } catch { return ''; }
}

async function drawHome() {
  const n = doneCount(), pct = Math.round(n / MODULES.length * 100), sug = await suggestion();
  root.querySelector('#l-body').innerHTML = `<div class="jrn"><h2>Your NVC journey</h2><div class="pbar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div><span class="muted">${n} of ${MODULES.length} lessons · ${prog.correct || 0} of ${prog.answered || 0} drill answers correct</span></div>${sug}
  <div class="mods">${MODULES.map((m, i) => { const st = prog.modules?.[m.id]; return `<button class="mod" data-open="${m.id}"><span>Lesson ${i + 1}${st?.done ? ' · <b class="done" style="font:inherit">Done</b>' : ''}</span><b>${esc(m.title)}</b><span>${st?.done ? `${st.correct} of ${st.total} right last time` : m.drills.length + ' quick questions'}</span></button>`; }).join('')}</div>`;
}
function drawLesson(id) {
  const m = MOD_BY_ID[id]; dq = { m, i: 0, correct: 0, stage: 'intro' };
  root.querySelector('#l-body').innerHTML = `<div class="less"><button class="lnk" data-back>← All lessons</button><h2 style="margin-top:14px">${esc(m.title)}</h2><p class="lt">${esc(m.intro)}</p>
    <div class="eg"><div><small>Instead of</small><p class="serif">${esc(m.bad)}</p></div><div><small>Try</small><p class="serif">${esc(m.good)}</p></div></div><button class="btn pri" data-start>Start the questions</button></div>`;
}
function drawQ() {
  const { m, i } = dq, d = m.drills[i];
  root.querySelector('#l-body').innerHTML = `<div class="less drill"><button class="lnk" data-back>← All lessons</button><p class="muted" style="margin-top:14px">${esc(m.title)} · Question ${i + 1} of ${m.drills.length}</p><p class="st">${esc(d[0])}</p>
    <div class="ans"><button class="btn ghost" data-a="0">${esc(d[1][0])}</button><button class="btn ghost" data-a="1">${esc(d[1][1])}</button></div><p class="why" id="l-why" aria-live="polite"></p><button class="btn pri" data-next hidden>Next</button></div>`;
}
async function answer(k) {
  const { m, i } = dq, d = m.drills[i], ok = k === d[2]; if (ok) dq.correct++;
  prog.answered = (prog.answered || 0) + 1; if (ok) prog.correct = (prog.correct || 0) + 1;
  qa('[data-a]', root).forEach(b => { b.disabled = true; if (+b.dataset.a === d[2]) b.style.borderColor = 'var(--sage)'; });
  $('l-why').textContent = (ok ? 'Right. ' : 'Not quite. ') + d[3];
  const nx = root.querySelector('[data-next]'); nx.hidden = false; nx.textContent = i + 1 < m.drills.length ? 'Next' : 'See result'; nx.focus();
}
async function finishLesson() {
  const { m, correct } = dq; prog.modules = { ...(prog.modules || {}), [m.id]: { done: true, correct, total: m.drills.length } }; saveProgress(prog);
  const next = MODULES[MODULES.findIndex(x => x.id === m.id) + 1];
  root.querySelector('#l-body').innerHTML = `<div class="less"><h2>${correct} of ${m.drills.length} right.</h2><p class="lt">${correct === m.drills.length ? 'Clean sweep.' : 'The difference is subtle. It gets easier with repeats.'} Notice the wording that tipped each one.</p>
    <div class="chips">${next ? `<button class="btn pri" data-open="${next.id}">Next: ${esc(next.title)}</button>` : ''}<button class="btn ghost" data-open="${m.id}">Do it again</button><button class="btn ghost" data-back>All lessons</button></div></div>`;
}

export const learn = {
  async init(el) {
    root = el; prog = await loadProgress();
    el.insertAdjacentHTML('beforeend', `<div class="vh"><h1>Learn to say it yourself.</h1><p>Eight short lessons. The goal is that you need Saywell a little less each month.</p></div><div id="l-body"></div>`);
    el.addEventListener('click', e => {
      const t = e.target.closest('[data-open],[data-back],[data-start],[data-a],[data-next]'); if (!t) return;
      if (t.dataset.open) drawLesson(t.dataset.open);
      else if ('back' in t.dataset) drawHome();
      else if ('start' in t.dataset) drawQ();
      else if (t.dataset.a !== undefined) answer(+t.dataset.a);
      else if ('next' in t.dataset) { dq.i++; dq.i < dq.m.drills.length ? drawQ() : finishLesson(); }
    });
  },
  async show(p = {}) { prog = await loadProgress(); if (p.module) drawLesson(p.module); else drawHome(); }
};

/* ================= GUIDE ================= */
let gtab = 'Feelings', gsel = null;
function drawGuide() {
  const b = $('g-body');
  $('g-tabs').innerHTML = GUIDE_TABS.map(t => `<button role="tab" aria-selected="${t === gtab}" data-t="${esc(t)}">${esc(t)}</button>`).join('');
  if (gtab === 'Feelings') {
    b.innerHTML = `<p class="muted" style="margin-bottom:14px">${esc(FEEL_NOTE)}</p><div class="gg">${Object.keys(FEEL).map(k => `<button data-f="${k}" aria-pressed="${gsel === k}">${k}</button>`).join('')}</div>${gsel ? feelCard(gsel) : ''}`;
  } else if (gtab === 'Needs') {
    b.innerHTML = `<div class="gg">${Object.keys(NEEDS).map(k => `<button data-n="${k}" aria-pressed="${gsel === k}">${k}</button>`).join('')}</div>${gsel ? needCard(gsel) : '<p class="muted">Pick a need to see what it means and requests that could support it.</p>'}`;
  } else if (gtab === 'Patterns') {
    b.innerHTML = `<div class="prose"><p>These are patterns Saywell may notice. They are habits of language, not flaws in a person.</p></div>${PATTERNS.map(([n, d, a, c]) => `<div class="pat"><b>${esc(n)}</b><span>${esc(d)}</span><span class="l">Instead of ${esc(a)}, try ${esc(c)}</span></div>`).join('')}`;
  } else b.innerHTML = `<div class="prose">${GUIDE_PROSE[gtab] || ''}</div>`;
}
const feelCard = k => { const f = FEEL[k]; return `<div class="gd"><h3>${k}</h3><div><h4>You might be feeling</h4><p>${f.like.map(x => `<span class="pill f">${esc(x)}</span>`).join('')}</p></div><div><h4>Often connected to needs like</h4><p>${f.needs.map(x => `<span class="pill n">${esc(x)}</span>`).join('')}</p></div><div><h4>Try saying</h4><p class="say">${esc(f.say)}</p></div><div><button class="btn pri sm" data-prac="${esc(f.say)}">Practice this</button></div></div>`; };
const needCard = k => { const n = NEEDS[k]; return `<div class="gd"><h3>${k}</h3><p>${esc(n.what)}</p><div><h4>Possible requests</h4>${n.reqs.map(r => `<p class="say" style="margin-bottom:10px">${esc(r)}</p>`).join('')}</div>
  <div class="gen"><h4>Turn this need into your own request</h4><input type="text" id="g-who" placeholder="Who is it for? (a friend, my manager…)" aria-label="Who is it for"><input type="text" id="g-what" placeholder="What is the situation? (plans keep changing…)" aria-label="What is the situation"><button class="btn ghost sm" data-gen="${k}" style="justify-self:start">Build my request</button><p id="g-out" aria-live="polite"></p></div></div>`; };

export const guide = {
  init(el) {
    el.insertAdjacentHTML('beforeend', `<div class="vh"><h1>Communication guide</h1><p>Short references for the words that make hard conversations easier.</p></div><div class="gtabs" id="g-tabs" role="tablist"></div><div id="g-body"></div>`);
    el.addEventListener('click', e => {
      const t = e.target.closest('[data-t],[data-f],[data-n],[data-gen],[data-prac]'); if (!t) return;
      if (t.dataset.t) { gtab = t.dataset.t; gsel = null; drawGuide(); }
      else if (t.dataset.f) { gsel = gsel === t.dataset.f ? null : t.dataset.f; drawGuide(); }
      else if (t.dataset.n) { gsel = gsel === t.dataset.n ? null : t.dataset.n; drawGuide(); }
      else if (t.dataset.gen) {
        const need = t.dataset.gen, who = $('g-who').value.trim() || 'you', what = $('g-what').value.trim() || 'this keeps happening';
        $('g-out').innerHTML = `<span class="serif" style="font-size:18px">“When ${esc(what)}, ${esc(need.toLowerCase())} matters to me. ${esc(NEEDS[need].reqs[0])}”</span><br><span class="muted">Edit it until it sounds like you, addressed to ${esc(who)}.</span>`;
      } else if (t.dataset.prac) S.go('practice', { custom: `You need to say this to someone close: "${t.dataset.prac}"`, draft: '' });
    });
  },
  show(p = {}) { if (p.tab && GUIDE_TABS.includes(p.tab)) { gtab = p.tab; gsel = null; } drawGuide(); }
};
