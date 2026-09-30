import { collection, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, writeBatch, query, orderBy, limit, getDocs, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { S, DEFAULT_PREFS } from './state.js';

const col = name => collection(S.db, 'users', S.user.uid, name);
const norm = d => { const x = d.data({ serverTimestamps: 'estimate' }); return { id: d.id, ref: d.ref, ...x, at: x.createdAt?.toDate?.() || new Date() }; };
const bust = () => { S.cache = {}; };

export async function addTo(name, data) { const r = await addDoc(col(name), { ...data, createdAt: serverTimestamp() }); bust(); return r; }
export async function listOf(name, n = 100) {
  const key = name + n; if (S.cache[key]) return S.cache[key];
  const s = await getDocs(query(col(name), orderBy('createdAt', 'desc'), limit(n)));
  return (S.cache[key] = s.docs.map(norm));
}
export async function patch(ref, data) { await updateDoc(ref, data); bust(); }
export async function removeRef(ref) { await deleteDoc(ref); bust(); }

export async function loadPrefs() {
  try { const d = await getDoc(doc(S.db, 'users', S.user.uid, 'meta', 'prefs')); S.prefs = { ...DEFAULT_PREFS, ...(d.exists() ? d.data() : {}) }; S.prefsExisted = d.exists() && d.data().onboarded !== undefined; }
  catch { S.prefs = { ...DEFAULT_PREFS }; }
  return S.prefs;
}
export function savePrefs(p) { S.prefs = { ...S.prefs, ...p }; return setDoc(doc(S.db, 'users', S.user.uid, 'meta', 'prefs'), S.prefs, { merge: true }).catch(() => {}); }

const DEF_PROG = { idx: 0, correct: 0, answered: 0, modules: {} };
export async function loadProgress() { try { const g = await getDoc(doc(S.db, 'users', S.user.uid, 'meta', 'progress')); return { ...DEF_PROG, ...(g.exists() ? g.data() : {}) }; } catch { return { ...DEF_PROG }; } }
export const saveProgress = p => setDoc(doc(S.db, 'users', S.user.uid, 'meta', 'progress'), p).catch(() => {});

export async function wipe(names) {
  for (const n of names) { const s = await getDocs(col(n)); for (let i = 0; i < s.docs.length; i += 400) { const b = writeBatch(S.db); s.docs.slice(i, i + 400).forEach(d => b.delete(d.ref)); await b.commit(); } }
  bust();
}
export async function exportAll() {
  const out = { exportedAt: new Date().toISOString() };
  for (const k of ['analyses', 'library', 'practice']) { const s = await getDocs(col(k)); out[k] = s.docs.map(d => { const x = d.data(); return { id: d.id, ...x, createdAt: x.createdAt?.toDate?.() }; }); }
  out.preferences = S.prefs; out.progress = await loadProgress();
  return out;
}
export async function wipeMeta() {
  for (const id of ['prefs', 'progress']) await deleteDoc(doc(S.db, 'users', S.user.uid, 'meta', id)).catch(() => {});
}
