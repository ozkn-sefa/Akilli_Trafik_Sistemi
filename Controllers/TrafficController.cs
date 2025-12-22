using Microsoft.AspNetCore.Mvc;

namespace AkıllıTrafikSistemi.Controllers
{
    public class TrafficController : Controller
    {
        public IActionResult Density()
        {
            return View();
        }
    }
}
