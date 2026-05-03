using System.ComponentModel;
using System.Text.Json;
using System.Text.Json.Nodes;
using ModelContextProtocol.Server;
using Sbay.DevTools.Bridge.Sources;

namespace Sbay.DevTools.Bridge.Mcp;

/// <summary>
/// MCP tools surfaced to gh copilot cli. Each method below appears as a callable
/// tool in `copilot`'s tool catalog under the namespace `sbay-devtools`.
/// </summary>
[McpServerToolType]
public static class DevToolsTools
{
    [McpServerTool(Name = "devtools.getRecentErrors")]
    [Description("Returns the most recent JavaScript errors observed in the inspected page, with stack traces, source URLs, and timestamps.")]
    public static string GetRecentErrors(
        DevToolsState state,
        [Description("Maximum number of errors to return (1-500, default 50).")] int take = 50)
        => Serialize(state.RecentErrors(Math.Clamp(take, 1, 500)));

    [McpServerTool(Name = "devtools.getNetworkFailures")]
    [Description("Returns recent failed network requests (4xx/5xx, aborted, blocked) with method, URL, status and reason.")]
    public static string GetNetworkFailures(
        DevToolsState state,
        [Description("Maximum number of entries (1-500, default 50).")] int take = 50)
        => Serialize(state.NetworkFailures(Math.Clamp(take, 1, 500)));

    [McpServerTool(Name = "devtools.getConsoleLog")]
    [Description("Returns the recent console message buffer, optionally filtered by level (error|warning|info|log|debug).")]
    public static string GetConsoleLog(
        DevToolsState state,
        [Description("Maximum number of entries (1-1000, default 200).")] int take = 200,
        [Description("Optional level filter.")] string? level = null)
    {
        var rows = state.ConsoleLog(Math.Clamp(take, 1, 1000));
        if (!string.IsNullOrEmpty(level))
            rows = rows.Where(n => n is JsonObject o && o["level"]?.GetValue<string>() == level).ToList();
        return Serialize(rows);
    }

    [McpServerTool(Name = "devtools.evaluateInPage")]
    [Description("Sends a Runtime.evaluate request to the inspected page through the extension. Returns the CDP result envelope.")]
    public static async Task<string> EvaluateInPage(
        ExtensionDispatcher dispatcher,
        [Description("JavaScript expression to evaluate in the page's main frame.")] string expression,
        [Description("If true, the result is returned by value (serializable). Default false.")] bool returnByValue = false)
    {
        var result = await dispatcher.SendCdpAsync("Runtime.evaluate", new
        {
            expression,
            includeCommandLineAPI = true,
            returnByValue,
            generatePreview = true,
            replMode = true
        });
        return result?.ToJsonString() ?? "null";
    }

    [McpServerTool(Name = "devtools.getDomSnapshot")]
    [Description("Captures a snapshot of the current DOM (nodes + computed styles + accessibility tree) via DOMSnapshot.captureSnapshot.")]
    public static async Task<string> GetDomSnapshot(ExtensionDispatcher dispatcher)
    {
        var result = await dispatcher.SendCdpAsync("DOMSnapshot.captureSnapshot", new
        {
            computedStyles = new[] { "display", "color", "background-color", "font-size" },
            includeDOMRects = true,
            includePaintOrder = false
        });
        return result?.ToJsonString() ?? "null";
    }

    [McpServerTool(Name = "devtools.captureScreenshot")]
    [Description("Captures a PNG screenshot of the current viewport and returns it as a base64 string.")]
    public static async Task<string> CaptureScreenshot(ExtensionDispatcher dispatcher)
    {
        var result = await dispatcher.SendCdpAsync("Page.captureScreenshot", new { format = "png" });
        return result?["data"]?.GetValue<string>() ?? "";
    }

    private static string Serialize(IEnumerable<JsonNode> nodes)
        => JsonSerializer.Serialize(nodes.Select(n => n.ToJsonString()), new JsonSerializerOptions { WriteIndented = false });
}
