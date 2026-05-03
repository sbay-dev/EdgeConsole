# Architecture — sbay-dev DevTools

## Layered view

```
┌─ Microsoft Edge (mobile, large screen) ───────────────────────────────┐
│                                                                        │
│  Inspected Tab ◄──── chrome.debugger (CDP 1.3) ────┐                  │
│                                                     │                  │
│  ┌─ sbay-dev MV3 Extension ────────────────────────┴──────────────┐  │
│  │                                                                  │  │
│  │  ┌─ devtools_page (devtools.ts) ─┐                              │  │
│  │  │   chrome.devtools.panels.create(...)                          │  │
│  │  └──────────────────────────────┘                                │  │
│  │                                                                  │  │
│  │  ┌─ Service Worker (background) ─────────────────────────────┐  │  │
│  │  │   • CdpBridge      — owns chrome.debugger session         │  │  │
│  │  │   • CopilotBridge  — Native Messaging / WebSocket out     │  │  │
│  │  └─────────────────────────────────────────────────────────┘    │  │
│  │              ▲ chrome.runtime.sendMessage                         │  │
│  │              ▼                                                    │  │
│  │  ┌─ Panel host iframe (host.html) ─────────────────────────┐    │  │
│  │  │   <iframe src="runtime/index.html">  ← WasmMvcRuntime    │    │  │
│  │  │   ├─ Razor views (Console / Elements / …)                │    │  │
│  │  │   ├─ Controllers (REST API for the views)                │    │  │
│  │  │   └─ NLog → CopilotChannel → window.postMessage          │    │  │
│  │  └────────────────────────────────────────────────────────┘    │  │
│  └─────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
                            │ Native Messaging stdio  │ WebSocket :47823
                            ▼                          ▼
                  ┌──────────────────────────────────────────┐
                  │  sbay-devtools-bridge  (.NET 10)         │
                  │  ├── ExtensionListener  (NM / WS in)     │
                  │  ├── DevToolsState      (ring buffers)   │
                  │  ├── ExtensionDispatcher (CDP out)       │
                  │  └── MCP Server (stdio)                  │
                  │       ├── tools: getRecentErrors,        │
                  │       │          evaluateInPage, …       │
                  │       └── resources: devtools://…        │
                  └──────────────────┬───────────────────────┘
                                     │ MCP / stdio
                                     ▼
                              gh copilot cli
```

## Message flow — error capture

1. Page throws → CDP emits `Runtime.exceptionThrown` to `chrome.debugger`.
2. `CdpBridge` maps the event to a `ConsoleEntry`, posts it twice:
   - to the panel iframe via `chrome.runtime.sendMessage` → `host.ts` → `postMessage` → console.js
   - to `CopilotBridge.publish('console.captured', entry)`.
3. `CopilotBridge` forwards the envelope over Native Messaging (or WS) to `sbay-devtools-bridge`.
4. `ExtensionListener` parses the envelope and calls `DevToolsState.Ingest`, which:
   - appends to the appropriate ring buffer
   - raises `ResourceUpdated` for `devtools://errors/recent` and `devtools://console/log`.
5. The MCP layer relays the change as `notifications/resources/updated` to subscribed clients (`gh copilot cli`).

## Threading model

- WasmMvcRuntime is single-threaded inside its dedicated Web Worker. All controllers run there.
- The MV3 service worker is event-driven; CDP events arrive on the main thread and are immediately forwarded.
- The Bridge daemon uses `BackgroundService` for transport listeners; MCP tool methods may be called concurrently — all shared state lives in `DevToolsState` which uses `ConcurrentQueue`.
