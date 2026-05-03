using System.Text.Json;
using Microsoft.Extensions.Logging;
using Sbay.DevTools.Runtime.Diagnostics;
using Sbay.DevTools.Runtime.Models.Console;
using WasmMvcRuntime.Abstractions;

namespace Sbay.DevTools.Runtime.Controllers;

[Route("/console")]
public class ConsoleController : Controller
{
    private static readonly List<ConsoleEntry> Buffer = new();
    private static readonly object Gate = new();

    private readonly ILogger<ConsoleController>? _logger;
    private readonly CopilotChannel? _copilot;

    public ConsoleController() { }

    public ConsoleController(ILogger<ConsoleController> logger, CopilotChannel copilot)
    {
        _logger = logger;
        _copilot = copilot;
    }

    [Route("")]
    public ViewResult Index()
    {
        ViewData["Title"] = "Console";
        ViewData["ActivePanel"] = "console";
        lock (Gate) ViewData["Entries"] = Buffer.ToArray();
        return View();
    }

    [HttpPost("/console/api/append")]
    public IActionResult Append()
    {
        Form.TryGetValue("entry", out var json);
        if (string.IsNullOrEmpty(json))
            return Json(new { ok = false, error = "missing 'entry' form field" });

        ConsoleEntry? entry;
        try
        {
            entry = JsonSerializer.Deserialize<ConsoleEntry>(json);
        }
        catch (JsonException ex)
        {
            _logger?.LogWarning("Append: invalid JSON — {Msg}", ex.Message);
            return Json(new { ok = false, error = ex.Message });
        }

        if (entry is null)
            return Json(new { ok = false, error = "null entry" });

        lock (Gate)
        {
            Buffer.Add(entry);
            if (Buffer.Count > 5000) Buffer.RemoveAt(0);
        }

        if (entry.Level is "error" or "warning")
        {
            _logger?.LogWarning("[CDP] {Level}: {Text}", entry.Level, entry.Text);
            _copilot?.Publish("console.captured", JsonSerializer.Serialize(entry));
        }
        return Json(new { ok = true });
    }

    [HttpPost("/console/api/evaluate")]
    public IActionResult Evaluate()
    {
        Form.TryGetValue("expression", out var expression);
        expression ??= string.Empty;

        _logger?.LogInformation("REPL evaluate: {Expr}", expression);
        return Json(new EvalDispatch(expression, "Runtime.evaluate", new
        {
            expression,
            includeCommandLineAPI = true,
            returnByValue = false,
            generatePreview = true,
            replMode = true
        }));
    }

    [HttpPost("/console/api/clear")]
    public IActionResult Clear()
    {
        lock (Gate) Buffer.Clear();
        return Json(new { ok = true });
    }

    [HttpGet("/console/api/snapshot")]
    public IActionResult Snapshot()
    {
        ConsoleEntry[] copy;
        lock (Gate) copy = Buffer.ToArray();
        return Json(copy);
    }
}
