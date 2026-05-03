# Copilot CLI integration via Model Context Protocol (MCP)

`sbay-devtools-bridge` is an MCP server. `gh copilot cli` connects to it as a regular MCP provider — no custom protocol on the Copilot side.

## Registering the server

Add the following snippet to your Copilot CLI configuration (`~/.config/copilot/mcp.json` or equivalent):

```json
{
  "mcpServers": {
    "sbay-devtools": {
      "type": "stdio",
      "command": "sbay-devtools-bridge",
      "args": ["--mcp"]
    }
  }
}
```

The same file is shipped as `src/Sbay.DevTools.Bridge/mcp-config.example.json`.

## Tools exposed

| Tool | Purpose |
|------|---------|
| `devtools.getRecentErrors`   | Recent uncaught exceptions / `console.error` |
| `devtools.getNetworkFailures`| Failed HTTP requests with method/URL/status |
| `devtools.getConsoleLog`     | Console buffer (filterable by level) |
| `devtools.evaluateInPage`    | Send `Runtime.evaluate` to the page |
| `devtools.getDomSnapshot`    | `DOMSnapshot.captureSnapshot` result |
| `devtools.captureScreenshot` | PNG screenshot (base64) |

## Resources

| URI | Description |
|-----|-------------|
| `devtools://errors/recent`  | Live stream of JS errors |
| `devtools://network/failed` | Live stream of failed requests |
| `devtools://console/log`    | Console buffer |
| `devtools://page/info`      | URL / title / viewport |

When new data arrives, the server sends `notifications/resources/updated` so subscribed `copilot` sessions can react without polling.

## Transport choice

| Environment | Transport |
|-------------|-----------|
| Desktop Edge + Termux/Linux/Windows | `--mcp` over stdio (recommended) |
| Mobile Edge (Android, iPad) | Same daemon also accepts WebSocket on `ws://127.0.0.1:47823/sbay-dev` |

The MCP layer and the extension transport (NM/WS) are independent — `copilot` always speaks MCP/stdio to the bridge.

## Stdout discipline

The MCP stdio transport reserves stdout for JSON-RPC frames. Bridge logs go to **stderr** and a rolling file (`%LOCALAPPDATA%/sbay-dev/bridge.log`). NLog config enforces this — see `src/Sbay.DevTools.Bridge/nlog.config`.
