/**
 * CopilotBridge — extension-side client that connects to the Sbay.DevTools.Bridge
 * MCP server. The MCP server itself talks to `gh copilot cli` over stdio; this
 * class just streams DevTools events to it via Native Messaging (desktop) or
 * WebSocket (mobile).
 *
 * Wire protocol (this hop is *not* MCP — it's a thin transport):
 *   { method: string, params: unknown, ts: number }
 * The Bridge daemon translates these into MCP resource updates / tool results.
 */
const NATIVE_HOST = 'com.sbay.devtools.bridge';
const WS_FALLBACK_URL = 'ws://127.0.0.1:47823/sbay-dev';

export class CopilotBridge {
  private nm?: chrome.runtime.Port;
  private ws?: WebSocket;
  private readonly queue: { method: string; params: unknown }[] = [];
  private mode: 'native' | 'ws' | 'idle' = 'idle';

  async start() {
    if (await this.tryNative()) return;
    if (await this.tryWebSocket()) return;
    this.mode = 'idle'; // events buffer until a transport is available
  }

  async stop() {
    try { this.nm?.disconnect(); } catch { /* ignore */ }
    try { this.ws?.close(); } catch { /* ignore */ }
    this.mode = 'idle';
  }

  publish(method: string, params: unknown) {
    const env = { method, params, ts: Date.now() };
    if (this.mode === 'native') {
      this.nm!.postMessage(env);
    } else if (this.mode === 'ws' && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(env));
    } else {
      this.queue.push({ method, params });
      if (this.queue.length > 1000) this.queue.shift();
    }
  }

  private flush() {
    while (this.queue.length) {
      const e = this.queue.shift()!;
      this.publish(e.method, e.params);
    }
  }

  private tryNative(): Promise<boolean> {
    return new Promise(resolve => {
      try {
        const port = chrome.runtime.connectNative(NATIVE_HOST);
        port.onDisconnect.addListener(() => {
          if (chrome.runtime.lastError) resolve(false);
        });
        port.onMessage.addListener(() => { /* unused for now */ });
        this.nm = port;
        this.mode = 'native';
        // micro-defer to detect immediate disconnect
        setTimeout(() => { this.flush(); resolve(this.mode === 'native'); }, 50);
      } catch {
        resolve(false);
      }
    });
  }

  private tryWebSocket(): Promise<boolean> {
    return new Promise(resolve => {
      try {
        const ws = new WebSocket(WS_FALLBACK_URL);
        const timer = setTimeout(() => { try { ws.close(); } catch { /* */ } resolve(false); }, 1500);
        ws.onopen = () => {
          clearTimeout(timer);
          this.ws = ws; this.mode = 'ws'; this.flush(); resolve(true);
        };
        ws.onerror = () => { clearTimeout(timer); resolve(false); };
        ws.onclose = () => { if (this.mode === 'ws') this.mode = 'idle'; };
      } catch { resolve(false); }
    });
  }
}
