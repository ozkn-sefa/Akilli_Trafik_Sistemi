using Microsoft.AspNetCore.Mvc;
using AkıllıTrafikSistemi.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AkıllıTrafikSistemi.ViewComponents
{
    public class LatestEventsViewComponent : ViewComponent
    {
        private readonly AppDbContext _context;

        public LatestEventsViewComponent(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IViewComponentResult> InvokeAsync()
        {
            List<UserMarker> latestMarkers = new List<UserMarker>();

            try
            {
                // EF Core LINQ Sorgusu:
                // 1. AllMarkers view'ına git
                // 2. Tarihe göre tersten sırala
                // 3. En son 5 tanesini seç
                // 4. Listeye dök
                latestMarkers = await _context.AllMarkers
                    .OrderByDescending(m => m.CreatedAt)
                    .Take(5)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                // Hata durumunda boş liste döner, böylece View çökmez
                Console.WriteLine($"Son İşaretleri Çekme Hatası (EF Core): {ex.Message}");
            }

            return View(latestMarkers);
        }
    }
}