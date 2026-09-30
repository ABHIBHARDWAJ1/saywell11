/* Cinematic looping video behind every page and section. Two layers crossfade; queries come from Pexels via the backend. */
import { pex } from './api.js';
/* One background for every page: a person chatting on their phone (Pexels). The same clip stays playing across pages,
   so nothing reloads or flickers when you move around. Queries are tried in order until Pexels returns clips. */
export const BG = {};
const QUERIES = ['person texting on smartphone chat', 'typing message on smartphone close up', 'man texting on phone indoors', 'hands typing on mobile phone chat'];
let box, A, B, front = 0, cur = '', clips;
const findClips = () => clips ||= (async () => { for (const q of QUERIES) { const r = await pex(q, 'videos'); if (r && r.length) return r; } return []; })();
function mk() {
  box = document.getElementById('vbg');
  if (!box) { box = document.createElement('div'); box.id = 'vbg'; box.setAttribute('aria-hidden', 'true'); document.body.prepend(box); }
  box.innerHTML = '<video muted loop playsinline preload="auto"></video><video muted loop playsinline preload="auto"></video><div class="vscrim"></div>';
  [A, B] = box.querySelectorAll('video');
}
export async function setBg() { // the key (page or section name) is accepted but ignored: every page uses the same clip
  if (!box) mk();
  const v = (await findClips())[0]; if (!v || cur === v.url) return; cur = v.url;
  const next = front ? A : B, prev = front ? B : A;
  next.poster = v.poster || ''; next.src = v.url;
  const go = () => { next.play().catch(() => {}); next.classList.add('on'); prev.classList.remove('on'); setTimeout(() => { if (!prev.classList.contains('on')) prev.pause(); }, 1600); front = front ? 0 : 1; };
  next.addEventListener('canplay', go, { once: true }); next.load();
}
/* change the video as the visitor scrolls into a section marked data-bg="..." */
export function watchSections(root = document) {
  const els = root.querySelectorAll('[data-bg]'); if (!('IntersectionObserver' in window) || !els.length) return;
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) setBg(e.target.dataset.bg); }), { rootMargin: '-40% 0px -50% 0px' });
  els.forEach(el => io.observe(el));
}
/* soft reveal on scroll */
export function reveal(root = document) {
  const els = root.querySelectorAll('.rv'); if (!('IntersectionObserver' in window)) return els.forEach(e => e.classList.add('in'));
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 });
  els.forEach((el, i) => { el.style.setProperty('--d', (i % 4) * 80 + 'ms'); io.observe(el); });
}
