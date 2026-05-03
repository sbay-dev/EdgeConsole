using Cepha;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using NLog.Extensions.Logging;
using Sbay.DevTools.Runtime.Diagnostics;

NLogConfig.Bootstrap();

var app = CephaApp.Create(services =>
{
    services.AddSingleton<CopilotChannel>();
    services.AddLogging(lb =>
    {
        lb.ClearProviders();
        lb.SetMinimumLevel(LogLevel.Trace);
        lb.AddNLog();
    });
});

await app.RunAsync();
