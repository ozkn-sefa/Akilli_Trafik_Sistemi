using System;
using System.Collections.Generic;

namespace AkıllıTrafikSistemi.Models
{
    public class RouteHistoryEntry
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty; // Sorgu için kritik
        public DateTime SavedAt { get; set; }
        public string City { get; set; } = "Bilinmiyor";
        public double StartLat { get; set; }
        public double StartLng { get; set; }
        public double EndLat { get; set; }
        public double EndLng { get; set; }
        public double Temperature { get; set; }
        public double Windspeed { get; set; }
        public int Winddirection { get; set; }
        public string? Time { get; set; }
        public string? Country { get; set; }
        public string? Description { get; set; }
        public double TotalPredictedDuration { get; set; }
        public double TotalOSRMDuration { get; set; }
        public string? RouteJson { get; set; }
    }

    public class RouteHistoryViewModel
    {
        public string Username { get; set; } = "Kullanıcı";
        public List<RouteHistoryEntry> HistoryEntries { get; set; } = new List<RouteHistoryEntry>();
    }
}