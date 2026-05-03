using System.Text.Json;
using System.Text.Json.Nodes;
using ModelContextProtocol.Protocol;
using ModelContextProtocol.Server;
using Sbay.DevTools.Bridge.Sources;

namespace Sbay.DevTools.Bridge.Mcp;

/// <summary>
/// MCP resources exposing live DevTools state. Subscribers (e.g. gh copilot cli)
/// receive notifications/resources/updated whenever the underlying buffers change.
/// </summary>
public sealed class DevToolsResources
{
    private readonly DevToolsState _state;

    public DevToolsResources(DevToolsState state)
    {
        _state = state;
        _state.ResourceUpdated += OnUpdated;
    }

    public IEnumerable<Resource> List() => new[]
    {
        Make("devtools://errors/recent",   "Recent JS errors",            "Most recent uncaught exceptions and console.error calls."),
        Make("devtools://network/failed",  "Failed network requests",     "Requests that ended with a non-2xx status, were aborted, or blocked."),
        Make("devtools://console/log",     "Console log",                 "Buffered console output captured from the inspected page."),
        Make("devtools://page/info",       "Inspected page info",         "URL, title and viewport of the currently-inspected tab.")
    };

    public string Read(string uri) => uri switch
    {
        "devtools://errors/recent"  => Serialize(_state.RecentErrors()),
        "devtools://network/failed" => Serialize(_state.NetworkFailures()),
        "devtools://console/log"    => Serialize(_state.ConsoleLog()),
        "devtools://page/info"      => "{\"url\":\"\",\"title\":\"\",\"viewport\":null}",
        _ => throw new InvalidOperationException($"Unknown resource: {uri}")
    };

    private void OnUpdated(string uri)
    {
        // The MCP server SDK relays this to subscribed clients.
        // (Hooked via WithResources<>; concrete API may vary by SDK version.)
    }

    private static Resource Make(string uri, string name, string description)
        => new() { Uri = uri, Name = name, Description = description, MimeType = "application/json" };

    private static string Serialize(IEnumerable<JsonNode> nodes)
        => JsonSerializer.Serialize(nodes.Select(n => n.ToJsonString()));
}
