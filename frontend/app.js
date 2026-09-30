import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { firebaseConfig } from './config.js';
import { S } from './js/state.js';
import { $, ic, qa, toast } from './js/util.js';
import { loadPrefs } from './js/store.js';
import { initLanding } from './js/landing.js';
import { runOnboarding } from './js/onboarding.js';
import home from './js/views/home.js';
import analyze from './js/views/analyze.js';
import { reply, repair } from './js/views/reply.js';
import practice from './js/views/practice.js';
import { learn, guide } from './js/views/learn.js';
import { library, history } from './js/views/space.js';
import insights from './js/views/insights.js';
import settings from './js/views/settings.js';
import toolkit from './js/views/toolkit.js';
import { setBg } from './js/bg.js';

const fb = initializeApp(firebaseConfig);
S.auth = getAuth(fb); S.db = getFirestore(fb);

const VIEWS = { home, analyze, reply, repair, toolkit, practice, learn, guide, library, history, insights, settings };
const LABEL = { home: 'Home', analyze: 'Analyze', reply: 'Reply', repair: 'Repair', toolkit: 'Toolkit', practice: 'Conversations', learn: 'Learn', guide: 'Guide', library: 'Library', history: 'History', insights: 'Insights', settings: 'Settings' };
const GROUPS = { communicate: ['analyze', 'reply', 'repair', 'toolkit'], practice: ['practice', 'learn', 'guide'], library: ['library', 'history'] };
const groupOf = v => Object.keys(GROUPS).find(g => GROUPS[g].includes(v));
const lastIn = { communicate: 'analyze', practice: 'practice', library: 'library' };
let ready = {};

/* ---------- sign in / out ---------- */
const login = () => signInWithPopup(S.auth, new GoogleAuthProvider()).catch(e => { if (!/popup-closed|cancelled/.test(e.code)) toast('Sign-in failed: ' + (e.code || 'try again')); });
const logout = () => signOut(S.auth);
S.login = login; S.logout = logout;
$('auth').onclick = login;

/* ---------- shell ---------- */
function buildNav() {
  const a = v => `<a data-v="${v}" role="link" tabindex="0">${ic(v)}<span>${LABEL[v]}</span></a>`;
  $('side').innerHTML = `<a class="logo" data-v="home">SAYWELL</a>${a('home')}
    <div class="grp">Communicate</div>${GROUPS.communicate.map(a).join('')}
    <div class="grp">Practice</div>${GROUPS.practice.map(a).join('')}
    <div class="grp">Your space</div>${['library', 'history', 'insights'].map(a).join('')}
    <div class="sp"></div><a class="get" href="downloads/saywell-extension.zip" download>${ic('get')}<span>Get the extension<small>Chrome, free, .zip</small></span></a>${a('settings')}<a data-act="out" role="button" tabindex="0">${ic('out')}<span>Sign out</span></a>`;
  const b = (id, v, l, i) => `<a data-nav="${id}" data-v="${v}" role="link" tabindex="0">${ic(i)}<span>${l}</span></a>`;
  $('bottom').innerHTML = b('home', 'home', 'Home', 'home') + b('communicate', 'analyze', 'Analyze', 'comm') + b('practice', 'practice', 'Practice', 'practice') + b('library', 'library', 'Library', 'library') + `<a data-act="more" role="button" tabindex="0">${ic('more')}<span>More</span></a>`;
}
const sheet = $('sheet');
function openSheet() {
  sheet.hidden = false;
  sheet.innerHTML = `<div><a data-v="reply">${ic('reply')}Reply</a><a data-v="repair">${ic('repair')}Repair</a><a data-v="toolkit">${ic('toolkit')}Toolkit</a><a data-v="learn">${ic('learn')}Learn</a><a data-v="guide">${ic('guide')}Guide</a><a data-v="history">${ic('history')}History</a><a data-v="insights">${ic('insights')}Insights</a><a data-v="settings">${ic('settings')}Settings</a><a href="downloads/saywell-extension.zip" download>${ic('get')}Get the extension</a><a data-act="out">${ic('out')}Sign out</a></div>`;
}
sheet.onclick = e => { if (e.target === sheet) sheet.hidden = true; };
document.addEventListener('click', e => {
  const t = e.target.closest('[data-v],[data-act]'); if (!t || !$('app').contains(t)) return;
  if (t.dataset.act === 'out') { sheet.hidden = true; logout(); }
  else if (t.dataset.act === 'more') openSheet();
  else if (t.dataset.v) { sheet.hidden = true; S.go(t.dataset.v); }
});
document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('#app a[role=link],#app a[role=button]')) { e.preventDefault(); e.target.click(); } });

