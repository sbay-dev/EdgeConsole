namespace Sbay.DevTools.Runtime.Models.Console;

public sealed record ConsoleEntry(
    string Level,
    string Text,
    string? Source,
    string? Url,
    int? Line,
    int? Column,
    long Timestamp,
    string? StackTrace);

public sealed record EvalRequest(string Expression);

public sealed record EvalDispatch(string Expression, string CdpMethod, object Params);
