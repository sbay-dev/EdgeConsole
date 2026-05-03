# Edge Add-ons Store Listing — English

## Short description (≤132 chars)

> Desktop‑grade DevTools for Edge Mobile. Console, errors, and network — streamed live to `gh copilot cli` over MCP.

Alt (130 chars):

> A real DevTools experience for Edge on mobile — Console, errors and a native MCP bridge to gh copilot cli. 100% on‑device.

---

## Long description

**sbay‑dev — Future Developers' DevTools for Edge Mobile**

Mobile browsers have never had real developer tools. **sbay‑dev** changes that. It brings a desktop‑class DevTools experience to Microsoft Edge on Android — and goes one step further by exposing your live page state to AI assistants through a native **Model Context Protocol (MCP)** bridge.

Whether you're debugging a production bug from your phone, building a Blazor / WebAssembly app on the go, or pair‑programming with `gh copilot cli`, sbay‑dev gives you the visibility you've been missing.

**✦ What's in v1.0**

- **Console panel** — full `console.log/info/warn/error/debug` capture with stack traces, source locations, filtering, and search. Evaluate expressions in the page context just like desktop DevTools.
- **Error & exception capture** — uncaught errors and unhandled promise rejections are surfaced instantly, with the full call stack.
- **MCP Copilot Bridge** — a built‑in Model Context Protocol server exposes the active page's console stream, errors, and DOM context as tools and resources that `gh copilot cli` (and any MCP‑compatible client) can read in real time. Ask Copilot *"why is my fetch failing?"* and it actually sees the error.
- **WebAssembly UI runtime** — the panel itself is a Razor / C# Blazor WebAssembly app (`Sbay.DevTools.Runtime`), giving you a fast, native‑feeling shell that we can extend without rewriting the world.
- **MV3 architecture** — service worker + DevTools page + CDP debugger client, fully compliant with Manifest V3.

**✦ Built for what's next**

The v1.1 release adds the **Pofs Tree** panel: browse every file the active site uses (HTML, JS, CSS, images, fetch responses) **and** every file your WasmMvc app stores locally (OPFS, IndexedDB, SQLite via Cepha) as a single navigable tree, with one‑click download.

Roadmap:

- Network panel — requests, headers, payloads, timings
- Elements panel — live DOM tree + computed styles
- Sources panel — readable source maps, breakpoints
- Application panel — storage, service workers, manifests
- Full Chromium DevTools parity for mobile

**✦ Privacy first — by design**

sbay‑dev does **not** ship your data anywhere.

- No cloud. No analytics. No telemetry. No third‑party trackers.
- All capture and processing runs locally on your device.
- The MCP bridge only talks to clients **you** explicitly connect (e.g. your own `gh copilot cli` running on your machine over a local channel).
- Required permissions (`debugger`, `tabs`, `storage`, `nativeMessaging`, host access) are used solely to attach DevTools to the page you're inspecting and to forward events to the bridge you launched.

Read the full policy: https://sbay-dev.github.io/EdgeConsole/privacy.html

**✦ How to use**

1. Install the extension and pin it.
2. Open any page in Edge Mobile, then open sbay‑dev from the toolbar — the Console panel attaches via the Chrome DevTools Protocol.
3. (Optional) Run `sbay-devtools-bridge` on your dev machine and point `gh copilot cli` at it via MCP. From now on, Copilot has live access to your mobile page's logs and errors.

**✦ Open and auditable**

Source, build scripts, MCP schema, and full release notes live at:
https://github.com/sbay-dev/EdgeConsole

Built by **Future Developers (sbay‑dev / مطورو المستقبل)** — a small team building the tools we wish existed on mobile.

---

## Metadata

**Category:** Developer tools (primary)

**Search keywords:**
`devtools, console, debugger, mobile, MCP, copilot, webassembly, blazor, web developer, error tracking`

**URLs:**

- Homepage: https://sbay-dev.github.io/EdgeConsole/
- Privacy policy: https://sbay-dev.github.io/EdgeConsole/privacy.html
- Source / issues: https://github.com/sbay-dev/EdgeConsole
