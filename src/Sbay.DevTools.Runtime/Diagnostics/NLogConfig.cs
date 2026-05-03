using NLog;
using NLog.Config;
using NLog.Targets;

namespace Sbay.DevTools.Runtime.Diagnostics;

internal static class NLogConfig
{
    public static void Bootstrap()
    {
        var config = new LoggingConfiguration();

        var consoleTarget = new ConsoleTarget("console")
        {
            Layout = "${longdate}|${level:uppercase=true}|${logger}|${message} ${exception:format=tostring}"
        };

        var copilotTarget = new CopilotTarget
        {
            Name = "copilot",
            Layout = "${message}"
        };

        config.AddTarget(consoleTarget);
        config.AddTarget(copilotTarget);

        config.AddRule(LogLevel.Trace, LogLevel.Fatal, consoleTarget);
        config.AddRule(LogLevel.Warn, LogLevel.Fatal, copilotTarget);

        LogManager.Configuration = config;
    }
}
