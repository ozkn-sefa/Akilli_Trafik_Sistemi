using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace AkıllıTrafikSistemi.Models
{
    public class UserProfileViewModel
    {
        public int Id { get; set; }
        public string Username { get; set; } = "";

        // Veritabanındaki maskelenmiş e-posta (te***@gmail.com gibi)
        public string MaskedEmail { get; set; } = "";

        public DateTime CreatedAt { get; set; }
        public bool WantsEmailNotifications { get; set; }

        // Veritabanında karşılığı olmayan, sadece UI için kullanılan alan
        [NotMapped]
        public string StatusMessage { get; set; } = "Aktif Üye";
    }
}