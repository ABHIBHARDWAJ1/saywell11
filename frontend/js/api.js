import { API } from '../config.js';
import { S } from './state.js';

export async function post(path, body, { auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) { if (!S.user) throw new Error('Please sign in to continue.'); headers.Authorization = 'Bearer ' + await S.user.getIdToken(); }
  let r;
  try { r = await fetch(API + path, { method: 'POST', headers, body: JSON.stringify(body) }); }
  catch { throw new Error("Couldn't reach SAYWELL. Check your connection. If the server was asleep, wait a few seconds and try again."); }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'Something went wrong. Try again.');
  return j;
}
export const pex = (q, type = 'photos') => fetch(`${API}/api/pexels?type=${type}&q=${encodeURIComponent(q)}`).then(r => r.json()).catch(() => []);
export const classifyText = async text => { try { return await post('/api/classify', { text }, { auth: false }); } catch { return null; } };
