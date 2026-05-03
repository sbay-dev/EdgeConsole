using System.Net;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Sbay.DevTools.Bridge.Sources;

/// <summary>
/// Listens for events from the browser extension on two transports:
///  - Native Messaging stdio framing (length-prefixed JSON) when launched by Edge
///  - WebSocket on 127.0.0.1:47823 for mobile / when Native Messaging is unavailable
/// All inbound events are written into <see cref="DevToolsState"/>.
/// </summary>
public sealed class ExtensionListener : BackgroundService
{
    private readonly DevToolsState _state;
    private readonly ILogger<ExtensionListener> _logger;
    private readonly bool _nativeMode;

    public ExtensionListener(DevToolsState state, ILogger<ExtensionListener> logger)
    {
        _state = state;
        _logger = logger;
        _nativeMode = Environment.GetCommandLineArgs().Contains("--native");
    }

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        var ws = WebSocketServer(ct);
        if (_nativeMode)
            await Task.WhenAll(ws, NativeMessagingLoop(ct));
        else
            await ws;
    }

    private async Task WebSocketServer(CancellationToken ct)
    {
        var listener = new HttpListener();
        listener.Prefixes.Add("http://127.0.0.1:47823/");
        try { listener.Start(); }
        catch (Exception ex) { _logger.LogWarning(ex, "WS listener disabled"); return; }

        _logger.LogInformation("Extension WebSocket listening on ws://127.0.0.1:47823/sbay-dev");
        while (!ct.IsCancellationRequested)
        {
            HttpListenerContext ctx;
            try { ctx = await listener.GetContextAsync().WaitAsync(ct); }
            catch (OperationCanceledException) { break; }

            if (!ctx.Request.IsWebSocketRequest) { ctx.Response.StatusCode = 400; ctx.Response.Close(); continue; }
            _ = HandleWebSocket(ctx, ct);
        }
        listener.Stop();
    }

    private async Task HandleWebSocket(HttpListenerContext ctx, CancellationToken ct)
    {
        WebSocketContext wsc;
        try { wsc = await ctx.AcceptWebSocketAsync(null); }
        catch { return; }
        var ws = wsc.WebSocket;
        var buf = new byte[64 * 1024];

        while (ws.State == WebSocketState.Open && !ct.IsCancellationRequested)
        {
            var sb = new StringBuilder();
            WebSocketReceiveResult res;
            do
            {
                try { res = await ws.ReceiveAsync(buf, ct); }
                catch { return; }
                if (res.MessageType == WebSocketMessageType.Close) return;
                sb.Append(Encoding.UTF8.GetString(buf, 0, res.Count));
            } while (!res.EndOfMessage);

            Dispatch(sb.ToString());
        }
    }

    private async Task NativeMessagingLoop(CancellationToken ct)
    {
        // Native Messaging: 4-byte LE length prefix, then UTF-8 JSON payload.
        await using var stdin = Console.OpenStandardInput();
        var lenBuf = new byte[4];

        while (!ct.IsCancellationRequested)
        {
            if (!await ReadExactly(stdin, lenBuf, ct)) break;
            var len = BitConverter.ToInt32(lenBuf, 0);
            if (len <= 0 || len > 1024 * 1024) break;
            var body = new byte[len];
            if (!await ReadExactly(stdin, body, ct)) break;
            Dispatch(Encoding.UTF8.GetString(body));
        }
    }

    private static async Task<bool> ReadExactly(Stream s, byte[] buf, CancellationToken ct)
    {
        var off = 0;
        while (off < buf.Length)
        {
            var n = await s.ReadAsync(buf.AsMemory(off), ct);
            if (n == 0) return false;
            off += n;
        }
        return true;
    }

    private void Dispatch(string raw)
    {
        try
        {
            var node = JsonNode.Parse(raw);
            var method = node?["method"]?.GetValue<string>();
            var p = node?["params"];
            if (method is null) return;
            // params can be a string (already-serialized JSON) or an object
            JsonNode? parsed = p switch
            {
                JsonValue v when v.TryGetValue<string>(out var s) => JsonNode.Parse(s),
                _ => p
            };
            _state.Ingest(method, parsed);
        }
        catch (JsonException ex)
        {
            _logger.LogDebug(ex, "Discarded malformed extension message");
        }
    }
}

/// <summary>Marker type to satisfy DI for <see cref="ExtensionListener"/> when consumers want an opaque transport handle.</summary>
public sealed class ExtensionTransport { }
