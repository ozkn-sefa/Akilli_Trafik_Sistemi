using System;
using System.Collections.Generic;

namespace AkıllıTrafikSistemi.Models
{
    public class WeatherModel
    {
        public WeatherData? Weather { get; set; }
        public LocationData? Location { get; set; }
        public RouteData? Route { get; set; }
    }

    public class WeatherData
    {
        public double Temperature { get; set; }
        public double Windspeed { get; set; }
        public int Winddirection { get; set; }
        public string? Time { get; set; }
        public string? Description { get; set; } // Yeni Alan
    }

    public class LocationData
    {
        public string? Country { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? Suburb { get; set; }
        public string? Road { get; set; }
        public string? Postcode { get; set; }
    }

    public class RouteData
    {
        public double? StartLat { get; set; }
        public double? StartLng { get; set; }
        public double? EndLat { get; set; }
        public double? EndLng { get; set; }
        public List<RouteStep>? Steps { get; set; }
        public double? TotalPredictedDuration { get; set; }
        public double? TotalOSRMDuration { get; set; }
    }

    public class RouteStep
    {
        public string Name { get; set; } = "";
        public double Lat { get; set; }
        public double Lng { get; set; }
        public double PredictedAvgSpeed { get; set; }
        public double PredictedTravelTime { get; set; }
    }

    public class WeatherLog
    {
        public int Id { get; set; }
        public string Username { get; set; } = default!;
        public double Temperature { get; set; }
        public double Windspeed { get; set; }
        public int Winddirection { get; set; }
        public string? Time { get; set; }
        public string? Description { get; set; } // Log modeline de eklenebilir.
        public string? Country { get; set; }
        public string? City { get; set; }
        public double? StartLat { get; set; }
        public double? StartLng { get; set; }
        public double? EndLat { get; set; }
        public double? EndLng { get; set; }
        public string? RouteJson { get; set; }
        public double? TotalPredictedDuration { get; set; }
        public double? TotalOSRMDuration { get; set; }
        public DateTime SavedAt { get; set; } = DateTime.Now;
    }
}