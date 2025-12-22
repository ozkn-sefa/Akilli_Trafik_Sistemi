using Microsoft.AspNetCore.Mvc;
using AkıllıTrafikSistemi.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

public class HistoryController : Controller
{
    private readonly AppDbContext _context;

    public HistoryController(AppDbContext context)
    {
        _context = context;
    }

    // GET: /History/History
    public async Task<IActionResult> History()
    {
        var username = HttpContext.Session.GetString("Username");

        if (string.IsNullOrEmpty(username))
        {
            return RedirectToAction("Login", "Account");
        }

        var viewModel = new RouteHistoryViewModel { Username = username };

        try
        {
            // EF Core ile LINQ sorgusu: Daha güvenli ve temiz.
            var history = await _context.RouteHistories
                .Where(h => h.Username == username)
                .OrderByDescending(h => h.SavedAt)
                .Take(50)
                .ToListAsync();

            viewModel.HistoryEntries = history;

            return View(viewModel);
        }
        catch (Exception ex)
        {
            // Hata loglama
            Console.WriteLine($"Hata: {ex.Message}");
            ViewData["ErrorMessage"] = "Geçmiş rotalar yüklenirken bir hata oluştu.";
            return View(viewModel);
        }
    }
}