using System.Collections.Concurrent;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace Sbay.DevTools.Bridge.Sources;

/// <summary>
/// Ring-buffered store of DevTools events received from the browser extension.
/// Read by MCP tools and resources; written by <see cref="ExtensionListener"/>.
/// </summary>
public sealed class DevToolsState
{
    private const int Capacity = 2000;

    private readonly ConcurrentQueue<JsonNode> _errors = new();
    private readonly ConcurrentQueue<JsonNode> _network = new();
    private readonly ConcurrentQueue<JsonNode> _console = new();
    private readonly object _gate = new();

    public event Action<string>? ResourceUpdated;

    public void Ingest(string method, JsonNode? @params)
    {
        if (@params is null) return;
        switch (method)
        {
            case "console.captured":
                Push(_console, @params);
                if (TryGetLevel(@params) is "error" or "warning") Push(_errors, @params);
                ResourceUpdated?.Invoke("devtools://console/log");
                ResourceUpdated?.Invoke("devtools://errors/recent");
                break;
            case "network.failed":
                Push(_network, @params);
                ResourceUpdated?.Invoke("devtools://network/failed");
                break;
            case "log.emitted":
                Push(_console, @params);
                ResourceUpdated?.Invoke("devtools://console/log");
                break;
        }
    }

    public IReadOnlyList<JsonNode> RecentErrors(int take = 50)   => Snapshot(_errors, take);
    public IReadOnlyList<JsonNode> NetworkFailures(int take = 50) => Snapshot(_network, take);
    public IReadOnlyList<JsonNode> ConsoleLog(int take = 200)    => Snapshot(_console, take);

    private void Push(ConcurrentQueue<JsonNode> q, JsonNode item)
    {
        q.Enqueue(item);
        while (q.Count > Capacity && q.TryDequeue(out _)) { }
    }

    private static List<JsonNode> Snapshot(ConcurrentQueue<JsonNode> q, int take)
    {
        var arr = q.ToArray();
        var start = Math.Max(0, arr.Length - take);
        return arr.Skip(start).ToList();
    }

    private static string? TryGetLevel(JsonNode node)
        => node is JsonObject o && o.TryGetPropertyValue("level", out var l) ? l?.GetValue<string>() : null;
}
