importScripts('config.js');

/* ---------- right-click menu: one SAYWELL entry, three choices ---------- */
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    const m = (id, title, parentId) => chrome.contextMenus.create({ id, title, contexts: ['selection'], ...(parentId ? { parentId } : {}) });
    m('sw', 'SAYWELL'); m('sw-analyze', 'Analyze selection', 'sw'); m('sw-rewrite', 'Rewrite selection', 'sw'); m('sw-open', 'Open full editor', 'sw');
  });
});

const openWeb = (text, o) => chrome.tabs.create({ url: SW.webUrl(text, o) });

/* runs inside the page, only after the user asks: the selection, or the focused text box */
function readText() {
  const s = String(window.getSelection() || '').trim(); if (s) return s;
  const a = document.activeElement;
  if (a && (a.tagName === 'TEXTAREA' || (a.tagName === 'INPUT' && /text|search/.test(a.type)))) return String(a.value || '').trim();
  if (a && a.isContentEditable) return String(a.innerText || '').trim();
  return '';
}

/* draws the small on-page card (card.js) and fills it in step by step */
async function showCard(tabId, text, opts = {}) {
  try { await chrome.scripting.executeScript({ target: { tabId }, files: ['card.js'] }); } catch { return; } // page not scriptable
  const send = m => chrome.tabs.sendMessage(tabId, m).catch(() => {});
  const tip = !(await chrome.storage.local.get('tipSeen')).tipSeen;
  if (!text || text.length < 3) return send({ type: 'sw-show', phase: 'empty' });
  await send({ type: 'sw-show', phase: 'loading', text });
  try {
    const res = await SW.api('/api/ext', { text: text.slice(0, 1500), mode: 'clearer' });
    await send({ type: 'sw-show', phase: 'result', text, model: SW.view(res), reveal: !!opts.reveal, tip });
    if (tip) chrome.storage.local.set({ tipSeen: true });
  } catch (e) {
    await send({ type: 'sw-show', phase: 'error', text, message: e.server ? e.message : SW.CALM_ERR });
  }
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const text = (info.selectionText || '').trim();
  if (info.menuItemId === 'sw-open') return openWeb(text, { go: 'analyze' });
  if (tab?.id && (info.menuItemId === 'sw-analyze' || info.menuItemId === 'sw-rewrite')) showCard(tab.id, text, { reveal: info.menuItemId === 'sw-rewrite' });
});

chrome.commands.onCommand.addListener(async cmd => {
  if (cmd !== 'check-text') return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || /^(chrome|edge|about):/.test(tab.url || '')) return;
  try { const [r] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: readText }); await showCard(tab.id, r?.result || ''); } catch { /* page not scriptable */ }
});

/* requests coming from the on-page card */
chrome.runtime.onMessage.addListener((m, _s, reply) => {
  if (m?.type === 'sw-rewrite') {
    SW.api('/api/ext', { text: String(m.text || '').slice(0, 1500), mode: m.mode }).then(res => reply({ ok: true, model: SW.view(res) })).catch(e => reply({ ok: false, message: e.server ? e.message : SW.CALM_ERR }));
    return true;
  }
  if (m?.type === 'sw-open') { openWeb(m.text, { go: m.go || 'analyze', tool: m.tool }); }
});
