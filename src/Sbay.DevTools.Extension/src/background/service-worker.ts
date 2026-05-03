// MV3 service worker — orchestrates the CDP debugger session and the Copilot bridge.
// Lifecycle: started on devtools open, ended on devtools close.
import { CdpBridge } from '../bridge/cdp-bridge.js';
import { CopilotBridge } from '../bridge/copilot-bridge.js';

type Session = { tabId: number; cdp: CdpBridge; copilot: CopilotBridge };
const sessions = new Map<number, Session>();

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.kind === 'session.attach' && typeof msg.tabId === 'number') {
    void attach(msg.tabId).then(() => sendResponse({ ok: true }))
      .catch(err => sendResponse({ ok: false, error: String(err) }));
    return true;
  }
  if (msg?.kind === 'session.detach' && typeof msg.tabId === 'number') {
    void detach(msg.tabId).then(() => sendResponse({ ok: true }));
    return true;
  }
  if (msg?.kind === 'cdp.send' && typeof msg.tabId === 'number') {
    const s = sessions.get(msg.tabId);
    s?.cdp.send(msg.method, msg.params)
      .then(result => sendResponse({ ok: true, result }))
      .catch(error => sendResponse({ ok: false, error: String(error) }));
    return true;
  }
  return false;
});

async function attach(tabId: number) {
  if (sessions.has(tabId)) return;
  const copilot = new CopilotBridge();
  await copilot.start();
  const cdp = new CdpBridge(tabId, copilot);
  await cdp.attach();
  sessions.set(tabId, { tabId, cdp, copilot });
}

async function detach(tabId: number) {
  const s = sessions.get(tabId);
  if (!s) return;
  await s.cdp.detach();
  await s.copilot.stop();
  sessions.delete(tabId);
}

chrome.tabs.onRemoved.addListener(tabId => { void detach(tabId); });
