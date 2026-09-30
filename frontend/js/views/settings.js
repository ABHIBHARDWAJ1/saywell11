import { $, esc, chips, toast } from '../util.js';
import { S } from '../state.js';
import { savePrefs, wipe, wipeMeta, exportAll } from '../store.js';
import { CONTACT_EMAIL } from '../../config.js';

const AUTH_URL = 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
const CTXS = ['Partner', 'Friend', 'Family', 'College', 'Work'];
const TONES = ['Natural', 'Gentle', 'Direct', 'Warm', 'Firm'];
const LANGS = [['auto', 'Auto-detect'], ['english', 'English'], ['hinglish', 'Hinglish']];
const LENS = [['one_line', 'One line'], ['short', 'Short'], ['normal', 'Normal'], ['detailed', 'Detailed']];

const section = (title, body) => `<section class="sg"><h2>${title}</h2>${body}</section>`;
const toggle = (id, label, hint) => `<div><label class="tg"><input type="checkbox" id="${id}"><i></i>${label}</label>${hint ? `<p class="hint">${hint}</p>` : ''}</div>`;

async function deleteAccount() {
  if (!confirm('Delete your account and everything saved in it? This cannot be undone.')) return;
  const btn = $('st-acc'); btn.disabled = true;
  try {
    const { deleteUser, reauthenticateWithPopup, GoogleAuthProvider } = await import(AUTH_URL);
    const run = async () => { await wipe(['analyses', 'library', 'practice']); await wipeMeta(); await deleteUser(S.auth.currentUser); };
    try { await run(); }
    catch (e) { if (e.code === 'auth/requires-recent-login') { await reauthenticateWithPopup(S.auth.currentUser, new GoogleAuthProvider()); await run(); } else throw e; }
    toast('Your account was deleted.');
  } catch (e) { toast('Could not delete the account: ' + (e.code || e.message)); }
  btn.disabled = false;
}

export default {
  init(el) {
    el.innerHTML = `<div class="vh"><h1>Settings</h1></div>
    ${section('Account', `<div class="acct"><span id="st-av"></span><div><b id="st-name"></b><div class="muted" id="st-mail"></div></div></div><div><button class="btn ghost" id="st-out">Sign out</button></div>`)}
    ${section('Communication', `<div><p class="muted" style="margin-bottom:8px">Default context</p><div class="chips" id="st-ctx"></div></div><div><p class="muted" style="margin-bottom:8px">Default tone</p><div class="chips" id="st-tone"></div></div>
      <div><p class="muted" style="margin-bottom:8px">Language</p><div class="chips" id="st-lang"></div></div>${toggle('st-kh', 'Keep my Hinglish and slang', 'Rewrites stay in the way you write, not a formal version of it.')}
      <div><p class="muted" style="margin-bottom:8px">Default length</p><div class="chips" id="st-len"></div></div>
      <div><p class="muted" style="margin-bottom:6px">Voice</p><input type="range" id="st-voice" min="0" max="100" aria-label="More like me to more polished"><div class="ends"><span>More like me</span><span>More polished</span></div></div>`)}
    ${section('Privacy', `${toggle('st-sh', 'Save my analyses to history', 'When off, nothing you analyze is saved to Saywell history. You can also skip saving for a single message on Analyze. The text is still sent to the server to be analyzed.')}
      <div class="chips"><button class="btn ghost" id="st-exp">Export my data</button><button class="btn ghost" id="st-del">Delete all history</button><button class="btn ghost" id="st-acc">Delete account</button></div>`)}
    ${section('Experience', `<div><p class="muted" style="margin-bottom:8px">Theme</p><div class="chips" id="st-theme"></div></div>${toggle('st-rm', 'Reduce motion')}${toggle('st-wk', 'Show my weekly reflection on Insights')}`)}
    ${section('About', `<div class="about"><a href="model.html">How the pattern detector was built (model card)</a><a href="privacy.html">Privacy policy</a><a href="terms.html">Terms</a>${CONTACT_EMAIL ? `<a href="mailto:${esc(CONTACT_EMAIL)}">Contact</a>` : ''}</div>
      <p class="muted" style="max-width:60ch">Saywell is built on the ideas of Nonviolent Communication: observations, feelings, needs and requests. It is a communication coach. It is not therapy or a crisis service.</p>`)}`;
    const P = (k, v) => savePrefs({ [k]: v }).then(() => toast('Saved'));
    chips($('st-ctx'), CTXS, { value: S.prefs.context, onChange: v => v && P('context', v) });
    chips($('st-tone'), TONES, { value: S.prefs.tone === 'Assertive' ? 'Firm' : S.prefs.tone, onChange: v => v && P('tone', v) });
    chips($('st-lang'), LANGS, { value: S.prefs.language, onChange: v => v && P('language', v) });
    chips($('st-len'), LENS, { value: S.prefs.length, onChange: v => v && P('length', v) });
    chips($('st-theme'), [['dark', 'Dark'], ['light', 'Light']], { value: S.prefs.theme, onChange: v => { if (v) { S.prefs.theme = v; S.applyPrefs(); P('theme', v); } } });
    $('st-kh').onchange = () => P('keepHinglish', $('st-kh').checked);
    $('st-voice').onchange = () => P('voice', +$('st-voice').value);
    $('st-sh').onchange = () => P('saveHistory', $('st-sh').checked);
    $('st-rm').onchange = () => { S.prefs.reduceMotion = $('st-rm').checked; S.applyPrefs(); P('reduceMotion', $('st-rm').checked); };
    $('st-wk').onchange = () => P('weeklyCard', $('st-wk').checked);
    $('st-out').onclick = () => S.logout();
    $('st-exp').onclick = async () => {
      try { const out = await exportAll(); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 1)], { type: 'application/json' })); a.download = 'saywell-data.json'; a.click(); }
      catch { toast('Could not export right now. Try again.'); }
    };
    $('st-del').onclick = async () => {
      if (!confirm('Delete all saved analyses, saved phrases and practice sessions? This cannot be undone.')) return;
      try { await wipe(['analyses', 'library', 'practice']); toast('History cleared'); } catch { toast('Could not delete. Try again.'); }
    };
    $('st-acc').onclick = deleteAccount;
  },
  show() {
    const u = S.user, p = S.prefs;
    $('st-name').textContent = u.displayName || 'Signed in'; $('st-mail').textContent = u.email || '';
    $('st-av').innerHTML = u.photoURL ? `<img src="${esc(u.photoURL)}" alt="" referrerpolicy="no-referrer" width="44" height="44" style="border-radius:50%">` : '';
    $('st-kh').checked = !!p.keepHinglish; $('st-voice').value = p.voice ?? 35; $('st-sh').checked = p.saveHistory !== false; $('st-rm').checked = !!p.reduceMotion; $('st-wk').checked = p.weeklyCard !== false;
  }
};
