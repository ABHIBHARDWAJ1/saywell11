/* SAYWELL extension: shared settings + helpers (loaded by popup.html and background.js).
   After you deploy: set API to your Render URL and WEB to your Vercel URL, and add the same API URL to host_permissions in manifest.json. */
self.SW = (() => {
  const API = 'https://saywell11.onrender.com', WEB = 'https://saywell11.vercel.app/';
  const N = { judgment: 'Judgment', blame: 'Blame', absolute: 'Absolute language', demand: 'Demand', vague_request: 'Unclear request', sarcasm: 'Possible sarcasm' };
  const H = {
    judgment: 'Describes what someone is, not what happened.', blame: 'Hands the cause of a feeling to the other person.', absolute: 'Turns one moment into a rule.',
    demand: 'Leaves no room for a no.', vague_request: 'Hard to say yes to. Try one specific thing.', sarcasm: 'May hide the real feeling underneath.'
  };
  const MODES = { clearer: 'Clearer', kinder: 'Kinder', firmer: 'Firmer', shorter: 'Shorter' };

  async function api(path, body, ms = 60000) { // 60 s: a sleeping free server can take a while to wake up
    const c = new AbortController(), t = setTimeout(() => c.abort(), ms);
    try {
      const r = await fetch(API + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: c.signal });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw Object.assign(new Error(j.error || 'Something went wrong.'), { server: true, status: r.status });
      return j;
    } finally { clearTimeout(t); }
  }
  async function ping(ms = 5000) {
    const c = new AbortController(), t = setTimeout(() => c.abort(), ms);
    try { return (await fetch(API + '/', { signal: c.signal })).ok; } catch { return false; } finally { clearTimeout(t); }
  }
  const webUrl = (text, o = {}) => WEB + '#t=' + encodeURIComponent(String(text || '').slice(0, 4000)) + '&go=' + (o.go || 'analyze') + (o.tool ? '&tool=' + o.tool : '') + (o.run ? '&run=1' : '');

  function headline(n, short) {
    if (n === 0) return 'No strong patterns noticed';
    if (n === 1) return 'One thing stood out';
    if (n > 3) return 'A few things stood out';
    return short ? n + ' patterns noticed' : 'We noticed ' + n + ' things';
  }
  /* turns a server reply into what the UI needs, so popup and page card stay identical */
  function view(res) {
    const items = [
      ...(res.patterns || []).map(p => ({ key: p.type, phrase: p.phrase || '', why: p.why || H[p.type] || '' })),
      ...(res.tags || []).filter(k => !(res.patterns || []).some(p => p.type === k)).map(k => ({ key: k, phrase: '', why: H[k] || '' }))
    ].filter(o => N[o.key]).map(o => ({ label: N[o.key], phrase: o.phrase, why: o.why }));
    const safety = !!res.safety?.flag;
    return {
      safety, safetyNote: safety ? (res.safety.note || '') : '', soft: !safety && (res.tags || []).includes('threat'),
      items, headline: safety ? 'Safety-sensitive wording noticed' : headline(items.length), shortHeadline: safety ? 'Safety-sensitive wording noticed' : headline(items.length, true),
      suggestion: res.suggestion?.text ? { text: res.suggestion.text, why: res.suggestion.why || '' } : null, offline: !!res.offline, mode: res.mode || 'clearer'
    };
  }
  const CALM_ERR = "Saywell couldn't reach the analysis service.";
  return { API, WEB, N, H, MODES, api, ping, webUrl, view, headline, CALM_ERR };
})();