S.go = (view, params) => {
  S.pending = params || null;
  if (location.hash === '#/' + view) route(); else location.hash = '#/' + view;
};

async function route() {
  if (!S.user) return;
  let v = location.hash.replace(/^#\/?/, '').split('?')[0];
  if (!VIEWS[v]) v = 'home';
  const mod = VIEWS[v], el = $('v-' + v), params = S.pending || {}; S.pending = null;
  qa('.view').forEach(x => x.hidden = x !== el);
  if (!ready[v]) {
    const g0 = groupOf(v); if (g0) el.prepend(Object.assign(document.createElement('div'), { className: 'seg' }));
    await mod.init(el); ready[v] = true;
  }
  const g = groupOf(v);
  if (g) { lastIn[g] = v; const seg = el.querySelector(':scope>.seg'); if (seg) seg.innerHTML = GROUPS[g].map(x => `<a data-v="${x}" class="${x === v ? 'on' : ''}">${LABEL[x]}</a>`).join(''); }
  qa('#side a[data-v]').forEach(a => a.classList.toggle('on', a.dataset.v === v && !a.classList.contains('logo')));
  qa('#bottom a[data-nav]').forEach(a => { const id = a.dataset.nav; a.classList.toggle('on', id === v || id === g); a.dataset.v = id === 'communicate' ? lastIn.communicate : id === 'practice' ? lastIn.practice : id === 'library' ? lastIn.library : id; });
  window.scrollTo(0, 0); setBg(v);
  await mod.show(params);
}
window.addEventListener('hashchange', route);

/* ---------- preferences applied to the whole app ---------- */
S.applyPrefs = () => {
  $('app').dataset.theme = S.prefs.theme === 'light' ? 'light' : 'dark';
  $('onb').dataset.theme = $('app').dataset.theme;
  document.documentElement.classList.toggle('light-off', S.prefs.theme === 'light');
  document.documentElement.dataset.motion = S.prefs.reduceMotion ? 'reduce' : '';
};

/* ---------- landing + auth state ---------- */
initLanding(login);
buildNav();
{ // the browser extension opens the app as  #t=<text>&run=1
  const h = new URLSearchParams(location.hash.slice(1)), t = h.get('t');
  if (t) { const go = ['analyze', 'toolkit'].includes(h.get('go')) ? h.get('go') : 'analyze'; S.pending = { go, text: t, run: go === 'analyze' && h.get('run') === '1', tool: h.get('tool') || '' }; history.replaceState(null, '', location.pathname); }
}
onAuthStateChanged(S.auth, async u => {
  S.user = u; S.cache = {}; ready = {};
  $('land').hidden = !!u; $('app').hidden = !u; document.querySelector('.lh').hidden = !!u;
  if (!u) { $('onb').hidden = true; window.scrollTo(0, 0); setBg('hero'); return; }
  await loadPrefs(); S.applyPrefs();
  if (!S.prefs.onboarded) await runOnboarding();
  const go = S.pending?.go || (location.hash.startsWith('#/') ? location.hash.slice(2) : 'home');
  if (S.pending?.go) S.pending = { ...S.pending, go: undefined };
  if (location.hash === '#/' + go) route(); else location.hash = '#/' + go;
});
