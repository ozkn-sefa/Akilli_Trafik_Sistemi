using Microsoft.AspNetCore.Mvc;
using AkıllıTrafikSistemi.Models; // Modelinizin olduğu namespace

namespace AkıllıTrafikSistemi.Controllers
{
    public class SignsController : Controller
    {
        public IActionResult TrafficSigns()
        {
            // 1. Session'dan kullanıcı adını al
            var username = HttpContext.Session.GetString("Username") ?? "Misafir Kullanıcı";

            // 2. Sayfa için gerekli modeli oluştur (Harita sayfasıyla aynı model tipini kullanıyoruz)
            var model = new UserMarker
            {
                Username = username,
                // Burada isterseniz veritabanından gerçek sayıları çekebilirsiniz, 
                // şimdilik harita sayfasıyla uyumlu olması için örnek değerler:
                TotalMarkerCount = 120,
                UserMarkerCount = (username == "Misafir Kullanıcı") ? 0 : 5
            };

            return View(model);
        }
    }
}