import { $, esc, chips } from './util.js';
import { S, firstName } from './state.js';
import { savePrefs } from './store.js';

const GOALS = ['I want to communicate better', 'I struggle with conflict', 'I overthink messages', 'I want to set better boundaries', 'I want to learn NVC'];
const WHO = ['Partner', 'Friends', 'Family', 'College', 'Work', 'Everyone'];
const CTX = { Partner: 'Partner', Friends: 'Friend', Family: 'Family', College: 'College', Work: 'Work' };
const line = v => (v < 34 ? 'Could we talk about this tomorrow?' : v > 66 ? 'I need us to talk about this tomorrow.' : "I'd like us to talk about this tomorrow.");

export function runOnboarding() {
  return new Promise(done => {
    const el = $('onb'), st = { goals: [], audiences: [], directness: 50 }; let step = 0;
    el.hidden = false;
    const finish = async () => {
      const tone = st.directness < 34 ? 'Gentle' : st.directness > 66 ? 'Direct' : 'Natural';
      const ctx = st.audiences.map(a => CTX[a]).find(Boolean);
      await savePrefs({ onboarded: true, goals: st.goals, audiences: st.audiences, directness: st.directness, tone, ...(ctx ? { context: ctx } : {}) });
      el.hidden = true; done();
    };
    const skip = async () => { await savePrefs({ onboarded: true }); el.hidden = true; done(); };
    const dots = () => `<div class="dots" aria-hidden="true">${[0, 1, 2, 3].map(i => `<i class="${i <= step ? 'on' : ''}"></i>`).join('')}</div>`;
    const nav = (back, next) => `<div class="nav"><span>${back ? '<button class="lnk" id="ob">Back</button>' : '<button class="lnk" id="os">Skip for now</button>'}</span><button class="btn pri" id="on">${next}</button></div>`;
    const draw = () => {
      let body = '';
      if (step === 0) body = `<h1>What brings you here?</h1><p>Pick any that fit. This only shapes what Saywell shows you first.</p><div class="chips" id="og"></div>${nav(false, 'Continue')}`;
      if (step === 1) body = `<h1>Who do you usually communicate with?</h1><p>Saywell will start with this as your default. You can change it on any message.</p><div class="chips" id="ow"></div>${nav(true, 'Continue')}`;
      if (step === 2) body = `<h1>How should Saywell sound?</h1><p>This sets your default tone. Move it and watch the same sentence change.</p><div class="prev" id="opv">${esc(line(st.directness))}</div><div><input type="range" id="osl" min="0" max="100" value="${st.directness}" aria-label="Softer to direct"><div class="ends"><span>Softer</span><span>Direct</span></div></div>${nav(true, 'Continue')}`;
      if (step === 3) body = `<h1>You're ready, ${esc(firstName())}.</h1><p>Start with a message you have been putting off. Saywell will show what may be underneath it and a few ways to say it.</p>${nav(true, 'Start using Saywell')}`;
      el.innerHTML = `<div class="onb-in">${dots()}${body}</div>`;
      if (step === 0) chips($('og'), GOALS, { multi: true, value: st.goals, onChange: v => st.goals = v });
      if (step === 1) chips($('ow'), WHO, { multi: true, value: st.audiences, onChange: v => st.audiences = v });
      if (step === 2) $('osl').oninput = e => { st.directness = +e.target.value; $('opv').textContent = line(st.directness); };
      const s = $('os'); if (s) s.onclick = skip;
      const b = $('ob'); if (b) b.onclick = () => { step--; draw(); };
      $('on').onclick = () => { if (step === 3) finish(); else { step++; draw(); } };
    };
    draw();
  });
}
