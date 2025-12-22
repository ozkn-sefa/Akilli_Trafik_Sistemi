using Microsoft.AspNetCore.Mvc;
using AkıllıTrafikSistemi.Models;
using Microsoft.EntityFrameworkCore;
using System.Text;
using System.Text.Json;
using MySqlConnector; // Parametreler için gerekli

public class MarkerController : Controller
{
    private readonly AppDbContext _context;
    private readonly HttpClient _httpClient;
    private const string NodeJsApiUrl = "http://localhost:3002/api/send-marker-notification";

    public MarkerController(AppDbContext context, IHttpClientFactory httpClientFactory)
    {
        _context = context;
        _httpClient = httpClientFactory.CreateClient();
    }

    private readonly string[] ValidMarkerTypes = { "Yogunluk", "YolCalismasi", "BozukYol", "KayganYol", "Kaza", "KapaliYol", "Radar" };

    private bool IsInsideIstanbul(double lat, double lng) => lat >= 40.802 && lat <= 41.45 && lng >= 28.5 && lng <= 29.7;

    // EF Core ile MySQL Fonksiyonlarını Çağırma
    private async Task<(int totalCount, int userCount)> RecalculateCounts(string username)
    {
        int totalCount = 0; int userCount = 0;
        try
        {
            var conn = _context.Database.GetDbConnection();
            await conn.OpenAsync();
            using var cmd = conn.CreateCommand();

            // Toplam Sayı
            cmd.CommandText = "SELECT GetTotalMarkerCount()";
            totalCount = Convert.ToInt32(await cmd.ExecuteScalarAsync());

            // Kullanıcı Sayısı
            if (!string.IsNullOrEmpty(username))
            {
                cmd.CommandText = "SELECT GetUserMarkerCount(@u)";
                cmd.Parameters.Add(new MySqlParameter("@u", username));
                userCount = Convert.ToInt32(await cmd.ExecuteScalarAsync());
            }
        }
        catch (Exception ex) { Console.WriteLine($"Sayım Hatası: {ex.Message}"); }
        return (totalCount, userCount);
    }

    public async Task<IActionResult> Marker()
    {
        var username = HttpContext.Session.GetString("Username");
        var counts = await RecalculateCounts(username ?? "");
        return View(new UserMarker
        {
            Username = username ?? "Misafir Kullanıcı",
            TotalMarkerCount = counts.totalCount,
            UserMarkerCount = counts.userCount
        });
    }

    [HttpPost]
    public async Task<IActionResult> SaveMarker([FromBody] UserMarker model)
    {
        var username = HttpContext.Session.GetString("Username");
        if (string.IsNullOrEmpty(username)) return Unauthorized(new { message = "Giriş yapmalısınız." });

        if (model == null || !ValidMarkerTypes.Contains(model.MarkerType) || !model.Lat.HasValue || !IsInsideIstanbul(model.Lat.Value, model.Lng.Value))
            return BadRequest(new { message = "Veriler geçersiz veya İstanbul dışı." });

        try
        {
            // 1. Stored Procedure ile Kayıt (Son eklenen ID'yi döndürür)
            var conn = _context.Database.GetDbConnection();
            await conn.OpenAsync();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "CALL InsertUserMarker(@p0, @p1, @p2, @p3, @p4, @p5)";
            cmd.Parameters.Add(new MySqlParameter("@p0", username));
            cmd.Parameters.Add(new MySqlParameter("@p1", model.Lat));
            cmd.Parameters.Add(new MySqlParameter("@p2", model.Lng));
            cmd.Parameters.Add(new MySqlParameter("@p3", model.RoadName));
            cmd.Parameters.Add(new MySqlParameter("@p4", model.MarkerType));
            cmd.Parameters.Add(new MySqlParameter("@p5", model.Description ?? ""));

            long savedId = Convert.ToInt64(await cmd.ExecuteScalarAsync());

            model.Id = savedId;
            model.Username = username;
            model.CreatedAt = DateTime.Now;

            // 2. Bildirim Alacak E-postaları Çekme (Raw SQL - View üzerinden)
            var subscriberEmails = await _context.Database
                .SqlQueryRaw<string>("SELECT Email FROM vw_NotificationSubscribers WHERE Username != {0}", username)
                .ToListAsync();

            if (subscriberEmails.Any())
            {
                _ = Task.Run(async () => {
                    try
                    {
                        var payload = new { markerDetails = model, subscriberEmails };
                        var json = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
                        await _httpClient.PostAsync(NodeJsApiUrl, json);
                    }
                    catch (Exception ex) { Console.WriteLine("Bildirim Hatası: " + ex.Message); }
                });
            }

            var counts = await RecalculateCounts(username);
            return Ok(new { savedId, totalCount = counts.totalCount, userCount = counts.userCount, message = "Başarıyla kaydedildi." });
        }
        catch (Exception ex) { return StatusCode(500, new { error = ex.Message }); }
    }

    [HttpGet]
    public async Task<IActionResult> GetAllMarkers()
    {
        var markers = await _context.AllMarkers.OrderByDescending(m => m.CreatedAt).ToListAsync();
        return Ok(new { markers, currentUsername = HttpContext.Session.GetString("Username") ?? "" });
    }

    [HttpGet]
    public async Task<IActionResult> GetUserMarkers()
    {
        var username = HttpContext.Session.GetString("Username");
        if (string.IsNullOrEmpty(username)) return Ok(new { markers = new List<UserMarker>() });

        var markers = await _context.AllMarkers
            .Where(m => m.Username == username)
            .OrderByDescending(m => m.CreatedAt)
            .ToListAsync();

        return Ok(new { markers, currentUsername = username });
    }

    [HttpDelete]
    public async Task<IActionResult> DeleteMarker([FromQuery] int id)
    {
        var username = HttpContext.Session.GetString("Username");
        if (string.IsNullOrEmpty(username)) return Unauthorized();

        try
        {
            // SP ile silme işlemi (Etkilenen satır sayısını döner)
            int rows = await _context.Database.ExecuteSqlRawAsync("CALL DeleteUserMarker({0}, {1})", id, username);

            if (rows > 0)
            {
                var counts = await RecalculateCounts(username);
                return Ok(new { totalCount = counts.totalCount, userCount = counts.userCount, message = "İşaret silindi." });
            }
            return Forbid();
        }
        catch (Exception ex) { return StatusCode(500, new { error = ex.Message }); }
    }
}