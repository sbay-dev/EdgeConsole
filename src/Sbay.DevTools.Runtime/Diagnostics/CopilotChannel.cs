using System.Collections.Concurrent;

namespace Sbay.DevTools.Runtime.Diagnostics;

/// <summary>
/// Lock-free in-process pub/sub used by NLog targets and Hubs to push events
/// to the JS bridge. The bridge subscribes through JSImport/JSExport and forwards
/// to the MCP Bridge daemon via Native Messaging or WebSocket.
/// </summary>
public sealed class CopilotChannel
{
    public static CopilotChannel? Default { get; private set; }

    private readonly ConcurrentQueue<(string Method, string JsonParams)> _pending = new();
    private Action<string, string>? _sink;

    public CopilotChannel() => Default = this;

    public void AttachSink(Action<string, string> sink)
    {
        _sink = sink;
        while (_pending.TryDequeue(out var evt))
            sink(evt.Method, evt.JsonParams);
    }

    public void Publish(string method, string jsonParams)
    {
        var sink = _sink;
        if (sink is null) _pending.Enqueue((method, jsonParams));
        else sink(method, jsonParams);
    }
}
