using Microsoft.AspNetCore.Mvc;
using AkıllıTrafikSistemi.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http;
using System;
using System.Linq;
using System.Threading.Tasks;

public class ProfileController : Controller
{
    private readonly AppDbContext _context;

    public ProfileController(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IActionResult> Profile()
    {
        var username = HttpContext.Session.GetString("Username");

        if (string.IsNullOrEmpty(username))
            return RedirectToAction("Login", "Account");

        try
        {
            // EF Core LINQ sorgusu ile View üzerinden profil bilgilerini çekme
            var profile = await _context.UserProfiles
                .Where(p => p.Username == username)
                .FirstOrDefaultAsync();

            if (profile == null)
                return NotFound();

            return View(profile);
        }
        catch (Exception ex)
        {
            // Hata loglama (Opsiyonel)
            Console.WriteLine($"Profil Yükleme Hatası: {ex.Message}");

            TempData["Error"] = "Profil bilgileri yüklenemedi.";
            return RedirectToAction("Index", "Home");
        }
    }
}