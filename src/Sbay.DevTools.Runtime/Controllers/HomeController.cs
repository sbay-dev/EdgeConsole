using Microsoft.Extensions.Logging;
using WasmMvcRuntime.Abstractions;

namespace Sbay.DevTools.Runtime.Controllers;

public class HomeController : Controller
{
    private readonly ILogger<HomeController>? _logger;

    public HomeController() { }

    public HomeController(ILogger<HomeController> logger) => _logger = logger;

    [Route("/")]
    [Route("/home")]
    public ViewResult Index()
    {
        _logger?.LogInformation("DevTools shell loaded");
        ViewData["Title"] = "sbay-dev DevTools";
        ViewData["ActivePanel"] = "console";
        return View();
    }
}
