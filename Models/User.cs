using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema; // [NotMapped] için gerekli

namespace AkýllýTrafikSistemi.Models
{
    public class User
    {
        [Key] // Birincil anahtar olduðunu belirtir
        public int Id { get; set; }

        [Required(ErrorMessage = "Kullanýcý adý gereklidir")]
        [StringLength(50, MinimumLength = 3, ErrorMessage = "Kullanýcý adý 3-50 karakter arasýnda olmalýdýr")]
        public string Username { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email gereklidir")]
        [EmailAddress(ErrorMessage = "Geçerli bir email adresi giriniz")]
        public string Email { get; set; } = string.Empty;

        // EF Core bu alaný veritabanýna kaydetmeye çalýþmayacak ve hata vermeyecektir.
        [NotMapped]
        [Required(ErrorMessage = "Þifre gereklidir")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "Þifre en az 6 karakter olmalýdýr")]
        public string Password { get; set; } = string.Empty;

        // Veritabanýndaki sütun adý PasswordHash olduðu için burasý eþleþecek.
        public string PasswordHash { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        // Yeni Alan: E-posta bildirim isteði
        public bool WantsEmailNotifications { get; set; } = false;
    }

    public class LoginModel
    {
        [Required(ErrorMessage = "Email gereklidir")]
        [EmailAddress(ErrorMessage = "Geçerli bir email adresi giriniz")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Þifre gereklidir")]
        public string Password { get; set; } = string.Empty;
    }

    public class ChangePasswordModel
    {
        [Required(ErrorMessage = "Kullanýcý adý gereklidir")]
        public string Username { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email gereklidir")]
        [EmailAddress(ErrorMessage = "Geçerli bir email adresi giriniz")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Yeni þifre gereklidir")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "Þifre en az 6 karakter olmalýdýr")]
        public string NewPassword { get; set; } = string.Empty;

        [Required(ErrorMessage = "Þifre tekrarý gereklidir")]
        [Compare("NewPassword", ErrorMessage = "Þifreler eþleþmiyor")]
        public string ConfirmPassword { get; set; } = string.Empty;
    }
}