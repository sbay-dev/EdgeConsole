// Panel host — sits between the WasmMvcRuntime iframe and the service worker.
// Forwards `cdp.dispatch` from runtime to background; relays CDP events back.
const frame = document.getElementById('runtime-frame') as HTMLIFrameElement;
const tabId = chrome.devtools.inspectedWindow.tabId;

window.addEventListener('message', async (e) => {
  const m = e.data;
  if (!m || typeof m !== 'object') return;
  if (m.kind === 'cdp.dispatch') {
    const { method, params } = m.payload as { method: string; params: unknown };
    const reply = await chrome.runtime.sendMessage({ kind: 'cdp.send', tabId, method, params });
    frame.contentWindow?.postMessage({ kind: 'cdp.result', result: reply.result, error: reply.error }, '*');
  }
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.kind === 'cdp.event' && msg.tabId === tabId) {
    frame.contentWindow?.postMessage(msg.payload, '*');
  }
});
