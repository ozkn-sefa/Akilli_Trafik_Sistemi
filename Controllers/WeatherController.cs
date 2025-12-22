using Microsoft.AspNetCore.Mvc;
using AkıllıTrafikSistemi.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Data;
using MySqlConnector; // MySQL Parametreleri için özellikle bu gerekli

public class WeatherController : Controller
{
    private readonly AppDbContext _context;

    public WeatherController(AppDbContext context)
    {
        _context = context;
    }

    [HttpPost]
    public async Task<IActionResult> SaveWeather([FromBody] WeatherModel model)
    {
        // 1. Validasyon Kontrolleri
        if (model?.Weather == null || model?.Location == null || model?.Route == null)
            return BadRequest(new { message = "Eksik veri gönderildi." });

        var username = HttpContext.Session.GetString("Username");
        if (string.IsNullOrEmpty(username))
            return Unauthorized(new { message = "Kullanıcı giriş yapmamış." });

        try
        {
            // 2. MySQL Parametrelerinin Hazırlanması
            // MySqlConnector kullanarak her parametreyi açıkça tanımlıyoruz.
            var parameters = new[]
            {
                new MySqlParameter("p_Username", username),
                new MySqlParameter("p_StartLat", model.Route.StartLat ?? (object)DBNull.Value),
                new MySqlParameter("p_StartLng", model.Route.StartLng ?? (object)DBNull.Value),
                new MySqlParameter("p_EndLat", model.Route.EndLat ?? (object)DBNull.Value),
                new MySqlParameter("p_EndLng", model.Route.EndLng ?? (object)DBNull.Value),
                new MySqlParameter("p_RouteJson", JsonSerializer.Serialize(model.Route.Steps)),
                new MySqlParameter("p_TotalPredictedDuration", model.Route.TotalPredictedDuration ?? (object)DBNull.Value),
                new MySqlParameter("p_TotalOSRMDuration", model.Route.TotalOSRMDuration ?? (object)DBNull.Value),
                new MySqlParameter("p_SavedAt", DateTime.Now),
                new MySqlParameter("p_Temperature", model.Weather.Temperature),
                new MySqlParameter("p_Windspeed", model.Weather.Windspeed),
                new MySqlParameter("p_Winddirection", model.Weather.Winddirection),
                new MySqlParameter("p_Time", model.Weather.Time ?? (object)DBNull.Value),
                new MySqlParameter("p_Description", model.Weather.Description ?? (object)DBNull.Value),
                new MySqlParameter("p_Country", model.Location.Country ?? (object)DBNull.Value),
                new MySqlParameter("p_City", model.Location.City ?? (object)DBNull.Value)
            };

            // 3. Stored Procedure'ün Çalıştırılması
            // MySQL'de SP'ler "CALL SP_Adi(?, ?, ...)" şeklinde çağrılır.
            // Parametre sayısı kadar soru işareti veya @param_adi eklenmelidir.

            var sql = "CALL sp_SaveRouteAndWeather(@p_Username, @p_StartLat, @p_StartLng, @p_EndLat, @p_EndLng, @p_RouteJson, @p_TotalPredictedDuration, @p_TotalOSRMDuration, @p_SavedAt, @p_Temperature, @p_Windspeed, @p_Winddirection, @p_Time, @p_Description, @p_Country, @p_City)";

            // SP içindeki son SELECT v_LastRouteId değerini yakalıyoruz.
            // EF Core 7/8+ sürümlerinde Database.SqlQueryRaw en temiz yoldur.
            var result = await _context.Database
                .SqlQueryRaw<long>(sql, parameters)
                .ToListAsync();

            var routeLogId = result.FirstOrDefault();

            return Ok(new
            {
                savedRouteId = routeLogId,
                message = "Rota ve hava durumu MySQL üzerinde EF Core ile başarıyla kaydedildi."
            });
        }
        catch (Exception ex)
        {
            // Hata loglama
            Console.WriteLine($"MySQL Kayıt Hatası: {ex.Message}");
            return StatusCode(500, new
            {
                message = "Veritabanı işlemi sırasında bir hata oluştu.",
                error = ex.Message
            });
        }
    }
}