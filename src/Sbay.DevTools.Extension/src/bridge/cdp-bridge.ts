import type { CopilotBridge } from './copilot-bridge.js';

type Pending = { resolve: (v: unknown) => void; reject: (e: unknown) => void };

/**
 * Thin wrapper around chrome.debugger that:
 *  - attaches/detaches to a tab
 *  - sends CDP commands and resolves Promises by id
 *  - forwards CDP events to the panel iframe
 *  - mirrors console errors / network failures into the Copilot MCP bridge
 */
export class CdpBridge {
  private nextId = 1;
  private readonly pending = new Map<number, Pending>();
  private readonly target: chrome.debugger.Debuggee;
  private attached = false;

  constructor(private readonly tabId: number, private readonly copilot: CopilotBridge) {
    this.target = { tabId };
  }

  async attach() {
    await chrome.debugger.attach(this.target, '1.3');
    this.attached = true;
    chrome.debugger.onEvent.addListener(this.onEvent);
    chrome.debugger.onDetach.addListener(this.onDetach);
    await Promise.all([
      this.send('Runtime.enable'),
      this.send('Log.enable'),
      this.send('Network.enable'),
      this.send('Page.enable')
    ]);
  }

  async detach() {
    if (!this.attached) return;
    chrome.debugger.onEvent.removeListener(this.onEvent);
    chrome.debugger.onDetach.removeListener(this.onDetach);
    try { await chrome.debugger.detach(this.target); } catch { /* ignore */ }
    this.attached = false;
  }

  send(method: string, params?: unknown): Promise<unknown> {
    return new Promise((resolve, reject) => {
      chrome.debugger.sendCommand(this.target, method, params as object | undefined, (result) => {
        const err = chrome.runtime.lastError;
        if (err) reject(new Error(err.message));
        else resolve(result);
      });
    });
  }

  private onEvent = (source: chrome.debugger.Debuggee, method: string, params?: object) => {
    if (source.tabId !== this.tabId) return;

    if (method === 'Runtime.consoleAPICalled' || method === 'Runtime.exceptionThrown' || method === 'Log.entryAdded') {
      const entry = mapToConsoleEntry(method, params ?? {});
      this.relay({ kind: 'console.append', entry });
      if (entry.level === 'error' || entry.level === 'warning') {
        this.copilot.publish('console.captured', entry);
      }
    }
    if (method === 'Network.loadingFailed') {
      this.copilot.publish('network.failed', params);
    }
  };

  private onDetach = (source: chrome.debugger.Debuggee, reason: string) => {
    if (source.tabId !== this.tabId) return;
    this.attached = false;
    this.copilot.publish('debugger.detached', { reason });
  };

  private relay(payload: unknown) {
    void chrome.runtime.sendMessage({ kind: 'cdp.event', tabId: this.tabId, payload });
  }
}

function mapToConsoleEntry(method: string, p: any) {
  if (method === 'Runtime.exceptionThrown') {
    const ex = p.exceptionDetails;
    return {
      level: 'error',
      text: ex?.exception?.description ?? ex?.text ?? 'Uncaught',
      url: ex?.url, line: ex?.lineNumber, column: ex?.columnNumber,
      timestamp: Date.now(),
      stackTrace: ex?.stackTrace ? JSON.stringify(ex.stackTrace) : null
    };
  }
  if (method === 'Log.entryAdded') {
    const e = p.entry;
    return { level: e.level, text: e.text, url: e.url, line: e.lineNumber, column: 0, timestamp: e.timestamp, source: e.source, stackTrace: null };
  }
  // Runtime.consoleAPICalled
  const args = (p.args ?? []).map((a: any) => a.value ?? a.description ?? a.type).join(' ');
  return { level: p.type ?? 'log', text: args, url: p.stackTrace?.callFrames?.[0]?.url, line: p.stackTrace?.callFrames?.[0]?.lineNumber, column: 0, timestamp: p.timestamp ?? Date.now(), stackTrace: null };
}
