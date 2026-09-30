import { $, esc, copy, toast, chips } from '../util.js';
import { post } from '../api.js';
import { S } from '../state.js';

const KINDS = {
  no: { t: 'Say no', ph: 'e.g. My friend keeps inviting me out and I am too tired to go.', d: 'Kind, direct, firm or short. Pick the one that sounds like you.' },
  boundary: { t: 'Set a boundary', ph: 'e.g. My colleague messages me about work at midnight.', d: 'What happened, what you are not available for, and what you will do.' },
  apology: { t: 'Apologize', ph: 'e.g. I said something really rude to my sister yesterday.', d: 'Simple, accountable, or with repair. Never grovelling.' },
  opener: { t: 'Start a hard talk', ph: 'e.g. I need to talk to my friend about something uncomfortable.', d: 'Four gentle ways to begin the conversation.' }
};
let kind = 'no', hooks = null;
export default {
  init(el) {
    el.innerHTML = `<p class="kick" style="color:var(--gold);letter-spacing:.3em;font-size:11px">TOOLKIT</p><h1 style="font-size:clamp(30px,4vw,48px)">Small tools for hard moments.</h1><p class="muted" style="margin:6px 0 20px;max-width:56ch">Pick what you need. Tell Saywell what is going on, in your own words.</p>
    <div class="chips tkt" id="tk-k"></div><p class="muted" id="tk-d"></p>
    <textarea id="tk-t" rows="4" maxlength="1200" style="margin:12px 0"></textarea>
    <div class="chips tkt" id="tk-w"></div>
    <div style="display:flex;gap:12px;align-items:center;margin-bottom:26px"><button class="btn pri" id="tk-go">Build it →</button><span class="muted" id="tk-s" aria-live="polite"></span></div>
    <div class="tk" id="tk-o" aria-live="polite"></div>`;
    const drawKinds = () => chips($('tk-k'), Object.entries(KINDS).map(([k, v]) => [k, v.t]), { value: kind, onChange: v => { kind = v || kind; sync(); } }); drawKinds();
    chips($('tk-w'), ['Partner', 'Friend', 'Family', 'College', 'Work'], { none: true, onChange: v => { el.dataset.who = v || ''; } });
    const sync = () => { $('tk-d').textContent = KINDS[kind].d; $('tk-t').placeholder = KINDS[kind].ph; }; sync(); hooks = { drawKinds, sync };
    $('tk-go').onclick = async () => {
      const text = $('tk-t').value.trim(); if (text.length < 4) return toast('Tell Saywell a little more first.');
      $('tk-go').disabled = true; $('tk-s').textContent = 'Finding the words…'; $('tk-o').innerHTML = '';
      try {
        const r = await post('/api/build', { kind, text, who: el.dataset.who || '' });
        if (r.safety?.flag) $('tk-o').innerHTML = `<p class="muted">${esc(r.safety.note)}</p>`;
        else $('tk-o').innerHTML = (r.options || []).map((o, i) => `<div class="opt" style="animation-delay:${i * 90}ms"><b>${esc(o.label)}</b><p>${esc(o.text)}</p><small>${esc(o.why)}</small><div style="margin-top:10px"><button class="btn ghost sm" data-c="${i}">Copy</button></div></div>`).join('') + (r.tip ? `<p class="muted">${esc(r.tip)}</p>` : '');
        S.tk = r.options || [];
      } catch (e) { $('tk-o').innerHTML = `<p class="muted">${esc(e.message)}</p>`; }
      $('tk-go').disabled = false; $('tk-s').textContent = '';
    };
    $('tk-o').onclick = async e => { const b = e.target.closest('[data-c]'); if (b) toast((await copy(S.tk[+b.dataset.c].text)) ? 'Copied' : 'Could not copy'); };
  },
  async show(p = {}) { // the browser extension can open a tool with the text already filled in
    if (p.tool && KINDS[p.tool] && hooks) { kind = p.tool; hooks.drawKinds(); hooks.sync(); }
    if (p.text && hooks) $('tk-t').value = String(p.text).slice(0, 1200);
  }
};
