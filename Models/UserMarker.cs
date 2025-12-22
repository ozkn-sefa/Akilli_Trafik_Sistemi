using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace AkıllıTrafikSistemi.Models
{
    public class UserMarker
    {
        public long Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public double? Lat { get; set; }
        public double? Lng { get; set; }
        public string RoadName { get; set; } = string.Empty;
        public string MarkerType { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }

        // Bu alanlar veritabanında sütun olarak yok, kod tarafında doluyor.
        [NotMapped]
        public int TotalMarkerCount { get; set; } = 0;

        [NotMapped]
        public int UserMarkerCount { get; set; } = 0;
    }
}