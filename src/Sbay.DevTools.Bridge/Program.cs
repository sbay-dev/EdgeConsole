using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using ModelContextProtocol.Server;
using NLog.Extensions.Logging;
using Sbay.DevTools.Bridge.Mcp;
using Sbay.DevTools.Bridge.Sources;

// sbay-devtools-bridge --mcp        → MCP server over stdio (default for `copilot`)
// sbay-devtools-bridge --ws-only    → WebSocket transport only (no MCP)
// sbay-devtools-bridge --native     → Run as Native Messaging host (Edge starts us)

var mode = args.Length > 0 ? args[0] : "--mcp";

var builder = Host.CreateApplicationBuilder(args);

builder.Logging.ClearProviders();
builder.Logging.SetMinimumLevel(LogLevel.Information);
// MCP servers MUST NOT write to stdout when using stdio transport — log to stderr.
builder.Logging.AddNLog("nlog.config");

builder.Services.AddSingleton<DevToolsState>();
builder.Services.AddSingleton<ExtensionTransport>();
builder.Services.AddHostedService<ExtensionListener>();

if (mode == "--mcp")
{
    builder.Services
        .AddMcpServer()
        .WithStdioServerTransport()
        .WithToolsFromAssembly()
        .WithResources<DevToolsResources>();
}

await builder.Build().RunAsync();
