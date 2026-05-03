using System.Collections.Concurrent;
using System.Text.Json.Nodes;

namespace Sbay.DevTools.Bridge.Mcp;

/// <summary>
/// Outbound channel used by MCP tools to invoke CDP commands on the inspected page.
/// The extension's CopilotBridge is request/response over the same transport;
/// this dispatcher writes a `cdp.send` envelope and awaits a `cdp.reply` matching the id.
/// </summary>
public sealed class ExtensionDispatcher
{
    private long _next;
    private readonly ConcurrentDictionary<long, TaskCompletionSource<JsonNode?>> _pending = new();

    public Func<string, ValueTask>? Send { get; set; }

    public async Task<JsonNode?> SendCdpAsync(string method, object @params, CancellationToken ct = default)
    {
        if (Send is null) throw new InvalidOperationException("No extension transport attached.");
        var id = Interlocked.Increment(ref _next);
        var tcs = new TaskCompletionSource<JsonNode?>(TaskCreationOptions.RunContinuationsAsynchronously);
        _pending[id] = tcs;
        var envelope = new JsonObject
        {
            ["kind"]   = "cdp.send",
            ["id"]     = id,
            ["method"] = method,
            ["params"] = JsonNode.Parse(System.Text.Json.JsonSerializer.Serialize(@params))
        };
        await Send(envelope.ToJsonString());
        using (ct.Register(() => tcs.TrySetCanceled(ct)))
            return await tcs.Task;
    }

    public void Resolve(long id, JsonNode? result)
    {
        if (_pending.TryRemove(id, out var tcs)) tcs.TrySetResult(result);
    }
}
