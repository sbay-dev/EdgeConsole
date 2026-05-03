using System.Text.Json;
using NLog;
using NLog.Targets;

namespace Sbay.DevTools.Runtime.Diagnostics;

[Target("Copilot")]
public sealed class CopilotTarget : TargetWithLayout
{
    protected override void Write(LogEventInfo logEvent)
    {
        var rendered = RenderLogEvent(Layout, logEvent);
        var payload = JsonSerializer.Serialize(new
        {
            ts = logEvent.TimeStamp.ToUniversalTime().ToString("O"),
            level = logEvent.Level.Name,
            logger = logEvent.LoggerName,
            message = rendered,
            exception = logEvent.Exception?.ToString()
        });
        CopilotChannel.Default?.Publish("log.emitted", payload);
    }
}
